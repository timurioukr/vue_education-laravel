# Урок 6: Eloquent моделі -- ORM, який замінює ваші fetch() виклики

## Що ви вивчите

- Що таке ORM та патерн ActiveRecord
- Створення моделей через `php artisan make:model`
- Конвенції: назва моделі (однина) -> назва таблиці (множина)
- `$fillable` -- захист від масового присвоєння (whitelist полів)
- `$guarded` -- протилежний підхід (blacklist)
- `$casts` -- приведення типів (дата -> Carbon, boolean -> bool)
- `$hidden` -- приховування полів у JSON (наприклад, password)
- CRUD-операції: create, read, update, delete через Eloquent
- Soft deletes: "м'яке" видалення без фізичного знищення даних
- Tinker -- інтерактивна консоль для тестування
- Оновлення контролерів з Уроку 4 для роботи з реальною базою

---

## Паралелі з JS/Vue

Це найважливіша таблиця в усьому курсі. Eloquent Model -- це як Pinia store + API client + TypeScript тип ВСЕ В ОДНОМУ:

| Vue / JS | Eloquent (Laravel) | Пояснення |
|---|---|---|
| `const { data } = await useFetch('/api/tasks')` | `Task::all()` | Отримати всі записи |
| `tasks.value.find(t => t.id === 1)` | `Task::find(1)` | Знайти за ID (але з бази даних) |
| `tasks.value.filter(t => t.status === 'pending')` | `Task::where('status', 'pending')->get()` | Фільтрація (але як SQL-запит) |
| `await $fetch('/api/tasks', { method: 'POST', body: {...} })` | `Task::create([...])` | Створити новий запис |
| `await $fetch('/api/tasks/1', { method: 'PUT', body })` | `$task->update([...])` | Оновити запис |
| `await $fetch('/api/tasks/1', { method: 'DELETE' })` | `$task->delete()` | Видалити запис |
| TypeScript `interface Task { id: number; ... }` | Model клас `Task` | Описує форму даних |
| `defineProps<{ title: string }>()` / accepted props | `$fillable = ['title', ...]` | Whitelist дозволених полів |
| Zod `.transform()` / TypeScript type coercion | `$casts = ['deadline' => 'date']` | Автоматичне перетворення типів |
| `.toJSON()` customization | `$hidden = ['password']` | Приховати поля при серіалізації |
| DevTools Console в браузері | `php artisan tinker` | Інтерактивне тестування |
| Lodash chain / RxJS pipe | `Task::where(...)->orderBy(...)->limit(5)->get()` | Ланцюжок методів |
| Pinia store (state + actions) | Eloquent Model (дані + методи) | Одна сутність для всього |

---

## Теорія

### Що таке ORM

**ORM (Object-Relational Mapping)** -- це спосіб працювати з базою даних через об'єкти замість SQL-запитів. Замість написання:

```sql
SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at DESC;
```

Ви пишете:

```php
Task::where('status', 'pending')->orderBy('created_at', 'desc')->get();
```

У Vue ви звикли робити HTTP-запити, щоб отримати дані:

```javascript
// Vue -- ви робите запит до API і отримуєте дані
const { data: tasks } = await useFetch('/api/tasks')
```

Eloquent робить те саме, але запит йде не до API, а напряму до бази даних:

```php
// Laravel -- запит напряму до бази даних
$tasks = Task::all(); // SELECT * FROM tasks
```

**ActiveRecord** -- це конкретний патерн ORM, який використовує Laravel. Суть проста: кожен об'єкт моделі -- це один рядок у таблиці. Ви працюєте з об'єктом, а Eloquent перекладає ваші дії в SQL.

### Створення моделі

```bash
php artisan make:model Task
```

Це створить файл `app/Models/Task.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    //
}
```

Порожній клас! І він вже працює. Laravel за конвенцією пов'яже модель `Task` з таблицею `tasks` (однина -> множина). Ви вже можете робити `Task::all()`, `Task::find(1)` тощо.

