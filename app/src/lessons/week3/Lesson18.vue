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
    question: 'Яка різниця між QUEUE_CONNECTION=sync та database?',
    options: [
      'sync зберігає в базу, database виконує одразу',
      'sync виконує Job одразу (блокуючи HTTP-response), database кладе в таблицю jobs для окремого worker-процесу',
      'sync працює тільки з Redis, database — з будь-яким DB',
      'Різниці немає, обидва виконують Job одразу',
    ],
    correct: 1,
    explanation:
      'sync-драйвер обробляє Job прямо всередині HTTP-запиту — клієнт чекає, поки Job не завершиться. database кладе серіалізований Job у таблицю jobs, і вже окремий процес php artisan queue:work підбирає та виконує його. Це як різниця між await doWork() (блокує) і worker.postMessage(data) (асинхронно).',
  },
  {
    question: 'Що робить інтерфейс ShouldQueue у класі Job?',
    options: [
      'Нічого — це маркер для IDE',
      'Каже Laravel: «поставити Job у чергу» (а не виконувати sync) при dispatch()',
      'Дозволяє використовувати метод dispatch()',
      'Автоматично додає retry при помилці',
    ],
    correct: 1,
    explanation:
      'ShouldQueue — маркерний інтерфейс. При dispatch() Laravel перевіряє його наявність: якщо є — кладе в чергу (async); якщо ні — виконує синхронно (навіть при database driver!). Трейт Dispatchable дає метод dispatch(); retry-налаштування — це окремі властивості $tries / $backoff.',
  },
  {
    question: 'Що саме робить php artisan queue:work?',
    options: [
      'Створює нові Jobs у черзі',
      'Видаляє всі Jobs із черги',
      'Запускає worker-процес, що безперервно підбирає та виконує Jobs з черги',
      'Показує список Jobs у черзі',
    ],
    correct: 2,
    explanation:
      'queue:work запускає довгоживучий процес (daemon), який слухає чергу і підбирає Jobs одну за одною. Прапорець --once обробить один Job і зупиниться. У продакшені worker тримається живим через Supervisor або systemd. Аналогія — Web Worker, що безперервно слухає onmessage.',
  },
  {
    question: 'Де у Laravel 12 описується розклад (Schedule) задач?',
    options: [
      'config/schedule.php',
      'app/Console/Kernel.php',
      'routes/console.php',
      'bootstrap/app.php',
    ],
    correct: 2,
    explanation:
      "У Laravel 11/12 розклад описується у routes/console.php через фасад Schedule: Schedule::command('app:my-command')->dailyAt('09:00'). Старий підхід через app/Console/Kernel.php прибрали разом з Kernel-класом. Щоб розклад виконувався, потрібен один cron-запис: * * * * * php artisan schedule:run.",
  },
  {
    question: 'Який HTTP-статус найкращий для відповіді «запит прийнято, обробка у фоні»?',
    options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
    correct: 2,
    explanation:
      '202 Accepted явно каже клієнту: «ваш запит прийнято, але ще НЕ виконано — результат буде пізніше». Ідеальний для async-операцій (генерація звіту, масова розсилка). 200 — «все готово», 201 — «ресурс створено», 204 — «успіх без контенту». Фронтенд побачить 202 і може показати toast «Processing…» замість очікування.',
  },
]

// === CodeComparison: JS async vs Laravel Queue ===
const jsAsync = `// JavaScript — async / Web Worker

// Варіант 1: await (як queue sync)
// Блокує, клієнт чекає ⏳
async function handleClick() {
  showSpinner()
  await sendBulkEmails(users) // 30 секунд!
  hideSpinner()
}

// Варіант 2: Web Worker (як queue database)
// Не блокує — відповідь одразу ✅
const worker = new Worker('./email-worker.js')

function handleClick() {
  worker.postMessage({ users })  // ← dispatch()
  showToast('Processing…')       // ← response 202
}

// Worker (окремий потік):
worker.onmessage = (event) => {
  // Підбирає задачу з черги
  for (const user of event.data.users) {
    sendEmail(user)
  }
  postMessage({ done: true })
}

// setTimeout — аналог delay():
// SendEmail::dispatch(user)->delay(now()->addMinutes(10))
setTimeout(() => sendEmail(user), 10 * 60 * 1000)

// setInterval — аналог Schedule:
// Schedule::command('...')->everyFiveMinutes()
setInterval(() => healthCheck(), 5 * 60 * 1000)`

