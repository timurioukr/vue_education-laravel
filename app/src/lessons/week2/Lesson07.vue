<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import CodePlayground from '@/components/interactive/CodePlayground.vue'
import InteractiveDiagram from '@/components/interactive/InteractiveDiagram.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion, DiagramStep } from '@/types'

defineProps<{
  activeTab: string
}>()

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Який метод використовується для зв\'язку "задача належить категорії"?',
    options: ['hasMany', 'belongsTo', 'hasOne', 'belongsToMany'],
    correct: 1,
    explanation:
      'belongsTo використовується коли поточна модель "належить" іншій — тобто у поточній таблиці є зовнішній ключ. Task belongsTo Category, бо category_id знаходиться в таблиці tasks.',
  },
  {
    question: 'Де зберігається зовнішній ключ у відношенні belongsToMany (many-to-many)?',
    options: [
      'В таблиці tasks',
      'В таблиці tags',
      'В pivot-таблиці (наприклад, tag_task)',
      'В обох основних таблицях',
    ],
    correct: 2,
    explanation:
      "Для зв'язку many-to-many зовнішні ключі зберігаються в окремій pivot-таблиці. Наприклад, tag_task містить task_id і tag_id. Це дозволяє задачі мати кілька тегів і тегу належати кільком задачам.",
  },
  {
    question: "Що робить Task::with('category')->get()?",
    options: [
      'Створює нову категорію для задачі',
      'Завантажує задачі та їх категорії за 2 SQL-запити замість N+1',
      'Фільтрує задачі за категорією',
      'Видаляє категорію із задачі',
    ],
    correct: 1,
    explanation:
      'with() робить eager loading: один запит для tasks, один для categories WHERE id IN (...). Без with() кожна ітерація по задачах генерувала б окремий SQL-запит для категорії — це і є проблема N+1.',
  },
  {
    question: "Яка різниця між attach() та sync() для many-to-many зв'язків?",
    options: [
      'Ніякої різниці, обидва методи роблять одне й те саме',
      "attach() додає зв'язки не видаляючи існуючі, sync() встановлює ТОЧНИЙ набір (видаляє зайві)",
      "sync() додає зв'язки, attach() встановлює точний набір",
      'attach() для belongsTo, sync() для hasMany',
    ],
    correct: 1,
    explanation:
      "attach([1, 2]) додає теги 1 і 2 до існуючих. sync([1, 2]) видаляє всі інші зв'язки і залишає тільки 1 і 2. sync() — це як v-model на чекбоксах: повністю замінює набір вибраних елементів.",
  },
  {
    question: 'Як отримати категорії, в яких є хоча б одна задача?',
    options: [
      "Category::with('tasks')->get()",
      "Category::has('tasks')->get()",
      "Category::whereHas('tasks')->get()",
      'Як b), так і c) — обидва варіанти правильні',
    ],
    correct: 3,
    explanation:
      "has('tasks') перевіряє наявність пов'язаних записів. whereHas('tasks') без колбека робить те саме. Різниця в тому, що whereHas() дозволяє додати умову на пов'язані записи: whereHas('tasks', fn($q) => $q->where('status', 'pending')).",
  },
]

// === Relationship method examples ===
const taskModelCode = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany;

class Task extends Model
{
    protected $fillable = [
        'title', 'description', 'status',
        'priority', 'deadline',
        'user_id', 'category_id',
    ];