> **Конвенції імен:**
> - Модель `Task` -> таблиця `tasks`
> - Модель `Category` -> таблиця `categories`
> - Модель `TaskTag` -> таблиця `task_tags`
> 
> Якщо таблиця називається інакше, можна перевизначити: `protected $table = 'my_custom_table';`

### $fillable -- захист від масового присвоєння

Це одна з найважливіших концепцій безпеки в Laravel. Уявіть ситуацію:

```javascript
// Vue -- ви відправляєте дані з форми
await $fetch('/api/tasks', {
    method: 'POST',
    body: {
        title: 'Learn Laravel',
        status: 'pending',
        user_id: 999  // !!! Хакер додав це поле
    }
})
```

Без `$fillable` Laravel прийме ВСІ поля, включаючи `user_id: 999`, і хакер зможе створити задачу від імені іншого користувача.

`$fillable` -- це whitelist полів, які **дозволено** заповнювати через масове присвоєння:

```php
class Task extends Model
{
    // Тільки ці поля можна заповнити через Task::create() або $task->update()
    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'deadline',
        'category_id',
    ];
    // user_id НЕ в списку -- його встановлюємо окремо в контролері
}
```

Це як `defineProps` у Vue компоненті -- ви явно вказуєте, які "пропси" приймає модель. Все інше ігнорується.

### $guarded -- протилежний підхід

Замість whitelist (що ДОЗВОЛЕНО), можна використати blacklist (що ЗАБОРОНЕНО):

```php
class Task extends Model
{
    // Заборонити масове присвоєння тільки для id
    protected $guarded = ['id'];
}
```

Або зняти захист повністю (НЕ рекомендується для продакшену):

```php
protected $guarded = []; // Все дозволено
```

Для навчання `$guarded = []` зручніше, але для реальних проєктів завжди використовуйте `$fillable`.

### $casts -- приведення типів

У Vue ви часто стикаєтесь з тим, що дані з API приходять не в тому типі:

```javascript
// Vue -- дата приходить як рядок, треба конвертувати
const task = await $fetch('/api/tasks/1')
const deadline = new Date(task.deadline)     // string -> Date
const isCompleted = Boolean(task.is_completed) // 0/1 -> boolean
```

В Eloquent `$casts` робить це автоматично:

```php
class Task extends Model
{
    protected function casts(): array
    {
        return [
            'deadline' => 'date',        // string -> Carbon (об'єкт дати)
            'priority' => 'integer',     // string -> int
            'is_completed' => 'boolean', // 0/1 -> true/false
            'metadata' => 'array',       // JSON string -> PHP array
        ];
    }
}
```

Тепер коли ви читаєте `$task->deadline`, ви отримуєте об'єкт Carbon (потужна бібліотека для роботи з датами), а не просто рядок. Це як Zod `.transform()` -- автоматичне перетворення типів.

### $hidden -- приховування полів у JSON

Коли ви повертаєте модель як JSON, деякі поля не повинні потрапляти в відповідь:

```php
class User extends Model
{
    // Ці поля НЕ будуть в JSON-відповіді
    protected $hidden = [
        'password',
        'remember_token',
    ];
}
```

Це як кастомний `.toJSON()` в JavaScript -- ви контролюєте, що бачить клієнт.

### CRUD-операції з Eloquent

#### CREATE -- створення записів

```php
// Спосіб 1: Task::create() -- масове присвоєння (використовує $fillable)
$task = Task::create([
    'title' => 'Learn Eloquent',
    'status' => 'pending',
    'priority' => 2,
    'user_id' => 1,
]);
// $task -- це вже збережений об'єкт з id, created_at тощо

// Спосіб 2: new + save() -- покроковий
$task = new Task();
$task->title = 'Learn Eloquent';
$task->status = 'pending';
$task->user_id = 1;
$task->save();

// Спосіб 3: firstOrCreate -- знайти або створити
$task = Task::firstOrCreate(
    ['title' => 'Learn Eloquent', 'user_id' => 1],  // Шукати за цими полями
    ['status' => 'pending', 'priority' => 2]          // Якщо не знайшли -- створити з цими
);
```

