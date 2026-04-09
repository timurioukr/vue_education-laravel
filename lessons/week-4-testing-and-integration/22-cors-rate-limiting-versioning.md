# Урок 22: CORS, Rate Limiting та API Versioning

## Що ви вивчите

- Що таке CORS і чому ваш Vue dev-сервер отримує помилку при запитах до Laravel
- Як налаштувати `config/cors.php`: allowed_origins, allowed_methods, allowed_headers
- Як працюють credentials та cookies з CORS
- Rate limiting: різні ліміти для різних маршрутів (authenticated, guest, login)
- Кастомні ключі rate limiter (per-user, per-IP)
- Заголовки rate limit у відповідях: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After
- Стратегії версіонування API: URI prefix, організація файлів, контролерів
- Підтримка зворотної сумісності між версіями
- Health check endpoint для моніторингу

---

## Паралелі з JS/Vue

| Laravel / PHP | Vue / JS | Коментар |
|---|---|---|
| CORS middleware | Те, що блокує ваш `fetch()` з Vue dev-сервера | Тепер ви налаштовуєте серверний бік! |
| `allowed_origins` | `server.proxy` у `vite.config.ts` | Та ж проблема, інший бік рішення |
| `config/cors.php` | CORS-заголовки, які ви бачили в DevTools | Тепер ви знаєте, хто їх ставить |
| Rate Limiting | `useDebounceFn()` / `useThrottleFn()` з VueUse | Серверний debounce, а не клієнтський |
| `RateLimiter::for()` | `defineStore()` в Pinia | Оголошення іменованого лімітера |
| `X-RateLimit-Remaining` заголовок | Дані для показу "Залишилось N запитів" у UI | Фронтенд може читати ці заголовки |
| `/api/v1/tasks`, `/api/v2/tasks` | `@/components/v2/TaskCard.vue` | Версіонування для зворотної сумісності |
| Health check `/api/health` | Ping endpoint для моніторингу uptime | Використовується deploy-скриптами та Uptime Robot |

---

## Теорія

### 1. CORS: Cross-Origin Resource Sharing

#### Що це і чому блокує ваш Vue

Як Vue-розробник, ви напевно бачили цю помилку в консолі браузера:

```
Access to XMLHttpRequest at 'http://localhost:8000/api/tasks' from origin
'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

**CORS** -- це механізм безпеки браузера. Браузер забороняє JavaScript робити запити на інший домен (або порт), якщо сервер явно не дозволить це.

Ваш Vue dev-сервер працює на `http://localhost:5173`, а Laravel API -- на `http://localhost:8000`. Це **різні origins** (відрізняється порт), тому браузер блокує запити.

```
Vue (localhost:5173) ---> Laravel (localhost:8000)
       |                           |
       |    "Можна мені дані?"     |
       |-------------------------->|
       |                           |
       |  "Ні, CORS не дозволяє"  |
       |<--------------------------|
```

Важливо: це обмеження **браузера**, а не сервера. `curl` та Postman працюють без проблем, бо вони не перевіряють CORS.

#### Як працює CORS: preflight-запити

Коли браузер робить "складний" запит (POST з JSON, запит з кастомними заголовками), він спочатку надсилає **preflight-запит** методом `OPTIONS`:

```
1. Браузер --> OPTIONS /api/tasks (preflight)
   Headers:
     Origin: http://localhost:5173
     Access-Control-Request-Method: POST
     Access-Control-Request-Headers: Content-Type, Authorization

2. Laravel --> 200 OK
   Headers:
     Access-Control-Allow-Origin: http://localhost:5173
     Access-Control-Allow-Methods: GET, POST, PUT, DELETE
     Access-Control-Allow-Headers: Content-Type, Authorization

3. Браузер --> POST /api/tasks (справжній запит)
   (тепер дозволено)
```

Це як охоронець на вході: спочатку перевіряє пропуск (OPTIONS), потім пускає (POST).

