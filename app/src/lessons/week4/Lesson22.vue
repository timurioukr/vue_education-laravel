<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import CodePlayground from '@/components/interactive/CodePlayground.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion } from '@/types'

defineProps<{
  activeTab: string
}>()

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Що таке CORS preflight запит?',
    options: [
      'GET-запит, який браузер відправляє перед кожним запитом',
      'OPTIONS-запит, який браузер відправляє перед "складними" запитами для перевірки дозволів',
      'POST-запит на спеціальний endpoint /preflight',
      'HEAD-запит для перевірки розміру відповіді',
    ],
    correct: 1,
    explanation:
      'Браузер автоматично відправляє OPTIONS-запит (preflight) перед "складними" запитами — тими, що мають кастомні заголовки (Authorization), Content-Type: application/json, або використовують PUT/DELETE. Сервер відповідає Access-Control-Allow-* заголовками.',
  },
  {
    question: 'Чому curl не блокується CORS, а браузер — блокується?',
    options: [
      'curl використовує інший протокол',
      'Браузер має баг у реалізації HTTP',
      'CORS — це обмеження браузера (Same-Origin Policy), а не сервера. curl не є браузером і не перевіряє CORS-заголовки',
      'curl завжди додає правильні CORS-заголовки',
    ],
    correct: 2,
    explanation:
      'CORS — це механізм безпеки браузера (Same-Origin Policy). Сервер відповідає Access-Control-Allow-Origin заголовком, і БРАУЗЕР вирішує — пропустити чи заблокувати. curl, Postman, серверний код — не мають Same-Origin Policy, тому CORS їх не стосується.',
  },
  {
    question: 'Який HTTP-статус повертає сервер при перевищенні rate limit?',
    options: [
      '403 Forbidden',
      '401 Unauthorized',
      '429 Too Many Requests',
      '503 Service Unavailable',
    ],
    correct: 2,
    explanation:
      '429 Too Many Requests — стандартний статус для rate limiting. Відповідь містить заголовок Retry-After (секунди до наступної спроби). Laravel автоматично повертає 429 коли ліміт вичерпано через ThrottleRequests middleware.',
  },
  {
    question: 'Для чого потрібен exposed_headers у config/cors.php?',
    options: [
      'Щоб приховати заголовки від сервера',
      'Щоб JavaScript у браузері міг читати ці заголовки відповіді (за замовчуванням доступні лише 6 "simple" заголовків)',
      'Щоб додати заголовки до запиту',
      'Щоб заблокувати небезпечні заголовки',
    ],
    correct: 1,
    explanation:
      'За замовчуванням JS у браузері бачить лише 6 "simple response headers" (Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma). Щоб прочитати X-RateLimit-Remaining або X-Custom-Header, сервер повинен додати їх у Access-Control-Expose-Headers.',
  },
  {
    question: 'Який найпоширеніший підхід до версіонування API?',
    options: [
      'Версія у кастомному заголовку X-API-Version',
      'URI-префікс /api/v1/, /api/v2/',
      'Версія у query-параметрі ?version=2',
      'Різні домени api-v1.example.com, api-v2.example.com',
    ],
    correct: 1,
    explanation:
      'URI-префікс (/api/v1/tasks, /api/v2/tasks) — найпоширеніший підхід. Переваги: очевидний, легко документувати, легко маршрутизувати в Laravel через Route::prefix. Альтернативи (заголовки, query) теж працюють, але менш популярні через складність кешування та документації.',
  },
]

