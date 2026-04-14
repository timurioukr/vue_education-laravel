<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'app.use((req, res, next) => next())', laravel: 'handle(Request $r, Closure $next)' },
  { vue: 'next() в Express', laravel: 'return $next($request)' },
  { vue: 'axios.interceptors.request', laravel: 'before middleware (до $next)' },
  { vue: 'axios.interceptors.response', laravel: 'after middleware (після $next)' },
  { vue: 'throttle/debounce composable', laravel: "->middleware('throttle:api')" },
  { vue: 'definePageMeta({ middleware })', laravel: 'Route::middleware([...])' },
]

const curlOutput = [
  '# 5 спроб логіну поспіль (ліміт = 5/хв)',
  '$ for i in {1..6}; do',
  '    echo "Attempt $i:"',
  '    curl -s -o /dev/null -w "HTTP %{http_code}\\n" \\',
  '      -X POST localhost:8000/api/login \\',
  '      -H "Accept: application/json" \\',
  '      -H "Content-Type: application/json" \\',
  '      -d \'{"email":"john@example.com","password":"wrong"}\'',
  '  done',
  '',
  'Attempt 1: HTTP 401',
  'Attempt 2: HTTP 401',
  'Attempt 3: HTTP 401',
  'Attempt 4: HTTP 401',
  'Attempt 5: HTTP 401',
  'Attempt 6: HTTP 429   ← Too Many Requests',
  '',
  '# Заголовки rate-limiter:',
  '$ curl -s -o /dev/null -D - localhost:8000/api/tasks \\',
  '    -H "Authorization: Bearer $TOKEN" \\',
  '    -H "Accept: application/json" | grep -i "ratelimit\\|retry"',
  '',
  'X-Ratelimit-Limit:     60',
  'X-Ratelimit-Remaining: 59',
  '',
  '# 4-та задача при ліміті 3:',
  '$ curl -s -X POST localhost:8000/api/tasks \\',
  '    -H "Authorization: Bearer $TOKEN" \\',
  '    -H "Accept: application/json" \\',
  '    -H "Content-Type: application/json" \\',
  '    -d \'{"title":"4th task","status":"pending"}\' | jq .',
  '',
  '{ "message":"Task limit reached. Maximum 3.",',
  '  "current_count":3, "max_allowed":3 }',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Middleware у дії: throttle 429 + task.limit 403" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
