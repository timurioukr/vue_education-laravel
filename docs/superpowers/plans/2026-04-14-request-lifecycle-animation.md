# Laravel Request Lifecycle Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an animated interactive page at `/lifecycle` showing how an HTTP request travels through Laravel layers with pulsating connection lines, auto-play + manual controls, and clickable expandable layers.

**Architecture:** Single Vue SFC (`LifecycleView.vue`) with a composable (`useLifecycleAnimation.ts`) for animation state management. Layer data defined inline. Uses existing `CodeBlock` component for syntax highlighting. Pure CSS animations — no external libraries.

**Tech Stack:** Vue 3 Composition API, CSS `@keyframes`, Shiki (via existing CodeBlock), Vue Router

**Spec:** `docs/superpowers/specs/2026-04-14-request-lifecycle-animation-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `app/src/composables/useLifecycleAnimation.ts` | Create | Animation state: currentStep, isPlaying, speed, play/pause/step/reset, auto-advance timer |
| `app/src/views/LifecycleView.vue` | Create | Full page: pipeline rendering, layer data, detail panel, controls, CSS animations |
| `app/src/router/index.ts` | Modify | Add `/lifecycle` route |
| `app/src/views/DashboardView.vue` | Modify | Add link card to `/lifecycle` |

---

### Task 1: Create `useLifecycleAnimation` composable

**Files:**
- Create: `app/src/composables/useLifecycleAnimation.ts`

- [ ] **Step 1: Create the composable**

```typescript
// app/src/composables/useLifecycleAnimation.ts
import { ref, computed, onUnmounted } from 'vue'

