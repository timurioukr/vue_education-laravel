# Чеклист капстону «DevBlog» (Laravel 13 + Inertia + Vue 3)

> Трекер прогресу. Деталі, критерії й теорія — у [README.md](./README.md). Тут лише підзадачі для відмічання `[x]`.
> Кожен етап завершено, коли позначено всі підзадачі **і** його **DoD**.

## Прогрес по етапах
- [ ] M0 — Підготовка проєкту (Laravel + Breeze Inertia/Vue)
- [ ] M1 — Дані: міграції, моделі, зв'язки, фабрики, сідери
- [ ] M2 — Публічний контент: контролери, Inertia-сторінки, фільтри, кеш
- [ ] M3 — Автентифікація (Breeze, сесії) + користувачі
- [ ] M4 — Авторизація: ролі та політики
- [ ] M5 — Валідація та Form Requests
- [ ] M6 — Завантаження файлів (обкладинки, аватари)
- [ ] M7 — Публікація: транзакції + бізнес-логіка
- [ ] M8 — Події, слухачі, нотифікації, черги
- [ ] M9 — Коментарі, лайки + (bonus) поліморфізм
- [ ] M10 — Обробка помилок та консистентність
- [ ] M11 — Тестування (Pest: Feature + Unit)
- [ ] M12 — Frontend (Inertia + Vue)
- [ ] M13 — Документація, фінал, деплой

---

## M0 — Підготовка проєкту · ~0.5 дня
- [ ] `composer create-project laravel/laravel devblog` (Laravel 13), `git init`, `.gitignore`
- [ ] `.env`: SQLite, створено `database/database.sqlite`
- [ ] `laravel/breeze` → `php artisan breeze:install vue` (Inertia + Vite + Tailwind + Ziggy + TS)
- [ ] Pint; головна сторінка рендериться через `Inertia::render`
- [ ] Роути в `routes/web.php`, прибрано зайве
- [ ] **DoD:** `php artisan serve` + `npm run dev` стартують; `/` — Inertia-сторінка; логін/реєстрація працюють

## M1 — Дані · ~2-3 дні
- [ ] Міграції всіх таблиць: типи, FK (`constrained`/`cascadeOnDelete`), індекси, `unique` (slug), `enum`/`string` (role, status), `softDeletes` (posts), composite unique (likes, post_tag)
- [ ] Моделі + усі зв'язки: `hasOne` (1:1 Profile), `belongsTo`/`hasMany`, `belongsToMany` (Tag), `withPivot('note','position')` (Collection↔Post), self-ref (Category/Comment — bonus)
- [ ] `$fillable`, `$casts` (`status`, `published_at`, bool), accessor (`reading_time`), `isAuthor()`/`isAdmin()`
- [ ] Factories для всіх моделей + стани (`->published()`, `->draft()`)
- [ ] `DatabaseSeeder`: категорії, теги, ~30 статей, коментарі, лайки, admin/author/reader
- [ ] Перевірка зв'язків у Tinker (в обидва боки, pivot)
- [ ] **DoD:** `migrate:fresh --seed` без помилок; зв'язки резолвляться в Tinker

## M2 — Публічний контент · ~2-3 дні
- [ ] Контролери стрічки/статті/категорії/тегу → `Inertia::render` з props
- [ ] Шейпінг даних під props (не лити Eloquent-модель «як є»)
- [ ] Eager loading (`with()`) — прибрано N+1 (перевірено)
- [ ] Scopes + фільтри `?category`/`?tag`/`?q`/`?sort=newest|popular`
- [ ] Пагінація `paginate()->withQueryString()` у props
- [ ] Кеш категорій/популярних (`Cache::remember`)
- [ ] Inertia-основи: shared data (`HandleInertiaRequests`), `<Link>`, partial reloads (`only`)
- [ ] **DoD:** стрічка з фільтрами/пошуком/пагінацією без N+1; категорії з кешу

## M3 — Автентифікація (Breeze) · ~1-2 дні
- [ ] Розібрано згенерований Breeze (контролери `Auth/*`, сторінки, middleware)
- [ ] Роль `reader|author|admin` (поле + `isAuthor()`/`isAdmin()`), роль у shared props
- [ ] Профіль 1:1: розширено `Profile/Edit` (bio, website)
- [ ] Throttle на login/register
- [ ] **DoD:** логін/логаут через сесію; гість на `/dashboard` → login; роль доступна у Vue

## M4 — Авторизація · ~2 дні
- [ ] Ролі reader/author/admin
- [ ] Policies: `PostPolicy`, `CommentPolicy`, `CategoryPolicy`/`TagPolicy`
- [ ] `authorize()` / `can:` middleware; route model binding (`{post:slug}`)
- [ ] Кастомний middleware (`EnsureUserIsAuthor` для зони автора)
- [ ] Зони `/dashboard` (author) і `/admin/*` (admin) під захистом
- [ ] Дозволи прокинуті у props (ховання кнопок на фронті)
- [ ] **DoD:** reader → 403 на створенні/публікації; чужа стаття недоступна; адмін-зона лише для admin

## M5 — Валідація та Form Requests · ~1-2 дні
- [ ] Form Requests на всі записи (`StorePostRequest`, `StoreCommentRequest`, ...)
- [ ] Правила: `required`/`unique`/`exists`/`min`/`max`/`sometimes` + кастомне правило
- [ ] `authorize()` у Form Request
- [ ] Локалізовані повідомлення (`messages()`, українською)
- [ ] Inertia: помилки в `errors`, мапінг через `useForm`, збереження введеного
- [ ] **DoD:** невалідна форма → редірект назад із помилками під полями; дані не губляться

