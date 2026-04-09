# Урок 13: Sanctum Authentication -- автентифікація API токенами

## Що ви вивчите

- Різниця між автентифікацією (authentication) та авторизацією (authorization)
- Що таке Laravel Sanctum і чому він ідеальний для API
- Встановлення Sanctum через `php artisan install:api`
- Трейт `HasApiTokens` на моделі User
- Створення повного auth-флоу: реєстрація, логін, логаут, отримання профілю
- Як працюють токени: створення, відправка, відкликання
- Захист маршрутів через `auth:sanctum` middleware
- Отримання поточного користувача через `$request->user()`
- Прив'язка даних до автентифікованого користувача (scoping)
- Token abilities -- обмеження дій токена

---

## Паралелі з JS/Vue

| Vue / Nuxt / JS | Laravel |
|---|---|
| JWT або Bearer-токен у `localStorage` / Pinia auth store | Sanctum `plainTextToken` зберігається в БД |
| `POST /api/login` повертає `{ token, user }` | `$user->createToken('auth-token')->plainTextToken` |
| Axios interceptor додає `Authorization: Bearer <token>` | Sanctum автоматично валідує цей заголовок |
| `authStore.user` (клієнтський стейт) | `$request->user()` (серверна перевірка по токену) |
| Vue Router navigation guard `if (!authStore.isAuthenticated)` | `Route::middleware('auth:sanctum')` |
| `authStore.logout()` -- видалити токен з localStorage | `$request->user()->currentAccessToken()->delete()` |
| Role-based route guards у Vue Router | Token abilities: `['task:create', 'task:read']` |
| Фільтрація даних у store по `currentUserId` | `$request->user()->tasks()->get()` |

---

## Теорія

### Автентифікація vs Авторизація

Ці два терміни часто плутають, але вони означають різні речі:

**Автентифікація (Authentication)** -- це відповідь на питання "**Хто ти?**". Коли користувач вводить email і пароль, сервер перевіряє, чи існує такий користувач. Це як показати паспорт на вході.

**Авторизація (Authorization)** -- це відповідь на питання "**Що тобі дозволено?**". Навіть якщо сервер знає, хто ви, це не означає, що вам дозволено видаляти чужі задачі. Це як мати пропуск в офіс, але не мати ключа від серверної кімнати.

У Vue-світі це працює так:
- **Автентифікація**: форма логіну → `POST /api/login` → отримати токен → зберегти в Pinia store
- **Авторизація**: Vue Router guard перевіряє `authStore.user.role` перед переходом на `/admin`

У Laravel:
- **Автентифікація**: Sanctum перевіряє токен у заголовку `Authorization: Bearer <token>`
- **Авторизація**: Policies та Gates перевіряють, чи має користувач право виконати дію (Урок 14)

Цей урок -- про автентифікацію. Наступний -- про авторизацію.

### Що таке Laravel Sanctum

Laravel Sanctum -- це легковагий пакет автентифікації для SPA (Single Page Applications) та API. Він вирішує простішу задачу, ніж повноцінний OAuth: видає API-токени, які ваш Vue/Nuxt-додаток зберігає і відправляє з кожним запитом.

Ви вже працюєте з цим на фронтенді! Коли ваш Axios interceptor додає заголовок `Authorization: Bearer eyJhb...`, сервер повинен якось перевірити цей токен. Sanctum саме це і робить.

**Як це працює:**

1. Користувач відправляє `POST /api/login` з email та паролем
2. Laravel перевіряє credentials, знаходить користувача в БД
3. Sanctum створює токен, зберігає його хеш у таблиці `personal_access_tokens`
4. Laravel повертає plain-text токен клієнту
5. Клієнт зберігає токен (у Vue -- в Pinia store або localStorage)
6. При кожному наступному запиті клієнт відправляє `Authorization: Bearer <token>`
7. Sanctum знаходить токен у БД, визначає користувача, передає його в контролер

