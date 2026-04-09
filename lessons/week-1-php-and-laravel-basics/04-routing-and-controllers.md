# Урок 4: Роутинг та контролери -- перші API-ендпоінти

## Що ви вивчите

- Як працює роутинг в Laravel (файл `routes/api.php`)
- HTTP-методи: GET, POST, PUT, PATCH, DELETE
- Створення простих маршрутів з замиканнями (closures)
- Параметри маршрутів: обов'язкові `{id}` та необов'язкові `{id?}`
- Групування маршрутів: `prefix()`, `middleware()`, `name()`
- Створення контролерів через Artisan
- Методи ресурсного контролера: index, store, show, update, destroy
- `Route::apiResource()` -- генерація всіх REST-маршрутів одним рядком
- Повернення JSON-відповідей з правильними HTTP-статусами
- Команда `php artisan route:list` для перегляду всіх маршрутів

---

## Паралелі з JS/Vue

| Vue / Nuxt / JS | Laravel |
|---|---|
| `router/index.ts` (масив routes) | `routes/api.php` |
| `path: '/tasks/:id'` | `Route::get('/tasks/{id}', ...)` |
| `:id` параметр у Vue Router | `{id}` параметр у Laravel |
| `children: [...]` (вкладені маршрути) | `Route::prefix('tasks')->group(...)` |
| `definePageMeta({ middleware: 'auth' })` | `Route::middleware('auth')->group(...)` |
| `<script setup>` (логіка сторінки) | Controller клас (логіка ендпоінту) |
| Nuxt `server/api/tasks.get.ts` | `Route::get('/tasks', [TaskController::class, 'index'])` |
| `useFetch('/api/tasks')` | Клієнт робить запит -> Laravel роутер знаходить маршрут -> контролер обробляє |
| Express.js `app.get('/tasks', handler)` | `Route::get('/tasks', handler)` |
| Express.js `router.use('/api', apiRouter)` | `Route::prefix('api')->group(...)` |

---

## Теорія

### Де живуть маршрути API

У Vue/Nuxt ви описуєте маршрути в `router/index.ts` або через файлову систему (`pages/`). В Laravel маршрути API живуть у файлі `routes/api.php`.

**Важливо:** всі маршрути з `routes/api.php` автоматично отримують префікс `/api`. Тобто якщо ви напишете `Route::get('/tasks', ...)`, реальний URL буде `/api/tasks`. Це як у Nuxt, де файл `server/api/tasks.get.ts` автоматично доступний за `/api/tasks`.

Для веб-сторінок (HTML) є окремий файл `routes/web.php` -- але для API-розробки нас цікавить саме `api.php`.

### HTTP-методи маршрутів

У Vue ви працюєте з HTTP-методами через `useFetch()` або `$fetch()`:

```javascript
// Vue/Nuxt -- ви це робите щодня
await $fetch('/api/tasks')                           // GET
await $fetch('/api/tasks', { method: 'POST', body }) // POST
await $fetch(`/api/tasks/${id}`, { method: 'PUT', body }) // PUT
await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })    // DELETE
```

В Laravel ви описуєте **приймач** для кожного з цих запитів:

```php
use Illuminate\Support\Facades\Route;

Route::get('/tasks', ...);      // GET /api/tasks
Route::post('/tasks', ...);     // POST /api/tasks
Route::put('/tasks/{id}', ...);    // PUT /api/tasks/1
Route::patch('/tasks/{id}', ...);  // PATCH /api/tasks/1
Route::delete('/tasks/{id}', ...); // DELETE /api/tasks/1
```

Це як у Express.js: `app.get()`, `app.post()`, `app.put()`, `app.delete()` -- практично ідентичний синтаксис.

### Замикання в маршрутах (Closures)

Найпростіший спосіб створити ендпоінт -- це замикання (closure) прямо в маршруті. Це як анонімна стрілкова функція в JavaScript:

```javascript
// Express.js
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello!' });
});
```

```php
// Laravel routes/api.php
Route::get('/hello', function () {
    return response()->json(['message' => 'Hello!']);
});
```

Замикання зручні для швидких тестів або дуже простих ендпоінтів. Але для реальних проєктів використовують контролери -- так само, як у Vue ви виносите логіку з шаблону в `<script setup>` або composables.

### Параметри маршрутів

