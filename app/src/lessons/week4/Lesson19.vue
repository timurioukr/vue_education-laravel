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
    question: 'Що робить трейт RefreshDatabase у тестах?',
    options: [
      'Видаляє всі файли міграцій',
      'Скидає базу до початкового стану перед КОЖНИМ тестом (через транзакцію → rollback)',
      'Створює нову базу даних',
      'Виконує rollback останньої міграції',
    ],
    correct: 1,
    explanation:
      'RefreshDatabase відкриває SQL-транзакцію перед кожним тестом і робить rollback після нього. Тому дані, створені в тесті, НЕ впливають на наступні тести. Це аналог beforeEach(() => store.$reset()) у Vitest — гарантія чистого стану. З SQLite :memory: це працює ще швидше.',
  },
  {
    question: 'Як аутентифікуватись у Feature-тесті від імені конкретного користувача?',
    options: [
      '$this->login($user)',
      "$this->withToken('abc123')",
      '$this->actingAs($user)',
      'Auth::login($user) перед кожним запитом',
    ],
    correct: 2,
    explanation:
      'actingAs($user) — метод Laravel TestCase, що підставляє Sanctum-токен автоматично. Не потрібно створювати токен, додавати Bearer-header — усе під капотом. У ланцюжку: $this->actingAs($user)->getJson("/api/tasks")->assertOk(). Це аналог vi.mock("stores/auth") у Vitest, тільки простіше.',
  },
  {
    question: 'Чим getJson() відрізняється від get() у тестах?',
    options: [
      'Нічим — це аліаси',
      'getJson() автоматично додає Accept: application/json header → Laravel повертає JSON, а не HTML',
      'getJson() працює тільки з JSON-файлами',
      'get() швидший',
    ],
    correct: 1,
    explanation:
      'Без Accept: application/json Laravel при 404/500 може повернути HTML-сторінку помилки замість JSON. getJson() гарантує JSON-відповідь. Те саме для postJson(), putJson(), deleteJson(). Це схоже на те, як у фронт-тестах ви мокаєте axios з правильними headers.',
  },
  {
    question:
      'Який assertion перевіряє, що відповідь 422 містить помилку валідації для поля title?',
    options: [
      "assertJsonError('title')",
      "assertHasError('title')",
      "assertJsonValidationErrors(['title'])",
      "assertValidationFails('title')",
    ],
    correct: 2,
    explanation:
      "assertJsonValidationErrors(['title']) перевіряє, що JSON-відповідь має поле errors.title. Протилежний: assertJsonMissingValidationErrors(['title']) — поле НЕ має помилки. Для перевірки конкретного тексту помилки: assertJsonValidationErrors(['title' => 'The title field is required.']).",
  },
  {
    question: 'Що робить ->with([...]) у Pest-тесті?',
    options: [
      'Передає middleware',
      'Задає eager loading для моделей',
      'Додає HTTP-заголовки до запиту',
      'Надає dataset (набори тестових даних) для параметризованого тесту — аналог it.each() у Vitest',
    ],
    correct: 3,
    explanation:
      "->with([...]) — Pest dataset. Кожен елемент масиву стає окремим прогоном тесту з різними аргументами. Зручно для валідації: один тест перевіряє і «порожній title», і «title > 255», і «невалідний status» — без дублювання коду. Кожен прогон отримує окреме ім'я у виводі.",
  },
]

// === CodeComparison: Vitest vs Pest ===
const jsVitest = `// Vitest (JavaScript) — тестування API через mock
import { describe, it, expect, beforeEach } from 'vitest'

describe('TaskList', () => {
  beforeEach(() => {
    // Скидаємо стан перед кожним тестом
    store.$reset()
    localStorage.clear()
  })

  it('renders tasks', () => {
    const result = getTaskList()
    expect(result).toHaveLength(5)
    expect(result[0].title).toBe('Buy milk')
  })

  it('filters by status', async () => {
    const wrapper = mount(TaskList, {
      props: { status: 'pending' },
    })
    // ... assert DOM
  })
})

// Mock auth:
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 1, name: 'Test' },
    isAuthenticated: true,
  }),
}))

// Mock data:
const mockTask = {
  id: 1, title: 'Buy milk',
  status: 'pending', userId: 1,
}

// Параметризований тест:
it.each([
  [{ title: '' }, 'title'],
  [{ status: 'bad' }, 'status'],
])('rejects %o → error %s', (data, field) => {
  // ...
})`

