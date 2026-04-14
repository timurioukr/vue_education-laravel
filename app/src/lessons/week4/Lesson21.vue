<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import CodePlayground from '@/components/interactive/CodePlayground.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion } from '@/types'

defineProps<{
  activeTab: string
}>()

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Що таке проблема N+1 у Eloquent?',
    options: [
      'Один запит повертає на 1 запис більше ніж потрібно',
      '1 запит для списку + N окремих запитів для кожного звʼязку (relation)',
      'Запит виконується N+1 секунд',
      'Помилка при зверненні до неіснуючої колонки',
    ],
    correct: 1,
    explanation:
      'N+1 — класична проблема ORM: 1 запит SELECT * FROM tasks (список), потім для КОЖНОГО task ще 1 запит SELECT * FROM categories WHERE id = ?. Якщо 100 задач — 101 запит замість 2. Вирішення: with("category") — eager loading.',
  },
  {
    question: 'Як виявити lazy loading у dev-режимі Laravel?',
    options: [
      'Додати dd() після кожного запиту',
      'Model::preventLazyLoading() — кидає виключення при спробі lazy load',
      'Увімкнути SQL-лог у .env',
      'Використати composer require debug',
    ],
    correct: 1,
    explanation:
      'Model::preventLazyLoading() у AppServiceProvider::boot() кидає LazyLoadingViolationException при спробі завантажити relation без with(). Працює тільки в dev (! app()->isProduction()). Аналог strict mode у Vue — допомагає ловити помилки рано.',
  },
  {
    question: 'Яка різниця між chunk() та cursor()?',
    options: [
      'chunk() для читання, cursor() для запису',
      'chunk() завантажує N записів за раз (кілька SQL), cursor() стрімить по одному (1 SQL + PHP Generator)',
      'Різниці немає — це синоніми',
      'cursor() швидший бо використовує кеш',
    ],
    correct: 1,
    explanation:
      'chunk(200) виконує SELECT ... LIMIT 200 OFFSET 0, потім OFFSET 200, і т.д. — кілька SQL-запитів, але кожен блок в памʼяті. cursor() виконує 1 SQL і стрімить результати через PHP Generator — мінімум памʼяті, але тримає зʼєднання. Аналог: chunk = пагінація, cursor = virtual scroll.',
  },
  {
    question: 'Що робить Cache::remember("key", 60, fn)?',
    options: [
      'Завжди виконує closure і зберігає результат',
      'Повертає кеш якщо існує; якщо ні — виконує closure, зберігає на 60 секунд і повертає',
      'Видаляє ключ через 60 секунд',
      'Зберігає closure для відкладеного виконання',
    ],
    correct: 1,
    explanation:
      'Cache::remember() — "get or set": якщо ключ є в кеші — повертає миттєво (без SQL). Якщо ні — виконує closure (наприклад, складний запит), зберігає результат з TTL і повертає. Аналог useFetch з кешем або queryClient.getQueryData() ?? fetchQuery() у TanStack Query.',
  },
  {
    question: 'Які колонки найкраще підходять для індексу БД?',
    options: [
      'Колонки з текстовим типом (TEXT/BLOB)',
      'Колонки які часто використовуються в WHERE, ORDER BY та JOIN',
      'Всі колонки — індекси завжди прискорюють',
      'Тільки primary key',
    ],
    correct: 1,
    explanation:
      'Індекс прискорює WHERE / ORDER BY / JOIN — БД знаходить рядки без повного сканування таблиці (як зміст книги vs перечитати всю книгу). Але індекси займають місце і сповільнюють INSERT/UPDATE. Індексувати: status, user_id, deadline, created_at. НЕ індексувати: description (TEXT), рідко фільтровані колонки.',
  },
]

// === CodeComparison: Vue caching vs Laravel caching ===
const jsCache = `// Vue / TanStack Query — кешування
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

// 1. computed — мемоїзація (перераховує тільки
//    коли залежності змінились)
const tasks = ref([...])
const overdue = computed(() =>
  tasks.value.filter(t => t.isOverdue)
) // кешується поки tasks не змінився

// 2. useFetch / useQuery — HTTP-кеш
const { data } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => fetch('/api/tasks').then(r => r.json()),
  staleTime: 60_000, // 60с — не рефетчить
})

// 3. Інвалідація кешу
const qc = useQueryClient()
qc.invalidateQueries({ queryKey: ['tasks'] })
// Позначає stale → рефетчить при наступному доступі

// 4. Оптимістичний кеш
qc.setQueryData(['tasks'], oldTasks =>
  oldTasks.map(t =>
    t.id === id ? { ...t, status: 'done' } : t
  )
)`