У Vue Router ви використовуєте `:id` для динамічних сегментів URL. В Laravel -- `{id}`:

```javascript
// Vue Router
{ path: '/tasks/:id', component: TaskDetail }

// Доступ до параметра
const route = useRoute()
const taskId = route.params.id
```

```php
// Laravel
Route::get('/tasks/{id}', function (string $id) {
    return response()->json(['task_id' => $id]);
});
```

**Необов'язкові параметри** -- як `props` з `default` у Vue:

```php
// {id?} -- знак питання робить параметр необов'язковим
Route::get('/tasks/{id?}', function (string $id = null) {
    if ($id) {
        return response()->json(['task_id' => $id]);
    }
    return response()->json(['message' => 'All tasks']);
});
```

### Групування маршрутів

У Vue Router є `children` для вкладених маршрутів і `meta` для метаданих. В Laravel є `Route::group()` з `prefix()`, `middleware()` та `name()`:

```javascript
// Vue Router -- вкладені маршрути
{
    path: '/admin',
    children: [
        { path: 'users', component: AdminUsers },
        { path: 'settings', component: AdminSettings }
    ]
}
```

```php
// Laravel -- групування з префіксом
Route::prefix('v1')->group(function () {
    Route::get('/tasks', function () { /* ... */ });     // /api/v1/tasks
    Route::get('/categories', function () { /* ... */ }); // /api/v1/categories
});
```

Групи можна комбінувати:

```php
Route::prefix('v1')->middleware('auth:sanctum')->name('api.v1.')->group(function () {
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    // Повний URL: /api/v1/tasks
    // Middleware: auth:sanctum
    // Ім'я маршруту: api.v1.tasks.index
});
```

Це як `beforeEnter` guard у Vue Router, тільки для бекенду -- middleware перевіряє запит **до** того, як він потрапить у контролер.

### Контролери -- серце вашого API

Контролер -- це клас, який містить логіку обробки запитів. Уявіть, що контролер -- це ваш `<script setup>`, але для бекенду.

У Vue ви маєте:
```javascript
// pages/tasks.vue -- <script setup>
const tasks = ref([])
const fetchTasks = async () => { /* ... */ }
const createTask = async (data) => { /* ... */ }
```

В Laravel це виглядає як клас з методами:
```php
class TaskController extends Controller
{
    public function index() { /* GET /tasks -- список */ }
    public function store() { /* POST /tasks -- створити */ }
    public function show($id) { /* GET /tasks/{id} -- один запис */ }
    public function update($id) { /* PUT /tasks/{id} -- оновити */ }
    public function destroy($id) { /* DELETE /tasks/{id} -- видалити */ }
}
```

5 методів = 5 ендпоінтів = повний CRUD. Це стандарт, який Laravel називає **API Resource Controller**.

### Route::apiResource() -- магія одного рядка

Замість 5 окремих маршрутів:

```php
Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::get('/tasks/{task}', [TaskController::class, 'show']);
Route::put('/tasks/{task}', [TaskController::class, 'update']);
Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
```

Ви пишете один рядок:

```php
Route::apiResource('tasks', TaskController::class);
```

Це згенерує ВСІ 5 маршрутів автоматично. `apiResource` -- це як автогенерація маршрутів у Nuxt через файлову структуру `pages/`, тільки для API.

> **Примітка:** `apiResource()` на відміну від `resource()` не створює маршрути `create` та `edit` -- вони потрібні лише для HTML-форм, а в API їх немає.

### Повернення JSON-відповідей

У Vue ви отримуєте JSON від сервера. Тепер ви **відправляєте** JSON з сервера:

```php
// Спосіб 1: response()->json() -- повний контроль
return response()->json(['message' => 'Task created'], 201);

// Спосіб 2: просто повернути масив -- Laravel сам конвертує в JSON
return ['message' => 'Task created'];

// Спосіб 3: повернути колекцію/модель -- теж автоматично стане JSON
return Task::all();
```

### HTTP-статуси -- що вони означають

Як фронтенд-розробник, ви вже знаєте ці коди з відповідей API:

