# Тест: Тиждень 3 -- Автентифікація, авторизація та просунуті можливості

> **Формат:** теоретичний тест + практичне завдання
> **Час:** 3-4 години
> **Що перевіряємо:** Sanctum-автентифікація, Policies/Gates, Middleware, завантаження файлів, Events/Listeners/Notifications, черги та планування

---

## Частина 1: Теоретичний тест

### Authentication: Sanctum (питання 1-3)

**Питання 1.** Як Laravel Sanctum генерує токен для API-автентифікації? Що повертає метод `createToken()`?

- A) Повертає рядок з токеном, який зберігається у сесії
- B) Повертає об'єкт `NewAccessToken`, в якого є властивість `plainTextToken` -- хешований токен зберігається у таблиці `personal_access_tokens`, а plain-text версія доступна лише один раз
- C) Повертає JWT-токен, який не зберігається на сервері
- D) Повертає API key, який Laravel створює з `.env`-файлу

---

**Питання 2.** Як захистити групу API-маршрутів так, щоб вони вимагали валідний Sanctum-токен?

- A) Додати `->middleware('auth')` до кожного маршруту окремо
- B) Обгорнути маршрути в `Route::middleware('auth:sanctum')->group(function () { ... })`
- C) Додати `'sanctum'` до масиву `$middleware` у `bootstrap/app.php`
- D) Sanctum захищає всі маршрути автоматично після встановлення

---

**Питання 3.** Що робить `$request->user()` усередині контролера, який захищений middleware `auth:sanctum`?

- A) Повертає ID поточного користувача
- B) Повертає Eloquent-модель `User` автентифікованого користувача, або `null` якщо не автентифікований
- C) Повертає масив з даними токена
- D) Повертає `true`, якщо користувач автентифікований

---

### Authorization: Policies та Gates (питання 4-6)

**Питання 4.** У чому різниця між Gate та Policy в Laravel?

- A) Gate і Policy -- це одне й те саме, просто різні назви
- B) Gate -- це простий замикання (closure) для перевірки прав, зазвичай визначається в `AppServiceProvider`; Policy -- це клас, прив'язаний до конкретної моделі, з методами для кожної дії (view, update, delete тощо)
- C) Gate використовується тільки для ролей адміна, Policy -- для звичайних користувачів
- D) Policy працює тільки з Blade-шаблонами, Gate -- тільки з API

---

**Питання 5.** Дано Policy для моделі `Task`:

```php
class TaskPolicy
{
    public function update(User $user, Task $task): bool
    {
        return $user->id === $task->user_id;
    }
}
```

Як використати цю Policy у контролері? Оберіть правильний варіант:

- A) `if (Gate::allows('update', $task)) { ... }`
- B) `$this->authorize('update', $task);` -- кине 403, якщо Policy поверне `false`
- C) `$task->authorize($user);`
- D) Варіанти A та B обидва правильні

---

**Питання 6.** Що станеться, якщо метод Policy поверне `false`, і ви використовуєте `$this->authorize()` у контролері?

- A) Метод поверне `null` і виконання продовжиться
- B) Laravel кине виняток `AuthorizationException`, який автоматично перетвориться на HTTP 403 Forbidden
- C) Laravel перенаправить на сторінку логіну (302)
- D) Буде помилка 500 -- Policy не може повертати `false`

---

### Middleware (питання 7-8)

**Питання 7.** Який порядок виконання middleware в Laravel? Що означає "before" та "after" middleware?

- A) Всі middleware виконуються після контролера
- B) "Before" middleware виконується до передачі запиту контролеру (наприклад, перевірка автентифікації), "after" middleware -- після отримання відповіді від контролера (наприклад, додавання заголовків)
- C) Порядок не має значення -- Laravel виконує їх паралельно
- D) "Before" -- для GET-запитів, "after" -- для POST-запитів

---

**Питання 8.** Як налаштувати rate limiting для API в Laravel? Що станеться, якщо клієнт перевищить ліміт?

- A) Додати `sleep()` між запитами на клієнті
- B) Визначити RateLimiter у `AppServiceProvider` (наприклад, `RateLimiter::for('api', fn($request) => Limit::perMinute(60)->by($request->user()?->id))`) і застосувати middleware `throttle:api` -- при перевищенні Laravel поверне HTTP 429 Too Many Requests
- C) Rate limiting вбудований у Sanctum і працює автоматично
- D) Встановити окремий пакет `laravel/throttle`

---

### File Uploads (питання 9-10)

**Питання 9.** Яка різниця між дисками `local` та `public` у Laravel Storage?

