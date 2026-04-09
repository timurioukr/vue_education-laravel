<script setup lang="ts">
import FlowDiagram from '@/components/interactive/FlowDiagram.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import type { FlowStep } from '@/types'

const flowSteps: FlowStep[] = [
  {
    icon: '🖊️',
    title: 'PHP Code',
    subtitle: 'Task::where("status", "pending")->get()',
    color: '#8B5CF6',
  },
  {
    icon: '🔮',
    title: 'Eloquent ORM',
    subtitle: 'Перекладає методи в SQL-запит',
    color: '#3B82F6',
  },
  {
    icon: '🔧',
    title: 'Query Builder',
    subtitle: 'Будує оптимізований SQL',
    color: '#6366F1',
  },
  {
    icon: '💾',
    title: 'SQL Query',
    subtitle: 'SELECT * FROM tasks WHERE status = "pending"',
    color: '#F59E0B',
  },
  {
    icon: '🗄️',
    title: 'Database (SQLite)',
    subtitle: 'Виконує запит та повертає рядки',
    color: '#EF4444',
  },
  {
    icon: '📚',
    title: 'Collection',
    subtitle: 'Масив Eloquent-моделей з методами',
    color: '#10B981',
  },
  {
    icon: '📦',
    title: 'JSON Response',
    subtitle: 'Автоматична серіалізація для API',
    color: '#06B6D4',
  },
]

const tinkerLines = [
  '$ php artisan tinker',
  '',
  '>>> Task::all()->count()',
  '=> 5',
  '',
  '>>> Task::where(\'status\', \'pending\')->pluck(\'title\')',
  '=> ["Build REST API", "Buy groceries", "Write unit tests"]',
  '',
  '>>> Task::create([\'title\' => \'New task\', \'user_id\' => 1])',
  '=> App\\Models\\Task {id: 6, title: "New task", status: "pending", ...}',
  '',
  '>>> Task::find(6)->update([\'status\' => \'in_progress\'])',
  '=> true',
  '',
  '>>> Task::find(6)->delete()  // soft delete',
  '=> true',
  '',
  '>>> Task::withTrashed()->find(6)->restore()',
  '=> true',
]

const memoryItems = [
  { vue: "fetch('/api/tasks')", laravel: 'Task::all()' },
  { vue: '.filter()', laravel: "->where()->get()" },
  { vue: "store.$reset()", laravel: 'Task::create([...])' },
  { vue: 'defineProps<{}>()', laravel: '$fillable = [...]' },
  { vue: 'DevTools Console', laravel: 'php artisan tinker' },
]
</script>

<template>
  <div class="demo-blocks">
    <h3 class="demo-title">Як працює Eloquent</h3>
    <FlowDiagram :steps="flowSteps" />

    <h3 class="demo-title">Сесія в Tinker</h3>
    <TerminalOutput :lines="tinkerLines" title="php artisan tinker" />

    <h3 class="demo-title">Порівняння Vue та Eloquent</h3>
    <MemoryCard :items="memoryItems" />
  </div>
</template>

<style scoped>
.demo-blocks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
