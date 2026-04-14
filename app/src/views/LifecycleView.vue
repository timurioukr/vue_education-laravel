<script setup lang="ts">
import { computed } from 'vue'
import { useLifecycleAnimation } from '@/composables/useLifecycleAnimation'
import CodeBlock from '@/components/interactive/CodeBlock.vue'

interface Layer {
  name: string
  label: string
  color: string
  icon: string
  description: string
  code: string
  vueParallel: string
  subLayers: string[]
}

const LAYERS: Layer[] = [
  {
    name: 'HTTP Request',
    label: 'method, URL, headers',
    color: '#7c5cfc',
    icon: '\u{1F4E8}',
    description:
      'HTTP-\u0437\u0430\u043F\u0438\u0442 \u0432\u0456\u0434 Vue SPA \u0447\u0435\u0440\u0435\u0437 axios. \u041C\u0456\u0441\u0442\u0438\u0442\u044C method (POST), URL (/api/tasks), headers (Authorization: Bearer token) \u0442\u0430 body (JSON). \u0426\u0435 \u0432\u0445\u0456\u0434\u043D\u0430 \u0442\u043E\u0447\u043A\u0430 \u2014 \u0432\u0441\u0435 \u043F\u043E\u0447\u0438\u043D\u0430\u0454\u0442\u044C\u0441\u044F \u0442\u0443\u0442.',
    code: `POST /api/tasks HTTP/1.1\nHost: localhost:8000\nAuthorization: Bearer 1|abc123def456\nContent-Type: application/json\n\n{\n    "title": "Buy milk",\n    "status": "pending",\n    "priority": "high"\n}`,
    vueParallel:
      "axios.post('/api/tasks', data, { headers: { Authorization: `Bearer ${token}` } })",
    subLayers: ['method', 'URL', 'headers', 'body'],
  },
  {
    name: 'Middleware',
    label: 'auth, throttle, CORS',
    color: '#3b82f6',
    icon: '\u{1F6E1}\uFE0F',
    description:
      '\u041A\u043E\u043D\u0432\u0435\u0454\u0440 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043E\u043A. auth:sanctum \u0432\u0430\u043B\u0456\u0434\u0443\u0454 Bearer-\u0442\u043E\u043A\u0435\u043D \u0456 \u0432\u0438\u0437\u043D\u0430\u0447\u0430\u0454 user_id. throttle:api \u043E\u0431\u043C\u0435\u0436\u0443\u0454 \u0434\u043E 60 \u0437\u0430\u043F\u0438\u0442\u0456\u0432/\u0445\u0432. EnsureJsonResponse \u0433\u0430\u0440\u0430\u043D\u0442\u0443\u0454 JSON-\u0444\u043E\u0440\u043C\u0430\u0442 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439. \u042F\u043A\u0449\u043E \u0431\u0443\u0434\u044C-\u044F\u043A\u0430 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u043D\u0435 \u043F\u0440\u043E\u0439\u0448\u043B\u0430 \u2014 401/429, \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u0435\u0440 \u041D\u0415 \u0432\u0438\u043A\u043B\u0438\u043A\u0430\u0454\u0442\u044C\u0441\u044F.',
    code: `public function handle(Request $request, Closure $next)\n{\n    // auth:sanctum \u2014 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0442\u043E\u043A\u0435\u043D\u0430\n    if (! $request->bearerToken()) {\n        return response()->json(\n            ['message' => 'Unauthenticated.'], 401\n        );\n    }\n\n    // throttle:api \u2014 rate limiting\n    // EnsureJsonResponse \u2014 Accept: application/json\n\n    return $next($request); // \u2192 \u0434\u0430\u043B\u0456 \u0434\u043E Router\n}`,
    vueParallel:
      "axios.interceptors.request.use(config => { config.headers.Authorization = 'Bearer ' + token; return config })",
    subLayers: ['auth:sanctum', 'throttle:api', 'EnsureJson', 'CORS'],
  },
  {
    name: 'Router',
    label: 'routes/api.php',
    color: '#10b981',
    icon: '\u{1F500}',
    description:
      '\u0417\u0456\u0441\u0442\u0430\u0432\u043B\u044F\u0454 URL + HTTP-\u043C\u0435\u0442\u043E\u0434 \u0437 \u0432\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u043C\u0438 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430\u043C\u0438. POST /api/tasks \u2192 TaskController@store. \u0412\u0438\u0442\u044F\u0433\u0443\u0454 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u0437 URL ({task} \u2192 $task \u0447\u0435\u0440\u0435\u0437 Route Model Binding). \u042F\u043A\u0449\u043E \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u2014 404.',
    code: `// routes/api.php\nRoute::middleware('auth:sanctum')->group(function () {\n    Route::apiResource('tasks', TaskController::class);\n    // POST   /api/tasks       \u2192 store\n    // GET    /api/tasks       \u2192 index\n    // GET    /api/tasks/{task} \u2192 show\n    // PUT    /api/tasks/{task} \u2192 update\n    // DELETE /api/tasks/{task} \u2192 destroy\n});`,
    vueParallel: "Vue Router: { path: '/tasks', component: TasksView }",
    subLayers: ['route matching', 'model binding'],
  },
  {
    name: 'Controller',
    label: 'Policy + validate',
    color: '#f59e0b',
    icon: '\u{1F3AE}',
    description:
      '\u0411\u0456\u0437\u043D\u0435\u0441-\u043B\u043E\u0433\u0456\u043A\u0430. \u0421\u043F\u0435\u0440\u0448\u0443 authorize() \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u0454 Policy \u2014 \u0447\u0438 \u043C\u0430\u0454 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447 \u043F\u0440\u0430\u0432\u043E (403 \u044F\u043A\u0449\u043E \u043D\u0456). \u041F\u043E\u0442\u0456\u043C FormRequest \u0432\u0430\u043B\u0456\u0434\u0443\u0454 \u0434\u0430\u043D\u0456 (422 \u044F\u043A\u0449\u043E \u043D\u0435\u0432\u0430\u043B\u0456\u0434\u043D\u0456). \u041D\u0430\u0440\u0435\u0448\u0442\u0456 \u2014 \u0432\u0438\u043A\u043E\u043D\u0443\u0454 \u0434\u0456\u044E: \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F, \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0447\u0438 \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043D\u044F \u0447\u0435\u0440\u0435\u0437 Eloquent.',
    code: `public function store(StoreTaskRequest $request)\n{\n    // 1. Policy: authorize\n    $this->authorize('create', Task::class);\n\n    // 2. FormRequest: \u0432\u0436\u0435 \u043F\u0440\u043E\u0432\u0430\u043B\u0456\u0434\u043E\u0432\u0430\u043D\u043E\n    // 3. \u0414\u0456\u044F: \u0441\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 \u0432\u0456\u0434\u043D\u043E\u0448\u0435\u043D\u043D\u044F\n    $task = $request->user()\n        ->tasks()\n        ->create($request->validated());\n\n    return new TaskResource($task); // \u2192 Response\n}`,
    vueParallel:
      'const { errors, handleError } = useApiErrors() // \u043E\u0431\u0440\u043E\u0431\u043A\u0430 422',
    subLayers: ['Policy (authorize)', 'FormRequest (validate)', 'action'],
  },
  {
    name: 'Model / DB',
    label: 'Eloquent + SQL',
    color: '#ef4444',
    icon: '\u{1F5C4}\uFE0F',
    description:
      'Eloquent ORM \u043F\u0435\u0440\u0435\u0442\u0432\u043E\u0440\u044E\u0454 PHP-\u0432\u0438\u043A\u043B\u0438\u043A\u0438 \u043D\u0430 SQL. Scopes \u0444\u0456\u043B\u044C\u0442\u0440\u0443\u044E\u0442\u044C \u0437\u0430\u043F\u0438\u0442\u0438 (byStatus, search). Observer \u0440\u0435\u0430\u0433\u0443\u0454 \u043D\u0430 \u0437\u043C\u0456\u043D\u0438 (TaskObserver::created \u2192 \u043F\u043E\u0434\u0456\u044F). \u0420\u0435\u0430\u043B\u044C\u043D\u0438\u0439 SQL: INSERT INTO tasks (title, status, user_id) VALUES (...).',
    code: `// Eloquent \u2192 SQL\n$task = $request->user()->tasks()->create([\n    'title'  => 'Buy milk',\n    'status' => 'pending',\n]);\n\n// SQL: INSERT INTO tasks\n//   (title, status, user_id, created_at, updated_at)\n//   VALUES ('Buy milk', 'pending', 1, NOW(), NOW())\n\n// Observer::created \u2192 TaskCompleted::dispatch()`,
    vueParallel: 'taskStore.tasks.push(newTask) // reactivity update \u0443 Pinia',
    subLayers: ['Eloquent query', 'scopes', 'observer/events'],
  },
  {
    name: 'Response',
    label: 'JSON + status',
    color: '#22d3ee',
    icon: '\u{1F4E4}',
    description:
      'TaskResource \u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C\u0443\u0454 Eloquent-\u043C\u043E\u0434\u0435\u043B\u044C \u0443 \u0447\u0438\u0441\u0442\u0438\u0439 JSON (\u0442\u0456\u043B\u044C\u043A\u0438 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0456 \u043F\u043E\u043B\u044F, \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442). \u0412\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u044E\u0454 HTTP-\u0441\u0442\u0430\u0442\u0443\u0441 (201 Created). \u0412\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u044C \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442\u044C \u043D\u0430\u0437\u0430\u0434 \u0447\u0435\u0440\u0435\u0437 after-middleware (LogApiRequest \u0434\u043E\u0434\u0430\u0454 X-Response-Time). Vue SPA \u043E\u0442\u0440\u0438\u043C\u0443\u0454 JSON.',
    code: `// TaskResource::toArray()\nreturn [\n    'id'         => $this->id,\n    'title'      => $this->title,\n    'status'     => $this->status,\n    'priority'   => $this->priority,\n    'created_at' => $this->created_at->toISOString(),\n];\n\n// HTTP/1.1 201 Created\n// Content-Type: application/json\n// X-Response-Time: 45.2ms`,
    vueParallel:
      "const { data } = await axios.post('/api/tasks', form) // data = TaskResource JSON",
    subLayers: ['Resource transform', 'status code', 'after-middleware'],
  },
]