const phpQueue = `<?php
// Laravel Queue — той самий принцип

// Варіант 1: sync (await) — Job виконується відразу
// QUEUE_CONNECTION=sync
// => HTTP Response чекає завершення Job

// Варіант 2: database (Worker) — Job у чергу
// QUEUE_CONNECTION=database
// => HTTP Response миттєвий (202 Accepted)

// dispatch() — кладе Job у чергу
SendOverdueReminders::dispatch($user);

// dispatch з затримкою (як setTimeout)
SendOverdueReminders::dispatch($user)
    ->delay(now()->addMinutes(10));

// dispatch на конкретну чергу (пріоритетність)
SendOverdueReminders::dispatch($user)
    ->onQueue('notifications');

// dispatchSync — ігнорує ShouldQueue
SendOverdueReminders::dispatchSync($user);

// Worker (окремий процес):
// php artisan queue:work
// → Підбирає Job з таблиці jobs
// → Десеріалізує → Викликає handle()
// → Видаляє з черги
// → Слухає далі…

// Schedule (як setInterval):
// routes/console.php
Schedule::command('app:send-overdue-reminders')
    ->dailyAt('09:00')
    ->withoutOverlapping();`

// === CodeBlock: Job class ===
const jobCode = `<?php

namespace App\\Jobs;

use App\\Models\\User;
use App\\Notifications\\TaskOverdueNotification;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Contracts\\Queue\\ShouldQueue;
use Illuminate\\Foundation\\Bus\\Dispatchable;
use Illuminate\\Queue\\InteractsWithQueue;
use Illuminate\\Queue\\SerializesModels;

class SendOverdueReminders implements ShouldQueue // ← маркер: в чергу!
{
    use Dispatchable,        // → ::dispatch(), ::dispatchSync()
        InteractsWithQueue,  // → $this->release(), $this->delete()
        Queueable,           // → ->onQueue('name'), ->delay()
        SerializesModels;    // → зберігає лише ID моделей (не весь обʼєкт)

    /**
     * Retry-налаштування:
     */
    public int $tries   = 3;            // макс. спроб
    public int $timeout = 60;           // секунд на одну спробу
    public array $backoff = [10, 30, 60]; // затримка між спробами (прогресивна)

    public function __construct(
        public User $user  // SerializesModels збереже лише $user->id
    ) {}

    public function handle(): void
    {
        $overdueTasks = $this->user->tasks()
            ->where('status', '!=', 'done')
            ->where('deadline', '<', now())
            ->get();

        \\Log::info("Overdue reminders for {$this->user->name}", [
            'count' => $overdueTasks->count(),
        ]);

        foreach ($overdueTasks as $task) {
            $this->user->notify(new TaskOverdueNotification($task));
        }
    }

    /**
     * Якщо всі $tries провалились — логуємо і забуваємо.
     * Job потрапить у таблицю failed_jobs для ручного розгляду.
     */
    public function failed(\\Throwable $exception): void
    {
        \\Log::error("Failed overdue reminders for user {$this->user->id}", [
            'error' => $exception->getMessage(),
        ]);
    }
}`

