<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: '.filter(fn)', laravel: 'scopeByStatus()' },
  { vue: '.sort(fn)', laravel: 'orderBy()' },
  { vue: '.slice(0, 10)', laravel: 'paginate(10)' },
  { vue: 'if (query) {...}', laravel: "when($query, fn)" },
  { vue: 'allowedFields[]', laravel: 'whitelist array' },
  { vue: '.includes(str)', laravel: "where('title', 'like', \"%$q%\")" },
]

const curlOutput = [
  '$ curl "localhost:8000/api/tasks?status=pending&sort=deadline&order=asc&per_page=5"',
  '',
  '{',
  '  "data": [',
  '    { "id": 3, "title": "Setup Laravel", "status": "pending", "deadline": "2024-02-01" },',
  '    { "id": 4, "title": "Write API", "status": "pending", "deadline": "2024-02-15" },',
  '    { "id": 5, "title": "Deploy", "status": "pending", "deadline": "2024-03-01" }',
  '  ],',
  '  "links": { "first": "...?page=1", "next": "...?page=2" },',
  '  "meta": { "current_page": 1, "per_page": 5, "total": 3 }',
  '}',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Фільтрація + сортування + пагінація" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
