# Урок 1: PHP-синтаксис для JavaScript-розробників

## Що ви вивчите

- Змінні в PHP: чому немає `let`/`const` і як живуть `$`-змінні
- Типи даних: рядки, числа, масиви, null та як вони відрізняються від JS
- Масиви: індексовані (як JS arrays) та асоціативні (як JS objects)
- Рядки: одинарні vs подвійні лапки, інтерполяція, heredoc
- Оператори: `===`, `??`, `?:`, `<=>`, `...`
- Умови та цикли: `if/else`, `match`, `for`, `foreach`, `while`
- Функції: звичайні, стрілкові (`fn()`), замикання, типізація
- Вбудовані функції для роботи з рядками та масивами
- Виведення даних: `echo`, `print_r`, `var_dump`
- Запуск PHP-файлів з терміналу
- Строгий режим типів (`strict_types`)

---

## Паралелі з JS/Vue

| Концепція | JavaScript | PHP |
|---|---|---|
| Оголошення змінної | `let name = "Tim"` | `$name = "Tim";` |
| Константа | `const MAX = 10` | `const MAX = 10;` або `define('MAX', 10);` |
| Рядок з інтерполяцією | `` `Hello ${name}` `` | `"Hello $name"` або `"Hello {$name}"` |
| Масив | `[1, 2, 3]` | `[1, 2, 3]` |
| Обʼєкт (словник) | `{ key: 'value' }` | `['key' => 'value']` |
| Стрілкова функція | `(x) => x * 2` | `fn($x) => $x * 2` |
| Замикання | `function() { ... }` | `function() use ($var) { ... }` |
| switch як вираз | --- | `match($x) { ... }` |
| Оператор `??` | `a ?? b` | `$a ?? $b` |
| Spread | `...arr` | `...$arr` |
| console.log | `console.log(x)` | `echo $x;` / `var_dump($x);` |
| typeof | `typeof x` | `gettype($x)` |
| JSON.stringify | `JSON.stringify(obj)` | `json_encode($obj)` |
| JSON.parse | `JSON.parse(str)` | `json_decode($str, true)` |

---

## Теорія

### 1. Змінні та типи даних

**У Vue ви оголошуєте змінні через `let`, `const`, `ref()` --> в PHP всі змінні починаються з `$` і завжди мутабельні.**

PHP не має `let` чи `const` для змінних. Кожна змінна починається з `$` і може бути змінена в будь-який момент. Для "справжніх" констант є окремий синтаксис.

```javascript
// JavaScript
let name = "Timur";
const age = 25;
let isActive = true;
let score = 9.5;
let nothing = null;
let items = undefined; // не існує в PHP
```

```php
<?php
// PHP
$name = "Timur";       // string
$age = 25;             // int (integer)
$isActive = true;      // bool (boolean)
$score = 9.5;          // float
$nothing = null;       // null
// undefined не існує в PHP. Неоголошена змінна викликає Warning.
```

#### Типи даних PHP

| Тип | Приклад | Аналог у JS |
|---|---|---|
| `string` | `"hello"`, `'hello'` | `string` |
| `int` | `42`, `-7` | `number` (цілі) |
| `float` | `3.14`, `-0.5` | `number` (дробові) |
| `bool` | `true`, `false` | `boolean` |
| `array` | `[1, 2, 3]` | `Array` + `Object` |
| `null` | `null` | `null` |
| `object` | `new User()` | `object` |

PHP -- мова з динамічною типізацією, як і JavaScript. Змінна може змінювати тип:

```php
<?php
$x = 42;        // int
$x = "hello";   // тепер string -- PHP не скаржиться
$x = [1, 2, 3]; // тепер array
```

#### Перевірка типу

```javascript
// JavaScript
typeof "hello"     // "string"
typeof 42          // "number"
Array.isArray([])  // true
```

```php
<?php
// PHP
gettype("hello");    // "string"
gettype(42);         // "integer"
is_string("hello");  // true
is_int(42);          // true
is_array([]);        // true
is_null(null);       // true
```

#### Константи

```javascript
// JavaScript
const API_URL = "https://api.example.com";
// API_URL = "other"; // TypeError!
```

```php
<?php
// PHP -- два способи

// Спосіб 1: ключове слово const (тільки в глобальному або класовому контексті)
const API_URL = "https://api.example.com";

// Спосіб 2: функція define() (працює будь-де)
define('MAX_RETRIES', 3);

echo API_URL;       // https://api.example.com
echo MAX_RETRIES;   // 3

// API_URL = "other"; // Fatal error!
```

> **Важливо:** `const` у PHP -- це НЕ аналог JS `const`. В PHP `const` створює справжню незмінну константу (без `$`), а не "незмінну змінну". Звичайні змінні з `$` завжди мутабельні.

---

### 2. Масиви: індексовані та асоціативні

**У Vue/JS ви маєте окремо масиви `[]` та обʼєкти `{}` --> в PHP це одна структура `array`, яка буває індексованою та асоціативною.**

Це одна з найважливіших відмінностей PHP від JavaScript. В PHP немає окремого типу "обʼєкт-словник". Масив може одночасно мати числові індекси та рядкові ключі.

#### Індексовані масиви (як JS arrays)

```javascript
// JavaScript
const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);      // "apple"
console.log(fruits.length);  // 3
fruits.push("date");
```

```php
<?php
// PHP
$fruits = ["apple", "banana", "cherry"];
echo $fruits[0];       // "apple"
echo count($fruits);   // 3
$fruits[] = "date";    // додати елемент (аналог push)
```

#### Асоціативні масиви (як JS objects)

```javascript
// JavaScript
const task = {
    title: "Buy groceries",
    status: "pending",
    priority: 3
};
console.log(task.title);     // "Buy groceries"
console.log(task["status"]); // "pending"
```

```php
<?php
// PHP
$task = [
    'title' => 'Buy groceries',
    'status' => 'pending',
    'priority' => 3,
];
echo $task['title'];    // "Buy groceries"
// echo $task.title;    // НЕ працює! В PHP "." -- це конкатенація рядків
```

