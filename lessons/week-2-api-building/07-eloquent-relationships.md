# Урок 7: Eloquent Relationships -- зв'язки між моделями

## Що ви вивчите

- Навіщо потрібні зв'язки між таблицями (нормалізація даних)
- Три основних типи зв'язків: hasMany, belongsTo, belongsToMany
- Як описувати зв'язки як методи на Eloquent-моделях
- Як отримувати пов'язані дані: `$task->category`, `$task->tags`
- Eager loading з `with()` та проблему N+1
- Підрахунок пов'язаних записів: `withCount()`
- Створення пов'язаних записів: `$user->tasks()->create([...])`
- Управління many-to-many: `attach()`, `detach()`, `sync()`
- Фільтрацію по зв'язках: `whereHas()`, `has()`

---

## Паралелі з JS/Vue

| Laravel (PHP) | Vue/JS аналог | Коментар |
|---|---|---|
| `$task->category` | `categories[task.categoryId]` | Як computed, що резолвить посилання з Pinia store |
| `hasMany` / `belongsTo` | Нормалізовані Pinia stores з references | `task.categoryId` вказує на `categories[id]` |
| `with('category', 'tags')` | Один API-запит з `?expand=category,tags` | Один запит замість окремих fetch для кожного зв'язку |
| N+1 проблема | `fetch()` всередині `v-for` | 1 запит на кожен елемент замість 1 запиту на всі |
| `attach()` / `sync()` | Управління чекбоксами many-to-many | Як `v-model` на групі чекбоксів для вибору тегів |
| `whereHas()` | Фільтрація батька по дитині | "Покажи категорії, в яких є задачі" |
| `withCount('tags')` | `task.tags.length` на фронтенді | Отримати кількість без завантаження всіх записів |
| Pivot-таблиця `tag_task` | Join-таблиця в normalized state | Зв'язок many-to-many через окрему таблицю |

---

## Теорія

### Навіщо потрібні зв'язки

Уявіть, що ви зберігаєте задачі разом з назвою категорії прямо в таблиці tasks:

```
tasks:
| id | title          | category_name |
|----|----------------|---------------|
| 1  | Buy groceries  | Personal      |
| 2  | Fix bug #123   | Work          |
| 3  | Clean house    | Personal      |
```

Проблема: якщо ви перейменуєте категорію "Personal" на "Home", потрібно оновити кожен рядок, де вона згадується. Це дублювання даних.

Рішення -- **нормалізація**: виносимо категорії в окрему таблицю і зберігаємо лише посилання (ID):

```
categories:                    tasks:
| id | name     |              | id | title          | category_id |
|----|----------|              |----|----------------|-------------|
| 1  | Personal |              | 1  | Buy groceries  | 1           |
| 2  | Work     |              | 2  | Fix bug #123   | 2           |
                               | 3  | Clean house    | 1           |
```

Це та сама ідея, що й нормалізація стану в Pinia:

```javascript
// Vue/Pinia -- нормалізований стейт
const categories = { 1: { id: 1, name: 'Personal' }, 2: { id: 2, name: 'Work' } }
const tasks = [
  { id: 1, title: 'Buy groceries', categoryId: 1 },
  { id: 2, title: 'Fix bug #123', categoryId: 2 },
]
// Щоб отримати категорію задачі: categories[task.categoryId]
```

Eloquent Relationships дозволяють вам описати ці зв'язки один раз в моделі, а потім просто звертатись `$task->category` -- Laravel зробить все сам.

### Типи зв'язків

У нашому Task Manager використовуються три основних типи:

#### 1. hasMany (один-до-багатьох)

Один запис "має багато" інших. Наприклад:
- Один User **має багато** Tasks
- Одна Category **має багато** Tasks

```
User (1) ----< Tasks (багато)
Category (1) ----< Tasks (багато)
```

Стрілка `----<` читається як "один до багатьох".

