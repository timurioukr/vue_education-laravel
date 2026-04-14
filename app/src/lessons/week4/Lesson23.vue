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
    question: 'Чому Vue SPA і Laravel API працюють на різних серверах (5173 і 8000)?',
    options: [
      'Тому що Vue не може працювати на тому ж порті',
      'Незалежний деплой, масштабування та підтримка кількох клієнтів (web, mobile)',
      'Це обмеження Vite',
      'Laravel не вміє віддавати статичні файли',
    ],
    correct: 1,
    explanation:
      'Два окремих проєкти дозволяють деплоїти фронт і бекенд незалежно, масштабувати їх окремо та обслуговувати кілька клієнтів (Vue SPA, React Native, Telegram bot) з одного API. Це стандартна архітектура для production.',
  },
  {
    question: 'Що робить request interceptor в axios?',
    options: [
      'Перехоплює відповіді сервера',
      'Автоматично додає Bearer token до кожного запиту',
      'Кешує GET-запити',
      'Перетворює JSON у FormData',
    ],
    correct: 1,
    explanation:
      'Request interceptor спрацьовує перед КОЖНИМ запитом. Він бере токен з localStorage і додає Authorization: Bearer {token} header. Це позбавляє від ручного додавання header у кожному API-виклику.',
  },
  {
    question: 'Що робить Vue Router navigation guard при requiresAuth meta?',
    options: [
      'Завантажує дані перед рендерингом',
      'Перевіряє наявність токена — якщо немає, перенаправляє на /login',
      'Відправляє запит на сервер для перевірки сесії',
      'Блокує навігацію на 3 секунди',
    ],
    correct: 1,
    explanation:
      'beforeEach guard перевіряє meta.requiresAuth і наявність токена в localStorage. Якщо токена немає — redirect на /login з query.redirect для повернення після авторизації. Це клієнтський захист — серверний захист (middleware) працює паралельно.',
  },
  {
    question: 'Як useApiErrors трансформує помилки Laravel?',
    options: [
      'Показує alert() з текстом помилки',
      'Перетворює { errors: { field: ["msg1", "msg2"] } } у плоский { field: "msg1" }',
      'Логує помилки у console.error',
      'Надсилає помилки в Sentry',
    ],
    correct: 1,
    explanation:
      'Laravel при 422 повертає { message: "...", errors: { field: ["First error", "Second error"] } }. useApiErrors бере перший елемент масиву для кожного поля і створює плоский обʼєкт { field: "First error" } — зручний для v-if у шаблоні.',
  },
  {
    question: 'Навіщо потрібен префікс VITE_ для змінних оточення?',
    options: [
      'Це конвенція для красивого коду',
      'Без нього змінна не зберігається в .env',
      'Vite включає у клієнтський бандл тільки змінні з префіксом VITE_',
      'Це вимога TypeScript',
    ],
    correct: 2,
    explanation:
      'Vite навмисно НЕ включає всі змінні .env у бандл — це захист від витоку секретів (DB_PASSWORD, APP_KEY). Тільки змінні з VITE_ потрапляють у import.meta.env і стають доступними в браузері. Серверні секрети залишаються на сервері.',
  },
]

// === CodeComparison: Vue axios client vs Laravel API ===
const jsAxiosClient = `// src/api/client.ts — axios instance
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:8000/api
  headers: { 'Accept': 'application/json' },
})

// Request interceptor — Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`
  }
  return config
})

// Response interceptor — error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient`

const phpLaravelApi = `<?php
// routes/api.php — Laravel API routes

use App\\Http\\Controllers\\AuthController;
use App\\Http\\Controllers\\TaskController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes (Sanctum middleware)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('tasks', TaskController::class);
    // GET    /api/tasks         → index
    // POST   /api/tasks         → store
    // GET    /api/tasks/{id}    → show
    // PUT    /api/tasks/{id}    → update
    // DELETE /api/tasks/{id}    → destroy
});

// config/cors.php
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,`

