<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'computed(() => filter(list))', laravel: "Cache::remember('key', ttl, fn)" },
  { vue: 'v-for + fetch per item', laravel: 'N+1: $task->category (lazy load)' },
  { vue: 'single fetch with include', laravel: "Task::with('category')->get()" },
  { vue: 'queryClient.invalidateQueries()', laravel: "Cache::forget('key')" },
  { vue: 'virtual scroll (stream)', laravel: 'cursor() / lazy()' },
  { vue: 'GraphQL field selection', laravel: "select('id', 'title', 'status')" },
]

const curlOutput = [
  '$ php artisan debugbar:check routes/api.php',
  '',
  '  GET /api/tasks',
  '    Before optimization:',
  '      Queries: 101  (1 + 100 lazy loads)',
  '      Time:    245ms',
  '      Memory:  18.4 MB',
  '',
  '    After optimization (with + select + cache):',
  '      Queries: 2    (tasks + categories)',
  '      Time:    12ms',
  '      Memory:  4.2 MB',
  '',
  '    With Cache::remember (second request):',
  '      Queries: 0',
  '      Time:    0.3ms',
  '      Memory:  2.1 MB',
  '',
  '$ php artisan model:show Task --with-indexes',
  '',
  '  Task (tasks)',
  '    id             bigint unsigned  PRIMARY',
  '    title          varchar(255)',
  '    status         varchar(20)      INDEX',
  '    user_id        bigint unsigned  INDEX (FK)',
  '    category_id    bigint unsigned  INDEX (FK)',
  '    deadline       date             INDEX',
  '    created_at     timestamp',
  '',
  '  Indexes:',
  '    tasks_status_index          (status)',
  '    tasks_user_id_status_index  (user_id, status)  COMPOSITE',
  '    tasks_deadline_index        (deadline)',
  '',
  '$ php artisan tinker',
  "  >>> Task::where('status','pending')->toRawSql()",
  '  => "select * from tasks where status = \'pending\'"',
  '',
  '  >>> DB::enableQueryLog();',
  "  >>> Task::with(['category','tags'])->get();",
  '  >>> count(DB::getQueryLog())',
  '  => 3   // tasks + categories + tags (eager!)',
  '',
  '  Performance improvement: 101 queries -> 2 queries (-98%)',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput
      :lines="curlOutput"
      title="Performance: N+1 -> eager loading -> cache (query count before/after)"
    />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