export function useLifecycleAnimation(totalSteps: number) {
  const currentStep = ref(-1) // -1 = nothing active
  const isPlaying = ref(false)
  const speed = ref(1) // 0.5, 1, 2
  const selectedLayer = ref<number | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null

  const isComplete = computed(() => currentStep.value >= totalSteps - 1)
  const baseDelay = 3000 // ms per step

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleNext() {
    clearTimer()
    if (!isPlaying.value || isComplete.value) {
      if (isComplete.value) isPlaying.value = false
      return
    }
    timer = setTimeout(() => {
      currentStep.value++
      scheduleNext()
    }, baseDelay / speed.value)
  }

  function play() {
    if (isComplete.value) currentStep.value = -1
    isPlaying.value = true
    selectedLayer.value = null
    if (currentStep.value < 0) currentStep.value = 0
    else currentStep.value++
    scheduleNext()
  }

  function pause() {
    isPlaying.value = false
    clearTimer()
  }

  function step() {
    pause()
    selectedLayer.value = null
    if (isComplete.value) return
    currentStep.value++
  }

  function reset() {
    pause()
    currentStep.value = -1
    selectedLayer.value = null
  }

  function selectLayer(index: number) {
    pause()
    selectedLayer.value = selectedLayer.value === index ? null : index
    currentStep.value = index
  }

  function setSpeed(s: number) {
    speed.value = s
    if (isPlaying.value) {
      clearTimer()
      scheduleNext()
    }
  }

  onUnmounted(clearTimer)

  return {
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
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/timur/Documents/projects/my/backand-study/app && npx vue-tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add app/src/composables/useLifecycleAnimation.ts
git commit -m "feat: add useLifecycleAnimation composable for lifecycle page"
```

---

### Task 2: Create `LifecycleView.vue` — template + layer data

**Files:**
- Create: `app/src/views/LifecycleView.vue`

- [ ] **Step 1: Create the full component**

Create `app/src/views/LifecycleView.vue` with:

**Script section:**
- Import `useLifecycleAnimation` composable
- Import `CodeBlock` from `@/components/interactive/CodeBlock.vue`
- Define `LAYERS` array with 6 objects, each containing: `name`, `label`, `color`, `icon`, `description` (Ukrainian), `code` (PHP string), `vueParallel` (short string), `subLayers` (string array)
- Layer data from the spec:
  1. HTTP Request (purple `#7c5cfc`) — method/URL/headers/body
  2. Middleware (blue `#3b82f6`) — auth:sanctum, throttle, EnsureJson, CORS
  3. Router (green `#10b981`) — route matching, parameter binding
  4. Controller (amber `#f59e0b`) — authorize, validate, action
  5. Model / DB (red `#ef4444`) — Eloquent, scopes, observer events
  6. Response (cyan `#22d3ee`) — Resource transform, JSON, status
- Computed `activeLayer`: returns `LAYERS[selectedLayer]` or `LAYERS[currentStep]` or null
- Computed `isLayerActive(i)`: true when `currentStep >= i`
- Computed `isConnectorActive(i)`: true when `currentStep > i`

**Template section:**
```
<div class="lifecycle-page">
  <header>
    <h1>Laravel Request Lifecycle</h1>
    <p>Як HTTP-запит подорожує через шари Laravel</p>
  </header>

  <!-- Pipeline -->
  <div class="pipeline">
    <template v-for="(layer, i) in LAYERS" :key="layer.name">
      <div class="layer" :class="{ active: isLayerActive(i), selected: selectedLayer === i }"
           @click="selectLayer(i)">
        <div class="layer-box" :style="{ background: layer.color }">{{ layer.icon }}</div>
        <div class="layer-name">{{ layer.name }}</div>
        <div class="layer-label">{{ layer.label }}</div>
        <!-- Sub-layers -->
        <div class="sub-layers" v-if="selectedLayer === i && layer.subLayers.length">
          <span v-for="sub in layer.subLayers" :key="sub" class="sub-layer"
                :style="{ background: layer.color + '99' }">{{ sub }}</span>
        </div>
      </div>
      <!-- Connector (not after last) -->
      <div v-if="i < LAYERS.length - 1" class="connector"
           :class="{ active: isConnectorActive(i) }">
        <div class="dot" :class="{ moving: isConnectorActive(i) && isPlaying }"></div>
        <div class="dot delay" :class="{ moving: isConnectorActive(i) && isPlaying }"></div>
      </div>
    </template>
  </div>

  <!-- Return path -->
  <div class="return-path" :class="{ active: isComplete }">
    <span class="return-label">← JSON Response → Vue SPA</span>
  </div>

  <!-- Controls -->
  <div class="controls">
    <button @click="play" :disabled="isPlaying">▶ Play</button>
    <button @click="pause" :disabled="!isPlaying">⏸ Pause</button>
    <button @click="step" :disabled="isComplete">⏭ Step</button>
    <button @click="reset">↺ Reset</button>
    <div class="speed-controls">
      <button v-for="s in [0.5, 1, 2]" :key="s"
              :class="{ active: speed === s }" @click="setSpeed(s)">{{ s }}×</button>
    </div>
  </div>

  <!-- Detail panel -->
  <transition name="fade">
    <div v-if="activeLayer" class="detail-panel" :style="{ borderColor: activeLayer.color }">
      <h3>{{ activeLayer.icon }} {{ activeLayer.name }}</h3>
      <p class="detail-desc">{{ activeLayer.description }}</p>
      <CodeBlock :code="activeLayer.code" lang="php" />
      <p class="vue-parallel"><strong>Vue паралель:</strong> {{ activeLayer.vueParallel }}</p>
    </div>
  </transition>
</div>
```

**Style section (scoped):**
- `.lifecycle-page` — max-width 1000px, centered, padding
- `.pipeline` — flex row, align-items center, gap 0, overflow-x auto, background dark, rounded, padding
- `.layer` — flex column, align center, min-width 100px, cursor pointer, transition
- `.layer.active .layer-box` — transform scale(1.15), box-shadow glow
- `.layer.selected` — ring outline
- `.layer-box` — 80x56px, rounded-lg, flex center, color white, font-weight 600
- `.layer-name` — font-size 13px, color white, margin-top 6px
- `.layer-label` — font-size 10px, color muted
- `.sub-layers` — flex row gap 4px, animated show (max-height transition)
- `.sub-layer` — font-size 9px, padding 2px 6px, rounded
- `.connector` — flex 1, min-width 32px, height 3px, background gradient, opacity 0.2, position relative
- `.connector.active` — opacity 1
- `.dot` — position absolute, 8x8px, rounded-full, background white
- `.dot.moving` — animation `moveDot 1.2s ease-in-out infinite`
- `.dot.delay.moving` — animation-delay 0.4s
- `@keyframes moveDot` — left 0→100%, opacity 0→1→1→0
- `.return-path` — flex center, padding, background dark, rounded bottom, opacity 0.3, transition
- `.return-path.active` — opacity 1, animated shimmer
- `.controls` — flex row, gap 8px, margin-top 16px
- `.controls button` — padding 8px 16px, rounded-lg, background surface, color text, hover brightness
- `.controls button.active` — background primary, color white
- `.detail-panel` — background surface, rounded-lg, padding 20px, border-left 4px solid, margin-top 16px, transition
- `.fade-enter/leave` — opacity transition
- `.vue-parallel` — font-size 13px, color muted, margin-top 12px

- [ ] **Step 2: Verify TypeScript + Prettier**

Run: `cd /Users/timur/Documents/projects/my/backand-study/app && npx vue-tsc --noEmit && npx prettier --write src/views/LifecycleView.vue`
Expected: exit 0, formatted

- [ ] **Step 3: Commit**

```bash
git add app/src/views/LifecycleView.vue
git commit -m "feat: add LifecycleView with animated request pipeline"
```

---

### Task 3: Add route + dashboard link

**Files:**
- Modify: `app/src/router/index.ts` (lines 6-32)
- Modify: `app/src/views/DashboardView.vue` (after line 129, before `</div>`)

- [ ] **Step 1: Add route to router/index.ts**

Add after the `cheatsheet` route (before the catch-all):

```typescript
{
  path: '/lifecycle',
  name: 'lifecycle',
  component: () => import('@/views/LifecycleView.vue'),
  meta: { title: 'Request Lifecycle' },
},
```

- [ ] **Step 2: Add link card to DashboardView.vue**

In the template, add a new section after `<!-- Cheatsheets -->` section (after line 129, before `</div>`):

```html
<!-- Interactive Diagrams -->
<section class="cheatsheets-section">
  <h2 class="section-title">Інтерактивні діаграми</h2>
  <div class="cheatsheet-cards">
    <div class="cheatsheet-card" @click="router.push('/lifecycle')">
      <span class="cheatsheet-icon">⚡</span>
      <span class="cheatsheet-title">Request Lifecycle</span>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/timur/Documents/projects/my/backand-study/app && npx vue-tsc --noEmit && npm run build`
Expected: exit 0, LifecycleView chunk in dist/assets/

- [ ] **Step 4: Commit**

```bash
git add app/src/router/index.ts app/src/views/DashboardView.vue
git commit -m "feat: add /lifecycle route and dashboard link"
```

---

### Task 4: Visual polish + smoke test

- [ ] **Step 1: Run dev server and test**

Run: `cd /Users/timur/Documents/projects/my/backand-study/app && npm run dev`

Open `http://localhost:5173/lifecycle` and verify:
1. 6 layer boxes render horizontally with correct colors
2. **Play** — dots animate along connectors, layers light up sequentially (~3s each)
3. **Pause** — animation stops on current layer
4. **Step** — advances one layer
5. **Reset** — all layers dim
6. **Click layer** — sub-layers appear, detail panel shows below with code + description
7. **Speed** — 0.5×/1×/2× buttons change animation speed
8. **Return path** — lights up after Response is reached
9. **Dashboard** — `/` has "Request Lifecycle" card that navigates to `/lifecycle`

- [ ] **Step 2: Fix any visual issues found during testing**

Adjust CSS values (sizes, gaps, colors, timing) based on how it looks in the browser. Common fixes:
- Pipeline overflow on narrow screens → ensure `overflow-x: auto` works
- Layer boxes too close or too far → adjust min-width and connector flex
- Detail panel code too wide → ensure CodeBlock has `overflow-x: auto`
- Animation speed feels wrong → adjust `baseDelay` in composable

- [ ] **Step 3: Format + final build check**

Run: `cd /Users/timur/Documents/projects/my/backand-study/app && npx prettier --write "src/views/LifecycleView.vue" "src/composables/useLifecycleAnimation.ts" && npm run build`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: polish lifecycle animation and verify all features work"
```
