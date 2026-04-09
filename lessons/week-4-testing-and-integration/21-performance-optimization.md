# Урок 21: Оптимізація продуктивності -- N+1, кешування, індекси

## Що ви вивчите

- Проблему N+1 запитів у деталях: що це, як виявити, як виправити
- Eager loading: `with()`, `$with`, `load()`, `withCount()`
- Оптимізацію запитів: `select()`, `chunk()`, `cursor()`
- Кешування: `Cache::remember()`, інвалідація кешу, артизан-команди
- Індексування бази даних: що таке індекс, як додати, композитні індекси
- Дебаг: `DB::listen()`, Laravel Debugbar, підрахунок запитів
- Підготовку до продакшну: `php artisan optimize`

---

## Паралелі з JS/Vue

| Laravel (PHP) | Vue / Nuxt / JS | Коментар |
|---|---|---|
| `with('category')` -- eager loading | Один API-запит `?include=category` замість окремих fetch | Отримати повʼязані дані за один запит |
| N+1 проблема | `v-for` + `fetch()` в кожному елементі | 1 запит на кожен елемент замість 1 запиту на всі |
| `preventLazyLoading()` | Vue strict mode / ESLint warnings | Виявлення проблем на етапі розробки |
| `Cache::remember('key', 300, fn)` | `useFetch` з `key` + TTL / `useAsyncData` cache | Повернути з кешу, якщо не протух |
| `Cache::forget('key')` | `queryClient.invalidateQueries()` (TanStack Query) | Інвалідація кешу при зміні даних |
| Кешування маршрутів | Build-time route generation в Nuxt | Попередня компіляція для швидкості |
| `->select('id', 'title')` | GraphQL -- запитуєш тільки потрібні поля | Не тягнути зайві дані |
| `chunk(100, fn)` | Віртуальний скролінг (virtual scroll) | Обробка великих списків частинами |
| `cursor()` | Lazy loading компонентів | Завантажувати по одному, не все в памʼять |
| Індекси в БД | -- (суто бекенд) | Прискорення WHERE і ORDER BY запитів |
| `php artisan optimize` | `npm run build` | Компіляція та оптимізація для продакшну |
| `DB::listen()` | Vue DevTools / Performance tab | Спостереження за виконанням запитів |
| `$with` (default eager load) | `prefetch` / `preload` в HTML | Завжди завантажувати повʼязані дані |
| `withCount('tasks')` | `category.tasks.length` | Отримати кількість без завантаження всіх записів |

---

## Теорія

### Проблема N+1: найпоширеніша помилка продуктивності

#### Що це таке

Уявіть, що ваш API повертає список задач з назвою категорії:

```json
{
  "data": [
    { "id": 1, "title": "Buy milk", "category": { "name": "Personal" } },
    { "id": 2, "title": "Fix bug", "category": { "name": "Work" } },
    { "id": 3, "title": "Read book", "category": { "name": "Personal" } }
  ]
}
```

Ось як це працює **без** eager loading:

```php
// TaskController
$tasks = Task::where('user_id', $user->id)->get(); // 1 запит

// В TaskResource при серіалізації кожної задачі:
// $task->category -- для КОЖНОЇ задачі відбувається окремий запит до categories
```

Результат:
```sql
SELECT * FROM tasks WHERE user_id = 1;              -- 1 запит
SELECT * FROM categories WHERE id = 3;               -- задача 1
SELECT * FROM categories WHERE id = 7;               -- задача 2
SELECT * FROM categories WHERE id = 3;               -- задача 3 (та сама категорія!)
```

Якщо у вас 100 задач -- це **101 запит** (1 + 100). Якщо ще й теги додати -- 201 запит. Це N+1.

На фронтенді це як:

```javascript
// ПОГАНИЙ код Vue
<template>
  <div v-for="task in tasks" :key="task.id">
    <!-- Кожен рендер компонента робить окремий fetch -->
    <CategoryBadge :category-id="task.categoryId" />
  </div>
</template>

// CategoryBadge.vue
const { data } = useFetch(`/api/categories/${props.categoryId}`) // N запитів!
```

