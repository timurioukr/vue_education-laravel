# Урок 12: Query Scopes, фільтрація та сортування

## Що ви вивчите

- Навіщо потрібні Query Scopes і як вони організовують код запитів
- Local Scopes: `scopeOverdue()`, `scopeByStatus()` та інші
- Як використовувати query parameters з request для фільтрації
- Метод `when()` для умовної побудови запитів
- Whitelist (білий список) для сортування -- захист від SQL-ін'єкцій
- Пошук через `LIKE`-запити
- Пагінацію: `paginate()`, cursor-based пагінація
- Комбінування фільтрів, сортування та пагінації в одному запиті

## Паралелі з JS/Vue

| Laravel / PHP | Vue / Nuxt / JS | Коментар |
|---|---|---|
| `scopeOverdue($query)` | `computed(() => tasks.filter(t => isPast(t.deadline)))` | Повторно використовувана фільтрація |
| `Task::overdue()->get()` | `overdueTasksComputed.value` | Виклик scope як computed |
| `Task::byStatus('pending')` | `tasks.filter(t => t.status === 'pending')` | Фільтрація за параметром |
| `$request->query('status')` | `useRoute().query.status` | Отримати query-параметр з URL |
| `when($status, fn...)` | `if (status) url.searchParams.set('status', status)` | Умовне додавання фільтру |
| `->orderBy('deadline', 'asc')` | `.sort((a, b) => a.deadline - b.deadline)` | Сортування |
| `->paginate(15)` | Пагінована відповідь, яку парсить `useFetch` | Серверна пагінація |
| Whitelist дозволених полів | Валідація query params перед відправкою на API | Захист від маніпуляцій |
| Комбінування scopes | Ланцюжок `.filter().filter().sort()` | Побудова складного запиту |
| `latest()` / `oldest()` | `.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))` | Сортування за датою |

## Теорія

### Проблема: контролер, що робить все

Зараз ваш `TaskController::index()` повертає **всі** задачі. У реальному додатку це не працює:

```php
// ❌ Повертає ВСЕ -- без фільтрації, сортування, пагінації
public function index()
{
    $tasks = Task::all();
    return TaskResource::collection($tasks);
}
```

Ваш Vue-фронтенд хоче:
- `GET /api/tasks?status=pending` -- тільки незавершені
- `GET /api/tasks?priority=high&sort=deadline` -- високий пріоритет, відсортовані за дедлайном
- `GET /api/tasks?search=meeting` -- пошук за назвою
- `GET /api/tasks?page=2&per_page=15` -- друга сторінка, 15 записів

### Local Query Scopes

Scope -- це метод у моделі, який інкапсулює частину запиту. Назва методу починається з `scope`, але при виклику `scope` опускається:

```php
// Визначення -- метод scopeOverdue
public function scopeOverdue(Builder $query): Builder
{
    return $query->where('status', '!=', 'done')
                 ->where('deadline', '<', now());
}

// Виклик -- без "scope", з маленької літери
Task::overdue()->get();
```

Це як реюзабельний computed у Pinia:

```javascript
// Pinia аналог
const useTaskStore = defineStore('tasks', () => {
    const tasks = ref([]);

    // "Scope" як computed
    const overdueTasks = computed(() =>
        tasks.value.filter(t =>
            t.status !== 'done' && isPast(new Date(t.deadline))
        )
    );

    return { tasks, overdueTasks };
});
```

Різниця: Vue scope працює з даними **в пам'яті** (масив у Pinia). Laravel scope працює з **SQL-запитом** -- фільтрація відбувається в базі даних, що набагато ефективніше для великих обсягів даних.

### Як визначати Scopes

Scopes додаються до моделі. Кожен scope отримує `Builder $query` як перший аргумент:

```php
// app/Models/Task.php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    /**
     * Прострочені задачі (дедлайн минув, задача не завершена).
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', '!=', 'done')
                     ->whereNotNull('deadline')
                     ->where('deadline', '<', now());
    }

    /**
     * Фільтр за статусом.
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Фільтр за категорією.
     */
    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Фільтр за пріоритетом.
     */
    public function scopeByPriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    /**
     * Пошук за назвою та описом.
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }
}
```

Зверніть увагу на scope `search()`: він обгортає умови в замикання `where(function ...)`. Це створює SQL з дужками:

```sql
-- Без обгортки (ПОМИЛКА: or зламає інші фільтри)
WHERE status = 'pending' AND title LIKE '%meeting%' OR description LIKE '%meeting%'
-- Це читається як: (status = 'pending' AND title LIKE ...) OR (description LIKE ...)

-- З обгорткою (ПРАВИЛЬНО)
WHERE status = 'pending' AND (title LIKE '%meeting%' OR description LIKE '%meeting%')
```

У JavaScript ви не стикаєтесь з цією проблемою, бо `.filter()` працює з кожним елементом окремо:

```javascript
// JS -- тут немає проблеми з пріоритетом операторів
tasks.filter(t =>
    t.status === 'pending' &&
    (t.title.includes('meeting') || t.description.includes('meeting'))
);
```

### Використання Scopes

```php
// Прості виклики
$overdue = Task::overdue()->get();
$pending = Task::byStatus('pending')->get();
$workTasks = Task::byCategory(1)->get();

// Комбінування -- scopes можна ланцюжити
$urgentWork = Task::byCategory(1)
    ->byPriority('high')
    ->byStatus('pending')
    ->get();

// Scope + звичайні умови
$recentOverdue = Task::overdue()
    ->where('created_at', '>', now()->subWeek())
    ->orderBy('deadline')
    ->get();
```

### when() -- умовна побудова запиту

`when()` -- це ключовий метод для фільтрації на основі query parameters. Він додає умову **тільки якщо значення truthy** (не null, не порожній рядок, не 0):

```php
Task::query()
    ->when($status, function (Builder $query, string $status) {
        $query->where('status', $status);
    })
    ->get();
```

Коротший запис зі стрілковою функцією:

```php
Task::query()
    ->when($status, fn (Builder $q, string $status) => $q->where('status', $status))
    ->get();
```

Як це працює:
- Якщо `$status = 'pending'` -- додає `WHERE status = 'pending'`
- Якщо `$status = null` або `$status = ''` -- пропускає, не додає нічого

Це дуже зручно: замість купи `if/else` ви пишете ланцюжок `when()`:

```php
// ❌ Без when() -- багато if/else
$query = Task::query();

if ($request->status) {
    $query->where('status', $request->status);
}
if ($request->category_id) {
    $query->where('category_id', $request->category_id);
}
if ($request->priority) {
    $query->where('priority', $request->priority);
}
if ($request->search) {
    $query->where('title', 'like', "%{$request->search}%");
}

$tasks = $query->paginate(15);

// ✅ З when() -- чистий ланцюжок
$tasks = Task::query()
    ->when($request->status, fn ($q, $status) => $q->byStatus($status))
    ->when($request->category_id, fn ($q, $id) => $q->byCategory($id))
    ->when($request->priority, fn ($q, $priority) => $q->byPriority($priority))
    ->when($request->search, fn ($q, $search) => $q->search($search))
    ->paginate(15);
```

У Vue/JS це нагадує умовну побудову URL з query-параметрами:

```javascript
// Vue аналог -- побудова URL з фільтрами
const fetchTasks = async () => {
    const params = new URLSearchParams();

    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('category_id', filters.categoryId);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);
    params.set('page', currentPage.value);

    const { data } = await axios.get(`/api/tasks?${params}`);
    tasks.value = data.data;
};
```

### Сортування та whitelist

Дозволити клієнту сортувати за будь-яким полем -- це **дірка безпеки**. Зловмисник може передати `?sort=password` або SQL-ін'єкцію. Тому потрібен whitelist:

```php
public function index(Request $request)
{
    // Білий список дозволених полів для сортування
    $allowedSorts = ['title', 'deadline', 'priority', 'status', 'created_at'];

    $sortField = in_array($request->query('sort'), $allowedSorts)
        ? $request->query('sort')
        : 'created_at'; // За замовчуванням

    $sortOrder = $request->query('order') === 'asc' ? 'asc' : 'desc'; // Тільки asc або desc

    $tasks = Task::query()
        ->when($request->status, fn ($q, $status) => $q->byStatus($status))
        ->when($request->category_id, fn ($q, $id) => $q->byCategory($id))
        ->orderBy($sortField, $sortOrder)
        ->paginate(15);

    return TaskResource::collection($tasks);
}
```

У Vue ви робите подібне на фронтенді перед відправкою:

```javascript
// Vue -- валідація параметрів сортування перед відправкою
const ALLOWED_SORTS = ['title', 'deadline', 'priority', 'status', 'created_at'];

const sortField = computed(() =>
    ALLOWED_SORTS.includes(route.query.sort) ? route.query.sort : 'created_at'
);
```

### Методи сортування в Eloquent