const phpCache = `<?php
// Laravel — Cache::remember + Eager Loading

// 1. Eager Loading — "мемоїзація" для relations
// БЕЗ: 1 + N запитів (lazy loading)
$tasks = Task::all();
foreach ($tasks as $t) {
    echo $t->category->name; // +1 SQL кожен раз!
}

// З with(): рівно 2 запити
$tasks = Task::with('category')->get();
// SELECT * FROM tasks
// SELECT * FROM categories WHERE id IN (1, 2, 3...)

// 2. Cache::remember — HTTP-кеш на сервері
$tasks = Cache::remember('tasks:all', 60, function () {
    return Task::with('category')
        ->where('status', 'active')
        ->get();
}); // 60 секунд — closure НЕ виконується

// 3. Інвалідація кешу
Cache::forget('tasks:all');
// Або при створенні/оновленні в Observer:
// Cache::forget("tasks:user:{$task->user_id}");

// 4. Cache tags (Redis)
Cache::tags(['tasks'])->remember('list', 60, fn () =>
    Task::all()
);
Cache::tags(['tasks'])->flush(); // очистити всі`

// === CodeBlock: N+1 problem explained ===
const nPlusOneCode = `<?php
// ❌ Проблема N+1 — «тихий вбивця продуктивності»

// Крок 1: 1 запит для списку задач
$tasks = Task::all();
// SQL: SELECT * FROM tasks  (1 запит)

// Крок 2: N запитів — по одному для КОЖНОЇ задачі!
foreach ($tasks as $task) {
    echo $task->category->name;
    // SQL: SELECT * FROM categories WHERE id = 1  (запит 2)
    // SQL: SELECT * FROM categories WHERE id = 2  (запит 3)
    // SQL: SELECT * FROM categories WHERE id = 1  (запит 4)
    // ...
    // SQL: SELECT * FROM categories WHERE id = 5  (запит 101)
}
// 100 задач = 101 запит! 😱

// ✅ Рішення: Eager Loading — with()
$tasks = Task::with('category')->get();
// SQL: SELECT * FROM tasks                              (запит 1)
// SQL: SELECT * FROM categories WHERE id IN (1,2,3,5)   (запит 2)
// 100 задач = 2 запити! 🚀

// Кілька relations:
$tasks = Task::with(['category', 'tags', 'user'])->get();
// 4 запити незалежно від кількості задач

// Вкладені relations:
$tasks = Task::with('category.parent')->get();
// Завантажує category і category.parent

// withCount — кількість без завантаження:
$tasks = Task::withCount('comments')->get();
// $task->comments_count = 12
// SQL: SELECT *, (SELECT COUNT(*) FROM comments ...) FROM tasks

// Дефолтний eager load у моделі:
class Task extends Model {
    protected \$with = ['category']; // завжди підвантажує
}`

// === CodeBlock: preventLazyLoading ===
const preventLazyCode = `<?php
// app/Providers/AppServiceProvider.php

use Illuminate\\Database\\Eloquent\\Model;

public function boot(): void
{
    // Тільки в dev — кидає LazyLoadingViolationException
    Model::preventLazyLoading(! $this->app->isProduction());

    // Ще корисні strict-mode прапорці:
    Model::preventSilentlyDiscardingAttributes(
        ! $this->app->isProduction()
    );
    // Кидає виключення при mass-assign невідомого поля

    // Або все разом:
    Model::shouldBeStrict(! $this->app->isProduction());
    // preventLazyLoading + preventSilentlyDiscardingAttributes
    // + preventAccessingMissingAttributes
}

// Тепер у dev:
$task = Task::first();
$task->category->name;
// 💥 LazyLoadingViolationException:
// "Attempted to lazy load [category] on model [Task]"

// Виправлення:
$task = Task::with('category')->first();
$task->category->name; // ✅ вже завантажено`

