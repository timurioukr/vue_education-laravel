# Урок 8: Validation та Form Requests -- валідація вхідних даних

## Що ви вивчите

- Чому серверна валідація обов'язкова (навіть якщо є фронтенд-валідація)
- Inline-валідація: `$request->validate([...])`
- Повний каталог правил валідації Laravel
- Формат JSON-помилок, який Laravel повертає автоматично (422)
- Form Request класи: окремі класи для валідації
- Методи `rules()`, `authorize()`, `messages()`
- Умовна валідація: `sometimes`, `Rule::when()`
- Кастомні правила валідації

---

## Паралелі з JS/Vue

| Laravel (PHP) | Vue/JS аналог | Коментар |
|---|---|---|
| `StoreTaskRequest` | Zod-схема + VeeValidate | Клас, що описує правила валідації для конкретного запиту |
| `rules()` | `z.object({ title: z.string().min(1).max(255) })` | Декларативний опис очікуваної структури даних |
| `authorize()` | Route guard / `beforeEnter` | Перевірка чи користувач має право виконати дію |
| `messages()` | VeeValidate custom messages | Кастомні повідомлення про помилки українською |
| `422 + errors{}` | Те, що ваш Vue-фронтенд показує під полями форми | Стандартний формат помилок, який ваш фронтенд вже знає |
| `'exists:categories,id'` | Перевірка, що вибране значення select є валідним | Серверна гарантія цілісності даних |
| `'required\|string\|max:255'` | `z.string().min(1).max(255)` | Ланцюжок правил на одне поле |
| `sometimes` | Поле валідується тільки якщо присутнє | Для PATCH/PUT -- не вимагати всі поля |
| `$request->validated()` | Отримати тільки провалідовані дані | Захист від зайвих полів у запиті |

---

## Теорія

### Чому серверна валідація обов'язкова

Ви як фронтенд-розробник звикли валідувати форми на клієнті. Це покращує UX, але **не захищає** дані:

```javascript
// Фронтенд-валідація -- для UX (легко обійти)
const schema = z.object({
    title: z.string().min(1).max(255),
    priority: z.enum(['low', 'medium', 'high']),
})
```

Будь-хто може обійти фронтенд і надіслати запит напряму:

```bash
# Зловмисник надсилає curl-запит без фронтенду
curl -X POST /api/tasks -d '{"title": "", "priority": "HACKED", "admin": true}'
```

Тому **серверна валідація -- це закон**. Фронтенд-валідація -- це ввічливість, серверна -- це безпека.

Золоте правило: **ніколи не довіряй даним від клієнта**. Валідуй все на сервері, навіть якщо фронтенд вже перевірив.

### Inline-валідація: $request->validate()