const {
  currentStep,
  isPlaying,
  speed,
  selectedLayer,
  isComplete,
  play,
  pause,
  step,
  reset,
  selectLayer,
  setSpeed,
} = useLifecycleAnimation(LAYERS.length)

const activeLayer = computed(() => {
  const idx = selectedLayer.value ?? (currentStep.value >= 0 ? currentStep.value : null)
  return idx !== null && idx < LAYERS.length ? LAYERS[idx] : null
})

function isLayerActive(i: number): boolean {
  return currentStep.value >= i
}

function isConnectorActive(i: number): boolean {
  return currentStep.value > i
}
</script>

<template>
  <div class="lifecycle-page">
    <header class="lifecycle-header">
      <h1 class="lifecycle-title">Laravel Request Lifecycle</h1>
      <p class="lifecycle-subtitle">
        Як HTTP-запит подорожує через шари Laravel: від Request до Response
      </p>
    </header>

    <div class="pipeline">
      <template v-for="(layer, i) in LAYERS" :key="layer.name">
        <div
          class="layer"
          :class="{ active: isLayerActive(i), selected: selectedLayer === i }"
          @click="selectLayer(i)"
        >
          <div class="layer-box" :style="{ background: layer.color }">
            <span class="layer-icon">{{ layer.icon }}</span>
          </div>
          <span class="layer-name">{{ layer.name }}</span>
          <span class="layer-label">{{ layer.label }}</span>
          <div v-if="selectedLayer === i" class="sub-layers">
            <span
              v-for="sub in layer.subLayers"
              :key="sub"
              class="sub-layer"
              :style="{ background: layer.color }"
            >
              {{ sub }}
            </span>
          </div>
        </div>
        <div
          v-if="i < LAYERS.length - 1"
          class="connector"
          :class="{ active: isConnectorActive(i) }"
          :style="
            isConnectorActive(i)
              ? { background: `linear-gradient(90deg, ${LAYERS[i].color}, ${LAYERS[i + 1].color})` }
              : {}
          "
        >
          <span class="dot" :class="{ moving: isConnectorActive(i) }" />
          <span class="dot delay" :class="{ moving: isConnectorActive(i) }" />
        </div>
      </template>
    </div>

    <div class="return-path" :class="{ active: isComplete }">
      &larr; JSON Response &rarr; Vue SPA
    </div>

    <div class="controls">
      <button :disabled="isPlaying" @click="play">&#9654; Play</button>
      <button :disabled="!isPlaying" @click="pause">&#10074;&#10074; Pause</button>
      <button :disabled="isPlaying || isComplete" @click="step">&#9654;| Step</button>
      <button @click="reset">&#8634; Reset</button>
      <div class="speed-controls">
        <button :class="{ active: speed === 0.5 }" @click="setSpeed(0.5)">0.5&times;</button>
        <button :class="{ active: speed === 1 }" @click="setSpeed(1)">1&times;</button>
        <button :class="{ active: speed === 2 }" @click="setSpeed(2)">2&times;</button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="activeLayer" class="detail-panel" :style="{ borderLeftColor: activeLayer.color }">
        <h3>{{ activeLayer.icon }} {{ activeLayer.name }}</h3>
        <p class="detail-desc">{{ activeLayer.description }}</p>
        <CodeBlock :code="activeLayer.code" lang="php" :title="activeLayer.name" />
        <p class="vue-parallel"><strong>Vue parallel:</strong> {{ activeLayer.vueParallel }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lifecycle-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px;
  animation: fadeIn 0.3s ease;
}