#### Як виявити: preventLazyLoading()

Laravel може автоматично повідомляти про N+1 проблеми:

```php
// app/Providers/AppServiceProvider.php
namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Забороняє lazy loading в development -- кидає виняток
        Model::preventLazyLoading(! $this->app->isProduction());
    }
}
```

Тепер, якщо ви звернетесь до `$task->category` без попереднього eager loading, Laravel кине виняток `LazyLoadingViolationException` замість тихого виконання додаткового запиту.

Це як strict mode у Vue -- попереджує про проблеми під час розробки, але не впливає на продакшн.

#### Як виправити: Eager Loading

**Рішення -- один запит для всіх повʼязаних даних:**

```php
// ЗАМІСТЬ цього (N+1):
$tasks = Task::where('user_id', $user->id)->get();

// Використовуйте це (2 запити замість N+1):
$tasks = Task::with('category')
    ->where('user_id', $user->id)
    ->get();
```

SQL замість 101 запиту:
```sql
SELECT * FROM tasks WHERE user_id = 1;
SELECT * FROM categories WHERE id IN (3, 7);  -- один запит для ВСІХ категорій
```

### Стратегії Eager Loading

#### 1. `with()` -- в момент запиту

Найпоширеніший спосіб. Вказуєте при побудові запиту:

```php
// Одна залежність
$tasks = Task::with('category')->get();

// Кілька залежностей
$tasks = Task::with(['category', 'tags', 'user'])->get();

// Вкладені залежності (category → tasks of that category)
$categories = Category::with('tasks.tags')->get();

// З фільтрацією залежності
$tasks = Task::with(['tags' => function ($query) {
    $query->orderBy('name');
}])->get();

// Вибіркові поля залежності (менше памʼяті)
$tasks = Task::with('category:id,name')->get();
```

#### 2. `$with` -- завжди завантажувати

Якщо задача ЗАВЖДИ потребує категорію, можна вказати це на моделі:

```php
// app/Models/Task.php
class Task extends Model
{
    // Ці залежності ЗАВЖДИ завантажуються автоматично
    protected $with = ['category'];
}
```

Тепер `Task::all()` автоматично зробить `with('category')`. Але будьте обережні -- це завантажує категорію навіть коли вона не потрібна. Використовуйте тільки для справді постійних залежностей.

Можна відключити для конкретного запиту:

```php
// Без category, хоча вона в $with
$tasks = Task::without('category')->get();
```

#### 3. `load()` -- для вже завантажених моделей

Якщо модель вже завантажена, але вам потрібні її залежності:

```php
$task = Task::find(1); // категорія НЕ завантажена

// Тепер хочемо категорію
$task->load('category'); // один додатковий запит

// Або для колекції
$tasks = Task::all();
$tasks->load('category', 'tags');
```

#### 4. `withCount()` -- підрахунок без завантаження

Якщо потрібно тільки кількість повʼязаних записів:

```php
$categories = Category::withCount('tasks')->get();

foreach ($categories as $category) {
    echo "{$category->name}: {$category->tasks_count} tasks";
    // tasks_count -- автоматично створений атрибут
}
```

SQL:
```sql
SELECT categories.*, (
    SELECT COUNT(*) FROM tasks WHERE tasks.category_id = categories.id
) as tasks_count
FROM categories;
```

Один запит замість N+1, і задачі не завантажуються в памʼять.

### Оптимізація запитів

#### select() -- вибіркові поля

На фронтенді ви використовуєте GraphQL, щоб запитувати тільки потрібні поля. В Laravel:

```php
// ПОГАНО: завантажує ВСІ поля (включно з description, яке може бути великим)
$tasks = Task::all();

// ДОБРЕ: тільки потрібні поля
$tasks = Task::select('id', 'title', 'status', 'priority', 'deadline')
    ->where('user_id', $user->id)
    ->get();
```

Це особливо корисно для списків, де description або великі текстові поля не потрібні.

