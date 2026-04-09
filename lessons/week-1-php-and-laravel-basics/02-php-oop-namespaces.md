# Урок 2: PHP ООП та простори імен для JavaScript-розробників

## Що ви вивчите

- Класи в PHP: властивості, методи, конструктор, constructor promotion
- Модифікатори доступу: `public`, `protected`, `private` та `readonly`
- Статичні методи та властивості
- Інтерфейси: контракти з перевіркою під час виконання
- Абстрактні класи
- Трейти: як Vue composables, але для класів
- Простори імен (namespaces): організація коду як ES modules
- `use` та аліаси
- Enums (PHP 8.1+): типобезпечні перелічення
- Composer: автозавантаження, PSR-4, аналогія з npm
- Типи: union types, intersection types, nullable types
- `match` з enums

---

## Паралелі з JS/Vue

| Концепція | JavaScript / Vue | PHP |
|---|---|---|
| Клас | `class User { }` | `class User { }` |
| Конструктор | `constructor(name) { this.name = name }` | `public function __construct(public string $name)` |
| Приватне поле | `#name` | `private string $name` |
| Геттер | `get fullName()` | `public function getFullName()` (або `__get`) |
| Інтерфейс | TypeScript `interface` | `interface` (перевіряється в runtime) |
| Міксин/composable | `useAuth()` composable | `trait HasAuth` |
| Модулі | `import { User } from './User'` | `use App\Models\User` |
| Enum | `const Status = { ... } as const` | `enum Status: string { ... }` |
| package.json | `package.json` | `composer.json` |
| npm install | `npm install` | `composer require` |
| node_modules | `node_modules/` | `vendor/` |

---

## Теорія

### 1. Класи: основи

**У Vue ви рідко пишете класи (Composition API замість класів) --> в PHP класи -- основа всього, включаючи Laravel.**

```javascript
// JavaScript
class Task {
    constructor(title, status = "pending") {
        this.title = title;
        this.status = status;
        this.createdAt = new Date();
    }

    isComplete() {
        return this.status === "done";
    }

    toString() {
        return `[${this.status}] ${this.title}`;
    }
}

const task = new Task("Buy milk");
console.log(task.toString());   // [pending] Buy milk
console.log(task.isComplete()); // false
```

```php
<?php
// PHP
class Task
{
    public string $title;
    public string $status;
    public string $createdAt;

    public function __construct(string $title, string $status = 'pending')
    {
        $this->title = $title;
        $this->status = $status;
        $this->createdAt = date('Y-m-d H:i:s');
    }

    public function isComplete(): bool
    {
        return $this->status === 'done';
    }

    public function __toString(): string
    {
        return "[{$this->status}] {$this->title}";
    }
}

$task = new Task('Buy milk');
echo $task;                // [pending] Buy milk
echo $task->title;         // Buy milk
var_dump($task->isComplete()); // bool(false)
```

**Ключові відмінності від JS:**
- Властивості потрібно оголошувати заздалегідь (як TypeScript з `strict`)
- Замість `this.title` -- `$this->title` (стрілка `->` замість крапки)
- Кожна властивість та метод мають модифікатор доступу (`public`, `private`, `protected`)
- Магічний метод `__toString()` замість `toString()`
- Магічний метод `__construct()` замість `constructor()`

#### Constructor Promotion (PHP 8.0+)

Це одна з найкращих фіч PHP 8. Замість того, щоб оголошувати властивості окремо і присвоювати їх в конструкторі, можна зробити все в один рядок:

```php
<?php
// PHP 7 / старий спосіб -- багатослівно
class TaskOld
{
    public string $title;
    public string $status;
    public int $priority;

    public function __construct(string $title, string $status, int $priority)
    {
        $this->title = $title;
        $this->status = $status;
        $this->priority = $priority;
    }
}

// PHP 8+ / Constructor Promotion -- коротко і чисто
class Task
{
    public function __construct(
        public string $title,
        public string $status = 'pending',
        public int $priority = 3,
    ) {
        // тіло конструктора (необовʼязкове)
    }
}

$task = new Task('Buy milk');
echo $task->title;    // Buy milk
echo $task->status;   // pending
echo $task->priority; // 3

$task2 = new Task(
    title: 'Learn PHP',      // Named arguments (PHP 8+)
    priority: 1,
    status: 'in_progress',
);
```

> **Named arguments** (як показано вище) -- це ще одна фіча PHP 8, яка дозволяє передавати аргументи за іменем у будь-якому порядку. В JavaScript такого немає нативно (зазвичай використовують обʼєкт з деструктуризацією).

---

### 2. Модифікатори доступу

**У Vue/JS ви маєте `#private` поля (ES2022) --> в PHP є три рівні доступу: `public`, `protected`, `private`.**

```javascript
// JavaScript
class User {
    name;           // public (за замовчуванням)
    #password;      // private (# синтаксис)

    constructor(name, password) {
        this.name = name;
        this.#password = password;
    }

    #hashPassword() {  // private method
        return `hashed_${this.#password}`;
    }

    checkPassword(input) {
        return this.#hashPassword() === `hashed_${input}`;
    }
}
```

```php
<?php
// PHP
class User
{
    public function __construct(
        public string $name,           // доступний звідусіль
        protected string $email,       // доступний в цьому класі та дочірніх
        private string $password,      // доступний тільки в цьому класі
    ) {}

    private function hashPassword(): string
    {
        return 'hashed_' . $this->password;
    }

    public function checkPassword(string $input): bool
    {
        return $this->hashPassword() === 'hashed_' . $input;
    }

    public function getEmail(): string
    {
        return $this->email;
    }
}

$user = new User('Tim', 'tim@example.com', 'secret123');

echo $user->name;            // Tim -- OK (public)
// echo $user->email;        // Error! (protected)
// echo $user->password;     // Error! (private)
echo $user->getEmail();      // tim@example.com -- OK через public метод
```

| Модифікатор | Де доступний | Аналог JS |
|---|---|---|
| `public` | Звідусіль | Звичайне поле |
| `protected` | Клас + дочірні класи | Немає прямого аналога |
| `private` | Тільки в цьому класі | `#field` |

#### readonly (PHP 8.1+)

```php
<?php
class Task
{
    public function __construct(
        public readonly int $id,          // Не можна змінити після створення
        public readonly string $title,
        public string $status = 'pending', // Цю можна змінювати
    ) {}
}

$task = new Task(1, 'Buy milk');
echo $task->title;    // Buy milk
// $task->title = 'New'; // Error! Cannot modify readonly property
$task->status = 'done'; // OK -- не readonly
```

