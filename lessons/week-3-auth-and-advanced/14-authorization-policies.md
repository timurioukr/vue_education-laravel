# Урок 14: Authorization Policies -- хто що може робити

## Що ви вивчите

- Різниця між автентифікацією та авторизацією (поглиблено)
- Gates -- прості closure-based перевірки прав
- Policies -- класи авторизації, прив'язані до моделей
- Створення Policy через Artisan: `php artisan make:policy`
- Методи Policy: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`
- Автоматичне виявлення (auto-discovery) Policy для моделі
- Використання `$this->authorize()` в контролерах
- Автоматичний 403 Forbidden при відмові в доступі
- Gates для глобальних перевірок (is_admin тощо)
- Комбінування автентифікації + авторизації

---

## Паралелі з JS/Vue

| Vue / Nuxt / JS | Laravel |
|---|---|
| Composable `usePermissions()` з методами `canEdit()`, `canDelete()` | Policy клас з методами `update()`, `delete()` |
| `if (!canEdit(user, task)) router.push('/403')` | `$this->authorize('update', $task)` -- автоматичний 403 |
| Перевірка `task.userId === currentUser.id` у компоненті | `$task->user_id === $user->id` у Policy |
| Глобальна перевірка `user.role === 'admin'` | `Gate::define('access-admin', fn($user) => $user->is_admin)` |
| `v-if="canEdit(task)"` для приховування кнопки | Policy для серверної перевірки (UI прячемо, сервер блокує) |
| Navigation guard `if (!user.isAdmin) return '/403'` | Gate middleware: `Route::middleware('can:access-admin')` |
| Централізований permissions service | Централізований Policy per model |

---

## Теорія

### Чому потрібна авторизація

У попередньому уроці ми додали автентифікацію: тепер Laravel знає, **хто** робить запит. Але цього недостатньо. Навіть автентифікований користувач не повинен мати доступ до чужих даних.

У Уроці 13 ми вирішували це ручними перевірками:

```php
// TaskController@update -- Урок 13
if ($task->user_id !== $request->user()->id) {
    return response()->json(['message' => 'Not found.'], 404);
}
```

Проблеми з цим підходом:
1. **Дублювання** -- ту саму перевірку потрібно копіювати в `show()`, `update()`, `destroy()`
2. **Розкидані правила** -- логіка авторизації розмазана по контролерах
3. **Легко забути** -- додали новий ендпоінт і забули перевірку? Витік даних.
4. **Немає єдиного джерела правди** -- де подивитись ВСІ правила доступу?

**Policies вирішують усі ці проблеми.** Policy -- це один клас, де зібрані ВСІ правила доступу для однієї моделі. Як у Vue ви виносите логіку в composable `usePermissions()`, щоб не дублювати перевірки по компонентах.

### Gates -- прості глобальні перевірки

Gates -- це closure-based перевірки для простих випадків, які не прив'язані до конкретної моделі.

```php
// Визначення Gate -- зазвичай у AppServiceProvider@boot
use Illuminate\Support\Facades\Gate;

Gate::define('access-admin', function ($user) {
    return $user->is_admin;
});

Gate::define('view-stats', function ($user) {
    return $user->is_admin || $user->role === 'manager';
});
```

Використання:

```php
// У контролері
if (Gate::allows('access-admin')) {
    // користувач -- адмін
}

if (Gate::denies('access-admin')) {
    abort(403);
}

// Скорочений синтаксис
Gate::authorize('access-admin'); // кине 403, якщо false
```

У Vue аналогія:

```javascript
// Vue -- глобальна перевірка
const canAccessAdmin = computed(() => authStore.user?.role === 'admin')

