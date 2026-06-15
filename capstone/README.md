# Капстон-проєкт: «DevBlog» — фулстек на Laravel 13 + Inertia.js + Vue 3

> **Що це.** Фінальне практичне завдання після проходження курсу. Ти будуєш **з нуля** повноцінний фулстек-проєкт — контент-платформу (блог) — у **новому домені**, відмінному від навчального Task Manager.
>
> **Навіщо.** Task Manager ти будував «за вказівками». Тут немає готових рішень — лише вимоги. Доведеться *згадувати й застосовувати*, а не копіювати. Пройшовши всі етапи, ти закриєш **базіс для співбесіди на джуніор Laravel-розробника** (фулстек Vue + Laravel).
>
> **Чому Inertia, а не SPA.** Курс вчив **decoupled**-підхід: окремий REST API (Sanctum) + окремий Vue SPA (axios). Тут — інша, не менш поширена архітектура: **моноліт на Inertia.js**. Один Laravel-застосунок, контролери віддають Vue-сторінки напряму, без окремого API і без токенів. Вміти пояснити **різницю двох підходів** — сильний козир на співбесіді (див. розділ «Inertia vs decoupled SPA»).
>
> **Як працювати.** Іди етапами M0 → M13 послідовно. Кожен етап має чекліст підзадач, **Definition of Done** (коли етап вважається завершеним), теми «на співбесіді спитають» і посилання на уроки курсу для повторення теорії. Код пиши англійською, сам — не копіюй з Task Manager.

---

## Передумови

Ти вже пройшов курс і знаєш базу: PHP/ООП, роутинг, міграції, Eloquent + зв'язки, валідація, авторизація (policies), middleware, file storage, події/черги, тести (Pest). Якщо щось забулося — у кожному етапі є лінк на потрібний урок.

**Нове порівняно з курсом** (даю з поясненням і посиланнями на офіційну документацію): **Inertia.js**, стартер **Laravel Breeze**, **Ziggy** (іменовані роути у JS), persistent layouts, shared props, partial reloads. Курс показував SPA+Sanctum — Inertia це інший спосіб з'єднати Laravel і Vue, і вивчити його самостійно за доками — теж навичка джуна.

## Що ти побудуєш

Контент-платформу «DevBlog»: автори пишуть статті, читачі коментують і лайкають, адмін модерує. Можливості:

- Публічна стрічка статей: категорії, теги, обкладинки, фільтри, пошук, сортування, пагінація.
- Реєстрація/логін (Breeze, сесії), профіль користувача, ролі **reader / author / admin**.
- Публікаційний воркфлоу: чернетка → публікація (атомарно, в одній транзакції), заплановані публікації.
- Коментарі з модерацією (тільки залогінені; автор/адмін схвалює), лайки (один на статтю).
- Дашборд автора (свої статті, статистика) + адмінка (модерація, керування категоріями/тегами).
- Завантаження зображень (обкладинки, аватари), події/нотифікації/черги (нова стаття, новий коментар), кеш, уніфіковані помилки, тести, документація.

## Технічний стек

| Шар | Технології |
|---|---|
| Backend | PHP 8.3, **Laravel 13**, SQLite (dev), Pest, Pint |
| Bridge | **Inertia.js v2** — контролери віддають `Inertia::render('Page', [...props])`, **без окремого REST API** |
| Frontend | **Vue 3** (`<script setup>` + TS), **Laravel Breeze (Inertia+Vue)**, Vite, Tailwind, **Ziggy** |
| Auth | **Сесійна** (Breeze) — НЕ токени/Sanctum SPA |

## Структура репозиторію

На відміну від decoupled-підходу з курсу (окремі `server/` + `client/`), Inertia — це **один застосунок**:

```
capstone/
  README.md     ← цей документ (завдання)
  CHECKLIST.md  ← трекер прогресу
  devblog/      ← єдиний Laravel-застосунок (створюєш ти)
    app/  routes/  database/  resources/js/Pages/  resources/js/Layouts/  ...
```

> **Дисципліна Git (теж питають на співбесіді).** Працюй гілками: `git checkout -b m1-data`, комміть змістовними порціями, мерж у `main` після кожного етапу. Один етап ≈ одна логічна гілка.

---

## Доменна модель

```
User 1───1 Profile                                  (1:1)
User 1───∞ Post (author)                            (1:N)
User 1───∞ Comment, Like                            (1:N)
Category 1───∞ Post                                 (1:N) + self-ref parent_id (bonus)
Post ∞───∞ Tag            через post_tag            (N:N)
Post 1───∞ Comment        (nested: parent_id — bonus)
Post 1───∞ Like           unique(user_id, post_id)
Collection ∞───∞ Post     через collection_post withPivot('note','position')   (N:N з даними)
Like / Comment → morphTo  (bonus: і на Post, і на Comment — поліморфізм)
```

