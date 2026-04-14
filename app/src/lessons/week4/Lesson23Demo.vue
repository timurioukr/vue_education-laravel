<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'axios.create({ baseURL })', laravel: "Route::middleware('auth:sanctum')" },
  { vue: 'interceptors.request (Bearer token)', laravel: '$request->bearerToken()' },
  {
    vue: 'interceptors.response (401 → redirect)',
    laravel: 'abort(401) / AuthenticationException',
  },
  { vue: 'useApiErrors (flatten 422)', laravel: '422 { errors: { field: [...] } }' },
  {
    vue: 'Pinia auth store (login/logout)',
    laravel: 'Sanctum::createToken / currentAccessToken->delete',
  },
  { vue: 'router.beforeEach (requiresAuth)', laravel: "Route::middleware('auth:sanctum')" },
]

const curlOutput = [
  '$ # === Vue SPA + Laravel API Flow ===',
  '',
  '$ # Step 1: Router guard — no token',
  '  Navigate to /tasks → redirect to /login?redirect=%2Ftasks',
  '',
  '$ # Step 2: Login',
  '  [POST] http://localhost:8000/api/login',
  '  {"email":"user@example.com","password":"password123"}',
  '  → 200 OK',
  '  → { "user": { "id": 1, "name": "Timur" }, "token": "1|abc123xyz789" }',
  '  → Token saved to localStorage',
  '',
  '$ # Step 3: Router guard — with token',
  '  Navigate to /tasks → guard passes ✓',
  '',
  '$ # Step 4: Fetch tasks (interceptor adds Bearer)',
  '  [GET] http://localhost:8000/api/tasks',
  '    Authorization: Bearer 1|abc123xyz789',
  '  → 200 OK',
  '  → { "data": [',
  '      { "id": 1, "title": "Setup Vue", "status": "done" },',
  '      { "id": 2, "title": "Connect API", "status": "in_progress" },',
  '      { "id": 3, "title": "Deploy", "status": "pending" }',
  '    ], "meta": { "current_page": 1, "total": 3 } }',
  '',
  '$ # Step 5: Create task — validation error',
  '  [POST] http://localhost:8000/api/tasks',
  '    Authorization: Bearer 1|abc123xyz789',
  '    { "title": "" }',
  '  → 422 Unprocessable Entity',
  '  → { "message": "The title field is required.",',
  '      "errors": { "title": ["The title field is required."] } }',
  '  → useApiErrors: { "title": "The title field is required." }',
  '',
  '$ # Step 6: Create task — success',
  '  [POST] http://localhost:8000/api/tasks',
  '    Authorization: Bearer 1|abc123xyz789',
  '    { "title": "Write tests" }',
  '  → 201 Created',
  '  → { "data": { "id": 4, "title": "Write tests", "status": "pending" } }',
  '',
  '$ # Step 7: Logout',
  '  [POST] http://localhost:8000/api/logout',
  '  → Token removed from localStorage',
  '  → Redirect to /login',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput
      :lines="curlOutput"
      title="Vue SPA → Laravel API — login, fetch, validate, logout"
    />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