#### Налаштування CORS у Laravel

Laravel має вбудований middleware для CORS. Конфігурація знаходиться у `config/cors.php`.

Спочатку опублікуйте конфігурацію, якщо файл не існує:

```bash
php artisan config:publish cors
```

```php
// config/cors.php

return [
    /*
     * Які шляхи обробляти CORS.
     * 'api/*' означає всі маршрути, що починаються з /api/
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /*
     * Які HTTP-методи дозволити.
     * '*' = всі методи (GET, POST, PUT, DELETE тощо)
     */
    'allowed_methods' => ['*'],

    /*
     * Які origins (домени) можуть робити запити.
     * Для розробки: адреса Vue dev-сервера.
     * Для production: домен вашого фронтенду.
     */
    'allowed_origins' => [
        'http://localhost:5173',    // Vite dev server
        'http://localhost:3000',    // альтернативний порт
    ],

    /*
     * Паттерни для origins (regex).
     * Корисно для субдоменів: '*.example.com'
     */
    'allowed_origins_patterns' => [],

    /*
     * Які заголовки клієнт може надсилати.
     * '*' = всі. Або явно: Content-Type, Authorization, Accept
     */
    'allowed_headers' => ['*'],

    /*
     * Які заголовки відповіді клієнт може читати.
     * За замовчуванням браузер бачить тільки "прості" заголовки.
     * Додаємо rate limit заголовки.
     */
    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'Retry-After',
    ],

    /*
     * Чи дозволити cookies/credentials у cross-origin запитах.
     * true -- потрібно для Sanctum SPA authentication.
     */
    'supports_credentials' => false,

    /*
     * Скільки секунд кешувати preflight-відповідь.
     * 0 = не кешувати. 86400 = 24 години.
     */
    'max_age' => 0,
];
```

#### Credentials та Cookies

Якщо ваш Vue SPA використовує cookie-based автентифікацію (Sanctum SPA mode), потрібно:

1. У Laravel: `'supports_credentials' => true`
2. У Vue (Axios): `withCredentials: true`

```typescript
// Vue: src/api/client.ts
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // надсилати cookies
});
```

Але у нашому Task Manager ми використовуємо **token-based** автентифікацію (Bearer token), тому `supports_credentials` залишаємо `false`. Token передається через заголовок `Authorization`, а не через cookies.

---

### 2. Rate Limiting

#### Навіщо потрібен Rate Limiting

Rate limiting захищає ваш API від:
- **Brute force атак** на логін (перебір паролів)
- **DDoS** (занадто багато запитів від одного клієнта)
- **Зловживання API** (скрейпінг, спам)

На фронтенді ви використовуєте `debounce` та `throttle` для обмеження запитів з боку клієнта:

```typescript
// Vue -- клієнтський throttle
import { useThrottleFn } from '@vueuse/core'

const searchTasks = useThrottleFn((query: string) => {
  api.get('/tasks', { params: { search: query } })
}, 1000) // максимум 1 запит на секунду
```

Але клієнтський throttle можна обійти (відкрити DevTools, зробити запит напряму). **Серверний rate limiting** -- це справжній захист.

#### Налаштування Rate Limiter у Laravel

Rate limiter визначається у `AppServiceProvider`:

```php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        // Стандартний ліміт для API: 60 запитів на хвилину
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: $request->ip());
        });

        // Суворий ліміт для логіну: 5 спроб на хвилину
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again later.',
                    ], 429, $headers);
                });
        });

        // Ліміт для гостей (незалогінених): 20 запитів на хвилину
        RateLimiter::for('guest', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        // Різні ліміти для різних користувачів
        RateLimiter::for('authenticated', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(120)->by($request->user()->id)
                : Limit::perMinute(20)->by($request->ip());
        });

        // Ліміт для завантаження файлів: 10 на хвилину
        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->id ?: $request->ip());
        });
    }
}
```

