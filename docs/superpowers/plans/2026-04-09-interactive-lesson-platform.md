# Interactive Lesson Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interactive code editor with PHP execution, animated Mermaid diagrams, and code flow visualizer to Lesson 01 as a prototype.

**Architecture:** 3 new Vue components (`CodePlayground`, `InteractiveDiagram`, `CodeFlowVisualizer`) + 1 service (`judge0.ts`). Monaco Editor for code editing, Judge0 CE API for PHP execution, Mermaid.js for diagrams. All integrated into existing Lesson01.vue tabs.

**Tech Stack:** Vue 3, TypeScript, Monaco Editor, Mermaid.js, Judge0 CE API, Shiki (existing)

**Spec:** `docs/superpowers/specs/2026-04-09-interactive-lesson-platform-design.md`

---

### Task 1: Install dependencies and configure Vite for Monaco

**Files:**
- Modify: `app/package.json`
- Modify: `app/vite.config.ts`

- [ ] **Step 1: Install Monaco Editor and Mermaid**

Run:
```bash
cd app && npm install monaco-editor mermaid
```

- [ ] **Step 2: Update Vite config for Monaco workers**

Replace `app/vite.config.ts` with:

```typescript
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
})
```

- [ ] **Step 3: Verify dev server starts**

Run:
```bash
cd app && npm run dev
```
Expected: Vite dev server starts without errors.

- [ ] **Step 4: Commit**

```bash
cd app && git add package.json package-lock.json vite.config.ts && git commit -m "feat: add monaco-editor and mermaid dependencies"
```

---

### Task 2: Add types for new components

**Files:**
- Modify: `app/src/types/index.ts`

- [ ] **Step 1: Add new interfaces to types**

Append to `app/src/types/index.ts` after the existing `TreeNode` interface (after line 40):

```typescript
export interface DiagramStep {
  highlightNodes: string[]
  description: string
  code?: string
}

export interface CodeFlowStep {
  line: number
  variables: Record<string, string>
  output?: string
  note?: string
}

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  time: string
  memory: number
  status: 'success' | 'error' | 'timeout' | 'compilation_error'
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/types/index.ts && git commit -m "feat: add types for interactive components"
```

---

### Task 3: Create Judge0 service

**Files:**
- Create: `app/src/services/judge0.ts`
- Create: `app/.env.example`
- Modify: `app/src/env.d.ts`

- [ ] **Step 1: Add env type declaration**

Replace `app/src/env.d.ts` with:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JUDGE0_API_KEY: string
  readonly VITE_JUDGE0_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 2: Create .env.example**

Create `app/.env.example`:

```
VITE_JUDGE0_API_KEY=your_rapidapi_key_here
VITE_JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

- [ ] **Step 3: Create the Judge0 service**

Create `app/src/services/judge0.ts`:

```typescript
import type { ExecutionResult } from '@/types'

const LANGUAGE_IDS: Record<string, number> = {
  php: 68,
  javascript: 63,
  bash: 46,
}

const cache = new Map<string, ExecutionResult>()
const requestTimestamps: number[] = []
const MAX_REQUESTS_PER_MINUTE = 10

function getCacheKey(code: string, language: string): string {
  return `${language}:${code}`
}

function checkRateLimit(): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60_000
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift()
  }
  return requestTimestamps.length < MAX_REQUESTS_PER_MINUTE
}

async function submitCode(code: string, languageId: number): Promise<string> {
  const apiUrl = import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
  const apiKey = import.meta.env.VITE_JUDGE0_API_KEY

  const response = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: btoa(unescape(encodeURIComponent(code))),
      language_id: languageId,
      cpu_time_limit: 5,
      memory_limit: 128000,
    }),
  })

  if (!response.ok) {
    throw new Error(`Judge0 submit failed: ${response.status}`)
  }

  const data = await response.json()
  return data.token
}