// === CodeBlock: Auth Store (Pinia) ===
const authStoreCode = `// src/stores/auth.ts — Pinia auth store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { useRouter } from 'vue-router'

interface User {
  id: number
  name: string
  email: string
}

interface LoginPayload {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(payload: LoginPayload) {
    const { data } = await apiClient.post('/login', payload)
    // Laravel повертає: { user: {...}, token: "2|abc..." }
    token.value = data.token
    user.value = data.user
    localStorage.setItem('auth_token', data.token)
  }

  async function logout() {
    await apiClient.post('/logout')
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  async function register(payload: LoginPayload & { name: string }) {
    const { data } = await apiClient.post('/register', payload)
    token.value = data.token
    user.value = data.user
    localStorage.setItem('auth_token', data.token)
  }

  async function fetchUser() {
    const { data } = await apiClient.get('/user')
    user.value = data.data // Laravel Resource wraps in { data: {...} }
  }

  return { user, token, isAuthenticated, login, logout, register, fetchUser }
})`

// === CodeBlock: Task Store (Pinia) ===
const taskStoreCode = `// src/stores/tasks.ts — Pinia task store
import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'

interface Task {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  deadline: string | null
}

interface TaskFilters {
  status?: string
  priority?: string
  search?: string
  page?: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number }
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const meta = ref<PaginatedResponse<Task>['meta'] | null>(null)
  const loading = ref(false)

  async function fetchTasks(filters: TaskFilters = {}) {
    loading.value = true
    try {
      const { data } = await apiClient.get<PaginatedResponse<Task>>('/tasks', {
        params: filters,
      })
      tasks.value = data.data       // Laravel Resource collection
      meta.value = data.meta        // Pagination meta
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: Partial<Task>) {
    const { data } = await apiClient.post('/tasks', payload)
    tasks.value.unshift(data.data)  // Laravel Resource wraps single item
  }

  async function updateTask(id: number, payload: Partial<Task>) {
    const { data } = await apiClient.put(\`/tasks/\${id}\`, payload)
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) tasks.value[index] = data.data
  }

  async function deleteTask(id: number) {
    await apiClient.delete(\`/tasks/\${id}\`)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  return { tasks, meta, loading, fetchTasks, createTask, updateTask, deleteTask }
})`

// === CodeBlock: useApiErrors composable ===
const apiErrorsCode = `// src/composables/useApiErrors.ts
import { ref } from 'vue'
import type { AxiosError } from 'axios'

interface LaravelValidationError {
  message: string
  errors: Record<string, string[]>
}

export function useApiErrors() {
  const errors = ref<Record<string, string>>({})
  const generalError = ref<string | null>(null)

  function handleError(error: unknown) {
    const axiosError = error as AxiosError<LaravelValidationError>

    if (axiosError.response?.status === 422) {
      // Laravel: { errors: { title: ["Required", "Too short"] } }
      // Vue:     { title: "Required" } — перший елемент масиву
      const laravelErrors = axiosError.response.data.errors
      errors.value = Object.fromEntries(
        Object.entries(laravelErrors).map(([field, messages]) => [
          field,
          messages[0], // Беремо першу помилку для поля
        ])
      )
    } else {
      generalError.value =
        axiosError.response?.data?.message ?? 'Щось пішло не так'
    }
  }

  function clearErrors() {
    errors.value = {}
    generalError.value = null
  }

  function clearField(field: string) {
    delete errors.value[field]
  }

  return { errors, generalError, handleError, clearErrors, clearField }
}

// Використання у компоненті:
// const { errors, handleError, clearField } = useApiErrors()
// try { await taskStore.createTask(form) }
// catch (e) { handleError(e) }
// <input @input="clearField('title')" />
// <span v-if="errors.title">{{ errors.title }}</span>`

// === CodeBlock: Vue Router guards ===
const routerGuardCode = `// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/:id',
      name: 'task-detail',
      component: () => import('@/views/TaskDetailView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard — клієнтський захист
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')

  if (to.meta.requiresAuth && !token) {
    // Немає токена → login з redirect для повернення
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresGuest && token) {
    // Вже залогінений → на головну
    next({ name: 'tasks' })
  } else {
    next()
  }
})`

