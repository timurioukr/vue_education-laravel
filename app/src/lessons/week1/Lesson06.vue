<script setup lang="ts">
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import type { QuizQuestion } from '@/types'

defineProps<{
  activeTab: string
}>()

const fetchComparisonJs = `// Vue -- отримати всі задачі через API
const { data: tasks } = await useFetch('/api/tasks')

// Або з $fetch
const tasks = await $fetch('/api/tasks')`

const fetchComparisonPhp = `// Laravel Eloquent -- отримати всі задачі з бази
$tasks = Task::all();

// Це виконає SQL: SELECT * FROM tasks`

const filterComparisonJs = `// JavaScript -- фільтрація масиву
const pending = tasks.filter(t => t.status === 'pending')

const urgent = tasks
  .filter(t => t.status === 'pending' && t.priority >= 2)
  .sort((a, b) => a.deadline - b.deadline)
  .slice(0, 5)`

const filterComparisonPhp = `// Eloquent -- фільтрація як SQL-запит
$pending = Task::where('status', 'pending')->get();

$urgent = Task::where('status', 'pending')
    ->where('priority', '>=', 2)
    ->orderBy('deadline', 'asc')
    ->limit(5)
    ->get();`

const taskModelCode = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\SoftDeletes;

class Task extends Model
{
    use SoftDeletes;

    // Whitelist полів для масового присвоєння
    // Це як defineProps -- явно вказуємо, що приймаємо
    protected $fillable = [
        'title',
        'description',
        'notes',
        'status',
        'priority',
        'deadline',
        'user_id',
        'category_id',
    ];

    // Автоматичне приведення типів
    // Як Zod .transform() або new Date()
    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'priority' => 'integer',
        ];
    }
}`

const crudCreateCode = `// CREATE -- створення записів
$task = Task::create([
    'title' => 'Learn Eloquent',
    'status' => 'pending',
    'priority' => 2,
    'user_id' => 1,
]);
// $task вже має id, created_at тощо

// Або покроково:
$task = new Task();
$task->title = 'Learn Eloquent';
$task->status = 'pending';
$task->user_id = 1;
$task->save();`

const crudReadCode = `// READ -- читання записів
$tasks = Task::all();                    // Всі задачі
$task = Task::find(1);                   // За ID (або null)
$task = Task::findOrFail(1);             // За ID (або 404)

$pending = Task::where('status', 'pending')->get();
$first = Task::where('status', 'pending')->first();
$count = Task::where('status', 'pending')->count();
$titles = Task::where('status', 'done')->pluck('title');`

const crudUpdateCode = `// UPDATE -- оновлення записів
$task = Task::findOrFail(1);
$task->update([
    'title' => 'Updated title',
    'status' => 'in_progress',
]);

// Або:
$task->title = 'Updated title';
$task->save();`

const crudDeleteCode = `// DELETE -- видалення записів
$task = Task::findOrFail(1);
$task->delete();           // Soft delete (ставить deleted_at)

$task->trashed();          // true -- в "кошику"
$task->restore();          // Відновити з кошика
$task->forceDelete();      // Фізично видалити назавжди

// Без SoftDeletes:
Task::destroy(1);          // Видалити за ID
Task::destroy([1, 2, 3]);  // Видалити кілька`

const fillableComparisonJs = `// Vue -- defineProps обмежує вхідні дані
defineProps<{
  title: string
  description?: string
  status: string
  priority: number
}>()
// Передані пропси, яких немає в defineProps, ігноруються`

const fillableComparisonPhp = `// Laravel -- $fillable обмежує масове присвоєння
protected $fillable = [
    'title',
    'description',
    'status',
    'priority',
    'deadline',
    'category_id',
];
// user_id НЕ в списку -- хакер не зможе підмінити`

