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
    question: 'Що повертає метод toArray() в API Resource?',
    options: [
      'SQL-запит до бази даних',
      'Масив, що визначає структуру JSON-відповіді',
      'HTML-шаблон для відображення',
      'Колекцію Eloquent-моделей',
    ],
    correct: 1,
    explanation:
      'toArray() визначає точну структуру JSON-відповіді: які поля включити, як їх назвати, які обчислити. Це "серцевина" Resource — він маппить модель у масив, який потім Laravel конвертує в JSON.',
  },
  {
    question: 'Що робить $this->whenLoaded(\'category\') у Resource?',
    options: [
      'Завантажує зв\'язок category з бази даних',
      'Включає поле category у JSON тільки якщо зв\'язок вже був завантажений через with()',
      'Перевіряє чи категорія існує в базі',
      'Автоматично підключає CategoryResource',
    ],
    correct: 1,
    explanation:
      'whenLoaded() не завантажує зв\'язок — він перевіряє, чи він вже завантажений. Якщо контролер викликав with(\'category\'), поле буде в JSON. Якщо ні — поле просто відсутнє. Це запобігає N+1 проблемі.',
  },
  {
    question: 'Яка різниця між new TaskResource($task) та TaskResource::collection($tasks)?',
    options: [
      'Ніякої різниці — обидва роблять однакове',
      'new для одного запису, ::collection() для масиву або колекції',
      'new для створення ресурсу, ::collection() для видалення',
      '::collection() тільки для пагінації, new для всього іншого',
    ],
    correct: 1,
    explanation:
      'new TaskResource($task) трансформує один Eloquent-запис. TaskResource::collection($tasks) обробляє кожен елемент колекції чи пагінатора через той самий toArray(). Аналог у JS: transformTask(task) vs tasks.map(transformTask).',
  },
  {
    question: 'Що містить meta в пагінованій відповіді TaskResource::collection(Task::paginate(15))?',
    options: [
      'Тільки загальну кількість записів',
      'current_page, last_page, per_page, total та масив посилань на сторінки',
      'HTTP-заголовки відповіді',
      'Метадані про структуру бази даних',
    ],
    correct: 1,
    explanation:
      'meta містить всю інформацію про пагінацію: current_page (поточна сторінка), last_page (остання), per_page (записів на сторінку), total (загальна кількість), а також масив links з URL кожної сторінки. Фронтенд використовує це для навігації.',
  },
  {
    question: 'Чому без API Resource у відповіді з\'являється поле pivot для тегів?',
    options: [
      'Це обов\'язкова частина JSON:API специфікації',
      'Laravel автоматично включає дані pivot-таблиці при серіалізації many-to-many зв\'язку',
      'Це помилка конфігурації маршрутів',
      'pivot з\'являється тільки при помилках в міграції',
    ],
    correct: 1,
    explanation:
      'При many-to-many зв\'язку (Task ↔ Tag) Eloquent завантажує pivot-таблицю і включає її дані в серіалізацію. У відповіді кожен тег отримує поле pivot: { task_id: 1, tag_id: 1 }. API Resource дозволяє явно вказати лише потрібні поля — і pivot просто не включається в toArray().',
  },
]

// === Порівняння: JS computed vs PHP toArray ===
const jsComputed = `// Vue — computed маппить сирі дані
const taskForDisplay = computed(() => ({
  id: rawTask.value.id,
  title: rawTask.value.title,
  // обчислюване поле
  isOverdue: new Date(rawTask.value.deadline) < new Date(),
  category: rawTask.value.category
    ? { id: rawTask.value.category.id, name: rawTask.value.category.name }
    : null,
}))`

const phpToArray = `// Laravel Resource — toArray() маппить модель
public function toArray(Request $request): array
{
    return [
        'id'         => $this->id,
        'title'      => $this->title,
        // обчислюване поле
        'is_overdue' => $this->deadline?->isPast()
                         && $this->status !== 'done',
        'category'   => new CategoryResource(
                            $this->whenLoaded('category')
                        ),
    ];
}`