// === CodeBlock: Form with validation errors ===
const formComponentCode = [
  '<!-- CreateTaskView.vue -->',
  '<script setup lang="ts">',
  "import { reactive } from 'vue'",
  "import { useTaskStore } from '@/stores/tasks'",
  "import { useApiErrors } from '@/composables/useApiErrors'",
  "import { useRouter } from 'vue-router'",
  '',
  'const taskStore = useTaskStore()',
  'const router = useRouter()',
  'const { errors, generalError, handleError, clearField } = useApiErrors()',
  '',
  'const form = reactive({',
  "  title: '',",
  "  description: '',",
  "  status: 'pending' as const,",
  "  priority: 'medium' as const,",
  "  deadline: '',",
  '})',
  '',
  'async function submit() {',
  '  try {',
  '    await taskStore.createTask(form)',
  "    router.push({ name: 'tasks' })",
  '  } catch (e) {',
  '    handleError(e) // 422 → errors.title, errors.description...',
  '  }',
  '}',
  '</' + 'script>',
  '',
  '<' + 'template>',
  '  <form @submit.prevent="submit">',
  '    <div class="alert" v-if="generalError">{{ generalError }}</div>',
  '',
  '    <div class="field">',
  '      <label>Title</label>',
  '      <input v-model="form.title" @input="clearField(\'title\')" />',
  '      <span class="error" v-if="errors.title">{{ errors.title }}</span>',
  '    </div>',
  '',
  '    <div class="field">',
  '      <label>Description</label>',
  '      <textarea v-model="form.description" @input="clearField(\'description\')" />',
  '      <span class="error" v-if="errors.description">',
  '        {{ errors.description }}',
  '      </span>',
  '    </div>',
  '',
  '    <div class="field">',
  '      <label>Priority</label>',
  '      <select v-model="form.priority">',
  '        <option value="low">Low</option>',
  '        <option value="medium">Medium</option>',
  '        <option value="high">High</option>',
  '      </select>',
  '      <span class="error" v-if="errors.priority">{{ errors.priority }}</span>',
  '    </div>',
  '',
  '    <button type="submit">Create Task</button>',
  '  </form>',
  '</' + 'template>',
].join('\n')

// === Practice: simulated full flow ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо повний Vue SPA → Laravel API flow на чистому PHP:
// API Client, Auth Store, Task Store, Validation Errors, Router Guard.

// ===== API Client Mock (axios-like) =====
class ApiClient
{
    private string $baseUrl;
    private ?string $bearerToken = null;

    /** @var array<callable> */
    private array $requestInterceptors = [];
    /** @var array<callable> */
    private array $responseInterceptors = [];

    public function __construct(string $baseUrl) {
        $this->baseUrl = $baseUrl;
    }

    public function addRequestInterceptor(callable $fn): void {
        $this->requestInterceptors[] = $fn;
    }

    public function addResponseInterceptor(callable $fn): void {
        $this->responseInterceptors[] = $fn;
    }

    public function setBearerToken(?string $token): void {
        $this->bearerToken = $token;
    }

    /**
     * Simulate an HTTP request.
     * @return array{status: int, data: array}
     */
    public function request(string $method, string $path, array $body = []): array {
        // Build request config
        $config = [
            'method'  => $method,
            'url'     => $this->baseUrl . $path,
            'headers' => ['Accept' => 'application/json'],
            'body'    => $body,
        ];

        // Apply request interceptors (like adding Bearer token)
        foreach ($this->requestInterceptors as $fn) {
            $config = $fn($config);
        }

        echo "  [{$config['method']}] {$config['url']}\\n";
        if (!empty($config['headers']['Authorization'])) {
            echo "    Authorization: {$config['headers']['Authorization']}\\n";
        }

        // Simulate server responses
        $response = $this->simulateServer($method, $path, $body);

        // Apply response interceptors
        foreach ($this->responseInterceptors as $fn) {
            $response = $fn($response);
        }

        return $response;
    }