- A) Різниці немає -- обидва зберігають файли в одній папці
- B) `local` зберігає файли у `storage/app/private` (недоступні з веб), `public` -- у `storage/app/public` (доступні через symbolic link `php artisan storage:link`); для отримання URL використовується `Storage::disk('public')->url($path)`
- C) `local` -- це файлова система, `public` -- це S3
- D) `public` автоматично стискає зображення, `local` -- ні

---

**Питання 10.** Як валідувати завантажений файл у Laravel? Що робить наступне правило?

```php
$request->validate([
    'attachment' => ['required', 'file', 'mimes:jpg,png,pdf', 'max:5120'],
]);
```

- A) Перевіряє, що файл існує, є файлом (не рядком), має розширення jpg/png/pdf і не перевищує 5120 байт
- B) Перевіряє, що файл існує, є файлом, має MIME-тип jpg/png/pdf і не перевищує 5120 кілобайт (5 МБ)
- C) Перевіряє лише розширення файлу, решта ігнорується
- D) Створює файл з вказаними параметрами

---

### Events, Listeners, Notifications (питання 11-13)

**Питання 11.** Коли варто використовувати Events vs Observers vs Notifications у Laravel?

- A) Це три назви для одного механізму
- B) Events -- для довільних подій у бізнес-логіці (наприклад, "замовлення оплачено"); Observers -- для реакції на lifecycle-подія моделі (creating, updated, deleted); Notifications -- для відправки повідомлень користувачам через різні канали (email, database, SMS)
- C) Events тільки для логування, Observers тільки для кешу, Notifications тільки для email
- D) Observers замінюють Events починаючи з Laravel 11

---

**Питання 12.** Дано Event та Listener:

```php
// app/Events/TaskCompleted.php
class TaskCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public Task $task) {}
}

// app/Listeners/SendTaskCompletedNotification.php
class SendTaskCompletedNotification
{
    public function handle(TaskCompleted $event): void
    {
        $event->task->user->notify(new TaskCompletedNotification($event->task));
    }
}
```

Як викликати (dispatch) цей Event із контролера?

- A) `new TaskCompleted($task)`
- B) `TaskCompleted::dispatch($task)`
- C) `event(new TaskCompleted($task))`
- D) Варіанти B та C обидва правильні

---

**Питання 13.** Що таке канал `database` для Notifications? Як він працює?

- A) Notification надсилається в лог-файл бази даних
- B) Laravel зберігає notification у таблицю `notifications` (потрібна міграція `php artisan notifications:table`); користувач може отримати свої notifications через `$user->notifications` або `$user->unreadNotifications`; кожна notification має поля `type`, `data` (JSON), `read_at`
- C) Database-канал зберігає notification в Redis
- D) Це канал для відправки SQL-запитів як повідомлень

---

### Queues та Scheduling (питання 14-15)

**Питання 14.** Яка різниця між синхронним (`sync`) та асинхронним (`database`, `redis`) драйвером черги?

- A) Різниці немає -- обидва виконують Job миттєво
- B) `sync` виконує Job прямо в тому ж запиті (блокує відповідь), `database`/`redis` додає Job у чергу, і він виконується окремим процесом `php artisan queue:work`; для production завжди використовується асинхронний драйвер
- C) `sync` працює тільки локально, `database` -- тільки на сервері
- D) `sync` швидший за `database` у production

---

**Питання 15.** Як запланувати виконання Artisan-команди щодня о 3:00 ночі? Де це налаштовується?

- A) Додати cron job вручну на сервері для кожної команди
- B) Визначити розклад у `routes/console.php` за допомогою `Schedule::command('your:command')->dailyAt('03:00')`; на сервері потрібен лише один cron-запис: `* * * * * php artisan schedule:run >> /dev/null 2>&1`
- C) Використати `setTimeout()` у PHP
- D) Встановити пакет `laravel/scheduler`

---

## Частина 2: Практичне завдання

### Повний автентифікований workflow

> **Передумова:** у вас вже є Laravel-проєкт з тижнів 1-2 (Task Manager API з моделями User, Category, Task). Встановлено Sanctum, створено Policy для Task, налаштовано Events/Notifications, Storage та Queues.
>
> **Мета:** пройти повний цикл роботи з API від реєстрації до відкликання токена, перевіривши автентифікацію, авторизацію, events, notifications та file uploads.

Запустіть сервер:

```bash
php artisan serve
```

---

### Крок 1: Реєстрація User A -- отримання токена

```bash
curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }' | jq
```

**Очікуваний статус:** `201 Created`

**Очікуваний результат:**

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "created_at": "2026-04-09T...",
      "updated_at": "2026-04-09T..."
    },
    "token": "1|abc123def456..."
  }
}
```

> Збережіть токен у змінну:
> ```bash
> TOKEN_A="1|abc123def456..."
> ```

---

### Крок 2: Реєстрація User B -- отримання токена

```bash
curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Bob",
    "email": "bob@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }' | jq
