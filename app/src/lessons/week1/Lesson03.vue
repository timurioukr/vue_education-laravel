<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion } from '@/types'

defineProps<{
  activeTab: string
}>()

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Яка команда створює новий Laravel-проєкт?',
    options: [
      'npm create laravel@latest',
      'composer create-project laravel/laravel',
      'laravel init my-project',
      'php artisan new project',
    ],
    correct: 1,
    explanation:
      'Команда composer create-project laravel/laravel my-project завантажує Laravel з Packagist та створює повну структуру проєкту. Це аналог npm create vue@latest для Vue.',
  },
  {
    question: 'Яка директорія Laravel є аналогом node_modules/?',
    options: [
      'storage/',
      'vendor/',
      'packages/',
      'lib/',
    ],
    correct: 1,
    explanation:
      'vendor/ -- це директорія, куди Composer встановлює всі залежності. Вона працює так само, як node_modules/ в npm/pnpm, і теж не комітиться в git.',
  },
  {
    question: 'Що робить команда php artisan migrate?',
    options: [
      'Переносить файли між директоріями',
      'Застосовує зміни структури бази даних',
      'Мігрує проєкт на нову версію Laravel',
      'Копіює конфігурацію',
    ],
    correct: 1,
    explanation:
      'php artisan migrate застосовує міграції -- PHP-файли, які описують зміни структури бази даних (створення таблиць, додавання колонок). Це як "git для бази даних".',
  },
  {
    question: 'Який файл є точкою входу для Laravel-додатку?',
    options: [
      'app/index.php',
      'public/index.php',
      'bootstrap/app.php',
      'artisan',
    ],
    correct: 1,
    explanation:
      'public/index.php -- це точка входу для всіх HTTP-запитів. Веб-сервер направляє запити на цей файл, який завантажує фреймворк через bootstrap/app.php.',
  },
  {
    question: 'Де в Laravel описуються API-маршрути?',
    options: [
      'app/Http/routes.php',
      'routes/api.php',
      'config/routes.php',
      'bootstrap/routes.php',
    ],
    correct: 1,
    explanation:
      'routes/api.php -- файл для API-маршрутів (JSON). routes/web.php -- для веб-сторінок (HTML). Це аналог router/index.ts у Vue Router, але розділений за типом.',
  },
]

const installCommands = `# Створити проєкт
composer create-project laravel/laravel task-manager

# Перейти в директорію
cd task-manager

# Перевірити версію
php artisan --version

# Створити файл SQLite
touch database/database.sqlite

# Запустити міграції
php artisan migrate

# Запустити dev-сервер
php artisan serve`

const vueInstall = `# Vue проєкт
npm create vue@latest my-app
cd my-app
npm install
npm run dev`

const laravelInstall = `# Laravel проєкт
composer create-project laravel/laravel task-manager
cd task-manager
touch database/database.sqlite
php artisan migrate
php artisan serve`

const artisanCommands = `# Генерація коду
php artisan make:controller TaskController
php artisan make:model Task -mfsc
php artisan make:migration create_tasks_table

# Управління БД
php artisan migrate
php artisan migrate:status
php artisan migrate:fresh --seed

# Дебаг
php artisan route:list
php artisan about
php artisan tinker

# Кеш
php artisan optimize:clear`

const envComparison = `# Vue / Nuxt .env
VITE_API_URL=http://localhost:8000/api
# Доступ: import.meta.env.VITE_API_URL`

const envLaravel = `# Laravel .env
APP_NAME="Task Manager"
APP_ENV=local
APP_DEBUG=true
DB_CONNECTION=sqlite
# Доступ: config('app.name')`

const installOutput = [
  '$ composer create-project laravel/laravel task-manager',
  'Creating a "laravel/laravel" project at "./task-manager"',
  'Installing laravel/laravel (v12.x.x)',
  '  - Installing laravel/laravel: Extracting archive',
  'Created project in /path/to/task-manager',
  '',
  '   INFO  Application key set successfully.',
  '',
  '$ cd task-manager && php artisan --version',
  'Laravel Framework 12.x.x',
]

const migrateOutput = [
  '$ php artisan migrate',
  '',
  '   INFO  Preparing database.',
  '',
  '  Creating migration table .................. DONE',
  '',
  '   INFO  Running migrations.',
  '',
  '  0001_01_01_000000_create_users_table ..... DONE',
  '  0001_01_01_000001_create_cache_table ..... DONE',
  '  0001_01_01_000002_create_jobs_table ...... DONE',
]

