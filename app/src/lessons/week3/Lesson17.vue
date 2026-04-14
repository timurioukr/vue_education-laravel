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
    question: 'Що саме робить трейт Dispatchable у класі події?',
    options: [
      'Автоматично реєструє подію в EventServiceProvider',
      'Додає статичний метод dispatch() — TaskCompleted::dispatch($task) замість event(new TaskCompleted($task))',
      'Автоматично кладе подію в чергу (queue)',
      'Серіалізує модель для передачі між процесами',
    ],
    correct: 1,
    explanation:
      'Dispatchable додає статичний метод dispatch() — це лише синтаксичний цукор поверх event(). За серіалізацію моделей відповідає окремий трейт SerializesModels (потрібен, коли Listener піде в чергу — інакше Eloquent-обʼєкт не пройде через JSON). За постановку в чергу — інтерфейс ShouldQueue на Listener.',
  },
  {
    question:
      'У якому методі Observer найкраще диспатчити TaskCompleted при зміні статусу на «completed»?',
    options: [
      'creating — перед створенням задачі',
      'created — після створення задачі',
      'updated — після save(), плюс перевірка $task->wasChanged("status")',
      'saving — перед будь-яким збереженням (і create, і update)',
    ],
    correct: 2,
    explanation:
      "updated() гарантує: (а) save() уже відбувся (статус справді записаний); (б) wasChanged('status') відрізняє оновлення статусу від оновлення інших полів. Якщо диспатчити в saving — спрацює і при першому create, і двічі при кожному save. У created — некоректно, бо ми ловимо не створення, а перехід.",
  },
  {
    question:
      'Який метод класу Notification визначає канали доставки (database / mail / broadcast / slack)?',
    options: ['channels()', 'via()', 'deliver()', 'send()'],
    correct: 1,
    explanation:
      "via(object \\$notifiable): array повертає масив каналів — наприклад ['database', 'mail']. Для кожного каналу Laravel шукає окремий метод: toDatabase(), toMail(), toBroadcast(), toSlack(). Зручно: один Notification клас → одночасна доставка кількома каналами без дублювання логіки.",
  },
  {
    question: 'Як отримати ТІЛЬКИ непрочитані сповіщення користувача через Notifiable trait?',
    options: [
      '$user->notifications()->unread()',
      '$user->unreadNotifications',
      "$user->notifications->where('read', false)",
      'Notification::unread($user)',
    ],
    correct: 1,
    explanation:
      "unreadNotifications — magic-відношення, додане трейтом Notifiable (на моделі User). Під капотом: $user->morphMany(...)->whereNull('read_at')->orderBy('created_at', 'desc'). Аналогічно є $user->readNotifications. Для лічильника UI-badge: $user->unreadNotifications()->count() (з ()) — це швидше, бо не вантажить колекцію в памʼять.",
  },
  {
    question: 'Яка Artisan-команда створює міграцію для таблиці database notifications?',
    options: [
      'php artisan make:migration notifications',
      'php artisan notifications:table',
      'php artisan make:notification --table',
      'php artisan create:notifications',
    ],
    correct: 1,
    explanation:
      "php artisan notifications:table генерує спеціальну міграцію з правильною структурою: id (UUID!), type, notifiable_type+notifiable_id (поліморфний звʼязок), data (JSON), read_at (nullable). Без неї $user->notify() впаде з помилкою «Table notifications doesn't exist». Після команди — обовʼязково php artisan migrate.",
  },
]

// === CodeComparison: Vue emit/on vs Laravel Event/Listener ===
const jsEmitOn = `// Vue — emit + батьківський слухач
// Дочірній компонент: НЕ знає, хто його слухає
defineEmits<{
  'task:completed': [task: Task]
}>()

function onComplete(task: Task) {
  emit('task:completed', task) // ← повідомили
}

// Один або кілька батьківських компонентів реагують:
// <TaskCard
//   @task:completed="showConfetti"
//   @task:completed="updateStats"
//   @task:completed="sendAnalytics"
// />

// Або глобальний event-bus (mitt):
import mitt from 'mitt'
const bus = mitt()
bus.emit('task:completed', task)
bus.on('task:completed', (t) => sendAnalytics(t))

// Pinia $subscribe — реакція на зміни store
taskStore.$subscribe((mutation, state) => {
  if (state.currentTask?.status === 'completed') {
    showConfetti()
  }
})`