Найпростіший спосіб валідації -- прямо в контролері:

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'status' => 'required|in:pending,in_progress,done',
        'priority' => 'required|in:low,medium,high',
        'deadline' => 'nullable|date|after:today',
        'category_id' => 'nullable|exists:categories,id',
    ]);

    $task = Task::create($validated);

    return response()->json($task, 201);
}
```

Що тут відбувається:

1. `$request->validate([...])` перевіряє вхідні дані за правилами
2. Якщо валідація пройшла -- повертає **тільки** валідовані поля (безпечно!)
3. Якщо валідація провалилась -- Laravel **автоматично** повертає 422 з помилками

Ви не пишете жодного `if/else` для обробки помилок -- Laravel робить це за вас.

### Повний каталог правил валідації

Ось правила, які ви будете використовувати найчастіше:

#### Загальні

| Правило | Опис | Zod-аналог |
|---|---|---|
| `required` | Поле обов'язкове | `z.string()` (без `.optional()`) |
| `nullable` | Може бути `null` | `z.string().nullable()` |
| `sometimes` | Валідувати, тільки якщо поле присутнє в запиті | `z.string().optional()` |
| `filled` | Якщо присутнє, не може бути порожнім | -- |
| `present` | Поле має бути в запиті (навіть як null) | -- |

#### Типи

| Правило | Опис | Приклад |
|---|---|---|
| `string` | Рядок | `'title' => 'string'` |
| `integer` | Ціле число | `'count' => 'integer'` |
| `numeric` | Число (включно з float) | `'price' => 'numeric'` |
| `boolean` | true/false, 1/0, "1"/"0" | `'is_done' => 'boolean'` |
| `array` | Масив | `'tags' => 'array'` |
| `date` | Валідна дата | `'deadline' => 'date'` |
| `email` | Email-адреса | `'email' => 'email'` |
| `url` | URL-адреса | `'website' => 'url'` |

#### Розмір та довжина

| Правило | Опис | Приклад |
|---|---|---|
| `min:3` | Мінімум 3 символи (для рядків) або 3 (для чисел) | `'title' => 'min:3'` |
| `max:255` | Максимум 255 символів або 255 | `'title' => 'max:255'` |
| `between:1,100` | Від 1 до 100 | `'priority' => 'between:1,100'` |
| `size:10` | Рівно 10 символів / елементів | `'code' => 'size:10'` |

#### Дати

| Правило | Опис | Приклад |
|---|---|---|
| `date` | Валідна дата | `'deadline' => 'date'` |
| `after:today` | Після сьогодні | `'deadline' => 'after:today'` |
| `after_or_equal:today` | Сьогодні або пізніше | `'start' => 'after_or_equal:today'` |
| `before:2030-01-01` | До вказаної дати | `'end' => 'before:2030-01-01'` |
| `date_format:Y-m-d` | Конкретний формат дати | `'date' => 'date_format:Y-m-d'` |

#### База даних

| Правило | Опис | Приклад |
|---|---|---|
| `exists:table,column` | Значення існує в таблиці | `'category_id' => 'exists:categories,id'` |
| `unique:table,column` | Значення унікальне в таблиці | `'email' => 'unique:users,email'` |
| `in:a,b,c` | Одне з перелічених значень | `'status' => 'in:pending,done'` |

#### Файли

| Правило | Опис | Приклад |
|---|---|---|
| `file` | Файл | `'avatar' => 'file'` |
| `image` | Зображення (jpeg, png, bmp, gif, svg, webp) | `'avatar' => 'image'` |
| `mimes:jpg,png` | Конкретні формати файлів | `'doc' => 'mimes:pdf,docx'` |
| `max:2048` | Максимум 2048 KB для файлів | `'avatar' => 'image\|max:2048'` |

### Два формати запису правил

Правила можна записувати двома способами:

```php
// 1. Рядок з роздільником | (простіше для простих правил)
'title' => 'required|string|max:255'

// 2. Масив (обов'язково для правил з об'єктами Rule)
'title' => ['required', 'string', 'max:255']

// 3. Масив потрібен, коли використовуєте Rule-класи
use Illuminate\Validation\Rule;

'status' => ['required', Rule::in(['pending', 'in_progress', 'done'])]
'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)]
```

Рекомендація: використовуйте масив -- він однозначний і підтримує всі випадки.

### Формат JSON-помилок (422)

Коли запит до API не проходить валідацію, Laravel автоматично повертає відповідь з HTTP-статусом `422 Unprocessable Entity`:

```json
{
    "message": "The title field is required. (and 2 more errors)",
    "errors": {
        "title": [
            "The title field is required."
        ],
        "status": [
            "The selected status is invalid."
        ],
        "category_id": [
            "The selected category id is invalid."
        ]
    }
}
```

Це **стандартний формат**, який ваш Vue-фронтенд може легко обробити:

```javascript
// Vue -- обробка помилок валідації з Laravel API
try {
    await axios.post('/api/tasks', formData)
} catch (error) {
    if (error.response?.status === 422) {
        // error.response.data.errors -- об'єкт з помилками
        const errors = error.response.data.errors
        // errors.title = ["The title field is required."]
        // errors.status = ["The selected status is invalid."]

        // Показати помилки під полями форми
        formErrors.value = errors
    }
}
```

```html
<!-- Vue template -- показ помилок -->
<div>
    <input v-model="form.title" />
    <span v-if="formErrors.title" class="error">
        {{ formErrors.title[0] }}
    </span>
