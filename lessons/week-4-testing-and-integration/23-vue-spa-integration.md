# Урок 23: Vue SPA Integration -- підключаємо фронтенд до Laravel API

## Що ви вивчите

- Як створити Vue 3 проєкт поруч із Laravel API (окремі директорії)
- Як налаштувати Axios-клієнт з interceptors для роботи з Laravel API
- Як створити TypeScript-інтерфейси, що відповідають Laravel API Resources
- Як створити auth store (Pinia) з register, login, logout, fetchUser
- Як створити task store для повного CRUD з пагінацією та фільтрами
- Як відобразити Laravel validation errors (422) у формах Vue
- Як налаштувати Vue Router guards для захищених сторінок
- Повний flow: реєстрація, логін, CRUD задач, фільтрація, пагінація, логаут

---

## Паралелі з JS/Vue

Цей урок -- момент, де **все зʼєднується**. Ви писали Laravel API протягом курсу. Тепер кожна частина API знаходить свій відповідник на фронтенді:

| Laravel (бекенд) | Vue (фронтенд) | Коментар |
|---|---|---|
| `TaskResource::toArray()` JSON | `interface Task { ... }` TypeScript | Формат API стає типом на фронтенді |
| `POST /api/login` | `authStore.login()` Pinia action | Дія стору викликає endpoint |
| `GET /api/tasks?status=pending` | `taskStore.fetchTasks({ status: 'pending' })` | Query params стають параметрами функції |
| Laravel 422 + `errors: { title: [...] }` | Червоні повідомлення під полями форми | Серверна валідація = UX помилки |
| Sanctum Bearer token | `localStorage.getItem('token')` | Токен зберігається на клієнті |
| `TaskResource::collection(Task::paginate())` | `<Pagination>` компонент з `meta.last_page` | Мета пагінації управляє UI |
| `auth:sanctum` middleware | `router.beforeEach()` navigation guard | Захист маршрутів з обох боків |
| `FormRequest` validation rules | Inline error display під кожним полем | Одна система валідації, два рівня |

---

## Теорія

### Архітектура: два окремих проєкти

```
backand-study/
  task-manager/              <-- Laravel API (port 8000)
    app/
    routes/
    ...
  task-manager-frontend/     <-- Vue SPA (port 5173)
    src/
    package.json
    ...
```

Laravel і Vue працюють як два незалежних сервери. Vue SPA робить HTTP-запити до Laravel API. Це класична архітектура **SPA + API**.

Переваги:
- **Незалежний деплой** -- фронтенд і бекенд можна оновлювати окремо
- **Різні команди** можуть працювати паралельно
- **Один API** може обслуговувати Vue SPA, мобільний додаток, інші клієнти
- **Вам вже знайомо** -- ви це робили з будь-яким API

### Потік даних

```
Vue SPA (5173)                    Laravel API (8000)
  |                                      |
  |  POST /api/login                     |
  |  { email, password }                 |
  |------------------------------------->|
  |                                      | -- перевірка credentials
  |  200 { user, token }                 |
  |<-------------------------------------|
  |                                      |
  |  GET /api/tasks                      |
  |  Authorization: Bearer <token>       |
  |------------------------------------->|
  |                                      | -- auth:sanctum middleware
  |  200 { data: [...], meta: {...} }    |
  |<-------------------------------------|
  |                                      |
  |  POST /api/tasks                     |
  |  { title: "" }  (невалідні дані)     |
  |------------------------------------->|
  |                                      | -- FormRequest validation
  |  422 { message, errors: {...} }      |
  |<-------------------------------------|
```

---

## Практика: крок за кроком

### Крок 1: Створіть Vue-проєкт

```bash
cd /path/to/backand-study
npm create vue@latest task-manager-frontend
```

При створенні оберіть:
- TypeScript: **Yes**
- JSX: No
- Vue Router: **Yes**
- Pinia: **Yes**
- Vitest: Yes
- ESLint: Yes
- Prettier: Yes

```bash
cd task-manager-frontend
npm install
npm install axios
```

Структура проєкту після налаштування:

```
task-manager-frontend/
  src/
    api/
      client.ts           <-- Axios instance
    components/
      Pagination.vue      <-- компонент пагінації
    composables/
      useApiErrors.ts     <-- парсинг помилок Laravel
    router/
      index.ts            <-- маршрути + guards
    stores/
      auth.ts             <-- авторизація
      tasks.ts            <-- задачі
    types/
      index.ts            <-- TypeScript інтерфейси
    views/
      LoginView.vue
      RegisterView.vue
      TasksView.vue
      TaskFormView.vue
    App.vue
    main.ts
  .env                    <-- VITE_API_URL
```