> **Зверніть увагу:** В PHP немає "dot notation" (`task.title`). Доступ до елементів масиву -- тільки через квадратні дужки. Оператор `.` в PHP -- це конкатенація рядків (аналог `+` в JS для рядків).

#### Масив масивів (як JS array of objects)

```javascript
// JavaScript
const tasks = [
    { id: 1, title: "Task 1", status: "done" },
    { id: 2, title: "Task 2", status: "pending" },
    { id: 3, title: "Task 3", status: "pending" },
];
```

```php
<?php
// PHP
$tasks = [
    ['id' => 1, 'title' => 'Task 1', 'status' => 'done'],
    ['id' => 2, 'title' => 'Task 2', 'status' => 'pending'],
    ['id' => 3, 'title' => 'Task 3', 'status' => 'pending'],
];
```

#### Маніпуляції з масивами

```javascript
// JavaScript
const arr = [1, 2, 3];

// Додавання
arr.push(4);            // [1, 2, 3, 4]
arr.unshift(0);         // [0, 1, 2, 3, 4]

// Видалення
arr.pop();              // видаляє останній
arr.shift();            // видаляє перший
arr.splice(1, 1);       // видаляє елемент за індексом

// Перевірка
arr.includes(2);        // true
arr.indexOf(2);         // 1

// Обʼєднання
const merged = [...arr1, ...arr2];
```

```php
<?php
// PHP
$arr = [1, 2, 3];

// Додавання
$arr[] = 4;                    // [1, 2, 3, 4]
array_push($arr, 5);          // [1, 2, 3, 4, 5]
array_unshift($arr, 0);       // [0, 1, 2, 3, 4, 5]

// Видалення
array_pop($arr);               // видаляє останній
array_shift($arr);             // видаляє перший
unset($arr[1]);                // видаляє за індексом (але НЕ переіндексує!)
$arr = array_values($arr);     // переіндексувати масив після unset

// Перевірка
in_array(2, $arr);             // true
array_search(2, $arr);         // повертає ключ або false

// Обʼєднання
$merged = [...$arr1, ...$arr2];           // для індексованих
$merged = array_merge($arr1, $arr2);      // універсальний спосіб
```

#### Корисні функції для асоціативних масивів

```php
<?php
$task = ['title' => 'Buy milk', 'status' => 'pending', 'priority' => 2];

// Перевірка чи ключ існує
array_key_exists('title', $task);  // true
isset($task['title']);              // true (але false якщо значення null)

// Отримати ключі та значення
array_keys($task);    // ['title', 'status', 'priority']
array_values($task);  // ['Buy milk', 'pending', 2]

// Додати/змінити пару
$task['due_date'] = '2026-04-10';

// Видалити пару
unset($task['priority']);
```

---

### 3. Рядки

**У Vue ви використовуєте template literals `` `Hello ${name}` `` --> в PHP подвійні лапки `"Hello $name"` працюють так само.**

PHP має два основних типи рядків: в одинарних лапках і в подвійних.

#### Одинарні лапки -- без інтерполяції

```php
<?php
$name = "Timur";

// Одинарні лапки: все буквально
echo 'Hello $name';     // Hello $name  (змінна НЕ підставляється)
echo 'It\'s a test';    // It's a test  (екранування апострофу)
echo 'Line 1\nLine 2';  // Line 1\nLine 2  (\n НЕ працює!)
```

#### Подвійні лапки -- з інтерполяцією

```php
<?php
$name = "Timur";
$task = ['title' => 'Buy milk'];

// Подвійні лапки: змінні підставляються
echo "Hello $name";              // Hello Timur
echo "Hello {$name}!";           // Hello Timur!  (фігурні дужки для ясності)
echo "Task: {$task['title']}";   // Task: Buy milk  (доступ до масиву)
echo "Line 1\nLine 2";           // Два рядки (\n працює!)
```

#### Порівняння з JavaScript

```javascript
// JavaScript
const name = "Timur";
console.log(`Hello ${name}!`);           // Hello Timur!
console.log("Hello " + name + "!");      // Hello Timur!
console.log('Hello ' + name + '!');      // Hello Timur!
```

```php
<?php
// PHP
$name = "Timur";
echo "Hello {$name}!";          // Hello Timur! (інтерполяція)
echo 'Hello ' . $name . '!';   // Hello Timur! (конкатенація через .)
```

> **Запамʼятайте:** Конкатенація в PHP -- це `.` (крапка), а не `+`. Оператор `+` в PHP додає числа або зливає масиви.

#### Heredoc та Nowdoc

Heredoc -- це аналог JavaScript template literals для багаторядкового тексту:

```javascript
// JavaScript
const html = `
    <div class="task">
        <h2>${title}</h2>
        <p>Status: ${status}</p>
    </div>
`;
```

```php
<?php
// PHP -- Heredoc (з інтерполяцією, як подвійні лапки)
$title = "Buy milk";
$status = "pending";

$html = <<<HTML
    <div class="task">
        <h2>{$title}</h2>
        <p>Status: {$status}</p>
    </div>
HTML;

// PHP -- Nowdoc (БЕЗ інтерполяції, як одинарні лапки)
$template = <<<'HTML'
    <div class="task">
        <h2>{$title}</h2>
        <p>Це буде буквально {$title}, без підстановки</p>
    </div>
HTML;
```

---

### 4. Оператори

**У Vue ви знаєте `===`, `??`, `?.` --> в PHP є `===`, `??`, `?:`, і унікальний `<=>`.**

#### Порівняння: == vs ===

PHP, як і JS, має "нестроге" (`==`) та "строге" (`===`) порівняння. В PHP "нестроге" порівняння ще небезпечніше, ніж в JS:

```javascript
// JavaScript
0 == ""     // true  (type coercion)
0 === ""    // false (strict)
null == undefined // true
```

