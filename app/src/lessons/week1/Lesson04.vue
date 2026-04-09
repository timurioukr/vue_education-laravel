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

const routeComparisonJs = `// Vue Router
{
  path: '/tasks',
  component: TaskList
}`

const routeComparisonPhp = `// Laravel routes/api.php
Route::get('/tasks', [TaskController::class, 'index']);`

const paramComparisonJs = `// Vue Router
{
  path: '/tasks/:id',
  component: TaskDetail
}

// Доступ до параметра
const route = useRoute()
const taskId = route.params.id`

const paramComparisonPhp = `// Laravel
Route::get('/tasks/{id}', function (string $id) {
    return response()->json(['task_id' => $id]);
});`

const apiResourceCode = `// Один рядок замість п'яти окремих маршрутів
Route::apiResource('tasks', TaskController::class);

// Це згенерує:
// GET    /api/tasks          -> index
// POST   /api/tasks          -> store
// GET    /api/tasks/{task}   -> show
// PUT    /api/tasks/{task}   -> update
// DELETE /api/tasks/{task}   -> destroy`

const groupComparisonJs = `// Vue Router -- вкладені маршрути
{
  path: '/admin',
  children: [
    { path: 'users', component: AdminUsers },
    { path: 'settings', component: AdminSettings }
  ]
}`

const groupComparisonPhp = `// Laravel -- групування з префіксом
Route::prefix('v1')->group(function () {
    Route::get('/tasks', fn () => ...);     // /api/v1/tasks
    Route::get('/categories', fn () => ...); // /api/v1/categories
});`

const makeControllerCommand = `$ php artisan make:controller TaskController --api

   INFO  Controller [app/Http/Controllers/TaskController.php] created successfully.`

const controllerCode = `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\Response;

class TaskController extends Controller
{
    // GET /api/tasks -- список всіх задач
    public function index(): JsonResponse
    {
        $tasks = Task::all();
        return response()->json($tasks);
    }

    // POST /api/tasks -- створити нову задачу
    public function store(Request $request): JsonResponse
    {
        $task = Task::create([
            'title' => $request->input('title'),
            'status' => 'pending',
            'priority' => $request->input('priority', 0),
        ]);
        return response()->json($task, 201);
    }

    // GET /api/tasks/{id} -- показати одну задачу
    public function show(string $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        return response()->json($task);
    }

    // PUT /api/tasks/{id} -- оновити задачу
    public function update(Request $request, string $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        $task->update($request->only(['title', 'status', 'priority']));
        return response()->json($task);
    }

    // DELETE /api/tasks/{id} -- видалити задачу
    public function destroy(string $id): Response
    {
        Task::findOrFail($id)->delete();
        return response()->noContent(); // 204
    }
}`

const routeListLines = [
  '$ php artisan route:list',
  '',
  '  GET|HEAD   api/tasks .............. tasks.index › TaskController@index',
  '  POST       api/tasks .............. tasks.store › TaskController@store',
  '  GET|HEAD   api/tasks/{task} ....... tasks.show › TaskController@show',
  '  PUT|PATCH  api/tasks/{task} ....... tasks.update › TaskController@update',
  '  DELETE     api/tasks/{task} ....... tasks.destroy › TaskController@destroy',
]

const routesFileCode = `<?php

use App\\Http\\Controllers\\TaskController;
use App\\Http\\Controllers\\CategoryController;
use Illuminate\\Support\\Facades\\Route;

// Тестовий ендпоінт
Route::get('/ping', function () {
    return response()->json([
        'message' => 'pong',
        'timestamp' => now()->toISOString(),
    ]);
});

// apiResource -- один рядок замість п'яти
Route::apiResource('tasks', TaskController::class);
Route::apiResource('categories', CategoryController::class);

// Група з версією API
Route::prefix('v1')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
});`

const curlTestLines = [
  '$ curl http://localhost:8000/api/tasks',
  '[{"id":1,"title":"Learn Laravel routing","status":"in_progress",...},',
  ' {"id":2,"title":"Build Task Manager API","status":"pending",...}]',
  '',
  '$ curl -X POST http://localhost:8000/api/tasks \\',
  '  -H "Content-Type: application/json" \\',
  '  -d \'{"title": "Write tests", "priority": 3}\'',
  '{"id":4,"title":"Write tests","status":"pending","priority":3,"created_at":"..."}',
  '',
  '$ curl -X DELETE http://localhost:8000/api/tasks/1 -w "\\nHTTP Status: %{http_code}\\n"',
  'HTTP Status: 204',
]

