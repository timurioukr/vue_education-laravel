# Урок 20: Unit-тести та мокінг -- тестування ізольованої логіки

## Що ви вивчите

- Різницю між Feature та Unit тестами: повний HTTP-цикл vs ізольована логіка
- Як тестувати Eloquent-скоупи окремо від контролера
- Як тестувати Form Request (правила валідації та authorize())
- Як тестувати Policy (логіку авторизації)
- Мокінг (faking) сервісів Laravel:
  - `Event::fake()` -- перехоплення подій
  - `Notification::fake()` -- перехоплення нотифікацій
  - `Queue::fake()` -- перехоплення джоб
  - `Storage::fake()` -- тестова файлова система
  - `Mail::fake()` -- перехоплення пошти
- Assertions для fakes: `assertDispatched()`, `assertSent()`, `assertPushed()`, `assertExists()`
- Організацію тестів: `describe()` для групування, `--filter` для запуску
- Як тестувати observer та event listener

---

## Паралелі з JS/Vue

| Laravel (PHP) | Vitest / Vue | Коментар |
|---|---|---|
| `Event::fake()` | `vi.fn()` / `vi.mock()` | Замінити реальний модуль на заглушку |
| `Event::assertDispatched(TaskCompleted::class)` | `expect(mockFn).toHaveBeenCalledWith(...)` | Перевірити, що функція була викликана |
| `Queue::fake()` | `vi.mock('api/service')` | Перехопити async-операцію |
| `Storage::fake('public')` | Мокання `FileReader` / `URL.createObjectURL` | Тестове файлове сховище |
| `Notification::fake()` | `vi.spyOn(notificationService, 'send')` | Перехопити відправку нотифікацій |
| `Mail::fake()` | `vi.mock('email-service')` | Перехопити відправку пошти |
| Unit test для scope | Тестування Pinia getter окремо | Перевіряємо логіку без UI/HTTP |
| Unit test для Policy | Тестування guard / middleware у Vue Router | Перевіряємо логіку доступу |
| `Mockery::mock()` | `vi.mock('module')` | Повна заміна обʼєкта |
| Feature test (HTTP) | Тестування компонента з mount() | Повний потік з усіма залежностями |
| Unit test (ізольований) | Тестування composable без компонента | Тільки сама логіка, без оточення |

---

## Теорія

### Feature vs Unit: коли що використовувати

У Vue-екосистемі є аналогічний поділ:

```
Feature test (Laravel)  ≈  Component test з mount() (Vue)
└── HTTP запит → Routing → Middleware → Controller → Model → Response
    Тестує ВЕСЬ потік від початку до кінця

Unit test (Laravel)    ≈  Тестування composable / Pinia getter (Vue)
└── Виклик одного методу → перевірка результату
    Тестує ОДНУ конкретну функцію
```

**Feature-тести** (Урок 19) перевіряють API "очима фронтенду": надсилають HTTP-запит і перевіряють відповідь. Вони ловлять баги інтеграції, але повільніші.

**Unit-тести** перевіряють окрему одиницю логіки: один скоуп, одну policy, один метод. Вони швидші й точніші, але не гарантують, що все разом працює правильно.

**Золоте правило**: Feature-тести для критичних потоків (CRUD, auth), Unit-тести для складної бізнес-логіки.

### Що варто тестувати Unit-тестами

| Що тестувати | Чому |
|---|---|
| Model scopes | Складна логіка фільтрації, яку легко зламати |
| Policies | Критична логіка безпеки |
| Form Request rules | Валідація -- перша лінія захисту |
| Service classes | Бізнес-логіка, ізольована від HTTP |
| Events dispatched | Чи спрацьовує подія при потрібних умовах |
| Notifications sent | Чи отримує потрібна людина нотифікацію |
| Jobs pushed to queue | Чи ставиться джоба у чергу |
| File uploads | Чи зберігається файл у правильне місце |

### Тестування Model Scopes

Скоупи -- це методи на моделі, що додають умови до запиту. У Vue це як Pinia getter, що фільтрує стейт:

```javascript
// Pinia getter (Vue)
const getters = {
  overdueTasks: (state) =>
    state.tasks.filter(t => t.status !== 'done' && new Date(t.deadline) < new Date()),
  tasksByStatus: (state) => (status) =>
    state.tasks.filter(t => t.status === status),
}

// Тестування getter
it('returns only overdue tasks', () => {
  const store = useTaskStore()
  store.tasks = [
    { id: 1, status: 'pending', deadline: '2020-01-01' },
    { id: 2, status: 'done', deadline: '2020-01-01' },
    { id: 3, status: 'pending', deadline: '2030-01-01' },
  ]
  expect(store.overdueTasks).toHaveLength(1)
  expect(store.overdueTasks[0].id).toBe(1)
})
```

В Laravel скоупи виглядають так:

```php
// app/Models/Task.php
class Task extends Model
{
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', '!=', 'done')
            ->whereNotNull('deadline')
            ->where('deadline', '<', now());
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%");
        });
    }
}
```

Тестуємо їх ізольовано, без HTTP:

```php
// tests/Unit/Models/TaskTest.php
<?php

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Task::scopeOverdue', function () {
    it('returns tasks past deadline that are not done', function () {
        $user = User::factory()->create();

        // Прострочена задача (повинна бути в результаті)
        $overdueTask = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'deadline' => now()->subDays(3),
        ]);

        // Завершена задача з минулим дедлайном (НЕ повинна бути)
        Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'done',
            'deadline' => now()->subDays(1),
        ]);

        // Задача з майбутнім дедлайном (НЕ повинна бути)
        Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'deadline' => now()->addDays(5),
        ]);

        // Задача без дедлайну (НЕ повинна бути)
        Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'deadline' => null,
        ]);

        $overdueTasks = Task::overdue()->get();

        expect($overdueTasks)->toHaveCount(1);
        expect($overdueTasks->first()->id)->toBe($overdueTask->id);
    });
});

describe('Task::scopeByStatus', function () {
    it('filters tasks by given status', function () {
        $user = User::factory()->create();

        Task::factory()->count(3)->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        Task::factory()->count(2)->create([
            'user_id' => $user->id,
            'status' => 'done',
        ]);

        expect(Task::byStatus('pending')->count())->toBe(3);
        expect(Task::byStatus('done')->count())->toBe(2);
        expect(Task::byStatus('in_progress')->count())->toBe(0);
    });
});

describe('Task::scopeSearch', function () {
    it('searches in title and description', function () {
        $user = User::factory()->create();

        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Buy groceries',
            'description' => 'Milk, bread, eggs',
        ]);
        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Fix frontend bug',
            'description' => 'Button not clickable',
        ]);
        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Deploy app',
            'description' => 'Push to production server',
        ]);

        // Шукаємо в title
        expect(Task::search('groceries')->count())->toBe(1);

        // Шукаємо в description
        expect(Task::search('production')->count())->toBe(1);

        // Нічого не знайдено
        expect(Task::search('nonexistent')->count())->toBe(0);
    });
});
```

Зверніть увагу: Unit-тести все одно потребують `RefreshDatabase`, бо працюють з реальною базою. Різниця у тому, що ми НЕ надсилаємо HTTP-запит -- ми напряму викликаємо методи моделі.

### Тестування Policy

Policy визначає, хто що може робити. Це найкритичніший код для безпеки:

```php
// app/Policies/TaskPolicy.php
class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $user->id === $task->user_id;
    }

    public function update(User $user, Task $task): bool
    {
        return $user->id === $task->user_id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->id === $task->user_id;
    }
}
```

