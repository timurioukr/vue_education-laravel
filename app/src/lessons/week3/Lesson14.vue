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
    question: 'Що відбувається, коли метод Policy (наприклад, update()) повертає false?',
    options: [
      'Laravel повертає null',
      'Laravel логує помилку і продовжує виконання контролера',
      '$this->authorize() кидає AuthorizationException → Laravel автоматично повертає 403 Forbidden',
      'Контролер отримує false і має сам його обробити',
    ],
    correct: 2,
    explanation:
      'Коли метод Policy повертає false, $this->authorize() кидає Illuminate\\Auth\\Access\\AuthorizationException. Laravel exception handler перехоплює його і конвертує у JSON-відповідь з HTTP-статусом 403 Forbidden та повідомленням «This action is unauthorized.» (можна кастомізувати через Response::deny()).',
  },
  {
    question: 'Яка ключова різниця між Gate та Policy?',
    options: [
      'Gate працює з моделями, Policy — з ролями',
      'Gate — для простих closure-перевірок, не привʼязаних до моделі; Policy — для CRUD-операцій над конкретною моделлю',
      'Це синоніми — однакова функціональність, різний синтаксис',
      'Gate працює лише на фронтенді, Policy — на бекенді',
    ],
    correct: 1,
    explanation:
      'Gate підходить для глобальних перевірок (is_admin, has_premium, доступ до адмін-панелі). Policy — це окремий клас з CRUD-методами (viewAny, view, create, update, delete) для однієї конкретної моделі. Правило: якщо перевірка стосується ресурсу — Policy; якщо просто роль/підписка — Gate.',
  },
  {
    question: 'Як Laravel знаходить TaskPolicy для моделі Task без ручної реєстрації?',
    options: [
      'Через запис у config/auth.php',
      'За конвенцією auto-discovery: App\\Policies\\TaskPolicy для App\\Models\\Task',
      'Потрібно додати трейт HasPolicy до моделі',
      'Потрібно прописати у масиві $policies в AuthServiceProvider',
    ],
    correct: 1,
    explanation:
      'Laravel автоматично шукає клас App\\Policies\\{Model}Policy. Якщо ви дотримуєтесь цієї конвенції — жодної реєстрації не потрібно. Якщо назва відрізняється, треба явно зареєструвати: Gate::policy(Task::class, CustomPolicy::class) у AppServiceProvider::boot().',
  },
  {
    question: 'Для чого потрібен метод before() у класі Policy?',
    options: [
      'Виконується ПІСЛЯ основного методу для логування',
      'Реєструє Policy у контейнері Laravel',
      'Виконується ПЕРЕД будь-яким методом Policy; якщо повертає не-null — результат використовується без виклику основного методу',
      'Перевіряє, що користувач автентифікований',
    ],
    correct: 2,
    explanation:
      'Класичний use-case before() — «адмін може все»: if ($user->is_admin) return true. Тоді update/delete/view не викликаються взагалі. ⚠️ Дуже важливо повертати null для звичайних користувачів — інакше всі дії будуть заблоковані. Повертайте bool тільки для override.',
  },
  {
    question: 'Що правильно передати другим аргументом у $this->authorize() для viewAny та create?',
    options: [
      'Інстанс моделі ($task)',
      'Масив усіх моделей',
      'Клас моделі (Task::class), бо конкретного інстансу ще не існує',
      'Нічого — другий аргумент опціональний',
    ],
    correct: 2,
    explanation:
      "Для viewAny (список) і create (нова задача) ще немає конкретного $task — тому передаємо клас: $this->authorize('create', Task::class). Laravel визначить TaskPolicy за класом і викличе відповідний метод. Для view/update/delete передаємо інстанс ($task), бо потрібно перевірити власника саме цього ресурсу.",
  },
]

// === CodeComparison: Vue usePermissions composable vs Laravel Policy ===
const jsUsePermissions = `// Vue/Composable — клієнтська перевірка прав
// (для UI: ховаємо/показуємо кнопки)
import { useAuthStore } from '@/stores/auth'

export function usePermissions() {
  const auth = useAuthStore()

  const canEdit = (task) =>
    task?.user_id === auth.user?.id

  const canDelete = (task) =>
    task?.user_id === auth.user?.id

  const canAccessAdmin = () =>
    auth.user?.is_admin === true

  return { canEdit, canDelete, canAccessAdmin }
}

// Використання у компоненті
const { canEdit, canDelete } = usePermissions()
// <button v-if="canEdit(task)">Edit</button>
// <button v-if="canDelete(task)">Delete</button>

// ⚠️ Це лише для UI (UX).
// Сервер ОБОВʼЯЗКОВО має перевірити це ще раз —
// клієнт можна обійти через DevTools.`

