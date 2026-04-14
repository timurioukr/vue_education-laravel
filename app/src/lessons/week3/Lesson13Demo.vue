<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: "localStorage.setItem('token', t)", laravel: '$user->createToken(...)->plainTextToken' },
  { vue: 'authStore.logout()', laravel: '$request->user()->currentAccessToken()->delete()' },
  { vue: 'axios.defaults.headers.Authorization', laravel: "'Authorization: Bearer ' . $token" },
  { vue: 'router.beforeEach(authGuard)', laravel: "Route::middleware('auth:sanctum')" },
  { vue: 'authStore.user', laravel: '$request->user()' },
  { vue: 'tasks.filter(t => t.userId === me)', laravel: '$request->user()->tasks()->get()' },
]

const curlOutput = [
  '$ curl -s -X POST localhost:8000/api/login \\',
  '    -H "Content-Type: application/json" \\',
  '    -H "Accept: application/json" \\',
  '    -d \'{"email":"john@example.com","password":"password123"}\' | jq .',
  '',
  '{',
  '  "user": { "id": 1, "name": "John Doe", "email": "john@example.com" },',
  '  "token": "1|abc123def456ghi789jkl012mno345pqr678stu901"',
  '}',
  '',
  '$ TOKEN="1|abc123def456ghi789jkl012mno345pqr678stu901"',
  '',
  '$ curl -s localhost:8000/api/me \\',
  '    -H "Accept: application/json" \\',
  '    -H "Authorization: Bearer $TOKEN" | jq .',
  '',
  '{',
  '  "id": 1,',
  '  "name": "John Doe",',
  '  "email": "john@example.com",',
  '  "email_verified_at": null',
  '}',
  '',
  '# Без токена → 401:',
  '$ curl -s localhost:8000/api/me -H "Accept: application/json" | jq .',
  '{ "message": "Unauthenticated." }',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Sanctum: login → Bearer → /api/me" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
