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
    <a href="#main-content" class="skip-link">Перейти до контенту</a>
    <IconSidebar />
    <LessonNav v-if="showLessonNav" />
    <main id="main-content" class="main-content" role="main">
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

.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: 1000;
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.skip-link:focus {
  top: 8px;
}
</style>