// === CodeBlock: Queue diagram ===
const queueDiagram = `Request → Controller → dispatch(SendOverdueReminders)
                                    ↓
                    ┌───────────────────────────┐
                    │ TABLE jobs                 │
                    │ ─────────────────────────  │
                    │ id | queue | payload | ... │
                    │  1 | default | {...}  | ...│
                    └───────────────┬───────────┘
                                    ↓
                    php artisan queue:work (Worker)
                                    ↓
                    ┌───────────────────────────┐
                    │ Job::handle()             │
                    │  → query overdue tasks    │
                    │  → send notifications     │
                    └───────────────────────────┘
                                    ↓
                            Job видаляється з черги ✓

     Якщо handle() кинув Exception:
       → attempt++ → якщо attempts < $tries → retry (з backoff)
       → якщо attempts >= $tries → failed_jobs table + failed() callback`

// === CodeBlock: Schedule ===
const scheduleCode = `<?php

// routes/console.php — розклад (Laravel 11/12)
use Illuminate\\Support\\Facades\\Schedule;

// Щодня о 9:00 — нагадування (через Artisan-команду)
Schedule::command('app:send-overdue-reminders')
    ->dailyAt('09:00')
    ->withoutOverlapping()   // якщо попередній ще працює — пропустити
    ->name('overdue-reminders');

// Щотижня — cleanup через Job (не команду)
Schedule::job(new \\App\\Jobs\\CleanupCompletedTasks)
    ->weekly()
    ->name('cleanup-completed');

// Кожні 5 хвилин — health check
Schedule::command('app:health-check')
    ->everyFiveMinutes()
    ->runInBackground();     // не блокувати планувальник

// 📌 Щоб все це працювало — ОДИН запис у crontab:
// * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
//
// 💡 php artisan schedule:list — подивитися всі задачі та їх next due`

// === CodeBlock: Artisan Command ===
const artisanCode = `<?php

// app/Console/Commands/SendOverdueRemindersCommand.php
// Аналог npm-скрипта, але з аргументами, опціями та прогрес-баром

namespace App\\Console\\Commands;

use App\\Jobs\\SendOverdueReminders;
use App\\Models\\User;
use Illuminate\\Console\\Command;

class SendOverdueRemindersCommand extends Command
{
    // Сигнатура: імʼя + опції (як CLI-tool)
    protected $signature = 'app:send-overdue-reminders
                            {--user= : Process specific user ID}
                            {--dry-run : Preview without dispatching}';

    protected $description = 'Send overdue task reminders to users';

    public function handle(): int
    {
        $userId = $this->option('user');
        $dryRun = $this->option('dry-run');

        $users = $userId
            ? User::where('id', $userId)->get()
            : User::has('tasks')->get();

        if ($users->isEmpty()) {
            $this->warn('No users with tasks found.');
            return Command::SUCCESS;
        }

        if ($dryRun) {
            $this->info("DRY RUN: Would process {$users->count()} users:");
            foreach ($users as $user) {
                $overdue = $user->tasks()->where('deadline', '<', now())->count();
                $this->line("  {$user->name}: {$overdue} overdue");
            }
            return Command::SUCCESS;
        }

        // Прогрес-бар — зручно для довгих операцій
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        foreach ($users as $user) {
            SendOverdueReminders::dispatch($user);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Dispatched for {$users->count()} users.");

        return Command::SUCCESS;
    }
}

// php artisan app:send-overdue-reminders
// php artisan app:send-overdue-reminders --user=1
// php artisan app:send-overdue-reminders --dry-run`

// === Practice: in-memory queue simulator ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо Laravel Queue + Worker + Schedule на чистому PHP.
// Показує: dispatch → таблиця jobs → worker підбирає → handle() → видалення.

// === In-memory «таблиця jobs» ===
$jobsTable = []; // [ ['id', 'class', 'payload', 'attempts', 'available_at'] ]
$failedJobsTable = [];
$nextJobId = 1;
$processedLog = [];

// === dispatch() — додає Job у «таблицю» ===
function dispatch(string $class, array $payload, int $delaySeconds = 0): int {
    global $jobsTable, $nextJobId;
    $id = $nextJobId++;
    $jobsTable[] = [
        'id'           => $id,
        'class'        => $class,
        'payload'      => $payload,
        'attempts'     => 0,
        'max_tries'    => $payload['tries'] ?? 3,
        'available_at' => time() + $delaySeconds,
    ];
    echo "  📤 dispatch({$class} #{$id})" . ($delaySeconds ? " delay={$delaySeconds}s" : "") . "\\n";
    return $id;
}