const phpPest = `<?php
// Pest (PHP) — практично той самий API!

use App\\Models\\Task;
use App\\Models\\User;

describe('TaskController@index', function () {
    // beforeEach — як у Vitest
    beforeEach(function () {
        $this->user = User::factory()->create();
    });

    it('returns paginated list', function () {
        Task::factory()->count(5)->create([
            'user_id' => $this->user->id,
        ]);

        $this->actingAs($this->user) // ← замість vi.mock auth
            ->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(5, 'data');
    });

    it('filters by status', function () {
        Task::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($this->user)
            ->getJson('/api/tasks?status=pending')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    });
});

// Factories замість mock data:
$task = Task::factory()->create([
    'title' => 'Buy milk',
    'status' => 'pending',
]);

// Dataset замість it.each():
it('rejects invalid data', function ($data, $field) {
    $user = User::factory()->create();
    $this->actingAs($user)
        ->postJson('/api/tasks', $data)
        ->assertStatus(422)
        ->assertJsonValidationErrors([$field]);
})->with([
    'empty title' => [['title' => ''], 'title'],
    'bad status'  => [['status' => 'bad'], 'status'],
]);`

// === CodeBlock: project structure ===
const structureCode = `tests/
├── Feature/              ← HTTP-тести (повний цикл: request → controller → response)
│   ├── Auth/
│   │   └── AuthControllerTest.php
│   └── Task/
│       └── TaskControllerTest.php
├── Unit/                 ← ізольована логіка (моделі, скоупи, сервіси)
│   ├── Models/
│   │   └── TaskTest.php
│   └── Policies/
│       └── TaskPolicyTest.php
├── Pest.php              ← глобальна конфігурація (RefreshDatabase, TestCase)
└── TestCase.php          ← базовий клас

# Feature = Cypress/Playwright E2E (але без браузера)
# Unit    = Vitest для окремого composable/helper

# Запуск:
php artisan test                                     # усі
php artisan test --testsuite=Feature                 # лише Feature
php artisan test tests/Feature/TaskControllerTest.php # один файл
php artisan test --filter="can create task"           # один тест`

// === CodeBlock: Pest.php config ===
const pestConfigCode = `<?php
// tests/Pest.php — глобальна конфігурація

use Illuminate\\Foundation\\Testing\\RefreshDatabase;

pest()->extends(Tests\\TestCase::class)
    ->use(RefreshDatabase::class)   // ← rollback після кожного тесту
    ->in('Feature');                // ← тільки для Feature-тестів

// phpunit.xml — SQLite in-memory (швидкість):
// <env name="DB_CONNECTION" value="sqlite"/>
// <env name="DB_DATABASE" value=":memory:"/>
// <env name="BCRYPT_ROUNDS" value="4"/>     ← хешування пароля у 3× швидше
// <env name="QUEUE_CONNECTION" value="sync"/> ← Jobs виконуються одразу`

// === CodeBlock: Factory ===
const factoryCode = `<?php
// database/factories/TaskFactory.php

namespace Database\\Factories;

use App\\Models\\Task;
use App\\Models\\User;
use App\\Models\\Category;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'title'       => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status'      => fake()->randomElement(['pending', 'in_progress', 'done']),
            'priority'    => fake()->randomElement(['low', 'medium', 'high']),
            'deadline'    => fake()->optional()->dateTimeBetween('now', '+30 days'),
            'user_id'     => User::factory(),      // автоматично створить User
            'category_id' => Category::factory(),   // автоматично створить Category
        ];
    }

    // States — конкретні сценарії:
    public function completed(): static {
        return $this->state(fn () => ['status' => 'done']);
    }

    public function overdue(): static {
        return $this->state(fn () => [
            'status'   => 'pending',
            'deadline' => now()->subDays(3),
        ]);
    }
}

// Використання у тестах:
Task::factory()->create();                              // один запис
Task::factory()->count(5)->create();                    // 5 записів
Task::factory()->create(['title' => 'Specific title']); // з конкретним полем
Task::factory()->overdue()->create(['user_id' => $user->id]); // state + owner
Task::factory()->make();                                // БЕЗ збереження в БД (mock data)`