const tagControllerTask = `// 1. Створіть контролер:
// $ php artisan make:controller TagController --api

// 2. Додайте маршрути в routes/api.php:
Route::apiResource('tags', TagController::class);

// Вкладені маршрути: теги конкретної задачі
Route::get('/tasks/{task}/tags', [TagController::class, 'index']);
Route::post('/tasks/{task}/tags', [TagController::class, 'store']);
Route::delete('/tasks/{task}/tags/{tag}', [TagController::class, 'destroy']);

// 3. Заповніть контролер хардкоженими даними (як у TaskController)
// index() -> повертає масив тегів: [{id: 1, name: "urgent"}, ...]
// store() -> повертає новий тег з 201
// show() -> повертає один тег
// update() -> повертає оновлений тег
// destroy() -> повертає 204

// 4. Протестуйте:
// $ curl http://localhost:8000/api/tags
// $ curl http://localhost:8000/api/tasks/1/tags
// $ php artisan route:list`

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Що генерує Route::apiResource()?',
    options: [
      '1 маршрут (тільки GET)',
      '7 маршрутів (включаючи create та edit)',
      '5 маршрутів (index, store, show, update, destroy)',
      '3 маршрути (index, store, destroy)',
    ],
    correct: 2,
    explanation: 'apiResource генерує 5 REST-маршрутів для повного CRUD. На відміну від resource(), він не створює маршрути create та edit, бо вони потрібні тільки для HTML-форм, а в API їх немає.',
  },
  {
    question: 'Який HTTP-метод використовується для оновлення ресурсу?',
    options: [
      'POST',
      'GET',
      'PUT або PATCH',
      'DELETE',
    ],
    correct: 2,
    explanation: 'PUT або PATCH використовуються для оновлення. PUT зазвичай замінює ресурс повністю, а PATCH -- частково. Laravel обробляє обидва методи одним методом update() контролера.',
  },
  {
    question: 'Що робить prefix() в route group?',
    options: [
      'Додає middleware до всіх маршрутів групи',
      'Додає префікс до всіх маршрутів групи',
      'Змінює контролер для всіх маршрутів',
      'Додає суфікс до імен маршрутів',
    ],
    correct: 1,
    explanation: 'prefix() додає URL-префікс до всіх маршрутів у групі. Наприклад, Route::prefix("v1")->group(...) додасть /v1/ до кожного маршруту в групі.',
  },
  {
    question: 'Як передати параметр у маршруті Laravel?',
    options: [
      ':id (як у Vue Router)',
      '{id} (у фігурних дужках)',
      '$id (зі знаком долара)',
      '[id] (у квадратних дужках)',
    ],
    correct: 1,
    explanation: 'У Laravel параметри маршрутів записуються у фігурних дужках: {id}. У Vue Router використовується :id, але в Laravel -- саме {id}. Необов\'язковий параметр позначається {id?}.',
  },
  {
    question: 'Який файл відповідає за API маршрути в Laravel?',
    options: [
      'routes/web.php',
      'routes/api.php',
      'app/routes.php',
      'config/routes.php',
    ],
    correct: 1,
    explanation: 'Файл routes/api.php відповідає за API маршрути. Всі маршрути в ньому автоматично отримують префікс /api. Для веб-сторінок (HTML) є окремий файл routes/web.php.',
  },
]
</script>

