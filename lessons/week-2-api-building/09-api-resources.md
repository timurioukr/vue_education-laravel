# Урок 9: API Resources -- формуємо JSON-відповіді

## Що ви вивчите

- Проблема: повернення Eloquent-моделей напряму розкриває внутрішню структуру
- Рішення: API Resources як шар трансформації між моделлю та JSON
- Створення ресурсів: `php artisan make:resource`
- Метод `toArray()` -- визначити точну структуру відповіді
- Використання ресурсів у контролерах: `new TaskResource($task)`, `TaskResource::collection($tasks)`
- Вкладені ресурси: `new CategoryResource($this->whenLoaded('category'))`
- Умовні поля: `$this->when()`, `$this->whenLoaded()`, `$this->mergeWhen()`
- Пагінація: `Task::paginate(15)` + `TaskResource::collection()`
- Формат пагінованої відповіді: `data`, `links`, `meta`
- Кастомізація обгортки `data`

---

## Паралелі з JS/Vue

| Laravel (PHP) | Vue/JS аналог | Коментар |
|---|---|---|
| `TaskResource` | Серіалайзер / DTO / `transformTask()` | Функція, що перетворює сирі дані в потрібний формат |
| `toArray()` | `computed` що маппить raw data | Визначає яку саме форму матиме JSON |
| `TaskResource::collection($tasks)` | `tasks.map(task => transformTask(task))` | Трансформація колекції |
| `when($condition, $value)` | `...(condition && { field: value })` | Умовний spread в об'єкті |
| `whenLoaded('category')` | `task.category ?? undefined` | Включити зв'язок тільки якщо завантажений |
| `paginate(15)` | `useFetch('/api/tasks?page=1&per_page=15')` | Пагінація для infinite scroll або pagination component |
| Resource = **контракт** | TypeScript interface для API response | Гарантія стабільної структури для фронтенду |
| `data` / `links` / `meta` | Стандартна обгортка для списків | Фронтенд завжди знає, де шукати дані та пагінацію |

---

## Теорія

### Проблема: повернення моделей напряму

Ось що відбувається, коли контролер повертає Eloquent-модель напряму:

```php
// Контролер
public function show(Task $task)
{
    return response()->json($task);
}
```

Відповідь:

```json
{
    "id": 1,
    "title": "Fix bug #123",
    "description": "The login form is broken on mobile",
    "status": "pending",
    "priority": "high",
    "deadline": "2026-04-15",
    "user_id": 1,
    "category_id": 1,
    "parent_id": null,
    "created_at": "2026-04-09T10:00:00.000000Z",
    "updated_at": "2026-04-09T10:05:30.000000Z"
}
```

Проблеми з цим підходом:

1. **Витік внутрішньої структури** -- фронтенд бачить `user_id`, `category_id`, `parent_id` як числа, а не як вкладені об'єкти
2. **Зайві поля** -- `updated_at` може бути не потрібен фронтенду
3. **Негнучкість** -- якщо перейменувати стовпець в базі, зламається API для всіх клієнтів
4. **Немає обчислюваних полів** -- хотілося б `is_overdue`, `days_until_deadline`, але їх немає в базі
5. **Плоска структура** -- замість вкладеного `category: { id: 1, name: "Work" }` маємо тільки `category_id: 1`

### Рішення: API Resource

API Resource -- це проміжний шар між моделлю (внутрішня структура) та JSON-відповіддю (зовнішній контракт):

```
Модель (внутрішнє)  →  Resource (трансформація)  →  JSON (зовнішнє)
┌────────────────┐     ┌──────────────────┐        ┌───────────────┐
│ Task            │     │ TaskResource     │        │ JSON response │
│  id             │     │  toArray() {     │        │  id           │
│  title          │ →   │    id            │   →    │  title        │
│  category_id    │     │    category: ... │        │  category: {} │
│  created_at     │     │    is_overdue    │        │  is_overdue   │
│  updated_at     │     │  }               │        └───────────────┘
└────────────────┘     └──────────────────┘
```