// === CodeBlock: assertions ===
const assertionsCode = `<?php

$response = $this->actingAs($user)->getJson('/api/tasks');

// === HTTP-статус ===
$response->assertStatus(200);       // конкретний
$response->assertOk();              // 200
$response->assertCreated();         // 201
$response->assertNoContent();       // 204
$response->assertUnauthorized();    // 401
$response->assertForbidden();       // 403
$response->assertNotFound();        // 404
$response->assertUnprocessable();   // 422

// === JSON-тіло ===
$response->assertJson(['data' => [['title' => 'My task']]]);

// === Структура (ключі без значень) ===
$response->assertJsonStructure([
    'data' => ['*' => ['id', 'title', 'status', 'priority', 'created_at']],
    'links', 'meta',
]);

// === Кількість ===
$response->assertJsonCount(5, 'data');

// === Конкретне значення за шляхом ===
$response->assertJsonPath('data.0.title', 'My task');
$response->assertJsonPath('meta.total', 20);

// === Валідація ===
$response->assertJsonValidationErrors(['title']);
$response->assertJsonMissingValidationErrors(['status']);

// === База даних ===
$this->assertDatabaseHas('tasks', ['title' => 'New task', 'user_id' => $user->id]);
$this->assertDatabaseMissing('tasks', ['title' => 'Hacked title']);
$this->assertDatabaseCount('tasks', 5);`

// === CodeBlock: full TaskControllerTest example ===
const fullTestCode = `<?php
// tests/Feature/TaskControllerTest.php

use App\\Models\\Task;
use App\\Models\\User;

describe('TaskController@store', function () {
    it('creates task with valid data', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/tasks', [
                'title'    => 'New important task',
                'status'   => 'pending',
                'priority' => 'high',
            ])
            ->assertCreated()                                    // 201
            ->assertJsonPath('data.title', 'New important task') // значення
            ->assertJsonPath('data.status', 'pending');

        // Задача зʼявилась у БД?
        $this->assertDatabaseHas('tasks', [
            'title'   => 'New important task',
            'user_id' => $user->id,
        ]);
    });

    it('forbids updating others task', function () {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        $task  = Task::factory()->create(['user_id' => $other->id]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", ['title' => 'Hacked'])
            ->assertForbidden();   // 403 — Policy заблокувала

        // Назва НЕ змінилась:
        $this->assertDatabaseMissing('tasks', [
            'id' => $task->id, 'title' => 'Hacked',
        ]);
    });

    // Dataset — один тест → кілька наборів даних:
    it('rejects invalid data', function (array $data, string $field) {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/tasks', $data)
            ->assertStatus(422)
            ->assertJsonValidationErrors([$field]);
    })->with([
        'empty title'    => [['title' => '', 'status' => 'pending'], 'title'],
        'title too long' => [['title' => str_repeat('a', 256), 'status' => 'pending'], 'title'],
        'bad status'     => [['title' => 'OK', 'status' => 'invalid'], 'status'],
    ]);
});`

// === Practice: simulated test runner ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо Pest/Vitest test runner на чистому PHP.
// Показує: describe → it → assertions → RefreshDatabase (очистка між тестами).

// ===== Мініатюрний тест-раннер =====
$tests       = [];
$passed      = 0;
$failed      = 0;
$currentDesc = '';

function describe(string $name, callable $fn): void {
    global $currentDesc;
    $currentDesc = $name;
    $fn();
    $currentDesc = '';
}

function it(string $name, callable $fn): void {
    global $tests, $passed, $failed, $currentDesc;
    $label = $currentDesc ? "{$currentDesc} → {$name}" : $name;
    try {
        $fn();
        $passed++;
        echo "  ✓ {$label}\\n";
    } catch (\\Exception $e) {
        $failed++;
        echo "  ✗ {$label} — {$e->getMessage()}\\n";
    }
}