// === CodeComparison: Vite proxy vs Laravel CORS ===
const jsViteProxy = `// vite.config.ts — проксі для dev
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Vite dev-сервер (localhost:5173)
        // проксює /api/* → Laravel (localhost:8000)
        // Браузер бачить Same-Origin → без CORS!
      },
    },
  },
})

// axios у dev — працює без CORS:
// GET /api/tasks → Vite proxy → Laravel:8000/api/tasks

// Але на production — різні домени:
// frontend: app.example.com
// backend:  api.example.com
// → потрібен CORS на Laravel!

// DevTools помилка без проксі/CORS:
// ❌ Access to XMLHttpRequest at 'http://localhost:8000/api/tasks'
//    from origin 'http://localhost:5173' has been blocked by CORS
//    policy: No 'Access-Control-Allow-Origin' header is present`

const phpCorsConfig = `<?php
// config/cors.php — Laravel CORS конфігурація
return [
    // Які шляхи підпадають під CORS
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Дозволені HTTP-методи (* = всі)
    'allowed_methods' => ['*'],

    // Дозволені origins (домени фронтенду)
    'allowed_origins' => [
        'http://localhost:5173',       // Vite dev
        'https://app.example.com',     // production
    ],

    // Або pattern (regex):
    'allowed_origins_patterns' => [
        // 'https://*.example.com'
    ],

    // Заголовки, які клієнт може відправляти
    'allowed_headers' => ['*'],

    // Заголовки, які JS може ЧИТАТИ з відповіді
    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'Retry-After',
    ],

    // Дозволити cookies/Authorization
    'supports_credentials' => true,

    // Час кешування preflight (секунди)
    'max_age' => 7200,       // 2 години
];

// Laravel автоматично обробляє OPTIONS preflight
// через HandleCors middleware (включений за замовчуванням)`

// === CodeBlock: Preflight flow ===
const preflightFlowCode = `CORS Preflight — крок за кроком
═══════════════════════════════════════════════════════

Браузер: fetch('https://api.example.com/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',   ← "складний" тип
    'Authorization': 'Bearer token123',    ← кастомний заголовок
  },
  body: JSON.stringify({ title: 'New' }),
})

─── Крок 1: Preflight (автоматично) ────────────────

OPTIONS /api/tasks HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

─── Крок 2: Сервер відповідає ──────────────────────

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 7200

─── Крок 3: Основний запит ─────────────────────────

POST /api/tasks HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Content-Type: application/json
Authorization: Bearer token123

{"title": "New"}

─── Крок 4: Відповідь ─────────────────────────────

HTTP/1.1 201 Created
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Expose-Headers: X-RateLimit-Remaining
X-RateLimit-Remaining: 57

{"data": {"id": 42, "title": "New"}}

💡 "Прості" запити (GET без кастомних заголовків) — БЕЗ preflight`

// === CodeBlock: Rate Limiting ===
const rateLimitCode = `<?php
// app/Providers/AppServiceProvider.php

use Illuminate\\Cache\\RateLimiting\\Limit;
use Illuminate\\Support\\Facades\\RateLimiter;
use Illuminate\\Http\\Request;

public function boot(): void
{
    // Загальний ліміт для API — 60 запитів на хвилину
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip());
    });

    // Жорсткий ліміт для логіну — 5 спроб на хвилину
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)
            ->by($request->ip())
            ->response(function () {
                return response()->json([
                    'message' => 'Забагато спроб. Спробуйте через хвилину.',
                ], 429);
            });
    });

    // Різні ліміти для різних ролей
    RateLimiter::for('premium-api', function (Request $request) {
        return $request->user()?->is_premium
            ? Limit::perMinute(300)->by($request->user()->id)
            : Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
}

// routes/api.php
Route::middleware('throttle:login')->post('/login', [AuthController::class, 'login']);
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('tasks', TaskController::class);
});
Route::middleware('throttle:premium-api')->group(function () {
    Route::get('/reports', [ReportController::class, 'index']);
});`

