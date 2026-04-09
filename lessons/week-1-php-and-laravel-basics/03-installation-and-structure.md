# Урок 3: Встановлення Laravel та структура проєкту

## Що ви вивчите

- Передумови: PHP 8.2+, Composer, SQLite
- Встановлення Laravel 12
- Структура директорій проєкту -- кожна папка зіставлена з Nuxt/Vue аналогом
- Файл `.env`: що означає кожен ключ
- Artisan CLI: головний інструмент розробника Laravel
- Налаштування SQLite як бази даних
- Запуск першої міграції
- Перший запуск dev-сервера

---

## Паралелі з JS/Vue

| Laravel | Nuxt / Vue | Призначення |
|---|---|---|
| `app/` | `src/` | Основний код застосунку |
| `app/Models/` | `stores/` (Pinia) | Рівень даних, робота з БД |
| `app/Http/Controllers/` | `pages/` + `composables/` | Логіка обробки запитів |
| `app/Http/Middleware/` | Navigation Guards (router) | Проміжна обробка запитів |
| `app/Http/Requests/` | Валідація в composables/zod | Правила валідації вхідних даних |
| `app/Providers/` | `plugins/` (Nuxt) | Реєстрація сервісів при старті |
| `config/` | `nuxt.config.ts` / `vite.config.ts` | Конфігурація застосунку |
| `database/migrations/` | -- (бекенд-only) | Зміни структури БД |
| `database/seeders/` | -- (бекенд-only) | Наповнення БД тестовими даними |
| `database/factories/` | -- (бекенд-only) | Генерація фейкових даних |
| `routes/` | `router/index.ts` | Маршрутизація |
| `routes/web.php` | Сторінкові роути | Маршрути для HTML-сторінок |
| `routes/api.php` | API роути | Маршрути для JSON API |
| `resources/views/` | `components/` + `pages/` (.vue) | Шаблони (Blade) |
| `resources/css/` | `assets/css/` | Стилі |
| `resources/js/` | `src/` (JS/TS) | Фронтенд JavaScript |
| `public/` | `public/` | Статичні файли |
| `storage/` | `.nuxt/` / `dist/` | Кеш, логи, згенеровані файли |
| `tests/` | `tests/` / `__tests__/` | Тести |
| `vendor/` | `node_modules/` | Залежності |
| `.env` | `.env` | Змінні середовища |
| `composer.json` | `package.json` | Опис проєкту та залежності |
| `composer.lock` | `package-lock.json` / `pnpm-lock.yaml` | Зафіксовані версії |
| `artisan` | `npm scripts` / `nuxi` | CLI-інструмент |
| `php artisan serve` | `npm run dev` / `nuxi dev` | Dev-сервер |
| `php artisan make:*` | -- | Генерація коду (scaffolding) |
| `php artisan migrate` | -- | Застосування міграцій БД |
| `php artisan tinker` | Node REPL / браузерна консоль | Інтерактивна PHP-консоль |

---

## Теорія

### 1. Передумови

Для роботи з Laravel 12 вам потрібно:

- **PHP 8.2+** -- мова програмування
- **Composer** -- менеджер пакетів PHP (як npm для Node.js)
- **SQLite** -- легка база даних (файлова, не потребує окремого сервера)

#### Перевірка

```bash
php -v
# PHP 8.3.x (cli)

composer --version
# Composer version 2.x.x

php -m | grep sqlite
# pdo_sqlite
# sqlite3
```

> **Чому SQLite?** В Nuxt/Vue ви зазвичай працюєте з API і не думаєте про базу даних. В Laravel база даних -- це серце додатку. SQLite -- найпростіший варіант: це просто файл, без встановлення серверів типу MySQL чи PostgreSQL. Ідеально для навчання та розробки.

Якщо SQLite не встановлено або php-модуль відсутній:

```bash
# macOS (зазвичай вже є)
brew install sqlite3
# Якщо php не має розширення sqlite:
brew install php  # переінсталюйте PHP, sqlite включено за замовчуванням

# Ubuntu/Debian
sudo apt install php-sqlite3 sqlite3
```

---

### 2. Встановлення Laravel

**У Vue ви створюєте проєкт через `npm create vue@latest` або `npx nuxi init` --> в Laravel це `composer create-project`.**

Є два способи:

#### Спосіб 1: composer create-project (рекомендований)

```bash
cd ~/Documents/projects/my/backand-study
composer create-project laravel/laravel task-manager
```

Ця команда:
1. Завантажує Laravel 12 (останню версію) з Packagist (реєстр PHP-пакетів, аналог npmjs.com)
2. Встановлює всі залежності в `vendor/`
3. Генерує `.env` файл з `APP_KEY`
4. Створює повну структуру проєкту

#### Спосіб 2: Laravel Installer