<template>
  <!-- Theory Tab -->
  <div v-show="activeTab === 'theory'">
    <div class="lesson-content-blocks">
      <ParallelCard from="Vue Router routes[]" to="routes/api.php" />

      <TheoryBlock title="Маршрути в Laravel">
        <p>
          У Vue/Nuxt ви описуєте маршрути в <code>router/index.ts</code> або через файлову систему
          (<code>pages/</code>). В Laravel маршрути API живуть у файлі <code>routes/api.php</code>.
        </p>
        <p>
          <strong>Важливо:</strong> всі маршрути з <code>routes/api.php</code> автоматично отримують
          префікс <code>/api</code>. Тобто якщо ви напишете <code>Route::get('/tasks', ...)</code>,
          реальний URL буде <code>/api/tasks</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="routeComparisonJs"
        :php="routeComparisonPhp"
        js-title="Vue Router"
        php-title="Laravel Route"
      />

      <TheoryBlock title="Параметри маршрутів">
        <p>
          У Vue Router ви використовуєте <code>:id</code> для динамічних сегментів URL.
          В Laravel -- <code>{'{id}'}</code>. Необов'язковий параметр позначається знаком питання:
          <code>{'{id?}'}</code> -- як <code>?</code> в TypeScript.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="paramComparisonJs"
        :php="paramComparisonPhp"
        js-title="Vue Router параметри"
        php-title="Laravel параметри"
      />

      <TheoryBlock title="Групування маршрутів">
        <p>
          У Vue Router є <code>children</code> для вкладених маршрутів. В Laravel є
          <code>Route::group()</code> з <code>prefix()</code>, <code>middleware()</code>
          та <code>name()</code>. Це дозволяє організовувати маршрути в логічні групи
          з спільними налаштуваннями.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="groupComparisonJs"
        :php="groupComparisonPhp"
        js-title="Vue Router children"
        php-title="Laravel prefix + group"
      />

      <TheoryBlock title="apiResource -- магія одного рядка">
        <p>
          <code>Route::apiResource()</code> генерує 5 CRUD-маршрутів автоматично:
          <strong>index</strong> (список), <strong>store</strong> (створити),
          <strong>show</strong> (один запис), <strong>update</strong> (оновити),
          <strong>destroy</strong> (видалити). Це як автогенерація маршрутів у Nuxt через
          файлову структуру <code>pages/</code>, тільки для API.
        </p>
      </TheoryBlock>

      <CodeBlock lang="php" :code="apiResourceCode" title="Route::apiResource()" />

      <TheoryBlock title="Контролери">
        <p>
          Контролер -- це клас, який містить логіку обробки запитів. Уявіть, що контролер -- це
          ваш <code>&lt;script setup&gt;</code>, але для бекенду. Замість реактивних змінних
          і функцій у Vue, в контролері є методи, які обробляють HTTP-запити та повертають відповіді.
        </p>
        <p>
          Кожен метод відповідає за один ендпоінт: <code>index()</code> повертає список,
          <code>store()</code> створює запис, <code>show()</code> повертає один запис,
          <code>update()</code> оновлює, <code>destroy()</code> видаляє.
        </p>
      </TheoryBlock>
    </div>
  </div>

  <!-- Practice Tab -->
  <div v-show="activeTab === 'practice'">
    <div class="lesson-content-blocks">
      <TheoryBlock title="Крок 1: Створіть TaskController">
        <p>
          Використайте Artisan для створення API-контролера з 5 методами.
          Прапорець <code>--api</code> створить контролер без методів <code>create</code>
          та <code>edit</code>, які потрібні тільки для HTML-форм.
        </p>
      </TheoryBlock>

      <TerminalOutput :lines="makeControllerCommand.split('\n')" title="Створення контролера" />

      <TheoryBlock title="Крок 2: Заповніть контролер">
        <p>
          Відкрийте <code>app/Http/Controllers/TaskController.php</code> і додайте логіку
          до кожного з 5 методів. Спочатку можна використовувати хардкожені дані,
          а потім замінити на Eloquent-запити (Урок 6).
        </p>
      </TheoryBlock>

      <CodeBlock lang="php" :code="controllerCode" title="app/Http/Controllers/TaskController.php" :show-line-numbers="true" />

      <TheoryBlock title="Крок 3: Налаштуйте маршрути">
        <p>
          Замініть вміст <code>routes/api.php</code> на чистий варіант з контролерами та
          <code>apiResource</code>. Один рядок замість п'яти окремих маршрутів.
        </p>
      </TheoryBlock>

      <CodeBlock lang="php" :code="routesFileCode" title="routes/api.php" :show-line-numbers="true" />

      <TheoryBlock title="Крок 4: Перевірте список маршрутів">
        <p>
          Команда <code>php artisan route:list</code> -- це ваш "Vue Router devtools" для бекенду.
          Вона показує ВСІ зареєстровані маршрути з їхніми методами, URI та контролерами.
        </p>
      </TheoryBlock>

      <TerminalOutput :lines="routeListLines" title="php artisan route:list" />

      <TheoryBlock title="Крок 5: Протестуйте з curl">
        <p>
          Запустіть сервер командою <code>php artisan serve</code> і протестуйте всі ендпоінти
          через curl або Postman.
        </p>
      </TheoryBlock>

      <TerminalOutput :lines="curlTestLines" title="Тестування ендпоінтів" />
    </div>
  </div>

  <!-- Quiz Tab -->
  <div v-show="activeTab === 'quiz'">
    <Quiz :questions="quizQuestions" lesson-id="week1-lesson04" />
  </div>

  <!-- Task Tab -->
  <div v-show="activeTab === 'task'">
    <div class="lesson-content-blocks">
      <TheoryBlock title="Завдання: TagController та вкладені маршрути">
        <p>
          Створіть <code>TagController</code> з повним CRUD та додайте вкладені маршрути
          для тегів конкретної задачі. Це дозволить отримувати теги для задачі за URL
          <code>/api/tasks/1/tags</code>.
        </p>
        <ol>
          <li>Створіть <code>TagController</code> з прапорцем <code>--api</code></li>
          <li>Заповніть контролер хардкоженими даними (як у TaskController)</li>
          <li>Додайте маршрути <code>apiResource</code> та вкладені маршрути</li>
          <li>Протестуйте всі ендпоінти через curl</li>
          <li>Перевірте через <code>php artisan route:list</code></li>
        </ol>
      </TheoryBlock>

      <CodeBlock lang="php" :code="tagControllerTask" title="Підказки до завдання" :show-line-numbers="true" />
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
