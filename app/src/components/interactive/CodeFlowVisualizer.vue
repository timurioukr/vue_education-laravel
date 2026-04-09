<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CodeFlowStep } from '@/types'

const props = defineProps<{
  code: string
  language: 'php' | 'javascript'
  steps: CodeFlowStep[]
  title?: string
}>()

const currentStepIndex = ref(-1)
const isPlaying = ref(false)
let playInterval: ReturnType<typeof setInterval> | null = null

const codeLines = computed(() => props.code.split('\n'))

const currentStep = computed(() => {
  if (currentStepIndex.value < 0) return null
  return props.steps[currentStepIndex.value] ?? null
})

const accumulatedOutput = computed(() => {
  if (currentStepIndex.value < 0) return ''
  return props.steps
    .slice(0, currentStepIndex.value + 1)
    .filter((s) => s.output)
    .map((s) => s.output)
    .join('')
})

function nextStep() {
  if (currentStepIndex.value < props.steps.length - 1) {
    currentStepIndex.value++
  } else {
    stopAutoPlay()
  }
}

function prevStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

function resetSteps() {
  stopAutoPlay()
  currentStepIndex.value = -1
}

function toggleAutoPlay() {
  if (isPlaying.value) {
    stopAutoPlay()
  } else {
    isPlaying.value = true
    if (currentStepIndex.value < 0) {
      currentStepIndex.value = 0
    }
    playInterval = setInterval(() => {
      if (currentStepIndex.value < props.steps.length - 1) {
        currentStepIndex.value++
      } else {
        stopAutoPlay()
      }
    }, 1500)
  }
}

function stopAutoPlay() {
  isPlaying.value = false
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}
</script>

<template>
  <div class="flow-viz">
    <div v-if="title" class="flow-title">{{ title }}</div>

    <div class="flow-body">
      <div class="code-panel">
        <div class="code-panel-header">Код</div>
        <div class="code-lines">
          <div
            v-for="(line, index) in codeLines"
            :key="index"
            class="code-line"
            :class="{ 'code-line-active': currentStep?.line === index + 1 }"
          >
            <span class="line-number">{{ index + 1 }}</span>
            <span class="line-content">{{ line }}</span>
          </div>
        </div>
      </div>

      <div class="state-panel">
        <div class="vars-section">
          <div class="panel-header">Змінні</div>
          <div
            v-if="!currentStep || Object.keys(currentStep.variables).length === 0"
            class="empty-state"
          >
            Натисніть "Крок →" для початку
          </div>
          <div v-else class="vars-list">
            <div v-for="(value, name) in currentStep.variables" :key="name" class="var-row">
              <span class="var-name">{{ name }}</span>
              <span class="var-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div v-if="currentStep?.note" class="note-section">
          <p>{{ currentStep.note }}</p>
        </div>

        <div class="output-section">
          <div class="panel-header">Вивід</div>
          <pre class="flow-output">{{ accumulatedOutput || '(порожньо)' }}</pre>
        </div>
      </div>
    </div>

    <div class="flow-controls">
      <button class="ctrl-btn" @click="resetSteps">⟲</button>
      <button class="ctrl-btn" :disabled="currentStepIndex <= 0" @click="prevStep">←</button>
      <button class="ctrl-btn ctrl-btn-primary" @click="toggleAutoPlay">
        {{ isPlaying ? '⏸' : '▶' }}
      </button>
      <button class="ctrl-btn" :disabled="currentStepIndex >= steps.length - 1" @click="nextStep">
        →
      </button>
      <span v-if="currentStepIndex >= 0" class="step-counter">
        {{ currentStepIndex + 1 }} / {{ steps.length }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.flow-viz {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.flow-title {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.flow-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 280px;
}

.code-panel {
  border-right: 1px solid var(--border);
  overflow: auto;
}

.code-panel-header,
.panel-header {
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.code-lines {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  line-height: 1.7;
}

.code-line {
  display: flex;
  padding: 0 12px;
  transition: background 0.2s;
}

.code-line-active {
  background: rgba(124, 92, 252, 0.12);
  border-left: 3px solid var(--primary);
  padding-left: 9px;
}

.line-number {
  color: var(--text-muted);
  min-width: 28px;
  text-align: right;
  margin-right: 12px;
  user-select: none;
}

.line-content {
  white-space: pre;
}

.state-panel {
  display: flex;
  flex-direction: column;
}

.vars-section {
  flex: 1;
}

.empty-state {
  padding: 20px 12px;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.vars-list {
  padding: 8px 12px;
}

.var-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 2px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  animation: fadeIn 0.2s ease;
}

.var-name {
  color: var(--primary);
  font-weight: 500;
}

.var-value {
  color: var(--text-primary);
}

.note-section {
  padding: 10px 12px;
  background: var(--warning-light);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.note-section p {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.85rem;
  line-height: 1.5;
}

.output-section {
  border-top: 1px solid var(--border);
}

.flow-output {
  padding: 8px 12px;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: pre-wrap;
  min-height: 40px;
}

.flow-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg);
}

.ctrl-btn {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-size: 0.9rem;
  cursor: pointer;
  background: var(--surface);
  color: var(--text-secondary);
  transition: all 0.2s;
  min-width: 36px;
}

.ctrl-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ctrl-btn-primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.ctrl-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  color: #fff;
}

.step-counter {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-left: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .flow-body {
    grid-template-columns: 1fr;
  }

  .code-panel {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
