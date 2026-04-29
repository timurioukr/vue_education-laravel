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
    question: 'Яка різниця між автентифікацією (authentication) та авторизацією (authorization)?',
    options: [
      'Це синоніми — означають одне й те саме',
      'Автентифікація — це «хто ти», авторизація — це «що тобі дозволено»',
      'Автентифікація — це «що тобі дозволено», авторизація — це «хто ти»',
      'Автентифікація — лише для API, авторизація — лише для веб-сторінок',
    ],
    correct: 1,
    explanation:
      'Автентифікація перевіряє особу (email + пароль → токен), а авторизація перевіряє права доступу (чи може цей користувач видалити саме цю задачу). Sanctum відповідає за автентифікацію, Policies/Gates (Урок 14) — за авторизацію.',
  },
  {
    question: "Що повертає $user->createToken('auth-token')->plainTextToken?",
    options: [
      'Хешований пароль користувача',
      'JWT токен з payload (header.payload.signature)',
      'Plain-text API-токен у форматі {id}|{random_string}',
      'Сесійний cookie',
    ],
    correct: 2,
    explanation:
      'Sanctum повертає рядок типу 1|abc123…, де 1 — id токена в БД, а abc123… — випадковий рядок. У БД зберігається лише SHA-256 хеш другої частини. Plain-text видається ОДИН раз — при створенні; якщо клієнт його загубить, доведеться створювати новий токен.',
  },
  {
    question:
      'Який HTTP-статус повертає middleware auth:sanctum, якщо токен відсутній або невалідний?',
    options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
    correct: 1,
    explanation:
      'Middleware auth:sanctum повертає 401, коли токена немає або він невалідний/прострочений (питання автентифікації — «хто ти?»). 403 використовується для авторизації — токен валідний, але дій бракує прав.',
  },
  {
    question: 'Як правильно отримати задачі тільки поточного користувача в захищеному маршруті?',
    options: [
      'Task::all()',
      "Task::where('user_id', 1)->get()",
      '$request->user()->tasks()->get()',
      'Task::findByUser($request->user())',
    ],
    correct: 2,
    explanation:
      'Підхід через відношення hasMany ($request->user()->tasks()) автоматично додає WHERE user_id = ? і дозволяє чейнити scopes ($request->user()->tasks()->pending()). Варіант (b) спрацює, але захардкоджений id небезпечний; (a) поверне задачі ВСІХ користувачів — катастрофа з privacy.',
  },
  {
    question:
      'Як видалити ТІЛЬКИ поточний токен (logout з одного пристрою), не чіпаючи інші сесії?',
    options: [
      '$request->user()->tokens()->delete()',
      '$request->user()->currentAccessToken()->delete()',
      'Auth::logout()',
      'session()->flush()',
    ],
    correct: 1,
    explanation:
      'currentAccessToken() повертає саме той токен, що використаний у поточному запиті. tokens()->delete() прибере ВСІ токени (це для logout-all). Auth::logout() та session()->flush() стосуються web-сесій, а не Sanctum API-токенів.',
  },
]

// === CodeComparison: Vue authStore vs Laravel HasApiTokens ===
const jsAuthStore = `// Vue/Pinia — клієнтський authStore
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: null,
  }),

  actions: {
    async login(email, password) {
      const { data } = await axios.post(
        '/api/login',
        { email, password }
      )
      this.token = data.token
      this.user = data.user
      localStorage.setItem('token', data.token)
      // Axios interceptor додаватиме Bearer-заголовок
    },

    async logout() {
      await axios.post('/api/logout')
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },
  },
})

// ⚠️ user тут — це КЕШ.
// Справжня перевірка завжди на бекенді.`

const phpHasApiTokens = `<?php
// Laravel — серверний джерело правди

namespace App\\Models;

use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Laravel\\Sanctum\\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens; // ← дає методи токенів

    protected $fillable = ['name', 'email', 'password'];

    protected $hidden  = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            // ✅ автохешування пароля при присвоєнні
            'password' => 'hashed',
        ];
    }
}

// Створення токена:
$token = $user->createToken('auth-token')->plainTextToken;
// "1|abc123def456..." — повертаємо ОДИН раз клієнту

// Логаут одного пристрою:
$request->user()->currentAccessToken()->delete();

// Логаут з усіх пристроїв:
$request->user()->tokens()->delete();`

