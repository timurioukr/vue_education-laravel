# Тиждень 2: Побудова API -- Тестування

---

## Частина 1: Теоретичний тест (15 питань)

### Eloquent Relationships (3 питання)

**1. Який тип зв'язку потрібен між `User` та `Profile`, якщо кожен користувач має рівно один профіль?**

- A) `hasMany`
- B) `belongsTo`
- C) `hasOne`
- D) `belongsToMany`

**2. У тебе є моделі `Post` і `Tag`. Один пост може мати багато тегів, і один тег може належати багатьом постам. Який тип зв'язку використати?**

- A) `hasMany` / `belongsTo`
- B) `hasOne` / `belongsTo`
- C) `belongsToMany` / `belongsToMany`
- D) `morphMany` / `morphTo`

**3. Модель `Category` має багато `Task`, а кожна `Task` належить одній `Category`. Які методи зв'язків потрібно визначити?**

- A) `Category::belongsTo('Task')` та `Task::hasMany('Category')`
- B) `Category::hasMany(Task::class)` та `Task::belongsTo(Category::class)`
- C) `Category::belongsToMany(Task::class)` та `Task::belongsToMany(Category::class)`
- D) `Category::hasOne(Task::class)` та `Task::hasOne(Category::class)`

---

### Validation / Form Requests (3 питання)

**4. Яке правило валідації гарантує, що поле `email` є коректною email-адресою, обов'язковим та унікальним у таблиці `users`?**

- A) `'email' => 'required|string|max:255'`
- B) `'email' => 'required|email|unique:users'`
- C) `'email' => 'nullable|email'`
- D) `'email' => 'required|exists:users'`

**5. У `FormRequest` метод `authorize()` повертає `false`. Що станеться при надсиланні запиту?**

- A) Валідація пройде, але дані не збережуться
- B) Laravel поверне відповідь 403 Forbidden
- C) Laravel поверне відповідь 422 Unprocessable Entity
- D) Додаток впаде з 500 помилкою

**6. Потрібно валідувати поле `deadline`, щоб воно було датою і не раніше за сьогодні. Які правила використати?**

- A) `'deadline' => 'required|string|min:10'`
- B) `'deadline' => 'required|date|after_or_equal:today'`
- C) `'deadline' => 'required|date|before:today'`
- D) `'deadline' => 'nullable|integer'`

---

### API Resources (3 питання)

**7. Який метод потрібно реалізувати в API Resource класі, щоб визначити структуру JSON-відповіді?**

- A) `transform()`
- B) `toJson()`
- C) `toArray($request)`
- D) `serialize()`

**8. Як у API Resource включити зв'язок `category` тільки тоді, коли він був завантажений (eager loaded)?**

- A) `'category' => $this->category`
- B) `'category' => $this->whenLoaded('category')`
- C) `'category' => $this->category ?? null`
- D) `'category' => $this->loadCategory()`

**9. Як правильно повернути колекцію моделей через API Resource з пагінацією?**

- A) `return response()->json(Task::all());`
- B) `return TaskResource::collection(Task::paginate(15));`
- C) `return Task::paginate(15)->toJson();`
- D) `return new TaskResource(Task::all());`

---

### Error Handling (2 питання)

**10. Клієнт надсилає POST-запит для створення задачі, але не передає обов'язкове поле `title`. Який HTTP-статус код поверне Laravel?**

- A) 400 Bad Request
- B) 401 Unauthorized
- C) 404 Not Found
- D) 422 Unprocessable Entity

**11. Клієнт робить `GET /api/tasks/9999`, але задачі з таким ID не існує. Якщо в контролері використано `Task::findOrFail($id)`, який статус код отримає клієнт?**

- A) 200 OK з порожнім тілом
- B) 204 No Content
- C) 404 Not Found
- D) 500 Internal Server Error

---

### Factories / Seeders (2 питання)

**12. Яка команда Artisan створить factory для моделі `Task`?**

- A) `php artisan make:factory TaskFactory`
- B) `php artisan make:seed TaskFactory`
- C) `php artisan make:model Task --factory`
- D) Обидва варіанти A і C правильні

**13. У сідері потрібно створити 50 задач, кожна з випадковою категорією. Який підхід найкращий?**

- A) Використати цикл `for` та вручну вставляти рядки через `DB::insert()`
- B) `Task::factory()->count(50)->create()` з визначенням `category_id` через `Category::factory()` у фабриці
- C) Написати SQL-запит напряму
- D) Створити 50 окремих сідерів

---

### Scopes / Filtering / Sorting (2 питання)

**14. Як правильно визначити локальний scope `pending` в моделі `Task`?**

