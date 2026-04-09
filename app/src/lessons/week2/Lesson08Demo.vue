<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import FlowDiagram from '@/components/interactive/FlowDiagram.vue'
import type { FlowStep } from '@/types'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'Zod schema', laravel: 'Form Request' },
  { vue: 'z.string().min(3)', laravel: "'string|min:3'" },
  { vue: 'z.enum([...])', laravel: "'in:a,b,c'" },
  { vue: 'schema.parse()', laravel: '$request->validated()' },
  { vue: 'try/catch', laravel: '422 auto response' },
  { vue: '.optional()', laravel: "'nullable'" },
]

const steps: FlowStep[] = [
  { icon: '📨', title: 'HTTP Request', subtitle: 'POST /api/tasks', color: '#7C5CFC' },
  { icon: '🔐', title: 'authorize()', subtitle: 'Перевірка прав', color: '#F472B6' },
  { icon: '✅', title: 'rules()', subtitle: 'Валідація полів', color: '#059669' },
  { icon: '📋', title: 'Controller', subtitle: '$request->validated()', color: '#7C5CFC' },
  { icon: '💾', title: 'Database', subtitle: 'Task::create()', color: '#FBBF24' },
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <FlowDiagram :steps="steps" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
