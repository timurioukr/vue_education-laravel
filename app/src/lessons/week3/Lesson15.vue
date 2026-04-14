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
    question: 'Що робить $next($request) у методі handle() middleware?',
    options: [
      'Повертає готову відповідь клієнту й завершує запит',
      'Передає запит наступному middleware в ланцюжку (або контролеру, якщо middleware останній)',
      'Перезапускає обробку запиту з самого початку',
      'Логує запит у файл',
    ],
    correct: 1,
    explanation:
      '$next($request) — це прямий аналог next() в Express.js. Виклик передає $request далі по ланцюжку middleware. Якщо ваш middleware останній — запит потрапляє в контролер. Якщо $next($request) НЕ викликати — обробка зупиняється і клієнт ніколи не отримає відповіді (зависання).',
  },
  {
    question: 'У чому різниця між «before» та «after» middleware?',
    options: [
      '«Before» швидший за «after» через оптимізацію',
      '«Before» виконує код ДО $next() (модифікує запит), «after» — ПІСЛЯ $next() (модифікує відповідь)',
      '«Before» тільки для GET, «after» тільки для POST',
      'Це синоніми — Laravel сам вирішує порядок',
    ],
    correct: 1,
    explanation:
      'Структура «before»: ваш код → return $next($request). Структура «after»: $response = $next($request) → ваш код з $response → return $response. Це аналог axios.interceptors.request (before) і axios.interceptors.response (after). Один middleware може робити і те, і інше — тоді він «around».',
  },
  {
    question: 'Де у Laravel 12 реєструються middleware?',
    options: [
      'config/middleware.php',
      'app/Http/Kernel.php',
      'bootstrap/app.php — через ->withMiddleware()',
      'routes/middleware.php',
    ],
    correct: 2,
    explanation:
      'У Laravel 11/12 файл app/Http/Kernel.php прибрали — замість нього все у bootstrap/app.php. Там через ->withMiddleware(fn (Middleware $m) => ...) ви реєструєте глобальні (append/prepend), API-групу (api(append: [...])), а також alias імена для використання в маршрутах.',
  },
  {
    question: 'Який HTTP-статус повертає Laravel rate limiter при перевищенні ліміту?',
    options: [
      '401 Unauthorized',
      '403 Forbidden',
      '429 Too Many Requests',
      '503 Service Unavailable',
    ],
    correct: 2,
    explanation:
      'При перевищенні Laravel повертає 429 разом із заголовками X-RateLimit-Limit, X-RateLimit-Remaining і Retry-After (секунд до скидання). Ваш Vue-фронт може зчитувати retry-after і показати toast «спробуйте через N секунд».',
  },
  {
    question: 'Як передати параметр у middleware безпосередньо з маршруту?',
    options: [
      "->middleware('role', 'admin')",
      "->middleware('role:admin') — параметр після двокрапки, кілька — через кому",
      "->middleware(['role' => 'admin'])",
      "->middleware('role(admin)')",
    ],
    correct: 1,
    explanation:
      "Синтаксис: 'name:param1,param2'. Усередині handle() параметри стають додатковими аргументами після Closure $next: handle(Request $r, Closure $next, string $role). Для змінного числа аргументів — string ...$abilities.",
  },
]

// === CodeComparison: Express vs Laravel middleware ===
const jsExpress = `// Express.js — middleware
const express = require('express')
const app = express()

// Before middleware — логування
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.url}\`)
  next() // ← передати далі
})

// Перевірка автентифікації
app.use((req, res, next) => {
  if (! req.headers.authorization) {
    return res.status(401)
      .json({ message: 'Unauthenticated' })
  }
  next()
})

// Around middleware (before + after)
app.use((req, res, next) => {
  const start = Date.now()
  next() // далі
  // ⚠️ В Express це асинхронно — після next() код
  // виконається ОДРАЗУ, а не після контролера.
  // Тому в Express для after-логіки треба
  // res.on('finish', () => {...})
})

// Контролер
app.get('/tasks', (req, res) => {
  res.json([{ id: 1, title: 'Buy groceries' }])
})`