// === CodeBlock: Rate Limit Headers + Axios interceptor ===
const rateLimitHeadersCode = `Заголовки Rate Limit у відповіді
═══════════════════════════════════════════════════════

HTTP/1.1 200 OK
X-RateLimit-Limit: 60              ← максимум запитів
X-RateLimit-Remaining: 42          ← залишилось
Retry-After: 58                    ← секунд до скидання (тільки при 429)

─── Коли ліміт вичерпано ──────────────────────────

HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
Retry-After: 34

{"message": "Too Many Attempts."}

─── ВАЖЛИВО: exposed_headers ──────────────────────

Без exposed_headers у config/cors.php:
  response.headers.get('X-RateLimit-Remaining')  → null ❌

З exposed_headers: ['X-RateLimit-Remaining']:
  response.headers.get('X-RateLimit-Remaining')  → "42" ✅`

const axiosInterceptorCode = `// src/api/axios.ts — Vue interceptor для rate limit
import axios from 'axios'
import { useToast } from '@/composables/useToast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => {
    // Читаємо rate limit заголовки
    const remaining = response.headers['x-ratelimit-remaining']
    const limit = response.headers['x-ratelimit-limit']

    if (remaining !== undefined && Number(remaining) < 10) {
      console.warn(\`Rate limit: \${remaining}/\${limit} залишилось\`)
    }

    return response
  },
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60
      const toast = useToast()

      toast.error(
        \`Забагато запитів. Спробуйте через \${retryAfter} секунд.\`
      )

      // Автоматичний retry через retryAfter секунд
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api.request(error.config))
        }, Number(retryAfter) * 1000)
      })
    }

    return Promise.reject(error)
  }
)

export default api`

// === CodeBlock: API Versioning ===
const versioningCode = `<?php
// routes/api.php — версіонування через URI-префікс

use App\\Http\\Controllers\\Api\\V1\\TaskController as V1TaskController;
use App\\Http\\Controllers\\Api\\V2\\TaskController as V2TaskController;

// /api/v1/* — поточна стабільна версія
Route::prefix('v1')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('tasks', V1TaskController::class);
    });
});

// /api/v2/* — нова версія з breaking changes
Route::prefix('v2')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('tasks', V2TaskController::class);
    });
});

// ─── Структура контролерів ──────────────────────
// app/Http/Controllers/Api/V1/TaskController.php
// app/Http/Controllers/Api/V2/TaskController.php
// app/Http/Resources/V1/TaskResource.php
// app/Http/Resources/V2/TaskResource.php

// ─── V1 Resource — поточний формат ──────────────
// app/Http/Resources/V1/TaskResource.php
namespace App\\Http\\Resources\\V1;

class TaskResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'status'      => $this->status,      // string: "pending"
            'deadline'    => $this->deadline?->toISOString(),
            'created_at'  => $this->created_at->toISOString(),
        ];
    }
}

// ─── V2 Resource — новий формат ─────────────────
// app/Http/Resources/V2/TaskResource.php
namespace App\\Http\\Resources\\V2;

class TaskResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'status'      => [                    // object замість string
                'value' => $this->status,
                'label' => __("statuses.{$this->status}"),
            ],
            'deadline'    => [                    // object з computed полями
                'date'       => $this->deadline?->toISOString(),
                'is_overdue' => $this->deadline?->isPast() && $this->status !== 'done',
                'human'      => $this->deadline?->diffForHumans(),
            ],
            'timestamps'  => [                    // згруповано
                'created' => $this->created_at->toISOString(),
                'updated' => $this->updated_at->toISOString(),
            ],
        ];
    }
}`

// === CodeBlock: Health Check ===
const healthCheckCode = `<?php
// routes/api.php — health check endpoint (без auth)
Route::get('/health', function () {
    return response()->json([
        'status'  => 'ok',
        'version' => config('app.version', '1.0.0'),
        'time'    => now()->toISOString(),
    ]);
});

// Використання:
// GET /api/health → {"status":"ok","version":"1.0.0","time":"2026-04-13T10:00:00Z"}
// Корисно для: моніторингу, load balancer health checks, CI/CD`