> `readonly` -- це справжній аналог TypeScript `readonly`, але з runtime-перевіркою. В JS `Object.freeze()` -- найближчий аналог.

---

### 3. Наслідування

```javascript
// JavaScript
class Animal {
    constructor(name) {
        this.name = name;
    }

    speak() {
        return `${this.name} makes a sound`;
    }
}

class Dog extends Animal {
    speak() {
        return `${this.name} barks`;
    }
}
```

```php
<?php
// PHP
class Animal
{
    public function __construct(
        public string $name,
    ) {}

    public function speak(): string
    {
        return "{$this->name} makes a sound";
    }
}

class Dog extends Animal
{
    public function speak(): string
    {
        return "{$this->name} barks";
    }
}

$dog = new Dog('Rex');
echo $dog->speak(); // Rex barks

// Перевірка типу (як instanceof в JS)
var_dump($dog instanceof Dog);    // bool(true)
var_dump($dog instanceof Animal); // bool(true)
```

#### parent::

```php
<?php
class BaseTask
{
    public function __construct(
        public string $title,
        public string $status = 'pending',
    ) {}

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'status' => $this->status,
        ];
    }
}

class PriorityTask extends BaseTask
{
    public function __construct(
        string $title,
        string $status = 'pending',
        public int $priority = 3,
    ) {
        parent::__construct($title, $status);  // Виклик батьківського конструктора
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [  // Розширення батьківського масиву
            'priority' => $this->priority,
        ]);
    }
}

$task = new PriorityTask('Buy milk', 'pending', 1);
print_r($task->toArray());
// Array ( [title] => Buy milk [status] => pending [priority] => 1 )
```

---

### 4. Статичні методи та властивості

**У Vue/JS ви рідко використовуєте `static` --> в PHP статичні методи дуже поширені, особливо в Laravel (facades, factory methods).**

```javascript
// JavaScript
class MathHelper {
    static PI = 3.14159;

    static add(a, b) {
        return a + b;
    }
}

console.log(MathHelper.PI);        // 3.14159
console.log(MathHelper.add(1, 2)); // 3
```

```php
<?php
// PHP
class MathHelper
{
    public static float $PI = 3.14159;

    public static function add(int $a, int $b): int
    {
        return $a + $b;
    }
}

echo MathHelper::$PI;          // 3.14159 (зверніть увагу на :: замість ->)
echo MathHelper::add(1, 2);   // 3
```

> **Відмінність від JS:** В PHP для доступу до статичних членів використовується `::` (подвійна двокрапка, "Paamayim Nekudotayim"), а для звичайних -- `->`.

#### Factory Pattern (дуже поширений в Laravel)

```php
<?php
class Task
{
    public function __construct(
        public string $title,
        public string $status,
        public int $priority,
        public string $createdAt,
    ) {}

    // Factory methods -- статичні методи для створення обʼєктів
    public static function create(string $title, int $priority = 3): self
    {
        return new self(
            title: $title,
            status: 'pending',
            priority: $priority,
            createdAt: date('Y-m-d H:i:s'),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'],
            status: $data['status'] ?? 'pending',
            priority: $data['priority'] ?? 3,
            createdAt: $data['created_at'] ?? date('Y-m-d H:i:s'),
        );
    }
}

// Використання
$task1 = Task::create('Buy milk');
$task2 = Task::fromArray(['title' => 'Learn PHP', 'status' => 'in_progress']);
```

> **В Laravel ви постійно побачите цей паттерн:** `User::find(1)`, `Task::create([...])`, `Response::json([...])`. Всі ці `::` -- це виклики статичних методів.

---

### 5. Інтерфейси

**У Vue/TypeScript інтерфейси існують тільки під час компіляції і зникають у runtime --> в PHP інтерфейси перевіряються під час виконання програми.**

```typescript
// TypeScript -- тільки compile-time перевірка
interface Taskable {
    getId(): number;
    getTitle(): string;
    toArray(): Record<string, unknown>;
}

class Task implements Taskable {
    // TypeScript перевіряє під час компіляції, але в runtime interface зникає
}
```

```php
<?php
// PHP -- runtime перевірка!
interface Taskable
{
    public function getId(): int;
    public function getTitle(): string;
    public function toArray(): array;
}

class Task implements Taskable
{
    public function __construct(
        private int $id,
        private string $title,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
        ];
    }
}

// Якщо клас не реалізує всі методи інтерфейсу -- Fatal Error!
// Це перевірка в RUNTIME, не тільки в IDE.
```

#### Кілька інтерфейсів

```php
<?php
interface HasTimestamps
{
    public function getCreatedAt(): string;
    public function getUpdatedAt(): string;
}

interface Serializable
{
    public function toJson(): string;
    public function toArray(): array;
}

// Клас може реалізувати кілька інтерфейсів (в JS/TS implements теж працює)
class Task implements HasTimestamps, Serializable
{
    public function __construct(
        private string $title,
        private string $createdAt,
        private string $updatedAt,
    ) {}

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }

    public function toJson(): string
    {
        return json_encode($this->toArray());
    }
}
```

#### Type hinting з інтерфейсами

Найпотужніше використання інтерфейсів -- це type hinting. Функція приймає будь-який обʼєкт, що реалізує інтерфейс:

```php
<?php
interface Renderable
{
    public function render(): string;
}

class HtmlTask implements Renderable
{
    public function __construct(private string $title) {}

    public function render(): string
    {
        return "<li>{$this->title}</li>";
    }
}

class PlainTextTask implements Renderable
{
    public function __construct(private string $title) {}

    public function render(): string
    {
        return "- {$this->title}";
    }
}

// Функція приймає БУДЬ-ЯКИЙ обʼєкт, що реалізує Renderable
function displayTask(Renderable $task): void
{
    echo $task->render() . "\n";
}

displayTask(new HtmlTask('Buy milk'));       // <li>Buy milk</li>
displayTask(new PlainTextTask('Buy milk'));   // - Buy milk
```

---

### 6. Абстрактні класи

**У Vue/JS абстрактних класів немає нативно --> в PHP `abstract class` -- це клас, від якого не можна створити обʼєкт напряму, але можна наслідувати.**

Абстрактний клас -- це щось між інтерфейсом і звичайним класом. Він може містити як реалізовані методи, так і "порожні" (абстрактні), які дочірні класи МУСЯТЬ реалізувати.