const serveOutput = [
  '$ php artisan serve',
  '',
  '   INFO  Server running on [http://127.0.0.1:8000].',
  '',
  '  Press Ctrl+C to stop the server',
]
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="npm create vue@latest" to="composer create-project laravel/laravel" />

      <TheoryBlock title="Встановлення: Vue vs Laravel">
        <p>
          Як <code>npm create vue@latest</code> створює Vue-проєкт з готовою структурою, так
          <code>composer create-project laravel/laravel</code> створює Laravel-проєкт. Composer --
          це менеджер пакетів PHP, аналог npm/pnpm.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="vueInstall"
        :php="laravelInstall"
        js-title="Vue/Nuxt"
        php-title="Laravel"
      />

      <TheoryBlock title="Структура директорій">
        <p>
          В Laravel кожна директорія має чітку роль. Ось найважливіші паралелі з Vue/Nuxt:
        </p>
        <ul>
          <li><strong>app/</strong> = <strong>src/</strong> -- основний код застосунку</li>
          <li><strong>app/Models/</strong> = <strong>stores/</strong> (Pinia) -- робота з даними та БД</li>
          <li><strong>app/Http/Controllers/</strong> = <strong>pages/</strong> -- логіка обробки запитів</li>
          <li><strong>routes/</strong> = <strong>router/index.ts</strong> -- маршрутизація</li>
          <li><strong>config/</strong> = <strong>nuxt.config.ts</strong> -- але кожен аспект в окремому файлі</li>
          <li><strong>vendor/</strong> = <strong>node_modules/</strong> -- залежності, не комітити в git</li>
          <li><strong>database/migrations/</strong> -- "git для бази даних", немає аналога у фронтенді</li>
        </ul>
      </TheoryBlock>

      <TheoryBlock title="Файл .env">
        <p>
          В Vue <code>.env</code> містить кілька змінних з <code>VITE_</code> префіксом. В Laravel <code>.env</code>
          містить ВСЮ конфігурацію середовища: базу даних, поштові налаштування, кешування, чергу тощо.
        </p>
        <p>
          <strong>Важливо:</strong> В Laravel не можна використовувати <code>env()</code> напряму в коді --
          тільки в файлах <code>config/</code>. В решті коду використовуйте <code>config('app.name')</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="envComparison"
        :php="envLaravel"
        js-title="Vue .env"
        php-title="Laravel .env"
      />

      <TheoryBlock title="Artisan CLI">
        <p>
          <code>php artisan</code> -- це універсальний CLI-інструмент Laravel. Аналог <code>npm run</code> +
          <code>npx nuxi</code>, але значно потужніший. Генерація коду, управління БД, дебаг -- все через artisan.
        </p>
      </TheoryBlock>

      <CodeBlock :code="artisanCommands" lang="bash" :terminal="true" title="Основні artisan-команди" />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: встановлення Laravel">
        <p>Крок за кроком встановимо Laravel та перевіримо, що все працює.</p>
        <ol>
          <li>Переконайтесь, що PHP 8.2+ та Composer встановлені</li>
          <li>Створіть проєкт: <code>composer create-project laravel/laravel task-manager</code></li>
          <li>Налаштуйте <code>.env</code>: <code>DB_CONNECTION=sqlite</code></li>
          <li>Створіть файл бази: <code>touch database/database.sqlite</code></li>
          <li>Запустіть міграції: <code>php artisan migrate</code></li>
          <li>Запустіть сервер: <code>php artisan serve</code></li>
          <li>Відкрийте <code>http://localhost:8000</code> в браузері</li>
          <li>Спробуйте <code>php artisan about</code> та <code>php artisan tinker</code></li>
        </ol>
      </TheoryBlock>

      <CodeBlock :code="installCommands" lang="bash" :terminal="true" title="Команди встановлення" />

      <TerminalOutput :lines="installOutput" title="Створення проєкту" />

      <TerminalOutput :lines="migrateOutput" title="Запуск міграцій" />

      <TerminalOutput :lines="serveOutput" title="Запуск dev-сервера" />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="1-3" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: дослідження структури">
        <p>Після встановлення Laravel виконайте наступні завдання для знайомства зі структурою проєкту:</p>
        <ol>
          <li>
            Відкрийте <code>routes/web.php</code> -- знайдіть маршрут для головної сторінки.
            Яку функцію він виконує?
          </li>
          <li>
            Виконайте <code>php artisan route:list</code> -- скільки маршрутів є за замовчуванням?
          </li>
          <li>
            Відкрийте <code>config/app.php</code> -- змініть <code>timezone</code> на
            <code>Europe/Kyiv</code> та <code>locale</code> на <code>uk</code>
          </li>
          <li>
            Запустіть <code>php artisan tinker</code> та виконайте:
            <code>config('app.name')</code>, <code>config('database.default')</code>,
            <code>\App\Models\User::count()</code>
          </li>
          <li>
            Створіть контролер: <code>php artisan make:controller TaskController</code>.
            Знайдіть згенерований файл та відкрийте його
          </li>
        </ol>
      </TheoryBlock>

      <CodeBlock
        code="# Перевірте конфігурацію
php artisan about

# Подивіться маршрути
php artisan route:list

# Створіть контролер
php artisan make:controller TaskController

# Запустіть tinker
php artisan tinker
> config('app.name')
> config('database.default')
> \App\Models\User::count()
> exit"
        lang="bash"
        :terminal="true"
        title="Команди для завдання"
      />
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
</style>
