# Тиждень 4: Фінальний тест курсу

Це підсумковий тест, що покриває **ВСІ 4 тижні** курсу. Він складається з теоретичної частини (25 питань), практичного завдання (повна перевірка Task Manager) та самооцінки.

---

## Частина 1: Фінальний теоретичний тест (25 питань)

### PHP Basics (питання 1-2)

**1. Яка різниця між `==` та `===` в PHP?**

a) Немає різниці, обидва порівнюють за значенням і типом
b) `==` порівнює з приведенням типів, `===` порівнює строго (значення + тип)
c) `===` працює тільки з об'єктами
d) `==` працює тільки з рядками

**2. Що таке trait в PHP і який його аналог у Vue?**

a) Trait — це клас, аналог Vue component
b) Trait — це інтерфейс, аналог TypeScript interface
c) Trait — набір методів для повторного використання в класах, аналог Vue composable
d) Trait — це namespace, аналог ES module

### Laravel Structure (питання 3-4)

**3. Який директорії Laravel відповідає `node_modules/` у Vue-проєкті?**

a) `app/`
b) `storage/`
c) `vendor/`
d) `bootstrap/`

**4. Що робить команда `php artisan tinker`?**

a) Запускає тести
b) Запускає інтерактивну REPL-консоль для виконання PHP-коду з доступом до всіх моделей
c) Створює нового користувача
d) Показує список маршрутів

### Routing / Controllers (питання 5-6)

**5. Що генерує `Route::apiResource('tasks', TaskController::class)`?**

a) Тільки GET /api/tasks
b) 5 маршрутів: index, store, show, update, destroy
c) 7 маршрутів: index, create, store, show, edit, update, destroy
d) 3 маршрути: index, store, destroy

**6. Який HTTP-метод використовується для оновлення ресурсу?**

a) POST
b) GET
c) PUT або PATCH
d) DELETE

### Migrations / Eloquent (питання 7-9)

**7. Що робить `php artisan migrate:fresh`?**

a) Створює нову міграцію
b) Відкочує останню міграцію
c) Видаляє ВСІ таблиці та запускає всі міграції з нуля
d) Показує статус міграцій

**8. Для чого потрібен `$fillable` в Eloquent моделі?**

a) Вказує, які поля показувати в JSON
b) Визначає білий список полів, що дозволені для масового присвоєння (mass assignment)
c) Визначає типи полів для cast
d) Вказує обов'язкові поля при створенні

**9. Що робить `Task::with('category')->get()`?**

a) Створює задачу з категорією
b) Фільтрує задачі, що мають категорію
c) Завантажує задачі з eager loading категорій (один запит замість N+1)
d) Видаляє задачі без категорії

### Relationships (питання 10-11)

**10. Яку relationship використати, якщо одна категорія має багато задач?**

a) `hasOne` в Category
b) `hasMany` в Category + `belongsTo` в Task
c) `belongsToMany` в обох
d) `morphMany` в Category

**11. Що таке N+1 проблема?**

a) Помилка, коли модель не знайдена
b) Проблема, коли для N записів виконується 1 запит для списку + N окремих запитів для зв'язків
c) Обмеження на кількість записів у таблиці
d) Конфлікт між двома міграціями

### Validation (питання 12-13)

**12. Який HTTP-статус Laravel повертає при невдалій валідації API-запиту?**

a) 400 Bad Request
b) 401 Unauthorized
c) 422 Unprocessable Entity
d) 500 Internal Server Error

**13. Що робить метод `authorize()` у Form Request?**

a) Валідує дані
b) Повертає true/false — чи дозволено користувачу виконувати цей запит
c) Створює токен аутентифікації
d) Перенаправляє на сторінку логіну

### API Resources (питання 14-15)

**14. Навіщо використовувати API Resources замість повернення моделі напряму?**

a) Для кращої швидкості запитів
b) Для контролю над JSON-відповіддю: які поля, формат, вкладені ресурси
c) Для автоматичної валідації
d) Для кешування відповідей

**15. Що робить `$this->whenLoaded('category')` в Resource?**