| Код | Значення | Коли використовувати | Ваш досвід з фронтенду |
|---|---|---|---|
| `200` | OK | Успішний GET, PUT | `if (response.ok)` |
| `201` | Created | Успішний POST (ресурс створено) | Після `$fetch('/api/tasks', { method: 'POST' })` |
| `204` | No Content | Успішний DELETE (немає тіла відповіді) | `response.status === 204` |
| `404` | Not Found | Ресурс не знайдено | Ви бачите це, коли API повертає "not found" |
| `422` | Unprocessable Entity | Помилки валідації | Ваші форми показують ці помилки |

В Laravel:

```php
return response()->json($data, 200);  // OK (за замовчуванням)
return response()->json($task, 201);  // Created
return response()->noContent();        // 204 No Content
return response()->json(['message' => 'Not found'], 404);
return response()->json(['errors' => [...]], 422);
```

### Route Model Binding (коротко)

Laravel може автоматично знаходити модель за параметром маршруту. Замість ручного пошуку:

```php
Route::get('/tasks/{id}', function (string $id) {
    $task = Task::findOrFail($id); // ручний пошук
    return $task;
});
```

Laravel зробить це за вас:

```php
Route::get('/tasks/{task}', function (Task $task) {
    return $task; // Laravel сам знайшов Task за id
});
```

Зверніть увагу: параметр називається `{task}` (як модель, малими літерами), і в функції приймається `Task $task` з тайп-хінтом. Laravel автоматично виконає `Task::findOrFail($id)` і поверне 404, якщо не знайде. Ми будемо активно це використовувати в наступних уроках з Eloquent.

### php artisan route:list

Це ваш "Vue Router devtools" для бекенду. Команда показує ВСІ зареєстровані маршрути:

```bash
php artisan route:list
```

Вона покаже: метод (GET/POST/PUT/DELETE), URI, ім'я маршруту, контролер і middleware. Використовуйте її щоразу, коли хочете переконатись, що маршрути створились правильно.

---

## Практика: крок за кроком

> **Передумова:** ви вже маєте Laravel-проєкт з Уроку 3. Переходимо в його директорію.

### Крок 1: Подивіться на поточний routes/api.php

```bash
cd ~/task-manager-api
cat routes/api.php
```

Ви побачите порожній файл або файл з одним прикладом маршруту. Laravel 12 за замовчуванням має мінімальний `api.php`.

### Крок 2: Створіть перші маршрути з замиканнями

Відкрийте `routes/api.php` і замініть його вміст:

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Простий тестовий маршрут
Route::get('/ping', function () {
    return response()->json(['message' => 'pong', 'timestamp' => now()]);
});

// GET /api/tasks -- список задач
Route::get('/tasks', function () {
    $tasks = [
        [
            'id' => 1,
            'title' => 'Learn Laravel routing',
            'status' => 'in_progress',
            'priority' => 2,
        ],
        [
            'id' => 2,
            'title' => 'Build Task Manager API',
            'status' => 'pending',
            'priority' => 1,
        ],
        [
            'id' => 3,
            'title' => 'Connect Vue frontend',
            'status' => 'pending',
            'priority' => 0,
        ],
    ];

    return response()->json($tasks);
});

// GET /api/tasks/{id} -- одна задача
Route::get('/tasks/{id}', function (string $id) {
    $task = [
        'id' => (int) $id,
        'title' => 'Learn Laravel routing',
        'status' => 'in_progress',
        'priority' => 2,
        'description' => 'Understanding routes, controllers, and HTTP methods',
    ];

    return response()->json($task);
});

// POST /api/tasks -- створити задачу
Route::post('/tasks', function (Request $request) {
    $task = [
        'id' => 4,
        'title' => $request->input('title', 'New Task'),
        'status' => 'pending',
        'priority' => $request->input('priority', 0),
        'created_at' => now(),
    ];

    return response()->json($task, 201);
});

// PUT /api/tasks/{id} -- оновити задачу
Route::put('/tasks/{id}', function (Request $request, string $id) {
    $task = [
        'id' => (int) $id,
        'title' => $request->input('title', 'Updated Task'),
        'status' => $request->input('status', 'in_progress'),
        'updated_at' => now(),
    ];

    return response()->json($task);
});

// DELETE /api/tasks/{id} -- видалити задачу
Route::delete('/tasks/{id}', function (string $id) {
    return response()->noContent(); // 204
});
```

### Крок 3: Запустіть сервер і протестуйте

```bash
php artisan serve
```

В іншому терміналі:

```bash
# GET -- список задач
curl http://localhost:8000/api/tasks

