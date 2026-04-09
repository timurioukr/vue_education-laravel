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
    question: 'Яка різниця між abort(404) та throw new Exception() у Laravel?',
    options: [
      'abort() тільки для GET-запитів, throw для POST',
      'abort() генерує HTTP-виняток з кодом статусу, throw кидає довільний PHP-виняток',
      'throw завжди повертає JSON, abort — HTML',
      'Різниці немає, це синоніми',
    ],
    correct: 1,
    explanation:
      'abort() — це обгортка навколо HttpException із заданим HTTP-кодом (404, 403, 422...). throw new Exception() кидає загальний PHP-виняток без HTTP-контексту. abort() зручний для швидкої зупинки виконання з правильним кодом відповіді.',
  },
  {
    question: 'Що повертає Task::findOrFail(9999) якщо запис не знайдено?',
    options: [
      'null',
      'false',
      'Кидає ModelNotFoundException, який перетворюється на 404',
      'Порожній масив []',
    ],
    correct: 2,
    explanation:
      'findOrFail() кидає Illuminate\\Database\\Eloquent\\ModelNotFoundException, якщо запис не знайдено. Глобальний exception handler перетворює його на JSON-відповідь зі статусом 404. На відміну від find(), який просто повертає null.',
  },
  {
    question: 'Який рівень логу використовувати для некритичного попередження (наприклад, користувач близький до ліміту)?',
    options: [
      'Log::emergency()',
      'Log::critical()',
      'Log::warning()',
      'Log::debug()',
    ],
    correct: 2,
    explanation:
      'Log::warning() — для попереджень, які не є помилками, але потребують уваги. emergency() і critical() — для катастрофічних ситуацій. debug() — тільки для розробки. Рівні від найважливішого: emergency → alert → critical → error → warning → notice → info → debug.',
  },
  {
    question: 'Що відбувається коли APP_DEBUG=false і виникає виняток 500?',
    options: [
      'Laravel показує повний stack trace в JSON',
      'Користувач бачить лише "Server Error" без деталей, деталі записуються в логи',
      'Додаток повністю зупиняється',
      'Laravel автоматично виправляє помилку',
    ],
    correct: 1,
    explanation:
      'При APP_DEBUG=false відповідь містить лише {"message":"Server Error","status":500} без деталей. Це захист від витоку внутрішньої інформації (шляхи, SQL, конфігурація). Повний stack trace все одно записується в storage/logs/laravel.log.',
  },
  {
    question: 'Навіщо метод render() у кастомному Exception-класі?',
    options: [
      'Для рендеринга HTML-шаблону помилки',
      'Для запису помилки в лог',
      'Для визначення як виняток перетворюється на HTTP-відповідь',
      'Для повторного кидання винятку',
    ],
    correct: 2,
    explanation:
      'render(Request $request): JsonResponse визначає, яку HTTP-відповідь отримає клієнт коли цей виняток "спливе". Метод report() відповідає за логування. Без render() Laravel використовує глобальний обробник з bootstrap/app.php.',
  },
]

// === Порівняння: JS try/catch → PHP Exception Handler ===
const jsTryCatch = `// Vue/Nuxt — глобальний обробник
const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err.message);
  notify.error(err.message);
};

// Або в Axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message
      || 'Unknown error';
    notify.error(message);
    return Promise.reject(error);
  }
);`

const phpExceptionHandler = `// Laravel — bootstrap/app.php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (
        Throwable $e,
        Request $request
    ) {
        if ($request->is('api/*')
            || $request->expectsJson()) {

            $status = match (true) {
                $e instanceof ModelNotFoundException => 404,
                $e instanceof NotFoundHttpException => 404,
                $e instanceof ValidationException => 422,
                $e instanceof HttpException
                    => $e->getStatusCode(),
                default => 500,
            };

            return response()->json([
                'message' => $e->getMessage()
                             ?: 'Server Error',
                'status'  => $status,
            ], $status);
        }
    });
})`

// === bootstrap/app.php — повний handler ===
const bootstrapHandlerCode = `<?php

use Illuminate\\Foundation\\Application;
use Illuminate\\Foundation\\Configuration\\Exceptions;
use Illuminate\\Foundation\\Configuration\\Middleware;
use Illuminate\\Http\\Request;
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
                    $e instanceof \\Illuminate\\Database\\Eloquent\\ModelNotFoundException => 404,
                    $e instanceof \\Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException => 404,
                    $e instanceof \\Symfony\\Component\\HttpKernel\\Exception\\MethodNotAllowedHttpException => 405,
                    $e instanceof \\Illuminate\\Validation\\ValidationException => 422,
                    $e instanceof \\Symfony\\Component\\HttpKernel\\Exception\\HttpException => $e->getStatusCode(),
                    default => 500,
                };

                $response = [
                    'message' => $e->getMessage() ?: 'Server Error',
                    'status'  => $status,
                ];

                if ($e instanceof \\Illuminate\\Validation\\ValidationException) {
                    $response['errors'] = $e->errors();
                }

                if (config('app.debug') && $status === 500) {
                    $response['debug'] = [
                        'exception' => get_class($e),
                        'file'      => $e->getFile(),
                        'line'      => $e->getLine(),
                    ];
                }

                return response()->json($response, $status);
            }
        });
    })
    ->create();`