const phpTaskPolicy = `<?php
// Laravel — серверне джерело правди
namespace App\\Policies;

use App\\Models\\Task;
use App\\Models\\User;

class TaskPolicy
{
    /**
     * Глобальний override: адмін може все.
     * Виконується ПЕРЕД усіма методами нижче.
     * Повертайте null для звичайних користувачів!
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->is_admin ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true; // кожен бачить свій список
    }

    public function view(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $task->user_id === $user->id;
    }
}`

// === CodeBlock: ручна перевірка vs $this->authorize() ===
const beforeAfterCode = `<?php

// ❌ Урок 13 — ручна перевірка, дублюється в show/update/destroy
public function update(UpdateTaskRequest $request, Task $task)
{
    if ($task->user_id !== $request->user()->id) {
        return response()->json(['message' => 'Not found.'], 404);
    }

    $task->update($request->validated());

    return new TaskResource($task);
}

// ✅ Урок 14 — Policy + $this->authorize()
public function update(UpdateTaskRequest $request, Task $task)
{
    $this->authorize('update', $task); // → 403, якщо Policy::update() = false

    $task->update($request->validated());

    return new TaskResource($task);
}

// 4 рядки vs 2. Логіка авторизації — в одному місці (TaskPolicy).
// Жодного дублювання, жодних шансів забути перевірку.`

// === CodeBlock: Gate definition ===
const gatesCode = `<?php

// app/Providers/AppServiceProvider.php
use Illuminate\\Support\\Facades\\Gate;

public function boot(): void
{
    // Gate — closure-based перевірка, НЕ привʼязана до моделі
    Gate::define('access-admin', fn ($user) => $user->is_admin);

    Gate::define('view-stats', fn ($user) =>
        $user->is_admin || $user->role === 'manager'
    );

    // Перевірка з контекстом (не модель, але дані)
    Gate::define('publish-post', fn ($user, $post) =>
        $user->id === $post->author_id || $user->is_editor
    );
}

// === Використання Gate ===

// 1. У контролері — boolean check
if (Gate::allows('access-admin')) { /* ... */ }
if (Gate::denies('access-admin')) { abort(403); }

// 2. Скорочений варіант — кидає 403 автоматично
Gate::authorize('access-admin');

// 3. На маршруті як middleware (без коду в контролері)
Route::get('/admin/stats', [AdminController::class, 'stats'])
    ->middleware('can:access-admin');

// 4. На моделі User
$user->can('access-admin');     // true/false
$user->cannot('access-admin');  // протилежне`

// === CodeBlock: 4 способи використання Policy в контролері ===
const policyUsageCode = `<?php

// === Спосіб 1: $this->authorize() — рекомендований ===
class TaskController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Task::class); // клас, не інстанс
        return TaskResource::collection($request->user()->tasks);
    }

    public function show(Task $task)
    {
        $this->authorize('view', $task); // інстанс
        return new TaskResource($task);
    }

    public function store(StoreTaskRequest $request)
    {
        $this->authorize('create', Task::class); // ще немає $task
        // ...
    }
}

// === Спосіб 2: Gate::authorize() — поза контролером ===
use Illuminate\\Support\\Facades\\Gate;

public function update(Request $request, Task $task)
{
    Gate::authorize('update', $task);
    // ...
}

// === Спосіб 3: $user->can() / cannot() — контроль повідомлення ===
public function destroy(Request $request, Task $task)
{
    if ($request->user()->cannot('delete', $task)) {
        abort(403, 'You do not own this task.');
    }
    $task->delete();
}

// === Спосіб 4: Middleware на маршруті — перевірка ще до контролера ===
// routes/api.php
Route::put('/tasks/{task}', [TaskController::class, 'update'])
    ->middleware('can:update,task');
// 'can:update,task' → викликає TaskPolicy@update($user, $task)`