```php
// tests/Unit/Policies/TaskPolicyTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Policies\TaskPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('TaskPolicy', function () {
    beforeEach(function () {
        $this->policy = new TaskPolicy();
        $this->owner = User::factory()->create();
        $this->stranger = User::factory()->create();
        $this->task = Task::factory()->create(['user_id' => $this->owner->id]);
    });

    it('allows owner to view their task', function () {
        expect($this->policy->view($this->owner, $this->task))->toBeTrue();
    });

    it('denies stranger from viewing task', function () {
        expect($this->policy->view($this->stranger, $this->task))->toBeFalse();
    });

    it('allows owner to update their task', function () {
        expect($this->policy->update($this->owner, $this->task))->toBeTrue();
    });

    it('denies stranger from updating task', function () {
        expect($this->policy->update($this->stranger, $this->task))->toBeFalse();
    });

    it('allows owner to delete their task', function () {
        expect($this->policy->delete($this->owner, $this->task))->toBeTrue();
    });

    it('denies stranger from deleting task', function () {
        expect($this->policy->delete($this->stranger, $this->task))->toBeFalse();
    });
});
```

Це чистий Unit-тест: ми створюємо обʼєкт Policy напряму і викликаємо методи з різними аргументами. Ніякого HTTP, ніякого контролера.

### Мокінг сервісів Laravel: Fakes

Ось головна ідея мокінгу. У Vue ви робите:

```javascript
// Vitest -- мокаємо API-модуль
vi.mock('@/api/notifications', () => ({
  sendNotification: vi.fn()
}))

// В тесті
import { sendNotification } from '@/api/notifications'
// ... виконуємо дію ...
expect(sendNotification).toHaveBeenCalledWith({ to: 'user@email.com', message: '...' })
```

В Laravel -- та сама ідея, але з елегантнішим синтаксисом:

```php
use Illuminate\Support\Facades\Event;

Event::fake(); // Перехопити ВСІ події -- вони НЕ будуть реально виконані

// ... виконуємо дію ...

Event::assertDispatched(TaskCompleted::class); // Перевіряємо, що подія була відправлена
```

`fake()` робить дві речі:
1. **Перехоплює** виклики -- реальний код НЕ виконується (email не відправляється, файл не записується)
2. **Записує** що було викликано -- можна потім перевірити через `assert*`

#### Event::fake()

Перехоплює всі події. Корисно, коли при зміні статусу задачі має спрацювати подія:

```php
// tests/Feature/TaskEventTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Events\TaskCompleted;
use Illuminate\Support\Facades\Event;

describe('Task Events', function () {
    it('dispatches TaskCompleted when task status changes to done', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'status' => 'done',
            ])
            ->assertOk();

        Event::assertDispatched(TaskCompleted::class, function ($event) use ($task) {
            return $event->task->id === $task->id;
        });
    });

    it('does not dispatch TaskCompleted for other status changes', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'status' => 'in_progress',
            ]);

        Event::assertNotDispatched(TaskCompleted::class);
    });
});
```

#### Notification::fake()

Перехоплює нотифікації. Перевіряємо, що конкретний юзер отримав конкретну нотифікацію:

```php
// tests/Feature/TaskNotificationTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskCompletedNotification;
use Illuminate\Support\Facades\Notification;

describe('Task Notifications', function () {
    it('sends notification when task is completed', function () {
        Notification::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'status' => 'done',
            ]);

        // Перевіряємо, що юзер отримав нотифікацію
        Notification::assertSentTo(
            $user,
            TaskCompletedNotification::class,
            function ($notification, $channels) use ($task) {
                return $notification->task->id === $task->id;
            }
        );
    });

    it('does not send notification for non-completion updates', function () {
        Notification::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'title' => 'Updated title',
            ]);

        Notification::assertNothingSent();
    });
});
```

#### Queue::fake()

Перехоплює джоби. Джоба не виконується реально, але ми можемо перевірити, що вона була поставлена в чергу:

```php
// tests/Feature/TaskQueueTest.php
<?php

use App\Jobs\SendOverdueReminders;
use Illuminate\Support\Facades\Queue;

describe('Queue Jobs', function () {
    it('pushes overdue reminders job when scheduled', function () {
        Queue::fake();

        // Імітуємо виклик scheduled команди чи ручний dispatch
        SendOverdueReminders::dispatch();

        Queue::assertPushed(SendOverdueReminders::class);
    });

    it('pushes job with correct parameters', function () {
        Queue::fake();

        $userId = 42;
        SendOverdueReminders::dispatch($userId);

        Queue::assertPushed(SendOverdueReminders::class, function ($job) use ($userId) {
            return $job->userId === $userId;
        });
    });

    it('does not push duplicate jobs', function () {
        Queue::fake();

        SendOverdueReminders::dispatch();

        Queue::assertPushed(SendOverdueReminders::class, 1); // рівно 1 раз
    });
});
```