// === CodeBlock: Sanctum token flow diagram ===
const tokenFlowDiagram = `Vue App                          Laravel API
  |                                  |
  |-- POST /api/login -------------->|
  |   { email, password }            |-- перевіряє credentials (Hash::check)
  |                                  |-- $user->createToken(...) → запис у БД
  |<-- { user, token } --------------|   (зберігається лише SHA-256 хеш)
  |                                  |
  |-- GET /api/tasks --------------->|
  |   Authorization: Bearer 1|abc... |-- Sanctum знаходить токен
  |                                  |-- визначає user_id
  |<-- [ {task1}, {task2}, ... ] ---|-- повертає задачі цього user
  |                                  |
  |-- POST /api/logout ------------->|
  |   Authorization: Bearer 1|abc... |-- currentAccessToken()->delete()
  |<-- { message: 'Logged out' } ---|   (рядок з БД видалено → токен миттєво невалідний)`

// === CodeBlock: AuthController ===
const authControllerCode = `<?php

namespace App\\Http\\Controllers;

use App\\Models\\User;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Validation\\Rules\\Password;

class AuthController extends Controller
{
    /**
     * POST /api/register
     * Аналог: handleSubmit() у Vue компоненті RegisterForm.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            // 'confirmed' → клієнт має надіслати password_confirmation
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        // Пароль автоматично хешується завдяки cast 'password' => 'hashed'
        $user = User::create($validated);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * POST /api/login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        // ⚠️ Однакове повідомлення для обох випадків — щоб не підказати атакуючому,
        // що саме невірно (email чи пароль).
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    /**
     * POST /api/logout — видаляє ТІЛЬКИ поточний токен.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/me — поточний користувач за токеном.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}`

// === CodeBlock: routes/api.php ===
const routesCode = `<?php

use App\\Http\\Controllers\\AuthController;
use App\\Http\\Controllers\\CategoryController;
use App\\Http\\Controllers\\TaskController;
use Illuminate\\Support\\Facades\\Route;

// Публічні маршрути (без автентифікації)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Захищені маршрути — потрібен валідний Bearer-токен
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    Route::apiResource('tasks',      TaskController::class);
    Route::apiResource('categories', CategoryController::class);
});

// Без токена → 401 Unauthorized
// З токеном  → запит проходить, $request->user() поверне модель User`

// === CodeBlock: scoping by user ===
const scopingCode = `<?php

// app/Http/Controllers/TaskController.php

class TaskController extends Controller
{
    /**
     * GET /api/tasks — задачі ПОТОЧНОГО користувача.
     *
     * ❌ Раніше: Task::all() — повертало ВСІ задачі (privacy disaster).
     * ✅ Тепер:  $request->user()->tasks() — лише свої.
     */
    public function index(Request $request): JsonResponse
    {
        $tasks = $request->user()
            ->tasks()
            ->with(['category', 'tags'])
            ->latest()
            ->paginate(15);

        return TaskResource::collection($tasks)->response();
    }

    /**
     * POST /api/tasks — створення задачі автоматично з user_id.
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        // create() через відношення додає user_id автоматично
        $task = $request->user()->tasks()->create($request->validated());

        return (new TaskResource($task->load(['category', 'tags'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/tasks/{task} — повертаємо 404 (а не 403),
     * щоб не розкривати існування чужих ресурсів.
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return (new TaskResource($task->load(['category', 'tags'])))->response();
    }
}

// 📝 У наступному уроці (Урок 14) ці ручні перевірки замінимо на Policy.`

// === CodeBlock: Token Abilities ===
const tokenAbilitiesCode = `<?php

// Створюємо токен з обмеженим набором дозволів
$token = $user->createToken(
    'mobile-app',
    ['task:read', 'task:create'] // ← без task:delete!
);

// У контролері перевіряємо ability перед дією
public function destroy(Request $request, Task $task): Response
{
    if (! $request->user()->tokenCan('task:delete')) {
        abort(403, 'This token cannot delete tasks.');
    }

    // ... виконуємо видалення
}

// 💡 Use case:
//  - мобільний додаток отримує лише task:read
//  - веб-додаток — повний набір abilities
// Це аналог OAuth scopes: один user — кілька токенів з різними правами.`

