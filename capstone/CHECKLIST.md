# Чеклист капстону «Крамничка» (MiniShop)

> Трекер прогресу. Деталі, критерії й теорія — у [README.md](./README.md). Тут лише підзадачі для відмічання `[x]`.
> Кожен етап завершено, коли позначено всі підзадачі **і** його **DoD**.

## Прогрес по етапах
- [ ] M0 — Підготовка проєкту
- [ ] M1 — Дані: міграції, моделі, зв'язки, фабрики, сідери
- [ ] M2 — Публічний каталог: контролери, Resources, фільтри, кеш
- [ ] M3 — Автентифікація (Sanctum) + користувачі
- [ ] M4 — Авторизація: ролі та політики
- [ ] M5 — Валідація та Form Requests
- [ ] M6 — Завантаження файлів
- [ ] M7 — Оформлення замовлення: транзакції + бізнес-логіка
- [ ] M8 — Події, слухачі, нотифікації, черги
- [ ] M9 — Відгуки + (bonus) поліморфізм
- [ ] M10 — Обробка помилок та консистентність API
- [ ] M11 — Тестування (Pest: Feature + Unit)
- [ ] M12 — Vue 3 SPA (фронтенд)
- [ ] M13 — Документація, CORS, фінал, деплой

---

## M0 — Підготовка проєкту · ~0.5 дня
- [ ] `composer create-project laravel/laravel server` (Laravel 13), `git init`, `.gitignore`
- [ ] `.env`: SQLite, створено `database/database.sqlite`
- [ ] Pint + health-route `GET /api/v1/ping`
- [ ] Версіонований route group (`prefix('v1')`), `routes/api.php`
- [ ] `client/`: Vite (Vue + TS) + Pinia + Vue Router + Tailwind + axios
- [ ] **DoD:** `php artisan serve` та `npm run dev` стартують; `/api/v1/ping` → JSON

## M1 — Дані · ~2-3 дні
- [ ] Міграції всіх таблиць: типи, FK (`constrained`/`cascadeOnDelete`), індекси, `unique` (slug), `enum`/`string` (role, status), `softDeletes` (products), composite unique (reviews, product_tag)
- [ ] Моделі + усі зв'язки: `hasOne` (1:1), `belongsTo`/`hasMany`, `belongsToMany` (Tag), `withPivot('quantity','unit_price')` (Order↔Product)
- [ ] `$fillable`, `$casts`, accessor `price` (копійки→формат), `User::isAdmin()`
- [ ] Factories для всіх моделей
- [ ] `DatabaseSeeder`: ~5 категорій, ~30 товарів, теги, admin+customer, замовлення/відгуки
- [ ] Перевірка зв'язків у Tinker (в обидва боки, pivot)
- [ ] **DoD:** `migrate:fresh --seed` без помилок; усі зв'язки резолвляться в Tinker

## M2 — Публічний каталог · ~2-3 дні
- [ ] Resource-контролери (`ProductController`, `CategoryController`)
- [ ] `ProductResource`/`CategoryResource` із `whenLoaded()`
- [ ] Eager loading (`with()`) — прибрано N+1 (перевірено через `DB::listen`/Telescope)
- [ ] Scopes + фільтри (`category`,`tag`,`price_min/max`), пошук `q`, сортування `sort`
- [ ] Пагінація (`paginate`)
- [ ] Кеш категорій/featured + інвалідація
- [ ] **DoD:** `GET /products?...&page=2` — пагінований JSON без N+1; категорії з кешу

## M3 — Автентифікація (Sanctum) · ~1-2 дні
- [ ] Sanctum SPA cookie auth (`csrf-cookie`, `login`, `auth:sanctum`)
- [ ] `register` / `logout` / `GET /me`; хешування паролів
- [ ] Профіль (1:1): `GET`/`PUT /profile`
- [ ] Throttle на `login`/`register`
- [ ] **DoD:** логін зі SPA працює; захищені роути без сесії → 401

## M4 — Авторизація · ~2 дні
- [ ] Ролі customer/admin (+ `isAdmin()`)
- [ ] Policies: Product/Category/Tag (admin), Review (owner), Order (owner)
- [ ] `authorize()` / `can:` middleware; route model binding
- [ ] Кастомний middleware (`EnsureUserIsAdmin`/`ForceJsonResponse`)
- [ ] Admin-CRUD товарів/категорій/тегів
- [ ] **DoD:** customer → 403 на admin-операціях; admin проходить; owner керує лише своїм

## M5 — Валідація та Form Requests · ~1-2 дні
- [ ] Form Requests на всі записи (`Store*`/`Update*`)
- [ ] Правила: `required`/`unique`/`exists`/`min/max`/`sometimes` + кастомне правило
- [ ] `authorize()` всередині Form Request
- [ ] Локалізовані повідомлення (українською) через `messages()`
- [ ] Валідація зображень (`image`/`mimes`/`max`)
- [ ] **DoD:** невалідні запити → 422 з консистентною структурою; повідомлення українською

## M6 — Завантаження файлів · ~1 день
- [ ] `POST /products/{id}/images` → диск `public`, URL, `storage:link`
- [ ] Кілька зображень на товар (1:N), `is_featured`
- [ ] Видалення файлу при видаленні моделі (model event/observer)
- [ ] Валідація завантажень
- [ ] **DoD:** зображення доступне за URL; видалення прибирає файл із диска