const phpEventListener = `<?php
// Laravel — той самий принцип, але «на сервері»

// 1) Event — простий клас з даними
namespace App\\Events;

use App\\Models\\Task;
use Illuminate\\Foundation\\Events\\Dispatchable;
use Illuminate\\Queue\\SerializesModels;

class TaskCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public Task $task) {}
}

// 2) Listener — реагує на подію
namespace App\\Listeners;

class SendTaskCompletedNotification
{
    public function handle(TaskCompleted $event): void
    {
        // ← auto-discovery: Laravel сам прочитає
        //   тайп-хінт TaskCompleted у handle()
        //   та звʼяже Listener із Event.
        $event->task->user->notify(
            new TaskCompletedNotification($event->task)
        );
    }
}

// 3) Контролер просто диспатчить — НЕ знає,
//    скільки і яких listener-ів є.
public function update(UpdateTaskRequest $r, Task $task)
{
    $oldStatus = $task->status;
    $task->update($r->validated());

    if ($oldStatus !== 'completed'
        && $task->status === 'completed'
    ) {
        TaskCompleted::dispatch($task); // 🔔
    }
    return new TaskResource($task);
}`

// === CodeBlock: Event class ===
const eventCode = `<?php

// php artisan make:event TaskCompleted

namespace App\\Events;

use App\\Models\\Task;
use Illuminate\\Foundation\\Events\\Dispatchable;
use Illuminate\\Queue\\SerializesModels;

class TaskCompleted
{
    /**
     * Dispatchable      — додає статичний dispatch()
     * SerializesModels  — серіалізує Eloquent для черг
     */
    use Dispatchable, SerializesModels;

    /**
     * Constructor property promotion (PHP 8+):
     *   public Task $task — і поле, і параметр одночасно.
     *
     * \$event->task буде доступний у кожному Listener.
     */
    public function __construct(
        public Task $task
    ) {}
}

// === Як диспатчити ===
TaskCompleted::dispatch($task);   // ✅ короткий — рекомендовано
event(new TaskCompleted($task));  // те саме, через хелпер`

// === CodeBlock: Listener + auto-discovery ===
const listenerCode = `<?php

// php artisan make:listener SendTaskCompletedNotification \\
//                          --event=TaskCompleted

namespace App\\Listeners;

use App\\Events\\TaskCompleted;
use App\\Notifications\\TaskCompletedNotification;

class SendTaskCompletedNotification
{
    /**
     * Тайп-хінт TaskCompleted — те, на чому базується
     * auto-discovery: Laravel читає сигнатуру handle()
     * і автоматично звʼязує Listener із Event.
     * Жодних реєстрацій у ServiceProvider не треба.
     */
    public function handle(TaskCompleted $event): void
    {
        $task = $event->task;

        // Надсилаємо сповіщення власнику задачі
        $task->user->notify(
            new TaskCompletedNotification($task)
        );
    }
}

// === Альтернатива: явна реєстрація в AppServiceProvider ===
// use Illuminate\\Support\\Facades\\Event;
//
// public function boot(): void
// {
//     Event::listen(
//         TaskCompleted::class,
//         SendTaskCompletedNotification::class
//     );
//
//     // або з замиканням — для маленьких хендлерів:
//     Event::listen(TaskCompleted::class, function ($event) {
//         logger()->info('Task done: ' . $event->task->title);
//     });
// }`

