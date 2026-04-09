<script setup lang="ts">
import { computed, defineAsyncComponent, h, shallowRef, watch } from 'vue'
import { getLessonById } from '@/data/lessons'
import { useProgressStore } from '@/stores/progress'
import LessonLayout from '@/components/layout/LessonLayout.vue'
import type { Component } from 'vue'

const props = defineProps<{
  id: string
}>()

const progress = useProgressStore()

const LessonPlaceholder = {
  render() {
    return h('div', { class: 'placeholder-message' }, [
      h('span', { class: 'placeholder-icon' }, '🚧'),
      h('h2', null, 'Цей урок ще в розробці'),
      h('p', null, 'Скоро тут з\'явиться контент. Слідкуйте за оновленнями!'),
    ])
  },
}

const DemoPlaceholder = {
  render() {
    return h('div', { class: 'placeholder-message placeholder-message--small' }, [
      h('p', null, 'Демо буде тут'),
    ])
  },
}

const lessonComponent = shallowRef<Component | null>(null)
const demoComponent = shallowRef<Component | null>(null)

watch(
  () => props.id,
  (id) => {
    progress.setCurrentLesson(id)

    const info = getLessonById(id)
    if (!info) {
      lessonComponent.value = null
      demoComponent.value = null
      return
    }
    const week = info.week.number
    lessonComponent.value = defineAsyncComponent({
      loader: () => import(`../lessons/week${week}/Lesson${id}.vue`),
      errorComponent: LessonPlaceholder,
    })
    demoComponent.value = defineAsyncComponent({
      loader: () => import(`../lessons/week${week}/Lesson${id}Demo.vue`),
      errorComponent: DemoPlaceholder,
    })
  },
  { immediate: true },
)

const isCompleted = computed(() => progress.isCompleted(props.id))

function markComplete() {
  progress.completeLesson(props.id)
}
</script>

<template>
  <LessonLayout :lesson-id="id">
    <template #content="{ activeTab }">
      <component :is="lessonComponent" v-if="lessonComponent" :active-tab="activeTab" />

      <div class="lesson-footer">
        <button
          v-if="!isCompleted"
          class="complete-btn"
          @click="markComplete"
        >
          &#x2705; Позначити як пройдений
        </button>
        <div v-else class="completed-badge">
          &#x2705; Урок пройдений
        </div>
      </div>
    </template>

    <template #demo="{ activeTab }">
      <component :is="demoComponent" v-if="demoComponent" :active-tab="activeTab" />
    </template>
  </LessonLayout>
</template>

<style scoped>
.placeholder-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-muted);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-message h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.placeholder-message p {
  font-size: 14px;
}

.placeholder-message--small {
  padding: 24px 16px;
  font-size: 13px;
}

.lesson-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
}

.complete-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.complete-btn:hover {
  background: var(--primary-hover);
}

.completed-badge {
  background: var(--success-light);
  color: var(--success);
  border-radius: var(--radius-sm);
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
}
</style>