# Очікуваний результат:
# [{"id":1,"title":"Learn Laravel routing","status":"in_progress","priority":2},
#  {"id":2,"title":"Build Task Manager API","status":"pending","priority":1},
#  {"id":3,"title":"Connect Vue frontend","status":"pending","priority":0}]

# GET -- одна задача
curl http://localhost:8000/api/tasks/1

# POST -- створити задачу
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write tests", "priority": 3}'

# Очікуваний результат:
# {"id":4,"title":"Write tests","status":"pending","priority":3,"created_at":"..."}

# PUT -- оновити задачу
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated task", "status": "done"}'

# DELETE -- видалити задачу (повертає порожню відповідь, статус 204)
curl -X DELETE http://localhost:8000/api/tasks/1 -v
# Шукайте рядок: < HTTP/1.1 204 No Content
```

### Крок 4: Створіть TaskController

Замість замикань, винесемо логіку в контролер. Це "правильний" підхід для реальних проєктів.

```bash
php artisan make:controller TaskController --api
```

Прапорець `--api` створить контролер з 5 методами: `index`, `store`, `show`, `update`, `destroy`. Без `--api` були б ще `create` і `edit` для HTML-форм -- нам вони не потрібні.

Відкрийте створений файл `app/Http/Controllers/TaskController.php` і заповніть його:

```php
<?php

namespace App\Http\Controllers;

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
        $tasks = [
            [
                'id' => 1,
                'title' => 'Learn Laravel routing',
                'status' => 'in_progress',
                'priority' => 2,
                'category_id' => 1,
            ],
            [
                'id' => 2,
                'title' => 'Build Task Manager API',
                'status' => 'pending',
                'priority' => 1,
                'category_id' => 1,
            ],
            [
                'id' => 3,
                'title' => 'Buy groceries',
                'status' => 'pending',
                'priority' => 0,
                'category_id' => 2,
            ],
        ];

        return response()->json($tasks);
    }

    /**
     * POST /api/tasks -- створити нову задачу
     */
    public function store(Request $request): JsonResponse
    {
        $task = [
            'id' => 4,
            'title' => $request->input('title', 'New Task'),
            'status' => 'pending',
            'priority' => $request->input('priority', 0),
            'category_id' => $request->input('category_id'),
            'created_at' => now()->toISOString(),
        ];

        return response()->json($task, 201); // 201 Created
    }

    /**
     * GET /api/tasks/{id} -- показати одну задачу
     */
    public function show(string $id): JsonResponse
    {
        // Імітуємо "не знайдено" для id > 10
        if ((int) $id > 10) {
            return response()->json([
                'message' => 'Task not found',
            ], 404);
        }

        $task = [
            'id' => (int) $id,
            'title' => 'Learn Laravel routing',
            'status' => 'in_progress',
            'priority' => 2,
            'description' => 'Understanding routes, controllers, and HTTP methods',
            'category' => [
                'id' => 1,
                'name' => 'Learning',
            ],
        ];

        return response()->json($task);
    }

    /**
     * PUT /api/tasks/{id} -- оновити задачу
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $task = [
            'id' => (int) $id,
            'title' => $request->input('title', 'Updated Task'),
            'status' => $request->input('status', 'in_progress'),
            'priority' => $request->input('priority', 1),
            'updated_at' => now()->toISOString(),
        ];

        return response()->json($task);
    }

    /**
     * DELETE /api/tasks/{id} -- видалити задачу
     */
    public function destroy(string $id): Response
    {
        // Тут буде логіка видалення з бази
        return response()->noContent(); // 204 No Content
    }
}
```

### Крок 5: Створіть CategoryController

```bash
php artisan make:controller CategoryController --api
```

Відкрийте `app/Http/Controllers/CategoryController.php`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = [
            ['id' => 1, 'name' => 'Work', 'color' => '#3B82F6'],
            ['id' => 2, 'name' => 'Personal', 'color' => '#10B981'],
            ['id' => 3, 'name' => 'Shopping', 'color' => '#F59E0B'],
        ];

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $category = [
            'id' => 4,
            'name' => $request->input('name', 'New Category'),
            'color' => $request->input('color', '#6B7280'),
            'created_at' => now()->toISOString(),
        ];

        return response()->json($category, 201);
    }

    public function show(string $id): JsonResponse
    {
        $category = [
            'id' => (int) $id,
            'name' => 'Work',
            'color' => '#3B82F6',
            'tasks_count' => 5,
        ];

        return response()->json($category);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = [
            'id' => (int) $id,
            'name' => $request->input('name', 'Updated Category'),
            'color' => $request->input('color', '#6B7280'),
            'updated_at' => now()->toISOString(),
        ];

        return response()->json($category);
    }

    public function destroy(string $id): Response
    {
        return response()->noContent();
    }
}
```

