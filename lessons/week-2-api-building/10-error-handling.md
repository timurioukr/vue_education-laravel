# Урок 10: Обробка помилок та API-відповіді

## Що ви вивчите

- Як Laravel обробляє помилки "з коробки" і чому це не підходить для API
- Як налаштувати exception handler для послідовних JSON-відповідей
- Функції `abort()`, `abort_if()`, `abort_unless()` для зупинки виконання
- Як `findOrFail()` автоматично генерує 404-помилки
- Як створювати власні exception-класи для бізнес-логіки
- Логування помилок через `Log` фасад та рівні логів
- Різницю між production та development режимами помилок

## Паралелі з JS/Vue

| Laravel / PHP | Vue / Nuxt / JS | Коментар |
|---|---|---|
| `bootstrap/app.php` → `withExceptions()` | `app.config.errorHandler` у Vue | Глобальний перехоплювач помилок |
| `abort(404)` | `throw createError({ statusCode: 404 })` у Nuxt | Зупинити виконання з HTTP-кодом |
| `abort_if($condition, 403)` | `if (condition) throw createError(...)` | Умовна зупинка |
| Custom Exception class | `class TaskError extends Error {}` у TypeScript | Власні типи помилок |
| Консистентний формат `{ message, status }` | Те, що парсить ваш Axios interceptor | Фронтенд очікує передбачуваний формат |
| `Log::error()`, `Log::info()` | `console.error()`, `console.info()` | Але в файл, а не в браузер |
| `storage/logs/laravel.log` | DevTools Console | Персистентний лог на сервері |
| `APP_DEBUG=true/false` | `NODE_ENV=development/production` | Скільки деталей показувати |
| `try/catch` у контролері | `try/catch` у async action | Однаковий синтаксис, різна філософія |

## Теорія

### Проблема: Laravel повертає HTML-помилки для API

За замовчуванням, коли Laravel стикається з помилкою, він генерує HTML-сторінку. Наприклад, якщо ви зайдете на неіснуючий маршрут, ви побачите гарну HTML-сторінку 404 з дизайном. Це чудово для вебсайтів, але для API це катастрофа.

Ваш Vue-фронтенд робить `axios.get('/api/tasks/9999')` і очікує JSON. А замість цього отримує HTML-сторінку. `response.data.message` буде `undefined`, і ваш інтерфейс ламається.

**Що потрібно:** кожна помилка API повинна повертатись як JSON у передбачуваному форматі:

```json
{
    "message": "Task not found.",
    "status": 404
}
```

### Exception Handler у Laravel 12

У Laravel 12 обробка помилок налаштовується у файлі `bootstrap/app.php` через метод `withExceptions()`. Це центральне місце, де ви визначаєте, як додаток реагує на будь-які винятки.

```php
// bootstrap/app.php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Тут налаштовуємо обробку помилок
    })
    ->create();
```

У Vue це схоже на глобальний обробник помилок:

```javascript
// Vue аналог
const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
    // Глобальна обробка помилок
    console.error('Global error:', err.message);
};
```

### abort() -- зупинити виконання з HTTP-помилкою

Функція `abort()` -- це найпростіший спосіб "кинути" HTTP-помилку з будь-якого місця у вашому коді:

```php
// Просто код помилки
abort(404);

// Код + повідомлення
abort(404, 'Task not found.');

// З умовою -- abort_if
abort_if($task->user_id !== auth()->id(), 403, 'This is not your task.');

// Зворотня умова -- abort_unless
abort_unless($user->isAdmin(), 403, 'Admin access required.');
```

У Nuxt це аналог `createError()`:

```javascript
// Nuxt аналог
throw createError({
    statusCode: 404,
    statusMessage: 'Task not found.',
});

// Або з перевіркою
if (task.userId !== user.id) {
    throw createError({ statusCode: 403, message: 'This is not your task.' });
}
```

### findOrFail() -- автоматична 404

Коли ви використовуєте `findOrFail()` замість `find()`, Laravel автоматично кидає `ModelNotFoundException`, яка перетворюється на 404-відповідь:

```php
// ❌ Потрібно вручну перевіряти
$task = Task::find($id);
if (!$task) {
    abort(404, 'Task not found.');
}

// ✅ Автоматично кидає 404
$task = Task::findOrFail($id);

// ✅ Те саме для запитів з умовами
$task = Task::where('status', 'pending')->firstOrFail();
```

Це як різниця між `array.find()` (повертає `undefined`) та `.find()` з перевіркою:

