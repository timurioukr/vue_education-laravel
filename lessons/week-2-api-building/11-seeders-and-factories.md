# Урок 11: Seeders, Factories та тестові дані

## Що ви вивчите

- Навіщо потрібні фабрики та seeders (і чому ручне створення даних -- це втрата часу)
- Як створювати Model Factories з реалістичними фейковими даними
- Бібліотеку Faker -- генератор імен, текстів, дат, email та іншого
- Factory states для різних варіацій моделі (завершені, прострочені задачі)
- Factory relationships: `->for()`, `->has()`, `->recycle()`
- Як створювати та організовувати Seeders
- Команди `db:seed` та `migrate:fresh --seed`
- Factory callbacks: `afterCreating()` для складних зв'язків

## Паралелі з JS/Vue

| Laravel / PHP | Vue / Nuxt / JS | Коментар |
|---|---|---|
| Model Factory | MSW handlers, що генерують фейкові дані | Шаблон для створення об'єктів |
| Faker (PHP) | `@faker-js/faker` | Та сама ідея, майже однаковий API |
| `Task::factory()->create()` | `generateFakeTask()` | Створити один фейковий об'єкт |
| `Task::factory()->count(10)->create()` | `Array.from({ length: 10 }, () => generateFakeTask())` | Створити масив фейкових об'єктів |
| `->make()` (без збереження) | Просто створити об'єкт в пам'яті | Корисно для тестів |
| Factory states | Різні fixture presets для тестування | `overdue`, `done` варіації |
| Seeder | setup-скрипт, що наповнює mock-базу | Запускається одною командою |
| `DatabaseSeeder` | `setupMockData()` головна функція | Викликає інші seeders |
| `migrate:fresh --seed` | Скинути mock-базу і наповнити заново | "Чистий старт" для розробки |
| `Factory::recycle($user)` | Повторне використання існуючої змінної | Щоб не створювати зайві записи |
| `afterCreating()` | `.then()` після створення | Додаткові дії після створення |

## Теорія

### Проблема: порожня база даних

Уявіть: ви розробляєте API, запускаєте `migrate:fresh`, і база порожня. Щоб перевірити список задач, потрібно вручну створити через curl або Postman кілька задач, категорій, користувачів. Це займає 5-10 хвилин. А потім ви знову скинули базу -- і все спочатку.

У фронтенд-розробці ви стикаєтесь з тим самим: коли MSW (Mock Service Worker) повертає порожній масив, тестувати нема що. Тому ви пишете mock-дані вручну або використовуєте `@faker-js/faker`.

Laravel вирішує цю проблему елегантно: **Factories** генерують реалістичні фейкові дані, а **Seeders** наповнюють базу цими даними однією командою.

### Faker: генератор фейкових даних

Laravel включає бібліотеку Faker "з коробки". Якщо ви використовували `@faker-js/faker` у JavaScript, API буде дуже знайомим:

```php
// Laravel (PHP Faker)
fake()->name();              // "John Doe"
fake()->email();             // "john@example.com"
fake()->sentence();          // "The quick brown fox."
fake()->paragraph();         // Довгий текст
fake()->boolean();           // true або false
fake()->numberBetween(1, 5); // Випадкове число від 1 до 5
fake()->dateTimeBetween('-1 month', '+1 month'); // Дата в діапазоні
fake()->randomElement(['low', 'medium', 'high']); // Випадковий елемент
fake()->hexColor();          // "#a3c1f2"
fake()->word();              // "voluptas"
fake()->url();               // "https://example.com"
fake()->optional()->sentence(); // sentence або null
```

Порівняйте з JavaScript:

```javascript
// @faker-js/faker (JavaScript)
import { faker } from '@faker-js/faker';

faker.person.fullName();       // "John Doe"
faker.internet.email();        // "john@example.com"
faker.lorem.sentence();        // "The quick brown fox."
faker.lorem.paragraph();       // Довгий текст
faker.datatype.boolean();      // true або false
faker.number.int({ min: 1, max: 5 }); // Випадкове число
faker.date.between({ from: ..., to: ... }); // Дата в діапазоні
faker.helpers.arrayElement(['low', 'medium', 'high']); // Випадковий елемент
faker.color.rgb();             // "#a3c1f2"
```