```php
// Сортування за полем
Task::orderBy('deadline', 'asc')->get();    // За зростанням
Task::orderBy('deadline', 'desc')->get();   // За спаданням

// Скорочення для created_at
Task::latest()->get();    // ORDER BY created_at DESC (найновіші першими)
Task::oldest()->get();    // ORDER BY created_at ASC (найстаріші першими)

// latest/oldest для іншого поля
Task::latest('deadline')->get();  // ORDER BY deadline DESC

// Кілька рівнів сортування
Task::orderBy('priority', 'desc')
    ->orderBy('deadline', 'asc')
    ->get();
// Спочатку за пріоритетом (high першими), потім за дедлайном (найближчі першими)
```

### Пошук: LIKE-запити

Для простого пошуку використовується SQL-оператор `LIKE`:

```php
// Пошук в назві
Task::where('title', 'like', '%meeting%')->get();
// % -- wildcard, означає "будь-які символи"
// %meeting% -- містить "meeting" будь-де в рядку
// meeting% -- починається з "meeting"
// %meeting -- закінчується на "meeting"

// Пошук в кількох полях (через scope, як показано вище)
Task::search('meeting')->get();
```

> **Важливо:** `LIKE`-пошук з `%` на початку (`%meeting%`) не використовує індекси бази даних і може бути повільним на великих таблицях. Для повноцінного пошуку (наприклад, з урахуванням морфології) використовуйте Laravel Scout з Meilisearch або Algolia. Але для Task Manager з сотнями записів `LIKE` працює чудово.

### Пагінація

Laravel має вбудовану пагінацію, яка автоматично генерує правильну JSON-структуру для фронтенду:

```php
// Стандартна пагінація -- 15 записів на сторінку
$tasks = Task::paginate(15);

// З кастомною кількістю, яку контролює клієнт
$perPage = min($request->query('per_page', 15), 100); // Максимум 100
$tasks = Task::paginate($perPage);
```

Відповідь `paginate()` автоматично включає метадані:

```json
{
    "data": [
        { "id": 1, "title": "Task 1", ... },
        { "id": 2, "title": "Task 2", ... }
    ],
    "links": {
        "first": "http://localhost:8000/api/tasks?page=1",
        "last": "http://localhost:8000/api/tasks?page=5",
        "prev": null,
        "next": "http://localhost:8000/api/tasks?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 5,
        "per_page": 15,
        "to": 15,
        "total": 73,
        "path": "http://localhost:8000/api/tasks"
    }
}
```

Це саме те, що ваш Vue-компонент може використати:

```javascript
// Vue -- використання пагінованої відповіді
const { data: response } = await axios.get('/api/tasks', {
    params: { page: currentPage.value, per_page: 15 }
});

tasks.value = response.data;           // Масив задач
totalPages.value = response.meta.last_page;  // Кількість сторінок
totalItems.value = response.meta.total;      // Загальна кількість
currentPage.value = response.meta.current_page;
```

#### simplePaginate() -- легша пагінація

Якщо вам не потрібна інформація про загальну кількість сторінок (тільки "наступна/попередня"):

```php
$tasks = Task::simplePaginate(15);
```

Повертає тільки `prev` та `next` посилання, без `total` та `last_page`. Працює швидше, бо не виконує `COUNT(*)` запит.

#### cursorPaginate() -- cursor-based пагінація

Для дуже великих таблиць або нескінченного скролу:

```php
$tasks = Task::orderBy('id')->cursorPaginate(15);
```

Замість `?page=2` використовує `?cursor=eyJpZCI6MTV9` -- закодований покажчик на останній елемент. Це ефективніше для великих обсягів, бо не потрібно пропускати записи.

### Збираємо все разом: повний метод index()

```php
// app/Http/Controllers/Api/TaskController.php

public function index(Request $request)
{
    $allowedSorts = ['title', 'deadline', 'priority', 'status', 'created_at'];

    $sortField = in_array($request->query('sort'), $allowedSorts)
        ? $request->query('sort')
        : 'created_at';

    $sortOrder = $request->query('order') === 'asc' ? 'asc' : 'desc';

    $perPage = min((int) $request->query('per_page', 15), 100);

    $tasks = Task::query()
        ->when($request->query('status'), fn ($q, $status) => $q->byStatus($status))
        ->when($request->query('category_id'), fn ($q, $id) => $q->byCategory((int) $id))
        ->when($request->query('priority'), fn ($q, $priority) => $q->byPriority($priority))
        ->when($request->query('search'), fn ($q, $search) => $q->search($search))
        ->when(
            $request->query('overdue'),
            fn ($q) => $q->overdue()
        )
        ->orderBy($sortField, $sortOrder)
        ->paginate($perPage);

    return TaskResource::collection($tasks);
}
```

