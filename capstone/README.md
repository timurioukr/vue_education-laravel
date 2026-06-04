# Капстон-проєкт: «Крамничка» (MiniShop) — Laravel 13 API + Vue 3 SPA

> **Що це.** Фінальне практичне завдання після проходження курсу. Ти будуєш **з нуля** повноцінний фулстек-проєкт — міні-магазин — у **новому домені**, відмінному від навчального Task Manager.
>
> **Навіщо.** Task Manager ти будував «за вказівками». Тут немає готових рішень — лише вимоги. Доведеться *згадувати й застосовувати*, а не копіювати. Пройшовши всі етапи, ти закриєш **базіс для співбесіди на джуніор Laravel-розробника** (фулстек Vue + Laravel).
>
> **Як працювати.** Іди етапами M0 → M13 послідовно. Кожен етап має чекліст підзадач, **Definition of Done** (коли етап вважається завершеним), теми «на співбесіді спитають» і посилання на уроки курсу для повторення теорії. Код пиши англійською, сам — не копіюй з Task Manager.

---

## Передумови

Ти вже пройшов курс і знаєш базу: PHP/ООП, роутинг, міграції, Eloquent + зв'язки, валідація, API Resources, Sanctum, policies, middleware, file storage, події/черги, тести (Pest), інтеграція Vue SPA. Якщо щось забулося — у кожному етапі є лінк на потрібний урок.

## Що ти побудуєш

REST API інтернет-крамнички + Vue 3 SPA, що його споживає. Можливості:

- Каталог товарів: категорії, теги, зображення, фільтри, пошук, сортування, пагінація.
- Реєстрація/логін (Sanctum), профіль користувача, ролі **customer / admin**.
- Кошик (на боці SPA) і **оформлення замовлення** зі списанням залишків в одній транзакції.
- Відгуки на товари (лише від тих, хто купив).
- Адмінка через API: CRUD товарів/категорій/тегів, завантаження зображень, зміна статусу замовлень.
- Події/нотифікації/черги (підтвердження замовлення), кеш каталогу, уніфіковані помилки, тести, документація.

## Технічний стек

| Шар | Технології |
|---|---|
| Backend | PHP 8.3, **Laravel 13**, SQLite (dev), Sanctum, Pest, Pint |
| Frontend | **Vue 3** (`<script setup>` + TS), Vite, Pinia, Vue Router, Tailwind, axios |
| API | REST, JSON, префікс `/api/v1`, Sanctum SPA cookie auth |

## Структура репозиторію

Рекомендовано — монорепо в межах `capstone/`:

```
capstone/
  README.md     ← цей документ (завдання)
  server/       ← Laravel 13 API   (створюєш ти)
  client/       ← Vue 3 SPA         (створюєш ти)
```

> **Дисципліна Git (теж питають на співбесіді).** Працюй гілками: `git checkout -b m1-data`, комміть змістовними порціями, мерж у `main` після кожного етапу. Один етап ≈ одна логічна гілка.

---

## Доменна модель

```
User 1───1 Profile
User 1───∞ Order 1───∞ OrderItem ∞───1 Product
User 1───∞ Review ∞───1 Product
Category 1───∞ Product ∞───∞ Tag        (pivot: product_tag)
Product 1───∞ ProductImage
Order ∞───∞ Product  через order_items  (withPivot: quantity, unit_price)
Category 1───∞ Category                 (self-ref, bonus)
```

| Таблиця | Ключові поля | Зв'язки |
|---|---|---|
| `users` | `+ role` enum(`customer`\|`admin`) | hasOne Profile; hasMany Orders, Reviews |
| `profiles` | `user_id` (unique), phone, address, city | belongsTo User — **1:1** |
| `categories` | name, `slug` (unique), `parent_id` (nullable) | hasMany Products; self-ref (**bonus**) |
| `products` | `category_id`, name, `slug` (unique), description, **`price` (integer, копійки)**, `stock`, `is_active`, **softDeletes** | belongsTo Category (**1:N**); belongsToMany Tags (**N:N**); hasMany Images, Reviews, OrderItems |
| `tags` | name, `slug` | belongsToMany Products (**N:N**, pivot `product_tag`) |
| `product_images` | `product_id`, `path`, `is_featured` | belongsTo Product (**1:N**, файли) |
| `orders` | `user_id`, `status` enum, **`total` (копійки)**, shipping-снепшот (name/address/phone) | belongsTo User; hasMany OrderItems |
| `order_items` | `order_id`, `product_id`, `quantity`, **`unit_price` (копійки, снепшот)** | **N:N-with-pivot-data** Order↔Product |
| `reviews` | `user_id`, `product_id`, `rating` (1-5), comment; **unique(`user_id`,`product_id`)** | belongsTo User, Product |