// === CodeBlock: Response::deny() з кастомним повідомленням ===
const policyResponseCode = `<?php

namespace App\\Policies;

use App\\Models\\Task;
use App\\Models\\User;
use Illuminate\\Auth\\Access\\Response;

class TaskPolicy
{
    /**
     * Замість простого true/false — повертаємо Response з повідомленням.
     */
    public function update(User $user, Task $task): Response
    {
        return $task->user_id === $user->id
            ? Response::allow()
            : Response::deny('You do not own this task.');
    }
}

// Тоді 403-відповідь матиме кастомний message:
// {
//     "message": "You do not own this task."
// }
//
// Замість дефолтного:
// {
//     "message": "This action is unauthorized."
// }`

// === Practice: симуляція Policy + authorize() ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо Laravel Policy + $this->authorize() на чистому PHP.
// Показує, чому Policy краще за ручні перевірки.

// === "БД" ===
$users = [
    1 => ['id' => 1, 'name' => 'Alice', 'is_admin' => false],
    2 => ['id' => 2, 'name' => 'Bob',   'is_admin' => false],
    3 => ['id' => 3, 'name' => 'Admin', 'is_admin' => true],
];
$tasks = [
    1 => ['id' => 1, 'title' => 'Alice task', 'user_id' => 1],
    2 => ['id' => 2, 'title' => 'Bob secret', 'user_id' => 2],
];

// === AuthorizationException — кидаємо при відмові ===
class AuthorizationException extends \\Exception {}

// === TaskPolicy ===
class TaskPolicy
{
    /**
     * before() — глобальний override: адмін може все.
     * Повертає null для звичайних → перевіряємо інші методи.
     */
    public function before(array $user, string $ability): ?bool
    {
        if ($user['is_admin']) {
            return true;
        }
        return null;
    }

    public function viewAny(array $user): bool { return true; }
    public function create (array $user): bool { return true; }

    public function view  (array $user, array $task): bool { return $task['user_id'] === $user['id']; }
    public function update(array $user, array $task): bool { return $task['user_id'] === $user['id']; }
    public function delete(array $user, array $task): bool { return $task['user_id'] === $user['id']; }
}

// === Емуляція $this->authorize() ===
function authorize(array $user, string $ability, mixed $resource): void
{
    $policy = new TaskPolicy();

    // 1. before() — якщо не-null, використовуємо його результат
    $beforeResult = $policy->before($user, $ability);
    if ($beforeResult !== null) {
        if ($beforeResult === true) return; // дозволено
        throw new AuthorizationException('This action is unauthorized.');
    }

    // 2. Викликаємо конкретний метод (view, update, delete...)
    $allowed = is_array($resource)
        ? $policy->{$ability}($user, $resource) // для view/update/delete
        : $policy->{$ability}($user);            // для viewAny/create
    if (! $allowed) {
        throw new AuthorizationException('This action is unauthorized.');
    }
}

// === Емуляція контролера ===
function updateTask(array $user, int $taskId, array $newData): array
{
    global $tasks;
    $task = $tasks[$taskId] ?? throw new \\RuntimeException('Task not found');

    authorize($user, 'update', $task); // ← Policy робить всю роботу

    $tasks[$taskId] = array_merge($task, $newData);
    return ['status' => 200, 'task' => $tasks[$taskId]];
}

// ====== Сценарії ======
$alice = $users[1];
$bob   = $users[2];
$admin = $users[3];

echo "1) Alice оновлює свою задачу #1 → дозволено\\n";
try {
    $r = updateTask($alice, 1, ['title' => 'Updated by Alice']);
    echo "   ✓ status={$r['status']}, title={$r['task']['title']}\\n\\n";
} catch (AuthorizationException $e) {
    echo "   ✗ забороно: {$e->getMessage()}\\n\\n";
}

echo "2) Bob намагається оновити задачу Alice → 403\\n";
try {
    updateTask($bob, 1, ['title' => 'Hacked by Bob']);
    echo "   ✗ помилка: пройшло, а мало впасти\\n\\n";
} catch (AuthorizationException $e) {
    echo "   ✓ заблоковано: {$e->getMessage()}\\n\\n";
}