Тепер ваш API підтримує:

```
GET /api/tasks                                    — всі задачі (перша сторінка)
GET /api/tasks?status=pending                     — тільки pending
GET /api/tasks?priority=high                      — тільки високий пріоритет
GET /api/tasks?category_id=3                      — тільки категорія 3
GET /api/tasks?search=meeting                     — пошук "meeting"
GET /api/tasks?overdue=1                          — тільки прострочені
GET /api/tasks?sort=deadline&order=asc             — сортування за дедлайном
GET /api/tasks?status=pending&priority=high&sort=deadline  — комбіновані фільтри
GET /api/tasks?page=2&per_page=10                 — друга сторінка, 10 записів
```

## Практика: крок за кроком

### Крок 1: Додайте scopes до моделі Task

Відкрийте `app/Models/Task.php` і додайте scopes:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'deadline',
        'category_id',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'datetime',
        ];
    }

    // ==================
    // Relationships
    // ==================

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    // ==================
    // Query Scopes
    // ==================

    /**
     * Прострочені задачі (дедлайн минув, задача не завершена).
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', '!=', 'done')
                     ->whereNotNull('deadline')
                     ->where('deadline', '<', now());
    }

    /**
     * Фільтр за статусом.
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Фільтр за категорією.
     */
    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Фільтр за пріоритетом.
     */
    public function scopeByPriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    /**
     * Пошук за назвою та описом.
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }
}
```

### Крок 2: Перевірте scopes у tinker

```bash
php artisan tinker
```

```php
>>> use App\Models\Task;

// Всі прострочені
>>> Task::overdue()->count()
=> 5

// Тільки pending
>>> Task::byStatus('pending')->count()
=> 18

// Комбінація: прострочені з високим пріоритетом
>>> Task::overdue()->byPriority('high')->count()
=> 2

// Пошук
>>> Task::search('meeting')->get()->pluck('title')
=> ["Weekly meeting preparation", "Meeting notes review"]

// Подивитись SQL, який генерує scope
>>> Task::overdue()->byPriority('high')->toSql()
=> "select * from \"tasks\" where \"status\" != ? and \"deadline\" is not null and \"deadline\" < ? and \"priority\" = ?"
```

### Крок 3: Оновіть TaskController::index()

```php
// app/Http/Controllers/Api/TaskController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskController extends Controller
{
    /**
     * Список задач з фільтрацією, сортуванням та пагінацією.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        // Білий список дозволених полів для сортування
        $allowedSorts = ['title', 'deadline', 'priority', 'status', 'created_at'];

        $sortField = in_array($request->query('sort'), $allowedSorts)
            ? $request->query('sort')
            : 'created_at';

        $sortOrder = $request->query('order') === 'asc' ? 'asc' : 'desc';

        // Кількість на сторінку: від 1 до 100, за замовчуванням 15
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

        $tasks = Task::query()
            ->when($request->query('status'), fn ($q, $status) => $q->byStatus($status))
            ->when($request->query('category_id'), fn ($q, $id) => $q->byCategory((int) $id))
            ->when($request->query('priority'), fn ($q, $priority) => $q->byPriority($priority))
            ->when($request->query('search'), fn ($q, $search) => $q->search($search))
            ->when($request->boolean('overdue'), fn ($q) => $q->overdue())
            ->orderBy($sortField, $sortOrder)
            ->paginate($perPage);

        return TaskResource::collection($tasks);
    }

    // ... інші методи (show, store, update, destroy)
}
```

> **Зверніть увагу** на `$request->boolean('overdue')`. Це конвертує query-параметр у boolean: `?overdue=1`, `?overdue=true` стають `true`, а відсутність параметра або `?overdue=0` -- `false`.

### Крок 4: Наповніть базу тестовими даними

Якщо ви ще не зробили це в уроці 11:

```bash
php artisan migrate:fresh --seed
```

### Крок 5: Тестуйте фільтрацію через curl

Запустіть сервер:

```bash
php artisan serve
```

В іншому терміналі:

```bash
# Всі задачі (перша сторінка)
curl -s "http://localhost:8000/api/tasks" | json_pp

# Тільки pending
curl -s "http://localhost:8000/api/tasks?status=pending" | json_pp

# Тільки high priority
curl -s "http://localhost:8000/api/tasks?priority=high" | json_pp

# Пошук за назвою
curl -s "http://localhost:8000/api/tasks?search=meeting" | json_pp

# Прострочені задачі
curl -s "http://localhost:8000/api/tasks?overdue=1" | json_pp

# Сортування за дедлайном (найближчі першими)
curl -s "http://localhost:8000/api/tasks?sort=deadline&order=asc" | json_pp

# Комбіновані фільтри: pending + high priority + сортування за дедлайном
curl -s "http://localhost:8000/api/tasks?status=pending&priority=high&sort=deadline&order=asc" | json_pp

# Пагінація: друга сторінка, 5 записів
curl -s "http://localhost:8000/api/tasks?page=2&per_page=5" | json_pp

# Задачі конкретної категорії
curl -s "http://localhost:8000/api/tasks?category_id=1" | json_pp
```

### Крок 6: Перевірте пагінацію

```bash
# Перша сторінка -- зверніть увагу на meta
curl -s "http://localhost:8000/api/tasks?per_page=5" | json_pp
```

У відповіді `meta` ви побачите:

```json
{
    "meta": {
        "current_page": 1,
        "last_page": 6,
        "per_page": 5,
        "total": 28
    }
}
```

Перейдіть на другу сторінку:

```bash
curl -s "http://localhost:8000/api/tasks?per_page=5&page=2" | json_pp
```

### Крок 7: Перевірте whitelist сортування

```bash
# Дозволене поле -- працює
curl -s "http://localhost:8000/api/tasks?sort=deadline" | json_pp

# Недозволене поле -- ігнорується, використовується created_at за замовчуванням
curl -s "http://localhost:8000/api/tasks?sort=password" | json_pp

# SQL-ін'єкція -- ігнорується, використовується created_at за замовчуванням
curl -s "http://localhost:8000/api/tasks?sort=id;DROP+TABLE+tasks" | json_pp
```

## Перевірка

```bash
# 1. Фільтрація за статусом
curl -s "http://localhost:8000/api/tasks?status=pending" | json_pp
# Очікуємо: тільки задачі зі статусом "pending"

# 2. Пошук
curl -s "http://localhost:8000/api/tasks?search=test" | json_pp
# Очікуємо: задачі, де title або description містять "test"

# 3. Сортування
curl -s "http://localhost:8000/api/tasks?sort=title&order=asc" | json_pp
# Очікуємо: задачі відсортовані за назвою в алфавітному порядку

# 4. Пагінація
curl -s "http://localhost:8000/api/tasks?per_page=3&page=1" | json_pp
# Очікуємо: 3 задачі, meta.total показує загальну кількість

# 5. Комбінація
curl -s "http://localhost:8000/api/tasks?status=pending&sort=deadline&order=asc&per_page=5" | json_pp
# Очікуємо: pending задачі, відсортовані за дедлайном, 5 на сторінку

# 6. Некоректне сортування -- не ламає API
curl -s "http://localhost:8000/api/tasks?sort=hacked_field" | json_pp
# Очікуємо: нормальна відповідь, sort проігнорований
```

## Міні-тест

**1. Як правильно визначити local scope у моделі?**

a) `public function overdue($query) { ... }`
b) `public function scopeOverdue(Builder $query) { ... }`
c) `public static function scopeOverdue($query) { ... }`
d) `protected function scopeOverdue(Builder $query) { ... }`

**2. Що робить `when()` якщо перший аргумент -- `null`?**

a) Кидає виняток
b) Додає `WHERE column IS NULL`
c) Пропускає умову -- нічого не додає до запиту
d) Повертає порожній результат

**3. Навіщо потрібен whitelist для полів сортування?**

a) Для покращення продуктивності запитів
b) Для захисту від SQL-ін'єкцій та доступу до прихованих полів
c) Для валідації типів даних
d) Для автоматичного створення індексів

**4. Яка різниця між `paginate()` та `simplePaginate()`?**

a) `paginate()` повертає масив, `simplePaginate()` повертає колекцію
b) `paginate()` включає total та last_page, `simplePaginate()` -- тільки next/prev
c) `simplePaginate()` швидший, бо повертає всі записи одразу
d) Різниці немає

**5. Чому в scope `search()` потрібна обгортка `where(function ...)` для OR-умов?**

a) Без обгортки запит не виконається
b) Для покращення читабельності коду
c) Щоб OR не зламав логіку інших фільтрів -- дужки забезпечують правильний пріоритет
d) Для автоматичного кешування результатів

## Практичне завдання

Додайте scope `dueThisWeek` та фільтр `?due=today|week|overdue`:

### Крок 1: Додайте scopes до моделі

```php
// app/Models/Task.php

/**
 * Задачі з дедлайном сьогодні.
 */