// === Practice: симуляція AuthController на чистому PHP ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо логіку AuthController без Laravel — на голому PHP.
// Це допомагає зрозуміти ЩО саме робить Sanctum під капотом.

// === "База даних" у пам'яті ===
$users  = [];          // [id => ['id', 'name', 'email', 'password' (hash)]]
$tokens = [];          // [plain => ['user_id', 'name', 'created_at']]
$nextUserId  = 1;
$nextTokenId = 1;

// === Утиліти ===
function hashPassword(string $plain): string {
    // Аналог bcrypt() / Hash::make() в Laravel
    return password_hash($plain, PASSWORD_BCRYPT);
}

function checkPassword(string $plain, string $hash): bool {
    // Аналог Hash::check()
    return password_verify($plain, $hash);
}

function makePlainToken(int $tokenId): string {
    // Sanctum-формат: "{id}|{random}"
    return $tokenId . '|' . bin2hex(random_bytes(20));
}

// === register() ===
function register(array $payload): array {
    global $users, $tokens, $nextUserId, $nextTokenId;

    foreach ($users as $u) {
        if ($u['email'] === $payload['email']) {
            return ['status' => 422, 'body' => ['message' => 'Email already used.']];
        }
    }

    $user = [
        'id'       => $nextUserId++,
        'name'     => $payload['name'],
        'email'    => $payload['email'],
        'password' => hashPassword($payload['password']), // ✅ хешуємо
    ];
    $users[$user['id']] = $user;

    $plain = makePlainToken($nextTokenId++);
    $tokens[$plain] = ['user_id' => $user['id'], 'name' => 'auth-token'];

    return [
        'status' => 201,
        'body'   => ['user' => arrayWithoutPassword($user), 'token' => $plain],
    ];
}

// === login() ===
function login(array $payload): array {
    global $users, $tokens, $nextTokenId;

    $user = null;
    foreach ($users as $u) {
        if ($u['email'] === $payload['email']) { $user = $u; break; }
    }

    // ⚠️ Однакове повідомлення для "немає user" та "невірний пароль"
    if (! $user || ! checkPassword($payload['password'], $user['password'])) {
        return ['status' => 401, 'body' => ['message' => 'The provided credentials are incorrect.']];
    }

    $plain = makePlainToken($nextTokenId++);
    $tokens[$plain] = ['user_id' => $user['id'], 'name' => 'auth-token'];

    return ['status' => 200, 'body' => ['user' => arrayWithoutPassword($user), 'token' => $plain]];
}

// === Middleware auth:sanctum ===
function authenticate(?string $authHeader): ?array {
    global $users, $tokens;

    if (! $authHeader || ! str_starts_with($authHeader, 'Bearer ')) {
        return null;
    }
    $plain = substr($authHeader, 7);
    if (! isset($tokens[$plain])) {
        return null; // токена немає в "БД" → 401
    }
    return $users[$tokens[$plain]['user_id']] ?? null;
}

// === logout() — видаляє поточний токен ===
function logout(string $plain): array {
    global $tokens;
    unset($tokens[$plain]);
    return ['status' => 200, 'body' => ['message' => 'Logged out successfully.']];
}

function arrayWithoutPassword(array $u): array {
    unset($u['password']); // як 'password' у $hidden моделі
    return $u;
}

// ====== ПРОГАНЯЄМО СЦЕНАРІЙ ======

echo "1) Реєстрація John Doe\\n";
$r = register([
    'name' => 'John Doe', 'email' => 'john@example.com', 'password' => 'password123',
]);
$tokenJohn = $r['body']['token'];
echo "   status={$r['status']}, token={$tokenJohn}\\n\\n";

echo "2) GET /api/me БЕЗ токена → очікуємо 401\\n";
$user = authenticate(null);
echo "   " . ($user ? 'auth ok' : 'Unauthenticated.') . "\\n\\n";

echo "3) GET /api/me з валідним токеном\\n";
$user = authenticate('Bearer ' . $tokenJohn);
echo "   user.email = {$user['email']}\\n\\n";

echo "4) Логін повторно → новий токен (старий лишається валідним)\\n";
$r = login(['email' => 'john@example.com', 'password' => 'password123']);
$tokenJohn2 = $r['body']['token'];
echo "   token1 = {$tokenJohn}\\n";
echo "   token2 = {$tokenJohn2}\\n\\n";