    private function simulateServer(string $method, string $path, array $body): array {
        // POST /login
        if ($method === 'POST' && $path === '/login') {
            if (empty($body['email']) || empty($body['password'])) {
                return ['status' => 422, 'data' => [
                    'message' => 'Validation failed',
                    'errors' => [
                        'email' => ['The email field is required.'],
                        'password' => ['The password field is required.'],
                    ],
                ]];
            }
            return ['status' => 200, 'data' => [
                'user'  => ['id' => 1, 'name' => 'Timur', 'email' => $body['email']],
                'token' => '1|abc123xyz789token',
            ]];
        }

        // GET /tasks (protected)
        if ($method === 'GET' && $path === '/tasks') {
            if (!$this->bearerToken) {
                return ['status' => 401, 'data' => ['message' => 'Unauthenticated.']];
            }
            return ['status' => 200, 'data' => [
                'data' => [
                    ['id' => 1, 'title' => 'Setup Vue', 'status' => 'done'],
                    ['id' => 2, 'title' => 'Connect API', 'status' => 'in_progress'],
                    ['id' => 3, 'title' => 'Deploy', 'status' => 'pending'],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'total' => 3],
            ]];
        }

        // POST /tasks — validation example
        if ($method === 'POST' && $path === '/tasks') {
            if (!$this->bearerToken) {
                return ['status' => 401, 'data' => ['message' => 'Unauthenticated.']];
            }
            if (empty($body['title'])) {
                return ['status' => 422, 'data' => [
                    'message' => 'The title field is required.',
                    'errors' => [
                        'title' => ['The title field is required.'],
                    ],
                ]];
            }
            return ['status' => 201, 'data' => [
                'data' => ['id' => 4, 'title' => $body['title'], 'status' => 'pending'],
            ]];
        }

        return ['status' => 404, 'data' => ['message' => 'Not Found']];
    }
}

// ===== Auth Store Mock (Pinia-like) =====
class AuthStore
{
    public ?array $user = null;
    public ?string $token = null;

    private ApiClient $api;

    public function __construct(ApiClient $api) {
        $this->api = $api;
        // Restore from "localStorage"
        $this->token = null; // simulate empty start
    }

    public function isAuthenticated(): bool {
        return $this->token !== null;
    }

    public function login(string $email, string $password): array {
        $response = $this->api->request('POST', '/login', [
            'email' => $email,
            'password' => $password,
        ]);

        if ($response['status'] === 200) {
            $this->token = $response['data']['token'];
            $this->user = $response['data']['user'];
            $this->api->setBearerToken($this->token);
            echo "    Token saved: {$this->token}\\n";
        }

        return $response;
    }

    public function logout(): void {
        $this->token = null;
        $this->user = null;
        $this->api->setBearerToken(null);
        echo "    Token removed, redirecting to /login\\n";
    }
}

// ===== Validation Error Handler (useApiErrors-like) =====
function handleValidationErrors(array $response): array {
    if ($response['status'] === 422 && isset($response['data']['errors'])) {
        $flat = [];
        foreach ($response['data']['errors'] as $field => $messages) {
            $flat[$field] = $messages[0]; // First error per field
        }
        return $flat;
    }
    return [];
}

// ===== Router Guard Mock =====
function routerGuard(string $targetRoute, bool $requiresAuth, ?string $token): string {
    if ($requiresAuth && $token === null) {
        return "/login?redirect=" . urlencode($targetRoute);
    }
    return $targetRoute;
}

// ===== DEMO =====
echo "=== Vue SPA + Laravel API — Full Flow ===\\n\\n";

// 1. Create API client
$api = new ApiClient('http://localhost:8000/api');

// Add request interceptor (auto Bearer token)
$authToken = null; // will be set after login
$api->addRequestInterceptor(function (array $config) use (&$authToken): array {
    if ($authToken) {
        $config['headers']['Authorization'] = "Bearer {$authToken}";
    }
    return $config;
});