#### 2. belongsTo (зворотний зв'язок)

Це зворотний бік hasMany. Кожна Task **належить** одному User і одній Category:

```
Task >---- User (один)
Task >---- Category (одна)
```

Ключове правило: стовпець зовнішнього ключа (`user_id`, `category_id`) завжди знаходиться в таблиці, яка "належить" (`belongsTo`). Тобто `category_id` лежить в таблиці `tasks`, а не навпаки.

#### 3. belongsToMany (багато-до-багатьох)

Одна Task може мати багато Tags, і один Tag може належати багатьом Tasks. Для цього потрібна проміжна (pivot) таблиця:

```
Tasks >----< Tags

tag_task (pivot):
| tag_id | task_id |
|--------|---------|
| 1      | 1       |
| 3      | 1       |
| 2      | 2       |
```

Це як масив чекбоксів на фронтенді: задача може мати кілька тегів, і тег може бути на кількох задачах.

### Як Laravel визначає зв'язки: конвенції іменування

Laravel автоматично визначає назви стовпців та таблиць за конвенцією:

| Зв'язок | Конвенція Laravel | Приклад |
|---|---|---|
| `belongsTo` | `{relation}_id` в поточній таблиці | `Task::belongsTo(Category)` шукає `category_id` в `tasks` |
| `hasMany` | `{model}_id` в пов'язаній таблиці | `Category::hasMany(Task)` шукає `category_id` в `tasks` |
| `belongsToMany` | Pivot-таблиця з іменами в алфавітному порядку | `Task <-> Tag` = таблиця `tag_task` (t...t в алфавітному: tag < task) |

> **Важливо:** Для pivot-таблиці Laravel бере назви моделей в однині, в алфавітному порядку, через підкреслення. `Tag` + `Task` = `tag_task` (не `task_tag`!). Якщо ваша таблиця називається інакше, можна вказати назву явно.

### Eager Loading та проблема N+1

Проблема N+1 -- одна з найпоширеніших помилок продуктивності. Подивіться на цей код:

```php
// ПОГАНО: N+1 проблема
$tasks = Task::all(); // 1 запит: SELECT * FROM tasks

foreach ($tasks as $task) {
    echo $task->category->name; // N запитів: SELECT * FROM categories WHERE id = ?
}
// Якщо задач 100, буде 1 + 100 = 101 SQL-запит!
```

Це те саме, що робити `fetch()` всередині `v-for`:

```javascript
// Vue аналог N+1 -- ПОГАНО!
const tasks = await fetch('/api/tasks').then(r => r.json())
for (const task of tasks) {
    // Окремий запит для кожної задачі!
    task.category = await fetch(`/api/categories/${task.categoryId}`).then(r => r.json())
}
```

Рішення -- **eager loading** з `with()`:

```php
// ДОБРЕ: Eager loading -- всього 2 запити
$tasks = Task::with('category')->get();
// Запит 1: SELECT * FROM tasks
// Запит 2: SELECT * FROM categories WHERE id IN (1, 2, 3, ...)

foreach ($tasks as $task) {
    echo $task->category->name; // Без додаткових запитів!
}
```

Це як один API-виклик з `?include=category`:

```javascript
// Vue аналог eager loading -- ДОБРЕ!
const tasks = await fetch('/api/tasks?include=category').then(r => r.json())
// Все вже є в одній відповіді
```

Можна завантажувати кілька зв'язків одночасно:

```php
$tasks = Task::with(['category', 'tags', 'user'])->get();
```

І навіть вкладені зв'язки:

```php
$tasks = Task::with(['category.tasks'])->get(); // Категорія та всі її задачі
```

### withCount() -- підрахунок без завантаження

Іноді вам не потрібні самі пов'язані записи, а лише їх кількість:

```php
$categories = Category::withCount('tasks')->get();

foreach ($categories as $category) {
    echo "{$category->name}: {$category->tasks_count} tasks";
}
// SQL: SELECT categories.*, (SELECT COUNT(*) FROM tasks WHERE tasks.category_id = categories.id) as tasks_count FROM categories
```