async function pollResult(token: string): Promise<ExecutionResult> {
  const apiUrl = import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
  const apiKey = import.meta.env.VITE_JUDGE0_API_KEY
  const maxAttempts = 20
  const pollInterval = 500

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${apiUrl}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,status,time,memory`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Judge0 poll failed: ${response.status}`)
    }

    const data = await response.json()

    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=error states
    if (data.status.id <= 2) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      continue
    }

    const decode = (b64: string | null): string => {
      if (!b64) return ''
      try {
        return decodeURIComponent(escape(atob(b64)))
      } catch {
        return atob(b64)
      }
    }

    const statusMap: Record<number, ExecutionResult['status']> = {
      3: 'success',
      5: 'timeout',
      6: 'compilation_error',
    }

    return {
      stdout: decode(data.stdout),
      stderr: decode(data.stderr),
      exitCode: data.status.id === 3 ? 0 : 1,
      time: data.time ?? '0',
      memory: data.memory ?? 0,
      status: statusMap[data.status.id] ?? 'error',
    }
  }

  return {
    stdout: '',
    stderr: 'Execution timed out while waiting for result',
    exitCode: 1,
    time: '0',
    memory: 0,
    status: 'timeout',
  }
}

export async function executeCode(
  code: string,
  language: 'php' | 'javascript' | 'bash',
): Promise<ExecutionResult> {
  const cacheKey = getCacheKey(code, language)
  const cached = cache.get(cacheKey)
  if (cached) return cached

  if (!checkRateLimit()) {
    return {
      stdout: '',
      stderr: 'Забагато запитів. Зачекайте хвилину.',
      exitCode: 1,
      time: '0',
      memory: 0,
      status: 'error',
    }
  }

  const languageId = LANGUAGE_IDS[language]
  if (!languageId) {
    return {
      stdout: '',
      stderr: `Мова "${language}" не підтримується`,
      exitCode: 1,
      time: '0',
      memory: 0,
      status: 'error',
    }
  }

  requestTimestamps.push(Date.now())

  const token = await submitCode(code, languageId)
  const result = await pollResult(token)

  if (result.status === 'success') {
    cache.set(cacheKey, result)
  }

  return result
}

export function isJudge0Configured(): boolean {
  return !!import.meta.env.VITE_JUDGE0_API_KEY
}
```

- [ ] **Step 4: Commit**

```bash
git add app/src/services/judge0.ts app/src/env.d.ts app/.env.example && git commit -m "feat: add Judge0 code execution service"
```

---

### Task 4: Create CodePlayground component

**Files:**
- Create: `app/src/components/interactive/CodePlayground.vue`

- [ ] **Step 1: Create the component**

Create `app/src/components/interactive/CodePlayground.vue`:

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { executeCode, isJudge0Configured } from '@/services/judge0'
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

  if (!isJudge0Configured()) {
    errorMessage.value = 'Judge0 API не налаштований. Додайте VITE_JUDGE0_API_KEY в .env файл.'
    return
  }

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
```

- [ ] **Step 2: Verify — open dev server and import component in a test page**

Run:
```bash
cd app && npm run dev
```
Expected: No TypeScript or build errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/interactive/CodePlayground.vue && git commit -m "feat: add CodePlayground component with Monaco editor and Judge0 execution"
```

---

### Task 5: Create InteractiveDiagram component

**Files:**
- Create: `app/src/components/interactive/InteractiveDiagram.vue`

- [ ] **Step 1: Create the component**

Create `app/src/components/interactive/InteractiveDiagram.vue`:

```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import mermaid from 'mermaid'
import type { DiagramStep } from '@/types'

const props = withDefaults(
  defineProps<{
    definition: string
    steps?: DiagramStep[]
    title?: string
  }>(),
  {
    steps: () => [],
  },
)

const diagramContainer = ref<HTMLDivElement>()
const currentStep = ref(-1)
const diagramId = `mermaid-${Math.random().toString(36).slice(2, 9)}`

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#7C5CFC',
    primaryTextColor: '#1A1A2E',
    primaryBorderColor: '#6B4FE0',
    lineColor: '#9CA3AF',
    secondaryColor: '#F0EEFF',
    tertiaryColor: '#F5F5FA',
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontSize: '14px',
  },
})