```php
<?php
abstract class BaseTask
{
    public function __construct(
        protected string $title,
        protected string $status = 'pending',
    ) {}

    // Звичайний метод -- з реалізацією
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    // Абстрактний метод -- БЕЗ реалізації, дочірній клас МУСИТЬ його написати
    abstract public function calculatePriority(): int;
    abstract public function toArray(): array;
}

class UrgentTask extends BaseTask
{
    public function __construct(
        string $title,
        private string $deadline,
    ) {
        parent::__construct($title, 'pending');
    }

    public function calculatePriority(): int
    {
        // Чим ближче дедлайн -- тим вищий пріоритет
        $daysLeft = (int) ((strtotime($this->deadline) - time()) / 86400);
        return max(1, min(5, 5 - $daysLeft));
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'status' => $this->status,
            'deadline' => $this->deadline,
            'priority' => $this->calculatePriority(),
        ];
    }
}

class SimpleTask extends BaseTask
{
    public function __construct(
        string $title,
        private int $priority = 3,
    ) {
        parent::__construct($title, 'pending');
    }

    public function calculatePriority(): int
    {
        return $this->priority;
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'status' => $this->status,
            'priority' => $this->priority,
        ];
    }
}

// $task = new BaseTask('test');  // Fatal Error! Не можна створити абстрактний клас
$urgent = new UrgentTask('Fix bug', '2026-04-10');
$simple = new SimpleTask('Buy milk', 2);

echo $urgent->getTitle() . "\n";            // Fix bug (метод з батька)
echo $urgent->calculatePriority() . "\n";   // залежить від дати
print_r($simple->toArray());
```

**Коли що використовувати:**

| Засіб | Коли використовувати |
|---|---|
| `interface` | Тільки контракт. "Що клас повинен вміти робити" |
| `abstract class` | Контракт + спільна реалізація. "Базовий функціонал з місцями для кастомізації" |
| Звичайний `class` | Повна реалізація. Готовий до використання |

---

### 7. Трейти (Traits)

**У Vue ви маєте composables (`useAuth()`, `useNotification()`) --> в PHP аналог -- це traits, які додають методи до класів.**

Трейт -- це набір методів, який можна "вмішати" в будь-який клас. PHP не підтримує множинне наслідування (клас може мати тільки одного батька), але трейтів може бути скільки завгодно.

```javascript
// Vue -- composable
// composables/useTimestamps.js
export function useTimestamps() {
    const createdAt = ref(new Date());
    const updatedAt = ref(new Date());

    function touch() {
        updatedAt.value = new Date();
    }

    return { createdAt, updatedAt, touch };
}

// Використання в компоненті
const { createdAt, updatedAt, touch } = useTimestamps();
```

```php
<?php
// PHP -- trait
trait HasTimestamps
{
    public string $createdAt;
    public string $updatedAt;

    public function initTimestamps(): void
    {
        $this->createdAt = date('Y-m-d H:i:s');
        $this->updatedAt = date('Y-m-d H:i:s');
    }

    public function touch(): void
    {
        $this->updatedAt = date('Y-m-d H:i:s');
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }
}

trait HasDeadline
{
    public ?string $deadline = null;

    public function setDeadline(string $date): void
    {
        $this->deadline = $date;
    }

    public function isOverdue(): bool
    {
        if ($this->deadline === null) {
            return false;
        }

        return strtotime($this->deadline) < time();
    }

    public function daysUntilDeadline(): ?int
    {
        if ($this->deadline === null) {
            return null;
        }

        $diff = strtotime($this->deadline) - time();

        return (int) ceil($diff / 86400);
    }
}

// Клас використовує трейти через use
class Task
{
    use HasTimestamps;
    use HasDeadline;

    public function __construct(
        public string $title,
        public string $status = 'pending',
    ) {
        $this->initTimestamps();
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'status' => $this->status,
            'deadline' => $this->deadline,
            'is_overdue' => $this->isOverdue(),
            'days_until_deadline' => $this->daysUntilDeadline(),
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}

$task = new Task('Buy milk');
$task->setDeadline('2026-04-15');
$task->touch();

print_r($task->toArray());
echo "Overdue: " . ($task->isOverdue() ? 'yes' : 'no') . "\n";
echo "Days left: " . $task->daysUntilDeadline() . "\n";
```

> **Ключова різниця з composables:** Трейти "вставляють" методи прямо в клас на етапі компіляції. Це як copy-paste коду. Composables -- це окремі функції, які повертають стан. В Laravel трейти використовуються повсюдно: `HasFactory`, `SoftDeletes`, `HasApiTokens` і т.д.

---

### 8. Простори імен (Namespaces)

**У Vue ви маєте ES modules (`import`/`export`) --> в PHP є namespaces та `use` для організації коду.**

В JavaScript кожен файл -- це модуль. Ви `export` щось з одного файлу і `import` в іншому. В PHP кожен файл оголошує свій namespace, а для використання класу з іншого namespace потрібен `use`.

```javascript
// JavaScript / Vue
// src/models/Task.js
export class Task { ... }

// src/services/TaskService.js
import { Task } from '../models/Task.js';
import { Category } from '../models/Category.js';
```

```php
<?php
// PHP
// src/Models/Task.php
namespace App\Models;

class Task { ... }

// src/Services/TaskService.php
namespace App\Services;

use App\Models\Task;       // "імпортуємо" клас Task
use App\Models\Category;

class TaskService
{
    public function create(string $title): Task
    {
        return new Task($title);
    }
}
```

#### Правила Namespaces

1. **Namespace оголошується першим** (після `<?php` та `declare`):
```php
<?php
declare(strict_types=1);

namespace App\Models;

class Task { }
```

2. **Namespace = структура директорій** (за конвенцією PSR-4):
```
App\Models\Task     -> app/Models/Task.php
App\Services\Auth   -> app/Services/Auth.php
App\Http\Controllers\TaskController -> app/Http/Controllers/TaskController.php
```

3. **use -- це аліас, не завантаження файлу:**
```php
<?php
namespace App\Services;

// Без use -- потрібно писати повне імʼя
$task = new \App\Models\Task('Buy milk');

// З use -- коротке імʼя
use App\Models\Task;
$task = new Task('Buy milk');

// use з аліасом -- якщо два класи з однаковим імʼям
use App\Models\Task as TaskModel;
use App\DTO\Task as TaskDTO;

$model = new TaskModel('Buy milk');
$dto = new TaskDTO('Buy milk');
```

4. **Групований use:**
```php
<?php
use App\Models\{Task, User, Category};
use App\Services\{TaskService, AuthService};
```

#### Порівняння з ES Modules