echo "3) Admin оновлює чужу задачу #2 (Bob's) → дозволено через before()\\n";
try {
    $r = updateTask($admin, 2, ['title' => 'Reviewed by admin']);
    echo "   ✓ status={$r['status']}, title={$r['task']['title']}\\n\\n";
} catch (AuthorizationException $e) {
    echo "   ✗ забороно: {$e->getMessage()}\\n\\n";
}

echo "4) Bob видаляє свою задачу #2 → дозволено (delete = update логіка)\\n";
$policy = new TaskPolicy();
echo "   policy->delete = " . ($policy->delete($bob, $tasks[2]) ? 'true' : 'false') . "\\n\\n";

echo "5) Bob намагається видалити задачу Alice → false\\n";
echo "   policy->delete = " . ($policy->delete($bob, $tasks[1]) ? 'true' : 'false') . "\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте Gate access-admin, before() та CategoryPolicy.
 *
 * Контекст: Sanctum (Урок 13) уже впізнає користувача,
 * тепер додаємо повноцінну авторизацію.
 *
 * Реалізуйте 4 функції:
 *
 *  1) gateAccessAdmin(array $user): bool
 *     true якщо $user['is_admin'] === true
 *
 *  2) policyBefore(array $user, string $ability): ?bool
 *     адмін → true; інші → null (щоб основний метод викликався)
 *
 *  3) policyUpdate(array $user, array $category): bool
 *     true якщо $category['user_id'] === $user['id']
 *
 *  4) authorizeAction(array $user, string $ability, ?array $category): void
 *     1) спочатку policyBefore() — якщо не-null, використати його;
 *     2) якщо null → викликати policyUpdate (для 'update') або policyView (для 'view').
 *     При відмові — кинути AuthorizationException.
 *     ⚠️ 'view' — теж лише власник; 'create' — будь-кому дозволено.
 */

class AuthorizationException extends \\Exception {}

$users = [
    1 => ['id' => 1, 'is_admin' => false],
    2 => ['id' => 2, 'is_admin' => false],
    3 => ['id' => 3, 'is_admin' => true],
];

$categories = [
    10 => ['id' => 10, 'name' => 'Work',     'user_id' => 1],
    20 => ['id' => 20, 'name' => 'Personal', 'user_id' => 2],
];

function gateAccessAdmin(array $user): bool {
    // Ваш код тут
}

function policyBefore(array $user, string $ability): ?bool {
    // Ваш код тут
}

function policyView(array $user, array $category): bool {
    // Ваш код тут
}

function policyUpdate(array $user, array $category): bool {
    // Ваш код тут
}

function policyCreate(array $user): bool {
    // Ваш код тут (підказка: будь-якому автентифікованому)
}

