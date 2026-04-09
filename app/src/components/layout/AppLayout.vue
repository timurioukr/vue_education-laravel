<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import IconSidebar from './IconSidebar.vue'
import LessonNav from './LessonNav.vue'

const route = useRoute()

const showLessonNav = computed(() => {
  return route.path.startsWith('/lesson/')
})
</script>

<template>
  <div class="app-layout">
    <IconSidebar />
    <LessonNav v-if="showLessonNav" />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}
</style>
