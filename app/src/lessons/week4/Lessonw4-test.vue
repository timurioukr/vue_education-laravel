<script setup lang="ts">
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion } from '@/types'

defineProps<{
  activeTab: string
}>()

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Яка різниця між == та === в PHP?',
    options: [
      'Немає різниці, обидва порівнюють за значенням і типом',
      '== порівнює з приведенням типів, === порівнює строго (значення + тип)',
      '=== працює тільки з обʼєктами',
      '== працює тільки з рядками',
    ],
    correct: 1,
    explanation:
      '== робить type juggling ("1" == 1 → true), === порівнює і значення, і тип ("1" === 1 → false). У JavaScript працює так само.',
  },
  {
    question: 'Що таке trait в PHP і який його аналог у Vue?',
    options: [
      'Trait — це клас, аналог Vue component',
      'Trait — це інтерфейс, аналог TypeScript interface',
      'Trait — набір методів для повторного використання в класах, аналог Vue composable',
      'Trait — це namespace, аналог ES module',
    ],
    correct: 2,
    explanation:
      'Trait — механізм повторного використання коду в кількох класах без наслідування. Як Vue composable (useSomething()), який можна підключити в різних компонентах.',
  },
  {
    question: 'Який директорії Laravel відповідає node_modules/ у Vue-проєкті?',
    options: ['app/', 'storage/', 'vendor/', 'bootstrap/'],
    correct: 2,
    explanation:
      'vendor/ — директорія, куди Composer встановлює залежності, аналогічно node_modules/ для npm.',
  },
  {
    question: 'Що робить команда php artisan tinker?',
    options: [
      'Запускає тести',
      'Запускає інтерактивну REPL-консоль для виконання PHP-коду з доступом до всіх моделей',
      'Створює нового користувача',
      'Показує список маршрутів',
    ],
    correct: 1,
    explanation:
      'Tinker — інтерактивна консоль (REPL), де можна виконувати будь-який PHP-код: створювати моделі, тестувати запити. Аналог DevTools Console для бекенду.',
  },
  {
    question: 'Що генерує Route::apiResource("tasks", TaskController::class)?',
    options: [
      'Тільки GET /api/tasks',
      '5 маршрутів: index, store, show, update, destroy',
      '7 маршрутів: index, create, store, show, edit, update, destroy',
      '3 маршрути: index, store, destroy',
    ],
    correct: 1,
    explanation:
      'apiResource генерує 5 маршрутів: GET (index), POST (store), GET/{id} (show), PUT/{id} (update), DELETE/{id} (destroy). На відміну від resource, не створює create та edit (вони для HTML-форм).',
  },
  {
    question: 'Який HTTP-метод використовується для оновлення ресурсу?',
    options: ['POST', 'GET', 'PUT або PATCH', 'DELETE'],
    correct: 2,
    explanation:
      'PUT замінює весь ресурс, PATCH оновлює частково. Laravel приймає обидва для update. У REST API зазвичай використовують PUT.',
  },
  {
    question: 'Що робить php artisan migrate:fresh?',
    options: [
      'Створює нову міграцію',
      'Відкочує останню міграцію',
      'Видаляє ВСІ таблиці та запускає всі міграції з нуля',
      'Показує статус міграцій',
    ],
    correct: 2,
    explanation:
      'migrate:fresh — ядерний варіант: DROP ALL TABLES + запуск всіх міграцій з нуля. Корисно для розробки, НІКОЛИ для production.',
  },
  {
    question: 'Для чого потрібен $fillable в Eloquent моделі?',
    options: [
      'Вказує, які поля показувати в JSON',
      'Визначає білий список полів, дозволених для масового присвоєння (mass assignment)',
      'Визначає типи полів для cast',
      'Вказує обовʼязкові поля при створенні',
    ],
    correct: 1,
    explanation:
      '$fillable захищає від mass assignment — атаки, коли зловмисник передає is_admin=true у запиті. Тільки поля з $fillable дозволені у create() та update().',
  },
  {
    question: 'Що робить Task::with("category")->get()?',
    options: [
      'Створює задачу з категорією',
      'Фільтрує задачі, що мають категорію',
      'Завантажує задачі з eager loading категорій (один запит замість N+1)',
      'Видаляє задачі без категорії',
    ],
    correct: 2,
    explanation:
      'with() — eager loading: один SQL-запит для задач + один для категорій. Без нього кожен $task->category робить окремий запит (N+1 проблема).',
  },
  {
    question: 'Яку relationship використати, якщо одна категорія має багато задач?',
    options: [
      'hasOne у Category',
      'hasMany у Category + belongsTo у Task',
      'belongsToMany в обох',
      'morphMany у Category',
    ],
    correct: 1,
    explanation:
      'Category hasMany Tasks (одна категорія → багато задач), Task belongsTo Category (задача належить одній категорії). Це one-to-many звʼязок.',
  },
  {
    question: 'Що таке N+1 проблема?',
    options: [
      'Помилка, коли модель не знайдена',
      'Проблема, коли для N записів виконується 1 запит для списку + N окремих запитів для звʼязків',
      'Обмеження на кількість записів у таблиці',
      'Конфлікт між двома міграціями',
    ],
    correct: 1,
    explanation:
      'N+1: 1 запит для списку + N запитів для кожного звʼязку. Наприклад, 100 задач = 1 (tasks) + 100 (category для кожної) = 101 запит замість 2 з eager loading.',
  },
  {
    question: 'Який HTTP-статус Laravel повертає при невдалій валідації API-запиту?',
    options: [
      '400 Bad Request',
      '401 Unauthorized',
      '422 Unprocessable Entity',
      '500 Internal Server Error',
    ],
    correct: 2,
    explanation:
      '422 Unprocessable Entity — стандарт для "дані отримано, але вони не валідні". Laravel автоматично повертає 422 з {message, errors} для API-запитів.',
  },
  {
    question: 'Що робить метод authorize() у Form Request?',
    options: [
      'Валідує дані',
      'Повертає true/false — чи дозволено користувачу виконувати цей запит',
      'Створює токен аутентифікації',
      'Перенаправляє на сторінку логіну',
    ],
    correct: 1,
    explanation:
      'authorize() — перевірка авторизації ДО валідації. true → запит обробляється, false → 403 Forbidden. Аналог route guard перед обробкою форми.',
  },
  {
    question: 'Навіщо використовувати API Resources замість повернення моделі напряму?',
    options: [
      'Для кращої швидкості запитів',
      'Для контролю над JSON-відповіддю: які поля, формат, вкладені ресурси',
      'Для автоматичної валідації',
      'Для кешування відповідей',
    ],
    correct: 1,
    explanation:
      'API Resource — transformation layer між моделлю та JSON. Контролюєте які поля повертати, формат, вкладені ресурси. Модель напряму може leak internal fields.',
  },
  {
    question: 'Що робить $this->whenLoaded("category") у Resource?',
    options: [
      'Завжди включає категорію',
      'Включає категорію тільки якщо вона була eager loaded, уникає N+1',
      'Перевіряє чи категорія існує в БД',
      'Завантажує категорію з кешу',
    ],
    correct: 1,
    explanation:
      'whenLoaded() включає звʼязок тільки якщо він був eager loaded через with(). Запобігає випадковому N+1 та дозволяє один Resource для різних endpoints.',
  },
  {
    question: 'Як Sanctum зберігає токени?',
    options: [
      'У cookies браузера',
      'У таблиці personal_access_tokens у базі даних',
      'У Redis',
      'У .env файлі',
    ],
    correct: 1,
    explanation:
      'Sanctum зберігає хеш токена у таблиці personal_access_tokens. При кожному запиті Laravel хешує переданий Bearer token і порівнює з базою.',
  },
  {
    question: 'Що поверне захищений auth:sanctum маршрут без Bearer-токена?',
    options: ['200 з порожніми даними', '403 Forbidden', '401 Unauthorized', '404 Not Found'],
    correct: 2,
    explanation:
      '401 Unauthorized — "ви не аутентифіковані". 403 — "ви аутентифіковані, але не маєте доступу". Без токена = не аутентифікований = 401.',
  },
  {
    question: 'Яка різниця між Gate та Policy?',
    options: [
      'Gate для моделей, Policy для глобальних перевірок',
      'Gate — простий closure для перевірки, Policy — клас з методами для CRUD конкретної моделі',
      'Gate для аутентифікації, Policy для авторизації',
      'Немає різниці, це синоніми',
    ],
    correct: 1,
    explanation:
      'Gate — простий closure для глобальних перевірок (Gate::define("admin", ...)). Policy — клас з методами viewAny/view/create/update/delete для конкретної моделі.',
  },
  {
    question:
      'Що поверне $this->authorize("update", $task) якщо TaskPolicy::update() повертає false?',
    options: [
      'null',
      'false',
      'Кине AuthorizationException → Laravel поверне 403 Forbidden',
      'Перенаправить на логін',
    ],
    correct: 2,
    explanation:
      'authorize() кидає AuthorizationException якщо Policy повертає false. Laravel ловить це виключення і повертає 403 Forbidden клієнту.',
  },
  {
    question: 'У якому порядку виконуються middleware?',
    options: [
      'Випадковому',
      'Спочатку глобальні, потім групові, потім route-specific — як onion (цибулина)',
      'Тільки route-specific middleware',
      'Middleware не мають порядку',
    ],
    correct: 1,
    explanation:
      'Middleware виконуються як onion: Global → Group → Route-specific. Запит проходить "всередину", відповідь — "назовні". Порядок важливий для auth, CORS, logging.',
  },
  {
    question: 'Що робить RefreshDatabase trait у Pest-тесті?',
    options: [
      'Запускає міграції один раз перед усіма тестами',
      'Скидає базу даних перед КОЖНИМ тестом (транзакцією), щоб тести були ізольовані',
      'Видаляє тестову базу після тестів',
      'Створює нову базу для кожного тестового файлу',
    ],
    correct: 1,
    explanation:
      'RefreshDatabase загортає кожен тест у транзакцію, яка відкочується після тесту. Тести ізольовані один від одного. Аналог beforeEach(() => store.$reset()).',
  },
  {
    question: 'Що робить Event::fake() у тесті?',
    options: [
      'Створює фейковий event',
      'Перехоплює всі events — вони не диспатчаться реально, але можна перевірити, що вони були викликані',
      'Видаляє всі event listeners',
      'Створює mock event listener',
    ],
    correct: 1,
    explanation:
      'Event::fake() перехоплює dispatch — events не виконують listeners, але можна assert: Event::assertDispatched(TaskCompleted::class). Як vi.fn() у Vitest.',
  },
  {
    question: 'Що робить Cache::remember("key", 300, fn() => $query)?',
    options: [
      'Завжди виконує $query',
      'Повертає кешоване значення якщо є, інакше виконує $query, кешує на 300 секунд, повертає',
      'Зберігає $query у кеш назавжди',
      'Видаляє кеш через 300 секунд',
    ],
    correct: 1,
    explanation:
      'remember() — "запамʼятай": перевіряє кеш, якщо є — повертає, якщо ні — виконує closure, зберігає результат на 300 сек, повертає. Як useMemoize з TTL.',
  },
  {
    question: 'Чому APP_DEBUG=false обовʼязковий у production?',
    options: [
      'Для кращої швидкості',
      'Тому що з true Laravel показує stack traces, шляхи до файлів, SQL-запити — серйозна вразливість безпеки',
      'Тому що debug-mode використовує більше памʼяті',
      'Щоб не логувати помилки',
    ],
    correct: 1,
    explanation:
      'APP_DEBUG=true відкриває stack traces, шляхи файлів, SQL-запити, env variables. Зловмисник бачить внутрішню структуру додатку. У production завжди false.',
  },
  {
    question: 'Що робить php artisan optimize перед deployment?',
    options: [
      'Видаляє непотрібні файли',
      'Кешує конфігурацію, маршрути та views для швидшого завантаження (як npm run build)',
      'Оновлює залежності',
      'Запускає тести',
    ],
    correct: 1,
    explanation:
      'optimize кешує config (один файл замість десятків), routes (серіалізований масив), views (pre-compiled), events. Прискорює завантаження. Як npm run build для бекенду.',
  },
]

