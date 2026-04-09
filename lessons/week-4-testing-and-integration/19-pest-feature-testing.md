# Урок 19: Pest Feature Testing -- тестування API від А до Я

## Що ви вивчите

- Навіщо тестувати: впевненість при рефакторингу, ловити регресії, документація для коду
- Pest framework: сучасний інструмент тестування PHP (як Vitest для PHP)
- Структура директорій: `tests/Feature`, `tests/Unit`
- Запуск тестів: `php artisan test`, `php artisan test --filter=TaskTest`
- Feature-тести для API:
  - `RefreshDatabase` -- скидання бази перед кожним тестом
  - Створення тестових даних через фабрики
  - `actingAs($user)` -- аутентифікація як конкретний юзер
  - HTTP-методи: `getJson()`, `postJson()`, `putJson()`, `deleteJson()`
  - Assertions: `assertStatus()`, `assertJson()`, `assertJsonStructure()`, `assertJsonCount()`, `assertJsonPath()`
  - Тестування валідації: невалідні дані -> 422 + `assertJsonValidationErrors()`
  - Тестування авторизації: чужий ресурс -> 403
  - Тестування пагінації: перевірка структури `data`, `links`, `meta`
- Pest-синтаксис: `it()`, `test()`, `describe()`, `expect()`, `beforeEach()`
- Dataset: кілька наборів тестових даних для одного тесту

---

## Паралелі з JS/Vue

| Pest (PHP) | Vitest / Vue Test Utils | Коментар |
|---|---|---|
| `it('can list tasks', function() { ... })` | `it('can list tasks', () => { ... })` | Практично ідентичний синтаксис |
| `expect($value)->toBe(42)` | `expect(value).toBe(42)` | Однакова API для assertions |
| `describe('TaskController', ...)` | `describe('TaskList.vue', ...)` | Групування тестів |
| `beforeEach(function() { ... })` | `beforeEach(() => { ... })` | Підготовка перед кожним тестом |
| `$this->getJson('/api/tasks')` | `mount(TaskList)` + assert | Тестуємо кінцевий результат, а не внутрішню логіку |
| `assertStatus(200)` | `expect(response.status).toBe(200)` | Перевірка HTTP-статусу |
| `assertJsonStructure([...])` | `expect(wrapper.html()).toContain(...)` | Перевірка структури відповіді |
| `RefreshDatabase` | `beforeEach(() => { store.$reset() })` | Чистий стан перед кожним тестом |
| `actingAs($user)` | `vi.mock('stores/auth')` | Імітація авторизованого користувача |
| Feature tests (API) | Cypress / Playwright E2E тести | Перевірка повного потоку від запиту до відповіді |
| `User::factory()->create()` | `const mockUser = { id: 1, name: 'Test' }` | Генерація тестових даних |
| `php artisan test` | `npx vitest` | Команда запуску тестів |
| `--filter=TaskTest` | `vitest TaskList` | Запуск конкретного тесту |

---

## Теорія

### Навіщо тестувати API

Уявіть ситуацію: ви додали нову фічу до Task Manager. Все працює. Потім ви рефакторите `TaskController`, оптимізуєте запити до бази, змінюєте формат відповіді. Ви пушите код на продакшн і... фронтенд-розробник пише вам: "Список задач зламався, API повертає інший формат".

**Тести вирішують три проблеми:**

1. **Впевненість при рефакторингу**: змінив код -- запустив тести -- бачиш, чи щось зламалось
2. **Документація**: тест `it('cannot access others task')` пояснює бізнес-логіку краще будь-якого коментаря
3. **Ловити регресії**: нова фіча не повинна ламати старий функціонал

Це та сама ідея, що і тестування Vue-компонентів: ви описуєте *очікувану поведінку*, і тести гарантують, що ця поведінка не зламається.

### Pest Framework

Laravel 12 використовує **Pest** -- сучасний фреймворк тестування для PHP. Якщо ви знаєте Vitest, ви вже знаєте Pest:

```javascript
// Vitest (JavaScript)
import { describe, it, expect } from 'vitest'

describe('TaskList', () => {
  it('renders tasks', () => {
    const result = getTaskList()
    expect(result).toHaveLength(5)
    expect(result[0].title).toBe('Buy milk')
  })
})
```