```php
<?php
// PHP
0 == "foo"    // true в PHP 7! (рядок приводиться до 0)
              // false в PHP 8+ (поведінку виправили)
0 === "foo"   // false (strict -- завжди безпечно)
0 == ""       // true  (як і в JS)
0 === ""      // false

null == false  // true
null === false // false
```

> **Правило:** Завжди використовуйте `===` та `!==`, як і в JavaScript. Це позбавить вас від несподіванок.

#### Null coalescing: ??

Працює ідентично JavaScript:

```javascript
// JavaScript
const name = user.name ?? "Anonymous";
const city = user?.address?.city ?? "Unknown";
```

```php
<?php
// PHP
$name = $user['name'] ?? "Anonymous";

// Null coalescing assignment (є і в JS, і в PHP)
$name ??= "Default";   // $name = $name ?? "Default"
```

#### Elvis оператор: ?:

PHP має скорочений тернарний оператор, якого немає в JS:

```javascript
// JavaScript -- немає прямого аналога
const display = title || "Untitled";    // falsy check (не тільки null/undefined)
const display = title ? title : "Untitled"; // тернарний
```

```php
<?php
// PHP -- Elvis оператор
$display = $title ?: "Untitled";    // якщо $title truthy -- повертає $title
                                     // якщо falsy -- повертає "Untitled"

// Різниця з ??:
$zero = 0;
echo $zero ?? "default";    // 0      (?? перевіряє тільки null)
echo $zero ?: "default";    // default (?: перевіряє falsy: 0, "", null, false)
```

#### Spaceship оператор: <=>

Унікальний для PHP оператор, корисний для сортування:

```javascript
// JavaScript -- для сортування потрібна функція
const numbers = [3, 1, 2];
numbers.sort((a, b) => a - b);  // [1, 2, 3]
```

```php
<?php
// PHP -- spaceship оператор
echo 1 <=> 2;   // -1  (ліве менше)
echo 2 <=> 2;   //  0  (рівні)
echo 3 <=> 2;   //  1  (ліве більше)

// Ідеально для usort
$numbers = [3, 1, 2];
usort($numbers, fn($a, $b) => $a <=> $b);  // [1, 2, 3]

// Сортування задач за пріоритетом
$tasks = [
    ['title' => 'Task A', 'priority' => 3],
    ['title' => 'Task B', 'priority' => 1],
    ['title' => 'Task C', 'priority' => 2],
];
usort($tasks, fn($a, $b) => $a['priority'] <=> $b['priority']);
```

#### Spread оператор: ...

```javascript
// JavaScript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const merged = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

function sum(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}
```

```php
<?php
// PHP
$arr1 = [1, 2, 3];
$arr2 = [4, 5, 6];
$merged = [...$arr1, ...$arr2]; // [1, 2, 3, 4, 5, 6]

function sum(int ...$numbers): int {
    return array_sum($numbers);
}

echo sum(1, 2, 3, 4); // 10

// Spread для передачі аргументів
function createTask(string $title, string $status, int $priority): array {
    return compact('title', 'status', 'priority');
}

$args = ['Buy milk', 'pending', 2];
$task = createTask(...$args);
```

---

### 5. Умови та цикли

**У Vue ви маєте `if/else`, `switch`, `for...of` --> в PHP є `if/else`, `match` (покращений switch), `foreach`.**

#### if / else / elseif

```javascript
// JavaScript
if (status === "done") {
    console.log("Completed!");
} else if (status === "pending") {
    console.log("Waiting...");
} else {
    console.log("Unknown");
}
```

```php
<?php
// PHP (майже ідентично, тільки elseif пишеться разом або окремо)
if ($status === "done") {
    echo "Completed!";
} elseif ($status === "pending") {   // або else if -- обидва працюють
    echo "Waiting...";
} else {
    echo "Unknown";
}
```

#### Тернарний оператор

```javascript
// JavaScript
const label = isActive ? "Active" : "Inactive";
```

```php
<?php
// PHP -- ідентично
$label = $isActive ? "Active" : "Inactive";
```

#### match -- покращений switch

**У Vue/JS `switch` -- це statement --> в PHP `match` -- це expression (повертає значення), як в Rust/Kotlin.**

`match` зʼявився в PHP 8.0 і є значно кращим за `switch`:

```javascript
// JavaScript -- switch (statement)
let label;
switch (status) {
    case "pending":
        label = "Очікує";
        break;                // легко забути break!
    case "in_progress":
        label = "В роботі";
        break;
    case "done":
        label = "Готово";
        break;
    default:
        label = "Невідомо";
}
```

```php
<?php
// PHP -- match (expression, повертає значення!)
$label = match ($status) {
    'pending'     => 'Очікує',
    'in_progress' => 'В роботі',
    'done'        => 'Готово',
    default       => 'Невідомо',
};

// Переваги match над switch:
// 1. Повертає значення (expression, не statement)
// 2. Строге порівняння (===, не ==)
// 3. Не потрібен break
// 4. Можна обʼєднувати кейси

$category = match ($priority) {
    1, 2   => 'low',       // 1 або 2
    3      => 'medium',
    4, 5   => 'high',      // 4 або 5
    default => 'unknown',
};

// match без аргументу (як серія if/elseif)
$description = match (true) {
    $score >= 90 => 'Excellent',
    $score >= 70 => 'Good',
    $score >= 50 => 'Average',
    default      => 'Poor',
};
```

#### for

```javascript
// JavaScript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
```

```php
<?php
// PHP -- ідентичний синтаксис
for ($i = 0; $i < 5; $i++) {
    echo $i . "\n";
}
```

#### foreach (аналог for...of)

```javascript
// JavaScript
const tasks = ["Task 1", "Task 2", "Task 3"];

// Тільки значення
for (const task of tasks) {
    console.log(task);
}

// З індексом
tasks.forEach((task, index) => {
    console.log(`${index}: ${task}`);
});

// Обʼєкт
const user = { name: "Tim", age: 25 };
for (const [key, value] of Object.entries(user)) {
    console.log(`${key}: ${value}`);
}
```

