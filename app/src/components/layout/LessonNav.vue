<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { weeks } from '@/data/lessons'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const progress = useProgressStore()

const searchQuery = ref('')

const filteredWeeks = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return weeks

  return weeks
    .map((week) => ({
      ...week,
      lessons: week.lessons.filter((lesson) =>
        lesson.titleUa.toLowerCase().includes(q),
      ),
    }))
    .filter((week) => week.lessons.length > 0)
})

const currentLessonId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

function lessonStatus(lessonId: string): 'completed' | 'active' | 'upcoming' {
  if (progress.isCompleted(lessonId)) return 'completed'
  if (currentLessonId.value === lessonId) return 'active'
  return 'upcoming'
}
</script>

<template>
  <aside class="lesson-nav">
    <div class="search-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Пошук уроку..."
      />
    </div>

    <div class="weeks-list">
      <div v-for="week in filteredWeeks" :key="week.number" class="week-section">
        <div class="week-header">{{ week.icon }} {{ week.titleUa }}</div>

        <router-link
          v-for="lesson in week.lessons"
          :key="lesson.id"
          :to="`/lesson/${lesson.id}`"
          class="lesson-item"
          :class="lessonStatus(lesson.id)"
        >
          <span class="lesson-marker">
            <template v-if="lessonStatus(lesson.id) === 'completed'">✓</template>
            <template v-else-if="lesson.isTest">⭐</template>
            <template v-else>{{ lesson.order }}</template>
          </span>
          <span class="lesson-title">{{ lesson.titleUa }}</span>
        </router-link>
      </div>
    </div>

    <div class="nav-footer">
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progress.progressPercent + '%' }"></div>
      </div>
      <span class="progress-label">{{ progress.completedCount }}/{{ progress.totalLessons }}</span>
    </div>
  </aside>
</template>

<style scoped>
.lesson-nav {
  width: var(--nav-width);
  min-width: var(--nav-width);
  height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-wrapper {
  padding: 16px 12px 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--primary);
}

.weeks-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.week-section {
  margin-bottom: 16px;
}

.week-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary);
  padding: 8px 4px 6px;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background 0.15s;
  cursor: pointer;
}

.lesson-item:hover {
  background: var(--bg);
}

.lesson-item.active {
  background: var(--primary-light);
  font-weight: 600;
  color: var(--text-primary);
}

.lesson-item.completed {
  color: var(--text-muted);
}

.lesson-marker {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.lesson-item.completed .lesson-marker {
  background: var(--success-light);
  color: var(--success);
}

.lesson-item.active .lesson-marker {
  background: var(--primary);
  color: #fff;
}

.lesson-item.upcoming .lesson-marker {
  background: var(--bg);
  color: var(--text-muted);
}

/* Test lessons with star icon */
.lesson-item .lesson-marker:has(+ .lesson-title) {
  font-size: 12px;
}

.lesson-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-footer {
  padding: 12px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-container {
  flex: 1;
  height: 6px;
  background: var(--bg);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
