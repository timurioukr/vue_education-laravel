# Урок 15: Middleware -- конвеєр обробки запитів

## Що ви вивчите

- Що таке middleware і як працює pipeline (конвеєр) запитів
- Ланцюжок обробки: Request → Middleware1 → Middleware2 → Controller → Response
- Вбудовані middleware: `auth`, `throttle`, `cors`
- Створення кастомного middleware через `php artisan make:middleware`
- Структура middleware: `handle($request, Closure $next)`
- "Before" middleware -- модифікація запиту до контролера
- "After" middleware -- модифікація відповіді після контролера
- Реєстрація middleware у `bootstrap/app.php`
- Глобальні middleware, alias middleware, middleware-групи
- Middleware з параметрами: `handle($request, $next, $param)`
- Rate limiting (обмеження частоти запитів)
- Terminate middleware -- код після відправки відповіді клієнту

---

## Паралелі з JS/Vue

| Vue / Nuxt / JS | Laravel |
|---|---|
| Nuxt server middleware `server/middleware/auth.ts` | Middleware клас в `app/Http/Middleware/` |
| Express.js `app.use((req, res, next) => { next() })` | `handle($request, Closure $next)` з `$next($request)` |
| `next()` в Express middleware | `$next($request)` в Laravel middleware |
| `definePageMeta({ middleware: ['auth'] })` в Nuxt | `Route::middleware(['auth:sanctum'])` |
| Nuxt plugins з `defineNuxtPlugin()` (before/after hooks) | Before/After middleware |
| Axios interceptor `axios.interceptors.request.use()` | Before middleware (модифікує запит) |
| Axios interceptor `axios.interceptors.response.use()` | After middleware (модифікує відповідь) |
| Nuxt `routeMiddleware` у `nuxt.config.ts` | Реєстрація middleware у `bootstrap/app.php` |
| `debounce` / `throttle` composable | `RateLimiter::for()` -- серверний rate limiting |
| Nuxt global middleware (`middleware/` без `.global` суфіксу) | Глобальний middleware через `->append()` |

---

## Теорія

### Що таке middleware

Middleware -- це код, який виконується **між** отриманням HTTP-запиту та відправкою відповіді. Запит проходить через ланцюжок middleware, як товар через конвеєр на заводі -- кожна станція додає щось або перевіряє.

```
HTTP Request
  │
  ▼
┌──────────────┐
│ Middleware 1  │  ← Перевірка: запит має JSON header?
└──────┬───────┘
       │
  ▼
┌──────────────┐
│ Middleware 2  │  ← Перевірка: є валідний токен?
└──────┬───────┘
       │
  ▼
┌──────────────┐
│ Middleware 3  │  ← Перевірка: не перевищено rate limit?
└──────┬───────┘
       │
  ▼
┌──────────────┐
│  Controller   │  ← Бізнес-логіка
└──────┬───────┘
       │
  ▼
HTTP Response
```

Якщо будь-який middleware вирішить, що запит не проходить (немає токена, перевищено ліміт), він поверне відповідь одразу, **не доходячи до контролера**.

### Аналогія з Express.js

Якщо ви працювали з Express.js, middleware у Laravel -- практично те саме:

```javascript
// Express.js middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next(); // передати запит далі
});

app.use((req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Unauthenticated' });
    }
    next();
});
```

```php
// Laravel middleware -- ідентична концепція
class LogRequest
{
    public function handle(Request $request, Closure $next)
    {
        Log::info("{$request->method()} {$request->url()}");
        return $next($request); // передати запит далі
    }
}

class EnsureAuthenticated
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return $next($request);
    }
}
```

`$next($request)` -- це як `next()` в Express. Виклик передає запит наступному middleware в ланцюжку (або контролеру, якщо middleware останній).

### Аналогія з Nuxt

У Nuxt 3 middleware працюють схоже:

```typescript
// Nuxt -- middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
        return navigateTo('/login')
    }
    // Якщо нічого не повертаємо -- запит проходить далі
})
```