```javascript
// JS аналог findOrFail -- такої функції немає, але концептуально:
const task = tasks.find(t => t.id === id);
if (!task) throw new Error('Not found'); // доводиться писати вручну
```

### Власні Exception-класи

Коли у вас є специфічна бізнес-логіка, варто створити власний Exception-клас. Наприклад, обмеження кількості задач:

```bash
php artisan make:exception TaskLimitExceededException
```

Це створить файл `app/Exceptions/TaskLimitExceededException.php`:

```php
<?php

namespace App\Exceptions;

use Exception;

class TaskLimitExceededException extends Exception
{
    //
}
```

У TypeScript ви робите щось подібне:

```typescript
// TypeScript аналог
class TaskLimitExceededError extends Error {
    public statusCode = 429;

    constructor(message = 'Task limit exceeded') {
        super(message);
        this.name = 'TaskLimitExceededError';
    }
}
```

### Метод render() -- як виняток перетворюється на відповідь

Кожен Exception-клас може мати метод `render()`, який визначає, як він перетворюється на HTTP-відповідь:

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskLimitExceededException extends Exception
{
    public function __construct(
        string $message = 'You have reached the maximum number of tasks (100).',
        int $code = 0,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'status' => 429,
        ], 429);
    }
}
```

Тепер у контролері:

```php
use App\Exceptions\TaskLimitExceededException;

public function store(StoreTaskRequest $request)
{
    if (Task::where('user_id', auth()->id())->count() >= 100) {
        throw new TaskLimitExceededException();
    }

    $task = Task::create($request->validated());

    return new TaskResource($task);
}
```

### Метод report() -- кастомне логування

Метод `report()` контролює, як виняток записується в логи. Наприклад, ви можете додати контекст:

```php
class TaskLimitExceededException extends Exception
{
    public function __construct(
        string $message = 'You have reached the maximum number of tasks (100).',
        int $code = 0,
        ?\Throwable $previous = null,
        private ?int $userId = null,
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Report the exception (логування).
     */
    public function report(): void
    {
        Log::warning('Task limit exceeded', [
            'user_id' => $this->userId,
            'max_limit' => 100,
        ]);
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'status' => 429,
        ], 429);
    }
}
```

Кидаємо з контексту:

```php
throw new TaskLimitExceededException(
    userId: auth()->id(),
);
```

### Консистентний формат помилок

Для API важливо, щоб **кожна** помилка мала однаковий формат. Ваш фронтенд не повинен вгадувати структуру. Налаштуємо це в `bootstrap/app.php`:

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (Throwable $e, Request $request) {
        // Тільки для API-запитів (URL починається з /api або запит очікує JSON)
        if ($request->is('api/*') || $request->expectsJson()) {
            $status = match (true) {
                $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 404,
                $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 404,
                $e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException => 405,
                $e instanceof \Illuminate\Validation\ValidationException => 422,
                $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException => $e->getStatusCode(),
                default => 500,
            };

            $response = [
                'message' => $e->getMessage() ?: 'Server Error',
                'status' => $status,
            ];

            // Помилки валідації мають окремий формат з полями
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                $response['errors'] = $e->errors();
            }

            // У dev-режимі додаємо деталі для дебагу
            if (config('app.debug')) {
                $response['debug'] = [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => collect($e->getTrace())->take(5)->toArray(),
                ];
            }

            return response()->json($response, $status);
        }
    });
})
```

Тепер **кожна** помилка API повертає JSON:

```json
// 404 -- не знайдено
{
    "message": "No query results for model [App\\Models\\Task] 9999",
    "status": 404
}

// 422 -- помилка валідації
{
    "message": "The title field is required.",
    "status": 422,
    "errors": {
        "title": ["The title field is required."],
        "priority": ["The selected priority is invalid."]
    }
}

// 500 -- серверна помилка (production)
{
    "message": "Server Error",
    "status": 500
}

// 500 -- серверна помилка (development, APP_DEBUG=true)
{
    "message": "SQLSTATE[HY000]: General error: 1 no such table: tasks",
    "status": 500,
    "debug": {
        "exception": "Illuminate\\Database\\QueryException",
        "file": "/app/vendor/laravel/framework/src/Illuminate/Database/Connection.php",
        "line": 829,
        "trace": [...]
    }
}
```

Це саме те, що ваш Axios interceptor хоче бачити:

```javascript
// Vue/Axios -- тепер завжди можна розраховувати на error.response.data.message
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Unknown error';
        const status = error.response?.data?.status || 500;

        // Помилки валідації
        if (status === 422) {
            const fieldErrors = error.response.data.errors;
            // fieldErrors = { title: ['The title field is required.'] }
        }

        notify.error(message);
        return Promise.reject(error);
    }
);
```

### try/catch у контролерах -- використовуйте обережно

У Laravel прийнято дозволяти виняткам "спливати" (bubble up) до глобального обробника. Не потрібно обгортати кожну дію в `try/catch`:

```php
// ❌ Погано -- зайвий try/catch, ускладнює код
public function show(int $id)
{
    try {
        $task = Task::findOrFail($id);
        return new TaskResource($task);
    } catch (ModelNotFoundException $e) {
        return response()->json(['message' => 'Not found'], 404);
    }
}

// ✅ Добре -- findOrFail() кидає виняток, глобальний handler перетворює на 404
public function show(int $id)
{
    $task = Task::findOrFail($id);
    return new TaskResource($task);
}
```

Використовуйте `try/catch` тільки коли потрібна **специфічна** обробка:

```php
// ✅ try/catch доречний -- потрібна специфічна реакція
public function importTasks(Request $request)
{
    try {
        $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
    } catch (\JsonException $e) {
        return response()->json([
            'message' => 'Invalid JSON format in request body.',
            'status' => 400,
        ], 400);
    }

    // Обробка даних...
}
```

### Логування: Log фасад

Laravel має потужну систему логування з різними рівнями. Логи записуються у файл `storage/logs/laravel.log`.

```php
use Illuminate\Support\Facades\Log;

// Рівні логів (від найкритичнішого до найменш важливого)
Log::emergency('System is down!');     // Система не працює
Log::alert('Database corrupted!');     // Потрібна негайна дія
Log::critical('Payment failed!');      // Критична помилка
Log::error('Task creation failed');    // Помилка
Log::warning('Task limit almost reached'); // Попередження
Log::notice('New user registered');    // Важлива подія
Log::info('Task created', [           // Інформаційне повідомлення
    'task_id' => $task->id,
    'user_id' => $task->user_id,
]);
Log::debug('Query executed', [        // Дебаг (тільки для розробки)
    'sql' => $query->toSql(),
    'bindings' => $query->getBindings(),
]);
```

Другий аргумент -- це контекст, масив додаткових даних. Це аналог передачі об'єкта в `console.log`:

```javascript
// JS аналог
console.error('Task creation failed', { taskId: 42, userId: 1 });
console.info('Task created', { taskId: 42, userId: 1 });
console.debug('Query executed', { sql: '...' });
```

Різниця: `console.log()` зникає коли ви закриєте браузер. `Log::info()` записується у файл і зберігається.

### storage/logs/laravel.log

Всі логи за замовчуванням записуються у файл `storage/logs/laravel.log`:

```
[2026-04-09 10:15:32] local.ERROR: Task creation failed {"task_id":42,"user_id":1}
[2026-04-09 10:15:33] local.INFO: Task created {"task_id":43,"user_id":1}
[2026-04-09 10:16:01] local.WARNING: Task limit almost reached {"user_id":1,"count":95}
```

Корисні команди для перегляду:

```bash
# Переглянути останні записи
tail -f storage/logs/laravel.log

# Очистити лог-файл
echo "" > storage/logs/laravel.log

# Або просто видалити
rm storage/logs/laravel.log
```

`tail -f` працює як "live reload" для логів -- ви бачите нові записи в реальному часі.

### Production vs Development: APP_DEBUG

У файлі `.env` є важлива змінна `APP_DEBUG`:

```env
# Development -- показуємо все для зручності розробки
APP_DEBUG=true
APP_ENV=local

# Production -- ховаємо деталі від зловмисників
APP_DEBUG=false
APP_ENV=production
```

Коли `APP_DEBUG=true`:
- Повідомлення про помилки включають файл, рядок, stack trace
- SQL-запити показуються в помилках
- Виняткові ситуації виводять максимум деталей

Коли `APP_DEBUG=false`:
- Користувач бачить тільки "Server Error" без деталей
- Stack trace не показується
- Деталі помилки записуються тільки в логи

Це аналог `NODE_ENV` у JavaScript:

```javascript
// JS аналог
if (process.env.NODE_ENV === 'development') {
    console.error('Full error:', error.stack);
} else {
    console.error('Something went wrong');
}
```

> **Важливо:** Ніколи не встановлюйте `APP_DEBUG=true` на production! Зловмисник побачить ваші SQL-запити, шляхи до файлів, конфігурацію бази даних -- все, що потрібно для атаки.

