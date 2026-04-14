import { ref, computed, onUnmounted } from 'vue'

export function useLifecycleAnimation(totalSteps: number) {
  const currentStep = ref(-1)
  const isPlaying = ref(false)
  const speed = ref(1)
  const selectedLayer = ref<number | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null

  const isComplete = computed(() => currentStep.value >= totalSteps - 1)
  const baseDelay = 3000

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleNext() {
    clearTimer()
    if (!isPlaying.value || isComplete.value) {
      if (isComplete.value) isPlaying.value = false
      return
    }
    timer = setTimeout(() => {
      currentStep.value++
      scheduleNext()
    }, baseDelay / speed.value)
  }

  function play() {
    if (isComplete.value) currentStep.value = -1
    isPlaying.value = true
    selectedLayer.value = null
    if (currentStep.value < 0) currentStep.value = 0
    else currentStep.value++
    scheduleNext()
  }

  function pause() {
    isPlaying.value = false
    clearTimer()
  }

  function step() {
    pause()
    selectedLayer.value = null
    if (isComplete.value) return
    currentStep.value++
  }

  function reset() {
    pause()
    currentStep.value = -1
    selectedLayer.value = null
  }

  function selectLayer(index: number) {
    pause()
    selectedLayer.value = selectedLayer.value === index ? null : index
    currentStep.value = index
  }

  function setSpeed(s: number) {
    speed.value = s
    if (isPlaying.value) {
      clearTimer()
      scheduleNext()
    }
  }

  onUnmounted(clearTimer)

  return {
    currentStep,
    isPlaying,
    speed,
    selectedLayer,
    isComplete,
    play,
    pause,
    step,
    reset,
    selectLayer,
    setSpeed,
  }
}
