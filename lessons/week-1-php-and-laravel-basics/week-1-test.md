# Тест: Тиждень 1 -- PHP та основи Laravel

> **Формат:** теоретичний тест + практичне завдання
> **Час:** 2-3 години
> **Що перевіряємо:** PHP-синтаксис, ООП, структура Laravel-проєкту, роутинг, контролери, міграції, Eloquent CRUD

---

## Частина 1: Теоретичний тест

### PHP vs JavaScript: синтаксис (питання 1-3)

**Питання 1.** Що виведе наступний PHP-код?

```php
$items = ['apple', 'banana', 'cherry'];
$result = array_map(fn($item) => strtoupper($item), $items);
echo count($result);
```

- A) `['APPLE', 'BANANA', 'CHERRY']`
- B) `3`
- C) Помилка -- `fn` не існує в PHP
- D) `0`

---

**Питання 2.** У JavaScript ми пишемо `const user = { name: 'Tim', age: 25 };`. Як створити аналогічну структуру в PHP? Напишіть код, який створює асоціативний масив `$user` з ключами `name` та `age`.

---

**Питання 3.** Яка різниця між `==` та `===` в PHP порівняно з JavaScript? Що поверне `0 == 'hello'` в PHP і чому?

---

### ООП в PHP (питання 4-5)

**Питання 4.** Що таке trait у PHP і для чого він потрібен? Виберіть правильне твердження:

- A) Trait -- це аналог interface, він визначає контракт без реалізації
- B) Trait -- це механізм повторного використання коду в класах, що не підтримують множинне наслідування
- C) Trait -- це абстрактний клас, який не можна інстанціювати
- D) Trait -- це аналог `mixin` у Vue, але він працює тільки зі статичними методами

---

**Питання 5.** Дано клас:

```php
class Product
{
    public function __construct(
        private string $name,
        private float $price,
    ) {}

    public function getPrice(): float
    {
        return $this->price;
    }
}
```

Що станеться, якщо виконати цей код?

```php
$product = new Product('Laptop', 999.99);
echo $product->price;
```

- A) Виведе `999.99`
- B) Помилка: Cannot access private property
- C) Виведе `null`
- D) Помилка: Property `price` does not exist

---

### Структура Laravel-проєкту (питання 6-7)

**Питання 6.** Зіставте файл/директорію з його призначенням:

| # | Файл/Директорія | Призначення |
|---|---|---|
| 1 | `routes/api.php` | A) Конфігурація бази даних |
| 2 | `app/Models/` | B) Визначення API-маршрутів |
| 3 | `database/migrations/` | C) Eloquent-моделі |
| 4 | `.env` | D) Файли міграцій бази даних |
| 5 | `config/database.php` | E) Змінні середовища (секрети, налаштування) |

---

**Питання 7.** Ви щойно створили новий Laravel-проєкт командою `composer create-project laravel/laravel my-app`. Яку команду потрібно виконати першою, щоб переконатися, що додаток працює?

- A) `php artisan migrate`
- B) `php artisan serve`
- C) `php artisan key:generate`
- D) `composer install`

---

### Роутинг та контролери (питання 8-10)

**Питання 8.** Що робить наступний рядок у `routes/api.php`?

```php
Route::apiResource('tasks', TaskController::class);
```

Перелічіть всі HTTP-методи та URL-адреси, які зареєструє цей маршрут.

---

**Питання 9.** У чому різниця між `Route::resource()` та `Route::apiResource()`?

- A) Різниці немає, це аліаси
- B) `apiResource` не реєструє маршрути `create` та `edit`, які потрібні для HTML-форм
- C) `apiResource` автоматично додає prefix `/api`
- D) `resource` працює тільки з Blade, а `apiResource` -- тільки з JSON

---

**Питання 10.** Ви створили контролер командою:

```bash
php artisan make:controller PostController --api
```

Які методи буде створено в контролері? Напишіть список усіх методів.

---

### Міграції (питання 11-12)