**У Vue це як:**
```javascript
// Task::create([...]) ~= await $fetch('/api/tasks', { method: 'POST', body: {...} })
// Але без HTTP -- напряму в базу даних
```

#### READ -- читання записів

```php
// Отримати ВСЕ
$tasks = Task::all();
// ~= const { data } = await useFetch('/api/tasks')

// Знайти за ID
$task = Task::find(1);       // Повертає null, якщо не знайдено
$task = Task::findOrFail(1); // Кидає 404, якщо не знайдено
// ~= tasks.value.find(t => t.id === 1), але з бази даних

// Фільтрація
$pending = Task::where('status', 'pending')->get();
// ~= tasks.value.filter(t => t.status === 'pending'), але як SQL

// Перший результат
$first = Task::where('status', 'pending')->first();
// ~= tasks.value.find(t => t.status === 'pending')

// Кількість
$count = Task::where('status', 'pending')->count();
// ~= tasks.value.filter(t => t.status === 'pending').length

// Тільки значення одного поля
$titles = Task::where('status', 'done')->pluck('title');
// ~= tasks.value.filter(t => t.status === 'done').map(t => t.title)

// Кілька умов
$urgentPending = Task::where('status', 'pending')
    ->where('priority', '>=', 2)
    ->orderBy('deadline', 'asc')
    ->limit(5)
    ->get();
// ~= tasks.value
//      .filter(t => t.status === 'pending' && t.priority >= 2)
//      .sort((a, b) => a.deadline - b.deadline)
//      .slice(0, 5)
```

#### UPDATE -- оновлення записів

```php
// Спосіб 1: find + update (масове присвоєння)
$task = Task::findOrFail(1);
$task->update([
    'title' => 'Updated title',
    'status' => 'in_progress',
]);

// Спосіб 2: змінити поле і зберегти
$task = Task::findOrFail(1);
$task->title = 'Updated title';
$task->status = 'in_progress';
$task->save();
```

**У Vue це як:**
```javascript
// $task->update([...]) ~= await $fetch('/api/tasks/1', { method: 'PUT', body: {...} })
```

#### DELETE -- видалення записів

```php
// Спосіб 1: знайти і видалити
$task = Task::findOrFail(1);
$task->delete();

// Спосіб 2: видалити за ID без пошуку
Task::destroy(1);
// Або кілька одразу:
Task::destroy([1, 2, 3]);
```

**У Vue це як:**
```javascript
// $task->delete() ~= await $fetch('/api/tasks/1', { method: 'DELETE' })
```

### Soft Deletes -- "м'яке" видалення

У Уроці 5 ми додали `$table->softDeletes()` до таблиці tasks. Тепер потрібно активувати цю функцію в моделі:

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes; // Активує м'яке видалення
}
```

Після цього:

```php
$task->delete();     // НЕ видаляє з бази! Просто ставить deleted_at = now()
$task->trashed();    // true -- задача "в кошику"
$task->restore();    // Відновити з кошика (deleted_at = null)
$task->forceDelete(); // Фізично видалити з бази (назавжди)

// Task::all() НЕ покаже "видалені" задачі
// Щоб побачити все, включаючи видалені:
Task::withTrashed()->get();

// Тільки видалені:
Task::onlyTrashed()->get();
```

Це як кошик у macOS -- ви видаляєте файл, але він ще існує і його можна відновити.

### Tinker -- ваша DevTools Console для бекенду

У браузері ви відкриваєте DevTools Console і тестуєте JavaScript вживу. В Laravel є `tinker` -- інтерактивна PHP-консоль:

```bash
php artisan tinker
```

В tinker ви можете виконувати будь-який PHP-код, включаючи Eloquent-запити:

```php
>>> Task::all()
>>> Task::create(['title' => 'Test', 'user_id' => 1])
>>> Task::where('status', 'pending')->count()
>>> Task::find(1)->update(['status' => 'done'])
```

Це найкращий спосіб швидко протестувати запити без створення маршрутів та curl-запитів.

---

## Практика: крок за кроком

### Крок 1: Створіть моделі

```bash
cd ~/task-manager-api