// === CodeBlock: Cache::remember ===
const cacheRememberCode = `<?php
use Illuminate\\Support\\Facades\\Cache;

// === Базовий Cache::remember ===
$stats = Cache::remember('dashboard:stats', 300, function () {
    // Цей код виконується ТІЛЬКИ якщо кешу немає
    // або TTL (300 секунд = 5 хвилин) минув
    return [
        'total'    => Task::count(),
        'overdue'  => Task::overdue()->count(),
        'done'     => Task::where('status', 'done')->count(),
        'avg_time' => Task::avg('completion_hours'),
    ];
});
// Перший виклик: 4 SQL → зберегти → повернути
// Наступні 5 хвилин: 0 SQL → повернути з кешу

// === Динамічні ключі ===
$userTasks = Cache::remember(
    "tasks:user:{$userId}:page:{$page}",
    60,
    fn () => Task::where('user_id', $userId)
        ->with('category')
        ->paginate(20, ['*'], 'page', $page)
);

// === Інвалідація ===
// В Observer або Controller після створення/оновлення:
Cache::forget("tasks:user:{$task->user_id}:page:1");

// Або з tags (потрібен Redis/Memcached):
Cache::tags(['tasks', "user:{$userId}"])->remember(
    "tasks:user:{$userId}", 60, fn () => Task::where(...)->get()
);
// Очистити всі кеші юзера:
Cache::tags(["user:{$userId}"])->flush();
// Очистити всі кеші задач:
Cache::tags(['tasks'])->flush();

// === Cache::rememberForever ===
$categories = Cache::rememberForever('categories:all', fn () =>
    Category::orderBy('name')->get()
);
// Живе вічно, поки не Cache::forget('categories:all')`

// === CodeBlock: query optimization ===
const queryOptCode = `<?php
// === select() — тільки потрібні поля ===
// ❌ SELECT * (тягне description, notes, content...)
$tasks = Task::all();

// ✅ Тільки потрібне (як GraphQL field selection)
$tasks = Task::select('id', 'title', 'status', 'deadline')
    ->with('category:id,name')  // relation теж select!
    ->get();

// === chunk() — пакетна обробка ===
// ❌ 1 мільйон записів в памʼять
$tasks = Task::all(); // 💥 Out of memory

// ✅ chunk — по 200 записів
Task::where('status', 'pending')
    ->chunk(200, function ($tasks) {
        foreach ($tasks as $task) {
            $task->sendReminder();
        }
    });
// SQL: SELECT ... LIMIT 200 OFFSET 0
// SQL: SELECT ... LIMIT 200 OFFSET 200
// SQL: SELECT ... LIMIT 200 OFFSET 400 ...

// === cursor() — стрімінг по одному (PHP Generator) ===
// Мінімум памʼяті, але тримає зʼєднання
foreach (Task::where('status', 'old')->cursor() as $task) {
    $task->archive(); // 1 запис в памʼяті
}
// SQL: 1 запит, результати стрімляться

// chunk vs cursor:
// chunk(200) → кілька SQL, кожен блок в памʼяті
// cursor()   → 1 SQL, стрім по одному, менше памʼяті
// Аналог: chunk = пагінація, cursor = virtual scroll

// === lazy() — гібрид (Laravel 8+) ===
Task::where('status', 'old')->lazy()->each(function ($task) {
    $task->archive();
});
// Як cursor, але з chunk-буфером під капотом`

// === CodeBlock: database indexes ===
const indexesCode = `<?php
// === Міграція: додати індекси ===

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Простий індекс — одна колонка
            $table->index('status');
            // SQL: CREATE INDEX tasks_status_index ON tasks (status)

            // Композитний індекс — кілька колонок
            $table->index(['user_id', 'status']);
            // Прискорює: WHERE user_id = ? AND status = ?
            // Також: WHERE user_id = ? (ліва частина)
            // НЕ прискорює: WHERE status = ? (права без лівої)

            // Унікальний індекс
            $table->unique(['user_id', 'slug']);

            // Індекс на deadline для ORDER BY / WHERE
            $table->index('deadline');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropUnique(['user_id', 'slug']);
            $table->dropIndex(['deadline']);
        });
    }
};

// Які колонки індексувати?
// ✅ WHERE:    status, user_id, category_id
// ✅ ORDER BY: created_at, deadline
// ✅ JOIN:     foreign keys (Laravel додає автоматично)
// ❌ TEXT:     description, notes (великий розмір)
// ❌ Рідко фільтровані колонки`