### Крок 2: Environment variables

Створіть файл `.env` у корені Vue-проєкту:

```env
VITE_API_URL=http://localhost:8000/api
```

> У Vue/Vite змінні середовища повинні мати префікс `VITE_`, щоб бути доступними у клієнтському коді. Це аналог того, як Laravel використовує `.env` з `env()`.

---

### Крок 3: TypeScript інтерфейси

Створіть `src/types/index.ts` -- типи, що точно відповідають Laravel API Resources:

```typescript
// src/types/index.ts

// Відповідає TaskResource::toArray() у Laravel
export interface Task {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  deadline: string | null
  category: Category | null
  tags: Tag[]
  created_at: string
}

// Відповідає CategoryResource::toArray()
export interface Category {
  id: number
  name: string
  slug: string
  tasks_count?: number
}

// Відповідає TagResource::toArray()
export interface Tag {
  id: number
  name: string
}

// Відповідає User ресурсу
export interface User {
  id: number
  name: string
  email: string
}

// Структура пагінованої відповіді Laravel
export interface PaginatedResponse<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
    links: Array<{
      url: string | null
      label: string
      active: boolean
    }>
  }
}

// Структура одиночної відповіді Laravel Resource
export interface SingleResponse<T> {
  data: T
}

// Структура помилки валідації Laravel (422)
export interface ValidationError {
  message: string
  errors: Record<string, string[]>
}

// Структура загальної помилки API
export interface ApiError {
  message: string
  status?: number
}

// Параметри фільтрації задач
export interface TaskFilters {
  status?: string
  priority?: string
  category_id?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// Дані для створення/оновлення задачі
export interface TaskFormData {
  title: string
  description?: string | null
  status: string
  priority: string
  category_id: number | null
  deadline?: string | null
  tags?: number[]
}

// Дані для логіну
export interface LoginCredentials {
  email: string
  password: string
}

// Дані для реєстрації
export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}
```

---

### Крок 4: API Client з Interceptors

Створіть `src/api/client.ts` -- центральний Axios instance:

```typescript
// src/api/client.ts

import axios from 'axios'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'
import router from '@/router'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor: додаємо Bearer token до кожного запиту
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: обробка помилок
apiClient.interceptors.response.use(
  // Успішна відповідь -- просто повертаємо
  (response) => response,

  // Помилка -- обробляємо за статус-кодом
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status

    switch (status) {
      case 401:
        // Токен невалідний або протермінований
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // Перенаправляємо на логін тільки якщо ми не на сторінці логіну
        if (router.currentRoute.value.name !== 'login') {
          router.push({ name: 'login' })
        }
        break

      case 403:
        // Немає прав -- можна показати повідомлення
        console.error('Forbidden:', error.response?.data?.message)
        break

      case 404:
        // Ресурс не знайдено
        console.error('Not found:', error.response?.data?.message)
        break

      case 422:
        // Помилки валідації -- повертаємо як є, компонент обробить
        break

      case 429:
        // Rate limit -- показуємо повідомлення
        console.error('Too many requests. Please slow down.')
        break

      case 500:
        // Серверна помилка
        console.error('Server error:', error.response?.data?.message)
        break
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

> Цей interceptor -- фронтенд-аналог Laravel middleware. Request interceptor додає токен (як `auth:sanctum` перевіряє його), а response interceptor обробляє помилки (як exception handler у Laravel).

---

### Крок 5: Composable для помилок API

Створіть `src/composables/useApiErrors.ts` -- парсинг Laravel 422 помилок:

```typescript
// src/composables/useApiErrors.ts

import { ref } from 'vue'
import type { AxiosError } from 'axios'
import type { ValidationError } from '@/types'