a) Завжди включає категорію
b) Включає категорію тільки якщо вона була eager loaded, уникає N+1
c) Перевіряє чи категорія існує в БД
d) Завантажує категорію з кешу

### Authentication (питання 16-17)

**16. Як Sanctum зберігає токени?**

a) В cookies браузера
b) В таблиці `personal_access_tokens` в базі даних
c) В Redis
d) В `.env` файлі

**17. Що поверне захищений `auth:sanctum` маршрут без Bearer-токена?**

a) 200 з порожніми даними
b) 403 Forbidden
c) 401 Unauthorized
d) 404 Not Found

### Authorization (питання 18-19)

**18. Яка різниця між Gate та Policy?**

a) Gate для моделей, Policy для глобальних перевірок
b) Gate — простий closure для перевірки, Policy — клас з методами для CRUD конкретної моделі
c) Gate для аутентифікації, Policy для авторизації
d) Немає різниці, це синоніми

**19. Що поверне `$this->authorize('update', $task)` якщо TaskPolicy::update() повертає false?**

a) null
b) false
c) Кине AuthorizationException → Laravel поверне 403 Forbidden
d) Перенаправить на логін

### Middleware (питання 20)

**20. В якому порядку виконуються middleware?**

a) Випадковому
b) Спочатку глобальні, потім групові, потім route-specific — як onion (цибулина)
c) Тільки route-specific middleware
d) Middleware не мають порядку

### Testing (питання 21-22)

**21. Що робить `RefreshDatabase` trait у Pest-тесті?**

a) Запускає міграції один раз перед усіма тестами
b) Скидає базу даних перед КОЖНИМ тестом (транзакцією), щоб тести були ізольовані
c) Видаляє тестову базу після тестів
d) Створює нову базу для кожного тестового файлу

**22. Що робить `Event::fake()` в тесті?**

a) Створює фейковий event
b) Перехоплює всі events — вони не диспатчаться реально, але можна перевірити, що вони були викликані
c) Видаляє всі event listeners
d) Створює mock event listener

### Performance (питання 23)

**23. Що робить `Cache::remember('key', 300, fn() => $query)`?**

a) Завжди виконує $query
b) Повертає кешоване значення якщо є, інакше виконує $query, кешує на 300 секунд, повертає
c) Зберігає $query в кеш назавжди
d) Видаляє кеш через 300 секунд

### Deployment (питання 24-25)

**24. Чому `APP_DEBUG=false` обов'язковий у production?**

a) Для кращої швидкості
b) Тому що з `true` Laravel показує stack traces, шляхи до файлів, SQL-запити — серйозна вразливість безпеки
c) Тому що debug-mode використовує більше пам'яті
d) Щоб не логувати помилки

**25. Що робить `php artisan optimize` перед deployment?**

a) Видаляє непотрібні файли
b) Кешує конфігурацію, маршрути та views для швидшого завантаження (як `npm run build`)
c) Оновлює залежності
d) Запускає тести

---

## Частина 2: Практичне завдання — Повна перевірка Task Manager

Ваш Task Manager повинен демонструвати ВСІ навички з курсу. Пройдіть цей чеклист крок за кроком.

### 2.1 Підготовка

```bash
# Скиньте базу та заповніть тестовими даними
php artisan migrate:fresh --seed

# Запустіть сервери
php artisan serve &                    # Laravel на :8000
cd ../task-manager-frontend && npm run dev &  # Vue на :5173
```

### 2.2 Аутентифікація (2 користувачі)

```bash
# Зареєструйте User A
curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"password123","password_confirmation":"password123"}' | jq .

# Збережіть токен
TOKEN_A="<скопіюйте token з відповіді>"

# Зареєструйте User B
curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@test.com","password":"password123","password_confirmation":"password123"}' | jq .

TOKEN_B="<скопіюйте token з відповіді>"
```

**Очікувано:** Обидва запити повертають 201 з `{user, token}`.

### 2.3 CRUD з валідацією (User A)