#### Storage::fake()

Створює віртуальну файлову систему в памʼяті. Файли не записуються на диск:

```php
// tests/Feature/TaskFileUploadTest.php
<?php

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

describe('Task File Upload', function () {
    it('uploads attachment to task', function () {
        Storage::fake('public');

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        // Створюємо тестовий файл (не реальний файл, а обʼєкт в памʼяті)
        $file = UploadedFile::fake()->image('screenshot.jpg', 800, 600);

        $response = $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ]);

        $response->assertCreated();

        // Перевіряємо, що файл "зберігся" у фейковому storage
        Storage::disk('public')->assertExists("attachments/{$file->hashName()}");
    });

    it('rejects files that are too large', function () {
        Storage::fake('public');

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        // Файл на 20 MB (перевищує ліміт)
        $file = UploadedFile::fake()->create('document.pdf', 20000); // 20 MB

        $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);

        // Файл НЕ повинен бути збережений
        Storage::disk('public')->assertDirectoryEmpty('attachments');
    });

    it('rejects non-allowed file types', function () {
        Storage::fake('public');

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('virus.exe', 100);

        $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    });
});
```

`UploadedFile::fake()` -- це генератор тестових файлів:

```php
// Зображення
UploadedFile::fake()->image('photo.jpg', 800, 600);

// Довільний файл вказаного розміру
UploadedFile::fake()->create('document.pdf', 500); // 500 KB

// Файл конкретного MIME-типу
UploadedFile::fake()->create('data.csv', 100, 'text/csv');
```

#### Mail::fake()

Перехоплює email-повідомлення:

```php
<?php

use Illuminate\Support\Facades\Mail;
use App\Mail\TaskOverdueAlert;

it('sends overdue alert email', function () {
    Mail::fake();

    // ... дія, що повинна відправити email ...

    Mail::assertSent(TaskOverdueAlert::class, function ($mail) {
        return $mail->hasTo('user@example.com');
    });
});

it('does not send email when no overdue tasks', function () {
    Mail::fake();

    // ... дія без прострочених задач ...

    Mail::assertNothingSent();
});
```

### Зведена таблиця Fakes

| Fake | Що перехоплює | Assert метод | Перевіряє що |
|---|---|---|---|
| `Event::fake()` | Dispatch подій | `assertDispatched(Class)` | Подія була відправлена |
| | | `assertNotDispatched(Class)` | Подія НЕ була відправлена |
| `Notification::fake()` | Нотифікації | `assertSentTo($user, Class)` | Юзер отримав нотифікацію |
| | | `assertNothingSent()` | Жодна нотифікація не відправлена |
| `Queue::fake()` | Dispatch джоб | `assertPushed(Class)` | Джоба поставлена в чергу |
| | | `assertPushed(Class, 2)` | Джоба поставлена N разів |
| `Storage::fake()` | Файлові операції | `assertExists('path')` | Файл існує |
| | | `assertMissing('path')` | Файл не існує |
| `Mail::fake()` | Email-повідомлення | `assertSent(Class)` | Email відправлений |
| | | `assertNothingSent()` | Жоден email не відправлений |

### Тестування Form Request

Form Request містить правила валідації та логіку authorize. Можна тестувати їх ізольовано:

```php
// tests/Unit/Requests/StoreTaskRequestTest.php
<?php

use App\Http\Requests\StoreTaskRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('StoreTaskRequest', function () {
    it('has required validation rules', function () {
        $request = new StoreTaskRequest();
        $rules = $request->rules();

        expect($rules)->toHaveKey('title');
        expect($rules)->toHaveKey('status');
        expect($rules)->toHaveKey('priority');
    });

    it('requires title field', function () {
        $request = new StoreTaskRequest();
        $rules = $request->rules();

        // Перевіряємо, що title має правило required
        $titleRules = is_array($rules['title']) ? $rules['title'] : explode('|', $rules['title']);
        expect($titleRules)->toContain('required');
    });

    it('authorizes authenticated users', function () {
        $user = User::factory()->create();

        $request = new StoreTaskRequest();
        $request->setUserResolver(fn () => $user);

        expect($request->authorize())->toBeTrue();
    });
});
```

Але частіше правила валідації тестуються через Feature-тести (Урок 19) -- надсилаєте невалідні дані та перевіряєте 422. Unit-тест для Form Request корисний, коли логіка `authorize()` складна.

### Тестування Observer

Якщо у вас є observer, що реагує на зміни моделі:

```php
// app/Observers/TaskObserver.php
class TaskObserver
{
    public function updated(Task $task): void
    {
        if ($task->isDirty('status') && $task->status === 'done') {
            event(new TaskCompleted($task));
        }
    }
}
```

Тестуємо його через зміну моделі:

```php
// tests/Unit/Observers/TaskObserverTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Events\TaskCompleted;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('TaskObserver', function () {
    it('fires TaskCompleted when status changes to done', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'in_progress',
        ]);

        // Змінюємо статус напряму на моделі
        $task->update(['status' => 'done']);

        Event::assertDispatched(TaskCompleted::class, function ($event) use ($task) {
            return $event->task->id === $task->id;
        });
    });

    it('does not fire TaskCompleted for other changes', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Змінюємо title, а не status
        $task->update(['title' => 'Updated title']);

        Event::assertNotDispatched(TaskCompleted::class);
    });

    it('does not fire TaskCompleted when status changes to non-done', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $task->update(['status' => 'in_progress']);

        Event::assertNotDispatched(TaskCompleted::class);
    });
});
```

### Організація тестів: запуск конкретних груп

```bash
# Всі тести
php artisan test

# Тільки Unit-тести
php artisan test --testsuite=Unit

# Тільки Feature-тести
php artisan test --testsuite=Feature

# Конкретний файл
php artisan test tests/Unit/Models/TaskTest.php

# Фільтр по назві
php artisan test --filter="TaskPolicy"
php artisan test --filter="fires TaskCompleted"

# Паралельний запуск (швидше)
php artisan test --parallel
```

### Повний список корисних Pest expect()-assertions

```php
// Базові
expect($value)->toBe(42);          // строге порівняння (===)
expect($value)->toEqual([1, 2]);   // нестроге порівняння (==)
expect($value)->toBeTrue();
expect($value)->toBeFalse();
expect($value)->toBeNull();
expect($value)->not->toBeNull();

// Колекції
expect($collection)->toHaveCount(5);
expect($array)->toContain('item');
expect($array)->toHaveKey('name');

// Строки
expect($string)->toContain('hello');
expect($string)->toStartWith('Hello');
expect($string)->toMatch('/\d+/');

// Типи
expect($value)->toBeInstanceOf(Task::class);
expect($value)->toBeString();
expect($value)->toBeInt();
expect($value)->toBeArray();

// Обʼєкти
expect($task)->toHaveProperty('title');
expect($task)->toHaveProperty('title', 'Buy milk');

// Ланцюжки
expect($user->tasks)
    ->toHaveCount(3)
    ->each(fn ($task) => $task->toHaveProperty('user_id', $user->id));
```

---

## Практика: крок за кроком

### Крок 1: Створіть структуру Unit-тестів

```bash
# Створюємо директорії
mkdir -p tests/Unit/Models
mkdir -p tests/Unit/Policies
mkdir -p tests/Unit/Observers
mkdir -p tests/Unit/Requests
```

### Крок 2: Налаштуйте Pest.php для Unit-тестів

Переконайтесь, що `tests/Pest.php` також покриває Unit-тести:

```php
// tests/Pest.php
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->extends(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

// Unit-тести теж наслідують TestCase, але RefreshDatabase додаємо вибірково
pest()->extends(Tests\TestCase::class)
    ->in('Unit');
```

### Крок 3: Unit-тести для скоупів моделі Task

Створіть файл `tests/Unit/Models/TaskTest.php`:

```php
// tests/Unit/Models/TaskTest.php
<?php

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Task::scopeOverdue', function () {
    it('returns only overdue pending/in-progress tasks', function () {
        $user = User::factory()->create();

        // Прострочена pending задача -- ПОВИННА бути
        $overdue1 = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'deadline' => now()->subDay(),
        ]);

        // Прострочена in_progress задача -- ПОВИННА бути
        $overdue2 = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'in_progress',
            'deadline' => now()->subDays(5),
        ]);

        // Завершена з минулим дедлайном -- НЕ повинна
        Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'done',
            'deadline' => now()->subDay(),
        ]);

        // Майбутній дедлайн -- НЕ повинна
        Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'deadline' => now()->addWeek(),
        ]);

        // Без дедлайну -- НЕ повинна
        Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'deadline' => null,
        ]);

        $result = Task::overdue()->get();

        expect($result)->toHaveCount(2);
        expect($result->pluck('id')->toArray())
            ->toContain($overdue1->id)
            ->toContain($overdue2->id);
    });
});

describe('Task::scopeByStatus', function () {
    it('filters by pending status', function () {
        $user = User::factory()->create();

        Task::factory()->count(2)->create(['user_id' => $user->id, 'status' => 'pending']);
        Task::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'done']);
        Task::factory()->create(['user_id' => $user->id, 'status' => 'in_progress']);

        expect(Task::byStatus('pending')->count())->toBe(2);
        expect(Task::byStatus('done')->count())->toBe(3);
        expect(Task::byStatus('in_progress')->count())->toBe(1);
    });
});

describe('Task::scopeSearch', function () {
    it('finds tasks by title keyword', function () {
        $user = User::factory()->create();

        Task::factory()->create(['user_id' => $user->id, 'title' => 'Buy groceries']);
        Task::factory()->create(['user_id' => $user->id, 'title' => 'Fix production bug']);
        Task::factory()->create(['user_id' => $user->id, 'title' => 'Read a book']);

        expect(Task::search('groceries')->count())->toBe(1);
        expect(Task::search('bug')->count())->toBe(1);
        expect(Task::search('nonexistent')->count())->toBe(0);
    });

    it('finds tasks by description keyword', function () {
        $user = User::factory()->create();

        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Task A',
            'description' => 'Deploy to production server',
        ]);
        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Task B',
            'description' => 'Write unit tests',
        ]);

        expect(Task::search('production')->count())->toBe(1);
        expect(Task::search('unit tests')->count())->toBe(1);
    });

    it('is case-insensitive', function () {
        $user = User::factory()->create();

        Task::factory()->create(['user_id' => $user->id, 'title' => 'Buy Groceries']);

        expect(Task::search('buy')->count())->toBe(1);
        expect(Task::search('BUY')->count())->toBe(1);
        expect(Task::search('groceries')->count())->toBe(1);
    });
});
```

### Крок 4: Unit-тести для TaskPolicy

Створіть файл `tests/Unit/Policies/TaskPolicyTest.php`:

```php
// tests/Unit/Policies/TaskPolicyTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Policies\TaskPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('TaskPolicy', function () {
    beforeEach(function () {
        $this->policy = new TaskPolicy();
        $this->owner = User::factory()->create();
        $this->stranger = User::factory()->create();
        $this->task = Task::factory()->create(['user_id' => $this->owner->id]);
    });

    describe('view', function () {
        it('allows owner to view', function () {
            expect($this->policy->view($this->owner, $this->task))->toBeTrue();
        });

        it('denies stranger', function () {
            expect($this->policy->view($this->stranger, $this->task))->toBeFalse();
        });
    });

    describe('update', function () {
        it('allows owner to update', function () {
            expect($this->policy->update($this->owner, $this->task))->toBeTrue();
        });

        it('denies stranger', function () {
            expect($this->policy->update($this->stranger, $this->task))->toBeFalse();
        });
    });

    describe('delete', function () {
        it('allows owner to delete', function () {
            expect($this->policy->delete($this->owner, $this->task))->toBeTrue();
        });

        it('denies stranger', function () {
            expect($this->policy->delete($this->stranger, $this->task))->toBeFalse();
        });
    });
});
```

