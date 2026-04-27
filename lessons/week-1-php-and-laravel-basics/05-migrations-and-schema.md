# Урок 5: Міграції та схема бази даних -- версіонування вашої БД

## Що ви вивчите

- Що таке міграції і навіщо вони потрібні (version control для бази даних)
- Налаштування SQLite в Laravel (вже готове з Уроку 3)
- Створення міграцій через `php artisan make:migration`
- Структура файлу міграції: методи `up()` та `down()`
- `Schema::create()` та `Blueprint` -- конструктор таблиць
- Типи колонок: `id()`, `string()`, `text()`, `boolean()`, `integer()`, `foreignId()`, `timestamps()` та інші
- Nullable, default значення, foreign keys
- Запуск міграцій: `migrate`, `migrate:rollback`, `migrate:fresh`
- Інспекція бази: `db:show`, `db:table`
- Зміна існуючих таблиць через нову міграцію

---

## Паралелі з JS/Vue

| Vue / JS екосистема | Laravel міграції |
|---|---|
| `git` для коду | Міграції для бази даних |
| `package.json` (описує залежності) | Файл міграції (описує структуру таблиці) |
| `npm install` (застосовує залежності) | `php artisan migrate` (застосовує міграції) |
| TypeScript `interface Task { id: number; title: string }` | `Schema::create('tasks', ...)` з типами колонок |
| Zod schema `.string().nullable()` | `$table->string('name')->nullable()` |
| Prisma schema `model Task { id Int @id }` | Laravel міграція (дуже схожий підхід) |
| `npm run rollback` (якщо б таке було) | `php artisan migrate:rollback` |
| `.env` файл для конфігурації | `.env` файл (той самий підхід!) |
| Foreign key в SQL / Prisma `@relation` | `foreignId('user_id')->constrained()` |
| TypeScript `?` (optional) | `->nullable()` |
| Default prop value в Vue | `->default('pending')` |

---

## Теорія

### Що таке міграції

Уявіть, що ви працюєте в команді. Ваш колега додав нову таблицю в базу даних, але ви про це не знаєте. Ви робите `git pull`, запускаєте проєкт -- і все ламається, бо у вашій локальній базі немає нової таблиці.

**Міграції вирішують цю проблему.** Міграція -- це PHP-файл, який описує зміни в базі даних. Коли ви робите `git pull` і бачите нову міграцію, ви запускаєте `php artisan migrate` -- і ваша база оновлюється автоматично.

У Vue/JS ви звикли до:
- `git` -- version control для коду
- `package.json` + `npm install` -- version control для залежностей

Міграції -- це **version control для бази даних**. Кожна міграція -- це "коміт" для структури БД.

### Налаштування бази даних

У Vue ви зберігаєте конфігурацію в `.env`:

```bash
# .env у Vue/Nuxt проєкті
VITE_API_URL=http://localhost:8000
```

В Laravel теж `.env`, але для бази даних:

```bash
# .env у Laravel проєкті (вже налаштовано з Уроку 3)
DB_CONNECTION=sqlite
# DB_DATABASE вказує на database/database.sqlite
```

SQLite -- це файлова база даних. Не потрібно встановлювати MySQL/PostgreSQL, не потрібно запускати окремий сервер. Один файл `database/database.sqlite` -- і все працює. Ідеально для навчання та невеликих проєктів.

### Створення міграції

```bash
php artisan make:migration create_tasks_table
```

Ця команда створить файл у `database/migrations/` з іменем типу:
```
2026_04_09_120000_create_tasks_table.php
```

Ім'я файлу починається з timestamp (дата і час). Це гарантує, що міграції виконуються в правильному порядку -- так само, як коміти в git мають timestamp.