function assertEqual(mixed $actual, mixed $expected, string $msg = ''): void {
    if ($actual !== $expected) {
        $a = json_encode($actual);
        $e = json_encode($expected);
        throw new \\Exception("{$msg} expected {$e}, got {$a}");
    }
}

function assertContains(array $haystack, mixed $needle, string $msg = ''): void {
    if (! in_array($needle, $haystack, true)) {
        throw new \\Exception("{$msg} array does not contain " . json_encode($needle));
    }
}

// ===== In-memory «API + DB» =====
$db = ['tasks' => [], 'users' => []];
$nextId = 1;
$currentUser = null;

function refreshDatabase(): void {
    global $db, $nextId, $currentUser;
    $db = ['tasks' => [], 'users' => []];
    $nextId = 1;
    $currentUser = null;
}

function factory_user(string $name = 'Test'): array {
    global $db, $nextId;
    $u = ['id' => $nextId++, 'name' => $name];
    $db['users'][] = $u;
    return $u;
}

function factory_task(int $userId, array $data = []): array {
    global $db, $nextId;
    $t = array_merge([
        'id' => $nextId++, 'user_id' => $userId,
        'title' => 'Task ' . $nextId, 'status' => 'pending',
    ], $data);
    $db['tasks'][] = $t;
    return $t;
}

function actingAs(array $user): void {
    global $currentUser;
    $currentUser = $user;
}

function apiGetTasks(?string $status = null): array {
    global $db, $currentUser;
    if (! $currentUser) { return ['status' => 401, 'body' => ['message' => 'Unauthenticated.']]; }
    $tasks = array_values(array_filter($db['tasks'], fn ($t) =>
        $t['user_id'] === $currentUser['id']
        && (! $status || $t['status'] === $status)
    ));
    return ['status' => 200, 'body' => ['data' => $tasks, 'meta' => ['total' => count($tasks)]]];
}

function apiCreateTask(array $data): array {
    global $db, $nextId, $currentUser;
    if (! $currentUser) { return ['status' => 401, 'body' => ['message' => 'Unauthenticated.']]; }
    $errors = [];
    if (empty($data['title'])) { $errors['title'] = ['The title field is required.']; }
    if (strlen($data['title'] ?? '') > 255) { $errors['title'] = ['The title may not be greater than 255 characters.']; }
    if (! empty($errors)) { return ['status' => 422, 'body' => ['errors' => $errors]]; }
    $t = ['id' => $nextId++, 'user_id' => $currentUser['id'], 'title' => $data['title'], 'status' => $data['status'] ?? 'pending'];
    $db['tasks'][] = $t;
    return ['status' => 201, 'body' => ['data' => $t]];
}

function apiUpdateTask(int $id, array $data): array {
    global $db, $currentUser;
    if (! $currentUser) { return ['status' => 401, 'body' => ['message' => 'Unauthenticated.']]; }
    foreach ($db['tasks'] as &$t) {
        if ($t['id'] === $id) {
            if ($t['user_id'] !== $currentUser['id']) { return ['status' => 403, 'body' => ['message' => 'Forbidden']]; }
            $t = array_merge($t, $data);
            return ['status' => 200, 'body' => ['data' => $t]];
        }
    }
    return ['status' => 404, 'body' => ['message' => 'Not found']];
}

// ===== Тести (як у Pest) =====

echo "=== TaskController Feature Tests ===\\n\\n";

describe('TaskController@index', function () {
    it('returns list of own tasks', function () {
        refreshDatabase();
        $user = factory_user('Alice');
        factory_task($user['id'], ['title' => 'A1']);
        factory_task($user['id'], ['title' => 'A2']);
        factory_task(999, ['title' => 'Other user task']);
        actingAs($user);

        $r = apiGetTasks();
        assertEqual($r['status'], 200, 'status');
        assertEqual(count($r['body']['data']), 2, 'count own tasks');
    });

    it('filters by status', function () {
        refreshDatabase();
        $user = factory_user();
        factory_task($user['id'], ['status' => 'pending']);
        factory_task($user['id'], ['status' => 'done']);
        factory_task($user['id'], ['status' => 'pending']);
        actingAs($user);

        $r = apiGetTasks('pending');
        assertEqual(count($r['body']['data']), 2, 'pending count');
    });

    it('requires authentication', function () {
        refreshDatabase();
        $r = apiGetTasks();
        assertEqual($r['status'], 401, 'unauthenticated');
    });
});

