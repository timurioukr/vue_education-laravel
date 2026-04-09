import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/lesson/:id',
      name: 'lesson',
      component: () => import('@/views/LessonView.vue'),
      props: true,
    },
    {
      path: '/cheatsheet/:name',
      name: 'cheatsheet',
      component: () => import('@/views/CheatsheetView.vue'),
      props: true,
    },
  ],
})

export default router