// === CodeBlock: debugging queries ===
const debugCode = `<?php
// === DB::listen — логування запитів ===

use Illuminate\\Support\\Facades\\DB;

// В AppServiceProvider::boot() або тесті:
DB::listen(function ($query) {
    dump([
        'sql'      => $query->sql,
        'bindings' => $query->bindings,
        'time_ms'  => $query->time,
    ]);
});

// === Debugbar (barryvdh/laravel-debugbar) ===
// composer require barryvdh/laravel-debugbar --dev
// Показує: кількість SQL, час, дублікати, N+1

// === toSql() / toRawSql() — подивитись SQL ===
$query = Task::where('status', 'pending')
    ->with('category')
    ->toSql();
// "select * from tasks where status = ?"

$raw = Task::where('status', 'pending')
    ->toRawSql();
// "select * from tasks where status = 'pending'"
// (з підставленими значеннями — тільки Laravel 10.15+)

// === Вимірювання часу ===
$start = microtime(true);
$tasks = Task::with('category')->get();
$time = round((microtime(true) - $start) * 1000, 2);
dump("Query took {$time}ms");

// === Query log ===
DB::enableQueryLog();
$tasks = Task::with(['category', 'tags'])->get();
$log = DB::getQueryLog();
dump(count($log) . ' queries executed');
dump($log);
// [
//   ['query' => 'select * from tasks', 'time' => 1.2],
//   ['query' => 'select * from categories...', 'time' => 0.8],
//   ['query' => 'select * from tags...', 'time' => 0.5],
// ]`

// === Practice code ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо проблему N+1 та eager loading на чистому PHP.
// Показуємо різницю в кількості «запитів» до БД.

// === Fake Database ===
class FakeDB {
    private int $queryCount = 0;
    private array $log = [];

    // Таблиці
    private array $tasks = [
        1 => ['id' => 1, 'title' => 'Buy groceries',   'category_id' => 1, 'user_id' => 1, 'status' => 'pending'],
        2 => ['id' => 2, 'title' => 'Write report',     'category_id' => 2, 'user_id' => 1, 'status' => 'done'],
        3 => ['id' => 3, 'title' => 'Fix bug #42',      'category_id' => 3, 'user_id' => 2, 'status' => 'pending'],
        4 => ['id' => 4, 'title' => 'Deploy v2.0',      'category_id' => 3, 'user_id' => 1, 'status' => 'in_progress'],
        5 => ['id' => 5, 'title' => 'Design mockup',    'category_id' => 4, 'user_id' => 2, 'status' => 'pending'],
        6 => ['id' => 6, 'title' => 'Code review',      'category_id' => 3, 'user_id' => 1, 'status' => 'done'],
        7 => ['id' => 7, 'title' => 'Update docs',      'category_id' => 2, 'user_id' => 2, 'status' => 'pending'],
        8 => ['id' => 8, 'title' => 'Refactor auth',    'category_id' => 3, 'user_id' => 1, 'status' => 'in_progress'],
    ];

    private array $categories = [
        1 => ['id' => 1, 'name' => 'Shopping'],
        2 => ['id' => 2, 'name' => 'Work'],
        3 => ['id' => 3, 'name' => 'Dev'],
        4 => ['id' => 4, 'name' => 'Design'],
    ];

    public function query(string $sql): array {
        $this->queryCount++;
        $this->log[] = $sql;
        return []; // placeholder
    }

    // SELECT * FROM tasks
    public function getAllTasks(): array {
        $this->query('SELECT * FROM tasks');
        return $this->tasks;
    }

    // SELECT * FROM categories WHERE id = ? (lazy loading — 1 запит!)
    public function getCategoryById(int $id): ?array {
        $this->query("SELECT * FROM categories WHERE id = {$id}");
        return $this->categories[$id] ?? null;
    }

    // SELECT * FROM categories WHERE id IN (...) (eager loading — 1 запит!)
    public function getCategoriesByIds(array $ids): array {
        $idList = implode(',', array_unique($ids));
        $this->query("SELECT * FROM categories WHERE id IN ({$idList})");
        $result = [];
        foreach ($ids as $id) {
            if (isset($this->categories[$id])) {
                $result[$id] = $this->categories[$id];
            }
        }
        return $result;
    }

    public function getQueryCount(): int { return $this->queryCount; }
    public function getLog(): array { return $this->log; }
    public function resetLog(): void { $this->queryCount = 0; $this->log = []; }
}