**Питання 11.** Дана міграція:

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

Які стовпці матиме таблиця `categories` після виконання міграції? Для кожного вкажіть тип і чи може він бути `NULL`.

---

**Питання 12.** Ви зробили помилку в міграції та вже виконали `php artisan migrate`. Як правильно виправити ситуацію?

- A) Відредагувати файл міграції та виконати `php artisan migrate` знову
- B) Виконати `php artisan migrate:rollback`, виправити файл і знову `php artisan migrate`
- C) Видалити файл міграції та створити новий
- D) Виконати `php artisan migrate:fresh` (видалить усі таблиці та застосує всі міграції заново)

---

### Eloquent ORM (питання 13-15)

**Питання 13.** Дано модель:

```php
class Category extends Model
{
    protected $fillable = ['name', 'description', 'is_active'];
}
```

Що робить властивість `$fillable`? Що станеться, якщо спробувати виконати:

```php
Category::create(['name' => 'Work', 'description' => 'Work tasks', 'secret_field' => 'hack']);
```

---

**Питання 14.** Перетворіть наступний SQL-запит на Eloquent:

```sql
SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC;
```

---

**Питання 15.** Яка різниця між `find()`, `findOrFail()` та `firstWhere()` в Eloquent?

- A) `find()` шукає за primary key і повертає `null`, якщо не знайдено; `findOrFail()` кидає 404; `firstWhere()` шукає за довільним полем
- B) `find()` і `findOrFail()` працюють однаково, `firstWhere()` повертає колекцію
- C) `findOrFail()` працює тільки з `soft deletes`
- D) Всі три методи ідентичні, різниця лише в назві

---

## Частина 2: Практичне завдання

### Завдання: Category CRUD API

Створіть повноцінний CRUD API для категорій (Category) з нуля. Кожен крок описаний детально -- виконуйте послідовно.

> **Передумова:** у вас вже є Laravel-проєкт (створений через `composer create-project laravel/laravel task-manager`), налаштована база SQLite, виконано `php artisan migrate`.

---

### Крок 1: Створіть міграцію

```bash
php artisan make:migration create_categories_table
```

Відкрийте створений файл у `database/migrations/` і додайте структуру таблиці:

```php
public function up(): void
{
    Schema::create('categories', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->string('color', 7)->default('#3B82F6');
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('categories');
}
```

Виконайте міграцію:

```bash
php artisan migrate
```

---

### Крок 2: Створіть модель

```bash
php artisan make:model Category
```

Відкрийте `app/Models/Category.php` і додайте `$fillable`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'name',
        'description',
        'color',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
```

> **Паралель з Vue:** `$fillable` -- це як `defineProps()` у компоненті. Ви явно вказуєте, які поля можна "прокинути" ззовні. Все інше буде відхилено.

---

### Крок 3: Створіть контролер

```bash
php artisan make:controller CategoryController --api
```

Це створить `app/Http/Controllers/CategoryController.php` з порожніми методами `index`, `store`, `show`, `update`, `destroy`.

---

### Крок 4: Зареєструйте маршрут

Відкрийте `routes/api.php` і додайте:

```php
use App\Http\Controllers\CategoryController;

Route::apiResource('categories', CategoryController::class);
```

Перевірте, що маршрути зареєстровано:

```bash
php artisan route:list --path=api/categories
```

Ви повинні побачити 5 маршрутів:

```
GET|HEAD   api/categories .............. categories.index
POST       api/categories .............. categories.store
GET|HEAD   api/categories/{category} ... categories.show
PUT|PATCH  api/categories/{category} ... categories.update
DELETE     api/categories/{category} ... categories.destroy
```

---

### Крок 5: Реалізуйте метод `index`

Поверніть всі категорії у JSON:

```php
use App\Models\Category;