```php
// Laravel -- аналогічна концепція
class EnsureAuthenticated
{
    public function handle(Request $request, Closure $next)
    {
        if (! auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return $next($request); // "нічого не повертаємо" -- пропускаємо далі
    }
}
```

### Before vs After middleware

Middleware може виконувати код **до** або **після** контролера.

#### Before middleware -- модифікація запиту

Код виконується ДО того, як запит потрапить у контролер:

```php
class EnsureJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        // ДО контролера: примусово встановлюємо Accept: application/json
        $request->headers->set('Accept', 'application/json');

        return $next($request); // передаємо далі
    }
}
```

Аналогія з Vue -- Axios request interceptor:

```javascript
// Vue -- перед відправкою запиту
axios.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json';
    return config; // передаємо далі
});
```

#### After middleware -- модифікація відповіді

Код виконується ПІСЛЯ того, як контролер повернув відповідь:

```php
class AddResponseHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request); // спочатку отримуємо відповідь

        // ПІСЛЯ контролера: додаємо заголовки до відповіді
        $response->headers->set('X-App-Version', '1.0.0');
        $response->headers->set('X-Response-Time', microtime(true) - LARAVEL_START);

        return $response;
    }
}
```

Аналогія з Vue -- Axios response interceptor:

```javascript
// Vue -- після отримання відповіді
axios.interceptors.response.use((response) => {
    console.log('Response time:', response.headers['x-response-time']);
    return response;
});
```

#### Комбінований middleware (Before + After)

```php
class LogApiRequest
{
    public function handle(Request $request, Closure $next)
    {
        // BEFORE: запам'ятовуємо час початку
        $startTime = microtime(true);

        // Передаємо запит далі і отримуємо відповідь
        $response = $next($request);

        // AFTER: логуємо результат
        $duration = round((microtime(true) - $startTime) * 1000, 2);

        Log::info('API Request', [
            'method' => $request->method(),
            'uri' => $request->getRequestUri(),
            'user_id' => $request->user()?->id,
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
        ]);

        return $response;
    }
}
```

### Структура middleware

