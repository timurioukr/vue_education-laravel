# Урок 18: Черги та заплановані завдання

## Що ви вивчите

- Що таке черги (queues) і навіщо вони потрібні
- Як створювати та диспатчити Jobs
- Як працює queue worker
- Як налаштувати планувальник задач (Task Scheduling)
- Як створювати власні Artisan-команди

## Паралелі з JS/Vue

| Laravel | JS/Vue |
|---------|--------|
| `dispatch(new MyJob())` | `setTimeout(() => doWork(), 0)` / Web Worker `.postMessage()` |
| Job class | Async function / Web Worker handler |
| `php artisan queue:work` | Web Worker thread, що слухає повідомлення |
| Queue driver `sync` | `await doWork()` — виконується відразу |
| Queue driver `database` | Реальна черга з таблицею задач |
| Failed jobs + retry | Retry-логіка при невдалому `fetch()` |
| `Schedule::command()->daily()` | `setInterval()` або cron (чисто бекенд-концепт) |
| Artisan commands | npm scripts в `package.json` |
| `php artisan schedule:run` | Виконати всі заплановані задачі (викликається cron щохвилини) |

## Теорія

### Навіщо потрібні черги?

Уявіть ситуацію у Vue: користувач натиснув кнопку "Зберегти", і ваш `fetch()` чекає 30 секунд, поки сервер обробить запит. Користувач бачить спінер і нервує.

**У Laravel це вирішується чергами:** замість того, щоб виконувати важку роботу прямо під час HTTP-запиту, ви "кидаєте" задачу в чергу і відразу повертаєте відповідь клієнту. Окремий процес (worker) підбере задачу і виконає її у фоні.

```
// БЕЗ черги (sync) — користувач чекає:
Request → Controller → [Відправка 1000 email...30 сек] → Response

// З чергою — відповідь миттєва:
Request → Controller → dispatch(SendEmails) → Response (200ms)
                              ↓
                    Queue Worker: [Відправка 1000 email у фоні]
```

**Коли використовувати черги:**
- Відправка email/SMS
- Генерація звітів (PDF, Excel)
- Обробка зображень (resize, watermark)
- Синхронізація з зовнішніми API
- Будь-яка операція, що займає >1-2 секунди

**Коли НЕ потрібні черги:**
- Прості CRUD операції
- Валідація даних
- Читання з бази
- Все, що виконується менше 1 секунди

### Queue Drivers

```
# .env
QUEUE_CONNECTION=sync      # Виконує одразу (як await) — для розробки
QUEUE_CONNECTION=database   # Зберігає в таблицю jobs — просто і надійно
QUEUE_CONNECTION=redis      # Швидкий in-memory — для продакшну
```

У Vue це як різниця між:
- `sync` → `await sendEmail()` — блокує, поки не завершиться
- `database` → кладе в чергу, worker підбере пізніше
- `redis` → те саме, але швидше (як різниця між localStorage та in-memory store)

### Job — одиниця роботи

Job — це клас, що інкапсулює задачу для виконання:

```php
// У Vue ви б написали async функцію:
// async function sendOverdueReminders(userId: number) {
//   const tasks = await fetchOverdueTasks(userId);
//   for (const task of tasks) {
//     await sendNotification(task);
//   }
// }

// В Laravel це Job:
namespace App\Jobs;

use App\Models\User;
use App\Notifications\TaskOverdueNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendOverdueReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User $user
    ) {}

    public function handle(): void
    {
        $overdueTasks = $this->user->tasks()
            ->overdue()
            ->where('status', '!=', 'done')
            ->get();

        foreach ($overdueTasks as $task) {
            $this->user->notify(new TaskOverdueNotification($task));
        }
    }

    // Якщо job провалиться — логуємо помилку
    public function failed(\Throwable $exception): void
    {
        \Log::error("Failed to send overdue reminders for user {$this->user->id}", [
            'error' => $exception->getMessage(),
        ]);
    }
}
```