| Таблиця | Ключові поля | Зв'язки |
|---|---|---|
| `users` | `+ role` enum(`reader`\|`author`\|`admin`) | hasOne Profile; hasMany Posts, Comments, Likes |
| `profiles` | `user_id` (unique), bio, avatar, website | belongsTo User — **1:1** |
| `categories` | name, `slug` (unique), `parent_id` (nullable) | hasMany Posts; self-ref (**bonus**) |
| `posts` | `user_id` (author), `category_id`, title, `slug` (unique), excerpt, body, **`status` enum(draft\|published\|archived)**, `published_at` (nullable), `cover_image`, `views` (integer), **softDeletes** | belongsTo User+Category (**1:N**); belongsToMany Tags (**N:N**); hasMany Comments, Likes |
| `tags` | name, `slug` | belongsToMany Posts (**N:N**, pivot `post_tag`) |
| `comments` | `user_id`, `post_id`, body, **`status` enum(pending\|approved)**, `parent_id` (nullable, nested — **bonus**) | belongsTo User, Post; self-ref (bonus) |
| `likes` | `user_id`, `post_id`; **unique(`user_id`,`post_id`)** | belongsTo User, Post |
| `collections` | `user_id`, name | belongsTo User; belongsToMany Posts |
| `collection_post` | `collection_id`, `post_id`, **`note`, `position`** | **N:N-with-pivot-data** Collection↔Post |

> **Снепшоти й цілісність.** `slug` — унікальний, генерується на сервері (ніколи не з клієнта). `published_at` ставиться **лише** в момент успішної публікації. `views`/лічильник лайків — оновлюй **атомарно** (`increment()`), а не «прочитав → +1 → зберіг».
>
> **Vue-паралель:** доменна модель тут — як нормалізований Pinia-стейт, але збережений у БД із зовнішніми ключами замість `id`-посилань в об'єктах.

## Карта роутів та Inertia-сторінок

В Inertia немає `/api/...` — контролер повертає **сторінку** (`Inertia::render`) або **redirect** (для форм). Колонка «Сторінка» — який Vue-компонент з `resources/js/Pages` рендериться.

| Метод | Шлях | Доступ | Сторінка / дія |
|---|---|---|---|
| GET | `/` | public | `Posts/Index` — стрічка: фільтри `category`,`tag`,`q`,`sort`; пагінація (props) |
| GET | `/posts/{post:slug}` | public | `Posts/Show` — стаття + коментарі + лайки |
| GET | `/categories/{category:slug}` | public | `Categories/Show` — статті категорії |
| GET | `/tags/{tag:slug}` | public | `Tags/Show` — статті за тегом |
| GET | `/register` `/login` | guest | Breeze-сторінки автентифікації |
| POST | `/register` `/login` `/logout` | guest/auth | Breeze: сесійний логін |
| GET / PATCH | `/profile` | auth | `Profile/Edit` — профіль (1:1), аватар |
| GET | `/dashboard` | auth (author) | `Dashboard/Index` — мої статті + статистика |
| GET | `/posts/create` | auth (author) | `Posts/Create` — форма (`useForm`) |
| POST | `/posts` | auth (author) | створити чернетку → redirect |
| GET | `/posts/{post:slug}/edit` | auth (owner) | `Posts/Edit` |
| PUT | `/posts/{post:slug}` | auth (owner) | оновити |
| POST | `/posts/{post:slug}/publish` | auth (owner) | **публікація (транзакція)** → redirect |
| DELETE | `/posts/{post:slug}` | auth (owner) | softDelete |
| POST | `/posts/{post:slug}/comments` | auth | додати коментар (статус `pending`) |
| POST | `/posts/{post:slug}/like` | auth | лайк/анлайк (toggle) |
| GET | `/admin/comments` | **admin** | `Admin/Comments` — модерація |
| PATCH | `/admin/comments/{comment}/approve` | **admin** | схвалити коментар |
| resource | `/admin/categories` `/admin/tags` | **admin** | CRUD категорій/тегів |

---

# Етапи

Орієнтовний час — part-time. Познач `[x]`, коли підзадача готова.

## M0 — Підготовка проєкту · ~0.5 дня

Підняти каркас Inertia-моноліту.

**Підзадачі**
- [ ] `composer create-project laravel/laravel devblog` (Laravel 13), `git init`, `.gitignore`.
- [ ] `.env`: `DB_CONNECTION=sqlite`, створити `database/database.sqlite`.
- [ ] Встановити **Breeze** зі стеком **Vue (Inertia)** + TypeScript: `composer require laravel/breeze --dev`, `php artisan breeze:install vue` (підтягне Inertia, Vite, Tailwind, Ziggy).
- [ ] Налаштувати Pint (`./vendor/bin/pint`); переконатись, що головна сторінка рендериться через `Inertia::render`.
- [ ] Розкласти роути по `routes/web.php`, прибрати дефолтні зайві.

**Definition of Done**
- `php artisan serve` + `npm run dev` стартують; `/` відкривається як Inertia-сторінка Vue; логін/реєстрація з Breeze працюють.

**Уроки:** [03-installation-and-structure](../lessons/week-1-php-and-laravel-basics/03-installation-and-structure.md), [01-php-syntax](../lessons/week-1-php-and-laravel-basics/01-php-syntax-for-js-devs.md), [02-php-oop-namespaces](../lessons/week-1-php-and-laravel-basics/02-php-oop-namespaces.md) · *(Inertia/Breeze — поза уроками: офіційні доки Inertia.js та Laravel Breeze)*