// === Порівняння: JS throw vs PHP abort ===
const jsThrow = `// Nuxt — createError
throw createError({
  statusCode: 404,
  statusMessage: 'Task not found.',
});

// Умовна зупинка
if (task.userId !== user.id) {
  throw createError({
    statusCode: 403,
    message: 'This is not your task.',
  });
}

// Загальна перевірка доступу
if (!user.isAdmin) {
  throw createError({ statusCode: 403 });
}`

const phpAbort = `// Laravel — abort()
abort(404, 'Task not found.');

// abort_if — зупиняє якщо умова TRUE
abort_if(
  $task->user_id !== auth()->id(),
  403,
  'This is not your task.'
);

// abort_unless — зупиняє якщо умова FALSE
abort_unless(
  $user->isAdmin(),
  403,
  'Admin access required.'
);`

// === TaskLimitExceededException ===
const customExceptionCode = `<?php

namespace App\\Exceptions;

use Exception;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;

class TaskLimitExceededException extends Exception
{
    private const MAX_TASKS = 100;

    public function __construct(
        private ?int $userId = null,
    ) {
        parent::__construct(
            'You have reached the maximum number of tasks ('
            . self::MAX_TASKS . ').'
        );
    }

    /**
     * Report the exception (логування).
     */
    public function report(): void
    {
        Log::warning('Task limit exceeded', [
            'user_id'   => $this->userId,
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
            'status'  => 429,
        ], 429);
    }
}

// Використання у контролері:
// throw new TaskLimitExceededException(userId: auth()->id());`

// === Log facade ===
const logFacadeCode = `<?php

use Illuminate\\Support\\Facades\\Log;

// Рівні логів (від критичного до менш важливого)
Log::emergency('System is down!');          // Система не працює
Log::alert('Database corrupted!');          // Негайна дія
Log::critical('Payment failed!');           // Критична помилка
Log::error('Task creation failed');         // Помилка
Log::warning('Task limit almost reached');  // Попередження
Log::notice('New user registered');         // Важлива подія
Log::info('Task created', [                 // Інформація
    'task_id' => $task->id,
    'user_id' => $task->user_id,
]);
Log::debug('Query executed', [              // Тільки для dev
    'sql'      => $query->toSql(),
    'bindings' => $query->getBindings(),
]);

// Запис у storage/logs/laravel.log:
// [2026-04-09 10:15:32] local.INFO: Task created
//   {"task_id":43,"user_id":1}`

// === Практика: CodePlayground ===
const practiceCode = `<?php
declare(strict_types=1);

// Симуляція abort() та обробки помилок
function abort(int $status, string $message = ''): never {
    throw new RuntimeException(
        $message ?: match($status) {
            404 => 'Not Found',
            403 => 'Forbidden',
            422 => 'Unprocessable Entity',
            429 => 'Too Many Requests',
            default => 'Error',
        }
    );
}

function abort_if(bool $condition, int $status, string $msg = ''): void {
    if ($condition) abort($status, $msg);
}

function abort_unless(bool $condition, int $status, string $msg = ''): void {
    if (!$condition) abort($status, $msg);
}

// --- Симуляція задачі ---
$task = ['id' => 1, 'title' => 'Fix bug', 'user_id' => 42];
$authUserId = 42;
$isAdmin = false;

// Перевірка права доступу
try {
    abort_if($task['user_id'] !== $authUserId, 403, 'This is not your task.');
    echo "✅ Доступ дозволено: задача належить поточному користувачу\\n";
} catch (RuntimeException $e) {
    echo "❌ 403: " . $e->getMessage() . "\\n";
}

// Перевірка адміна
try {
    abort_unless($isAdmin, 403, 'Admin access required.');
    echo "✅ Адмін доступ\\n";
} catch (RuntimeException $e) {
    echo "❌ 403: " . $e->getMessage() . "\\n";
}

// findOrFail симуляція
function findOrFail(array $db, int $id): array {
    foreach ($db as $item) {
        if ($item['id'] === $id) return $item;
    }
    throw new RuntimeException("Resource not found.");
}

$tasks = [
    ['id' => 1, 'title' => 'Fix bug'],
    ['id' => 2, 'title' => 'Write tests'],
];

try {
    $found = findOrFail($tasks, 1);
    echo "\\n✅ Знайдено: " . $found['title'] . "\\n";
} catch (RuntimeException $e) {
    echo "\\n❌ 404: " . $e->getMessage() . "\\n";
}

try {
    $notFound = findOrFail($tasks, 9999);
    echo "✅ Знайдено: " . $notFound['title'] . "\\n";
} catch (RuntimeException $e) {
    echo "❌ 404: " . $e->getMessage() . "\\n";
}`