> **Гроші — лише ціле число (копійки), ніколи `float`.** Класичне питання на співбесіді: чому `0.1 + 0.2 != 0.3`. Зберігай `price`/`total` як `integer` (копійки), а форматуй через accessor (`12345 → "123,45 ₴"`).
>
> **Vue-паралель:** доменна модель тут — як нормалізований Pinia-стейт, але збережений у БД із зовнішніми ключами замість `id`-посилань в об'єктах.

## Карта API (`/api/v1`)

| Метод | Шлях | Доступ | Призначення |
|---|---|---|---|
| GET | `/ping` | public | health-check |
| GET | `/products` | public | каталог: фільтри `category`,`tag`,`price_min`,`price_max`,`q`,`sort`; пагінація |
| GET | `/products/{slug}` | public | один товар + зв'язки |
| GET | `/products/{slug}/reviews` | public | відгуки товару |
| GET | `/categories` | public | список категорій (кеш) |
| GET | `/categories/{slug}` | public | категорія + товари |
| POST | `/register` `/login` `/logout` | public/auth | автентифікація |
| GET | `/me` | auth | поточний користувач |
| GET / PUT | `/profile` | auth | профіль (1:1) |
| POST | `/orders` | auth | оформлення замовлення (транзакція) |
| GET | `/orders` | auth | мої замовлення |
| GET | `/orders/{id}` | auth (owner) | деталі замовлення |
| POST | `/products/{slug}/reviews` | auth (покупець) | додати відгук |
| PUT / DELETE | `/reviews/{id}` | auth (owner) | редагувати/видалити відгук |
| POST/PUT/DELETE | `/products` `/categories` `/tags` | **admin** | CRUD каталогу |
| POST | `/products/{id}/images` | **admin** | завантажити зображення |
| DELETE | `/images/{id}` | **admin** | видалити зображення |
| PUT | `/orders/{id}/status` | **admin** | змінити статус |

---

# Етапи

Орієнтовний час — part-time. Познач `[x]`, коли підзадача готова.

## M0 — Підготовка проєкту · ~0.5 дня

Підняти каркас бекенду та фронтенду.

**Підзадачі**
- [ ] `composer create-project laravel/laravel server` (Laravel 13), `git init`, `.gitignore`.
- [ ] `.env`: `DB_CONNECTION=sqlite`, створити `database/database.sqlite`.
- [ ] Налаштувати Pint (`./vendor/bin/pint`), додати health-route `GET /api/v1/ping` → `{"status":"ok"}`.
- [ ] Винести API у версіонований group (`Route::prefix('v1')`), окремий файл `routes/api.php`.
- [ ] `client/`: `npm create vite@latest` (Vue + TS), додати Pinia, Vue Router, Tailwind, axios.

**Definition of Done**
- `php artisan serve` та `npm run dev` стартують без помилок; `GET /api/v1/ping` повертає JSON.

**Уроки:** [03-installation-and-structure](../lessons/week-1-php-and-laravel-basics/03-installation-and-structure.md), [01-php-syntax](../lessons/week-1-php-and-laravel-basics/01-php-syntax-for-js-devs.md), [02-php-oop-namespaces](../lessons/week-1-php-and-laravel-basics/02-php-oop-namespaces.md)

**На співбесіді спитають:** структура Laravel-проєкту; що таке Composer і PSR-4 autoload (аналог `package.json` + ESM); навіщо `.env` і `config/`; що робить `artisan`; як версіонувати API.

---

## M1 — Дані: міграції, моделі, зв'язки, фабрики, сідери · ~2-3 дні