// === Worker — підбирає і виконує Job ===
function workOnce(callable $handlers): bool {
    global $jobsTable, $failedJobsTable, $processedLog;

    // Знайти перший доступний Job (available_at <= now)
    foreach ($jobsTable as $i => $job) {
        if ($job['available_at'] > time()) { continue; }

        echo "  ⚙️  worker: processing {$job['class']} #{$job['id']} (attempt {$job['attempts']}+1)\\n";
        $jobsTable[$i]['attempts']++;

        $handler = $handlers[$job['class']] ?? null;
        if (!$handler) {
            echo "     ❌ no handler for {$job['class']}\\n";
            array_splice($jobsTable, $i, 1);
            return true;
        }

        try {
            $handler($job['payload']);
            $processedLog[] = $job;
            array_splice($jobsTable, $i, 1); // Job оброблено — видаляємо
            echo "     ✅ processed successfully\\n";
        } catch (\\Exception $e) {
            echo "     ❌ failed: {$e->getMessage()}\\n";
            if ($jobsTable[$i]['attempts'] >= $jobsTable[$i]['max_tries']) {
                echo "     💀 max tries reached → failed_jobs\\n";
                $failedJobsTable[] = $jobsTable[$i];
                array_splice($jobsTable, $i, 1);
            } else {
                echo "     🔄 will retry (attempt {$jobsTable[$i]['attempts']}/{$jobsTable[$i]['max_tries']})\\n";
            }
        }
        return true;
    }
    echo "  💤 worker: no jobs available\\n";
    return false;
}

// === Handlers (аналог Job::handle()) ===
$notifications = [];

$handlers = [
    'SendOverdueReminders' => function (array $payload) use (&$notifications) {
        $userId = $payload['user_id'];
        $userName = $payload['user_name'];
        $overdueCount = $payload['overdue_count'];

        if ($overdueCount === 0) { return; }

        // Симуляція: надсилаємо notification
        $notifications[$userId][] = [
            'type'    => 'TaskOverdueNotification',
            'message' => "У вас {$overdueCount} прострочених задач!",
        ];
        echo "     📬 notification sent to {$userName}\\n";
    },

    'GenerateReport' => function (array $payload) {
        $userId = $payload['user_id'];
        // Симулюємо помилку при першій спробі (для демо retry)
        if (($payload['_simulateFail'] ?? false) && ($GLOBALS['jobsTable'][0]['attempts'] ?? 0) <= 1) {
            throw new \\Exception("Connection timeout to reporting service");
        }
        echo "     📊 report generated for user {$userId}\\n";
    },
];

// ====== Сценарій ======

echo "=== 1) Dispatch три Jobs ===\\n";
dispatch('SendOverdueReminders', ['user_id' => 1, 'user_name' => 'Alice', 'overdue_count' => 3]);
dispatch('SendOverdueReminders', ['user_id' => 2, 'user_name' => 'Bob',   'overdue_count' => 0]);
dispatch('GenerateReport',       ['user_id' => 1, 'tries' => 3, '_simulateFail' => true]);
echo "  jobs у черзі: " . count($jobsTable) . "\\n\\n";

echo "=== 2) Worker обробляє по одному (як queue:work --once) ===\\n\\n";

echo "--- workOnce #1 ---\\n";
workOnce($handlers);
echo "  jobs залишилось: " . count($jobsTable) . "\\n\\n";

echo "--- workOnce #2 ---\\n";
workOnce($handlers);
echo "\\n";

echo "--- workOnce #3 (GenerateReport — fail → retry) ---\\n";
workOnce($handlers);
echo "\\n";

echo "--- workOnce #4 (GenerateReport — retry → success) ---\\n";
workOnce($handlers);
echo "\\n";