Кожен middleware -- це клас з одним обов'язковим методом `handle()`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MyMiddleware
{
    /**
     * @param  Request  $request   -- вхідний HTTP-запит
     * @param  Closure  $next      -- наступний middleware або контролер
     * @return Response            -- HTTP-відповідь
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Ваша логіка тут

        return $next($request);
    }
}
```

**Три сценарії:**

1. **Пропустити далі:** `return $next($request)` -- запит йде далі
2. **Заблокувати:** `return response()->json([...], 403)` -- повернути відповідь, не доходячи до контролера
3. **Модифікувати і пропустити:** змінити `$request` або `$response`, потім пропустити

### Реєстрація middleware у bootstrap/app.php

У Laravel 12 middleware реєструються в `bootstrap/app.php`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // 1. Глобальні middleware -- виконуються для КОЖНОГО запиту
        $middleware->append(\App\Http\Middleware\EnsureJsonResponse::class);

        // 2. Alias -- ім'я для використання в маршрутах
        $middleware->alias([
            'log.api' => \App\Http\Middleware\LogApiRequest::class,
            'task.limit' => \App\Http\Middleware\CheckTaskLimit::class,
        ]);

        // 3. Middleware для API-групи
        $middleware->api(
            append: [
                \App\Http\Middleware\LogApiRequest::class,
            ]
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

**Три типи реєстрації:**

| Тип | Метод | Коли виконується |
|---|---|---|
| Глобальний | `$middleware->append(...)` | Кожен запит до додатку |
| Alias | `$middleware->alias([...])` | Тільки коли вказаний у маршруті |
| API група | `$middleware->api(append: [...])` | Кожен запит до `/api/*` |

### Застосування middleware до маршрутів

```php
// Один middleware
Route::get('/tasks', [TaskController::class, 'index'])
    ->middleware('auth:sanctum');

// Кілька middleware
Route::get('/tasks', [TaskController::class, 'index'])
    ->middleware(['auth:sanctum', 'log.api']);

// Група маршрутів
Route::middleware(['auth:sanctum', 'log.api'])->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
});

// Middleware на конкретний маршрут всередині групи
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);

    Route::post('/tasks', [TaskController::class, 'store'])
        ->middleware('task.limit'); // додатковий middleware тільки для створення
});
```

### Middleware з параметрами

Middleware може приймати додаткові параметри:

```php
class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if ($request->user()->role !== $role) {
            return response()->json([
                'message' => "Requires role: {$role}",
            ], 403);
        }

        return $next($request);
    }
}
```

Використання в маршруті -- параметр після двокрапки:

```php
Route::get('/admin/stats', [AdminController::class, 'stats'])
    ->middleware('role:admin');

Route::get('/reports', [ReportController::class, 'index'])
    ->middleware('role:manager');
```

Кілька параметрів -- через кому:

```php
// Middleware з двома параметрами
class CheckAbility
{
    public function handle(Request $request, Closure $next, string ...$abilities): Response
    {
        foreach ($abilities as $ability) {
            if (! $request->user()->tokenCan($ability)) {
                return response()->json([
                    'message' => "Token missing ability: {$ability}",
                ], 403);
            }
        }

        return $next($request);
    }
}

// Використання
Route::post('/tasks', [TaskController::class, 'store'])
    ->middleware('ability:task:create,task:write');
```

### Rate Limiting -- обмеження частоти запитів

Rate limiting -- це захист від зловживань: обмеження кількості запитів за одиницю часу. Як `debounce`/`throttle` у JavaScript, тільки на рівні сервера.

Rate limiter-и визначаються в `AppServiceProvider`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // Стандартний ліміт для API: 60 запитів на хвилину
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });

    // Строгий ліміт для логіну: 5 спроб на хвилину
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by($request->input('email') . $request->ip());
    });

    // Різні ліміти для авторизованих і гостей
    RateLimiter::for('global', function (Request $request) {
        return $request->user()
            ? Limit::perMinute(120)->by($request->user()->id)
            : Limit::perMinute(20)->by($request->ip());
    });
}
```

Застосування до маршрутів:

```php
// Стандартний API rate limit
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('tasks', TaskController::class);
});

// Строгий ліміт для логіну
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');
```

Коли ліміт перевищено, Laravel повертає **429 Too Many Requests**:

```json
{
    "message": "Too Many Attempts."
}
```

Разом з відповіддю Laravel відправляє заголовки:

```
X-RateLimit-Limit: 60          // максимум запитів
X-RateLimit-Remaining: 0       // залишилось запитів
Retry-After: 45                // секунд до скидання
```

Ваш Vue-додаток може читати ці заголовки:

```javascript
// Vue -- обробка 429
axios.interceptors.response.use(null, (error) => {
    if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        toast.error(`Too many requests. Try again in ${retryAfter} seconds.`);
    }
    return Promise.reject(error);
});
```

### Terminate middleware -- код після відповіді

Є особливий тип middleware, який виконується **після** відправки відповіді клієнту. Клієнт вже отримав відповідь, а сервер продовжує працювати:

```php
class TrackApiUsage
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Виконується ПІСЛЯ відправки відповіді клієнту.
     * Клієнт вже отримав 200 OK, а ми ще логуємо.
     */
    public function terminate(Request $request, Response $response): void
    {
        // Цей код не сповільнює відповідь клієнту
        ApiUsageLog::create([
            'user_id' => $request->user()?->id,
            'method' => $request->method(),
            'uri' => $request->getRequestUri(),
            'status' => $response->getStatusCode(),
            'ip' => $request->ip(),
        ]);
    }
}
```

Це як `setTimeout(() => analytics.track(...), 0)` у JavaScript -- відповідь вже відправлена, а ми робимо "фонову" роботу.

### Вбудовані middleware в Laravel

Laravel має багато вбудованих middleware:

| Middleware | Що робить | Аналогія в JS |
|---|---|---|
| `auth:sanctum` | Перевіряє токен автентифікації | Navigation guard `requiresAuth` |
| `throttle:api` | Обмежує частоту запитів | `throttle` composable |
| `cors` | Додає CORS-заголовки | `cors` пакет в Express |
| `can:ability` | Перевіряє Gate/Policy | Permission guard |
| `verified` | Перевіряє верифікацію email | -- |
| `signed` | Перевіряє підпис URL | -- |

---

## Практика: крок за кроком

> **Передумова:** ви маєте працюючий API з автентифікацією (Урок 13) та авторизацією (Урок 14).

### Крок 1: Створіть EnsureJsonResponse middleware

Проблема: якщо клієнт не відправляє заголовок `Accept: application/json`, Laravel може повернути HTML замість JSON (наприклад, при 404 або 500). Це middleware вирішує цю проблему.

```bash
cd ~/task-manager-api
php artisan make:middleware EnsureJsonResponse
```

Відкрийте `app/Http/Middleware/EnsureJsonResponse.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureJsonResponse
{
    /**
     * Примусово встановлює Accept: application/json для всіх API-запитів.
     *
     * Без цього middleware:
     *   GET /api/nonexistent -> HTML-сторінка 404 (некрасиво для API)
     *
     * З цим middleware:
     *   GET /api/nonexistent -> {"message": "Not Found"} (правильний JSON)
     *
     * Аналогія з Vue: Axios interceptor, який додає заголовок до кожного запиту.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
```

Це "before" middleware -- модифікує запит ДО контролера. Після цього Laravel буде знати, що клієнт хоче JSON, і всі відповіді (включаючи помилки) будуть у JSON-форматі.

### Крок 2: Створіть LogApiRequest middleware

```bash
php artisan make:middleware LogApiRequest
```

Відкрийте `app/Http/Middleware/LogApiRequest.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequest
{
    /**
     * Логує кожен API-запит: метод, URL, користувач, час виконання.
     *
     * Це комбінований middleware (before + after):
     * - Before: запам'ятовуємо час початку
     * - After: логуємо результат з часом виконання
     *
     * Аналогія з Express.js: morgan logger middleware.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // BEFORE: запам'ятовуємо час
        $startTime = microtime(true);

        // Передаємо запит далі
        $response = $next($request);

        // AFTER: обчислюємо час і логуємо
        $duration = round((microtime(true) - $startTime) * 1000, 2);

        Log::channel('daily')->info('API Request', [
            'method' => $request->method(),
            'uri' => $request->getRequestUri(),
            'status' => $response->getStatusCode(),
            'user_id' => $request->user()?->id ?? 'guest',
            'ip' => $request->ip(),
            'duration_ms' => $duration,
            'user_agent' => $request->userAgent(),
        ]);

        return $response;
    }
}
```

Лог буде записуватись у `storage/logs/laravel-YYYY-MM-DD.log`:

```
[2026-04-09 12:00:00] local.INFO: API Request {"method":"GET","uri":"/api/tasks","status":200,"user_id":1,"ip":"127.0.0.1","duration_ms":45.32,"user_agent":"curl/8.1.2"}
```

### Крок 3: Налаштуйте Rate Limiting

Відкрийте `app/Providers/AppServiceProvider.php` і додайте rate limiter-и:

```php
<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Gate для адмін-доступу (з Уроку 14)
        Gate::define('access-admin', function ($user) {
            return $user->is_admin;
        });

        // ===== Rate Limiters =====

        // Стандартний API ліміт: 60/хв для авторизованих, 20/хв для гостей
        RateLimiter::for('api', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(60)->by($request->user()->id)
                : Limit::perMinute(20)->by($request->ip());
        });

        // Строгий ліміт для логіну: 5 спроб на хвилину
        // Ключ: email + IP -- обмежуємо спроби для конкретного email з конкретного IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->input('email', '') . '|' . $request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again later.',
                    ], 429);
                });
        });

        // Ліміт для реєстрації: 3 на хвилину з одного IP
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });
    }
}
```

### Крок 4: Зареєструйте middleware у bootstrap/app.php

Відкрийте `bootstrap/app.php`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Глобальний middleware для API: завжди повертати JSON
        $middleware->api(
            prepend: [
                \App\Http\Middleware\EnsureJsonResponse::class,
            ],
            append: [
                \App\Http\Middleware\LogApiRequest::class,
            ]
        );

        // Alias для використання в маршрутах
        $middleware->alias([
            'task.limit' => \App\Http\Middleware\CheckTaskLimit::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

**Пояснення:**

- `prepend` -- додає на ПОЧАТОК ланцюжка. `EnsureJsonResponse` повинен бути першим, щоб навіть помилки в інших middleware повертались як JSON.
- `append` -- додає в КІНЕЦЬ ланцюжка. `LogApiRequest` має бути останнім, щоб виміряти час ВСЬОГО ланцюжка.
- `alias` -- створює ім'я для middleware, щоб використовувати в маршрутах.

> **Примітка:** `CheckTaskLimit` ми створимо в Кроці 6. Поки що закоментуйте цей рядок alias, якщо хочете запустити сервер до Кроку 6.

### Крок 5: Оновіть маршрути з rate limiting

Відкрийте `routes/api.php`:

```php
<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// ========================================
// Публічні маршрути
// ========================================

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:register');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

// ========================================
// Захищені маршрути
// ========================================

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Resources
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('tags', TagController::class);

    // Admin
    Route::get('/admin/stats', [AdminController::class, 'stats'])
        ->middleware('can:access-admin');
});
```

**Що ми зробили:**

1. `/register` -- `throttle:register` (3 реєстрації на хвилину з одного IP)
2. `/login` -- `throttle:login` (5 спроб на хвилину для одного email+IP)
3. Всі захищені маршрути -- `throttle:api` (60/хв для авторизованих, 20/хв для гостей)

### Крок 6: Створіть CheckTaskLimit middleware

Це middleware з бізнес-логікою: обмеження кількості задач на користувача.

```bash
php artisan make:middleware CheckTaskLimit
```

Відкрийте `app/Http/Middleware/CheckTaskLimit.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTaskLimit
{
    /**
     * Перевіряє, чи не перевищено ліміт задач для користувача.
     *
     * Максимум 50 задач на користувача. Це бізнес-правило,
     * реалізоване як middleware для чистого відокремлення від контролера.
     *
     * Аналогія з Vue: перевірка перед відправкою форми:
     *   if (tasks.value.length >= 50) {
     *       toast.error('Task limit reached');
     *       return;
     *   }
     * Але тут це серверна перевірка -- її не обійти.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $maxTasks = 50;
        $currentCount = $request->user()->tasks()->count();

        if ($currentCount >= $maxTasks) {
            return response()->json([
                'message' => "Task limit reached. You can have a maximum of {$maxTasks} tasks.",
                'current_count' => $currentCount,
                'max_allowed' => $maxTasks,
            ], 403);
        }

        return $next($request);
    }
}
```

Тепер розкоментуйте alias у `bootstrap/app.php` (якщо коментували) і застосуйте middleware тільки до маршруту створення задачі.

Оновіть `routes/api.php` -- замініть рядок `Route::apiResource('tasks', ...)`:

```php
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Tasks -- з обмеженням на створення
    Route::apiResource('tasks', TaskController::class)
        ->middleware([
            'store' => ['task.limit'], // middleware тільки для store (POST)
        ]);

    // Або альтернативний спосіб -- окремо:
    // Route::apiResource('tasks', TaskController::class)->except(['store']);
    // Route::post('/tasks', [TaskController::class, 'store'])->middleware('task.limit');

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('tags', TagController::class);

    // Admin
    Route::get('/admin/stats', [AdminController::class, 'stats'])
        ->middleware('can:access-admin');
});
```

> **Примітка:** якщо синтаксис `->middleware(['store' => [...]])` на `apiResource` не працює у вашій версії Laravel, використовуйте альтернативний спосіб з окремим маршрутом.

Альтернативний спосіб, який гарантовано працює:

```php
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Tasks
    Route::apiResource('tasks', TaskController::class)->except(['store']);
    Route::post('/tasks', [TaskController::class, 'store'])
        ->middleware('task.limit')
        ->name('tasks.store');

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('tags', TagController::class);

    // Admin
    Route::get('/admin/stats', [AdminController::class, 'stats'])
        ->middleware('can:access-admin');
});
```

### Крок 7: Перевірте список маршрутів

```bash
php artisan route:list
```

Переконайтесь, що middleware коректно присвоєні:

```
POST  api/register .......... throttle:register
POST  api/login ............. throttle:login
POST  api/logout ............ auth:sanctum, throttle:api
GET   api/me ................ auth:sanctum, throttle:api
GET   api/tasks ............. auth:sanctum, throttle:api
POST  api/tasks ............. auth:sanctum, throttle:api, task.limit
GET   api/tasks/{task} ...... auth:sanctum, throttle:api
...
GET   api/admin/stats ....... auth:sanctum, throttle:api, can:access-admin
```

---

## Перевірка

### Тест 1: JSON-відповіді для всіх помилок

```bash
# Без EnsureJsonResponse middleware -- Laravel міг повернути HTML
# Тепер завжди повертає JSON

# 404 для неіснуючого маршруту
curl -s http://localhost:8000/api/nonexistent | jq .
```

Очікуваний результат:

```json
{
  "message": "Not Found."
}
```

Без `EnsureJsonResponse` ви могли б отримати HTML-сторінку -- тепер завжди JSON.

### Тест 2: Логування запитів

```bash
# Зробіть кілька запитів
curl -s http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Перегляньте логи
tail -5 storage/logs/laravel-*.log
```

Очікуваний лог:

```
[2026-04-09 12:00:00] local.INFO: API Request {"method":"GET","uri":"/api/tasks","status":200,"user_id":1,"ip":"127.0.0.1","duration_ms":23.45,"user_agent":"curl/8.1.2"}
```

### Тест 3: Rate limiting для логіну

```bash
# Спробуйте логін 6 разів поспіль (ліміт -- 5/хв)
for i in {1..6}; do
  echo "Attempt $i:"
  curl -s -o /dev/null -w "HTTP %{http_code}" -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{"email": "john@example.com", "password": "wrong_password"}'
  echo ""
done
```

Очікуваний результат:

```
Attempt 1: HTTP 401
Attempt 2: HTTP 401
Attempt 3: HTTP 401
Attempt 4: HTTP 401
Attempt 5: HTTP 401
Attempt 6: HTTP 429    ← Too Many Requests!
```

```bash
# Подивіться тіло 429 відповіді
curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "john@example.com", "password": "wrong"}' | jq .
```

```json
{
  "message": "Too many login attempts. Please try again later."
}
```

### Тест 4: Rate limiting заголовки

```bash
curl -s -o /dev/null -D - http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | grep -i "ratelimit\|retry"
```

```
X-Ratelimit-Limit: 60
X-Ratelimit-Remaining: 59
```

### Тест 5: CheckTaskLimit middleware

```bash
# Логін
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}' | jq -r '.token')

# Створіть задачу (має працювати, якщо у вас менше 50 задач)
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Test task limit", "status": "pending", "priority": "low"}' | jq .
```

Щоб перевірити ліміт без створення 50 задач, тимчасово змініть ліміт у middleware на 3:

```php
// Тимчасово для тестування
$maxTasks = 3;
```

Створіть 3 задачі, потім спробуйте 4-ту:

```json
{
  "message": "Task limit reached. You can have a maximum of 3 tasks.",
  "current_count": 3,
  "max_allowed": 3
}
```

Не забудьте повернути ліміт назад на 50 після тестування.

---

## Міні-тест

**1. Що робить `$next($request)` у middleware?**

a) Повертає відповідь клієнту
b) Передає запит наступному middleware в ланцюжку (або контролеру)
c) Перезапускає запит з початку
d) Логує запит

**2. Яка різниця між "before" та "after" middleware?**

a) "Before" швидший, "after" повільніший
b) "Before" модифікує запит до контролера, "after" модифікує відповідь після контролера
c) "Before" для GET, "after" для POST
d) Різниці немає -- це синоніми

**3. Де реєструються middleware у Laravel 12?**

a) `config/middleware.php`
b) `app/Http/Kernel.php`
c) `bootstrap/app.php`
d) `routes/middleware.php`

**4. Який HTTP-статус повертає rate limiter при перевищенні ліміту?**

a) 401 Unauthorized
b) 403 Forbidden
c) 429 Too Many Requests
d) 503 Service Unavailable

**5. Як передати параметр у middleware через маршрут?**

a) `->middleware('role', 'admin')`
b) `->middleware('role:admin')`
c) `->middleware(['role' => 'admin'])`
d) `->middleware('role(admin)')`

---

## Практичне завдання

### Завдання: CheckTaskLimit middleware з конфігурованим лімітом

Створіть покращену версію `CheckTaskLimit` middleware, яка:

1. **Приймає параметр** -- максимальну кількість задач:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTaskLimit
{
    /**
     * @param  int  $maxTasks  -- максимальна кількість задач (за замовчуванням 50)
     */
    public function handle(Request $request, Closure $next, int $maxTasks = 50): Response
    {
        // Ваш код тут
        // 1. Отримайте кількість задач поточного користувача
        // 2. Якщо >= $maxTasks, поверніть 403 з інформативним повідомленням
        // 3. Інакше -- $next($request)
    }
}
```

2. **Застосуйте з параметром** до маршруту:

```php
// Звичайні користувачі -- 50 задач
Route::post('/tasks', [TaskController::class, 'store'])
    ->middleware('task.limit:50');