async function renderDiagram() {
  if (!diagramContainer.value) return

  try {
    const { svg } = await mermaid.render(diagramId, props.definition)
    diagramContainer.value.innerHTML = svg
    await nextTick()
    applyHighlights()
  } catch (e) {
    console.error('Mermaid render error:', e)
    if (diagramContainer.value) {
      diagramContainer.value.innerHTML = '<p style="color: #f87171;">Помилка рендерингу діаграми</p>'
    }
  }
}

function applyHighlights() {
  if (!diagramContainer.value) return
  const svgEl = diagramContainer.value.querySelector('svg')
  if (!svgEl) return

  // Reset all nodes
  const allNodes = svgEl.querySelectorAll('.node')
  allNodes.forEach((node) => {
    ;(node as HTMLElement).style.opacity = currentStep.value >= 0 ? '0.3' : '1'
    ;(node as HTMLElement).style.transition = 'opacity 0.3s ease'
  })

  if (currentStep.value < 0 || !props.steps?.[currentStep.value]) return

  // Highlight active nodes
  const step = props.steps[currentStep.value]
  step.highlightNodes.forEach((nodeId) => {
    const node = svgEl.querySelector(`[id*="${nodeId}"]`)
      ?? svgEl.querySelector(`.node#${nodeId}`)
      ?? svgEl.querySelector(`[data-id="${nodeId}"]`)
    if (node) {
      ;(node as HTMLElement).style.opacity = '1'
    }
  })
}

watch(currentStep, () => {
  applyHighlights()
})

onMounted(() => {
  renderDiagram()
})

watch(() => props.definition, () => {
  renderDiagram()
})