Це ефективніше, ніж завантажити всі задачі лише щоб порахувати їх. На фронтенді аналог -- це коли API повертає `tasks_count` замість повного масиву `tasks`.

### whereHas() та has() -- фільтрація по зв'язках

`has()` -- відфільтрувати записи, які мають пов'язані дані:

```php
// Категорії, в яких є хоча б одна задача
$categories = Category::has('tasks')->get();

// Категорії, в яких більше 5 задач
$categories = Category::has('tasks', '>=', 5)->get();
```

`whereHas()` -- фільтрація з умовою на пов'язані записи:

```php
// Категорії, в яких є задачі зі статусом 'pending'
$categories = Category::whereHas('tasks', function ($query) {
    $query->where('status', 'pending');
})->get();

// Користувачі, які мають задачі з тегом 'urgent'
$users = User::whereHas('tasks.tags', function ($query) {
    $query->where('name', 'urgent');
})->get();
```

---

## Практика: крок за кроком

### Крок 1: Переконайтесь, що міграції готові

Перш ніж налаштовувати зв'язки, переконайтесь, що у вас є всі необхідні таблиці з правильними зовнішніми ключами.

Перевірте міграцію `tasks`:

```php
// database/migrations/xxxx_xx_xx_create_tasks_table.php
public function up(): void
{
    Schema::create('tasks', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->text('description')->nullable();
        $table->enum('status', ['pending', 'in_progress', 'done'])->default('pending');
        $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
        $table->date('deadline')->nullable();

        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

        $table->timestamps();
    });
}
```

Розглянемо зовнішні ключі:

- `foreignId('user_id')` -- створює стовпець `user_id` типу `unsignedBigInteger`
- `constrained()` -- додає зовнішній ключ, який посилається на `users.id`
- `cascadeOnDelete()` -- якщо видалити юзера, всі його задачі видаляться автоматично
- `nullOnDelete()` -- якщо видалити категорію, `category_id` стане `null` (а не видалить задачу)

Перевірте міграцію `categories`:

```php
// database/migrations/xxxx_xx_xx_create_categories_table.php
public function up(): void
{
    Schema::create('categories', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('color', 7)->default('#6366f1'); // HEX-колір
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->timestamps();
    });
}
```

Перевірте міграцію `tags`:

```php
// database/migrations/xxxx_xx_xx_create_tags_table.php
public function up(): void
{
    Schema::create('tags', function (Blueprint $table) {
        $table->id();
        $table->string('name')->unique();
        $table->timestamps();
    });
}
```

Перевірте pivot-міграцію `tag_task`:

```php
// database/migrations/xxxx_xx_xx_create_tag_task_table.php
public function up(): void
{
    Schema::create('tag_task', function (Blueprint $table) {
        $table->id();
        $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
        $table->foreignId('task_id')->constrained()->cascadeOnDelete();
        $table->timestamps();
    });
}
```

> **Зверніть увагу на назву:** `tag_task` -- в алфавітному порядку (tag перед task). Це конвенція Laravel для pivot-таблиць.

Якщо pivot-таблиці ще немає, створіть міграцію:

```bash
php artisan make:migration create_tag_task_table
```

Після перевірки/створення міграцій запустіть:

```bash
php artisan migrate:fresh
```

> `migrate:fresh` видаляє всі таблиці і запускає міграції з нуля. Використовуйте тільки під час розробки!

### Крок 2: Додайте зв'язки до моделі Task

