import type { Week, Lesson } from '@/types'

export const weeks: Week[] = [
  {
    number: 1,
    title: 'PHP & Laravel Basics',
    titleUa: 'PHP та основи Laravel',
    icon: '🚀',
    lessons: [
      { id: '01', title: 'PHP Syntax', titleUa: 'PHP-синтаксис для JS-розробника', week: 1, order: 1, duration: '~60 хв', icon: '📝' },
      { id: '02', title: 'PHP OOP', titleUa: 'PHP ООП та namespace', week: 1, order: 2, duration: '~60 хв', icon: '🏗️' },
      { id: '03', title: 'Installation', titleUa: 'Встановлення та структура', week: 1, order: 3, duration: '~45 хв', icon: '📦' },
      { id: '04', title: 'Routing', titleUa: 'Маршрутизація та контролери', week: 1, order: 4, duration: '~50 хв', icon: '🛤️' },
      { id: '05', title: 'Migrations', titleUa: 'Міграції та схема БД', week: 1, order: 5, duration: '~45 хв', icon: '🗄️' },
      { id: '06', title: 'Eloquent', titleUa: 'Eloquent моделі', week: 1, order: 6, duration: '~55 хв', icon: '🔮' },
      { id: 'w1-test', title: 'Week 1 Test', titleUa: 'Тест тижня 1', week: 1, order: 7, duration: '~30 хв', icon: '⭐', isTest: true },
    ],
  },
  {
    number: 2,
    title: 'Building the API',
    titleUa: 'Будуємо API',
    icon: '🔧',
    lessons: [
      { id: '07', title: 'Relationships', titleUa: 'Eloquent зв\'язки', week: 2, order: 1, duration: '~55 хв', icon: '🔗' },
      { id: '08', title: 'Validation', titleUa: 'Валідація та Form Requests', week: 2, order: 2, duration: '~50 хв', icon: '✅' },
      { id: '09', title: 'API Resources', titleUa: 'API Resources', week: 2, order: 3, duration: '~45 хв', icon: '📦' },
      { id: '10', title: 'Error Handling', titleUa: 'Обробка помилок', week: 2, order: 4, duration: '~40 хв', icon: '🚨' },
      { id: '11', title: 'Seeders', titleUa: 'Seeders та Factories', week: 2, order: 5, duration: '~45 хв', icon: '🌱' },
      { id: '12', title: 'Scopes', titleUa: 'Scopes, фільтрація, сортування', week: 2, order: 6, duration: '~50 хв', icon: '🔍' },
      { id: 'w2-test', title: 'Week 2 Test', titleUa: 'Тест тижня 2', week: 2, order: 7, duration: '~30 хв', icon: '⭐', isTest: true },
    ],
  },
  {
    number: 3,
    title: 'Auth & Advanced',
    titleUa: 'Автентифікація та просунуті теми',
    icon: '🔐',
    lessons: [
      { id: '13', title: 'Sanctum', titleUa: 'Sanctum автентифікація', week: 3, order: 1, duration: '~55 хв', icon: '🔑' },
      { id: '14', title: 'Policies', titleUa: 'Авторизація — Policies', week: 3, order: 2, duration: '~45 хв', icon: '🛡️' },
      { id: '15', title: 'Middleware', titleUa: 'Middleware', week: 3, order: 3, duration: '~45 хв', icon: '🧥' },
      { id: '16', title: 'Files', titleUa: 'Завантаження файлів', week: 3, order: 4, duration: '~40 хв', icon: '📎' },
      { id: '17', title: 'Events', titleUa: 'Events та Notifications', week: 3, order: 5, duration: '~50 хв', icon: '🔔' },
      { id: '18', title: 'Queues', titleUa: 'Черги та планувальник', week: 3, order: 6, duration: '~50 хв', icon: '⏱️' },
      { id: 'w3-test', title: 'Week 3 Test', titleUa: 'Тест тижня 3', week: 3, order: 7, duration: '~30 хв', icon: '⭐', isTest: true },
    ],
  },
  {
    number: 4,
    title: 'Testing & Integration',
    titleUa: 'Тестування та інтеграція',
    icon: '🎯',
    lessons: [
      { id: '19', title: 'Pest', titleUa: 'Pest feature testing', week: 4, order: 1, duration: '~55 хв', icon: '🧪' },
      { id: '20', title: 'Unit Tests', titleUa: 'Unit tests та mocking', week: 4, order: 2, duration: '~50 хв', icon: '🎭' },
      { id: '21', title: 'Performance', titleUa: 'Оптимізація', week: 4, order: 3, duration: '~45 хв', icon: '⚡' },
      { id: '22', title: 'CORS', titleUa: 'CORS, rate limiting, versioning', week: 4, order: 4, duration: '~40 хв', icon: '🌐' },
      { id: '23', title: 'Vue', titleUa: 'Vue SPA інтеграція', week: 4, order: 5, duration: '~60 хв', icon: '💚' },
      { id: '24', title: 'Deployment', titleUa: 'Деплой та що далі', week: 4, order: 6, duration: '~35 хв', icon: '🚀' },
      { id: 'w4-test', title: 'Final Test', titleUa: 'Фінальний тест', week: 4, order: 7, duration: '~45 хв', icon: '🏆', isTest: true },
    ],
  },
]

export function getAllLessons(): Lesson[] {
  return weeks.flatMap((w) => w.lessons)
}

export function getLessonById(id: string): { lesson: Lesson; week: Week } | undefined {
  for (const week of weeks) {
    const lesson = week.lessons.find((l) => l.id === id)
    if (lesson) return { lesson, week }
  }
  return undefined
}

export function getAdjacentLessons(id: string): { prev: string | null; next: string | null } {
  const all = getAllLessons()
  const index = all.findIndex((l) => l.id === id)

  if (index === -1) return { prev: null, next: null }

  return {
    prev: index > 0 ? all[index - 1].id : null,
    next: index < all.length - 1 ? all[index + 1].id : null,
  }
}