```

**Очікуваний статус:** `201 Created`

**Очікуваний результат:**

```json
{
  "data": {
    "user": {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "created_at": "2026-04-09T...",
      "updated_at": "2026-04-09T..."
    },
    "token": "2|xyz789ghi012..."
  }
}
```

> Збережіть токен:
> ```bash
> TOKEN_B="2|xyz789ghi012..."
> ```

---

### Крок 3: User A створює 3 категорії та 5 задач

**Категорії (з токеном A):**

```bash
curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"name": "Work", "description": "Work tasks", "color": "#EF4444"}' | jq

curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"name": "Personal", "description": "Personal tasks", "color": "#10B981"}' | jq

curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"name": "Urgent", "color": "#DC2626"}' | jq
```

**Очікуваний статус для кожного:** `201 Created`

**Задачі (з токеном A):**

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Finish API docs", "description": "Write docs for all endpoints", "category_id": 1, "status": "in_progress"}' | jq

curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Code review", "description": "Review PR #42", "category_id": 1, "status": "todo"}' | jq

curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Buy groceries", "category_id": 2, "status": "todo"}' | jq

curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Call dentist", "category_id": 2, "status": "todo"}' | jq

curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Deploy hotfix", "description": "Critical production fix", "category_id": 3, "status": "in_progress"}' | jq
```

**Очікуваний статус для кожного:** `201 Created`

**Очікуваний результат (приклад першої задачі):**

```json
{
  "data": {
    "id": 1,
    "title": "Finish API docs",
    "description": "Write docs for all endpoints",
    "status": "in_progress",
    "category_id": 1,
    "user_id": 1,
    "created_at": "2026-04-09T...",
    "updated_at": "2026-04-09T..."
  }
}
```

---

### Крок 4: User B створює 2 категорії та 3 задачі

**Категорії (з токеном B):**

```bash
curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"name": "Study", "description": "Learning materials", "color": "#8B5CF6"}' | jq

curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"name": "Fitness", "color": "#F59E0B"}' | jq
```

**Очікуваний статус для кожного:** `201 Created`

**Задачі (з токеном B):**

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"title": "Read Laravel docs", "description": "Chapters 5-8", "category_id": 4, "status": "in_progress"}' | jq

curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"title": "Morning run", "category_id": 5, "status": "todo"}' | jq

curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"title": "Practice SQL", "category_id": 4, "status": "todo"}' | jq
```

**Очікуваний статус для кожного:** `201 Created`

> Запам'ятайте: задачі User B мають `id` 6, 7, 8 (оскільки User A створив задачі 1-5).

---

### Крок 5: User A бачить тільки свої 5 задач

```bash
curl -s http://localhost:8000/api/tasks \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

**Очікуваний статус:** `200 OK`

**Очікуваний результат:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Finish API docs",
      "user_id": 1,
      "status": "in_progress"
    },
    {
      "id": 2,
      "title": "Code review",
      "user_id": 1,
      "status": "todo"
    },
    {
      "id": 3,
      "title": "Buy groceries",
      "user_id": 1,
      "status": "todo"
    },
    {
      "id": 4,
      "title": "Call dentist",
      "user_id": 1,
      "status": "todo"
    },
    {
      "id": 5,
      "title": "Deploy hotfix",
      "user_id": 1,
      "status": "in_progress"
    }
  ]
}
```

> Всі 5 задач мають `user_id: 1`. Задачі User B (id: 6, 7, 8) **не** повертаються. Це працює завдяки фільтрації в контролері: `Task::where('user_id', $request->user()->id)->get()`.

---

### Крок 6: User A намагається оновити задачу User B -- 403

```bash
curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:8000/api/tasks/6 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Hacked task"}'
```

**Очікуваний статус:** `403`

```bash
curl -s -X PUT http://localhost:8000/api/tasks/6 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title": "Hacked task"}' | jq
```

**Очікуваний результат:**

```json
{
  "message": "This action is unauthorized."
}
```

> Policy `TaskPolicy@update` перевіряє `$user->id === $task->user_id`. User A (id: 1) не є власником задачі 6 (user_id: 2), тому Policy повертає `false`, а `$this->authorize()` кидає 403.

---

### Крок 7: User A оновлює свою задачу на 'done' -- спрацьовує TaskCompleted event

```bash
curl -s -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status": "done"}' | jq
```

**Очікуваний статус:** `200 OK`

**Очікуваний результат:**

```json
{
  "data": {
    "id": 1,
    "title": "Finish API docs",
    "description": "Write docs for all endpoints",
    "status": "done",
    "category_id": 1,
    "user_id": 1,
    "created_at": "2026-04-09T...",
    "updated_at": "2026-04-09T..."
  }
}
```

> Коли статус змінюється на `done`, контролер або Observer dispatch'ить `TaskCompleted` event. Listener `SendTaskCompletedNotification` відправляє notification через `database` канал.

---

### Крок 8: User A отримує свої notifications

```bash
curl -s http://localhost:8000/api/notifications \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