```bash
# Спочатку встановити інсталятор глобально
composer global require laravel/installer

# Потім створювати проєкти
laravel new task-manager
```

> **Різниця:** `laravel new` -- інтерактивний інсталятор, який запитує про starter kit (Breeze, Jetstream), тестовий фреймворк тощо. Для нашого курсу обирайте "None" для starter kit -- ми будемо будувати API з нуля.

#### Після встановлення

```bash
cd task-manager
php artisan --version
# Laravel Framework 12.x.x
```

---

### 3. Структура проєкту

**У Vue/Nuxt ви маєте `src/`, `pages/`, `components/`, `stores/` --> в Laravel кожна директорія має свою чітку роль.**

Давайте пройдемось по КОЖНІЙ директорії щойно створеного Laravel-проєкту:

```
task-manager/
├── app/                    # <-- Ваш основний код (аналог src/ у Vue)
│   ├── Http/
│   │   └── Controllers/    # <-- Обробники запитів (аналог pages/ з логікою)
│   ├── Models/             # <-- Моделі даних (аналог stores/ у Pinia)
│   └── Providers/          # <-- Сервіс-провайдери (аналог plugins/ у Nuxt)
├── bootstrap/              # <-- Завантаження фреймворку (не Bootstrap CSS!)
│   ├── app.php             # <-- Точка входу, реєстрація middleware/routes
│   └── cache/              # <-- Кешовані конфіги
├── config/                 # <-- Конфігурація (аналог nuxt.config.ts)
│   ├── app.php             # <-- Назва, URL, timezone, locale
│   ├── auth.php            # <-- Автентифікація
│   ├── cache.php           # <-- Кешування
│   ├── database.php        # <-- Підключення до БД
│   ├── filesystems.php     # <-- Зберігання файлів
│   ├── logging.php         # <-- Логування
│   ├── mail.php            # <-- Поштові налаштування
│   ├── queue.php           # <-- Черги (background jobs)
│   └── session.php         # <-- Сесії
├── database/               # <-- Все повʼязане з базою даних
│   ├── factories/          # <-- Фабрики для генерації тестових даних
│   ├── migrations/         # <-- Міграції: зміни структури БД
│   └── seeders/            # <-- Сідери: наповнення БД даними
├── public/                 # <-- Публічна директорія (аналог public/)
│   ├── index.php           # <-- Точка входу веб-сервера
│   ├── favicon.ico
│   └── robots.txt
├── resources/              # <-- Ресурси (шаблони, CSS, JS)
│   ├── css/                # <-- Стилі
│   ├── js/                 # <-- Фронтенд JavaScript
│   └── views/              # <-- Blade-шаблони (аналог .vue файлів)
│       └── welcome.blade.php
├── routes/                 # <-- Маршрути (аналог router/index.ts)
│   ├── web.php             # <-- Роути для веб-сторінок
│   ├── api.php             # <-- Роути для API  (ми будемо працювати тут!)
│   └── console.php         # <-- Artisan-команди
├── storage/                # <-- Зберігання: логи, кеш, завантажені файли
│   ├── app/                # <-- Файли додатку
│   ├── framework/          # <-- Кеш фреймворку
│   │   ├── cache/
│   │   ├── sessions/
│   │   └── views/
│   └── logs/               # <-- Логи (laravel.log)
├── tests/                  # <-- Тести
│   ├── Feature/            # <-- Функціональні тести
│   └── Unit/               # <-- Юніт-тести
├── vendor/                 # <-- Залежності (аналог node_modules/)
├── .env                    # <-- Змінні середовища (аналог .env)
├── .env.example            # <-- Приклад .env для нових розробників
├── artisan                 # <-- CLI-інструмент (як npm scripts runner)
├── composer.json           # <-- Залежності проєкту (аналог package.json)
├── composer.lock           # <-- Зафіксовані версії (аналог lock-файлу)
├── package.json            # <-- Для фронтенд-залежностей (Vite, etc.)
├── phpunit.xml             # <-- Конфігурація тестів
└── vite.config.js          # <-- Vite конфіг для фронтенду
```

Розберемо найважливіші директорії детальніше.

#### app/ -- серце вашого додатку

```
app/
├── Http/
│   ├── Controllers/         # Контролери -- обробляють HTTP-запити
│   │   └── Controller.php   # Базовий контролер
│   └── Middleware/           # (створюється за потреби)
├── Models/                  # Eloquent-моделі -- робота з таблицями БД
│   └── User.php             # Модель користувача (вже є)
└── Providers/               # Сервіс-провайдери
    └── AppServiceProvider.php
```

**У Nuxt:**
```
src/
├── pages/           --> Http/Controllers/ (логіка обробки)
├── components/      --> resources/views/ (шаблони)
├── stores/          --> Models/ (робота з даними)
├── composables/     --> Services/ (бізнес-логіка)
├── middleware/       --> Http/Middleware/ (проміжна обробка)
└── plugins/         --> Providers/ (реєстрація при старті)
```

