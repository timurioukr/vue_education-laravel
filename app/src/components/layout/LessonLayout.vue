<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getLessonById, getAdjacentLessons } from '@/data/lessons'

const props = defineProps<{
  lessonId: string
}>()

const emit = defineEmits<{
  'update:tab': [tab: string]
}>()

const router = useRouter()

const activeTab = ref('theory')

const tabs = [
  { key: 'theory', icon: '📖', label: 'Теорія' },
  { key: 'practice', icon: '💻', label: 'Практика' },
  { key: 'quiz', icon: '🧪', label: 'Квіз' },
  { key: 'tasks', icon: '📝', label: 'Завдання' },
]

const lessonInfo = computed(() => getLessonById(props.lessonId))
const adjacent = computed(() => getAdjacentLessons(props.lessonId))

function setTab(key: string) {
  activeTab.value = key
  emit('update:tab', key)
}

function goTo(id: string | null) {
  if (id) {
    router.push(`/lesson/${id}`)
  }
}

watch(() => props.lessonId, () => {
  activeTab.value = 'theory'
})

defineExpose({ activeTab })
</script>

<template>
  <div class="lesson-layout" v-if="lessonInfo">
    <!-- Header bar -->
    <header class="lesson-header">
      <div class="header-left">
        <h1 class="lesson-title">{{ lessonInfo.lesson.titleUa }}</h1>
        <p class="lesson-subtitle">
          {{ lessonInfo.lesson.icon }} Урок {{ lessonInfo.lesson.order }}
          · Тиждень {{ lessonInfo.week.number }}
          · {{ lessonInfo.lesson.duration }}
        </p>
      </div>
      <div class="header-right">
        <button
          class="nav-btn nav-btn--prev"
          :disabled="!adjacent.prev"
          @click="goTo(adjacent.prev)"
        >
          ← Попередній
        </button>
        <button
          class="nav-btn nav-btn--next"
          :disabled="!adjacent.next"
          @click="goTo(adjacent.next)"
        >
          Наступний →
        </button>
      </div>
    </header>

    <!-- Tabs bar -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="setTab(tab.key)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Content area -->
    <div class="lesson-body">
      <div class="lesson-content">
        <slot name="content" :active-tab="activeTab" />
      </div>
      <div class="lesson-demo">
        <slot name="demo" :active-tab="activeTab" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lesson-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.lesson-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.header-left {
  min-width: 0;
}

.lesson-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.lesson-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.header-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.nav-btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  white-space: nowrap;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn--prev {
  background: var(--bg);
  color: var(--text-secondary);
}

.nav-btn--prev:hover:not(:disabled) {
  background: var(--border);
}

.nav-btn--next {
  background: var(--primary);
  color: #fff;
}

.nav-btn--next:hover:not(:disabled) {
  background: var(--primary-hover);
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
}

.tab-item:hover {
  color: var(--text-secondary);
}

.tab-item.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

.tab-icon {
  font-size: 15px;
  line-height: 1;
}

.tab-label {
  line-height: 1;
}

/* Body */
.lesson-body {
  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--bg);
}

.lesson-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-width: 0;
}

.lesson-demo {
  width: var(--demo-width);
  min-width: var(--demo-width);
  overflow-y: auto;
  padding: 24px 16px;
  border-left: 1px solid var(--border);
  background: var(--surface);
}
</style>