// === CodeBlock: Observer + #[ObservedBy] ===
const observerCode = `<?php

// php artisan make:observer TaskObserver --model=Task

namespace App\\Observers;

use App\\Events\\TaskCompleted;
use App\\Models\\Task;
use Illuminate\\Support\\Facades\\Storage;

class TaskObserver
{
    /**
     * BEFORE create — встановити дефолти.
     * Поля присвоєні \$task->status = ... збережуться
     * автоматично перед INSERT.
     */
    public function creating(Task $task): void
    {
        if (empty($task->status))   { $task->status   = 'pending'; }
        if (is_null($task->priority)) { $task->priority = 0; }
    }

    /**
     * AFTER update — реагуємо на конкретну зміну.
     */
    public function updated(Task $task): void
    {
        // wasChanged() — true тільки якщо поле справді
        //                змінилось у поточному save()
        if ($task->wasChanged('status') && $task->status === 'completed') {
            TaskCompleted::dispatch($task);
        }
    }

    /**
     * BEFORE delete — почистити повʼязані файли.
     * Працює і для cascadeOnDelete, але тут логіка
     * саме «прибрати з диску».
     */
    public function deleting(Task $task): void
    {
        foreach ($task->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->path);
        }
    }
}

// === Реєстрація: PHP 8 атрибут (Laravel 11/12 — рекомендовано) ===
// app/Models/Task.php
use App\\Observers\\TaskObserver;
use Illuminate\\Database\\Eloquent\\Attributes\\ObservedBy;

#[ObservedBy(TaskObserver::class)]
class Task extends Model { /* ... */ }

// === Альтернатива — у AppServiceProvider::boot() ===
// Task::observe(TaskObserver::class);`

// === CodeBlock: Notification ===
const notificationCode = `<?php

// php artisan make:notification TaskCompletedNotification

namespace App\\Notifications;

use App\\Models\\Task;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Notifications\\Notification;

class TaskCompletedNotification extends Notification
{
    use Queueable; // дозволяє відправити асинхронно через чергу

    public function __construct(public Task $task) {}

    /**
     * Канали доставки — масив імен.
     * Для кожного імені Laravel шукає метод toX():
     *   'database'  → toDatabase()
     *   'mail'      → toMail()
     *   'broadcast' → toBroadcast()
     *   'slack'     → toSlack()
     */
    public function via(object $notifiable): array
    {
        return ['database']; // починаємо з database (in-app UI)
    }

    /**
     * Дані для збереження в таблицю notifications (JSON column).
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'task_id'      => $this->task->id,
            'task_title'   => $this->task->title,
            'message'      => "Task \\"{$this->task->title}\\" has been completed.",
            'type'         => 'task_completed',
            'completed_at' => now()->toISOString(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}`

// === CodeBlock: Notifications API ===
const notificationsApiCode = `<?php

// app/Http/Controllers/NotificationController.php

class NotificationController extends Controller
{
    /**
     * GET /api/notifications — список + пагінація + лічильник
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()
            ->latest()->paginate(20);

        return response()->json([
            'data' => $notifications->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => class_basename($n->type),
                'data'       => $n->data,                       // JSON-payload
                'read_at'    => $n->read_at?->toISOString(),
                'created_at' => $n->created_at->toISOString(),
            ]),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'total'        => $notifications->total(),
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    /** GET /api/notifications/unread-count — для badge у UI */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /** PATCH /api/notifications/{id}/read */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $n = $request->user()->notifications()->findOrFail($id);
        $n->markAsRead();
        return response()->json([
            'id'      => $n->id,
            'read_at' => $n->read_at->toISOString(),
        ]);
    }

    /** POST /api/notifications/read-all */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All notifications marked as read.']);
    }
}

// routes/api.php — всі під auth:sanctum:
Route::get   ('/notifications',                [NotificationController::class, 'index']);
Route::get   ('/notifications/unread-count',   [NotificationController::class, 'unreadCount']);
Route::patch ('/notifications/{id}/read',      [NotificationController::class, 'markAsRead']);
Route::post  ('/notifications/read-all',       [NotificationController::class, 'markAllAsRead']);`

// === Practice: in-memory simulation of Event/Listener/Observer/Notification ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо ЦІЛИЙ Laravel-конвеєр у памʼяті:
//   Controller → save() → Observer.updated → wasChanged?
//                           ↓
//                     TaskCompleted::dispatch
//                           ↓ (auto-discovery)
//                     Listener.handle → Notification → notifications[]

// =================== EventDispatcher ===================
class EventDispatcher
{
    /** @var array<class-string, callable[]> */
    private array $listeners = [];