public function index()
{
    $categories = Category::all();

    return response()->json([
        'data' => $categories,
    ]);
}
```

**Тест:**

```bash
curl -s http://localhost:8000/api/categories | jq
```

**Очікуваний результат (порожня база):**

```json
{
  "data": []
}
```

---

### Крок 6: Реалізуйте метод `store`

Створіть нову категорію з даних запиту:

```php
public function store(Request $request)
{
    $category = Category::create($request->only([
        'name',
        'description',
        'color',
        'is_active',
    ]));

    return response()->json([
        'data' => $category,
    ], 201);
}
```

**Тест:**

```bash
curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Work", "description": "Work related tasks", "color": "#EF4444"}' \
  | jq
```

**Очікуваний результат:**

```json
{
  "data": {
    "id": 1,
    "name": "Work",
    "description": "Work related tasks",
    "color": "#EF4444",
    "is_active": true,
    "created_at": "2026-04-09T...",
    "updated_at": "2026-04-09T..."
  }
}
```

Створіть ще одну категорію для тестування:

```bash
curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Personal", "description": "Personal tasks", "color": "#10B981"}' \
  | jq
```

---

### Крок 7: Реалізуйте метод `show`

Знайдіть категорію за ID або поверніть 404:

```php
public function show(string $id)
{
    $category = Category::find($id);

    if (!$category) {
        return response()->json([
            'message' => 'Category not found',
        ], 404);
    }

    return response()->json([
        'data' => $category,
    ]);
}
```

**Тест (існуюча категорія):**

```bash
curl -s http://localhost:8000/api/categories/1 | jq
```

**Очікуваний результат:**

```json
{
  "data": {
    "id": 1,
    "name": "Work",
    "description": "Work related tasks",
    "color": "#EF4444",
    "is_active": true,
    "created_at": "2026-04-09T...",
    "updated_at": "2026-04-09T..."
  }
}
```

**Тест (неіснуюча категорія):**

```bash
curl -s http://localhost:8000/api/categories/999 | jq
```

**Очікуваний результат:**

```json
{
  "message": "Category not found"
}
```

> **Альтернативний варіант** з `findOrFail()` -- Laravel автоматично поверне 404-відповідь:
>
> ```php
> public function show(string $id)
> {
>     $category = Category::findOrFail($id);
>
>     return response()->json([
>         'data' => $category,
>     ]);
> }
> ```

---

### Крок 8: Реалізуйте метод `update`

Знайдіть категорію, оновіть її і поверніть оновлені дані:

```php
public function update(Request $request, string $id)
{
    $category = Category::find($id);

    if (!$category) {
        return response()->json([
            'message' => 'Category not found',
        ], 404);
    }

    $category->update($request->only([
        'name',
        'description',
        'color',
        'is_active',
    ]));

    return response()->json([
        'data' => $category,
    ]);
}
```

**Тест:**

```bash
curl -s -X PUT http://localhost:8000/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Work & Projects", "color": "#8B5CF6"}' \
  | jq
```

**Очікуваний результат:**

```json
{
  "data": {
    "id": 1,
    "name": "Work & Projects",
    "description": "Work related tasks",
    "color": "#8B5CF6",
    "is_active": true,
    "created_at": "2026-04-09T...",
    "updated_at": "2026-04-09T..."
  }
}
```

---

### Крок 9: Реалізуйте метод `destroy`

Знайдіть категорію, видаліть і поверніть порожню відповідь зі статусом 204:

```php
public function destroy(string $id)
{
    $category = Category::find($id);

    if (!$category) {
        return response()->json([
            'message' => 'Category not found',
        ], 404);
    }

    $category->delete();

    return response()->noContent();
}
```

**Тест:**

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:8000/api/categories/2
```

**Очікуваний результат:**

```
204
```

Переконайтесь, що категорія видалена:

```bash
curl -s http://localhost:8000/api/categories | jq
```

**Очікуваний результат (залишилась тільки одна категорія):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Work & Projects",
      "description": "Work related tasks",
      "color": "#8B5CF6",
      "is_active": true,
      "created_at": "2026-04-09T...",
      "updated_at": "2026-04-09T..."
    }
  ]
}
```

---

### Крок 10: Фінальна перевірка

Запустіть повний цикл тестування:

```bash
# 1. Переконайтесь, що сервер запущений
php artisan serve

