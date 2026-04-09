<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
}>()

const cheatsheetMap: Record<string, string> = {
  'php-vs-js': 'PHP vs JavaScript',
  'artisan-commands': 'Artisan команди',
  'eloquent-cheatsheet': 'Eloquent шпаргалка',
}

const title = computed(() => cheatsheetMap[props.name] ?? props.name)
</script>

<template>
  <div class="cheatsheet-view">
    <header class="cheatsheet-header">
      <h1 class="cheatsheet-title">{{ title }}</h1>
      <p class="cheatsheet-subtitle">&#x1F4CB; Шпаргалка</p>
    </header>

    <div class="cheatsheet-card">
      <p class="cheatsheet-placeholder">Контент шпаргалки буде тут</p>
    </div>
  </div>
</template>

<style scoped>
.cheatsheet-view {
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}

.cheatsheet-header {
  margin-bottom: 24px;
}

.cheatsheet-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.cheatsheet-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

.cheatsheet-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-sm);
}

.cheatsheet-placeholder {
  font-size: 15px;
  color: var(--text-muted);
  text-align: center;
}
</style>
