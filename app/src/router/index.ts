import { createRouter, createWebHistory } from 'vue-router'
import { getLessonById } from '@/data/lessons'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'Dashboard' },
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
      meta: { title: 'Cheatsheet' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '404' },
    },
  ],
})

const BASE_TITLE = 'Laravel для Vue-розробників'

router.afterEach((to) => {
  if (to.name === 'lesson' && typeof to.params.id === 'string') {
    const info = getLessonById(to.params.id)
    document.title = info
      ? `${info.lesson.titleUa} — ${BASE_TITLE}`
      : BASE_TITLE
  } else {
    const pageTitle = to.meta.title as string | undefined
    document.title = pageTitle ? `${pageTitle} — ${BASE_TITLE}` : BASE_TITLE
  }
})

export default router
