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
    question: 'Як правильно назвати метод scope у Laravel-моделі для фільтрації за статусом?',
    options: ['filterByStatus()', 'scopeByStatus()', 'getByStatus()', 'whereStatus()'],
    correct: 1,
    explanation:
      "Метод scope починається з префіксу scope у визначенні, але викликається без нього. Тобто scopeByStatus() → Task::byStatus('pending'). Це конвенція Laravel для local query scopes.",
  },
  {
    question: 'Що робить метод when() в Eloquent?',
    options: [
      'Виконує запит тільки якщо є авторизований користувач',
      'Додає умову до запиту лише якщо перший аргумент truthy (не null, не порожній рядок)',
      'Створює транзакцію бази даних',
      'Очікує виконання попереднього запиту',
    ],
    correct: 1,
    explanation:
      'when($value, $callback) додає умову тільки якщо $value є truthy. Якщо $status = null — умова ігнорується, запит повертає всі записи. Це замінює купу if/else і робить код чистим ланцюжком.',
  },
  {
    question: 'Навіщо потрібен whitelist (білий список) при сортуванні?',
    options: [
      'Для кешування результатів сортування',
      "Щоб вибрати тільки дозволені поля та захистити від SQL-ін'єкцій і витоку даних",
      'Для прискорення запитів через індекси',
      'Для логування всіх запитів сортування',
    ],
    correct: 1,
    explanation:
      "Без whitelist зловмисник може передати ?sort=password або SQL-ін'єкцію. Whitelist — це масив дозволених полів, і тільки вони приймаються для сортування. Якщо поле не в списку — використовується значення за замовчуванням (created_at).",
  },
  {
    question: 'Яка різниця між paginate() та simplePaginate()?',
    options: [
      'paginate() — для малих таблиць, simplePaginate() — для великих',
      'paginate() повертає total та last_page (виконує COUNT(*)), simplePaginate() — тільки prev/next без COUNT(*)',
      'simplePaginate() повертає JSON, paginate() — HTML',
      'Різниці немає, це синоніми',
    ],
    correct: 1,
    explanation:
      'paginate() виконує два SQL-запити: основний і COUNT(*) для підрахунку загальної кількості. simplePaginate() виконує тільки основний запит — він швидший, але не знає total та last_page. Вибирайте залежно від потреб фронтенду.',
  },
  {
    question: 'Як правильно написати LIKE-пошук у кількох полях, щоб не зламати інші фільтри?',
    options: [
      "where('title', 'like', ...).orWhere('description', 'like', ...)",
      "where(function($q) { $q->where('title', 'like', ...)->orWhere('description', 'like', ...) })",
      "whereIn(['title', 'description'], ['%search%'])",
      "search('title|description', 'value')",
    ],
    correct: 1,
    explanation:
      "orWhere без обгортки ламає логіку: WHERE status = 'pending' AND title LIKE... OR description LIKE... читається як два різних фільтри. Обгортка where(function($q){...}) створює дужки в SQL: AND (title LIKE... OR description LIKE...) — тільки так OR застосовується тільки до пошуку.",
  },
]

// === CodeComparison: JS filter/sort vs Laravel scopes ===
const jsFilterSort = `// JavaScript — фільтрація в пам'яті
const tasks = ref([]);

// Фільтр за статусом
const pending = tasks.value
  .filter(t => t.status === 'pending');

// Пошук
const found = tasks.value.filter(t =>
  t.title.includes(search) ||
  t.description?.includes(search)
);

// Сортування
const sorted = tasks.value
  .slice()
  .sort((a, b) =>
    new Date(a.deadline) - new Date(b.deadline)
  );

// Комбінація (ланцюжок)
const result = tasks.value
  .filter(t => t.status === 'pending')
  .filter(t => t.title.includes(search))
  .sort((a, b) =>
    new Date(a.deadline) - new Date(b.deadline)
  );`