function nextStep() {
  if (!props.steps?.length) return
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function resetSteps() {
  currentStep.value = -1
}

const hasSteps = computed(() => props.steps && props.steps.length > 0)
const currentDescription = computed(() => {
  if (currentStep.value < 0 || !props.steps?.[currentStep.value]) return null
  return props.steps[currentStep.value]
})
</script>

<template>
  <div class="diagram">
    <div v-if="title" class="diagram-title">{{ title }}</div>

    <div class="diagram-content">
      <div ref="diagramContainer" class="diagram-svg" />

      <div v-if="currentDescription" class="diagram-description">
        <div class="step-badge">Крок {{ currentStep + 1 }}/{{ steps!.length }}</div>
        <p>{{ currentDescription.description }}</p>
        <code v-if="currentDescription.code" class="step-code">{{ currentDescription.code }}</code>
      </div>
    </div>

    <div v-if="hasSteps" class="diagram-controls">
      <button class="ctrl-btn" @click="resetSteps" :disabled="currentStep < 0">⟲ Скинути</button>
      <button class="ctrl-btn" @click="prevStep" :disabled="currentStep <= 0">← Назад</button>
      <button class="ctrl-btn ctrl-btn-primary" @click="nextStep" :disabled="currentStep >= steps!.length - 1">
        Далі →
      </button>
    </div>
  </div>
</template>

<style scoped>
.diagram {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.diagram-title {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.diagram-content {
  padding: 20px;
}

.diagram-svg {
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

.diagram-svg :deep(svg) {
  max-width: 100%;
  height: auto;
}

.diagram-description {
  margin-top: 16px;
  padding: 14px;
  background: var(--primary-light);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary);
}

.step-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.diagram-description p {
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
}

.step-code {
  display: block;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--code-bg);
  color: #e0e0e0;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.diagram-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg);
}

.ctrl-btn {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  background: var(--surface);
  color: var(--text-secondary);
  transition: all 0.2s;
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
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/src/components/interactive/InteractiveDiagram.vue && git commit -m "feat: add InteractiveDiagram component with Mermaid and step-by-step animation"
```

---

### Task 6: Create CodeFlowVisualizer component

**Files:**
- Create: `app/src/components/interactive/CodeFlowVisualizer.vue`

- [ ] **Step 1: Create the component**

Create `app/src/components/interactive/CodeFlowVisualizer.vue`:

```vue
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
          <div v-if="!currentStep || Object.keys(currentStep.variables).length === 0" class="empty-state">
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
      <button class="ctrl-btn" @click="prevStep" :disabled="currentStepIndex <= 0">←</button>
      <button
        class="ctrl-btn ctrl-btn-primary"
        @click="toggleAutoPlay"
      >
        {{ isPlaying ? '⏸' : '▶' }}
      </button>
      <button class="ctrl-btn" @click="nextStep" :disabled="currentStepIndex >= steps.length - 1">→</button>
      <span class="step-counter" v-if="currentStepIndex >= 0">
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
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
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
```

- [ ] **Step 2: Commit**

```bash
git add app/src/components/interactive/CodeFlowVisualizer.vue && git commit -m "feat: add CodeFlowVisualizer with step-by-step code execution visualization"
```

---

### Task 7: Integrate all components into Lesson01

**Files:**
- Modify: `app/src/lessons/week1/Lesson01.vue`

This is the largest task — updating Lesson01 to use the new interactive components.

- [ ] **Step 1: Update imports in Lesson01.vue**

Replace lines 1-8 of `app/src/lessons/week1/Lesson01.vue`:

```typescript
<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion } from '@/types'
```

with:

```typescript
<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodePlayground from '@/components/interactive/CodePlayground.vue'
import InteractiveDiagram from '@/components/interactive/InteractiveDiagram.vue'
import CodeFlowVisualizer from '@/components/interactive/CodeFlowVisualizer.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion, DiagramStep, CodeFlowStep } from '@/types'
```

- [ ] **Step 2: Add diagram data after the `phpMatch` const (after line 93)**

Insert after the `phpMatch` const:

```typescript
// === Diagram: How PHP executes code ===
const phpExecutionDiagram = `flowchart LR
  A[".php файл"] --> B["PHP інтерпретатор"]
  B --> C["Лексер/Парсер"]
  C --> D["Опкоди"]
  D --> E["Zend VM"]
  E --> F["stdout / echo"]
`

const phpExecutionSteps: DiagramStep[] = [
  {
    highlightNodes: ['A'],
    description: 'Все починається з .php файлу — як .js файл для Node.js. PHP-файл починається з <?php тегу.',
    code: '<?php echo "Hello";',
  },
  {
    highlightNodes: ['B'],
    description: 'PHP інтерпретатор (CLI або через веб-сервер) читає файл. Аналог Node.js або V8 для JavaScript.',
  },
  {
    highlightNodes: ['C'],
    description: 'Лексер розбиває код на токени, парсер будує AST (абстрактне синтаксичне дерево) — як V8 парсить JS.',
  },
  {
    highlightNodes: ['D', 'E'],
    description: 'AST компілюється в опкоди (байткод) і виконується Zend VM. В JS аналог — JIT-компіляція V8.',
  },
  {
    highlightNodes: ['F'],
    description: 'Результат виводиться через echo/print — як console.log() в JavaScript. Вивід йде в stdout.',
    code: 'echo "Hello World\\n";  // → stdout',
  },
]

// === Diagram: PHP types vs JS types ===
const typesDiagram = `flowchart TB
  subgraph JS ["JavaScript"]
    JS1["string"]
    JS2["number"]
    JS3["boolean"]
    JS4["null / undefined"]
    JS5["object / array"]
  end
  subgraph PHP ["PHP"]
    PHP1["string"]
    PHP2["int + float"]
    PHP3["bool"]
    PHP4["null"]
    PHP5["array"]
  end
  JS1 -.-> PHP1
  JS2 -.-> PHP2
  JS3 -.-> PHP3
  JS4 -.-> PHP4
  JS5 -.-> PHP5
`

const typesDiagramSteps: DiagramStep[] = [
  {
    highlightNodes: ['JS1', 'PHP1'],
    description: 'string → string. Ідентично. Одинарні та подвійні лапки, але в PHP подвійні підтримують інтерполяцію: "Hello $name".',
    code: '$name = "World";\necho "Hello $name";  // Hello World',
  },
  {
    highlightNodes: ['JS2', 'PHP2'],
    description: 'number → int + float. В PHP числа розділені на цілі (int) та дробні (float). JS має тільки number.',
    code: '$age = 25;      // int\n$price = 9.99;  // float',
  },
  {
    highlightNodes: ['JS3', 'PHP3'],
    description: 'boolean → bool. Ідентично. true/false без лапок.',
  },
  {
    highlightNodes: ['JS4', 'PHP4'],
    description: 'null + undefined → null. В PHP немає undefined. Тільки null. Неініціалізована змінна = warning.',
  },
  {
    highlightNodes: ['JS5', 'PHP5'],
    description: 'object + Array → array. В PHP один тип array замінює і масиви, і об\'єкти-словники з JS.',
    code: '$list = [1, 2, 3];           // як JS []\n$map = ["a" => 1, "b" => 2];  // як JS {}',
  },
]

// === Code Flow: foreach loop ===
const foreachCode = `<?php
$items = ['task1', 'task2', 'task3'];
foreach ($items as $index => $item) {
    echo "$index: $item\\n";
}`

const foreachSteps: CodeFlowStep[] = [
  {
    line: 2,
    variables: { '$items': "['task1', 'task2', 'task3']" },
    note: 'Створюємо масив з трьох рядків. В JS це було б const items = ["task1", "task2", "task3"]',
  },
  {
    line: 3,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '0', '$item': '"task1"' },
    note: 'foreach бере перший елемент. $index = ключ (0), $item = значення ("task1"). Як for...of + entries() в JS.',
  },
  {
    line: 4,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '0', '$item': '"task1"' },
    output: '0: task1\n',
    note: 'echo виводить рядок з інтерполяцією. $index та $item підставляються всередину подвійних лапок.',
  },
  {
    line: 3,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '1', '$item': '"task2"' },
    note: 'Друга ітерація. $index = 1, $item = "task2".',
  },
  {
    line: 4,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '1', '$item': '"task2"' },
    output: '1: task2\n',
  },
  {
    line: 3,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '2', '$item': '"task3"' },
    note: 'Остання ітерація. $index = 2, $item = "task3".',
  },
  {
    line: 4,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '2', '$item': '"task3"' },
    output: '2: task3\n',
    note: 'Цикл завершено. Всі 3 елементи оброблено.',
  },
]