#### config/ -- конфігурація

**У Vue конфігурація зосереджена в одному файлі (`nuxt.config.ts`) --> в Laravel кожен аспект має свій конфіг-файл.**

Кожен файл в `config/` повертає PHP-масив з налаштуваннями. Значення зазвичай беруться з `.env`:

```php
<?php
// config/app.php (спрощений приклад)
return [
    'name' => env('APP_NAME', 'Laravel'),      // З .env або дефолт
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => 'UTC',
    'locale' => 'uk',                          // Можна змінити на українську
];
```

> Функція `env('KEY', 'default')` -- це аналог `process.env.KEY || 'default'` в Node.js.

#### database/ -- міграції та сіди

**У Vue немає прямого аналога (це бекенд-only) --> але думайте про міграції як про "git для бази даних".**

```
database/
├── factories/
│   └── UserFactory.php       # Генерація фейкових Users (для тестів)
├── migrations/
│   ├── 0001_01_01_000000_create_users_table.php
│   ├── 0001_01_01_000001_create_cache_table.php
│   └── 0001_01_01_000002_create_jobs_table.php
└── seeders/
    └── DatabaseSeeder.php    # Наповнення БД початковими даними
```

**Міграції** -- це PHP-файли, які описують зміни структури бази даних. Кожна міграція має методи `up()` (застосувати зміну) та `down()` (відкотити). Це як git коміти, але для бази даних:

```php
<?php
// Приклад міграції (скоро створимо свою)
public function up(): void
{
    Schema::create('tasks', function (Blueprint $table) {
        $table->id();                    // BIGINT AUTO_INCREMENT
        $table->string('title');         // VARCHAR(255)
        $table->text('description')->nullable();
        $table->string('status')->default('pending');
        $table->integer('priority')->default(3);
        $table->timestamps();            // created_at, updated_at
    });
}
```

#### routes/ -- маршрутизація

**У Vue ви маєте Vue Router з `router/index.ts` --> в Laravel маршрути описуються в PHP-файлах.**

```php
<?php
// routes/web.php -- для HTML-сторінок (з сесіями, CSRF)
Route::get('/', function () {
    return view('welcome');
});

// routes/api.php -- для JSON API (без сесій, stateless)
// Ми будемо працювати переважно тут!
Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::get('/tasks/{id}', [TaskController::class, 'show']);
Route::put('/tasks/{id}', [TaskController::class, 'update']);
Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
```

Порівняння з Vue Router:

```javascript
// Vue Router
const routes = [
    { path: '/', component: HomePage },
    { path: '/tasks', component: TaskList },
    { path: '/tasks/:id', component: TaskDetail },
];
```

```php
<?php
// Laravel routes/api.php
Route::get('/tasks', [TaskController::class, 'index']);       // GET /api/tasks
Route::get('/tasks/{id}', [TaskController::class, 'show']);   // GET /api/tasks/1
```

**Ключова різниця:** В Vue Router шлях вказує на компонент (рендерить UI). В Laravel шлях вказує на контролер (повертає дані або HTML). Оскільки ми будуємо API -- контролери повертатимуть JSON.

---

### 4. Файл .env

**У Vue ви маєте `.env` з `VITE_` префіксом --> в Laravel `.env` містить ВСЮ конфігурацію середовища.**

Після встановлення Laravel автоматично створює `.env` з `.env.example`. Розберемо кожну секцію:

```bash
# === Основні налаштування додатку ===
APP_NAME=Laravel                    # Назва додатку (змініть на "Task Manager")
APP_ENV=local                       # Середовище: local, staging, production
APP_KEY=base64:xxxxx...             # Ключ шифрування (генерується автоматично!)
APP_DEBUG=true                      # Режим дебагу: true для розробки, false для продакшену
APP_URL=http://localhost            # URL додатку

# === Логування ===
LOG_CHANNEL=stack                   # Канал логування
LOG_LEVEL=debug                     # Рівень логів

# === База даних ===
DB_CONNECTION=sqlite                # <-- Змінити на sqlite!
# DB_HOST=127.0.0.1                # Для SQLite не потрібно
# DB_PORT=3306                     # Для SQLite не потрібно
# DB_DATABASE=laravel              # Для SQLite не потрібно
# DB_USERNAME=root                 # Для SQLite не потрібно
# DB_PASSWORD=                     # Для SQLite не потрібно

# === Кешування та сесії ===
CACHE_STORE=database               # Де зберігати кеш
SESSION_DRIVER=database             # Де зберігати сесії
QUEUE_CONNECTION=database           # Де зберігати черги

# === Поштові налаштування ===
MAIL_MAILER=log                    # Для розробки: лист пишеться в лог, не надсилається
```

Порівняння з Vue/Nuxt `.env`:

```bash
# Vue / Nuxt .env
VITE_API_URL=http://localhost:8000/api    # VITE_ префікс для доступу в клієнті
NUXT_PUBLIC_API_URL=http://localhost:8000  # NUXT_PUBLIC_ для Nuxt

# В коді:
# import.meta.env.VITE_API_URL
# useRuntimeConfig().public.apiUrl
```

```bash
# Laravel .env
APP_URL=http://localhost:8000

# В коді:
# env('APP_URL')          -- пряме читання (тільки в config файлах!)
# config('app.url')       -- рекомендований спосіб
```

> **Важливо:** В Laravel не можна використовувати `env()` напряму в коді додатку (крім файлів `config/`). Використовуйте `config('key')` замість цього. Це повʼязано з кешуванням конфігурації в продакшені.

#### APP_KEY -- найважливіший секрет

`APP_KEY` -- це ключ шифрування, який Laravel використовує для:
- Шифрування cookies
- Шифрування сесій
- Підпису URL
- Шифрування даних в БД

**Він генерується автоматично при встановленні.** Якщо ви його втратите -- всі зашифровані дані стануть нечитабельними. Ніколи не комітьте `.env` в git!

Якщо потрібно перегенерувати:

```bash
php artisan key:generate
```

---

### 5. Artisan CLI

**У Vue ви маєте `npm run dev`, `npx nuxi generate` --> в Laravel є `php artisan` -- універсальний CLI-інструмент.**

Artisan -- це командний інтерфейс Laravel. Він вміє все: від запуску сервера до генерації коду, управління базою даних та дебагу.

```bash
# Побачити ВСІ доступні команди
php artisan list

# Отримати допомогу по конкретній команді
php artisan help migrate
```

#### Найважливіші команди

##### php artisan serve -- запуск dev-сервера

```bash
php artisan serve
# Starting Laravel development server: http://127.0.0.1:8000
```

**Аналог `npm run dev` або `nuxi dev`.** Запускає вбудований PHP-сервер на порту 8000. Натисніть Ctrl+C щоб зупинити.

```bash
# Змінити порт
php artisan serve --port=9000

# Змінити хост (для доступу з інших пристроїв)
php artisan serve --host=0.0.0.0
```

##### php artisan make:* -- генерація коду

Одна з найкорисніших можливостей Laravel. Замість ручного створення файлів:

```bash
# Створити контролер (аналог створення нової сторінки/компонента)
php artisan make:controller TaskController

# Створити модель (аналог створення Pinia store)
php artisan make:model Task

# Створити модель + міграцію + фабрику + сідер + контролер
php artisan make:model Task -mfsc

# Створити міграцію (зміна структури БД)
php artisan make:migration create_tasks_table

# Створити request (валідація)
php artisan make:request StoreTaskRequest

# Створити middleware
php artisan make:middleware EnsureApiToken

# Створити тест
php artisan make:test TaskTest
```

Порівняння з Vue:

| Laravel | Vue / Nuxt |
|---|---|
| `make:controller TaskController` | Вручну створюєте `pages/tasks.vue` |
| `make:model Task` | Вручну створюєте `stores/tasks.ts` |
| `make:migration create_tasks_table` | Немає аналога (бекенд-only) |
| `make:test TaskTest` | Вручну створюєте `tests/tasks.test.ts` |

> **Це одна з причин, чому Laravel такий продуктивний:** замість ручного створення файлів та написання boilerplate-коду, ви генеруєте їх однією командою.

##### php artisan migrate -- управління базою даних

```bash
# Застосувати всі нові міграції
php artisan migrate

# Подивитися статус міграцій
php artisan migrate:status

# Відкотити останню міграцію
php artisan migrate:rollback

# Відкотити ВСІ міграції та застосувати знову
php artisan migrate:fresh

# Відкотити все + засіяти (seed) тестовими даними
php artisan migrate:fresh --seed
```

##### php artisan tinker -- інтерактивна PHP-консоль

**Як Node REPL або браузерна консоль, але з доступом до всього Laravel-додатку.**

```bash
php artisan tinker
# Psy Shell v0.x.x
# >>> 
```

В tinker можна:
```php
// Створити запис в БД
$user = User::create(['name' => 'Tim', 'email' => 'tim@example.com', 'password' => bcrypt('secret')]);

// Знайти запис
$user = User::find(1);

// Порахувати записи
User::count();

// Подивитися всіх
User::all()->pluck('name');

// Виконати будь-який PHP код
collect([1,2,3,4,5])->filter(fn($n) => $n > 3)->values();
```

##### php artisan route:list -- список маршрутів

```bash
php artisan route:list
```

Показує всі зареєстровані маршрути, їх методи (GET, POST, тощо), URL та контролери. Це як побачити всі роути вашого Vue Router одним списком.

