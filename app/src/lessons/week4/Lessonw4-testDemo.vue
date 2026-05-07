<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { getAllLessons } from '@/data/lessons'

defineProps<{
  activeTab: string
}>()

const progress = useProgressStore()

const allLessons = getAllLessons()
const regularLessons = allLessons.filter((l) => !l.isTest)
const weeklyTests = allLessons.filter((l) => l.isTest && l.id !== 'w4-test')

const completedLessons = computed(
  () => regularLessons.filter((l) => progress.isCompleted(l.id)).length,
)
const lessonsTotal = regularLessons.length

const completedTests = computed(() => weeklyTests.filter((l) => progress.isCompleted(l.id)).length)

const currentScore = computed(() => progress.getQuizScore('w4-test'))

const totalProgressPercent = computed(() =>
  Math.round(
    ((completedLessons.value + completedTests.value) / (lessonsTotal + weeklyTests.length)) * 100,
  ),
)

const weekProgress = computed(() =>
  [1, 2, 3, 4].map((week) => {
    const weekLessons = regularLessons.filter((l) => l.week === week)
    const done = weekLessons.filter((l) => progress.isCompleted(l.id)).length
    return {
      week,
      done,
      total: weekLessons.length,
      percent: Math.round((done / weekLessons.length) * 100),
    }
  }),
)
</script>

<template>
  <div class="demo-content">
    <div class="hero">
      <div class="hero-icon">🏆</div>
      <div class="hero-title">Фінальний тест</div>
      <div class="hero-subtitle">Підсумок 4 тижнів і 24 уроків</div>
    </div>

    <div class="overall-progress">
      <div class="progress-label">
        <span>Прогрес курсу</span>
        <span class="progress-value">{{ totalProgressPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: totalProgressPercent + '%' }"></div>
      </div>
      <div class="progress-meta">
        {{ completedLessons }}/{{ lessonsTotal }} уроків · {{ completedTests }}/{{
          weeklyTests.length
        }}
        тижневих тестів
      </div>
    </div>

    <div class="weeks">
      <div v-for="w in weekProgress" :key="w.week" class="week-row">
        <div class="week-name">Тиждень {{ w.week }}</div>
        <div class="week-bar">
          <div class="week-fill" :style="{ width: w.percent + '%' }"></div>
        </div>
        <div class="week-stat">{{ w.done }}/{{ w.total }}</div>
      </div>
    </div>

    <div v-if="currentScore !== undefined" class="quiz-result">
      <div class="quiz-result-label">Ваш результат фінального квізу</div>
      <div class="quiz-result-value" :class="currentScore >= 80 ? 'pass' : 'fail'">
        {{ currentScore }}%
      </div>
      <div class="quiz-result-status">
        {{ currentScore >= 80 ? '✅ Тест пройдено!' : '🔄 Спробуйте ще раз — потрібно 80%' }}
      </div>
    </div>
    <div v-else class="quiz-hint">
      Перейдіть на вкладку <strong>Квіз</strong> і пройдіть 25 питань — результат зʼявиться тут.
    </div>
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 16px 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  border-radius: var(--radius-md, 12px);
  text-align: center;
}

.hero-icon {
  font-size: 40px;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: #78350f;
}

.hero-subtitle {
  font-size: 13px;
  color: #92400e;
}

.overall-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--bg-elevated, #f7f8fa);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-value {
  color: var(--primary);
  font-size: 16px;
}

.progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success, #10b981));
  border-radius: 4px;
  transition: width 0.4s ease;
}

.progress-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.weeks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.week-row {
  display: grid;
  grid-template-columns: 90px 1fr 40px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.week-name {
  color: var(--text-secondary);
  font-weight: 500;
}

.week-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.week-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.week-stat {
  text-align: right;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.quiz-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: var(--bg-elevated, #f7f8fa);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.quiz-result-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quiz-result-value {
  font-size: 36px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.quiz-result-value.pass {
  color: var(--success, #10b981);
}

.quiz-result-value.fail {
  color: var(--warning, #f59e0b);
}

.quiz-result-status {
  font-size: 13px;
  color: var(--text-secondary);
}

.quiz-hint {
  padding: 14px;
  background: var(--bg-elevated, #f7f8fa);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}
</style>