#### chunk() -- обробка великих обсягів

Якщо потрібно обробити 100 000 задач (наприклад, масова відправка нотифікацій), завантажувати їх всі в памʼять -- погана ідея:

```php
// ПОГАНО: 100 000 моделей в памʼяті одночасно
$tasks = Task::where('status', 'overdue')->get();
foreach ($tasks as $task) {
    $task->user->notify(new OverdueReminder($task));
}

// ДОБРЕ: по 100 задач за раз
Task::where('status', 'overdue')
    ->chunk(100, function ($tasks) {
        foreach ($tasks as $task) {
            $task->user->notify(new OverdueReminder($task));
        }
    });
// Після обробки кожного чанка попередні 100 записів звільняються з памʼяті
```

Це як virtual scroll на фронтенді -- не завантажуємо всі елементи, а працюємо порціями.

#### cursor() -- мінімальне споживання памʼяті

Ще ефективніше за chunk -- обробка по одному запису:

```php
// Один запис в памʼяті в кожен момент часу
foreach (Task::where('status', 'overdue')->cursor() as $task) {
    // обробляємо $task
    // після переходу до наступного ітерації попередній $task звільняється
}
```

`cursor()` використовує PHP generators і PDO cursor -- один SQL-запит, але памʼять не зростає. Ідеально для експорту великих обсягів.

| Метод | Памʼять | Кількість SQL-запитів | Коли використовувати |
|---|---|---|---|
| `get()` | Все в памʼяті | 1 | Маленькі набори (<1000) |
| `chunk(N)` | N записів | N/total | Масова обробка |
| `cursor()` | 1 запис | 1 | Дуже великі набори, стрімінг |

### Кешування

#### Чому кеш потрібен

Деякі запити виконуються часто, але дані змінюються рідко. Наприклад, список категорій юзера. Замість виконання SQL-запиту на кожний API-запит, можна зберегти результат у кеші.

На фронтенді ви вже знаєте цю концепцію:

```javascript
// Vue / TanStack Query -- кешування API-відповідей
const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: () => api.get('/categories'),
  staleTime: 5 * 60 * 1000, // 5 хвилин кеш
})
```

В Laravel:

```php
use Illuminate\Support\Facades\Cache;

// Отримати з кешу або виконати запит
$categories = Cache::remember('categories', 300, function () {
    return Category::all();
});
// 'categories' -- ключ кешу
// 300 -- TTL в секундах (5 хвилин)
// function -- виконається тільки якщо кешу немає або він протух
```

#### Базові операції Cache

```php
use Illuminate\Support\Facades\Cache;

// Записати значення
Cache::put('key', 'value', 300); // TTL 300 секунд
Cache::put('key', 'value', now()->addHour()); // TTL 1 година

// Прочитати значення
$value = Cache::get('key');                // null якщо немає
$value = Cache::get('key', 'default');     // default якщо немає

// Прочитати або створити (найчастіший патерн)
$value = Cache::remember('key', 300, function () {
    return ExpensiveQuery::run();
});

// Назавжди (без TTL)
Cache::forever('key', 'value');

// Видалити
Cache::forget('key');

// Перевірити наявність
if (Cache::has('key')) { ... }

// Прочитати і видалити
$value = Cache::pull('key');
```

#### Кешування з привʼязкою до юзера

Список категорій -- це дані конкретного юзера. Потрібно кешувати окремо:

```php
// Кеш для кожного юзера окремо
$categories = Cache::remember(
    "user.{$user->id}.categories", // унікальний ключ для юзера
    300,
    fn () => Category::where('user_id', $user->id)->get()
);
```

#### Інвалідація кешу

Кеш потрібно очищати, коли дані змінюються. Інакше юзер створить нову категорію, а в списку її не буде:

```php
// app/Http/Controllers/CategoryController.php
class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $categories = Cache::remember(
            "user.{$user->id}.categories",
            300,
            fn () => Category::where('user_id', $user->id)->get()
        );

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = $request->user()->categories()->create(
            $request->validated()
        );

        // Інвалідуємо кеш -- при наступному запиті він перествориться
        Cache::forget("user.{$request->user()->id}.categories");

        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        Cache::forget("user.{$request->user()->id}.categories");

        return new CategoryResource($category);
    }

    public function destroy(Request $request, Category $category)
    {
        $category->delete();

        Cache::forget("user.{$request->user()->id}.categories");

        return response()->noContent();
    }
}
```

Паралель з Vue:

```javascript
// TanStack Query -- інвалідація при мутації
const mutation = useMutation({
  mutationFn: (data) => api.post('/categories', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    // ^ те саме, що Cache::forget()
  }
})
```

#### Кешування статистики

Ідеальний кандидат для кешування -- агреговані дані (статистика), бо запити складні:

```php
// app/Http/Controllers/StatsController.php
class StatsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $stats = Cache::remember("user.{$user->id}.stats", 600, function () use ($user) {
            return [
                'total_tasks' => Task::where('user_id', $user->id)->count(),
                'completed_tasks' => Task::where('user_id', $user->id)
                    ->where('status', 'done')->count(),
                'overdue_tasks' => Task::where('user_id', $user->id)
                    ->overdue()->count(),
                'tasks_by_priority' => Task::where('user_id', $user->id)
                    ->selectRaw('priority, count(*) as count')
                    ->groupBy('priority')
                    ->pluck('count', 'priority'),
                'tasks_by_category' => Category::where('user_id', $user->id)
                    ->withCount('tasks')
                    ->get()
                    ->pluck('tasks_count', 'name'),
            ];
        });

        return response()->json(['data' => $stats]);
    }
}
```

Без кешу це 5+ SQL-запитів на кожний перегляд дашборду. З кешем -- 0 запитів протягом 10 хвилин (600 секунд).

#### Артизан-команди для кешування

```bash
# Кешування маршрутів (route:cache)
# Компілює всі маршрути в один файл. Значно прискорює routing.
php artisan route:cache

# Очистити кеш маршрутів
php artisan route:clear

# Кешування конфігурації (config:cache)
# Обʼєднує всі config-файли в один. Не завантажує .env на кожний запит.
php artisan config:cache

# Очистити кеш конфігурації
php artisan config:clear

# Кешування views (view:cache)
# Прекомпілює Blade-шаблони (для API не дуже актуально)
php artisan view:cache

# Одна команда для всього
php artisan optimize

# Скасувати все
php artisan optimize:clear
```

`php artisan optimize` -- це як `npm run build` для Laravel: компілює і оптимізує все для продакшну.

**Важливо**: `config:cache` не завантажує `.env` файл. Після кешування конфігурації всі виклики `env()` поза config-файлами повертатимуть `null`. Використовуйте `config('app.name')` замість `env('APP_NAME')` у коді.

### Індексування бази даних

#### Що таке індекс

Індекс у базі даних -- це як зміст книги. Без змісту, щоб знайти слово, потрібно прочитати всю книгу (full table scan). З змістом -- подивитись на сторінку і перейти одразу до потрібного місця.

```sql
-- Без індексу: база сканує ВСЮ таблицю tasks
SELECT * FROM tasks WHERE status = 'pending';
-- Якщо 100 000 записів -- перевіряє кожний

-- З індексом на status: база одразу знаходить потрібні записи
-- Значно швидше для великих таблиць
```

На фронтенді аналогу немає -- це суто серверна оптимізація.

#### Які поля індексувати

Правило: індексуйте поля, які часто зʼявляються в `WHERE`, `ORDER BY` або `JOIN`:

| Поле | Чому індексувати |
|---|---|
| `user_id` | `WHERE user_id = ?` -- кожний запит фільтрує по юзеру |
| `status` | `WHERE status = ?` -- фільтрація за статусом |
| `category_id` | `WHERE category_id = ?` -- фільтрація + JOIN |
| `deadline` | `WHERE deadline < NOW()` -- пошук прострочених |
| `created_at` | `ORDER BY created_at DESC` -- сортування |