### Крок 6: Оновіть routes/api.php з контролерами

Тепер замініть вміст `routes/api.php` на чистий варіант з контролерами:

```php
<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// Тестовий ендпоінт
Route::get('/ping', function () {
    return response()->json([
        'message' => 'pong',
        'timestamp' => now()->toISOString(),
    ]);
});

// ===== Варіант 1: Окремі маршрути =====

// Route::get('/tasks', [TaskController::class, 'index']);
// Route::post('/tasks', [TaskController::class, 'store']);
// Route::get('/tasks/{task}', [TaskController::class, 'show']);
// Route::put('/tasks/{task}', [TaskController::class, 'update']);
// Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

// ===== Варіант 2: apiResource -- один рядок замість п'яти =====

Route::apiResource('tasks', TaskController::class);
Route::apiResource('categories', CategoryController::class);

// ===== Група з версією API =====

Route::prefix('v1')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
});
```

### Крок 7: Перевірте список маршрутів

```bash
php artisan route:list
```

Очікуваний результат (скорочено):

```
GET|HEAD   api/ping ............................................
GET|HEAD   api/tasks .............. tasks.index > TaskController@index
POST       api/tasks .............. tasks.store > TaskController@store
GET|HEAD   api/tasks/{task} ....... tasks.show > TaskController@show
PUT|PATCH  api/tasks/{task} ....... tasks.update > TaskController@update
DELETE     api/tasks/{task} ....... tasks.destroy > TaskController@destroy
GET|HEAD   api/categories ......... categories.index > CategoryController@index
POST       api/categories ......... categories.store > CategoryController@store
GET|HEAD   api/categories/{category} categories.show > CategoryController@show
PUT|PATCH  api/categories/{category} categories.update > CategoryController@update
DELETE     api/categories/{category} categories.destroy > CategoryController@destroy
GET|HEAD   api/v1/tasks ........... v1.tasks.index > TaskController@index
POST       api/v1/tasks ........... v1.tasks.store > TaskController@store
GET|HEAD   api/v1/tasks/{task} .... v1.tasks.show > TaskController@show
PUT|PATCH  api/v1/tasks/{task} .... v1.tasks.update > TaskController@update
DELETE     api/v1/tasks/{task} .... v1.tasks.destroy > TaskController@destroy
GET|HEAD   api/v1/categories ...... v1.categories.index > CategoryController@index
...
```

Зверніть увагу:
- `apiResource` створив 5 маршрутів для кожного ресурсу автоматично
- Група `v1` додала префікс `/api/v1/` до маршрутів
- PUT та PATCH обробляються одним методом `update`
- Кожен маршрут має автоматичне ім'я (наприклад, `tasks.index`)

### Крок 8: Фінальне тестування всіх ендпоінтів

```bash
# Тестовий ping
curl http://localhost:8000/api/ping
# {"message":"pong","timestamp":"2026-04-09T..."}

# --- Tasks ---

# GET -- список задач
curl http://localhost:8000/api/tasks
# [{"id":1,"title":"Learn Laravel routing",...}, ...]

# POST -- створити задачу
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Deploy to production", "priority": 3}'
# {"id":4,"title":"Deploy to production","status":"pending","priority":3,...}

# GET -- одна задача
curl http://localhost:8000/api/tasks/1
# {"id":1,"title":"Learn Laravel routing","status":"in_progress",...}

# GET -- неіснуюча задача
curl http://localhost:8000/api/tasks/99
# {"message":"Task not found"}

# PUT -- оновити задачу
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Routing mastered!", "status": "done"}'
# {"id":1,"title":"Routing mastered!","status":"done",...}

# DELETE -- видалити задачу
curl -X DELETE http://localhost:8000/api/tasks/1 -w "\nHTTP Status: %{http_code}\n"
# HTTP Status: 204

# --- Categories ---

# GET -- список категорій
curl http://localhost:8000/api/categories
# [{"id":1,"name":"Work","color":"#3B82F6"}, ...]

# POST -- створити категорію
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Health", "color": "#EF4444"}'
# {"id":4,"name":"Health","color":"#EF4444",...}

# --- Версіонований API ---

curl http://localhost:8000/api/v1/tasks
# Ті самі дані, але через /api/v1/ префікс
```

