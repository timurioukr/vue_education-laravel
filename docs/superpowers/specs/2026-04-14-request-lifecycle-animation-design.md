# Laravel Request Lifecycle — інтерактивна анімація

## Context

Курс «Laravel для Vue-розробника» має 24 уроки з теорією, практикою та квізами. Бракує візуальної сторінки, яка анімовано показує, як HTTP-запит подорожує через шари Laravel — від Request до Response. Це допоможе студентам побачити «повну картину» того, що вони вивчали по частинах у різних уроках.

## Design

### Сторінка

- **Окремий роут:** `/lifecycle` у Vue Router
- **Доступ:** посилання з Dashboard + навігації
- **Vue SFC:** `app/src/views/LifecycleView.vue`
- **Адаптивний:** горизонтальний скрол на мобільних

### Візуалізація: горизонтальний конвеєр

**6 основних шарів (зліва направо):**

| # | Шар | Колір | Під-шари (при кліку) |
|---|-----|-------|----------------------|
| 1 | HTTP Request | `#7c5cfc` (purple) | method, URL, headers, body |
| 2 | Middleware | `#3b82f6` (blue) | auth:sanctum, throttle:api, EnsureJson, CORS |
| 3 | Router | `#10b981` (green) | route matching, parameter binding |
| 4 | Controller | `#f59e0b` (amber) | authorize (Policy), validate (FormRequest), action |
| 5 | Model / DB | `#ef4444` (red) | Eloquent query, scopes, observer events |
| 6 | Response | `#22d3ee` (cyan) | Resource transform, JSON, status code |

**Return path:** нижня лінія від Response назад через after-middleware до «Vue SPA» (зелено-блакитні точки).

### Анімація: пульсуючі лінії зʼєднання

- Блоки зʼєднані **лініями** з gradient від кольору лівого до правого шару
- По лініях біжать **анімовані точки** (CSS `@keyframes`) — показують напрям потоку
- Коли потік досягає шару — блок **підсвічується** (scale 1.15 + box-shadow glow), зʼявляється опис
- Auto-play: ~3 секунди на шар, потім точки біжать далі
- Return: після Model → Response анімація reverse по нижній лінії

### Керування

- **Play** — запускає auto-play з початку
- **Pause** — зупиняє на поточному шарі
- **Step (⏭)** — перехід до наступного шару вручну
- **Reset** — скидає всі шари до тьмяного стану
- **Швидкість** — 0.5× / 1× / 2×

### Клікабельні шари (розширена деталізація)

При кліку на шар:
1. Auto-play ставиться на паузу
2. Під основним шаром зʼявляються **під-шари** (badge-и)
3. Під конвеєром зʼявляється **панель деталей:**
   - Назва шару + іконка
   - Текстовий опис (1-3 абзаци, українською)
   - Блок коду (PHP, з підсвіткою через Shiki — вже є у проєкті)
   - Vue-паралель (коротка)

### Дані шарів (контент)

```
Request:
  desc: "HTTP-запит від Vue SPA (axios). Містить method, URL, headers (Authorization: Bearer), body (JSON)."
  code: "POST /api/tasks HTTP/1.1\nAuthorization: Bearer 1|abc123\nContent-Type: application/json\n\n{\"title\": \"Buy milk\", \"status\": \"pending\"}"
  vue_parallel: "axios.post('/api/tasks', data, { headers: { Authorization: `Bearer ${token}` } })"

Middleware:
  desc: "Конвеєр перевірок. auth:sanctum валідує токен, throttle обмежує частоту, EnsureJson гарантує JSON-відповіді. Якщо перевірка не пройшла — 401/429, контролер не викликається."
  code: "public function handle(Request $request, Closure $next)\n{\n    if (! $request->bearerToken()) {\n        return response()->json(['message' => 'Unauthenticated.'], 401);\n    }\n    return $next($request);\n}"
  sub_layers: [auth:sanctum, throttle:api, EnsureJsonResponse, CORS]

Router:
  desc: "Зіставляє URL з визначеними маршрутами. POST /api/tasks → TaskController@store. Витягує параметри ({task} → $task через Route Model Binding)."
  code: "Route::middleware('auth:sanctum')->group(function () {\n    Route::apiResource('tasks', TaskController::class);\n});"

Controller:
  desc: "Бізнес-логіка. Спершу authorize() перевіряє Policy (403 якщо не дозволено), потім validate() перевіряє дані (422 якщо невалідні), потім виконує дію."
  code: "public function store(StoreTaskRequest $request)\n{\n    $this->authorize('create', Task::class);\n    $task = $request->user()->tasks()->create($request->validated());\n    return new TaskResource($task);\n}"
  sub_layers: [Policy (authorize), FormRequest (validate), action]

Model:
  desc: "Eloquent ORM взаємодіє з базою. Scopes фільтрують, Events спрацьовують (TaskCompleted), Observer реагує на зміни. Реальний SQL: INSERT INTO tasks (...)."
  code: "$task = $request->user()->tasks()->create([\n    'title' => 'Buy milk',\n    'status' => 'pending',\n]);\n// SQL: INSERT INTO tasks (title, status, user_id) VALUES (...)\n// Observer::created → TaskCompleted::dispatch()"
  sub_layers: [Eloquent query, scopes, observer/events]

Response:
  desc: "TaskResource трансформує Eloquent-модель у JSON. Додає статус-код (201 Created), headers. Відповідь летить назад через after-middleware (logging, headers)."
  code: "// TaskResource::toArray()\nreturn [\n    'id' => $this->id,\n    'title' => $this->title,\n    'status' => $this->status,\n    'created_at' => $this->created_at->toISOString(),\n];\n// HTTP 201 Created"
```

### Технічна реалізація

- **View:** `app/src/views/LifecycleView.vue` — основний компонент
- **Composable:** `app/src/composables/useLifecycleAnimation.ts` — стан анімації (currentStep, isPlaying, speed), методи (play, pause, step, reset)
- **Дані:** масив `LAYERS` з описами/кодом всередині компонента (не окремий файл — контент невеликий)
- **Підсвітка коду:** використати `CodeBlock` з `@/components/interactive/CodeBlock.vue` (вже є, з Shiki)
- **CSS анімації:** `@keyframes` для точок, `transition` для підсвічення блоків
- **Роут:** додати в `app/src/router/index.ts`

### Файли для створення/зміни

| Файл | Дія |
|------|-----|
| `app/src/views/LifecycleView.vue` | **Створити** — основний компонент |
| `app/src/composables/useLifecycleAnimation.ts` | **Створити** — логіка анімації |
| `app/src/router/index.ts` | **Змінити** — додати роут `/lifecycle` |
| `app/src/views/DashboardView.vue` | **Змінити** — додати посилання на `/lifecycle` |

### Чого НЕ робимо

- Не використовуємо зовнішні бібліотеки анімацій (GSAP, Framer Motion) — чистий CSS + Vue reactivity
- Не додаємо 3D чи canvas — простий DOM з CSS transitions/animations
- Не робимо це частиною уроків — це окрема довідкова сторінка

## Verification

1. `npm run dev` → `/lifecycle` — сторінка рендериться
2. Play — анімація проходить всі 6 шарів + return path
3. Pause — зупиняється на поточному шарі
4. Step — переходить на наступний
5. Клік на шар — зʼявляються під-шари + панель деталей з кодом
6. Reset — все тьмяне, готове до повторного запуску
7. `npm run build` — збирається без помилок
8. Мобільний — конвеєр скролиться горизонтально
