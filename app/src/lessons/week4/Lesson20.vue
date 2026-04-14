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
    question: 'Що робить Event::fake() у тесті?',
    options: [
      'Створює нову реальну подію',
      'Перехоплює ВСІ dispatch-виклики: події НЕ виконуються реально, але записується що було викликано',
      'Видаляє всі існуючі події',
      'Запускає всі зареєстровані listeners',
    ],
    correct: 1,
    explanation:
      'fake() робить дві речі: (1) перехоплює — реальні listeners НЕ виконуються (email не летить, notification не зберігається); (2) записує що було dispatch-нуто — потім перевіряємо через assertDispatched(). Це аналог vi.fn() / vi.mock() у Vitest.',
  },
  {
    question: 'Яка різниця між Feature і Unit тестами в Laravel?',
    options: [
      'Feature тільки для UI, Unit тільки для логіки',
      'Feature надсилає реальний HTTP-запит і перевіряє response; Unit напряму викликає методи класу без HTTP',
      'Feature повільніший тільки тому що використовує більше памʼяті',
      'Різниці немає — це синоніми',
    ],
    correct: 1,
    explanation:
      'Feature = повний HTTP-цикл (request → routing → middleware → controller → response). Аналог Cypress E2E, але без браузера. Unit = ізольований виклик одного методу (scope, policy, service). Аналог Vitest для composable. Золоте правило: Feature для CRUD+auth, Unit для складної бізнес-логіки.',
  },
  {
    question: 'Як перевірити, що Notification було надіслано конкретному юзеру?',
    options: [
      'Notification::assertSent(User::class)',
      'Notification::assertSentTo($user, TaskCompletedNotification::class)',
      'Event::assertDispatched(TaskCompletedNotification::class)',
      '$user->notifications->assertCount(1)',
    ],
    correct: 1,
    explanation:
      'Notification::assertSentTo($user, Class) — перевіряє що конкретний $user отримав конкретну Notification. Другий callback-аргумент дозволяє перевірити payload: function ($notification) use ($task) { return $notification->task->id === $task->id; }. assertNothingSent() — жодна нотифікація не полетіла.',
  },
  {
    question: 'Що робить Storage::fake("public") у тесті?',
    options: [
      'Видаляє всі файли з public диску',
      'Створює віртуальну файлову систему в памʼяті — файли НЕ записуються на реальний диск',
      'Перемикає Storage на Amazon S3',
      'Робить всі файли публічно доступними',
    ],
    correct: 1,
    explanation:
      'Storage::fake("public") замінює реальний диск на in-memory. UploadedFile::fake()->image("photo.jpg") генерує тестовий файл. Після тесту — нічого не залишається на диску. assertExists("path") перевіряє що файл "зберігся" у fake-сховищі.',
  },
  {
    question: 'Як правильно тестувати, що Observer диспатчить TaskCompleted при зміні статусу?',
    options: [
      'Створити HTTP-запит на /api/tasks/{id} з Event::fake()',
      'Event::fake() → $task->update(["status" => "done"]) → Event::assertDispatched(TaskCompleted::class)',
      'Напряму викликати Observer::updated() і перевірити повернене значення',
      'Перевірити лог-файл на наявність повідомлення',
    ],
    correct: 1,
    explanation:
      'Event::fake() перехоплює; потім змінюємо модель через $task->update() — Observer.updated() спрацьовує автоматично і диспатчить подію у fake; assertDispatched(Class, fn ($e) => $e->task->id === $task->id) перевіряє. Другий callback підтверджує що саме ця задача.',
  },
]

// === CodeComparison: Vitest mocking vs Laravel fakes ===
const jsVitest = `// Vitest — мокінг модулів / шпигунів
import { vi, describe, it, expect } from 'vitest'

// Замінити модуль на заглушку
vi.mock('@/api/notifications', () => ({
  sendNotification: vi.fn(),
}))

import { sendNotification } from '@/api/notifications'

it('sends notification on complete', () => {
  completeTask(task)

  // Перевіряємо виклик
  expect(sendNotification).toHaveBeenCalledWith({
    to: 'user@email.com',
    message: 'Task completed!',
  })
})

// vi.fn() — створити шпигуна
const spy = vi.fn()
spy('hello')
expect(spy).toHaveBeenCalledWith('hello')
expect(spy).toHaveBeenCalledTimes(1)

// vi.spyOn — слідкувати за існуючим методом
vi.spyOn(console, 'log')
doSomething()
expect(console.log).toHaveBeenCalled()

// Мокання файлової системи
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => 'content'),
}))`