// === Демонстрація N+1 ===
echo "=== N+1 Problem (Lazy Loading) ===\\n\\n";

$db = new FakeDB();
$tasks = $db->getAllTasks(); // Запит 1

echo "Задачі з категоріями (lazy — по одному запиту):\\n";
foreach ($tasks as $task) {
    $category = $db->getCategoryById($task['category_id']); // +1 запит кожен раз!
    echo "  [{$task['status']}] {$task['title']} — {$category['name']}\\n";
}

echo "\\n  Всього запитів: {$db->getQueryCount()}\\n";
echo "  (1 для tasks + " . (count($tasks)) . " для categories = " . (1 + count($tasks)) . ")\\n";
echo "\\n  SQL log:\\n";
foreach ($db->getLog() as $i => $sql) {
    echo "    " . ($i + 1) . ". {$sql}\\n";
}

// === Eager Loading ===
echo "\\n\\n=== Eager Loading — with('category') ===\\n\\n";

$db->resetLog();
$tasks = $db->getAllTasks(); // Запит 1

// Збираємо всі category_id і робимо 1 запит
$categoryIds = array_column($tasks, 'category_id');
$categories = $db->getCategoriesByIds($categoryIds); // Запит 2

echo "Задачі з категоріями (eager — 2 запити):\\n";
foreach ($tasks as $task) {
    $catName = $categories[$task['category_id']]['name'] ?? 'Unknown';
    echo "  [{$task['status']}] {$task['title']} — {$catName}\\n";
}

echo "\\n  Всього запитів: {$db->getQueryCount()}\\n";
echo "  (1 для tasks + 1 для categories = 2)\\n";
echo "\\n  SQL log:\\n";
foreach ($db->getLog() as $i => $sql) {
    echo "    " . ($i + 1) . ". {$sql}\\n";
}

// === Cache::remember simulation ===
echo "\\n\\n=== Cache::remember Simulation ===\\n\\n";

class SimpleCache {
    private array $store = [];
    private array $ttls = [];

    public function remember(string $key, int $ttl, callable $fn): mixed {
        $now = time();
        if (isset($this->store[$key]) && $this->ttls[$key] > $now) {
            echo "  CACHE HIT: {$key}\\n";
            return $this->store[$key];
        }
        echo "  CACHE MISS: {$key} — executing closure...\\n";
        $value = $fn();
        $this->store[$key] = $value;
        $this->ttls[$key] = $now + $ttl;
        return $value;
    }

    public function forget(string $key): void {
        unset($this->store[$key], $this->ttls[$key]);
        echo "  CACHE FORGET: {$key}\\n";
    }
}

$cache = new SimpleCache();

// Перший виклик — MISS
$result1 = $cache->remember('stats', 300, function () {
    return ['total' => 8, 'done' => 2, 'pending' => 4];
});
echo "  Result: " . json_encode($result1) . "\\n\\n";

// Другий виклик — HIT
$result2 = $cache->remember('stats', 300, function () {
    return ['total' => 999]; // НЕ виконається!
});
echo "  Result: " . json_encode($result2) . "\\n\\n";

// Інвалідація
$cache->forget('stats');

// Третій виклик — MISS (кеш очищений)
$result3 = $cache->remember('stats', 300, function () {
    return ['total' => 10, 'done' => 3, 'pending' => 5];
});
echo "  Result: " . json_encode($result3) . "\\n";

echo "\\n=== Порівняння ===\\n";
echo "  N+1 (lazy):    " . (1 + 8) . " запитів\\n";
echo "  Eager loading: 2 запити\\n";
echo "  З кешем:       0 запитів (після першого виклику)\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте Cache + EagerLoader.
 *
 * 1) class SimpleCache
 *    - remember(string $key, int $ttl, callable $fn): mixed
 *      → якщо ключ є в кеші І НЕ expired → повернути кеш (НЕ викликати $fn)
 *      → якщо немає або expired → викликати $fn(), зберегти з TTL, повернути
 *    - forget(string $key): void — видалити з кешу
 *    - has(string $key): bool — чи є валідний (не expired) ключ
 *
 * 2) class EagerLoader
 *    - constructor: приймає масив "таблиці" — ['categories' => [1 => [...], 2 => [...]]]
 *    - loadRelation(array $items, string $foreignKey, string $table): array
 *      → збирає всі foreignKey значення з $items
 *      → робить ОДИН "запит" (бере з таблиці)
 *      → повертає $items з доданим полем $table (однина) = знайдений запис
 *      → наприклад: $task['category'] = ['id' => 1, 'name' => 'Shopping']
 *    - getQueryCount(): int — кількість "запитів" (кожен loadRelation = 1)
 *
 * Підказка для EagerLoader::loadRelation:
 *   - foreignKey = 'category_id', table = 'categories'
 *   - relation name = rtrim($table, 's') → 'category'
 */