// === CodeComparison: Version differences ===
const jsVersionSwitch = `// src/api/config.ts — перемикання версій
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'

const api = axios.create({
  baseURL: \`\${import.meta.env.VITE_API_URL}/\${API_VERSION}\`,
})

// .env
// VITE_API_URL=https://api.example.com
// VITE_API_VERSION=v1

// Використання в composable:
// GET /api/v1/tasks  або  /api/v2/tasks
const { data } = await api.get('/tasks')

// Адаптер для V1 → V2 відмінностей:
function normalizeTask(raw: any, version: string) {
  if (version === 'v2') {
    return {
      ...raw,
      status: raw.status.value,       // object → string
      deadline: raw.deadline.date,     // object → string
      isOverdue: raw.deadline.is_overdue,
    }
  }
  return raw // V1 формат
}`

const phpVersionComparison = `<?php
// GET /api/v1/tasks/1 — відповідь V1
{
    "data": {
        "id": 1,
        "title": "Buy groceries",
        "status": "pending",
        "deadline": "2026-04-15T00:00:00.000Z",
        "created_at": "2026-04-01T10:00:00.000Z"
    }
}

// GET /api/v2/tasks/1 — відповідь V2
{
    "data": {
        "id": 1,
        "title": "Buy groceries",
        "status": {
            "value": "pending",
            "label": "Очікує"
        },
        "deadline": {
            "date": "2026-04-15T00:00:00.000Z",
            "is_overdue": false,
            "human": "2 дні залишилось"
        },
        "timestamps": {
            "created": "2026-04-01T10:00:00.000Z",
            "updated": "2026-04-13T08:30:00.000Z"
        }
    }
}

// V2 breaking changes:
// - status: string → object {value, label}
// - deadline: string → object {date, is_overdue, human}
// - created_at → timestamps.created / timestamps.updated`

// === Practice: PHP simulation ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо CORS check, Rate Limiter, API Version Router
// на чистому PHP — показуємо механіку кожного концепту.

// ===== CORS Checker =====
class CorsChecker
{
    private array $allowedOrigins;
    private array $allowedMethods;
    private array $exposedHeaders;

    public function __construct(array $config) {
        $this->allowedOrigins  = $config['allowed_origins'] ?? [];
        $this->allowedMethods  = $config['allowed_methods'] ?? ['GET'];
        $this->exposedHeaders  = $config['exposed_headers'] ?? [];
    }

    /** Перевіряє чи origin дозволений */
    public function isOriginAllowed(string $origin): bool {
        if (in_array('*', $this->allowedOrigins)) { return true; }
        return in_array($origin, $this->allowedOrigins);
    }

    /** Генерує CORS-заголовки для відповіді */
    public function getHeaders(string $origin): array {
        if (! $this->isOriginAllowed($origin)) { return []; }
        return [
            'Access-Control-Allow-Origin'   => $origin,
            'Access-Control-Allow-Methods'  => implode(', ', $this->allowedMethods),
            'Access-Control-Expose-Headers' => implode(', ', $this->exposedHeaders),
            'Access-Control-Allow-Credentials' => 'true',
        ];
    }

    /** Обробляє preflight OPTIONS запит */
    public function handlePreflight(string $origin, string $method): array {
        if (! $this->isOriginAllowed($origin)) {
            return ['status' => 403, 'headers' => []];
        }
        if (! in_array($method, $this->allowedMethods) && ! in_array('*', $this->allowedMethods)) {
            return ['status' => 405, 'headers' => []];
        }
        return [
            'status'  => 204,
            'headers' => $this->getHeaders($origin) + [
                'Access-Control-Max-Age' => '7200',
            ],
        ];
    }
}

// ===== Rate Limiter =====
class SimpleRateLimiter
{
    private array $hits = [];    // [key => [timestamps]]
    private int $maxAttempts;
    private int $windowSeconds;

    public function __construct(int $maxAttempts = 60, int $windowSeconds = 60) {
        $this->maxAttempts   = $maxAttempts;
        $this->windowSeconds = $windowSeconds;
    }

