<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QuizQuestion } from '@/types'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{
  questions: QuizQuestion[]
  lessonId: string
}>()

const progress = useProgressStore()

const currentIndex = ref(0)
const selectedAnswers = ref<(number | null)[]>(new Array(props.questions.length).fill(null))
const showResult = ref(false)

const currentQuestion = computed(() => props.questions[currentIndex.value])
const answered = computed(() => selectedAnswers.value[currentIndex.value] !== null)
const isCorrect = computed(
  () => selectedAnswers.value[currentIndex.value] === currentQuestion.value.correct,
)
const isLastQuestion = computed(() => currentIndex.value === props.questions.length - 1)

const score = computed(() =>
  selectedAnswers.value.reduce<number>((acc, answer, i) => {
    return acc + (answer === props.questions[i].correct ? 1 : 0)
  }, 0),
)

const scorePercent = computed(() => Math.round((score.value / props.questions.length) * 100))

const labels = ['A', 'B', 'C', 'D']

function selectOption(index: number) {
  if (answered.value) return
  selectedAnswers.value[currentIndex.value] = index
}

function next() {
  if (isLastQuestion.value) {
    showResult.value = true
    progress.setQuizScore(props.lessonId, scorePercent.value)
  } else {
    currentIndex.value++
  }
}

function retry() {
  currentIndex.value = 0
  selectedAnswers.value = new Array(props.questions.length).fill(null)
  showResult.value = false
}

function optionClass(optIndex: number): string {
  if (!answered.value) return 'option'
  if (optIndex === currentQuestion.value.correct) return 'option correct'
  if (optIndex === selectedAnswers.value[currentIndex.value] && !isCorrect.value)
    return 'option wrong'
  return 'option disabled'
}
</script>

<template>
  <div class="quiz">
    <!-- Results screen -->
    <div v-if="showResult" class="result-card">
      <div class="result-ring">
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" stroke-width="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            :stroke="scorePercent >= 60 ? 'var(--success)' : 'var(--accent)'"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="264"
            :stroke-dashoffset="264 - (264 * scorePercent) / 100"
            transform="rotate(-90 50 50)"
            class="progress-circle"
          />
        </svg>
        <span class="result-percent">{{ scorePercent }}%</span>
      </div>
      <p class="result-score">{{ score }}/{{ questions.length }}</p>
      <button class="retry-btn" @click="retry">Спробувати ще</button>
    </div>

    <!-- Question screen -->
    <div v-else class="question-card">
      <p class="question-counter">Питання {{ currentIndex + 1 }}/{{ questions.length }}</p>
      <h3 class="question-text">{{ currentQuestion.question }}</h3>

      <div class="options">
        <button
          v-for="(option, i) in currentQuestion.options"
          :key="i"
          :class="optionClass(i)"
          @click="selectOption(i)"
        >
          <span class="option-label">{{ labels[i] }}</span>
          <span class="option-text">{{ option }}</span>
          <span v-if="answered && i === currentQuestion.correct" class="icon check">&#x2713;</span>
          <span
            v-else-if="answered && i === selectedAnswers[currentIndex] && !isCorrect"
            class="icon cross"
            >&#x2717;</span
          >
        </button>
      </div>

      <div v-if="answered" class="explanation">
        <p>{{ currentQuestion.explanation }}</p>
      </div>

      <button v-if="answered" class="next-btn" @click="next">
        {{ isLastQuestion ? 'Результат' : 'Далі' }} &rarr;
      </button>
    </div>
  </div>
</template>

<style scoped>
.quiz {
  max-width: 640px;
}

.question-card,
.result-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.question-counter {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.question-text {
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-bottom: 20px;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.option:hover:not(.correct):not(.wrong):not(.disabled) {
  border-color: var(--primary);
  background: var(--primary-light);
}

.option-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--bg);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.option-text {
  flex: 1;
}

.option.correct {
  background: var(--success-light);
  border-color: var(--success);
  cursor: default;
}

.option.correct .option-label {
  background: var(--success);
  color: white;
}

.option.wrong {
  background: #fee2e2;
  border-color: #f87171;
  cursor: default;
}

.option.wrong .option-label {
  background: #f87171;
  color: white;
}

.option.disabled {
  opacity: 0.5;
  cursor: default;
}

.icon {
  font-weight: 700;
  font-size: 1rem;
}

.icon.check {
  color: var(--success);
}
.icon.cross {
  color: #f87171;
}

.explanation {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--primary-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.next-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.next-btn:hover {
  background: var(--primary-hover);
}

/* Result screen */
.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.result-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-percent {
  position: absolute;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-circle {
  transition: stroke-dashoffset 0.8s ease;
}

.result-score {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.retry-btn {
  padding: 10px 28px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: var(--primary-hover);
}
</style>