**Ключові інтерфейси та трейти:**
- `ShouldQueue` — маркер: "цей job йде в чергу" (без нього виконається sync)
- `Dispatchable` — дозволяє `MyJob::dispatch()`
- `Queueable` — дозволяє `->onQueue('emails')`, `->delay()`
- `SerializesModels` — зберігає лише ID моделі, а не весь об'єкт
- `InteractsWithQueue` — дозволяє `$this->release()`, `$this->delete()`

### Dispatching Jobs

```php
// Dispatch в чергу (якщо QUEUE_CONNECTION=database)
SendOverdueReminders::dispatch($user);

// Dispatch з затримкою
SendOverdueReminders::dispatch($user)->delay(now()->addMinutes(10));

// Dispatch на конкретну чергу
SendOverdueReminders::dispatch($user)->onQueue('notifications');

// Dispatch sync (ігнорує ShouldQueue, виконує одразу)
SendOverdueReminders::dispatchSync($user);

// Dispatch після завершення HTTP-відповіді
SendOverdueReminders::dispatchAfterResponse($user);
```

### Failed Jobs та Retry

```php
class SendOverdueReminders implements ShouldQueue
{
    // Максимум спроб
    public $tries = 3;

    // Таймаут виконання (секунди)
    public $timeout = 60;

    // Затримка між спробами (секунди)
    public $backoff = [10, 30, 60]; // 10с, 30с, 60с

    // Або: максимальний час спроб
    public $retryUntil; // Carbon instance
    
    public function retryUntil(): \DateTime
    {
        return now()->addHours(1);
    }
}
```

### Task Scheduling

**У JS у вас є `setInterval()`** — в Laravel є планувальник задач.

Замість того, щоб вручну створювати cron-записи для кожної задачі, Laravel дозволяє описати розклад у PHP-коді:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SendOverdueReminders;
use App\Jobs\CleanupCompletedTasks;
use App\Models\User;

// Щодня о 9:00 — нагадування про прострочені задачі
Schedule::call(function () {
    User::all()->each(function ($user) {
        SendOverdueReminders::dispatch($user);
    });
})->dailyAt('09:00')
  ->name('send-overdue-reminders')
  ->withoutOverlapping();

// Щотижня — очистка старих виконаних задач
Schedule::job(new CleanupCompletedTasks)->weekly();

// Кожні 5 хвилин — перевірка health
Schedule::command('app:health-check')->everyFiveMinutes();
```

**Частоти виконання:**

```php
->everyMinute()           // Щохвилини
->everyFiveMinutes()      // Кожні 5 хвилин
->hourly()                // Щогодини
->hourlyAt(15)            // Щогодини о :15
->daily()                 // Щодня о 00:00
->dailyAt('09:00')        // Щодня о 9:00
->weekly()                // Щотижня (неділя 00:00)
->weeklyOn(1, '8:00')     // Щопонеділка о 8:00
->monthly()               // Щомісяця
->weekdays()              // Тільки робочі дні
->sundays()               // Тільки неділі
->between('8:00', '17:00') // Тільки робочий час
```

**Додаткові опції:**

```php
->withoutOverlapping()    // Не запускати, якщо попередній ще працює
->runInBackground()       // Не блокувати планувальник
->onOneServer()           // На кластері — тільки на одному сервері
->when(fn () => true)     // Умовне виконання
->skip(fn () => false)    // Умовний пропуск
```

**Щоб планувальник працював**, потрібен один cron-запис:

```bash
# Додати в crontab (crontab -e):
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

### Custom Artisan Commands

Artisan-команди — це як npm scripts, але потужніші:

```php
// app/Console/Commands/SendOverdueRemindersCommand.php
namespace App\Console\Commands;

use App\Jobs\SendOverdueReminders;
use App\Models\User;
use Illuminate\Console\Command;

class SendOverdueRemindersCommand extends Command
{
    // Сигнатура: як команда викликається + аргументи/опції
    protected $signature = 'app:send-overdue-reminders 
                            {--user= : Send for specific user ID}
                            {--dry-run : Show what would be sent without sending}';

    protected $description = 'Send overdue task reminders to users';

    public function handle(): int
    {
        $userId = $this->option('user');
        $dryRun = $this->option('dry-run');

        $users = $userId 
            ? User::where('id', $userId)->get()
            : User::has('tasks')->get();

        if ($dryRun) {
            $this->info("DRY RUN: Would send reminders to {$users->count()} users");
            
            foreach ($users as $user) {
                $overdueCount = $user->tasks()->overdue()->count();
                $this->line("  - {$user->name}: {$overdueCount} overdue tasks");
            }
            
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        foreach ($users as $user) {
            SendOverdueReminders::dispatch($user);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Dispatched reminders for {$users->count()} users");

        return Command::SUCCESS;
    }
}
```

