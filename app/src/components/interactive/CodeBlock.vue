<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { codeToHtml } from 'shiki'

const props = withDefaults(
  defineProps<{
    code: string
    lang: string
    terminal?: boolean
    showLineNumbers?: boolean
    title?: string
  }>(),
  {
    terminal: false,
    showLineNumbers: false,
  },
)

const highlightedHtml = ref('')
const copied = ref(false)
let copyTimeout: ReturnType<typeof setTimeout> | undefined

const theme = computed(() => (props.terminal ? 'github-dark' : 'github-light'))

async function highlight() {
  try {
    highlightedHtml.value = await codeToHtml(props.code, {
      lang: props.lang,
      theme: theme.value,
    })
  } catch {
    highlightedHtml.value = ''
  }
}

onMounted(highlight)
watch(() => [props.code, props.lang, props.terminal], highlight)

function copyCode() {
  navigator.clipboard.writeText(props.code)
  copied.value = true
  if (copyTimeout) clearTimeout(copyTimeout)
  copyTimeout = setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <div class="code-block" :class="{ terminal, 'with-line-numbers': showLineNumbers }">
    <div v-if="terminal" class="terminal-header">
      <span class="dot red" />
      <span class="dot yellow" />
      <span class="dot green" />
      <span v-if="title" class="terminal-title">{{ title }}</span>
    </div>
    <div v-else-if="title" class="code-header">
      <span class="code-title">{{ title }}</span>
    </div>

    <div class="code-wrapper">
      <span class="lang-badge">{{ lang }}</span>
      <button class="copy-btn" aria-label="Копіювати код" @click="copyCode">
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
      <!-- eslint-disable vue/no-v-html -->
      <div v-if="highlightedHtml" class="shiki-output" v-html="highlightedHtml" />
      <!-- eslint-enable vue/no-v-html -->
      <pre v-else class="raw-code"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.code-block {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.875rem;
}

.code-block.terminal {
  background: var(--code-bg);
  border: none;
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

.dot.red {
  background: #ff5f57;
}
.dot.yellow {
  background: #ffbd2e;
}
.dot.green {
  background: #28c840;
}

.terminal-title {
  margin-left: 8px;
  font-size: 0.8rem;
  color: #a0a0b8;
}

.code-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.code-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.code-wrapper {
  position: relative;
  overflow-x: auto;
}

.lang-badge {
  position: absolute;
  top: 8px;
  right: 70px;
  font-size: 0.7rem;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(124, 92, 252, 0.1);
  color: var(--primary);
  font-weight: 600;
  z-index: 1;
}

.terminal .lang-badge {
  background: rgba(255, 255, 255, 0.1);
  color: #a0a0b8;
}

.copy-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  background: rgba(124, 92, 252, 0.1);
  color: var(--primary);
  font-weight: 500;
  z-index: 1;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: rgba(124, 92, 252, 0.2);
}

.terminal .copy-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.terminal .copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.shiki-output :deep(pre) {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  background: transparent !important;
}

.shiki-output :deep(code) {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.875rem;
}

.raw-code {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  white-space: pre;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  color: var(--text-primary);
}

.terminal .raw-code {
  color: #a0a0b8;
}

.with-line-numbers .shiki-output :deep(code) {
  counter-reset: line;
}

.with-line-numbers .shiki-output :deep(.line)::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2em;
  margin-right: 1em;
  text-align: right;
  color: var(--text-muted);
}
</style>
