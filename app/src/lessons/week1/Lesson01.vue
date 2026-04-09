<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodePlayground from '@/components/interactive/CodePlayground.vue'
import InteractiveDiagram from '@/components/interactive/InteractiveDiagram.vue'
import CodeFlowVisualizer from '@/components/interactive/CodeFlowVisualizer.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion, DiagramStep, CodeFlowStep } from '@/types'

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

// === Diagram: How PHP executes code ===
const phpExecutionDiagram = `flowchart LR
  A[".php файл"] --> B["PHP інтерпретатор"]
  B --> C["Лексер/Парсер"]
  C --> D["Опкоди"]
  D --> E["Zend VM"]
  E --> F["stdout / echo"]
`

const phpExecutionSteps: DiagramStep[] = [
  {
    highlightNodes: ['A'],
    description: 'Все починається з .php файлу — як .js файл для Node.js. PHP-файл починається з <?php тегу.',
    code: '<?php echo "Hello";',
  },
  {
    highlightNodes: ['B'],
    description: 'PHP інтерпретатор (CLI або через веб-сервер) читає файл. Аналог Node.js або V8 для JavaScript.',
  },
  {
    highlightNodes: ['C'],
    description: 'Лексер розбиває код на токени, парсер будує AST (абстрактне синтаксичне дерево) — як V8 парсить JS.',
  },
  {
    highlightNodes: ['D', 'E'],
    description: 'AST компілюється в опкоди (байткод) і виконується Zend VM. В JS аналог — JIT-компіляція V8.',
  },
  {
    highlightNodes: ['F'],
    description: 'Результат виводиться через echo/print — як console.log() в JavaScript. Вивід йде в stdout.',
    code: 'echo "Hello World\\n";  // → stdout',
  },
]

// === Diagram: PHP types vs JS types ===
const typesDiagram = `flowchart TB
  subgraph JS ["JavaScript"]
    JS1["string"]
    JS2["number"]
    JS3["boolean"]
    JS4["null / undefined"]
    JS5["object / array"]
  end
  subgraph PHP ["PHP"]
    PHP1["string"]
    PHP2["int + float"]
    PHP3["bool"]
    PHP4["null"]
    PHP5["array"]
  end
  JS1 -.-> PHP1
  JS2 -.-> PHP2
  JS3 -.-> PHP3
  JS4 -.-> PHP4
  JS5 -.-> PHP5
`

const typesDiagramSteps: DiagramStep[] = [
  {
    highlightNodes: ['JS1', 'PHP1'],
    description: 'string → string. Ідентично. Одинарні та подвійні лапки, але в PHP подвійні підтримують інтерполяцію: "Hello $name".',
    code: '$name = "World";\necho "Hello $name";  // Hello World',
  },
  {
    highlightNodes: ['JS2', 'PHP2'],
    description: 'number → int + float. В PHP числа розділені на цілі (int) та дробні (float). JS має тільки number.',
    code: '$age = 25;      // int\n$price = 9.99;  // float',
  },
  {
    highlightNodes: ['JS3', 'PHP3'],
    description: 'boolean → bool. Ідентично. true/false без лапок.',
  },
  {
    highlightNodes: ['JS4', 'PHP4'],
    description: 'null + undefined → null. В PHP немає undefined. Тільки null. Неініціалізована змінна = warning.',
  },
  {
    highlightNodes: ['JS5', 'PHP5'],
    description: 'object + Array → array. В PHP один тип array замінює і масиви, і об\'єкти-словники з JS.',
    code: '$list = [1, 2, 3];           // як JS []\n$map = ["a" => 1, "b" => 2];  // як JS {}',
  },
]

// === Code Flow: foreach loop ===
const foreachCode = `<?php
$items = ['task1', 'task2', 'task3'];
foreach ($items as $index => $item) {
    echo "$index: $item\\n";
}`

