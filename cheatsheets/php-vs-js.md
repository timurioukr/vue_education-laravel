# PHP vs JavaScript: шпаргалка для Vue-розробника

Ця шпаргалка допоможе швидко знаходити PHP-еквіваленти знайомих JS-конструкцій.

---

## Змінні

**JavaScript:**
```javascript
let name = 'Timur';
const age = 25;
var legacy = 'old'; // не використовуємо
```

**PHP:**
```php
$name = 'Timur';       // всі змінні починаються з $
$age = 25;             // немає let/const -- всі змінні можна перезаписати
define('API_URL', 'https://example.com'); // константа
const MAX_ITEMS = 100; // константа в класі або глобальна
```

> **Зверни увагу:** В PHP немає `const` для змінних як в JS. Всі змінні з `$` можна перезаписати. Для незмінних значень використовують `define()` або `const` поза змінними.

---

## Типи даних

| JavaScript | PHP | Примітка |
|---|---|---|
| `'string'` | `'string'` | Однакові |
| `42` / `3.14` | `42` (int) / `3.14` (float) | PHP розрізняє int та float |
| `true` / `false` | `true` / `false` | Однакові |
| `null` | `null` | Однакові |
| `undefined` | -- | В PHP немає undefined |
| `[]` (Array) | `[]` (array) | PHP масиви -- це і масиви, і об'єкти одночасно |
| `{}` (Object) | `[]` (assoc array) або `object` | Асоціативний масив -- найближчий аналог |

---

## Функції

**JavaScript:**
```javascript
// Звичайна функція
function greet(name) {
    return `Hello, ${name}!`;
}

// Стрілкова функція
const greet = (name) => `Hello, ${name}!`;

// Колбек
users.forEach((user) => {
    console.log(user.name);
});
```

**PHP:**
```php
// Звичайна функція
function greet(string $name): string {
    return "Hello, {$name}!";
}

// Анонімна функція (closure) -- аналог стрілкової
$greet = function (string $name): string {
    return "Hello, {$name}!";
};

// Стрілкова функція (PHP 7.4+) -- тільки один вираз
$greet = fn(string $name): string => "Hello, {$name}!";

// Колбек
array_walk($users, function ($user) {
    echo $user['name'];
});
```

> **Зверни увагу:** PHP closure не захоплює зовнішні змінні автоматично. Потрібно явно вказати через `use`:
> ```php
> $prefix = 'Mr.';
> $greet = function ($name) use ($prefix) {
>     return "{$prefix} {$name}";
> };
> ```

---

## Масиви: map, filter, reduce

**JavaScript:**
```javascript
const numbers = [1, 2, 3, 4, 5];

// map
const doubled = numbers.map(n => n * 2);

// filter
const even = numbers.filter(n => n % 2 === 0);

// reduce
const sum = numbers.reduce((acc, n) => acc + n, 0);

// find
const found = numbers.find(n => n > 3);

// includes
const has3 = numbers.includes(3);

// spread
const merged = [...arr1, ...arr2];
```

**PHP:**
```php
$numbers = [1, 2, 3, 4, 5];

// array_map -- увага: колбек ПЕРШИМ аргументом
$doubled = array_map(fn($n) => $n * 2, $numbers);

// array_filter -- зберігає ключі!
$even = array_filter($numbers, fn($n) => $n % 2 === 0);
$even = array_values(array_filter($numbers, fn($n) => $n % 2 === 0)); // скинути ключі

// array_reduce
$sum = array_reduce($numbers, fn($acc, $n) => $acc + $n, 0);

// знайти перший елемент (немає вбудованого find)
$found = collect($numbers)->first(fn($n) => $n > 3); // через Laravel Collection

// in_array -- аналог includes
$has3 = in_array(3, $numbers);

// spread (PHP 7.4+) -- тільки для аргументів функцій
$merged = array_merge($arr1, $arr2);
$merged = [...$arr1, ...$arr2]; // PHP 8.1+
```

> **Зверни увагу:** Порядок аргументів в PHP-функціях масивів часто відрізняється від JS і між собою. `array_map($callback, $array)`, але `array_filter($array, $callback)`. Це класична пастка PHP.

---

## Об'єкти та асоціативні масиви

**JavaScript:**
```javascript
// Об'єкт
const user = {
    name: 'Timur',
    age: 25,
    isAdmin: true,
};

// Доступ до властивостей
console.log(user.name);
console.log(user['name']);

// Перевірка ключа
if ('name' in user) { ... }

// Object.keys / values / entries
Object.keys(user);
Object.values(user);
Object.entries(user);
```