php artisan make:model Task
php artisan make:model Category
php artisan make:model Tag
```

> **Примітка:** модель `User` вже існує в `app/Models/User.php` -- Laravel створив її автоматично.

### Крок 2: Налаштуйте модель Task

Відкрийте `app/Models/Task.php` і замініть вміст:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'notes',
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
            'priority' => 'integer',
        ];
    }
}
```

**Що тут відбувається:**

- `use SoftDeletes` -- активує м'яке видалення (таблиця вже має `deleted_at` з Уроку 5)
- `$fillable` -- перелік полів, які можна заповнити через `Task::create()`. Зверніть увагу: `id`, `created_at`, `updated_at`, `deleted_at` НЕ в списку -- вони заповнюються автоматично.
- `casts()` -- `deadline` автоматично стає об'єктом Carbon, `priority` -- цілим числом.

### Крок 3: Налаштуйте модель Category

Відкрийте `app/Models/Category.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'name',
        'color',
        'user_id',
    ];
}
```

### Крок 4: Налаштуйте модель Tag

Відкрийте `app/Models/Tag.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $fillable = [
        'name',
        'user_id',
    ];
}
```

### Крок 5: Тестуємо в Tinker -- створення даних

Спочатку потрібно створити користувача, бо tasks, categories та tags мають foreign key на users:

```bash
php artisan tinker
```

```php
// Створюємо користувача (потрібен для foreign keys)
$user = \App\Models\User::create([
    'name' => 'Timur',
    'email' => 'timur@example.com',
    'password' => bcrypt('password123'),
]);
// => App\Models\User {id: 1, name: "Timur", ...}

// Створюємо 3 категорії
$work = \App\Models\Category::create(['name' => 'Work', 'color' => '#3B82F6', 'user_id' => 1]);
$personal = \App\Models\Category::create(['name' => 'Personal', 'color' => '#10B981', 'user_id' => 1]);
$learning = \App\Models\Category::create(['name' => 'Learning', 'color' => '#8B5CF6', 'user_id' => 1]);

// Створюємо 5 задач
\App\Models\Task::create([
    'title' => 'Set up Laravel project',
    'description' => 'Install Laravel and configure database',
    'status' => 'done',
    'priority' => 2,
    'user_id' => 1,
    'category_id' => 1,
]);

\App\Models\Task::create([
    'title' => 'Learn Eloquent ORM',
    'description' => 'Understand models, CRUD operations, and relationships',
    'status' => 'in_progress',
    'priority' => 3,
    'deadline' => '2026-04-15',
    'user_id' => 1,
    'category_id' => 3,
]);

\App\Models\Task::create([
    'title' => 'Build REST API',
    'description' => 'Create controllers and routes for Task Manager',
    'status' => 'pending',
    'priority' => 2,
    'deadline' => '2026-04-20',
    'user_id' => 1,
    'category_id' => 1,
]);

\App\Models\Task::create([
    'title' => 'Buy groceries',
    'status' => 'pending',
    'priority' => 1,
    'user_id' => 1,
    'category_id' => 2,
]);

\App\Models\Task::create([
    'title' => 'Write unit tests',
    'description' => 'Cover all API endpoints with tests',
    'status' => 'pending',
    'priority' => 1,
    'deadline' => '2026-04-25',
    'user_id' => 1,
    'category_id' => 1,
]);

// Створюємо 5 тегів
\App\Models\Tag::create(['name' => 'urgent', 'user_id' => 1]);
\App\Models\Tag::create(['name' => 'bug', 'user_id' => 1]);
\App\Models\Tag::create(['name' => 'feature', 'user_id' => 1]);
\App\Models\Tag::create(['name' => 'documentation', 'user_id' => 1]);
\App\Models\Tag::create(['name' => 'refactoring', 'user_id' => 1]);
```

### Крок 6: Тестуємо в Tinker -- читання та фільтрація

Не виходячи з tinker (або запустіть `php artisan tinker` знову):