const phpFakes = `<?php
// Laravel — Fakes (елегантніший синтаксис)
use Illuminate\\Support\\Facades\\Event;
use Illuminate\\Support\\Facades\\Notification;
use Illuminate\\Support\\Facades\\Queue;
use Illuminate\\Support\\Facades\\Storage;

// Event::fake() = vi.mock + vi.fn для подій
Event::fake();
// ... дія ...
Event::assertDispatched(TaskCompleted::class);
Event::assertNotDispatched(TaskAssigned::class);

// Notification::fake() = vi.spyOn(notificationService)
Notification::fake();
// ... дія ...
Notification::assertSentTo(
    $user,
    TaskCompletedNotification::class,
    fn ($n) => $n->task->id === $task->id // callback
);
Notification::assertNothingSent();

// Queue::fake() = vi.mock('queue-service')
Queue::fake();
SendOverdueReminders::dispatch($user);
Queue::assertPushed(SendOverdueReminders::class);
Queue::assertPushed(SendOverdueReminders::class, 1); // рівно 1

// Storage::fake() = vi.mock('fs')
Storage::fake('public');
// ... upload ...
Storage::disk('public')->assertExists('attachments/file.jpg');
Storage::disk('public')->assertMissing('attachments/old.jpg');`

// === CodeBlock: fakes summary table ===
const fakesTableCode = `Fake                    Що перехоплює          Assert метод
──────────────────────────────────────────────────────────────────────
Event::fake()           dispatch подій         assertDispatched(Class)
                                               assertNotDispatched(Class)

Notification::fake()    $user->notify(...)     assertSentTo($user, Class)
                                               assertNothingSent()

Queue::fake()           dispatch джоб          assertPushed(Class)
                                               assertPushed(Class, 2)

Storage::fake('disk')   файлові операції       assertExists('path')
                                               assertMissing('path')

Mail::fake()            відправка пошти        assertSent(Class)
                                               assertNothingSent()

💡 Патерн однаковий: fake() → дія → assert*()
   Точно як vi.mock() → виклик → expect(fn).toHaveBeenCalled()`

// === CodeBlock: testing scopes ===
const scopeTestCode = `<?php
// tests/Unit/Models/TaskTest.php

use App\\Models\\Task;
use App\\Models\\User;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Task::scopeOverdue', function () {
    it('returns only overdue non-done tasks', function () {
        $user = User::factory()->create();

        // ✅ Прострочена pending → ПОВИННА бути
        $overdue = Task::factory()->create([
            'user_id' => $user->id,
            'status'  => 'pending',
            'deadline' => now()->subDays(3),
        ]);

        // ❌ Done з минулим дедлайном → НЕ повинна
        Task::factory()->create([
            'user_id' => $user->id,
            'status'  => 'done',
            'deadline' => now()->subDay(),
        ]);

        // ❌ Майбутній дедлайн → НЕ повинна
        Task::factory()->create([
            'user_id' => $user->id,
            'status'  => 'pending',
            'deadline' => now()->addWeek(),
        ]);

        $result = Task::overdue()->get();

        expect($result)->toHaveCount(1);
        expect($result->first()->id)->toBe($overdue->id);
    });
});

describe('Task::scopeSearch', function () {
    it('searches in title and description (case-insensitive)', function () {
        $user = User::factory()->create();

        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Buy Groceries',
            'description' => 'Milk and bread',
        ]);

        expect(Task::search('groceries')->count())->toBe(1); // title
        expect(Task::search('bread')->count())->toBe(1);     // description
        expect(Task::search('xyz')->count())->toBe(0);       // not found
    });
});`

// === CodeBlock: testing policy ===
const policyTestCode = `<?php
// tests/Unit/Policies/TaskPolicyTest.php

use App\\Models\\Task;
use App\\Models\\User;
use App\\Policies\\TaskPolicy;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

uses(RefreshDatabase::class);

describe('TaskPolicy', function () {
    beforeEach(function () {
        $this->policy   = new TaskPolicy();
        $this->owner    = User::factory()->create();
        $this->stranger = User::factory()->create();
        $this->task     = Task::factory()->create(['user_id' => $this->owner->id]);
    });

    it('allows owner to view', function () {
        expect($this->policy->view($this->owner, $this->task))->toBeTrue();
    });

    it('denies stranger from viewing', function () {
        expect($this->policy->view($this->stranger, $this->task))->toBeFalse();
    });

    it('allows owner to update', function () {
        expect($this->policy->update($this->owner, $this->task))->toBeTrue();
    });

    it('denies stranger from updating', function () {
        expect($this->policy->update($this->stranger, $this->task))->toBeFalse();
    });

    it('allows owner to delete', function () {
        expect($this->policy->delete($this->owner, $this->task))->toBeTrue();
    });

    it('denies stranger from deleting', function () {
        expect($this->policy->delete($this->stranger, $this->task))->toBeFalse();
    });
});

// Чистий Unit: створюємо Policy НАПРЯМУ, без HTTP.
// Кожен метод = один bool → швидко і точно.`