// === Порівняння: повернення моделі vs Resource ===
const returnModelCode = `// Контролер — повертаємо модель напряму
public function show(Task $task)
{
    return response()->json($task);
}

// Відповідь — витікає вся структура БД:
// {
//   "id": 1,
//   "title": "Fix bug",
//   "user_id": 1,      ← зайве
//   "category_id": 1,  ← зайве (є id, але не об'єкт)
//   "parent_id": null, ← зайве
//   "updated_at": "...", ← не потрібно фронтенду
//   "tags": [{ "id": 1, "name": "urgent",
//     "pivot": { "task_id": 1, "tag_id": 1 } ← витік!
//   }]
// }`

const returnResourceCode = `// Контролер — повертаємо через Resource
public function show(Task $task)
{
    $task->load(['category', 'tags']);
    return new TaskResource($task);
}

// Відповідь — тільки те, що потрібно:
// {
//   "data": {
//     "id": 1,
//     "title": "Fix bug",
//     "category": { "id": 1, "name": "Work" },
//     "tags": [{ "id": 1, "name": "urgent" }],
//     "is_overdue": false
//   }
// }`

// === TaskResource toArray з whenLoaded/when ===
const taskResourceCode = `<?php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'priority'    => $this->priority,
            'deadline'    => $this->deadline?->format('Y-m-d'),
            'created_at'  => $this->created_at->toISOString(),

            // whenLoaded — поле є в JSON тільки якщо зв'язок
            // вже завантажений через with('category')
            'category' => new CategoryResource(
                $this->whenLoaded('category')
            ),

            // Те саме для колекції тегів
            'tags' => TagResource::collection(
                $this->whenLoaded('tags')
            ),

            // when — поле є тільки якщо умова true
            // tags_count з'являється після withCount('tags')
            'tags_count' => $this->when(
                isset($this->tags_count),
                $this->tags_count
            ),
        ];
    }
}`

// === Controller з Resource::collection і paginate ===
const controllerWithResourceCode = `<?php

namespace App\\Http\\Controllers;

use App\\Http\\Resources\\TaskResource;
use App\\Models\\Task;

class TaskController extends Controller
{
    // Список з пагінацією
    public function index()
    {
        $tasks = Task::with(['category', 'tags'])
            ->latest()
            ->paginate(15); // 15 записів на сторінку

        // collection() обробляє кожен елемент пагінатора
        // і автоматично додає links + meta
        return TaskResource::collection($tasks);
    }

    // Один запис
    public function show(Task $task)
    {
        $task->load(['category', 'tags']);

        return new TaskResource($task);
    }

    // Створення — повертаємо 201 Created
    public function store(StoreTaskRequest $request)
    {
        $task = Task::create($request->validated());
        $task->load(['category', 'tags']);

        return (new TaskResource($task))
            ->response()
            ->setStatusCode(201);
    }
}`

// === Порівняння JSON до/після Resource ===
const jsonBefore = `// GET /api/tasks/1 — БЕЗ Resource
{
    "id": 1,
    "title": "Fix bug #123",
    "status": "pending",
    "user_id": 1,
    "category_id": 1,
    "parent_id": null,
    "updated_at": "2026-04-09T10:05:30Z",
    "category": {
        "id": 1, "name": "Work",
        "user_id": 1,
        "created_at": "...",
        "updated_at": "..."
    },
    "tags": [{
        "id": 1, "name": "urgent",
        "created_at": "...",
        "updated_at": "...",
        "pivot": { "task_id": 1, "tag_id": 1 }
    }]
}`

const jsonAfter = `// GET /api/tasks/1 — З Resource
{
    "data": {
        "id": 1,
        "title": "Fix bug #123",
        "status": "pending",
        "deadline": "2026-04-15",
        "created_at": "2026-04-09T10:00:00.000Z",
        "category": {
            "id": 1,
            "name": "Work",
            "color": "#ef4444"
        },
        "tags": [
            { "id": 1, "name": "urgent" }
        ]
    }
}`