    /** Записує спробу і повертає чи дозволено */
    public function attempt(string $key): bool {
        $now = time();
        $this->hits[$key] = array_filter(
            $this->hits[$key] ?? [],
            fn (int $t) => ($now - $t) < $this->windowSeconds
        );
        if (count($this->hits[$key]) >= $this->maxAttempts) { return false; }
        $this->hits[$key][] = $now;
        return true;
    }

    public function remaining(string $key): int {
        $now = time();
        $recent = array_filter(
            $this->hits[$key] ?? [],
            fn (int $t) => ($now - $t) < $this->windowSeconds
        );
        return max(0, $this->maxAttempts - count($recent));
    }

    public function headers(string $key): array {
        return [
            'X-RateLimit-Limit'     => (string) $this->maxAttempts,
            'X-RateLimit-Remaining' => (string) $this->remaining($key),
        ];
    }
}

// ===== API Version Router =====
class VersionRouter
{
    private array $routes = []; // [version => [path => handler]]

    public function register(string $version, string $path, callable $handler): void {
        $this->routes[$version][$path] = $handler;
    }

    /** Маршрутизує /api/v{N}/path → відповідний handler */
    public function dispatch(string $uri): array {
        // Парсимо: /api/v1/tasks → version=v1, path=/tasks
        if (preg_match('#^/api/(v\\d+)(/.*)$#', $uri, $m)) {
            $version = $m[1];
            $path    = $m[2];

            if (isset($this->routes[$version][$path])) {
                $data = ($this->routes[$version][$path])();
                return ['status' => 200, 'version' => $version, 'data' => $data];
            }
            return ['status' => 404, 'error' => "Route {$path} not found in {$version}"];
        }
        return ['status' => 400, 'error' => 'Invalid API URL format. Expected /api/v{N}/...'];
    }
}

// ===== Тестуємо =====
$passed = 0; $failed = 0;

function it(string $name, callable $fn): void {
    global $passed, $failed;
    try { $fn(); $passed++; echo "  ✓ {$name}\\n"; }
    catch (\\Exception $e) { $failed++; echo "  ✗ {$name} — {$e->getMessage()}\\n"; }
}

function assertEqual(mixed $expected, mixed $actual, string $msg = ''): void {
    if ($expected !== $actual) {
        throw new \\Exception($msg ?: "Expected " . json_encode($expected) . ", got " . json_encode($actual));
    }
}

// --- CORS Tests ---
echo "=== CORS ===\\n";

$cors = new CorsChecker([
    'allowed_origins'  => ['http://localhost:5173', 'https://app.example.com'],
    'allowed_methods'  => ['GET', 'POST', 'PUT', 'DELETE'],
    'exposed_headers'  => ['X-RateLimit-Remaining'],
]);

it('allows known origin', function () use ($cors) {
    assertEqual(true, $cors->isOriginAllowed('http://localhost:5173'));
});

it('blocks unknown origin', function () use ($cors) {
    assertEqual(false, $cors->isOriginAllowed('http://evil.com'));
});

it('preflight returns 204 for allowed origin', function () use ($cors) {
    $result = $cors->handlePreflight('http://localhost:5173', 'POST');
    assertEqual(204, $result['status']);
});

it('preflight returns 403 for blocked origin', function () use ($cors) {
    $result = $cors->handlePreflight('http://evil.com', 'POST');
    assertEqual(403, $result['status']);
});

// --- Rate Limiter Tests ---
echo "\\n=== Rate Limiter ===\\n";

$limiter = new SimpleRateLimiter(maxAttempts: 3, windowSeconds: 60);

it('allows requests under limit', function () use ($limiter) {
    assertEqual(true, $limiter->attempt('user:1'));
    assertEqual(true, $limiter->attempt('user:1'));
    assertEqual(true, $limiter->attempt('user:1'));
});