const laravelScopeChain = `// Laravel — фільтрація в SQL (в базі даних)
// ✅ Перевага: не вантажимо всі дані в пам'ять

// Scope в моделі Task:
// scopeByStatus(), scopeSearch()

// Фільтр за статусом
$pending = Task::byStatus('pending')->get();

// Пошук (scope з LIKE)
$found = Task::search('meeting')->get();

// Сортування
$sorted = Task::orderBy('deadline', 'asc')
  ->get();

// Комбінація (ланцюжок scopes)
$result = Task::query()
  ->byStatus('pending')
  ->search($search)
  ->orderBy('deadline', 'asc')
  ->paginate(15);`

// === CodeBlock: scopes definition ===
const scopesCode = `<?php

// app/Models/Task.php

use Illuminate\\Database\\Eloquent\\Builder;

class Task extends Model
{
    /**
     * Прострочені задачі — дедлайн минув, не завершені.
     * Виклик: Task::overdue()->get()
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query
            ->where('status', '!=', 'completed')
            ->whereNotNull('deadline')
            ->where('deadline', '<', now());
    }

    /**
     * Фільтр за статусом.
     * Виклик: Task::byStatus('pending')->get()
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Пошук за назвою та описом.
     * Виклик: Task::search('meeting')->get()
     *
     * ⚠️ Обгортка where(function...) створює дужки в SQL:
     * AND (title LIKE '%x%' OR description LIKE '%x%')
     * Без дужок OR зламає інші фільтри!
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }
}`

// === CodeBlock: when() conditional filtering ===
const whenCode = `<?php

// ❌ Без when() — багато if/else, незручно
$query = Task::query();

if ($request->status) {
    $query->where('status', $request->status);
}
if ($request->priority) {
    $query->where('priority', $request->priority);
}
if ($request->search) {
    $query->where('title', 'like', "%{$request->search}%");
}

$tasks = $query->paginate(15);

// ✅ З when() — чистий ланцюжок, читабельно
// when($value, $callback) — додає умову лише якщо $value truthy
$tasks = Task::query()
    ->when(
        $request->query('status'),
        fn ($q, $status) => $q->byStatus($status)
    )
    ->when(
        $request->query('priority'),
        fn ($q, $priority) => $q->byPriority($priority)
    )
    ->when(
        $request->query('search'),
        fn ($q, $search) => $q->search($search)
    )
    ->when(
        $request->boolean('overdue'),
        fn ($q) => $q->overdue()
    )
    ->paginate(15);`

// === CodeBlock: full index() controller ===
const fullIndexCode = `<?php

// app/Http/Controllers/Api/TaskController.php

use App\\Http\\Resources\\TaskResource;
use App\\Models\\Task;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\AnonymousResourceCollection;

class TaskController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        // 1. Whitelist — тільки дозволені поля для сортування
        $allowedSorts = ['title', 'deadline', 'priority', 'status', 'created_at'];

        $sortField = in_array($request->query('sort'), $allowedSorts)
            ? $request->query('sort')
            : 'created_at'; // за замовчуванням

        // 2. Напрямок сортування: тільки asc або desc
        $sortOrder = $request->query('order') === 'asc' ? 'asc' : 'desc';

        // 3. Кількість на сторінку: від 1 до 100, за замовчуванням 15
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

        // 4. Запит з when() + scopes
        $tasks = Task::query()
            ->when($request->query('status'),      fn ($q, $v) => $q->byStatus($v))
            ->when($request->query('category_id'), fn ($q, $v) => $q->byCategory((int) $v))
            ->when($request->query('priority'),    fn ($q, $v) => $q->byPriority($v))
            ->when($request->query('search'),      fn ($q, $v) => $q->search($v))
            ->when($request->boolean('overdue'),   fn ($q)     => $q->overdue())
            ->orderBy($sortField, $sortOrder)
            ->paginate($perPage);

        return TaskResource::collection($tasks);
    }
}

// API підтримує:
// GET /api/tasks?status=pending
// GET /api/tasks?priority=high&sort=deadline&order=asc
// GET /api/tasks?search=meeting
// GET /api/tasks?overdue=1
// GET /api/tasks?status=pending&sort=deadline&order=asc&per_page=5&page=2`