const foreachSteps: CodeFlowStep[] = [
  {
    line: 2,
    variables: { '$items': "['task1', 'task2', 'task3']" },
    note: 'Створюємо масив з трьох рядків. В JS це було б const items = ["task1", "task2", "task3"]',
  },
  {
    line: 3,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '0', '$item': '"task1"' },
    note: 'foreach бере перший елемент. $index = ключ (0), $item = значення ("task1"). Як for...of + entries() в JS.',
  },
  {
    line: 4,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '0', '$item': '"task1"' },
    output: '0: task1\n',
    note: 'echo виводить рядок з інтерполяцією. $index та $item підставляються всередину подвійних лапок.',
  },
  {
    line: 3,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '1', '$item': '"task2"' },
    note: 'Друга ітерація. $index = 1, $item = "task2".',
  },
  {
    line: 4,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '1', '$item': '"task2"' },
    output: '1: task2\n',
  },
  {
    line: 3,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '2', '$item': '"task3"' },
    note: 'Остання ітерація. $index = 2, $item = "task3".',
  },
  {
    line: 4,
    variables: { '$items': "['task1', 'task2', 'task3']", '$index': '2', '$item': '"task3"' },
    output: '2: task3\n',
    note: 'Цикл завершено. Всі 3 елементи оброблено.',
  },
]

// Expected output for practice (used for comparison)
const practiceExpectedOutput = `Name: Timur
Age: 25
Is student: yes

Fruits: apple, banana, cherry
Count: 3

  title: Learn PHP
  status: in_progress
  priority: 1

Timur is 25 years old`

// Test code for task validation
const taskTestCode = `
// Auto-test
echo "\\n=== Auto-check ===\\n";
$pass = 0;
$total = 3;

// Test formatTask
$result = formatTask(['id' => 1, 'title' => 'Test', 'status' => 'done', 'priority' => 2]);
if ($result === '[DONE] Test (priority: 2)') { echo "✓ formatTask\\n"; $pass++; } else { echo "✗ formatTask: got '$result'\\n"; }

// Test filterByStatus
$filtered = filterByStatus($tasks, 'pending');
if (count($filtered) === 3) { echo "✓ filterByStatus\\n"; $pass++; } else { echo "✗ filterByStatus: expected 3, got " . count($filtered) . "\\n"; }

// Test getTaskStats
$stats = getTaskStats($tasks);
if ($stats['total'] === 5 && $stats['done'] === 1 && $stats['pending'] === 3 && $stats['in_progress'] === 1) { echo "✓ getTaskStats\\n"; $pass++; } else { echo "✗ getTaskStats\\n"; }

echo "\\nРезультат: $pass/$total\\n";`

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

      <InteractiveDiagram
        title="Як PHP виконує код"
        :definition="phpExecutionDiagram"
        :steps="phpExecutionSteps"
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

      <InteractiveDiagram
        title="Типи даних: PHP vs JavaScript"
        :definition="typesDiagram"
        :steps="typesDiagramSteps"
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

      <CodeFlowVisualizer
        title="Покрокове виконання: foreach цикл"
        :code="foreachCode"
        language="php"
        :steps="foreachSteps"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: перший PHP-файл">
        <p>
          Відредагуйте код нижче та натисніть <strong>"Запустити"</strong> щоб побачити результат.
          Спробуйте змінити значення змінних, додати нові елементи в масив, або написати свою функцію.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/01-basics.php"
        :expected-output="practiceExpectedOutput"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="1-1" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Task Manager Functions">
        <p>
          Реалізуйте три функції для роботи з масивом задач. Натисніть <strong>"Запустити"</strong> —
          автоматичні тести перевірять вашу реалізацію.
        </p>
        <ol>
          <li>
            <strong>formatTask(array $task): string</strong> — форматує задачу в рядок
            <code>[STATUS] Title (priority: N)</code>
          </li>
          <li>
            <strong>filterByStatus(array $tasks, string $status): array</strong> — повертає
            тільки задачі з вказаним статусом
          </li>
          <li>
            <strong>getTaskStats(array $tasks): array</strong> — повертає статистику:
            загальна кількість, скільки done, pending, in_progress
          </li>
        </ol>
        <p>
          Підказка: використовуйте <code>array_filter</code>, <code>array_values</code>, <code>count</code>,
          <code>strtoupper</code>, <code>foreach</code>.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте функції"
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