```
Vue App                          Laravel API
  |                                  |
  |-- POST /api/login ------------->|
  |   {email, password}             |-- перевіряє credentials
  |                                  |-- створює токен у БД
  |<-- {user, token} ---------------|
  |                                  |
  |-- GET /api/tasks --------------->|
  |   Authorization: Bearer abc123   |-- Sanctum знаходить токен
  |                                  |-- визначає user_id
  |<-- [{task1}, {task2}] ----------|-- повертає задачі цього user
```

### Різниця між Sanctum та JWT

Якщо ви працювали з JWT (JSON Web Tokens) на фронтенді, ось ключова різниця:

| | JWT | Sanctum |
|---|---|---|
| Де зберігається | Тільки на клієнті (stateless) | Хеш у БД `personal_access_tokens` |
| Валідація | Декодує токен і перевіряє підпис | Шукає хеш у БД |
| Відкликання | Складно (потрібен blocklist) | Просто: видаляє рядок з БД |
| Payload | Містить дані (user_id, role) | Просто випадковий рядок |
| Для чого | Мікросервіси, cross-domain | SPA + API на одному домені |

Для Task Manager API Sanctum -- ідеальний вибір. Він простіший, і відкликання токенів працює "з коробки".

### Таблиця personal_access_tokens

Sanctum зберігає токени в таблиці `personal_access_tokens`. Її структура:

```
personal_access_tokens
├── id             -- PK
├── tokenable_type -- 'App\Models\User' (поліморфна зв'язок)
├── tokenable_id   -- user_id
├── name           -- назва токена ('auth-token', 'mobile-app')
├── token          -- SHA-256 хеш токена (НЕ plain text!)
├── abilities      -- JSON масив дозволів ['task:create', 'task:read']
├── last_used_at   -- коли токен востаннє використовувався
├── expires_at     -- коли токен закінчується (nullable)
├── created_at     -- коли створений
├── updated_at     -- коли оновлений
```

**Важливо:** в БД зберігається лише хеш токена. Справжній plain-text токен повертається тільки один раз -- при створенні. Якщо користувач його загубить, доведеться створити новий. Це як з паролями -- зберігається тільки хеш.

### Трейт HasApiTokens

Щоб модель User могла створювати та управляти токенами, їй потрібен трейт `HasApiTokens`:

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

Цей трейт додає до моделі User кілька методів:

```php
// Створити новий токен
$token = $user->createToken('auth-token');
$token->plainTextToken; // "1|abc123def456..."

// Створити токен з abilities (обмеженнями)
$token = $user->createToken('read-only', ['task:read']);

// Отримати всі токени користувача
$user->tokens; // колекція PersonalAccessToken

// Видалити конкретний токен (поточний)
$user->currentAccessToken()->delete();

// Видалити ВСІ токени користувача
$user->tokens()->delete();
```

Формат plain-text токена: `{token_id}|{random_string}`. Наприклад: `1|abc123def456ghi789`. Sanctum розділяє цей рядок по `|`, знаходить токен за id, і порівнює хеш random_string з тим, що в БД.

### Створення токена

```php
$token = $user->createToken('auth-token');
```

Цей виклик:
1. Генерує випадковий рядок (40 символів)
2. Хешує його через SHA-256
3. Зберігає хеш у таблиці `personal_access_tokens`
4. Повертає об'єкт `NewAccessToken` з властивістю `plainTextToken`

`plainTextToken` -- це те, що ви повертаєте клієнту. Клієнт зберігає його і відправляє в заголовку `Authorization: Bearer <plainTextToken>`.

### Відкликання токена

```php
// Видалити поточний токен (logout з одного пристрою)
$request->user()->currentAccessToken()->delete();

// Видалити ВСІ токени (logout з усіх пристроїв)
$request->user()->tokens()->delete();
```

Це величезна перевага перед JWT! З JWT ви не можете просто "видалити" токен -- він валідний, поки не закінчиться термін дії. З Sanctum -- видалили рядок з БД, і токен миттєво стає невалідним.