```php
<?php
// PHP
$tasks = ["Task 1", "Task 2", "Task 3"];

// Тільки значення
foreach ($tasks as $task) {
    echo $task . "\n";
}

// З індексом (ключем)
foreach ($tasks as $index => $task) {
    echo "{$index}: {$task}\n";
}

// Асоціативний масив
$user = ['name' => 'Tim', 'age' => 25];
foreach ($user as $key => $value) {
    echo "{$key}: {$value}\n";
}
```

#### while / do-while

```php
<?php
// PHP -- ідентично JS
$i = 0;
while ($i < 5) {
    echo $i . "\n";
    $i++;
}

$i = 0;
do {
    echo $i . "\n";
    $i++;
} while ($i < 5);
```

---

### 6. Функції

**У Vue ви оголошуєте функції через `function` або стрілки `=>` --> в PHP є `function`, стрілкові `fn()` та замикання з `use`.**

#### Звичайні функції

```javascript
// JavaScript
function greet(name) {
    return `Hello, ${name}!`;
}

// або
const greet = (name) => `Hello, ${name}!`;
```

```php
<?php
// PHP
function greet(string $name): string {
    return "Hello, {$name}!";
}

echo greet("Timur"); // Hello, Timur!
```

> **Зверніть увагу:** В PHP можна (і рекомендовано) вказувати типи параметрів (`string $name`) та тип повернення (`: string`). Це як TypeScript, але вбудовано в мову.

#### Типи параметрів та значення за замовчуванням

```javascript
// TypeScript
function createTask(title: string, priority: number = 3): object {
    return { title, priority };
}
```

```php
<?php
// PHP
function createTask(string $title, int $priority = 3): array {
    return [
        'title' => $title,
        'priority' => $priority,
    ];
}

$task = createTask("Buy milk");        // priority = 3
$task = createTask("Buy milk", 1);     // priority = 1
```

#### Nullable типи

```javascript
// TypeScript
function findTask(id: number): Task | null {
    // ...
}
```

```php
<?php
// PHP
function findTask(int $id): ?array {    // ?array означає array|null
    // ...
    return null;
}

// Або через union type (PHP 8+)
function findTask(int $id): array|null {
    // ...
    return null;
}
```

#### Стрілкові функції: fn()

**У Vue `(x) => x * 2` --> в PHP `fn($x) => $x * 2`.**

Стрілкові функції в PHP мають важливе обмеження: тільки один вираз (як implicit return в JS).

```javascript
// JavaScript
const double = (x) => x * 2;
const isActive = (task) => task.status === "active";
const tasks = items.filter(item => item.status === "pending");
```

```php
<?php
// PHP
$double = fn(int $x): int => $x * 2;
$isActive = fn(array $task): bool => $task['status'] === 'active';

$pending = array_filter($tasks, fn($task) => $task['status'] === 'pending');
```

> **Важлива різниця:** Стрілкові функції PHP автоматично захоплюють змінні з зовнішнього scope (read-only). Звичайні анонімні функції -- ні, потрібне явне `use`.

#### Замикання (Closures) та use

Це найбільша різниця з JavaScript. В JS замикання автоматично бачать зовнішні змінні. В PHP анонімна функція НЕ бачить зовнішніх змінних, якщо ви їх явно не передасте через `use`:

```javascript
// JavaScript -- замикання автоматично бачить name
const name = "Timur";
const greet = () => `Hello, ${name}!`;
console.log(greet()); // "Hello, Timur!"
```

```php
<?php
// PHP -- анонімна функція НЕ бачить $name без use!
$name = "Timur";

// Це НЕ працює (Warning: Undefined variable $name)
$greetBroken = function () {
    return "Hello, {$name}!";
};

// Це працює -- явне use
$greet = function () use ($name) {
    return "Hello, {$name}!";
};
echo $greet(); // "Hello, Timur!"

// Стрілкова функція -- автоматично бачить зовнішні змінні
$greetArrow = fn() => "Hello, {$name}!";
echo $greetArrow(); // "Hello, Timur!"
```

#### use за посиланням (by reference)

```php
<?php
$counter = 0;

// Захоплення за значенням (копія)
$increment = function () use ($counter) {
    $counter++;  // змінює локальну копію
};
$increment();
echo $counter; // 0 -- не змінився!

// Захоплення за посиланням
$increment = function () use (&$counter) {  // зверніть увагу на &
    $counter++;
};
$increment();
echo $counter; // 1 -- змінився!
```

#### Передача за посиланням

```javascript
// JavaScript
// Примітиви завжди за значенням, обʼєкти за посиланням.
// Немає контролю.
```

```php
<?php
// PHP -- можна явно вказати передачу за посиланням через &
function addItem(array &$list, string $item): void {
    $list[] = $item;
}

$tasks = ['Task 1', 'Task 2'];
addItem($tasks, 'Task 3');
// $tasks тепер ['Task 1', 'Task 2', 'Task 3']
```

#### Тип повернення void

```php
<?php
function logMessage(string $message): void {
    echo "[LOG] {$message}\n";
    // Не повертає нічого. return; дозволений, return $value -- ні.
}
```

---

### 7. Вбудовані функції

**У Vue ви використовуєте методи масивів та рядків через крапку (`arr.map()`, `str.includes()`) --> в PHP це окремі функції (`array_map()`, `str_contains()`).**

PHP має тисячі вбудованих функцій. Ось найважливіші:

#### Функції для рядків

```javascript
// JavaScript
"hello".length;                    // 5
"hello world".includes("world");   // true
"hello world".startsWith("hello"); // true
"hello world".indexOf("world");    // 6
"hello world".replace("world", "PHP");  // "hello PHP"
"hello world".toUpperCase();       // "HELLO WORLD"
"hello world".split(" ");         // ["hello", "world"]
"  hello  ".trim();                // "hello"
"hello".substring(0, 3);          // "hel"
"hello".repeat(3);                // "hellohellohello"
```