Відкрийте `app/Models/Task.php` і додайте методи зв'язків:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'deadline',
        'user_id',
        'category_id',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
        ];
    }

    /**
     * Задача належить користувачу.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Задача належить категорії.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Задача має багато тегів (many-to-many).
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }
}
```

Кожен метод зв'язку:

1. Має return type hint (`BelongsTo`, `BelongsToMany`)
2. Повертає виклик відповідного методу (`$this->belongsTo(...)`)
3. Першим аргументом приймає клас пов'язаної моделі

Laravel автоматично визначає:
- Для `belongsTo(Category::class)` -- шукає `category_id` в таблиці `tasks`
- Для `belongsToMany(Tag::class)` -- шукає pivot-таблицю `tag_task`

### Крок 3: Додайте зв'язки до моделі Category

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name',
        'color',
        'user_id',
    ];

    /**
     * Категорія належить користувачу.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Категорія має багато задач.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
```

### Крок 4: Додайте зв'язки до моделі User

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Користувач має багато задач.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Користувач має багато категорій.
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }
}
```

### Крок 5: Додайте зв'язки до моделі Tag

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $fillable = [
        'name',
    ];

    /**
     * Тег належить багатьом задачам (many-to-many).
     */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class);
    }
}
```

### Крок 6: Протестуйте зв'язки в Tinker

Tinker -- це інтерактивна консоль Laravel (як Node.js REPL або Vue Devtools, але для бекенду).

```bash
php artisan tinker
```

**Створіть користувача:**

```php
$user = \App\Models\User::create([
    'name' => 'Timur',
    'email' => 'timur@example.com',
    'password' => bcrypt('password'),
]);
// => App\Models\User {id: 1, name: "Timur", ...}
```

**Створіть категорію через зв'язок:**

```php
$category = $user->categories()->create([
    'name' => 'Work',
    'color' => '#ef4444',
]);
// => App\Models\Category {id: 1, name: "Work", user_id: 1, ...}
// Laravel автоматично підставив user_id!
```

Зверніть увагу: ми не вказували `user_id` -- Laravel підставив його автоматично, бо ми викликали `create()` через зв'язок `$user->categories()`.

**Створіть задачу через зв'язок:**

```php
$task = $user->tasks()->create([
    'title' => 'Fix bug #123',
    'description' => 'The login form is broken on mobile',
    'status' => 'pending',
    'priority' => 'high',
    'category_id' => $category->id,
]);
// => App\Models\Task {id: 1, title: "Fix bug #123", user_id: 1, category_id: 1, ...}
```

**Створіть теги та прикріпіть до задачі:**

```php
$tag1 = \App\Models\Tag::create(['name' => 'urgent']);
$tag2 = \App\Models\Tag::create(['name' => 'frontend']);
$tag3 = \App\Models\Tag::create(['name' => 'bug']);

// Прикріпити теги до задачі
$task->tags()->attach([$tag1->id, $tag2->id]);
// Тепер в таблиці tag_task з'явились 2 записи:
// | task_id: 1 | tag_id: 1 |
// | task_id: 1 | tag_id: 2 |
```

**Зчитайте пов'язані дані:**

```php
// Отримати категорію задачі
$task->category;
// => App\Models\Category {id: 1, name: "Work", ...}

$task->category->name;
// => "Work"

// Отримати теги задачі
$task->tags;
// => Collection [Tag {name: "urgent"}, Tag {name: "frontend"}]

$task->tags->pluck('name');
// => Collection ["urgent", "frontend"]

// Отримати всі задачі користувача
$user->tasks;
// => Collection [Task {title: "Fix bug #123", ...}]

// Отримати всі категорії користувача
$user->categories;
// => Collection [Category {name: "Work", ...}]

// Отримати всі задачі категорії
$category->tasks;
// => Collection [Task {title: "Fix bug #123", ...}]
```

### Крок 7: attach(), detach(), sync()

Ці методи керують pivot-таблицею для many-to-many зв'язків:

```php
// attach -- додає зв'язки (НЕ видаляє існуючі)
$task->tags()->attach([1, 2]);      // Додати теги з id 1 і 2
$task->tags()->attach(3);           // Додати ще тег з id 3
// Тепер задача має теги: [1, 2, 3]