function authorizeAction(array $user, string $ability, ?array $category = null): void {
    // 1. policyBefore — якщо не-null, використати
    // 2. для 'view'/'update' викликати відповідний метод з $category
    // 3. для 'create' — без $category
    // 4. при відмові — throw new AuthorizationException('This action is unauthorized.')
    //
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 8;

$alice = $users[1];
$bob   = $users[2];
$admin = $users[3];
$work     = $categories[10]; // user_id = 1 (Alice)
$personal = $categories[20]; // user_id = 2 (Bob)

// 1. Gate
if (gateAccessAdmin($admin) === true && gateAccessAdmin($alice) === false) {
    echo "✓ gateAccessAdmin: розрізняє адміна та звичайного user\\n"; $pass++;
} else {
    echo "✗ gateAccessAdmin: помилка\\n";
}

// 2. before() для адміна
if (policyBefore($admin, 'update') === true) {
    echo "✓ policyBefore: адмін → true\\n"; $pass++;
} else {
    echo "✗ policyBefore: адмін має повертати true\\n";
}

// 3. before() для звичайного → null (КРИТИЧНО!)
if (policyBefore($alice, 'update') === null) {
    echo "✓ policyBefore: звичайний user → null (перевірка йде далі)\\n"; $pass++;
} else {
    echo "✗ policyBefore: для не-адміна МАЄ бути null, інакше всі дії заблоковані\\n";
}

// 4. Update своєї категорії
if (policyUpdate($alice, $work) === true) {
    echo "✓ policyUpdate: власник може оновити\\n"; $pass++;
} else {
    echo "✗ policyUpdate: власник має могти оновити\\n";
}

// 5. Update чужої категорії
if (policyUpdate($bob, $work) === false) {
    echo "✓ policyUpdate: НЕ-власник заблокований\\n"; $pass++;
} else {
    echo "✗ policyUpdate: чужий не має могти оновити\\n";
}

// 6. authorizeAction для власника — без винятку
try {
    authorizeAction($alice, 'update', $work);
    echo "✓ authorizeAction: Alice оновлює Work — пройшло\\n"; $pass++;
} catch (AuthorizationException $e) {
    echo "✗ authorizeAction: Alice мала пройти, але було заблоковано\\n";
}

// 7. authorizeAction для не-власника — кидає AuthorizationException
try {
    authorizeAction($bob, 'update', $work);
    echo "✗ authorizeAction: Bob мав отримати 403, але пройшов\\n";
} catch (AuthorizationException $e) {
    echo "✓ authorizeAction: Bob → AuthorizationException (як 403)\\n"; $pass++;
}

// 8. authorizeAction: адмін може все (через before())
try {
    authorizeAction($admin, 'update', $work);
    echo "✓ authorizeAction: admin → дозволено через before()\\n"; $pass++;
} catch (AuthorizationException $e) {
    echo "✗ authorizeAction: admin має могти все, але був заблокований\\n";
}

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="usePermissions() composable у Vue"
        to="Policy + $this->authorize() у Laravel"
      />

      <TheoryBlock title="Чому ручних перевірок недостатньо">
        <p>
          У Уроці 13 ми написали <code>if ($task->user_id !== $request->user()->id)</code> у кожному
          CRUD-методі. Це працює, але має чотири проблеми:
        </p>
        <ul>
          <li>
            <strong>Дублювання</strong> — той самий <code>if</code> копіюється в
            <code>show / update / destroy</code>.
          </li>
          <li><strong>Розкидані правила</strong> — логіка авторизації розмазана по контролерах.</li>
          <li>
            <strong>Легко забути</strong> — додали новий ендпоінт без перевірки →
            <em>data leak</em>.
          </li>
          <li>
            <strong>Немає єдиного джерела правди</strong> — де подивитись усі правила доступу для
            Task?
          </li>
        </ul>
        <p>
          <strong>Policy</strong> — це окремий клас, де зібрані всі правила доступу для однієї
          моделі. Точно як композабл <code>usePermissions()</code> у Vue, тільки на сервері і з
          автоматичною інтеграцією у контролер.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="beforeAfterCode"
        lang="php"
        title="До (ручна перевірка) vs Після ($this->authorize)"
      />

      <TheoryBlock title="Gates — closure-based перевірки">
        <p>
          <strong>Gate</strong> — найпростіша форма авторизації. Це closure, що приймає користувача
          (та опціонально — додаткові аргументи) і повертає bool. Ідеальний для глобальних
          перевірок, які <em>не</em> привʼязані до конкретної моделі: ролі ( <code>is_admin</code>),
          підписки (<code>has_premium</code>), доступ до адмін-панелі.
        </p>
        <p>
          Gate можна використати чотирма способами: <code>Gate::allows()</code>,
          <code>Gate::authorize()</code> (кидає 403), middleware <code>can:gate-name</code> прямо на
          маршруті, або <code>$user->can('gate-name')</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="gatesCode" lang="php" title="Gates: визначення та використання" />

      <CodeComparison
        :js="jsUsePermissions"
        :php="phpTaskPolicy"
        js-title="Vue — usePermissions() для UI"
        php-title="Laravel — TaskPolicy (серверна правда)"
      />

      <TheoryBlock title="Policies — клас на модель">
        <p>
          Policy — це клас, що містить методи авторизації для однієї моделі. Стандартні методи
          відповідають CRUD-операціям:
        </p>
        <ul>
          <li><code>viewAny(User $user)</code> — чи може бачити <em>список</em> ресурсів?</li>
          <li><code>view(User $user, Task $task)</code> — чи може бачити конкретний?</li>
          <li><code>create(User $user)</code> — чи може створювати?</li>
          <li><code>update(User $user, Task $task)</code> — чи може оновити?</li>
          <li><code>delete(User $user, Task $task)</code> — чи може видалити?</li>
          <li><code>restore</code> / <code>forceDelete</code> — для soft-deleted моделей.</li>
        </ul>
        <p>
          Створюється однією командою:
          <code>php artisan make:policy TaskPolicy --model=Task</code> — Laravel згенерує клас з
          усіма CRUD-методами, типізованими під вашу модель.
        </p>
      </TheoryBlock>

      <TheoryBlock title="Auto-discovery — без ручної реєстрації">
        <p>
          Laravel <strong>сам</strong> знаходить Policy за конвенцією:
          <code>App\Models\Task</code> → <code>App\Policies\TaskPolicy</code>. Дотримуєтесь
          конвенції — нічого не реєструєте. Якщо назва відрізняється — додайте у
          <code>AppServiceProvider::boot()</code>:
          <code>Gate::policy(Task::class, CustomPolicy::class)</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="policyUsageCode" lang="php" title="4 способи викликати Policy" />

      <TheoryBlock title="Response::allow() / deny() — кастомні повідомлення">
        <p>
          За замовчуванням 403-відповідь має дефолтне повідомлення
          <code>«This action is unauthorized.»</code>. Якщо потрібно своє — поверніть з методу
          Policy не <code>bool</code>, а <code>Illuminate\Auth\Access\Response</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="policyResponseCode"
        lang="php"
        title="Кастомне повідомлення через Response::deny()"
      />

      <TheoryBlock title="before() — глобальний override (найкорисніший приклад: адмін)">
        <p>
          Метод <code>before()</code> у Policy виконується <strong>перед</strong> усіма іншими
          методами. Якщо повертає <code>true</code> — доступ дозволений, основний метод
          <em>не</em> викликається. Якщо <code>false</code> — заблоковано, основний метод теж не
          викликається. Якщо <code>null</code> — Laravel продовжує і викликає звичайний метод.
        </p>
        <p>
          ⚠️ <strong>Дуже важливо повертати null для звичайних користувачів.</strong> Якщо повернете
          <code>false</code> у before() — взагалі ВСІ дії будуть заблоковані для всіх не-адмінів. Це
          найчастіша помилка у новачків.
        </p>
        <p>
          Аналогія у Vue: глобальний router guard, що пропускає адміна повз
          <code>requiresAuth</code> meta. Тільки в Laravel це робиться централізовано в Policy, а не
          в кожному guard.
        </p>
      </TheoryBlock>
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: симуляція $this->authorize() з Policy">
        <p>
          У playground ми <strong>симулюємо</strong> <code>TaskPolicy</code>, метод
          <code>before()</code> і <code>$this->authorize()</code> на чистому PHP. Сценарій показує
          всі ключові випадки: власник може, не-власник отримує 403, адмін проходить через
          <code>before()</code>.
        </p>
        <p>
          Запустіть код. Спробуйте поміняти <code>is_admin</code> у користувачів або зробити
          <code>before()</code> жадібним (замість <code>null</code> повернути <code>false</code>) —
          побачите, що ВСІ перевірки одразу зламаються.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/14-policies.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="3-14" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: Gate, before() і CategoryPolicy у дії">
        <p>
          Реалізуйте п'ять функцій, які разом утворюють робочу систему авторизації для категорій.
          Натисніть <strong>«Запустити»</strong> — 8 авто-тестів перевірять вашу логіку.
        </p>
        <ol>
          <li>
            <strong>gateAccessAdmin($user)</strong> — Gate <code>access-admin</code>:
            <code>true</code>, якщо <code>$user['is_admin']</code> = true.
          </li>
          <li>
            <strong>policyBefore($user, $ability)</strong> — глобальний override: адмін →
            <code>true</code>; всі інші → <strong>null</strong> (саме <em>null</em>, не false! —
            інакше заблокуєте всіх).
          </li>
          <li>
            <strong>policyView / policyUpdate ($user, $category)</strong> — <code>true</code>, якщо
            <code>$category['user_id']</code> === <code>$user['id']</code>.
          </li>
          <li>
            <strong>policyCreate($user)</strong> — будь-який автентифікований може створювати
            (просто <code>true</code>).
          </li>
          <li>
            <strong>authorizeAction($user, $ability, ?$category)</strong> — імітує
            <code>$this->authorize()</code>: спочатку <code>before()</code>, потім конкретний метод;
            при відмові — <code>throw new AuthorizationException(...)</code>.
          </li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте Gate, before() і CategoryPolicy"
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