// Add response interceptor (401 handling)
$api->addResponseInterceptor(function (array $response): array {
    if ($response['status'] === 401) {
        echo "    ⚠ 401 Unauthenticated — redirect to /login\\n";
    }
    return $response;
});

$auth = new AuthStore($api);

// 2. Try accessing /tasks without auth — router guard
echo "--- Step 1: Router Guard (no token) ---\\n";
$redirect = routerGuard('/tasks', true, $auth->token);
echo "  Navigate to /tasks → guard redirects to: {$redirect}\\n\\n";

// 3. Login
echo "--- Step 2: Login ---\\n";
$loginResp = $auth->login('user@example.com', 'password123');
echo "  Status: {$loginResp['status']}, User: {$loginResp['data']['user']['name']}\\n";
$authToken = $auth->token; // sync with interceptor
echo "  isAuthenticated: " . ($auth->isAuthenticated() ? 'true' : 'false') . "\\n\\n";

// 4. Router guard now passes
echo "--- Step 3: Router Guard (with token) ---\\n";
$redirect = routerGuard('/tasks', true, $auth->token);
echo "  Navigate to /tasks → guard passes: {$redirect}\\n\\n";

// 5. Fetch tasks
echo "--- Step 4: Fetch Tasks ---\\n";
$tasksResp = $api->request('GET', '/tasks');
echo "  Status: {$tasksResp['status']}, Tasks: " . count($tasksResp['data']['data']) . "\\n";
foreach ($tasksResp['data']['data'] as $t) {
    echo "    #{$t['id']} {$t['title']} [{$t['status']}]\\n";
}
echo "\\n";

// 6. Create task — validation error (empty title)
echo "--- Step 5: Create Task (validation error) ---\\n";
$createResp = $api->request('POST', '/tasks', ['title' => '']);
echo "  Status: {$createResp['status']}\\n";
$flatErrors = handleValidationErrors($createResp);
echo "  Flat errors: " . json_encode($flatErrors) . "\\n\\n";

// 7. Create task — success
echo "--- Step 6: Create Task (success) ---\\n";
$createResp = $api->request('POST', '/tasks', ['title' => 'Write tests']);
echo "  Status: {$createResp['status']}, New task: {$createResp['data']['data']['title']}\\n\\n";

// 8. Logout
echo "--- Step 7: Logout ---\\n";
$auth->logout();
$authToken = null;
echo "  isAuthenticated: " . ($auth->isAuthenticated() ? 'true' : 'false') . "\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте 3 функції для Vue SPA + Laravel API інтеграції.
 *
 * 1) function apiClient(string $baseUrl): array
 *    Повертає масив з:
 *    - 'baseUrl' => $baseUrl
 *    - 'token'   => null (спочатку)
 *    - 'request' => function(string $method, string $path, array $headers = []): array
 *      Повертає: ['method' => ..., 'url' => baseUrl + path, 'headers' => merged headers]
 *      Якщо token !== null → додає 'Authorization' => 'Bearer {token}' до headers
 *
 * 2) function authStore(array &$client): array
 *    Повертає масив з:
 *    - 'user'  => null
 *    - 'token' => null
 *    - 'login' => function(string $email, string $password) use (&$store, &$client): void
 *      Якщо email = 'test@example.com' і password = 'password':
 *        → store.token = 'fake-token-123'
 *        → store.user = ['id' => 1, 'name' => 'Test User', 'email' => $email]
 *        → client['token'] = store.token
 *      Інакше → throw new Exception('Invalid credentials')
 *    - 'logout' => function() use (&$store, &$client): void
 *      → store.token = null, store.user = null, client['token'] = null
 *    - 'isAuthenticated' => function() use (&$store): bool
 *
 * 3) function handleValidationErrors(array $response): array
 *    Приймає: ['status' => 422, 'data' => ['errors' => ['field' => ['msg1', 'msg2']]]]
 *    Повертає: ['field' => 'msg1'] — перший елемент масиву для кожного поля
 *    Якщо status !== 422 або немає errors → повертає []
 */