// Expected output for practice (used for comparison)
const practiceExpectedOutput = `Name: Timur
Age: 25
Is student: yes

Fruits: apple, banana, cherry
Count: 3

  title: Learn PHP
  status: in_progress
  priority: 1

Timur is 25 years old`

// Test code for task validation
const taskTestCode = `
// Auto-test
echo "\\n=== Auto-check ===\\n";
$pass = 0;
$total = 3;

// Test formatTask
$result = formatTask(['id' => 1, 'title' => 'Test', 'status' => 'done', 'priority' => 2]);
if ($result === '[DONE] Test (priority: 2)') { echo "✓ formatTask\\n"; $pass++; } else { echo "✗ formatTask: got '$result'\\n"; }

// Test filterByStatus
$filtered = filterByStatus($tasks, 'pending');
if (count($filtered) === 3) { echo "✓ filterByStatus\\n"; $pass++; } else { echo "✗ filterByStatus: expected 3, got " . count($filtered) . "\\n"; }

// Test getTaskStats
$stats = getTaskStats($tasks);
if ($stats['total'] === 5 && $stats['done'] === 1 && $stats['pending'] === 3 && $stats['in_progress'] === 1) { echo "✓ getTaskStats\\n"; $pass++; } else { echo "✗ getTaskStats\\n"; }

echo "\\nРезультат: $pass/$total\\n";`
```

- [ ] **Step 3: Update the Theory tab template**

Replace lines 192-256 (the Theory tab `<div v-show="activeTab === 'theory'">` content):

```html
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="let/const" to="$variable" />

      <TheoryBlock title="Змінні та типи">
        <p>
          В PHP немає <code>let</code> чи <code>const</code> для змінних. Кожна змінна починається з
          <code>$</code> і може бути змінена в будь-який момент. PHP -- мова з динамічною типізацією,
          як і JavaScript. Для справжніх констант є окремий синтаксис <code>const</code> або <code>define()</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`let name = &quot;Timur&quot;;\nconst MAX = 10;\nlet isActive = true;\nlet score = 9.5;`"
        :php="`$name = &quot;Timur&quot;;       // string\nconst MAX = 10;          // константа\n$isActive = true;        // bool\n$score = 9.5;            // float`"
      />

      <InteractiveDiagram
        title="Як PHP виконує код"
        :definition="phpExecutionDiagram"
        :steps="phpExecutionSteps"
      />

      <TheoryBlock title="Масиви">
        <p>
          В PHP немає окремого типу "об'єкт-словник". Замість цього є <strong>індексовані масиви</strong>
          (як JS arrays: <code>[1, 2, 3]</code>) та <strong>асоціативні масиви</strong> (як JS objects:
          <code>['key' => 'value']</code>). Це одна структура <code>array</code>, яка замінює і масиви, і об'єкти з JavaScript.
        </p>
        <p>
          Доступ до елементів -- тільки через квадратні дужки: <code>$task['title']</code>.
          Оператор <code>.</code> в PHP -- це конкатенація рядків, а не доступ до властивості.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`const task = {\n  name: &quot;Task&quot;,\n  done: true\n};`"
        :php="`$task = [\n  'name' => 'Task',\n  'done' => true,\n];`"
      />

      <InteractiveDiagram
        title="Типи даних: PHP vs JavaScript"
        :definition="typesDiagram"
        :steps="typesDiagramSteps"
      />

      <TheoryBlock title="Функції">
        <p>
          PHP підтримує звичайні функції з <code>function</code>, стрілкові функції <code>fn()</code>
          (тільки один вираз, як implicit return в JS) та замикання з <code>use</code>.
        </p>
        <p>
          Важлива відмінність: анонімна функція в PHP <strong>не бачить</strong> зовнішніх змінних
          без явного <code>use ($var)</code>. Стрілкова функція <code>fn()</code> автоматично захоплює
          зовнішні змінні (read-only).
        </p>
      </TheoryBlock>

      <CodeComparison
        js="const double = (x) => x * 2;"
        php="$double = fn($x) => $x * 2;"
      />

      <TheoryBlock title="Оператори">
        <p>
          <code>===</code> працює так само, як в JS -- строге порівняння без приведення типів.
          <code>??</code> (null coalescing) теж ідентичний. А <code>match</code> -- це покращений
          <code>switch</code>: повертає значення, використовує <code>===</code>, не потребує <code>break</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsSwitch"
        :php="phpMatch"
        js-title="JavaScript (switch)"
        php-title="PHP (match)"
      />

      <CodeFlowVisualizer
        title="Покрокове виконання: foreach цикл"
        :code="foreachCode"
        language="php"
        :steps="foreachSteps"
      />
    </div>