```php
// Всі задачі
\App\Models\Task::all();
// => Collection of 5 tasks

// Кількість задач
\App\Models\Task::count();
// => 5

// Знайти за ID
\App\Models\Task::find(2);
// => Task {id: 2, title: "Learn Eloquent ORM", ...}

// findOrFail -- кидає виняток (404) якщо не знайдено
\App\Models\Task::findOrFail(99);
// => Illuminate\Database\Eloquent\ModelNotFoundException

// Фільтрація за статусом
\App\Models\Task::where('status', 'pending')->get();
// => Collection of 3 tasks

// Кількість pending задач
\App\Models\Task::where('status', 'pending')->count();
// => 3

// Задачі з високим пріоритетом
\App\Models\Task::where('priority', '>=', 2)->get();
// => Collection of 3 tasks (priority 2 та 3)

// Тільки назви задач зі статусом done
\App\Models\Task::where('status', 'done')->pluck('title');
// => ["Set up Laravel project"]

// Всі категорії
\App\Models\Category::all();
// => Collection of 3 categories

// Всі теги
\App\Models\Tag::all();
// => Collection of 5 tags
```

### Крок 7: Тестуємо в Tinker -- оновлення та видалення

```php
// Оновити статус задачі
$task = \App\Models\Task::find(3);
$task->update(['status' => 'in_progress']);
$task->fresh(); // Перечитати з бази
// => Task {id: 3, status: "in_progress", ...}

// Або так:
$task = \App\Models\Task::find(4);
$task->status = 'done';
$task->save();

// М'яке видалення
$task = \App\Models\Task::find(4);
$task->delete();

// Задача "видалена", але все ще в базі
\App\Models\Task::count();
// => 4 (без "видаленої")

\App\Models\Task::withTrashed()->count();
// => 5 (включаючи "видалену")

// Перевірити, чи задача в кошику
$task = \App\Models\Task::withTrashed()->find(4);
$task->trashed();
// => true

// Відновити з кошика
$task->restore();
\App\Models\Task::count();
// => 5 (знову всі на місці)

// Вихід з Tinker
exit
```

### Крок 8: Оновіть TaskController для роботи з Eloquent

Відкрийте `app/Http/Controllers/TaskController.php` і замініть хардкожені дані на Eloquent-запити:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    /**
     * GET /api/tasks -- список всіх задач
     */
    public function index(): JsonResponse
    {
        $tasks = Task::all();

        return response()->json($tasks);
    }

    /**
     * POST /api/tasks -- створити нову задачу
     */
    public function store(Request $request): JsonResponse
    {
        $task = Task::create([
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'status' => $request->input('status', 'pending'),
            'priority' => $request->input('priority', 0),
            'deadline' => $request->input('deadline'),
            'user_id' => 1, // Поки хардкодимо, бо немає автентифікації
            'category_id' => $request->input('category_id'),
        ]);

        return response()->json($task, 201);
    }

    /**
     * GET /api/tasks/{id} -- показати одну задачу
     */
    public function show(string $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        return response()->json($task);
    }

    /**
     * PUT /api/tasks/{id} -- оновити задачу
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $task->update([
            'title' => $request->input('title', $task->title),
            'description' => $request->input('description', $task->description),
            'status' => $request->input('status', $task->status),
            'priority' => $request->input('priority', $task->priority),
            'deadline' => $request->input('deadline', $task->deadline),
            'category_id' => $request->input('category_id', $task->category_id),
        ]);

        return response()->json($task);
    }

    /**
     * DELETE /api/tasks/{id} -- видалити задачу
     */
    public function destroy(string $id): Response
    {
        $task = Task::findOrFail($id);
        $task->delete(); // Soft delete завдяки SoftDeletes trait

        return response()->noContent();
    }
}
```

**Що змінилось:**

- `index()` -- замість хардкоженого масиву тепер `Task::all()` бере реальні дані з бази
- `store()` -- `Task::create()` зберігає нову задачу в базу і повертає її з `id`, `created_at` тощо
- `show()` -- `Task::findOrFail()` шукає задачу в базі; якщо не знайде -- автоматично поверне 404
- `update()` -- знаходить задачу і оновлює тільки передані поля
- `destroy()` -- знаходить і "м'яко" видаляє (ставить `deleted_at`)

### Крок 9: Запустіть сервер і протестуйте API

```bash
php artisan serve
```

В іншому терміналі:

```bash
# GET -- список всіх задач (з реальної бази!)
curl http://localhost:8000/api/tasks
# [{"id":1,"title":"Set up Laravel project","description":"Install Laravel and configure database",
#   "status":"done","priority":2,"deadline":null,"user_id":1,"category_id":1,
#   "created_at":"2026-04-09T...","updated_at":"2026-04-09T...","deleted_at":null}, ...]