Як бачите, концепція ідентична. Назви методів трохи відрізняються, але ідея та сама.

### Model Factories

Factory -- це клас, який описує, як створити фейковий екземпляр моделі. Кожен Factory має метод `definition()`, що повертає масив атрибутів:

```php
// database/factories/TaskFactory.php

namespace Database\Factories;

use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['pending', 'in_progress', 'done']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'deadline' => fake()->dateTimeBetween('now', '+2 months'),
        ];
    }
}
```

Це як написати функцію-генератор у JavaScript:

```javascript
// JS аналог
function generateFakeTask() {
    return {
        title: faker.lorem.sentence(4),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['pending', 'in_progress', 'done']),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
        deadline: faker.date.between({ from: new Date(), to: addMonths(new Date(), 2) }),
    };
}
```

### Використання фабрик

```php
// Створити одну задачу і зберегти в базу
$task = Task::factory()->create();

// Створити 10 задач
$tasks = Task::factory()->count(10)->create();

// Створити задачу з конкретними значеннями (перезаписують faker)
$task = Task::factory()->create([
    'title' => 'My specific task',
    'status' => 'done',
]);

// make() -- створити об'єкт БЕЗ збереження в базу
$task = Task::factory()->make();
// $task існує тільки в пам'яті, id = null

// createMany -- масив задач з різними значеннями
$tasks = Task::factory()->createMany([
    ['title' => 'First task'],
    ['title' => 'Second task'],
    ['title' => 'Third task'],
]);
```

У JavaScript це виглядало б так:

```javascript
// JS аналоги
const task = generateFakeTask();                          // make()
await api.post('/tasks', generateFakeTask());             // create()
const tasks = Array.from({ length: 10 }, generateFakeTask); // count(10)->make()
```

### Factory States

States -- це іменовані варіації моделі. Наприклад, "прострочена задача", "завершена задача", "задача з високим пріоритетом":

```php
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['pending', 'in_progress', 'done']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'deadline' => fake()->dateTimeBetween('now', '+2 months'),
        ];
    }

    /**
     * Прострочена задача.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'deadline' => fake()->dateTimeBetween('-1 month', '-1 day'),
        ]);
    }

    /**
     * Завершена задача.
     */
    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'done',
        ]);
    }

    /**
     * Задача з високим пріоритетом.
     */
    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'priority' => 'high',
        ]);
    }
}
```

Використання:

```php
// Створити 5 прострочених задач
$overdue = Task::factory()->count(5)->overdue()->create();

// Створити завершену задачу з високим пріоритетом
$task = Task::factory()->done()->highPriority()->create();

// Комбінувати стани: прострочена + високий пріоритет
$urgent = Task::factory()->overdue()->highPriority()->create();
```

Це як різні preset'и у тестах:

```javascript
// JS аналог -- різні "пресети" для генерації
const generateOverdueTask = () => ({
    ...generateFakeTask(),
    status: 'pending',
    deadline: faker.date.past(),
});

const generateCompletedTask = () => ({
    ...generateFakeTask(),
    status: 'done',
});
```

Різниця: у Laravel states можна **ланцюжково комбінувати**, а в JS потрібно вручну мерджити об'єкти.

### Factory Relationships

Фабрики вміють автоматично створювати пов'язані моделі:

#### `->for()` -- "належить до" (BelongsTo)

```php
// Створити задачу для конкретної категорії
$category = Category::factory()->create(['name' => 'Work']);
$task = Task::factory()->for($category)->create();
// $task->category_id = $category->id

// Або створити нову категорію "на льоту"
$task = Task::factory()
    ->for(Category::factory()->state(['name' => 'Personal']))
    ->create();
```