// === CodeBlock: testing observer with Event::fake ===
const observerTestCode = `<?php
// tests/Unit/Observers/TaskObserverTest.php

use App\\Models\\Task;
use App\\Models\\User;
use App\\Events\\TaskCompleted;
use Illuminate\\Support\\Facades\\Event;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

uses(RefreshDatabase::class);

describe('TaskObserver', function () {
    it('fires TaskCompleted when status → done', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status'  => 'in_progress',
        ]);

        // Observer.updated() спрацює автоматично:
        $task->update(['status' => 'done']);

        Event::assertDispatched(TaskCompleted::class, fn ($e) =>
            $e->task->id === $task->id
        );
    });

    it('does NOT fire TaskCompleted for title change', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status'  => 'pending',
        ]);

        $task->update(['title' => 'Renamed']);

        Event::assertNotDispatched(TaskCompleted::class);
    });

    it('does NOT fire for status → in_progress', function () {
        Event::fake();

        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'status'  => 'pending',
        ]);

        $task->update(['status' => 'in_progress']);

        Event::assertNotDispatched(TaskCompleted::class);
    });
});`

// === CodeBlock: Storage::fake + UploadedFile::fake ===
const storageFakeCode = `<?php
// tests/Feature/TaskFileUploadTest.php

use App\\Models\\Task;
use App\\Models\\User;
use Illuminate\\Http\\UploadedFile;
use Illuminate\\Support\\Facades\\Storage;

describe('Task file upload', function () {
    it('uploads image to fake storage', function () {
        Storage::fake('public'); // in-memory диск

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        // Тестовий файл (НЕ реальний — генерується в памʼяті)
        $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

        $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ])
            ->assertCreated();

        // Файл «зберігся» у fake storage
        Storage::disk('public')->assertExists(
            "attachments/{$file->hashName()}"
        );
    });

    it('rejects 20MB file (max:10240)', function () {
        Storage::fake('public');

        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('huge.pdf', 20000); // 20 MB

        $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/attachments", [
                'file' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);

        // Файл НЕ зберігся
        Storage::disk('public')->assertDirectoryEmpty('attachments');
    });
});

// UploadedFile::fake() — генератор тестових файлів:
UploadedFile::fake()->image('photo.jpg', 800, 600);     // зображення
UploadedFile::fake()->create('doc.pdf', 500);             // 500 KB PDF
UploadedFile::fake()->create('data.csv', 100, 'text/csv'); // з MIME`

// === Practice: simulated fakes ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо Laravel Fakes (Event::fake, Notification::fake, Storage::fake)
// на чистому PHP — показуємо механіку "запис → assert".

// ===== Fake Event Bus =====
class FakeEventBus
{
    private array $dispatched = [];

    public function dispatch(string $eventClass, array $payload = []): void {
        $this->dispatched[] = ['class' => $eventClass, 'payload' => $payload];
    }

    public function assertDispatched(string $class, ?callable $cb = null): bool {
        foreach ($this->dispatched as $e) {
            if ($e['class'] === $class) {
                if ($cb === null || $cb($e['payload'])) { return true; }
            }
        }
        throw new \\Exception("assertDispatched({$class}) failed — not found");
    }

    public function assertNotDispatched(string $class): bool {
        foreach ($this->dispatched as $e) {
            if ($e['class'] === $class) {
                throw new \\Exception("assertNotDispatched({$class}) failed — WAS dispatched");
            }
        }
        return true;
    }
}

// ===== Fake Notification Store =====
class FakeNotifications
{
    private array $sent = []; // [userId => [class => ...]]

    public function sendTo(int $userId, string $class, array $data = []): void {
        $this->sent[$userId][] = ['class' => $class, 'data' => $data];
    }