function apiClient(string $baseUrl): array {
    // Ваш код тут
}

function authStore(array &$client): array {
    // Ваш код тут
}

function handleValidationErrors(array $response): array {
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 10;

function check(string $name, bool $ok): void {
    global $pass;
    if ($ok) { $pass++; echo "✓ {$name}\\n"; }
    else     { echo "✗ {$name}\\n"; }
}

// 1. apiClient — baseUrl
$client = apiClient('http://localhost:8000/api');
check('apiClient: baseUrl set', $client['baseUrl'] === 'http://localhost:8000/api');

// 2. apiClient — token initially null
check('apiClient: token initially null', $client['token'] === null);

// 3. apiClient — request builds URL
$req = $client['request']('GET', '/tasks');
check('apiClient: request builds full URL', $req['url'] === 'http://localhost:8000/api/tasks');

// 4. apiClient — no auth header when no token
check('apiClient: no Authorization when no token', !isset($req['headers']['Authorization']));

// 5. apiClient — adds auth header when token set
$client['token'] = 'test-token';
$req2 = $client['request']('POST', '/login');
check('apiClient: Authorization header with token', ($req2['headers']['Authorization'] ?? '') === 'Bearer test-token');

// 6. authStore — login success
$client2 = apiClient('http://localhost:8000/api');
$store = authStore($client2);
$store['login']('test@example.com', 'password');
check('authStore: login sets token', $store['token'] === 'fake-token-123');
check('authStore: login sets user', $store['user']['email'] === 'test@example.com');

// 7. authStore — isAuthenticated
check('authStore: isAuthenticated after login', $store['isAuthenticated']() === true);

// 8. authStore — logout
$store['logout']();
check('authStore: logout clears token', $store['token'] === null && $store['user'] === null && $client2['token'] === null);

// 9. handleValidationErrors — 422
$resp422 = [
    'status' => 422,
    'data' => ['errors' => [
        'title' => ['The title field is required.', 'Title must be string.'],
        'email' => ['The email must be valid.'],
    ]],
];
$flat = handleValidationErrors($resp422);
check('handleValidationErrors: flattens 422', $flat['title'] === 'The title field is required.' && $flat['email'] === 'The email must be valid.');

// 10. handleValidationErrors — non-422
$resp500 = ['status' => 500, 'data' => ['message' => 'Server error']];
$flat2 = handleValidationErrors($resp500);
check('handleValidationErrors: empty for non-422', empty($flat2));

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="Vue SPA (axios, Pinia, Vue Router)"
        to="Laravel API (Sanctum, Resources, Validation)"
      />

      <TheoryBlock title="Архітектура: два окремих проєкти">
        <p>
          Vue SPA працює на порті <strong>5173</strong> (Vite dev server), Laravel API — на
          <strong>8000</strong> (php artisan serve). Це два окремих проєкти з окремими
          репозиторіями. Переваги: незалежний деплой, масштабування, один API для кількох клієнтів
          (web, mobile, Telegram bot).
        </p>
        <p>
          <strong>API-контракт:</strong> TypeScript інтерфейси у Vue повинні відповідати Laravel
          Resources. Якщо Laravel Resource повертає
          <code>{'{ data: { id, title, status } }'}</code>, то TypeScript interface Task має ті самі
          поля. Зміна в одному — оновлення в іншому.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsAxiosClient"
        :php="phpLaravelApi"
        js-title="Vue — axios client + interceptors"
        php-title="Laravel — API routes + CORS"
      />

      <TheoryBlock title="API Client з Interceptors">
        <p>
          <strong>Request interceptor</strong> спрацьовує перед кожним запитом — додає
          <code>Authorization: Bearer {'{token}'}</code> з localStorage. Не потрібно вручну додавати
          header у кожному виклику.
        </p>
        <p>
          <strong>Response interceptor</strong> обробляє помилки глобально: 401 → видалити токен і
          redirect на /login; 422 → validation errors передаються далі через Promise.reject для
          обробки в компоненті.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="authStoreCode"
        lang="typescript"
        title="Auth Store (Pinia) — login / logout / register"
      />

      <TheoryBlock title="Auth Store (Pinia) — управління авторизацією">
        <p>
          Auth store зберігає <code>user</code>, <code>token</code> і computed
          <code>isAuthenticated</code>. При login — зберігаємо токен в localStorage (persistence між
          reload). При logout — видаляємо все і redirect. Токен із localStorage автоматично
          підхоплюється request interceptor-ом axios.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="taskStoreCode"
        lang="typescript"
        title="Task Store (Pinia) — CRUD через API"
      />

      <TheoryBlock title="Task Store (Pinia) — CRUD з пагінацією">
        <p>
          Task store обгортає всі CRUD-операції через <code>apiClient</code>. Laravel
          <code>TaskResource::collection()</code> повертає
          <code>{'{ data: [...], meta: { current_page, last_page, total } }'}</code>. Store зберігає
          і дані, і мета-інформацію для пагінації.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="apiErrorsCode"
        lang="typescript"
        title="useApiErrors — composable для помилок валідації"
      />

      <TheoryBlock title="useApiErrors — трансформація помилок Laravel">
        <p>
          Laravel при 422 повертає <code>{'{ errors: { field: ["msg1", "msg2"] } }'}</code> — масив
          рядків для кожного поля. Composable <code>useApiErrors</code> трансформує це у плоский
          обʼєкт <code>{'{ field: "msg1" }'}</code> (беремо першу помилку). Це зручно для
          <code>v-if="errors.title"</code> у шаблоні. <code>clearField()</code> прибирає помилку при
          введенні — UX як у реальних продуктах.
        </p>
      </TheoryBlock>

      <CodeBlock :code="routerGuardCode" lang="typescript" title="Vue Router — navigation guards" />

      <TheoryBlock title="Vue Router guards — клієнтський захист">
        <p>
          <code>beforeEach</code> guard перевіряє: якщо route має <code>meta.requiresAuth</code> і
          немає токена → redirect на <code>/login</code> з <code>query.redirect</code> для
          повернення після авторизації. Це клієнтський захист — серверний (Sanctum middleware)
          працює паралельно. Обидва потрібні: guard для UX, middleware для безпеки.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="formComponentCode"
        lang="vue"
        title="Form з відображенням помилок валідації"
      />

      <TheoryBlock title="Form компоненти з validation error display">
        <p>
          Кожне поле має <code>v-if="errors.fieldName"</code> для показу помилки. При
          <code>@input</code> викликаємо <code>clearField('fieldName')</code> — помилка зникає
          одразу при набиранні. При submit — <code>try/catch</code> з <code>handleError(e)</code>.
          Якщо 422 — відображаємо помилки під полями. Якщо інша помилка — загальний alert зверху
          форми.
        </p>
      </TheoryBlock>
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: повний Vue SPA → Laravel API flow">
        <p>
          У playground ми симулюємо весь цикл на чистому PHP: створюємо API Client з interceptors,
          Auth Store з login/logout, Router Guard, Validation Error Handler. Крок за кроком: guard
          без токена → redirect, login → отримуємо токен, guard з токеном → проходить, fetch tasks →
          список, create task без title → 422, create task → success, logout.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/23-vue-spa-integration.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="4-23" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте apiClient, authStore, handleValidationErrors">
        <p>
          Реалізуйте 3 функції: <code>apiClient()</code> — створює клієнт з baseUrl, token і request
          функцією; <code>authStore()</code> — login/logout/isAuthenticated з синхронізацією токена
          в клієнті; <code>handleValidationErrors()</code> — трансформує Laravel 422 помилки у
          плоский обʼєкт. Натисніть <strong>«Запустити»</strong> — 10 тестів перевірять вашу
          реалізацію.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте API Client + Auth Store + Error Handler"
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