**PHP:**
```php
// Асоціативний масив (найближчий аналог JS-об'єкта)
$user = [
    'name' => 'Timur',
    'age' => 25,
    'is_admin' => true,
];

// Доступ
echo $user['name'];

// Перевірка ключа
if (array_key_exists('name', $user)) { ... }
if (isset($user['name'])) { ... } // також перевіряє що не null

// Аналоги Object.keys / values
array_keys($user);   // ['name', 'age', 'is_admin']
array_values($user);  // ['Timur', 25, true]
```

> **Зверни увагу:** В PHP масив може бути і звичайним `[1, 2, 3]`, і асоціативним `['key' => 'value']`, і змішаним. Це один тип даних. В JS це два різних типи (Array і Object).

---

## Рядки

**JavaScript:**
```javascript
const name = 'Timur';

// Шаблонний рядок (template literal)
const greeting = `Hello, ${name}! You have ${2 + 3} tasks.`;

// Конкатенація
const full = firstName + ' ' + lastName;
```

**PHP:**
```php
$name = 'Timur';

// Подвійні лапки -- інтерполяція змінних
$greeting = "Hello, {$name}!";      // працює
$greeting = "Hello, $name!";        // теж працює, але фігурні дужки надійніші

// Вирази в рядках НЕ працюють (на відміну від JS template literals)
// $greeting = "You have {2 + 3} tasks."; // НЕ ПРАЦЮЄ
$count = 2 + 3;
$greeting = "You have {$count} tasks.";  // так правильно

// Конкатенація -- крапка замість плюса
$full = $firstName . ' ' . $lastName;

// Одинарні лапки -- без інтерполяції (як звичайний рядок)
$raw = 'Hello, $name'; // виведе буквально: Hello, $name
```

---

## Обробка null

**JavaScript:**
```javascript
// Optional chaining
const city = user?.address?.city;

// Nullish coalescing
const name = user.name ?? 'Anonymous';

// Optional chaining з методом
const result = user?.getProfile?.();
```

**PHP:**
```php
// Nullsafe operator (PHP 8.0+) -- аналог ?.
$city = $user?->address?->city;

// Null coalescing -- ідентичний синтаксис!
$name = $user['name'] ?? 'Anonymous';

// Null coalescing assignment
$name ??= 'Anonymous'; // $name = $name ?? 'Anonymous'

// Nullsafe з методом
$result = $user?->getProfile();
```

> **Зверни увагу:** Оператор `??` працює однаково в обох мовах. А `?.` в JS стає `?->` в PHP для об'єктів та `?->method()` для методів.

---

## Деструктуризація

**JavaScript:**
```javascript
// Масив
const [first, second, ...rest] = [1, 2, 3, 4, 5];

// Об'єкт
const { name, age, ...other } = user;

// В параметрах функції
function greet({ name, age }) {
    return `${name} is ${age}`;
}
```

**PHP:**
```php
// Масив -- через list() або короткий синтаксис [...]
[$first, $second] = [1, 2, 3]; // $first = 1, $second = 2
list($first, $second) = [1, 2, 3]; // те саме

// Пропуск елементів
[, $second] = [1, 2, 3]; // $second = 2

// Асоціативний масив (PHP 7.1+)
['name' => $name, 'age' => $age] = $user;

// Немає spread-деструктуризації для "решти" як ...rest в JS
// Немає деструктуризації в параметрах функції
```

---

## Модулі та простори імен

**JavaScript:**
```javascript
// Експорт
export function helper() { ... }
export default class UserService { ... }

// Імпорт
import UserService from './services/UserService';
import { helper } from './utils';
```

**PHP:**
```php
// Оголошення простору імен (на початку файлу)
namespace App\Services;

class UserService {
    // ...
}

// Використання в іншому файлі
use App\Services\UserService;

$service = new UserService();

// Імпорт кількох класів
use App\Models\User;
use App\Models\Task;

// Аліас (як import { something as alias })
use App\Services\UserService as US;
```

> **Зверни увагу:** PHP не має `import/export`. Замість цього -- `namespace` (оголошення "адреси" класу) та `use` (підключення класу за його "адресою"). Composer (аналог npm) автоматично завантажує файли через autoload.

---

## Пакетний менеджер: npm vs Composer