```php
// Pest (PHP)
describe('TaskController', function () {
    it('returns list of tasks', function () {
        $result = $this->getJson('/api/tasks');
        $result->assertStatus(200);
        $result->assertJsonCount(5, 'data');
    });
});
```

Різниця мінімальна: `$this->` замість функцій-утиліт, `;` замість нічого, `function ()` замість `() =>`. Решта -- та сама ідея.

### Структура тестів у Laravel

```
tests/
├── Feature/          <-- тести повного HTTP-циклу (запит → контролер → відповідь)
│   ├── Auth/
│   │   └── AuthControllerTest.php
│   └── Task/
│       └── TaskControllerTest.php
├── Unit/             <-- тести ізольованої логіки (моделі, сервіси, скоупи)
│   ├── Models/
│   │   └── TaskTest.php
│   └── Policies/
│       └── TaskPolicyTest.php
├── Pest.php          <-- глобальна конфігурація Pest
└── TestCase.php      <-- базовий клас для тестів
```

**Feature-тести** -- це те, що найближче до E2E-тестів на фронтенді. Вони надсилають реальний HTTP-запит до додатку і перевіряють відповідь. У вашому Vue-проєкті це як Cypress-тест, що відкриває сторінку і клікає кнопки. Різниця -- тут ми працюємо безпосередньо з API, без браузера.

**Unit-тести** -- це як тестування окремого composable чи Pinia getter без монтування компонента.

### Pest.php -- глобальна конфігурація

Файл `tests/Pest.php` визначає базові налаштування:

```php
// tests/Pest.php
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->extends(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');
```

Що це робить:
- `extends(Tests\TestCase::class)` -- всі тести наслідують Laravel TestCase (доступ до `$this->getJson()`, `actingAs()` тощо)
- `use(RefreshDatabase::class)` -- перед кожним тестом база скидається до початкового стану
- `in('Feature')` -- застосовується тільки до Feature-тестів

Це як `setupFilesAfterFramework` в конфігу Vitest -- автоматична підготовка перед кожним тестом.

### RefreshDatabase -- чистий стан

`RefreshDatabase` -- це trait, який **відкочує базу до початкового стану** перед кожним тестом. Без нього тест, який створює 5 задач, залишить їх у базі, і наступний тест, який очікує порожню базу, провалиться.

```php
// Аналогія у Vue/Vitest:
// beforeEach(() => {
//   store.$reset()       // скинути стейт
//   localStorage.clear() // очистити сховище
// })
```

В Laravel це працює через транзакції: перед тестом відкривається транзакція, після тесту -- rollback. Це швидко і надійно. SQLite працює чудово з цим підходом.

### Фабрики -- генерація тестових даних

На фронтенді для тестів ви створюєте mock-дані вручну:

```javascript
// Vue тест
const mockTask = {
  id: 1,
  title: 'Buy milk',
  status: 'pending',
  userId: 1
}
```

В Laravel є **фабрики** -- це класи-генератори реалістичних тестових даних:

```php
// database/factories/TaskFactory.php
namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['pending', 'in_progress', 'done']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'deadline' => fake()->optional()->dateTimeBetween('now', '+30 days'),
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
        ];
    }

    // Стани (states) для конкретних сценаріїв
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'done',
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'deadline' => now()->subDays(3),
        ]);
    }

    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'priority' => 'high',
        ]);
    }
}
```

Використання у тестах:

```php
// Один запис
$task = Task::factory()->create();

// З конкретними полями
$task = Task::factory()->create([
    'title' => 'My test task',
    'status' => 'pending',
]);

// Кілька записів
$tasks = Task::factory()->count(5)->create();

// З конкретним користувачем
$user = User::factory()->create();
$tasks = Task::factory()->count(3)->create(['user_id' => $user->id]);

// З використанням стану
$overdueTasks = Task::factory()->count(2)->overdue()->create(['user_id' => $user->id]);

// make() -- створює обʼєкт БЕЗ збереження в базу (як mockData)
$taskData = Task::factory()->make();
```