| ES Modules | PHP Namespaces |
|---|---|
| `export class Task {}` | `namespace App\Models; class Task {}` |
| `export default Task` | Немає аналога (один клас = один файл) |
| `import { Task } from './Task'` | `use App\Models\Task;` |
| `import * as Models from './models'` | `use App\Models\{Task, User};` |
| `import { Task as T } from './Task'` | `use App\Models\Task as T;` |
| Автоматичне завантаження | Через Composer autoloader |

---

### 9. Enums (PHP 8.1+)

**У Vue/TS ви робите `as const` обʼєкти або string unions --> в PHP є нативні enums з підтримкою в type hints.**

```typescript
// TypeScript
type TaskStatus = 'pending' | 'in_progress' | 'done';

// або
const TaskStatus = {
    Pending: 'pending',
    InProgress: 'in_progress',
    Done: 'done',
} as const;
```

```php
<?php
// PHP -- Basic enum (без значення)
enum Color
{
    case Red;
    case Green;
    case Blue;
}

$color = Color::Red;
echo $color->name; // "Red"

// PHP -- Backed enum (зі значенням -- string або int)
enum TaskStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Done = 'done';

    // Enums можуть мати методи!
    public function label(): string
    {
        return match ($this) {
            self::Pending    => 'Очікує',
            self::InProgress => 'В роботі',
            self::Done       => 'Готово',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending    => 'gray',
            self::InProgress => 'blue',
            self::Done       => 'green',
        };
    }

    // Перевірки
    public function isFinished(): bool
    {
        return $this === self::Done;
    }
}
```

#### Використання Enum

```php
<?php
// Створення
$status = TaskStatus::Pending;
echo $status->value;   // "pending"
echo $status->name;    // "Pending"
echo $status->label();  // "Очікує"

// Створення з рядка
$status = TaskStatus::from('done');        // TaskStatus::Done
$status = TaskStatus::tryFrom('invalid');  // null (безпечний варіант)
// TaskStatus::from('invalid');            // ValueError!

// Отримати всі значення
$allCases = TaskStatus::cases();
// [TaskStatus::Pending, TaskStatus::InProgress, TaskStatus::Done]

// Type hint -- функція приймає тільки TaskStatus
function updateStatus(int $taskId, TaskStatus $newStatus): void
{
    echo "Task #{$taskId} status changed to {$newStatus->value}\n";
}

updateStatus(1, TaskStatus::Done);
// updateStatus(1, 'done');  // TypeError! Потрібен TaskStatus, не string
```

#### Enum як тип в класі

```php
<?php
class Task
{
    public function __construct(
        public readonly int $id,
        public string $title,
        public TaskStatus $status = TaskStatus::Pending,
        public int $priority = 3,
    ) {}

    public function markAsDone(): void
    {
        $this->status = TaskStatus::Done;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'priority' => $this->priority,
        ];
    }
}

$task = new Task(1, 'Buy milk');
echo $task->status->label(); // Очікує

$task->markAsDone();
echo $task->status->label(); // Готово

print_r($task->toArray());
// Array (
//     [id] => 1
//     [title] => Buy milk
//     [status] => done
//     [status_label] => Готово
//     [priority] => 3
// )
```

#### Enum з інтерфейсами

```php
<?php
interface HasLabel
{
    public function label(): string;
}

enum Priority: int implements HasLabel
{
    case Low = 1;
    case Medium = 3;
    case High = 5;

    public function label(): string
    {
        return match ($this) {
            self::Low    => 'Низький',
            self::Medium => 'Середній',
            self::High   => 'Високий',
        };
    }
}

echo Priority::High->label();  // Високий
echo Priority::High->value;    // 5
```

---

### 10. Composer: менеджер пакетів PHP

**У Vue ви маєте npm/pnpm з `package.json` --> в PHP є Composer з `composer.json`.**

Composer -- це менеджер залежностей PHP. Він виконує ту ж роль, що npm/pnpm/yarn у JavaScript.

| npm / pnpm | Composer |
|---|---|
| `package.json` | `composer.json` |
| `package-lock.json` | `composer.lock` |
| `node_modules/` | `vendor/` |
| `npm install` | `composer install` |
| `npm install package` | `composer require package` |
| `npm install -D package` | `composer require --dev package` |
| `npm update` | `composer update` |
| `npx` | `vendor/bin/` |
| `"scripts"` в package.json | `"scripts"` в composer.json |

#### Перевірка Composer

```bash
composer --version
# Composer version 2.x.x
```

Якщо не встановлений:

```bash
# macOS
brew install composer

# Linux
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
```

#### PSR-4 Autoloading

Головна "магія" Composer -- автозавантаження класів. Замість того, щоб вручну підключати кожен файл через `require`, Composer робить це автоматично на основі namespaces.

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    }
}
```

Це означає: namespace `App\` відповідає директорії `src/`. Тобто:
- `App\Models\Task` --> `src/Models/Task.php`
- `App\Services\TaskService` --> `src/Services/TaskService.php`

```bash
# Після зміни autoload -- регенерувати маппінг
composer dump-autoload
```

У вашому коді достатньо одного рядка на початку:

```php
<?php
require __DIR__ . '/vendor/autoload.php';

// Тепер ВСІ класи з правильними namespaces завантажуються автоматично
use App\Models\Task;
use App\Services\TaskService;

$task = new Task('Buy milk');
```

> **В Laravel все це вже налаштовано.** `composer.json` Laravel-проєкту вже містить PSR-4 autoload для namespace `App\`. Вам не потрібно нічого додатково налаштовувати.

---

### 11. Типи: union, intersection, nullable

**У Vue/TypeScript ви маєте `string | number`, `A & B`, `string | null` --> в PHP це `string|int`, `A&B`, `?string`.**

```typescript
// TypeScript
function process(value: string | number): void { }
function getId(): number | null { return null; }
type Loggable = HasLog & Serializable;
```

```php
<?php
// PHP 8.0+ -- Union types
function process(string|int $value): void
{
    echo gettype($value) . ": {$value}\n";
}

process("hello");  // string: hello
process(42);       // integer: 42
// process([]);    // TypeError!

// Nullable -- два еквівалентних способи
function findTask(int $id): ?array     // Спосіб 1: ?тип
{
    return null;
}

function findUser(int $id): array|null  // Спосіб 2: union з null
{
    return null;
}

// PHP 8.1+ -- Intersection types (обʼєкт повинен реалізувати ОБА інтерфейси)
interface Countable {
    public function count(): int;
}

interface Stringable {
    public function __toString(): string;
}

function processCollection(Countable&Stringable $collection): void
{
    echo "Count: {$collection->count()}, String: {$collection}\n";
}