---

## Перевірка

Після виконання всіх кроків ви повинні бачити:

1. `php artisan route:list` показує маршрути для tasks, categories та v1-групу
2. `curl http://localhost:8000/api/tasks` повертає JSON-масив задач
3. `curl -X POST` повертає JSON з кодом 201
4. `curl -X DELETE` повертає порожню відповідь з кодом 204
5. `curl http://localhost:8000/api/tasks/99` повертає 404 помилку
6. Ендпоінти працюють як з `/api/tasks`, так і з `/api/v1/tasks`

---

## Міні-тест

**1. Який файл відповідає за API-маршрути в Laravel?**

a) `routes/web.php`
b) `routes/api.php`
c) `app/routes.php`
d) `config/routes.php`

**2. Що робить `Route::apiResource('tasks', TaskController::class)`?**

a) Створює один маршрут GET /api/tasks
b) Створює 7 маршрутів (включаючи create та edit)
c) Створює 5 REST-маршрутів (index, store, show, update, destroy)
d) Створює контролер TaskController

**3. Який HTTP-статус потрібно повернути при успішному створенні ресурсу (POST)?**

a) 200
b) 201
c) 204
d) 301

**4. Як зробити параметр маршруту необов'язковим?**

a) `{id!}`
b) `{id?}`
c) `{id=null}`
d) `[id]`

**5. Яка команда Artisan створює API-контролер з 5 методами?**

a) `php artisan make:controller TaskController`
b) `php artisan make:controller TaskController --api`
c) `php artisan make:controller TaskController --resource`
d) `php artisan make:controller TaskController --rest`

---

## Практичне завдання

### Завдання: TagController та вкладені маршрути

1. **Створіть `TagController`** з повним CRUD (використовуйте `--api`):

```bash
php artisan make:controller TagController --api
```

2. **Заповніть контролер** хардкоженими даними (як у TaskController):
   - `index` -- повертає масив тегів: `[{id: 1, name: "urgent"}, {id: 2, name: "bug"}, {id: 3, name: "feature"}]`
   - `store` -- повертає новий тег з 201
   - `show` -- повертає один тег
   - `update` -- повертає оновлений тег
   - `destroy` -- повертає 204

3. **Додайте маршрути** в `routes/api.php`:

```php
// Основний ресурс тегів
Route::apiResource('tags', TagController::class);

// Вкладені маршрути: теги конкретної задачі
Route::get('/tasks/{task}/tags', [TagController::class, 'index']);
Route::post('/tasks/{task}/tags', [TagController::class, 'store']);
Route::delete('/tasks/{task}/tags/{tag}', [TagController::class, 'destroy']);
```

4. **Протестуйте** всі ендпоінти через curl:

```bash
curl http://localhost:8000/api/tags
curl http://localhost:8000/api/tasks/1/tags
curl -X POST http://localhost:8000/api/tasks/1/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "important"}'
```

5. **Перевірте** через `php artisan route:list`, що всі маршрути зареєстровані.

---

## Відповіді на тест

1. **b) `routes/api.php`** -- цей файл відповідає за API-маршрути. Всі маршрути в ньому автоматично отримують префікс `/api`.

2. **c) Створює 5 REST-маршрутів** -- `apiResource` генерує маршрути для index, store, show, update, destroy. На відміну від `resource()`, він не створює `create` та `edit` (вони потрібні тільки для HTML-форм).

3. **b) 201** -- статус 201 (Created) означає, що ресурс успішно створено. 200 -- загальний успіх, 204 -- успіх без тіла відповіді (для DELETE).

4. **b) `{id?}`** -- знак питання після імені параметра робить його необов'язковим, подібно до `?` в TypeScript (`id?: number`).

5. **b) `php artisan make:controller TaskController --api`** -- прапорець `--api` створює контролер з 5 методами (без create/edit). `--resource` створив би 7 методів (з create/edit для HTML-форм).
