<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { DiagramStep } from '@/types'

type MermaidApi = (typeof import('mermaid'))['default']

let mermaidPromise: Promise<MermaidApi> | null = null

function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
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
      return mermaid
    })
  }
  return mermaidPromise
}

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

async function renderDiagram() {
  if (!diagramContainer.value) return

  try {
    const mermaid = await loadMermaid()
    const { svg } = await mermaid.render(diagramId, props.definition)
    diagramContainer.value.innerHTML = svg
    await nextTick()
    applyHighlights()
  } catch (e) {
    console.error('Mermaid render error:', e)
    if (diagramContainer.value) {
      diagramContainer.value.innerHTML =
        '<p style="color: #f87171;">Помилка рендерингу діаграми</p>'
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
    const node =
      svgEl.querySelector(`[id*="${nodeId}"]`) ??
      svgEl.querySelector(`.node#${nodeId}`) ??
      svgEl.querySelector(`[data-id="${nodeId}"]`)
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

watch(
  () => props.definition,
  () => {
    renderDiagram()
  },
)

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
      <button class="ctrl-btn" :disabled="currentStep < 0" @click="resetSteps">⟲ Скинути</button>
      <button class="ctrl-btn" :disabled="currentStep <= 0" @click="prevStep">← Назад</button>
      <button
        class="ctrl-btn ctrl-btn-primary"
        :disabled="currentStep >= steps!.length - 1"
        @click="nextStep"
      >
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