```php
<?php
// PHP
strlen("hello");                      // 5
str_contains("hello world", "world"); // true   (PHP 8+)
str_starts_with("hello world", "hello"); // true (PHP 8+)
strpos("hello world", "world");       // 6      (або false якщо не знайдено)
str_replace("world", "PHP", "hello world"); // "hello PHP"
strtoupper("hello world");           // "HELLO WORLD"
strtolower("HELLO");                 // "hello"
explode(" ", "hello world");         // ["hello", "world"]
trim("  hello  ");                   // "hello"
substr("hello", 0, 3);              // "hel"
str_repeat("hello", 3);             // "hellohellohello"
mb_strlen("Привіт");                // 6 (для Unicode -- використовуйте mb_ функції)
```

> **Увага:** `strlen` рахує байти, не символи. Для кирилиці та інших багатобайтових кодувань використовуйте `mb_strlen`.

#### Функції для масивів

```javascript
// JavaScript
const numbers = [1, 2, 3, 4, 5];

numbers.map(n => n * 2);             // [2, 4, 6, 8, 10]
numbers.filter(n => n > 3);          // [4, 5]
numbers.reduce((sum, n) => sum + n, 0); // 15
numbers.find(n => n > 3);            // 4
numbers.every(n => n > 0);           // true
numbers.some(n => n > 4);            // true
numbers.includes(3);                 // true
numbers.sort((a, b) => b - a);       // [5, 4, 3, 2, 1]
numbers.reverse();                   // [5, 4, 3, 2, 1]
numbers.slice(1, 3);                 // [2, 3]
numbers.join(", ");                  // "1, 2, 3, 4, 5"
```

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// map -- зверніть увагу на порядок аргументів: callback ПЕРШИМ
array_map(fn($n) => $n * 2, $numbers);              // [2, 4, 6, 8, 10]

// filter -- callback ДРУГИМ (так, порядок відрізняється від array_map!)
array_filter($numbers, fn($n) => $n > 3);            // [3 => 4, 4 => 5]
// УВАГА: array_filter зберігає ключі! Для переіндексації:
array_values(array_filter($numbers, fn($n) => $n > 3)); // [4, 5]

// reduce
array_reduce($numbers, fn($sum, $n) => $sum + $n, 0); // 15
// Або просто:
array_sum($numbers);  // 15

// Пошук (немає прямого аналога find, але можна так)
$found = array_filter($numbers, fn($n) => $n > 3);
$first = reset($found); // 4 (перший елемент)

// Перевірки
in_array(3, $numbers);   // true
array_all($numbers, fn($n) => $n > 0);   // true   (PHP 8.4+)
array_any($numbers, fn($n) => $n > 4);   // true   (PHP 8.4+)

// Сортування (УВАГА: змінює оригінальний масив!)
sort($numbers);                              // [1, 2, 3, 4, 5] за зростанням
rsort($numbers);                             // [5, 4, 3, 2, 1] за спаданням
usort($numbers, fn($a, $b) => $b <=> $a);   // [5, 4, 3, 2, 1] кастомне

// Інші
array_reverse($numbers);      // [5, 4, 3, 2, 1] (не змінює оригінал)
array_slice($numbers, 1, 2);  // [2, 3]
implode(", ", $numbers);      // "1, 2, 3, 4, 5"
count($numbers);               // 5
```

> **Важлива пастка:** В `array_map` callback йде ПЕРШИМ аргументом, а масив -- другим. В `array_filter` -- навпаки! Це одна з найнеприємніших непослідовностей PHP.

#### JSON

```javascript
// JavaScript
const obj = { name: "Tim", age: 25 };
const json = JSON.stringify(obj);         // '{"name":"Tim","age":25}'
const parsed = JSON.parse(json);           // { name: "Tim", age: 25 }
```

```php
<?php
// PHP
$data = ['name' => 'Tim', 'age' => 25];
$json = json_encode($data);                // '{"name":"Tim","age":25}'
$parsed = json_decode($json, true);        // ['name' => 'Tim', 'age' => 25]
// Другий аргумент true -- повертає масив, а не обʼєкт

// Красивий JSON
$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
```

---

### 8. Виведення даних: echo, print_r, var_dump

**У Vue ви маєте `console.log()` --> в PHP є три різних інструменти для виведення, кожен зі своєю метою.**

```javascript
// JavaScript
console.log("hello");           // hello
console.log([1, 2, 3]);        // [1, 2, 3]
console.log({ name: "Tim" });  // { name: 'Tim' }
```

```php
<?php
$arr = [1, 2, 3];
$task = ['title' => 'Buy milk', 'done' => false];

// echo -- для рядків. Найпростіший варіант.
echo "Hello\n";           // Hello
echo 42;                  // 42
// echo $arr;             // Warning: Array to string conversion

// print_r -- для масивів. Людино-читабельний формат.
print_r($arr);
// Array
// (
//     [0] => 1
//     [1] => 2
//     [2] => 3
// )

print_r($task);
// Array
// (
//     [title] => Buy milk
//     [done] =>
// )

// var_dump -- НАЙКОРИСНІШИЙ для дебагу. Показує тип та значення.
var_dump($arr);
// array(3) {
//   [0]=> int(1)
//   [1]=> int(2)
//   [2]=> int(3)
// }

var_dump($task);
// array(2) {
//   ["title"]=> string(8) "Buy milk"
//   ["done"]=> bool(false)
// }

var_dump(null);    // NULL
var_dump(true);    // bool(true)
var_dump(3.14);    // float(3.14)
```

**Коли що використовувати:**

| Функція | Коли використовувати | Аналог JS |
|---|---|---|
| `echo` | Виведення рядків, чисел | `console.log("text")` |
| `print_r` | Перегляд структури масиву | `console.log(array)` |
| `var_dump` | Дебаг з повною інформацією про типи | Chrome DevTools inspect |

---

### 9. Запуск PHP-файлів

**У Vue ви запускаєте код через `node script.js` або в браузері --> в PHP це `php script.php` з терміналу.**

```bash
# Створити файл
echo '<?php echo "Hello, PHP!\n";' > hello.php

