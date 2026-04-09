import type { Week, Lesson } from '@/types'

export const weeks: Week[] = [
  {
    number: 1,
    title: 'PHP & Laravel Basics',
    titleUa: 'PHP та основи Laravel',
    icon: '\u{1F680}',
    lessons: [
      { id: '01', title: 'PHP Syntax', titleUa: 'PHP-\u0441\u0438\u043D\u0442\u0430\u043A\u0441\u0438\u0441 \u0434\u043B\u044F JS-\u0440\u043E\u0437\u0440\u043E\u0431\u043D\u0438\u043A\u0430', week: 1, order: 1, duration: '~60 \u0445\u0432', icon: '\u{1F4DD}' },
      { id: '02', title: 'PHP OOP', titleUa: 'PHP \u041E\u041E\u041F \u0442\u0430 namespace', week: 1, order: 2, duration: '~60 \u0445\u0432', icon: '\u{1F3D7}\u{FE0F}' },
      { id: '03', title: 'Installation', titleUa: '\u0412\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0442\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430', week: 1, order: 3, duration: '~45 \u0445\u0432', icon: '\u{1F4E6}' },
      { id: '04', title: 'Routing', titleUa: '\u041C\u0430\u0440\u0448\u0440\u0443\u0442\u0438\u0437\u0430\u0446\u0456\u044F \u0442\u0430 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u0435\u0440\u0438', week: 1, order: 4, duration: '~50 \u0445\u0432', icon: '\u{1F6E4}\u{FE0F}' },
      { id: '05', title: 'Migrations', titleUa: '\u041C\u0456\u0433\u0440\u0430\u0446\u0456\u0457 \u0442\u0430 \u0441\u0445\u0435\u043C\u0430 \u0411\u0414', week: 1, order: 5, duration: '~45 \u0445\u0432', icon: '\u{1F5C4}\u{FE0F}' },
      { id: '06', title: 'Eloquent', titleUa: 'Eloquent \u043C\u043E\u0434\u0435\u043B\u0456', week: 1, order: 6, duration: '~55 \u0445\u0432', icon: '\u{1F52E}' },
      { id: 'w1-test', title: 'Week 1 Test', titleUa: '\u0422\u0435\u0441\u0442 \u0442\u0438\u0436\u043D\u044F 1', week: 1, order: 7, duration: '~30 \u0445\u0432', icon: '\u2B50', isTest: true },
    ],
  },
  {
    number: 2,
    title: 'Building the API',
    titleUa: '\u0411\u0443\u0434\u0443\u0454\u043C\u043E API',
    icon: '\u{1F527}',
    lessons: [
      { id: '07', title: 'Relationships', titleUa: 'Eloquent \u0437\u0432\u02BC\u044F\u0437\u043A\u0438', week: 2, order: 1, duration: '~55 \u0445\u0432', icon: '\u{1F517}' },
      { id: '08', title: 'Validation', titleUa: '\u0412\u0430\u043B\u0456\u0434\u0430\u0446\u0456\u044F \u0442\u0430 Form Requests', week: 2, order: 2, duration: '~50 \u0445\u0432', icon: '\u2705' },
      { id: '09', title: 'API Resources', titleUa: 'API Resources', week: 2, order: 3, duration: '~45 \u0445\u0432', icon: '\u{1F4E6}' },
      { id: '10', title: 'Error Handling', titleUa: '\u041E\u0431\u0440\u043E\u0431\u043A\u0430 \u043F\u043E\u043C\u0438\u043B\u043E\u043A', week: 2, order: 4, duration: '~40 \u0445\u0432', icon: '\u{1F6A8}' },
      { id: '11', title: 'Seeders', titleUa: 'Seeders \u0442\u0430 Factories', week: 2, order: 5, duration: '~45 \u0445\u0432', icon: '\u{1F331}' },
      { id: '12', title: 'Scopes', titleUa: 'Scopes, \u0444\u0456\u043B\u044C\u0442\u0440\u0430\u0446\u0456\u044F, \u0441\u043E\u0440\u0442\u0443\u0432\u0430\u043D\u043D\u044F', week: 2, order: 6, duration: '~50 \u0445\u0432', icon: '\u{1F50D}' },
      { id: 'w2-test', title: 'Week 2 Test', titleUa: '\u0422\u0435\u0441\u0442 \u0442\u0438\u0436\u043D\u044F 2', week: 2, order: 7, duration: '~30 \u0445\u0432', icon: '\u2B50', isTest: true },
    ],
  },
  {
    number: 3,
    title: 'Auth & Advanced',
    titleUa: '\u0410\u0432\u0442\u0435\u043D\u0442\u0438\u0444\u0456\u043A\u0430\u0446\u0456\u044F \u0442\u0430 \u043F\u0440\u043E\u0441\u0443\u043D\u0443\u0442\u0456 \u0442\u0435\u043C\u0438',
    icon: '\u{1F510}',
    lessons: [
      { id: '13', title: 'Sanctum', titleUa: 'Sanctum \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0456\u043A\u0430\u0446\u0456\u044F', week: 3, order: 1, duration: '~55 \u0445\u0432', icon: '\u{1F511}' },
      { id: '14', title: 'Policies', titleUa: '\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0456\u044F \u2014 Policies', week: 3, order: 2, duration: '~45 \u0445\u0432', icon: '\u{1F6E1}\u{FE0F}' },
      { id: '15', title: 'Middleware', titleUa: 'Middleware', week: 3, order: 3, duration: '~45 \u0445\u0432', icon: '\u{1F9C5}' },
      { id: '16', title: 'Files', titleUa: '\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0444\u0430\u0439\u043B\u0456\u0432', week: 3, order: 4, duration: '~40 \u0445\u0432', icon: '\u{1F4CE}' },
      { id: '17', title: 'Events', titleUa: 'Events \u0442\u0430 Notifications', week: 3, order: 5, duration: '~50 \u0445\u0432', icon: '\u{1F514}' },
      { id: '18', title: 'Queues', titleUa: '\u0427\u0435\u0440\u0433\u0438 \u0442\u0430 \u043F\u043B\u0430\u043D\u0443\u0432\u0430\u043B\u044C\u043D\u0438\u043A', week: 3, order: 6, duration: '~50 \u0445\u0432', icon: '\u23F1\u{FE0F}' },
      { id: 'w3-test', title: 'Week 3 Test', titleUa: '\u0422\u0435\u0441\u0442 \u0442\u0438\u0436\u043D\u044F 3', week: 3, order: 7, duration: '~30 \u0445\u0432', icon: '\u2B50', isTest: true },
    ],
  },
  {
    number: 4,
    title: 'Testing & Integration',
    titleUa: '\u0422\u0435\u0441\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0442\u0430 \u0456\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0456\u044F',
    icon: '\u{1F3AF}',
    lessons: [
      { id: '19', title: 'Pest', titleUa: 'Pest feature testing', week: 4, order: 1, duration: '~55 \u0445\u0432', icon: '\u{1F9EA}' },
      { id: '20', title: 'Unit Tests', titleUa: 'Unit tests \u0442\u0430 mocking', week: 4, order: 2, duration: '~50 \u0445\u0432', icon: '\u{1F3AD}' },
      { id: '21', title: 'Performance', titleUa: '\u041E\u043F\u0442\u0438\u043C\u0456\u0437\u0430\u0446\u0456\u044F', week: 4, order: 3, duration: '~45 \u0445\u0432', icon: '\u26A1' },
      { id: '22', title: 'CORS', titleUa: 'CORS, rate limiting, versioning', week: 4, order: 4, duration: '~40 \u0445\u0432', icon: '\u{1F310}' },
      { id: '23', title: 'Vue', titleUa: 'Vue SPA \u0456\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0456\u044F', week: 4, order: 5, duration: '~60 \u0445\u0432', icon: '\u{1F49A}' },
      { id: '24', title: 'Deployment', titleUa: '\u0414\u0435\u043F\u043B\u043E\u0439 \u0442\u0430 \u0449\u043E \u0434\u0430\u043B\u0456', week: 4, order: 6, duration: '~35 \u0445\u0432', icon: '\u{1F680}' },
      { id: 'w4-test', title: 'Final Test', titleUa: '\u0424\u0456\u043D\u0430\u043B\u044C\u043D\u0438\u0439 \u0442\u0435\u0441\u0442', week: 4, order: 7, duration: '~45 \u0445\u0432', icon: '\u{1F3C6}', isTest: true },
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