// === Practice: demonstration code ===
const practiceCode = `<?php
declare(strict_types=1);

// Демонстрація роботи фільтрів та пагінації

// Симулюємо масив "задач" як замінник бази даних
$allTasks = [
    ['id' => 1, 'title' => 'Buy groceries',      'status' => 'done',        'priority' => 'low',    'deadline' => '2024-01-10'],
    ['id' => 2, 'title' => 'Meeting preparation','status' => 'pending',     'priority' => 'high',   'deadline' => '2024-06-01'],
    ['id' => 3, 'title' => 'Write API docs',     'status' => 'pending',     'priority' => 'medium', 'deadline' => '2024-06-15'],
    ['id' => 4, 'title' => 'Setup Laravel',      'status' => 'in_progress', 'priority' => 'high',   'deadline' => '2024-05-30'],
    ['id' => 5, 'title' => 'Review meeting notes','status' => 'pending',    'priority' => 'low',    'deadline' => '2024-07-01'],
    ['id' => 6, 'title' => 'Deploy to server',   'status' => 'pending',     'priority' => 'high',   'deadline' => '2024-08-01'],
];

// === Симуляція byStatus() scope ===
function byStatus(array $tasks, string $status): array {
    return array_values(array_filter($tasks, fn($t) => $t['status'] === $status));
}

// === Симуляція search() scope (LIKE) ===
function scopeSearch(array $tasks, string $search): array {
    return array_values(array_filter($tasks, fn($t) =>
        str_contains(strtolower($t['title']), strtolower($search))
    ));
}

// === Симуляція whitelist сортування ===
function sortWithWhitelist(array $tasks, string $field, string $order): array {
    $allowed = ['title', 'deadline', 'priority', 'status'];
    $sortField = in_array($field, $allowed) ? $field : 'deadline';

    usort($tasks, fn($a, $b) =>
        $order === 'asc'
            ? strcmp($a[$sortField], $b[$sortField])
            : strcmp($b[$sortField], $a[$sortField])
    );
    return $tasks;
}

// === Симуляція paginate() ===
function paginate(array $tasks, int $page, int $perPage): array {
    $total = count($tasks);
    $lastPage = (int) ceil($total / $perPage);
    $offset = ($page - 1) * $perPage;
    $items = array_slice($tasks, $offset, $perPage);

    return [
        'data' => $items,
        'meta' => [
            'current_page' => $page,
            'per_page'     => $perPage,
            'total'        => $total,
            'last_page'    => $lastPage,
        ],
    ];
}

// === Тест 1: фільтрація за статусом ===
echo "=== byStatus('pending') ===\\n";
$pending = byStatus($allTasks, 'pending');
foreach ($pending as $t) {
    echo "  [{$t['priority']}] {$t['title']}\\n";
}

// === Тест 2: пошук ===
echo "\\n=== search('meeting') ===\\n";
$found = scopeSearch($allTasks, 'meeting');
foreach ($found as $t) {
    echo "  {$t['title']}\\n";
}

// === Тест 3: whitelist сортування ===
echo "\\n=== sort by title asc ===\\n";
$sorted = sortWithWhitelist($allTasks, 'title', 'asc');
foreach ($sorted as $t) {
    echo "  {$t['title']}\\n";
}

// === Тест 4: пагінація ===
echo "\\n=== paginate(page=1, per_page=3) ===\\n";
$result = paginate($allTasks, 1, 3);
foreach ($result['data'] as $t) {
    echo "  {$t['title']}\\n";
}
echo "Meta: page {$result['meta']['current_page']} / {$result['meta']['last_page']}, total = {$result['meta']['total']}\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте метод index() з фільтрацією, сортуванням та пагінацією.
 *
 * Симулюємо роботу TaskController::index().
 * Замість Eloquent використовуємо PHP-масиви та функції.
 */

$tasks = [
    ['id' => 1, 'title' => 'Buy groceries',       'status' => 'done',        'priority' => 'low',    'deadline' => '2024-01-10'],
    ['id' => 2, 'title' => 'Meeting preparation', 'status' => 'pending',     'priority' => 'high',   'deadline' => '2024-06-01'],
    ['id' => 3, 'title' => 'Write API docs',      'status' => 'pending',     'priority' => 'medium', 'deadline' => '2024-06-15'],
    ['id' => 4, 'title' => 'Setup Laravel',       'status' => 'in_progress', 'priority' => 'high',   'deadline' => '2024-05-30'],
    ['id' => 5, 'title' => 'Review meeting notes','status' => 'pending',     'priority' => 'low',    'deadline' => '2024-07-01'],
    ['id' => 6, 'title' => 'Deploy to server',    'status' => 'pending',     'priority' => 'high',   'deadline' => '2024-08-01'],
    ['id' => 7, 'title' => 'Fix login bug',       'status' => 'in_progress', 'priority' => 'high',   'deadline' => '2024-05-20'],
    ['id' => 8, 'title' => 'Update dependencies', 'status' => 'done',        'priority' => 'medium', 'deadline' => '2024-04-01'],
];

// Симульовані query-параметри (як $request->query(...) в Laravel)
$queryParams = [
    'status'   => 'pending', // фільтр за статусом
    'search'   => null,      // пошук за назвою (null = не застосовувати)
    'sort'     => 'deadline',// поле сортування
    'order'    => 'asc',     // напрямок
    'page'     => 1,
    'per_page' => 3,
];

/**
 * 1. filterByStatus(array $tasks, ?string $status): array
 *    Якщо $status не null — повертає тільки задачі з таким статусом.
 *    Якщо null — повертає всі задачі (аналог when() в Laravel).
 */
function filterByStatus(array $tasks, ?string $status): array {
    // Ваш код тут
}

/**
 * 2. filterBySearch(array $tasks, ?string $search): array
 *    Якщо $search не null — повертає задачі, де title містить $search (case-insensitive).
 *    Якщо null — повертає всі задачі.
 *    Підказка: str_contains(), strtolower()
 */
function filterBySearch(array $tasks, ?string $search): array {
    // Ваш код тут
}

/**
 * 3. sortWithWhitelist(array $tasks, string $field, string $order): array
 *    Whitelist: ['title', 'deadline', 'priority', 'status'].
 *    Якщо $field не в whitelist — сортуємо за 'deadline'.
 *    $order: 'asc' або 'desc'.
 *    Підказка: in_array(), usort(), strcmp()
 */
function sortWithWhitelist(array $tasks, string $field, string $order): array {
    // Ваш код тут
}

/**
 * 4. paginate(array $tasks, int $page, int $perPage): array
 *    Повертає ['data' => [...], 'meta' => [current_page, per_page, total, last_page]].
 *    Підказка: array_slice(), ceil()
 */
function paginate(array $tasks, int $page, int $perPage): array {
    // Ваш код тут
}

// === Застосовуємо всі функції по порядку (як Laravel index()) ===
$result = $tasks;
$result = filterByStatus($result, $queryParams['status']);
$result = filterBySearch($result, $queryParams['search']);
$result = sortWithWhitelist($result, $queryParams['sort'], $queryParams['order']);
$paginated = paginate($result, $queryParams['page'], $queryParams['per_page']);

// === Виведення ===
echo "=== Результат (pending, sort=deadline asc, page 1/3) ===\\n";
foreach ($paginated['data'] as $task) {
    echo "  [{$task['priority']}] {$task['title']} — {$task['deadline']}\\n";
}

$meta = $paginated['meta'];
echo "\\nMeta: сторінка {$meta['current_page']} / {$meta['last_page']}, всього {$meta['total']} задач\\n";`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass = 0;
$total = 4;

