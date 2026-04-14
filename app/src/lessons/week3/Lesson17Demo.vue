<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: "emit('task:completed', task)", laravel: 'TaskCompleted::dispatch($task)' },
  { vue: "@task:completed='handle'", laravel: 'Listener::handle(TaskCompleted $event)' },
  { vue: 'mitt — глобальний event-bus', laravel: 'Event::listen(Class, fn ($e) => ...)' },
  { vue: 'Pinia $subscribe(mutation)', laravel: '#[ObservedBy(TaskObserver::class)]' },
  { vue: 'watch(task, fn) — зміна стану', laravel: "Observer::updated → wasChanged('status')" },
  { vue: 'notifications.value у Pinia', laravel: '$user->notifications / unreadNotifications' },
]

const curlOutput = [
  '# 1) Завершуємо задачу → Observer::updated → TaskCompleted → Listener → notify',
  '$ curl -X PUT localhost:8000/api/tasks/1 \\',
  '    -H "Authorization: Bearer $TOKEN" \\',
  '    -H "Content-Type: application/json" \\',
  '    -d \'{"status":"completed"}\'',
  '',
  '# 2) Лічильник для UI-badge',
  '$ curl localhost:8000/api/notifications/unread-count \\',
  '    -H "Authorization: Bearer $TOKEN" | jq .',
  '{ "unread_count": 1 }',
  '',
  '# 3) Список з пагінацією',
  '$ curl localhost:8000/api/notifications \\',
  '    -H "Authorization: Bearer $TOKEN" | jq .',
  '',
  '{',
  '  "data": [{',
  '    "id":      "9c4b2…uuid",',
  '    "type":    "TaskCompletedNotification",',
  '    "data": {',
  '      "task_id":      1,',
  '      "task_title":   "Learn Laravel",',
  '      "message":      "Task \\"Learn Laravel\\" has been completed.",',
  '      "completed_at": "2026-04-13T18:42:11Z"',
  '    },',
  '    "read_at":    null,',
  '    "created_at": "2026-04-13T18:42:11Z"',
  '  }],',
  '  "meta": { "unread_count": 1, "current_page": 1, ... }',
  '}',
  '',
  '# 4) Позначити як прочитане',
  '$ curl -X PATCH localhost:8000/api/notifications/9c4b2…uuid/read \\',
  '    -H "Authorization: Bearer $TOKEN" | jq .',
  '{ "id": "9c4b2…uuid", "read_at": "2026-04-13T18:43:00Z" }',
  '',
  '# 5) Permission-check спрацьовує ДО Observer:',
  '#    якщо update заборонив Policy → Observer::updated не викликається',
  '#    → ніяких сповіщень. Щасливий шлях — лише через дозволений save().',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Events → Listener → Notification → API" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
