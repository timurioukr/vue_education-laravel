<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'worker.postMessage(data)', laravel: 'MyJob::dispatch($data)' },
  { vue: 'worker.onmessage = fn', laravel: 'php artisan queue:work' },
  { vue: 'await doWork() (блокує)', laravel: 'QUEUE_CONNECTION=sync' },
  { vue: 'setTimeout(fn, delay)', laravel: '::dispatch($u)->delay(now()->addMinutes(10))' },
  { vue: 'setInterval(fn, 5*60*1000)', laravel: "Schedule::command('..')->everyFiveMinutes()" },
  { vue: '"scripts" у package.json', laravel: 'php artisan make:command → $signature' },
]

const curlOutput = [
  '# 1) Dispatch Job через API → 202 Accepted',
  '$ curl -X POST localhost:8000/api/reports/generate \\',
  '    -H "Authorization: Bearer $TOKEN" | jq .',
  '',
  '{ "message": "Report generation queued.", "status": 202 }',
  '',
  '# 2) Jobs у черзі (tinker)',
  '>>> DB::table("jobs")->count()',
  '=> 1',
  '',
  '# 3) Worker підбирає і виконує',
  '$ php artisan queue:work --once',
  '[2026-04-14 09:00:01] Processing: App\\Jobs\\GenerateTaskReport',
  '[2026-04-14 09:00:02] Processed:  App\\Jobs\\GenerateTaskReport',
  '',
  '# 4) Розклад',
  '$ php artisan schedule:list',
  '+---------------------------+-------------+-------------------+',
  '| Command                   | Interval    | Next Due          |',
  '+---------------------------+-------------+-------------------+',
  '| app:send-overdue-rem...   | Daily 09:00 | 2026-04-15 09:00  |',
  '| CleanupCompletedTasks     | Weekly      | 2026-04-20 00:00  |',
  '+---------------------------+-------------+-------------------+',
  '',
  '# 5) Artisan-команда з --dry-run',
  '$ php artisan app:send-overdue-reminders --dry-run',
  'DRY RUN: Would process 3 users:',
  '  Alice: 4 overdue tasks',
  '  Bob: 1 overdue tasks',
  '  Charlie: 0 overdue tasks',
  '',
  '$ php artisan app:send-overdue-reminders',
  '███████████████████████████ 3/3',
  'Dispatched overdue reminders for 3 users.',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Queue: dispatch → worker → schedule" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