**Очікуваний статус:** `200 OK`

**Очікуваний результат:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-...",
      "type": "App\\Notifications\\TaskCompletedNotification",
      "data": {
        "task_id": 1,
        "title": "Finish API docs",
        "message": "Task \"Finish API docs\" has been completed!"
      },
      "read_at": null,
      "created_at": "2026-04-09T..."
    }
  ]
}
```

> Notification має `read_at: null` -- ще не прочитана. Поле `data` містить JSON з інформацією про задачу, яку визначає метод `toArray()` у класі `TaskCompletedNotification`.

---

### Крок 9: Позначити notification як прочитану

```bash
curl -s -X PATCH http://localhost:8000/api/notifications/a1b2c3d4-e5f6-.../read \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

> Замініть `a1b2c3d4-e5f6-...` на реальний `id` з попереднього кроку.

**Очікуваний статус:** `200 OK`

**Очікуваний результат:**

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-...",
    "type": "App\\Notifications\\TaskCompletedNotification",
    "data": {
      "task_id": 1,
      "title": "Finish API docs",
      "message": "Task \"Finish API docs\" has been completed!"
    },
    "read_at": "2026-04-09T...",
    "created_at": "2026-04-09T..."
  }
}
```

> Тепер `read_at` має timestamp -- notification прочитана.

---

### Крок 10: Завантаження файлу до задачі

```bash
curl -s -X POST http://localhost:8000/api/tasks/1/attachments \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "attachment=@/path/to/test-file.pdf" | jq
```

> Замініть `/path/to/test-file.pdf` на реальний шлях до файлу. Для тестування можна створити файл:
> ```bash
> echo "test content" > /tmp/test-file.txt
> ```
> І використати:
> ```bash
> curl -s -X POST http://localhost:8000/api/tasks/1/attachments \
>   -H "Accept: application/json" \
>   -H "Authorization: Bearer $TOKEN_A" \
>   -F "attachment=@/tmp/test-file.txt" | jq
> ```

**Очікуваний статус:** `201 Created`

**Очікуваний результат:**

```json
{
  "data": {
    "id": 1,
    "task_id": 1,
    "filename": "test-file.txt",
    "path": "attachments/abc123def456.txt",
    "mime_type": "text/plain",
    "size": 13,
    "url": "http://localhost:8000/storage/attachments/abc123def456.txt",
    "created_at": "2026-04-09T..."
  }
}
```

> Зверніть увагу: curl використовує прапорець `-F` (form-data) замість `-d` (JSON), тому `Content-Type` автоматично стає `multipart/form-data`. Не додавайте заголовок `Content-Type: application/json` для завантаження файлів.

---

### Крок 11: Перевірка, що attachment з'являється у задачі

```bash
curl -s http://localhost:8000/api/tasks/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

**Очікуваний статус:** `200 OK`

**Очікуваний результат:**

```json
{
  "data": {
    "id": 1,
    "title": "Finish API docs",
    "description": "Write docs for all endpoints",
    "status": "done",
    "category_id": 1,
    "user_id": 1,
    "attachments": [
      {
        "id": 1,
        "filename": "test-file.txt",
        "url": "http://localhost:8000/storage/attachments/abc123def456.txt",
        "mime_type": "text/plain",
        "size": 13
      }
    ],
    "created_at": "2026-04-09T...",
    "updated_at": "2026-04-09T..."
  }
}
```

> Attachment з'являється в масиві `attachments` завдяки eager loading у контролері: `$task->load('attachments')` або використання `with('attachments')` у запиті.

---

### Крок 12: Dispatch queued job та перевірка через queue:work

Спочатку переконайтеся, що у `.env` налаштований драйвер черги:

```
QUEUE_CONNECTION=database
```

Виконайте дію, яка створює queued job (наприклад, зміна статусу ще однієї задачі на 'done'):

```bash
curl -s -X PUT http://localhost:8000/api/tasks/5 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status": "done"}' | jq
```

**Очікуваний статус:** `200 OK`

Перевірте, що job потрапив у чергу:

```bash
php artisan queue:work --once
```

**Очікуваний результат у терміналі:**

```
[2026-04-09 ...] Processing: App\Listeners\SendTaskCompletedNotification
[2026-04-09 ...] Processed:  App\Listeners\SendTaskCompletedNotification
```

> Прапорець `--once` обробляє один job і зупиняється. Це зручно для тестування. У production використовується `queue:work` без `--once` (або Supervisor/Horizon для керування воркерами).