// === Завдання: кастомний Exception ===
const taskStarterCode = `<?php
declare(strict_types=1);

// Завдання: створіть кастомний Exception клас
// та використайте його у функції-симуляції

// 1. Реалізуйте клас DuplicateTaskException extends RuntimeException
//    - конструктор приймає string $title та ?int $userId = null
//    - метод getMessage() повертає: "Task '$title' already exists."
//    - метод getStatusCode() повертає 409

class DuplicateTaskException extends RuntimeException {
    // Ваш код тут
}

// 2. Реалізуйте функцію createTask(array $existing, string $title): array
//    - Якщо задача з таким title вже існує → кидає DuplicateTaskException
//    - Інакше → повертає ['id' => count($existing) + 1, 'title' => $title]

function createTask(array $existing, string $title): array {
    // Ваш код тут
}

// --- Тестування ---
$tasks = [
    ['id' => 1, 'title' => 'Fix bug'],
    ['id' => 2, 'title' => 'Write tests'],
];

// Тест 1: нова унікальна задача
try {
    $newTask = createTask($tasks, 'Deploy app');
    echo "✅ Задачу створено: id={$newTask['id']}, title={$newTask['title']}\\n";
} catch (DuplicateTaskException $e) {
    echo "❌ " . $e->getMessage() . "\\n";
}

// Тест 2: дублікат
try {
    $duplicate = createTask($tasks, 'Fix bug');
    echo "✅ Задачу створено: " . $duplicate['title'] . "\\n";
} catch (DuplicateTaskException $e) {
    echo "✅ DuplicateTaskException: " . $e->getMessage() . "\\n";
    echo "   HTTP Status: " . $e->getStatusCode() . "\\n";
}

// Автотест
echo "\\n=== Автоперевірка ===\\n";
$pass = 0;

try {
    createTask($tasks, 'Write tests');
    echo "✗ Мав кинути DuplicateTaskException\\n";
} catch (DuplicateTaskException $e) {
    if ($e->getMessage() === "Task 'Write tests' already exists.") {
        echo "✓ Повідомлення правильне\\n"; $pass++;
    } else {
        echo "✗ Повідомлення: '{$e->getMessage()}'\\n";
    }
    if ($e->getStatusCode() === 409) {
        echo "✓ HTTP 409\\n"; $pass++;
    } else {
        echo "✗ getStatusCode() = " . $e->getStatusCode() . "\\n";
    }
}

$result = createTask($tasks, 'Unique task');
if ($result['id'] === 3 && $result['title'] === 'Unique task') {
    echo "✓ createTask повертає правильний масив\\n"; $pass++;
} else {
    echo "✗ createTask повертає неправильний масив\\n";
}

echo "\\nРезультат: {$pass}/3\\n";`

const taskTestCode = `
// Автотест вбудований у код вище
`
</script>