### Захист маршрутів middleware auth:sanctum

Middleware `auth:sanctum` перевіряє наявність та валідність токена в заголовку запиту:

```php
// Незахищені маршрути -- доступні без токена
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Захищені маршрути -- потрібен валідний токен
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
});
```

Якщо клієнт відправить запит на захищений маршрут без токена або з невалідним токеном, Laravel поверне `401 Unauthorized`:

```json
{
    "message": "Unauthenticated."
}
```

Це як Vue Router navigation guard:
```javascript
// Vue Router
router.beforeEach((to) => {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return '/login' // редірект
    }
})
```

Тільки замість редіректу на `/login` Laravel повертає 401.

### $request->user() -- отримати автентифікованого користувача

Всередині захищеного маршруту ви завжди можете отримати поточного користувача:

```php
public function index(Request $request)
{
    $user = $request->user(); // User модель
    // або
    $user = auth()->user(); // альтернативний синтаксис

    return response()->json([
        'user_id' => $user->id,
        'email' => $user->email,
    ]);
}
```

Це серверний аналог `authStore.user` у Vue, але з важливою різницею: `$request->user()` -- це **достовірна** інформація з БД, яку неможливо підробити. На клієнті `authStore.user` -- це лише кеш, який можна змінити через DevTools.

### Scoping -- прив'язка даних до користувача

Коли у вас є автентифікація, кожен користувач повинен бачити тільки **свої** дані. Є два підходи:

```php
// Підхід 1: ручна фільтрація (працює, але є кращий спосіб)
public function index(Request $request)
{
    $tasks = Task::where('user_id', $request->user()->id)->get();
    return TaskResource::collection($tasks);
}

// Підхід 2: через відношення (елегантний та безпечний)
public function index(Request $request)
{
    $tasks = $request->user()->tasks()->get();
    return TaskResource::collection($tasks);
}
```

Підхід через відношення кращий, тому що:
1. Він використовує вже визначене відношення `hasMany` на моделі User
2. Менше шансів забути фільтрацію і випадково показати чужі дані
3. Ви можете чейнити скоупи: `$request->user()->tasks()->pending()->get()`

### Token Abilities -- обмеження дій токена

Token abilities -- це список дозволів, прив'язаних до конкретного токена. Це як scopes в OAuth:

```php
// Створити токен з обмеженнями
$token = $user->createToken('mobile-app', ['task:read', 'task:create']);

// Перевірити ability в контролері
if ($request->user()->tokenCan('task:create')) {
    // дозволено
}

if ($request->user()->tokenCan('task:delete')) {
    // цей токен НЕ має цього ability -- false
}
```

Приклад використання: мобільний додаток отримує токен тільки на читання, а веб-додаток -- повний доступ.

---

## Практика: крок за кроком

> **Передумова:** ви маєте працюючий Task Manager API з попередніх уроків. У таблиці `tasks` є колонка `user_id`.

### Крок 1: Встановіть Sanctum API

```bash
cd ~/task-manager-api
php artisan install:api
```

Ця команда зробить кілька речей:
1. Встановить пакет `laravel/sanctum` (якщо ще не встановлений)
2. Створить міграцію `create_personal_access_tokens_table`
3. Створить файл `routes/api.php` (якщо його ще немає)
4. Зареєструє API routing у `bootstrap/app.php`

Запустіть міграцію:

```bash
php artisan migrate
```

Результат:

```
Creating migration table .............. 10ms DONE
Running migrations:
  2024_01_01_000000_create_personal_access_tokens_table ... DONE
```

### Крок 2: Додайте HasApiTokens до моделі User

Відкрийте `app/Models/User.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

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
     * Задачі користувача
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Категорії користувача
     */
    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
```

**Зверніть увагу** на `'password' => 'hashed'` у `casts()`. Це означає, що при присвоєнні `$user->password = 'secret123'` Laravel автоматично захешує пароль через bcrypt. Вам НЕ потрібно хешувати вручну!

