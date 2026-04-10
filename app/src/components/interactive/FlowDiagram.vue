<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { FlowStep } from '@/types'

const props = withDefaults(
  defineProps<{
    steps: FlowStep[]
    autoPlay?: boolean
  }>(),
  {
    autoPlay: true,
  },
)

const visibleCount = ref(0)

function animate() {
  visibleCount.value = 0
  let i = 0
  const timer = setInterval(() => {
    i++
    visibleCount.value = i
    if (i >= props.steps.length) {
      clearInterval(timer)
    }
  }, 300)
}

function replay() {
  animate()
}

onMounted(() => {
  if (props.autoPlay) {
    animate()
  } else {
    visibleCount.value = props.steps.length
  }
})
</script>

<template>
  <div class="flow-diagram">
    <div class="steps">
      <template v-for="(step, i) in steps" :key="i">
        <div class="step" :class="{ visible: i < visibleCount }">
          <div class="step-icon" :style="{ background: step.color }">
            {{ step.icon }}
          </div>
          <div class="step-content">
            <p class="step-title">{{ step.title }}</p>
            <p class="step-subtitle">{{ step.subtitle }}</p>
          </div>
        </div>
        <div
          v-if="i < steps.length - 1"
          class="connector"
          :class="{ visible: i < visibleCount - 1 }"
        />
      </template>
    </div>
    <button class="replay-btn" @click="replay">&#x1F504; Replay</button>
  </div>
</template>

<style scoped>
.flow-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.steps {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  width: 100%;
  max-width: 480px;
}

.step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.step.visible {
  opacity: 1;
  transform: translateY(0);
}

.step-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.step-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.connector {
  width: 2px;
  height: 24px;
  margin-left: 37px;
  border-left: 2px dashed var(--border);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.connector.visible {
  opacity: 1;
}

.replay-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.replay-btn:hover {
  background: var(--primary);
  color: white;
}
</style>