**На співбесіді спитають:** структура Laravel-проєкту; Composer і PSR-4 autoload (аналог `package.json` + ESM); навіщо `.env` і `config/`; що таке Inertia і чим відрізняється від SPA+API; що робить Breeze.

---

## M1 — Дані: міграції, моделі, зв'язки, фабрики, сідери · ~2-3 дні

Це фундамент. Спочатку схема, потім моделі, потім дані.

**Підзадачі**
- [ ] Міграції для всіх таблиць із розділу «Доменна модель»: типи, `nullable`, `default`, **foreign keys** (`constrained()`, `cascadeOnDelete`), **індекси** (`unique` на slug, індекси на `user_id`/`category_id`), `enum`/`string` для `role`/`status`, `softDeletes()` на `posts`, **composite unique** на `likes(user_id, post_id)` та `post_tag(post_id, tag_id)`.
- [ ] Моделі + **усі зв'язки**: `hasOne` (Profile — 1:1), `belongsTo`/`hasMany` (User↔Post, Category↔Post, Post↔Comment), `belongsToMany` (Post↔Tag), `belongsToMany ...->withPivot('note','position')` (Collection↔Post), self-ref `parent_id` (Category/Comment — bonus).
- [ ] `$fillable`, `$casts` (`status`, `published_at => datetime`, `is_...` => bool), accessor (наприклад `reading_time`), `User::isAuthor()/isAdmin()`.
- [ ] Factories для кожної моделі (`fake()` дані, зв'язки через `for()`/`has()`), стани (`->published()`, `->draft()`).
- [ ] `DatabaseSeeder`: ~5 категорій, ~20 тегів, ~30 статей (частина published), коментарі, лайки, по 1 користувачу `admin`/`author`/`reader`.
- [ ] Перевірити в Tinker: `Post::with('author','category','tags','comments')->first()`, `$user->posts`, pivot колекції.

**Definition of Done**
- `php artisan migrate:fresh --seed` наповнює БД без помилок; усі зв'язки резолвляться в обидва боки в Tinker.

> **Підказка щодо 1:1 і pivot-даних:** урок 7 показує `hasMany`/`belongsTo`/`belongsToMany`. `hasOne` (Profile) і додаткові колонки в pivot (`collection_post.note`, `position`) — та сама механіка, лише ширше: пошукай `hasOne` та `withPivot` у документації.

**Уроки:** [05-migrations-and-schema](../lessons/week-1-php-and-laravel-basics/05-migrations-and-schema.md), [06-eloquent-models](../lessons/week-1-php-and-laravel-basics/06-eloquent-models.md), [07-eloquent-relationships](../lessons/week-2-api-building/07-eloquent-relationships.md), [11-seeders-and-factories](../lessons/week-2-api-building/11-seeders-and-factories.md) · довідник: [eloquent-cheatsheet](../cheatsheets/eloquent-cheatsheet.md)

**На співбесіді спитають:** навіщо міграції; різниця `hasMany`/`belongsTo`/`belongsToMany`; як зберегти дані в pivot; mass assignment і `$fillable`/`$guarded`; навіщо індекси та foreign keys; casts/accessors; factory vs seeder.

---

## M2 — Публічний контент: контролери, Inertia-сторінки, фільтри, кеш · ~2-3 дні

Read-only публічна частина. Тут «закривається» тема продуктивності і вводиться **Inertia-рендеринг**.

**Підзадачі**
- [ ] Контролери стрічки/статті (`PostController@index/show`, `CategoryController`, `TagController`), що повертають `Inertia::render(...)` з props.
- [ ] **Шейпінг даних під props:** не віддавай Eloquent-модель «як є» — формуй явний масив полів (можна через `JsonResource::toArray`/DTO). Принцип той самий, що з API Resources: не лити зайвого/чутливого у props.
- [ ] **Eager loading** (`with()`) — прибрати **N+1** (перевір через `DB::listen`/Debugbar).
- [ ] Query scopes + фільтрація: `?category=`, `?tag=`, пошук `?q=` (за title), сортування `?sort=newest|popular`.
- [ ] Пагінація (`paginate()->withQueryString()`) — передати paginator у props (Inertia сам серіалізує `data` + `links`).
- [ ] Кешувати список категорій / популярні статті (`Cache::remember`), інвалідувати при зміні (зв'язати з M7).
- [ ] **Inertia-основи:** shared data (`HandleInertiaRequests`: auth-користувач, flash), `<Link>` замість `<a>`, **partial reloads** (`only`) для фільтрів.

**Definition of Done**
- `/?category=...&q=...&sort=popular&page=2` рендерить стрічку без N+1; фільтри працюють через partial reload; категорії з кешу.

> **Vue-паралель:** props сторінки Inertia — це як props компонента, тільки приходять із сервера на кожен перехід. Пагінація — Laravel-paginator, який ти споживаєш у Vue як `posts.data` + `posts.links`.

**Уроки:** [04-routing-and-controllers](../lessons/week-1-php-and-laravel-basics/04-routing-and-controllers.md), [09-api-resources](../lessons/week-2-api-building/09-api-resources.md) *(принцип шейпінгу — той самий, але під Inertia-props)*, [12-scopes-filtering-sorting](../lessons/week-2-api-building/12-scopes-filtering-sorting.md), [21-performance-optimization](../lessons/week-4-testing-and-integration/21-performance-optimization.md)

**На співбесіді спитають:** що таке **проблема N+1** і як її ловити/чинити; `with()` vs `load()`; як працює пагінація; query scopes; коли і що кешувати; як Inertia передає дані на фронт (props, shared data, partial reloads).

---

## M3 — Автентифікація (Breeze, сесії) + користувачі · ~1-2 дні

**Підзадачі**
- [ ] Розібрати, що згенерував Breeze: контролери `Auth/*`, сторінки `Pages/Auth/*`, middleware `auth`, `guest`, `verified`.
- [ ] Додати **роль** `reader|author|admin` (поле + `isAuthor()`/`isAdmin()`), кинути роль у shared props (щоб фронт знав, що показувати).
- [ ] Профіль (1:1): розширити Breeze `Profile/Edit` — bio, website (аватар у M6).
- [ ] Throttle (rate limiting) на `login`/`register` (Breeze має базовий — переконайся, що працює).

**Definition of Done**
- Реєстрація/логін/логаут працюють через сесію; гість на `/dashboard` → редірект на `/login`; роль доступна у Vue через `usePage().props.auth`.

**Уроки:** [13-sanctum-authentication](../lessons/week-3-auth-and-advanced/13-sanctum-authentication.md) *(порівняй: курс — Sanctum-токени для SPA; тут — сесійна auth Breeze для моноліту)*

**На співбесіді спитають:** різниця **сесійної auth (моноліт/Inertia) і токенів (Sanctum SPA)**; навіщо CSRF і як Inertia його шле; чому паролі хешуються, а не шифруються; що роблять middleware `auth`/`guest`; rate limiting.

---

## M4 — Авторизація: ролі та політики · ~2 дні

**Підзадачі**
- [ ] Ролі `reader`/`author`/`admin`.
- [ ] Policies: `PostPolicy` (редагує/публікує/видаляє лише автор або admin), `CommentPolicy` (модерує admin; видаляє власник/admin), `CategoryPolicy`/`TagPolicy` (керує лише admin).
- [ ] Застосувати `$this->authorize()` у контролерах та/або `can:` middleware на роутах; **route model binding** за `slug` (`{post:slug}`).
- [ ] Кастомний middleware (наприклад `EnsureUserIsAuthor` для зони `/dashboard`, `/posts/create`).
- [ ] Зона автора (`/dashboard`) і зона адміна (`/admin/*`) під відповідними middleware/policies.
- [ ] Прокинути дозволи у props там, де треба ховати кнопки на фронті (`can: { update: ..., delete: ... }`).

**Definition of Done**
- `reader` отримує **403** на створенні/публікації статті; чужу статтю не редагуєш; адмін-зона недоступна не-адміну; кнопки на фронті відповідають дозволам.

**Уроки:** [14-authorization-policies](../lessons/week-3-auth-and-advanced/14-authorization-policies.md), [15-middleware](../lessons/week-3-auth-and-advanced/15-middleware.md)

**На співбесіді спитають:** різниця **Policy і Gate**; authentication vs authorization; як реалізувати RBAC; що таке middleware і порядок виконання; route model binding; як ховати дії на фронті за дозволами без дублювання логіки.

---

## M5 — Валідація та Form Requests · ~1-2 дні

**Підзадачі**
- [ ] Form Requests на всі записи (`StorePostRequest`, `UpdatePostRequest`, `StoreCommentRequest`, `UpdateProfileRequest`, ...).
- [ ] Правила: `required`, `unique`, `exists`, `min/max`, умовні (`sometimes`), кастомне правило (валідний slug / заборонені слова в коментарі).
- [ ] `authorize()` всередині Form Request (хто може слати запит).
- [ ] **Локалізовані повідомлення** про помилки (українською) через `messages()`.
- [ ] **Inertia-обробка помилок:** помилки валідації автоматично шеряться у props (`errors`); на фронті — мапінг через `useForm().errors`. Показати редірект-назад із збереженням введеного (`old`/`useForm` лишає значення).

**Definition of Done**
- Невалідна форма → редірект назад із помилками в `errors`; на сторінці показуються повідомлення під полями (українською), введені дані не губляться.

> **Vue-паралель:** в SPA ти ловив 422 і мапив `errors.email[0]` вручну; в Inertia `useForm` робить це за тебе — помилки самі прилітають у `form.errors`.

**Уроки:** [08-validation-form-requests](../lessons/week-2-api-building/08-validation-form-requests.md)

**На співбесіді спитають:** навіщо Form Request; `unique` vs `exists`; де валідація, а де бізнес-правила; кастомні правила; як Inertia передає помилки валідації на фронт (vs 422 у REST).

---

## M6 — Завантаження файлів (обкладинки, аватари) · ~1 день

**Підзадачі**
- [ ] Завантаження `cover_image` для статті та `avatar` для профілю: диск `public`, `Storage::url`, `php artisan storage:link`.
- [ ] **Inertia-завантаження файлу:** `useForm` з `forceFormData`/multipart; прев'ю на фронті до сабміту.
- [ ] Видалення старого файлу при заміні; видалення файлу при видаленні моделі (model event `deleting`/observer).
- [ ] Валідація завантажень (`image`, `mimes`, `max`) — у Form Request з M5.

**Definition of Done**
- Завантажена обкладинка/аватар доступні за URL; заміна прибирає старий файл; видалення статті прибирає її обкладинку.

**Уроки:** [16-file-uploads](../lessons/week-3-auth-and-advanced/16-file-uploads.md)

**На співбесіді спитають:** filesystem disks (`local`/`public`/`s3`); навіщо `storage:link`; як валідувати завантаження; model events/observers; як відправити файл через Inertia (multipart).

---

## M7 — Публікація: транзакції + бізнес-логіка · ~2-3 дні

⭐ **Ключовий етап для співбесіди.** Тут — транзакції, цілісність даних і архітектура.

**Підзадачі**
- [ ] `POST /posts/{post:slug}/publish` переводить чернетку у `published`.
- [ ] Винести логіку в **service/action клас** (`PublishPostAction`) — контролер лишається тонким.
- [ ] У `DB::transaction()`: згенерувати **унікальний slug** (на сервері), `sync` тегів, прив'язати завантажену обкладинку, виставити `status=published` + `published_at=now()`, диспатчити подію `PostPublished`. Будь-яка помилка → відкат, часткового запису немає.
- [ ] Бізнес-правила: не можна опублікувати без title/body/категорії → кастомний `CannotPublishException` → редірект-назад із повідомленням.
- [ ] **Service container / DI:** інтерфейс `MarkdownRenderer` (або `SlugGenerator`) + реалізація, прив'язати в `AppServiceProvider`, інжектити у `PublishPostAction` через конструктор.
- [ ] **Атомарні лічильники:** `views`/лайки оновлюй через `increment()` (не read-modify-write).
- [ ] **Bonus (концепт locking):** featured-слоти на головній — адмін може «запінити» не більше N статей; одночасні запити не мають перевищити ліміт → `lockForUpdate` у транзакції (повний аналог «списання залишків» з e-commerce).

**Definition of Done**
- Публікація атомарна: при помилці на будь-якому кроці нічого не зберігається наполовину; slug завжди унікальний; лічильники не «губляться» при паралельних запитах.

> **Чому транзакція.** Публікація — це кілька записів (post + pivot тегів + файл + подія). Якщо впаде десь посередині — отримаєш «опубліковану» статтю без тегів або з осиротілим файлом. `DB::transaction` гарантує «все або нічого». А `lockForUpdate` (bonus) — класична відповідь про race condition на співбесіді.

**Уроки:** [07-eloquent-relationships](../lessons/week-2-api-building/07-eloquent-relationships.md), [06-eloquent-models](../lessons/week-1-php-and-laravel-basics/06-eloquent-models.md), [10-error-handling](../lessons/week-2-api-building/10-error-handling.md) · *(транзакції, service container, DI — поглиблення поза уроками, шукай у документації Laravel)*

**На співбесіді спитають:** що таке **DB-транзакція** і ACID; як уникнути race condition (`lockForUpdate`, атомарні `increment`); навіщо service/action-класи (тонкі контролери); що таке **service container, DI та binding інтерфейсу**; чому slug генерується на сервері.

---

## M8 — Події, слухачі, нотифікації, черги · ~2 дні

**Підзадачі**
- [ ] Event `PostPublished` (диспатчиться після успішної публікації) і `CommentPosted`.
- [ ] Listener шле нотифікації: `PostPublished` → підписникам автора (канали **mail** + **database**); `CommentPosted` → автору статті.
- [ ] Зробити listener/notification `ShouldQueue`; `QUEUE_CONNECTION=database`, таблиця jobs, `php artisan queue:work`.
- [ ] Один queued Job (наприклад `WarmPopularPostsCache` або `GenerateReadingStats`).
- [ ] Кастомна artisan-команда: `php artisan blog:publish-scheduled` (публікує статті, у яких `published_at` уже настав, але статус ще `draft`); зареєструвати в scheduler.
- [ ] Обробка `failed_jobs`.

**Definition of Done**
- Після публікації/коментаря нотифікація потрапляє в чергу й обробляється воркером; з'являється запис у `notifications`; команда `blog:publish-scheduled` працює (і через scheduler).

> **Vue-паралель:** event/listener — як emit події в одному місці й підписка в іншому; черга — як винести важку роботу у Web Worker, щоб не блокувати «основний потік» (HTTP-відповідь).

**Уроки:** [17-events-and-notifications](../lessons/week-3-auth-and-advanced/17-events-and-notifications.md), [18-queues-and-scheduling](../lessons/week-3-auth-and-advanced/18-queues-and-scheduling.md) · довідник: [artisan-commands](../cheatsheets/artisan-commands.md)

**На співбесіді спитають:** різниця events/listeners vs observers; навіщо черги (sync vs async); що таке `ShouldQueue` і `queue:work`; канали нотифікацій; що робити з failed jobs; як написати artisan-команду і запланувати її.

---

## M9 — Коментарі, лайки + (bonus) поліморфізм · ~1-2 дні

**Підзадачі**
- [ ] Коментувати може **лише залогінений**; новий коментар має статус `pending` і не показується публічно, поки автор статті/admin не схвалить (`approved`).
- [ ] Модерація: `PATCH /admin/comments/{comment}/approve` (за `CommentPolicy`).
- [ ] Лайк/анлайк (toggle): один лайк на статтю від користувача (composite `unique`) → повтор-INSERT обробити (`firstOrCreate`/ловити `QueryException`); лічильник через `withCount('likes')`.
- [ ] Агрегати в стрічці: `withCount(['comments' => fn($q) => $q->approved(), 'likes'])`.
- [ ] **Bonus — nested-коментарі:** `parent_id` (self-ref) + рекурсивний вивід відповідей.
- [ ] **Bonus — поліморфізм:** зробити `likes` (або `comments`) **поліморфними** (`morphMany`), щоб лайкати і статтю, і коментар.

**Definition of Done**
- Гість не коментує (редірект на login); новий коментар не видно до схвалення; повторний лайк не створює дубль; кількість коментарів/лайків показується у стрічці.

**Уроки:** [07-eloquent-relationships](../lessons/week-2-api-building/07-eloquent-relationships.md), [14-authorization-policies](../lessons/week-3-auth-and-advanced/14-authorization-policies.md), [08-validation-form-requests](../lessons/week-2-api-building/08-validation-form-requests.md)

**На співбесіді спитають:** де бізнес-правило, а де валідація; навіщо composite unique; як обробити гонку на унікальному ключі; агрегати `withCount`/`withAvg`; (bonus) що таке поліморфні зв'язки і коли доречні.

---

## M10 — Обробка помилок та консистентність · ~1 день

**Підзадачі**
- [ ] Кастомні **Inertia error-сторінки**: 403, 404, **419** (просрочена сесія/CSRF), 500 — рендеряться як Vue-сторінки, а не дефолтний HTML Laravel.
- [ ] Глобальна обробка винятків: `ModelNotFoundException`→404, авторизація→403, `CannotPublishException`→редірект із flash-помилкою.
- [ ] Власні exceptions (наприклад `CannotPublishException` із M7) із коректною поведінкою.
- [ ] Логування помилок (`Log::error`).

**Definition of Done**
- Усі помилкові сценарії показують охайну Vue-сторінку/flash з правильним кодом; 419 при просроченій сесії обробляється коректно (Inertia пропонує перезавантажити).

**Уроки:** [10-error-handling](../lessons/week-2-api-building/10-error-handling.md)

**На співбесіді спитають:** коди 200/302/403/404/419/422/500 — коли який; як Inertia обробляє помилки (vs JSON у REST); навіщо кастомні exceptions і логи; що таке 419 і звідки він.

---

## M11 — Тестування (Pest: Feature + Unit) · ~2-3 дні

**Підзадачі**
- [ ] Feature-тести (Pest) з **`assertInertia`** (перевірка компонента сторінки + props): auth (register/login), стрічка (рендериться `Posts/Index` з потрібними props), CRUD статей із перевіркою ролей (403 для reader), публікація (успіх + цілісність + відкат), коментарі (модерація), лайки (унікальність).
- [ ] Використати `RefreshDatabase`, factories, `$this->actingAs($user)` (сесійна auth).
- [ ] Unit-тести на `PublishPostAction` (генерація slug, sync тегів, виставлення `published_at`, виняток при неповних даних) — з моканням `MarkdownRenderer`/gateway.
- [ ] `php artisan test` (або `./vendor/bin/pest`) — зелено.

**Definition of Done**
- Тести проходять; покривають happy-path, ключові помилки, авторизацію та коректний рендер Inertia-сторінок.

> **Vue-паралель:** Feature-тест Laravel — як e2e/integration-тест, що б'є по справжньому роуту; `assertInertia` перевіряє, що віддалась правильна сторінка з правильними props; Unit-тест — як тест окремого composable/функції.

**Уроки:** [19-pest-feature-testing](../lessons/week-4-testing-and-integration/19-pest-feature-testing.md), [20-unit-tests-and-mocking](../lessons/week-4-testing-and-integration/20-unit-tests-and-mocking.md)

**На співбесіді спитають:** різниця Feature vs Unit; що таке `RefreshDatabase`; як автентифікуватися в тестах (`actingAs`); навіщо factories; що таке мок і коли мокати; як тестувати Inertia-відповідь (`assertInertia`).

---

## M12 — Frontend (Inertia + Vue) · ~3-4 дні

**Підзадачі**
- [ ] **Persistent layout** (хедер/навігація не перемальовуються між переходами), `<Link>` для навігації, індикатор прогресу Inertia.
- [ ] Форми через **`useForm`**: створення/редагування статті (з тегами й обкладинкою), коментар, профіль; показ `form.errors`, `form.processing`, `form.recentlySuccessful`.
- [ ] Стрічка: фільтри/пошук/сортування через **partial reloads** (`router.get(..., { only: ['posts'] , preserveState: true })`), пагінація (компонент по `links`).
- [ ] **Flash-повідомлення** через shared props (успіх публікації/коментаря).
- [ ] Сторінки: стрічка, стаття (+коментарі/лайк), дашборд автора (свої статті + статистика), форми статті, профіль, адмін-модерація коментарів, CRUD категорій/тегів.
- [ ] Виокремити логіку в composables (`usePostFilters`, `useLike`); loading/error-стани.

**Definition of Done** (наскрізний флоу в браузері)
- register → стати author → створити чернетку з обкладинкою й тегами → опублікувати → стаття у стрічці → інший користувач коментує → автор схвалює коментар → лайк; під `admin` — модерувати коментарі, керувати категоріями.

**Уроки:** [23-vue-spa-integration](../lessons/week-4-testing-and-integration/23-vue-spa-integration.md) *(порівняй із SPA-підходом; тут — Inertia, без axios і ручного fetch)*

**На співбесіді спитають (фулстек):** як працює Inertia на фронті (props, `<Link>`, `useForm`, partial reloads, persistent layouts); чим це відрізняється від SPA+axios; як показувати помилки валідації; де `VITE_`-змінні; Ziggy (іменовані роути в JS).

---

## M13 — Документація, фінал, деплой-чеклист · ~1 день

**Підзадачі**
- [ ] `README` проєкту (запуск з нуля), `.env.example`.
- [ ] Документація: коротка карта роутів/сторінок у markdown.
- [ ] Збірка фронту: `npm run build`; перевірити прод-режим.
- [ ] `php artisan config:cache`/`route:cache`; чекліст деплою (migrate, `storage:link`, queue worker, build assets).
- [ ] **(Bonus) Inertia SSR** (`@inertiajs/server`, `php artisan inertia:start-ssr`).
- [ ] (Опційно) прогнати тести в наявному CI (`.github/workflows`).

**Definition of Done**
- Новий розробник за README піднімає проєкт з нуля; прод-збірка фронту працює; деплой-кроки виписані.

**Уроки:** [22-cors-rate-limiting-versioning](../lessons/week-4-testing-and-integration/22-cors-rate-limiting-versioning.md) *(в Inertia-моноліті CORS зазвичай не потрібен — поясни чому)*, [24-deployment-and-next-steps](../lessons/week-4-testing-and-integration/24-deployment-and-next-steps.md)

**На співбесіді спитають:** чому Inertia-моноліту **не потрібен CORS** (на відміну від decoupled SPA); навіщо `config:cache`/`route:cache`; що потрібно на деплої (migrate, env, queue worker, storage:link, build assets); що таке SSR і навіщо.

---

# Фінальна перевірка (приймання капстону)

Зроби ці кроки наприкінці — це твій «здавальний» smoke-test:

1. `php artisan migrate:fresh --seed` → БД наповнена демо-даними.
2. `php artisan test` → усі тести зелені.
3. Запущено `php artisan queue:work`; після публікації/коментаря з'явився запис у `notifications`.
4. У браузері: register → стати author → чернетка з обкладинкою+тегами → публікація (атомарна) → стрічка з фільтром+пошуком → коментар від іншого юзера → схвалення автором → лайк; під `admin` — модерація коментарів і CRUD категорій.
5. Помилкові сценарії: невалідна форма → помилки в `errors` (редірект назад), чужий ресурс → **403**, неіснуючий → **404**, гість на захищеній → редірект на login, просрочена сесія → **419**.

Якщо всі п'ять пунктів проходять — ти реалізував повний фулстек Inertia-проєкт і закрив джуніор-базіс.

---

# Додаток A — Інтерв'ю-чеклист (self-check)

Зможеш упевнено відповісти на це після капстону — готовий до співбесіди на джуна.

**PHP / ООП**
- [ ] Чим PHP-масив відрізняється від JS-об'єкта/масиву; асоціативний масив.
- [ ] Інтерфейси, абстрактні класи, трейти — навіщо кожне.
- [ ] Типізація аргументів і повернень; `null`-safe оператор.

**Laravel core**
- [ ] Як HTTP-запит проходить через Laravel (lifecycle, middleware).
- [ ] Що таке service container, dependency injection, service provider, facade.
- [ ] Чим `.env` відрізняється від `config/`; навіщо `config:cache`.

**Inertia / фулстек-архітектура**
- [ ] Що таке Inertia і як він з'єднує Laravel і Vue без окремого API.
- [ ] **Inertia-моноліт vs decoupled SPA+API** — плюси/мінуси кожного, коли який обирати.
- [ ] Props, shared data, partial reloads, persistent layouts, `useForm`, Ziggy.
- [ ] Чому в Inertia сесійна auth, а не токени; чому не потрібен CORS.

**Роутинг / middleware**
- [ ] Resource-роути; route model binding; групи/префікси/іменовані роути.
- [ ] Що таке middleware, порядок виконання, як написати своє.

**Eloquent / зв'язки**
- [ ] `hasOne`/`hasMany`/`belongsTo`/`belongsToMany`/поліморфні — коли який.
- [ ] Як зберегти й прочитати дані з pivot (`withPivot`, `attach/sync`).
- [ ] Mass assignment, `$fillable`/`$guarded`, casts, accessors/mutators, scopes, soft deletes.

**Продуктивність**
- [ ] Що таке проблема **N+1**, як виявити й виправити (`with()`).
- [ ] `with()` vs `load()`; `withCount`/`withAvg`; коли кешувати.

**Валідація**
- [ ] Навіщо Form Request; `unique` vs `exists`; де валідація vs бізнес-правила; як помилки потрапляють на фронт в Inertia.

**Auth / авторизація**
- [ ] Сесійна auth (Breeze) vs токени (Sanctum); навіщо CSRF.
- [ ] Чому паролі хешуються; що роблять middleware `auth`/`guest`.
- [ ] Policy vs Gate; як зробити RBAC; authentication vs authorization.

**Дані / цілісність**
- [ ] Що таке транзакція й ACID; як уникнути race condition (`lockForUpdate`, атомарний `increment`).
- [ ] Навіщо генерувати slug на сервері; навіщо composite unique.

**Async**
- [ ] Events/listeners/observers; коли потрібні черги; `ShouldQueue`; failed jobs; нотифікації; scheduler.

**Помилки / HTTP**
- [ ] Коди 200/302/403/404/419/422/500.
- [ ] Як Inertia обробляє помилки; що таке 419.

**Файли**
- [ ] Filesystem disks; `storage:link`; валідація завантажень; завантаження через Inertia (multipart).

**Тестування**
- [ ] Feature vs Unit; `RefreshDatabase`; `actingAs`; `assertInertia`; що і коли мокати.

# Додаток B — Матриця покриття тем

| Тема (джуніор-базіс) | Етап | Урок курсу |
|---|---|---|
| Структура проєкту, Composer, env | M0 | 03 |
| ООП PHP | M0–M1 | 01, 02 |
| **Inertia, Breeze, Ziggy** | M0, M2, M12 | поза уроками (доки) |
| Міграції, схема, індекси, FK | M1 | 05 |
| Eloquent CRUD, casts, accessors | M1 | 06 |
| Зв'язки (1:1, 1:N, N:N, pivot, self-ref) | M1, M7, M9 | 07 |
| Factories / Seeders | M1 | 11 |
| Роутинг / контролери | M2, M4 | 04 |
| Inertia props / шейпінг даних / пагінація | M2 | 09 |
| Scopes, фільтри, сортування | M2 | 12 |
| N+1, eager loading, кеш | M2 | 21 |
| Сесійна auth (Breeze), throttle | M3 | 13 |
| Policies / Gates / RBAC | M4 | 14 |
| Middleware (вбудований + кастомний) | M0, M4 | 15 |
| Валідація / Form Requests / Inertia errors | M5 | 08 |
| File storage / завантаження | M6 | 16 |
| Транзакції, service layer, DI/container | M7 | 06, 07 + докси |
| Events / Notifications | M8 | 17 |
| Queues / Jobs / Artisan / Scheduler | M8 | 18 |
| Бізнес-правила, агрегати, поліморфізм | M9 | 07, 14 |
| Обробка помилок, HTTP-коди, 419 | M10 | 10 |
| Тестування (Feature/Unit, `assertInertia`) | M11 | 19, 20 |
| Frontend (Inertia+Vue, useForm, partial reloads) | M12 | 23 |
| Деплой, build, config cache, SSR | M13 | 22, 24 |

# Inertia vs decoupled SPA — що відповісти на співбесіді

| Критерій | Inertia-моноліт (цей проєкт) | Decoupled SPA + API (підхід курсу: Sanctum + Vue SPA) |
|---|---|---|
| API | Немає окремого — контролер віддає сторінку | Окремий REST (`/api/v1`) |
| Auth | Сесія + CSRF (Breeze) | Токени / Sanctum SPA cookie |
| CORS | Не потрібен (один origin) | Потрібен (різні origin) |
| Дані на фронт | props із контролера | JSON через axios/fetch |
| Помилки валідації | Авто в `errors` (`useForm`) | Ловиш 422 вручну |
| Коли обирати | Один веб-клієнт, швидка розробка, SEO/SSR | Кілька клієнтів (web+mobile), публічний API |

> Уміння **порівняти ці підходи** і обґрунтувати вибір — те, що відрізняє джуна, який «щось зробив», від джуна, який **розуміє архітектуру**.

# Поза обсягом (свідомо)

Щоб не розпорошуватись: **реальна доставка пошти** (лише `log`/Mailtrap), full-text search через ElasticSearch, **realtime** (WebSockets/Echo) — bonus, мультимовність контенту, WYSIWYG-редактор (досить markdown/textarea). Self-ref категорії/коментарі, поліморфізм, featured-слоти, SSR — **bonus**, не блокують MVP.

# Що далі (після капстону)

Готові гачки для росту до middle: realtime-коментарі (Laravel Echo/Reverb), full-text search (Scout), Redis-кеш/черги, Docker, повноцінний CI/CD, Inertia SSR у проді, окремий API-шар для мобільного клієнта.