#### Застосування Rate Limiter до маршрутів

```php
// routes/api.php

use Illuminate\Support\Facades\Route;

// Логін з суворим лімітом
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:login');

// Захищені маршрути з підвищеним лімітом
Route::middleware(['auth:sanctum', 'throttle:authenticated'])->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);

    // Завантаження файлів з окремим лімітом
    Route::post('/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])
        ->middleware('throttle:uploads');
});
```

#### Rate Limit заголовки у відповідях

Кожна відповідь від маршруту з rate limiting містить спеціальні заголовки:

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 60          # Максимум запитів
X-RateLimit-Remaining: 57      # Залишилось запитів
```

Коли ліміт вичерпано:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
Retry-After: 42                 # Секунд до скидання ліміту
```

На фронтенді ви можете використовувати ці заголовки:

```typescript
// Vue: axios response interceptor
api.interceptors.response.use(
  (response) => {
    // Показати залишок запитів у UI (опціонально)
    const remaining = response.headers['x-ratelimit-remaining'];
    if (remaining !== undefined && Number(remaining) < 10) {
      console.warn(`Rate limit warning: ${remaining} requests remaining`);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      // Показати повідомлення: "Забагато запитів. Спробуйте через N секунд"
      notify.error(`Too many requests. Retry after ${retryAfter}s`);
    }
    return Promise.reject(error);
  }
);
```

---

### 3. API Versioning

#### Навіщо версіонувати API

Уявіть: ваш API вже використовується Vue SPA та мобільним додатком. Потрібно змінити формат відповіді для задач. Якщо просто змінити -- зламаєте всіх клієнтів.

Рішення -- **версіонування**: стара версія (`v1`) працює як раніше, нова (`v2`) має новий формат.

Це як у компонентах Vue: ви не видаляєте старий prop, а додаєте новий і позначаєте старий як deprecated.

#### Стратегія: URI prefix

Найпоширеніший підхід -- додавати версію до URL:

```
/api/v1/tasks   -- стара версія
/api/v2/tasks   -- нова версія
```

#### Організація файлів

Створіть окремі файли маршрутів для кожної версії:

```
routes/
  api.php          -- головний файл (підключає версії)
  api_v1.php       -- маршрути v1
  api_v2.php       -- маршрути v2
```

```php
// routes/api_v1.php

use App\Http\Controllers\V1\TaskController;
use App\Http\Controllers\V1\CategoryController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});
```

```php
// routes/api_v2.php

use App\Http\Controllers\V2\TaskController;
use App\Http\Controllers\V2\CategoryController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});
```

#### Підключення версіонованих маршрутів

```php
// bootstrap/app.php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')
                ->prefix('api/v1')
                ->group(base_path('routes/api_v1.php'));

            Route::middleware('api')
                ->prefix('api/v2')
                ->group(base_path('routes/api_v2.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
```

Тепер маршрути доступні:
- `GET /api/v1/tasks` -- v1 контролер
- `GET /api/v2/tasks` -- v2 контролер
- `GET /api/tasks` -- "головна" версія (без префікса)

#### Організація контролерів

```
app/Http/Controllers/
  AuthController.php          -- спільний (не змінюється)
  V1/
    TaskController.php        -- v1: оригінальний формат
    CategoryController.php
  V2/
    TaskController.php        -- v2: новий формат
    CategoryController.php
```

```php
// app/Http/Controllers/V1/TaskController.php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::query()
            ->with(['category', 'tags'])
            ->where('user_id', $request->user()->id)
            ->paginate(15);

        return TaskResource::collection($tasks);
    }

    // ... інші методи
}
```

```php
// app/Http/Controllers/V2/TaskController.php

namespace App\Http\Controllers\V2;

use App\Http\Controllers\Controller;
use App\Http\Resources\V2\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::query()
            ->with(['category', 'tags'])
            ->where('user_id', $request->user()->id)
            ->paginate(15);

        // V2 використовує інший Resource з іншим форматом
        return TaskResource::collection($tasks);
    }

    // ... інші методи
}
```

