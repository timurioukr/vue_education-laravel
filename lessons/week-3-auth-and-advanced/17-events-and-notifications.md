# Урок 17: Події, слухачі та сповіщення

## Що ви вивчите

- Систему подій Laravel: навіщо вона потрібна та як працює
- Створення подій (`Event`) та слухачів (`Listener`)
- Диспатчинг подій: `TaskCompleted::dispatch($task)`
- Модельні події та Observer: автоматичні реакції на зміни в моделях
- Систему сповіщень (`Notifications`): канали, формат, збереження в базу
- API для роботи зі сповіщеннями: отримання, позначення як прочитані

---

## Паралелі з JS/Vue

| Vue / Nuxt / JS | Laravel |
|---|---|
| `emit('task:completed', task)` | `TaskCompleted::dispatch($task)` |
| `@task:completed="handleComplete"` або `on('task:completed', handler)` | `Listener` клас з методом `handle()` |
| Global event bus (mitt) | `EventServiceProvider` -- реєстрація подій і слухачів |
| `watch(task, callback)` | Model events: `creating`, `updating`, `deleted` |
| Pinia `$subscribe((mutation) => {...})` | `Observer` -- клас, що спостерігає за змінами моделі |
| Toast/Notification UI компонент | `Notification` клас з каналами (`mail`, `database`) |
| `notifications[]` у Pinia store | Database notifications -- `$user->notifications` |
| Різні типи нотифікацій (toast, badge, modal) | Notification channels: `mail`, `database`, `broadcast`, `slack` |
| `emit()` в дочірньому -> `on()` у батьківському | Event -> Listener (розв'язка компонентів) |

---

## Теорія

### Навіщо потрібні події

У Vue ви використовуєте `emit` для комунікації між компонентами: дочірній компонент не знає, хто його слухає, він просто повідомляє "щось сталося". Батьківський компонент вирішує, що з цим робити.

В Laravel працює той самий принцип, але на рівні серверної логіки. Уявіть: користувач завершив задачу. Що повинно статися?

- Надіслати сповіщення
- Записати в лог
- Оновити статистику
- Можливо, нарахувати бонус

**Без подій** все це живе в контролері -- один величезний метод. **З подіями** контролер лише каже: "Задачу завершено!" -- а окремі слухачі виконують кожну дію незалежно.

```javascript
// Vue -- ви це робите щодня
// Компонент не знає, хто його слухає
emit('task:completed', task)

// Батьківський компонент вирішує що робити
// @task:completed="showConfetti"
// @task:completed="updateStats"
// @task:completed="sendAnalytics"
```

```php
// Laravel -- той самий принцип
// Контролер не знає, хто слухає
TaskCompleted::dispatch($task);

// Слухачі виконуються незалежно:
// SendTaskCompletedNotification::handle()
// UpdateTaskStatistics::handle()
// LogTaskCompletion::handle()
```

### Створення Event

Подія -- це простий клас, який містить дані про те, що сталося:

```bash
php artisan make:event TaskCompleted
```

```php
<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Task $task
    ) {}
}
```

Це як payload у Vue `emit`:

```javascript
// Vue -- передача даних з подією
emit('task:completed', { task, completedAt: new Date() })
```

```php
// Laravel -- передача даних через конструктор
TaskCompleted::dispatch($task);
// $event->task доступний у кожному слухачі
```

### Створення Listener

Слухач -- це клас, який реагує на подію:

```bash
php artisan make:listener SendTaskCompletedNotification --event=TaskCompleted
```

```php
<?php

namespace App\Listeners;

use App\Events\TaskCompleted;
use App\Notifications\TaskCompletedNotification;

class SendTaskCompletedNotification
{
    public function handle(TaskCompleted $event): void
    {
        // $event->task -- задача, яка була завершена
        $task = $event->task;
        $user = $task->user;

        // Надсилаємо сповіщення власнику задачі
        $user->notify(new TaskCompletedNotification($task));
    }
}
```

Це як обробник події у Vue:

```javascript
// Vue
function handleTaskCompleted(task) {
    showToast(`Task "${task.title}" completed!`)
    updateStats()
}
```

### Реєстрація подій і слухачів

У Laravel є два способи зв'язати події зі слухачами.

**Спосіб 1: Автоматичне виявлення (auto-discovery)**

Laravel 12 за замовчуванням автоматично знаходить слухачів. Якщо метод `handle()` має тайп-хінт на подію -- Laravel зв'яже їх автоматично. Нічого додатково реєструвати не потрібно.

**Спосіб 2: Явна реєстрація в AppServiceProvider**

Якщо потрібен повний контроль:

```php
// app/Providers/AppServiceProvider.php
use App\Events\TaskCompleted;
use App\Listeners\SendTaskCompletedNotification;
use App\Listeners\LogTaskCompletion;
use Illuminate\Support\Facades\Event;

public function boot(): void
{
    Event::listen(TaskCompleted::class, SendTaskCompletedNotification::class);
    Event::listen(TaskCompleted::class, LogTaskCompletion::class);

    // Або з замиканням (для простих випадків)
    Event::listen(TaskCompleted::class, function (TaskCompleted $event) {
        logger()->info('Task completed: ' . $event->task->title);
    });
}
```

### Диспатчинг подій

Є два способи відправити подію:

```php
// Спосіб 1: статичний метод (рекомендований)
TaskCompleted::dispatch($task);

// Спосіб 2: глобальна функція event()
event(new TaskCompleted($task));
```

Використовується в контролері або сервісі:

```php
public function update(Request $request, Task $task)
{
    $oldStatus = $task->status;

    $task->update($request->validated());

    // Якщо статус змінився на "completed"
    if ($oldStatus !== 'completed' && $task->status === 'completed') {
        TaskCompleted::dispatch($task);
    }

    return new TaskResource($task);
}
```

### Модельні події та Observer

Eloquent моделі автоматично генерують події при CRUD-операціях. Це як `watch()` у Vue, але для моделей бази даних.

Доступні модельні події:

| Подія | Коли спрацьовує | Vue аналог |
|---|---|---|
| `creating` | Перед створенням запису | `onBeforeMount` |
| `created` | Після створення запису | `onMounted` |
| `updating` | Перед оновленням | `watch` з `{ flush: 'pre' }` |
| `updated` | Після оновлення | `watch` callback |
| `deleting` | Перед видаленням | `onBeforeUnmount` |
| `deleted` | Після видалення | `onUnmounted` |
| `saving` | Перед створенням АБО оновленням | Об'єднаний `watch` |
| `saved` | Після створення АБО оновлення | Об'єднаний `watch` |

**Observer** -- це клас, що групує обробники модельних подій:

```bash
php artisan make:observer TaskObserver --model=Task
```

```php
<?php

namespace App\Observers;

use App\Events\TaskCompleted;
use App\Models\Task;

class TaskObserver
{
    /**
     * Перед створенням задачі -- встановити значення за замовчуванням
     */
    public function creating(Task $task): void
    {
        if (empty($task->status)) {
            $task->status = 'pending';
        }

        if (is_null($task->priority)) {
            $task->priority = 0;
        }
    }

    /**
     * Після оновлення задачі -- перевірити, чи змінився статус
     */
    public function updated(Task $task): void
    {
        // wasChanged() перевіряє, чи змінилося поле при останньому save()
        if ($task->wasChanged('status') && $task->status === 'completed') {
            TaskCompleted::dispatch($task);
        }
    }

    /**
     * Перед видаленням -- видалити файли вкладень з диску
     */
    public function deleting(Task $task): void
    {
        foreach ($task->attachments as $attachment) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($attachment->path);
        }
    }
}
```

**Реєстрація Observer:**

Є два способи зареєструвати Observer.

**Спосіб 1: Атрибут `ObservedBy` в моделі (Laravel 12 рекомендований)**

```php
// app/Models/Task.php
use App\Observers\TaskObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy(TaskObserver::class)]
class Task extends Model
{
    // ...
}
```

**Спосіб 2: Реєстрація в AppServiceProvider**

```php
// app/Providers/AppServiceProvider.php
use App\Models\Task;
use App\Observers\TaskObserver;

public function boot(): void
{
    Task::observe(TaskObserver::class);
}
```

Це як Pinia `$subscribe` -- ви "підписуєтесь" на зміни в сховищі (моделі) і автоматично реагуєте:

```javascript
// Pinia -- підписка на зміни store
taskStore.$subscribe((mutation, state) => {
    if (mutation.type === 'patch' && state.currentTask.status === 'completed') {
        showConfetti()
        sendAnalytics('task_completed')
    }
})
```

### Сповіщення (Notifications)

Сповіщення -- це окрема підсистема Laravel для повідомлення користувачів. На відміну від подій, сповіщення мають **адресата** (хто отримує) і **канали** (як доставити).

```bash
php artisan make:notification TaskCompletedNotification
```

```php
<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Notifications\Notification;

class TaskCompletedNotification extends Notification
{
    public function __construct(
        public Task $task
    ) {}

    /**
     * Канали доставки
     * 'database' -- зберегти в базу (для API)
     * 'mail' -- надіслати email
     * 'broadcast' -- WebSocket (для realtime)
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Дані для збереження в базу даних
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'message' => "Task \"{$this->task->title}\" has been completed.",
            'type' => 'task_completed',
        ];
    }

    /**
     * Дані для масиву (fallback)
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
```

Канали сповіщень -- це як різні типи UI-нотифікацій на фронтенді:

```javascript
// Vue -- різні "канали" нотифікацій на фронтенді
showToast('Task completed!')           // -> 'database' (збережемо і покажемо в UI)
sendEmail('user@example.com', data)    // -> 'mail'
socket.emit('notification', data)      // -> 'broadcast'
sendSlackMessage('#general', data)     // -> 'slack'
```

### Database Notifications

Для збереження сповіщень у базу потрібна спеціальна таблиця:

```bash
php artisan notifications:table
php artisan migrate
```

Це створить таблицю `notifications` з колонками: `id`, `type`, `notifiable_type`, `notifiable_id`, `data` (JSON), `read_at`, `created_at`, `updated_at`.

Робота зі сповіщеннями через модель User:

```php
// Надіслати сповіщення
$user->notify(new TaskCompletedNotification($task));

// Отримати всі сповіщення
$user->notifications;

// Тільки непрочитані
$user->unreadNotifications;

// Кількість непрочитаних (для badge у UI)
$user->unreadNotifications()->count();

// Позначити як прочитане
$notification = $user->notifications()->find($id);
$notification->markAsRead();

// Позначити ВСІ як прочитані
$user->unreadNotifications->markAsRead();
```

Це прямий аналог того, що ви робите на фронтенді з масивом нотифікацій:

```javascript
// Pinia store для нотифікацій
const notifications = ref([])
const unread = computed(() => notifications.value.filter(n => !n.read_at))
const unreadCount = computed(() => unread.value.length)

function markAsRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read_at = new Date()
}
```

---

## Практика: крок за кроком

> **Передумова:** працюючий Task Manager API з авторизацією, моделями, контролерами з попередніх уроків.

### Крок 1: Створіть подію TaskCompleted

```bash
cd ~/task-manager-api
php artisan make:event TaskCompleted
```

Відкрийте `app/Events/TaskCompleted.php`:

```php
<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Task $task
    ) {}
}
```

### Крок 2: Створіть таблицю для сповіщень

```bash
php artisan notifications:table
php artisan migrate
```

Перевірте, що таблиця створилася:

```bash
php artisan tinker --execute="echo Schema::hasTable('notifications') ? 'notifications table exists' : 'NOT FOUND';"
```

### Крок 3: Створіть Notification

```bash
php artisan make:notification TaskCompletedNotification
```

Відкрийте `app/Notifications/TaskCompletedNotification.php`:

```php
<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Task $task
    ) {}

    /**
     * Канали доставки -- поки що тільки database
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Дані для збереження в базу
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'message' => "Task \"{$this->task->title}\" has been completed.",
            'type' => 'task_completed',
            'completed_at' => now()->toISOString(),
        ];
    }

    /**
     * Fallback для інших каналів
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
```

### Крок 4: Створіть Listener

```bash
php artisan make:listener SendTaskCompletedNotification --event=TaskCompleted
```

Відкрийте `app/Listeners/SendTaskCompletedNotification.php`:

```php
<?php

namespace App\Listeners;

use App\Events\TaskCompleted;
use App\Notifications\TaskCompletedNotification;

class SendTaskCompletedNotification
{
    public function handle(TaskCompleted $event): void
    {
        $task = $event->task;

        // Надсилаємо сповіщення власнику задачі
        $task->user->notify(new TaskCompletedNotification($task));
    }
}
```

Завдяки auto-discovery, Laravel автоматично зв'яже `TaskCompleted` з `SendTaskCompletedNotification`, бо метод `handle()` має тайп-хінт `TaskCompleted $event`.

### Крок 5: Створіть TaskObserver

```bash
php artisan make:observer TaskObserver --model=Task
```

Відкрийте `app/Observers/TaskObserver.php`:

```php
<?php

namespace App\Observers;

use App\Events\TaskCompleted;
use App\Models\Task;
use Illuminate\Support\Facades\Storage;

class TaskObserver
{
    /**
     * Перед створенням -- встановити значення за замовчуванням
     */
    public function creating(Task $task): void
    {
        // Якщо статус не вказано -- ставимо 'pending'
        if (empty($task->status)) {
            $task->status = 'pending';
        }

        // Якщо пріоритет не вказано -- ставимо 0
        if (is_null($task->priority)) {
            $task->priority = 0;
        }
    }

    /**
     * Після оновлення -- перевірити зміну статусу
     */
    public function updated(Task $task): void
    {
        // wasChanged() перевіряє, чи змінилось поле при останньому save()
        // getOriginal() повертає значення ДО зміни
        if ($task->wasChanged('status') && $task->status === 'completed') {
            TaskCompleted::dispatch($task);
        }
    }

    /**
     * Перед видаленням -- очистити пов'язані файли
     */
    public function deleting(Task $task): void
    {
        // Видалити всі файли вкладень з диску
        foreach ($task->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->path);
        }
    }
}
```

### Крок 6: Зареєструйте Observer

Відкрийте `app/Models/Task.php` і додайте атрибут `ObservedBy`:

```php
<?php

namespace App\Models;

use App\Observers\TaskObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(TaskObserver::class)]
class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }
}
```

### Крок 7: Створіть NotificationController

```bash
php artisan make:controller NotificationController
```

Відкрийте `app/Http/Controllers/NotificationController.php`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * Список сповіщень поточного користувача
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => class_basename($notification->type),
                    'data' => $notification->data,
                    'read_at' => $notification->read_at?->toISOString(),
                    'created_at' => $notification->created_at->toISOString(),
                ];
            }),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    /**
     * GET /api/notifications/unread-count
     * Кількість непрочитаних (для badge в UI)
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Позначити одне сповіщення як прочитане
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'id' => $notification->id,
            'read_at' => $notification->read_at->toISOString(),
        ]);
    }

    /**
     * POST /api/notifications/read-all
     * Позначити ВСІ сповіщення як прочитані
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }
}
```

### Крок 8: Додайте маршрути

Відкрийте `routes/api.php` і додайте маршрути для сповіщень:

```php
use App\Http\Controllers\NotificationController;

Route::middleware('auth:sanctum')->group(function () {
    // ... існуючі маршрути ...

    // Сповіщення
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});
```

### Крок 9: Тестування повного ланцюга

Запустіть сервер та протестуйте весь ланцюг: оновлення задачі -> подія -> слухач -> сповіщення.

```bash
php artisan serve
```

Отримайте токен:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' \
  | php -r 'echo json_decode(file_get_contents("php://stdin"))->token;')
```

Перевірте, що сповіщень поки немає:

```bash
curl http://localhost:8000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# Очікуваний результат:
# { "data": [], "meta": { "unread_count": 0, ... } }
```

Завершіть задачу (змініть статус на "completed"):

```bash
# Спочатку дізнайтесь ID існуючої задачі
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"

# Завершіть задачу (замініть 1 на реальний ID)
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

Перевірте, що сповіщення з'явилося:

```bash
curl http://localhost:8000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# Очікуваний результат:
# {
#   "data": [
#     {
#       "id": "uuid-string",
#       "type": "TaskCompletedNotification",
#       "data": {
#         "task_id": 1,
#         "task_title": "Learn Laravel",
#         "message": "Task \"Learn Laravel\" has been completed.",
#         "type": "task_completed",
#         "completed_at": "2026-04-09T..."
#       },
#       "read_at": null,
#       "created_at": "2026-04-09T..."
#     }
#   ],
#   "meta": {
#     "unread_count": 1,
#     ...
#   }
# }
```

Перевірте лічильник непрочитаних:

```bash
curl http://localhost:8000/api/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"

# { "unread_count": 1 }
```

Позначте як прочитане:

```bash
# Використайте ID з попереднього запиту
curl -X PATCH http://localhost:8000/api/notifications/{notification_id}/read \
  -H "Authorization: Bearer $TOKEN"

# { "id": "uuid-string", "read_at": "2026-04-09T..." }
```

Перевірте, що лічильник зменшився:

```bash
curl http://localhost:8000/api/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"

# { "unread_count": 0 }
```

### Крок 10: Перевірте через Tinker

```bash
php artisan tinker
```

```php
// Знайти користувача та його сповіщення
$user = User::first();
$user->notifications->count();        // кількість сповіщень
$user->unreadNotifications->count();   // непрочитані

// Створити задачу і завершити її -- подія спрацює автоматично
$task = $user->tasks()->first();
$task->update(['status' => 'completed']);

// Перевірити нове сповіщення
$user->refresh();
$user->unreadNotifications->count();
$user->notifications->last()->data;
// ['task_id' => 1, 'task_title' => '...', 'message' => '...', ...]
```

---

## Перевірка

Після виконання всіх кроків ви повинні бачити:

1. `app/Events/TaskCompleted.php` -- подія з публічною властивістю `$task`
2. `app/Listeners/SendTaskCompletedNotification.php` -- слухач, що відправляє сповіщення
3. `app/Notifications/TaskCompletedNotification.php` -- сповіщення з каналом `database`
4. `app/Observers/TaskObserver.php` -- спостерігач з методами `creating`, `updated`, `deleting`
5. Модель `Task` має атрибут `#[ObservedBy(TaskObserver::class)]`
6. Оновлення статусу задачі на `completed` автоматично створює запис у таблиці `notifications`
7. `GET /api/notifications` повертає список сповіщень з `unread_count`
8. `PATCH /api/notifications/{id}/read` позначає сповіщення як прочитане
9. При створенні задачі без статусу/пріоритету Observer автоматично встановлює `pending` та `0`

---

## Міні-тест

**1. Що робить трейт `Dispatchable` у класі події?**

a) Автоматично реєструє подію в EventServiceProvider
b) Дозволяє викликати `TaskCompleted::dispatch()` як статичний метод
c) Додає подію до черги (queue)
d) Серіалізує модель для передачі між процесами

**2. В якому методі Observer найкраще диспатчити подію TaskCompleted?**

a) `creating` -- перед створенням задачі
b) `created` -- після створення задачі
c) `updated` -- після оновлення задачі (перевіряючи `wasChanged`)
d) `saving` -- перед будь-яким збереженням

**3. Який метод Notification визначає канали доставки?**

a) `channels()`
b) `via()`
c) `deliver()`
d) `send()`

**4. Як отримати тільки непрочитані сповіщення користувача?**

a) `$user->notifications()->unread()`
b) `$user->unreadNotifications`
c) `$user->notifications->where('read', false)`
d) `Notification::unread($user)`

**5. Яка команда створює таблицю для database notifications?**

a) `php artisan make:migration notifications`
b) `php artisan notifications:table`
c) `php artisan make:notification --table`
d) `php artisan create:notifications`

---

## Практичне завдання

### Завдання: Подія TaskAssigned та сповіщення

Реалізуйте систему подій для призначення задачі іншому користувачу (підготовка до мульти-користувацького функціоналу):

1. **Додайте міграцію** для колонки `assigned_to` в таблиці `tasks`:

```bash
php artisan make:migration add_assigned_to_to_tasks_table --table=tasks
```

```php
public function up(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->foreignId('assigned_to')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
    });
}
```

2. **Створіть подію** `TaskAssigned`:

```bash
php artisan make:event TaskAssigned
```

```php
class TaskAssigned
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Task $task,
        public User $assignedTo,
        public User $assignedBy
    ) {}
}
```

3. **Створіть сповіщення** `TaskAssignedNotification`:

- Канал: `database`
- Дані: `task_id`, `task_title`, `assigned_by_name`, повідомлення "You have been assigned to task ..."

4. **Створіть слухач** `SendTaskAssignedNotification`:

- Надсилає сповіщення призначеному користувачу (НЕ автору задачі)

5. **Додайте логіку в TaskObserver** -- метод `updated`:

- Якщо змінилося поле `assigned_to` і воно не `null` -- диспатчити `TaskAssigned`

6. **Протестуйте через Tinker**:

```php
$owner = User::first();
$assignee = User::factory()->create(['name' => 'John Doe']);
$task = $owner->tasks()->first();
$task->update(['assigned_to' => $assignee->id]);

// Перевірте сповіщення
$assignee->unreadNotifications->count(); // 1
$assignee->unreadNotifications->first()->data;
// ['task_title' => '...', 'assigned_by_name' => '...', ...]
```

---

## Відповіді на тест

1. **b) Дозволяє викликати `TaskCompleted::dispatch()` як статичний метод** -- трейт `Dispatchable` додає статичний метод `dispatch()`, який створює екземпляр події і відправляє його через систему подій Laravel. Без нього довелось би писати `event(new TaskCompleted($task))`.

2. **c) `updated` -- після оновлення задачі (перевіряючи `wasChanged`)** -- подія TaskCompleted повинна спрацьовувати, коли статус змінюється на "completed". Метод `updated` викликається після збереження, і `$task->wasChanged('status')` дозволяє перевірити, чи дійсно статус змінився.

3. **b) `via()`** -- метод `via()` повертає масив каналів, через які буде доставлено сповіщення: `['database']`, `['mail', 'database']` тощо. Назва методу означає "через які канали".

4. **b) `$user->unreadNotifications`** -- це magic relationship, визначена в трейті `Notifiable`. Вона повертає колекцію сповіщень, де `read_at` дорівнює `null`. Під капотом це `$user->notifications()->whereNull('read_at')->get()`.

5. **b) `php artisan notifications:table`** -- ця Artisan-команда створює міграцію для таблиці `notifications` з правильною структурою (поліморфний зв'язок `notifiable`, JSON `data`, `read_at` тощо). Після цього потрібно виконати `php artisan migrate`.