// PHP 8.2+ -- Disjunctive Normal Form (DNF) types
// Складна комбінація union та intersection
function handle((Countable&Stringable)|null $item): void
{
    // $item може бути null АБО обʼєктом, який реалізує і Countable, і Stringable
}
```

---

## Практика: крок за кроком

### Крок 1. Створіть структуру проєкту

```bash
mkdir -p playground/02-oop
cd playground/02-oop
```

### Крок 2. Ініціалізуйте Composer

```bash
composer init --name="student/task-oop" --description="Task Manager OOP Exercise" --type="project" --no-interaction
```

Відкрийте `composer.json` і додайте autoload:

```json
{
    "name": "student/task-oop",
    "description": "Task Manager OOP Exercise",
    "type": "project",
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "require": {}
}
```

Після зміни:

```bash
composer dump-autoload
```

### Крок 3. Створіть структуру файлів

```
playground/02-oop/
├── composer.json
├── vendor/
├── src/
│   ├── Enums/
│   │   └── TaskStatus.php
│   ├── Contracts/
│   │   └── Categorizable.php
│   ├── Traits/
│   │   └── HasDeadline.php
│   ├── Models/
│   │   ├── Task.php
│   │   └── Category.php
│   └── Collections/
│       └── TaskCollection.php
└── main.php
```

```bash
mkdir -p src/Enums src/Contracts src/Traits src/Models src/Collections
```

### Крок 4. TaskStatus Enum

Створіть `src/Enums/TaskStatus.php`:

```php
<?php
declare(strict_types=1);

namespace App\Enums;

enum TaskStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Done = 'done';

    /**
     * Отримати людино-читабельну назву статусу.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending    => 'Очікує',
            self::InProgress => 'В роботі',
            self::Done       => 'Готово',
        };
    }

    /**
     * Отримати колір для статусу (для UI).
     */
    public function color(): string
    {
        return match ($this) {
            self::Pending    => 'gray',
            self::InProgress => 'blue',
            self::Done       => 'green',
        };
    }

    /**
     * Чи можна переходити в цей статус з поточного.
     */
    public function canTransitionTo(self $newStatus): bool
    {
        return match ($this) {
            self::Pending    => in_array($newStatus, [self::InProgress, self::Done]),
            self::InProgress => $newStatus === self::Done,
            self::Done       => false, // З "Done" нікуди не можна перейти
        };
    }

    /**
     * Чи вважається завдання закритим.
     */
    public function isFinished(): bool
    {
        return $this === self::Done;
    }

    /**
     * Отримати всі значення як масив рядків.
     */
    public static function values(): array
    {
        return array_map(fn(self $case) => $case->value, self::cases());
    }
}
```

### Крок 5. Categorizable Interface

Створіть `src/Contracts/Categorizable.php`:

```php
<?php
declare(strict_types=1);

namespace App\Contracts;

interface Categorizable
{
    /**
     * Отримати назву категорії.
     */
    public function getName(): string;

    /**
     * Отримати slug (URL-friendly ідентифікатор).
     */
    public function getSlug(): string;

    /**
     * Перетворити на масив.
     */
    public function toArray(): array;
}
```

### Крок 6. HasDeadline Trait

Створіть `src/Traits/HasDeadline.php`:

```php
<?php
declare(strict_types=1);

namespace App\Traits;

trait HasDeadline
{
    protected ?string $deadline = null;

    /**
     * Встановити дедлайн у форматі Y-m-d.
     */
    public function setDeadline(string $date): static
    {
        $this->deadline = $date;

        return $this; // Для chaining: $task->setDeadline('2026-04-15')->...
    }

    /**
     * Отримати дедлайн.
     */
    public function getDeadline(): ?string
    {
        return $this->deadline;
    }

    /**
     * Чи є дедлайн.
     */
    public function hasDeadline(): bool
    {
        return $this->deadline !== null;
    }

    /**
     * Чи прострочено.
     */
    public function isOverdue(): bool
    {
        if (!$this->hasDeadline()) {
            return false;
        }

        return strtotime($this->deadline) < strtotime('today');
    }

    /**
     * Кількість днів до дедлайну (відʼємне = прострочено).
     */
    public function daysUntilDeadline(): ?int
    {
        if (!$this->hasDeadline()) {
            return null;
        }

        $deadlineTime = strtotime($this->deadline);
        $todayTime = strtotime('today');
        $diffSeconds = $deadlineTime - $todayTime;

        return (int) floor($diffSeconds / 86400);
    }

    /**
     * Людино-читабельний опис дедлайну.
     */
    public function deadlineDescription(): string
    {
        if (!$this->hasDeadline()) {
            return 'No deadline';
        }

        $days = $this->daysUntilDeadline();

        if ($days < 0) {
            return abs($days) . ' day(s) overdue';
        }

        if ($days === 0) {
            return 'Due today';
        }

        if ($days === 1) {
            return 'Due tomorrow';
        }

        return "Due in {$days} days";
    }
}
```

### Крок 7. Task Model

Створіть `src/Models/Task.php`:

```php
<?php
declare(strict_types=1);

namespace App\Models;

use App\Enums\TaskStatus;
use App\Traits\HasDeadline;

class Task
{
    use HasDeadline;

    private static int $nextId = 1;

    public readonly int $id;
    public string $createdAt;
    public string $updatedAt;

    public function __construct(
        public string $title,
        public string $description = '',
        public TaskStatus $status = TaskStatus::Pending,
        public int $priority = 3,
        public ?string $categorySlug = null,
    ) {
        $this->id = self::$nextId++;
        $this->createdAt = date('Y-m-d H:i:s');
        $this->updatedAt = date('Y-m-d H:i:s');
    }

    /**
     * Factory method -- створити задачу з масиву.
     */
    public static function fromArray(array $data): self
    {
        $task = new self(
            title: $data['title'],
            description: $data['description'] ?? '',
            status: isset($data['status'])
                ? (is_string($data['status']) ? TaskStatus::from($data['status']) : $data['status'])
                : TaskStatus::Pending,
            priority: $data['priority'] ?? 3,
            categorySlug: $data['category'] ?? null,
        );

        if (isset($data['deadline'])) {
            $task->setDeadline($data['deadline']);
        }

        return $task;
    }

    /**
     * Змінити статус (з перевіркою переходу).
     */
    public function transitionTo(TaskStatus $newStatus): bool
    {
        if (!$this->status->canTransitionTo($newStatus)) {
            return false;
        }

        $this->status = $newStatus;
        $this->updatedAt = date('Y-m-d H:i:s');

        return true;
    }