# Запустити
php hello.php
# Виведе: Hello, PHP!
```

Кожен PHP-файл починається з `<?php`. Закриваючий тег `?>` НЕ потрібен (і не рекомендований) якщо файл містить тільки PHP-код.

```php
<?php
// hello.php

echo "Hello, PHP!\n";
echo "Version: " . PHP_VERSION . "\n";

// Закриваючий ?> НЕ потрібен і навіть шкідливий
// (може додати зайві пробіли/рядки в output)
```

---

### 10. strict_types

**У Vue/TypeScript ви маєте strict mode в `tsconfig.json` --> в PHP є `declare(strict_types=1)`, який вмикає строгу перевірку типів.**

За замовчуванням PHP автоматично приводить типи (type juggling):

```php
<?php
// БЕЗ strict_types
function add(int $a, int $b): int {
    return $a + $b;
}

echo add(1, 2);       // 3
echo add("1", "2");   // 3 -- PHP автоматично приведе рядки до int!
echo add(1.9, 2.1);   // 3 -- float обрізається до int!
```

З `strict_types`:

```php
<?php
declare(strict_types=1); // ОБОВʼЯЗКОВО першим рядком після <?php

function add(int $a, int $b): int {
    return $a + $b;
}

echo add(1, 2);       // 3
echo add("1", "2");   // TypeError! Argument must be of type int, string given
echo add(1.9, 2.1);   // TypeError! Argument must be of type int, float given
```

> **Рекомендація:** Завжди додавайте `declare(strict_types=1);` у кожний PHP-файл. Це допоможе ловити баги на ранній стадії, як TypeScript в JS-світі. Laravel-файли, які ви будете створювати, зазвичай включають це автоматично.

---

## Практика: крок за кроком

### Крок 1. Перевірте, що PHP встановлений

```bash
php -v
```

Очікуваний вивід (версія може відрізнятися):

```
PHP 8.3.x (cli) (built: ...)
```

Якщо PHP не встановлений:

```bash
# macOS
brew install php

# Ubuntu/Debian
sudo apt install php-cli

# Windows -- скачайте з php.net або використовуйте Laravel Herd
```

### Крок 2. Створіть робочу директорію

```bash
mkdir -p playground
cd playground
```

### Крок 3. Перший PHP-файл

Створіть файл `playground/00-hello.php`:

```php
<?php
declare(strict_types=1);

// Змінні
$name = "Timur";
$age = 25;
$isStudent = true;

echo "=== Змінні ===\n";
echo "Name: {$name}\n";
echo "Age: {$age}\n";
echo "Is student: " . ($isStudent ? 'yes' : 'no') . "\n\n";

// Масиви
echo "=== Масиви ===\n";
$fruits = ['apple', 'banana', 'cherry'];
echo "Fruits: " . implode(', ', $fruits) . "\n";
echo "First: {$fruits[0]}\n";
echo "Count: " . count($fruits) . "\n\n";

// Асоціативний масив
echo "=== Асоціативний масив ===\n";
$task = [
    'title' => 'Learn PHP',
    'status' => 'in_progress',
    'priority' => 1,
];

foreach ($task as $key => $value) {
    echo "  {$key}: {$value}\n";
}

echo "\n";

// Функція
function describe(string $name, int $age): string {
    return "{$name} is {$age} years old";
}

echo describe($name, $age) . "\n\n";

// var_dump для дебагу
echo "=== var_dump ===\n";
var_dump($task);
```

Запустіть:

```bash
php playground/00-hello.php
```

Очікуваний вивід:

```
=== Змінні ===
Name: Timur
Age: 25
Is student: yes

=== Масиви ===
Fruits: apple, banana, cherry
First: apple
Count: 3

=== Асоціативний масив ===
  title: Learn PHP
  status: in_progress
  priority: 1

=== var_dump ===
array(3) {
  ["title"]=>
  string(9) "Learn PHP"
  ["status"]=>
  string(11) "in_progress"
  ["priority"]=>
  int(1)
}
```

### Крок 4. Створіть файл з вправами

Створіть файл `playground/01-basics.php`:

```php
<?php
declare(strict_types=1);

// ============================================
// Task Manager -- PHP Basics Exercises
// ============================================

// Наші тестові дані: масив задач
$tasks = [
    [
        'id' => 1,
        'title' => 'Buy groceries',
        'description' => 'Milk, bread, eggs, cheese',
        'status' => 'done',
        'priority' => 2,
        'created_at' => '2026-04-01',
    ],
    [
        'id' => 2,
        'title' => 'Learn PHP basics',
        'description' => 'Variables, arrays, functions',
        'status' => 'in_progress',
        'priority' => 1,
        'created_at' => '2026-04-02',
    ],
    [
        'id' => 3,
        'title' => 'Setup Laravel',
        'description' => 'Install and configure Laravel 12',
        'status' => 'pending',
        'priority' => 1,
        'created_at' => '2026-04-03',
    ],
    [
        'id' => 4,
        'title' => 'Write API endpoints',
        'description' => 'CRUD for tasks',
        'status' => 'pending',
        'priority' => 3,
        'created_at' => '2026-04-04',
    ],
    [
        'id' => 5,
        'title' => 'Deploy to server',
        'description' => 'Setup hosting and deploy',
        'status' => 'pending',
        'priority' => 5,
        'created_at' => '2026-04-05',
    ],
];


// ============================================
// Вправа 1: formatTask
// ============================================
// Створіть функцію, яка приймає задачу (асоціативний масив)
// і повертає відформатований рядок.
//
// Формат: "[STATUS] #ID - TITLE (priority: PRIORITY)"
// Приклад: "[done] #1 - Buy groceries (priority: 2)"
//
// Підказки:
// - strtoupper() для верхнього регістру статусу, або залиште як є
// - Інтерполяція рядків: "text {$var}"

function formatTask(array $task): string {
    // Ваш код тут
    return "[{$task['status']}] #{$task['id']} - {$task['title']} (priority: {$task['priority']})";
}