// detach -- видаляє зв'язки
$task->tags()->detach([2]);         // Видалити тег з id 2
// Тепер задача має теги: [1, 3]

$task->tags()->detach();            // Видалити ВСІ теги
// Тепер задача має теги: []

// sync -- встановлює ТОЧНИЙ набір зв'язків (видаляє зайві, додає нові)
$task->tags()->sync([1, 3, 5]);     // Тепер задача має ТІЛЬКИ теги [1, 3, 5]
$task->tags()->sync([2, 3]);        // Тепер задача має ТІЛЬКИ теги [2, 3]
// Тег 1 і 5 були видалені, тег 2 був доданий

// syncWithoutDetaching -- додає нові, але НЕ видаляє існуючі
$task->tags()->syncWithoutDetaching([4, 5]);
// Тепер задача має теги [2, 3, 4, 5] -- 2 і 3 залишились
```

Аналогія з Vue:

```javascript
// sync() -- це як v-model на чекбоксах:
// <input type="checkbox" v-model="selectedTags" :value="tag.id" />
// Коли selectedTags змінюється, набір тегів повністю замінюється

// attach() -- це як push в масив:
// selectedTags.push(newTagId)

// detach() -- це як filter:
// selectedTags = selectedTags.filter(id => id !== removedTagId)
```

### Крок 8: Eager Loading в контролері

Оновіть `TaskController`, щоб повертати задачі з категоріями та тегами:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Список всіх задач з категоріями та тегами.
     */
    public function index()
    {
        $tasks = Task::with(['category', 'tags'])->get();

        return response()->json($tasks);
    }

    /**
     * Одна задача з деталями.
     */
    public function show(Task $task)
    {
        $task->load(['category', 'tags']); // Lazy eager loading для вже завантаженої моделі

        return response()->json($task);
    }

    /**
     * Створити задачу з тегами.
     */
    public function store(Request $request)
    {
        $task = Task::create($request->only([
            'title', 'description', 'status', 'priority', 'deadline',
            'user_id', 'category_id',
        ]));

        // Прикріпити теги, якщо передані
        if ($request->has('tag_ids')) {
            $task->tags()->attach($request->input('tag_ids'));
        }

        $task->load(['category', 'tags']); // Завантажити зв'язки для відповіді

        return response()->json($task, 201);
    }

    /**
     * Оновити задачу.
     */
    public function update(Request $request, Task $task)
    {
        $task->update($request->only([
            'title', 'description', 'status', 'priority', 'deadline',
            'category_id',
        ]));

        // Синхронізувати теги, якщо передані
        if ($request->has('tag_ids')) {
            $task->tags()->sync($request->input('tag_ids'));
        }

        $task->load(['category', 'tags']);

        return response()->json($task);
    }

    /**
     * Видалити задачу.
     */
    public function destroy(Task $task)
    {
        $task->delete(); // Pivot-записи в tag_task видаляться автоматично (cascadeOnDelete)

        return response()->json(null, 204);
    }
}
```

Зверніть увагу на різницю між `with()` і `load()`:

```php
// with() -- eager loading під час запиту (ДО виконання)
$tasks = Task::with('category')->get(); // 2 SQL-запити

// load() -- lazy eager loading (ПІСЛЯ того, як модель вже завантажена)
$task = Task::find(1);       // 1 SQL-запит
$task->load('category');     // Ще 1 SQL-запит
```

### Крок 9: Протестуйте API

Запустіть сервер:

```bash
php artisan serve
```

**GET /api/tasks -- список задач з зв'язками:**

```bash
curl -s http://localhost:8000/api/tasks | python3 -m json.tool
```

Відповідь (з eager loading):

