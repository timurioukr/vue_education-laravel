<script setup lang="ts">
import FlowDiagram from '@/components/interactive/FlowDiagram.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import type { FlowStep } from '@/types'

const flowSteps: FlowStep[] = [
  {
    icon: '🌐',
    title: 'HTTP Request',
    subtitle: 'GET /api/tasks',
    color: '#3B82F6',
  },
  {
    icon: '🗺️',
    title: 'routes/api.php',
    subtitle: 'Знаходить відповідний маршрут',
    color: '#8B5CF6',
  },
  {
    icon: '🎮',
    title: 'Controller@method',
    subtitle: 'TaskController@index обробляє запит',
    color: '#F59E0B',
  },
  {
    icon: '📦',
    title: 'JSON Response',
    subtitle: 'Повертає дані клієнту',
    color: '#10B981',
  },
]

const routeListLines = [
  '$ php artisan route:list',
  '',
  '  GET|HEAD   api/tasks .............. tasks.index › TaskController@index',
  '  POST       api/tasks .............. tasks.store › TaskController@store',
  '  GET|HEAD   api/tasks/{task} ....... tasks.show › TaskController@show',
  '  PUT|PATCH  api/tasks/{task} ....... tasks.update › TaskController@update',
  '  DELETE     api/tasks/{task} ....... tasks.destroy › TaskController@destroy',
  '  GET|HEAD   api/categories ......... categories.index › CategoryController@index',
  '  POST       api/categories ......... categories.store › CategoryController@store',
  '  GET|HEAD   api/categories/{cat} ... categories.show › CategoryController@show',
  '  PUT|PATCH  api/categories/{cat} ... categories.update › CategoryController@update',
  '  DELETE     api/categories/{cat} ... categories.destroy › CategoryController@destroy',
]

const memoryItems = [
  { vue: ':id', laravel: '{id}' },
  { vue: 'children[]', laravel: 'prefix()->group()' },
  { vue: 'router.push()', laravel: 'redirect()' },
]
</script>

<template>
  <div class="demo-blocks">
    <h3 class="demo-title">Як працює роутинг в Laravel</h3>
    <FlowDiagram :steps="flowSteps" />

    <h3 class="demo-title">Список маршрутів</h3>
    <TerminalOutput :lines="routeListLines" title="php artisan route:list" />

    <h3 class="demo-title">Порівняння синтаксису</h3>
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