it('blocks request when limit exceeded', function () use ($limiter) {
    assertEqual(false, $limiter->attempt('user:1')); // 4th attempt
});

it('tracks remaining correctly', function () use ($limiter) {
    assertEqual(0, $limiter->remaining('user:1'));
});

it('returns rate limit headers', function () use ($limiter) {
    $h = $limiter->headers('user:1');
    assertEqual('3', $h['X-RateLimit-Limit']);
    assertEqual('0', $h['X-RateLimit-Remaining']);
});

// --- Version Router Tests ---
echo "\\n=== API Versioning ===\\n";

$router = new VersionRouter();
$router->register('v1', '/tasks', fn () => [
    ['id' => 1, 'title' => 'Buy milk', 'status' => 'pending'],
]);
$router->register('v2', '/tasks', fn () => [
    ['id' => 1, 'title' => 'Buy milk', 'status' => ['value' => 'pending', 'label' => 'Очікує']],
]);

it('routes /api/v1/tasks to V1 handler', function () use ($router) {
    $r = $router->dispatch('/api/v1/tasks');
    assertEqual(200, $r['status']);
    assertEqual('v1', $r['version']);
    assertEqual('pending', $r['data'][0]['status']);
});

it('routes /api/v2/tasks to V2 handler', function () use ($router) {
    $r = $router->dispatch('/api/v2/tasks');
    assertEqual(200, $r['status']);
    assertEqual('v2', $r['version']);
    assertEqual('Очікує', $r['data'][0]['status']['label']);
});

it('returns 404 for unknown route', function () use ($router) {
    $r = $router->dispatch('/api/v1/unknown');
    assertEqual(404, $r['status']);
});

it('returns 400 for invalid URL format', function () use ($router) {
    $r = $router->dispatch('/tasks');
    assertEqual(400, $r['status']);
});

echo "\\n=== {$passed} passed, {$failed} failed ===\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте corsCheck(), rateLimiter(), versionRouter().
 *
 * 3 функції:
 *
 *   1) corsCheck(string $origin, array $allowedOrigins): array
 *      - Якщо origin є в $allowedOrigins або $allowedOrigins містить '*':
 *        повернути ['allowed' => true, 'headers' => ['Access-Control-Allow-Origin' => $origin]]
 *      - Інакше: ['allowed' => false, 'headers' => []]
 *
 *   2) rateLimiter(string $key, array &$store, int $max = 5): array
 *      - $store — масив-лічильник (передається за посиланням): ['key' => count]
 *      - Якщо $store[$key] < $max: інкрементувати і повернути
 *        ['allowed' => true, 'remaining' => $max - $store[$key], 'status' => 200]
 *      - Інакше:
 *        ['allowed' => false, 'remaining' => 0, 'status' => 429]
 *
 *   3) versionRouter(string $uri, array $handlers): array
 *      - Парсити URI формату /api/v{N}/resource
 *      - Знайти handler у $handlers['v{N}']['/resource']
 *      - Якщо знайдено: ['status' => 200, 'version' => 'v{N}', 'data' => handler()]
 *      - Якщо версія/шлях не знайдені: ['status' => 404]
 *      - Якщо формат невалідний: ['status' => 400]
 */

function corsCheck(string $origin, array $allowedOrigins): array {
    // Ваш код тут
}

function rateLimiter(string $key, array &$store, int $max = 5): array {
    // Ваш код тут
}