Також переконайтесь, що існують фабрики для `User` та `Category`:

```php
// database/factories/CategoryFactory.php
namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'user_id' => User::factory(),
        ];
    }
}
```

### actingAs() -- аутентифікація в тестах

У Vue-тестах ви мокаєте auth store:

```javascript
// Vue тест
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 1, name: 'Test User' },
    isAuthenticated: true,
  })
}))
```

В Laravel -- один рядок:

```php
$user = User::factory()->create();

$this->actingAs($user)        // цей запит буде від імені $user
    ->getJson('/api/tasks')
    ->assertStatus(200);
```

`actingAs()` додає Sanctum-токен автоматично. Не потрібно створювати токен, додавати Bearer-header -- Laravel все робить за вас.

### HTTP-методи для тестування API

```php
// GET -- отримати список чи один ресурс
$this->getJson('/api/tasks');
$this->getJson('/api/tasks/1');
$this->getJson('/api/tasks?status=pending&search=buy');

// POST -- створити ресурс
$this->postJson('/api/tasks', [
    'title' => 'New task',
    'status' => 'pending',
    'priority' => 'medium',
]);

// PUT/PATCH -- оновити ресурс
$this->putJson('/api/tasks/1', [
    'title' => 'Updated title',
]);

// DELETE -- видалити ресурс
$this->deleteJson('/api/tasks/1');
```

Чому `getJson()`, а не `get()`? Метод `getJson()` автоматично додає заголовки:
- `Accept: application/json` -- щоб Laravel повертав JSON, а не HTML
- `Content-Type: application/json` -- для POST/PUT запитів

Без `Json` суфіксу Laravel може повернути HTML-сторінку помилки замість JSON-відповіді.

### Assertions -- перевірки

Ось повна колекція assertions, які вам знадобляться:

```php
$response = $this->actingAs($user)->getJson('/api/tasks');

// Перевірка HTTP-статусу
$response->assertStatus(200);           // конкретний статус
$response->assertOk();                  // 200
$response->assertCreated();             // 201
$response->assertNoContent();           // 204
$response->assertNotFound();            // 404
$response->assertForbidden();           // 403
$response->assertUnauthorized();        // 401
$response->assertUnprocessable();       // 422

// Перевірка JSON-тіла
$response->assertJson([
    'data' => [
        ['title' => 'My task']
    ]
]);

// Перевірка структури (без значень -- тільки ключі)
$response->assertJsonStructure([
    'data' => [
        '*' => ['id', 'title', 'status', 'priority', 'created_at']
    ],
    'links',
    'meta',
]);

// Кількість елементів
$response->assertJsonCount(5, 'data');

// Конкретне значення за шляхом
$response->assertJsonPath('data.0.title', 'My task');

// Перевірка помилок валідації
$response->assertJsonValidationErrors(['title']);         // поле має помилку
$response->assertJsonMissingValidationErrors(['status']); // поле без помилок

// Відсутність даних
$response->assertJsonMissing(['title' => 'Secret task']);
```

### Тестування валідації

```php
it('rejects task with empty title', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/tasks', [
            'title' => '',             // порожній title
            'status' => 'pending',
            'priority' => 'medium',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['title']);
});
```

Це еквівалент тестування форми у Vue:

```javascript
// Vue тест
it('shows validation error for empty title', async () => {
  const wrapper = mount(TaskForm)
  await wrapper.find('form').trigger('submit')
  expect(wrapper.text()).toContain('Title is required')
})
```

Але замість перевірки DOM ми перевіряємо JSON-відповідь від API.

### Pest-синтаксис у деталях

#### it() і test() -- визначення тесту

```php
// Ці два варіанти ідентичні:
it('can create a task', function () {
    // ...
});

test('user can create a task', function () {
    // ...
});
```

Різниця стилістична: `it` починає речення ("it can create a task"), `test` -- описує повний тест-кейс ("user can create a task"). У курсі використовуємо `it()` для консистентності з Vitest.

#### describe() -- групування тестів