# GET -- одна задача
curl http://localhost:8000/api/tasks/2
# {"id":2,"title":"Learn Eloquent ORM","description":"Understand models...","status":"in_progress",...}

# GET -- неіснуюча задача (автоматичний 404 від findOrFail)
curl http://localhost:8000/api/tasks/999 -w "\nHTTP Status: %{http_code}\n"
# {"message":"No query results for model [App\\Models\\Task] 999"}
# HTTP Status: 404

# POST -- створити нову задачу
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Deploy to production", "priority": 3, "deadline": "2026-05-01", "category_id": 1}'
# {"id":6,"title":"Deploy to production","status":"pending","priority":3,
#  "deadline":"2026-05-01","user_id":1,"category_id":1,"created_at":"...","updated_at":"..."}

# PUT -- оновити задачу
curl -X PUT http://localhost:8000/api/tasks/3 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "priority": 3}'
# {"id":3,"title":"Build REST API","status":"in_progress","priority":3,...}

# DELETE -- м'яко видалити задачу
curl -X DELETE http://localhost:8000/api/tasks/6 -w "\nHTTP Status: %{http_code}\n"
# HTTP Status: 204

# Перевірте: задача зникла зі списку
curl http://localhost:8000/api/tasks
# Задача з id=6 більше не повертається (але вона все ще в базі з deleted_at)
```

### Крок 10: Перевірте soft delete в Tinker

```bash
php artisan tinker
```

```php
// Звичайний запит -- не покаже видалену задачу
\App\Models\Task::count();
// => 5

// Включаючи видалені
\App\Models\Task::withTrashed()->count();
// => 6

// Знайти видалену задачу
$task = \App\Models\Task::withTrashed()->find(6);
$task->trashed();
// => true

// Відновити
$task->restore();
\App\Models\Task::count();
// => 6

exit
```

---

## Перевірка

Після виконання всіх кроків:

1. Існують три моделі: `app/Models/Task.php`, `app/Models/Category.php`, `app/Models/Tag.php`
2. `php artisan tinker` -> `Task::count()` повертає 5 або 6 (залежно від того, чи ви відновили видалену задачу)
3. `curl http://localhost:8000/api/tasks` повертає JSON-масив реальних задач з бази даних
4. `curl http://localhost:8000/api/tasks/999` повертає 404 з повідомленням
5. POST-запит створює реальний запис у базі (перевірте через `curl http://localhost:8000/api/tasks`)
6. DELETE-запит ставить `deleted_at` (soft delete), задача зникає зі списку, але залишається в базі

---

## Міні-тест

**1. Що таке `$fillable` в Eloquent-моделі?**

a) Список полів, які будуть показані в JSON
b) Список полів, які дозволено заповнювати через масове присвоєння (create/update)
c) Список обов'язкових полів
d) Список полів з default-значеннями

**2. Що повертає `Task::findOrFail(99)`, якщо задачі з id=99 не існує?**

a) `null`
b) Порожній масив `[]`
c) Виняток ModelNotFoundException (HTTP 404)
d) `false`

**3. Яка різниця між `$task->delete()` і `$task->forceDelete()` при використанні SoftDeletes?**

a) Ніякої різниці
b) `delete()` ставить `deleted_at`, `forceDelete()` фізично видаляє з бази
c) `delete()` видаляє з бази, `forceDelete()` ставить `deleted_at`
d) `forceDelete()` видаляє разом зі зв'язаними записами