## M7 — Оформлення замовлення (транзакції) · ~2-3 дні ⭐
- [ ] `POST /orders` приймає `items[{product_id, quantity}]`
- [ ] Логіка у service/action класі (тонкий контролер)
- [ ] `DB::transaction()` + `lockForUpdate`: перевірка stock, суми на сервері, створення Order+OrderItems (снепшот `unit_price`), списання stock
- [ ] Нестача → `InsufficientStockException` → 422 (відкат, без часткового запису)
- [ ] Service container/DI: `PaymentGateway` → `FakePaymentGateway`, binding у `AppServiceProvider`
- [ ] Статуси замовлення; `GET /orders`, `GET /orders/{id}` (policy)
- [ ] **DoD:** замовлення атомарно списує stock; нестача → 422 без часткового запису; суми лише на сервері

## M8 — Події, нотифікації, черги · ~2 дні
- [ ] Event `OrderPlaced` (після checkout)
- [ ] Listener → `OrderConfirmation` Notification (канали mail + database)
- [ ] `ShouldQueue`; `QUEUE_CONNECTION=database`; `queue:work`
- [ ] Один queued Job
- [ ] Artisan-команда `shop:low-stock-report`
- [ ] Обробка `failed_jobs`
- [ ] **DoD:** нотифікація йде в чергу й обробляється воркером; запис у `notifications`; команда працює

## M9 — Відгуки + (bonus) поліморфізм · ~1-2 дні
- [ ] Відгук лише від покупця товару (перевірка по `order_items`)
- [ ] Один відгук на товар (composite unique) → повтор = 422
- [ ] `rating` 1-5 + `comment`; `ReviewPolicy` (owner)
- [ ] Середній рейтинг (`withAvg`/accessor) у каталозі
- [ ] **Bonus:** поліморфні зображення/коментарі (`morphMany`)
- [ ] **DoD:** не-покупець → 403/422; повтор → 422; рейтинг у `GET /products`

## M10 — Обробка помилок · ~1 день
- [ ] Глобальна обробка → JSON: 404/422/401/403/500
- [ ] Єдиний envelope помилки
- [ ] Власні exceptions із коректним статусом
- [ ] Логування (`Log::error`)
- [ ] **DoD:** усі помилки → консистентний JSON із правильним кодом (не HTML)

## M11 — Тестування (Pest) · ~2-3 дні
- [ ] Feature-тести: auth, products CRUD з ролями, checkout (успіх+нестача+цілісність), reviews-правила
- [ ] `RefreshDatabase` + factories + `Sanctum::actingAs`
- [ ] Unit-тести `OrderService` (суми, списання, виняток)
- [ ] `php artisan test` / `pest` — зелено
- [ ] **DoD:** тести проходять; покривають happy-path + помилки + авторизацію

## M12 — Vue 3 SPA · ~3-4 дні
- [ ] axios-instance (`baseURL` з `VITE_`, `withCredentials`, interceptor CSRF/401)
- [ ] Pinia `authStore`; route guards (`requiresAuth`/`requiresAdmin`)
- [ ] Сторінки: каталог (фільтри+пошук+пагінація), товар (+відгуки), кошик, checkout, мої замовлення+деталі, login/register, profile, admin-CRUD товарів
- [ ] Loading/error-стани; мапінг 422 на форму; composables (`useProducts`/`useCart`)
- [ ] **DoD:** наскрізний флоу: register → каталог → кошик → checkout (stock↓) → мої замовлення → відгук; admin → CRUD товару із зображенням

## M13 — Документація, CORS, деплой · ~1 день
- [ ] README бекенду + `.env.example`
- [ ] API-документація (таблиця ендпоінтів або Scribe)
- [ ] CORS під origin SPA (`config/cors.php`, `SANCTUM_STATEFUL_DOMAINS`)
- [ ] `config:cache`/`route:cache`; чекліст деплою
- [ ] (Опційно) тести в CI
- [ ] **DoD:** новий розробник піднімає проєкт за README; CORS дозволяє SPA; API задокументовано

---

## Фінальна перевірка (приймання)
- [ ] `php artisan migrate:fresh --seed` → БД наповнена
- [ ] `php artisan test` → усі зелені
- [ ] `queue:work` запущено; після замовлення є запис у `notifications`
- [ ] SPA-флоу в браузері: register → каталог (фільтр+пошук) → кошик → checkout (залишок↓) → мої замовлення → відгук; admin → CRUD товару із зображенням
- [ ] Помилки: форма→422, чужий ресурс→403, неіснуючий→404, без auth→401

---

## Інтерв'ю self-check (готовність до співбесіди)
- [ ] PHP/ООП: масиви vs JS, інтерфейси/трейти, типізація
- [ ] Laravel core: lifecycle, service container/DI, providers, facades, `.env` vs config
- [ ] Роутинг/middleware: resource-роути, route model binding, порядок middleware
- [ ] Eloquent: типи зв'язків, pivot (`withPivot`/`sync`), mass assignment, casts/accessors, scopes, soft deletes
- [ ] Продуктивність: N+1 і `with()`, `with` vs `load`, `withCount/withAvg`, кеш
- [ ] Валідація: Form Request, `unique` vs `exists`, формат 422
- [ ] Auth: Sanctum (cookie vs token), CSRF, хешування, `auth:sanctum`
- [ ] Авторизація: Policy vs Gate, RBAC, authn vs authz
- [ ] Дані: транзакція/ACID, race condition (`lockForUpdate`), гроші в копійках
- [ ] Async: events/listeners/observers, черги, `ShouldQueue`, failed jobs, нотифікації
- [ ] API/HTTP: коди 200/201/204/400/401/403/404/422/500, Resources, версіонування, CORS
- [ ] Файли/помилки: disks, `storage:link`, валідація завантажень, JSON-помилки
- [ ] Тестування: Feature vs Unit, `RefreshDatabase`, `Sanctum::actingAs`, мокінг
- [ ] Vue/фулстек: Sanctum-логін зі SPA, axios-interceptors, route guards, Pinia, пагінація