### Структура файлу міграції

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Виконується при `php artisan migrate`
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();                    // BIGINT auto-increment primary key
            $table->string('title');         // VARCHAR(255)
            $table->timestamps();            // created_at та updated_at
        });
    }

    /**
     * Reverse the migrations.
     * Виконується при `php artisan migrate:rollback`
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
```

Два методи:
- **`up()`** -- що зробити при застосуванні міграції (створити таблицю, додати колонку)
- **`down()`** -- як відкотити зміни (видалити таблицю, прибрати колонку)

Це як `undo/redo` у вашому редакторі коду.

### Schema::create() та Blueprint

`Schema::create()` -- це конструктор таблиць. `Blueprint` -- це об'єкт, який описує структуру таблиці. Уявіть `Blueprint` як TypeScript-інтерфейс для таблиці:

```typescript
// TypeScript -- так ви описуєте форму даних на фронтенді
interface Task {
    id: number
    title: string
    description?: string  // nullable
    status: 'pending' | 'in_progress' | 'done'  // enum
    priority: 'low' | 'medium' | 'high'           // enum
    deadline?: Date        // nullable
    is_completed: boolean
    user_id: number       // foreign key
    category_id?: number  // nullable foreign key
    created_at: Date
    updated_at: Date
    deleted_at?: Date     // soft delete
}
```

```php
// Laravel -- так ви описуєте структуру таблиці в базі даних
Schema::create('tasks', function (Blueprint $table) {
    $table->id();                                    // id: number (auto)
    $table->string('title');                         // title: string
    $table->text('description')->nullable();         // description?: string
    $table->string('status')->default('pending');    // status: 'pending' | ...
    $table->string('priority')->default('low');      // priority: 'low' | 'medium' | 'high'
    $table->date('deadline')->nullable();            // deadline?: Date
    $table->boolean('is_completed')->default(false); // is_completed: boolean
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();  // user_id: number (FK)
    $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete(); // category_id?: number (FK)
    $table->timestamps();                            // created_at, updated_at
    $table->softDeletes();                           // deleted_at?: Date
});
```

Бачите паралель? Кожен рядок `Blueprint` -- це як поле в TypeScript-інтерфейсі, тільки ви також задаєте тип у базі даних.

### Типи колонок -- повний довідник

| Blueprint метод | SQL тип | TypeScript аналог | Пояснення |
|---|---|---|---|
| `$table->id()` | BIGINT UNSIGNED AUTO_INCREMENT PK | `id: number` (auto) | Первинний ключ, автоінкремент |
| `$table->string('name')` | VARCHAR(255) | `name: string` | Рядок до 255 символів |
| `$table->string('name', 100)` | VARCHAR(100) | `name: string` | Рядок до 100 символів |
| `$table->text('body')` | TEXT | `body: string` | Довгий текст (без обмеження) |
| `$table->boolean('active')` | BOOLEAN | `active: boolean` | true/false |
| `$table->integer('count')` | INTEGER | `count: number` | Ціле число (-2B...+2B) |
| `$table->unsignedTinyInteger('value')` | TINYINT UNSIGNED | `value: number` | Число 0-255 |
| `$table->date('deadline')` | DATE | `deadline: string` (YYYY-MM-DD) | Тільки дата |
| `$table->timestamp('published_at')` | TIMESTAMP | `published_at: Date` | Дата і час |
| `$table->timestamps()` | -- | `created_at, updated_at: Date` | Додає два поля одразу |
| `$table->softDeletes()` | -- | `deleted_at?: Date` | Для "м'якого" видалення |
| `$table->foreignId('user_id')` | BIGINT UNSIGNED | `user_id: number` | Foreign key (число) |
| `$table->json('metadata')` | JSON | `metadata: Record<string, any>` | JSON-поле |

### Модифікатори колонок

| Модифікатор | Аналог у TypeScript/Zod | Пояснення |
|---|---|---|
| `->nullable()` | `?` або `.nullable()` | Поле може бути NULL |
| `->default('value')` | `= 'value'` або `.default('value')` | Значення за замовчуванням |
| `->unique()` | -- | Унікальне значення (як email) |
| `->index()` | -- | Додає індекс для швидкого пошуку |
| `->after('column')` | -- | Розмістити після вказаної колонки |

Приклади:

```php
$table->string('email')->unique();                  // Унікальний email
$table->string('status')->default('pending');       // Default значення
$table->text('description')->nullable();            // Може бути NULL
$table->boolean('is_active')->default(true)->index(); // Default + індекс
```

### Foreign Keys (зовнішні ключі)

У Vue ви часто працюєте з вкладеними даними:

```javascript
// Vue -- задача з категорією
const task = {
    id: 1,
    title: 'Learn Laravel',
    category: { id: 1, name: 'Work' }  // Вкладений об'єкт
}
```

У базі даних зв'язки реалізуються через foreign keys:

```php
// Задача "належить" користувачу та категорії
$table->foreignId('user_id')
    ->constrained()          // Створює FK на users.id
    ->cascadeOnDelete();     // Видалити задачі при видаленні користувача

$table->foreignId('category_id')
    ->nullable()             // Задача може бути без категорії
    ->constrained()          // FK на categories.id
    ->nullOnDelete();        // Встановити NULL при видаленні категорії
```

`constrained()` -- це скорочення, яке автоматично визначає таблицю за іменем колонки:
- `user_id` -> посилається на `users.id`
- `category_id` -> посилається на `categories.id`

Дії при видаленні пов'язаного запису:
- `cascadeOnDelete()` -- видалити і залежні записи (видалили юзера -> видалились його задачі)
- `nullOnDelete()` -- встановити NULL (видалили категорію -> category_id стає NULL)
- `restrictOnDelete()` -- заборонити видалення (не можна видалити категорію, поки є задачі)

### Команди для роботи з міграціями

```bash
# Запустити всі нові (ще не виконані) міграції
php artisan migrate

# Відкотити останню "пачку" міграцій
php artisan migrate:rollback

# Відкотити і перезапустити ВСЕ (видаляє всі таблиці!)
php artisan migrate:fresh

# Перевірити статус міграцій (які виконані, які ні)
php artisan migrate:status

# Інспекція бази даних
php artisan db:show        # Загальна інформація про БД
php artisan db:table tasks # Структура конкретної таблиці
```

> **Увага:** `migrate:fresh` видаляє ВСІ дані! Використовуйте тільки в розробці, ніколи на продакшені. Це як `rm -rf node_modules && npm install` -- починаємо з чистого аркуша.

### Зміна існуючих таблиць

Що якщо таблиця вже створена і ви хочете додати колонку? НЕ змінюйте існуючу міграцію! Створіть нову:

```bash
php artisan make:migration add_notes_to_tasks_table
```

```php
// Нова міграція -- додає колонку до існуючої таблиці
public function up(): void
{
    Schema::table('tasks', function (Blueprint $table) {  // table, не create!
        $table->text('notes')->nullable()->after('description');
    });
}

public function down(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->dropColumn('notes');
    });
}
```

Зверніть увагу на різницю:
- `Schema::create('tasks', ...)` -- створює НОВУ таблицю
- `Schema::table('tasks', ...)` -- змінює ІСНУЮЧУ таблицю

Це як в git: ви не змінюєте старий коміт, а створюєте новий.

---

## Практика: крок за кроком

> **Передумова:** Laravel-проєкт з Уроку 3, SQLite вже налаштований.

### Крок 1: Подивіться на стандартні міграції

```bash
cd ~/task-manager-api
ls database/migrations/
```

Ви побачите міграції, які Laravel створив автоматично:

```
0001_01_01_000000_create_users_table.php
0001_01_01_000001_create_cache_table.php
0001_01_01_000002_create_jobs_table.php
```

Laravel вже має міграцію для таблиці `users` -- нам не потрібно її створювати. Давайте подивимось на неї:

```bash
cat database/migrations/0001_01_01_000000_create_users_table.php
```

Зверніть увагу на структуру -- `up()` створює три таблиці (users, password_reset_tokens, sessions), `down()` видаляє їх у зворотному порядку.

### Крок 2: Створіть міграцію для categories

Категорії створюємо **першими**, бо tasks будуть посилатись на categories через foreign key.

```bash
php artisan make:migration create_categories_table
```

Відкрийте створений файл `database/migrations/XXXX_XX_XX_XXXXXX_create_categories_table.php` і напишіть:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');                // Назва категорії: "Work", "Personal"
            $table->string('color', 7);            // HEX-колір: "#3B82F6"
            $table->foreignId('user_id')           // Кожна категорія належить користувачу
                ->constrained()
                ->cascadeOnDelete();
            $table->timestamps();                  // created_at, updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
```

**Пояснення кожної колонки:**

- `$table->id()` -- автоматичний `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`. Це `id: number` в TypeScript.
- `$table->string('name')` -- VARCHAR(255) для назви категорії.
- `$table->string('color', 7)` -- VARCHAR(7) для HEX-кольору (формат `#RRGGBB` -- рівно 7 символів).
- `$table->foreignId('user_id')->constrained()->cascadeOnDelete()` -- зовнішній ключ на таблицю `users`. При видаленні користувача всі його категорії теж видаляться.
- `$table->timestamps()` -- додає `created_at` та `updated_at` (TIMESTAMP).

### Крок 3: Створіть міграцію для tasks

```bash
php artisan make:migration create_tasks_table
```

Заповніть файл:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');                              // Назва задачі
            $table->text('description')->nullable();              // Опис (необов'язковий)
            $table->string('status')->default('pending');         // pending, in_progress, done
            $table->string('priority')->default('low');           // low, medium, high
            $table->date('deadline')->nullable();                 // Дедлайн (необов'язковий)
            $table->foreignId('user_id')                          // Автор задачі
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('category_id')                      // Категорія (необов'язкова)
                ->nullable()
                ->constrained()
                ->nullOnDelete();                                 // При видаленні категорії -> NULL
            $table->timestamps();                                 // created_at, updated_at
            $table->softDeletes();                                // deleted_at (м'яке видалення)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
```

**Пояснення ключових моментів:**

- `$table->text('description')->nullable()` -- `TEXT` може зберігати довгий текст. `nullable()` означає, що задача може бути без опису. Це як `description?: string` у TypeScript.
- `$table->string('status')->default('pending')` -- ми використовуємо `string` замість `enum`, бо це гнучкіше. Валідацію значень зробимо на рівні контролера (Урок 13). `default('pending')` -- нова задача завжди починається зі статусу "pending".
- `$table->string('priority')->default('low')` -- так само, як і `status`: зберігаємо рядок (`low`, `medium`, `high`), валідацію набору значень робимо у FormRequest (Урок 8). Це консистентно з тим, як працює `status`, і не вимагає мапінгу чисел у фронтенді.
- `$table->date('deadline')->nullable()` -- тільки дата (без часу). Не кожна задача має дедлайн.
- `$table->foreignId('category_id')->nullable()->constrained()->nullOnDelete()` -- задача може бути без категорії (`nullable`). Якщо категорію видаляють, задача НЕ видаляється -- просто `category_id` стає NULL.
- `$table->softDeletes()` -- додає колонку `deleted_at`. Замість фізичного видалення запис просто позначається як "видалений". Це як кошик у файловій системі.

### Крок 4: Створіть міграцію для tags

```bash
php artisan make:migration create_tags_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
```

### Крок 5: Створіть pivot-таблицю tag_task

Pivot-таблиця (або зв'язкова таблиця) -- це спосіб реалізувати зв'язок "багато до багатьох" (many-to-many). Одна задача може мати багато тегів, і один тег може бути на багатьох задачах.

У Vue ви часто бачите це як масив ID:

```javascript
// Vue -- задача з масивом тегів
const task = {
    id: 1,
    title: 'Learn Laravel',
    tags: [1, 3, 5]  // масив ID тегів
}
```

У базі даних це реалізується через окрему таблицю:

```
tag_task
+----+--------+---------+
| id | tag_id | task_id |
+----+--------+---------+
|  1 |      1 |       1 |  ← Task 1 має Tag 1
|  2 |      3 |       1 |  ← Task 1 має Tag 3
|  3 |      1 |       2 |  ← Task 2 має Tag 1
+----+--------+---------+
```

```bash
php artisan make:migration create_tag_task_table
```

> **Конвенція імен:** pivot-таблиця називається з імен двох моделей у **алфавітному порядку**, в однині, через підкреслення: `Tag` + `Task` → `tag_task` (бо `tag` < `task` алфавітно). Не `task_tag`, не `tasks_tags`. Eloquent автоматично шукає таблицю саме під цим іменем у `belongsToMany()`.

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tag_task', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tag_id')
                ->constrained()
                ->cascadeOnDelete();    // Видалили тег -> видаляються зв'язки
            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();    // Видалили задачу -> видаляються зв'язки
            $table->timestamps();

            // Унікальний індекс: одна задача не може мати один і той самий тег двічі
            $table->unique(['tag_id', 'task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tag_task');
    }
};
```

### Крок 6: Запустіть всі міграції

```bash
php artisan migrate
```

Очікуваний результат:

```
   INFO  Running migrations.

  0001_01_01_000000_create_users_table ..................... 12.45ms DONE
  0001_01_01_000001_create_cache_table .................... 3.22ms DONE
  0001_01_01_000002_create_jobs_table ..................... 5.67ms DONE
  2026_04_09_120001_create_categories_table ............... 2.15ms DONE
  2026_04_09_120002_create_tasks_table .................... 3.42ms DONE
  2026_04_09_120003_create_tags_table ..................... 1.89ms DONE
  2026_04_09_120004_create_tag_task_table ................. 2.03ms DONE
```

Всі 7 міграцій виконались. Laravel створив таблиці в базі даних SQLite.

### Крок 7: Перевірте стан міграцій

```bash
php artisan migrate:status
```

Очікуваний результат:

```
  Migration name ................................. Batch / Status
  0001_01_01_000000_create_users_table ............... [1] Ran
  0001_01_01_000001_create_cache_table ............... [1] Ran
  0001_01_01_000002_create_jobs_table ................ [1] Ran
  2026_04_09_120001_create_categories_table .......... [1] Ran
  2026_04_09_120002_create_tasks_table ............... [1] Ran
  2026_04_09_120003_create_tags_table ................ [1] Ran
  2026_04_09_120004_create_tag_task_table ............ [1] Ran
```

`[1]` означає "batch 1" -- всі міграції виконались в одній пачці. Якщо ви зробите `rollback`, відкотяться всі міграції з batch 1.

### Крок 8: Огляньте базу даних

```bash
# Загальна інформація про БД
php artisan db:show
```

Очікуваний результат:

```
  SQLite
  Database ..................................... database/database.sqlite
  Tables ....................................... 8
  Size ......................................... ...KB
```

```bash
# Структура таблиці tasks
php artisan db:table tasks
```

Очікуваний результат:

```
  tasks

  Column .............. Type .............. Modifiers
  id .................. integer ........... autoincrement
  title ............... varchar ........... 
  description ......... text .............. nullable
  status .............. varchar ........... default: 'pending'
  priority ............ varchar ........... default: 'low'
  deadline ............ date .............. nullable
  user_id ............. integer ...........
  category_id ......... integer ........... nullable
  created_at .......... datetime ..........  nullable
  updated_at .......... datetime .......... nullable
  deleted_at .......... datetime .......... nullable
```

```bash
# Структура таблиці categories
php artisan db:table categories
```

```bash
# Структура pivot-таблиці
php artisan db:table tag_task
```

### Крок 9: Протестуйте rollback

```bash
# Відкотити останню пачку міграцій
php artisan migrate:rollback
```

Очікуваний результат:

```
   INFO  Rolling back migrations.

  2026_04_09_120004_create_tag_task_table ............. 1.23ms DONE
  2026_04_09_120003_create_tags_table ................. 0.98ms DONE
  2026_04_09_120002_create_tasks_table ................ 1.45ms DONE
  2026_04_09_120001_create_categories_table ........... 0.87ms DONE
  0001_01_01_000002_create_jobs_table ................. 1.12ms DONE
  0001_01_01_000001_create_cache_table ................ 0.76ms DONE
  0001_01_01_000000_create_users_table ................ 1.34ms DONE
```

Всі таблиці видалено! Тепер запустіть міграції знову:

```bash
php artisan migrate
```

Все відновлено. Це і є магія `up()` / `down()` -- ви можете рухатись вперед і назад.

### Крок 10: Спробуйте migrate:fresh

```bash
php artisan migrate:fresh
```

Очікуваний результат:

```
   INFO  Dropping all tables.

  Tables dropped successfully.

   INFO  Running migrations.

  0001_01_01_000000_create_users_table ............... 11.23ms DONE
  ...
  2026_04_09_120004_create_tag_task_table ............. 1.89ms DONE
```

`migrate:fresh` видаляє ВСІ таблиці і запускає всі міграції з нуля. Це зручно під час розробки, коли хочеш почати з чистого аркуша.

---

## Перевірка

Після виконання всіх кроків:

1. `php artisan migrate:status` показує 7 міграцій зі статусом "Ran"
2. `php artisan db:show` показує 8 таблиць (7 з міграцій + 1 системна `migrations`)
3. `php artisan db:table tasks` показує всі колонки: id, title, description, status, priority, deadline, user_id, category_id, created_at, updated_at, deleted_at
4. `php artisan db:table categories` показує: id, name, color, user_id, created_at, updated_at
5. `php artisan db:table tags` показує: id, name, user_id, created_at, updated_at
6. `php artisan db:table tag_task` показує: id, tag_id, task_id, created_at, updated_at

---

## Міні-тест

**1. Що таке міграція в Laravel?**

a) PHP-файл, який описує зміни в базі даних
b) Процес переміщення даних між серверами
c) Команда для створення бази даних
d) Файл конфігурації підключення до БД

**2. Який метод робить колонку необов'язковою (може бути NULL)?**

a) `->optional()`
b) `->nullable()`
c) `->null()`
d) `->allowNull()`

**3. Що робить `foreignId('user_id')->constrained()->cascadeOnDelete()`?**

a) Створює колонку user_id як текст
b) Створює зовнішній ключ на users.id; при видаленні юзера -- видаляє пов'язані записи
c) Створює колонку user_id і забороняє NULL
d) Створює нову таблицю users

**4. Що робить `php artisan migrate:fresh`?**

a) Запускає тільки нові міграції
b) Видаляє ВСІ таблиці та запускає всі міграції заново
c) Відкочує останню міграцію
d) Показує список всіх міграцій

**5. Як правильно додати нову колонку до існуючої таблиці?**

a) Змінити існуючу міграцію і запустити `migrate:fresh`
b) Створити нову міграцію з `Schema::table()` і запустити `migrate`
c) Напряму змінити базу даних
d) Видалити таблицю і створити заново

---

## Практичне завдання

### Завдання: Додайте колонку `notes` до таблиці tasks

1. **Створіть нову міграцію:**

```bash
php artisan make:migration add_notes_to_tasks_table
```

2. **Напишіть код міграції:**

```php
public function up(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->text('notes')->nullable()->after('description');
    });
}

public function down(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->dropColumn('notes');
    });
}
```

3. **Запустіть міграцію:**

```bash
php artisan migrate
```

4. **Перевірте, що колонка з'явилась:**

```bash
php artisan db:table tasks
```

Ви повинні побачити `notes` між `description` та `status`.

5. **Відкотіть міграцію:**

```bash
php artisan migrate:rollback
```

6. **Перевірте, що колонка зникла:**

```bash
php artisan db:table tasks
```

Колонки `notes` більше немає.

7. **Запустіть міграцію назад** (щоб колонка залишилась для наступних уроків):

```bash
php artisan migrate
```

> **Висновок:** ви щойно побачили повний цикл: створення міграції -> apply -> verify -> rollback -> verify -> apply знову. Це працює як git: ви завжди можете рухатись вперед і назад.

---

## Відповіді на тест

1. **a) PHP-файл, який описує зміни в базі даних** -- міграція -- це файл з методами `up()` (застосувати зміни) та `down()` (відкотити зміни). Це version control для бази даних.

2. **b) `->nullable()`** -- цей модифікатор дозволяє колонці мати значення NULL. Це аналог `?` у TypeScript: `description?: string`.

3. **b) Створює зовнішній ключ на users.id; при видаленні юзера -- видаляє пов'язані записи** -- `foreignId` створює колонку типу BIGINT, `constrained()` додає foreign key constraint на таблицю users (визначається автоматично за назвою `user_id`), `cascadeOnDelete()` видаляє залежні записи при видаленні батьківського запису.

4. **b) Видаляє ВСІ таблиці та запускає всі міграції заново** -- `migrate:fresh` -- це "ядерна кнопка": видаляє все і будує з нуля. Використовуйте тільки в розробці!

5. **b) Створити нову міграцію з `Schema::table()` і запустити `migrate`** -- ніколи не змінюйте існуючу міграцію, яка вже виконана. Створіть нову міграцію -- це як новий коміт в git.