const phpLaravel = `<?php
// Laravel — концептуально те саме, синтаксично чистіше
namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

// Before middleware — логування
class LogRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        \\Log::info(
            "{$request->method()} {$request->url()}"
        );
        return $next($request); // ← \$next() = next()
    }
}

// Around middleware (before + after) —
// у Laravel це природно (sync, повертаємо Response)
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        // Передаємо далі і отримуємо відповідь
        $response = $next($request);

        // After: модифікуємо/логуємо
        $duration = (microtime(true) - $start) * 1000;
        $response->headers->set(
            'X-Response-Time', round($duration, 2) . 'ms'
        );

        return $response;
    }
}`

// === CodeBlock: pipeline diagram ===
const pipelineDiagram = `HTTP Request
    │
    ▼
┌────────────────────────────────────────┐
│ Middleware 1   (EnsureJsonResponse)    │  ← BEFORE: $request->headers->set('Accept', 'application/json')
│   ↓ $next($request)                    │
└────────────────┬───────────────────────┘
                 ▼
┌────────────────────────────────────────┐
│ Middleware 2   (auth:sanctum)          │  ← Перевірка токена. Немає? → 401, контролер не викликається
│   ↓ $next($request)                    │
└────────────────┬───────────────────────┘
                 ▼
┌────────────────────────────────────────┐
│ Middleware 3   (throttle:api)          │  ← Перевищено rate limit? → 429
│   ↓ $next($request)                    │
└────────────────┬───────────────────────┘
                 ▼
┌────────────────────────────────────────┐
│ Middleware 4   (LogApiRequest, around) │  ← BEFORE: \$start = microtime(true)
│   ↓ $next($request)                    │
└────────────────┬───────────────────────┘
                 ▼
┌────────────────────────────────────────┐
│ Controller — TaskController@index      │  ← Бізнес-логіка
└────────────────┬───────────────────────┘
                 ▼ Response об'єкт «розкручується» назад
┌────────────────────────────────────────┐
│ Middleware 4   (LogApiRequest)         │  ← AFTER: рахуємо тривалість, пишемо в лог
└────────────────┬───────────────────────┘
                 ▼
HTTP Response`

// === CodeBlock: skeleton + 3 scenarios ===
const skeletonCode = `<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

class MyMiddleware
{
    /**
     * @param  Request  $request   Вхідний HTTP-запит
     * @param  Closure  $next      Наступна ланка (middleware або controller)
     * @return Response            HTTP-відповідь
     */
    public function handle(Request $request, Closure $next): Response
    {
        // === Сценарій 1: модифікувати $request і пропустити ===
        $request->headers->set('Accept', 'application/json');

        // === Сценарій 2: заблокувати — НЕ викликати $next() ===
        // if (! $request->bearerToken()) {
        //     return response()->json(['message' => 'Unauthenticated'], 401);
        // }

        // === Сценарій 3: пропустити, потім модифікувати $response ===
        $response = $next($request);
        $response->headers->set('X-App-Version', '1.0.0');

        return $response;
    }
}`

// === CodeBlock: bootstrap/app.php ===
const bootstrapCode = `<?php
// bootstrap/app.php

use Illuminate\\Foundation\\Application;
use Illuminate\\Foundation\\Configuration\\Exceptions;
use Illuminate\\Foundation\\Configuration\\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api:      __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health:   '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // === API-група: глобально для /api/* ===
        $middleware->api(
            // PREPEND — на ПОЧАТОК ланцюжка
            // (EnsureJsonResponse має бути першим — тоді навіть
            //  помилки в інших middleware будуть JSON-ом)
            prepend: [
                \\App\\Http\\Middleware\\EnsureJsonResponse::class,
            ],
            // APPEND — у КІНЕЦЬ
            // (LogApiRequest — щоб виміряти час ВСЬОГО ланцюжка)
            append: [
                \\App\\Http\\Middleware\\LogApiRequest::class,
            ]
        );

        // === Aliases — короткі імена для маршрутів ===
        $middleware->alias([
            'task.limit' => \\App\\Http\\Middleware\\CheckTaskLimit::class,
            'role'       => \\App\\Http\\Middleware\\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

// Використання alias у маршруті:
// Route::get('/admin', ...)->middleware('role:admin');
// Route::post('/tasks', ...)->middleware('task.limit:50');`

// === CodeBlock: parameters ===
const parametersCode = `<?php

// === Middleware з ОДНИМ параметром ===
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

// === Middleware зі ЗМІННОЮ кількістю параметрів ===
class CheckAbility
{
    public function handle(
        Request $request, Closure $next, string ...$abilities
    ): Response {
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

// === Використання в маршрутах ===
Route::get('/admin', ...)->middleware('role:admin');
Route::get('/manager', ...)->middleware('role:manager');

// Кілька параметрів через кому
Route::post('/tasks', ...)
    ->middleware('ability:task:create,task:write');`

