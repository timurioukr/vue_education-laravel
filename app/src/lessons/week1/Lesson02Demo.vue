<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import FlowDiagram from '@/components/interactive/FlowDiagram.vue'
import type { FlowStep } from '@/types'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'class Component', laravel: 'class Model' },
  { vue: 'constructor()', laravel: '__construct()' },
  { vue: '#private', laravel: 'private $prop' },
  { vue: 'useComposable()', laravel: 'use Trait' },
  { vue: 'import { X } from', laravel: 'use App\\X' },
  { vue: 'as const / union', laravel: 'enum Status: string' },
  { vue: 'npm install', laravel: 'composer require' },
  { vue: 'node_modules/', laravel: 'vendor/' },
]

const classHierarchy: FlowStep[] = [
  {
    icon: '📋',
    title: 'interface Taskable',
    subtitle: 'Контракт: getId(), getTitle(), toArray()',
    color: '#E8F5E9',
  },
  {
    icon: '🏗️',
    title: 'abstract class BaseTask',
    subtitle: 'Спільна логіка + абстрактні методи',
    color: '#E3F2FD',
  },
  {
    icon: '📦',
    title: 'class Task extends BaseTask',
    subtitle: 'Повна реалізація з constructor promotion',
    color: '#F3E5F5',
  },
  {
    icon: '🧩',
    title: 'use HasTimestamps, HasDeadline',
    subtitle: 'Трейти додають createdAt, deadline, isOverdue()',
    color: '#FFF3E0',
  },
  {
    icon: '🏷️',
    title: 'enum TaskStatus: string',
    subtitle: 'Pending, InProgress, Done + label(), color()',
    color: '#FCE4EC',
  },
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <FlowDiagram :steps="classHierarchy" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