// У navigation guard
if (to.meta.requiresAdmin && !canAccessAdmin.value) {
    return '/403'
}
```

Gates підходять для:
- Перевірки ролей (`is_admin`, `is_moderator`)
- Перевірки підписок (`has_premium`)
- Будь-яких перевірок, НЕ пов'язаних з конкретним ресурсом

Для CRUD-операцій над моделями -- використовуйте **Policies**.

### Policies -- авторизація для моделей

Policy -- це клас, який містить методи авторизації для однієї конкретної моделі. Кожен метод відповідає одній дії:

```
TaskPolicy
├── viewAny(User $user)              -- чи може бачити список задач?
├── view(User $user, Task $task)     -- чи може бачити конкретну задачу?
├── create(User $user)               -- чи може створювати задачі?
├── update(User $user, Task $task)   -- чи може оновити конкретну задачу?
├── delete(User $user, Task $task)   -- чи може видалити конкретну задачу?
├── restore(User $user, Task $task)  -- чи може відновити (soft delete)?
└── forceDelete(User $user, Task $task) -- чи може видалити назавжди?
```

Кожен метод приймає `$user` (автентифікований користувач) і опціонально `$model` (ресурс, до якого хочуть доступ). Метод повертає `true` (дозволено) або `false` (заборонено).

### Створення Policy

```bash
php artisan make:policy TaskPolicy --model=Task
```

Прапорець `--model=Task` автоматично згенерує всі CRUD-методи з правильними тайп-хінтами.

Результат -- `app/Policies/TaskPolicy.php`:

```php
<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Чи може користувач бачити список задач?
     */
    public function viewAny(User $user): bool
    {
        // Кожен автентифікований користувач може бачити свій список
        return true;
    }

    /**
     * Чи може користувач бачити конкретну задачу?
     */
    public function view(User $user, Task $task): bool
    {
        // Тільки власник задачі
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач створювати задачі?
     */
    public function create(User $user): bool
    {
        // Кожен автентифікований користувач може створювати
        return true;
    }

    /**
     * Чи може користувач оновити задачу?
     */
    public function update(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач видалити задачу?
     */
    public function delete(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач відновити задачу (soft delete)?
     */
    public function restore(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач назавжди видалити задачу?
     */
    public function forceDelete(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }
}
```

Логіка проста: користувач може робити будь-що зі **своїми** задачами, і нічого -- з чужими. Вся перевірка зводиться до `$task->user_id === $user->id`.

### Auto-discovery -- автоматичне виявлення

Laravel автоматично знаходить Policy для моделі за конвенцією назв:

- Модель `App\Models\Task` → Policy `App\Policies\TaskPolicy`
- Модель `App\Models\Category` → Policy `App\Policies\CategoryPolicy`
- Модель `App\Models\User` → Policy `App\Policies\UserPolicy`

**Правило:** Policy має бути в `App\Policies\` і називатись `{Model}Policy`. Якщо ви дотримуєтесь цієї конвенції, жодної додаткової реєстрації не потрібно.

Якщо з якоїсь причини ваш Policy в іншому місці, зареєструйте його вручну у `AppServiceProvider`:

```php
use App\Models\Task;
use App\Policies\TaskPolicy;
use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    Gate::policy(Task::class, TaskPolicy::class);
}
```

Але зазвичай auto-discovery достатньо.

### Використання Policy в контролері

Є кілька способів використовувати Policy в контролері:

#### Спосіб 1: $this->authorize() (рекомендований)

```php
class TaskController extends Controller
{
    public function show(Task $task)
    {
        $this->authorize('view', $task);
        // Якщо ми тут -- авторизація пройшла
        return new TaskResource($task);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $this->authorize('update', $task);
        $task->update($request->validated());
        return new TaskResource($task);
    }

    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
        $task->delete();
        return response()->noContent();
    }
}
```

`$this->authorize('update', $task)` робить наступне:
1. Знаходить `TaskPolicy` (auto-discovery по класу `Task`)
2. Викликає метод `update(User $user, Task $task)`
3. Якщо метод повернув `true` -- продовжує виконання контролера
4. Якщо `false` -- автоматично кидає `403 Forbidden`

Для методів без конкретної моделі передайте клас:

```php
public function index()
{
    $this->authorize('viewAny', Task::class);
    // ...
}

public function store(StoreTaskRequest $request)
{
    $this->authorize('create', Task::class);
    // ...
}
```

**Зверніть увагу:** для `viewAny` та `create` ми передаємо `Task::class` (клас), а не `$task` (інстанс). Логічно -- задачі ще немає, немає що перевіряти.

#### Спосіб 2: Gate::authorize()

```php
use Illuminate\Support\Facades\Gate;

public function update(Request $request, Task $task)
{
    Gate::authorize('update', $task);
    // ...
}
```

Працює так само, але без `$this->`. Зручно поза контролерами.

#### Спосіб 3: $user->can() / $user->cannot()

```php
public function update(Request $request, Task $task)
{
    if ($request->user()->cannot('update', $task)) {
        abort(403, 'You do not own this task.');
    }

    // ...
}
```

Цей спосіб дає більше контролю -- ви можете повернути кастомне повідомлення або код.

#### Спосіб 4: Middleware

```php
Route::put('/tasks/{task}', [TaskController::class, 'update'])
    ->middleware('can:update,task');
```

Policy перевіряється ще до контролера, на рівні маршрутизації.

### Response від Policy -- allow/deny з повідомленнями

Замість простого `true/false` можна повертати Response з повідомленням:

```php
use Illuminate\Auth\Access\Response;

public function update(User $user, Task $task): Response
{
    return $task->user_id === $user->id
        ? Response::allow()
        : Response::deny('You do not own this task.');
}
```

Це дозволяє повертати кастомне повідомлення при 403:

```json
{
    "message": "You do not own this task."
}
```

### before() -- глобальне правило в Policy

Метод `before()` виконується ПЕРЕД будь-яким іншим методом Policy. Якщо він повертає не-null, результат використовується без виклику основного методу:

```php
class TaskPolicy
{
    /**
     * Адміну дозволено все.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->is_admin) {
            return true; // Адмін може все -- інші методи не перевіряються
        }

        return null; // Для звичайних користувачів -- перевіряємо далі
    }

    public function update(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }
}
```

Це як глобальний override: "якщо адмін -- пропускай все".

**Важливо:** `before()` повинен повертати `null` для "звичайних" випадків. Якщо поверне `false`, жоден метод Policy не буде перевірений, і доступ буде заборонений.

### Коли що використовувати

| Ситуація | Інструмент |
|---|---|
| CRUD-операції над моделлю (Task, Category) | **Policy** |
| Проста перевірка ролі (is_admin) | **Gate** |
| Перевірка підписки (has_premium) | **Gate** |
| Доступ до конкретного ресурсу | **Policy** |
| Глобальне правило "адмін може все" | **Policy::before()** |

---

## Практика: крок за кроком

> **Передумова:** ви маєте працюючу автентифікацію з Уроку 13.

### Крок 1: Створіть TaskPolicy

```bash
cd ~/task-manager-api
php artisan make:policy TaskPolicy --model=Task
```

Відкрийте `app/Policies/TaskPolicy.php` і заповніть:

```php
<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Чи може користувач переглядати список задач?
     * Так -- кожен автентифікований користувач бачить свій список.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Чи може користувач переглядати конкретну задачу?
     * Тільки якщо це його задача.
     */
    public function view(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач створювати задачі?
     * Так -- кожен автентифікований користувач може.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Чи може користувач оновити конкретну задачу?
     * Тільки якщо це його задача.
     */
    public function update(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач видалити конкретну задачу?
     * Тільки якщо це його задача.
     */
    public function delete(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач відновити задачу (soft delete)?
     */
    public function restore(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    /**
     * Чи може користувач назавжди видалити задачу?
     */
    public function forceDelete(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }
}
```

### Крок 2: Створіть CategoryPolicy

```bash
php artisan make:policy CategoryPolicy --model=Category
```

Відкрийте `app/Policies/CategoryPolicy.php`:

```php
<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Category $category): bool
    {
        return $category->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Category $category): bool
    {
        return $category->user_id === $user->id;
    }

    public function delete(User $user, Category $category): bool
    {
        return $category->user_id === $user->id;
    }

    public function restore(User $user, Category $category): bool
    {
        return $category->user_id === $user->id;
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return $category->user_id === $user->id;
    }
}
```

### Крок 3: Оновіть TaskController з authorize()

Тепер замінимо ручні `if ($task->user_id !== ...)` перевірки на `$this->authorize()`:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    /**
     * GET /api/tasks
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Task::class);

        $tasks = $request->user()
            ->tasks()
            ->with(['category', 'tags'])
            ->latest()
            ->paginate(15);

        return TaskResource::collection($tasks)->response();
    }

    /**
     * POST /api/tasks
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->authorize('create', Task::class);

        $task = $request->user()->tasks()->create($request->validated());

        return (new TaskResource($task->load(['category', 'tags'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/tasks/{task}
     */
    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return (new TaskResource($task->load(['category', 'tags'])))->response();
    }

    /**
     * PUT /api/tasks/{task}
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $task->update($request->validated());

        return (new TaskResource($task->load(['category', 'tags'])))->response();
    }

    /**
     * DELETE /api/tasks/{task}
     */
    public function destroy(Task $task): Response
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->noContent();
    }
}
```

**Порівняйте з Уроком 13:**

```php
// Урок 13 -- ручна перевірка (4 рядки)
if ($task->user_id !== $request->user()->id) {
    return response()->json(['message' => 'Not found.'], 404);
}
$task->update($request->validated());

// Урок 14 -- Policy (2 рядки)
$this->authorize('update', $task);
$task->update($request->validated());
```

Переваги Policy:
- Менше коду в контролері
- Логіка авторизації в одному місці (`TaskPolicy`)
- Автоматичний 403 з правильним форматом
- Легше тестувати -- Policy можна тестувати окремо

### Крок 4: Оновіть CategoryController з authorize()

```php
<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        $categories = $request->user()
            ->categories()
            ->withCount('tasks')
            ->get();

        return CategoryResource::collection($categories)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $category = $request->user()->categories()->create($validated);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Category $category): JsonResponse
    {
        $this->authorize('view', $category);

        return (new CategoryResource($category->loadCount('tasks')))->response();
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $category->update($validated);

        return (new CategoryResource($category))->response();
    }

    public function destroy(Category $category): Response
    {
        $this->authorize('delete', $category);

        $category->delete();

        return response()->noContent();
    }
}
```

### Крок 5: Додайте Gate для адміна

Створіть міграцію для поля `is_admin`:

```bash
php artisan make:migration add_is_admin_to_users_table --table=users
```

Відкрийте нову міграцію:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
```

```bash
php artisan migrate
```

Тепер визначте Gate у `app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('access-admin', function ($user) {
            return $user->is_admin;
        });
    }
}
```

### Крок 6: Додайте before() до Policy для адмінів

Оновіть `TaskPolicy` -- додайте метод `before()`:

```php
<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Адміни можуть робити все з будь-якими задачами.
     * Повертає null для звичайних користувачів -- далі перевіряються інші методи.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->is_admin) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    public function restore(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    public function forceDelete(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }
}
```

Зробіть те саме для `CategoryPolicy`:

```php
public function before(User $user, string $ability): ?bool
{
    if ($user->is_admin) {
        return true;
    }

    return null;
}
```

### Крок 7: Створіть admin-ендпоінт

Додайте у `routes/api.php`:

```php
use App\Http\Controllers\AdminController;

