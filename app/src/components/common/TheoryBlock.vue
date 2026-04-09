<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="theory-block">
    <h3 v-if="title" class="theory-title">{{ title }}</h3>
    <slot />
  </div>
</template>

<style scoped>
.theory-block {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.theory-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}
</style>