</div>
```

> **Важливо:** Щоб Laravel повертав JSON (а не HTML-редірект), запит повинен містити заголовок `Accept: application/json`. Для API-запитів з Vue/axios це зазвичай налаштовано глобально.

### Form Request класи

Inline-валідація працює, але контролер швидко стає захаращеним. Form Request -- це окремий клас, який містить логіку валідації:

```
Inline-валідація (все в контролері):
┌─────────────────────────────┐
│ Controller                  │
│  ├── правила валідації      │
│  ├── авторизація            │
│  ├── кастомні повідомлення  │
│  └── бізнес-логіка          │ ← Забагато відповідальностей!
└─────────────────────────────┘

Form Request (розділені обов'язки):
┌──────────────────┐    ┌─────────────────────┐
│ StoreTaskRequest │    │ Controller          │
│  ├── rules()     │ →  │  └── бізнес-логіка  │ ← Чисто!
│  ├── authorize() │    └─────────────────────┘
│  └── messages()  │
└──────────────────┘
```

Це як у Vue, коли ви виносите Zod-схему в окремий файл замість того, щоб описувати правила прямо в компоненті.

---

## Практика: крок за кроком

### Крок 1: Створіть StoreTaskRequest

```bash
php artisan make:request StoreTaskRequest
```

Це створить файл `app/Http/Requests/StoreTaskRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    /**
     * Чи авторизований користувач для цього запиту.
     */
    public function authorize(): bool
    {
        return true; // Поки дозволяємо всім (авторизацію додамо пізніше)
    }

    /**
     * Правила валідації.
     */
    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'min:3', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status'      => ['required', 'in:pending,in_progress,done'],
            'priority'    => ['required', 'in:low,medium,high'],
            'deadline'    => ['nullable', 'date', 'after_or_equal:today'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'tag_ids'     => ['nullable', 'array'],
            'tag_ids.*'   => ['integer', 'exists:tags,id'],
        ];
    }
}
```

Розберемо кожне правило:

```php
// title -- обов'язковий рядок від 3 до 255 символів
'title' => ['required', 'string', 'min:3', 'max:255'],

// description -- необов'язкове (nullable) текстове поле до 5000 символів
'description' => ['nullable', 'string', 'max:5000'],

// status -- обов'язковий, одне з трьох значень
'status' => ['required', 'in:pending,in_progress,done'],

// priority -- обов'язковий, одне з трьох значень
'priority' => ['required', 'in:low,medium,high'],

// deadline -- необов'язкова дата, не в минулому
'deadline' => ['nullable', 'date', 'after_or_equal:today'],

// category_id -- необов'язковий, але якщо є -- повинен існувати в таблиці categories
'category_id' => ['nullable', 'integer', 'exists:categories,id'],

// tag_ids -- необов'язковий масив
'tag_ids' => ['nullable', 'array'],

// tag_ids.* -- кожен елемент масиву -- integer, що існує в таблиці tags
'tag_ids.*' => ['integer', 'exists:tags,id'],
```

> **Зверніть увагу на `tag_ids.*`**: зірочка означає "кожен елемент масиву". Це як валідація елементів масиву в Zod: `z.array(z.number().int())`.

### Крок 2: Додайте кастомні повідомлення

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'min:3', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status'      => ['required', 'in:pending,in_progress,done'],
            'priority'    => ['required', 'in:low,medium,high'],
            'deadline'    => ['nullable', 'date', 'after_or_equal:today'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'tag_ids'     => ['nullable', 'array'],
            'tag_ids.*'   => ['integer', 'exists:tags,id'],
        ];
    }

    /**
     * Кастомні повідомлення про помилки.
     */
    public function messages(): array
    {
        return [
            'title.required'    => 'Task title is required.',
            'title.min'         => 'Task title must be at least :min characters.',
            'title.max'         => 'Task title cannot exceed :max characters.',
            'status.in'         => 'Status must be one of: pending, in_progress, done.',
            'priority.in'       => 'Priority must be one of: low, medium, high.',
            'deadline.after_or_equal' => 'Deadline must be today or a future date.',
            'category_id.exists' => 'The selected category does not exist.',
            'tag_ids.*.exists'  => 'One of the selected tags does not exist.',
        ];
    }
}
```

Зверніть увагу на `:min` та `:max` в повідомленнях -- Laravel автоматично підставить значення з правила.

### Крок 3: Створіть UpdateTaskRequest