.lifecycle-header {
  margin-bottom: 28px;
}

.lifecycle-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.lifecycle-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Pipeline */
.pipeline {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  overflow-x: auto;
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  gap: 0;
}

.layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  cursor: pointer;
  transition: 0.3s;
  opacity: 0.4;
}

.layer.active {
  opacity: 1;
}

.layer.active .layer-box {
  transform: scale(1.15);
}

.layer-box {
  width: 80px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  transition: 0.3s;
}

.layer.active .layer-box {
  box-shadow: 0 0 20px color-mix(in srgb, var(--layer-glow, #7c5cfc) 40%, transparent);
}

.layer:nth-child(1).active .layer-box {
  box-shadow: 0 0 20px rgba(124, 92, 252, 0.4);
}

.layer:nth-child(3).active .layer-box {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.layer:nth-child(5).active .layer-box {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}

.layer:nth-child(7).active .layer-box {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}

.layer:nth-child(9).active .layer-box {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
}

.layer:nth-child(11).active .layer-box {
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
}

.layer-name {
  font-size: 12px;
  color: var(--text-primary);
  margin-top: 6px;
  font-weight: 600;
  text-align: center;
}

.layer-label {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
}

.sub-layers {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.sub-layer {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

/* Connectors */
.connector {
  flex: 1;
  min-width: 32px;
  height: 3px;
  background: var(--border);
  opacity: 0.25;
  position: relative;
  transition: 0.3s;
  align-self: center;
  margin-top: -20px;
}

.connector.active {
  opacity: 1;
}

.dot {
  position: absolute;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  opacity: 0;
}

.dot.moving {
  animation: moveDot 1.2s ease-in-out infinite;
}

.dot.delay.moving {
  animation-delay: 0.4s;
}

@keyframes moveDot {
  0% {
    left: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    left: calc(100% - 8px);
    opacity: 0;
  }
}

/* Return path */
.return-path {
  text-align: center;
  padding: 12px;
  background: var(--surface);
  border-radius: 0 0 12px 12px;
  opacity: 0.3;
  transition: 0.3s;
  margin-top: -1px;
  font-size: 14px;
  color: var(--text-muted);
}

.return-path.active {
  opacity: 1;
  color: #22d3ee;
}

/* Controls */
.controls {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.controls button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
}

.controls button:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.speed-controls {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.speed-controls button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Detail panel */
.detail-panel {
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid;
  margin-top: 20px;
}

.detail-panel h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.detail-desc {
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 16px;
}

.vue-parallel {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 16px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