echo "--- workOnce #5 (нічого в черзі) ---\\n";
workOnce($handlers);
echo "\\n";

echo "=== 3) Результати ===\\n";
echo "  Оброблено Jobs:   " . count($processedLog) . "\\n";
echo "  Failed Jobs:      " . count($failedJobsTable) . "\\n";
echo "  Notifications:\\n";
foreach ($notifications as $uid => $list) {
    foreach ($list as $n) {
        echo "    user {$uid}: {$n['message']}\\n";
    }
}
echo "  Bob (0 overdue) — notification НЕ надіслано (правильно)\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте Job-систему з retry-логікою та Schedule runner.
 *
 * 4 функції:
 *
 *   1) dispatch(string $class, array $payload, int $delaySeconds = 0): int
 *      — кладе Job у глобальний масив $jobsTable, повертає id.
 *      Структура: ['id', 'class', 'payload', 'attempts' => 0,
 *                  'max_tries' => $payload['tries'] ?? 3,
 *                  'available_at' => time() + $delaySeconds]
 *
 *   2) workOnce(array $handlers): ?array
 *      — знаходить ПЕРШИЙ job де available_at <= time()
 *      — attempts++
 *      — викликає $handlers[$job['class']]($job['payload'])
 *      — при success: видалити з $jobsTable, повернути ['status' => 'processed', 'id' => ...]
 *      — при Exception:
 *          якщо attempts >= max_tries → перекласти в $failedJobsTable → ['status' => 'failed', ...]
 *          інакше → лишити в $jobsTable (retry) → ['status' => 'retry', ...]
 *      — якщо жодного job не знайдено → null
 *
 *   3) scheduleRun(array $scheduleItems): array
 *      — приймає масив [['command' => string, 'isDue' => bool]]
 *      — для кожного де isDue=true → dispatch($command, [])
 *      — повертає масив dispatched command names
 *
 *   4) getQueueStats(): array
 *      — повертає ['pending' => count($jobsTable), 'failed' => count($failedJobsTable)]
 */

$jobsTable = [];
$failedJobsTable = [];
$nextJobId = 1;

function dispatch(string $class, array $payload, int $delaySeconds = 0): int {
    // Ваш код тут
}

function workOnce(array $handlers): ?array {
    // Ваш код тут
}

function scheduleRun(array $scheduleItems): array {
    // Ваш код тут
}