```bash
php artisan make:request UpdateTaskRequest
```

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'required', 'string', 'min:3', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'status'      => ['sometimes', 'required', 'in:pending,in_progress,done'],
            'priority'    => ['sometimes', 'required', 'in:low,medium,high'],
            'deadline'    => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'tag_ids'     => ['sometimes', 'nullable', 'array'],
            'tag_ids.*'   => ['integer', 'exists:tags,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'    => 'Task title cannot be empty.',
            'title.min'         => 'Task title must be at least :min characters.',
            'title.max'         => 'Task title cannot exceed :max characters.',
            'status.in'         => 'Status must be one of: pending, in_progress, done.',
            'priority.in'       => 'Priority must be one of: low, medium, high.',
            'deadline.after_or_equal' => 'Deadline must be today or a future date.',
            'category_id.exists' => 'The selected category does not exist.',
            'tag_ids.*.exists'  => 'One of the selected tags does not exist.',
        ];
    }
}
```

**Ключова різниця від StoreTaskRequest -- правило `sometimes`:**

```php
// StoreTaskRequest -- поле обов'язкове
'title' => ['required', 'string', 'min:3', 'max:255'],
// Якщо title відсутній -- помилка "required"

// UpdateTaskRequest -- поле валідується тільки якщо присутнє
'title' => ['sometimes', 'required', 'string', 'min:3', 'max:255'],
// Якщо title відсутній -- ОК, не чіпаємо
// Якщо title присутній -- він обов'язково не порожній (required), рядок, від 3 до 255
```

Це ідеально для PATCH-запитів, де клієнт може надіслати тільки ті поля, які змінились:

```javascript
// Vue -- оновити тільки статус
await axios.patch('/api/tasks/1', { status: 'done' })
// title, description тощо -- не перевіряються, бо їх немає в запиті
```

### Крок 4: Створіть StoreCategoryRequest

```bash
php artisan make:request StoreCategoryRequest
```

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'min:2', 'max:100'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Category name is required.',
            'name.min'      => 'Category name must be at least :min characters.',
            'name.max'      => 'Category name cannot exceed :max characters.',
            'color.regex'   => 'Color must be a valid HEX color (e.g., #ff5733).',
        ];
    }
}
```

> **Зверніть увагу на `regex`**: правило перевіряє, що колір -- це валідний HEX-код (`#` + 6 символів 0-9, A-F). Це як `z.string().regex(/^#[0-9A-Fa-f]{6}$/)` в Zod.

### Крок 5: Оновіть контролери для використання Form Requests

**TaskController:**

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;

class TaskController extends Controller
{
    public function index()
    {
        $tasks = Task::with(['category', 'tags'])->get();

        return response()->json($tasks);
    }

    public function store(StoreTaskRequest $request)
    {
        // $request->validated() повертає ТІЛЬКИ валідовані поля
        // Жодних зайвих полів (наприклад, "admin": true) не пройде
        $task = Task::create($request->validated());

        if ($request->has('tag_ids')) {
            $task->tags()->attach($request->input('tag_ids'));
        }

        $task->load(['category', 'tags']);

        return response()->json($task, 201);
    }

    public function show(Task $task)
    {
        $task->load(['category', 'tags']);

        return response()->json($task);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());

        if ($request->has('tag_ids')) {
            $task->tags()->sync($request->input('tag_ids'));
        }

        $task->load(['category', 'tags']);

        return response()->json($task);
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json(null, 204);
    }
}
```

Що змінилось:

1. `Request $request` замінено на `StoreTaskRequest $request` та `UpdateTaskRequest $request`
2. Валідація відбувається **автоматично** -- Laravel бачить type-hint і запускає валідацію до виконання методу контролера
3. `$request->validated()` замість `$request->only([...])` -- повертає тільки поля, що пройшли валідацію

Це як type-hint в TypeScript -- ви кажете "я очікую цей тип даних", і система перевіряє автоматично:

```typescript
// TypeScript аналогія
function store(request: StoreTaskRequest) {
    // TypeScript перевірить типи під час компіляції
    // Laravel перевірить дані під час виконання запиту
}
```

**CategoryController:**

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('tasks')->get();

        return response()->json($categories);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());

        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        $category->loadCount('tasks');

        return response()->json($category);
    }

    public function update(StoreCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json(null, 204);
    }
}
```

