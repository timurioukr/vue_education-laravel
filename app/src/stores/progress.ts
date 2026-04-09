import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getAllLessons, weeks } from '@/data/lessons'

const STORAGE_KEY = 'laravel-course-progress'

interface PersistedState {
  completedLessons: string[]
  quizScores: Record<string, number>
  currentLesson: string
  completedTabs: Record<string, string[]>
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

export const useProgressStore = defineStore('progress', () => {
  const saved = loadFromStorage()

  const completedLessons = ref<string[]>(saved?.completedLessons ?? [])
  const quizScores = ref<Record<string, number>>(saved?.quizScores ?? {})
  const currentLesson = ref<string>(saved?.currentLesson ?? '01')
  const completedTabs = ref<Record<string, string[]>>(saved?.completedTabs ?? {})

  // Computed
  const totalLessons = computed(() => getAllLessons().length)
  const completedCount = computed(() => completedLessons.value.length)
  const progressPercent = computed(() =>
    totalLessons.value === 0 ? 0 : Math.round((completedCount.value / totalLessons.value) * 100),
  )

  function weekProgress(weekNum: number): number {
    const week = weeks.find((w) => w.number === weekNum)
    if (!week) return 0
    const total = week.lessons.length
    if (total === 0) return 0
    const done = week.lessons.filter((l) => completedLessons.value.includes(l.id)).length
    return Math.round((done / total) * 100)
  }

  // Actions
  function isCompleted(lessonId: string): boolean {
    return completedLessons.value.includes(lessonId)
  }

  function completeLesson(lessonId: string): void {
    if (!completedLessons.value.includes(lessonId)) {
      completedLessons.value.push(lessonId)
    }
  }

  function setQuizScore(lessonId: string, score: number): void {
    quizScores.value[lessonId] = score
  }

  function getQuizScore(lessonId: string): number | undefined {
    return quizScores.value[lessonId]
  }

  function setCurrentLesson(lessonId: string): void {
    currentLesson.value = lessonId
  }

  function completeTab(lessonId: string, tab: string): void {
    if (!completedTabs.value[lessonId]) {
      completedTabs.value[lessonId] = []
    }
    if (!completedTabs.value[lessonId].includes(tab)) {
      completedTabs.value[lessonId].push(tab)
    }
  }

  function isTabCompleted(lessonId: string, tab: string): boolean {
    return completedTabs.value[lessonId]?.includes(tab) ?? false
  }

  function resetProgress(): void {
    completedLessons.value = []
    quizScores.value = {}
    currentLesson.value = '01'
    completedTabs.value = {}
  }

  // Persist to localStorage on any change
  watch(
    () => ({
      completedLessons: completedLessons.value,
      quizScores: quizScores.value,
      currentLesson: currentLesson.value,
      completedTabs: completedTabs.value,
    }),
    (state) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    },
    { deep: true },
  )

  return {
    // State
    completedLessons,
    quizScores,
    currentLesson,
    completedTabs,
    // Computed
    completedCount,
    totalLessons,
    progressPercent,
    // Methods
    weekProgress,
    isCompleted,
    completeLesson,
    setQuizScore,
    getQuizScore,
    setCurrentLesson,
    completeTab,
    isTabCompleted,
    resetProgress,
  }
})