    public function listen(string $eventClass, callable $listener): void {
        $this->listeners[$eventClass][] = $listener;
    }

    public function dispatch(object $event): void {
        echo "  📣 dispatch(" . basename(str_replace('\\\\', '/', $event::class)) . ")\\n";
        foreach ($this->listeners[$event::class] ?? [] as $listener) {
            $listener($event);
        }
    }
}

$events = new EventDispatcher();

// =================== Notification storage ===================
$notifications = []; // [user_id => [['id', 'type', 'data', 'read_at']]]

function notify(int $userId, string $type, array $data) {
    global $notifications;
    $notifications[$userId][] = [
        'id'      => bin2hex(random_bytes(8)),
        'type'    => $type,
        'data'    => $data,
        'read_at' => null,
    ];
    echo "  ✉️  notify(user={$userId}, type={$type})\\n";
}

function unreadCount(int $userId): int {
    global $notifications;
    return count(array_filter($notifications[$userId] ?? [], fn ($n) => $n['read_at'] === null));
}

function markAsRead(int $userId, string $id): bool {
    global $notifications;
    foreach ($notifications[$userId] ?? [] as &$n) {
        if ($n['id'] === $id) { $n['read_at'] = date('c'); return true; }
    }
    return false;
}

// =================== Event class ===================
class TaskCompleted
{
    public function __construct(public array $task) {}
}

// =================== Listener (auto-bound нижче) ===================
$sendTaskCompletedNotification = function (TaskCompleted $event): void {
    $task = $event->task;
    notify($task['user_id'], 'TaskCompletedNotification', [
        'task_id'      => $task['id'],
        'task_title'   => $task['title'],
        'message'      => "Task \\"{$task['title']}\\" has been completed.",
        'completed_at' => date('c'),
    ]);
};

$events->listen(TaskCompleted::class, $sendTaskCompletedNotification);

// =================== Eloquent-like Task з Observer-логікою ===================
function saveTask(array $task, array $changes, EventDispatcher $events): array {
    // BEFORE update (not used here; для demo)
    $original = $task;

    // SAVE — застосовуємо зміни
    $task = array_merge($task, $changes);

    // === TaskObserver::updated() ===
    $changedFields = [];
    foreach ($changes as $field => $newValue) {
        if (($original[$field] ?? null) !== $newValue) {
            $changedFields[] = $field;
        }
    }
    echo "  💾 save(task #{$task['id']}); changed fields: " . implode(', ', $changedFields) . "\\n";

    // wasChanged('status') && status === 'completed'?
    if (in_array('status', $changedFields, true) && $task['status'] === 'completed') {
        echo "  🔔 Observer: status changed to completed → dispatch TaskCompleted\\n";
        $events->dispatch(new TaskCompleted($task));
    }

    return $task;
}

// =================== СЦЕНАРІЙ ===================

$task = ['id' => 1, 'title' => 'Learn Laravel events', 'status' => 'pending', 'user_id' => 7];

echo "=== 1) PUT /api/tasks/1 — status=in_progress (НЕ completed) ===\\n";
$task = saveTask($task, ['status' => 'in_progress'], $events);
echo "  unread for user 7: " . unreadCount(7) . " (очікуємо 0)\\n\\n";

echo "=== 2) PUT /api/tasks/1 — status=completed ✅ ===\\n";
$task = saveTask($task, ['status' => 'completed'], $events);
echo "  unread for user 7: " . unreadCount(7) . " (очікуємо 1)\\n\\n";

echo "=== 3) PUT /api/tasks/1 — другий save БЕЗ зміни статусу (тільки title) ===\\n";
$task = saveTask($task, ['title' => 'Learn Laravel events (renamed)'], $events);
echo "  unread for user 7: " . unreadCount(7) . " (все ще 1 — wasChanged('status') = false)\\n\\n";

echo "=== 4) GET /api/notifications для user 7 ===\\n";
foreach ($notifications[7] as $n) {
    $read = $n['read_at'] ? '✓' : '○';
    echo "  {$read}  [{$n['type']}] {$n['data']['message']}\\n";
}