Переконайтеся, що notification створена:

```bash
curl -s http://localhost:8000/api/notifications \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

**Очікуваний результат:** масив тепер містить 2 notifications (для задач 1 та 5).

---

### Крок 13: User A виходить з системи -- токен відкликаний

```bash
curl -s -X POST http://localhost:8000/api/logout \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

**Очікуваний статус:** `200 OK`

**Очікуваний результат:**

```json
{
  "message": "Logged out successfully"
}
```

> Метод `$request->user()->currentAccessToken()->delete()` видаляє поточний токен з таблиці `personal_access_tokens`. Токен більше не валідний.

---

### Крок 14: Спроба доступу з відкликаним токеном -- 401

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/tasks \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A"
```

**Очікуваний статус:** `401`

```bash
curl -s http://localhost:8000/api/tasks \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" | jq
```

**Очікуваний результат:**

```json
{
  "message": "Unauthenticated."
}
```

> Токен було видалено з бази. Sanctum не може його знайти, тому повертає 401 Unauthenticated.

---

### Чекліст виконання

Перед тим як вважати завдання виконаним, перевірте:

- [ ] Register повертає токен, user зберігається в базі
- [ ] Кожен user бачить тільки свої задачі (фільтрація по `user_id`)
- [ ] Policy блокує доступ до чужих задач (403 Forbidden)
- [ ] TaskCompleted event dispatch'иться при зміні статусу на 'done'
- [ ] Notification створюється в базі через database-канал
- [ ] Notification можна позначити як прочитану
- [ ] File upload працює через multipart form-data
- [ ] Attachment з'являється у відповіді задачі
- [ ] Queued job обробляється через `queue:work`
- [ ] Logout видаляє токен, повторний запит повертає 401

---

## Частина 3: Бонусне завдання

### "Share Task" -- розшарювання задачі іншому користувачу

Реалізуйте функціонал, який дозволяє власнику задачі "розшарити" її іншому користувачу. Розшарена задача доступна для перегляду, але не для редагування.

---

#### 3.1 Створіть міграцію для pivot-таблиці

```bash
php artisan make:migration create_shared_tasks_table
```

Структура таблиці:

```php
public function up(): void
{
    Schema::create('shared_tasks', function (Blueprint $table) {
        $table->id();
        $table->foreignId('task_id')->constrained()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->timestamps();

        $table->unique(['task_id', 'user_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('shared_tasks');
}
```

Виконайте міграцію:

```bash
php artisan migrate
```

---

#### 3.2 Додайте зв'язки у моделі

**Task model** -- додайте зв'язок `sharedWith`:

```php
// app/Models/Task.php

public function sharedWith(): BelongsToMany
{
    return $this->belongsToMany(User::class, 'shared_tasks')
        ->withTimestamps();
}
```

**User model** -- додайте зв'язок `sharedTasks`:

```php
// app/Models/User.php

public function sharedTasks(): BelongsToMany
{
    return $this->belongsToMany(Task::class, 'shared_tasks')
        ->withTimestamps();
}
```

> **Паралель з Vue:** `belongsToMany` -- це many-to-many зв'язок через pivot-таблицю. Як у Vue коли один компонент може мати кілька слотів, а один слот може використовуватися кількома компонентами.

---

#### 3.3 Додайте маршрут

У `routes/api.php`:

```php
Route::post('tasks/{task}/share', [TaskController::class, 'share'])
    ->middleware('auth:sanctum');
```

---

#### 3.4 Реалізуйте метод share у контролері

```php
// app/Http/Controllers/TaskController.php

public function share(Request $request, Task $task)
{
    $this->authorize('update', $task); // тільки власник може розшарювати

    $validated = $request->validate([
        'user_id' => ['required', 'exists:users,id'],
    ]);

    // Не можна розшарити сам собі
    if ($validated['user_id'] == $request->user()->id) {
        return response()->json([
            'message' => 'You cannot share a task with yourself.',
        ], 422);
    }

    $task->sharedWith()->syncWithoutDetaching([$validated['user_id']]);

    return response()->json([
        'message' => 'Task shared successfully.',
        'data' => $task->load('sharedWith'),
    ]);
}
```

> `syncWithoutDetaching` додає зв'язок, якщо його ще немає, і не видаляє існуючі. Це безпечніше за `attach`, який кине помилку при дублікаті (через `unique` constraint).

---

#### 3.5 Оновіть TaskPolicy

Додайте метод `view` і оновіть логіку:

```php
// app/Policies/TaskPolicy.php

public function view(User $user, Task $task): bool
{
    // Власник або той, кому розшарили
    return $user->id === $task->user_id
        || $task->sharedWith()->where('user_id', $user->id)->exists();
}

public function update(User $user, Task $task): bool
{
    // Тільки власник може редагувати
    return $user->id === $task->user_id;
}

public function delete(User $user, Task $task): bool
{
    // Тільки власник може видаляти
    return $user->id === $task->user_id;
}
```

---

#### 3.6 Оновіть метод index -- включити розшарені задачі

```php
public function index(Request $request)
{
    $ownTasks = $request->user()->tasks()->get();
    $sharedTasks = $request->user()->sharedTasks()->get();

    return response()->json([
        'data' => [
            'own' => $ownTasks,
            'shared' => $sharedTasks,
        ],
    ]);
}
```

---

#### 3.7 Протестуйте

**User A розшарює задачу 1 для User B:**

```bash
curl -s -X POST http://localhost:8000/api/tasks/1/share \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"user_id": 2}' | jq
```

**Очікуваний статус:** `200 OK`

**Очікуваний результат:**

```json
{
  "message": "Task shared successfully.",
  "data": {
    "id": 1,
    "title": "Finish API docs",
    "user_id": 1,
    "shared_with": [
      {
        "id": 2,
        "name": "Bob",
        "email": "bob@example.com",
        "pivot": {
          "task_id": 1,
          "user_id": 2,
          "created_at": "2026-04-09T...",
          "updated_at": "2026-04-09T..."
        }
      }
    ]
  }
}
```

**User B бачить розшарену задачу в списку:**

```bash
curl -s http://localhost:8000/api/tasks \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" | jq
```

**Очікуваний результат:**

```json
{
  "data": {
    "own": [
      {"id": 6, "title": "Read Laravel docs", "user_id": 2},
      {"id": 7, "title": "Morning run", "user_id": 2},
      {"id": 8, "title": "Practice SQL", "user_id": 2}
    ],
    "shared": [
      {"id": 1, "title": "Finish API docs", "user_id": 1}
    ]
  }
}
```

**User B може переглянути розшарену задачу:**

```bash
curl -s http://localhost:8000/api/tasks/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" | jq
```

**Очікуваний статус:** `200 OK`

**User B НЕ може редагувати розшарену задачу:**

```bash
curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"title": "Trying to edit"}'
```

**Очікуваний статус:** `403`

```bash
curl -s -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"title": "Trying to edit"}' | jq
```

**Очікуваний результат:**

```json
{
  "message": "This action is unauthorized."
}
```

> User B може дивитися (view), але не редагувати (update) -- Policy `view` дозволяє, Policy `update` забороняє.

---

### Чекліст бонусного завдання

- [ ] Міграція `shared_tasks` створена з `unique` constraint
- [ ] `belongsToMany` зв'язки додані в обидві моделі (Task, User)
- [ ] Маршрут `POST /api/tasks/{task}/share` працює
- [ ] Власник може розшарити задачу (200), але не сам собі (422)
- [ ] Policy `view` дозволяє перегляд розшареної задачі
- [ ] Policy `update` блокує редагування розшареної задачі (403)
- [ ] `index` повертає і власні, і розшарені задачі окремо

---

## Відповіді на теоретичний тест

### Питання 1
**Відповідь: B) Повертає об'єкт `NewAccessToken`, в якого є властивість `plainTextToken`**

`$user->createToken('auth-token')` створює запис у таблиці `personal_access_tokens` з хешем токена (SHA-256). Метод повертає об'єкт `NewAccessToken`, у якого `plainTextToken` містить формат `{id}|{plain-text-token}`. Ця plain-text версія доступна тільки один раз -- після цього зберігається лише хеш.

```php
$token = $user->createToken('auth-token');
$token->plainTextToken; // "1|abc123def456..."
```

> **Паралель з Vue:** це як одноразовий `ref()` -- значення токена доступне тільки при створенні. Якщо загубили -- створюєте новий.

### Питання 2
**Відповідь: B) Обгорнути маршрути в `Route::middleware('auth:sanctum')->group(...)`**

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::post('logout', [AuthController::class, 'logout']);
});
```

Guard `sanctum` перевіряє наявність і валідність Bearer-токена у заголовку `Authorization`. Якщо токен невалідний або відсутній -- повертає 401.

### Питання 3
**Відповідь: B) Повертає Eloquent-модель `User` автентифікованого користувача, або `null`**

Усередині `auth:sanctum` middleware `$request->user()` гарантовано повертає модель `User` (інакше middleware вже повернув 401). Це та сама модель, що й `Auth::user()`. Через неї можна отримати `$request->user()->id`, `$request->user()->tasks`, тощо.

```php
public function index(Request $request)
{
    $user = $request->user(); // App\Models\User
    $tasks = $user->tasks;   // колекція задач цього користувача
}
```

### Питання 4
**Відповідь: B) Gate -- closure для перевірки прав; Policy -- клас, прив'язаний до моделі**