```bash
# Фільтрувати тільки API-роути
php artisan route:list --path=api

# Компактний формат
php artisan route:list --compact
```

##### php artisan about -- інформація про проєкт

```bash
php artisan about
```

Виводить повну інформацію про середовище: версію Laravel, PHP, драйвер БД, кеш, чергу тощо. Корисно для дебагу проблем з конфігурацією.

##### Інші корисні команди

```bash
# Очистити всі кеші (коли щось "не працює")
php artisan optimize:clear

# Кешувати конфігурацію (для продакшену)
php artisan config:cache

# Список всіх make-команд
php artisan list make

# Запустити тести
php artisan test
```

---

### 6. Налаштування SQLite

**У Vue ви працюєте з API і не думаєте про базу даних --> в Laravel база даних -- центральний елемент.**

SQLite -- це файлова база даних. Замість окремого сервера (MySQL, PostgreSQL) ваша база -- це один файл `database.sqlite`.

#### Навіщо SQLite для навчання?

- **Нульова конфігурація:** не потрібно встановлювати сервер
- **Один файл:** легко скопіювати, видалити, почати з нуля
- **Вбудована підтримка:** PHP та Laravel підтримують SQLite "з коробки"
- **Достатня для розробки:** для невеликих проєктів та навчання -- ідеально

#### Конфігурація

Laravel 12 за замовчуванням вже налаштований на SQLite. Перевірте `.env`:

```bash
DB_CONNECTION=sqlite
```

Якщо там стоїть `mysql` або інше -- змініть на `sqlite` і видаліть (або закоментуйте) решту `DB_*` змінних:

```bash
DB_CONNECTION=sqlite
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=laravel
# DB_USERNAME=root
# DB_PASSWORD=
```

Перевірте `config/database.php` -- секція `sqlite`:

```php
'sqlite' => [
    'driver' => 'sqlite',
    'url' => env('DB_URL'),
    'database' => env('DB_DATABASE', database_path('database.sqlite')),
    'prefix' => '',
    'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
],
```

`database_path('database.sqlite')` -- це хелпер, який повертає абсолютний шлях `project-root/database/database.sqlite`.

Створіть файл бази даних (якщо він ще не існує):

```bash
touch database/database.sqlite
```

> **Примітка:** В Laravel 12 файл `database/database.sqlite` може створюватися автоматично при першій міграції. Але безпечніше створити його вручну.

---

### 7. Перша міграція

Тепер застосуємо міграції, які Laravel створив за замовчуванням:

```bash
php artisan migrate
```

Очікуваний вивід:

```
   INFO  Preparing database.  

  Creating migration table ............................................................... 12.38ms DONE

   INFO  Running migrations.  

  0001_01_01_000000_create_users_table ................................................... 5.46ms DONE
  0001_01_01_000001_create_cache_table ................................................... 2.30ms DONE
  0001_01_01_000002_create_jobs_table .................................................... 4.12ms DONE
```

Що сталося:
1. Laravel створив таблицю `migrations` (для відстеження які міграції вже запущені)
2. Створив таблицю `users` (стандартна для автентифікації)
3. Створив таблицю `cache` (для кешування)
4. Створив таблицю `jobs` (для фонових задач)

Перевірте статус:

```bash
php artisan migrate:status
```

```
  Migration name ........................................... Batch / Status  
  0001_01_01_000000_create_users_table ........................... [1] Ran  
  0001_01_01_000001_create_cache_table ........................... [1] Ran  
  0001_01_01_000002_create_jobs_table ............................ [1] Ran  
```

---

### 8. Файл конфігурації Laravel vs Nuxt

Давайте порівняємо, як конфігурація організована в Nuxt та Laravel:

```typescript
// Nuxt: nuxt.config.ts -- ВСЕ в одному файлі
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
    runtimeConfig: {
        secretKey: process.env.SECRET_KEY,
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE,
        },
    },
    app: {
        head: {
            title: 'My App',
        },
    },
});
```

```php
<?php
// Laravel: config/app.php -- один з БАГАТЬОХ конфіг-файлів
return [
    'name' => env('APP_NAME', 'Laravel'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => 'UTC',
    'locale' => 'uk',
    'fallback_locale' => 'en',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
    'maintenance' => [
        'driver' => 'file',
    ],
];
```

**Доступ до конфігурації в коді:**

```typescript
// Nuxt
const config = useRuntimeConfig();
console.log(config.public.apiBase);
```

```php
<?php
// Laravel
$appName = config('app.name');          // "Laravel"
$dbDriver = config('database.default'); // "sqlite"

// Конвенція: config('filename.key.subkey')
// config('app.name') --> config/app.php --> ['name' => ...]
// config('database.default') --> config/database.php --> ['default' => ...]
```

---

### 9. Як Laravel обробляє запит

У Vue/Nuxt фронтенд працює так: URL --> Vue Router --> Component --> Render.