export function useApiErrors() {
  // Обʼєкт помилок: { title: "The title field is required.", ... }
  const errors = ref<Record<string, string>>({})
  const generalError = ref<string>('')

  // Очистити всі помилки
  function clearErrors() {
    errors.value = {}
    generalError.value = ''
  }

  // Очистити помилку конкретного поля
  function clearFieldError(field: string) {
    delete errors.value[field]
  }

  // Обробити помилку Axios
  function handleError(error: unknown) {
    clearErrors()

    // Перевіряємо, чи це Axios error з відповіддю 422
    const axiosError = error as AxiosError<ValidationError>

    if (axiosError.response?.status === 422 && axiosError.response.data.errors) {
      // Laravel повертає: { errors: { title: ["The title field is required."] } }
      // Перетворюємо на: { title: "The title field is required." }
      const serverErrors = axiosError.response.data.errors

      for (const [field, messages] of Object.entries(serverErrors)) {
        errors.value[field] = messages[0] // Беремо перше повідомлення
      }
    } else if (axiosError.response?.data?.message) {
      // Загальна помилка (401, 403, 500 тощо)
      generalError.value = axiosError.response.data.message
    } else {
      // Невідома помилка (мережа, timeout тощо)
      generalError.value = 'An unexpected error occurred. Please try again.'
    }
  }

  // Отримати помилку для конкретного поля
  function getError(field: string): string {
    return errors.value[field] || ''
  }

  // Перевірити, чи є помилка для поля
  function hasError(field: string): boolean {
    return !!errors.value[field]
  }

  return {
    errors,
    generalError,
    clearErrors,
    clearFieldError,
    handleError,
    getError,
    hasError,
  }
}
```

---

### Крок 6: Auth Store (Pinia)

Створіть `src/stores/auth.ts`:

```typescript
// src/stores/auth.ts

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { User, LoginCredentials, RegisterData, SingleResponse } from '@/types'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref<User | null>(loadUser())
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  // --- Getters ---
  const isAuthenticated = computed(() => !!token.value)

  // --- Helpers ---
  function loadUser(): User | null {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  }

  function setAuth(newUser: User, newToken: string) {
    user.value = newUser
    token.value = newToken
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function clearAuth() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // --- Actions ---

  /**
   * Реєстрація нового користувача.
   * POST /api/register -> { user, token }
   *
   * При помилці 422 -- кидає error далі, щоб компонент показав помилки валідації.
   */
  async function register(data: RegisterData) {
    isLoading.value = true

    try {
      const response = await apiClient.post<{ user: User; token: string }>(
        '/register',
        data
      )

      setAuth(response.data.user, response.data.token)
      router.push({ name: 'tasks' })
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Логін існуючого користувача.
   * POST /api/login -> { user, token }
   */
  async function login(credentials: LoginCredentials) {
    isLoading.value = true

    try {
      const response = await apiClient.post<{ user: User; token: string }>(
        '/login',
        credentials
      )

      setAuth(response.data.user, response.data.token)
      router.push({ name: 'tasks' })
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Логаут.
   * POST /api/logout (видаляє токен на сервері)
   */
  async function logout() {
    try {
      await apiClient.post('/logout')
    } catch {
      // Навіть якщо запит упав -- очищуємо локальний стан
    } finally {
      clearAuth()
      router.push({ name: 'login' })
    }
  }

  /**
   * Отримати поточного користувача.
   * GET /api/user -> { data: User }
   * Використовується для перевірки валідності токена при завантаженні додатку.
   */
  async function fetchUser() {
    if (!token.value) return

    try {
      const response = await apiClient.get<SingleResponse<User>>('/user')
      user.value = response.data.data
      localStorage.setItem('user', JSON.stringify(response.data.data))
    } catch {
      // Токен невалідний -- очищуємо
      clearAuth()
    }
  }

  return {
    // State
    user,
    token,
    isLoading,

    // Getters
    isAuthenticated,

    // Actions
    register,
    login,
    logout,
    fetchUser,
  }
})
```

---

### Крок 7: Task Store (Pinia)

Створіть `src/stores/tasks.ts`:

```typescript
// src/stores/tasks.ts

import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type {
  Task,
  TaskFilters,
  TaskFormData,
  PaginatedResponse,
  SingleResponse,
  Category,
} from '@/types'

export const useTaskStore = defineStore('tasks', () => {
  // --- State ---
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const categories = ref<Category[]>([])
  const isLoading = ref(false)

  // Пагінація
  const meta = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  // Поточні фільтри
  const filters = ref<TaskFilters>({
    page: 1,
    per_page: 15,
  })

  // --- Actions ---

  /**
   * Завантажити список задач з фільтрами та пагінацією.
   * GET /api/tasks?status=pending&sort=deadline&page=1
   *
   * Відповідає: TaskController@index у Laravel
   */
  async function fetchTasks(newFilters?: Partial<TaskFilters>) {
    isLoading.value = true

    // Зберігаємо фільтри
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    // Очищуємо undefined/null/порожні параметри
    const params: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(filters.value)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value
      }
    }

    try {
      const response = await apiClient.get<PaginatedResponse<Task>>('/tasks', {
        params,
      })

      tasks.value = response.data.data
      meta.value = {
        current_page: response.data.meta.current_page,
        last_page: response.data.meta.last_page,
        per_page: response.data.meta.per_page,
        total: response.data.meta.total,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Завантажити одну задачу по ID.
   * GET /api/tasks/{id}
   *
   * Відповідає: TaskController@show
   */
  async function fetchTask(id: number) {
    isLoading.value = true

    try {
      const response = await apiClient.get<SingleResponse<Task>>(`/tasks/${id}`)
      currentTask.value = response.data.data
      return response.data.data
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Створити нову задачу.
   * POST /api/tasks
   *
   * Відповідає: TaskController@store
   * При 422 -- помилка летить далі до компонента.
   */
  async function createTask(data: TaskFormData) {
    const response = await apiClient.post<SingleResponse<Task>>('/tasks', data)
    // Після створення -- оновлюємо список
    await fetchTasks()
    return response.data.data
  }

  /**
   * Оновити існуючу задачу.
   * PUT /api/tasks/{id}
   *
   * Відповідає: TaskController@update
   */
  async function updateTask(id: number, data: TaskFormData) {
    const response = await apiClient.put<SingleResponse<Task>>(`/tasks/${id}`, data)
    // Оновлюємо задачу в локальному стані
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tasks.value[index] = response.data.data
    }
    return response.data.data
  }

  /**
   * Видалити задачу.
   * DELETE /api/tasks/{id}
   *
   * Відповідає: TaskController@destroy
   */
  async function deleteTask(id: number) {
    await apiClient.delete(`/tasks/${id}`)
    // Видаляємо з локального стану
    tasks.value = tasks.value.filter((t) => t.id !== id)
    meta.value.total--
  }

  /**
   * Завантажити список категорій.
   * GET /api/categories
   *
   * Використовується для select у формі створення задачі.
   */
  async function fetchCategories() {
    const response = await apiClient.get<PaginatedResponse<Category>>('/categories')
    categories.value = response.data.data
  }

  /**
   * Змінити сторінку пагінації.
   */
  async function goToPage(page: number) {
    await fetchTasks({ page })
  }

  /**
   * Скинути фільтри та завантажити всі задачі.
   */
  async function resetFilters() {
    filters.value = { page: 1, per_page: 15 }
    await fetchTasks()
  }

  return {
    // State
    tasks,
    currentTask,
    categories,
    isLoading,
    meta,
    filters,

    // Actions
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    fetchCategories,
    goToPage,
    resetFilters,
  }
})
```

---

### Крок 8: Vue Router з guards

Створіть `src/router/index.ts`:

```typescript
// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true }, // Тільки для незалогінених
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true }, // Тільки для залогінених
    },
    {
      path: '/tasks/create',
      name: 'task-create',
      component: () => import('@/views/TaskFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/:id/edit',
      name: 'task-edit',
      component: () => import('@/views/TaskFormView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard -- аналог auth:sanctum middleware у Laravel
router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  // Якщо маршрут вимагає авторизації, а токена немає -- на логін
  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }

  // Якщо маршрут для гостей (логін/реєстрація), а користувач залогінений -- на задачі
  if (to.meta.guest && token) {
    return { name: 'tasks' }
  }
})

export default router
```

> `router.beforeEach()` -- це фронтенд-аналог `auth:sanctum` middleware у Laravel. Laravel перевіряє токен на сервері, Vue Router перевіряє наявність токена на клієнті. Обидва рівні захисту працюють разом.

---

### Крок 9: LoginView

Створіть `src/views/LoginView.vue`:

```vue
<!-- src/views/LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApiErrors } from '@/composables/useApiErrors'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const { errors, generalError, handleError, clearErrors, hasError, getError } = useApiErrors()

const form = ref({
  email: '',
  password: '',
})

async function onSubmit() {
  clearErrors()

  try {
    await authStore.login(form.value)
    // При успіху -- authStore.login() сам перенаправить на /tasks
  } catch (error) {
    handleError(error)
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>Login</h1>

    <!-- Загальна помилка (401 -- невірні credentials) -->
    <div v-if="generalError" class="alert alert-error">
      {{ generalError }}
    </div>

    <form @submit.prevent="onSubmit">
      <!-- Email -->
      <div class="form-group" :class="{ 'has-error': hasError('email') }">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="your@email.com"
          required
        />
        <span v-if="hasError('email')" class="error-message">
          {{ getError('email') }}
        </span>
      </div>

      <!-- Password -->
      <div class="form-group" :class="{ 'has-error': hasError('password') }">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="Your password"
          required
        />
        <span v-if="hasError('password')" class="error-message">
          {{ getError('password') }}
        </span>
      </div>

      <!-- Submit -->
      <button type="submit" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? 'Logging in...' : 'Login' }}
      </button>
    </form>

    <p class="auth-link">
      Don't have an account?
      <RouterLink :to="{ name: 'register' }">Register</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 32px;
}

h1 {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group.has-error input {
  border-color: #ef4444;
}

.error-message {
  display: block;
  color: #ef4444;
  font-size: 13px;
  margin-top: 4px;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

button {
  width: 100%;
  padding: 10px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

.auth-link {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
}
</style>
```

---

### Крок 10: RegisterView

Створіть `src/views/RegisterView.vue`:

```vue
<!-- src/views/RegisterView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApiErrors } from '@/composables/useApiErrors'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const { generalError, handleError, clearErrors, hasError, getError } = useApiErrors()

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

async function onSubmit() {
  clearErrors()

  try {
    await authStore.register(form.value)
  } catch (error) {
    handleError(error)
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>Register</h1>

    <div v-if="generalError" class="alert alert-error">
      {{ generalError }}
    </div>

    <form @submit.prevent="onSubmit">
      <!-- Name -->
      <div class="form-group" :class="{ 'has-error': hasError('name') }">
        <label for="name">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Your name"
          required
        />
        <span v-if="hasError('name')" class="error-message">
          {{ getError('name') }}
        </span>
      </div>

      <!-- Email -->
      <div class="form-group" :class="{ 'has-error': hasError('email') }">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="your@email.com"
          required
        />
        <span v-if="hasError('email')" class="error-message">
          {{ getError('email') }}
        </span>
      </div>

      <!-- Password -->
      <div class="form-group" :class="{ 'has-error': hasError('password') }">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="Min 8 characters"
          required
        />
        <span v-if="hasError('password')" class="error-message">
          {{ getError('password') }}
        </span>
      </div>

      <!-- Password Confirmation -->
      <div class="form-group">
        <label for="password_confirmation">Confirm Password</label>
        <input
          id="password_confirmation"
          v-model="form.password_confirmation"
          type="password"
          placeholder="Repeat password"
          required
        />
      </div>

      <!-- Submit -->
      <button type="submit" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? 'Creating account...' : 'Register' }}
      </button>
    </form>

    <p class="auth-link">
      Already have an account?
      <RouterLink :to="{ name: 'login' }">Login</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 32px;
}

h1 {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group.has-error input {
  border-color: #ef4444;
}

.error-message {
  display: block;
  color: #ef4444;
  font-size: 13px;
  margin-top: 4px;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

button {
  width: 100%;
  padding: 10px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

.auth-link {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
}
</style>
```

---

### Крок 11: TasksView -- список задач з фільтрами та пагінацією

Створіть `src/views/TasksView.vue`:

```vue
<!-- src/views/TasksView.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import type { TaskFilters } from '@/types'

const router = useRouter()
const taskStore = useTaskStore()
const authStore = useAuthStore()

// Локальні фільтри (копія, щоб не мутувати store напряму)
const localFilters = ref<TaskFilters>({
  status: '',
  priority: '',
  search: '',
  sort: 'created_at',
  order: 'desc',
})

onMounted(async () => {
  await taskStore.fetchTasks()
})

async function applyFilters() {
  await taskStore.fetchTasks({
    ...localFilters.value,
    page: 1, // Скидаємо на першу сторінку при зміні фільтрів
  })
}

async function resetFilters() {
  localFilters.value = {
    status: '',
    priority: '',
    search: '',
    sort: 'created_at',
    order: 'desc',
  }
  await taskStore.resetFilters()
}

async function handleDelete(taskId: number) {
  if (!confirm('Are you sure you want to delete this task?')) return

  try {
    await taskStore.deleteTask(taskId)
  } catch (error) {
    console.error('Failed to delete task:', error)
  }
}

async function handleLogout() {
  await authStore.logout()
}

function getStatusBadgeClass(status: string): string {
  return {
    pending: 'badge-yellow',
    in_progress: 'badge-blue',
    done: 'badge-green',
  }[status] || 'badge-gray'
}

function getPriorityBadgeClass(priority: string): string {
  return {
    low: 'badge-gray',
    medium: 'badge-yellow',
    high: 'badge-red',
  }[priority] || 'badge-gray'
}
</script>

<template>
  <div class="tasks-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>My Tasks</h1>
        <p v-if="authStore.user">Welcome, {{ authStore.user.name }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="router.push({ name: 'task-create' })">
          + New Task
        </button>
        <button class="btn btn-outline" @click="handleLogout">
          Logout
        </button>
      </div>
    </header>

    <!-- Filters -->
    <section class="filters">
      <input
        v-model="localFilters.search"
        type="text"
        placeholder="Search tasks..."
        @keyup.enter="applyFilters"
      />

      <select v-model="localFilters.status" @change="applyFilters">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select v-model="localFilters.priority" @change="applyFilters">
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <select v-model="localFilters.sort" @change="applyFilters">
        <option value="created_at">Date created</option>
        <option value="deadline">Deadline</option>
        <option value="priority">Priority</option>
        <option value="title">Title</option>
      </select>

      <select v-model="localFilters.order" @change="applyFilters">
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>

      <button class="btn btn-outline" @click="resetFilters">Reset</button>
    </section>

    <!-- Loading -->
    <div v-if="taskStore.isLoading" class="loading">Loading tasks...</div>

    <!-- Empty state -->
    <div v-else-if="taskStore.tasks.length === 0" class="empty-state">
      <p>No tasks found. Create your first task!</p>
    </div>

    <!-- Task list -->
    <div v-else class="task-list">
      <div
        v-for="task in taskStore.tasks"
        :key="task.id"
        class="task-card"
      >
        <div class="task-header">
          <h3>{{ task.title }}</h3>
          <div class="task-badges">
            <span class="badge" :class="getStatusBadgeClass(task.status)">
              {{ task.status.replace('_', ' ') }}
            </span>
            <span class="badge" :class="getPriorityBadgeClass(task.priority)">
              {{ task.priority }}
            </span>
          </div>
        </div>

        <p v-if="task.description" class="task-description">
          {{ task.description }}
        </p>

        <div class="task-meta">
          <span v-if="task.category" class="meta-item">
            Category: {{ task.category.name }}
          </span>
          <span v-if="task.deadline" class="meta-item">
            Deadline: {{ task.deadline }}
          </span>
          <span v-if="task.tags.length > 0" class="meta-item">
            Tags: {{ task.tags.map(t => t.name).join(', ') }}
          </span>
        </div>

        <div class="task-actions">
          <button
            class="btn btn-sm btn-outline"
            @click="router.push({ name: 'task-edit', params: { id: task.id } })"
          >
            Edit
          </button>
          <button
            class="btn btn-sm btn-danger"
            @click="handleDelete(task.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <nav v-if="taskStore.meta.last_page > 1" class="pagination">
      <button
        :disabled="taskStore.meta.current_page === 1"
        @click="taskStore.goToPage(taskStore.meta.current_page - 1)"
      >
        Previous
      </button>

      <span class="page-info">
        Page {{ taskStore.meta.current_page }} of {{ taskStore.meta.last_page }}
        ({{ taskStore.meta.total }} tasks)
      </span>

      <button
        :disabled="taskStore.meta.current_page === taskStore.meta.last_page"
        @click="taskStore.goToPage(taskStore.meta.current_page + 1)"
      >
        Next
      </button>
    </nav>
  </div>
</template>

<style scoped>
.tasks-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
}

.page-header p {
  color: #6b7280;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* Filters */
.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.filters input,
.filters select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.filters input {
  flex: 1;
  min-width: 200px;
}

/* Task cards */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-header h3 {
  margin: 0;
  font-size: 16px;
}

.task-badges {
  display: flex;
  gap: 4px;
}

.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-gray { background: #f3f4f6; color: #4b5563; }

.task-description {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.task-actions {
  display: flex;
  gap: 8px;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }
.btn-outline { background: white; border-color: #d1d5db; color: #374151; }
.btn-outline:hover { background: #f9fafb; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
.btn-sm { padding: 4px 12px; font-size: 13px; }

/* States */
.loading, .empty-state {
  text-align: center;
  padding: 48px;
  color: #6b7280;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}
</style>
```

---

### Крок 12: TaskFormView -- створення/редагування задачі

Створіть `src/views/TaskFormView.vue`:

```vue
<!-- src/views/TaskFormView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useApiErrors } from '@/composables/useApiErrors'
import type { TaskFormData } from '@/types'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const { generalError, handleError, clearErrors, hasError, getError } = useApiErrors()

const isLoading = ref(false)

// Визначаємо режим: create або edit
const isEditMode = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEditMode.value ? 'Edit Task' : 'Create Task'))

const form = ref<TaskFormData>({
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  category_id: null,
  deadline: '',
  tags: [],
})

onMounted(async () => {
  // Завантажуємо категорії для select
  await taskStore.fetchCategories()

  // Якщо режим редагування -- завантажуємо задачу
  if (isEditMode.value) {
    const taskId = Number(route.params.id)
    const task = await taskStore.fetchTask(taskId)

    if (task) {
      form.value = {
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        category_id: task.category?.id || null,
        deadline: task.deadline || '',
        tags: task.tags.map((t) => t.id),
      }
    }
  }
})

async function onSubmit() {
  clearErrors()
  isLoading.value = true

  try {
    if (isEditMode.value) {
      const taskId = Number(route.params.id)
      await taskStore.updateTask(taskId, form.value)
    } else {
      await taskStore.createTask(form.value)
    }

    // Успіх -- повертаємось до списку
    router.push({ name: 'tasks' })
  } catch (error) {
    handleError(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="form-container">
    <h1>{{ pageTitle }}</h1>

    <div v-if="generalError" class="alert alert-error">
      {{ generalError }}
    </div>

    <form @submit.prevent="onSubmit">
      <!-- Title -->
      <div class="form-group" :class="{ 'has-error': hasError('title') }">
        <label for="title">Title *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="Task title"
          required
        />
        <span v-if="hasError('title')" class="error-message">
          {{ getError('title') }}
        </span>
      </div>

      <!-- Description -->
      <div class="form-group" :class="{ 'has-error': hasError('description') }">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Task description (optional)"
          rows="3"
        />
        <span v-if="hasError('description')" class="error-message">
          {{ getError('description') }}
        </span>
      </div>

      <!-- Status & Priority (в одному рядку) -->
      <div class="form-row">
        <div class="form-group" :class="{ 'has-error': hasError('status') }">
          <label for="status">Status</label>
          <select id="status" v-model="form.status">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <span v-if="hasError('status')" class="error-message">
            {{ getError('status') }}
          </span>
        </div>

        <div class="form-group" :class="{ 'has-error': hasError('priority') }">
          <label for="priority">Priority</label>
          <select id="priority" v-model="form.priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <span v-if="hasError('priority')" class="error-message">
            {{ getError('priority') }}
          </span>
        </div>
      </div>

      <!-- Category -->
      <div class="form-group" :class="{ 'has-error': hasError('category_id') }">
        <label for="category">Category *</label>
        <select id="category" v-model="form.category_id" required>
          <option :value="null" disabled>Select category</option>
          <option
            v-for="category in taskStore.categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        <span v-if="hasError('category_id')" class="error-message">
          {{ getError('category_id') }}
        </span>
      </div>

      <!-- Deadline -->
      <div class="form-group" :class="{ 'has-error': hasError('deadline') }">
        <label for="deadline">Deadline</label>
        <input
          id="deadline"
          v-model="form.deadline"
          type="date"
        />
        <span v-if="hasError('deadline')" class="error-message">
          {{ getError('deadline') }}
        </span>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task') }}
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="router.push({ name: 'tasks' })"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 32px;
}

h1 {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group.has-error input,
.form-group.has-error select,
.form-group.has-error textarea {
  border-color: #ef4444;
}

.error-message {
  display: block;
  color: #ef4444;
  font-size: 13px;
  margin-top: 4px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: white; border-color: #d1d5db; color: #374151; }
.btn-outline:hover { background: #f9fafb; }
</style>
```

---

### Крок 13: Оновіть App.vue

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
/* Global reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
  background: #f9fafb;
  line-height: 1.5;
}

a {
  color: #3b82f6;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
```

---

### Крок 14: Запустіть обидва сервери та протестуйте

#### Термінал 1: Laravel API

```bash
cd task-manager
php artisan serve
# Laravel development server started: http://127.0.0.1:8000
```

#### Термінал 2: Vue SPA

```bash
cd task-manager-frontend
npm run dev
# VITE v6.x  ready in 500ms
# Local: http://localhost:5173/
```

#### Тестування повного flow

1. **Відкрийте** `http://localhost:5173` у браузері
2. **Реєстрація**: перейдіть на `/register`, заповніть форму
   - Перевірте: при порожньому email -- червона помилка під полем (422 від Laravel)
   - Заповніть коректно -- перенаправлення на `/tasks` (список задач)
3. **Створення задачі**: натисніть "+ New Task"
   - Заповніть форму, натисніть "Create Task"
   - Перевірте: задача зʼявилась у списку
4. **Фільтрація**: змініть статус на "Pending" у фільтрах
   - Перевірте: показуються тільки pending задачі
5. **Редагування**: натисніть "Edit" на задачі
   - Змініть статус на "In Progress", збережіть
   - Перевірте: бейдж змінився у списку
6. **Видалення**: натисніть "Delete" на задачі
   - Підтвердіть -- задача зникає
7. **Пагінація**: створіть 20+ задач, перевірте навігацію сторінками
8. **Логаут**: натисніть "Logout"
   - Перевірте: перенаправлення на `/login`
   - Перевірте: прямий перехід на `/` повертає на `/login` (guard працює)

---

## Перевірка

Переконайтесь, що все працює:

```bash
# 1. Laravel API запущений і відповідає
curl -s http://localhost:8000/api/health | jq
# Очікуємо: { "status": "ok" }

# 2. Vue dev-сервер працює
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
# Очікуємо: 200

# 3. Реєстрація через API працює
curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123","password_confirmation":"password123"}' | jq '.token'
# Очікуємо: рядок токена

# 4. CORS заголовки присутні
curl -s -D - -X OPTIONS http://localhost:8000/api/tasks \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" 2>&1 | grep "Access-Control-Allow-Origin"
# Очікуємо: Access-Control-Allow-Origin: http://localhost:5173

# 5. Vue SPA рендерить сторінки (відкрийте у браузері)
# http://localhost:5173/login -- форма логіну
# http://localhost:5173/register -- форма реєстрації
```

---

## Міні-тест

**1. Чому Vue SPA та Laravel API запускаються як окремі сервери?**

a) Тому що Vue не може працювати з PHP
b) Для незалежного розгортання, масштабування та можливості мати кілька клієнтів для одного API
c) Тому що Laravel не підтримує фронтенд
d) Це тимчасове рішення тільки для розробки

**2. Для чого потрібен request interceptor в Axios?**

a) Для кешування запитів
b) Для автоматичного додавання Bearer токена до кожного запиту
c) Для шифрування даних
d) Для стиснення JSON

**3. Що робить Vue Router navigation guard `beforeEach` при відсутності токена?**

a) Робить запит до API для перевірки автентифікації
b) Показує модальне вікно з помилкою
c) Перенаправляє на сторінку логіну, якщо маршрут вимагає авторизації
d) Видаляє всі дані з localStorage

**4. Як composable `useApiErrors` обробляє помилку 422 від Laravel?**

a) Показує alert з повним JSON-відповіддю
b) Перетворює `errors: { title: ["required"] }` у зручний формат для відображення під полями форми
c) Перенаправляє на сторінку помилки
d) Повторює запит автоматично