Це точно та сама ідея, що й трансформація даних на фронтенді:

```javascript
// Vue/Nuxt -- трансформація відповіді API
// server/api/tasks/[id].get.ts (Nuxt server route)
export default defineEventHandler(async (event) => {
    const rawTask = await db.query('SELECT * FROM tasks WHERE id = ?', [id])

    // Трансформація -- не повертаємо сирі дані
    return {
        id: rawTask.id,
        title: rawTask.title,
        category: rawTask.category ? { id: rawTask.category.id, name: rawTask.category.name } : null,
        isOverdue: new Date(rawTask.deadline) < new Date(),
    }
})
```

Laravel Resource робить те саме, але елегантніше і з набагато більшими можливостями.

### Чому Resource -- це контракт

Resource визначає **контракт** (договір) між бекендом і фронтендом. Якщо ви зміните назву стовпця в базі з `deadline` на `due_date`, фронтенд не зламається, бо Resource продовжить повертати поле як `deadline`:

```php
// Resource зберігає стабільний контракт
public function toArray(Request $request): array
{
    return [
        'deadline' => $this->due_date, // Внутрішнє ім'я змінилось, зовнішнє -- ні
    ];
}
```

Це як TypeScript-інтерфейс для API-відповіді:

```typescript
// Фронтенд знає цей інтерфейс і залежить від нього
interface TaskResponse {
    id: number
    title: string
    deadline: string | null
    category: CategoryResponse | null
    tags: TagResponse[]
    is_overdue: boolean
}
```

---

## Практика: крок за кроком

### Крок 1: Створіть TaskResource

```bash
php artisan make:resource TaskResource
```

Це створить файл `app/Http/Resources/TaskResource.php`. Відредагуйте його:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Трансформувати модель у масив (JSON).
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'priority'    => $this->priority,
            'deadline'    => $this->deadline?->format('Y-m-d'),
            'created_at'  => $this->created_at->toISOString(),

            // Вкладені ресурси (тільки якщо зв'язок завантажений)
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags'     => TagResource::collection($this->whenLoaded('tags')),

            // Умовне поле: кількість тегів (тільки якщо запитано withCount)
            'tags_count' => $this->when(isset($this->tags_count), $this->tags_count),
        ];
    }
}
```

Розберемо кожну частину:

```php
// $this -- це модель Task (Resource "обгортає" модель)
// Всі властивості моделі доступні через $this->

'id' => $this->id,
// Просто повертаємо поле як є

'deadline' => $this->deadline?->format('Y-m-d'),
// ?-> (nullsafe) -- якщо deadline null, повернеться null
// ->format('Y-m-d') -- форматуємо Carbon-дату як рядок "2026-04-15"

'created_at' => $this->created_at->toISOString(),
// Повертаємо ISO-формат для фронтенду (те, що dayjs/date-fns очікує)

'category' => new CategoryResource($this->whenLoaded('category')),
// whenLoaded('category') -- включити тільки якщо зв'язок був завантажений через with()
// Якщо category НЕ завантажена -- поле не буде в JSON
// Якщо завантажена -- буде вкладений об'єкт CategoryResource

'tags' => TagResource::collection($this->whenLoaded('tags')),
// Те саме для колекції тегів

'tags_count' => $this->when(isset($this->tags_count), $this->tags_count),
// when(condition, value) -- включити поле тільки якщо умова true
// tags_count з'являється тільки після withCount('tags')
```

### Крок 2: Створіть CategoryResource

```bash
php artisan make:resource CategoryResource
```

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'    => $this->id,
            'name'  => $this->name,
            'color' => $this->color,

            // Кількість задач (тільки якщо запитано withCount)
            'tasks_count' => $this->when(isset($this->tasks_count), $this->tasks_count),

            // Вкладені задачі (тільки якщо завантажені)
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
        ];
    }
}
```

### Крок 3: Створіть TagResource