```bash
# Створіть категорію
curl -s -X POST http://localhost:8000/api/categories \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"name":"Work","color":"#3498db"}' | jq .

CATEGORY_ID="<id з відповіді>"

# Створіть задачу (валідний запит)
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Complete Laravel course\",\"description\":\"Finish all 24 lessons\",\"status\":\"pending\",\"priority\":1,\"deadline\":\"2026-05-01\",\"category_id\":$CATEGORY_ID}" | jq .

TASK_ID="<id з відповіді>"

# Спробуйте невалідний запит (без title)
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"description":"No title"}' | jq .
```

**Очікувано:**
- Категорія → 201 + `{data: {id, name, color}}`
- Задача → 201 + `{data: {id, title, ..., category: {...}, tags: []}}`
- Невалідний → 422 + `{message: "...", errors: {title: ["The title field is required."]}}`

### 2.4 Авторизація (cross-user)

```bash
# User B спробує оновити задачу User A
curl -s -X PUT http://localhost:8000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hacked!"}' | jq .
```

**Очікувано:** 403 Forbidden

### 2.5 Фільтрація, сортування, пошук

```bash
# Фільтр по статусу
curl -s "http://localhost:8000/api/tasks?status=pending" \
  -H "Authorization: Bearer $TOKEN_A" | jq '.data | length'

# Пошук
curl -s "http://localhost:8000/api/tasks?search=Laravel" \
  -H "Authorization: Bearer $TOKEN_A" | jq '.data[].title'

# Сортування по дедлайну
curl -s "http://localhost:8000/api/tasks?sort=deadline&order=asc" \
  -H "Authorization: Bearer $TOKEN_A" | jq '.data[].deadline'

# Пагінація
curl -s "http://localhost:8000/api/tasks?page=1&per_page=5" \
  -H "Authorization: Bearer $TOKEN_A" | jq '.meta'
```

**Очікувано:** Коректні відфільтровані/відсортовані/пагіновані результати.

### 2.6 Файлові вкладення

```bash
# Завантажте файл
curl -s -X POST http://localhost:8000/api/tasks/$TASK_ID/attachments \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "attachment=@/path/to/any/file.pdf" | jq .

# Перевірте що файл з'явився
curl -s http://localhost:8000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN_A" | jq '.data.attachments'
```

**Очікувано:** Файл завантажено, URL доступний, видно в task response.

### 2.7 Нотифікації

```bash
# Оновіть задачу на "done" — має створити notification
curl -s -X PUT http://localhost:8000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' | jq .

# Перевірте нотифікації
curl -s http://localhost:8000/api/notifications \
  -H "Authorization: Bearer $TOKEN_A" | jq .

# Позначте як прочитану
NOTIF_ID="<id нотифікації>"
curl -s -X PATCH http://localhost:8000/api/notifications/$NOTIF_ID/read \
  -H "Authorization: Bearer $TOKEN_A" | jq .
```

**Очікувано:** Notification створено автоматично при зміні статусу на "done".

### 2.8 Тести

```bash
# Запустіть всі тести
php artisan test

# Очікувано: 30+ тестів, всі зелені
# Tests:  XX passed
# Assertions: XX

# Перевірте покриття (опціонально)
php artisan test --coverage
```

**Очікувано:** Мінімум 30 тестів проходять без помилок.

### 2.9 Продуктивність

```bash
# Перевірте, що N+1 запитів немає
# В AppServiceProvider має бути:
# Model::preventLazyLoading(!app()->isProduction());

# Перевірте кеш (якщо реалізовано)
php artisan cache:clear

# Оптимізуйте
php artisan optimize
```

### 2.10 Vue SPA

Відкрийте `http://localhost:5173` у браузері та виконайте:

1. **Реєстрація** — створіть нового користувача
2. **Логін** — увійдіть
3. **Список задач** — побачіть задачі з фільтрами
4. **Створення** — створіть нову задачу (перевірте валідацію)
5. **Редагування** — оновіть задачу
6. **Видалення** — видаліть задачу
7. **Фільтрація** — відфільтруйте по статусу, категорії
8. **Пагінація** — перемикайте сторінки
9. **Логаут** — вийдіть

**Очікувано:** Все працює без помилок у console.