#### `->has()` -- "має багато" (HasMany)

```php
// Створити категорію з 5 задачами
$category = Category::factory()
    ->has(Task::factory()->count(5))
    ->create();
// $category->tasks -- колекція з 5 задач

// Або з іменованим зв'язком
$category = Category::factory()
    ->has(Task::factory()->count(3)->done(), 'tasks')
    ->create();
```

#### `->recycle()` -- повторне використання існуючої моделі

Без `recycle()` кожна фабрика створює **нову** пов'язану модель:

```php
// ❌ Без recycle -- створить 10 різних категорій
$tasks = Task::factory()->count(10)->create();
// Кожна задача має свою category_id

// ✅ З recycle -- всі задачі використовують існуючу категорію
$category = Category::factory()->create(['name' => 'Work']);
$tasks = Task::factory()
    ->count(10)
    ->recycle($category)
    ->create();
// Всі 10 задач мають category_id = $category->id
```

`recycle()` також працює з колекціями:

```php
$categories = Category::factory()->count(3)->create();
$tasks = Task::factory()
    ->count(20)
    ->recycle($categories) // Кожна задача отримає випадкову з 3 категорій
    ->create();
```

### Seeders

Seeder -- це клас, який наповнює базу даних тестовими даними. Він використовує фабрики для створення записів:

```php
// database/seeders/TaskSeeder.php

namespace Database\Seeders;

use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // Створити 20 звичайних задач
        Task::factory()->count(20)->create();

        // Створити 5 прострочених
        Task::factory()->count(5)->overdue()->create();

        // Створити 3 завершених
        Task::factory()->count(3)->done()->create();
    }
}
```

### DatabaseSeeder -- головний seeder

`DatabaseSeeder` -- це точка входу. Він викликає інші seeders в правильному порядку:

```php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            TagSeeder::class,
            TaskSeeder::class,
        ]);
    }
}
```

Порядок має значення: спочатку створюємо Users і Categories (бо Tasks залежать від них), потім Tasks.

Це як setup-скрипт у тестах:

```javascript
// JS аналог
async function seedDatabase() {
    await seedUsers();      // спочатку користувачі
    await seedCategories(); // потім категорії
    await seedTags();       // теги
    await seedTasks();      // задачі (залежать від попередніх)
}
```

### Запуск seeders

```bash
# Запустити всі seeders (через DatabaseSeeder)
php artisan db:seed

# Запустити конкретний seeder
php artisan db:seed --class=TaskSeeder

# Скинути базу і заповнити заново -- найчастіша команда під час розробки
php artisan migrate:fresh --seed
```

`migrate:fresh --seed` -- це як "видалити node_modules, встановити заново і запустити setup". Повний скид до чистого стану з тестовими даними.

### Factory Callbacks: afterCreating()

Для складних зв'язків (наприклад, many-to-many) використовуйте `afterCreating()`:

```php
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['pending', 'in_progress', 'done']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'deadline' => fake()->dateTimeBetween('now', '+2 months'),
        ];
    }

    /**
     * Після створення задачі -- прикріпити випадкові теги.
     */
    public function withTags(int $count = 3): static
    {
        return $this->afterCreating(function (Task $task) use ($count) {
            $tags = \App\Models\Tag::factory()->count($count)->create();
            $task->tags()->attach($tags);
        });
    }
}
```

Використання:

```php
// Створити задачу з 3 тегами
$task = Task::factory()->withTags(3)->create();

// Створити 10 задач, кожна з 2 тегами
$tasks = Task::factory()->count(10)->withTags(2)->create();
```

### Зв'язок Factory і Model

Щоб фабрика працювала, модель повинна використовувати трейт `HasFactory`:

```php
// app/Models/Task.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    // ...
}
```

Цей трейт додає статичний метод `factory()` до моделі. Laravel автоматично знаходить фабрику за конвенцією імен: модель `Task` шукає фабрику `TaskFactory` у `database/factories/`.