describe('TaskController@store', function () {
    it('creates task with valid data', function () {
        refreshDatabase();
        $user = factory_user();
        actingAs($user);

        $r = apiCreateTask(['title' => 'New task', 'status' => 'pending']);
        assertEqual($r['status'], 201, 'created');
        assertEqual($r['body']['data']['title'], 'New task', 'title');
    });

    it('rejects empty title (422)', function () {
        refreshDatabase();
        $user = factory_user();
        actingAs($user);

        $r = apiCreateTask(['title' => '', 'status' => 'pending']);
        assertEqual($r['status'], 422, 'validation');
        assertEqual(isset($r['body']['errors']['title']), true, 'has title error');
    });
});

describe('TaskController@update', function () {
    it('forbids updating others task', function () {
        refreshDatabase();
        $alice = factory_user('Alice');
        $bob   = factory_user('Bob');
        $task  = factory_task($alice['id'], ['title' => 'Alice task']);
        actingAs($bob);

        $r = apiUpdateTask($task['id'], ['title' => 'Hacked']);
        assertEqual($r['status'], 403, 'forbidden');
    });
});

echo "\\n=== Результат: {$passed} passed, {$failed} failed ===\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: напишіть Feature-тести для CategoryController.
 *
 * Реалізуйте in-memory API та 6 тестів, що покривають:
 *   - index (тільки свої категорії)
 *   - store (валідація: порожнє імʼя → 422)
 *   - store (дублікат імені для того ж user → 422)
 *   - show (403 для чужої категорії)
 *   - update (власна категорія → 200)
 *   - destroy (204 + видалення з БД)
 */

// Mini test-runner (вже готовий)
$passed = 0; $failed = 0;

function it(string $name, callable $fn): void {
    global $passed, $failed;
    try { $fn(); $passed++; echo "  ✓ {$name}\\n"; }
    catch (\\Exception $e) { $failed++; echo "  ✗ {$name} — {$e->getMessage()}\\n"; }
}

function assertEqual(mixed $a, mixed $b, string $msg = ''): void {
    if ($a !== $b) { throw new \\Exception("{$msg}: expected " . json_encode($b) . ", got " . json_encode($a)); }
}

// In-memory DB
$db = ['categories' => [], 'users' => []];
$nextId = 1;
$currentUser = null;

function refreshDB(): void {
    global $db, $nextId, $currentUser;
    $db = ['categories' => [], 'users' => []]; $nextId = 1; $currentUser = null;
}
function mkUser(string $n = 'Test'): array {
    global $db, $nextId; $u = ['id' => $nextId++, 'name' => $n]; $db['users'][] = $u; return $u;
}
function mkCat(int $uid, string $name): array {
    global $db, $nextId; $c = ['id' => $nextId++, 'user_id' => $uid, 'name' => $name];
    $db['categories'][] = $c; return $c;
}
function actAs(array $u): void { global $currentUser; $currentUser = $u; }

/**
 * Реалізуйте ці 4 функції — API для категорій:
 *
 * apiListCategories(): array
 *   - без auth → 401
 *   - повертає тільки категорії currentUser
 *   - формат: ['status' => 200, 'body' => ['data' => [...]]]
 */
function apiListCategories(): array {
    // Ваш код тут
}

/**
 * apiCreateCategory(array $data): array
 *   - без auth → 401
 *   - $data['name'] порожній → 422 з errors.name
 *   - дублікат name для того ж user → 422 з errors.name
 *   - ОК → 201, додає в $db['categories']
 */
function apiCreateCategory(array $data): array {
    // Ваш код тут
}

/**
 * apiShowCategory(int $id): array
 *   - без auth → 401
 *   - не існує → 404
 *   - чужа → 403
 *   - своя → 200
 */
function apiShowCategory(int $id): array {
    // Ваш код тут
}