```

- [ ] **Step 4: Update the Practice tab template**

Replace lines 258-277 (the Practice tab) with:

```html
    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: перший PHP-файл">
        <p>
          Відредагуйте код нижче та натисніть <strong>"Запустити"</strong> щоб побачити результат.
          Спробуйте змінити значення змінних, додати нові елементи в масив, або написати свою функцію.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/01-basics.php"
        :expected-output="practiceExpectedOutput"
      />
    </div>
```

- [ ] **Step 5: Update the Tasks tab template**

Replace lines 283-310 (the Tasks tab) with:

```html
    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Task Manager Functions">
        <p>
          Реалізуйте три функції для роботи з масивом задач. Натисніть <strong>"Запустити"</strong> —
          автоматичні тести перевірять вашу реалізацію.
        </p>
        <ol>
          <li>
            <strong>formatTask(array $task): string</strong> — форматує задачу в рядок
            <code>[STATUS] Title (priority: N)</code>
          </li>
          <li>
            <strong>filterByStatus(array $tasks, string $status): array</strong> — повертає
            тільки задачі з вказаним статусом
          </li>
          <li>
            <strong>getTaskStats(array $tasks): array</strong> — повертає статистику:
            загальна кількість, скільки done, pending, in_progress
          </li>
        </ol>
        <p>
          Підказка: використовуйте <code>array_filter</code>, <code>array_values</code>, <code>count</code>,
          <code>strtoupper</code>, <code>foreach</code>.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте функції"
        :test-code="taskTestCode"
      />
    </div>