### Крок 3: Створіть AuthController

```bash
php artisan make:controller AuthController
```

Відкрийте `app/Http/Controllers/AuthController.php` і заповніть його:

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * POST /api/register
     *
     * Реєстрація нового користувача.
     * Аналог: handleSubmit() у Vue компоненті RegisterForm.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        $user = User::create($validated);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * POST /api/login
     *
     * Логін існуючого користувача.
     * Аналог: те, що ваша Vue login-форма відправляє на бекенд.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * POST /api/logout
     *
     * Вихід -- видаляє поточний токен.
     * Аналог: authStore.logout() у Vue -- видаляє токен з localStorage.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * GET /api/me
     *
     * Повертає дані автентифікованого користувача.
     * Аналог: authStore.fetchUser() -- оновлює user у Pinia store.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
```

Розберемо кожен метод детально.

#### register() -- реєстрація

```php
public function register(Request $request): JsonResponse
{
    // 1. Валідація вхідних даних
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
        'password' => ['required', 'string', 'confirmed', Password::min(8)],
    ]);

    // 2. Створення користувача
    // Пароль автоматично хешується завдяки cast 'password' => 'hashed'
    $user = User::create($validated);

    // 3. Створення токена
    $token = $user->createToken('auth-token')->plainTextToken;

    // 4. Повертаємо user + token
    return response()->json([
        'user' => $user,
        'token' => $token,
    ], 201);
}
```

Валідаційне правило `'confirmed'` для пароля означає, що клієнт повинен відправити поле `password_confirmation` з тим самим значенням. Це стандартна практика для форм реєстрації -- у Vue ви б мали два інпути:

```javascript
// Vue аналогія
const form = reactive({
    name: '',
    email: '',
    password: '',
    password_confirmation: '', // Laravel шукає саме це поле
})
```

`Password::min(8)` -- це клас правил для паролів. Можна додати більше вимог:

```php
Password::min(8)
    ->letters()     // мінімум одна літера
    ->mixedCase()   // великі та малі літери
    ->numbers()     // мінімум одна цифра
    ->symbols()     // мінімум один спецсимвол
```

#### login() -- вхід

```php
public function login(Request $request): JsonResponse
{
    $validated = $request->validate([
        'email' => ['required', 'string', 'email'],
        'password' => ['required', 'string'],
    ]);

    // Шукаємо користувача за email
    $user = User::where('email', $validated['email'])->first();

    // Перевіряємо: чи існує user І чи пароль правильний
    if (! $user || ! Hash::check($validated['password'], $user->password)) {
        return response()->json([
            'message' => 'The provided credentials are incorrect.',
        ], 401);
    }

    // Все ок -- створюємо токен
    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token,
    ]);
}
```

**Важливо:** ми повертаємо однакове повідомлення і для "користувач не знайдений", і для "неправильний пароль". Це свідома практика безпеки -- не кажемо атакуючому, яка саме частина credentials невірна.

`Hash::check($plain, $hashed)` -- порівнює plain-text пароль з хешем з БД. Ніколи не порівнюйте паролі напряму (`$password === $user->password`) -- це не працюватиме, тому що в БД зберігається хеш.

#### logout() -- вихід

```php
public function logout(Request $request): JsonResponse
{
    // currentAccessToken() -- токен, який використаний у цьому запиті
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out successfully.',
    ]);
}
```

Цей метод видаляє ТІЛЬКИ поточний токен. Якщо користувач залогінений з кількох пристроїв (кілька токенів), інші залишаться активними.

#### me() -- профіль

```php
public function me(Request $request): JsonResponse
{
    return response()->json($request->user());
}
```

Простий ендпоінт, який повертає дані поточного користувача. Ваш Vue-додаток зазвичай викликає його при завантаженні сторінки, щоб перевірити, чи токен ще валідний:

```javascript
// Vue -- аналогія
const authStore = useAuthStore()