public function scopeDueToday(Builder $query): Builder
{
    return $query->where('status', '!=', 'done')
                 ->whereNotNull('deadline')
                 ->whereDate('deadline', today());
}

/**
 * Задачі з дедлайном цього тижня.
 */
public function scopeDueThisWeek(Builder $query): Builder
{
    return $query->where('status', '!=', 'done')
                 ->whereNotNull('deadline')
                 ->whereBetween('deadline', [
                     now()->startOfWeek(),
                     now()->endOfWeek(),
                 ]);
}
```

### Крок 2: Додайте фільтр у контролер

```php
public function index(Request $request): AnonymousResourceCollection
{
    // ... існуючий код ...

    $tasks = Task::query()
        ->when($request->query('status'), fn ($q, $status) => $q->byStatus($status))
        ->when($request->query('category_id'), fn ($q, $id) => $q->byCategory((int) $id))
        ->when($request->query('priority'), fn ($q, $priority) => $q->byPriority($priority))
        ->when($request->query('search'), fn ($q, $search) => $q->search($search))
        ->when($request->boolean('overdue'), fn ($q) => $q->overdue())
        // Новий фільтр: due
        ->when($request->query('due'), function ($q, $due) {
            return match ($due) {
                'today' => $q->dueToday(),
                'week' => $q->dueThisWeek(),
                'overdue' => $q->overdue(),
                default => $q,
            };
        })
        ->orderBy($sortField, $sortOrder)
        ->paginate($perPage);

    return TaskResource::collection($tasks);
}
```

### Крок 3: Додайте тестові дані

Щоб перевірити фільтр, створіть задачі з конкретними дедлайнами в tinker:

```bash
php artisan tinker
```

```php
>>> use App\Models\Task;
>>> use App\Models\Category;