function getQueueStats(): array {
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 8;

// Reset
$jobsTable = [];
$failedJobsTable = [];
$nextJobId = 1;

// 1. dispatch додає Job і повертає id
$id1 = dispatch('TestJob', ['data' => 'hello']);
if ($id1 >= 1 && count($jobsTable) === 1 && $jobsTable[0]['class'] === 'TestJob') {
    echo "✓ dispatch: Job додано, id={$id1}\\n"; $pass++;
} else {
    echo "✗ dispatch: не додало Job або id некоректний\\n";
}

// 2. dispatch з delay
$id2 = dispatch('DelayedJob', ['x' => 1], 999999);
if (count($jobsTable) === 2 && $jobsTable[1]['available_at'] > time() + 999990) {
    echo "✓ dispatch delay: available_at правильний\\n"; $pass++;
} else {
    echo "✗ dispatch delay: available_at некоректний\\n";
}

// 3. workOnce: обробляє першу доступну Job
$processed = [];
$handlers = [
    'TestJob' => function ($p) use (&$processed) { $processed[] = $p; },
    'DelayedJob' => function ($p) { /* won't run yet */ },
    'FailingJob' => function ($p) { throw new \\Exception('boom'); },
];

$result = workOnce($handlers);
if ($result && $result['status'] === 'processed' && count($processed) === 1) {
    echo "✓ workOnce: обробив TestJob, видалив з черги\\n"; $pass++;
} else {
    echo "✗ workOnce: result=" . json_encode($result) . "\\n";
}

// 4. workOnce: DelayedJob ще не доступний → null
$result2 = workOnce($handlers);
if ($result2 === null) {
    echo "✓ workOnce: DelayedJob ще не доступний → null\\n"; $pass++;
} else {
    echo "✗ workOnce: мав повернути null, отримано " . json_encode($result2) . "\\n";
}

// 5. workOnce retry: Job з 2 tries, fail на першому → retry
dispatch('FailingJob', ['tries' => 2]);
$r3 = workOnce($handlers);
if ($r3 && $r3['status'] === 'retry') {
    echo "✓ workOnce retry: 1/2 спроба → retry\\n"; $pass++;
} else {
    echo "✗ workOnce retry: мав бути retry, отримано " . json_encode($r3) . "\\n";
}

// 6. workOnce failed: 2/2 спроба → failed_jobs
$r4 = workOnce($handlers);
if ($r4 && $r4['status'] === 'failed' && count($failedJobsTable) === 1) {
    echo "✓ workOnce failed: 2/2 → failed_jobs\\n"; $pass++;
} else {
    echo "✗ workOnce failed: " . json_encode($r4) . ", failed=" . count($failedJobsTable) . "\\n";
}

// 7. scheduleRun: dispatch тільки isDue=true
$dispatched = scheduleRun([
    ['command' => 'overdue-reminders', 'isDue' => true],
    ['command' => 'cleanup',           'isDue' => false],
    ['command' => 'health-check',      'isDue' => true],
]);
if ($dispatched === ['overdue-reminders', 'health-check']) {
    echo "✓ scheduleRun: dispatched тільки isDue=true\\n"; $pass++;
} else {
    echo "✗ scheduleRun: " . json_encode($dispatched) . "\\n";
}

// 8. getQueueStats
$stats = getQueueStats();
if ($stats['pending'] >= 2 && $stats['failed'] === 1) {
    echo "✓ getQueueStats: pending={$stats['pending']}, failed={$stats['failed']}\\n"; $pass++;
} else {
    echo "✗ getQueueStats: " . json_encode($stats) . "\\n";
}

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="setTimeout/Web Worker postMessage"
        to="dispatch(new Job()) + php artisan queue:work"
      />

      <TheoryBlock title="Навіщо черги — не блокувати відповідь клієнту">
        <p>
          Уявіть Vue: користувач натиснув «Зберегти», а <code>fetch()</code> чекає 30 секунд, поки
          сервер розсилає 1000 email-ів. Спінер крутиться, користувач нервує.
          <strong>Черги</strong> вирішують це: замість виконання роботи під час HTTP-запиту ви
          «кидаєте» Job у чергу і <em>одразу</em> повертаєте відповідь (202 Accepted). Окремий
          worker-процес підбирає Job і виконує його у фоні.
        </p>
        <p>
          <strong>Коли черги:</strong> email/SMS, генерація PDF, обробка зображень, синхронізація з
          зовнішнім API — будь-що довше 1-2 секунди.<br />
          <strong>Коли НЕ черги:</strong> прості CRUD, валідація, читання з бази — все, що
          виконується за мілісекунди.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="queueDiagram"
        lang="text"
        title="Потік: dispatch → jobs table → worker → handle()"
      />

      <CodeComparison
        :js="jsAsync"
        :php="phpQueue"
        js-title="JS — await (sync) vs Web Worker (async)"
        php-title="Laravel — sync vs database queue + Schedule"
      />

      <TheoryBlock title="Job — одиниця фонової роботи">
        <p>Job — клас з методом <code>handle()</code>, інкапсулює одну задачу. Ключові елементи:</p>
        <ul>
          <li>
            <code>implements ShouldQueue</code> — маркер: «в чергу!» Без нього dispatch() виконає
            sync.
          </li>
          <li>
            <code>Dispatchable</code> → <code>::dispatch()</code>, <code>::dispatchSync()</code>,
            <code>::dispatchAfterResponse()</code>.
          </li>
          <li>
            <code>SerializesModels</code> — зберігає лише ID моделі, не весь обʼєкт. Worker
            перечитає модель з БД при обробці.
          </li>
          <li>
            <code>$tries</code>, <code>$backoff</code>, <code>$timeout</code> — retry-параметри.
            Якщо всі спроби провалились → <code>failed()</code> callback + запис у
            <code>failed_jobs</code>.
          </li>
        </ul>
      </TheoryBlock>

      <CodeBlock :code="jobCode" lang="php" title="SendOverdueReminders Job з retry" />

      <TheoryBlock title="Task Scheduling — серверний setInterval">
        <p>
          Замість купи cron-записів — один файл <code>routes/console.php</code>, де розклад описано
          читабельним PHP-кодом. Частоти: <code>everyMinute()</code>, <code>hourly()</code>,
          <code>dailyAt('09:00')</code>, <code>weeklyOn(1, '8:00')</code>, тощо. Додаткові опції:
          <code>withoutOverlapping()</code> (не дублювати), <code>onOneServer()</code> (кластер),
          <code>runInBackground()</code>.
        </p>
        <p>
          <strong>Один cron-запис для всього:</strong>
          <code>* * * * * php artisan schedule:run</code> — Laravel сам вирішить, які задачі зараз
          <em>due</em>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="scheduleCode" lang="php" title="routes/console.php — Schedule + cron" />

      <TheoryBlock title="Custom Artisan Commands — потужніші npm scripts">
        <p>
          Artisan-команда — це клас з <code>$signature</code> (імʼя + аргументи + опції) та
          <code>handle()</code>. Дає зручний CLI-інтерфейс: прогрес-бари, опцію
          <code>--dry-run</code> для безпечного превʼю, <code>--user=ID</code> для вибіркового
          запуску. Команди можна викликати і з Schedule, і вручну.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="artisanCode"
        lang="php"
        title="Artisan-команда з --dry-run та прогрес-баром"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: queue simulator з retry-логікою">
        <p>
          У playground ми реалізуємо <strong>повну queue-систему</strong> в памʼяті:
          <code>dispatch()</code> кладе Job у масив-«таблицю», <code>workOnce()</code> підбирає
          перший доступний і виконує (або retry при Exception).
        </p>
        <p>
          Сценарій: 3 Jobs (Alice reminders, Bob reminders, GenerateReport з симульованим fail).
          Worker обробляє по одному — побачите retry (fail → повторна спроба → success) і перевірку,
          що Bob з 0 overdue НЕ отримує notification. Спробуйте додати
          <code>delay</code> — побачите, що workOnce пропускає Job з <code>available_at</code> у
          майбутньому.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/18-queues.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="3-18" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Job-система з retry, Schedule runner та stats">
        <p>
          Реалізуйте 4 функції, які разом утворюють робочу queue-систему. Натисніть
          <strong>«Запустити»</strong> — 8 авто-тестів перевірять dispatch, delay, retry-логіку
          (fail → retry → failed_jobs), Schedule runner і getQueueStats.
        </p>
        <ol>
          <li>
            <strong>dispatch($class, $payload, $delaySeconds)</strong> — кладе Job у
            <code>$jobsTable</code>, повертає id.
            <code>available_at = time() + $delaySeconds</code>.
          </li>
          <li>
            <strong>workOnce($handlers)</strong> — підбирає ПЕРШИЙ Job де
            <code>available_at &lt;= time()</code>; attempts++; при Exception — retry або
            failed_jobs (залежно від max_tries). Повертає
            <code>['status' => 'processed'|'retry'|'failed', 'id' => ...]</code> або
            <code>null</code>.
          </li>
          <li>
            <strong>scheduleRun($items)</strong> — приймає масив з <code>isDue</code> прапорцем;
            dispatch лише <code>isDue=true</code>; повертає масив dispatched command names.
          </li>
          <li>
            <strong>getQueueStats()</strong> — повертає
            <code>['pending' => ..., 'failed' => ...]</code>.
          </li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте queue-систему з retry та Schedule"
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