**Gate** -- визначається як closure у `AppServiceProvider`:

```php
Gate::define('manage-settings', function (User $user) {
    return $user->is_admin;
});
```

**Policy** -- це окремий клас для конкретної моделі:

```bash
php artisan make:policy TaskPolicy --model=Task
```

Правило: якщо логіка авторизації прив'язана до моделі (хто може update/delete цей Task?) -- використовуйте Policy. Якщо це загальна перевірка (чи є користувач адміном?) -- використовуйте Gate.

> **Паралель з Vue:** Gate -- як глобальний `v-if` у `App.vue`. Policy -- як `v-if` всередині конкретного компонента, що має доступ до props.

### Питання 5
**Відповідь: D) Варіанти A та B обидва правильні**

Обидва способи коректні:

```php
// Варіант A: Gate (повертає bool)
if (Gate::allows('update', $task)) {
    $task->update($data);
}

// Варіант B: authorize (кидає 403 при відмові)
$this->authorize('update', $task);
$task->update($data);
```

`$this->authorize()` -- зручніший для контролерів, бо не потрібен `if`. Laravel автоматично знаходить Policy для моделі `Task` і викликає метод `update`.

### Питання 6
**Відповідь: B) Laravel кине виняток `AuthorizationException`, який автоматично перетвориться на HTTP 403 Forbidden**