echo "\\n=== 5) PATCH /api/notifications/{id}/read ===\\n";
$firstId = $notifications[7][0]['id'];
markAsRead(7, $firstId);
echo "  unread after markAsRead: " . unreadCount(7) . " (очікуємо 0)\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте подію TaskAssigned + повний event-flow.
 *
 * Це симулятор Laravel у памʼяті — без реального фреймворку,
 * але з тією самою семантикою.
 *
 * Реалізуйте 4 функції:
 *
 *   1) class EventDispatcher (вже частково — добавте listen + dispatch)
 *
 *   2) sendTaskAssignedNotification(TaskAssigned \$event, array &\$notifications): void
 *      — додає сповіщення У МАСИВ \$notifications для assignedTo (НЕ для assignedBy!)
 *      - тип:  'TaskAssignedNotification'
 *      - data: ['task_id', 'task_title', 'assigned_by_name', 'message']
 *      - message формату: "{assigned_by_name} assigned you task: {task_title}"
 *
 *   3) observeTaskUpdate(array \$original, array \$updated, EventDispatcher \$events,
 *                         array \$users): void
 *      — еквівалент TaskObserver::updated().
 *      Якщо assigned_to змінилось і != null:
 *        - dispatch new TaskAssigned(\$updated, \$assignedTo, \$assignedBy)
 *      Якщо status змінився на 'completed':
 *        - dispatch new TaskCompleted(\$updated)
 *      ⚠️ Можуть спрацювати ОБИДВА у одному save — це нормально.
 *
 *   4) markAllAsRead(int \$userId, array &\$notifications): int
 *      — позначає всі непрочитані сповіщення user як прочитані,
 *        повертає скільки було позначено.
 */

class EventDispatcher
{
    private array $listeners = [];

    public function listen(string $eventClass, callable $listener): void {
        // Ваш код тут
    }

    public function dispatch(object $event): void {
        // Ваш код тут
    }
}

class TaskCompleted
{
    public function __construct(public array $task) {}
}

class TaskAssigned
{
    public function __construct(
        public array $task,
        public array $assignedTo,
        public array $assignedBy,
    ) {}
}

function sendTaskAssignedNotification(TaskAssigned $event, array &$notifications): void {
    // Ваш код тут
}

function observeTaskUpdate(array $original, array $updated, EventDispatcher $events, array $users): void {
    // Ваш код тут
    // Підказка: для assigned_to знайдіть users[id] для отримання name.
    // Для assigned_by — це auth-юзер; візьміть users[\$updated['user_id']].
}