- A) `public function pending($query) { return $query->where('status', 'pending'); }`
- B) `public function scopePending(Builder $query): Builder { return $query->where('status', 'pending'); }`
- C) `public static function pending() { return self::where('status', 'pending'); }`
- D) `public function scope() { return $this->where('status', 'pending'); }`

**15. У контролері потрібно фільтрувати задачі за статусом тільки якщо параметр `status` присутній у запиті. Який підхід правильний?**

- A) `Task::where('status', $request->status)->get()`
- B) `Task::when($request->status, fn($q, $status) => $q->where('status', $status))->get()`
- C) `if ($request->status) { $tasks = Task::where('status', $request->status)->get(); } else { $tasks = Task::all(); }`
- D) Варіанти B і C обидва працюють, але B -- елегантніший

---

## Частина 2: Практичне завдання

Повний API workflow з використанням curl-команд. Кожен крок потрібно виконати послідовно.

### Крок 1: Підготовка бази даних

```bash
php artisan migrate:fresh --seed
```

Очікуваний результат: таблиці створені, сідери заповнили базу даними (категорії, задачі, теги).

---

### Крок 2: GET /api/categories -- список категорій з пагінацією

```bash
curl -s http://localhost:8000/api/categories | jq
```

**Очікуваний формат відповіді (200 OK):**

```json
{
    "data": [
        {
            "id": 1,
            "name": "Work",
            "slug": "work",
            "tasks_count": 12
        },
        {
            "id": 2,
            "name": "Personal",
            "slug": "personal",
            "tasks_count": 8
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/categories?page=1",
        "last": "http://localhost:8000/api/categories?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "last_page": 1,
        "per_page": 15,
        "total": 2
    }
}
```

**На що звернути увагу:**
- Дані обгорнуті в `"data"` (API Resource)
- Присутні `links` і `meta` (пагінація)
- Немає службових полів моделі (`created_at`, `updated_at`), якщо вони не потрібні

---

### Крок 3: POST /api/tasks -- створення задачі (валідація)

#### 3a: Невалідний запит (без обов'язкових полів)

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{}' | jq
```

**Очікуваний формат відповіді (422 Unprocessable Entity):**

```json
{
    "message": "The title field is required. (and 1 more error)",
    "errors": {
        "title": [
            "The title field is required."
        ],
        "category_id": [
            "The category id field is required."
        ]
    }
}
```

#### 3b: Валідний запит

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Вивчити Eloquent relationships",
    "description": "Розібратись з hasMany, belongsTo, belongsToMany",
    "category_id": 1,
    "priority": "high",
    "status": "pending",
    "deadline": "2026-04-20"
  }' | jq
```

**Очікуваний формат відповіді (201 Created):**

```json
{
    "data": {
        "id": 51,
        "title": "Вивчити Eloquent relationships",
        "description": "Розібратись з hasMany, belongsTo, belongsToMany",
        "status": "pending",
        "priority": "high",
        "deadline": "2026-04-20",
        "category": {
            "id": 1,
            "name": "Work",
            "slug": "work"
        },
        "tags": [],
        "created_at": "2026-04-09T12:00:00.000000Z"
    }
}
```

**На що звернути увагу:**
- Статус код 201 (не 200)
- Дані обгорнуті в `"data"` (API Resource)
- Категорія повертається як вкладений об'єкт, а не просто `category_id`

---

### Крок 4: PUT /api/tasks/{id} -- оновлення задачі з тегами

```bash
curl -s -X PUT http://localhost:8000/api/tasks/51 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Вивчити Eloquent relationships",
    "description": "Розібратись з hasMany, belongsTo, belongsToMany та pivot tables",
    "category_id": 1,
    "priority": "high",
    "status": "in_progress",
    "deadline": "2026-04-20",
    "tags": [1, 3, 5]
  }' | jq
```

**Очікуваний формат відповіді (200 OK):**

```json
{
    "data": {
        "id": 51,
        "title": "Вивчити Eloquent relationships",
        "description": "Розібратись з hasMany, belongsTo, belongsToMany та pivot tables",
        "status": "in_progress",
        "priority": "high",
        "deadline": "2026-04-20",
        "category": {
            "id": 1,
            "name": "Work",
            "slug": "work"
        },
        "tags": [
            {
                "id": 1,
                "name": "urgent"
            },
            {
                "id": 3,
                "name": "learning"
            },
            {
                "id": 5,
                "name": "backend"
            }
        ],
        "created_at": "2026-04-09T12:00:00.000000Z"
    }
}
```

**На що звернути увагу:**
- Теги прикріплені через `sync()` (belongsToMany)
- Статус змінився на `in_progress`
- Теги повертаються як масив об'єктів (через API Resource), а не масив ID

---

### Крок 5: GET /api/tasks -- фільтрація та сортування

```bash
curl -s "http://localhost:8000/api/tasks?status=pending&sort=deadline&order=asc" | jq
```