**5. Навіщо потрібен `VITE_` prefix для змінних середовища у Vue?**

a) Це конвенція Vite -- тільки змінні з цим префіксом доступні у клієнтському коді
b) Це вимога TypeScript
c) Без нього змінна буде undefined
d) Варіанти A і C обидва правильні

---

## Практичне завдання

Додайте сторінку управління категоріями до Vue SPA:

### Вимоги

1. Створіть `src/views/CategoriesView.vue`:
   - Список всіх категорій з кількістю задач
   - Форма створення нової категорії (inline, без окремої сторінки)
   - Кнопка видалення категорії
   - Відображення помилок валідації

2. Додайте маршрут `/categories` у router (з `requiresAuth: true`)

3. Додайте actions у `taskStore` або створіть окремий `categoryStore`:
   - `createCategory(data)` -- POST /api/categories
   - `deleteCategory(id)` -- DELETE /api/categories/{id}

4. Додайте посилання на сторінку категорій у header `TasksView`

### Перевірка

- Перейдіть на `/categories` -- бачите список категорій
- Створіть нову категорію -- вона зʼявляється у списку
- Спробуйте створити з порожнім name -- бачите помилку валідації
- Видаліть категорію -- вона зникає

---

## Відповіді на тест

1. **b)** Окремі сервери дозволяють незалежне розгортання, масштабування (API можна масштабувати окремо від фронтенду), і один API може обслуговувати Vue SPA, мобільний додаток, та інших клієнтів.
2. **b)** Request interceptor автоматично додає заголовок `Authorization: Bearer <token>` до кожного вихідного запиту, якщо токен є в localStorage. Це позбавляє від необхідності додавати токен вручну в кожному виклику API.
3. **c)** `beforeEach` перевіряє мета-поле `requiresAuth` маршруту. Якщо маршрут вимагає авторизації, а токена немає в localStorage -- перенаправляє на `/login`. Це клієнтський аналог `auth:sanctum` middleware.
4. **b)** Composable парсить Laravel-формат `{ errors: { field: ["message1", "message2"] } }` і перетворює його на простий обʼєкт `{ field: "message1" }`, який легко використовувати для відображення помилок під полями форми.
5. **d)** Vite з міркувань безпеки не включає всі змінні середовища у клієнтський бандл. Тільки змінні з префіксом `VITE_` доступні через `import.meta.env`. Без цього префікса змінна буде `undefined` у браузері.