В Laravel бекенд працює так:

```
HTTP-запит (GET /api/tasks)
    |
    v
public/index.php              <-- Точка входу (як index.html у Vue)
    |
    v
bootstrap/app.php             <-- Завантаження фреймворку
    |
    v
Middleware                     <-- Проміжна обробка (auth, CORS, throttle)
    |                              Аналог navigation guards у Vue Router
    v
routes/api.php                 <-- Знаходить відповідний маршрут
    |                              Аналог router/index.ts
    v
Controller@method              <-- Виконує логіку
    |                              Аналог script setup у Vue компоненті
    v
Model (Eloquent)               <-- Працює з БД
    |                              Аналог Pinia store
    v
Response (JSON)                <-- Повертає відповідь
                                   Аналог return з composable/API-виклику
```

Порівняння в коді:

```typescript
// Vue/Nuxt: Компонент запитує дані
// pages/tasks.vue
<script setup>
const { data: tasks } = await useFetch('/api/tasks');
</script>
```

```php
<?php
// Laravel: Контролер обробляє запит і повертає дані
// routes/api.php
Route::get('/tasks', function () {
    $tasks = Task::all();

    return response()->json($tasks);
});

// Або через контролер:
// app/Http/Controllers/TaskController.php
class TaskController extends Controller
{
    public function index()
    {
        return Task::all();
    }
}
```

---

### 10. Перший маршрут

Відкрийте `routes/web.php`:

```php
<?php
// routes/web.php
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
```

Це єдиний маршрут за замовчуванням. Коли ви відкриваєте `http://localhost:8000` -- Laravel знаходить цей маршрут, виконує функцію та повертає Blade-шаблон `welcome`.

Перевірте `routes/api.php`. В Laravel 12 цей файл за замовчуванням може бути порожнім або не існувати. Якщо його немає, створимо пізніше:

```bash
# Якщо api.php не існує -- встановити api маршрутизацію
php artisan install:api
```

> **Примітка:** В Laravel 12 `api.php` не створюється автоматично -- потрібно запустити `php artisan install:api`. Ця команда створить файл маршрутів та встановить Laravel Sanctum для API-автентифікації. Для наступних уроків ми зробимо це, коли почнемо будувати API.

---

## Практика: крок за кроком

### Крок 1. Встановіть Laravel

```bash
cd ~/Documents/projects/my/backand-study
composer create-project laravel/laravel task-manager
cd task-manager
```

Очікуваний вивід (скорочено):

```
Creating a "laravel/laravel" project at "./task-manager"
Installing laravel/laravel (v12.x.x)
  - Installing laravel/laravel (v12.x.x): Extracting archive
Created project in /path/to/task-manager
> @php -r "file_exists('.env') || copy('.env.example', '.env');"
> @php artisan key:generate --ansi
   INFO  Application key set successfully.
...
```

### Крок 2. Перевірте встановлення

```bash
php artisan --version
```

```
Laravel Framework 12.x.x
```

### Крок 3. Налаштуйте .env

Відкрийте `.env` і переконайтесь, що ці значення правильні:

```bash
APP_NAME="Task Manager"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
```

Видаліть або закоментуйте `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` якщо вони є.

### Крок 4. Створіть файл SQLite

```bash
touch database/database.sqlite
```

### Крок 5. Запустіть міграції

```bash
php artisan migrate
```

Очікуваний вивід:

```
   INFO  Preparing database.  

  Creating migration table ............................. DONE

   INFO  Running migrations.  

  0001_01_01_000000_create_users_table ................. DONE
  0001_01_01_000001_create_cache_table ................. DONE
  0001_01_01_000002_create_jobs_table .................. DONE
```

### Крок 6. Запустіть dev-сервер

```bash
php artisan serve
```

```
   INFO  Server running on [http://127.0.0.1:8000].

  Press Ctrl+C to stop the server
```

Відкрийте браузер: **http://localhost:8000**

Ви повинні побачити стартову сторінку Laravel з логотипом та посиланнями на документацію.

### Крок 7. Вивчіть artisan about

В іншому терміналі (або зупиніть сервер через Ctrl+C):

```bash
php artisan about
```

Очікуваний вивід (скорочено):

```
  Environment ............................................................  
  Application Name ................................... Task Manager  
  Laravel Version ...................................... 12.x.x  
  PHP Version .......................................... 8.3.x  
  Composer Version ..................................... 2.x.x  
  Environment .......................................... local  
  Debug Mode ........................................... ENABLED  
  URL .................................................. http://localhost:8000  

  Drivers ................................................................  
  Cache ................................................ database  
  Database .............................................. sqlite  
  Logs .......................................... stack / single  
  Mail ................................................. log  
  Queue ................................................ database  
  Session .............................................. database  
```

Зверніть увагу: `Database = sqlite` -- наша конфігурація працює.