**Очікуваний формат відповіді (200 OK):**

```json
{
    "data": [
        {
            "id": 3,
            "title": "Buy groceries",
            "status": "pending",
            "priority": "low",
            "deadline": "2026-04-10",
            "category": {
                "id": 2,
                "name": "Personal",
                "slug": "personal"
            },
            "tags": []
        },
        {
            "id": 7,
            "title": "Prepare presentation",
            "status": "pending",
            "priority": "medium",
            "deadline": "2026-04-15",
            "category": {
                "id": 1,
                "name": "Work",
                "slug": "work"
            },
            "tags": [
                {
                    "id": 2,
                    "name": "work"
                }
            ]
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/tasks?page=1",
        "last": "http://localhost:8000/api/tasks?page=2",
        "prev": null,
        "next": "http://localhost:8000/api/tasks?page=2"
    },
    "meta": {
        "current_page": 1,
        "last_page": 2,
        "per_page": 15,
        "total": 20
    }
}
```

**На що звернути увагу:**
- Всі задачі мають `status: "pending"` (фільтр працює)
- Відсортовано по `deadline` за зростанням
- Пагінація присутня
- Кожна задача містить `category` та `tags` (eager loading)

---

### Крок 6: GET /api/tasks/{id} -- одна задача з вкладеними зв'язками

```bash
curl -s http://localhost:8000/api/tasks/51 | jq
```

**Очікуваний формат відповіді (200 OK):**

```json
{
    "data": {
        "id": 51,
        "title": "Вивчити Eloquent relationships",
        "description": "Розібратись з hasMany, belongsTo, belongsToMany та pivot tables",
        "status": "in_progress",
        "priority": "high",
        "deadline": "2026-04-20",
        "category": {
            "id": 1,
            "name": "Work",
            "slug": "work"
        },
        "tags": [
            {
                "id": 1,
                "name": "urgent"
            },
            {
                "id": 3,
                "name": "learning"
            },
            {
                "id": 5,
                "name": "backend"
            }
        ],
        "created_at": "2026-04-09T12:00:00.000000Z"
    }
}
```

**На що звернути увагу:**
- Одна задача обгорнута в `"data"` (API Resource)
- Вкладена `category` -- повний об'єкт
- Вкладені `tags` -- масив об'єктів
- Жодних зайвих полів (`pivot`, `laravel_through_key` тощо)

---

### Крок 7: GET /api/tasks?search=keyword -- пошук

```bash
curl -s "http://localhost:8000/api/tasks?search=Eloquent" | jq
```

**Очікуваний формат відповіді (200 OK):**

```json
{
    "data": [
        {
            "id": 51,
            "title": "Вивчити Eloquent relationships",
            "description": "Розібратись з hasMany, belongsTo, belongsToMany та pivot tables",
            "status": "in_progress",
            "priority": "high",
            "deadline": "2026-04-20",
            "category": {
                "id": 1,
                "name": "Work",
                "slug": "work"
            },
            "tags": [
                {
                    "id": 1,
                    "name": "urgent"
                },
                {
                    "id": 3,
                    "name": "learning"
                },
                {
                    "id": 5,
                    "name": "backend"
                }
            ]
        }
    ],
    "links": { "..." : "..." },
    "meta": { "..." : "..." }
}
```

**На що звернути увагу:**
- Пошук працює по `title` і `description` (через `LIKE %keyword%`)
- Результати все ще мають пагінацію та формат API Resource

---

### Крок 8: DELETE /api/tasks/{id} -- видалення та перевірка

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:8000/api/tasks/51
```

**Очікувана відповідь:** `204` (No Content, порожнє тіло)

**Перевірка, що задача видалена:**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/tasks/51
```

**Очікувана відповідь:** `404`

```bash
curl -s http://localhost:8000/api/tasks/51 \
  -H "Accept: application/json" | jq
```

**Очікуваний формат відповіді (404 Not Found):**

```json
{
    "message": "Task not found."
}
```

**На що звернути увагу:**
- DELETE повертає 204 без тіла
- Повторний GET повертає 404
- Заголовок `Accept: application/json` потрібен, щоб отримати JSON-помилку замість HTML

---

### Чек-лист для перевірки API Resources

Для кожної відповіді переконайся:

- [ ] Дані обгорнуті в ключ `"data"`
- [ ] Немає витоку службових полів (`password`, `remember_token`, `email_verified_at`)
- [ ] Зв'язки повертаються як вкладені об'єкти, а не як raw ID
- [ ] Немає полів `pivot` у many-to-many зв'язках
- [ ] Пагіновані списки мають `links` і `meta`
- [ ] Статус коди правильні: 200, 201, 204, 404, 422

---

## Частина 3: Бонусне завдання