const setupCode = `# Підготовка
php artisan migrate:fresh --seed

# Запустіть сервери
php artisan serve &                              # Laravel на :8000
cd ../task-manager-frontend && npm run dev &    # Vue на :5173`

const authCode = `# Зареєструйте User A
curl -s -X POST http://localhost:8000/api/register \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Alice","email":"alice@test.com","password":"password123","password_confirmation":"password123"}' | jq .

# Збережіть токен у змінну
TOKEN_A="<token з відповіді>"

# Зареєструйте User B
curl -s -X POST http://localhost:8000/api/register \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Bob","email":"bob@test.com","password":"password123","password_confirmation":"password123"}' | jq .

TOKEN_B="<token з відповіді>"

# Очікувано: обидва запити → 201 з {user, token}`

const crudCode = `# Створіть категорію
curl -s -X POST http://localhost:8000/api/categories \\
  -H "Authorization: Bearer $TOKEN_A" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Work","color":"#3498db"}' | jq .

CATEGORY_ID="<id з відповіді>"

# Створіть валідну задачу
curl -s -X POST http://localhost:8000/api/tasks \\
  -H "Authorization: Bearer $TOKEN_A" \\
  -H "Content-Type: application/json" \\
  -d "{\\"title\\":\\"Complete Laravel course\\",\\"status\\":\\"pending\\",\\"priority\\":\\"medium\\",\\"category_id\\":$CATEGORY_ID}" | jq .

# Спробуйте невалідний (без title) → 422
curl -s -X POST http://localhost:8000/api/tasks \\
  -H "Authorization: Bearer $TOKEN_A" \\
  -H "Content-Type: application/json" \\
  -d '{"description":"No title"}' | jq .`

