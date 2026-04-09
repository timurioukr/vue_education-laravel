<script setup lang="ts">
defineProps<{
  from: string
  to: string
}>()
</script>

<template>
  <div class="parallel-card">
    <span class="parallel-icon">&#x1F504;</span>
    <div class="parallel-content">
      <span class="parallel-label">VUE &rarr; LARAVEL</span>
      <p class="parallel-mapping">
        <code class="from-code">{{ from }}</code>
        <span class="map-arrow">&rarr;</span>
        <code class="to-code">{{ to }}</code>
      </p>
    </div>
  </div>
</template>

<style scoped>
.parallel-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  border-left: 4px solid var(--primary);
}

.parallel-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.parallel-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.parallel-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--primary);
}

.parallel-mapping {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.from-code {
  background: var(--js-bg);
  color: var(--js-color);
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.85rem;
}

.to-code {
  background: var(--php-bg);
  color: var(--php-color);
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.85rem;
}

.map-arrow {
  color: var(--text-muted);
}
</style>