```php
describe('TaskController@index', function () {
    it('returns paginated list', function () { /* ... */ });
    it('filters by status', function () { /* ... */ });
    it('searches by title', function () { /* ... */ });
});

describe('TaskController@store', function () {
    it('creates task with valid data', function () { /* ... */ });
    it('rejects invalid data', function () { /* ... */ });
});
```

#### beforeEach() -- підготовка перед кожним тестом

```php
describe('TaskController', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->category = Category::factory()->create(['user_id' => $this->user->id]);
    });

    it('can list tasks', function () {
        Task::factory()->count(3)->create(['user_id' => $this->user->id]);

        $this->actingAs($this->user)
            ->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    });
});
```

#### Dataset -- параметризовані тести

Якщо потрібно перевірити одну логіку з різними вхідними даними:

```php
// Перевіримо різні невалідні дані одним тестом
it('rejects invalid task data', function (array $data, string $errorField) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/tasks', $data)
        ->assertStatus(422)
        ->assertJsonValidationErrors([$errorField]);
})->with([
    'empty title' => [['title' => '', 'status' => 'pending', 'priority' => 'medium'], 'title'],
    'title too long' => [['title' => str_repeat('a', 256), 'status' => 'pending', 'priority' => 'medium'], 'title'],
    'invalid status' => [['title' => 'Task', 'status' => 'invalid', 'priority' => 'medium'], 'status'],
    'invalid priority' => [['title' => 'Task', 'status' => 'pending', 'priority' => 'urgent'], 'priority'],
]);
```

Це як `it.each()` у Vitest:

```javascript
// Vitest
it.each([
  [{ title: '' }, 'title'],
  [{ title: 'a'.repeat(256) }, 'title'],
])('rejects invalid data %o', (data, errorField) => {
  // ...
})
```

---

## Практика: крок за кроком

### Крок 1: Переконайтесь, що Pest налаштований

```bash
# Перевірте, що тести запускаються
php artisan test
```

Ви повинні побачити щось на кшталт:

```
PASS  Tests\Unit\ExampleTest
✓ that true is true

PASS  Tests\Feature\ExampleTest
✓ the application returns a successful response

Tests:    2 passed (2 assertions)
Duration: 0.50s
```

Якщо Pest не встановлений:

```bash
composer require pestphp/pest --dev --with-all-dependencies
composer require pestphp/pest-plugin-laravel --dev
```

### Крок 2: Налаштуйте Pest.php

```php
// tests/Pest.php
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->extends(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');
```

### Крок 3: Налаштуйте тестову базу даних

Laravel автоматично використовує SQLite in-memory для тестів, якщо налаштувати `phpunit.xml`:

```xml
<!-- phpunit.xml -- всередині блоку <php> -->
<env name="APP_ENV" value="testing"/>
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
<env name="BCRYPT_ROUNDS" value="4"/>
<env name="CACHE_STORE" value="array"/>
<env name="MAIL_MAILER" value="array"/>
<env name="QUEUE_CONNECTION" value="sync"/>
<env name="SESSION_DRIVER" value="array"/>
```

`:memory:` означає, що база існує тільки в оперативній памʼяті -- це дуже швидко. `BCRYPT_ROUNDS=4` прискорює хешування паролів у тестах (в продакшні -- 12).

### Крок 4: Переконайтесь, що фабрики існують

Перевірте, що у вас є фабрики для всіх моделей:

```php
// database/factories/UserFactory.php -- зазвичай вже існує
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }
}
```

Фабрику для `Task` та `Category` ми написали вище в теорії. Якщо їх ще немає:

```bash
php artisan make:factory TaskFactory
php artisan make:factory CategoryFactory
```

### Крок 5: Створіть TaskControllerTest

```bash
# Pest автоматично створює файл з Pest-синтаксисом
php artisan make:test TaskControllerTest
```

Це створить `tests/Feature/TaskControllerTest.php`. Тепер наповнимо його:

```php
// tests/Feature/TaskControllerTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Models\Category;

describe('TaskController@index', function () {
    it('returns paginated list of own tasks', function () {
        $user = User::factory()->create();
        $category = Category::factory()->create(['user_id' => $user->id]);
        Task::factory()->count(3)->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/tasks');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'status', 'priority', 'created_at'],
                ],
                'links',
                'meta',
            ]);
    });

    it('does not return tasks of other users', function () {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Створюємо задачі для іншого користувача
        Task::factory()->count(3)->create(['user_id' => $otherUser->id]);

        // Створюємо одну задачу для нашого користувача
        Task::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    });

    it('filters tasks by status', function () {
        $user = User::factory()->create();

        Task::factory()->count(2)->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        Task::factory()->count(3)->create([
            'user_id' => $user->id,
            'status' => 'done',
        ]);

        $this->actingAs($user)
            ->getJson('/api/tasks?status=pending')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    });

    it('searches tasks by title', function () {
        $user = User::factory()->create();

        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Buy groceries from the store',
        ]);
        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Fix the frontend bug',
        ]);

        $this->actingAs($user)
            ->getJson('/api/tasks?search=groceries')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Buy groceries from the store');
    });

    it('paginates results', function () {
        $user = User::factory()->create();

        // Створимо 20 задач, а дефолтна пагінація -- 15
        Task::factory()->count(20)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/tasks');

        $response->assertOk()
            ->assertJsonCount(15, 'data') // перша сторінка
            ->assertJsonPath('meta.total', 20)
            ->assertJsonPath('meta.last_page', 2);

        // Друга сторінка
        $this->actingAs($user)
            ->getJson('/api/tasks?page=2')
            ->assertOk()
            ->assertJsonCount(5, 'data');
    });

    it('requires authentication', function () {
        $this->getJson('/api/tasks')
            ->assertUnauthorized(); // 401
    });
});

describe('TaskController@store', function () {
    it('creates task with valid data', function () {
        $user = User::factory()->create();
        $category = Category::factory()->create(['user_id' => $user->id]);

        $taskData = [
            'title' => 'New important task',
            'description' => 'This task needs to be done',
            'status' => 'pending',
            'priority' => 'high',
            'category_id' => $category->id,
            'deadline' => now()->addDays(7)->toDateTimeString(),
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/tasks', $taskData);

        $response->assertCreated() // 201
            ->assertJsonPath('data.title', 'New important task')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.priority', 'high');

        // Перевіряємо, що задача зʼявилась у базі
        $this->assertDatabaseHas('tasks', [
            'title' => 'New important task',
            'user_id' => $user->id,
        ]);
    });

    it('rejects task with invalid data', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/tasks', [
                'title' => '',           // порожній -- required
                'status' => 'invalid',   // не входить в enum
                'priority' => '',        // порожній
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'status', 'priority']);
    });

    it('rejects invalid data with specific messages', function (array $data, string $errorField) {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/tasks', $data)
            ->assertStatus(422)
            ->assertJsonValidationErrors([$errorField]);
    })->with([
        'missing title' => [['status' => 'pending', 'priority' => 'medium'], 'title'],
        'title too long' => [['title' => str_repeat('a', 256), 'status' => 'pending', 'priority' => 'medium'], 'title'],
        'invalid status' => [['title' => 'Task', 'status' => 'unknown', 'priority' => 'medium'], 'status'],
        'invalid priority' => [['title' => 'Task', 'status' => 'pending', 'priority' => 'urgent'], 'priority'],
    ]);
});

describe('TaskController@show', function () {
    it('returns own task', function () {
        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'My secret task',
        ]);

        $this->actingAs($user)
            ->getJson("/api/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'My secret task')
            ->assertJsonPath('data.id', $task->id);
    });

    it('forbids access to others task', function () {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($user)
            ->getJson("/api/tasks/{$task->id}")
            ->assertForbidden(); // 403
    });

    it('returns 404 for non-existent task', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/tasks/99999')
            ->assertNotFound(); // 404
    });
});

describe('TaskController@update', function () {
    it('updates own task', function () {
        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Old title',
        ]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'title' => 'Updated title',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated title');

        // Перевіряємо базу
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated title',
        ]);
    });

    it('forbids updating others task', function () {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'title' => 'Hacked title',
            ])
            ->assertForbidden(); // 403

        // Переконуємось, що назва НЕ змінилась
        $this->assertDatabaseMissing('tasks', [
            'id' => $task->id,
            'title' => 'Hacked title',
        ]);
    });
});

describe('TaskController@destroy', function () {
    it('deletes own task', function () {
        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->deleteJson("/api/tasks/{$task->id}")
            ->assertNoContent(); // 204

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    });

    it('forbids deleting others task', function () {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($user)
            ->deleteJson("/api/tasks/{$task->id}")
            ->assertForbidden();

        // Задача все ще існує
        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
    });
});
```

