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
    question: 'Як оголосити змінну в PHP?',
    options: [
      'let $name = "value"',
      '$name = "value"',
      'var name = "value"',
      'name := "value"',
    ],
    correct: 1,
    explanation:
      'В PHP всі змінні починаються з $ і не потребують ключових слів let/const/var. Просто $name = "value"; -- і все.',
  },
  {
    question: 'Який аналог JS об\'єкта {} в PHP?',
    options: [
      'stdClass',
      'Асоціативний масив',
      'Object',
      'HashMap',
    ],
    correct: 1,
    explanation:
      'В PHP асоціативний масив [\'key\' => \'value\'] виконує роль JS об\'єкта {key: "value"}. stdClass теж існує, але масиви використовуються значно частіше.',
  },
  {
    question: 'Що виведе echo 1 + "2abc"?',
    options: [
      '"12abc"',
      '3',
      'Error',
      '"1"',
    ],
    correct: 1,
    explanation:
      'PHP автоматично приводить рядок "2abc" до числа 2 (бере числову частину з початку рядка). Тому 1 + 2 = 3. В PHP 8+ це також генерує Notice.',
  },
  {
    question: 'Як працює ?? в PHP?',
    options: [
      'Логічне АБО',
      'Повертає лівий операнд якщо він не null',
      'Порівняння',
      'Конкатенація',
    ],
    correct: 1,
    explanation:
      'Оператор ?? (null coalescing) повертає лівий операнд, якщо він не null, інакше -- правий. Працює ідентично JavaScript: $name ?? "Anonymous".',
  },
  {
    question: 'Що таке match в PHP?',
    options: [
      'Регулярний вираз',
      'switch як вираз, що повертає значення',
      'Цикл',
      'Функція порівняння',
    ],
    correct: 1,
    explanation:
      'match -- це покращений switch, який повертає значення (expression), використовує строге порівняння (===) і не потребує break.',
  },
]

const jsSwitch = `let label;
switch (status) {
  case "pending":
    label = "Очікує";
    break;
  case "done":
    label = "Готово";
    break;
  default:
    label = "Невідомо";
}`

const phpMatch = `$label = match ($status) {
    'pending' => 'Очікує',
    'done'    => 'Готово',
    default   => 'Невідомо',
};`

const practiceCode = `<?php
declare(strict_types=1);

// === Змінні ===
$name = "Timur";
$age = 25;
$isStudent = true;

echo "Name: {$name}\\n";
echo "Age: {$age}\\n";
echo "Is student: " . ($isStudent ? 'yes' : 'no') . "\\n\\n";

// === Масиви ===
$fruits = ['apple', 'banana', 'cherry'];
echo "Fruits: " . implode(', ', $fruits) . "\\n";
echo "Count: " . count($fruits) . "\\n\\n";

// === Асоціативний масив ===
$task = [
    'title' => 'Learn PHP',
    'status' => 'in_progress',
    'priority' => 1,
];

foreach ($task as $key => $value) {
    echo "  {$key}: {$value}\\n";
}

// === Функція ===
function describe(string $name, int $age): string {
    return "{$name} is {$age} years old";
}

echo "\\n" . describe($name, $age) . "\\n";`

const practiceOutput = [
  '$ php playground/01-basics.php',
  'Name: Timur',
  'Age: 25',
  'Is student: yes',
  '',
  'Fruits: apple, banana, cherry',
  'Count: 3',
  '',
  '  title: Learn PHP',
  '  status: in_progress',
  '  priority: 1',
  '',
  'Timur is 25 years old',
]

