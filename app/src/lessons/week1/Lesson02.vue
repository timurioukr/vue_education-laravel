<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion } from '@/types'

defineProps<{
  activeTab: string
}>()

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Як оголосити конструктор з constructor promotion в PHP 8?',
    options: [
      'constructor($name) { this.name = $name }',
      'public function __construct(public string $name)',
      'function __init__(string $name)',
      'new(string $name)',
    ],
    correct: 1,
    explanation:
      'Constructor promotion дозволяє оголосити властивість прямо в параметрах конструктора: public function __construct(public string $name). Це скорочує код -- не потрібно окремо оголошувати властивість та присвоювати її.',
  },
  {
    question: 'Що таке trait в PHP?',
    options: [
      'Тип даних',
      'Набір методів, який можна "вмішати" в клас',
      'Інтерфейс з реалізацією',
      'Абстрактний клас',
    ],
    correct: 1,
    explanation:
      'Trait -- це набір методів, який можна додати (use) в будь-який клас. Це аналог Vue composables, але для класів. PHP не підтримує множинне наслідування, тому traits вирішують цю проблему.',
  },
  {
    question: 'Як підключити клас з іншого namespace в PHP?',
    options: [
      'import { Task } from "./Task"',
      'use App\\Models\\Task;',
      'require("Task")',
      'include App.Models.Task',
    ],
    correct: 1,
    explanation:
      'В PHP для "імпорту" класу з іншого namespace використовується ключове слово use: use App\\Models\\Task;. Це дозволяє писати Task замість повного шляху \\App\\Models\\Task.',
  },
  {
    question: 'Що таке backed enum в PHP?',
    options: [
      'Enum без значень',
      'Enum зі значеннями (string або int)',
      'Enum з методами',
      'Enum з наслідуванням',
    ],
    correct: 1,
    explanation:
      'Backed enum -- це перелічення, де кожен case має конкретне значення (string або int). Наприклад: enum Status: string { case Pending = "pending"; }. Це дозволяє конвертувати між enum та його значенням.',
  },
  {
    question: 'Який модифікатор доступу робить властивість доступною тільки в поточному класі?',
    options: [
      'public',
      'private',
      'protected',
      'readonly',
    ],
    correct: 1,
    explanation:
      'private робить властивість або метод доступним тільки всередині класу, де вони оголошені. protected -- в класі та його дочірніх класах. public -- звідусіль. readonly -- не модифікатор доступу, а заборона зміни після ініціалізації.',
  },
]

const jsClass = `class Task {
  constructor(title, status = "pending") {
    this.title = title;
    this.status = status;
    this.createdAt = new Date();
  }

  isComplete() {
    return this.status === "done";
  }
}`

const phpClass = `class Task
{
    public function __construct(
        public string $title,
        public string $status = 'pending',
        public int $priority = 3,
    ) {}

    public function isComplete(): bool
    {
        return $this->status === 'done';
    }
}`

const jsComposable = `// composables/useTimestamps.js
export function useTimestamps() {
  const createdAt = ref(new Date());
  const updatedAt = ref(new Date());

  function touch() {
    updatedAt.value = new Date();
  }

  return { createdAt, updatedAt, touch };
}`

const phpTrait = `trait HasTimestamps
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
}

class Task {
    use HasTimestamps;  // "вмішуємо" trait
}`

const jsImport = `// src/models/Task.js
export class Task { ... }

// src/services/TaskService.js
import { Task } from '../models/Task.js';
import { Category } from '../models/Category.js';`

const phpNamespace = `// src/Models/Task.php
namespace App\\Models;

class Task { ... }

// src/Services/TaskService.php
namespace App\\Services;

use App\\Models\\Task;
use App\\Models\\Category;`

const phpEnum = `enum TaskStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Done = 'done';

    public function label(): string
    {
        return match ($this) {
            self::Pending    => 'Очікує',
            self::InProgress => 'В роботі',
            self::Done       => 'Готово',
        };
    }
}

// Використання:
$status = TaskStatus::from('done');
echo $status->label(); // "Готово"`

const practiceSteps = `# Крок 1: Створіть структуру
mkdir -p playground/02-oop/src/{Enums,Contracts,Traits,Models,Collections}

# Крок 2: Ініціалізуйте Composer
cd playground/02-oop
composer init --name="student/task-oop" --no-interaction

# Крок 3: Додайте autoload в composer.json
# "autoload": { "psr-4": { "App\\\\": "src/" } }

# Крок 4: Регенеруйте autoload
composer dump-autoload`

const practiceOutput = [
  '$ cd playground/02-oop',
  '$ composer dump-autoload',
  'Generating autoload files',
  'Generated autoload files containing 1 classes',
  '',
  '$ php main.php',
  '[pending] Buy groceries (priority: 2)',
  '[in_progress] Learn PHP (priority: 1)',
  'Status label: Очікує',
  'Is overdue: no',
  'Days until deadline: 6',
]