### Крок 6: Протестуйте валідацію

Запустіть сервер:

```bash
php artisan serve
```

**Тест 1: Відправити порожній запит (очікуємо 422)**

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{}' | python3 -m json.tool
```

Відповідь (422):

```json
{
    "message": "The title field is required. (and 2 more errors)",
    "errors": {
        "title": [
            "Task title is required."
        ],
        "status": [
            "The status field is required."
        ],
        "priority": [
            "The priority field is required."
        ]
    }
}
```

**Тест 2: Надіслати некоректні дані (очікуємо 422)**

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "ab",
    "status": "INVALID",
    "priority": "super-high",
    "deadline": "2020-01-01",
    "category_id": 99999,
    "tag_ids": [1, 99999]
  }' | python3 -m json.tool
```

Відповідь (422):

```json
{
    "message": "Task title must be at least 3 characters. (and 5 more errors)",
    "errors": {
        "title": [
            "Task title must be at least 3 characters."
        ],
        "status": [
            "Status must be one of: pending, in_progress, done."
        ],
        "priority": [
            "Priority must be one of: low, medium, high."
        ],
        "deadline": [
            "Deadline must be today or a future date."
        ],
        "category_id": [
            "The selected category does not exist."
        ],
        "tag_ids.1": [
            "One of the selected tags does not exist."
        ]
    }
}
```

Зверніть увагу на `tag_ids.1` -- Laravel вказує точний індекс елемента масиву, що не пройшов валідацію (індексація з 0, тобто `tag_ids.1` -- це другий елемент).

**Тест 3: Надіслати коректні дані (очікуємо 201)**

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Write documentation",
    "description": "Update API docs for v2",
    "status": "pending",
    "priority": "medium",
    "deadline": "2026-05-01",
    "user_id": 1,
    "category_id": 1,
    "tag_ids": [1, 2]
  }' | python3 -m json.tool
```

Відповідь (201):

```json
{
    "id": 2,
    "title": "Write documentation",
    "description": "Update API docs for v2",
    "status": "pending",
    "priority": "medium",
    "deadline": "2026-05-01",
    "user_id": 1,
    "category_id": 1,
    "created_at": "2026-04-09T12:00:00.000000Z",
    "updated_at": "2026-04-09T12:00:00.000000Z",
    "category": {
        "id": 1,
        "name": "Work",
        "color": "#ef4444"
    },
    "tags": [
        {"id": 1, "name": "urgent"},
        {"id": 2, "name": "frontend"}
    ]
}
```

**Тест 4: Часткове оновлення (PATCH -- тільки статус)**

```bash
curl -s -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"status": "done"}' | python3 -m json.tool
```

Це працює, бо `UpdateTaskRequest` використовує `sometimes` -- поля без `title`, `priority` тощо не перевіряються.

### Крок 7: $request->validated() vs $request->all()

Дуже важлива різниця:

```php
// НЕБЕЗПЕЧНО: $request->all() повертає ВСІ дані з запиту
$data = $request->all();
// Якщо зловмисник надіслав {"title": "Hack", "is_admin": true}
// $data = ["title" => "Hack", "is_admin" => true] -- зайве поле пройшло!

// БЕЗПЕЧНО: $request->validated() повертає тільки валідовані поля
$data = $request->validated();
// $data = ["title" => "Hack"] -- тільки те, що описано в rules()
// "is_admin" ніколи не потрапить в $data
```

Додаткові методи для вибіркового отримання:

```php
// Тільки вказані поля з валідованих
$data = $request->safe()->only(['title', 'status']);

// Всі валідовані КРІМ вказаних
$data = $request->safe()->except(['tag_ids']);

// Додати значення до валідованих даних
$data = $request->safe()->merge(['user_id' => auth()->id()]);
```

### Крок 8: Умовна валідація

Іноді правила залежать від інших полів або контексту:

**Rule::when() -- правило за умовою:**

```php
use Illuminate\Validation\Rule;

