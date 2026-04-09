<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import FlowDiagram from '@/components/interactive/FlowDiagram.vue'
import type { FlowStep } from '@/types'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'array.find()', laravel: 'belongsTo()' },
  { vue: 'array.filter()', laravel: 'hasMany()' },
  { vue: 'join table', laravel: 'belongsToMany()' },
  { vue: 'Promise.all()', laravel: "with('relation')" },
  { vue: '.length', laravel: 'withCount()' },
  { vue: 'arr.some(fn)', laravel: 'whereHas()' },
]

const steps: FlowStep[] = [
  { icon: '📋', title: 'Task', subtitle: 'belongsTo Category, User', color: '#7C5CFC' },
  { icon: '📁', title: 'Category', subtitle: 'hasMany Tasks', color: '#059669' },
  { icon: '👤', title: 'User', subtitle: 'hasMany Tasks', color: '#F472B6' },
  { icon: '🏷️', title: 'Tag', subtitle: 'belongsToMany Tasks', color: '#FBBF24' },
  { icon: '🔗', title: 'task_tag', subtitle: 'pivot table', color: '#9CA3AF' },
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