### Ендпоінт статистики: GET /api/tasks/stats

Створи ендпоінт, який повертає агреговану статистику по задачах.

**Маршрут** (додати ПЕРЕД resource route у `routes/api.php`):

```php
Route::get('/tasks/stats', [TaskController::class, 'stats']);
Route::apiResource('tasks', TaskController::class);
```

**Метод контролера:**

```php
public function stats()
{
    $stats = [
        'total_tasks' => Task::count(),
        'by_status' => [
            'pending' => Task::pending()->count(),
            'in_progress' => Task::inProgress()->count(),
            'done' => Task::done()->count(),
        ],
        'overdue_count' => Task::overdue()->count(),
        'by_priority' => [
            'low' => Task::where('priority', 'low')->count(),
            'medium' => Task::where('priority', 'medium')->count(),
            'high' => Task::where('priority', 'high')->count(),
        ],
    ];

    return new StatsResource($stats);
}
```

**Scopes в моделі Task:**

```php
public function scopePending(Builder $query): Builder
{
    return $query->where('status', 'pending');
}

public function scopeInProgress(Builder $query): Builder
{
    return $query->where('status', 'in_progress');
}

public function scopeDone(Builder $query): Builder
{
    return $query->where('status', 'done');
}

public function scopeOverdue(Builder $query): Builder
{
    return $query->where('status', '!=', 'done')
                 ->where('deadline', '<', now());
}
```

**StatsResource:**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'total_tasks' => $this->resource['total_tasks'],
            'by_status' => $this->resource['by_status'],
            'overdue_count' => $this->resource['overdue_count'],
            'by_priority' => $this->resource['by_priority'],
        ];
    }
}
```

**Перевірка через curl:**

```bash
curl -s http://localhost:8000/api/tasks/stats | jq
```

**Очікуваний формат відповіді (200 OK):**

```json
{
    "data": {
        "total_tasks": 50,
        "by_status": {
            "pending": 20,
            "in_progress": 15,
            "done": 15
        },
        "overdue_count": 5,
        "by_priority": {
            "low": 18,
            "medium": 17,
            "high": 15
        }
    }
}
```

**На що звернути увагу:**
- Маршрут `/tasks/stats` оголошений ДО `apiResource('tasks')`, інакше Laravel сприйме `stats` як `{task}` параметр
- Використовуються scopes для читабельності замість повторення `where()` всюди
- `StatsResource` обгортає дані в `"data"` -- єдиний формат для всього API
- `overdue` scope перевіряє і що задача не завершена, і що дедлайн вже минув

---

## Відповіді на тест

### Частина 1: Теоретичний тест

| # | Відповідь | Пояснення |
|---|-----------|-----------|
| 1 | **C** | `hasOne` -- один до одного. `User` hasOne `Profile`, `Profile` belongsTo `User`. |
| 2 | **C** | Many-to-many вимагає `belongsToMany` з обох сторін та проміжну таблицю (pivot). |
| 3 | **B** | `Category::hasMany(Task::class)` -- категорія має багато задач. `Task::belongsTo(Category::class)` -- задача належить одній категорії. |
| 4 | **B** | `required|email|unique:users` -- обов'язкове, валідний email, унікальне в таблиці users. |
| 5 | **B** | Якщо `authorize()` повертає `false`, Laravel автоматично повертає 403 Forbidden. |
| 6 | **B** | `required|date|after_or_equal:today` -- обов'язкове, дата, не раніше за сьогодні. |
| 7 | **C** | `toArray($request)` -- єдиний метод, який потрібно реалізувати в API Resource для визначення структури. |
| 8 | **B** | `whenLoaded('category')` -- включає зв'язок тільки якщо він вже завантажений, запобігаючи N+1 проблемі. |
| 9 | **B** | `TaskResource::collection(Task::paginate(15))` -- колекція ресурсів з пагінацією зберігає meta/links. |
| 10 | **D** | 422 Unprocessable Entity -- стандартний код Laravel для помилок валідації. |
| 11 | **C** | `findOrFail()` кидає `ModelNotFoundException`, яка автоматично конвертується в 404. |
| 12 | **D** | Обидва варіанти працюють: `make:factory TaskFactory` створює фабрику напряму, `make:model Task --factory` створює модель разом з фабрикою. |
| 13 | **B** | Фабрики з `count(50)->create()` -- найчистіший підхід. `Category::factory()` в визначенні `category_id` автоматично створює зв'язану категорію. |
| 14 | **B** | Локальний scope повинен мати префікс `scope` в назві методу, приймати `Builder $query` та повертати `Builder`. |
| 15 | **D** | Обидва підходи працюють, але `when()` елегантніший -- один ланцюжок замість if/else. `when($value, $callback)` виконує callback тільки якщо перший аргумент truthy. |