### Фінальний чеклист

| # | Вимога | Перевірено |
|---|--------|:----------:|
| 1 | Два користувачі з окремими даними | [ ] |
| 2 | Повний CRUD задач з валідацією | [ ] |
| 3 | Повний CRUD категорій з валідацією | [ ] |
| 4 | Фільтрація, сортування, пошук | [ ] |
| 5 | Пагінація через API Resources | [ ] |
| 6 | Завантаження файлів | [ ] |
| 7 | Нотифікації при зміні статусу | [ ] |
| 8 | 30+ Pest тестів проходять | [ ] |
| 9 | Немає N+1 запитів | [ ] |
| 10 | Rate limiting працює | [ ] |
| 11 | API Resources (не raw models) | [ ] |
| 12 | Vue SPA повністю функціональний | [ ] |

---

## Частина 3: Самооцінка та що далі

### Рівень: Початківець (Junior Laravel Developer)

Ви на цьому рівні, якщо можете:
- [x] Створити Laravel-проєкт та налаштувати базу
- [x] Написати міграції та Eloquent-моделі
- [x] Створити CRUD API з контролерами
- [x] Додати валідацію з Form Requests
- [x] Налаштувати аутентифікацію через Sanctum
- [x] Написати базові Pest-тести

### Рівень: Середній (Mid-Level Laravel Developer)

Ви на цьому рівні, якщо додатково:
- [ ] Розумієте та вирішуєте N+1 проблему
- [ ] Використовуєте Policies для авторизації
- [ ] Пишете Custom Middleware
- [ ] Працюєте з чергами та jobs
- [ ] Маєте 50+ тестів з хорошим покриттям
- [ ] Розумієте кешування та оптимізацію

### Рівень: Просунутий (Senior Laravel Developer)

Наступні кроки для досягнення:
- [ ] Real-time з Laravel Reverb + Echo + Vue
- [ ] Microservices та API Gateway
- [ ] CI/CD з GitHub Actions
- [ ] Docker для розробки та деплою
- [ ] Horizon для моніторингу черг
- [ ] Multi-tenancy (SaaS architecture)
- [ ] GraphQL з Lighthouse
- [ ] Performance profiling з Telescope

### Рекомендовані наступні проєкти

1. **Chat Application** — Laravel Reverb + Echo + Vue для real-time messaging. Вивчите WebSockets.

2. **E-commerce API** — Товари, кошик, замовлення, платежі (Stripe). Вивчите складніші бізнес-правила.

3. **Blog з CMS** — Адмін-панель (Filament), SEO, markdown editor. Вивчите admin panels.

4. **Multi-tenant SaaS** — Кілька організацій на одному додатку. Вивчите stancl/tenancy.

5. **REST → GraphQL** — Перепишіть Task Manager API на GraphQL з Lighthouse. Порівняйте підходи.

### Корисні ресурси