// Тест
echo "=== Вправа 1: formatTask ===\n";
foreach ($tasks as $task) {
    echo formatTask($task) . "\n";
}
echo "\n";

// Очікуваний вивід:
// [done] #1 - Buy groceries (priority: 2)
// [in_progress] #2 - Learn PHP basics (priority: 1)
// [pending] #3 - Setup Laravel (priority: 1)
// [pending] #4 - Write API endpoints (priority: 3)
// [pending] #5 - Deploy to server (priority: 5)


// ============================================
// Вправа 2: filterByStatus
// ============================================
// Створіть функцію, яка фільтрує задачі за статусом.
//
// Приймає: масив задач, рядок статусу
// Повертає: масив задач з відповідним статусом
//
// Підказки:
// - array_filter() з callback
// - array_values() для переіндексації

function filterByStatus(array $tasks, string $status): array {
    // Ваш код тут
    return array_values(
        array_filter($tasks, fn(array $task): bool => $task['status'] === $status)
    );
}

// Тест
echo "=== Вправа 2: filterByStatus ===\n";

$pendingTasks = filterByStatus($tasks, 'pending');
echo "Pending tasks (" . count($pendingTasks) . "):\n";
foreach ($pendingTasks as $task) {
    echo "  - {$task['title']}\n";
}
echo "\n";

$doneTasks = filterByStatus($tasks, 'done');
echo "Done tasks (" . count($doneTasks) . "):\n";
foreach ($doneTasks as $task) {
    echo "  - {$task['title']}\n";
}
echo "\n";

// Очікуваний вивід:
// Pending tasks (3):
//   - Setup Laravel
//   - Write API endpoints
//   - Deploy to server
//
// Done tasks (1):
//   - Buy groceries


// ============================================
// Вправа 3: getTaskStats
// ============================================
// Створіть функцію, яка повертає статистику по задачах.
//
// Повертає асоціативний масив:
// [
//     'total' => 5,
//     'by_status' => [
//         'done' => 1,
//         'in_progress' => 1,
//         'pending' => 3,
//     ],
//     'by_priority' => [
//         1 => 2,   // два завдання з пріоритетом 1
//         2 => 1,
//         3 => 1,
//         5 => 1,
//     ],
//     'completion_rate' => 20.0,  // відсоток виконаних
// ]
//
// Підказки:
// - count() для загальної кількості
// - foreach для підрахунку
// - round() для відсотків

function getTaskStats(array $tasks): array {
    // Ваш код тут
    $total = count($tasks);

    $byStatus = [];
    $byPriority = [];

    foreach ($tasks as $task) {
        $status = $task['status'];
        $priority = $task['priority'];

        // Підрахунок по статусу
        if (!isset($byStatus[$status])) {
            $byStatus[$status] = 0;
        }
        $byStatus[$status]++;

        // Підрахунок по пріоритету
        if (!isset($byPriority[$priority])) {
            $byPriority[$priority] = 0;
        }
        $byPriority[$priority]++;
    }

    // Сортування пріоритетів за ключем
    ksort($byPriority);

    $doneCount = $byStatus['done'] ?? 0;
    $completionRate = $total > 0 ? round(($doneCount / $total) * 100, 1) : 0.0;

    return [
        'total' => $total,
        'by_status' => $byStatus,
        'by_priority' => $byPriority,
        'completion_rate' => $completionRate,
    ];
}

// Тест
echo "=== Вправа 3: getTaskStats ===\n";
$stats = getTaskStats($tasks);

echo "Total tasks: {$stats['total']}\n";
echo "Completion rate: {$stats['completion_rate']}%\n";
echo "\nBy status:\n";
foreach ($stats['by_status'] as $status => $count) {
    echo "  {$status}: {$count}\n";
}
echo "\nBy priority:\n";
foreach ($stats['by_priority'] as $priority => $count) {
    echo "  Priority {$priority}: {$count} task(s)\n";
}

// Очікуваний вивід:
// Total tasks: 5
// Completion rate: 20%
//
// By status:
//   done: 1
//   in_progress: 1
//   pending: 3
//
// By priority:
//   Priority 1: 2 task(s)
//   Priority 2: 1 task(s)
//   Priority 3: 1 task(s)
//   Priority 5: 1 task(s)


echo "\n=== Додаткові приклади ===\n";

// ============================================
// Бонус: демонстрація різних концепцій
// ============================================

// match expression
echo "\n--- match ---\n";
function getStatusEmoji(string $status): string {
    return match ($status) {
        'pending'     => '[ ]',
        'in_progress' => '[~]',
        'done'        => '[x]',
        default       => '[?]',
    };
}

foreach ($tasks as $task) {
    $emoji = getStatusEmoji($task['status']);
    echo "{$emoji} {$task['title']}\n";
}

// Spaceship оператор для сортування
echo "\n--- Сортування за пріоритетом ---\n";
$sorted = $tasks;
usort($sorted, fn(array $a, array $b): int => $a['priority'] <=> $b['priority']);

foreach ($sorted as $task) {
    echo "  P{$task['priority']}: {$task['title']}\n";
}

// array_map
echo "\n--- array_map: тільки назви ---\n";
$titles = array_map(fn(array $task): string => $task['title'], $tasks);
echo implode(", ", $titles) . "\n";

// Null coalescing
echo "\n--- Null coalescing ---\n";
$taskWithNotes = ['title' => 'Test', 'notes' => null];
$notes = $taskWithNotes['notes'] ?? 'No notes available';
echo "Notes: {$notes}\n";

$taskWithoutNotes = ['title' => 'Test'];
$notes = $taskWithoutNotes['notes'] ?? 'No notes available';
echo "Notes: {$notes}\n";

// compact() та extract()
echo "\n--- compact() ---\n";
$title = "My Task";
$status = "pending";
$priority = 3;

// compact() створює масив з іменованих змінних (аналог { title, status, priority } в JS)
$taskFromVars = compact('title', 'status', 'priority');
print_r($taskFromVars);