onMounted(async () => {
    try {
        const user = await $fetch('/api/me', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        })
        authStore.setUser(user)
    } catch (e) {
        // Токен невалідний -- редірект на логін
        authStore.logout()
        router.push('/login')
    }
})
```

### Крок 4: Додайте маршрути

Відкрийте `routes/api.php` і оновіть його:

```php
<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// ========================================
// Публічні маршрути (без автентифікації)
// ========================================

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ========================================
// Захищені маршрути (потрібен токен)
// ========================================

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Resources
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('tags', TagController::class);
});
```

Структура проста:
- `register` та `login` -- публічні, бо користувач ще не має токена
- Все інше -- захищене middleware `auth:sanctum`

### Крок 5: Оновіть TaskController для scoping по користувачу

Тепер кожен користувач повинен бачити тільки свої задачі. Оновіть `app/Http/Controllers/TaskController.php`:

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
     *
     * Список задач ПОТОЧНОГО користувача.
     * Раніше: Task::all() -- повертало ВСІ задачі.
     * Тепер: $request->user()->tasks() -- тільки свої.
     */
    public function index(Request $request): JsonResponse
    {
        $tasks = $request->user()
            ->tasks()
            ->with(['category', 'tags'])
            ->latest()
            ->paginate(15);

        return TaskResource::collection($tasks)->response();
    }

    /**
     * POST /api/tasks
     *
     * Створення задачі прив'язаної до поточного користувача.
     * Раніше: Task::create($validated)
     * Тепер: $request->user()->tasks()->create($validated)
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $request->user()->tasks()->create($request->validated());

        return (new TaskResource($task->load(['category', 'tags'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/tasks/{task}
     *
     * Показати одну задачу. Перевіряємо, що вона належить користувачу.
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        // Перевірка: чи ця задача належить поточному користувачу?
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return (new TaskResource($task->load(['category', 'tags'])))->response();
    }

    /**
     * PUT /api/tasks/{task}
     *
     * Оновити задачу. Тільки свою.
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $task->update($request->validated());

        return (new TaskResource($task->load(['category', 'tags'])))->response();
    }

    /**
     * DELETE /api/tasks/{task}
     *
     * Видалити задачу. Тільки свою.
     */
    public function destroy(Request $request, Task $task): Response
    {
        if ($task->user_id !== $request->user()->id) {
            abort(404);
        }

        $task->delete();

        return response()->noContent();
    }
}
```

**Зверніть увагу на два ключових зміни:**

1. **index()** та **store()** -- використовують `$request->user()->tasks()` замість `Task::query()`. Це автоматично додає `WHERE user_id = ?`.

2. **show()**, **update()**, **destroy()** -- перевіряють `$task->user_id !== $request->user()->id`. Якщо задача не належить користувачу, повертаємо 404 (а не 403). Ми навмисно повертаємо 404, а не 403 -- щоб не розкривати існування чужих ресурсів.

> **Примітка:** у наступному уроці (Урок 14) ми замінимо ці ручні перевірки на Policy -- набагато елегантніше рішення.