```bash
php artisan make:resource TagResource
```

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TagResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'   => $this->id,
            'name' => $this->name,

            // Кількість задач з цим тегом (якщо запитано)
            'tasks_count' => $this->when(isset($this->tasks_count), $this->tasks_count),
        ];
    }
}
```

### Крок 4: Оновіть TaskController для використання Resources

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;

class TaskController extends Controller
{
    /**
     * Список задач з пагінацією.
     */
    public function index()
    {
        $tasks = Task::with(['category', 'tags'])
            ->latest()              // Сортування за created_at DESC
            ->paginate(15);         // Пагінація по 15 записів

        return TaskResource::collection($tasks);
    }

    /**
     * Створити задачу.
     */
    public function store(StoreTaskRequest $request)
    {
        $task = Task::create($request->validated());

        if ($request->has('tag_ids')) {
            $task->tags()->attach($request->input('tag_ids'));
        }

        $task->load(['category', 'tags']);

        return new TaskResource($task);
    }

    /**
     * Показати одну задачу.
     */
    public function show(Task $task)
    {
        $task->load(['category', 'tags']);

        return new TaskResource($task);
    }

    /**
     * Оновити задачу.
     */
    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());

        if ($request->has('tag_ids')) {
            $task->tags()->sync($request->input('tag_ids'));
        }

        $task->load(['category', 'tags']);

        return new TaskResource($task);
    }

    /**
     * Видалити задачу.
     */
    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json(null, 204);
    }
}
```

Ключові зміни:

```php
// БУЛО (повертали модель напряму):
return response()->json($task);
return response()->json($tasks);

// СТАЛО (повертаємо через Resource):
return new TaskResource($task);           // Один запис
return TaskResource::collection($tasks);  // Колекція / пагінація
```

### Крок 5: Оновіть CategoryController

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('tasks')->get();

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());

        return new CategoryResource($category);
    }

    public function show(Category $category)
    {
        $category->loadCount('tasks');
        $category->load('tasks');

        return new CategoryResource($category);
    }

    public function update(StoreCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json(null, 204);
    }
}
```

### Крок 6: Оновіть TagController

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;

class TagController extends Controller
{
    public function index()
    {
        $tags = Tag::withCount('tasks')->get();

        return TagResource::collection($tags);
    }

    public function store(StoreTagRequest $request)
    {
        $tag = Tag::create($request->validated());

        return new TagResource($tag);
    }

    public function destroy(Tag $tag)
    {
        $tag->delete();

        return response()->json(null, 204);
    }
}
```

### Крок 7: Порівняйте формат відповідей ДО та ПІСЛЯ

**GET /api/tasks/1 -- БЕЗ Resource (було):**

```json
{
    "id": 1,
    "title": "Fix bug #123",
    "description": "The login form is broken on mobile",
    "status": "pending",
    "priority": "high",
    "deadline": "2026-04-15",
    "user_id": 1,
    "category_id": 1,
    "parent_id": null,
    "created_at": "2026-04-09T10:00:00.000000Z",
    "updated_at": "2026-04-09T10:05:30.000000Z",
    "category": {
        "id": 1,
        "name": "Work",
        "color": "#ef4444",
        "user_id": 1,
        "created_at": "2026-04-09T09:55:00.000000Z",
        "updated_at": "2026-04-09T09:55:00.000000Z"
    },
    "tags": [
        {
            "id": 1,
            "name": "urgent",
            "created_at": "2026-04-09T09:56:00.000000Z",
            "updated_at": "2026-04-09T09:56:00.000000Z",
            "pivot": {
                "task_id": 1,
                "tag_id": 1
            }
        }
    ]
}
```

**GET /api/tasks/1 -- З Resource (стало):**

```json
{
    "data": {
        "id": 1,
        "title": "Fix bug #123",
        "description": "The login form is broken on mobile",
        "status": "pending",
        "priority": "high",
        "deadline": "2026-04-15",
        "created_at": "2026-04-09T10:00:00.000Z",
        "category": {
            "id": 1,
            "name": "Work",
            "color": "#ef4444"
        },
        "tags": [
            {
                "id": 1,
                "name": "urgent"
            }
        ]
    }
}
```