const tinkerSessionLines = [
  '$ php artisan tinker',
  '>>> Task::count()',
  '=> 5',
  '',
  ">>> Task::where('status', 'pending')->count()",
  '=> 3',
  '',
  ">>> Task::create(['title' => 'Test task', 'user_id' => 1])",
  '=> App\\Models\\Task {id: 6, title: "Test task", status: "pending", ...}',
  '',
  '>>> $task = Task::find(6)',
  ">>> $task->update(['status' => 'done'])",
  '=> true',
  '',
  '>>> $task->delete()',
  '=> true',
  '',
  '>>> Task::withTrashed()->find(6)->trashed()',
  '=> true',
]

const controllerWithEloquent = `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Task;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\Response;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = Task::all();
        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        $task = Task::create([
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'status' => $request->input('status', 'pending'),
            'priority' => $request->input('priority', 0),
            'deadline' => $request->input('deadline'),
            'user_id' => 1, // Поки хардкодимо
            'category_id' => $request->input('category_id'),
        ]);
        return response()->json($task, 201);
    }

    public function show(string $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        return response()->json($task);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        $task->update($request->only([
            'title', 'description', 'status',
            'priority', 'deadline', 'category_id',
        ]));
        return response()->json($task);
    }

    public function destroy(string $id): Response
    {
        Task::findOrFail($id)->delete();
        return response()->noContent();
    }
}`

const categoryControllerTask = `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Category;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\Response;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::all();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $category = Category::create([
            'name' => $request->input('name'),
            'color' => $request->input('color', '#6B7280'),
            'user_id' => 1,
        ]);
        return response()->json($category, 201);
    }

    public function show(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->update($request->only(['name', 'color']));
        return response()->json($category);
    }

    public function destroy(string $id): Response
    {
        Category::findOrFail($id)->delete();
        return response()->noContent();
    }
}`

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Що таке $fillable в Eloquent-моделі?',
    options: [
      'Список полів, які будуть показані в JSON',
      'Список полів, які дозволено заповнювати через масове присвоєння (create/update)',
      "Список обов'язкових полів",
      'Список полів з default-значеннями',
    ],
    correct: 1,
    explanation:
      '$fillable -- це whitelist полів, які дозволено заповнювати через Task::create() або $task->update(). Це як defineProps у Vue -- ви явно вказуєте, які "пропси" приймає модель. Поля, яких немає в $fillable, ігноруються при масовому присвоєнні.',
  },
  {
    question: 'Що повертає Task::findOrFail(99), якщо задачі з id=99 не існує?',
    options: ['null', 'Порожній масив []', 'Виняток ModelNotFoundException (HTTP 404)', 'false'],
    correct: 2,
    explanation:
      'findOrFail() кидає виняток ModelNotFoundException, який Laravel автоматично перетворює в HTTP 404 відповідь. На відміну від find(), який просто повертає null.',
  },
  {
    question: 'Яка різниця між $task->delete() і $task->forceDelete() при SoftDeletes?',
    options: [
      'Ніякої різниці',
      'delete() ставить deleted_at, forceDelete() фізично видаляє з бази',
      'delete() видаляє з бази, forceDelete() ставить deleted_at',
      "forceDelete() видаляє разом зі зв'язаними записами",
    ],
    correct: 1,
    explanation:
      'При використанні SoftDeletes, delete() лише ставить мітку deleted_at (як кошик у macOS), а forceDelete() фізично видаляє запис з бази даних назавжди. Task::all() не покаже "м\'яко видалені" записи.',
  },
  {
    question: "Що робить $casts = ['deadline' => 'date']?",
    options: [
      'Забороняє значення NULL для deadline',
      "Автоматично конвертує deadline з рядка в об'єкт Carbon при читанні з бази",
      "Робить deadline обов'язковим полем",
      'Створює колонку deadline в базі даних',
    ],
    correct: 1,
    explanation:
      "$casts автоматично перетворює типи при читанні з бази та записі в базу. deadline => date конвертує рядок в об'єкт Carbon (потужна бібліотека для роботи з датами). Це як Zod .transform() -- автоматичне перетворення типів.",
  },
  {
    question: 'Чому user_id НЕ потрібно додавати в $fillable?',
    options: [
      'Laravel додає його автоматично',
      'user_id -- не поле таблиці',
      'Бо user_id не повинен прийматись від клієнта -- його встановлює серверна логіка',
      'Бо user_id -- це primary key',
    ],
    correct: 2,
    explanation:
      'user_id визначається на сервері (через автентифікацію), а не приймається від клієнта. Якщо додати user_id в $fillable, хакер зможе створити задачу від імені іншого користувача, підмінивши user_id у запиті.',
  },
]
</script>