public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'status' => ['required', Rule::in(['pending', 'in_progress', 'done'])],

        // deadline обов'язковий тільки якщо priority = high
        'deadline' => [
            Rule::when(
                $this->input('priority') === 'high',
                ['required', 'date', 'after_or_equal:today'],  // якщо true
                ['nullable', 'date', 'after_or_equal:today'],  // якщо false
            ),
        ],
    ];
}
```

**exclude_if / exclude_unless -- виключити поле за умовою:**

```php
public function rules(): array
{
    return [
        'has_deadline' => ['required', 'boolean'],
        // deadline валідується тільки якщо has_deadline = true
        'deadline' => ['exclude_if:has_deadline,false', 'required', 'date'],
    ];
}
```

**unique з виключенням поточного запису (для оновлення):**

```php
// В UpdateCategoryRequest
use Illuminate\Validation\Rule;

public function rules(): array
{
    return [
        // Назва категорії повинна бути унікальною, АЛЕ виключити поточну категорію
        'name' => [
            'sometimes', 'required', 'string', 'max:100',
            Rule::unique('categories')->ignore($this->route('category')),
        ],
    ];
}
```

`$this->route('category')` -- отримує параметр `{category}` з URL (наприклад, `/api/categories/5` -- повертає `5` або модель Category).

### Крок 9: prepareForValidation() -- підготовка даних

Іноді потрібно трансформувати дані перед валідацією:

```php
class StoreTaskRequest extends FormRequest
{
    /**
     * Підготувати дані перед валідацією.
     */
    protected function prepareForValidation(): void
    {
        // Автоматично додати user_id з авторизованого користувача
        $this->merge([
            'user_id' => $this->user()?->id,
        ]);

        // Нормалізувати status (прибрати пробіли, привести до lower case)
        if ($this->has('status')) {
            $this->merge([
                'status' => strtolower(trim($this->input('status'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'title'    => ['required', 'string', 'min:3', 'max:255'],
            'user_id'  => ['required', 'exists:users,id'],
            'status'   => ['required', 'in:pending,in_progress,done'],
            // ...
        ];
    }
}
```

Це як computed або watch, що трансформує дані форми перед відправкою:

```javascript
// Vue аналогія
const normalizedData = computed(() => ({
    ...formData.value,
    status: formData.value.status?.toLowerCase().trim(),
    user_id: authStore.userId,
}))
```

### Крок 10: Кастомні правила валідації

Для специфічних перевірок можна створити своє правило:

```bash
php artisan make:rule NoSpamLinks
```

```php
<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoSpamLinks implements ValidationRule
{
    /**
     * Валідація.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $spamDomains = ['spam.com', 'malware.net', 'phishing.org'];

        foreach ($spamDomains as $domain) {
            if (str_contains(strtolower($value), $domain)) {
                $fail("The :attribute contains a link to a blocked domain: {$domain}");
                return;
            }
        }
    }
}
```

Використання:

```php
use App\Rules\NoSpamLinks;

public function rules(): array
{
    return [
        'description' => ['nullable', 'string', 'max:5000', new NoSpamLinks],
    ];
}
```

Для простих одноразових перевірок можна використати closure:

```php
public function rules(): array
{
    return [
        'title' => [
            'required',
            'string',
            // Кастомне правило як closure
            function (string $attribute, mixed $value, Closure $fail) {
                if (strtolower($value) === 'test') {
                    $fail('The task title cannot be just "test".');
                }
            },
        ],
    ];
}
```

---

## Перевірка

Після виконання всіх кроків переконайтесь:

1. Створено `StoreTaskRequest` з правилами для всіх полів задачі
2. Створено `UpdateTaskRequest` з `sometimes` для часткового оновлення
3. Створено `StoreCategoryRequest` з валідацією HEX-кольору
4. Контролери використовують Form Request замість `$request->validate()`
5. Порожній POST на `/api/tasks` повертає 422 з описом помилок
6. POST з `"status": "INVALID"` повертає 422 з повідомленням "Status must be one of..."
7. POST з коректними даними повертає 201
8. PUT з частковими даними (тільки `status`) працює без помилок

---

## Міні-тест

**1. Який HTTP-статус повертає Laravel при помилці валідації API-запиту?**
- a) 400 Bad Request
- b) 401 Unauthorized
- c) 422 Unprocessable Entity
- d) 500 Internal Server Error

**2. Що робить правило `sometimes`?**
- a) Поле валідується випадковим чином
- b) Поле валідується тільки якщо воно присутнє в запиті
- c) Поле завжди обов'язкове
- d) Поле ігнорується

**3. Яка різниця між `$request->all()` та `$request->validated()`?**
- a) Ніякої різниці
- b) `all()` повертає всі дані запиту, `validated()` -- тільки валідовані поля
- c) `validated()` повертає всі дані, `all()` -- тільки валідовані
- d) `all()` працює тільки з GET-запитами

**4. Що перевіряє правило `'category_id' => 'exists:categories,id'`?**
- a) Що таблиця categories існує
- b) Що стовпець id існує в таблиці categories
- c) Що значення category_id існує як id в таблиці categories
- d) Що категорія має задачі

**5. Де виконується валідація, якщо в контролері type-hint на Form Request?**
- a) Всередині методу контролера
- b) Автоматично ДО виконання методу контролера
- c) Після виконання методу контролера
- d) Тільки якщо явно викликати validate()

---

## Практичне завдання

### Завдання: Створіть StoreTagRequest з перевіркою унікальності

**Крок 1:** Створіть Form Request:

```bash
php artisan make:request StoreTagRequest
```

**Крок 2:** Реалізуйте правила:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:50', 'unique:tags,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tag name is required.',
            'name.min'      => 'Tag name must be at least :min characters.',
            'name.max'      => 'Tag name cannot exceed :max characters.',
            'name.unique'   => 'A tag with this name already exists.',
        ];
    }

    /**
     * Нормалізувати назву тега перед валідацією.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => strtolower(trim($this->input('name'))),
            ]);
        }
    }
}
```

**Крок 3:** Оновіть TagController:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Models\Tag;

class TagController extends Controller
{
    public function index()
    {
        $tags = Tag::withCount('tasks')->get();

        return response()->json($tags);
    }

    public function store(StoreTagRequest $request)
    {
        $tag = Tag::create($request->validated());

        return response()->json($tag, 201);
    }

    public function destroy(Tag $tag)
    {
        $tag->delete();

        return response()->json(null, 204);
    }
}
```

**Крок 4:** Протестуйте edge cases:

```bash
# Тест 1: Створити тег
curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name": "  Urgent  "}' | python3 -m json.tool
# Очікуємо: {"name": "urgent"} -- нормалізовано (trim + lowercase)

# Тест 2: Спробувати створити дублікат
curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name": "urgent"}' | python3 -m json.tool
# Очікуємо: 422 -- "A tag with this name already exists."

# Тест 3: Занадто коротка назва
curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name": "a"}' | python3 -m json.tool
# Очікуємо: 422 -- "Tag name must be at least 2 characters."

# Тест 4: Порожній запит
curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{}' | python3 -m json.tool
# Очікуємо: 422 -- "Tag name is required."
```

**Бонус:** Створіть `UpdateTagRequest`, який дозволяє оновити назву тега, але перевіряє унікальність, виключаючи поточний тег:

```php
use Illuminate\Validation\Rule;

public function rules(): array
{
    return [
        'name' => [
            'required', 'string', 'min:2', 'max:50',
            Rule::unique('tags')->ignore($this->route('tag')),
        ],
    ];
}
```

---

## Відповіді на тест

1. **c) 422 Unprocessable Entity** -- це стандартний HTTP-статус для помилок валідації. Laravel повертає його автоматично для API-запитів (з заголовком `Accept: application/json`).
2. **b) Поле валідується тільки якщо воно присутнє в запиті** -- ідеально для PATCH/PUT-запитів, де клієнт може надіслати тільки змінені поля.
3. **b) `all()` повертає всі дані, `validated()` -- тільки валідовані** -- `validated()` є безпечнішим, бо не пропустить зайві поля, які зловмисник міг додати.
4. **c) Що значення category_id існує як id в таблиці categories** -- це серверна перевірка, що вибрана категорія реально існує в базі даних.
5. **b) Автоматично ДО виконання методу контролера** -- Laravel бачить type-hint `StoreTaskRequest` і автоматично запускає валідацію. Якщо помилка -- метод контролера навіть не виконується.
