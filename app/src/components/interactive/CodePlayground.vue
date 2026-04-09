<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { executeCode } from '@/services/judge0'
import type { ExecutionResult } from '@/types'

const props = withDefaults(
  defineProps<{
    initialCode: string
    language: 'php' | 'javascript' | 'bash'
    expectedOutput?: string
    testCode?: string
    title?: string
    readOnly?: boolean
  }>(),
  {
    readOnly: false,
  },
)

const editorContainer = ref<HTMLDivElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const result = ref<ExecutionResult | null>(null)
const isRunning = ref(false)
const errorMessage = ref('')

const monacoLangMap: Record<string, string> = {
  php: 'php',
  javascript: 'javascript',
  bash: 'shell',
}

onMounted(() => {
  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    value: props.initialCode,
    language: monacoLangMap[props.language] ?? props.language,
    theme: 'vs-dark',
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    readOnly: props.readOnly,
    padding: { top: 12, bottom: 12 },
    roundedSelection: true,
    tabSize: 4,
  })
})

onBeforeUnmount(() => {
  editor?.dispose()
})

watch(
  () => props.initialCode,
  (newCode) => {
    if (editor && editor.getValue() !== newCode) {
      editor.setValue(newCode)
    }
  },
)

async function run() {
  if (!editor || isRunning.value) return
  errorMessage.value = ''

  isRunning.value = true
  result.value = null

  try {
    let code = editor.getValue()
    if (props.testCode) {
      code = code + '\n' + props.testCode
    }
    result.value = await executeCode(code, props.language)
  } catch {
    errorMessage.value = 'Сервіс тимчасово недоступний. Спробуйте пізніше.'
  } finally {
    isRunning.value = false
  }
}

function reset() {
  if (editor) {
    editor.setValue(props.initialCode)
  }
  result.value = null
  errorMessage.value = ''
}

const outputMatches = computed(() => {
  if (!result.value || !props.expectedOutput) return null
  return result.value.stdout.trim() === props.expectedOutput.trim()
})
</script>

<template>
  <div class="playground">
    <div class="playground-header">
      <span class="playground-title">{{ title ?? 'Playground' }}</span>
      <div class="playground-actions">
        <button class="btn btn-reset" @click="reset" :disabled="isRunning">↻ Скинути</button>
        <button class="btn btn-run" @click="run" :disabled="isRunning">
          <span v-if="isRunning" class="spinner" />
          <span v-else>▶</span>
          {{ isRunning ? 'Виконується...' : 'Запустити' }}
        </button>
      </div>
    </div>

    <div class="playground-body">
      <div class="editor-panel">
        <div ref="editorContainer" class="editor-container" />
      </div>

      <div class="output-panel">
        <div class="output-header">
          <span>Результат</span>
          <span v-if="result" class="output-meta">
            {{ result.time }}s · {{ Math.round(result.memory / 1024) }}MB
          </span>
        </div>

        <div v-if="errorMessage" class="output-content output-error">
          {{ errorMessage }}
        </div>

        <div v-else-if="!result && !isRunning" class="output-content output-placeholder">
          Натисніть "Запустити" щоб побачити результат
        </div>

        <div v-else-if="isRunning" class="output-content output-placeholder">
          <span class="spinner" /> Виконується...
        </div>

        <div v-else-if="result" class="output-content">
          <pre v-if="result.stdout" class="output-stdout">{{ result.stdout }}</pre>
          <pre v-if="result.stderr" class="output-stderr">{{ result.stderr }}</pre>

          <div v-if="outputMatches !== null" class="output-match" :class="outputMatches ? 'match-success' : 'match-fail'">
            {{ outputMatches ? '✓ Результат збігається з очікуваним' : '✗ Результат не збігається з очікуваним' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.playground-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--code-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.playground-title {
  color: #e0e0e0;
  font-size: 0.875rem;
  font-weight: 500;
}

.playground-actions {
  display: flex;
  gap: 8px;
}

.btn {
  border: none;
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-run {
  background: var(--success);
  color: #fff;
}

.btn-run:hover:not(:disabled) {
  background: #2bc48a;
}

.btn-reset {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.btn-reset:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.playground-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 300px;
}

.editor-panel {
  border-right: 1px solid var(--border);
}

.editor-container {
  height: 300px;
}

.output-panel {
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  color: #999;
  font-size: 0.8rem;
}

.output-meta {
  color: #666;
}

.output-content {
  flex: 1;
  padding: 12px 16px;
  overflow: auto;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
}

.output-placeholder {
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
}

.output-stdout {
  color: #e0e0e0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-stderr {
  color: #f87171;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-error {
  color: #f87171;
}

.output-match {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.match-success {
  background: rgba(52, 211, 153, 0.15);
  color: var(--success);
}

.match-fail {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .playground-body {
    grid-template-columns: 1fr;
  }

  .editor-panel {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