const authzCode = `# User B пробує оновити задачу User A → 403 Forbidden
curl -s -X PUT http://localhost:8000/api/tasks/$TASK_ID \\
  -H "Authorization: Bearer $TOKEN_B" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Hacked!"}' | jq .

# Очікувано: {"message":"This action is unauthorized."}`

const filterCode = `# Фільтр по статусу
curl -s "http://localhost:8000/api/tasks?status=pending" \\
  -H "Authorization: Bearer $TOKEN_A" | jq '.data | length'

# Пошук
curl -s "http://localhost:8000/api/tasks?search=Laravel" \\
  -H "Authorization: Bearer $TOKEN_A" | jq '.data[].title'

# Сортування + пагінація
curl -s "http://localhost:8000/api/tasks?sort=deadline&order=asc&page=1&per_page=5" \\
  -H "Authorization: Bearer $TOKEN_A" | jq '.meta'`

const notifyCode = `# Оновлення статусу на "done" → автоматично створює notification
curl -s -X PUT http://localhost:8000/api/tasks/$TASK_ID \\
  -H "Authorization: Bearer $TOKEN_A" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"done"}' | jq .

# Перевірте notifications
curl -s http://localhost:8000/api/notifications \\
  -H "Authorization: Bearer $TOKEN_A" | jq .

# Позначте як прочитану
curl -s -X PATCH http://localhost:8000/api/notifications/$NOTIF_ID/read \\
  -H "Authorization: Bearer $TOKEN_A" | jq .`