#### Додавання індексів через міграцію

```bash
php artisan make:migration add_indexes_to_tasks_table
```

```php
// database/migrations/xxxx_add_indexes_to_tasks_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Простий індекс -- одне поле
            $table->index('status');
            $table->index('deadline');

            // Композитний індекс -- кілька полів
            // Ефективний для WHERE user_id = ? AND status = ?
            $table->index(['user_id', 'status']);

            // Індекс для сортування
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['deadline']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['user_id', 'created_at']);
        });
    }
};
```

#### Композитні індекси

Порядок полів у композитному індексі має значення:

```php
// Індекс ['user_id', 'status'] ефективний для:
// WHERE user_id = 1 AND status = 'pending'  ✅
// WHERE user_id = 1                          ✅ (використає першу частину)
// WHERE status = 'pending'                   ❌ (не використає -- status не перший)
```

Правило: перше поле в індексі -- те, яке фільтрується ЗАВЖДИ (як `user_id` у Task Manager).

#### Foreign key vs Index

Зверніть увагу: `foreign()` автоматично створює індекс на полі зовнішнього ключа. Якщо у вашій міграції вже є:

```php
$table->foreignId('user_id')->constrained()->cascadeOnDelete();
$table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
```

То `user_id` і `category_id` вже мають індекс. Додатковий `$table->index('user_id')` не потрібен. Але композитний `$table->index(['user_id', 'status'])` -- потрібен, бо це інший індекс.

### Дебаг: підрахунок запитів

#### DB::listen() -- логування запитів

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\DB;