## Практика: крок за кроком

### Крок 1: Створіть TaskFactory

```bash
php artisan make:factory TaskFactory
```

Відредагуйте `database/factories/TaskFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(rand(3, 6)),
            'description' => fake()->optional(0.8)->paragraph(), // 80% мають опис
            'status' => fake()->randomElement(['pending', 'in_progress', 'done']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'deadline' => fake()->optional(0.7)->dateTimeBetween('now', '+3 months'), // 70% мають дедлайн
            'category_id' => Category::factory(),
        ];
    }

    /**
     * Прострочена задача (дедлайн у минулому, не завершена).
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'deadline' => fake()->dateTimeBetween('-2 months', '-1 day'),
        ]);
    }

    /**
     * Завершена задача.
     */
    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'done',
        ]);
    }

    /**
     * Задача з високим пріоритетом.
     */
    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'priority' => 'high',
            'deadline' => fake()->dateTimeBetween('now', '+1 week'), // терміново
        ]);
    }

    /**
     * Після створення -- прикріпити випадкові теги.
     */
    public function withTags(int $count = 3): static
    {
        return $this->afterCreating(function (Task $task) use ($count) {
            $tags = \App\Models\Tag::inRandomOrder()->limit($count)->get();

            // Якщо тегів не вистачає, створюємо нові
            if ($tags->count() < $count) {
                $newTags = \App\Models\Tag::factory()->count($count - $tags->count())->create();
                $tags = $tags->merge($newTags);
            }

            $task->tags()->attach($tags);
        });
    }
}
```

### Крок 2: Створіть CategoryFactory

```bash
php artisan make:factory CategoryFactory
```

Відредагуйте `database/factories/CategoryFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Предвизначені категорії для реалістичності.
     */
    private static array $categoryNames = [
        'Work', 'Personal', 'Shopping', 'Health', 'Education',
        'Finance', 'Home', 'Travel', 'Hobbies', 'Urgent',
    ];

    private static int $nameIndex = 0;

    public function definition(): array
    {
        // Беремо імена по порядку, щоб не було дублікатів
        $name = self::$categoryNames[self::$nameIndex % count(self::$categoryNames)];
        self::$nameIndex++;

        return [
            'name' => $name,
            'color' => fake()->hexColor(), // "#a3c1f2"
        ];
    }
}
```

> **Примітка:** Якщо у вашій моделі `Category` немає поля `color`, адаптуйте фабрику під вашу схему. Видаліть `'color'` або додайте міграцію з цим полем.

### Крок 3: Створіть TagFactory

```bash
php artisan make:factory TagFactory
```

Відредагуйте `database/factories/TagFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tag>
 */
class TagFactory extends Factory
{
    private static array $tagNames = [
        'urgent', 'bug', 'feature', 'improvement', 'documentation',
        'design', 'backend', 'frontend', 'devops', 'research',
        'meeting', 'review', 'testing', 'deployment', 'planning',
    ];

    private static int $nameIndex = 0;

    public function definition(): array
    {
        $name = self::$tagNames[self::$nameIndex % count(self::$tagNames)];
        self::$nameIndex++;

        return [
            'name' => $name,
        ];
    }
}
```

### Крок 4: Переконайтесь, що моделі мають HasFactory

Перевірте, що кожна модель використовує трейт `HasFactory`:

```php
// app/Models/Task.php
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;
    // ...
}

// app/Models/Category.php
class Category extends Model
{
    use HasFactory;
    // ...
}

// app/Models/Tag.php
class Tag extends Model
{
    use HasFactory;
    // ...
}
```

### Крок 5: Створіть seeders

```bash
php artisan make:seeder CategorySeeder
php artisan make:seeder TagSeeder
php artisan make:seeder TaskSeeder
```

**CategorySeeder** (`database/seeders/CategorySeeder.php`):

```php
<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        Category::factory()->count(5)->create();
    }
}
```

**TagSeeder** (`database/seeders/TagSeeder.php`):