<template>
  <!-- Theory Tab -->
  <div v-show="activeTab === 'theory'">
    <div class="lesson-content-blocks">
      <ParallelCard from="Pinia store + fetch() + TypeScript type" to="Eloquent Model" />

      <TheoryBlock title="Eloquent = ваш Pinia store, API client і type definition в одному">
        <p>
          <strong>Eloquent Model</strong> -- це найважливіша концепція Laravel. Одна модель замінює
          те, що у Vue розділено на кілька частин: Pinia store (стан + дії), fetch/useFetch (запити
          до даних) та TypeScript interface (опис структури).
        </p>
        <p>
          Замість HTTP-запитів до API ви працюєте з базою даних напряму через об'єкти.
          <code>Task::all()</code> -- це як <code>await useFetch('/api/tasks')</code>, тільки без
          HTTP -- напряму в базу даних.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="fetchComparisonJs"
        :php="fetchComparisonPhp"
        js-title="Vue / Nuxt fetch"
        php-title="Eloquent"
      />

      <CodeComparison
        :js="filterComparisonJs"
        :php="filterComparisonPhp"
        js-title="JavaScript .filter()"
        php-title="Eloquent ->where()->get()"
      />

      <TheoryBlock title="$fillable -- захист від масового присвоєння">
        <p>
          <code>$fillable</code> -- це whitelist полів, які дозволено заповнювати через
          <code>Task::create()</code> або <code>$task-&gt;update()</code>. Це як
          <code>defineProps</code> у Vue -- ви явно вказуєте, що приймаєте. Все інше ігнорується.
        </p>
        <p>
          <strong>Важливо:</strong> <code>user_id</code> НЕ в <code>$fillable</code>, бо його
          встановлює серверна логіка, а не клієнт. Інакше хакер зміг би підмінити user_id.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="fillableComparisonJs"
        :php="fillableComparisonPhp"
        js-title="Vue defineProps"
        php-title="Laravel $fillable"
      />

      <TheoryBlock title="$guarded — альтернатива $fillable">
        <p>
          Замість переліку <strong>дозволених</strong> полів (<code>$fillable</code>), можна
          перелічити <strong>заборонені</strong> (<code>$guarded</code>). Якщо
          <code>$guarded = []</code> — всі поля дозволені для масового заповнення. Зручно для
          прототипу, але небезпечно для продакшну.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`// JS: немає вбудованого захисту\nconst task = await db.insert('tasks', req.body);\n// будь-яке поле з body потрапить в БД!`"
        :php="`// Laravel: $fillable (whitelist)\nprotected \$fillable = ['title', 'status'];\n// Тільки title і status можна масово заповнити\n\n// Laravel: $guarded (blacklist)\nprotected \$guarded = ['id'];\n// Все можна, крім id`"
        js-title="JS (без захисту)"
        php-title="Laravel ($fillable vs $guarded)"
      />

      <TheoryBlock title="$casts та $hidden">
        <p>
          <code>$casts</code> автоматично конвертує типи при читанні/записі:
          <code>'deadline' =&gt; 'date'</code> перетворює рядок в об'єкт Carbon. Це як
          <code>new Date(task.deadline)</code> в JavaScript, тільки автоматично.
        </p>
        <p>
          <code>$hidden</code> приховує поля при серіалізації в JSON:
          <code>['password', 'remember_token']</code> -- ці поля не потраплять у відповідь API.
        </p>
      </TheoryBlock>

      <CodeBlock
        lang="php"
        :code="taskModelCode"
        title="app/Models/Task.php"
        :show-line-numbers="true"
      />

      <TheoryBlock title="CRUD-операції з Eloquent">
        <p>
          Eloquent надає повний набір CRUD-операцій. Кожна операція -- це один рядок коду замість
          написання SQL-запитів вручну.
        </p>
      </TheoryBlock>

      <CodeBlock lang="php" :code="crudCreateCode" title="CREATE -- створення" />
      <CodeBlock lang="php" :code="crudReadCode" title="READ -- читання" />
      <CodeBlock lang="php" :code="crudUpdateCode" title="UPDATE -- оновлення" />
      <CodeBlock lang="php" :code="crudDeleteCode" title="DELETE -- видалення" />
    </div>
  </div>

  <!-- Practice Tab -->
  <div v-show="activeTab === 'practice'">
    <div class="lesson-content-blocks">
      <TheoryBlock title="Tinker -- ваша DevTools Console для бекенду">
        <p>
          У браузері ви відкриваєте DevTools Console і тестуєте JavaScript вживу. В Laravel є
          <code>php artisan tinker</code> -- інтерактивна PHP-консоль, де можна виконувати
          Eloquent-запити в реальному часі.
        </p>
      </TheoryBlock>

      <TerminalOutput :lines="tinkerSessionLines" title="php artisan tinker" />

      <TheoryBlock title="Оновлення контролера з Eloquent">
        <p>
          Тепер замінимо хардкожені дані в <code>TaskController</code> на реальні Eloquent-запити.
          Кожен метод контролера стає простим і зрозумілим: <code>Task::all()</code>,
          <code>Task::create([...])</code>, <code>Task::findOrFail($id)</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        lang="php"
        :code="controllerWithEloquent"
        title="TaskController з Eloquent"
        :show-line-numbers="true"
      />

      <TheoryBlock title="Тестування API">
        <p>
          Запустіть <code>php artisan serve</code> і протестуйте ендпоінти через curl. Тепер дані
          зберігаються в реальній базі -- кожен POST створює новий запис, DELETE ставить
          <code>deleted_at</code> (soft delete), GET повертає реальні дані.
        </p>
      </TheoryBlock>
    </div>
  </div>

  <!-- Quiz Tab -->
  <div v-show="activeTab === 'quiz'">
    <Quiz :questions="quizQuestions" lesson-id="week1-lesson06" />
  </div>

  <!-- Task Tab -->
  <div v-show="activeTab === 'task'">
    <div class="lesson-content-blocks">
      <TheoryBlock title="Завдання: Повний CRUD для CategoryController з Eloquent">
        <p>
          Оновіть <code>CategoryController</code> -- замініть хардкожені дані на Eloquent-запити.
          Використовуйте ті ж патерни, що й у <code>TaskController</code>.
        </p>
        <ol>
          <li>
            Замініть хардкожені масиви на <code>Category::all()</code>,
            <code>Category::create()</code> тощо
          </li>
          <li>Використайте <code>findOrFail()</code> для автоматичного 404</li>
          <li>В <code>store()</code> поверніть статус 201</li>
          <li>В <code>destroy()</code> поверніть <code>response()-&gt;noContent()</code> (204)</li>
          <li>Протестуйте всі ендпоінти через curl або Postman</li>
          <li>Перевірте в Tinker, що записи реально створюються та видаляються</li>
        </ol>
      </TheoryBlock>

      <CodeBlock
        lang="php"
        :code="categoryControllerTask"
        title="CategoryController -- приклад рішення"
        :show-line-numbers="true"
      />
    </div>
  </div>
</template>

<style scoped>
.lesson-content-blocks {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