function markAllAsRead(int $userId, array &$notifications): int {
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 8;

$users = [
    1 => ['id' => 1, 'name' => 'Alice'],
    2 => ['id' => 2, 'name' => 'Bob'],
];

$notifications = []; // [user_id => [...notification rows]]

// 1. EventDispatcher.listen + dispatch
$events = new EventDispatcher();
$called = false;
$events->listen(TaskCompleted::class, function () use (&$called) { $called = true; });
$events->dispatch(new TaskCompleted(['id' => 1]));
if ($called) {
    echo "✓ EventDispatcher: listen+dispatch працюють\\n"; $pass++;
} else {
    echo "✗ EventDispatcher: dispatch не викликав listener\\n";
}

// Реєструємо реальні слухачі
$events->listen(TaskAssigned::class, function ($event) use (&$notifications) {
    sendTaskAssignedNotification($event, $notifications);
});
$events->listen(TaskCompleted::class, function ($event) use (&$notifications) {
    $t = $event->task;
    $notifications[$t['user_id']][] = [
        'id' => bin2hex(random_bytes(8)),
        'type' => 'TaskCompletedNotification',
        'data' => ['task_id' => $t['id'], 'message' => "Task \\"{$t['title']}\\" completed"],
        'read_at' => null,
    ];
});

// 2. TaskAssigned: додає сповіщення для assignedTo (Bob), а НЕ для assignedBy (Alice)
$task = ['id' => 10, 'title' => 'Sprint planning', 'user_id' => 1, 'assigned_to' => null, 'status' => 'pending'];
$updated = array_merge($task, ['assigned_to' => 2]);
observeTaskUpdate($task, $updated, $events, $users);
if (count($notifications[2] ?? []) === 1 && empty($notifications[1] ?? [])) {
    echo "✓ TaskAssigned: сповіщення прийшло Bob (assignedTo), не Alice\\n"; $pass++;
} else {
    echo "✗ TaskAssigned: очікувалось 1 для user 2, 0 для user 1; маємо ";
    echo "user1=" . count($notifications[1] ?? []) . ", user2=" . count($notifications[2] ?? []) . "\\n";
}

// 3. Дані сповіщення — правильні
$n = $notifications[2][0] ?? null;
if (
    $n
    && $n['type'] === 'TaskAssignedNotification'
    && $n['data']['task_id'] === 10
    && $n['data']['task_title'] === 'Sprint planning'
    && $n['data']['assigned_by_name'] === 'Alice'
) {
    echo "✓ TaskAssignedNotification: data['task_id'/'task_title'/'assigned_by_name'] коректні\\n"; $pass++;
} else {
    echo "✗ TaskAssignedNotification: data некоректні\\n"; print_r($n);
}

// 4. message формату "{by} assigned you task: {title}"
if ($n && str_contains($n['data']['message'], 'Alice') && str_contains($n['data']['message'], 'Sprint planning')) {
    echo "✓ TaskAssignedNotification.message містить by-name та title\\n"; $pass++;
} else {
    echo "✗ message формат: " . ($n['data']['message'] ?? '(відсутній)') . "\\n";
}

// 5. observeTaskUpdate: status → completed → TaskCompleted летить
$t2  = ['id' => 11, 'title' => 'Refactor', 'user_id' => 1, 'assigned_to' => null, 'status' => 'in_progress'];
$t2u = array_merge($t2, ['status' => 'completed']);
observeTaskUpdate($t2, $t2u, $events, $users);
if (
    count(array_filter($notifications[1] ?? [], fn ($x) => $x['type'] === 'TaskCompletedNotification')) === 1
) {
    echo "✓ status→completed → TaskCompletedNotification для власника (user 1)\\n"; $pass++;
} else {
    echo "✗ TaskCompleted listener не спрацював для user 1\\n";
}

// 6. observeTaskUpdate: НЕ дублюються події, якщо assigned_to не змінилось
$before = count($notifications[2] ?? []);
$t3  = ['id' => 12, 'title' => 'Other', 'user_id' => 1, 'assigned_to' => 2, 'status' => 'pending'];
$t3u = array_merge($t3, ['title' => 'Other (renamed)']); // assigned_to НЕ міняли
observeTaskUpdate($t3, $t3u, $events, $users);
if (count($notifications[2] ?? []) === $before) {
    echo "✓ Без зміни assigned_to — TaskAssigned НЕ диспатчиться\\n"; $pass++;
} else {
    echo "✗ TaskAssigned спрацював, хоча assigned_to не змінилося\\n";
}

// 7. observeTaskUpdate: і assigned_to, і status змінилися одночасно — обидві події
$before2 = count($notifications);
$t4  = ['id' => 13, 'title' => 'Both at once', 'user_id' => 1, 'assigned_to' => null, 'status' => 'pending'];
$t4u = array_merge($t4, ['assigned_to' => 2, 'status' => 'completed']);
observeTaskUpdate($t4, $t4u, $events, $users);
$bobAssigned = false;
$aliceCompleted = false;
foreach (($notifications[2] ?? []) as $row) {
    if (($row['data']['task_id'] ?? null) === 13 && $row['type'] === 'TaskAssignedNotification') {
        $bobAssigned = true;
    }
}
foreach (($notifications[1] ?? []) as $row) {
    if (($row['data']['task_id'] ?? null) === 13 && $row['type'] === 'TaskCompletedNotification') {
        $aliceCompleted = true;
    }
}
if ($bobAssigned && $aliceCompleted) {
    echo "✓ І TaskAssigned (Bob), і TaskCompleted (Alice) спрацювали в одному save\\n"; $pass++;
} else {
    echo "✗ Очікувалось ОБИДВА: assigned=" . ($bobAssigned?'1':'0') . " completed=" . ($aliceCompleted?'1':'0') . "\\n";
}

// 8. markAllAsRead — позначає всі і повертає кількість
$bobUnread = count(array_filter($notifications[2] ?? [], fn ($n) => $n['read_at'] === null));
$marked = markAllAsRead(2, $notifications);
$bobUnreadAfter = count(array_filter($notifications[2] ?? [], fn ($n) => $n['read_at'] === null));
if ($marked === $bobUnread && $bobUnreadAfter === 0) {
    echo "✓ markAllAsRead: позначив {$marked}, лишилось 0 непрочитаних\\n"; $pass++;
} else {
    echo "✗ markAllAsRead: marked={$marked}, unreadAfter={$bobUnreadAfter}\\n";
}

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="emit('task:completed', task) + батьківські слухачі"
        to="TaskCompleted::dispatch($task) + Listener (auto-discovery)"
      />

      <TheoryBlock title="Навіщо події — декаплінг логіки">
        <p>
          У Vue ви щодня користуєтесь <code>emit</code>: дочірній компонент <em>не знає</em>, хто
          його слухає — він просто повідомляє «щось сталося». Батьки самі вирішують, що з цим робити
          (показати toast, оновити стат, відправити аналітику). Laravel events — той самий принцип,
          лише на сервері.
        </p>
        <p>
          Уявіть, що користувач завершив задачу — потрібно: надіслати сповіщення, оновити
          статистику, записати в лог, можливо нарахувати бонус. <strong>Без подій</strong> усе це
          живе в контролері — один величезний метод. <strong>З подіями</strong> контролер каже лише
          «<em>задачу завершено</em>», а окремі слухачі виконують кожну дію незалежно і можуть бути
          додані/прибрані без зміни контролера.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsEmitOn"
        :php="phpEventListener"
        js-title="Vue — emit + слухачі (включно з Pinia $subscribe)"
        php-title="Laravel — Event + Listener + dispatch у контролері"
      />

      <TheoryBlock title="Event — простий клас з даними про те, що сталося">
        <p>
          Event — це чистий <em>data carrier</em>. Ніякої логіки, лише payload через конструктор.
          Трейт <code>Dispatchable</code> додає статичний <code>::dispatch()</code> (синтаксичний
          цукор поверх <code>event(new …)</code>); <code>SerializesModels</code> — критично важливий
          для черг: без нього Eloquent-моделі не пройдуть через JSON-серіалізацію в Redis/database
          queue.
        </p>
      </TheoryBlock>

      <CodeBlock :code="eventCode" lang="php" title="Event class — TaskCompleted" />

      <TheoryBlock title="Listener — реакція на подію (auto-discovery)">
        <p>
          Listener — це клас з методом <code>handle(EventClass $event)</code>. Тайп-хінт у сигнатурі
          — це <strong>і є</strong> механізм auto-discovery: Laravel читає сигнатури всіх класів у
          <code>app/Listeners/</code> і автоматично звʼязує з відповідними подіями. Жодних
          реєстрацій у ServiceProvider не потрібно.
        </p>
        <p>
          Якщо потрібен повний контроль (наприклад, замикання замість класу або реєстрація з інших
          пакетів) — використовуйте
          <code>Event::listen(TaskCompleted::class, function ($event) {…})</code> у
          <code>AppServiceProvider::boot()</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="listenerCode" lang="php" title="Listener — auto-discovery + альтернатива" />

      <TheoryBlock title="Model events + Observer — реакція на CRUD">
        <p>
          Eloquent сам генерує події життєвого циклу моделі:
          <code>creating/created → saving/saved → updating/updated → deleting/deleted</code>.
          Observer — це клас, що групує ці хендлери в одному місці. Аналог — Pinia
          <code>$subscribe((mutation) => ...)</code>: ви підписуєтесь на зміни «store-моделі» і
          реагуєте.
        </p>
        <p>
          ⚠️ <strong>Класична пастка:</strong> у методі <code>updated()</code> завжди перевіряйте
          <code>$task->wasChanged('status')</code> перед диспатчем. Інакше ваш TaskCompleted
          полетить на <em>будь-яке</em> оновлення (навіть зміну заголовку), і користувач отримає
          купу сміттєвих сповіщень.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="observerCode"
        lang="php"
        title="TaskObserver + #[ObservedBy] (Laravel 11/12)"
      />

      <TheoryBlock title="Notifications — окрема підсистема для повідомлень">
        <p>
          Notification ≠ Event. Подія — це «<em>щось сталось</em>» (broadcast у застосунку).
          Сповіщення — «<em>повідомити конкретного користувача</em>» (з адресатом і каналами). Часта
          зв’язка: Listener реагує на Event і кличе
          <code>$user->notify(new XNotification(...))</code>.
        </p>
        <p>
          Метод <code>via()</code> повертає масив каналів — <code>['database']</code> для in-app UI,
          <code>['mail']</code> для пошти, <code>['broadcast']</code> для WebSocket realtime,
          <code>['slack']</code> тощо. Один Notification клас → одночасна доставка кількома каналами
          без дублювання логіки.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="notificationCode"
        lang="php"
        title="Notification class — TaskCompletedNotification"
      />

      <TheoryBlock title="Database notifications + API для фронтенду">
        <p>
          Перед роботою: <code>php artisan notifications:table && php artisan migrate</code> —
          створить таблицю з UUID-id, поліморфним зв'язком на користувача, JSON-полем
          <code>data</code> і <code>read_at</code>. Далі — magic-relations від
          <code>Notifiable</code>: <code>$user->notifications</code>,
          <code>$user->unreadNotifications</code>, <code>->markAsRead()</code>. Це повний
          бекенд-двійник того, що ви робите у Pinia зі <code>notifications.value</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="notificationsApiCode"
        lang="php"
        title="NotificationController — повний CRUD-флоу для UI"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: повний event-pipeline у памʼяті">
        <p>
          У playground ми <strong>самі реалізуємо</strong> весь конвеєр: компактний
          <code>EventDispatcher</code>, Listener як замикання, Observer-логіку у
          <code>saveTask()</code>, in-memory сховище <em>notifications[]</em>. Сценарій показує
          ключову перевірку — <code>wasChanged('status')</code>: оновлення статусу на
          <em>in_progress</em> подію не диспатчить, на <em>completed</em> — диспатчить, а оновлення
          лише <em>title</em> взагалі не торкається сповіщень.
        </p>
        <p>
          Спробуйте додати другий listener (наприклад, лог) — побачите, як декілька слухачів
          реагують на ОДНУ подію без жодних змін у контролері.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/17-events.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="3-17" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: подія TaskAssigned + observer для одночасних змін">
        <p>
          Реалізуйте 4 функції, які разом утворюють робочий event-flow для призначення задач.
          Натисніть <strong>«Запустити»</strong> — 8 авто-тестів перевірять усі граничні випадки:
          сповіщення йде призначеному (НЕ автору), без зміни <code>assigned_to</code> подія
          <em>не</em> летить, при одночасній зміні <code>assigned_to + status</code> летять
          <em>обидві</em>.
        </p>
        <ol>
          <li>
            <strong>EventDispatcher.listen / dispatch</strong> — реалізуйте обидва методи (масив
            замикань per event-class).
          </li>
          <li>
            <strong>sendTaskAssignedNotification</strong> — додає рядок у
            <code>$notifications[$assignedTo->id]</code>; формат повідомлення:
            <code>"{by} assigned you task: {title}"</code>.
          </li>
          <li>
            <strong>observeTaskUpdate</strong> — еквівалент <code>TaskObserver::updated()</code>:
            якщо <code>assigned_to</code> змінилося і ≠ null → dispatch <code>TaskAssigned</code>;
            якщо <code>status</code> змінився на <code>completed</code> → dispatch
            <code>TaskCompleted</code>. Обидві умови незалежні і можуть зрватися в одному save.
          </li>
          <li>
            <strong>markAllAsRead($userId, $notifications)</strong> — ставить
            <code>read_at = date('c')</code> усім непрочитаним user, повертає кількість.
          </li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте TaskAssigned event-flow"
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