const taskStarterCode = `<?php
declare(strict_types=1);

$tasks = [
    ['id' => 1, 'title' => 'Buy groceries', 'status' => 'done', 'priority' => 2],
    ['id' => 2, 'title' => 'Learn PHP', 'status' => 'in_progress', 'priority' => 1],
    ['id' => 3, 'title' => 'Setup Laravel', 'status' => 'pending', 'priority' => 1],
    ['id' => 4, 'title' => 'Write API', 'status' => 'pending', 'priority' => 3],
    ['id' => 5, 'title' => 'Deploy', 'status' => 'pending', 'priority' => 5],
];

// 1. formatTask -- повертає рядок "[STATUS] Title (priority: N)"
function formatTask(array $task): string {
    // Ваш код тут
}

// 2. filterByStatus -- повертає масив задач з заданим статусом
function filterByStatus(array $tasks, string $status): array {
    // Ваш код тут
}

// 3. getTaskStats -- повертає асоціативний масив зі статистикою
//    ['total' => N, 'done' => N, 'pending' => N, 'in_progress' => N]
function getTaskStats(array $tasks): array {
    // Ваш код тут
}

// Тестування
echo "=== Форматування ===\\n";
foreach ($tasks as $task) {
    echo formatTask($task) . "\\n";
}

echo "\\n=== Pending задачі ===\\n";
$pending = filterByStatus($tasks, 'pending');
foreach ($pending as $task) {
    echo "- {$task['title']}\\n";
}

echo "\\n=== Статистика ===\\n";
$stats = getTaskStats($tasks);
print_r($stats);`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="let/const" to="$variable" />

      <TheoryBlock title="Змінні та типи">
        <p>
          В PHP немає <code>let</code> чи <code>const</code> для змінних. Кожна змінна починається з
          <code>$</code> і може бути змінена в будь-який момент. PHP -- мова з динамічною типізацією,
          як і JavaScript. Для справжніх констант є окремий синтаксис <code>const</code> або <code>define()</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`let name = &quot;Timur&quot;;\nconst MAX = 10;\nlet isActive = true;\nlet score = 9.5;`"
        :php="`$name = &quot;Timur&quot;;       // string\nconst MAX = 10;          // константа\n$isActive = true;        // bool\n$score = 9.5;            // float`"
      />

      <TheoryBlock title="Масиви">
        <p>
          В PHP немає окремого типу "об'єкт-словник". Замість цього є <strong>індексовані масиви</strong>
          (як JS arrays: <code>[1, 2, 3]</code>) та <strong>асоціативні масиви</strong> (як JS objects:
          <code>['key' => 'value']</code>). Це одна структура <code>array</code>, яка замінює і масиви, і об'єкти з JavaScript.
        </p>
        <p>
          Доступ до елементів -- тільки через квадратні дужки: <code>$task['title']</code>.
          Оператор <code>.</code> в PHP -- це конкатенація рядків, а не доступ до властивості.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`const task = {\n  name: &quot;Task&quot;,\n  done: true\n};`"
        :php="`$task = [\n  'name' => 'Task',\n  'done' => true,\n];`"
      />

      <TheoryBlock title="Функції">
        <p>
          PHP підтримує звичайні функції з <code>function</code>, стрілкові функції <code>fn()</code>
          (тільки один вираз, як implicit return в JS) та замикання з <code>use</code>.
        </p>
        <p>
          Важлива відмінність: анонімна функція в PHP <strong>не бачить</strong> зовнішніх змінних
          без явного <code>use ($var)</code>. Стрілкова функція <code>fn()</code> автоматично захоплює
          зовнішні змінні (read-only).
        </p>
      </TheoryBlock>

      <CodeComparison
        js="const double = (x) => x * 2;"
        php="$double = fn($x) => $x * 2;"
      />

      <TheoryBlock title="Оператори">
        <p>
          <code>===</code> працює так само, як в JS -- строге порівняння без приведення типів.
          <code>??</code> (null coalescing) теж ідентичний. А <code>match</code> -- це покращений
          <code>switch</code>: повертає значення, використовує <code>===</code>, не потребує <code>break</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsSwitch"
        :php="phpMatch"
        js-title="JavaScript (switch)"
        php-title="PHP (match)"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: перший PHP-файл">
        <p>
          Створіть файл <code>playground/01-basics.php</code> з наступним кодом та запустіть його в терміналі.
          Кожен PHP-файл починається з <code>&lt;?php</code>. Закриваючий тег <code>?&gt;</code> не потрібен.
        </p>
        <ol>
          <li>Перевірте, що PHP встановлений: <code>php -v</code></li>
          <li>Створіть директорію: <code>mkdir -p playground</code></li>
          <li>Створіть файл <code>playground/01-basics.php</code></li>
          <li>Запустіть файл з терміналу</li>
        </ol>
      </TheoryBlock>

      <CodeBlock :code="practiceCode" lang="php" title="playground/01-basics.php" :show-line-numbers="true" />

      <CodeBlock code="php playground/01-basics.php" lang="bash" :terminal="true" title="Запуск" />

      <TerminalOutput :lines="practiceOutput" title="Очікуваний результат" />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="1-1" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Task Manager Functions">
        <p>
          Створіть файл <code>playground/01-task-functions.php</code> та реалізуйте три функції
          для роботи з масивом задач:
        </p>
        <ol>
          <li>
            <strong>formatTask(array $task): string</strong> -- форматує задачу в рядок
            <code>[STATUS] Title (priority: N)</code>
          </li>
          <li>
            <strong>filterByStatus(array $tasks, string $status): array</strong> -- повертає
            тільки задачі з вказаним статусом
          </li>
          <li>
            <strong>getTaskStats(array $tasks): array</strong> -- повертає статистику:
            загальна кількість, скільки done, pending, in_progress
          </li>
        </ol>
        <p>
          Використовуйте: <code>array_filter</code>, <code>array_values</code>, <code>count</code>,
          <code>strtoupper</code>, <code>foreach</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="taskStarterCode" lang="php" title="Стартовий код" :show-line-numbers="true" />
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