## M6 — Завантаження файлів · ~1 день
- [ ] Cover статті + avatar профілю на диск `public`, `Storage::url`, `storage:link`
- [ ] Inertia-завантаження (`useForm` + multipart/forceFormData), прев'ю
- [ ] Видалення старого файлу при заміні; видалення при видаленні моделі (observer)
- [ ] Валідація завантажень (`image`/`mimes`/`max`)
- [ ] **DoD:** обкладинка/аватар доступні за URL; видалення статті прибирає файл

## M7 — Публікація: транзакції + бізнес-логіка · ~2-3 дні ⭐
- [ ] `POST /posts/{post:slug}/publish` (draft → published)
- [ ] Логіка в `PublishPostAction` (тонкий контролер)
- [ ] `DB::transaction`: унікальний slug + sync тегів + cover + `published_at` + event `PostPublished`
- [ ] Бізнес-правила + кастомний `CannotPublishException` (редірект із flash)
- [ ] Service container / DI: інтерфейс (`MarkdownRenderer`/`SlugGenerator`) + binding у `AppServiceProvider`
- [ ] Атомарні лічильники (`increment()` для views/лайків)
- [ ] **Bonus:** featured-слоти з `lockForUpdate`
- [ ] **DoD:** публікація атомарна (немає часткового запису); slug унікальний; лічильники не губляться

## M8 — Події, слухачі, нотифікації, черги · ~2 дні
- [ ] Events `PostPublished`, `CommentPosted`
- [ ] Listener → нотифікації (mail + database): підписникам автора / автору статті
- [ ] `ShouldQueue`; `QUEUE_CONNECTION=database`; `queue:work`
- [ ] Один queued Job (`WarmPopularPostsCache`/`GenerateReadingStats`)
- [ ] Artisan-команда `blog:publish-scheduled` + scheduler
- [ ] Обробка `failed_jobs`
- [ ] **DoD:** нотифікація через чергу → запис у `notifications`; команда працює

## M9 — Коментарі, лайки + (bonus) поліморфізм · ~1-2 дні
- [ ] Коментар лише від залогіненого; статус `pending` → не видно публічно
- [ ] Модерація `PATCH /admin/comments/{comment}/approve` (за policy)
- [ ] Лайк toggle: composite `unique`, обробка гонки (`firstOrCreate`/`QueryException`)
- [ ] Агрегати `withCount(['comments' => approved, 'likes'])`
- [ ] **Bonus:** nested-коментарі (`parent_id`)
- [ ] **Bonus:** поліморфні `likes`/`comments` (`morphMany`)
- [ ] **DoD:** гість не коментує; коментар не видно до схвалення; дубль-лайк неможливий; лічильники у стрічці

## M10 — Обробка помилок · ~1 день
- [ ] Inertia error-сторінки 403/404/419/500 (Vue, не дефолтний HTML)
- [ ] Глобальна обробка винятків (`ModelNotFound`→404, auth→403, `CannotPublishException`→flash)
- [ ] Власні exceptions із коректною поведінкою
- [ ] Логування (`Log::error`)
- [ ] **DoD:** помилки → охайна Vue-сторінка/flash із правильним кодом; 419 обробляється

## M11 — Тестування (Pest) · ~2-3 дні
- [ ] Feature з `assertInertia` (компонент + props): auth, стрічка, CRUD статей (403 для reader), публікація (цілісність/відкат), коментарі, лайки
- [ ] `RefreshDatabase`, factories, `actingAs`
- [ ] Unit на `PublishPostAction` (slug, sync, `published_at`, виняток) + моки
- [ ] `php artisan test` — зелено
- [ ] **DoD:** тести покривають happy-path, помилки, авторизацію, рендер Inertia

## M12 — Frontend (Inertia + Vue) · ~3-4 дні
- [ ] Persistent layout, `<Link>`, індикатор прогресу
- [ ] Форми через `useForm` (стаття/коментар/профіль): `errors`, `processing`, `recentlySuccessful`
- [ ] Стрічка: фільтри/пошук/сортування через partial reloads; компонент пагінації
- [ ] Flash-повідомлення через shared props
- [ ] Сторінки: стрічка, стаття, дашборд автора, форми, профіль, адмін-модерація, CRUD категорій/тегів
- [ ] Composables (`usePostFilters`, `useLike`); loading/error-стани
- [ ] **DoD (наскрізний флоу):** register → author → чернетка з cover+теги → публікація → стрічка → коментар → схвалення → лайк; admin — модерація + категорії

## M13 — Документація, фінал, деплой · ~1 день
- [ ] README запуску з нуля, `.env.example`
- [ ] Карта роутів/сторінок у markdown
- [ ] `npm run build` (прод-збірка фронту)
- [ ] `config:cache`/`route:cache`; чекліст деплою (migrate, storage:link, queue worker, build)
- [ ] **Bonus:** Inertia SSR
- [ ] (Опційно) тести в CI
- [ ] **DoD:** новий розробник піднімає проєкт за README; прод-збірка працює

---

## Фінальне приймання (smoke-test)
- [ ] `migrate:fresh --seed` → демо-дані
- [ ] `php artisan test` → зелено
- [ ] `queue:work` + публікація/коментар → запис у `notifications`
- [ ] Браузерний флоу: register → author → чернетка з cover+теги → публікація → стрічка з фільтром → коментар → схвалення → лайк; admin — модерація + категорії
- [ ] Помилки: невалідна форма → `errors`; чужий ресурс → 403; неіснуючий → 404; гість → login; просрочена сесія → 419