class SimpleCache {
    // Ваш код тут
}

class EagerLoader {
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 10;

function check(string $name, bool $ok): void {
    global $pass;
    if ($ok) { $pass++; echo "  ✓ {$name}\\n"; }
    else     { echo "  ✗ {$name}\\n"; }
}

// --- SimpleCache ---
$cache = new SimpleCache();

// 1. remember — перший виклик = closure
$calls = 0;
$val = $cache->remember('k1', 300, function () use (&$calls) { $calls++; return 42; });
check('Cache: remember returns closure result', $val === 42 && $calls === 1);

// 2. remember — другий виклик = кеш (closure НЕ виконується)
$val2 = $cache->remember('k1', 300, function () use (&$calls) { $calls++; return 999; });
check('Cache: remember returns cached (no closure)', $val2 === 42 && $calls === 1);

// 3. has — true для існуючого
check('Cache: has() returns true', $cache->has('k1') === true);

// 4. has — false для неіснуючого
check('Cache: has() returns false for missing', $cache->has('nope') === false);

// 5. forget — видаляє
$cache->forget('k1');
check('Cache: forget removes key', $cache->has('k1') === false);

// 6. remember після forget — знову closure
$val3 = $cache->remember('k1', 300, function () use (&$calls) { $calls++; return 100; });
check('Cache: remember after forget runs closure', $val3 === 100 && $calls === 2);

// 7. expired TTL — використовуємо TTL = 0 (миттєво expired)
$cache2 = new SimpleCache();
$cache2->remember('exp', 0, fn () => 'old');
sleep(1);
$fresh = $cache2->remember('exp', 300, fn () => 'new');
check('Cache: expired TTL runs closure again', $fresh === 'new');

// --- EagerLoader ---
$tables = [
    'categories' => [
        1 => ['id' => 1, 'name' => 'Shopping'],
        2 => ['id' => 2, 'name' => 'Work'],
        3 => ['id' => 3, 'name' => 'Dev'],
    ],
];
$loader = new EagerLoader($tables);

$tasks = [
    ['id' => 1, 'title' => 'Buy milk',   'category_id' => 1],
    ['id' => 2, 'title' => 'Write code',  'category_id' => 3],
    ['id' => 3, 'title' => 'Send report', 'category_id' => 2],
];

// 8. loadRelation — додає category
$result = $loader->loadRelation($tasks, 'category_id', 'categories');
check(
    'EagerLoader: adds category to each item',
    $result[0]['category']['name'] === 'Shopping'
    && $result[1]['category']['name'] === 'Dev'
    && $result[2]['category']['name'] === 'Work'
);

// 9. loadRelation — query count = 1 (один "запит")
check('EagerLoader: 1 query for all relations', $loader->getQueryCount() === 1);

// 10. loadRelation — ще один виклик = 2 запити
$loader->loadRelation($tasks, 'category_id', 'categories');
check('EagerLoader: 2 queries after second call', $loader->getQueryCount() === 2);

echo "\\nРезультат: {$pass}/{$total}\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="useMemo / computed кешування" to="Cache::remember() / Eager Loading" />

      <TheoryBlock title="Проблема N+1 — тихий вбивця продуктивності">
        <p>
          У Vue уявіть: <code>v-for</code> по списку задач, де кожен елемент робить окремий
          <code>fetch('/api/categories/' + task.categoryId)</code>. 100 задач = 100 HTTP-запитів
          замість одного <code>fetch('/api/tasks?include=category')</code>. В Eloquent це
          відбувається непомітно: <code>$task->category</code> автоматично робить SQL-запит. Це і є
          N+1: 1 запит для списку + N окремих для кожного звʼязку.
        </p>
      </TheoryBlock>

      <CodeBlock :code="nPlusOneCode" lang="php" title="N+1 проблема та Eager Loading — with()" />

      <CodeComparison
        :js="jsCache"
        :php="phpCache"
        js-title="Vue / TanStack Query — кешування"
        php-title="Laravel — Cache::remember + Eager Loading"
      />