```json
[
    {
        "id": 1,
        "title": "Fix bug #123",
        "description": "The login form is broken on mobile",
        "status": "pending",
        "priority": "high",
        "deadline": "2026-04-15",
        "user_id": 1,
        "category_id": 1,
        "created_at": "2026-04-09T10:00:00.000000Z",
        "updated_at": "2026-04-09T10:00:00.000000Z",
        "category": {
            "id": 1,
            "name": "Work",
            "color": "#ef4444",
            "user_id": 1,
            "created_at": "2026-04-09T10:00:00.000000Z",
            "updated_at": "2026-04-09T10:00:00.000000Z"
        },
        "tags": [
            {
                "id": 1,
                "name": "urgent",
                "created_at": "2026-04-09T10:00:00.000000Z",
                "updated_at": "2026-04-09T10:00:00.000000Z",
                "pivot": {
                    "task_id": 1,
                    "tag_id": 1
                }
            },
            {
                "id": 2,
                "name": "frontend",
                "created_at": "2026-04-09T10:00:00.000000Z",
                "updated_at": "2026-04-09T10:00:00.000000Z",
                "pivot": {
                    "task_id": 1,
                    "tag_id": 2
                }
            }
        ]
    }
]
```

**POST /api/tasks -- створити задачу з тегами:**

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Write documentation",
    "description": "Update API docs for v2",
    "status": "pending",
    "priority": "medium",
    "user_id": 1,
    "category_id": 1,
    "tag_ids": [1, 3]
  }' | python3 -m json.tool
```

**PUT /api/tasks/1 -- оновити теги (sync):**

```bash
curl -s -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "status": "in_progress",
    "tag_ids": [2, 3]
  }' | python3 -m json.tool
```

Після `sync([2, 3])` -- тег "urgent" (id: 1) видалиться, тег "bug" (id: 3) додасться.

### Крок 10: Додаткові прийоми з зв'язками

**Приховати pivot-дані з JSON-відповіді:**

Зверніть увагу, що в JSON кожен тег має поле `pivot`. Щоб його прибрати:

```php
// В моделі Task
public function tags(): BelongsToMany
{
    return $this->belongsToMany(Tag::class)->withTimestamps();
}
```

Або при серіалізації:

```php
// В моделі Tag
protected $hidden = ['pivot'];
```

**withCount() в контролері:**

```php
public function index()
{
    // Отримати категорії з кількістю задач
    $categories = Category::withCount('tasks')->get();

    // Кожна категорія матиме поле tasks_count
    return response()->json($categories);
}
```

Результат:

```json
[
    {
        "id": 1,
        "name": "Work",
        "color": "#ef4444",
        "tasks_count": 2
    }
]
```

**whereHas() -- фільтрація по зв'язках:**

```php
// Задачі з тегом "urgent"
$urgentTasks = Task::whereHas('tags', function ($query) {
    $query->where('name', 'urgent');
})->get();