public function boot(): void
{
    // Тільки в development!
    if (! $this->app->isProduction()) {
        Model::preventLazyLoading();

        DB::listen(function ($query) {
            // Логуємо кожний SQL-запит
            logger()->debug($query->sql, [
                'bindings' => $query->bindings,
                'time' => $query->time . 'ms',
            ]);
        });
    }
}
```

Тепер в `storage/logs/laravel.log` ви побачите кожний запит:

```
[2026-04-09] DEBUG: select * from "tasks" where "user_id" = ? {"bindings":[1],"time":"0.45ms"}
[2026-04-09] DEBUG: select * from "categories" where "id" in (?, ?) {"bindings":[3,7],"time":"0.22ms"}
```

#### Підрахунок запитів у тесті

Можна перевірити кількість запитів прямо в тесті:

```php
it('loads tasks with category in 2 queries', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);
    Task::factory()->count(10)->create([
        'user_id' => $user->id,
        'category_id' => $category->id,
    ]);

    $queryCount = 0;
    DB::listen(function () use (&$queryCount) {
        $queryCount++;
    });

    $this->actingAs($user)
        ->getJson('/api/tasks')
        ->assertOk();

    // Має бути 2-3 запити (tasks + categories), а НЕ 11 (1 + N)
    expect($queryCount)->toBeLessThanOrEqual(5);
});
```

#### Laravel Debugbar (опціонально)

Потужний інструмент для дебагу в браузері:

```bash
composer require barryvdh/laravel-debugbar --dev
```

Debugbar показує:
- Кількість SQL-запитів на сторінку
- Час виконання кожного запиту
- Кількість завантажених моделей
- Споживання памʼяті
- N+1 попередження

Для API він менш корисний (бо немає браузера), але можна подивитись через `storage/logs` або Telescope.

---

## Практика: крок за кроком

### Крок 1: Увімкніть preventLazyLoading

```php
// app/Providers/AppServiceProvider.php
<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Заборонити lazy loading в development
        Model::preventLazyLoading(! $this->app->isProduction());

        // Логувати SQL-запити в development
        if (! $this->app->isProduction()) {
            DB::listen(function ($query) {
                logger()->debug($query->sql, [
                    'bindings' => $query->bindings,
                    'time' => $query->time . 'ms',
                ]);
            });
        }
    }
}
```

Тепер запустіть додаток і зробіть запит до API. Якщо де-небудь є N+1 -- ви побачите виняток.

### Крок 2: Додайте eager loading в контролер

```php
// app/Http/Controllers/TaskController.php
class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::with(['category', 'tags']) // <-- eager loading
            ->where('user_id', $request->user()->id)
            ->when($request->status, fn ($q, $status) => $q->byStatus($status))
            ->when($request->search, fn ($q, $search) => $q->search($search))
            ->when(
                $request->sort_by,
                fn ($q, $sort) => $q->orderBy($sort, $request->input('sort_dir', 'asc')),
                fn ($q) => $q->latest()
            )
            ->paginate(15);

        return TaskResource::collection($tasks);
    }

    public function show(Task $task)
    {
        $this->authorize('view', $task);

        $task->load(['category', 'tags']); // <-- eager load для вже знайденої моделі

        return new TaskResource($task);
    }
}
```

### Крок 3: Додайте кешування категорій

```php
// app/Http/Controllers/CategoryController.php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $categories = Cache::remember(
            "user.{$user->id}.categories",
            300, // 5 хвилин
            fn () => Category::where('user_id', $user->id)
                ->withCount('tasks')
                ->orderBy('name')
                ->get()
        );

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = $request->user()->categories()->create(
            $request->validated()
        );

        // Інвалідуємо кеш
        $this->clearCategoryCache($request->user()->id);

        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $this->authorize('update', $category);

        $category->update($request->validated());

        $this->clearCategoryCache($request->user()->id);

        return new CategoryResource($category);
    }

    public function destroy(Request $request, Category $category)
    {
        $this->authorize('delete', $category);

        $category->delete();

        $this->clearCategoryCache($request->user()->id);

        return response()->noContent();
    }

    private function clearCategoryCache(int $userId): void
    {
        Cache::forget("user.{$userId}.categories");
        // Також інвалідуємо статистику, бо вона залежить від категорій
        Cache::forget("user.{$userId}.stats");
    }
}
```

### Крок 4: Кешування статистики

```php
// app/Http/Controllers/StatsController.php
<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $stats = Cache::remember(
            "user.{$user->id}.stats",
            600, // 10 хвилин
            function () use ($user) {
                $tasks = Task::where('user_id', $user->id);

                return [
                    'total' => (clone $tasks)->count(),
                    'by_status' => [
                        'pending' => (clone $tasks)->where('status', 'pending')->count(),
                        'in_progress' => (clone $tasks)->where('status', 'in_progress')->count(),
                        'done' => (clone $tasks)->where('status', 'done')->count(),
                    ],
                    'by_priority' => [
                        'low' => (clone $tasks)->where('priority', 'low')->count(),
                        'medium' => (clone $tasks)->where('priority', 'medium')->count(),
                        'high' => (clone $tasks)->where('priority', 'high')->count(),
                    ],
                    'overdue' => (clone $tasks)->overdue()->count(),
                    'by_category' => Category::where('user_id', $user->id)
                        ->withCount('tasks')
                        ->get()
                        ->pluck('tasks_count', 'name'),
                ];
            }
        );

        return response()->json(['data' => $stats]);
    }
}
```

Інвалідація при зміні задачі:

```php
// app/Http/Controllers/TaskController.php
// Додайте після кожної зміни задачі:

public function store(StoreTaskRequest $request)
{
    $task = $request->user()->tasks()->create($request->validated());

    Cache::forget("user.{$request->user()->id}.stats");

    return new TaskResource($task);
}

public function update(UpdateTaskRequest $request, Task $task)
{
    $this->authorize('update', $task);
    $task->update($request->validated());

    Cache::forget("user.{$request->user()->id}.stats");

    return new TaskResource($task);
}

public function destroy(Request $request, Task $task)
{
    $this->authorize('delete', $task);
    $task->delete();

    Cache::forget("user.{$request->user()->id}.stats");

    return response()->noContent();
}
```

**Альтернатива**: інвалідувати кеш через Observer, щоб не дублювати код у кожному контролері:

```php
// app/Observers/TaskObserver.php
use Illuminate\Support\Facades\Cache;