Route::middleware('auth:sanctum')->group(function () {
    // ... існуючі маршрути ...

    // Адмін-маршрути
    Route::get('/admin/stats', [AdminController::class, 'stats'])
        ->middleware('can:access-admin');
});
```

Middleware `can:access-admin` використовує Gate `access-admin`, який ми визначили раніше.

Створіть контролер:

```bash
php artisan make:controller AdminController
```

```php
<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    /**
     * GET /api/admin/stats
     *
     * Статистика для адміністратора.
     * Доступно тільки користувачам з is_admin = true.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'total_users' => User::count(),
            'total_tasks' => Task::count(),
            'total_categories' => Category::count(),
            'tasks_by_status' => [
                'pending' => Task::where('status', 'pending')->count(),
                'in_progress' => Task::where('status', 'in_progress')->count(),
                'done' => Task::where('status', 'done')->count(),
            ],
            'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
        ]);
    }
}
```

---

## Перевірка

Запустіть сервер і виконайте тести:

### Тест 1: Створіть двох користувачів

```bash
# User A
TOKEN_A=$(curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }' | jq -r '.token')

# User B
TOKEN_B=$(curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Bob",
    "email": "bob@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }' | jq -r '.token')
```

### Тест 2: User A створює задачу

```bash
TASK_RESPONSE=$(curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{
    "title": "Alice task",
    "status": "pending",
    "priority": "high"
  }')

echo $TASK_RESPONSE | jq .

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data.id')
```

### Тест 3: User B намагається оновити задачу User A -- 403

```bash
curl -s -X PUT http://localhost:8000/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"title": "Hacked by Bob"}' | jq .
```

Очікуваний результат:

```json
{
  "message": "This action is unauthorized."
}
```

HTTP статус: **403 Forbidden**. Policy автоматично заблокувала доступ, тому що `$task->user_id !== $user->id`.

### Тест 4: User A може оновити свою задачу -- 200

```bash
curl -s -X PUT http://localhost:8000/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Updated by Alice"}' | jq .
```

Очікуваний результат: оновлена задача з `"title": "Updated by Alice"`.

### Тест 5: Звичайний користувач не може дістатись до admin stats -- 403

```bash
curl -s http://localhost:8000/api/admin/stats \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
```

```json
{
  "message": "This action is unauthorized."
}
```

### Тест 6: Зробіть користувача адміном і спробуйте знову

```bash
# Зробити User A адміном через tinker
php artisan tinker --execute="App\Models\User::where('email', 'alice@example.com')->update(['is_admin' => true]);"
```

```bash
# Тепер admin stats доступні
curl -s http://localhost:8000/api/admin/stats \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
```

```json
{
  "total_users": 2,
  "total_tasks": 1,
  "total_categories": 0,
  "tasks_by_status": {
    "pending": 1,
    "in_progress": 0,
    "done": 0
  },
  "recent_users": [...]
}
```

### Тест 7: Адмін може редагувати чужі задачі (before())

```bash
# Alice (адмін) може оновити задачу, навіть якщо вона чужа
# Але в нашому випадку задача і так належить Alice
# Створимо задачу від Bob і спробуємо оновити від Alice

BOB_TASK=$(curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"title": "Bob secret task", "status": "pending", "priority": "low"}')

BOB_TASK_ID=$(echo $BOB_TASK | jq -r '.data.id')

# Alice (адмін) оновлює задачу Bob -- має працювати завдяки before()
curl -s -X PUT http://localhost:8000/api/tasks/$BOB_TASK_ID \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Reviewed by admin"}' | jq .
```

Результат: 200 -- адмін може все завдяки `before()`.

---

## Міні-тест

**1. Що повертає метод Policy при відмові в доступі?**

a) Null
b) Виняток (Exception)
c) false -- і Laravel автоматично повертає 403
d) Рядок з помилкою

**2. Яка різниця між Gate та Policy?**

a) Gate для моделей, Policy для ролей
b) Gate для простих closure-перевірок, Policy для CRUD-операцій над моделями
c) Вони ідентичні
d) Gate для фронтенду, Policy для бекенду

**3. Як Laravel знаходить TaskPolicy для моделі Task (auto-discovery)?**

a) Потрібно зареєструвати в `config/auth.php`
b) За конвенцією: `App\Policies\TaskPolicy` для `App\Models\Task`
c) Потрібно додати trait `HasPolicy` до моделі
d) Потрібно вказати в `$policies` масиві AuthServiceProvider

**4. Що робить `$this->authorize('update', $task)` якщо Policy повертає false?**

a) Повертає null
b) Логує помилку і продовжує
c) Кидає виняток -- Laravel автоматично повертає 403 Forbidden
d) Повертає false і контролер продовжує

**5. Для чого метод `before()` в Policy?**

a) Виконується після основного методу
b) Виконується перед основним методом; якщо повертає не-null, результат використовується без виклику основного методу
c) Реєструє Policy
d) Перевіряє автентифікацію

---

## Практичне завдання

### Завдання: Повна система авторизації з адмін-функціоналом

1. **Додайте `is_admin`** до міграції users (якщо ще не додали -- див. Крок 5).

2. **Створіть Gate `access-admin`** в `AppServiceProvider` (якщо ще не створили -- див. Крок 5).

3. **Створіть адмін-ендпоінт** `GET /api/admin/stats`, який повертає:
   - Загальну кількість користувачів
   - Загальну кількість задач
   - Кількість задач по статусах
   - 5 останніх зареєстрованих користувачів

4. **Додайте маршрут** з middleware `can:access-admin`.

5. **Протестуйте повний сценарій:**

```bash
# 1. Зареєструйте звичайного користувача
# 2. Спробуйте GET /api/admin/stats -> 403
# 3. Зробіть користувача адміном через tinker:
php artisan tinker --execute="App\Models\User::where('email', 'your@email.com')->update(['is_admin' => true]);"
# 4. Спробуйте GET /api/admin/stats -> 200 з даними
# 5. Створіть задачу від User A
# 6. User B намагається оновити задачу User A -> 403
# 7. Зробіть User B адміном
# 8. User B (адмін) намагається оновити задачу User A -> 200 (before() дозволяє)
```

6. **(Бонус)** Створіть `TagPolicy` за аналогією з TaskPolicy та CategoryPolicy. Додайте `authorize()` виклики в `TagController`.

---

## Відповіді на тест

1. **c) false -- і Laravel автоматично повертає 403**. Коли метод Policy повертає `false`, `$this->authorize()` кидає `AuthorizationException`, який Laravel перехоплює і конвертує у 403 Forbidden JSON-відповідь.

2. **b) Gate для простих closure-перевірок, Policy для CRUD-операцій над моделями**. Gate підходить для глобальних перевірок (is_admin, has_premium). Policy -- для перевірок, пов'язаних з конкретною моделлю (чи може User оновити Task).

3. **b) За конвенцією: `App\Policies\TaskPolicy` для `App\Models\Task`**. Laravel автоматично шукає Policy в `App\Policies\{Model}Policy`. Ніякої реєстрації не потрібно, якщо ви дотримуєтесь цієї конвенції.

4. **c) Кидає виняток -- Laravel автоматично повертає 403 Forbidden**. `$this->authorize()` кидає `Illuminate\Auth\Access\AuthorizationException`, якщо Policy повертає false. Laravel exception handler конвертує це у JSON-відповідь з кодом 403.

5. **b) Виконується перед основним методом; якщо повертає не-null, результат використовується без виклику основного методу**. Зазвичай використовується для адмінів: якщо `before()` повертає `true`, основний метод (update, delete тощо) не викликається. Якщо `null` -- перевіряється основний метод.
