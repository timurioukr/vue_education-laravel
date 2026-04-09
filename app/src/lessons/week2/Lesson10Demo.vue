<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import FlowDiagram from '@/components/interactive/FlowDiagram.vue'
import type { FlowStep } from '@/types'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'throw new Error()', laravel: 'abort(404)' },
  { vue: 'try/catch', laravel: 'Exception Handler' },
  { vue: 'console.error()', laravel: 'Log::error()' },
  { vue: '.catch(err)', laravel: 'render()' },
  { vue: 'process.env.NODE_ENV', laravel: 'APP_DEBUG' },
  { vue: 'Error class', laravel: 'Custom Exception' },
]

const steps: FlowStep[] = [
  { icon: '📨', title: 'Request', subtitle: 'HTTP запит до API', color: '#7C5CFC' },
  { icon: '⚡', title: 'Controller', subtitle: 'Бізнес-логіка', color: '#059669' },
  { icon: '💥', title: 'Exception', subtitle: 'Щось пішло не так', color: '#EF4444' },
  { icon: '🔧', title: 'Handler', subtitle: 'render() → JSON', color: '#F472B6' },
  { icon: '📋', title: 'Response', subtitle: '4xx / 5xx + message', color: '#FBBF24' },
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