<template>
  <div class="lesson-content">
    <!-- ===== THEORY TAB ===== -->
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="app.config.errorHandler" to="withExceptions()" />

      <TheoryBlock title="Проблема: Laravel повертає HTML для API">
        <p>
          За замовчуванням, коли Laravel стикається з помилкою, він генерує
          <strong>HTML-сторінку</strong>. Ваш Vue-фронтенд робить
          <code>axios.get('/api/tasks/9999')</code> і очікує JSON, але замість
          цього отримує HTML. <code>response.data.message</code> буде
          <code>undefined</code> — інтерфейс ламається.
        </p>
        <p>
          Рішення: налаштувати глобальний exception handler у
          <code>bootstrap/app.php</code> так, щоб <strong>кожна</strong>
          API-помилка повертала JSON у передбачуваному форматі:
        </p>
        <pre><code>{ "message": "Task not found.", "status": 404 }</code></pre>
        <p>
          Це аналог <code>app.config.errorHandler</code> у Vue або
          Axios interceptor — єдине місце, де ви контролюєте формат
          усіх помилок.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsTryCatch"
        :php="phpExceptionHandler"
        js-title="Vue/Axios — глобальна обробка помилок"
        php-title="Laravel — withExceptions() у bootstrap/app.php"
      />

      <CodeBlock
        title="bootstrap/app.php — повний exception handler для API"
        language="php"
        :code="bootstrapHandlerCode"
      />

      <TheoryBlock title="abort() та findOrFail() — зупинка виконання">
        <p>
          <code>abort()</code> — найпростіший спосіб "кинути" HTTP-помилку
          з будь-якого місця в коді. Є зручні варіанти:
        </p>
        <ul>
          <li>
            <code>abort_if($умова, 403)</code> — зупиняє якщо умова
            <strong>true</strong>
          </li>
          <li>
            <code>abort_unless($умова, 403)</code> — зупиняє якщо умова
            <strong>false</strong>
          </li>
        </ul>
        <p>
          <code>findOrFail()</code> автоматично кидає
          <code>ModelNotFoundException</code> → 404, якщо запис не знайдено.
          Замість ручної перевірки <code>if (!$task) abort(404)</code> просто
          пишіть <code>Task::findOrFail($id)</code> — глобальний handler
          зробить решту.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsThrow"
        :php="phpAbort"
        js-title="Nuxt — createError()"
        php-title="Laravel — abort() та abort_if()"
      />

      <TheoryBlock title="Власні Exception-класи для бізнес-логіки">
        <p>
          Коли стандартних HTTP-помилок недостатньо, створюють власні
          Exception-класи. Наприклад, <code>TaskLimitExceededException</code>
          для ліміту задач (HTTP 429). Клас має два спеціальних методи:
        </p>
        <ul>
          <li>
            <code>render(Request $request)</code> — визначає JSON-відповідь
            клієнту. Аналог <code>class TaskError extends Error {}</code>
            у TypeScript
          </li>
          <li>
            <code>report()</code> — контролює, як виняток записується в лог.
            Тут зручно додавати контекст: <code>user_id</code>, лімітне значення
          </li>
        </ul>
        <p>
          Створення: <code>php artisan make:exception TaskLimitExceededException</code>
        </p>
      </TheoryBlock>

      <CodeBlock
        title="app/Exceptions/TaskLimitExceededException.php"
        language="php"
        :code="customExceptionCode"
      />

      <TheoryBlock title="Log фасад — логування на сервері">
        <p>
          Замість <code>console.log()</code>, який зникає при закритті браузера,
          Laravel пише логи у файл <code>storage/logs/laravel.log</code> —
          вони зберігаються на сервері. Другий аргумент — контекст (масив
          даних), аналог передачі об'єкта в <code>console.log</code>.
        </p>
        <p>
          Ієрархія рівнів (від критичного): <code>emergency</code> →
          <code>alert</code> → <code>critical</code> → <code>error</code> →
          <code>warning</code> → <code>notice</code> → <code>info</code> →
          <code>debug</code>. Використовуйте відповідний рівень:
          <code>error</code> для помилок, <code>warning</code> для
          попереджень, <code>info</code> для важливих подій.
        </p>
        <p>
          Перегляд логів у реальному часі:
          <code>tail -f storage/logs/laravel.log</code>
        </p>
      </TheoryBlock>

      <CodeBlock
        title="Log фасад — рівні та контекст"
        language="php"
        :code="logFacadeCode"
      />
    </div>

    <!-- ===== PRACTICE TAB ===== -->
    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: abort(), findOrFail() та обробка помилок">
        <p>
          Симуляція роботи <code>abort()</code>, <code>abort_if()</code>,
          <code>abort_unless()</code> та <code>findOrFail()</code> у PHP.
          Запустіть і спостерігайте як try/catch перехоплює різні сценарії.
          Спробуйте змінити <code>$authUserId</code> або
          <code>$isAdmin</code> щоб побачити різні результати.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/10-error-handling.php"
      />
    </div>

    <!-- ===== QUIZ TAB ===== -->
    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="2-10" />
    </div>

    <!-- ===== TASK TAB ===== -->
    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: кастомний Exception DuplicateTaskException">
        <p>
          Реалізуйте власний Exception-клас та функцію з перевіркою на дублікат.
        </p>
        <ol>
          <li>
            Створіть клас <code>DuplicateTaskException extends RuntimeException</code>:
            <ul>
              <li>
                Конструктор приймає <code>string $title</code> та
                <code>?int $userId = null</code>
              </li>
              <li>
                <code>getMessage()</code> повертає:
                <code>"Task '$title' already exists."</code>
              </li>
              <li>
                Метод <code>getStatusCode(): int</code> повертає <code>409</code>
              </li>
            </ul>
          </li>
          <li>
            Реалізуйте функцію
            <code>createTask(array $existing, string $title): array</code>:
            <ul>
              <li>
                Якщо задача з таким <code>title</code> вже є — кидає
                <code>DuplicateTaskException</code>
              </li>
              <li>
                Інакше повертає <code>['id' => count($existing) + 1, 'title' => $title]</code>
              </li>
            </ul>
          </li>
        </ol>
        <p>
          Підказка: перевіряйте наявність через
          <code>foreach</code> або <code>array_column()</code>.
          Автотест перевірить повідомлення, HTTP-код та повернене значення.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте DuplicateTaskException"
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