// === CodeBlock: Rate Limiting ===
const rateLimitCode = `<?php
// app/Providers/AppServiceProvider.php — boot()

use Illuminate\\Cache\\RateLimiting\\Limit;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\RateLimiter;

public function boot(): void
{
    // Ліміт «api»: 60/хв авторизованим, 20/хв гостям
    // Ключ — user_id (якщо є) або IP
    RateLimiter::for('api', function (Request $request) {
        return $request->user()
            ? Limit::perMinute(60)->by($request->user()->id)
            : Limit::perMinute(20)->by($request->ip());
    });

    // Жорсткий ліміт для логіну: 5 спроб на хвилину
    // на email+IP. З кастомним 429-повідомленням.
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)
            ->by($request->input('email', '') . '|' . $request->ip())
            ->response(fn () => response()->json([
                'message' => 'Too many login attempts. Please try again later.',
            ], 429));
    });

    // 3 реєстрації на хвилину з одного IP
    RateLimiter::for('register', function (Request $request) {
        return Limit::perMinute(3)->by($request->ip());
    });
}

// === routes/api.php ===
Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:register');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::apiResource('tasks', TaskController::class);
});

// При перевищенні Laravel поверне 429 + заголовки:
// X-RateLimit-Limit:     60
// X-RateLimit-Remaining: 0
// Retry-After:           45`

// === CodeBlock: Terminate middleware ===
const terminateCode = `<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

/**
 * Terminate middleware — особливий тип:
 * метод terminate() виконується ПІСЛЯ того, як Laravel
 * вже відправив відповідь клієнту.
 *
 * Клієнт уже бачить 200 OK у DevTools — а сервер ще
 * робить «фонову» роботу (логування, аналітика,
 * оновлення last_active_at).
 *
 * Аналог: setTimeout(() => analytics.track(...), 0)
 * або background job без черги.
 */
class TrackLastActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request); // нічого особливого тут
    }

    public function terminate(Request $request, Response $response): void
    {
        // Це НЕ сповільнює відповідь клієнту
        if ($request->user()) {
            $request->user()->update([
                'last_active_at' => now(),
            ]);
        }
    }
}`

// === Practice: middleware pipeline simulator ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо Laravel middleware-pipeline на чистому PHP.
// Демонструє:
//   1) Як $next($request) передає запит далі
//   2) Як працює before/after/around логіка
//   3) Як один middleware може коротко замкнути ланцюжок (повернути 401, не викликаючи $next)

// === Псевдо-Request / Response ===
function makeRequest(string $method, string $uri, array $headers = []): array {
    return ['method' => $method, 'uri' => $uri, 'headers' => $headers, 'user_id' => null];
}

function jsonResponse(int $status, array $body, array $headers = []): array {
    return ['status' => $status, 'body' => $body, 'headers' => $headers];
}

// === Pipeline runner — еквівалент Laravel kernel ===
function runPipeline(array $request, array $middlewares, callable $controller): array {
    // Будуємо ланцюжок ЗПРАВА НАЛІВО (як у Laravel Pipeline)
    // Останній виклик — контролер
    $next = $controller;
    foreach (array_reverse($middlewares) as $middleware) {
        $current = $next; // зафіксували попередню ланку
        $next = function (array $req) use ($middleware, $current) {
            return $middleware($req, $current);
        };
    }
    // Запускаємо весь ланцюжок з першого middleware
    return $next($request);
}

// === Middleware 1: EnsureJsonResponse (BEFORE) ===
$ensureJson = function (array $request, callable $next): array {
    echo "  [1] EnsureJsonResponse: set Accept=application/json\\n";
    $request['headers']['Accept'] = 'application/json';
    return $next($request);
};

// === Middleware 2: AuthSanctum (CAN BLOCK) ===
$authSanctum = function (array $request, callable $next): array {
    echo "  [2] auth:sanctum: check Authorization header\\n";
    if (empty($request['headers']['Authorization'])) {
        echo "      → no token! short-circuit with 401 (controller NOT called)\\n";
        return jsonResponse(401, ['message' => 'Unauthenticated.']);
    }
    $request['user_id'] = 1; // нібито впізнали Alice
    return $next($request);
};