// Або premium -- 200 задач
Route::post('/premium/tasks', [TaskController::class, 'store'])
    ->middleware('task.limit:200');
```

3. **Додайте заголовок** до відповіді з інформацією про ліміт:

```php
// Після return $next($request):
$response = $next($request);
$response->headers->set('X-Task-Limit', $maxTasks);
$response->headers->set('X-Task-Count', $currentCount);
$response->headers->set('X-Task-Remaining', $maxTasks - $currentCount);
return $response;
```

4. **Протестуйте:**

```bash
# Створюйте задачі до ліміту
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -D - \
  -d '{"title": "Test", "status": "pending", "priority": "low"}'

# Перевірте заголовки:
# X-Task-Limit: 50
# X-Task-Count: 1
# X-Task-Remaining: 49
```

5. **(Бонус)** Створіть `TrackLastActivity` terminate middleware, який оновлює поле `last_active_at` в таблиці users після кожного запиту. Оскільки він виконується після відправки відповіді, це не сповільнює API.

```bash
php artisan make:middleware TrackLastActivity
php artisan make:migration add_last_active_at_to_users_table --table=users
```

```php
class TrackLastActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        // Оновлюємо last_active_at після відправки відповіді
        if ($request->user()) {
            $request->user()->update(['last_active_at' => now()]);
        }
    }
}
```

---

## Відповіді на тест

1. **b) Передає запит наступному middleware в ланцюжку (або контролеру)**. `$next($request)` -- це аналог `next()` в Express.js. Він передає запит далі по ланцюжку middleware. Якщо це останній middleware, запит потрапляє в контролер.

2. **b) "Before" модифікує запит до контролера, "after" модифікує відповідь після контролера**. "Before" middleware: спочатку ваш код, потім `$next($request)`. "After" middleware: спочатку `$response = $next($request)`, потім ваш код з `$response`.

3. **c) `bootstrap/app.php`**. У Laravel 12 (та 11) middleware реєструються в `bootstrap/app.php` через `->withMiddleware()`. Старий `app/Http/Kernel.php` більше не використовується.

4. **c) 429 Too Many Requests**. Коли rate limiter виявляє перевищення ліміту, Laravel повертає 429 з заголовками `X-RateLimit-Limit`, `X-RateLimit-Remaining` та `Retry-After`.

5. **b) `->middleware('role:admin')`**. Параметри middleware передаються через двокрапку: `'middleware_name:param1,param2'`. У middleware вони приймаються як додаткові аргументи `handle($request, $next, $param1, $param2)`.
