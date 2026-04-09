<script setup lang="ts">
import CodeBlock from './CodeBlock.vue'

withDefaults(defineProps<{
  js: string
  php: string
  jsTitle?: string
  phpTitle?: string
}>(), {
  jsTitle: 'JavaScript',
  phpTitle: 'PHP (Laravel)',
})
</script>

<template>
  <div class="code-comparison">
    <div class="panel js-panel">
      <div class="panel-header js-header">
        <span>&#x1F7E2; {{ jsTitle }}</span>
      </div>
      <CodeBlock :code="js" lang="javascript" />
    </div>
    <div class="panel php-panel">
      <div class="panel-header php-header">
        <span>&#x1F7E3; {{ phpTitle }}</span>
      </div>
      <CodeBlock :code="php" lang="php" />
    </div>
  </div>
</template>

<style scoped>
.code-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.panel {
  min-width: 0;
  overflow: hidden;
}

.panel :deep(.code-block) {
  border: none;
  border-radius: 0;
}

.panel-header {
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 600;
}

.js-header {
  background: var(--js-bg);
  color: var(--js-color);
}

.php-header {
  background: var(--php-bg);
  color: var(--php-color);
}

.js-panel {
  border-right: 1px solid var(--border);
}

@media (max-width: 768px) {
  .code-comparison {
    grid-template-columns: 1fr;
  }

  .js-panel {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