    public function assertSentTo(int $userId, string $class): bool {
        foreach ($this->sent[$userId] ?? [] as $n) {
            if ($n['class'] === $class) { return true; }
        }
        throw new \\Exception("assertSentTo(user={$userId}, {$class}) — not found");
    }

    public function assertNothingSent(): bool {
        if (! empty($this->sent)) {
            throw new \\Exception("assertNothingSent() failed — " . count($this->sent) . " sent");
        }
        return true;
    }
}

// ===== Fake Storage =====
class FakeStorage
{
    private array $files = [];

    public function put(string $path, string $content): void { $this->files[$path] = $content; }
    public function exists(string $path): bool { return isset($this->files[$path]); }
    public function assertExists(string $path): bool {
        if (! $this->exists($path)) { throw new \\Exception("assertExists({$path}) — missing"); }
        return true;
    }
    public function assertMissing(string $path): bool {
        if ($this->exists($path)) { throw new \\Exception("assertMissing({$path}) — exists"); }
        return true;
    }
}

// ===== Mini test runner =====
$passed = 0; $failed = 0;

function it(string $name, callable $fn): void {
    global $passed, $failed;
    try { $fn(); $passed++; echo "  ✓ {$name}\\n"; }
    catch (\\Exception $e) { $failed++; echo "  ✗ {$name} — {$e->getMessage()}\\n"; }
}

// ===== «TaskObserver + Listener» логіка =====
function simulateTaskUpdate(
    array $oldTask, array $newTask,
    FakeEventBus $events, FakeNotifications $notifications
): void {
    // Observer::updated — wasChanged('status') && status === 'done'?
    if (($oldTask['status'] ?? null) !== ($newTask['status'] ?? null)
        && $newTask['status'] === 'done'
    ) {
        $events->dispatch('TaskCompleted', ['task_id' => $newTask['id']]);

        // Listener: send notification
        $notifications->sendTo($newTask['user_id'], 'TaskCompletedNotification', [
            'task_id' => $newTask['id'],
        ]);
    }
}

// ===== Тести (аналог Pest + Fakes) =====

echo "=== Unit Tests with Fakes ===\\n\\n";

it('dispatches TaskCompleted when status → done', function () {
    $events = new FakeEventBus();
    $notifications = new FakeNotifications();

    $old = ['id' => 1, 'status' => 'pending', 'user_id' => 7];
    $new = ['id' => 1, 'status' => 'done',    'user_id' => 7];

    simulateTaskUpdate($old, $new, $events, $notifications);

    $events->assertDispatched('TaskCompleted');
    $notifications->assertSentTo(7, 'TaskCompletedNotification');
});

it('does NOT dispatch for title change', function () {
    $events = new FakeEventBus();
    $notifications = new FakeNotifications();

    $old = ['id' => 1, 'status' => 'pending', 'user_id' => 7];
    $new = ['id' => 1, 'status' => 'pending', 'user_id' => 7]; // status not changed

    simulateTaskUpdate($old, $new, $events, $notifications);

    $events->assertNotDispatched('TaskCompleted');
    $notifications->assertNothingSent();
});

it('does NOT dispatch for status → in_progress', function () {
    $events = new FakeEventBus();
    $notifications = new FakeNotifications();

    $old = ['id' => 2, 'status' => 'pending',     'user_id' => 7];
    $new = ['id' => 2, 'status' => 'in_progress', 'user_id' => 7];

    simulateTaskUpdate($old, $new, $events, $notifications);

    $events->assertNotDispatched('TaskCompleted');
});

it('Storage::fake — upload + assertExists + assertMissing', function () {
    $storage = new FakeStorage();

    // Upload файл
    $storage->put('attachments/photo.jpg', 'JPEG-BYTES');

    $storage->assertExists('attachments/photo.jpg'); // ✓
    $storage->assertMissing('attachments/other.jpg'); // ✓
});

it('TaskPolicy — owner vs stranger', function () {
    $ownerId  = 1;
    $strangerId = 2;
    $task = ['id' => 10, 'user_id' => $ownerId];

    // Policy::update
    $ownerCan    = ($task['user_id'] === $ownerId);
    $strangerCan = ($task['user_id'] === $strangerId);

    if (!$ownerCan) { throw new \\Exception('Owner should be allowed'); }
    if ($strangerCan) { throw new \\Exception('Stranger should be denied'); }
});