```php
<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        Tag::factory()->count(10)->create();
    }
}
```

**TaskSeeder** (`database/seeders/TaskSeeder.php`):

```php
<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // Отримуємо існуючі категорії (створені CategorySeeder)
        $categories = Category::all();

        // 15 звичайних задач з випадковими категоріями
        Task::factory()
            ->count(15)
            ->recycle($categories)
            ->withTags(2)
            ->create();

        // 5 прострочених задач
        Task::factory()
            ->count(5)
            ->overdue()
            ->recycle($categories)
            ->withTags(1)
            ->create();

        // 5 завершених задач
        Task::factory()
            ->count(5)
            ->done()
            ->recycle($categories)
            ->create();

        // 3 задачі з високим пріоритетом
        Task::factory()
            ->count(3)
            ->highPriority()
            ->recycle($categories)
            ->withTags(3)
            ->create();
    }
}
```

### Крок 6: Налаштуйте DatabaseSeeder

Відредагуйте `database/seeders/DatabaseSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Порядок важливий: спочатку те, від чого залежать інші
        $this->call([
            CategorySeeder::class,
            TagSeeder::class,
            TaskSeeder::class,
        ]);
    }
}
```

> **Примітка:** Якщо у вас є `UserSeeder`, додайте його першим у масив. Задачі можуть залежати від користувачів через `user_id`.

### Крок 7: Запустіть і перевірте

```bash
# Скинути базу і наповнити тестовими даними
php artisan migrate:fresh --seed
```

Ви побачите щось на кшталт:

```
Dropping all tables ...
Tables dropped successfully.
Running migrations ...
  2024_01_01_000001_create_users_table ........... 5.20ms DONE
  2024_01_01_000002_create_categories_table ....... 2.10ms DONE
  2024_01_01_000003_create_tasks_table ............ 3.40ms DONE
  2024_01_01_000004_create_tags_table ............. 1.80ms DONE
  2024_01_01_000005_create_tag_task_table ......... 2.50ms DONE

  Seeding: Database\Seeders\CategorySeeder
  Seeded:  Database\Seeders\CategorySeeder (15.20ms)
  Seeding: Database\Seeders\TagSeeder
  Seeded:  Database\Seeders\TagSeeder (8.30ms)
  Seeding: Database\Seeders\TaskSeeder
  Seeded:  Database\Seeders\TaskSeeder (120.50ms)
```

### Крок 8: Перевірте через tinker і API

```bash
php artisan tinker
```

```php
>>> Task::count()
=> 28

>>> Task::where('status', 'done')->count()
=> 5

>>> Task::where('status', 'pending')->where('deadline', '<', now())->count()
=> 5  // прострочені

>>> Category::withCount('tasks')->get()->pluck('tasks_count', 'name')
=> ["Work" => 6, "Personal" => 8, "Shopping" => 4, ...]

>>> Task::first()->tags->pluck('name')
=> ["urgent", "frontend"]
```

Перевірте через API:

```bash
# Запустіть сервер
php artisan serve

# GET /api/tasks -- тепер є реальні дані
curl -s http://localhost:8000/api/tasks | json_pp
```

Ви побачите 28 задач з реалістичними назвами, описами, статусами та дедлайнами.

## Перевірка

Після виконання всіх кроків:

```bash
# 1. Скинути і наповнити
php artisan migrate:fresh --seed
# Має пройти без помилок

# 2. Перевірити кількість записів
php artisan tinker --execute="echo 'Tasks: ' . App\Models\Task::count() . ', Categories: ' . App\Models\Category::count() . ', Tags: ' . App\Models\Tag::count();"
# Очікуємо: Tasks: 28, Categories: 5, Tags: 10

# 3. Перевірити API
curl -s http://localhost:8000/api/tasks | json_pp | head -20
# Очікуємо: JSON з масивом задач

# 4. Повторити migrate:fresh --seed -- результат має бути таким самим
php artisan migrate:fresh --seed
# Ідемпотентність: кожен запуск дає передбачуваний результат
```