// Задачі в категоріях, що починаються з "W"
$tasks = Task::whereHas('category', function ($query) {
    $query->where('name', 'like', 'W%');
})->get();
```

---

## Перевірка

Після виконання всіх кроків переконайтесь:

1. У моделі Task є три зв'язки: `user()`, `category()`, `tags()`
2. У моделі Category є два зв'язки: `user()`, `tasks()`
3. У моделі User є два зв'язки: `tasks()`, `categories()`
4. У моделі Tag є один зв'язок: `tasks()`
5. `GET /api/tasks` повертає задачі з вкладеними `category` та `tags`
6. `POST /api/tasks` з `tag_ids` прикріплює теги
7. `PUT /api/tasks/{id}` з `tag_ids` синхронізує теги
8. В Tinker працює: `$task->category->name`, `$task->tags->pluck('name')`

---

## Міні-тест

**1. Який метод використовується для зв'язку "задача належить категорії"?**
- a) `hasMany`
- b) `belongsTo`
- c) `hasOne`
- d) `belongsToMany`

**2. Де зберігається зовнішній ключ `category_id`?**
- a) В таблиці `categories`
- b) В pivot-таблиці
- c) В таблиці `tasks`
- d) В обох таблицях

**3. Що робить `Task::with('category')->get()`?**
- a) Створює нову категорію
- b) Завантажує задачі та їх категорії за 2 SQL-запити (замість N+1)
- c) Фільтрує задачі за категорією
- d) Видаляє категорію із задачі

**4. Яка різниця між `attach()` та `sync()`?**
- a) Ніякої різниці
- b) `attach()` додає зв'язки, `sync()` встановлює ТОЧНИЙ набір (видаляє зайві)
- c) `sync()` додає зв'язки, `attach()` встановлює точний набір
- d) `attach()` для belongsTo, `sync()` для hasMany

**5. Як отримати категорії, в яких є хоча б одна задача?**
- a) `Category::with('tasks')->get()`
- b) `Category::has('tasks')->get()`
- c) `Category::whereHas('tasks')->get()`
- d) Як b), так і c)

---

## Практичне завдання

### Завдання: Підзадачі (self-referencing relationship)

Додайте можливість задачі мати підзадачі. Це самопосилальний зв'язок (self-referencing) -- Task hasMany Tasks.

**Крок 1:** Створіть міграцію для додавання стовпця `parent_id`:

```bash
php artisan make:migration add_parent_id_to_tasks_table
```

```php
public function up(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->foreignId('parent_id')->nullable()->constrained('tasks')->nullOnDelete();
    });
}

public function down(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->dropForeign(['parent_id']);
        $table->dropColumn('parent_id');
    });
}
```

**Крок 2:** Додайте зв'язки в модель Task:

```php
/**
 * Підзадачі цієї задачі.
 */
public function subtasks(): HasMany
{
    return $this->hasMany(Task::class, 'parent_id');
}

/**
 * Батьківська задача.
 */
public function parent(): BelongsTo
{
    return $this->belongsTo(Task::class, 'parent_id');
}
```

> Зверніть увагу: тут ми вказуємо `'parent_id'` явно, бо за конвенцією Laravel шукав би `task_id`, а не `parent_id`.

**Крок 3:** Додайте `parent_id` до `$fillable` в моделі Task.

**Крок 4:** Запустіть міграцію і протестуйте в Tinker:

```bash
php artisan migrate
php artisan tinker
```

```php
// Створіть батьківську задачу
$parent = \App\Models\Task::first();

// Створіть підзадачу
$subtask = $parent->subtasks()->create([
    'title' => 'Research solutions',
    'status' => 'pending',
    'priority' => 'medium',
    'user_id' => $parent->user_id,
]);

// Перевірте
$parent->subtasks;           // Collection [Task {title: "Research solutions", ...}]
$subtask->parent->title;     // "Fix bug #123"
$parent->subtasks()->count(); // 1
```

**Крок 5:** Оновіть контролер, щоб включати підзадачі:

```php
public function show(Task $task)
{
    $task->load(['category', 'tags', 'subtasks']);

    return response()->json($task);
}
```

**Бонус:** Додайте `withCount('subtasks')` до `index()` і перевірте, що кожна задача тепер має `subtasks_count`.

---

## Відповіді на тест

1. **b) `belongsTo`** -- Task belongsTo Category, бо `category_id` знаходиться в таблиці tasks.
2. **c) В таблиці `tasks`** -- зовнішній ключ завжди в таблиці, яка "належить" (belongsTo).
3. **b) Завантажує задачі та їх категорії за 2 SQL-запити** -- `with()` робить eager loading: один запит для tasks, один для categories.
4. **b) `attach()` додає, `sync()` встановлює точний набір** -- `sync([1,2])` видалить усі інші зв'язки та залишить тільки 1 і 2.
5. **d) Як b), так і c)** -- `has('tasks')` перевіряє наявність, `whereHas('tasks')` без колбека робить те саме. Різниця в тому, що `whereHas` дозволяє додати умову.