Що покращилось:

| Аспект | Було | Стало |
|---|---|---|
| Зайві поля | `user_id`, `category_id`, `parent_id`, `updated_at` | Тільки потрібні поля |
| Категорія | `user_id`, `created_at`, `updated_at` в категорії | Тільки `id`, `name`, `color` |
| Теги | `created_at`, `updated_at`, `pivot` в кожному тезі | Тільки `id`, `name` |
| Обгортка | Немає | `data: { ... }` -- стандартна JSON:API обгортка |
| Дата | `"2026-04-09T10:00:00.000000Z"` | `"2026-04-09T10:00:00.000Z"` (стандартний ISO) |
| Контракт | Змінюється при зміні бази | Стабільний, контрольований |

### Крок 8: Пагінація

Найпотужніша перевага Resources -- автоматична пагінація.

```php
// В контролері
public function index()
{
    $tasks = Task::with(['category', 'tags'])
        ->latest()
        ->paginate(15); // 15 записів на сторінку

    return TaskResource::collection($tasks);
}
```

**GET /api/tasks?page=1** -- відповідь:

```json
{
    "data": [
        {
            "id": 15,
            "title": "Task 15",
            "status": "pending",
            "category": {"id": 1, "name": "Work", "color": "#ef4444"},
            "tags": [{"id": 1, "name": "urgent"}]
        },
        {
            "id": 14,
            "title": "Task 14",
            "status": "done",
            "category": null,
            "tags": []
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/tasks?page=1",
        "last": "http://localhost:8000/api/tasks?page=4",
        "prev": null,
        "next": "http://localhost:8000/api/tasks?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 4,
        "links": [
            {"url": null, "label": "&laquo; Previous", "active": false},
            {"url": "http://localhost:8000/api/tasks?page=1", "label": "1", "active": true},
            {"url": "http://localhost:8000/api/tasks?page=2", "label": "2", "active": false},
            {"url": "http://localhost:8000/api/tasks?page=3", "label": "3", "active": false},
            {"url": "http://localhost:8000/api/tasks?page=4", "label": "4", "active": false},
            {"url": "http://localhost:8000/api/tasks?page=2", "label": "Next &raquo;", "active": false}
        ],
        "path": "http://localhost:8000/api/tasks",
        "per_page": 15,
        "to": 15,
        "total": 53
    }
}
```

Це **саме той формат**, який ваш Vue-фронтенд потребує для пагінації:

```javascript
// Vue -- використання пагінованих даних з Laravel
const page = ref(1)

const { data: response } = await useFetch(`/api/tasks?page=${page.value}`)

// Дані
const tasks = response.data          // масив задач
const total = response.meta.total    // загальна кількість
const lastPage = response.meta.last_page  // остання сторінка
const nextUrl = response.links.next  // URL наступної сторінки (або null)
```

```html
<!-- Vue template -- пагінація -->
<div v-for="task in tasks" :key="task.id">
    {{ task.title }}
</div>

<div class="pagination">
    <button
        v-for="link in response.meta.links"
        :key="link.label"
        :disabled="!link.url"
        :class="{ active: link.active }"
        @click="page = extractPage(link.url)"
        v-html="link.label"
    />
</div>
```

**Кастомізація кількості записів на сторінку:**

```php
// Фіксована кількість
$tasks = Task::paginate(15);

// Дозволити клієнту вказати кількість (з обмеженням)
$perPage = min($request->input('per_page', 15), 100); // максимум 100
$tasks = Task::paginate($perPage);
```

```bash
# Клієнт запитує 25 записів на сторінку
curl http://localhost:8000/api/tasks?per_page=25&page=2
```

### Крок 9: Умовні поля та mergeWhen

**$this->when() -- включити поле за умовою:**