echo "5) Logout по token1 → token1 невалідний, token2 ще працює\\n";
logout($tokenJohn);
echo "   token1 → " . (authenticate('Bearer ' . $tokenJohn) ? 'ok' : 'Unauthenticated.') . "\\n";
echo "   token2 → " . (authenticate('Bearer ' . $tokenJohn2) ? 'ok' : 'Unauthenticated.') . "\\n\\n";

echo "6) Невірний пароль на login → 401 з generic-повідомленням\\n";
$r = login(['email' => 'john@example.com', 'password' => 'WRONG']);
echo "   status={$r['status']}, message=\\"{$r['body']['message']}\\"\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте logoutAll() та tokenCan() для обмежених токенів.
 *
 * Контекст: ви симулюєте Sanctum HasApiTokens на голому PHP.
 *
 * Реалізуйте 3 функції:
 *   1) createToken(int $userId, string $name, array $abilities = ['*']): string
 *   2) logoutAll(int $userId): int    — видаляє ВСІ токени user, повертає кількість видалених
 *   3) tokenCan(string $plain, string $ability): bool — true якщо токен має цей ability (або '*')
 */

$users  = [
    1 => ['id' => 1, 'email' => 'john@example.com'],
    2 => ['id' => 2, 'email' => 'jane@example.com'],
];

// "БД" токенів: $tokens[plainText] = ['user_id', 'name', 'abilities']
$tokens = [];
$nextTokenId = 1;

function makePlain(int $id): string {
    return $id . '|' . bin2hex(random_bytes(8));
}

/**
 * 1. createToken — створює токен для user, повертає plain-text.
 *    Аналог: $user->createToken($name, $abilities)->plainTextToken
 */
function createToken(int $userId, string $name, array $abilities = ['*']): string {
    global $tokens, $nextTokenId;
    // Ваш код тут
}

/**
 * 2. logoutAll — видаляє ВСІ токени конкретного user.
 *    Аналог: $user->tokens()->delete()
 *    Повертає кількість видалених токенів.
 */
function logoutAll(int $userId): int {
    global $tokens;
    // Ваш код тут
}

/**
 * 3. tokenCan — true якщо токен має ability '*' АБО конкретний ability.
 *    Аналог: $request->user()->tokenCan($ability)
 *    Якщо токена немає в БД — повертає false.
 */