    /**
     * Позначити як виконане.
     */
    public function markAsDone(): bool
    {
        return $this->transitionTo(TaskStatus::Done);
    }

    /**
     * Почати виконання.
     */
    public function startProgress(): bool
    {
        return $this->transitionTo(TaskStatus::InProgress);
    }

    /**
     * Чи завершено.
     */
    public function isComplete(): bool
    {
        return $this->status->isFinished();
    }

    /**
     * Перетворити на масив.
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'priority' => $this->priority,
            'category' => $this->categorySlug,
            'deadline' => $this->deadline,
            'deadline_description' => $this->deadlineDescription(),
            'is_overdue' => $this->isOverdue(),
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }

    /**
     * Рядкове представлення.
     */
    public function __toString(): string
    {
        $status = $this->status->label();
        $deadlineInfo = $this->hasDeadline() ? " | {$this->deadlineDescription()}" : '';

        return "[{$status}] #{$this->id} - {$this->title} (P{$this->priority}){$deadlineInfo}";
    }
}
```

### Крок 8. Category Model

Створіть `src/Models/Category.php`:

```php
<?php
declare(strict_types=1);

namespace App\Models;

use App\Contracts\Categorizable;

class Category implements Categorizable
{
    public function __construct(
        private string $name,
        private ?string $slug = null,
        private string $color = 'gray',
    ) {
        // Автоматична генерація slug якщо не передано
        if ($this->slug === null) {
            $this->slug = $this->generateSlug($name);
        }
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function getColor(): string
    {
        return $this->color;
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'color' => $this->color,
        ];
    }

    public function __toString(): string
    {
        return $this->name;
    }

    /**
     * Генерація slug з назви.
     * "Work Tasks" -> "work-tasks"
     */
    private function generateSlug(string $text): string
    {
        $slug = strtolower($text);
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);

        return trim($slug, '-');
    }
}
```

### Крок 9. TaskCollection

Створіть `src/Collections/TaskCollection.php`:

```php
<?php
declare(strict_types=1);

namespace App\Collections;

use App\Enums\TaskStatus;
use App\Models\Task;

class TaskCollection
{
    /** @var Task[] */
    private array $tasks = [];

    /**
     * Створити колекцію з масиву задач.
     *
     * @param Task[] $tasks
     */
    public function __construct(array $tasks = [])
    {
        foreach ($tasks as $task) {
            $this->add($task);
        }
    }

    /**
     * Додати задачу.
     */
    public function add(Task $task): self
    {
        $this->tasks[] = $task;

        return $this;
    }

    /**
     * Отримати всі задачі.
     *
     * @return Task[]
     */
    public function all(): array
    {
        return $this->tasks;
    }

    /**
     * Кількість задач.
     */
    public function count(): int
    {
        return count($this->tasks);
    }

    /**
     * Чи порожня колекція.
     */
    public function isEmpty(): bool
    {
        return $this->count() === 0;
    }

    /**
     * Фільтрація за статусом.
     */
    public function whereStatus(TaskStatus $status): self
    {
        $filtered = array_filter(
            $this->tasks,
            fn(Task $task) => $task->status === $status
        );

        return new self(array_values($filtered));
    }

    /**
     * Фільтрація за пріоритетом.
     */
    public function wherePriority(int $priority): self
    {
        $filtered = array_filter(
            $this->tasks,
            fn(Task $task) => $task->priority === $priority
        );

        return new self(array_values($filtered));
    }

    /**
     * Фільтрація за категорією.
     */
    public function whereCategory(string $categorySlug): self
    {
        $filtered = array_filter(
            $this->tasks,
            fn(Task $task) => $task->categorySlug === $categorySlug
        );

        return new self(array_values($filtered));
    }

    /**
     * Пошук за текстом в назві.
     */
    public function search(string $keyword): self
    {
        $keyword = strtolower($keyword);

        $filtered = array_filter(
            $this->tasks,
            fn(Task $task) => str_contains(strtolower($task->title), $keyword)
                || str_contains(strtolower($task->description), $keyword)
        );

        return new self(array_values($filtered));
    }

    /**
     * Сортування за пріоритетом.
     */
    public function sortByPriority(string $direction = 'asc'): self
    {
        $sorted = $this->tasks;

        usort($sorted, function (Task $a, Task $b) use ($direction) {
            $result = $a->priority <=> $b->priority;

            return $direction === 'desc' ? -$result : $result;
        });

        return new self($sorted);
    }

    /**
     * Сортування за датою створення.
     */
    public function sortByCreatedAt(string $direction = 'asc'): self
    {
        $sorted = $this->tasks;

        usort($sorted, function (Task $a, Task $b) use ($direction) {
            $result = $a->createdAt <=> $b->createdAt;

            return $direction === 'desc' ? -$result : $result;
        });

        return new self($sorted);
    }

    /**
     * Тільки прострочені.
     */
    public function overdue(): self
    {
        $filtered = array_filter(
            $this->tasks,
            fn(Task $task) => $task->isOverdue()
        );

        return new self(array_values($filtered));
    }

    /**
     * Перетворити всі задачі на масиви.
     */
    public function toArray(): array
    {
        return array_map(fn(Task $task) => $task->toArray(), $this->tasks);
    }

    /**
     * Отримати тільки назви.
     *
     * @return string[]
     */
    public function titles(): array
    {
        return array_map(fn(Task $task) => $task->title, $this->tasks);
    }

    /**
     * Отримати перший елемент або null.
     */
    public function first(): ?Task
    {
        return $this->tasks[0] ?? null;
    }

    /**
     * Отримати останній елемент або null.
     */
    public function last(): ?Task
    {
        if ($this->isEmpty()) {
            return null;
        }

        return $this->tasks[count($this->tasks) - 1];
    }

    /**
     * Статистика по колекції.
     */
    public function stats(): array
    {
        $total = $this->count();
        $byStatus = [];

        foreach (TaskStatus::cases() as $status) {
            $count = $this->whereStatus($status)->count();
            $byStatus[$status->value] = [
                'count' => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                'label' => $status->label(),
            ];
        }

        $overdueCount = $this->overdue()->count();

        return [
            'total' => $total,
            'by_status' => $byStatus,
            'overdue' => $overdueCount,
            'completion_rate' => $total > 0
                ? round(($this->whereStatus(TaskStatus::Done)->count() / $total) * 100, 1)
                : 0,
        ];
    }