/**
 * apiDeleteCategory(int $id): array
 *   - без auth → 401
 *   - чужа → 403
 *   - своя → 204, видалити з $db
 */
function apiDeleteCategory(int $id): array {
    // Ваш код тут
}`

const taskTestCode = `
// === Feature-тести для CategoryController ===
echo "\\n=== CategoryController Tests ===\\n";

it('index returns only own categories', function () {
    refreshDB();
    $alice = mkUser('Alice'); $bob = mkUser('Bob');
    mkCat($alice['id'], 'Work'); mkCat($alice['id'], 'Home');
    mkCat($bob['id'], 'Bob Stuff');
    actAs($alice);
    $r = apiListCategories();
    assertEqual($r['status'], 200, 'status');
    assertEqual(count($r['body']['data']), 2, 'own count');
});

it('index requires auth (401)', function () {
    refreshDB();
    $r = apiListCategories();
    assertEqual($r['status'], 401, 'unauth');
});

it('store rejects empty name (422)', function () {
    refreshDB(); $u = mkUser(); actAs($u);
    $r = apiCreateCategory(['name' => '']);
    assertEqual($r['status'], 422, 'status');
    assertEqual(isset($r['body']['errors']['name']), true, 'has name error');
});

it('store rejects duplicate name for same user (422)', function () {
    refreshDB(); $u = mkUser(); actAs($u);
    mkCat($u['id'], 'Work');
    $r = apiCreateCategory(['name' => 'Work']);
    assertEqual($r['status'], 422, 'duplicate');
});

it('store creates category (201)', function () {
    refreshDB(); $u = mkUser(); actAs($u);
    $r = apiCreateCategory(['name' => 'Personal']);
    assertEqual($r['status'], 201, 'created');
    assertEqual($r['body']['data']['name'], 'Personal', 'name');
    // Check DB
    global $db;
    assertEqual(count($db['categories']), 1, 'db count');
});

it('show returns 403 for others category', function () {
    refreshDB();
    $alice = mkUser('Alice'); $bob = mkUser('Bob');
    $c = mkCat($alice['id'], 'Private');
    actAs($bob);
    $r = apiShowCategory($c['id']);
    assertEqual($r['status'], 403, 'forbidden');
});

it('show returns own category (200)', function () {
    refreshDB(); $u = mkUser(); actAs($u);
    $c = mkCat($u['id'], 'Mine');
    $r = apiShowCategory($c['id']);
    assertEqual($r['status'], 200, 'ok');
    assertEqual($r['body']['data']['name'], 'Mine', 'name');
});

it('destroy removes category (204)', function () {
    refreshDB(); $u = mkUser(); actAs($u);
    $c = mkCat($u['id'], 'ToDelete');
    $r = apiDeleteCategory($c['id']);
    assertEqual($r['status'], 204, 'no content');
    global $db;
    assertEqual(count($db['categories']), 0, 'removed from db');
});