Це фундамент. Спочатку схема, потім моделі, потім дані.

**Підзадачі**
- [ ] Міграції для всіх таблиць із розділу «Доменна модель»: типи, `nullable`, `default`, **foreign keys** (`constrained()`, `cascadeOnDelete`), **індекси** (`unique` на slug, індекси на `category_id`/`user_id`), `enum`/`string` для `role` та `status`, `softDeletes()` на `products`, **composite unique** на `reviews(user_id, product_id)` та `product_tag(product_id, tag_id)`.
- [ ] Моделі + **усі зв'язки**: `hasOne` (Profile — 1:1), `belongsTo`/`hasMany` (Category↔Product, User↔Order, Order↔OrderItem), `belongsToMany` (Product↔Tag), `belongsToMany ...->withPivot('quantity','unit_price')` (Order↔Product).
- [ ] `$fillable`, `$casts` (наприклад `is_active => bool`), accessor для `price` (копійки → формат), `User::isAdmin()`.
- [ ] Factories для кожної моделі (`fake()` дані, зв'язки через `for()`/`has()`).
- [ ] `DatabaseSeeder`: ~5 категорій, ~30 товарів, теги, по 1 користувачу `admin` та `customer`, кілька замовлень і відгуків.
- [ ] Перевірити в Tinker: `Product::with('category','tags','images')->first()`, `$user->orders`, `$order->products` з pivot.

**Definition of Done**
- `php artisan migrate:fresh --seed` наповнює БД без помилок; усі зв'язки резолвляться в обидва боки в Tinker.

> **Підказка щодо 1:1 і pivot-даних:** урок 7 показує `hasMany`/`belongsTo`/`belongsToMany`. `hasOne` (Profile) і додаткові колонки в pivot (`order_items.quantity`, `unit_price`) — та сама механіка, лише трохи ширше: пошукай `hasOne` та `withPivot` у документації.

**Уроки:** [05-migrations-and-schema](../lessons/week-1-php-and-laravel-basics/05-migrations-and-schema.md), [06-eloquent-models](../lessons/week-1-php-and-laravel-basics/06-eloquent-models.md), [07-eloquent-relationships](../lessons/week-2-api-building/07-eloquent-relationships.md), [11-seeders-and-factories](../lessons/week-2-api-building/11-seeders-and-factories.md) · довідник: [eloquent-cheatsheet](../cheatsheets/eloquent-cheatsheet.md)

**На співбесіді спитають:** навіщо міграції (версіонування БД); різниця `hasMany`/`belongsTo`/`belongsToMany`; як зберегти дані в pivot; що таке mass assignment і `$fillable`/`$guarded`; навіщо індекси та foreign keys; що таке casts/accessors; factory vs seeder.

---

## M2 — Публічний каталог: контролери, Resources, фільтри, кеш · ~2-3 дні

Read-only публічна частина API. Тут «закривається» тема продуктивності.

**Підзадачі**
- [ ] Resource-контролери для каталогу (`ProductController@index/show`, `CategoryController`).
- [ ] `ProductResource`/`CategoryResource` із `whenLoaded()` для зв'язків; не віддавати зайвого.
- [ ] **Eager loading** (`with()`) — прибрати проблему **N+1** (перевір через `DB::listen` або Telescope/Debugbar).
- [ ] Query scopes + фільтрація: `?category=`, `?tag=`, `?price_min=&price_max=`, пошук `?q=` (за name), сортування `?sort=price|-price|newest`.
- [ ] Пагінація (`paginate()`), коректний JSON-формат meta/links.
- [ ] Кешувати список категорій / featured-товари (`Cache::remember`), інвалідувати кеш при зміні (зв'язати з M4).

**Definition of Done**
- `GET /api/v1/products?category=...&q=...&sort=-price&page=2` повертає пагінований JSON без N+1; категорії віддаються з кешу.

> **Vue-паралель:** API Resource — це шар трансформації, як `computed`/serializer перед віддачею даних у компонент. Пагінація — те, що ти споживаєш на фронті як `data` + `meta.current_page`.

**Уроки:** [04-routing-and-controllers](../lessons/week-1-php-and-laravel-basics/04-routing-and-controllers.md), [09-api-resources](../lessons/week-2-api-building/09-api-resources.md), [12-scopes-filtering-sorting](../lessons/week-2-api-building/12-scopes-filtering-sorting.md), [21-performance-optimization](../lessons/week-4-testing-and-integration/21-performance-optimization.md)

**На співбесіді спитають:** що таке **проблема N+1** і як її ловити/чинити; навіщо API Resources; різниця `with()` vs `load()`; як працює пагінація; query scopes; коли і що кешувати, як інвалідувати.

---

## M3 — Автентифікація (Sanctum) + користувачі · ~1-2 дні

**Підзадачі**
- [ ] Sanctum **SPA cookie auth** (основний шлях): `GET /sanctum/csrf-cookie`, `POST /login`, сесійна автентифікація через `auth:sanctum`.
- [ ] `register` / `logout` / `GET /me`; хешування паролів (`Hash::make`).
- [ ] Профіль (1:1): `GET /profile`, `PUT /profile` (телефон/адреса).
- [ ] Throttle (rate limiting) на `login`/`register`.

**Definition of Done**
- Повний цикл логіну зі SPA працює (cookie + CSRF); захищені роути без сесії → **401**.

**Уроки:** [13-sanctum-authentication](../lessons/week-3-auth-and-advanced/13-sanctum-authentication.md)

**На співбесіді спитають:** як працює Sanctum (SPA cookie vs API token); навіщо CSRF для SPA; чому паролі хешуються, а не шифруються; що робить `auth:sanctum` middleware; rate limiting.

---

## M4 — Авторизація: ролі та політики · ~2 дні

**Підзадачі**
- [ ] Ролі `customer`/`admin` (поле + `isAdmin()`).
- [ ] Policies: `ProductPolicy`/`CategoryPolicy`/`TagPolicy` (запис лише admin), `ReviewPolicy` (власник редагує/видаляє), `OrderPolicy` (бачить лише свої).
- [ ] Застосувати `$this->authorize()` у контролерах та/або `can:` middleware на роутах; **route model binding** (за `slug`/`id`).
- [ ] Кастомний middleware (наприклад `EnsureUserIsAdmin` або `ForceJsonResponse`).
- [ ] Admin-CRUD товарів/категорій/тегів (форми валідації — у M5).

**Definition of Done**
- `customer` отримує **403** на admin-операціях; `admin` проходить; власник керує лише своїми reviews/orders.

**Уроки:** [14-authorization-policies](../lessons/week-3-auth-and-advanced/14-authorization-policies.md), [15-middleware](../lessons/week-3-auth-and-advanced/15-middleware.md)

**На співбесіді спитають:** різниця між **Policy і Gate**; authentication vs authorization; як реалізувати RBAC; що таке middleware і порядок його виконання; route model binding.

---

## M5 — Валідація та Form Requests · ~1-2 дні

**Підзадачі**
- [ ] Form Requests на всі записи (`StoreProductRequest`, `UpdateProductRequest`, `StoreReviewRequest`, ...).
- [ ] Правила: `required`, `unique`, `exists`, `min/max`, умовні (`sometimes`), кастомне правило (наприклад валідний slug).
- [ ] `authorize()` всередині Form Request (хто може слати запит).
- [ ] **Локалізовані повідомлення** про помилки (українською) через `messages()`.
- [ ] Валідація завантаження зображень (`image`, `mimes`, `max`).

**Definition of Done**
- Невалідні запити → **422** з консистентною структурою `{ "message": ..., "errors": {...} }`; повідомлення українською.

> **Vue-паралель:** структура `errors` з 422 — це саме те, що ти мапиш на поля форми у Vue (`errors.email[0]`).

**Уроки:** [08-validation-form-requests](../lessons/week-2-api-building/08-validation-form-requests.md)

**На співбесіді спитають:** навіщо виносити валідацію у Form Request; різниця `unique` vs `exists`; як виглядає 422; де валідація, а де бізнес-правила; кастомні правила.

---

## M6 — Завантаження файлів (зображення товарів) · ~1 день

**Підзадачі**
- [ ] `POST /products/{id}/images`: зберегти на диск `public`, повернути URL (`Storage::url`), `storage:link`.
- [ ] Кілька зображень на товар (1:N), позначка `is_featured`.
- [ ] Видалення файлу при видаленні зображення/товару (model event `deleting` / observer).
- [ ] Валідація завантажень (тип/розмір) — з M5.

**Definition of Done**
- Завантажене зображення доступне за URL; видалення товару/зображення прибирає файл із диска.

**Уроки:** [16-file-uploads](../lessons/week-3-auth-and-advanced/16-file-uploads.md)

**На співбесіді спитають:** що таке filesystem disks (`local`/`public`/`s3`); навіщо `storage:link`; як валідувати завантаження; model events/observers.

---

## M7 — Оформлення замовлення: транзакції + бізнес-логіка · ~2-3 дні

⭐ **Ключовий етап для співбесіди.** Тут — транзакції, цілісність даних і архітектура.

**Підзадачі**
- [ ] `POST /orders` приймає `items: [{product_id, quantity}]`.
- [ ] Винести логіку в **service/action клас** (`CheckoutAction`/`OrderService`) — контролер лишається тонким.
- [ ] У `DB::transaction()`: перевірити наявність `stock` (з блокуванням рядка, `lockForUpdate`), порахувати суми **на сервері** (ніколи не довіряй ціні з клієнта), створити `Order` + `OrderItem`-и (з `unit_price`-снепшотом), **списати** `stock`.
- [ ] Нестача товару → кастомний `InsufficientStockException` → **422** (транзакція відкочується, часткового запису немає).
- [ ] **Service container / DI:** інтерфейс `PaymentGateway` + реалізація `FakePaymentGateway`, прив'язати в `AppServiceProvider`, інжектити у сервіс через конструктор.
- [ ] Статуси замовлення (`pending`→`paid`→`shipped`...); `GET /orders`, `GET /orders/{id}` (за `OrderPolicy`).

**Definition of Done**
- Замовлення з достатнім stock проходить і **атомарно** зменшує залишки; нестача → 422 **без** часткового запису; суми рахуються лише на сервері.

> **Чому транзакція.** Якщо між «перевірив stock» і «списав stock» вклинеться інший запит — отримаєш оверселл. `DB::transaction` + `lockForUpdate` це унеможливлюють. Покажи це на співбесіді — і ти вже вище за середнього джуна.

**Уроки:** [07-eloquent-relationships](../lessons/week-2-api-building/07-eloquent-relationships.md), [06-eloquent-models](../lessons/week-1-php-and-laravel-basics/06-eloquent-models.md), [10-error-handling](../lessons/week-2-api-building/10-error-handling.md) · *(транзакції та service container — поглиблення поза уроками, шукай у документації Laravel)*

**На співбесіді спитають:** що таке **DB-транзакція** і ACID; як уникнути race condition/оверселлу (`lockForUpdate`); навіщо service/action-класи (тонкі контролери); що таке **service container, DI та binding інтерфейсу**; навіщо снепшот ціни в `order_items`.

---

## M8 — Події, слухачі, нотифікації, черги · ~2 дні

**Підзадачі**
- [ ] Event `OrderPlaced` (диспатчиться після успішного checkout).
- [ ] Listener шле `OrderConfirmation` Notification, канали **mail** + **database**.
- [ ] Зробити listener/notification `ShouldQueue`; `QUEUE_CONNECTION=database`, таблиця jobs, `php artisan queue:work`.
- [ ] Один queued Job (наприклад `RecalculateProductPopularity` або генерація «інвойсу»).
- [ ] Кастомна artisan-команда: `php artisan shop:low-stock-report` (товари з низьким залишком).
- [ ] Обробка `failed_jobs`.

**Definition of Done**
- Після замовлення нотифікація потрапляє в чергу й обробляється воркером; з'являється запис у `notifications`; команда `shop:low-stock-report` працює.

> **Vue-паралель:** event/listener — як emit події в одному місці й підписка в іншому; черга — як винести важку роботу у Web Worker, щоб не блокувати «основний потік» (HTTP-відповідь).

**Уроки:** [17-events-and-notifications](../lessons/week-3-auth-and-advanced/17-events-and-notifications.md), [18-queues-and-scheduling](../lessons/week-3-auth-and-advanced/18-queues-and-scheduling.md) · довідник: [artisan-commands](../cheatsheets/artisan-commands.md)

**На співбесіді спитають:** різниця events/listeners vs observers; навіщо черги (sync vs async); що таке `ShouldQueue` і `queue:work`; канали нотифікацій; що робити з failed jobs; як написати artisan-команду.

---

## M9 — Відгуки + (bonus) поліморфізм · ~1-2 дні

**Підзадачі**
- [ ] Відгук може лишити **лише користувач, який купив** цей товар (бізнес-правило: перевірка наявності в його `order_items`).
- [ ] Один відгук на товар від користувача (composite `unique`) → повтор = 422.
- [ ] `rating` 1-5 + `comment`; `ReviewPolicy` (власник редагує/видаляє).
- [ ] Середній рейтинг товару в каталозі (`withAvg('reviews','rating')`/accessor).
- [ ] **Bonus:** зробити `product_images` (або окремі коментарі) **поліморфними** (`morphMany`), щоб зображення могли належати і Product, і Category.

**Definition of Done**
- Не-покупець → 403/422; повторний відгук → 422; середній рейтинг показується в `GET /products`.

**Уроки:** [07-eloquent-relationships](../lessons/week-2-api-building/07-eloquent-relationships.md), [14-authorization-policies](../lessons/week-3-auth-and-advanced/14-authorization-policies.md), [08-validation-form-requests](../lessons/week-2-api-building/08-validation-form-requests.md)

**На співбесіді спитають:** де бізнес-правило, а де валідація; навіщо composite unique; агрегати `withAvg`/`withCount`; (bonus) що таке поліморфні зв'язки і коли вони доречні.

---

## M10 — Обробка помилок та консистентність API · ~1 день

**Підзадачі**
- [ ] Глобальна обробка винятків → завжди JSON: `ModelNotFoundException`→404, валідація→422, `AuthenticationException`→401, авторизація→403, інше→500.
- [ ] Єдиний envelope помилки для всього API.
- [ ] Власні exceptions (наприклад `InsufficientStockException` із M7) із коректним статусом.
- [ ] Логування помилок (`Log::error`).

**Definition of Done**
- Усі помилкові сценарії повертають консистентний JSON із правильним HTTP-кодом (а не HTML-сторінку Laravel).

**Уроки:** [10-error-handling](../lessons/week-2-api-building/10-error-handling.md)

**На співбесіді спитають:** коди 200/201/204/400/401/403/404/422/500 — коли який; як зробити, щоб API завжди віддавав JSON; навіщо кастомні exceptions; навіщо логи.

---

## M11 — Тестування (Pest: Feature + Unit) · ~2-3 дні

**Підзадачі**
- [ ] Feature-тести (Pest) на групи: auth (register/login/me), products CRUD з перевіркою ролей (403 для customer), checkout (успіх + нестача stock + цілісність), reviews (правило «лише покупець», повтор=422).
- [ ] Використати `RefreshDatabase`, factories, `Sanctum::actingAs($user)`.
- [ ] Unit-тести на `OrderService` (підрахунок суми, списання stock, виняток при нестачі).
- [ ] `php artisan test` (або `./vendor/bin/pest`) — зелено.

**Definition of Done**
- Тести проходять; покривають happy-path, ключові помилки та авторизацію.

> **Vue-паралель:** Feature-тест Laravel — як e2e/integration-тест, що б'є по справжньому ендпоінту; Unit-тест — як тест окремого composable/функції.

**Уроки:** [19-pest-feature-testing](../lessons/week-4-testing-and-integration/19-pest-feature-testing.md), [20-unit-tests-and-mocking](../lessons/week-4-testing-and-integration/20-unit-tests-and-mocking.md)

**На співбесіді спитають:** різниця Feature vs Unit; що таке `RefreshDatabase`; як автентифікуватися в тестах (`Sanctum::actingAs`); навіщо factories в тестах; що таке мок і коли мокати; (основи) що таке TDD.

---

## M12 — Vue 3 SPA (фронтенд) · ~3-4 дні

**Підзадачі**
- [ ] axios-instance: `baseURL` із `VITE_API_URL`, `withCredentials`, interceptor для CSRF-cookie та обробки **401** (redirect на login).
- [ ] Pinia `authStore` (user, isAdmin, login/logout); **route guards** (`requiresAuth`, `requiresAdmin`).
- [ ] Сторінки: каталог (список + фільтри + пошук + пагінація), деталі товару (+ відгуки), кошик (Pinia), checkout (створення замовлення), «Мої замовлення» + деталі, login/register, profile, admin-CRUD товарів.
- [ ] Loading/error-стани; показ помилок валідації (мапінг `errors` з 422 на поля форми); виокремити логіку в composables (`useProducts`, `useCart`).

**Definition of Done** (наскрізний флоу в браузері)
- register → перегляд каталогу з фільтрами/пошуком → додати в кошик → checkout (stock зменшився) → «Мої замовлення» → лишити відгук; під `admin` — створити/редагувати/видалити товар із зображенням.

**Уроки:** [23-vue-spa-integration](../lessons/week-4-testing-and-integration/23-vue-spa-integration.md)

**На співбесіді спитають (фулстек):** як SPA автентифікується через Sanctum (cookie + CSRF); навіщо axios-interceptors; як споживати пагінований API; route guards; Pinia для глобального стану; де `VITE_`-змінні.

---

## M13 — Документація, CORS, фінал, деплой-чеклист · ~1 день

**Підзадачі**
- [ ] `README` бекенду (інструкція запуску з нуля), `.env.example`.
- [ ] API-документація: таблиця ендпоінтів у markdown **або** Scribe (автогенерація).
- [ ] CORS під origin SPA (`config/cors.php`, `SANCTUM_STATEFUL_DOMAINS`).
- [ ] `php artisan config:cache`/`route:cache`; чекліст деплою.
- [ ] (Опційно) прогнати тести в наявному CI (`.github/workflows`).

**Definition of Done**
- Новий розробник за README піднімає проєкт з нуля; CORS дозволяє SPA; API задокументовано.

**Уроки:** [22-cors-rate-limiting-versioning](../lessons/week-4-testing-and-integration/22-cors-rate-limiting-versioning.md), [24-deployment-and-next-steps](../lessons/week-4-testing-and-integration/24-deployment-and-next-steps.md)

**На співбесіді спитають:** що таке CORS і чому браузер блокує запит; навіщо `config:cache`; що потрібно зробити на деплої (migrate, env, queue worker, storage:link).

---

# Фінальна перевірка (приймання капстону)

Зроби ці кроки наприкінці — це твій «здавальний» smoke-test:

1. `php artisan migrate:fresh --seed` → БД наповнена демо-даними.
2. `php artisan test` → усі тести зелені.
3. Запущено `php artisan queue:work`; після оформлення замовлення з'явився запис у `notifications`.
4. У браузері (SPA): register → каталог із фільтром+пошуком → кошик → checkout (залишок зменшився) → «Мої замовлення» → відгук; під `admin` — створити/редагувати/видалити товар із зображенням.
5. Помилкові сценарії повертають правильні коди: невалідна форма → **422**, чужий ресурс → **403**, неіснуючий → **404**, без auth → **401**.

Якщо всі п'ять пунктів проходять — ти реалізував повний фулстек-проєкт і закрив джуніор-базіс.

---

# Додаток A — Інтерв'ю-чеклист (self-check)

Зможеш упевнено відповісти на це після капстону — готовий до співбесіди на джуна.

**PHP / ООП**
- [ ] Чим PHP-масив відрізняється від JS-об'єкта/масиву; що таке асоціативний масив.
- [ ] Інтерфейси, абстрактні класи, трейти — навіщо кожне.
- [ ] Типізація аргументів і повернень; `null`-safe оператор.

**Laravel core**
- [ ] Як HTTP-запит проходить через Laravel (lifecycle, middleware).
- [ ] Що таке service container, dependency injection, service provider, facade.
- [ ] Чим `.env` відрізняється від `config/`; навіщо `config:cache`.

**Роутинг / middleware**
- [ ] Resource-роути; route model binding; групи/префікси/іменовані роути.
- [ ] Що таке middleware, порядок виконання, як написати своє.

**Eloquent / зв'язки**
- [ ] `hasOne`/`hasMany`/`belongsTo`/`belongsToMany`/поліморфні — коли який.
- [ ] Як зберегти й прочитати дані з pivot (`withPivot`, `attach/sync`).
- [ ] Mass assignment, `$fillable`/`$guarded`, casts, accessors/mutators, scopes, soft deletes.

**Продуктивність**
- [ ] Що таке проблема **N+1**, як її виявити й виправити (`with()`).
- [ ] `with()` vs `load()`; `withCount`/`withAvg`; коли кешувати.

**Валідація**
- [ ] Навіщо Form Request; `unique` vs `exists`; формат 422; де валідація vs бізнес-правила.

**Auth / авторизація**
- [ ] Sanctum: SPA cookie vs API token; навіщо CSRF.
- [ ] Чому паролі хешуються; що таке `auth:sanctum`.
- [ ] Policy vs Gate; як зробити RBAC; authentication vs authorization.

**Дані / цілісність**
- [ ] Що таке транзакція й ACID; як уникнути race condition (`lockForUpdate`).
- [ ] Чому гроші — в копійках (integer), а не float.

**Async**
- [ ] Events/listeners/observers; коли потрібні черги; `ShouldQueue`; failed jobs; нотифікації.

**API / HTTP**
- [ ] Коди 200/201/204/400/401/403/404/422/500.
- [ ] Навіщо API Resources; як версіонувати API; що таке CORS.

**Файли / помилки**
- [ ] Filesystem disks; `storage:link`; валідація завантажень.
- [ ] Як зробити, щоб API завжди віддавав JSON-помилку.

**Тестування**
- [ ] Feature vs Unit; `RefreshDatabase`; `Sanctum::actingAs`; що і коли мокати.

**Vue / фулстек**
- [ ] Як SPA логіниться через Sanctum; axios-interceptors; route guards; Pinia; споживання пагінації.

# Додаток B — Матриця покриття тем

| Тема (джуніор-базіс) | Етап | Урок курсу |
|---|---|---|
| Структура проєкту, Composer, env | M0 | 03 |
| ООП PHP | M0–M1 | 01, 02 |
| Міграції, схема, індекси, FK | M1 | 05 |
| Eloquent CRUD, casts, accessors | M1 | 06 |
| Зв'язки (1:1, 1:N, N:N, pivot) | M1, M7, M9 | 07 |
| Factories / Seeders | M1 | 11 |
| Роутинг / контролери | M2, M4 | 04 |
| API Resources, пагінація | M2 | 09 |
| Scopes, фільтри, сортування | M2 | 12 |
| N+1, eager loading, кеш | M2 | 21 |
| Sanctum auth, throttle | M3 | 13 |
| Policies / Gates / RBAC | M4 | 14 |
| Middleware (вбудований + кастомний) | M0, M4 | 15 |
| Валідація / Form Requests | M5 | 08 |
| File storage / завантаження | M6 | 16 |
| Транзакції, service layer, DI/container | M7 | 06, 07 + докси |
| Events / Notifications | M8 | 17 |
| Queues / Jobs / Artisan commands | M8 | 18 |
| Бізнес-правила, агрегати, поліморфізм | M9 | 07, 14 |
| Обробка помилок, HTTP-коди | M10 | 10 |
| Тестування (Feature/Unit, Pest) | M11 | 19, 20 |
| CORS, версіонування, security | M13 | 22 |
| Vue SPA інтеграція | M12 | 23 |
| Деплой | M13 | 24 |

# Поза обсягом (свідомо)

Щоб не розпорошуватись: **реальні платежі** (лише `FakePaymentGateway`), пошук через ElasticSearch, мультивалютність, складна адмін-UI, мікросервіси. Self-ref категорії та поліморфізм — **bonus**, не блокують MVP.

# Що далі (після капстону)

Готові гачки для росту до middle: реальний платіжний шлюз, full-text search (Scout), Redis-кеш/черги, Docker, повноцінний CI/CD, OpenAPI-контракт, повторюваний SPA-стейт із SSR (Nuxt).