// === Middleware 3: LogApiRequest (AROUND: before + after) ===
$logApi = function (array $request, callable $next): array {
    $start = microtime(true);
    echo "  [3] LogApiRequest BEFORE: start={$start}\\n";

    $response = $next($request);

    $durationMs = round((microtime(true) - $start) * 1000, 2);
    echo "  [3] LogApiRequest AFTER: status={$response['status']} duration={$durationMs}ms\\n";

    // Додаємо заголовок до відповіді
    $response['headers']['X-Response-Time'] = "{$durationMs}ms";
    return $response;
};

// === Middleware 4: ThrottleApi (param) ===
function makeThrottle(int $maxPerMinute): callable {
    static $counter = [];
    return function (array $request, callable $next) use ($maxPerMinute, &$counter): array {
        $key = $request['user_id'] ?? 'guest';
        $counter[$key] = ($counter[$key] ?? 0) + 1;
        echo "  [4] throttle:api({$maxPerMinute}/min) — request #{$counter[$key]}\\n";
        if ($counter[$key] > $maxPerMinute) {
            echo "      → rate limit exceeded → 429\\n";
            return jsonResponse(429, ['message' => 'Too Many Attempts.'],
                ['Retry-After' => '60']);
        }
        return $next($request);
    };
}

// === Controller ===
$tasksIndex = function (array $request): array {
    echo "  [C] TaskController@index for user_id={$request['user_id']}\\n";
    return jsonResponse(200, [
        'data' => [
            ['id' => 1, 'title' => 'Alice task'],
        ],
    ]);
};

// ====== Сценарій 1: запит з токеном — успіх ======
echo "=== СЦЕНАРІЙ 1: GET /api/tasks з токеном ===\\n";
$throttle = makeThrottle(3);
$req1 = makeRequest('GET', '/api/tasks', ['Authorization' => 'Bearer abc']);
$res1 = runPipeline($req1, [$ensureJson, $authSanctum, $throttle, $logApi], $tasksIndex);
echo "  → final response: status={$res1['status']}, X-Response-Time={$res1['headers']['X-Response-Time']}\\n\\n";

// ====== Сценарій 2: запит БЕЗ токена — short-circuit на auth ======
echo "=== СЦЕНАРІЙ 2: GET /api/tasks БЕЗ токена ===\\n";
$req2 = makeRequest('GET', '/api/tasks');
$res2 = runPipeline($req2, [$ensureJson, $authSanctum, $throttle, $logApi], $tasksIndex);
echo "  → final response: status={$res2['status']}, body=" . json_encode($res2['body']) . "\\n";
echo "  📝 Зверніть увагу: контролер НЕ викликався, бо auth короткозамкнув ланцюжок.\\n\\n";

// ====== Сценарій 3: rate limit (4-й запит з 3) ======
echo "=== СЦЕНАРІЙ 3: 4-й запит → 429 ===\\n";
$req3 = makeRequest('GET', '/api/tasks', ['Authorization' => 'Bearer abc']);
runPipeline($req3, [$ensureJson, $authSanctum, $throttle], $tasksIndex);
runPipeline($req3, [$ensureJson, $authSanctum, $throttle], $tasksIndex);
echo "--- 4-й запит ---\\n";
$res3 = runPipeline($req3, [$ensureJson, $authSanctum, $throttle], $tasksIndex);
echo "  → status={$res3['status']}, retry-after={$res3['headers']['Retry-After']}s\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте параметризований CheckTaskLimit
 *           та pipeline-runner.
 *
 * Реалізуйте 3 функції:
 *
 *   1) checkTaskLimit(array $request, callable $next, int $max): array
 *      - якщо count($request['tasks']) >= \$max → 403 з body
 *        ['message' => "Task limit reached. Maximum {\$max}.",
 *         'current_count' => N, 'max_allowed' => \$max]
 *      - інакше → \$response = \$next(\$request)
 *        додати заголовки X-Task-Limit, X-Task-Count, X-Task-Remaining
 *        і повернути \$response
 *
 *   2) ensureJson(array \$request, callable \$next): array
 *      - встановити \$request['headers']['Accept'] = 'application/json'
 *      - повернути \$next(\$request)
 *
 *   3) runPipeline(array \$request, array \$middlewares, callable \$controller): array
 *      - згорнути \$middlewares ЗПРАВА НАЛІВО, останній виклик — \$controller
 *      - запустити повний ланцюжок з першого middleware
 *      - повернути результат
 */

