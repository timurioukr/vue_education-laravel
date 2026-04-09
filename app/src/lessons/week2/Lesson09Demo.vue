<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import FlowDiagram from '@/components/interactive/FlowDiagram.vue'
import type { FlowStep } from '@/types'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'computed()', laravel: 'toArray()' },
  { vue: 'v-if="loaded"', laravel: 'whenLoaded()' },
  { vue: 'v-if="condition"', laravel: 'when()' },
  { vue: 'Array.map()', laravel: '::collection()' },
  { vue: 'ref([])', laravel: 'paginate()' },
  { vue: 'JSON.stringify()', laravel: 'JsonResource' },
]

const steps: FlowStep[] = [
  { icon: '💾', title: 'Eloquent Model', subtitle: 'Всі поля з БД', color: '#9CA3AF' },
  { icon: '🔄', title: 'Resource toArray()', subtitle: 'Трансформація полів', color: '#7C5CFC' },
  { icon: '📦', title: 'JSON Response', subtitle: 'Тільки потрібні поля', color: '#059669' },
  { icon: '💻', title: 'Frontend', subtitle: 'Чистий API контракт', color: '#FBBF24' },
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