### Крок 8. Подивіться список маршрутів

```bash
php artisan route:list
```

```
  GET|HEAD  / ....................................... 
  GET|HEAD  up ...................................... 
```

Поки що є тільки два маршрути:
- `/` -- стартова сторінка
- `/up` -- health-check (перевірка, що додаток працює)

Коли ми додамо API-маршрути -- вони зʼявляться тут.

### Крок 9. Спробуйте Tinker

```bash
php artisan tinker
```

В інтерактивній консолі:

```php
// Перевірте конфігурацію
config('app.name');
// "Task Manager"

config('database.default');
// "sqlite"

// Виконайте довільний PHP-код
collect([1, 2, 3, 4, 5])->filter(fn($n) => $n > 3)->values()->all();
// [4, 5]

// Порахуйте користувачів (поки 0)
\App\Models\User::count();
// 0

// Створіть користувача
$user = \App\Models\User::create([
    'name' => 'Timur',
    'email' => 'timur@example.com',
    'password' => bcrypt('password'),
]);
// App\Models\User {#xxxx
//     name: "Timur",
//     email: "timur@example.com",
//     ...
// }

\App\Models\User::count();
// 1

\App\Models\User::first()->name;
// "Timur"

// Вийти
exit
```

### Крок 10. Дослідіть структуру проєкту

Подивіться на файлову структуру та відкрийте ключові файли.

**routes/web.php** -- єдиний маршрут:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
```

**app/Models/User.php** -- модель користувача:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
```

Зверніть увагу:
- **`use HasFactory, Notifiable`** -- трейти (як з Уроку 2!)
- **`$fillable`** -- які поля можна масово заповнювати (захист від mass assignment)
- **`$hidden`** -- які поля приховувати при серіалізації в JSON
- **`casts()`** -- автоматичне перетворення типів (дата, хеш пароля)

**database/migrations/0001_01_01_000000_create_users_table.php** -- міграція:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
```

Зверніть увагу:
- `up()` -- що відбувається при міграції "вперед"
- `down()` -- що відбувається при відкаті
- `$table->id()` -- створює колонку `id` (auto-increment bigint)
- `$table->string('name')` -- VARCHAR(255)
- `$table->timestamps()` -- додає `created_at` та `updated_at`
- `$table->unique()` -- додає унікальний індекс

### Крок 11. Подивіться на базу даних через Tinker

```bash
php artisan tinker
```

```php
// Подивитися всі таблиці
\Illuminate\Support\Facades\Schema::getAllTables();

// Подивитися структуру таблиці users
\Illuminate\Support\Facades\Schema::getColumns('users');

// Вийти
exit
```

### Крок 12. Створіть cheat-sheet

Створіть файл `ARTISAN-CHEATSHEET.md` в корені проєкту (для себе):

```bash
# В корені task-manager проєкту
cat << 'EOF' > ARTISAN-CHEATSHEET.md
# Artisan Cheatsheet

## Dev-сервер
php artisan serve              # Запустити на :8000
php artisan serve --port=9000  # Інший порт

## Генерація коду
php artisan make:model Task -mfsc   # Модель + міграція + фабрика + сідер + контролер
php artisan make:controller TaskController
php artisan make:migration create_tasks_table
php artisan make:request StoreTaskRequest

## База даних
php artisan migrate                 # Запустити міграції
php artisan migrate:status          # Статус міграцій
php artisan migrate:rollback        # Відкотити останню
php artisan migrate:fresh           # Все з нуля
php artisan migrate:fresh --seed    # Все з нуля + тестові дані

## Дебаг
php artisan about                   # Інфо про проєкт
php artisan route:list              # Всі маршрути
php artisan tinker                  # PHP REPL
php artisan optimize:clear          # Очистити всі кеші

## Тести
php artisan test                    # Запустити тести
EOF
```

---

## Перевірка

Після виконання всіх кроків переконайтесь:

1. **Директорія `task-manager/` існує** з повною структурою Laravel
2. **`php artisan --version`** показує Laravel 12.x.x
3. **`php artisan serve`** запускає сервер на `http://localhost:8000`
4. **Стартова сторінка Laravel** відображається в браузері
5. **`php artisan about`** показує `Database = sqlite`
6. **`php artisan migrate:status`** показує 3 виконані міграції
7. **`php artisan tinker`** працює, `User::count()` повертає число
8. **`php artisan route:list`** показує маршрути

Якщо щось не працює:
- `could not find driver` -- не встановлено розширення SQLite: `php -m | grep sqlite`
- `SQLSTATE[HY000]: General error: 1 no such table` -- не запущено міграції: `php artisan migrate`
- `The stream or file "storage/logs/laravel.log" could not be opened` -- проблеми з правами: `chmod -R 775 storage bootstrap/cache`

---

## Міні-тест