function makeRequest(int $userId, array $tasks): array {
    return [
        'user_id' => $userId,
        'tasks'   => $tasks,
        'headers' => [],
    ];
}

function jsonResponse(int $status, array $body, array $headers = []): array {
    return ['status' => $status, 'body' => $body, 'headers' => $headers];
}

// 1.
function checkTaskLimit(array $request, callable $next, int $max): array {
    // Ваш код тут
}

// 2.
function ensureJson(array $request, callable $next): array {
    // Ваш код тут
}

// 3.
function runPipeline(array $request, array $middlewares, callable $controller): array {
    // Ваш код тут
}

// Контролер створення задачі (для тестів)
$createTask = function (array $request): array {
    $newTask = ['id' => count($request['tasks']) + 1, 'title' => 'New task'];
    return jsonResponse(201, ['data' => $newTask]);
};`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 6;

// 1. ensureJson модифікує заголовок і викликає next
$capturedHeaders = null;
$captureNext = function (array $r) use (&$capturedHeaders): array {
    $capturedHeaders = $r['headers'];
    return jsonResponse(200, ['ok' => true]);
};
ensureJson(makeRequest(1, []), $captureNext);
if (($capturedHeaders['Accept'] ?? null) === 'application/json') {
    echo "✓ ensureJson: встановив Accept=application/json і викликав next\\n"; $pass++;
} else {
    echo "✗ ensureJson: заголовок не встановлено або next не викликаний\\n";
}

// 2. checkTaskLimit пропускає, коли ліміт НЕ перевищено
$req2 = makeRequest(1, [['id' => 1], ['id' => 2]]); // 2 задачі
$resp2 = checkTaskLimit($req2, $createTask, 5);
if ($resp2['status'] === 201) {
    echo "✓ checkTaskLimit: 2/5 — пропускає до контролера\\n"; $pass++;
} else {
    echo "✗ checkTaskLimit: мав пропустити (2 < 5), а status={$resp2['status']}\\n";
}

// 3. checkTaskLimit додає заголовки X-Task-*
if (
    ($resp2['headers']['X-Task-Limit']     ?? null) === 5 &&
    ($resp2['headers']['X-Task-Count']     ?? null) === 2 &&
    ($resp2['headers']['X-Task-Remaining'] ?? null) === 3
) {
    echo "✓ checkTaskLimit: додав X-Task-Limit/Count/Remaining\\n"; $pass++;
} else {
    echo "✗ checkTaskLimit: відсутні або неправильні заголовки X-Task-*\\n";
    print_r($resp2['headers']);
}

// 4. checkTaskLimit блокує, коли ліміт досягнуто (і НЕ викликає controller)
$controllerCalled = false;
$createTask2 = function (array $r) use (&$controllerCalled): array {
    $controllerCalled = true;
    return jsonResponse(201, ['data' => 'should-not-happen']);
};
$req4 = makeRequest(1, array_fill(0, 3, ['id' => 'x'])); // 3 задачі
$resp4 = checkTaskLimit($req4, $createTask2, 3);
if ($resp4['status'] === 403 && ($resp4['body']['max_allowed'] ?? null) === 3 && ! $controllerCalled) {
    echo "✓ checkTaskLimit: 3/3 → 403, контролер НЕ викликаний\\n"; $pass++;
} else {
    echo "✗ checkTaskLimit: при перевищенні має бути 403 і контролер не викликаний\\n";
}

// 5. runPipeline: ensureJson + checkTaskLimit + контролер
$req5 = makeRequest(1, [['id' => 1]]);
$resp5 = runPipeline(
    $req5,
    [
        fn ($r, $next) => ensureJson($r, $next),
        fn ($r, $next) => checkTaskLimit($r, $next, 10),
    ],
    $createTask
);
if ($resp5['status'] === 201) {
    echo "✓ runPipeline: повний ланцюжок → 201\\n"; $pass++;
} else {
    echo "✗ runPipeline: очікувався 201, отримано {$resp5['status']}\\n";
}

// 6. runPipeline: middleware ПОРЯДОК — короткозамикання
$req6 = makeRequest(1, array_fill(0, 5, ['id' => 'x']));
$controllerCalled6 = false;
$createTask6 = function (array $r) use (&$controllerCalled6): array {
    $controllerCalled6 = true;
    return jsonResponse(201, ['data' => []]);
};
$resp6 = runPipeline(
    $req6,
    [
        fn ($r, $next) => ensureJson($r, $next),
        fn ($r, $next) => checkTaskLimit($r, $next, 5), // блокує на 5
    ],
    $createTask6
);
if ($resp6['status'] === 403 && ! $controllerCalled6) {
    echo "✓ runPipeline: middleware short-circuit працює (controller НЕ викликаний)\\n"; $pass++;
} else {
    echo "✗ runPipeline: middleware має зупинити ланцюжок при 403\\n";
}

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="Express app.use((req, res, next) => ...)"
        to="Laravel Middleware → handle($request, Closure $next)"
      />

      <TheoryBlock title="Що таке middleware і навіщо воно потрібне">
        <p>
          Middleware — це код, який виконується <strong>між</strong> отриманням HTTP-запиту і
          відправкою відповіді. Запит проходить через ланцюжок middleware, як товар через конвеєр:
          кожна станція може щось <em>додати</em>, <em>перевірити</em>, або <em>заблокувати</em>.
        </p>
        <p>
          Якщо будь-який middleware вирішить, що запит не проходить (немає токена, перевищено rate
          limit, не той content-type) — він поверне відповідь одразу,
          <strong>не доходячи до контролера</strong>. Це — short-circuit, і саме він робить
          middleware ефективним інструментом cross-cutting concerns.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="pipelineDiagram"
        lang="text"
        title="Pipeline: запит проходить через middleware → контролер → назад"
      />

      <CodeComparison
        :js="jsExpress"
        :php="phpLaravel"
        js-title="Express.js — middleware (асинхронний)"
        php-title="Laravel — Middleware (sync, повертає Response)"
      />

      <TheoryBlock title="Структура middleware: handle($request, Closure $next)">
        <p>
          Кожен middleware — це клас з одним обовʼязковим методом
          <code>handle()</code>. Усередині є три типові сценарії:
        </p>
        <ol>
          <li>
            <strong>Пропустити далі:</strong> <code>return $next($request)</code> — запит йде до
            наступного middleware (або контролера).
          </li>
          <li>
            <strong>Заблокувати:</strong>
            <code>return response()->json([...], 401)</code> — повертаємо відповідь,
            <em>не</em> викликаючи <code>$next()</code>. Контролер не виконується.
          </li>
          <li>
            <strong>Модифікувати і пропустити:</strong> змінити <code>$request</code> до
            <code>$next()</code> або <code>$response</code> після — типовий «around»-патерн.
          </li>
        </ol>
      </TheoryBlock>

      <CodeBlock
        :code="skeletonCode"
        lang="php"
        title="Скелет middleware з усіма трьома сценаріями"
      />

      <TheoryBlock title="Before vs After — коли який код виконується">
        <p>
          <strong>Before middleware</strong> — ваш код <em>до</em>
          <code>return $next($request)</code>. Аналог
          <code>axios.interceptors.request.use(config => ...)</code>: модифікує запит, перевіряє
          токен, додає заголовки.
        </p>
        <p>
          <strong>After middleware</strong> — спочатку <code>$response = $next($request)</code>,
          потім ваш код працює з <code>$response</code>. Аналог
          <code>axios.interceptors.response.use(response => ...)</code>: додає заголовки до
          відповіді, логує час, нормалізує помилки.
        </p>
        <p>
          <strong>Around (before + after)</strong> — найпотужніший: ви огортаєте контролер з обох
          боків. Класичний приклад — таймер:
          <code>$start = microtime(true) → $next() → log(microtime(true) - $start)</code>.
        </p>
      </TheoryBlock>

      <TheoryBlock title="Реєстрація middleware у bootstrap/app.php (Laravel 11/12)">
        <p>
          У Laravel 12 файл <code>app/Http/Kernel.php</code> прибрали — все налаштовується у
          <code>bootstrap/app.php</code> через <code>->withMiddleware()</code>. Є три способи
          зробити middleware «видимим»:
        </p>
        <ul>
          <li>
            <strong>Глобальний</strong> (<code>append</code>/<code>prepend</code>): виконується для
            <em>кожного</em> запиту.
          </li>
          <li>
            <strong>API-група</strong> (<code>->api(append: [...])</code>): тільки для
            <code>/api/*</code>.
          </li>
          <li>
            <strong>Alias</strong>: коротке імʼя для використання в маршрутах:
            <code>Route::get(...)->middleware('task.limit')</code>.
          </li>
        </ul>
      </TheoryBlock>

      <CodeBlock :code="bootstrapCode" lang="php" title="bootstrap/app.php — повна реєстрація" />

      <TheoryBlock title="Middleware з параметрами">
        <p>
          Параметри передаються через <strong>двокрапку</strong>:
          <code>->middleware('role:admin')</code>. Усередині <code>handle()</code> вони стають
          додатковими аргументами після <code>Closure $next</code>. Кілька параметрів — через кому:
          <code>'ability:task:create,task:write'</code>. Для змінного числа аргументів —
          <code>string ...$abilities</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="parametersCode" lang="php" title="Параметризований middleware" />

      <TheoryBlock title="Rate Limiting — серверний throttle">
        <p>
          Rate limiting — захист від зловживань. Це як <code>throttle</code> composable у Vue,
          тільки на рівні сервера: клієнт <em>не може обійти</em> через DevTools. Limiter-и
          визначаються в <code>AppServiceProvider::boot()</code> через
          <code>RateLimiter::for(...)</code>, а застосовуються до маршрутів через
          <code>throttle:name</code>.
        </p>
        <p>
          При перевищенні Laravel поверне <strong>429 Too Many Requests</strong> із заголовками
          <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>,
          <code>Retry-After</code>. Ваш Vue-фронт може зчитувати <code>retry-after</code> і показати
          toast «спробуйте через N секунд».
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="rateLimitCode"
        lang="php"
        title="Rate Limiter — три приклади (api / login / register)"
      />

      <TheoryBlock title="Terminate middleware — код «після» відповіді">
        <p>
          Особливий тип middleware з другим методом <code>terminate()</code>. Він виконується
          <strong>після того, як Laravel відправив відповідь клієнту</strong> — тобто клієнт уже
          бачить 200 OK, а сервер у фоні робить додаткову роботу. Це <em>не</em> сповільнює
          відповідь.
        </p>
        <p>
          Класичні use-case: оновити <code>last_active_at</code>, надіслати аналітику, записати лог
          у повільне сховище. Аналог <code>setTimeout(() => analytics.track(...), 0)</code> у
          фронтенді.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="terminateCode"
        lang="php"
        title="Terminate middleware — фонова робота після Response"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: симуляція middleware-pipeline на чистому PHP">
        <p>
          У playground ми <strong>самі реалізуємо</strong> Laravel-pipeline через
          <code>array_reverse</code> + замикання. Це показує, чому
          <code>$next($request)</code> працює саме так — middleware будується ЗПРАВА НАЛІВО, як
          цибулина.
        </p>
        <p>
          Сценарій 1 — повний прохід (4 middleware → controller). Сценарій 2 —
          <em>short-circuit</em> на auth (без токена). Сценарій 3 — спрацьовування rate limiter на
          4-му запиті. Спробуйте змінити порядок middleware (наприклад, поставити
          <code>logApi</code> першим) — побачите, як зміниться повідомлення про тривалість.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/15-middleware.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="3-15" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: параметризований CheckTaskLimit + pipeline-runner">
        <p>
          Реалізуйте три функції, які разом утворюють робочу middleware-систему. Натисніть
          <strong>«Запустити»</strong> — 6 авто-тестів перевірять короткозамикання, after-заголовки
          і правильний порядок виклику.
        </p>
        <ol>
          <li>
            <strong>checkTaskLimit($request, $next, $max)</strong> — at-or-over ліміт → 403; інакше
            — <code>$response = $next($request)</code>, додати заголовки
            <code>X-Task-Limit / X-Task-Count / X-Task-Remaining</code>.
          </li>
          <li>
            <strong>ensureJson($request, $next)</strong> — простий before: виставляє
            <code>Accept = application/json</code> і пропускає далі.
          </li>
          <li>
            <strong>runPipeline($request, $middlewares, $controller)</strong> — згорнути масив
            middleware <em>зправа наліво</em> (це ключ), останній виклик — контролер. Один з тестів
            спеціально перевіряє, що при 403 контролер <strong>не</strong> викликається.
          </li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте middleware + pipeline runner"
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
