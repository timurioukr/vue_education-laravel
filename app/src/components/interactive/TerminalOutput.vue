<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = withDefaults(defineProps<{
  lines: string[]
  animate?: boolean
  title?: string
}>(), {
  animate: true,
  title: 'Terminal',
})

const visibleLines = ref<string[]>([])

function runAnimation() {
  visibleLines.value = []
  if (!props.animate) {
    visibleLines.value = [...props.lines]
    return
  }
  let i = 0
  const timer = setInterval(() => {
    if (i < props.lines.length) {
      visibleLines.value.push(props.lines[i])
      i++
    } else {
      clearInterval(timer)
    }
  }, 400)
}

onMounted(runAnimation)
watch(() => props.lines, runAnimation)

function isCommand(line: string): boolean {
  return line.startsWith('$') || line.startsWith('>')
}
</script>

<template>
  <div class="terminal">
    <div class="terminal-header">
      <span class="dot red" />
      <span class="dot yellow" />
      <span class="dot green" />
      <span class="terminal-title">{{ title }}</span>
    </div>
    <pre class="terminal-body"><span
  v-for="(line, i) in visibleLines"
  :key="i"
  :class="{ command: isCommand(line), output: !isCommand(line) }"
>{{ line + '\n' }}</span></pre>
  </div>
</template>

<style scoped>
.terminal {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--code-bg);
  font-size: 0.875rem;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background: #FF5F57; }
.dot.yellow { background: #FFBD2E; }
.dot.green { background: #28C840; }

.terminal-title {
  margin-left: 8px;
  font-size: 0.8rem;
  color: #A0A0B8;
}

.terminal-body {
  padding: 14px 16px;
  margin: 0;
  overflow-x: auto;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  line-height: 1.7;
}

.command {
  color: #6BCB77;
}

.output {
  color: #A0A0B8;
}
</style>