      <TheoryBlock title="preventLazyLoading() — strict mode для Eloquent">
        <p>
          Як <code>strict mode</code> у Vue / TypeScript ловить помилки під час розробки, так
          <code>Model::preventLazyLoading()</code> кидає виключення при спробі lazy load у dev.
          Вмикається один раз в <code>AppServiceProvider::boot()</code> — і кожна забута
          <code>with()</code> стане помітною одразу, а не на проді з 10 000 записів.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="preventLazyCode"
        lang="php"
        title="preventLazyLoading — захист від N+1 у dev"
      />

      <TheoryBlock title="Cache::remember — серверний кеш з TTL">
        <p>
          <code>Cache::remember('key', $ttl, fn)</code> — аналог
          <code>queryClient.fetchQuery()</code> з <code>staleTime</code>: якщо кеш валідний —
          повертає миттєво (0 SQL); якщо ні — виконує closure, зберігає результат і повертає.
          Інвалідація через <code>Cache::forget('key')</code> — як
          <code>queryClient.invalidateQueries()</code>. З Redis можна використовувати tags для
          групового очищення.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="cacheRememberCode"
        lang="php"
        title="Cache::remember — TTL, ключі, інвалідація, tags"
      />

      <TheoryBlock title="Оптимізація запитів: select(), chunk(), cursor()">
        <p>
          <code>select('id', 'title')</code> — аналог GraphQL field selection: тягнемо тільки
          потрібні поля. <code>chunk(200)</code> — пагінація для обробки великих таблиць (по 200
          записів). <code>cursor()</code> — як virtual scroll: стрімить по одному запису через PHP
          Generator, мінімум памʼяті. <code>lazy()</code> — гібрид обох підходів.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="queryOptCode"
        lang="php"
        title="select(), chunk(), cursor() — оптимізація памʼяті"
      />

      <TheoryBlock title="Індекси БД — зміст книги замість перечитування">
        <p>
          Без індексу БД сканує ВСЮ таблицю (full table scan) — як шукати слово, перечитуючи книгу з
          першої сторінки. Індекс — це зміст: БД миттєво знаходить потрібні рядки. Індексувати
          колонки в WHERE, ORDER BY, JOIN. Композитний індекс
          <code>['user_id', 'status']</code> працює для обох разом і для лівої частини окремо.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="indexesCode"
        lang="php"
        title="Індекси — міграція, простий, композитний, унікальний"
      />

      <TheoryBlock title="DB::listen / Debugbar — дебаг запитів">
        <p>
          <code>DB::listen()</code> — логує кожен SQL-запит з часом виконання.
          <code>toSql()</code> / <code>toRawSql()</code> — побачити SQL без виконання.
          <code>Debugbar</code> — візуальна панель з кількістю запитів, дублікатами і N+1. Завжди
          перевіряйте кількість запитів перед деплоєм — різниця між 2 і 102 запитами невидима в
          коді, але критична в продакшені.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="debugCode"
        lang="php"
        title="DB::listen, toSql, Debugbar — дебаг продуктивності"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: N+1 vs Eager Loading + Cache::remember">
        <p>
          У playground ми симулюємо <strong>FakeDB</strong> з таблицями tasks і categories. Спочатку
          показуємо N+1 (lazy loading — окремий запит на кожну категорію), потім eager loading
          (збираємо всі ID, робимо 1 запит). Далі симулюємо <code>Cache::remember</code> — перший
          виклик = MISS (виконує closure), другий = HIT (повертає кеш), після
          <code>forget()</code> — знову MISS.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/21-performance.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="4-21" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте SimpleCache + EagerLoader">
        <p>
          Реалізуйте 2 класи: <code>SimpleCache</code> з методами
          <code>remember(key, ttl, fn)</code>, <code>forget(key)</code>, <code>has(key)</code>; та
          <code>EagerLoader</code> з <code>loadRelation(items, foreignKey, table)</code> і
          <code>getQueryCount()</code>. Натисніть <strong>&laquo;Запустити&raquo;</strong> &mdash;
          10 тестів перевірять кешування з TTL, інвалідацію, expire, eager loading relations та
          підрахунок запитів.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте Cache + EagerLoader"
        :test-code="taskTestCode"
      />
    </div>
  </div>
</template>

<style scoped>
.lesson-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