### Крок 6: Створіть AuthControllerTest

```bash
php artisan make:test AuthControllerTest
```

```php
// tests/Feature/AuthControllerTest.php
<?php

use App\Models\User;

describe('AuthController@register', function () {
    it('registers user with valid data', function () {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
                'token',
            ])
            ->assertJsonPath('data.name', 'John Doe')
            ->assertJsonPath('data.email', 'john@example.com');

        // Перевіряємо, що юзер зʼявився в базі
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
        ]);
    });

    it('rejects registration with existing email', function () {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Another User',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('rejects registration with invalid data', function (array $data, string $errorField) {
        $this->postJson('/api/register', $data)
            ->assertStatus(422)
            ->assertJsonValidationErrors([$errorField]);
    })->with([
        'missing name' => [
            ['email' => 'test@example.com', 'password' => 'password123', 'password_confirmation' => 'password123'],
            'name',
        ],
        'missing email' => [
            ['name' => 'Test', 'password' => 'password123', 'password_confirmation' => 'password123'],
            'email',
        ],
        'invalid email' => [
            ['name' => 'Test', 'email' => 'not-email', 'password' => 'password123', 'password_confirmation' => 'password123'],
            'email',
        ],
        'password too short' => [
            ['name' => 'Test', 'email' => 'test@example.com', 'password' => '123', 'password_confirmation' => '123'],
            'password',
        ],
        'password mismatch' => [
            ['name' => 'Test', 'email' => 'test@example.com', 'password' => 'password123', 'password_confirmation' => 'different'],
            'password',
        ],
    ]);
});

describe('AuthController@login', function () {
    it('logs in with valid credentials', function () {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
                'token',
            ]);
    });

    it('rejects invalid credentials', function () {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ])
            ->assertStatus(401)
            ->assertJson(['message' => 'Invalid credentials']);
    });

    it('rejects login with non-existent email', function () {
        $this->postJson('/api/login', [
            'email' => 'ghost@example.com',
            'password' => 'password123',
        ])
            ->assertStatus(401);
    });
});

describe('AuthController@logout', function () {
    it('logs out authenticated user', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJson(['message' => 'Logged out successfully']);
    });

    it('rejects logout for unauthenticated user', function () {
        $this->postJson('/api/logout')
            ->assertUnauthorized();
    });
});

describe('AuthController@user', function () {
    it('returns current user profile', function () {
        $user = User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
        ]);

        $this->actingAs($user)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.name', 'Jane Smith')
            ->assertJsonPath('data.email', 'jane@example.com');
    });

    it('rejects unauthenticated request', function () {
        $this->getJson('/api/user')
            ->assertUnauthorized();
    });
});
```

### Крок 7: Запустіть тести

```bash
# Всі тести
php artisan test

# Тільки Feature тести
php artisan test --testsuite=Feature

# Конкретний файл
php artisan test tests/Feature/TaskControllerTest.php

# Конкретний тест
php artisan test --filter="can create task with valid data"

# З деталями
php artisan test --verbose
```

Очікуваний вивід:

```
PASS  Tests\Feature\TaskControllerTest
✓ it returns paginated list of own tasks                          0.15s
✓ it does not return tasks of other users                         0.08s
✓ it filters tasks by status                                      0.07s
✓ it searches tasks by title                                      0.06s
✓ it paginates results                                            0.09s
✓ it requires authentication                                      0.03s
✓ it creates task with valid data                                 0.08s
✓ it rejects task with invalid data                               0.05s
✓ it rejects invalid data with specific messages (missing title)  0.04s
✓ it rejects invalid data with specific messages (title too long) 0.04s
✓ it rejects invalid data with specific messages (invalid status) 0.04s
✓ it rejects invalid data with specific messages (invalid priority) 0.04s
✓ it returns own task                                             0.06s
✓ it forbids access to others task                                0.05s
✓ it returns 404 for non-existent task                            0.03s
✓ it updates own task                                             0.07s
✓ it forbids updating others task                                 0.05s
✓ it deletes own task                                             0.05s
✓ it forbids deleting others task                                 0.05s

PASS  Tests\Feature\AuthControllerTest
✓ it registers user with valid data                               0.10s
✓ it rejects registration with existing email                     0.06s
...

Tests:    28 passed (64 assertions)
Duration: 1.85s
```