```php
public function toArray(Request $request): array
{
    return [
        'id'    => $this->id,
        'title' => $this->title,

        // Показати email автора тільки якщо запит від адміна
        'author_email' => $this->when(
            $request->user()?->is_admin,
            $this->user?->email
        ),

        // tags_count тільки якщо він був завантажений
        'tags_count' => $this->when(isset($this->tags_count), $this->tags_count),
    ];
}
```

Аналогія з JavaScript:

```javascript
// JS -- умовне включення поля в об'єкт
const response = {
    id: task.id,
    title: task.title,
    // Те саме, що $this->when()
    ...(isAdmin && { author_email: task.user.email }),
    ...(task.tags_count !== undefined && { tags_count: task.tags_count }),
}
```

**$this->whenLoaded() -- включити зв'язок тільки якщо завантажений:**

```php
'category' => new CategoryResource($this->whenLoaded('category')),
'tags'     => TagResource::collection($this->whenLoaded('tags')),
```

Якщо контролер не викликав `with('category')`, поле `category` просто не буде в JSON (а не буде `null` чи помилкою). Це запобігає N+1: зв'язок не завантажується "випадково" при серіалізації.

**$this->mergeWhen() -- умовно додати кілька полів:**

```php
public function toArray(Request $request): array
{
    return [
        'id'    => $this->id,
        'title' => $this->title,

        // Додати кілька полів одразу за умовою
        $this->mergeWhen($this->status === 'done', [
            'completed_at' => $this->updated_at->toISOString(),
            'duration_days' => $this->created_at->diffInDays($this->updated_at),
        ]),
    ];
}
```

### Крок 10: Обгортка "data" та її кастомізація

Laravel автоматично обгортає відповідь Resource в ключ `"data"`:

```json
// new TaskResource($task)
{
    "data": {
        "id": 1,
        "title": "Fix bug"
    }
}

// TaskResource::collection($tasks)
{
    "data": [
        {"id": 1, "title": "Fix bug"},
        {"id": 2, "title": "Add feature"}
    ]
}
```

**Чому обгортка корисна:**

1. Стандартна структура -- фронтенд завжди знає: дані в `response.data`
2. Можна додати метадані на тому ж рівні (`links`, `meta` для пагінації)
3. Захист від JSON-вразливостей (JSON array root exploitation)

**Вимкнути обгортку (якщо не потрібна):**

```php
// В AppServiceProvider::boot()
use Illuminate\Http\Resources\Json\JsonResource;

public function boot(): void
{
    JsonResource::withoutWrapping();
}
```

Після цього:

```json
// new TaskResource($task) -- без "data"
{
    "id": 1,
    "title": "Fix bug"
}
```

> **Рекомендація:** Залишайте обгортку `data` -- це стандартна практика для REST API і пагінація потребує її.

**Додати метадані до відповіді:**

```php
// В контролері
return (new TaskResource($task))->additional([
    'meta' => [
        'version' => '1.0',
        'generated_at' => now()->toISOString(),
    ],
]);
```

Результат:

```json
{
    "data": {
        "id": 1,
        "title": "Fix bug"
    },
    "meta": {
        "version": "1.0",
        "generated_at": "2026-04-09T12:00:00.000Z"
    }
}
```

### Крок 11: Протестуйте API

```bash
php artisan serve
```

**GET /api/tasks -- пагінований список:**

```bash
curl -s "http://localhost:8000/api/tasks?page=1" \
  -H "Accept: application/json" | python3 -m json.tool
```

**GET /api/tasks/1 -- одна задача з Resource:**

```bash
curl -s http://localhost:8000/api/tasks/1 \
  -H "Accept: application/json" | python3 -m json.tool
```

**GET /api/categories -- з tasks_count:**

```bash
curl -s http://localhost:8000/api/categories \
  -H "Accept: application/json" | python3 -m json.tool
```

Очікувана відповідь:

```json
{
    "data": [
        {
            "id": 1,
            "name": "Work",
            "color": "#ef4444",
            "tasks_count": 3
        },
        {
            "id": 2,
            "name": "Personal",
            "color": "#22c55e",
            "tasks_count": 1
        }
    ]
}
```

**GET /api/tags -- з tasks_count:**

```bash
curl -s http://localhost:8000/api/tags \
  -H "Accept: application/json" | python3 -m json.tool
```

Очікувана відповідь:

```json
{
    "data": [
        {"id": 1, "name": "urgent", "tasks_count": 2},
        {"id": 2, "name": "frontend", "tasks_count": 1},
        {"id": 3, "name": "bug", "tasks_count": 3}
    ]
}
```

### Крок 12: Resource для створення (response code)

Зверніть увагу, що при створенні задачі потрібно повертати 201 статус. Resource за замовчуванням повертає 200. Щоб це виправити:

```php
public function store(StoreTaskRequest $request)
{
    $task = Task::create($request->validated());

    if ($request->has('tag_ids')) {
        $task->tags()->attach($request->input('tag_ids'));
    }

    $task->load(['category', 'tags']);

    // Встановити HTTP-статус 201 Created
    return (new TaskResource($task))
        ->response()
        ->setStatusCode(201);
}
```

Або коротший варіант з `response()`:

```php
return new TaskResource($task);
// За замовчуванням 200, але для REST API створення ресурсу -- 201

// Щоб повернути 201:
return (new TaskResource($task))->response()->setStatusCode(201);
```

---

## Перевірка

Після виконання всіх кроків переконайтесь:

1. Створено `TaskResource`, `CategoryResource`, `TagResource`
2. `TaskResource` включає `category` (вкладений) та `tags` (колекція) через `whenLoaded`
3. `CategoryResource` включає `tasks_count` через `when`
4. Всі контролери повертають Resources замість сирих моделей
5. `GET /api/tasks` повертає пагіновану відповідь з `data`, `links`, `meta`
6. `GET /api/tasks/1` повертає чисту структуру без `user_id`, `updated_at`, `pivot`
7. `GET /api/categories` повертає категорії з `tasks_count`
8. Відповідь обгорнута в `"data": { ... }`

---

## Міні-тест

**1. Для чого потрібні API Resources?**
- a) Для валідації вхідних даних
- b) Для трансформації моделей у контрольовану JSON-структуру
- c) Для авторизації запитів
- d) Для створення міграцій

**2. Яка різниця між `new TaskResource($task)` та `TaskResource::collection($tasks)`?**
- a) Ніякої різниці
- b) `new` для одного запису, `::collection()` для масиву/колекції
- c) `new` для створення, `::collection()` для видалення
- d) `::collection()` для пагінації, `new` для всього іншого

**3. Що робить `$this->whenLoaded('category')`?**
- a) Завантажує зв'язок з бази
- b) Включає зв'язок у JSON тільки якщо він вже був завантажений через with()
- c) Перевіряє чи категорія існує
- d) Створює нову категорію

**4. Що повертає `Task::paginate(15)` через Resource?**
- a) Просто масив задач
- b) JSON з `data` (масив задач), `links` (навігація), `meta` (інфо про пагінацію)
- c) HTML-сторінку з пагінацією
- d) Тільки кількість сторінок

**5. Навіщо обгортка `"data"` у відповіді Resource?**
- a) Це помилка Laravel, можна вимкнути
- b) Стандартна структура: дозволяє додати метадані (links, meta) на тому ж рівні
- c) Вимога HTTP-протоколу
- d) Без неї JSON не буде валідним

---

## Практичне завдання

### Завдання: Створіть TaskDetailResource для show endpoint

Створіть окремий Resource для детального перегляду задачі з додатковими обчислюваними полями.

**Крок 1:** Створіть Resource:

```bash
php artisan make:resource TaskDetailResource
```