class TaskObserver
{
    public function created(Task $task): void
    {
        $this->clearUserCache($task->user_id);
    }

    public function updated(Task $task): void
    {
        $this->clearUserCache($task->user_id);

        // Existing logic for TaskCompleted event...
        if ($task->isDirty('status') && $task->status === 'done') {
            event(new TaskCompleted($task));
        }
    }

    public function deleted(Task $task): void
    {
        $this->clearUserCache($task->user_id);
    }

    private function clearUserCache(int $userId): void
    {
        Cache::forget("user.{$userId}.stats");
        Cache::forget("user.{$userId}.categories");
    }
}
```

### Крок 5: Додайте індекси

```bash
php artisan make:migration add_performance_indexes_to_tasks_table
```

```php
// database/migrations/xxxx_add_performance_indexes_to_tasks_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Індекс для фільтрації за статусом
            $table->index('status');

            // Індекс для пошуку прострочених задач
            $table->index('deadline');

            // Композитний індекс для типового запиту:
            // WHERE user_id = ? AND status = ? ORDER BY created_at
            $table->index(['user_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['deadline']);
            $table->dropIndex(['user_id', 'status', 'created_at']);
        });
    }
};
```

```bash
php artisan migrate
```

### Крок 6: Виміряйте результат

Створіть тимчасовий тест для вимірювання:

```php
// tests/Feature/PerformanceTest.php
<?php

use App\Models\Task;
use App\Models\User;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

describe('Performance', function () {
    it('loads task list with eager loading in few queries', function () {
        $user = User::factory()->create();
        $categories = Category::factory()->count(5)->create(['user_id' => $user->id]);

        foreach ($categories as $category) {
            Task::factory()->count(10)->create([
                'user_id' => $user->id,
                'category_id' => $category->id,
            ]);
        }

        $queryCount = 0;
        DB::listen(function () use (&$queryCount) {
            $queryCount++;
        });

        $response = $this->actingAs($user)
            ->getJson('/api/tasks');

        $response->assertOk();

        // З eager loading: 2-4 запити (tasks + categories + tags + pagination count)
        // Без eager loading: 51+ запитів (1 + 50 tasks * N relations)
        expect($queryCount)->toBeLessThanOrEqual(6);
    });

    it('uses cache for category list', function () {
        $user = User::factory()->create();
        Category::factory()->count(5)->create(['user_id' => $user->id]);

        // Перший запит -- cache miss, виконує SQL
        $queryCount1 = 0;
        DB::listen(function () use (&$queryCount1) {
            $queryCount1++;
        });

        $this->actingAs($user)->getJson('/api/categories');

        // Другий запит -- cache hit, НЕ виконує SQL для категорій
        $queryCount2 = 0;
        // Потрібно перезапустити listener
        DB::flushQueryLog();

        $queryCount2 = 0;
        DB::listen(function () use (&$queryCount2) {
            $queryCount2++;
        });

        $this->actingAs($user)->getJson('/api/categories');

        // Другий запит повинен мати менше SQL-запитів (кеш працює)
        expect($queryCount2)->toBeLessThan($queryCount1);
    });
});
```

### Крок 7: Оптимізація для продакшну

```bash
# Кешування конфігурації, маршрутів, views
php artisan optimize

# Перевірити статус
php artisan optimize:status