#### Різні ресурси для різних версій

```php
// app/Http/Resources/V1/TaskResource.php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'deadline' => $this->deadline?->toDateString(),
            'category' => new \App\Http\Resources\V1\CategoryResource(
                $this->whenLoaded('category')
            ),
            'tags' => \App\Http\Resources\V1\TagResource::collection(
                $this->whenLoaded('tags')
            ),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
```

```php
// app/Http/Resources/V2/TaskResource.php

namespace App\Http\Resources\V2;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            // V2: статус як обʼєкт з label
            'status' => [
                'value' => $this->status,
                'label' => match ($this->status) {
                    'pending' => 'Pending',
                    'in_progress' => 'In Progress',
                    'done' => 'Completed',
                },
                'color' => match ($this->status) {
                    'pending' => '#f59e0b',
                    'in_progress' => '#3b82f6',
                    'done' => '#10b981',
                },
            ],
            // V2: пріоритет як обʼєкт з числовим значенням
            'priority' => [
                'value' => $this->priority,
                'level' => match ($this->priority) {
                    'low' => 1,
                    'medium' => 2,
                    'high' => 3,
                },
            ],
            'deadline' => $this->deadline?->toDateString(),
            // V2: is_overdue як обчислене поле
            'is_overdue' => $this->deadline
                && $this->deadline->isPast()
                && $this->status !== 'done',
            'category' => new \App\Http\Resources\V2\CategoryResource(
                $this->whenLoaded('category')
            ),
            'tags' => \App\Http\Resources\V2\TagResource::collection(
                $this->whenLoaded('tags')
            ),
            'timestamps' => [
                'created' => $this->created_at->toISOString(),
                'updated' => $this->updated_at->toISOString(),
            ],
        ];
    }
}
```

#### Зворотна сумісність

Золоті правила версіонування:

1. **Ніколи не видаляйте поля** у поточній версії -- тільки додавайте
2. **Ніколи не змінюйте тип поля** -- `string` не може стати `object`
3. **Для breaking changes** -- створюйте нову версію
4. **Старі версії** підтримуйте мінімум 6-12 місяців
5. **Додайте заголовок Deprecation** для старих версій

```php
// Middleware для deprecated версій
// app/Http/Middleware/DeprecatedApiVersion.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DeprecatedApiVersion
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Deprecation', 'true');
        $response->headers->set('Sunset', 'Sat, 01 Nov 2026 00:00:00 GMT');
        $response->headers->set(
            'Link',
            '<http://localhost:8000/api/v2>; rel="successor-version"'
        );

        return $response;
    }
}
```

---

### 4. Health Check Endpoint

Health check -- це простий endpoint, який підтверджує, що додаток працює. Його використовують:
- **Deploy-скрипти** для перевірки після розгортання
- **Моніторинг** (Uptime Robot, Pingdom) для перевірки uptime
- **Load balancer** для визначення, чи сервер живий

```php
// routes/api.php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/health', function () {
    try {
        // Перевіряємо зʼєднання з базою даних
        DB::connection()->getPdo();
        $dbStatus = 'ok';
    } catch (\Exception $e) {
        $dbStatus = 'error';
    }

    return response()->json([
        'status' => $dbStatus === 'ok' ? 'ok' : 'degraded',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString(),
        'services' => [
            'database' => $dbStatus,
        ],
    ], $dbStatus === 'ok' ? 200 : 503);
});
```

Відповідь:

```json
{
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "2026-04-09T12:00:00.000000Z",
    "services": {
        "database": "ok"
    }
}
```

---

## Практика: крок за кроком

### Крок 1: Налаштуйте CORS для Vue dev-сервера

Опублікуйте конфігурацію CORS:

```bash
php artisan config:publish cors
```

Відредагуйте `config/cors.php`:

```php
// config/cors.php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'Retry-After',
    ],
    'supports_credentials' => false,
    'max_age' => 0,
];
```

### Крок 2: Налаштуйте Rate Limiting

Відредагуйте `app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        // Стандартний API ліміт
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: $request->ip());
        });

        // Суворий ліміт для логіну
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again later.',
                    ], 429, $headers);
                });
        });

        // Ліміт для завантаження файлів
        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->id ?: $request->ip());
        });
    }
}
```

### Крок 3: Організуйте маршрути під /api/v1/ prefix

Створіть файл `routes/api_v1.php`:

```php
<?php

// routes/api_v1.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\V1\TaskController;
use App\Http\Controllers\V1\CategoryController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});
```

Оновіть `bootstrap/app.php`, щоб підключити версіонований маршрут:

```php
// bootstrap/app.php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')
                ->prefix('api/v1')
                ->group(base_path('routes/api_v1.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
```

Перемістіть контролер у namespace V1:

```bash
mkdir -p app/Http/Controllers/V1
```

Створіть `app/Http/Controllers/V1/TaskController.php` (скопіюйте існуючий контролер та змініть namespace):

```php
<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    // ... той самий код, що і в оригінальному контролері
}
```

### Крок 4: Створіть Health Check endpoint

Додайте до `routes/api.php`:

```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $dbStatus = 'ok';
    } catch (\Exception $e) {
        $dbStatus = 'error';
    }

    return response()->json([
        'status' => $dbStatus === 'ok' ? 'ok' : 'degraded',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString(),
        'services' => [
            'database' => $dbStatus,
        ],
    ]);
});
```

### Крок 5: Тестуйте CORS з curl

```bash
# Preflight-запит (OPTIONS) з Origin
curl -v -X OPTIONS http://localhost:8000/api/tasks \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type" 2>&1 | grep -i "access-control"

# Очікуємо:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
# Access-Control-Allow-Headers: Authorization, Content-Type
```

```bash
# Запит з неавторизованого origin
curl -v -X OPTIONS http://localhost:8000/api/tasks \
  -H "Origin: http://evil-site.com" \
  -H "Access-Control-Request-Method: GET" 2>&1 | grep -i "access-control"

# Очікуємо: немає заголовка Access-Control-Allow-Origin
```

### Крок 6: Тестуйте Rate Limiting

```bash
# Тест ліміту логіну: 5 спроб на хвилину
for i in {1..7}; do
  echo "Attempt $i:"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" \
    -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{"email": "wrong@test.com", "password": "wrong"}'
done

# Очікуємо:
# Attempt 1: HTTP 401
# Attempt 2: HTTP 401
# ...
# Attempt 6: HTTP 429  <-- ліміт вичерпано!
# Attempt 7: HTTP 429
```

```bash
# Перевірте заголовки rate limit
curl -s -D - http://localhost:8000/api/v1/tasks \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" | grep -i "x-ratelimit\|retry-after"

# Очікуємо:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 59
```

```bash
# Перевірте health check
curl -s http://localhost:8000/api/health | jq

# Очікуємо:
# {
#   "status": "ok",
#   "version": "1.0.0",
#   "timestamp": "2026-04-09T12:00:00.000000Z",
#   "services": { "database": "ok" }
# }
```

---

## Перевірка

Після виконання всіх кроків переконайтесь:

```bash
# 1. CORS заголовки присутні для дозволеного origin
curl -s -D - -X OPTIONS http://localhost:8000/api/tasks \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" 2>&1 | grep "Access-Control-Allow-Origin"
# Очікуємо: Access-Control-Allow-Origin: http://localhost:5173

# 2. Rate limiting працює на логіні
curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -D - -o /dev/null \
  -d '{"email":"test@test.com","password":"wrong"}' | grep "X-RateLimit"
# Очікуємо: X-RateLimit-Limit: 5

# 3. Версіоновані маршрути працюють
php artisan route:list --path=api/v1
# Очікуємо: маршрути з prefix api/v1

# 4. Health check повертає ok
curl -s http://localhost:8000/api/health | jq '.status'
# Очікуємо: "ok"
```