    /**
     * Групування за статусом.
     *
     * @return array<string, self>
     */
    public function groupByStatus(): array
    {
        $groups = [];

        foreach (TaskStatus::cases() as $status) {
            $group = $this->whereStatus($status);
            if (!$group->isEmpty()) {
                $groups[$status->value] = $group;
            }
        }

        return $groups;
    }
}
```

### Крок 10. Головний файл

Створіть `main.php`:

```php
<?php
declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use App\Collections\TaskCollection;
use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;

echo "=============================================\n";
echo "  Task Manager OOP -- PHP Exercise\n";
echo "=============================================\n\n";

// ---- Категорії ----
echo "--- Категорії ---\n";

$workCategory = new Category('Work', color: 'blue');
$personalCategory = new Category('Personal Tasks', color: 'green');
$studyCategory = new Category('Study', color: 'purple');

echo "Work: slug = {$workCategory->getSlug()}, color = {$workCategory->getColor()}\n";
echo "Personal: slug = {$personalCategory->getSlug()}, color = {$personalCategory->getColor()}\n";
echo "Study: slug = {$studyCategory->getSlug()}, color = {$studyCategory->getColor()}\n";
echo "\n";

// ---- Enum ----
echo "--- TaskStatus Enum ---\n";

foreach (TaskStatus::cases() as $status) {
    echo "  {$status->value} => {$status->label()} (color: {$status->color()})\n";
}
echo "\n";

echo "All values: " . implode(', ', TaskStatus::values()) . "\n";
echo "From string: " . TaskStatus::from('in_progress')->label() . "\n";
echo "Try invalid: " . (TaskStatus::tryFrom('invalid') === null ? 'null (safe!)' : 'found') . "\n";
echo "\n";

// ---- Створення задач ----
echo "--- Створення задач ---\n";

$tasks = new TaskCollection();

// Створення через конструктор
$task1 = new Task(
    title: 'Buy groceries',
    description: 'Milk, bread, eggs',
    priority: 2,
    categorySlug: $personalCategory->getSlug(),
);
$task1->setDeadline('2026-04-10');

// Створення через factory
$task2 = Task::fromArray([
    'title' => 'Learn PHP OOP',
    'description' => 'Classes, interfaces, traits',
    'status' => 'in_progress',
    'priority' => 1,
    'category' => $studyCategory->getSlug(),
    'deadline' => '2026-04-12',
]);

$task3 = Task::fromArray([
    'title' => 'Setup Laravel project',
    'description' => 'Install Laravel 12 and configure',
    'priority' => 1,
    'category' => $studyCategory->getSlug(),
    'deadline' => '2026-04-15',
]);

$task4 = Task::fromArray([
    'title' => 'Write API documentation',
    'description' => 'Document all endpoints',
    'priority' => 4,
    'category' => $workCategory->getSlug(),
]);

$task5 = Task::fromArray([
    'title' => 'Fix login bug',
    'description' => 'Users cannot login with email',
    'priority' => 1,
    'category' => $workCategory->getSlug(),
    'deadline' => '2026-04-08', // Вже прострочено!
]);

$task6 = Task::fromArray([
    'title' => 'Clean apartment',
    'description' => 'General cleaning',
    'priority' => 3,
    'category' => $personalCategory->getSlug(),
]);

// Додати всі в колекцію
$tasks->add($task1)
    ->add($task2)
    ->add($task3)
    ->add($task4)
    ->add($task5)
    ->add($task6);

echo "Created {$tasks->count()} tasks\n\n";

// Вивести всі задачі
echo "--- Всі задачі ---\n";
foreach ($tasks->all() as $task) {
    echo "  {$task}\n";
}
echo "\n";

// ---- Зміна статусу ----
echo "--- Зміна статусу ---\n";

echo "Task 1 (Buy groceries): {$task1->status->label()}\n";
$task1->startProgress();
echo "After startProgress: {$task1->status->label()}\n";
$task1->markAsDone();
echo "After markAsDone: {$task1->status->label()}\n";

// Спроба недозволеного переходу
$result = $task1->transitionTo(TaskStatus::Pending);
echo "Transition from Done to Pending: " . ($result ? 'success' : 'REJECTED') . "\n";
echo "\n";

// ---- Фільтрація ----
echo "--- Фільтрація ---\n";

$pending = $tasks->whereStatus(TaskStatus::Pending);
echo "Pending ({$pending->count()}): " . implode(', ', $pending->titles()) . "\n";

$inProgress = $tasks->whereStatus(TaskStatus::InProgress);
echo "In Progress ({$inProgress->count()}): " . implode(', ', $inProgress->titles()) . "\n";

$done = $tasks->whereStatus(TaskStatus::Done);
echo "Done ({$done->count()}): " . implode(', ', $done->titles()) . "\n";
echo "\n";

// ---- Пошук ----
echo "--- Пошук ---\n";

$searchResult = $tasks->search('laravel');
echo "Search 'laravel' ({$searchResult->count()}): " . implode(', ', $searchResult->titles()) . "\n";

$searchResult = $tasks->search('bug');
echo "Search 'bug' ({$searchResult->count()}): " . implode(', ', $searchResult->titles()) . "\n";
echo "\n";

// ---- Сортування ----
echo "--- Сортування за пріоритетом (asc) ---\n";

$sorted = $tasks->sortByPriority('asc');
foreach ($sorted->all() as $task) {
    echo "  P{$task->priority}: {$task->title}\n";
}
echo "\n";

// ---- Фільтр за категорією ----
echo "--- Задачі категорії 'study' ---\n";

$studyTasks = $tasks->whereCategory('study');
foreach ($studyTasks->all() as $task) {
    echo "  {$task}\n";
}
echo "\n";

// ---- Прострочені ----
echo "--- Прострочені задачі ---\n";

$overdue = $tasks->overdue();
if ($overdue->isEmpty()) {
    echo "  Немає прострочених задач\n";
} else {
    foreach ($overdue->all() as $task) {
        echo "  {$task}\n";
    }
}
echo "\n";

// ---- Групування ----
echo "--- Групування за статусом ---\n";

$groups = $tasks->groupByStatus();
foreach ($groups as $statusValue => $group) {
    $status = TaskStatus::from($statusValue);
    echo "\n  === {$status->label()} ({$group->count()}) ===\n";
    foreach ($group->all() as $task) {
        echo "    P{$task->priority}: {$task->title}\n";
    }
}
echo "\n";

// ---- Статистика ----
echo "--- Статистика ---\n";

$stats = $tasks->stats();
echo "Total: {$stats['total']}\n";
echo "Completion rate: {$stats['completion_rate']}%\n";
echo "Overdue: {$stats['overdue']}\n";
echo "\nBy status:\n";