function tokenCan(string $plain, string $ability): bool {
    global $tokens;
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 6;

// Тест 1: createToken створює токен у форматі id|random
$t = createToken(1, 'web');
if (is_string($t) && str_contains($t, '|') && isset($tokens[$t])) {
    echo "✓ createToken повертає plain-text у форматі id|random\\n"; $pass++;
} else {
    echo "✗ createToken повернув некоректне значення\\n";
}

// Тест 2: createToken зберігає user_id
if (isset($tokens[$t]) && $tokens[$t]['user_id'] === 1) {
    echo "✓ createToken прив'язує токен до user_id\\n"; $pass++;
} else {
    echo "✗ createToken не зберіг user_id\\n";
}

// Тест 3: logoutAll видаляє лише токени конкретного user
createToken(1, 'mobile');
createToken(1, 'tablet');
createToken(2, 'web'); // інший user — НЕ повинен зачепитись
$deleted = logoutAll(1);
if ($deleted === 3 && count($tokens) === 1) {
    echo "✓ logoutAll видалив 3 токени user=1, токен user=2 лишився\\n"; $pass++;
} else {
    echo "✗ logoutAll: видалено $deleted, в $tokens лишилось " . count($tokens) . "\\n";
}

// Тест 4: tokenCan з абилитою '*' дозволяє все
$tStar = createToken(1, 'admin', ['*']);
if (tokenCan($tStar, 'task:delete')) {
    echo "✓ tokenCan: '*' дозволяє будь-який ability\\n"; $pass++;
} else {
    echo "✗ tokenCan: '*' має дозволяти все\\n";
}

// Тест 5: tokenCan дозволяє лише точно вказаний ability
$tRead = createToken(1, 'mobile', ['task:read']);
if (tokenCan($tRead, 'task:read') && ! tokenCan($tRead, 'task:delete')) {
    echo "✓ tokenCan: чітко відрізняє task:read від task:delete\\n"; $pass++;
} else {
    echo "✗ tokenCan: невірно перевіряє конкретний ability\\n";
}

// Тест 6: tokenCan повертає false для невідомого токена
if (tokenCan('999|fake', 'task:read') === false) {
    echo "✓ tokenCan: невідомий токен → false\\n"; $pass++;
} else {
    echo "✗ tokenCan: невідомий токен має повертати false\\n";
}

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="localStorage JWT + Pinia authStore"
        to="Sanctum HasApiTokens + auth:sanctum middleware"
      />

      <TheoryBlock title="Автентифікація vs Авторизація">
        <p>
          Ці два терміни часто плутають. <strong>Автентифікація</strong> відповідає на питання
          <em>«хто ти?»</em> — сервер перевіряє email/пароль і впізнає користувача (це як показати
          паспорт на вході). <strong>Авторизація</strong> відповідає на питання
          <em>«що тобі дозволено?»</em> — навіть знаючи, хто ви, сервер може заборонити вам видаляти
          чужі задачі (пропуск в офіс ≠ ключ від серверної).
        </p>
        <ul>
          <li>
            <strong>Vue:</strong> автентифікація — форма логіну → <code>/api/login</code> → токен у
            Pinia; авторизація — Vue Router guard перевіряє <code>authStore.user.role</code>.
          </li>
          <li>
            <strong>Laravel:</strong> автентифікація — Sanctum валідує
            <code>Authorization: Bearer …</code>; авторизація — Policies/Gates (Урок 14).
          </li>
        </ul>
        <p>Цей урок — лише про <strong>автентифікацію</strong>. Авторизацію розберемо далі.</p>
      </TheoryBlock>

      <TheoryBlock title="Що таке Laravel Sanctum">
        <p>
          Sanctum — легковагий пакет автентифікації для SPA та API. Замість повноцінного OAuth він
          вирішує простішу задачу: видає API-токени, які ваш Vue/Nuxt-додаток зберігає в
          Pinia/localStorage і відправляє з кожним запитом у заголовку
          <code>Authorization: Bearer …</code>.
        </p>
        <p>
          Ви вже працюєте з цим на фронтенді — Axios interceptor додає Bearer-заголовок автоматично.
          Sanctum просто перевіряє цей заголовок на серверній стороні.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="tokenFlowDiagram"
        lang="text"
        title="Потік запитів: Vue → Laravel зі Sanctum"
      />

      <TheoryBlock title="Sanctum vs JWT — у чому різниця">
        <p>Якщо ви вже працювали з JWT на фронтенді, ось ключові відмінності:</p>
        <ul>
          <li>
            <strong>Зберігання:</strong> JWT існує лише на клієнті (stateless). Sanctum зберігає
            <strong>хеш</strong> токена в таблиці <code>personal_access_tokens</code>.
          </li>
          <li>
            <strong>Валідація:</strong> JWT — декодування + перевірка підпису. Sanctum — пошук хеша
            в БД.
          </li>
          <li>
            <strong>Відкликання:</strong> JWT потребує blocklist; Sanctum просто видаляє рядок з БД,
            і токен миттєво стає невалідним.
          </li>
          <li>
            <strong>Payload:</strong> JWT містить дані (user_id, role); Sanctum-токен — просто
            випадковий рядок.
          </li>
          <li>
            <strong>Use case:</strong> JWT — мікросервіси та cross-domain; Sanctum — SPA + API на
            одному домені (саме наш Task Manager).
          </li>
        </ul>
      </TheoryBlock>

      <CodeComparison
        :js="jsAuthStore"
        :php="phpHasApiTokens"
        js-title="Vue/Pinia — клієнтський authStore"
        php-title="Laravel — модель User з HasApiTokens"
      />

      <TheoryBlock title="Створення та відкликання токена">
        <p>
          Виклик <code>$user->createToken('auth-token')</code> робить чотири речі: генерує
          випадковий рядок (40 символів), хешує його через SHA-256, зберігає <strong>хеш</strong> у
          БД і повертає об'єкт <code>NewAccessToken</code>. Властивість
          <code>plainTextToken</code> — це <strong>єдиний шанс побачити справжній токен</strong>: ви
          повертаєте його клієнту, у БД лишається тільки хеш.
        </p>
        <p>
          Формат plain-text токена: <code>{token_id}|{random_string}</code>, наприклад
          <code>1|abc123def456…</code>. Sanctum розділяє рядок по <code>|</code>, знаходить токен по
          id і порівнює хеш другої частини з тим, що в БД.
        </p>
        <p>
          Відкликання — головна перевага над JWT: видалили рядок із
          <code>personal_access_tokens</code> — токен миттєво невалідний. Не треба вести blocklist
          чи чекати, поки закінчиться TTL.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="authControllerCode"
        lang="php"
        title="app/Http/Controllers/AuthController.php"
      />

      <TheoryBlock title="Захист маршрутів middleware auth:sanctum">
        <p>
          Маршрути, що потребують автентифікації, обгортаємо в групу
          <code>Route::middleware('auth:sanctum')->group(...)</code>. Без валідного токена сервер
          поверне <strong>401 Unauthorized</strong> — це і є серверний еквівалент Vue Router guard
          <code>if (!authStore.isAuthenticated) return '/login'</code>. Тільки замість редіректу ваш
          Vue-фронтенд отримає 401 і сам вирішить, куди вести користувача.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="routesCode"
        lang="php"
        title="routes/api.php — публічні + захищені маршрути"
      />

      <TheoryBlock title="Scoping — дані, прив'язані до користувача">
        <p>
          Як тільки з'являється автентифікація, кожен користувач має бачити
          <strong>лише свої</strong> дані. Замість ручного
          <code>Task::where('user_id', …)</code> використовуйте відношення:
          <code>$request->user()->tasks()</code>. Це автоматично додає
          <code>WHERE user_id = ?</code> і гарантує, що ви ніколи не «забудете» фільтр і випадково
          не покажете чужі задачі.
        </p>
        <p>
          Це аналог фільтрації даних у Pinia store по <code>currentUserId</code>, але виконується в
          БД — швидше і безпечніше.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="scopingCode"
        lang="php"
        title="app/Http/Controllers/TaskController.php — scoping через відношення"
      />

      <TheoryBlock title="Token Abilities — обмеження дій конкретного токена">
        <p>
          Token abilities — список дозволів, прив'язаних не до користувача, а до
          <strong>конкретного токена</strong>. Це аналог OAuth scopes: один user може мати кілька
          токенів з різними правами (мобільний — лише читання, web — повний доступ).
        </p>
      </TheoryBlock>

      <CodeBlock :code="tokenAbilitiesCode" lang="php" title="Token Abilities у дії" />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: симуляція AuthController на голому PHP">
        <p>
          У playground ми <strong>симулюємо</strong> логіку Sanctum-флоу без Laravel: реєстрація,
          логін, перевірка токена в middleware, logout. Це показує <em>що саме</em> робить Sanctum
          під капотом — ви побачите, чому plain-text токен повертається лише раз і чому видалення
          рядка миттєво «вбиває» токен.
        </p>
        <p>
          Запустіть код і простежте всі 6 кроків сценарію. Потім спробуйте змінити пароль у
          <code>login()</code> або відправити Bearer-заголовок з неіснуючим токеном — побачите, як
          саме «прокидається» 401.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/13-sanctum.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="3-13" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте createToken / logoutAll / tokenCan">
        <p>
          Реалізуйте три функції, які разом утворюють ядро <code>HasApiTokens</code>-трейту.
          Натисніть <strong>«Запустити»</strong> — автотести перевірять вашу реалізацію.
        </p>
        <ol>
          <li>
            <strong
              >createToken(int $userId, string $name, array $abilities = ['*']): string</strong
            >
            — створює запис у <code>$tokens</code>, повертає plain-text у форматі
            <code>{id}|{random}</code>. Аналог
            <code>$user->createToken($name, $abilities)->plainTextToken</code>.
          </li>
          <li>
            <strong>logoutAll(int $userId): int</strong> — видаляє <strong>всі</strong> токени
            конкретного user (як у завданні «logout-all» з markdown). Повертає кількість видалених.
            Аналог <code>$user->tokens()->delete()</code>. ⚠️ Не зачіпайте токени інших
            користувачів.
          </li>
          <li>
            <strong>tokenCan(string $plain, string $ability): bool</strong> — true, якщо токен має
            <code>'*'</code> або точно вказаний ability. Якщо токена немає в <code>$tokens</code> —
            false. Аналог <code>$user->tokenCan($ability)</code>.
          </li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте createToken / logoutAll / tokenCan"
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