    /**
     * Задача належить користувачу.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Задача належить категорії.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Задача має багато тегів (many-to-many).
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }
}`

// === N+1 problem ===
const n1ProblemCode = `// ПОГАНО: N+1 проблема — 1 + N SQL-запитів!
$tasks = Task::all(); // 1 запит: SELECT * FROM tasks

foreach ($tasks as $task) {
    // Окремий запит для кожної задачі!
    echo $task->category->name;
    // SELECT * FROM categories WHERE id = 1
    // SELECT * FROM categories WHERE id = 2
    // ... (якщо задач 100 — 100 запитів!)
}`

const eagerLoadingCode = `// ДОБРЕ: Eager loading — всього 2 SQL-запити
$tasks = Task::with('category')->get();
// Запит 1: SELECT * FROM tasks
// Запит 2: SELECT * FROM categories WHERE id IN (1, 2, 3, ...)

foreach ($tasks as $task) {
    echo $task->category->name; // Без додаткових запитів!
}

// Кілька зв'язків одночасно:
$tasks = Task::with(['category', 'tags', 'user'])->get();`

// === JS vs PHP query for related data ===
const jsManualQueryCode = `// JS: вручну знаходимо по ID
const categories = { 1: { name: 'Work' }, 2: { name: 'Personal' } }
const tasks = [
  { id: 1, title: 'Fix bug', categoryId: 1 },
]

// Щоб отримати категорію задачі:
const category = categories[task.categoryId]
// Треба вручну шукати у нормалізованому стейті`

const phpRelationshipCode = `// Laravel: просто звертаємось до зв'язку
$task = Task::with('category')->find(1);

// Eloquent зробить все сам!
echo $task->category->name; // "Work"
echo $task->category->color; // "#ef4444"

// Всі теги задачі:
$task->tags->pluck('name'); // ["urgent", "frontend"]`

// === ER Diagram ===
const erDiagram = `erDiagram
    users {
        id int PK
        name string
        email string
    }
    categories {
        id int PK
        name string
        color string
        user_id int FK
    }
    tasks {
        id int PK
        title string
        status string
        category_id int FK
        user_id int FK
    }
    tags {
        id int PK
        name string
    }
    tag_task {
        task_id int FK
        tag_id int FK
    }
    users ||--o{ tasks : "hasMany"
    users ||--o{ categories : "hasMany"
    categories ||--o{ tasks : "hasMany"
    tasks }o--|| categories : "belongsTo"
    tasks }o--o{ tags : "belongsToMany"
    tag_task }|--|| tasks : ""
    tag_task }|--|| tags : ""`

const erDiagramSteps: DiagramStep[] = [
  {
    highlightNodes: ['users', 'tasks'],
    description:
      "User hasMany Tasks: один користувач може мати багато задач. У таблиці tasks є user_id, що вказує на users.id. Зворотний зв'язок: Task belongsTo User.",
    code: '// User model\npublic function tasks(): HasMany\n{\n    return $this->hasMany(Task::class);\n}',
  },
  {
    highlightNodes: ['users', 'categories'],
    description:
      'User hasMany Categories: користувач може мати кілька категорій. category.user_id вказує на власника. Це дозволяє кожному користувачу мати свій набір категорій.',
    code: '// User model\npublic function categories(): HasMany\n{\n    return $this->hasMany(Category::class);\n}',
  },
  {
    highlightNodes: ['categories', 'tasks'],
    description:
      "Category hasMany Tasks / Task belongsTo Category: одна категорія об'єднує багато задач. У таблиці tasks є category_id (nullable — задача може бути без категорії).",
    code: '// Task model\npublic function category(): BelongsTo\n{\n    return $this->belongsTo(Category::class);\n}',
  },
  {
    highlightNodes: ['tasks', 'tag_task', 'tags'],
    description:
      'Task belongsToMany Tags через pivot-таблицю tag_task: одна задача може мати кілька тегів, і один тег може бути у кількох задачах. Laravel за конвенцією іменує pivot-таблицю в алфавітному порядку: tag + task = tag_task.',
    code: '// Task model\npublic function tags(): BelongsToMany\n{\n    return $this->belongsToMany(Tag::class);\n    // Шукає pivot-таблицю tag_task\n}',
  },
]

// === Practice starter code ===
const practiceCode = `<?php
// Завдання: додайте методи зв'язків до моделі Category
// Category повинна мати:
// 1. user() — belongsTo User
// 2. tasks() — hasMany Task

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
// TODO: додайте потрібні use-імпорти

class Category extends Model
{
    protected $fillable = [
        'name',
        'color',
        'user_id',
    ];

    // TODO: додайте метод user()
    // Підказка: return $this->belongsTo(User::class);

    // TODO: додайте метод tasks()
    // Підказка: return $this->hasMany(Task::class);
}

// Перевірка (запустіть в Tinker після реалізації):
// $category = Category::first();
// $category->tasks;      // Collection з задачами
// $category->user->name; // Ім'я власника категорії`

// === Task starter code ===
const taskStarterCode = `<?php
// Практичне завдання: Self-referencing relationship (підзадачі)
//
// Мета: Додати до моделі Task зв'язок "задача може мати підзадачі".
// Це самопосилальний зв'язок: Task hasMany Tasks.
//
// Крок 1: Уявіть, що ви додали parent_id до таблиці tasks:
//   $table->foreignId('parent_id')->nullable()->constrained('tasks')->nullOnDelete();
//
// Крок 2: Додайте два методи зв'язку в клас Task нижче.

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class Task extends Model
{
    protected $fillable = [
        'title', 'description', 'status',
        'priority', 'deadline',
        'user_id', 'category_id',
        'parent_id', // <-- нове поле
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // TODO: Додайте метод subtasks() — hasMany Task з foreign key 'parent_id'
    // Підказка: return $this->hasMany(Task::class, 'parent_id');
    public function subtasks(): HasMany
    {
        // Ваш код тут
    }

    // TODO: Додайте метод parent() — belongsTo Task з foreign key 'parent_id'
    // Підказка: return $this->belongsTo(Task::class, 'parent_id');
    public function parent(): BelongsTo
    {
        // Ваш код тут
    }
}

// Після реалізації протестуйте в Tinker:
// $parent = Task::first();
// $subtask = $parent->subtasks()->create([
//     'title' => 'Research solutions',
//     'status' => 'pending',
//     'priority' => 'medium',
//     'user_id' => $parent->user_id,
// ]);
// $parent->subtasks;       // Collection [Task {...}]
// $subtask->parent->title; // Назва батьківської задачі`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="categories[task.categoryId]" to="$task->category" />

      <TheoryBlock title="Три типи зв'язків">
        <p>У нашому Task Manager використовуються три основних типи зв'язків:</p>
        <ul>
          <li>
            <strong>hasMany</strong> (один-до-багатьох) — один запис "має багато" інших. Наприклад:
            один User <strong>має багато</strong> Tasks, одна Category
            <strong>має багато</strong> Tasks. Зовнішній ключ знаходиться в "дочірній" таблиці:
            <code>tasks.user_id</code>.
          </li>
          <li>
            <strong>belongsTo</strong> (зворотний зв'язок) — кожна Task
            <strong>належить</strong> одному User і одній Category. Ключове правило: стовпець
            зовнішнього ключа (<code>user_id</code>, <code>category_id</code>) завжди знаходиться в
            таблиці, яка "belongs to".
          </li>
          <li>
            <strong>belongsToMany</strong> (багато-до-багатьох) — одна Task може мати багато Tags, і
            один Tag може належати багатьом Tasks. Потрібна проміжна (pivot) таблиця
            <code>tag_task</code>. Це як масив чекбоксів на фронтенді: задача може мати кілька тегів
            одночасно.
          </li>
        </ul>
      </TheoryBlock>

      <CodeComparison
        :js="jsManualQueryCode"
        :php="phpRelationshipCode"
        js-title="Vue/JS — вручну"
        php-title="Laravel — через зв'язок"
      />

      <CodeBlock :code="taskModelCode" lang="php" title="app/Models/Task.php — методи зв'язків" />

      <TheoryBlock title="Eager Loading та N+1">
        <p>
          Проблема N+1 — одна з найпоширеніших помилок продуктивності. Якщо звертатись до зв'язаної
          моделі (<code>$task->category</code>) всередині циклу без попереднього завантаження,
          Laravel виконає окремий SQL-запит для кожної ітерації.
        </p>
        <p>
          Це той самий антипатерн, що й <code>fetch()</code> всередині <code>v-for</code> у Vue —
          замість одного запиту API ви робите сотні окремих.
        </p>
        <p>
          Рішення — <strong>eager loading</strong> через <code>with()</code>: Laravel виконає тільки
          два SQL-запити незалежно від кількості задач — один для tasks, один для categories.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="n1ProblemCode"
        :php="eagerLoadingCode"
        js-title="Проблема N+1 (PHP)"
        php-title="Eager Loading з with()"
      />

      <InteractiveDiagram
        title="ER-діаграма: зв'язки між моделями"
        :definition="erDiagram"
        :steps="erDiagramSteps"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: зв'язки в моделі Category">
        <p>
          Відредагуйте код нижче — додайте методи зв'язків <code>user()</code> та
          <code>tasks()</code> до моделі Category. Після цього натисніть
          <strong>"Запустити"</strong> щоб перевірити.
        </p>
        <ul>
          <li>
            <code>user()</code> — повертає <code>$this->belongsTo(User::class)</code>. Category
            belongsTo User, бо в таблиці <code>categories</code> є <code>user_id</code>.
          </li>
          <li>
            <code>tasks()</code> — повертає <code>$this->hasMany(Task::class)</code>. Category
            hasMany Tasks, бо в таблиці <code>tasks</code> є <code>category_id</code>.
          </li>
          <li>
            Не забудьте додати <code>use</code>-імпорти для <code>BelongsTo</code>,
            <code>HasMany</code>, <code>User</code> та <code>Task</code>.
          </li>
        </ul>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="app/Models/Category.php — додайте зв'язки"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="2-7" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Підзадачі (self-referencing relationship)">
        <p>
          Додайте до моделі Task самопосилальний зв'язок — задача може мати підзадачі. Це
          <strong>self-referencing relationship</strong>: Task hasMany Tasks (через
          <code>parent_id</code>).
        </p>
        <ol>
          <li>
            Реалізуйте метод <code>subtasks(): HasMany</code> — повертає всі підзадачі поточної
            задачі.
            <br />
            Підказка: <code>$this->hasMany(Task::class, 'parent_id')</code> — вказуємо ключ явно, бо
            за конвенцією Laravel шукав би <code>task_id</code>.
          </li>
          <li>
            Реалізуйте метод <code>parent(): BelongsTo</code> — повертає батьківську задачу.
            <br />
            Підказка: <code>$this->belongsTo(Task::class, 'parent_id')</code>.
          </li>
          <li>
            <strong>Бонус:</strong> У контролері додайте <code>withCount('subtasks')</code> до
            методу <code>index()</code> — кожна задача матиме поле <code>subtasks_count</code>.
          </li>
        </ol>
        <p>
          Після реалізації в Tinker: <code>$parent->subtasks</code> поверне колекцію підзадач, а
          <code>$subtask->parent->title</code> — назву батьківської задачі.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте self-referencing зв'язки"
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