Коли Policy повертає `false`, метод `$this->authorize()` кидає `Illuminate\Auth\Access\AuthorizationException`. Exception handler Laravel перехоплює його і повертає:

```json
{
    "message": "This action is unauthorized."
}
```

Зі статусом `403 Forbidden`. Не потрібно вручну ловити виняток -- Laravel робить це автоматично.

### Питання 7
**Відповідь: B) "Before" middleware виконується до контролера, "after" -- після**

Laravel middleware працює як "цибулинний" pipeline (onion):

```
Request → Middleware 1 (before) → Middleware 2 (before) → Controller → Middleware 2 (after) → Middleware 1 (after) → Response
```

Приклад "before" middleware (перевірка перед контролером):

```php
public function handle(Request $request, Closure $next)
{
    if (!$request->user()->is_verified) {
        return response()->json(['message' => 'Email not verified'], 403);
    }

    return $next($request); // передати далі
}
```

Приклад "after" middleware (модифікація відповіді після контролера):

```php
public function handle(Request $request, Closure $next)
{
    $response = $next($request); // спочатку контролер

    $response->headers->set('X-Request-Time', microtime(true));

    return $response;
}
```

> **Паралель з Vue:** це як navigation guards у Vue Router: `beforeEach` (before middleware) та `afterEach` (after middleware).

### Питання 8
**Відповідь: B) RateLimiter в AppServiceProvider + middleware `throttle`**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
}
```

Застосування:

```php
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // маршрути
});
```

При перевищенні ліміту Laravel повертає `429 Too Many Requests` із заголовками `Retry-After` і `X-RateLimit-Remaining`.

### Питання 9
**Відповідь: B) `local` -- приватний, `public` -- доступний через symbolic link**

```php
// config/filesystems.php
'disks' => [
    'local' => [
        'driver' => 'local',
        'root' => storage_path('app/private'), // недоступний з веб
    ],
    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),  // доступний через symlink
        'url' => env('APP_URL').'/storage',
    ],
],
```

Щоб файли з `public` диску були доступні через URL:

```bash
php artisan storage:link
```

Це створює symbolic link `public/storage → storage/app/public`.

Використання:

```php
// Зберегти файл на public диск
$path = $request->file('attachment')->store('attachments', 'public');

// Отримати URL
$url = Storage::disk('public')->url($path);
// => "http://localhost:8000/storage/attachments/abc123.pdf"
```

### Питання 10
**Відповідь: B) Перевіряє: є файлом, MIME-тип jpg/png/pdf, не більше 5120 КБ (5 МБ)**

Розберемо кожне правило:

| Правило | Що робить |
|---|---|
| `required` | Поле обов'язкове |
| `file` | Значення має бути завантаженим файлом (не рядком чи числом) |
| `mimes:jpg,png,pdf` | MIME-тип файлу має бути image/jpeg, image/png або application/pdf |
| `max:5120` | Максимальний розмір -- 5120 **кілобайт** (5 МБ) |

> Важливо: для файлів `max` вимірюється в кілобайтах, а не байтах. Для рядків `max` -- це кількість символів.

### Питання 11
**Відповідь: B) Events -- бізнес-логіка; Observers -- lifecycle моделі; Notifications -- повідомлення користувачам**

| Механізм | Коли використовувати | Приклад |
|---|---|---|
| **Events** | Довільні бізнес-події, які можуть мати кілька listeners | `TaskCompleted`, `OrderPaid`, `UserRegistered` |
| **Observers** | Реакція на lifecycle-подія конкретної моделі | `creating`, `updated`, `deleted` -- автоматичне логування, оновлення кешу |
| **Notifications** | Відправка повідомлень користувачу через один або кілька каналів | Email, database, SMS, Slack |

Events та Observers можуть *trigger* Notifications. Наприклад: Observer бачить `updated` на Task -> dispatch `TaskCompleted` event -> Listener відправляє `TaskCompletedNotification` через database-канал.

> **Паралель з Vue:** Events -- як `emit` від компонента. Observers -- як `watch` на reactive-дані. Notifications -- як toast/snackbar у UI.

### Питання 12
**Відповідь: D) Варіанти B та C обидва правильні**

Два еквівалентні способи dispatch event:

```php
// Спосіб B: статичний метод (завдяки trait Dispatchable)
TaskCompleted::dispatch($task);