const taskCode = `<?php
declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

// Створіть:
// 1. Enum TaskStatus (src/Enums/TaskStatus.php)
//    - cases: Pending, InProgress, Done
//    - метод label(): string

// 2. Trait HasDeadline (src/Traits/HasDeadline.php)
//    - властивість ?string $deadline
//    - метод setDeadline(string $date): void
//    - метод isOverdue(): bool
//    - метод daysUntilDeadline(): ?int

// 3. Class Task (src/Models/Task.php)
//    - constructor promotion: id, title, status (TaskStatus)
//    - use HasDeadline
//    - метод toArray(): array

// Тестування:
use App\\Enums\\TaskStatus;
use App\\Models\\Task;

$task = new Task(1, 'Learn PHP OOP', TaskStatus::InProgress);
$task->setDeadline('2026-04-15');

echo "Title: {$task->title}\\n";
echo "Status: {$task->status->label()}\\n";
echo "Overdue: " . ($task->isOverdue() ? 'yes' : 'no') . "\\n";
print_r($task->toArray());`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="class MyComponent" to="class MyModel" />

      <TheoryBlock title="Класи та Constructor Promotion">
        <p>
          В PHP класи -- основа всього. На відміну від Vue Composition API, де ви рідко пишете класи,
          в Laravel класи використовуються повсюди: моделі, контролери, сервіси.
        </p>
        <p>
          <strong>Constructor Promotion (PHP 8+)</strong> -- замість окремого оголошення властивостей
          і присвоєння в конструкторі, все робиться в один рядок. Замість <code>this.</code> використовується
          <code>$this-></code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsClass"
        :php="phpClass"
        js-title="JavaScript"
        php-title="PHP 8+ (Constructor Promotion)"
      />

      <TheoryBlock title="Трейти (аналог Vue Composables)">
        <p>
          В Vue ви створюєте composables (<code>useAuth()</code>, <code>useNotification()</code>) для
          перевикористання логіки. В PHP аналог -- <strong>traits</strong>. Trait "вмішує" методи прямо
          в клас через <code>use</code>.
        </p>
        <p>
          PHP не підтримує множинне наслідування, але клас може використовувати скільки завгодно трейтів.
          В Laravel трейти використовуються повсюди: <code>HasFactory</code>, <code>SoftDeletes</code>,
          <code>HasApiTokens</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsComposable"
        :php="phpTrait"
        js-title="Vue Composable"
        php-title="PHP Trait"
      />

      <TheoryBlock title="Простори імен (Namespaces)">
        <p>
          В JS кожен файл -- це модуль з <code>import</code>/<code>export</code>. В PHP -- це
          <strong>namespace</strong> та <code>use</code>. Namespace відповідає структурі директорій
          за конвенцією PSR-4: <code>App\Models\Task</code> = <code>app/Models/Task.php</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsImport"
        :php="phpNamespace"
        js-title="ES Modules"
        php-title="PHP Namespaces"
      />

      <TheoryBlock title="Enums (PHP 8.1+)">
        <p>
          В TypeScript ви робите <code>type Status = 'pending' | 'done'</code> або <code>as const</code>.
          В PHP є нативні <strong>backed enums</strong> зі значеннями (string або int) та методами.
          Enums перевіряються в runtime -- неможливо передати невалідне значення.
        </p>
      </TheoryBlock>

      <CodeBlock :code="phpEnum" lang="php" title="PHP Backed Enum з методами" />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: OOP-проєкт з Composer">
        <p>
          Створимо міні-проєкт з правильною OOP-структурою, Composer autoloading та окремими файлами
          для кожного класу.
        </p>
        <ol>
          <li>Створіть директорію <code>playground/02-oop</code> з піддиректоріями</li>
          <li>Ініціалізуйте Composer та налаштуйте PSR-4 autoload</li>
          <li>Створіть Enum, Trait, та клас Task в окремих файлах</li>
          <li>Створіть <code>main.php</code> та запустіть</li>
        </ol>
      </TheoryBlock>

      <CodeBlock :code="practiceSteps" lang="bash" :terminal="true" title="Кроки в терміналі" />

      <TerminalOutput :lines="practiceOutput" title="Очікуваний результат" />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="1-2" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Task Manager OOP">
        <p>
          Створіть повноцінну OOP-структуру для Task Manager з використанням enum, trait та класу:
        </p>
        <ol>
          <li>
            <strong>TaskStatus enum</strong> -- backed enum зі значеннями pending, in_progress, done
            та методом <code>label(): string</code> що повертає українську назву
          </li>
          <li>
            <strong>HasDeadline trait</strong> -- додає функціонал дедлайну: встановлення,
            перевірка чи прострочений, підрахунок днів до дедлайну
          </li>
          <li>
            <strong>Task клас</strong> -- використовує constructor promotion, TaskStatus enum
            та HasDeadline trait, має метод <code>toArray()</code>
          </li>
        </ol>
      </TheoryBlock>

      <CodeBlock :code="taskCode" lang="php" title="main.php (стартовий код)" :show-line-numbers="true" />
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