// === Практика: CategoryResource ===
const practiceStarterCode = `<?php
// app/Http/Resources/CategoryResource.php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // TODO: Додайте поля id, name, color

            // TODO: tasks_count тільки якщо $this->tasks_count існує
            // Підказка: $this->when(isset($this->tasks_count), ...)

            // TODO: вкладені задачі тільки якщо завантажені
            // Підказка: TaskResource::collection($this->whenLoaded('tasks'))
        ];
    }
}

// Перевірка (симуляція)
$category = (object)[
    'id' => 1,
    'name' => 'Work',
    'color' => '#ef4444',
    'tasks_count' => 3,
];

// Очікуваний результат:
// id: 1, name: Work, color: #ef4444, tasks_count: 3
echo "id: {$category->id}\\n";
echo "name: {$category->name}\\n";
echo "color: {$category->color}\\n";
echo "tasks_count: {$category->tasks_count}\\n";`

const practiceExpectedOutput = `id: 1
name: Work
color: #ef4444
tasks_count: 3`

// === Завдання: TagResource + оновлений контролер ===
const taskStarterCode = `<?php
// app/Http/Resources/TagResource.php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;

class TagResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // TODO: поля id, name

            // TODO: tasks_count умовно (через when + isset)
        ];
    }
}

// --- Симуляція TagController::index() ---
// Очікуваний результат після Resource:
// Тег 1: id=1, name=urgent, tasks_count=2
// Тег 2: id=2, name=frontend, tasks_count=1
// Тег 3: id=3, name=bug, tasks_count=3

$tags = [
    (object)['id' => 1, 'name' => 'urgent',   'tasks_count' => 2],
    (object)['id' => 2, 'name' => 'frontend', 'tasks_count' => 1],
    (object)['id' => 3, 'name' => 'bug',      'tasks_count' => 3],
];

// TODO: виведіть кожен тег у форматі:
// "Тег N: id=X, name=Y, tasks_count=Z"
foreach ($tags as $i => $tag) {
    // Ваш код тут
}

// Автотест
echo "\\n=== Автоперевірка ===\\n";
$pass = 0;
if ($tags[0]->id === 1)          { echo "✓ id\\n"; $pass++; }
if ($tags[0]->name === 'urgent') { echo "✓ name\\n"; $pass++; }
if ($tags[1]->tasks_count === 1) { echo "✓ tasks_count\\n"; $pass++; }
echo "Результат: {$pass}/3\\n";`

const taskTestCode = `
// Автотест вже вбудований у код вище
`
</script>