### Крок 6: Оновіть CategoryController аналогічно

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
        $categories = $request->user()
            ->categories()
            ->withCount('tasks')
            ->get();

        return CategoryResource::collection($categories)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $category = $request->user()->categories()->create($validated);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Request $request, Category $category): JsonResponse
    {
        if ($category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return (new CategoryResource($category->loadCount('tasks')))->response();
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        if ($category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $category->update($validated);

        return (new CategoryResource($category))->response();
    }

    public function destroy(Request $request, Category $category): Response
    {
        if ($category->user_id !== $request->user()->id) {
            abort(404);
        }

        $category->delete();

        return response()->noContent();
    }
}
```

### Крок 7: Перевірте маршрути

```bash
php artisan route:list
```

Очікуваний результат:

```
POST       api/register .......... AuthController@register
POST       api/login ............. AuthController@login
POST       api/logout ............ AuthController@logout
GET|HEAD   api/me ................ AuthController@me
GET|HEAD   api/tasks ............. tasks.index > TaskController@index
POST       api/tasks ............. tasks.store > TaskController@store
GET|HEAD   api/tasks/{task} ...... tasks.show > TaskController@show
PUT|PATCH  api/tasks/{task} ...... tasks.update > TaskController@update
DELETE     api/tasks/{task} ...... tasks.destroy > TaskController@destroy
GET|HEAD   api/categories ........ categories.index > CategoryController@index
...
```

Зверніть увагу: `logout`, `me`, `tasks`, `categories` -- всі мають middleware `auth:sanctum`, а `register` та `login` -- без middleware.

---

## Перевірка

Запустіть сервер:

```bash
php artisan serve
```

В іншому терміналі виконайте повний флоу:

### Тест 1: Реєстрація

```bash
curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }' | jq .
```

Очікуваний результат:

```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "updated_at": "2026-04-09T12:00:00.000000Z",
    "created_at": "2026-04-09T12:00:00.000000Z",
    "id": 1
  },
  "token": "1|abc123def456ghi789jkl012mno345pqr678stu901"
}
```

Збережіть токен у змінну:

```bash
TOKEN="1|abc123def456ghi789jkl012mno345pqr678stu901"
```

> **Порада:** замість ручного копіювання використовуйте jq:
> ```bash
> TOKEN=$(curl -s -X POST http://localhost:8000/api/register \
>   -H "Content-Type: application/json" \
>   -H "Accept: application/json" \
>   -d '{
>     "name": "John Doe",
>     "email": "john@example.com",
>     "password": "password123",
>     "password_confirmation": "password123"
>   }' | jq -r '.token')
>
> echo $TOKEN
> ```

### Тест 2: Запит без токена -- 401

```bash
curl -s http://localhost:8000/api/tasks \
  -H "Accept: application/json" | jq .
```

Очікуваний результат:

```json
{
  "message": "Unauthenticated."
}
```

HTTP статус: 401. Це те, що ваш Vue-додаток отримує, коли токен прострочений або відсутній.

### Тест 3: Запит з токеном -- 200

```bash
curl -s http://localhost:8000/api/tasks \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Очікуваний результат: порожній список задач (або JSON з вашими задачами, якщо вони є).

### Тест 4: Створення задачі від автентифікованого користувача

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "First authenticated task",
    "description": "Created with Sanctum token",
    "priority": "high",
    "status": "pending"
  }' | jq .
```

Задача буде автоматично прив'язана до user_id поточного користувача.

### Тест 5: Профіль -- GET /api/me

```bash
curl -s http://localhost:8000/api/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Очікуваний результат:

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified_at": null,
  "created_at": "2026-04-09T12:00:00.000000Z",
  "updated_at": "2026-04-09T12:00:00.000000Z"
}
```

### Тест 6: Логін

```bash
curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' | jq .
```

Результат: новий токен (інший від першого -- кожен login створює новий токен).

### Тест 7: Логаут

```bash
curl -s -X POST http://localhost:8000/api/logout \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

```json
{
  "message": "Logged out successfully."
}
```

### Тест 8: Старий токен більше не працює

```bash
curl -s http://localhost:8000/api/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

```json
{
  "message": "Unauthenticated."
}
```

Токен видалений з БД -- він більше не валідний.

### Тест 9: Два користувачі -- ізоляція даних

```bash
# Зареєструйте другого користувача
TOKEN2=$(curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }' | jq -r '.token')

