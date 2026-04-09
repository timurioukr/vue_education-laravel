<script setup lang="ts">
defineProps<{
  items: Array<{ vue: string; laravel: string }>
}>()
</script>

<template>
  <div class="memory-card">
    <h4 class="memory-header">&#x1F4A1; ЗАПАМʼЯТАЙ</h4>
    <ul class="memory-list">
      <li v-for="(item, i) in items" :key="i" class="memory-item">
        <code class="vue-code">{{ item.vue }}</code>
        <span class="arrow">&rarr;</span>
        <code class="laravel-code">{{ item.laravel }}</code>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.memory-card {
  background: linear-gradient(135deg, var(--primary-light), var(--accent-light));
  border-radius: var(--radius-lg);
  padding: 20px 24px;
}

.memory-header {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
}

.memory-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.memory-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.vue-code {
  background: var(--js-bg);
  color: var(--js-color);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.laravel-code {
  background: var(--php-bg);
  color: var(--php-color);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.arrow {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
