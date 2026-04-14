<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'Vite proxy (dev)', laravel: 'config/cors.php (production)' },
  { vue: 'axios withCredentials: true', laravel: 'supports_credentials: true' },
  {
    vue: 'response.headers["x-ratelimit-remaining"]',
    laravel: 'exposed_headers + ThrottleRequests',
  },
  { vue: 'VITE_API_VERSION=v1', laravel: "Route::prefix('v1')->group(...)" },
  {
    vue: 'axios interceptor (429 → toast)',
    laravel: 'RateLimiter::for("api", Limit::perMinute(60))',
  },
  { vue: 'normalizeTask(raw, version)', laravel: 'V1\\TaskResource vs V2\\TaskResource' },
]

const curlOutput = [
  '# ── CORS Preflight ──────────────────────────────────',
  '',
  '$ curl -X OPTIONS http://localhost:8000/api/tasks \\',
  '  -H "Origin: http://localhost:5173" \\',
  '  -H "Access-Control-Request-Method: POST" \\',
  '  -H "Access-Control-Request-Headers: content-type, authorization" \\',
  '  -v',
  '',
  '< HTTP/1.1 204 No Content',
  '< Access-Control-Allow-Origin: http://localhost:5173',
  '< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS',
  '< Access-Control-Allow-Headers: content-type, authorization',
  '< Access-Control-Allow-Credentials: true',
  '< Access-Control-Max-Age: 7200',
  '',
  '# ── Rate Limit (429) ───────────────────────────────',
  '',
  '$ for i in {1..6}; do curl -s -o /dev/null -w "%{http_code}" \\',
  '  -X POST http://localhost:8000/api/login \\',
  '  -H "Content-Type: application/json" \\',
  '  -d \'{"email":"test@test.com","password":"wrong"}\'; echo; done',
  '',
  '401    # спроба 1',
  '401    # спроба 2',
  '401    # спроба 3',
  '401    # спроба 4',
  '401    # спроба 5',
  '429    # спроба 6 — Too Many Requests!',
  '',
  '$ curl -s http://localhost:8000/api/login \\',
  '  -H "Content-Type: application/json" \\',
  '  -d \'{"email":"test@test.com","password":"wrong"}\' | jq',
  '',
  '{',
  '  "message": "Too Many Attempts.",',
  '  "retry_after": 42',
  '}',
  '',
  'Response Headers:',
  '  X-RateLimit-Limit: 5',
  '  X-RateLimit-Remaining: 0',
  '  Retry-After: 42',
  '',
  '# ── API Versioning ─────────────────────────────────',
  '',
  '$ curl -s http://localhost:8000/api/v1/tasks/1 \\',
  '  -H "Authorization: Bearer token123" | jq',
  '',
  '{',
  '  "data": {',
  '    "id": 1,',
  '    "title": "Buy groceries",',
  '    "status": "pending",',
  '    "deadline": "2026-04-15T00:00:00.000Z",',
  '    "created_at": "2026-04-01T10:00:00.000Z"',
  '  }',
  '}',
  '',
  '$ curl -s http://localhost:8000/api/v2/tasks/1 \\',
  '  -H "Authorization: Bearer token123" | jq',
  '',
  '{',
  '  "data": {',
  '    "id": 1,',
  '    "title": "Buy groceries",',
  '    "status": { "value": "pending", "label": "Pending" },',
  '    "deadline": {',
  '      "date": "2026-04-15T00:00:00.000Z",',
  '      "is_overdue": false,',
  '      "human": "2 days from now"',
  '    },',
  '    "timestamps": {',
  '      "created": "2026-04-01T10:00:00.000Z",',
  '      "updated": "2026-04-13T08:30:00.000Z"',
  '    }',
  '  }',
  '}',
  '',
  '# ── Health Check ───────────────────────────────────',
  '',
  '$ curl -s http://localhost:8000/api/health | jq',
  '{',
  '  "status": "ok",',
  '  "version": "1.0.0",',
  '  "time": "2026-04-13T10:00:00.000Z"',
  '}',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput
      :lines="curlOutput"
      title="CORS preflight + 429 rate limit + /api/v1 vs /api/v2"
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