## Міні-тест

**1. Яка різниця між `create()` та `make()` у фабриці?**

a) `create()` створює об'єкт в пам'яті, `make()` зберігає в базу
b) `create()` зберігає в базу і повертає модель, `make()` створює об'єкт без збереження
c) Різниці немає, це синоніми
d) `make()` створює кілька записів, `create()` тільки один

**2. Для чого використовується `recycle()` у фабриці?**

a) Для видалення створених записів після тесту
b) Для повторного використання існуючих моделей замість створення нових
c) Для оновлення існуючих записів новими даними
d) Для кешування фабрики між тестами

**3. Що робить `php artisan migrate:fresh --seed`?**

a) Запускає тільки нові міграції та seeders
b) Видаляє всі таблиці, запускає міграції заново, потім запускає seeders
c) Видаляє тільки тестові дані
d) Робить бекап бази і створює нову

**4. Навіщо потрібні factory states?**

a) Для зберігання стану фабрики між запусками
b) Для створення іменованих варіацій моделі (overdue, done тощо)
c) Для валідації даних перед створенням
d) Для підключення до різних баз даних

**5. Що робить `afterCreating()` у фабриці?**

a) Видаляє модель після створення
b) Виконує додаткові дії після збереження моделі в базу (наприклад, прикріплює зв'язки)
c) Перевіряє, чи модель створена правильно
d) Запускається тільки після всіх seeders

## Практичне завдання

Створіть реалістичний набір тестових даних:

1. Додайте factory state `done` до `TaskFactory`, який встановлює `status` в `'done'`
2. Створіть seeder `TestDataSeeder`, який створює:
   - Рівно **5 завершених** задач
   - Рівно **15 незавершених** (pending) задач
3. Запустіть seeder і перевірте результат в tinker

### Підказки

State `done` (якщо ще не додали):

```php
public function done(): static
{
    return $this->state(fn (array $attributes) => [
        'status' => 'done',
    ]);
}
```

Для "pending" створіть state або просто передайте атрибут:

```php
public function pending(): static
{
    return $this->state(fn (array $attributes) => [
        'status' => 'pending',
    ]);
}
```

Seeder:

```php
<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Task;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Спочатку створимо категорії, щоб задачі мали куди посилатись
        $categories = Category::factory()->count(3)->create();

        // 5 завершених задач
        Task::factory()
            ->count(5)
            ->done()
            ->recycle($categories)
            ->create();

        // 15 незавершених задач
        Task::factory()
            ->count(15)
            ->state(['status' => 'pending'])
            ->recycle($categories)
            ->create();
    }
}
```

Перевірка:

```bash
php artisan migrate:fresh
php artisan db:seed --class=TestDataSeeder

php artisan tinker
```

```php
>>> Task::where('status', 'done')->count()
=> 5

>>> Task::where('status', 'pending')->count()
=> 15

>>> Task::count()
=> 20
```

## Відповіді на тест

1. **b)** `create()` зберігає модель у базу даних і повертає її з `id`. `make()` створює об'єкт тільки в пам'яті -- корисно для тестів, коли не потрібно зберігати в базу.
2. **b)** `recycle()` каже фабриці використовувати існуючу модель (наприклад, категорію) замість створення нової для кожного запису. Без нього 10 задач створять 10 різних категорій.
3. **b)** `migrate:fresh --seed` видаляє **всі** таблиці, запускає всі міграції з нуля, а потім запускає `DatabaseSeeder`. Це "повний скид" бази даних.
4. **b)** Factory states створюють іменовані варіації. `Task::factory()->overdue()` завжди створює задачу з дедлайном у минулому, `->done()` -- завершену (`status = 'done'`). Стани можна комбінувати.
5. **b)** `afterCreating()` виконує код **після** збереження моделі в базу. Це потрібно для зв'язків, які вимагають `id` (наприклад, many-to-many через `attach()`).