**Виклик:**

```bash
php artisan app:send-overdue-reminders              # Для всіх
php artisan app:send-overdue-reminders --user=1      # Для конкретного
php artisan app:send-overdue-reminders --dry-run     # Тестовий запуск
```

## Практика: крок за кроком

### Крок 1: Налаштуйте database queue driver

```bash
# Встановіть driver в .env
# Відкрийте .env і змініть:
QUEUE_CONNECTION=database
```

Створіть таблицю для черги та failed jobs:

```bash
php artisan queue:table
php artisan queue:failed-table
php artisan migrate
```

Перевірте:

```bash
php artisan db:table jobs
php artisan db:table failed_jobs
```

### Крок 2: Створіть SendOverdueReminders Job

```bash
php artisan make:job SendOverdueReminders
```

Відредагуйте `app/Jobs/SendOverdueReminders.php`:

```php
<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\TaskOverdueNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendOverdueReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [10, 30, 60];

    public function __construct(
        public User $user
    ) {}

    public function handle(): void
    {
        $overdueTasks = $this->user->tasks()
            ->where('status', '!=', 'done')
            ->where('deadline', '<', now())
            ->get();

        Log::info("Processing overdue reminders for {$this->user->name}", [
            'overdue_count' => $overdueTasks->count(),
        ]);

        foreach ($overdueTasks as $task) {
            $this->user->notify(new TaskOverdueNotification($task));
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Failed overdue reminders for user {$this->user->id}: {$exception->getMessage()}");
    }
}
```

### Крок 3: Створіть TaskOverdueNotification

```bash
php artisan make:notification TaskOverdueNotification
```

Відредагуйте `app/Notifications/TaskOverdueNotification.php`:

```php
<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskOverdueNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Task $task
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'deadline' => $this->task->deadline->toDateString(),
            'days_overdue' => now()->diffInDays($this->task->deadline),
            'message' => "Задача \"{$this->task->title}\" прострочена!",
        ];
    }
}
```

### Крок 4: Створіть CleanupCompletedTasks Job

```bash
php artisan make:job CleanupCompletedTasks
```

```php
<?php

namespace App\Jobs;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CleanupCompletedTasks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $count = Task::where('status', 'done')
            ->where('updated_at', '<', now()->subDays(30))
            ->count();

        Task::where('status', 'done')
            ->where('updated_at', '<', now()->subDays(30))
            ->delete(); // soft delete якщо увімкнено

        Log::info("Cleaned up {$count} completed tasks older than 30 days");
    }
}
```

### Крок 5: Створіть Artisan-команду

```bash
php artisan make:command SendOverdueRemindersCommand
```

Відредагуйте `app/Console/Commands/SendOverdueRemindersCommand.php`:

```php
<?php

namespace App\Console\Commands;

use App\Jobs\SendOverdueReminders;
use App\Models\User;
use Illuminate\Console\Command;

class SendOverdueRemindersCommand extends Command
{
    protected $signature = 'app:send-overdue-reminders 
                            {--user= : Send for specific user ID}
                            {--dry-run : Preview without sending}';

    protected $description = 'Send overdue task reminders to all users';

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
                $overdueCount = $user->tasks()
                    ->where('status', '!=', 'done')
                    ->where('deadline', '<', now())
                    ->count();
                $this->line("  {$user->name}: {$overdueCount} overdue tasks");
            }
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        foreach ($users as $user) {
            SendOverdueReminders::dispatch($user);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Dispatched overdue reminders for {$users->count()} users.");

        return Command::SUCCESS;
    }
}
```

### Крок 6: Налаштуйте розклад

Відредагуйте `routes/console.php`:

```php
<?php

use Illuminate\Support\Facades\Schedule;

// Щодня о 9:00 — нагадування про прострочені задачі
Schedule::command('app:send-overdue-reminders')
    ->dailyAt('09:00')
    ->withoutOverlapping()
    ->name('overdue-reminders');

// Щонеділі — очистка старих виконаних задач
Schedule::job(new \App\Jobs\CleanupCompletedTasks)
    ->weekly()
    ->name('cleanup-completed');
```

### Крок 7: Додайте endpoint для ручного запуску

Додайте в `routes/api.php`:

```php
Route::post('/reports/generate', function (Request $request) {
    \App\Jobs\GenerateTaskReport::dispatch($request->user());
    
    return response()->json([
        'message' => 'Report generation queued. You will be notified when ready.',
    ], 202); // 202 Accepted — запит прийнято, обробка у фоні
});
```

### Крок 8: Тестуйте

**Dispatch job і подивіться чергу:**

```bash
# Перевірте, що QUEUE_CONNECTION=database в .env
# Відкрийте tinker
php artisan tinker
```

```php
// Створіть тестового юзера з простроченою задачею
$user = \App\Models\User::first();
\App\Jobs\SendOverdueReminders::dispatch($user);
// "Job dispatched" — job потрапив у таблицю jobs
```

**Подивіться на чергу:**

```bash
# В іншому терміналі
php artisan tinker
>>> \DB::table('jobs')->count()
// => 1

>>> \DB::table('jobs')->first()
// Побачите: id, queue, payload, attempts, available_at
```

**Запустіть worker:**

```bash
# Worker підбере job і виконає
php artisan queue:work --once
# [2026-04-09 12:00:00] Processing: App\Jobs\SendOverdueReminders
# [2026-04-09 12:00:01] Processed:  App\Jobs\SendOverdueReminders
```

`--once` — обробити один job і зупинитися. Без цього worker працює безперервно.

**Перевірте розклад:**

```bash
php artisan schedule:list
# +-------------------------+-------------+-------------------+
# | Command                 | Interval    | Next Due          |
# +-------------------------+-------------+-------------------+
# | app:send-overdue-rem... | Daily 09:00 | 2026-04-10 09:00  |
# | CleanupCompletedTasks   | Weekly      | 2026-04-13 00:00  |
# +-------------------------+-------------+-------------------+
```

**Запустіть artisan-команду вручну:**

```bash
php artisan app:send-overdue-reminders --dry-run
# DRY RUN: Would process 3 users:
#   John Doe: 4 overdue tasks
#   Jane Smith: 1 overdue tasks
#   Bob Wilson: 0 overdue tasks

php artisan app:send-overdue-reminders
# ███████████████████████████ 3/3
# Dispatched overdue reminders for 3 users.
```

## Перевірка

Після завершення ви повинні бачити:

1. `php artisan queue:work --once` — worker підбирає та обробляє job
2. В `jobs` таблиці з'являються записи при dispatch, зникають після обробки
3. `php artisan schedule:list` — показує 2 заплановані задачі
4. `php artisan app:send-overdue-reminders --dry-run` — показує превʼю
5. Notification з'являється в `GET /api/notifications` після обробки job

## Міні-тест

### 1. Яка різниця між `QUEUE_CONNECTION=sync` та `database`?

a) `sync` зберігає в базу, `database` виконує одразу
b) `sync` виконує одразу (блокуючи response), `database` кладе в чергу для worker
c) `sync` працює тільки з Redis, `database` з будь-яким DB
d) Різниці немає, обидва виконують job одразу

### 2. Що робить `implements ShouldQueue` в Job класі?

a) Нічого, це маркер для IDE
b) Говорить Laravel, що job треба поставити в чергу (а не виконати sync)
c) Дозволяє використовувати `dispatch()` метод
d) Автоматично retry при помилці

### 3. Що виконує `php artisan queue:work`?

a) Створює нові jobs в черзі
b) Видаляє всі jobs з черги
c) Запускає worker-процес, що підбирає та виконує jobs з черги
d) Показує список jobs у черзі

### 4. Де описується розклад задач в Laravel 12?