// json_encode / json_decode
echo "\n--- JSON ---\n";
$jsonString = json_encode($tasks[0], JSON_PRETTY_PRINT);
echo "JSON:\n{$jsonString}\n\n";

$decoded = json_decode($jsonString, true);
echo "Decoded title: {$decoded['title']}\n";

echo "\n=== Все готово! ===\n";
echo "Запустіть: php playground/01-basics.php\n";
```

Запустіть:

```bash
php playground/01-basics.php
```

---

## Перевірка

Після виконання практики переконайтесь, що:

1. **`php -v`** показує PHP 8.2 або вище
2. **`php playground/00-hello.php`** виводить інформацію про змінні, масиви та var_dump
3. **`php playground/01-basics.php`** виводить:
   - 5 відформатованих задач (Вправа 1)
   - 3 pending та 1 done задачу (Вправа 2)
   - Статистику: total 5, completion rate 20% (Вправа 3)
   - Бонусні приклади з match, sort, array_map, JSON

Якщо ви бачите помилки:
- `Parse error` -- перевірте синтаксис (крапки з комою `;`, дужки)
- `Undefined variable` -- перевірте `$` перед імʼям змінної
- `TypeError` -- перевірте типи аргументів (strict_types увімкнено)

---

## Міні-тест

### Питання 1
Що виведе цей код?
```php
<?php
$x = 10;
$y = "10";
var_dump($x === $y);
```
a) `bool(true)`
b) `bool(false)`
c) `int(1)`
d) Помилка

### Питання 2
Яка різниця між `??` та `?:` ?
```php
<?php
$a = 0;
echo $a ?? "default";   // Що виведе?
echo $a ?: "default";   // Що виведе?
```
a) Обидва виведуть `0`
b) Обидва виведуть `default`
c) Перший виведе `0`, другий виведе `default`
d) Перший виведе `default`, другий виведе `0`

### Питання 3
Що не так з цим кодом?
```php
<?php
$name = "PHP";
$greet = function() {
    return "Hello, $name!";
};
echo $greet();
```
a) Не вистачає `declare(strict_types=1)`
b) Анонімна функція не бачить `$name` без `use ($name)`
c) Потрібні фігурні дужки `{$name}`
d) Функція має бути стрілковою

### Питання 4
Як правильно відфільтрувати масив і переіндексувати результат?
```php
<?php
$nums = [1, 2, 3, 4, 5];
// Залишити тільки парні числа і отримати [2, 4]
```
a) `array_filter($nums, fn($n) => $n % 2 === 0)`
b) `array_values(array_filter($nums, fn($n) => $n % 2 === 0))`
c) `array_map(fn($n) => $n % 2 === 0, $nums)`
d) `filter($nums, fn($n) => $n % 2 === 0)`

### Питання 5
Що виведе цей код?
```php
<?php
$status = "in_progress";
$label = match($status) {
    'pending' => 'Очікує',
    'in_progress', 'active' => 'В роботі',
    'done' => 'Готово',
};
echo $label;
```
a) `Очікує`
b) `В роботі`
c) `Готово`
d) Помилка, бо немає `default`

---

## Практичне завдання

Створіть файл `playground/01-homework.php`, який:

1. **Оголосить масив із 5+ задач**, кожна з полями: `id`, `title`, `status` (pending/in_progress/done), `priority` (1-5), `tags` (масив рядків).

2. **Реалізує функцію `searchTasks(array $tasks, string $keyword): array`**, яка шукає задачі, де `$keyword` зустрічається в `title` або в будь-якому тегу (`tags`). Використайте `str_contains()` та `array_filter()`.

3. **Реалізує функцію `sortByPriority(array $tasks, string $direction = 'asc'): array`**, яка сортує задачі за пріоритетом. Використайте `usort()` та `<=>`.

4. **Реалізує функцію `groupByStatus(array $tasks): array`**, яка групує задачі за статусом. Повертає:
   ```php
   [
       'pending' => [...tasks...],
       'in_progress' => [...tasks...],
       'done' => [...tasks...],
   ]
   ```

5. **Реалізує функцію `formatTaskBoard(array $grouped): string`**, яка приймає результат `groupByStatus` і повертає красиву текстову "дошку":
   ```
   === PENDING (3) ===
     [P1] Setup Laravel
     [P3] Write API endpoints
     [P5] Deploy to server
   
   === IN_PROGRESS (1) ===
     [P1] Learn PHP basics
   
   === DONE (1) ===
     [P2] Buy groceries
   ```

Запустіть файл і переконайтесь, що все працює.

---

## Відповіді на тест

### Відповідь 1: **b) `bool(false)`**
Оператор `===` порівнює і значення, і тип. `$x` -- це `int`, `$y` -- це `string`. Різні типи, тому `false`. Якби було `==`, результат був би `true`.

### Відповідь 2: **c) Перший виведе `0`, другий виведе `default`**
- `??` (null coalescing) перевіряє тільки `null`. `0` -- не `null`, тому повертає `0`.
- `?:` (Elvis) перевіряє "truthiness". `0` -- falsy, тому повертає `"default"`.

### Відповідь 3: **b) Анонімна функція не бачить `$name` без `use ($name)`**
В PHP анонімні функції (не стрілкові) не захоплюють зовнішні змінні автоматично. Треба:
```php
$greet = function() use ($name) {
    return "Hello, $name!";
};
```
Або використати стрілкову функцію:
```php
$greet = fn() => "Hello, $name!";
```

### Відповідь 4: **b) `array_values(array_filter(...))`**
`array_filter` зберігає оригінальні ключі, тому без `array_values` ви отримаєте `[1 => 2, 3 => 4]` замість `[0 => 2, 1 => 4]`. Варіант a) технічно працює, але без переіндексації.

### Відповідь 5: **b) `В роботі`**
`match` підтримує кілька значень через кому: `'in_progress', 'active' => 'В роботі'`. Оскільки `$status === 'in_progress'`, результат -- `'В роботі'`. Без `default` це небезпечно (якщо жодний кейс не спрацює -- буде UnhandledMatchError), але тут все працює.