```

- [ ] **Step 6: Remove unused code**

Delete the `practiceOutput` array from the script section (originally lines 130-144) — it's replaced by `practiceExpectedOutput` which is defined in the new data block. The old imports (`CodeBlock`, `TerminalOutput`) were already replaced in Step 1.

- [ ] **Step 7: Verify — run dev server and open Lesson 01**

Run:
```bash
cd app && npm run dev
```
Open `http://localhost:5173` in browser, navigate to Lesson 01. Check:
- Theory tab: diagrams render, step-by-step navigation works
- Practice tab: Monaco editor loads, code is editable
- Tasks tab: Monaco editor loads with starter code
- Quiz tab: unchanged, still works

- [ ] **Step 8: Commit**

```bash
git add app/src/lessons/week1/Lesson01.vue && git commit -m "feat: integrate interactive components into Lesson 01 (playground, diagrams, flow visualizer)"
```

---

### Task 8: End-to-end verification

**Files:** None (verification only)

- [ ] **Step 1: Create .env file with Judge0 API key**

Create `app/.env` (not committed) with a real API key:
```
VITE_JUDGE0_API_KEY=<your_key>
VITE_JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

To get a key: sign up at https://rapidapi.com/judge0-official/api/judge0-ce and copy the API key.

- [ ] **Step 2: Test CodePlayground execution**

1. Open Lesson 01 → Practice tab
2. Click "Запустити"
3. Expected: PHP code executes, stdout appears in output panel
4. Expected: Green "✓ Результат збігається з очікуваним" appears

- [ ] **Step 3: Test diagram interactivity**

1. Open Lesson 01 → Theory tab
2. Scroll to "Як PHP виконує код" diagram
3. Click "Далі" — nodes should highlight one by one
4. Description text should update with each step
5. Click "Скинути" — all nodes return to normal

- [ ] **Step 4: Test CodeFlowVisualizer**

1. Scroll to "Покрокове виконання: foreach цикл"
2. Click "→" — line 2 highlights, $items variable appears
3. Continue clicking — variables update, output accumulates
4. Click "▶" — auto-play starts at 1.5s intervals

- [ ] **Step 5: Test Tasks tab with auto-check**

1. Open Tasks tab
2. Implement the three functions in the editor
3. Click "Запустити"
4. Expected: Auto-check output shows ✓/✗ for each function

- [ ] **Step 6: Test mobile responsiveness**

1. Open browser DevTools, toggle device toolbar
2. Set width to 375px (iPhone)
3. Check that CodePlayground stacks vertically (editor on top, output below)
4. Check that CodeFlowVisualizer stacks vertically
5. Check that diagrams are scrollable

- [ ] **Step 7: Test fallback (no API key)**

1. Remove `VITE_JUDGE0_API_KEY` from `.env`
2. Restart dev server
3. Click "Запустити" in Practice tab
4. Expected: "Judge0 API не налаштований. Додайте VITE_JUDGE0_API_KEY в .env файл."

- [ ] **Step 8: Run type check**

```bash
cd app && npx vue-tsc --noEmit
```
Expected: No TypeScript errors.