---

## Перевірка

Після завершення цього уроку у вас має бути:

- [ ] Файл `tests/Feature/TaskControllerTest.php` з 15+ тестами
- [ ] Файл `tests/Feature/AuthControllerTest.php` з 10+ тестами
- [ ] Фабрики для Task, Category, User
- [ ] `tests/Pest.php` налаштований з RefreshDatabase
- [ ] `phpunit.xml` налаштований на SQLite in-memory
- [ ] `php artisan test` проходить без помилок
- [ ] Ви розумієте різницю між `assertJson`, `assertJsonStructure` і `assertJsonPath`

---

## Міні-тест

### 1. Що робить trait `RefreshDatabase`?
a) Видаляє всі файли міграцій  
b) Скидає базу до початкового стану перед кожним тестом  
c) Створює нову базу даних  
d) Виконує rollback останньої міграції  

### 2. Як аутентифікуватись у тесті?
a) `$this->login($user)`  
b) `$this->withToken('abc123')`  
c) `$this->actingAs($user)`  
d) `Auth::login($user)` перед кожним запитом  

### 3. Чим `getJson()` відрізняється від `get()`?
a) Нічим, це аліаси  
b) `getJson()` автоматично додає `Accept: application/json` header  
c) `getJson()` працює тільки з JSON-файлами  
d) `get()` швидший  

### 4. Який assertion перевіряє, що відповідь містить помилку валідації для поля `title`?
a) `assertJsonError('title')`  
b) `assertHasError('title')`  
c) `assertJsonValidationErrors(['title'])`  
d) `assertValidationFails('title')`  

### 5. Що робить `->with([...])` у Pest?
a) Передає middleware  
b) Задає eager loading  
c) Додає HTTP-заголовки  
d) Надає набір тестових даних (dataset) для параметризованого тесту  

---

## Практичне завдання

Напишіть повний тестовий набір для `CategoryController`.

Створіть файл `tests/Feature/CategoryControllerTest.php` з наступними тестами:

1. **index**: повертає список категорій поточного користувача
2. **index**: не повертає категорії інших користувачів
3. **index**: вимагає аутентифікації (401)
4. **store**: створює категорію з валідними даними
5. **store**: відхиляє дублікат назви для того самого користувача
6. **store**: відхиляє порожню назву (422)
7. **show**: повертає власну категорію
8. **show**: забороняє доступ до чужої категорії (403)
9. **update**: оновлює власну категорію
10. **destroy**: видаляє власну категорію
11. **destroy**: каскадно обробляє задачі при видаленні категорії (або забороняє видалення, якщо є задачі)

Кожен тест повинен використовувати фабрики для створення даних та `actingAs()` для аутентифікації.

**Підказка**: структуруйте тести через `describe()` для кожного методу контролера, як у прикладі `TaskControllerTest`.

---

## Відповіді на тест

1. **b)** Скидає базу до початкового стану перед кожним тестом. `RefreshDatabase` використовує транзакції для відкату змін після кожного тесту.
2. **c)** `$this->actingAs($user)` -- це метод Laravel TestCase, що автоматично аутентифікує запит від імені вказаного користувача (додає Sanctum-токен).
3. **b)** `getJson()` автоматично додає `Accept: application/json` header, що змушує Laravel повертати JSON-відповідь замість HTML при помилках.
4. **c)** `assertJsonValidationErrors(['title'])` перевіряє, що відповідь 422 містить помилку валідації для поля `title`.
5. **d)** `->with([...])` надає dataset -- масив тестових наборів даних, які передаються як аргументи в callback тесту. Це як `it.each()` у Vitest.