| npm (JS) | Composer (PHP) | Опис |
|---|---|---|
| `package.json` | `composer.json` | Файл залежностей |
| `package-lock.json` | `composer.lock` | Точні версії |
| `node_modules/` | `vendor/` | Папка з пакетами |
| `npm install` | `composer install` | Встановити залежності |
| `npm install axios` | `composer require guzzlehttp/guzzle` | Додати пакет |
| `npm install -D vitest` | `composer require --dev phpunit/phpunit` | Dev-залежність |
| `npm run dev` | `php artisan serve` | Запуск dev-сервера |
| `npx` | `./vendor/bin/` | Запуск локальних пакетів |
| `npm update` | `composer update` | Оновити залежності |

---

## Типізація: TypeScript vs PHP

**TypeScript:**
```typescript
interface User {
    name: string;
    age: number;
    isAdmin: boolean;
    tasks?: Task[];
}

function greet(user: User): string {
    return `Hello, ${user.name}`;
}
```

**PHP:**
```php
class User {
    public function __construct(
        public string $name,
        public int $age,
        public bool $isAdmin,
        /** @var Task[]|null */
        public ?array $tasks = null,
    ) {}
}

function greet(User $user): string {
    return "Hello, {$user->name}";
}
```

> **Зверни увагу:** PHP має вбудовану типізацію (без потреби в окремому компіляторі як TypeScript). Типи перевіряються в рантаймі, а не під час компіляції. Можна вказувати типи параметрів, повернення, властивостей класу.

---

## Вивід та дебаг

**JavaScript:**
```javascript
console.log('Hello');
console.log({ user });         // об'єкт
console.table(users);          // таблиця
console.error('Oops');
JSON.stringify(obj, null, 2);  // серіалізація
```

**PHP:**
```php
echo 'Hello';                  // вивід рядка
echo $name . PHP_EOL;         // з переносом рядка

print_r($array);              // вивід масиву (читабельно)
var_dump($variable);          // вивід з типами (детально)

// Laravel-специфічні (найзручніші):
dd($variable);                // dump & die -- вивести і зупинити
dump($variable);              // вивести без зупинки
logger($message);             // записати в лог-файл
info($message);               // те саме, рівень info

json_encode($data, JSON_PRETTY_PRINT); // серіалізація в JSON
```

> **Зверни увагу:** `dd()` -- це ваш найкращий друг для дебагу в Laravel. Працює як `console.log()`, але зупиняє виконання. Використовуйте `dump()`, якщо не хочете зупиняти скрипт.

---

## Обробка помилок

**JavaScript:**
```javascript
try {
    const response = await fetch(url);
    const data = await response.json();
} catch (error) {
    console.error(error.message);
} finally {
    loading.value = false;
}
```

**PHP:**
```php
try {
    $response = Http::get($url);
    $data = $response->json();
} catch (Exception $e) {
    Log::error($e->getMessage());
} catch (HttpException $e) {         // можна ловити різні типи винятків
    Log::error('HTTP error: ' . $e->getMessage());
} finally {
    $this->loading = false;
}

// Кинути виняток (як throw new Error в JS)
throw new \Exception('Something went wrong');

// Laravel-специфічні
abort(404);                          // HTTP 404
abort(403, 'Forbidden');             // HTTP 403 з повідомленням
abort_if($user->isBanned(), 403);   // умовний abort
abort_unless($user->isAdmin(), 403);
```

> **Зверни увагу:** Синтаксис `try/catch/finally` практично ідентичний. Різниця: PHP дозволяє кілька `catch`-блоків для різних типів винятків, що в JS потребує `instanceof` перевірок всередині одного `catch`.

---

## Асинхронність

**JavaScript:**
```javascript
// Promise
fetch(url)
    .then(res => res.json())
    .then(data => console.log(data));

// async/await
const data = await fetch(url);
const json = await data.json();

// Паралельні запити
const [users, tasks] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/tasks'),
]);
```

**PHP:**
```php
// PHP -- синхронна мова. Код виконується послідовно, рядок за рядком.
// Немає Promise, async/await.

// HTTP-запити (синхронні)
$response = Http::get($url);
$data = $response->json();

// Паралельні HTTP-запити (Laravel HTTP client)
$responses = Http::pool(fn(Pool $pool) => [
    $pool->get('/api/users'),
    $pool->get('/api/tasks'),
]);

// Для фонових задач -- Queues (черги)
// Аналог: як запустити Web Worker в JS
dispatch(new SendEmailJob($user));  // кинути в чергу, виконається у фоні
```

> **Зверни увагу:** PHP працює за моделлю "запит-відповідь". Кожен HTTP-запит -- це окремий процес, який живе тільки поки готує відповідь. Для довгих операцій (відправка email, обробка файлів) використовуйте Laravel Queues -- це як Web Workers для PHP.