# 2. Створіть 3 категорії
curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Urgent", "color": "#DC2626"}' | jq

curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Ideas", "description": "Ideas for later", "color": "#F59E0B"}' | jq

curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Archive", "is_active": false}' | jq

# 3. Отримайте всі категорії
curl -s http://localhost:8000/api/categories | jq

# 4. Отримайте одну категорію
curl -s http://localhost:8000/api/categories/3 | jq

# 5. Оновіть категорію
curl -s -X PUT http://localhost:8000/api/categories/3 \
  -H "Content-Type: application/json" \
  -d '{"name": "Old Archive", "is_active": true}' | jq

# 6. Видаліть категорію
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:8000/api/categories/4

# 7. Спробуйте отримати видалену категорію (404)
curl -s http://localhost:8000/api/categories/999 | jq
```

---

### Чекліст виконання

Перед тим як вважати завдання виконаним, перевірте:

- [ ] Міграція створена та виконана без помилок
- [ ] Модель `Category` має `$fillable` та `casts`
- [ ] `CategoryController` має всі 5 методів
- [ ] `apiResource` маршрут зареєстрований
- [ ] `GET /api/categories` повертає масив категорій
- [ ] `POST /api/categories` створює категорію та повертає 201
- [ ] `GET /api/categories/{id}` повертає одну категорію або 404
- [ ] `PUT /api/categories/{id}` оновлює категорію
- [ ] `DELETE /api/categories/{id}` видаляє категорію та повертає 204

---

## Частина 3: Бонусне завдання

### Tag CRUD API + кастомний маршрут

Створіть другий ресурс -- теги (`Tag`) -- за тим самим принципом, що й категорії. Додатково реалізуйте кастомний маршрут для "популярних" тегів.

#### 3.1 Створіть міграцію, модель та контролер

```bash
php artisan make:migration create_tags_table
php artisan make:model Tag
php artisan make:controller TagController --api
```

Структура таблиці `tags`:

| Стовпець | Тип | Опис |
|---|---|---|
| `id` | bigint (auto) | Primary key |
| `name` | string | Назва тегу |
| `slug` | string, unique | URL-friendly назва |
| `usage_count` | integer, default 0 | Кількість використань (поки що вручну) |
| `timestamps` | | `created_at`, `updated_at` |

#### 3.2 Реалізуйте всі 5 CRUD-методів

Зробіть це самостійно за аналогією з `CategoryController`. Модель `Tag` повинна мати:

```php
protected $fillable = ['name', 'slug', 'usage_count'];
```

#### 3.3 Додайте кастомний маршрут

У `routes/api.php` **перед** `apiResource` додайте:

```php
Route::get('tags/popular', [TagController::class, 'popular']);
Route::apiResource('tags', TagController::class);
```

> **Важливо:** кастомний маршрут повинен бути **перед** `apiResource`, інакше Laravel сприйме `popular` як `{tag}` параметр і спробує знайти тег з ID "popular".

#### 3.4 Реалізуйте метод `popular`

Поверніть топ-5 тегів, відсортованих за `usage_count`:

```php
public function popular()
{
    $tags = Tag::orderByDesc('usage_count')
        ->limit(5)
        ->get();

    return response()->json([
        'data' => $tags,
    ]);
}
```

#### 3.5 Протестуйте

```bash
# Створіть кілька тегів
curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "Laravel", "slug": "laravel", "usage_count": 42}' | jq

curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "PHP", "slug": "php", "usage_count": 38}' | jq

curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "Vue", "slug": "vue", "usage_count": 55}' | jq

curl -s -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "CSS", "slug": "css", "usage_count": 12}' | jq