const testsCode = `# Запустіть всі тести
php artisan test

# Очікувано: 30+ тестів, всі зелені
# Tests:  XX passed
# Assertions: XX

# Покриття (опціонально)
php artisan test --coverage`

const checklistItems = [
  'Два користувачі з окремими даними',
  'Повний CRUD задач з валідацією',
  'Повний CRUD категорій з валідацією',
  'Фільтрація, сортування, пошук',
  'Пагінація через API Resources',
  'Завантаження файлів',
  'Нотифікації при зміні статусу',
  '30+ Pest тестів проходять',
  'Немає N+1 запитів',
  'Rate limiting працює',
  'API Resources (не raw models)',
  'Vue SPA повністю функціональний',
]

const juniorSkills = [
  'Створити Laravel-проєкт та налаштувати базу',
  'Написати міграції та Eloquent-моделі',
  'Створити CRUD API з контролерами',
  'Додати валідацію з Form Requests',
  'Налаштувати аутентифікацію через Sanctum',
  'Написати базові Pest-тести',
]

const midSkills = [
  'Розумієте та вирішуєте N+1 проблему',
  'Використовуєте Policies для авторизації',
  'Пишете Custom Middleware',
  'Працюєте з чергами та jobs',
  'Маєте 50+ тестів з хорошим покриттям',
  'Розумієте кешування та оптимізацію',
]

