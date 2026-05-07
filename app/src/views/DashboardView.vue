<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { weeks, getAllLessons } from '@/data/lessons'
import { useProgressStore } from '@/stores/progress'
import ProgressRing from '@/components/interactive/ProgressRing.vue'

const router = useRouter()
const progress = useProgressStore()

const allLessons = getAllLessons()

const weekColors = ['var(--primary)', 'var(--success)', 'var(--accent)', 'var(--warning)']
const weekBgColors = [
  'var(--primary-light)',
  'var(--success-light)',
  'var(--accent-light)',
  'var(--warning-light)',
]

const quizCount = computed(() => Object.keys(progress.quizScores).length)

const nextLesson = computed(() => {
  const uncompleted = allLessons.find((l) => !progress.isCompleted(l.id))
  return uncompleted ?? allLessons[0]
})

const nextLessonWeek = computed(() => {
  const lesson = nextLesson.value
  if (!lesson) return null
  return weeks.find((w) => w.number === lesson.week)
})

function goToWeek(weekNum: number) {
  const week = weeks.find((w) => w.number === weekNum)
  if (week && week.lessons.length > 0) {
    router.push(`/lesson/${week.lessons[0].id}`)
  }
}

function goToLesson(id: string) {
  router.push(`/lesson/${id}`)
}
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <h1 class="dashboard-title">Мій прогрес</h1>
      <p class="dashboard-subtitle">Відстежуй свій прогрес по тижнях</p>
    </header>

    <!-- Week cards -->
    <section class="week-cards">
      <div
        v-for="(week, i) in weeks"
        :key="week.number"
        class="week-card"
        @click="goToWeek(week.number)"
      >
        <div class="week-icon" :style="{ background: weekBgColors[i], color: weekColors[i] }">
          {{ week.icon }}
        </div>
        <div class="week-info">
          <span class="week-number">Тиждень {{ week.number }}</span>
          <span class="week-title">{{ week.titleUa }}</span>
        </div>
        <ProgressRing
          :value="progress.weekProgress(week.number)"
          :size="48"
          :color="weekColors[i]"
        />
      </div>
    </section>

    <!-- Stats row -->
    <section class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ progress.completedCount }} / {{ progress.totalLessons }}</span>
        <span class="stat-label">Пройдено уроків</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ quizCount }}</span>
        <span class="stat-label">Квізів пройдено</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ progress.progressPercent }}%</span>
        <span class="stat-label">Загальний прогрес</span>
      </div>
    </section>

    <!-- Continue learning -->
    <section v-if="nextLesson" class="continue-card" @click="goToLesson(nextLesson.id)">
      <div class="continue-info">
        <span class="continue-label">Продовжити навчання</span>
        <h3 class="continue-title">{{ nextLesson.icon }} {{ nextLesson.titleUa }}</h3>
        <p v-if="nextLessonWeek" class="continue-meta">
          Тиждень {{ nextLessonWeek.number }} · {{ nextLesson.duration }}
        </p>
      </div>
      <button class="continue-btn">Продовжити &rarr;</button>
    </section>

    <!-- Interactive diagrams -->
    <section class="cheatsheets-section">
      <h2 class="section-title">Інтерактивні діаграми</h2>
      <div class="cheatsheet-cards">
        <div class="cheatsheet-card" @click="router.push('/lifecycle')">
          <span class="cheatsheet-icon">&#9889;</span>
          <span class="cheatsheet-title">Request Lifecycle</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}

.dashboard-header {
  margin-bottom: 28px;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.dashboard-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Week cards */
.week-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.week-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.week-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.week-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.week-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.week-number {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.week-title {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.3;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
}

/* Continue */
.continue-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.continue-card:hover {
  box-shadow: var(--shadow-md);
}

.continue-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.continue-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 4px;
}

.continue-meta {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.continue-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.continue-btn:hover {
  background: var(--primary-hover);
}

/* Cheatsheets */
.cheatsheets-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.cheatsheet-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cheatsheet-card {
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.cheatsheet-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.cheatsheet-icon {
  font-size: 20px;
}

.cheatsheet-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}
</style>