# Отримайте популярні теги
curl -s http://localhost:8000/api/tags/popular | jq
```

**Очікуваний результат:**

```json
{
  "data": [
    {
      "id": 3,
      "name": "Vue",
      "slug": "vue",
      "usage_count": 55,
      "created_at": "2026-04-09T...",
      "updated_at": "2026-04-09T..."
    },
    {
      "id": 1,
      "name": "Laravel",
      "slug": "laravel",
      "usage_count": 42,
      "created_at": "2026-04-09T...",
      "updated_at": "2026-04-09T..."
    },
    {
      "id": 2,
      "name": "PHP",
      "slug": "php",
      "usage_count": 38,
      "created_at": "2026-04-09T...",
      "updated_at": "2026-04-09T..."
    },
    {
      "id": 4,
      "name": "CSS",
      "slug": "css",
      "usage_count": 12,
      "created_at": "2026-04-09T...",
      "updated_at": "2026-04-09T..."
    }
  ]
}
```

> **Що ви тут вивчили додатково:** кастомні маршрути поряд з `apiResource`, сортування через `orderByDesc()`, обмеження результатів через `limit()`.

---

## Відповіді на теоретичний тест

### Питання 1
**Відповідь: B) `3`**

`array_map` повертає новий масив `['APPLE', 'BANANA', 'CHERRY']`, але `echo count($result)` виводить кількість елементів -- `3`. Функція `echo` не може вивести масив цілком, а `count()` повертає число.

### Питання 2
**Відповідь:**

```php
$user = ['name' => 'Tim', 'age' => 25];
```

В PHP немає об'єктних літералів як у JS (`{}`). Замість них використовуються асоціативні масиви з синтаксисом `'key' => value`. Це аналог JS-об'єкта для зберігання пар ключ-значення.

### Питання 3
**Відповідь:**

В PHP `==` і `===` працюють аналогічно до JavaScript: `==` порівнює зі зведенням типів, `===` -- строго (тип + значення).

`0 == 'hello'` в PHP повертає `false` (починаючи з PHP 8.0). У старих версіях PHP (до 8.0) це було `true`, бо рядок `'hello'` зводився до `0`. У PHP 8.0+ при порівнянні числа з нечисловим рядком, рядок не зводиться до числа, а число зводиться до рядка `'0'`, тому `'0' == 'hello'` дає `false`.

> **Порівняння з JS:** `0 == 'hello'` в JavaScript також повертає `false`, бо `'hello'` перетворюється на `NaN`.

### Питання 4
**Відповідь: B) Trait -- це механізм повторного використання коду в класах, що не підтримують множинне наслідування**

PHP не підтримує множинне наслідування (клас може мати тільки один `extends`). Trait дозволяє "підмішати" набір методів у будь-який клас через `use`. Це схоже на `composable` у Vue 3 -- ви виносите логіку окремо і підключаєте до різних компонентів/класів.

### Питання 5
**Відповідь: B) Помилка: Cannot access private property**

Властивість `$price` оголошена як `private` -- доступ до неї можливий тільки зсередини класу. Зовні потрібно використовувати метод `$product->getPrice()`. Це принцип інкапсуляції в ООП.

### Питання 6
**Відповідь:**

| # | Файл/Директорія | Призначення |
|---|---|---|
| 1 | `routes/api.php` | **B)** Визначення API-маршрутів |
| 2 | `app/Models/` | **C)** Eloquent-моделі |
| 3 | `database/migrations/` | **D)** Файли міграцій бази даних |
| 4 | `.env` | **E)** Змінні середовища (секрети, налаштування) |
| 5 | `config/database.php` | **A)** Конфігурація бази даних |

### Питання 7
**Відповідь: B) `php artisan serve`**

У сучасних версіях Laravel `key:generate` виконується автоматично при створенні проєкту через `composer create-project`. Першим логічним кроком є запуск dev-сервера, щоб переконатися, що все працює. `php artisan migrate` потрібен пізніше, коли ви готові створити таблиці.

### Питання 8
**Відповідь:**

`Route::apiResource` реєструє 5 маршрутів:

| HTTP-метод | URL | Метод контролера | Назва маршруту |
|---|---|---|---|
| GET | `/api/tasks` | `index` | `tasks.index` |
| POST | `/api/tasks` | `store` | `tasks.store` |
| GET | `/api/tasks/{task}` | `show` | `tasks.show` |
| PUT/PATCH | `/api/tasks/{task}` | `update` | `tasks.update` |
| DELETE | `/api/tasks/{task}` | `destroy` | `tasks.destroy` |

### Питання 9
**Відповідь: B) `apiResource` не реєструє маршрути `create` та `edit`, які потрібні для HTML-форм**

`Route::resource()` реєструє 7 маршрутів, включаючи `create` (GET-форма для створення) та `edit` (GET-форма для редагування). Для API ці маршрути не потрібні -- фронтенд (Vue SPA) сам рендерить форми. Тому `apiResource` реєструє тільки 5 маршрутів.

### Питання 10
**Відповідь:**

Прапорець `--api` створює контролер з 5 методами:

1. `index()` -- список ресурсів
2. `store(Request $request)` -- створення
3. `show(string $id)` -- перегляд одного ресурсу
4. `update(Request $request, string $id)` -- оновлення
5. `destroy(string $id)` -- видалення

Без `--api` було б ще `create()` і `edit()`.

### Питання 11
**Відповідь:**

| Стовпець | Тип | Nullable |
|---|---|---|
| `id` | bigint unsigned (auto-increment) | NOT NULL |
| `name` | varchar(255) | NOT NULL |
| `description` | text | NULL (nullable) |
| `is_active` | boolean (tinyint) | NOT NULL (default: true) |
| `created_at` | timestamp | NULL |
| `updated_at` | timestamp | NULL |

`timestamps()` створює два стовпці -- `created_at` та `updated_at`, обидва nullable за замовчуванням. Laravel автоматично заповнює їх при створенні/оновленні запису.

### Питання 12
**Відповідь: B) Виконати `php artisan migrate:rollback`, виправити файл і знову `php artisan migrate`**

Варіант A не спрацює -- Laravel бачить, що міграція вже виконана, і пропустить її. Варіант D (`migrate:fresh`) теж працює, але він видаляє **всі** таблиці -- небезпечно, якщо є дані. Правильний підхід -- відкотити останню міграцію, виправити і виконати знову.

> **Паралель з Vue:** це як `git revert` замість `git reset --hard`. Відкотити один крок безпечніше, ніж знести все.

### Питання 13
**Відповідь:**

`$fillable` -- це "білий список" полів, які можна масово присвоювати (mass assignment). Це захист від ін'єкції зайвих полів.

При виконанні `Category::create([...])` поле `secret_field` буде **проігноровано**, бо його немає у `$fillable`. Створяться тільки `name` та `description`. Помилки не буде -- поле просто не потрапить у запит до бази.

> **Паралель з Vue:** це як `defineProps` -- ви дозволяєте тільки визначені пропси, решта ігнорується.

### Питання 14
**Відповідь:**

```php
Category::where('is_active', true)
    ->orderBy('name', 'asc')
    ->get();
```

Або скорочений варіант:

```php
Category::where('is_active', true)
    ->orderBy('name')
    ->get();
```

`orderBy` за замовчуванням сортує `asc`, тому другий аргумент можна не вказувати.

### Питання 15
**Відповідь: A)**

- `find($id)` -- шукає за primary key, повертає модель або `null`
- `findOrFail($id)` -- шукає за primary key, повертає модель або кидає `ModelNotFoundException` (Laravel автоматично перетворює на 404-відповідь)
- `firstWhere('field', 'value')` -- шукає перший запис за довільним полем, повертає модель або `null`

Приклад:

```php
Category::find(1);                    // за ID
Category::findOrFail(1);              // за ID, 404 якщо не знайдено
Category::firstWhere('slug', 'work'); // за полем slug
```
