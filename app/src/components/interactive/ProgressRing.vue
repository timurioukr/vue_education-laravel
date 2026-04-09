<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  size?: number
  color?: string
  trackColor?: string
}>(), {
  size: 48,
  color: 'var(--primary)',
  trackColor: 'var(--border)',
})

const mounted = ref(false)

const radius = computed(() => (props.size / 2) - 4)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashoffset = computed(() =>
  mounted.value
    ? circumference.value - (circumference.value * props.value) / 100
    : circumference.value,
)
const strokeWidth = computed(() => Math.max(3, props.size * 0.08))
const fontSize = computed(() => props.size * 0.26)

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})
</script>

<template>
  <div class="progress-ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :viewBox="`0 0 ${size} ${size}`" :width="size" :height="size">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <circle
        class="progress-arc"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashoffset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      />
    </svg>
    <span class="ring-text" :style="{ fontSize: fontSize + 'px' }">
      {{ value }}%
    </span>
  </div>
</template>

<style scoped>
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-arc {
  transition: stroke-dashoffset 0.8s ease;
}

.ring-text {
  position: absolute;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
