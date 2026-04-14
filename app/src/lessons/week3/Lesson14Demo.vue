<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'usePermissions().canEdit(task)', laravel: "$user->can('update', $task)" },
  { vue: "if (!canEdit) router.push('/403')", laravel: "$this->authorize('update', $task) → 403" },
  { vue: 'task.userId === user.id', laravel: '$task->user_id === $user->id' },
  { vue: 'composables/usePermissions.ts', laravel: 'app/Policies/TaskPolicy.php' },
  { vue: "user.role === 'admin'", laravel: "Gate::define('access-admin', fn ...)" },
  { vue: 'navigation guard requiresAdmin', laravel: "->middleware('can:access-admin')" },
]

const curlOutput = [
  '# Bob (НЕ власник) намагається оновити задачу Alice',
  '$ curl -s -X PUT localhost:8000/api/tasks/1 \\',
  '    -H "Authorization: Bearer $TOKEN_BOB" \\',
  '    -H "Content-Type: application/json" \\',
  '    -d \'{"title":"Hacked by Bob"}\' | jq .',
  '',
  '# HTTP/1.1 403 Forbidden',
  '{ "message": "This action is unauthorized." }',
  '',
  '# Alice (власник) — той самий запит:',
  '$ curl -s -X PUT localhost:8000/api/tasks/1 \\',
  '    -H "Authorization: Bearer $TOKEN_ALICE" \\',
  '    -H "Content-Type: application/json" \\',
  '    -d \'{"title":"Updated by Alice"}\' | jq .data.title',
  '',
  '# HTTP/1.1 200 OK',
  '"Updated by Alice"',
  '',
  '# Адмін → before() пропускає його повз будь-яку перевірку:',
  '$ php artisan tinker --execute=\\',
  "    \"User::where('email','alice@example.com')->update(['is_admin'=>true]);\"",
  '',
  '$ curl -s localhost:8000/api/admin/stats \\',
  '    -H "Authorization: Bearer $TOKEN_ALICE" | jq .',
  '{ "total_users": 2, "total_tasks": 1, ... }',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Policy у дії: 403 → 200 → admin" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