// Категорія для задач
>>> $cat = Category::first();

// Задача з дедлайном сьогодні
>>> Task::factory()->for($cat)->create(['title' => 'Due today task', 'deadline' => now(), 'status' => 'pending']);

// Задача з дедлайном через 3 дні (цього тижня)
>>> Task::factory()->for($cat)->create(['title' => 'Due this week task', 'deadline' => now()->addDays(3), 'status' => 'pending']);

// Прострочена задача
>>> Task::factory()->for($cat)->create(['title' => 'Overdue task', 'deadline' => now()->subDays(5), 'status' => 'pending']);
```

### Крок 4: Перевірте

```bash
# Задачі з дедлайном сьогодні
curl -s "http://localhost:8000/api/tasks?due=today" | json_pp

# Задачі з дедлайном цього тижня
curl -s "http://localhost:8000/api/tasks?due=week" | json_pp

# Прострочені задачі
curl -s "http://localhost:8000/api/tasks?due=overdue" | json_pp
```

Кожен запит повинен повертати тільки відповідні задачі.

## Відповіді на тест

1. **b)** `public function scopeOverdue(Builder $query): Builder` -- scope повинен бути `public`, починатися з `scope`, приймати `Builder $query` і повертати `Builder`. При виклику `scope` опускається: `Task::overdue()`.
2. **c)** Пропускає умову. `when(null, fn...)` нічого не додає до запиту -- callback просто не викликається. Це робить `when()` ідеальним для опціональних фільтрів.
3. **b)** Whitelist захищає від SQL-ін'єкцій. Якщо дозволити сортування за довільним полем, зловмисник може передати SQL-код або отримати доступ до полів, які не повинні бути видимі (наприклад, `password`).
4. **b)** `paginate()` виконує додатковий `COUNT(*)` запит і повертає `total`, `last_page`, `from`, `to`. `simplePaginate()` повертає тільки `prev`/`next` посилання, що робить його швидшим для великих таблиць.
5. **c)** Без обгортки `where(function ...)` оператор `OR` має нижчий пріоритет і може "зламати" інші фільтри. Наприклад, `WHERE status = 'pending' AND title LIKE '%x%' OR description LIKE '%x%'` -- тут `OR` стосується всього виразу, а не тільки пошукових полів. Обгортка створює дужки: `AND (title LIKE '%x%' OR description LIKE '%x%')`.