<template>
  <div class="lesson-content">
    <!-- ===== THEORY TAB ===== -->
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="computed()" to="toArray()" />

      <TheoryBlock title="Навіщо потрібні API Resources?">
        <p>
          Коли контролер повертає Eloquent-модель напряму через
          <code>return response()->json($task)</code>, Laravel серіалізує
          <strong>всі поля моделі</strong>: <code>user_id</code>,
          <code>category_id</code>, <code>updated_at</code> і навіть
          <code>pivot</code>-дані many-to-many зв'язків. Фронтенд бачить
          внутрішню структуру бази даних.
        </p>
        <p>
          <strong>API Resource</strong> — це шар трансформації між моделлю
          та JSON-відповіддю. Він визначає <em>контракт</em>: які поля
          повертати, як їх назвати, що обчислити. Якщо перейменувати стовпець
          в базі — Resource збереже зовнішній API незмінним.
        </p>
        <p>
          Аналог на фронтенді — це <code>computed()</code>, що маппить
          сирі дані стору в форму, зручну для шаблону. Або функція
          <code>transformTask(raw)</code> у Nuxt server route.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsComputed"
        :php="phpToArray"
        js-title="Vue — computed() маппить дані"
        php-title="Laravel — toArray() маппить модель"
      />

      <TheoryBlock title="До та після: return $model vs return Resource">
        <p>
          Порівняйте два підходи. Зліва — контролер повертає модель напряму
          (витікає структура БД). Справа — контролер повертає через Resource
          (тільки потрібні поля, чиста структура).
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="returnModelCode"
        :php="returnResourceCode"
        js-title="❌ Без Resource — витік структури БД"
        php-title="✅ З Resource — контрольований контракт"
      />

      <CodeBlock
        title="TaskResource — toArray() з whenLoaded та when"
        lang="php"
        :code="taskResourceCode"
      />

      <TheoryBlock title="Колекції та пагінація">
        <p>
          Для списку записів використовується
          <code>TaskResource::collection($tasks)</code>. Метод
          <code>collection()</code> застосовує <code>toArray()</code> до
          кожного елемента. Якщо передати результат
          <code>paginate()</code> — Laravel автоматично додасть
          <code>links</code> і <code>meta</code> з інформацією про сторінки.
        </p>
        <p>
          Ключі відповіді при пагінації:
        </p>
        <ul>
          <li><code>data</code> — масив трансформованих записів</li>
          <li>
            <code>links</code> — <code>first</code>, <code>last</code>,
            <code>prev</code>, <code>next</code> URLs
          </li>
          <li>
            <code>meta</code> — <code>current_page</code>,
            <code>last_page</code>, <code>per_page</code>,
            <code>total</code>
          </li>
        </ul>
        <p>
          Фронтенд отримує все необхідне для побудови UI-пагінації:
          <code>response.meta.total</code>,
          <code>response.meta.last_page</code>,
          <code>response.links.next</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        title="TaskController — Resource::collection і paginate"
        lang="php"
        :code="controllerWithResourceCode"
      />

      <TheoryBlock title="JSON: до та після Resource">
        <p>
          Порівняйте реальний формат відповідей. Без Resource відповідь
          містить <code>user_id</code>, <code>category_id</code>,
          <code>updated_at</code> і <code>pivot</code> у кожному тезі.
          З Resource — тільки те, що потрібно фронтенду.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsonBefore"
        :php="jsonAfter"
        js-title="❌ Відповідь без Resource"
        php-title="✅ Відповідь з Resource"
      />
    </div>

    <!-- ===== PRACTICE TAB ===== -->
    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: CategoryResource">
        <p>
          Реалізуйте <code>CategoryResource</code> — Resource для категорії
          задач. Він повинен повертати <code>id</code>, <code>name</code>,
          <code>color</code>, умовно <code>tasks_count</code> (тільки якщо
          завантажений через <code>withCount</code>) та вкладені задачі
          (тільки якщо завантажені через <code>with('tasks')</code>).
        </p>
        <p>
          Запустіть код — симуляція виведе поля категорії.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceStarterCode"
        language="php"
        title="playground/CategoryResource.php"
        :expected-output="practiceExpectedOutput"
      />
    </div>

    <!-- ===== QUIZ TAB ===== -->
    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="2-9" />
    </div>

    <!-- ===== TASK TAB ===== -->
    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: TagResource та оновлений контролер">
        <p>
          Створіть <code>TagResource</code> та оновіть вивід
          <code>TagController::index()</code> для використання Resource.
        </p>
        <ol>
          <li>
            Реалізуйте <code>toArray()</code> у
            <code>TagResource</code>: поля <code>id</code>, <code>name</code>
            та умовний <code>tasks_count</code> через
            <code>$this->when(isset($this->tasks_count), ...)</code>
          </li>
          <li>
            У циклі виведіть кожен тег у форматі:
            <code>Тег N: id=X, name=Y, tasks_count=Z</code>
          </li>
          <li>
            Автотест перевірить правильність даних автоматично
          </li>
        </ol>
        <p>
          Підказка: <code>tasks_count</code> вже є в об'єктах —
          просто зверніться до <code>$tag->tasks_count</code>.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте TagResource та оновіть контролер"
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