- **Документація:** [laravel.com/docs](https://laravel.com/docs)
- **Відео-курси:** [Laracasts](https://laracasts.com) — найкращі відео-уроки Laravel
- **Новини:** [Laravel News](https://laravel-news.com)
- **Практика:** [Laravel Daily](https://laraveldaily.com) — щоденні поради та туторіали
- **Спільнота:** [Discord Laravel](https://discord.gg/laravel)
- **Roadmap:** [roadmap.sh/laravel](https://roadmap.sh/laravel)

---

## Відповіді на теоретичний тест

| # | Відповідь | Пояснення |
|---|:---------:|-----------|
| 1 | **b** | `==` робить type juggling (`"1" == 1` → true), `===` порівнює і значення, і тип (`"1" === 1` → false). В JS працює так само. |
| 2 | **c** | Trait — механізм повторного використання коду в кількох класах без наслідування. Як Vue composable (`useSomething()`), який можна використати в різних компонентах. |
| 3 | **c** | `vendor/` — директорія, куди Composer встановлює залежності, аналогічно `node_modules/` для npm. |
| 4 | **b** | Tinker — інтерактивна консоль (REPL), де можна виконувати будь-який PHP-код: створювати моделі, тестувати запити. Аналог DevTools Console для бекенду. |
| 5 | **b** | `apiResource` генерує 5 маршрутів: GET (index), POST (store), GET/{id} (show), PUT/{id} (update), DELETE/{id} (destroy). На відміну від `resource`, не створює create та edit (вони для форм). |
| 6 | **c** | PUT замінює весь ресурс, PATCH оновлює частково. Laravel приймає обидва для update. В API зазвичай використовують PUT. |
| 7 | **c** | `migrate:fresh` — ядерний варіант: DROP ALL TABLES + запуск всіх міграцій з нуля. Корисно для розробки, НІКОЛИ для production. |
| 8 | **b** | `$fillable` захищає від mass assignment — атаки, коли зловмисник передає `is_admin=true` в запиті. Тільки поля з `$fillable` дозволені в `create()` та `update()`. |
| 9 | **c** | `with()` — eager loading: один SQL-запит для задач + один для категорій. Без нього кожен `$task->category` робить окремий запит (N+1 проблема). |
| 10 | **b** | Category `hasMany` Tasks (одна категорія → багато задач), Task `belongsTo` Category (задача належить одній категорії). Це one-to-many зв'язок. |
| 11 | **b** | N+1: 1 запит для списку + N запитів для кожного зв'язку. Наприклад, 100 задач = 1 (tasks) + 100 (category для кожної) = 101 запит замість 2 з eager loading. |
| 12 | **c** | 422 Unprocessable Entity — стандарт для "дані отримано, але вони не валідні". Laravel автоматично повертає 422 з `{message, errors}` для API-запитів. |
| 13 | **b** | `authorize()` — перевірка авторизації ДО валідації. Повертає true — запит обробляється, false — 403 Forbidden. Аналог route guard перед обробкою форми. |
| 14 | **b** | API Resource — transformation layer між моделлю та JSON. Контролюєте які поля повертати, формат, вкладені ресурси. Модель напряму може leak internal fields. |
| 15 | **b** | `whenLoaded()` включає зв'язок тільки якщо він був eager loaded через `with()`. Запобігає випадковому N+1 та дозволяє один Resource для різних endpoints. |
| 16 | **b** | Sanctum зберігає хеш токена в таблиці `personal_access_tokens`. При кожному запиті Laravel хешує переданий Bearer token і порівнює з базою. |
| 17 | **c** | 401 Unauthorized — "ви не аутентифіковані". 403 — "ви аутентифіковані, але не маєте доступу". Без токена = не аутентифікований = 401. |
| 18 | **b** | Gate — простий closure для глобальних перевірок (`Gate::define('admin', ...)`). Policy — клас з методами viewAny/view/create/update/delete для конкретної моделі. |
| 19 | **c** | `authorize()` кидає `AuthorizationException` якщо Policy повертає false. Laravel ловить це виключення і повертає 403 Forbidden клієнту. |
| 20 | **b** | Middleware виконуються як onion: Global → Group → Route-specific. Запит проходить "всередину", відповідь — "назовні". Порядок важливий для auth, CORS, logging. |
| 21 | **b** | `RefreshDatabase` загортає кожен тест у транзакцію, яка відкочується після тесту. Тести ізольовані один від одного. Аналог `beforeEach(() => store.$reset())`. |
| 22 | **b** | `Event::fake()` перехоплює dispatch — events не виконують listeners, але можна assert: `Event::assertDispatched(TaskCompleted::class)`. Як `vi.fn()` в Vitest. |
| 23 | **b** | `remember()` — "запам'ятай": перевіряє кеш, якщо є — повертає, якщо ні — виконує closure, зберігає результат на 300 сек, повертає. Як `useMemoize` з TTL. |
| 24 | **b** | `APP_DEBUG=true` відкриває stack traces, шляхи файлів, SQL-запити, env variables. Зловмисник бачить внутрішню структуру додатку. В production завжди `false`. |
| 25 | **b** | `optimize` кешує config (один файл замість десятків), routes (серіалізований масив), views (pre-compiled), events. Прискорює завантаження. Як `npm run build` для бекенду. |