foreach ($stats['by_status'] as $status => $info) {
    echo "  {$info['label']}: {$info['count']} ({$info['percentage']}%)\n";
}
echo "\n";

// ---- toArray ----
echo "--- Перша задача як масив ---\n";
print_r($tasks->first()?->toArray());
echo "\n";

// ---- JSON ----
echo "--- Перша задача як JSON ---\n";
echo json_encode($tasks->first()?->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
echo "\n";

echo "=============================================\n";
echo "  Все працює! Запустіть: php main.php\n";
echo "=============================================\n";
```

### Крок 11. Запустіть

```bash
cd playground/02-oop
php main.php
```

Очікуваний вивід (дати та ID можуть відрізнятися):

```
=============================================
  Task Manager OOP -- PHP Exercise
=============================================

--- Категорії ---
Work: slug = work, color = blue
Personal: slug = personal-tasks, color = green
Study: slug = study, color = purple

--- TaskStatus Enum ---
  pending => Очікує (color: gray)
  in_progress => В роботі (color: blue)
  done => Готово (color: green)

All values: pending, in_progress, done
From string: В роботі
Try invalid: null (safe!)

--- Створення задач ---
Created 6 tasks

--- Всі задачі ---
  [Очікує] #1 - Buy groceries (P2) | Due in 1 days
  [В роботі] #2 - Learn PHP OOP (P1) | Due in 3 days
  ...

--- Зміна статусу ---
Task 1 (Buy groceries): Очікує
After startProgress: В роботі
After markAsDone: Готово
Transition from Done to Pending: REJECTED
...
```

---

## Перевірка

Після виконання практики переконайтесь:

1. **`composer dump-autoload`** працює без помилок
2. **`php main.php`** виводить всю інформацію без помилок
3. Ви розумієте:
   - Як працює constructor promotion (`public function __construct(public string $title)`)
   - Різницю між `->` (instance) та `::` (static)
   - Як trait додає методи до класу
   - Як interface гарантує контракт
   - Як enum замінює "магічні рядки"
   - Як namespace + PSR-4 автозавантаження працюють разом

---

## Міні-тест

### Питання 1
Яка різниця між `->` та `::` в PHP?
```php
<?php
$task->getTitle();
Task::create('Buy milk');
```
a) `->` для публічних, `::` для приватних методів
b) `->` для методів обʼєкта, `::` для статичних методів
c) Немає різниці, це синоніми
d) `->` для класів, `::` для інтерфейсів

### Питання 2
Що робить constructor promotion?
```php
<?php
class Task {
    public function __construct(
        public string $title,
        public int $priority = 3,
    ) {}
}
```
a) Тільки оголошує параметри конструктора
b) Автоматично створює властивості, присвоює значення і оголошує параметри
c) Створює getter та setter для кожної властивості
d) Робить клас readonly

### Питання 3
Чому цей код не працює?
```php
<?php
$name = "PHP";
$greet = function() {
    echo "Hello, $name!";
};
$greet();
```
a) Анонімні функції не можуть використовувати `echo`
b) Потрібно `function()` замінити на `fn()`
c) Анонімна функція не бачить `$name` -- потрібно `use ($name)`
d) Потрібно `declare(strict_types=1)`

### Питання 4
Що виведе цей код?
```php
<?php
enum Status: string {
    case Active = 'active';
    case Inactive = 'inactive';
}

$s = Status::tryFrom('unknown');
echo $s === null ? 'null' : $s->value;
```
a) `unknown`
b) `null`
c) Помилка ValueError
d) `false`

### Питання 5
Як правильно організувати autoloading для класу `App\Models\Task`?
a) Файл має бути в `app/Models/Task.php`, namespace `App\Models`, в composer.json `"App\\": "app/"`
b) Файл може бути будь-де, namespace не важливий
c) Потрібно вручну підключити через `require`
d) Файл має бути в `src/Models/Task.php`, namespace `Src\Models`

---

## Практичне завдання

Розширте систему задач:

1. **Створіть enum `Priority`** (`src/Enums/Priority.php`) з кейсами: `Low(1)`, `Medium(3)`, `High(5)`, `Critical(10)`. Додайте методи `label(): string` та `isUrgent(): bool` (urgent = High або Critical).

2. **Змініть клас `Task`** -- замість `int $priority` використайте `Priority $priority`.

3. **Створіть trait `HasTags`** (`src/Traits/HasTags.php`) з методами:
   - `addTag(string $tag): static`
   - `removeTag(string $tag): static`
   - `hasTag(string $tag): bool`
   - `getTags(): array`

4. **Додайте `HasTags` до класу `Task`**.

5. **Додайте метод `wherePriorityAtLeast(Priority $minimum): self`** до `TaskCollection`, який фільтрує задачі з пріоритетом >= вказаного.

6. **Додайте метод `whereHasTag(string $tag): self`** до `TaskCollection`.

7. **Оновіть `main.php`**, щоб продемонструвати всі нові можливості.

---

## Відповіді на тест

### Відповідь 1: **b) `->` для методів обʼєкта, `::` для статичних методів**
`->` використовується для доступу до властивостей та методів конкретного обʼєкта (instance). `::` -- для статичних методів та властивостей, констант класу, а також для виклику `parent::` та `self::`.

### Відповідь 2: **b) Автоматично створює властивості, присвоює значення і оголошує параметри**
Constructor promotion (PHP 8+) -- це синтаксичний цукор. `public string $title` в конструкторі одночасно: 1) оголошує параметр конструктора, 2) створює публічну властивість класу, 3) автоматично присвоює значення аргументу цій властивості.

### Відповідь 3: **c) Анонімна функція не бачить `$name` -- потрібно `use ($name)`**
В PHP анонімні функції (визначені через `function()`) НЕ захоплюють змінні з зовнішнього scope автоматично. Потрібно явно вказати через `use ($name)`. Стрілкова функція `fn()` захоплює автоматично (read-only).

### Відповідь 4: **b) `null`**
`tryFrom()` повертає `null` якщо значення не відповідає жодному кейсу enum. Це безпечна альтернатива `from()`, який кидає `ValueError`. Оскільки `$s === null`, виведеться `'null'`.

### Відповідь 5: **a) Файл має бути в `app/Models/Task.php`, namespace `App\Models`, в composer.json `"App\\": "app/"`**
PSR-4 автозавантаження вимагає відповідності між namespace та файловою структурою. Якщо в `composer.json` вказано `"App\\": "app/"`, то клас `App\Models\Task` має бути у файлі `app/Models/Task.php`.