### Крок 5: Тести подій та нотифікацій

Створіть файл `tests/Feature/TaskEventTest.php`:

```php
// tests/Feature/TaskEventTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Events\TaskCompleted;
use App\Notifications\TaskCompletedNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

describe('Task completion events', function () {
    it('dispatches TaskCompleted when marking task as done', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", ['status' => 'done']);

        Event::assertDispatched(TaskCompleted::class);
    });

    it('does not dispatch TaskCompleted for other updates', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", ['title' => 'New title']);

        Event::assertNotDispatched(TaskCompleted::class);
    });
});

describe('Task completion notifications', function () {
    it('sends notification to user when task is completed', function () {
        Notification::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", ['status' => 'done']);

        Notification::assertSentTo($user, TaskCompletedNotification::class);
    });
});
```

### Крок 6: Тест завантаження файлів

Створіть файл `tests/Feature/TaskFileUploadTest.php`:

```php
// tests/Feature/TaskFileUploadTest.php
<?php

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

describe('Task file upload', function () {
    it('uploads image attachment', function () {
        Storage::fake('public');

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('photo.jpg', 400, 300);

        $response = $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ]);

        $response->assertCreated();

        // Файл повинен існувати в fake storage
        Storage::disk('public')->assertExists("attachments/{$file->hashName()}");
    });

    it('uploads PDF document', function () {
        Storage::fake('public');

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('report.pdf', 500, 'application/pdf');

        $response = $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ]);

        $response->assertCreated();
        Storage::disk('public')->assertExists("attachments/{$file->hashName()}");
    });

    it('rejects oversized files', function () {
        Storage::fake('public');

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('huge.zip', 20000); // 20 MB

        $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    });
});
```

### Крок 7: Тест Queue jobs

```php
// tests/Feature/TaskQueueTest.php
<?php

use App\Jobs\SendOverdueReminders;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

describe('Overdue reminders job', function () {
    it('is dispatched when triggered', function () {
        Queue::fake();

        // Тригер залежить від вашої імплементації
        // Наприклад, через Artisan-команду або scheduled task
        SendOverdueReminders::dispatch();

        Queue::assertPushed(SendOverdueReminders::class);
    });

    it('is pushed exactly once', function () {
        Queue::fake();

        SendOverdueReminders::dispatch();

        Queue::assertPushed(SendOverdueReminders::class, 1);
    });
});
```

### Крок 8: Запуск і перевірка

```bash
# Запуск всіх тестів
php artisan test

# Тільки Unit
php artisan test --testsuite=Unit

# Тільки тести Policy
php artisan test --filter="TaskPolicy"

# Тільки тести скоупів
php artisan test --filter="scopeOverdue"

# Verbose -- більше деталей
php artisan test --verbose
```

---

## Перевірка

Після завершення цього уроку у вас має бути:

- [ ] `tests/Unit/Models/TaskTest.php` -- тести скоупів (overdue, byStatus, search)
- [ ] `tests/Unit/Policies/TaskPolicyTest.php` -- тести авторизації (view, update, delete)
- [ ] `tests/Feature/TaskEventTest.php` -- тести подій (TaskCompleted)
- [ ] `tests/Feature/TaskNotificationTest.php` -- тести нотифікацій
- [ ] `tests/Feature/TaskFileUploadTest.php` -- тести завантаження файлів
- [ ] `tests/Feature/TaskQueueTest.php` -- тести черги джоб
- [ ] Розуміння різниці між Feature і Unit тестами
- [ ] Вміння використовувати `Event::fake()`, `Notification::fake()`, `Queue::fake()`, `Storage::fake()`
- [ ] Всі тести проходять через `php artisan test`