echo "\\n=== {$passed} passed, {$failed} failed ===\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте FakeEventBus + FakeNotifications + Observer-тести.
 *
 * 3 класи + 1 функція:
 *
 *   1) class FakeEventBus
 *      - dispatch(string $class, array $payload = []): void — записує
 *      - assertDispatched(string $class): bool — true або throw Exception
 *      - assertNotDispatched(string $class): bool
 *
 *   2) class FakeNotifications
 *      - sendTo(int $userId, string $class, array $data = []): void
 *      - assertSentTo(int $userId, string $class): bool
 *      - assertNothingSent(): bool
 *
 *   3) class FakeStorage
 *      - put(string $path, string $content): void
 *      - assertExists(string $path): bool
 *      - assertMissing(string $path): bool
 *
 *   4) function observerUpdated(array $old, array $new, FakeEventBus $events, FakeNotifications $notif): void
 *      - якщо status змінився І new.status === 'done' → dispatch + sendTo
 *      - інакше — нічого
 */

class FakeEventBus {
    // Ваш код тут
}

class FakeNotifications {
    // Ваш код тут
}

class FakeStorage {
    // Ваш код тут
}

function observerUpdated(array $old, array $new, FakeEventBus $events, FakeNotifications $notif): void {
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 8;

$p = 0; $f = 0;
function check(string $name, bool $ok): void {
    global $pass, $total;
    if ($ok) { $pass++; echo "✓ {$name}\\n"; }
    else     { echo "✗ {$name}\\n"; }
}

// 1. FakeEventBus::dispatch + assertDispatched
$eb = new FakeEventBus();
$eb->dispatch('TaskCompleted', ['id' => 1]);
try { $eb->assertDispatched('TaskCompleted'); check('EventBus: assertDispatched', true); }
catch (\\Exception $e) { check('EventBus: assertDispatched', false); }

// 2. FakeEventBus::assertNotDispatched
try { $eb->assertNotDispatched('TaskAssigned'); check('EventBus: assertNotDispatched', true); }
catch (\\Exception $e) { check('EventBus: assertNotDispatched', false); }

// 3. assertNotDispatched FAILS when dispatched
try { $eb->assertNotDispatched('TaskCompleted'); check('EventBus: assertNotDispatched throws', false); }
catch (\\Exception $e) { check('EventBus: assertNotDispatched throws on dispatched', true); }

// 4. FakeNotifications::sendTo + assertSentTo
$fn = new FakeNotifications();
$fn->sendTo(7, 'TaskCompletedNotification', ['id' => 1]);
try { $fn->assertSentTo(7, 'TaskCompletedNotification'); check('Notifications: assertSentTo', true); }
catch (\\Exception $e) { check('Notifications: assertSentTo', false); }

// 5. FakeNotifications::assertNothingSent FAILS when sent
try { $fn->assertNothingSent(); check('Notifications: assertNothingSent throws', false); }
catch (\\Exception $e) { check('Notifications: assertNothingSent throws when sent', true); }

// 6. FakeStorage::put + assertExists + assertMissing
$fs = new FakeStorage();
$fs->put('attachments/photo.jpg', 'bytes');
try {
    $fs->assertExists('attachments/photo.jpg');
    $fs->assertMissing('attachments/other.jpg');
    check('Storage: assertExists + assertMissing', true);
} catch (\\Exception $e) { check('Storage: assertExists + assertMissing', false); }

// 7. observerUpdated: status → done → dispatch + notify
$eb2 = new FakeEventBus();
$fn2 = new FakeNotifications();
observerUpdated(
    ['id' => 5, 'status' => 'pending', 'user_id' => 3],
    ['id' => 5, 'status' => 'done',    'user_id' => 3],
    $eb2, $fn2
);
try {
    $eb2->assertDispatched('TaskCompleted');
    $fn2->assertSentTo(3, 'TaskCompletedNotification');
    check('Observer: status→done → dispatch+notify', true);
} catch (\\Exception $e) { check('Observer: status→done → dispatch+notify', false); }

// 8. observerUpdated: title change only → nothing
$eb3 = new FakeEventBus();
$fn3 = new FakeNotifications();
observerUpdated(
    ['id' => 6, 'status' => 'pending', 'user_id' => 3],
    ['id' => 6, 'status' => 'pending', 'user_id' => 3],
    $eb3, $fn3
);
try {
    $eb3->assertNotDispatched('TaskCompleted');
    $fn3->assertNothingSent();
    check('Observer: no status change → nothing dispatched', true);
} catch (\\Exception $e) { check('Observer: no status change', false); }

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="vi.mock() / vi.fn() / vi.spyOn()"
        to="Event::fake() / Notification::fake() / Storage::fake()"
      />

      <TheoryBlock title="Feature vs Unit — коли що">
        <p>
          <strong>Feature</strong> (Урок 19) — повний HTTP-цикл, як Cypress E2E. Ловить баги
          інтеграції, але повільніший. <strong>Unit</strong> — ізольований виклик одного методу
          (scope, policy, observer). Як Vitest для окремого composable — швидший і точніший.
        </p>
        <p>
          <strong>Золоте правило:</strong> Feature для CRUD + auth (критичні потоки); Unit для
          складної бізнес-логіки (scopes, policies, observers, services).
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsVitest"
        :php="phpFakes"
        js-title="Vitest — vi.mock / vi.fn / vi.spyOn"
        php-title="Laravel — fake() → дія → assert*()"
      />

      <TheoryBlock title="Fakes — елегантний мокінг Laravel">
        <p>
          <code>fake()</code> робить дві речі: (1) перехоплює — реальний код НЕ виконується (email
          не летить, файл не записується); (2) записує що було викликано — потім перевіряємо через
          <code>assert*()</code>. Патерн однаковий для всіх:
          <code>Facade::fake() → дія → Facade::assertDispatched()</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="fakesTableCode" lang="text" title="Зведена таблиця Fakes — 5 фасадів" />

      <TheoryBlock title="Тестування Model Scopes — Pinia getter для бази">
        <p>
          Scope — це метод на моделі, що додає WHERE-умову. У Vue це як Pinia getter з фільтром.
          Тестуємо Unit: створюємо записи через Factory з різними status/deadline → викликаємо
          <code>Task::overdue()->get()</code> → перевіряємо кількість і id.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="scopeTestCode"
        lang="php"
        title="Unit-тести для scopeOverdue + scopeSearch"
      />

      <TheoryBlock title="Тестування Policy — критичний код безпеки">
        <p>
          Policy — найважливіший код для тестування: помилка тут = витік даних. Чистий Unit:
          створюємо <code>new TaskPolicy()</code> напряму, викликаємо методи з <code>owner</code> та
          <code>stranger</code> — очікуємо <code>true/false</code>. Без HTTP, без контролера —
          максимально швидко і точно.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="policyTestCode"
        lang="php"
        title="TaskPolicyTest — owner vs stranger для кожного методу"
      />

      <TheoryBlock title="Тестування Observer через Event::fake()">
        <p>
          Observer реагує на зміни моделі. Тестуємо: <code>Event::fake()</code> →
          <code>$task->update(['status' => 'done'])</code> → Observer спрацює автоматично →
          <code>Event::assertDispatched(TaskCompleted::class)</code>. Обовʼязково 3 тести:
          status→done (диспатч), title change (НЕ диспатч), status→in_progress (НЕ диспатч).
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="observerTestCode"
        lang="php"
        title="TaskObserverTest — 3 сценарії з Event::fake"
      />

      <TheoryBlock title="Storage::fake + UploadedFile::fake — файли без диску">
        <p>
          <code>Storage::fake('public')</code> створює in-memory диск.
          <code>UploadedFile::fake()->image('photo.jpg', 800, 600)</code> генерує тестовий файл.
          Після тесту — нічого на реальному диску. <code>assertExists()</code> /
          <code>assertMissing()</code> / <code>assertDirectoryEmpty()</code> перевіряють стан фейку.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="storageFakeCode"
        lang="php"
        title="Storage::fake + UploadedFile::fake — upload + validation"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: FakeEventBus + FakeNotifications + FakeStorage">
        <p>
          У playground ми <strong>самі реалізуємо</strong> механіку <code>fake()</code> — три класи
          з <code>dispatch/assertDispatched</code>, <code>sendTo/assertSentTo</code>,
          <code>put/assertExists</code>. Потім пишемо тести, які використовують ці fakes: Observer
          при status→done, Observer при title change, Policy owner vs stranger, Storage upload.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/20-unit-tests.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="4-20" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте Fake-класи + Observer-тест">
        <p>
          Реалізуйте 3 Fake-класи (<code>FakeEventBus</code>, <code>FakeNotifications</code>,
          <code>FakeStorage</code>) та функцію <code>observerUpdated</code>. Натисніть
          <strong>«Запустити»</strong> — 8 тестів перевірять: dispatch + assertDispatched,
          assertNotDispatched throw, sendTo + assertSentTo, assertNothingSent throw, Storage
          exists/missing, Observer status→done dispatch+notify, Observer no-change nothing.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте Fakes + Observer-логіку"
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