**4. Що робить `$casts = ['deadline' => 'date']`?**

a) Забороняє значення NULL для deadline
b) Автоматично конвертує deadline з рядка в об'єкт Carbon при читанні з бази
c) Робить deadline обов'язковим полем
d) Створює колонку deadline в базі даних

**5. Чому `user_id` НЕ потрібно додавати в `$fillable`?**

a) Laravel додає його автоматично
b) user_id -- не поле таблиці
c) Бо user_id не повинен прийматись від клієнта -- його встановлює серверна логіка
d) Бо user_id -- це primary key

---

## Практичне завдання

### Завдання: Повний CRUD для CategoryController з Eloquent

1. **Оновіть `CategoryController`** -- замініть хардкожені дані на Eloquent-запити:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::all();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $category = Category::create([
            'name' => $request->input('name'),
            'color' => $request->input('color', '#6B7280'),
            'user_id' => 1, // Поки хардкодимо
        ]);

        return response()->json($category, 201);
    }

    public function show(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        return response()->json($category);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $category->update([
            'name' => $request->input('name', $category->name),
            'color' => $request->input('color', $category->color),
        ]);

        return response()->json($category);
    }

    public function destroy(string $id): Response
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->noContent();
    }
}
```

2. **Протестуйте ВСІ 5 ендпоінтів:**

```bash
# GET -- список категорій
curl http://localhost:8000/api/categories

# POST -- створити категорію
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Health", "color": "#EF4444"}'

# GET -- одна категорія
curl http://localhost:8000/api/categories/1

# PUT -- оновити категорію
curl -X PUT http://localhost:8000/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Work & Career", "color": "#2563EB"}'

# DELETE -- видалити категорію
curl -X DELETE http://localhost:8000/api/categories/4 -w "\nHTTP Status: %{http_code}\n"
```

3. **Перевірте в Tinker:**

```bash
php artisan tinker
```

```php
\App\Models\Category::all();
\App\Models\Category::where('color', '#EF4444')->first();
\App\Models\Category::count();
```

4. **Бонус:** Подивіться, що станеться з задачами, якщо видалити категорію, яка має задачі. Пригадайте: ми використали `nullOnDelete()` для `category_id` в міграції tasks.

```bash
# Перевірте category_id задачі до видалення категорії
curl http://localhost:8000/api/tasks/1
# "category_id": 1

# Видаліть категорію з id=1
curl -X DELETE http://localhost:8000/api/categories/1 -w "\nHTTP Status: %{http_code}\n"

# Перевірте задачу знову
curl http://localhost:8000/api/tasks/1
# "category_id": null  <-- Стало null замість видалення задачі!
```

---

## Відповіді на тест

1. **b) Список полів, які дозволено заповнювати через масове присвоєння** -- `$fillable` захищає від ситуації, коли клієнт відправляє поля, які не повинен заповнювати (наприклад, `user_id`, `is_admin`). Це whitelist -- тільки перелічені поля будуть прийняті в `create()` та `update()`.

2. **c) Виняток ModelNotFoundException (HTTP 404)** -- `findOrFail()` кидає виняток, який Laravel автоматично конвертує в 404-відповідь. Якщо хочете отримати `null` замість помилки, використовуйте просто `find()`.

3. **b) `delete()` ставить `deleted_at`, `forceDelete()` фізично видаляє** -- при використанні трейту `SoftDeletes` метод `delete()` не видаляє запис, а лише ставить мітку часу в поле `deleted_at`. `forceDelete()` виконує справжнє SQL DELETE.

4. **b) Автоматично конвертує deadline в об'єкт Carbon при читанні з бази** -- `$casts` працює при читанні з бази (string -> Carbon) і при записі в базу (Carbon -> string). Це як Zod `.transform()` -- автоматичне перетворення типів.

5. **c) Бо user_id не повинен прийматись від клієнта** -- `user_id` встановлюється серверною логікою (автентифікований користувач), а не приходить від клієнта. Якщо додати `user_id` в `$fillable`, хакер зможе створити задачу від імені іншого користувача. Це ключовий принцип безпеки.