a) `config/schedule.php`
b) `app/Console/Kernel.php`
c) `routes/console.php`
d) `bootstrap/app.php`

### 5. Який HTTP-статус найкращий для відповіді "ваш запит прийнято, обробка у фоні"?

a) 200 OK
b) 201 Created
c) 202 Accepted
d) 204 No Content

## Практичне завдання

### Завдання: GenerateTaskReport Job

Створіть Job `GenerateTaskReport`, який генерує JSON-звіт зі статистикою задач користувача:

1. Створіть Job:

```bash
php artisan make:job GenerateTaskReport
```

2. Job повинен:
   - Отримувати User в конструкторі
   - В `handle()` зібрати статистику:
     - Загальна кількість задач
     - Кількість по статусам (pending, in_progress, done)
     - Кількість прострочених
     - Кількість задач по категоріям
     - Середній час виконання (для done задач)
   - Зберегти результат як JSON-файл в `storage/app/reports/{user_id}_report.json`
   - Створити notification для user: "Your report is ready"

3. Створіть endpoint: `POST /api/reports/generate` → dispatch job → return 202

4. Створіть endpoint: `GET /api/reports/latest` → повернути вміст останнього звіту

5. Протестуйте:

```bash
# Dispatch job
curl -X POST http://localhost:8000/api/reports/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
# => {"message":"Report generation queued","status":202}

# Запустіть worker
php artisan queue:work --once

# Перевірте звіт
curl http://localhost:8000/api/reports/latest \
  -H "Authorization: Bearer YOUR_TOKEN"
# => {"total_tasks":20,"by_status":{"pending":10,...},...}
```

<details>
<summary>Підказка</summary>

```php
// app/Jobs/GenerateTaskReport.php
class GenerateTaskReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function handle(): void
    {
        $stats = [
            'generated_at' => now()->toISOString(),
            'user' => $this->user->name,
            'total_tasks' => $this->user->tasks()->count(),
            'by_status' => [
                'pending' => $this->user->tasks()->where('status', 'pending')->count(),
                'in_progress' => $this->user->tasks()->where('status', 'in_progress')->count(),
                'done' => $this->user->tasks()->where('status', 'done')->count(),
            ],
            'overdue' => $this->user->tasks()
                ->where('deadline', '<', now())
                ->where('status', '!=', 'done')
                ->count(),
            'by_category' => $this->user->tasks()
                ->join('categories', 'tasks.category_id', '=', 'categories.id')
                ->selectRaw('categories.name, count(*) as count')
                ->groupBy('categories.name')
                ->pluck('count', 'name'),
        ];

        Storage::put(
            "reports/{$this->user->id}_report.json",
            json_encode($stats, JSON_PRETTY_PRINT)
        );

        $this->user->notify(new ReportReadyNotification());
    }
}
```

</details>

## Відповіді на тест

1. **b) `sync` виконує одразу (блокуючи response), `database` кладе в чергу для worker** — `sync` драйвер обробляє job прямо в HTTP-запиті. `database` зберігає job в таблицю `jobs`, і окремий процес `queue:work` підбирає та виконує його. Це як різниця між `await doWork()` (блокує) і `worker.postMessage(data)` (не блокує).

2. **b) Говорить Laravel, що job треба поставити в чергу** — `ShouldQueue` — це маркерний інтерфейс. Коли Laravel бачить цей інтерфейс при `dispatch()`, він кладе job у чергу. Без нього job виконується синхронно навіть при `dispatch()`.

3. **c) Запускає worker-процес, що підбирає та виконує jobs з черги** — worker постійно слухає чергу і, коли з'являється новий job, підбирає та виконає його. Як Web Worker, що слухає `onmessage`.

4. **c) `routes/console.php`** — в Laravel 12 розклад описується в `routes/console.php` з використанням фасаду `Schedule`. В попередніх версіях це було в `app/Console/Kernel.php`.

5. **c) 202 Accepted** — HTTP 202 означає "запит прийнято, але ще не виконано". Ідеальний для асинхронних операцій. 200 означає "все готово", 201 — "ресурс створено", 204 — "успіх без контенту". 202 явно говорить клієнту: "ми почали, результат буде пізніше".