// Тест 1: filterByStatus
$r1 = filterByStatus($tasks, 'pending');
if (count($r1) === 5) {
    echo "✓ filterByStatus: знайдено 5 pending\\n";
    $pass++;
} else {
    echo "✗ filterByStatus: очікувалось 5, отримано " . count($r1) . "\\n";
}

// Тест 2: filterBySearch
$r2 = filterBySearch($tasks, 'meeting');
if (count($r2) === 2) {
    echo "✓ filterBySearch: знайдено 2 задачі з 'meeting'\\n";
    $pass++;
} else {
    echo "✗ filterBySearch: очікувалось 2, отримано " . count($r2) . "\\n";
}

// Тест 3: sortWithWhitelist — заборонене поле
$r3 = sortWithWhitelist($tasks, 'hacked_field', 'asc');
if ($r3[0]['deadline'] === '2024-01-10') {
    echo "✓ sortWithWhitelist: whitelist працює, сортування за deadline\\n";
    $pass++;
} else {
    echo "✗ sortWithWhitelist: whitelist не спрацював, перший дедлайн = {$r3[0]['deadline']}\\n";
}

// Тест 4: paginate
$r4 = paginate($tasks, 2, 3);
if ($r4['meta']['current_page'] === 2 && $r4['meta']['last_page'] === 3 && $r4['meta']['total'] === 8) {
    echo "✓ paginate: meta правильна\\n";
    $pass++;
} else {
    echo "✗ paginate: meta неправильна\\n";
    print_r($r4['meta']);
}

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="computed(() => tasks.filter(...))" to="scopeMethod()" />

      <TheoryBlock title="Проблема: контролер, що повертає все">
        <p>
          Зараз ваш <code>TaskController::index()</code> повертає <strong>всі</strong> задачі без
          фільтрації, сортування та пагінації. У реальному додатку це катастрофа: 10 000 записів у
          відповіді — це повільно і марно. Ваш Vue-фронтенд хоче:
        </p>
        <ul>
          <li><code>GET /api/tasks?status=pending</code> — тільки незавершені</li>
          <li><code>GET /api/tasks?search=meeting&amp;sort=deadline</code> — пошук + сортування</li>
          <li><code>GET /api/tasks?page=2&amp;per_page=15</code> — друга сторінка, 15 записів</li>
        </ul>
        <p>
          Рішення — <strong>Query Scopes</strong> у моделі та метод <code>when()</code> у
          контролері.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsFilterSort"
        :php="laravelScopeChain"
        js-title="JavaScript — filter/sort в пам'яті"
        php-title="Laravel — Scopes в SQL (ефективніше)"
      />

      <TheoryBlock title="Query Scopes — що це і навіщо">
        <p>
          Scope — це метод у моделі, який інкапсулює частину SQL-запиту. Назва методу починається з
          <code>scope</code>, але при виклику <code>scope</code> опускається:
          <code>scopeByStatus()</code> → <code>Task::byStatus('pending')</code>.
        </p>
        <p>
          Це схоже на <strong>reusable computed</strong> у Pinia: замість дублювання
          <code>.filter(t =&gt; t.status === status)</code> скрізь — визначаєте один раз і
          використовуєте де завгодно. Різниця в тому, що Vue scope фільтрує дані <em>в пам'яті</em>,
          а Laravel scope — <em>в базі даних</em> через WHERE-умову.
        </p>
        <p>
          Scopes можна <strong>ланцюжково комбінувати</strong> — кожен додає умову до того самого
          SQL-запиту:
          <code
            >Task::byStatus('pending')-&gt;byPriority('high')-&gt;orderBy('deadline')-&gt;paginate(15)</code
          >.
        </p>
      </TheoryBlock>

      <CodeBlock :code="scopesCode" lang="php" title="app/Models/Task.php — визначення scopes" />

      <TheoryBlock title="when() — умовна побудова запиту">
        <p>
          <code>when($value, $callback)</code> — ключовий метод для фільтрації за query-параметрами.
          Він виконує callback і додає умову до запиту <strong>тільки якщо</strong>
          <code>$value</code> є truthy (не <code>null</code>, не порожній рядок, не <code>0</code>).
        </p>
        <p>
          Це аналог умовної побудови URL на фронтенді:
          <code>if (filters.status) params.set('status', filters.status)</code>. Замість купи
          <code>if/else</code> — чистий читабельний ланцюжок.
        </p>
        <p>
          Стрілкова функція в <code>when()</code> отримує два аргументи: <code>$q</code> (Builder)
          та <code>$value</code> (саме значення, яке передано першим аргументом).
        </p>
      </TheoryBlock>

      <CodeBlock :code="whenCode" lang="php" title="when() — умовна фільтрація без if/else" />

      <TheoryBlock title="Пагінація: paginate vs simplePaginate vs cursorPaginate">
        <p>
          Laravel має три методи пагінації з різними компромісами між функціональністю та швидкістю:
        </p>
        <ul>
          <li>
            <strong>paginate(15)</strong> — стандартна пагінація. Виконує два запити: основний і
            <code>COUNT(*)</code>. Повертає <code>total</code>, <code>last_page</code>, посилання на
            всі сторінки. Ідеально для більшості API.
          </li>
          <li>
            <strong>simplePaginate(15)</strong> — тільки <code>prev</code> та <code>next</code>. Без
            <code>COUNT(*)</code> — швидше. Немає <code>total</code> та <code>last_page</code>.
            Підходить коли фронтенду не потрібна загальна кількість сторінок.
          </li>
          <li>
            <strong>cursorPaginate(15)</strong> — cursor-based пагінація для нескінченного скролу та
            дуже великих таблиць. Замість <code>?page=2</code> використовує
            <code>?cursor=eyJpZCI6MTV9</code> — закодований покажчик на останній елемент. Не
            пропускає записи — ефективно навіть для мільйонів рядків.
          </li>
        </ul>
        <p>
          Відповідь <code>paginate()</code> автоматично включає <code>data</code> (масив записів),
          <code>links</code> (first/last/prev/next) та <code>meta</code> (current_page, total тощо)
          — саме те, що очікує Vue-компонент з
          <code>axios.get('/api/tasks', { params: { page } })</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="fullIndexCode"
        lang="php"
        title="app/Http/Controllers/Api/TaskController.php — повний index()"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: симуляція фільтрів Laravel">
        <p>
          У цьому playground ми <strong>симулюємо</strong> роботу Laravel-контролера на чистому PHP
          без фреймворку. Це допомагає зрозуміти логіку <code>when()</code>, whitelist та
          <code>paginate()</code>
          без необхідності запускати сервер.
        </p>
        <p>
          Запустіть код та подивіться результат. Потім змініть <code>$queryParams</code> і
          спостерігайте, як фільтри впливають на результат.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/12-filtering.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="2-12" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте index() з фільтрацією, сортуванням та пагінацією">
        <p>
          Реалізуйте чотири функції, які разом утворюють логіку Laravel-контролера
          <code>index()</code> з фільтрацією, пошуком, сортуванням та пагінацією. Натисніть
          <strong>"Запустити"</strong> — автотести перевірять вашу реалізацію.
        </p>
        <ol>
          <li>
            <strong>filterByStatus(array $tasks, ?string $status): array</strong> — якщо
            <code>$status</code> не null — фільтрує масив. Інакше повертає всі задачі. Аналог
            <code>when($status, fn($q, $v) =&gt; $q-&gt;byStatus($v))</code>.
          </li>
          <li>
            <strong>filterBySearch(array $tasks, ?string $search): array</strong> — якщо
            <code>$search</code> не null — шукає в <code>title</code> (case-insensitive). Аналог
            <code>scopeSearch()</code> з LIKE.
          </li>
          <li>
            <strong>sortWithWhitelist(array $tasks, string $field, string $order): array</strong> —
            whitelist: <code>['title', 'deadline', 'priority', 'status']</code>. Якщо поле не в
            списку — сортувати за <code>'deadline'</code>. Підказка: <code>in_array()</code>,
            <code>usort()</code>, <code>strcmp()</code>.
          </li>
          <li>
            <strong>paginate(array $tasks, int $page, int $perPage): array</strong> — повертає
            <code
              >['data' =&gt; [...], 'meta' =&gt; [current_page, per_page, total, last_page]]</code
            >. Підказка: <code>array_slice()</code>, <code>ceil()</code>.
          </li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте функції фільтрації та пагінації"
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