---

## Міні-тест

### 1. Чим Unit-тест відрізняється від Feature-тесту?
a) Unit-тест швидший, бо не використовує базу даних  
b) Unit-тест тестує ізольовану логіку (метод, скоуп, policy), Feature -- повний HTTP-цикл  
c) Unit-тести пишуться тільки для моделей  
d) Feature-тести не можуть використовувати фабрики  

### 2. Що робить `Event::fake()`?
a) Створює фейкову подію  
b) Видаляє всі події з системи  
c) Перехоплює dispatch подій і дозволяє перевірити, які події були відправлені  
d) Реєструє новий event listener  

### 3. Як перевірити, що конкретний юзер отримав нотифікацію?
a) `Notification::assertSent(UserClass, NotificationClass)`  
b) `Notification::assertSentTo($user, NotificationClass::class)`  
c) `$user->assertNotification(NotificationClass)`  
d) `expect($user->notifications)->toContain(NotificationClass)`  

### 4. Що робить `Storage::fake('public')`?
a) Видаляє всі файли з public storage  
b) Створює симлінк на storage/app/public  
c) Замінює реальний public-диск на віртуальну файлову систему в памʼяті  
d) Робить storage доступним публічно  

### 5. Як створити тестовий файл для upload-тесту?
a) `file_put_contents('test.jpg', 'data')`  
b) `UploadedFile::fake()->image('photo.jpg', 800, 600)`  
c) `new File('photo.jpg')`  
d) `Storage::create('photo.jpg')`  

---

## Практичне завдання

Напишіть тести для `SendOverdueReminders` job та `TaskObserver`.

### Частина 1: Тести для SendOverdueReminders job

Створіть файл `tests/Unit/Jobs/SendOverdueRemindersTest.php`:

1. Тест: джоба знаходить всі прострочені задачі і відправляє нотифікацію кожному власнику
2. Тест: джоба НЕ відправляє нотифікацію, якщо немає прострочених задач
3. Тест: джоба відправляє по одній нотифікації на юзера, навіть якщо у нього кілька прострочених задач
4. Тест: джоба ігнорує задачі зі статусом "done"

**Підказка**: використовуйте `Notification::fake()` і запускайте джобу напряму через `(new SendOverdueReminders())->handle()`.

### Частина 2: Тести для TaskObserver

Створіть файл `tests/Unit/Observers/TaskObserverTest.php`:

1. Тест: при створенні задачі НЕ відправляється подія TaskCompleted
2. Тест: при зміні статусу на "done" відправляється подія TaskCompleted
3. Тест: при зміні статусу на "in_progress" НЕ відправляється подія
4. Тест: при зміні title (без зміни status) НЕ відправляється подія
5. Тест: при видаленні задачі НЕ відправляється подія TaskCompleted

Кожен тест повинен використовувати `Event::fake()`.

---

## Відповіді на тест

1. **b)** Unit-тест тестує ізольовану логіку (один метод, скоуп або policy), а Feature-тест перевіряє повний HTTP-цикл від запиту до відповіді. Обидва можуть використовувати базу даних і фабрики.
2. **c)** `Event::fake()` перехоплює всі dispatch-виклики подій. Реальні listeners НЕ виконуються, але можна перевірити через `assertDispatched()` і `assertNotDispatched()`, які події були відправлені.
3. **b)** `Notification::assertSentTo($user, NotificationClass::class)` -- перший аргумент це обʼєкт-отримувач, другий -- клас нотифікації. Можна додати третій аргумент -- closure для детальнішої перевірки.
4. **c)** `Storage::fake('public')` замінює реальний public-диск на віртуальну файлову систему в памʼяті. Файли не записуються на реальний диск, але можна перевірити їх наявність через `assertExists()`.
5. **b)** `UploadedFile::fake()->image('photo.jpg', 800, 600)` створює тестовий обʼєкт файлу в памʼяті. Можна задати ім'я, розміри, тип. Для не-зображень: `UploadedFile::fake()->create('doc.pdf', 500)`.