**Крок 2:** Реалізуйте з додатковими полями:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // Базові поля
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'priority'    => $this->priority,
            'deadline'    => $this->deadline?->format('Y-m-d'),
            'created_at'  => $this->created_at->toISOString(),
            'updated_at'  => $this->updated_at->toISOString(),

            // Обчислювані поля
            'is_overdue' => $this->deadline
                ? $this->deadline->isPast() && $this->status !== 'done'
                : false,

            'days_until_deadline' => $this->deadline
                ? (int) now()->diffInDays($this->deadline, false) // false = може бути від'ємним
                : null,

            'is_completed' => $this->status === 'done',

            'created_ago' => $this->created_at->diffForHumans(),
            // => "2 hours ago", "3 days ago"

            // Зв'язки
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags'     => TagResource::collection($this->whenLoaded('tags')),

            // Підзадачі
            'subtasks'       => TaskResource::collection($this->whenLoaded('subtasks')),
            'subtasks_count' => $this->when(
                isset($this->subtasks_count),
                $this->subtasks_count
            ),

            // Батьківська задача
            'parent' => new TaskResource($this->whenLoaded('parent')),
        ];
    }
}
```

**Крок 3:** Використайте в контролері:

```php
use App\Http\Resources\TaskDetailResource;

public function show(Task $task)
{
    $task->load(['category', 'tags', 'subtasks', 'parent']);
    $task->loadCount('subtasks');

    return new TaskDetailResource($task);
}
```

**Крок 4:** Протестуйте:

```bash
curl -s http://localhost:8000/api/tasks/1 \
  -H "Accept: application/json" | python3 -m json.tool
```

Очікувана відповідь:

```json
{
    "data": {
        "id": 1,
        "title": "Fix bug #123",
        "description": "The login form is broken on mobile",
        "status": "pending",
        "priority": "high",
        "deadline": "2026-04-15",
        "created_at": "2026-04-09T10:00:00.000Z",
        "updated_at": "2026-04-09T10:05:30.000Z",
        "is_overdue": false,
        "days_until_deadline": 6,
        "is_completed": false,
        "created_ago": "5 minutes ago",
        "category": {
            "id": 1,
            "name": "Work",
            "color": "#ef4444"
        },
        "tags": [
            {"id": 1, "name": "urgent"},
            {"id": 2, "name": "frontend"}
        ],
        "subtasks": [
            {
                "id": 3,
                "title": "Research solutions",
                "status": "pending",
                "priority": "medium",
                "deadline": null,
                "created_at": "2026-04-09T10:10:00.000Z"
            }
        ],
        "subtasks_count": 1,
        "parent": null
    }
}
```

**Бонус:** Додайте поле `completion_percentage` для задач з підзадачами:

```php
'completion_percentage' => $this->when(
    isset($this->subtasks_count) && $this->subtasks_count > 0,
    function () {
        $done = $this->subtasks->where('status', 'done')->count();
        return round(($done / $this->subtasks_count) * 100);
    }
),
```

Це поверне відсоток виконаних підзадач -- корисно для progress bar на фронтенді.

---

## Відповіді на тест

1. **b) Для трансформації моделей у контрольовану JSON-структуру** -- Resource визначає які саме поля та в якому форматі повертаються клієнту, приховуючи внутрішню структуру бази даних.
2. **b) `new` для одного запису, `::collection()` для масиву/колекції** -- `new TaskResource($task)` обгортає одну модель, `TaskResource::collection($tasks)` трансформує кожен елемент колекції.
3. **b) Включає зв'язок у JSON тільки якщо він вже був завантажений** -- `whenLoaded` запобігає N+1: якщо контролер не викликав `with('category')`, поле просто не з'явиться в JSON.
4. **b) JSON з `data`, `links`, `meta`** -- `paginate()` через Resource автоматично генерує повну пагіновану відповідь з навігацією та метаданими.
5. **b) Стандартна структура для метаданих** -- обгортка `data` дозволяє додати `links`, `meta` та інші метадані на тому ж рівні, що є стандартом JSON:API.