echo "\\nРезультат: {$passed} passed, {$failed} failed\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="Vitest it() / expect() / describe() / beforeEach()"
        to="Pest it() / expect() / describe() / beforeEach() — майже ідентичний API"
      />

      <TheoryBlock title="Навіщо тестувати API — впевненість, документація, регресії">
        <p>
          Уявіть: ви рефакторите <code>TaskController</code>, оптимізуєте запити — і фронтенд каже
          «API повертає інший формат». Тести вирішують 3 проблеми: <strong>впевненість</strong> при
          рефакторингу (змінив → тести зелені → ok), <strong>документація</strong> (<code
            >it('cannot access others task')</code
          >
          пояснює бізнес-логіку), і <strong>ловити регресії</strong> (нова фіча не зламала стару).
          Це та сама ідея, що і у Vue-компонентів: описуємо <em>очікувану поведінку</em>, тести
          гарантують її.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsVitest"
        :php="phpPest"
        js-title="Vitest — описуємо, монтуємо, assert DOM"
        php-title="Pest — описуємо, шлемо HTTP, assert JSON"
      />

      <TheoryBlock title="Feature vs Unit тести">
        <p>
          <strong>Feature</strong> — тест повного HTTP-циклу (request → routing → middleware →
          controller → response). Аналог Cypress/Playwright E2E, тільки без браузера.
          <strong>Unit</strong> — ізольований тест (модель, scope, policy, helper). Аналог — Vitest
          для окремого composable.
        </p>
      </TheoryBlock>

      <CodeBlock :code="structureCode" lang="text" title="Структура тестів + команди запуску" />

      <TheoryBlock title="RefreshDatabase + SQLite :memory: — чистий стан">
        <p>
          <code>RefreshDatabase</code> відкриває SQL-транзакцію перед тестом і робить rollback
          після. Дані, створені в тесті, НЕ впливають на наступний — чистий стан гарантований.
          SQLite <code>:memory:</code> тримає базу в RAM — жодних файлів, максимальна швидкість.
          <code>BCRYPT_ROUNDS=4</code> у <code>phpunit.xml</code> прискорює хешування паролів.
        </p>
      </TheoryBlock>

      <CodeBlock :code="pestConfigCode" lang="php" title="tests/Pest.php + phpunit.xml" />

      <TheoryBlock title="Factories — генерація реалістичних тестових даних">
        <p>
          На фронтенді ви створюєте <code>const mockTask = ...</code> вручну. В Laravel —
          <strong>фабрики</strong>: класи з <code>definition()</code>, що генерують правдоподібні
          дані через <code>fake()</code>. Плюс <strong>states</strong> для конкретних сценаріїв:
          <code>Task::factory()->overdue()->create()</code>.
        </p>
        <p>
          <code>create()</code> зберігає в БД (для Feature); <code>make()</code> — повертає обʼєкт
          без запису (для Unit). При <code>'user_id' => User::factory()</code> Laravel автоматично
          створить повʼязаного User.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="factoryCode"
        lang="php"
        title="TaskFactory зі states (completed, overdue)"
      />

      <TheoryBlock title="Assertions — повна колекція для API">
        <p>
          <code>assertOk()</code> = 200, <code>assertCreated()</code> = 201,
          <code>assertForbidden()</code> = 403, <code>assertUnprocessable()</code> = 422. Для JSON:
          <code>assertJson([...])</code> (точне співпадіння),
          <code>assertJsonStructure([...])</code> (лише ключі),
          <code>assertJsonCount(5, 'data')</code>, <code>assertJsonPath('data.0.title', ...)</code>.
          Для валідації: <code>assertJsonValidationErrors(['title'])</code>. Для бази:
          <code>assertDatabaseHas('tasks', [...])</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="assertionsCode"
        lang="php"
        title="Assertions — HTTP, JSON, Validation, Database"
      />

      <CodeBlock
        :code="fullTestCode"
        lang="php"
        title="Повний приклад TaskControllerTest (store + update + dataset)"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: мініатюрний тест-раннер з in-memory API">
        <p>
          У playground ми <strong>самі побудували</strong> тест-раннер (<code
            >describe / it / assertEqual</code
          >) та in-memory API з <code>refreshDatabase()</code>. Тести виглядають майже як Pest:
          describe-групи, assertions по статусу і кількості. Запустіть — побачите зелені ✓ для
          кожного тесту.
        </p>
        <p>
          Зверніть увагу: тест «forbids updating others task» створює задачу Alice, але
          <code>actingAs(Bob)</code> → 403. Це саме те, що перевіряє Policy у реальному Laravel.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/19-pest-testing.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="4-19" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Feature-тести для CategoryController">
        <p>
          Реалізуйте 4 in-memory API-функції (<code
            >apiListCategories / apiCreateCategory / apiShowCategory / apiDeleteCategory</code
          >). Натисніть <strong>«Запустити»</strong> — 8 Feature-тестів перевірять: scoping (тільки
          свої), auth (401), валідацію (порожнє імʼя → 422), дублікат імені → 422, 403 для чужої
          категорії, 204 при видаленні.
        </p>
        <p>
          Завдання перевіряє вашу здатність <em>мислити тестами</em> — спочатку описати очікувану
          поведінку, потім реалізувати API, щоб тести пройшли.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте API, щоб усі Feature-тести пройшли"
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