function versionRouter(string $uri, array $handlers): array {
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 10;

function check(string $name, bool $ok): void {
    global $pass;
    if ($ok) { $pass++; echo "✓ {$name}\\n"; }
    else     { echo "✗ {$name}\\n"; }
}

// 1. corsCheck — allowed origin
$r = corsCheck('http://localhost:5173', ['http://localhost:5173', 'https://app.example.com']);
check('CORS: allowed origin', $r['allowed'] === true && $r['headers']['Access-Control-Allow-Origin'] === 'http://localhost:5173');

// 2. corsCheck — blocked origin
$r = corsCheck('http://evil.com', ['http://localhost:5173']);
check('CORS: blocked origin', $r['allowed'] === false && $r['headers'] === []);

// 3. corsCheck — wildcard
$r = corsCheck('http://anything.com', ['*']);
check('CORS: wildcard allows any', $r['allowed'] === true);

// 4. rateLimiter — allowed
$store = [];
$r = rateLimiter('user:1', $store, 3);
check('Rate: first request allowed', $r['allowed'] === true && $r['remaining'] === 2 && $r['status'] === 200);

// 5. rateLimiter — remaining decreases
rateLimiter('user:1', $store, 3);
$r = rateLimiter('user:1', $store, 3);
check('Rate: 3rd request, remaining=0', $r['allowed'] === true && $r['remaining'] === 0);

// 6. rateLimiter — blocked at limit
$r = rateLimiter('user:1', $store, 3);
check('Rate: 4th request blocked (429)', $r['allowed'] === false && $r['status'] === 429);

// 7. rateLimiter — different keys independent
$r = rateLimiter('user:2', $store, 3);
check('Rate: different key independent', $r['allowed'] === true && $r['remaining'] === 2);

// 8. versionRouter — v1 route
$handlers = [
    'v1' => ['/tasks' => fn () => ['id' => 1, 'status' => 'pending']],
    'v2' => ['/tasks' => fn () => ['id' => 1, 'status' => ['value' => 'pending']]],
];
$r = versionRouter('/api/v1/tasks', $handlers);
check('Router: v1 → 200 + correct data', $r['status'] === 200 && $r['version'] === 'v1' && $r['data']['status'] === 'pending');

// 9. versionRouter — v2 route
$r = versionRouter('/api/v2/tasks', $handlers);
check('Router: v2 → 200 + correct data', $r['status'] === 200 && $r['version'] === 'v2' && $r['data']['status']['value'] === 'pending');

// 10. versionRouter — invalid URI
$r = versionRouter('/tasks', $handlers);
check('Router: invalid URI → 400', $r['status'] === 400);

echo "\\nРезультат: {$pass}/{$total}\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="Vite proxy + CORS помилки в DevTools"
        to="config/cors.php + allowed_origins"
      />

      <TheoryBlock title="CORS — що це і навіщо">
        <p>
          <strong>CORS</strong> (Cross-Origin Resource Sharing) — механізм безпеки браузера.
          <strong>Same-Origin Policy</strong> забороняє JS на <code>localhost:5173</code> робити
          запити на <code>localhost:8000</code> — це різні origins (порт відрізняється). Сервер
          повинен явно дозволити це через заголовок <code>Access-Control-Allow-Origin</code>.
        </p>
        <p>
          <strong>Preflight</strong> — браузер автоматично відправляє <code>OPTIONS</code> запит
          перед "складними" запитами (POST з JSON, будь-який з Authorization заголовком). Сервер
          відповідає які origins, методи та заголовки дозволені. Якщо відповідь не підходить —
          браузер блокує основний запит. <code>curl</code> і Postman не мають Same-Origin Policy,
          тому CORS їх не стосується.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsViteProxy"
        :php="phpCorsConfig"
        js-title="Vite proxy — обхід CORS в dev"
        php-title="config/cors.php — дозволи на сервері"
      />

      <CodeBlock
        :code="preflightFlowCode"
        lang="text"
        title="Preflight OPTIONS — повний flow крок за кроком"
      />

      <TheoryBlock title="config/cors.php — детальний розбір">
        <p>
          <code>allowed_origins</code> — масив дозволених доменів фронтенду.
          <code>allowed_methods</code> — HTTP-методи (<code>*</code> = всі).
          <code>exposed_headers</code> — які заголовки відповіді JS може читати (за замовчуванням
          браузер приховує кастомні заголовки від JS). <code>supports_credentials: true</code> —
          дозволяє передавати cookies та Authorization. <code>max_age</code> — скільки секунд
          браузер кешує preflight (не відправляє повторно).
        </p>
      </TheoryBlock>

      <TheoryBlock title="Rate Limiting — захист від зловживань">
        <p>
          <code>RateLimiter::for()</code> в <code>AppServiceProvider</code> визначає ліміти.
          Стандартний <code>api</code> — 60 запитів/хвилину на юзера. Для логіну — жорсткіший ліміт
          (5/хв) по IP. Для premium-юзерів — вищий ліміт. Middleware
          <code>throttle:api</code> підключає ліміт до маршрутів.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="rateLimitCode"
        lang="php"
        title="RateLimiter::for() — різні ліміти для різних маршрутів"
      />

      <TheoryBlock title="Rate Limit Headers + Vue Axios interceptor">
        <p>
          Сервер повертає заголовки: <code>X-RateLimit-Limit</code> (максимум),
          <code>X-RateLimit-Remaining</code> (залишилось), <code>Retry-After</code> (секунд до
          скидання при 429). Щоб JS міг їх прочитати — додайте в <code>exposed_headers</code>. В
          axios interceptor можна показати toast при 429 та автоматично retry через
          <code>Retry-After</code> секунд.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="rateLimitHeadersCode"
        lang="text"
        title="Rate Limit заголовки — що бачить браузер"
      />

      <CodeBlock
        :code="axiosInterceptorCode"
        lang="typescript"
        title="Axios interceptor — обробка 429 + auto-retry"
      />

      <TheoryBlock title="API Versioning — URI-префікс /api/v1/ vs /api/v2/">
        <p>
          Коли API має breaking changes (формат відповіді змінюється) — потрібна нова версія.
          Найпоширеніший підхід — <strong>URI-префікс</strong>: <code>/api/v1/tasks</code>,
          <code>/api/v2/tasks</code>. Кожна версія має окремі контролери та Resource-класи. Старі
          клієнти продовжують працювати з v1, нові — переходять на v2.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="versioningCode"
        lang="php"
        title="API Versioning — routes, controllers, resources"
      />

      <CodeComparison
        :js="jsVersionSwitch"
        :php="phpVersionComparison"
        js-title="Vue — перемикання версій API"
        php-title="V1 vs V2 — формат відповіді"
      />

      <TheoryBlock title="Health Check endpoint">
        <p>
          Простий GET-endpoint без автентифікації, який повертає статус сервера. Використовується
          для моніторингу (UptimeRobot, Pingdom), health checks load balancer (ALB/nginx), перевірки
          в CI/CD перед деплоєм. Мінімальна відповідь:
          <code>{"status": "ok"}</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="healthCheckCode" lang="php" title="Health Check — /api/health" />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: CORS Checker + Rate Limiter + Version Router">
        <p>
          У playground ми <strong>самі реалізуємо</strong> механіку CORS-перевірки (origin matching,
          preflight handling), rate limiter (лічильник з віконним обмеженням) та API version router
          (парсинг URI, маршрутизація по версіях). 12 тестів перевіряють усі edge cases.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/22-cors-ratelimit-versioning.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="4-22" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте corsCheck(), rateLimiter(), versionRouter()">
        <p>
          Реалізуйте 3 функції: <code>corsCheck</code> (перевірка origin + генерація заголовків),
          <code>rateLimiter</code> (лічильник спроб з лімітом), <code>versionRouter</code> (парсинг
          URI і маршрутизація по версіях). Натисніть <strong>"Запустити"</strong> — 10 тестів
          перевірять: allowed/blocked origin, wildcard, rate limit counting, 429 blocking,
          independent keys, v1/v2 routing, invalid URI.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте CORS + Rate Limit + Version Router"
        :test-code="taskTestCode"
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