// Спосіб C: хелпер-функція
event(new TaskCompleted($task));
```

Обидва додають event у pipeline Laravel, де зареєстровані listeners його обробляють. `dispatch()` -- більш сучасний і читабельний спосіб.

> Варіант A (`new TaskCompleted($task)`) лише створює об'єкт, але не dispatch'ить його -- listeners не будуть викликані.

### Питання 13
**Відповідь: B) Зберігає в таблицю `notifications`, доступ через `$user->notifications`**

Для використання database-каналу:

```bash
php artisan notifications:table
php artisan migrate
```

Це створює таблицю `notifications` зі стовпцями:

| Стовпець | Тип | Опис |
|---|---|---|
| `id` | uuid | Primary key |
| `type` | string | Клас notification (e.g., `App\Notifications\TaskCompletedNotification`) |
| `notifiable_type` | string | Тип моделі (e.g., `App\Models\User`) |
| `notifiable_id` | bigint | ID моделі |
| `data` | json | Довільні дані, визначені в `toArray()` |
| `read_at` | timestamp, nullable | Коли прочитано (`null` = непрочитана) |

У класі Notification:

```php
class TaskCompletedNotification extends Notification
{
    public function via($notifiable): array
    {
        return ['database']; // канал database
    }

    public function toArray($notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'message' => "Task \"{$this->task->title}\" has been completed!",
        ];
    }
}
```

Доступ до notifications:

```php
$user->notifications;          // всі
$user->unreadNotifications;    // тільки непрочитані (read_at === null)
$notification->markAsRead();   // встановлює read_at
```

### Питання 14
**Відповідь: B) `sync` -- в тому ж запиті; `database`/`redis` -- окремий процес**

| Драйвер | Як працює | Коли використовувати |
|---|---|---|
| `sync` | Job виконується прямо в HTTP-запиті. Клієнт чекає завершення | Розробка, тестування, прості дії |
| `database` | Job зберігається в таблицю `jobs`, обробляється `queue:work` | Production (простий варіант) |
| `redis` | Job додається в Redis, обробляється `queue:work` або Horizon | Production (швидкий варіант) |

Налаштування у `.env`:

```
QUEUE_CONNECTION=sync      # для розробки
QUEUE_CONNECTION=database  # для production (простий)
QUEUE_CONNECTION=redis     # для production (швидкий)
```

Для `database` потрібна міграція:

```bash
php artisan queue:table
php artisan migrate
```

Запуск воркера:

```bash
php artisan queue:work              # обробляє jobs безперервно
php artisan queue:work --once       # обробляє один job і зупиняється
php artisan queue:work --tries=3    # максимум 3 спроби при помилці
```

> **Паралель з Vue:** `sync` -- як синхронний `computed`. `database`/`redis` -- як `watch` з `{ flush: 'post' }`, що виконується пізніше в окремому "циклі".

### Питання 15
**Відповідь: B) Розклад у `routes/console.php` + один cron-запис**

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('app:cleanup-old-tasks')->dailyAt('03:00');
Schedule::command('app:send-daily-report')->dailyAt('08:00');
Schedule::command('queue:work --stop-when-empty')->everyMinute();
```

На сервері потрібен лише один cron-запис:

```
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

Цей cron запускається щохвилини, а Laravel сам вирішує, які команди виконувати за розкладом. Це зручніше, ніж створювати окремий cron для кожної команди.

Корисні методи розкладу:

```php
Schedule::command('...')->everyMinute();
Schedule::command('...')->hourly();
Schedule::command('...')->dailyAt('03:00');
Schedule::command('...')->weeklyOn(1, '08:00'); // щопонеділка о 8:00
Schedule::command('...')->monthlyOn(1, '00:00'); // 1-го числа опівночі
```

Перевірка розкладу:

```bash
php artisan schedule:list
```