### Питання 1
Який аналог `node_modules/` в Laravel?
a) `storage/`
b) `vendor/`
c) `public/`
d) `bootstrap/`

### Питання 2
Яка команда створює модель + міграцію + фабрику + сідер + контролер?
a) `php artisan generate:all Task`
b) `php artisan make:model Task --all`
c) `php artisan make:model Task -mfsc`
d) `php artisan create Task`

### Питання 3
Де в Laravel визначаються API-маршрути?
a) `config/routes.php`
b) `app/Http/routes.php`
c) `routes/api.php`
d) `routes/web.php`

### Питання 4
Яка функція дозволяє читати значення з `.env` в конфіг-файлах?
a) `process.env('KEY')`
b) `getenv('KEY')`
c) `$_ENV['KEY']`
d) `env('KEY', 'default')`

### Питання 5
Що робить `php artisan migrate:fresh --seed`?
a) Створює нову міграцію та засіває дані
b) Видаляє всі таблиці, перестворює їх та наповнює тестовими даними
c) Тільки засіває дані без зміни структури
d) Показує статус міграцій

---

## Практичне завдання

1. **Виконайте всі кроки** з розділу "Практика: крок за кроком" (встановлення, конфігурація, міграції, tinker).

2. **Дослідіть конфігурацію.** Відкрийте та прочитайте такі файли:
   - `config/app.php` -- знайдіть, де встановлюється timezone та locale
   - `config/database.php` -- знайдіть конфігурацію SQLite
   - `.env` -- змініть `APP_NAME` на "Task Manager" та переконайтесь, що `php artisan about` відображає нову назву

3. **Створіть нотатки.** Для кожної директорії проєкту запишіть коротко:
   - Що в ній зберігається
   - Який аналог у Vue/Nuxt
   - Чи будете ви часто працювати з нею

4. **Експеримент з Tinker.** Запустіть `php artisan tinker` та виконайте:
   ```php
   // Створіть 3 користувачі
   \App\Models\User::create(['name' => 'Alice', 'email' => 'alice@test.com', 'password' => bcrypt('pass')]);
   \App\Models\User::create(['name' => 'Bob', 'email' => 'bob@test.com', 'password' => bcrypt('pass')]);
   \App\Models\User::create(['name' => 'Charlie', 'email' => 'charlie@test.com', 'password' => bcrypt('pass')]);
   
   // Порахуйте їх
   \App\Models\User::count();
   
   // Знайдіть за email
   \App\Models\User::where('email', 'bob@test.com')->first();
   
   // Отримайте тільки імена
   \App\Models\User::pluck('name');
   
   // Видаліть одного
   \App\Models\User::where('name', 'Charlie')->delete();
   \App\Models\User::count();
   ```

5. **Бонус: перший кастомний маршрут.** Додайте в `routes/web.php`:
   ```php
   Route::get('/hello', function () {
       return response()->json([
           'message' => 'Hello from Laravel!',
           'framework' => 'Laravel ' . app()->version(),
           'php' => PHP_VERSION,
       ]);
   });
   ```
   Запустіть сервер та відкрийте `http://localhost:8000/hello`. Ви повинні побачити JSON-відповідь.

---

## Відповіді на тест

### Відповідь 1: **b) `vendor/`**
`vendor/` -- це директорія, куди Composer встановлює всі залежності. Повний аналог `node_modules/` в Node.js проєктах. Так само як і `node_modules/`, `vendor/` не комітиться в git (є в `.gitignore`).

### Відповідь 2: **c) `php artisan make:model Task -mfsc`**
Флаги: `-m` (migration), `-f` (factory), `-s` (seeder), `-c` (controller). Це одна з найпопулярніших команд Laravel, що створює всю "екосистему" для нової сутності. Також можна використовувати `--all` або `-a`, що додає ще й policy та request.

### Відповідь 3: **c) `routes/api.php`**
API-маршрути визначаються в `routes/api.php`. Вони автоматично отримують префікс `/api/` та middleware для API (без сесій, з rate limiting). `routes/web.php` -- для веб-сторінок з сесіями та CSRF-захистом.

### Відповідь 4: **d) `env('KEY', 'default')`**
Функція `env()` читає значення зі змінних середовища (файл `.env`). Другий аргумент -- значення за замовчуванням, якщо ключ не знайдено. Використовувати `env()` слід тільки в файлах `config/`, а в коді додатку -- `config('key')`.

### Відповідь 5: **b) Видаляє всі таблиці, перестворює їх та наповнює тестовими даними**
`migrate:fresh` -- це "ядерний варіант": видаляє ВСІ таблиці (DROP), потім запускає всі міграції з нуля. Флаг `--seed` після цього запускає сідери (`DatabaseSeeder`), які наповнюють таблиці тестовими даними. Це зручно під час розробки, коли потрібно "почати з чистого аркуша".