# Для розробки -- скасувати все
php artisan optimize:clear
```

---

## Перевірка

Після завершення цього уроку у вас має бути:

- [ ] `preventLazyLoading()` увімкнений в `AppServiceProvider`
- [ ] `DB::listen()` логує запити в development
- [ ] Всі контролери використовують `with()` або `load()` для eager loading
- [ ] `CategoryController` використовує `Cache::remember()` з TTL 5 хвилин
- [ ] Кеш інвалідується при CRUD операціях з категоріями
- [ ] `StatsController` кешує статистику на 10 хвилин
- [ ] Міграція з індексами для `tasks` таблиці
- [ ] Тести підтверджують мінімальну кількість SQL-запитів
- [ ] `php artisan optimize` працює без помилок

---

## Міні-тест

### 1. Що таке проблема N+1?
a) Помилка в SQL-запиті  
b) 1 запит для основних даних + N додаткових запитів для кожного повʼязаного запису  
c) Обмеження SQLite на кількість таблиць  
d) Помилка при більш ніж N+1 звʼязках у моделі  

### 2. Як `Cache::remember()` працює?
a) Завжди виконує callback і зберігає результат  
b) Повертає значення з кешу, якщо воно є; інакше виконує callback, зберігає і повертає  
c) Видаляє значення з кешу через заданий час  
d) Запамʼятовує URL для подальшого редиректу  

### 3. Що робить `preventLazyLoading()`?
a) Забороняє завантаження моделей без eager loading  
b) Кидає виняток при спробі lazy loading повʼязаних моделей  
c) Кешує всі звʼязки автоматично  
d) Відключає всі SQL-запити  

### 4. Для чого потрібен композитний індекс `['user_id', 'status']`?
a) Створює два окремих індекси  
b) Прискорює запити `WHERE user_id = ? AND status = ?`  
c) Обовʼязковий для foreign key  
d) Забороняє дублікати в цих полях  

### 5. Коли використовувати `cursor()` замість `get()`?
a) Завжди, бо це швидше  
b) При обробці дуже великих наборів даних, коли памʼять обмежена  
c) Тільки для читання, не для запису  
d) Тільки з MySQL, не з SQLite  

---

## Практичне завдання

### Завдання: Кешований endpoint статистики з тестами

1. **Створіть `StatsController`** (якщо ще не існує) з endpoint `/api/stats`, який повертає:
   - Загальну кількість задач
   - Кількість по кожному статусу
   - Кількість прострочених задач
   - Кількість задач по категоріях
   - Кешування на 10 хвилин

2. **Додайте маршрут:**
   ```php
   Route::middleware('auth:sanctum')->get('/stats', [StatsController::class, 'index']);
   ```

3. **Напишіть тести** `tests/Feature/StatsControllerTest.php`:
   - Повертає правильну статистику
   - Вимагає аутентифікації
   - Кеш працює (другий запит не виконує SQL для статистики)
   - Кеш інвалідується при створенні задачі
   - Кеш інвалідується при зміні статусу задачі
   - Кеш інвалідується при видаленні задачі

4. **Тест продуктивності:**
   - Створіть 50 задач у 5 категоріях
   - Перевірте, що endpoint виконує менше 10 SQL-запитів
   - Перевірте, що повторний запит використовує кеш (0 SQL-запитів для статистики)

**Підказка**: використовуйте `DB::listen()` для підрахунку запитів і `Cache::forget()` для тестування інвалідації.

---

## Відповіді на тест

1. **b)** N+1 -- це 1 запит для основних даних (наприклад, список задач) + N додаткових запитів для кожного повʼязаного запису (наприклад, категорія для кожної задачі). Вирішується eager loading через `with()`.
2. **b)** `Cache::remember('key', ttl, callback)` перевіряє кеш: якщо значення є і не протухло -- повертає його; якщо немає -- виконує callback, зберігає результат у кеш і повертає. Це найпоширеніший патерн кешування.
3. **b)** `preventLazyLoading()` кидає виняток `LazyLoadingViolationException`, коли код намагається завантажити повʼязану модель без попереднього eager loading. Це допомагає виявити N+1 проблеми під час розробки.
4. **b)** Композитний індекс `['user_id', 'status']` оптимізує запити, які фільтрують одночасно по обох полях. Він також працює для запитів тільки по `user_id` (перше поле), але НЕ працює для запитів тільки по `status`.
5. **b)** `cursor()` повертає `LazyCollection`, що завантажує по одному запису в памʼять. Це ідеально для обробки дуже великих наборів (100k+ записів), де `get()` зайняв би занадто багато памʼяті.