const seniorSkills = [
  'Real-time з Laravel Reverb + Echo + Vue',
  'Microservices та API Gateway',
  'CI/CD з GitHub Actions',
  'Docker для розробки та деплою',
  'Horizon для моніторингу черг',
  'Multi-tenancy (SaaS architecture)',
  'GraphQL з Lighthouse',
  'Performance profiling з Telescope',
]

const nextProjects = [
  {
    title: 'Chat Application',
    desc: 'Laravel Reverb + Echo + Vue для real-time messaging. Вивчите WebSockets.',
  },
  {
    title: 'E-commerce API',
    desc: 'Товари, кошик, замовлення, платежі (Stripe). Складніші бізнес-правила.',
  },
  {
    title: 'Blog з CMS',
    desc: 'Адмін-панель (Filament), SEO, markdown editor.',
  },
  {
    title: 'Multi-tenant SaaS',
    desc: 'Кілька організацій на одному додатку (stancl/tenancy).',
  },
  {
    title: 'REST → GraphQL',
    desc: 'Перепишіть Task Manager API на GraphQL з Lighthouse.',
  },
]

const resources = [
  { label: 'Laravel Docs', url: 'https://laravel.com/docs' },
  { label: 'Laracasts', url: 'https://laracasts.com' },
  { label: 'Laravel News', url: 'https://laravel-news.com' },
  { label: 'Laravel Daily', url: 'https://laraveldaily.com' },
  { label: 'Roadmap', url: 'https://roadmap.sh/laravel' },
]
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <TheoryBlock title="🏆 Фінальний тест курсу">
        <p>
          Це підсумковий тест, що покриває <strong>всі 4 тижні</strong> курсу. Він складається з
          трьох частин:
        </p>
        <ul class="intro-list">
          <li>
            <strong>Теоретичний тест</strong> — 25 питань на вкладці <em>Квіз</em> (PHP, Laravel
            structure, routing, Eloquent, validation, auth, testing, deployment).
          </li>
          <li>
            <strong>Практичне завдання</strong> — повна перевірка вашого Task Manager на вкладці
            <em>Практика</em> (curl-сценарії на 9 секцій + чеклист на 12 пунктів).
          </li>
          <li>
            <strong>Самооцінка та roadmap</strong> — три рівні (Junior / Mid / Senior) і наступні
            проєкти на вкладці <em>Завдання</em>.
          </li>
        </ul>
        <p>
          Прохідний поріг — <strong>20+ правильних відповідей з 25</strong> (80%) у квізі та всі 12
          пунктів практичного чеклиста.
        </p>
      </TheoryBlock>

      <TheoryBlock title="Що покриває тест">
        <div class="topics-grid">
          <div class="topic-card">
            <span class="topic-week">Тиждень 1</span>
            <span class="topic-title">PHP, Laravel basics</span>
            <span class="topic-desc">Routing, Migrations, Eloquent</span>
          </div>
          <div class="topic-card">
            <span class="topic-week">Тиждень 2</span>
            <span class="topic-title">API Building</span>
            <span class="topic-desc">Validation, Resources, Scopes, N+1</span>
          </div>
          <div class="topic-card">
            <span class="topic-week">Тиждень 3</span>
            <span class="topic-title">Auth & Advanced</span>
            <span class="topic-desc">Sanctum, Policies, Middleware, Events</span>
          </div>
          <div class="topic-card">
            <span class="topic-week">Тиждень 4</span>
            <span class="topic-title">Testing & Deploy</span>
            <span class="topic-desc">Pest, Performance, Vue SPA, Production</span>
          </div>
        </div>
      </TheoryBlock>
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="2.1 Підготовка">
        <p>Скиньте базу та заповніть тестовими даними, потім запустіть Laravel і Vue паралельно.</p>
      </TheoryBlock>
      <CodeBlock :code="setupCode" lang="bash" title="Setup" />

      <TheoryBlock title="2.2 Аутентифікація — два користувачі">
        <p>Зареєструйте User A та User B, збережіть токени у змінні.</p>
      </TheoryBlock>
      <CodeBlock :code="authCode" lang="bash" title="Register two users" />

      <TheoryBlock title="2.3 CRUD з валідацією (User A)">
        <p>Створіть категорію, валідну задачу, спробуйте невалідний запит — очікуйте 422.</p>
      </TheoryBlock>
      <CodeBlock :code="crudCode" lang="bash" title="CRUD + validation" />

      <TheoryBlock title="2.4 Авторизація (cross-user)">
        <p>User B не повинен мати доступу до задач User A — Policy має повернути 403.</p>
      </TheoryBlock>
      <CodeBlock :code="authzCode" lang="bash" title="Authorization check" />

      <TheoryBlock title="2.5 Фільтрація, сортування, пошук, пагінація">
        <p>Перевірте scopes з Уроку 12 та pagination з Уроку 9.</p>
      </TheoryBlock>
      <CodeBlock :code="filterCode" lang="bash" title="Query filters" />

      <TheoryBlock title="2.6 Нотифікації">
        <p>
          Оновлення статусу на <code>done</code> має автоматично створити notification через
          Observer / Event з Уроку 17.
        </p>
      </TheoryBlock>
      <CodeBlock :code="notifyCode" lang="bash" title="Notifications" />

      <TheoryBlock title="2.7 Тести">
        <p>Усі Pest-тести з Уроків 19-20 мають бути зеленими, мінімум 30 штук.</p>
      </TheoryBlock>
      <CodeBlock :code="testsCode" lang="bash" title="Run tests" />

      <TheoryBlock title="Фінальний чеклист — 12 пунктів">
        <ul class="checklist">
          <li v-for="(item, i) in checklistItems" :key="i">
            <span class="check-num">{{ i + 1 }}</span>
            <span class="check-text">{{ item }}</span>
          </li>
        </ul>
      </TheoryBlock>
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="w4-test" />
    </div>

    <div v-show="activeTab === 'tasks'" class="tab-content">
      <TheoryBlock title="🎓 Junior Laravel Developer">
        <p>Ви на цьому рівні, якщо можете:</p>
        <ul class="skill-list skill-list--junior">
          <li v-for="(skill, i) in juniorSkills" :key="i">{{ skill }}</li>
        </ul>
      </TheoryBlock>

      <TheoryBlock title="🚀 Mid-Level Laravel Developer">
        <p>Ви на цьому рівні, якщо додатково:</p>
        <ul class="skill-list skill-list--mid">
          <li v-for="(skill, i) in midSkills" :key="i">{{ skill }}</li>
        </ul>
      </TheoryBlock>

      <TheoryBlock title="⭐ Senior Laravel Developer">
        <p>Наступні кроки для досягнення:</p>
        <ul class="skill-list skill-list--senior">
          <li v-for="(skill, i) in seniorSkills" :key="i">{{ skill }}</li>
        </ul>
      </TheoryBlock>

      <TheoryBlock title="Наступні проєкти">
        <ol class="projects-list">
          <li v-for="(p, i) in nextProjects" :key="i">
            <strong>{{ p.title }}</strong> — {{ p.desc }}
          </li>
        </ol>
      </TheoryBlock>

      <TheoryBlock title="Корисні ресурси">
        <ul class="resources-list">
          <li v-for="r in resources" :key="r.url">
            <a :href="r.url" target="_blank" rel="noopener noreferrer">{{ r.label }}</a>
          </li>
        </ul>
      </TheoryBlock>
    </div>
  </div>
</template>

<style scoped>
.lesson-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.intro-list {
  margin: 12px 0 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.topic-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--bg-elevated, #f7f8fa);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.topic-week {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.topic-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.topic-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.checklist {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checklist li {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-elevated, #f7f8fa);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.check-num {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.check-text {
  font-size: 14px;
  color: var(--text-primary);
}

.skill-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-list li {
  position: relative;
  padding: 8px 12px 8px 32px;
  background: var(--bg-elevated, #f7f8fa);
  border-radius: var(--radius-sm);
  font-size: 14px;
}

.skill-list li::before {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.skill-list--junior li::before {
  content: '✅';
}

.skill-list--mid li::before {
  content: '🔄';
}

.skill-list--senior li::before {
  content: '🎯';
}

.projects-list {
  margin: 12px 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.resources-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.resources-list a {
  display: inline-block;
  padding: 8px 14px;
  background: var(--bg-elevated, #f7f8fa);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.resources-list a:hover {
  background: var(--primary-light, #eef2ff);
  border-color: var(--primary);
}
</style>
