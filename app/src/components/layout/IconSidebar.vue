<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { icon: '\u{1F4CA}', label: 'Dashboard', to: '/' },
  { icon: '\u{1F4D6}', label: 'Lessons', to: '/lesson/01' },
  { icon: '\u{1F4CB}', label: 'Cheatsheets', to: '/cheatsheet/php-vs-js' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to.replace(/\/[^/]+$/, ''))
}
</script>

<template>
  <aside class="icon-sidebar">
    <div class="logo">
      <div class="logo-icon">\u{1F4D8}</div>
    </div>

    <nav class="nav-icons">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-icon"
        :class="{ active: isActive(item.to) }"
        :title="item.label"
      >
        <span class="nav-emoji">{{ item.icon }}</span>
      </router-link>
    </nav>

    <div class="nav-bottom">
      <div class="nav-icon" title="Settings">
        <span class="nav-emoji">\u2699\uFE0F</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.icon-sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 8px;
}

.logo {
  margin-bottom: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--primary), #9b7dff);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.nav-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.nav-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  background: var(--primary-light);
  text-decoration: none;
}

.nav-icon:hover {
  background: var(--border);
}

.nav-icon.active {
  background: var(--primary);
}

.nav-emoji {
  font-size: 18px;
  line-height: 1;
}

.nav-bottom {
  margin-top: auto;
}
</style>