# User 2 не бачить задачі User 1
curl -s http://localhost:8000/api/tasks \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN2" | jq .
# Результат: порожній список (Jane не має задач)
```

---

## Міні-тест

**1. Яка різниця між автентифікацією та авторизацією?**

a) Це синоніми -- означають одне й те саме
b) Автентифікація -- це "хто ти", авторизація -- це "що тобі дозволено"
c) Автентифікація -- це "що тобі дозволено", авторизація -- це "хто ти"
d) Автентифікація -- тільки для API, авторизація -- тільки для веб-сторінок

**2. Що повертає `$user->createToken('auth-token')->plainTextToken`?**

a) Хешований пароль користувача
b) JWT токен з payload
c) Plain-text API токен у форматі `{id}|{random_string}`
d) Сесійний cookie

**3. Який HTTP-статус повертає middleware `auth:sanctum`, якщо токен невалідний?**

a) 400 Bad Request
b) 401 Unauthorized
c) 403 Forbidden
d) 404 Not Found

**4. Як правильно отримати задачі тільки поточного користувача?**

a) `Task::all()`
b) `Task::where('user_id', 1)->get()`
c) `$request->user()->tasks()->get()`
d) `Task::findByUser($request->user())`

**5. Як видалити ТІЛЬКИ поточний токен при logout?**

a) `$request->user()->tokens()->delete()`
b) `$request->user()->currentAccessToken()->delete()`
c) `Auth::logout()`
d) `session()->flush()`

---

## Практичне завдання

### Завдання: Logout з усіх пристроїв

Реалізуйте ендпоінт `POST /api/logout-all`, який видаляє ВСІ токени поточного користувача (logout з усіх пристроїв).

1. Додайте метод `logoutAll` в `AuthController`:

```php
/**
 * POST /api/logout-all
 *
 * Видаляє ВСІ токени користувача -- logout з усіх пристроїв.
 * Корисно, якщо підозрюєте, що токен скомпрометований.
 */
public function logoutAll(Request $request): JsonResponse
{
    // Ваш код тут
    // Підказка: використовуйте $request->user()->tokens()
}
```

2. Додайте маршрут в захищену групу:

```php
Route::post('/logout-all', [AuthController::class, 'logoutAll']);
```

3. Протестуйте:
   - Залогіньтесь тричі (отримайте три токени)
   - Перевірте, що кожен токен працює (`GET /api/me`)
   - Викличте `POST /api/logout-all` з будь-якого токена
   - Перевірте, що ВСІ три токени більше не працюють

```bash
# Логін тричі -- отримуємо три токени
TOKEN1=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}' | jq -r '.token')

TOKEN2=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}' | jq -r '.token')

TOKEN3=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}' | jq -r '.token')

# Всі три працюють
curl -s http://localhost:8000/api/me -H "Authorization: Bearer $TOKEN1" -H "Accept: application/json" | jq .name
# "John Doe"

# Logout з усіх пристроїв
curl -s -X POST http://localhost:8000/api/logout-all \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Accept: application/json" | jq .

# Жоден токен більше не працює
curl -s http://localhost:8000/api/me -H "Authorization: Bearer $TOKEN2" -H "Accept: application/json" | jq .
# {"message": "Unauthenticated."}
```

---

## Відповіді на тест

1. **b) Автентифікація -- це "хто ти", авторизація -- це "що тобі дозволено"**. Автентифікація перевіряє особу (email + пароль → токен), а авторизація перевіряє права доступу (чи може цей користувач видалити цю задачу).

2. **c) Plain-text API токен у форматі `{id}|{random_string}`**. Sanctum повертає рядок типу `1|abc123...`, де `1` -- це id токена в БД, а `abc123...` -- випадковий рядок. У БД зберігається лише SHA-256 хеш другої частини.

3. **b) 401 Unauthorized**. Middleware `auth:sanctum` повертає 401, якщо токен відсутній, невалідний або прострочений. 403 -- це для авторизації (є токен, але немає прав).

4. **c) `$request->user()->tasks()->get()`**. Цей підхід використовує відношення `hasMany` і автоматично фільтрує по `user_id`. Варіант (b) працює, але захардкоджений id. Варіант (a) повертає задачі ВСІХ користувачів.

5. **b) `$request->user()->currentAccessToken()->delete()`**. Метод `currentAccessToken()` повертає токен, який був використаний для поточного запиту. `tokens()->delete()` видалить ВСІ токени (це для logout-all).