## Практика: крок за кроком

### Крок 1: Подивіться на поточну поведінку

Перш ніж щось змінювати, подивіться, як Laravel обробляє помилки зараз.

Запустіть сервер:

```bash
php artisan serve
```

Зробіть запит на неіснуючу задачу:

```bash
curl -s http://localhost:8000/api/tasks/9999 | head -5
```

Ймовірно, ви побачите HTML-сторінку або порожню відповідь. Це те, що ми виправимо.

Тепер додайте заголовок `Accept: application/json`:

```bash
curl -s -H "Accept: application/json" http://localhost:8000/api/tasks/9999
```

Laravel вже вміє повертати JSON, якщо запит містить цей заголовок. Але ми не хочемо залежати від того, чи фронтенд правильно встановив заголовок.

### Крок 2: Налаштуйте exception handler

Відкрийте `bootstrap/app.php` і додайте обробку у `withExceptions()`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Throwable;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = match (true) {
                    $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 404,
                    $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 404,
                    $e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException => 405,
                    $e instanceof \Illuminate\Validation\ValidationException => 422,
                    $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException => $e->getStatusCode(),
                    default => 500,
                };

                $message = match (true) {
                    $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 'Resource not found.',
                    $status === 500 && !config('app.debug') => 'Server Error.',
                    default => $e->getMessage() ?: 'Server Error.',
                };

                $response = [
                    'message' => $message,
                    'status' => $status,
                ];

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $response['errors'] = $e->errors();
                }

                if (config('app.debug') && $status === 500) {
                    $response['debug'] = [
                        'exception' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ];
                }

                return response()->json($response, $status);
            }
        });
    })
    ->create();
```

### Крок 3: Перевірте 404 для неіснуючої задачі

Переконайтесь, що ваш `TaskController::show` використовує `findOrFail()`:

```php
// app/Http/Controllers/Api/TaskController.php

public function show(string $id)
{
    $task = Task::findOrFail($id);

    return new TaskResource($task);
}
```

Тепер перевірте:

```bash
curl -s http://localhost:8000/api/tasks/9999 | json_pp
```

Очікуваний результат:

```json
{
    "message": "Resource not found.",
    "status": 404
}
```

### Крок 4: Перевірте 404 для неіснуючого маршруту

```bash
curl -s http://localhost:8000/api/nonexistent-route | json_pp
```

Очікуваний результат:

```json
{
    "message": "The route api/nonexistent-route could not be found.",
    "status": 404
}
```

Ніякого HTML -- чистий JSON.

### Крок 5: Створіть кастомний Exception

```bash
php artisan make:exception TaskLimitExceededException
```

Відредагуйте `app/Exceptions/TaskLimitExceededException.php`:

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TaskLimitExceededException extends Exception
{
    private const MAX_TASKS = 100;

    public function __construct(
        private ?int $userId = null,
    ) {
        parent::__construct(
            "You have reached the maximum number of tasks (" . self::MAX_TASKS . ")."
        );
    }

    /**
     * Report the exception.
     */
    public function report(): void
    {
        Log::warning('Task limit exceeded', [
            'user_id' => $this->userId,
            'max_limit' => self::MAX_TASKS,
        ]);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'status' => 429,
        ], 429);
    }
}
```

### Крок 6: Використайте кастомний Exception у контролері

Додайте перевірку у метод `store()` вашого `TaskController`:

```php
use App\Exceptions\TaskLimitExceededException;

public function store(StoreTaskRequest $request)
{
    // Перевіряємо ліміт задач
    $taskCount = Task::count(); // Поки без auth, рахуємо всі задачі
    if ($taskCount >= 100) {
        throw new TaskLimitExceededException();
    }

    $task = Task::create($request->validated());

    return (new TaskResource($task))
        ->response()
        ->setStatusCode(201);
}
```

### Крок 7: Перевірте логи

Після того як ви зробили кілька запитів з помилками, подивіться логи:

```bash
tail -20 storage/logs/laravel.log
```

Ви побачите записи про помилки з контекстом (якщо вони є).

Очистіть логи перед подальшою роботою:

```bash
echo "" > storage/logs/laravel.log
```

### Крок 8: Перевірте різницю APP_DEBUG

Тимчасово змініть у `.env`:

```env
APP_DEBUG=false
```

Зробіть запит, який спричинить серверну помилку (наприклад, тимчасово зламайте щось у коді або зробіть запит до неіснуючої таблиці). Ви побачите тільки:

```json
{
    "message": "Server Error.",
    "status": 500
}
```

Поверніть `APP_DEBUG=true` для подальшої розробки.

## Перевірка

Після виконання всіх кроків перевірте:

```bash
# 1. Неіснуюча задача -- 404 JSON (не HTML)
curl -s http://localhost:8000/api/tasks/9999
# Очікуємо: {"message":"Resource not found.","status":404}

# 2. Неіснуючий маршрут -- 404 JSON (не HTML)
curl -s http://localhost:8000/api/this-does-not-exist
# Очікуємо: {"message":"...","status":404}

# 3. Невалідні дані -- 422 JSON з полями
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{}'
# Очікуємо: {"message":"...","status":422,"errors":{...}}

# 4. Логи містять записи
tail -5 storage/logs/laravel.log
```

## Міні-тест

**1. Що повертає Laravel за замовчуванням при помилці 404 для API-запиту без заголовка Accept?**

a) JSON з повідомленням помилки
b) HTML-сторінку з помилкою
c) Порожню відповідь
d) Текстове повідомлення "Not Found"

**2. Яка різниця між `find()` та `findOrFail()`?**

a) `find()` швидший за `findOrFail()`
b) `find()` повертає `null`, `findOrFail()` кидає `ModelNotFoundException`
c) `findOrFail()` повертає 404-відповідь напряму
d) Різниці немає, це синоніми

**3. Куди за замовчуванням записуються логи Laravel?**

a) `database/logs/app.log`
b) `storage/logs/laravel.log`
c) `public/logs/error.log`
d) `/var/log/laravel.log`

**4. Що робить `abort_if($condition, 403, 'Forbidden')`?**

a) Завжди повертає 403
b) Повертає 403 якщо `$condition` дорівнює `false`
c) Повертає 403 якщо `$condition` дорівнює `true`
d) Записує помилку в лог без зупинки

**5. Навіщо метод `render()` у кастомному Exception?**

a) Для рендеринга HTML-шаблону помилки
b) Для визначення, як виняток перетворюється на HTTP-відповідь
c) Для запису помилки в лог
d) Для повторного кидання винятку

## Практичне завдання

Створіть middleware `LogApiRequests`, який логує кожен API-запит. Middleware повинен записувати:
- HTTP-метод (GET, POST, PUT, DELETE)
- URI запиту
- Статус-код відповіді
- Час виконання запиту (в мілісекундах)

### Підказки

1. Створіть middleware:

```bash
php artisan make:middleware LogApiRequests
```

2. У middleware обробіть запит і зафіксуйте час до та після:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        Log::channel('daily')->info('API Request', [
            'method' => $request->method(),
            'uri' => $request->getRequestUri(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'ip' => $request->ip(),
        ]);

        return $response;
    }
}
```

3. Зареєструйте middleware для API-маршрутів у `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(append: [
        \App\Http\Middleware\LogApiRequests::class,
    ]);
})
```

4. Зробіть кілька запитів і перевірте `storage/logs/laravel-YYYY-MM-DD.log`:

```
[2026-04-09 10:15:32] local.INFO: API Request {"method":"GET","uri":"/api/tasks","status":200,"duration_ms":45.23,"ip":"127.0.0.1"}
[2026-04-09 10:15:33] local.INFO: API Request {"method":"GET","uri":"/api/tasks/9999","status":404,"duration_ms":12.87,"ip":"127.0.0.1"}
[2026-04-09 10:15:34] local.INFO: API Request {"method":"POST","uri":"/api/tasks","status":422,"duration_ms":18.45,"ip":"127.0.0.1"}
```

## Відповіді на тест

1. **b)** HTML-сторінку з помилкою. Тому ми налаштовуємо exception handler для повернення JSON для всіх API-запитів.
2. **b)** `find()` повертає `null` якщо запис не знайдено, а `findOrFail()` кидає `ModelNotFoundException`, яка автоматично перетворюється на 404-відповідь.
3. **b)** `storage/logs/laravel.log` -- це шлях за замовчуванням для single-каналу логування.
4. **c)** Повертає 403 якщо `$condition` дорівнює `true`. Назва "abort_**if**" -- якщо умова істинна, зупиняємо виконання. `abort_unless` -- навпаки.
5. **b)** Метод `render()` визначає, як виняток перетворюється на HTTP-відповідь. Він повертає `Response` або `JsonResponse`. Метод `report()` відповідає за логування.