---

## Міні-тест

**1. Що таке CORS preflight-запит?**

a) GET-запит для перевірки доступності сервера
b) OPTIONS-запит, який браузер надсилає перед "складним" cross-origin запитом
c) POST-запит з порожнім тілом
d) Заголовок, який клієнт додає до кожного запиту

**2. Чому `curl` не блокується CORS, а браузер -- блокується?**

a) `curl` автоматично додає правильні заголовки
b) CORS -- це обмеження браузера, а не сервера; `curl` не перевіряє CORS
c) `curl` використовує інший протокол
d) Браузер кешує CORS-помилки

**3. Що повертає Laravel, коли rate limit вичерпано?**

a) 403 Forbidden
b) 401 Unauthorized
c) 429 Too Many Requests
d) 503 Service Unavailable

**4. Для чого потрібен `exposed_headers` у CORS-конфігурації?**

a) Щоб сервер міг читати заголовки клієнта
b) Щоб JavaScript у браузері міг читати зазначені заголовки відповіді
c) Щоб приховати заголовки від клієнта
d) Щоб додати заголовки до кожного запиту

**5. Який підхід до API versioning найпоширеніший?**

a) Заголовок `Accept: application/vnd.api.v2+json`
b) Query parameter `?version=2`
c) URI prefix: `/api/v1/tasks`, `/api/v2/tasks`
d) Cookie з номером версії

---

## Практичне завдання

Створіть повноцінне версіонування API з підтримкою v1 та v2:

### Вимоги

1. **Створіть `routes/api_v2.php`** з маршрутами для v2
2. **Створіть `App\Http\Controllers\V2\TaskController`** -- контролер для v2
3. **Створіть `App\Http\Resources\V2\TaskResource`** з іншим форматом відповіді:
   - `status` -- обʼєкт `{ value, label, color }` замість рядка
   - `priority` -- обʼєкт `{ value, level }` замість рядка
   - `is_overdue` -- обчислене boolean-поле
   - `timestamps` -- обʼєкт `{ created, updated }` замість окремого `created_at`
4. **Підключіть v2 маршрути** у `bootstrap/app.php`
5. **Перевірте**, що обидві версії працюють одночасно:
   - `GET /api/v1/tasks` повертає старий формат
   - `GET /api/v2/tasks` повертає новий формат

### Перевірка

```bash
# v1 -- класичний формат
curl -s http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.data[0].status'
# Очікуємо: "pending" (рядок)

# v2 -- розширений формат
curl -s http://localhost:8000/api/v2/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.data[0].status'
# Очікуємо: { "value": "pending", "label": "Pending", "color": "#f59e0b" }
```

---

## Відповіді на тест

1. **b)** OPTIONS-запит, який браузер надсилає перед "складним" cross-origin запитом. Preflight перевіряє, чи сервер дозволяє конкретний метод та заголовки з цього origin.
2. **b)** CORS -- це обмеження, яке реалізує браузер. Сервер просто повертає заголовки `Access-Control-*`, а рішення "блокувати чи ні" приймає саме браузер. `curl`, Postman та серверний код не мають цього обмеження.
3. **c)** 429 Too Many Requests -- стандартний HTTP-код для перевищення rate limit. Заголовок `Retry-After` вказує, скільки секунд чекати.
4. **b)** За замовчуванням браузер приховує більшість заголовків відповіді від JavaScript. `exposed_headers` явно дозволяє JavaScript читати зазначені заголовки (наприклад, `X-RateLimit-Remaining`).
5. **c)** URI prefix (`/api/v1/`, `/api/v2/`) -- найпоширеніший та найпростіший підхід. Він очевидний, легко документується та не вимагає парсингу заголовків.
