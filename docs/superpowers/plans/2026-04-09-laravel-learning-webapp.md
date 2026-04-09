# Laravel Learning Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Vue 3 SPA for learning Laravel, with animated demos, code comparisons, quizzes, and progress tracking.

**Architecture:** Static Vue 3 SPA with three-column layout (icon sidebar + lesson nav + content/demo split). Each lesson is a Vue component using reusable interactive blocks. Progress persisted to localStorage via Pinia.

**Tech Stack:** Vue 3, Vite, TypeScript, Vue Router, Pinia, Shiki (syntax highlighting)

---

## File Map

```
app/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── styles/
│   │   └── main.css                    # CSS variables, global styles, animations
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   └── progress.ts                # Pinia + localStorage
│   ├── data/
│   │   └── lessons.ts                 # Lesson metadata array
│   ├── types/
│   │   └── index.ts                   # Shared TypeScript types
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.vue
│   │   │   ├── IconSidebar.vue
│   │   │   ├── LessonNav.vue
│   │   │   └── LessonLayout.vue
│   │   ├── interactive/
│   │   │   ├── CodeBlock.vue
│   │   │   ├── CodeComparison.vue
│   │   │   ├── Quiz.vue
│   │   │   ├── FlowDiagram.vue
│   │   │   ├── TerminalOutput.vue
│   │   │   ├── FileTree.vue
│   │   │   ├── MemoryCard.vue
│   │   │   └── ProgressRing.vue
│   │   └── common/
│   │       ├── ParallelCard.vue
│   │       └── TheoryBlock.vue
│   ├── views/
│   │   ├── DashboardView.vue
│   │   ├── LessonView.vue
│   │   └── CheatsheetView.vue
│   └── lessons/
│       └── week1/
│           ├── Lesson01.vue
│           ├── Lesson01Demo.vue
│           ├── Lesson02.vue
│           ├── Lesson02Demo.vue
│           ├── Lesson03.vue
│           ├── Lesson03Demo.vue
│           ├── Lesson04.vue
│           ├── Lesson04Demo.vue
│           ├── Lesson05.vue
│           ├── Lesson05Demo.vue
│           ├── Lesson06.vue
│           └── Lesson06Demo.vue
```

---

### Task 1: Scaffold Vue project

**Files:**
- Create: `app/package.json`, `app/vite.config.ts`, `app/tsconfig.json`, `app/index.html`, `app/src/main.ts`, `app/src/App.vue`, `app/src/vite-env.d.ts`

- [ ] **Step 1: Create Vue project with Vite**

```bash
cd /Users/timur/Documents/projects/my/backand-study
npm create vue@latest app -- --typescript --router --pinia --eslint-with-prettier
```

Select: TypeScript=Yes, JSX=No, Vue Router=Yes, Pinia=Yes, Vitest=No, E2E=No, ESLint+Prettier=Yes

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/timur/Documents/projects/my/backand-study/app
npm install
npm install shiki
```

- [ ] **Step 3: Verify dev server starts**

```bash
cd /Users/timur/Documents/projects/my/backand-study/app
npm run dev
```

Expected: Vite dev server at http://localhost:5173 with Vue welcome page.

- [ ] **Step 4: Clean scaffolded files**

Remove default `src/components/HelloWorld.vue`, `src/components/TheWelcome.vue`, `src/components/WelcomeItem.vue`, `src/components/icons/`, `src/views/HomeView.vue`, `src/views/AboutView.vue`. Clear `src/App.vue` to minimal shell. Clear `src/router/index.ts` to empty routes. Clear `src/assets/` default CSS.

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: scaffold Vue 3 + Vite + TypeScript project"
```

---

### Task 2: Global styles and CSS variables

**Files:**
- Create: `app/src/styles/main.css`
- Modify: `app/src/main.ts`

- [ ] **Step 1: Create main.css with design tokens and base styles**

```css
/* app/src/styles/main.css */

:root {
  /* Colors */
  --bg: #F5F5FA;
  --surface: #FFFFFF;
  --border: #EBEBF0;
  --primary: #7C5CFC;
  --primary-light: #F0EEFF;
  --primary-hover: #6B4FE0;
  --success: #34D399;
  --success-light: #E8FAF0;
  --accent: #F472B6;
  --accent-light: #FFF0F5;
  --warning: #FBBF24;
  --warning-light: #FFF4E5;
  --text-primary: #1A1A2E;
  --text-secondary: #4B5563;
  --text-muted: #9CA3AF;
  --code-bg: #1E1E2E;
  --js-color: #059669;
  --js-bg: #ECFDF5;
  --php-color: #7C5CFC;
  --php-bg: #F0EEFF;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);

  /* Layout */
  --sidebar-width: 64px;
  --nav-width: 220px;
  --demo-width: 260px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text-secondary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

code {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.875em;
  background: var(--primary-light);
  color: var(--primary);
  padding: 1px 6px;
  border-radius: 4px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

.fade-enter-active { animation: fadeIn 0.3s ease; }
.slide-enter-active { animation: slideIn 0.3s ease; }
```

- [ ] **Step 2: Import in main.ts**

```typescript
// app/src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 3: Commit**

```bash
git add app/src/styles/ app/src/main.ts
git commit -m "feat: add global CSS variables and base styles"
```

---

### Task 3: TypeScript types and lesson metadata

**Files:**
- Create: `app/src/types/index.ts`, `app/src/data/lessons.ts`

- [ ] **Step 1: Create shared types**

```typescript
// app/src/types/index.ts

export interface Lesson {
  id: string           // "01", "02", ... "24"
  title: string
  titleUa: string      // Ukrainian title
  week: number         // 1-4
  order: number        // position within week
  duration: string     // "~45 хв"
  icon: string         // emoji
  isTest?: boolean
}

export interface Week {
  number: number
  title: string
  titleUa: string
  icon: string
  lessons: Lesson[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number       // index of correct option
  explanation: string
}

export interface FlowStep {
  icon: string
  title: string
  subtitle: string
  color: string         // CSS color for background
}

export interface TreeNode {
  name: string
  type: 'file' | 'dir'
  children?: TreeNode[]
  highlight?: boolean
}
```

- [ ] **Step 2: Create lesson metadata for all 24 lessons + 4 tests**

```typescript
// app/src/data/lessons.ts
import type { Week } from '@/types'

export const weeks: Week[] = [
  {
    number: 1,
    title: 'PHP & Laravel Basics',
    titleUa: 'PHP та основи Laravel',
    icon: '🚀',
    lessons: [
      { id: '01', title: 'PHP Syntax for JS Devs', titleUa: 'PHP-синтаксис для JS-розробника', week: 1, order: 1, duration: '~60 хв', icon: '📝' },
      { id: '02', title: 'PHP OOP & Namespaces', titleUa: 'PHP ООП та namespace', week: 1, order: 2, duration: '~60 хв', icon: '🏗️' },
      { id: '03', title: 'Installation & Structure', titleUa: 'Встановлення та структура', week: 1, order: 3, duration: '~45 хв', icon: '📦' },
      { id: '04', title: 'Routing & Controllers', titleUa: 'Маршрутизація та контролери', week: 1, order: 4, duration: '~50 хв', icon: '🛤️' },
      { id: '05', title: 'Migrations & Schema', titleUa: 'Міграції та схема БД', week: 1, order: 5, duration: '~45 хв', icon: '🗄️' },
      { id: '06', title: 'Eloquent Models', titleUa: 'Eloquent моделі', week: 1, order: 6, duration: '~55 хв', icon: '🔮' },
      { id: 'w1-test', title: 'Week 1 Test', titleUa: 'Тест тижня 1', week: 1, order: 7, duration: '~30 хв', icon: '⭐', isTest: true },
    ],
  },
  {
    number: 2,
    title: 'Building the API',
    titleUa: 'Побудова API',
    icon: '🔧',
    lessons: [
      { id: '07', title: 'Eloquent Relationships', titleUa: 'Eloquent зв\'язки', week: 2, order: 1, duration: '~55 хв', icon: '🔗' },
      { id: '08', title: 'Validation & Form Requests', titleUa: 'Валідація та Form Requests', week: 2, order: 2, duration: '~50 хв', icon: '✅' },
      { id: '09', title: 'API Resources', titleUa: 'API Resources', week: 2, order: 3, duration: '~45 хв', icon: '📦' },
      { id: '10', title: 'Error Handling', titleUa: 'Обробка помилок', week: 2, order: 4, duration: '~40 хв', icon: '🚨' },
      { id: '11', title: 'Seeders & Factories', titleUa: 'Seeders та Factories', week: 2, order: 5, duration: '~45 хв', icon: '🌱' },
      { id: '12', title: 'Scopes & Filtering', titleUa: 'Scopes, фільтрація, сортування', week: 2, order: 6, duration: '~50 хв', icon: '🔍' },
      { id: 'w2-test', title: 'Week 2 Test', titleUa: 'Тест тижня 2', week: 2, order: 7, duration: '~30 хв', icon: '⭐', isTest: true },
    ],
  },
  {
    number: 3,
    title: 'Auth & Advanced',
    titleUa: 'Аутентифікація та просунуті фічі',
    icon: '🔐',
    lessons: [
      { id: '13', title: 'Sanctum Authentication', titleUa: 'Sanctum аутентифікація', week: 3, order: 1, duration: '~55 хв', icon: '🔑' },
      { id: '14', title: 'Authorization Policies', titleUa: 'Авторизація — Policies', week: 3, order: 2, duration: '~45 хв', icon: '🛡️' },
      { id: '15', title: 'Middleware', titleUa: 'Middleware', week: 3, order: 3, duration: '~45 хв', icon: '🧅' },
      { id: '16', title: 'File Uploads', titleUa: 'Завантаження файлів', week: 3, order: 4, duration: '~40 хв', icon: '📎' },
      { id: '17', title: 'Events & Notifications', titleUa: 'Events та Notifications', week: 3, order: 5, duration: '~50 хв', icon: '🔔' },
      { id: '18', title: 'Queues & Scheduling', titleUa: 'Черги та планувальник', week: 3, order: 6, duration: '~50 хв', icon: '⏱️' },
      { id: 'w3-test', title: 'Week 3 Test', titleUa: 'Тест тижня 3', week: 3, order: 7, duration: '~30 хв', icon: '⭐', isTest: true },
    ],
  },
  {
    number: 4,
    title: 'Testing & Integration',
    titleUa: 'Тестування та інтеграція',
    icon: '🎯',
    lessons: [
      { id: '19', title: 'Pest Feature Testing', titleUa: 'Pest feature testing', week: 4, order: 1, duration: '~55 хв', icon: '🧪' },
      { id: '20', title: 'Unit Tests & Mocking', titleUa: 'Unit tests та mocking', week: 4, order: 2, duration: '~50 хв', icon: '🎭' },
      { id: '21', title: 'Performance', titleUa: 'Оптимізація', week: 4, order: 3, duration: '~45 хв', icon: '⚡' },
      { id: '22', title: 'CORS & Versioning', titleUa: 'CORS, rate limiting, versioning', week: 4, order: 4, duration: '~40 хв', icon: '🌐' },
      { id: '23', title: 'Vue SPA Integration', titleUa: 'Vue SPA інтеграція', week: 4, order: 5, duration: '~60 хв', icon: '💚' },
      { id: '24', title: 'Deployment', titleUa: 'Деплой та що далі', week: 4, order: 6, duration: '~35 хв', icon: '🚀' },
      { id: 'w4-test', title: 'Final Test', titleUa: 'Фінальний тест', week: 4, order: 7, duration: '~45 хв', icon: '🏆', isTest: true },
    ],
  },
]

export function getLessonById(id: string): { lesson: import('@/types').Lesson; week: Week } | undefined {
  for (const week of weeks) {
    const lesson = week.lessons.find(l => l.id === id)
    if (lesson) return { lesson, week }
  }
  return undefined
}

export function getAllLessons(): import('@/types').Lesson[] {
  return weeks.flatMap(w => w.lessons)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/types/ app/src/data/
git commit -m "feat: add TypeScript types and lesson metadata"
```

---

### Task 4: Progress store (Pinia + localStorage)

**Files:**
- Create: `app/src/stores/progress.ts`

- [ ] **Step 1: Create progress store**

```typescript
// app/src/stores/progress.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { weeks, getAllLessons } from '@/data/lessons'

const STORAGE_KEY = 'laravel-course-progress'

interface ProgressState {
  completedLessons: string[]
  quizScores: Record<string, number>
  currentLesson: string
  completedTabs: Record<string, string[]>  // lessonId -> ['theory', 'practice', ...]
}

function loadState(): ProgressState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return {
    completedLessons: [],
    quizScores: {},
    currentLesson: '01',
    completedTabs: {},
  }
}

export const useProgressStore = defineStore('progress', () => {
  const state = ref<ProgressState>(loadState())

  // Persist on every change
  watch(state, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  const completedCount = computed(() => state.value.completedLessons.length)
  const totalLessons = computed(() => getAllLessons().length)
  const progressPercent = computed(() =>
    Math.round((completedCount.value / totalLessons.value) * 100)
  )

  function weekProgress(weekNum: number): number {
    const weekLessons = weeks.find(w => w.number === weekNum)?.lessons ?? []
    const completed = weekLessons.filter(l => state.value.completedLessons.includes(l.id)).length
    return Math.round((completed / weekLessons.length) * 100)
  }

  function isCompleted(lessonId: string): boolean {
    return state.value.completedLessons.includes(lessonId)
  }

  function completeLesson(lessonId: string): void {
    if (!state.value.completedLessons.includes(lessonId)) {
      state.value.completedLessons.push(lessonId)
    }
  }

  function setQuizScore(lessonId: string, score: number): void {
    state.value.quizScores[lessonId] = score
  }

  function getQuizScore(lessonId: string): number | undefined {
    return state.value.quizScores[lessonId]
  }

  function setCurrentLesson(lessonId: string): void {
    state.value.currentLesson = lessonId
  }

  function completeTab(lessonId: string, tab: string): void {
    if (!state.value.completedTabs[lessonId]) {
      state.value.completedTabs[lessonId] = []
    }
    if (!state.value.completedTabs[lessonId].includes(tab)) {
      state.value.completedTabs[lessonId].push(tab)
    }
  }

  function isTabCompleted(lessonId: string, tab: string): boolean {
    return state.value.completedTabs[lessonId]?.includes(tab) ?? false
  }

  function resetProgress(): void {
    state.value = {
      completedLessons: [],
      quizScores: {},
      currentLesson: '01',
      completedTabs: {},
    }
  }

  return {
    state,
    completedCount,
    totalLessons,
    progressPercent,
    weekProgress,
    isCompleted,
    completeLesson,
    setQuizScore,
    getQuizScore,
    setCurrentLesson,
    completeTab,
    isTabCompleted,
    resetProgress,
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add app/src/stores/
git commit -m "feat: add progress store with localStorage persistence"
```

---

### Task 5: Layout components

**Files:**
- Create: `app/src/components/layout/IconSidebar.vue`, `app/src/components/layout/LessonNav.vue`, `app/src/components/layout/AppLayout.vue`, `app/src/components/layout/LessonLayout.vue`

- [ ] **Step 1: Create IconSidebar.vue**

64px icon strip on the far left. Icons for Dashboard, Lessons, Cheatsheets, Settings. Uses `router-link` with active state highlighting. Purple active background, light purple inactive. Emits no events — purely navigation.

- [ ] **Step 2: Create LessonNav.vue**

220px panel. Shows:
- Search input (filters lessons by title)
- Weeks as collapsible sections with lesson list
- Each lesson: green ✓ if completed, purple number if active, gray if upcoming
- Test lessons get ⭐ icon
- Bottom: overall progress bar with "3/24" label

Props: none (reads from progress store and route).

- [ ] **Step 3: Create AppLayout.vue**

Wrapper with `display: flex; height: 100vh`:
- `<IconSidebar />` (64px)
- `<LessonNav />` (220px, hidden on dashboard route)
- `<slot />` (flex: 1, the main content)

- [ ] **Step 4: Create LessonLayout.vue**

For use inside LessonView. Shows:
- Header: lesson title, "Урок N · Тиждень M · ~Xхв", prev/next buttons
- Tabs: Теорія / Практика / Квіз / Завдання
- Content area split: `<slot name="content" />` (flex) + `<slot name="demo" />` (260px)

Props: `lessonId: string`. Reads metadata from lessons.ts.

- [ ] **Step 5: Verify layout renders**

Run dev server, check three-column layout appears with sidebar, nav, and content area.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/layout/
git commit -m "feat: add layout components (sidebar, nav, lesson layout)"
```

---

### Task 6: Interactive components — CodeBlock and CodeComparison

**Files:**
- Create: `app/src/components/interactive/CodeBlock.vue`, `app/src/components/interactive/CodeComparison.vue`

- [ ] **Step 1: Create CodeBlock.vue**

Uses Shiki for syntax highlighting. Props:
- `code: string` — the code content
- `lang: string` — language (php, javascript, bash, json)
- `terminal?: boolean` — dark terminal style
- `showLineNumbers?: boolean`

Features: copy button (top-right), language badge, dark bg when terminal=true, light bg otherwise. Use `shiki.codeToHtml()` with `one-dark-pro` theme for terminal blocks and a light theme for regular blocks.

- [ ] **Step 2: Create CodeComparison.vue**

Two CodeBlocks side by side. Props:
- `js: string` — JavaScript code
- `php: string` — PHP code
- `jsTitle?: string` — defaults to "JavaScript"
- `phpTitle?: string` — defaults to "PHP (Laravel)"

Left panel: green header with 🟢, right panel: purple header with 🟣. Responsive: stacks vertically on small screens.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/interactive/CodeBlock.vue app/src/components/interactive/CodeComparison.vue
git commit -m "feat: add CodeBlock and CodeComparison components"
```

---

### Task 7: Interactive components — Quiz

**Files:**
- Create: `app/src/components/interactive/Quiz.vue`

- [ ] **Step 1: Create Quiz.vue**

Props: `questions: QuizQuestion[]`, `lessonId: string`

Behavior:
- Shows one question at a time with progress indicator "Питання 1/5"
- 4 option buttons (A/B/C/D) in white cards
- Click → correct: green bg + ✓ + explanation. Wrong: red bg + ✗ + explanation + highlight correct
- "Далі" button to advance
- After last question: summary card with score (e.g. "4/5"), percentage, retry button
- Saves score to progress store

Style: white card, rounded buttons, smooth transitions between questions.

- [ ] **Step 2: Commit**

```bash
git add app/src/components/interactive/Quiz.vue
git commit -m "feat: add interactive Quiz component"
```

---

### Task 8: Interactive components — FlowDiagram, TerminalOutput, FileTree

**Files:**
- Create: `app/src/components/interactive/FlowDiagram.vue`, `app/src/components/interactive/TerminalOutput.vue`, `app/src/components/interactive/FileTree.vue`

- [ ] **Step 1: Create FlowDiagram.vue**

Props: `steps: FlowStep[]`, `autoPlay?: boolean` (default true)

Renders vertical flow: each step is an icon box + title + subtitle, connected by dashed lines. Steps appear one-by-one with staggered CSS transition (300ms delay each). "Replay" button at bottom to restart animation. Uses `--success`, `--primary`, `--warning` etc for step colors.

- [ ] **Step 2: Create TerminalOutput.vue**

Props: `lines: string[]`, `animate?: boolean` (default true)

Dark terminal block with macOS dots (red/yellow/green). Lines appear one-by-one with typing effect if animate=true. Lines starting with `$` get green color. Regular output in gray.

- [ ] **Step 3: Create FileTree.vue**

Props: `tree: TreeNode[]`, `expanded?: boolean` (default false)

Recursive component. Directories clickable to expand/collapse with smooth height transition. Files and dirs get appropriate icons (📁/📄). Highlighted nodes get primary-light background and bold text.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/interactive/FlowDiagram.vue app/src/components/interactive/TerminalOutput.vue app/src/components/interactive/FileTree.vue
git commit -m "feat: add FlowDiagram, TerminalOutput, FileTree components"
```

---

### Task 9: Common components — ParallelCard, TheoryBlock, MemoryCard, ProgressRing

**Files:**
- Create: `app/src/components/common/ParallelCard.vue`, `app/src/components/common/TheoryBlock.vue`, `app/src/components/interactive/MemoryCard.vue`, `app/src/components/interactive/ProgressRing.vue`

- [ ] **Step 1: Create ParallelCard.vue**

Props: `from: string`, `to: string` — e.g. "Vue Router routes[]" → "routes/api.php"

White card with left purple border, 🔄 icon, "VUE → LARAVEL" label, from/to text with colored code tags.

- [ ] **Step 2: Create TheoryBlock.vue**

Simple white card wrapper. Props: `title?: string`. Has `<slot>` for content. Consistent padding, border-radius, shadow.

- [ ] **Step 3: Create MemoryCard.vue**

Props: `items: { vue: string, laravel: string }[]`

Gradient card (primary-light → accent-light). 💡 "ЗАПАМʼЯТАЙ" header. List of vue→laravel mappings with colored code tags.

- [ ] **Step 4: Create ProgressRing.vue**

Props: `value: number` (0-100), `size?: number` (default 48), `color?: string` (default var(--primary))

SVG circle with animated stroke-dashoffset. Shows percentage text in center.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/common/ app/src/components/interactive/MemoryCard.vue app/src/components/interactive/ProgressRing.vue
git commit -m "feat: add ParallelCard, TheoryBlock, MemoryCard, ProgressRing"
```

---

### Task 10: Router and Views

**Files:**
- Create: `app/src/views/DashboardView.vue`, `app/src/views/LessonView.vue`, `app/src/views/CheatsheetView.vue`
- Modify: `app/src/router/index.ts`, `app/src/App.vue`

- [ ] **Step 1: Set up router**

```typescript
// app/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/lesson/:id', name: 'lesson', component: () => import('@/views/LessonView.vue') },
    { path: '/cheatsheet/:name', name: 'cheatsheet', component: () => import('@/views/CheatsheetView.vue') },
  ],
})

export default router
```

- [ ] **Step 2: Create App.vue**

```vue
<!-- app/src/App.vue -->
<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>
```

- [ ] **Step 3: Create DashboardView.vue**

Shows:
- Header: "Мій прогрес" + subtitle
- 4 week cards in a row (icon, title, ProgressRing)
- Stats: lessons completed, quizzes passed
- "Продовжити навчання" card with current lesson + "Продовжити" button
- Clean, spacious layout matching the reference screenshot style

- [ ] **Step 4: Create LessonView.vue**

Dynamic lesson loader. Reads `:id` from route params. Resolves week number from lesson metadata. Uses `defineAsyncComponent` to load `Lesson{id}.vue` and `Lesson{id}Demo.vue` from the correct week directory. Wraps in `LessonLayout` with content and demo slots. Falls back to "Урок в розробці" placeholder if component doesn't exist.

- [ ] **Step 5: Create CheatsheetView.vue**

Simple view that renders cheatsheet content. Reads `:name` from route. Shows one of: php-vs-js, artisan-commands, eloquent-cheatsheet. Content hardcoded as formatted HTML with CodeBlock components.

- [ ] **Step 6: Verify navigation works**

Dev server: navigate between dashboard, lessons, cheatsheets. Check layout renders correctly.

- [ ] **Step 7: Commit**

```bash
git add app/src/router/ app/src/App.vue app/src/views/
git commit -m "feat: add router, dashboard, lesson view, cheatsheet view"
```

---

### Task 11: First lesson — Lesson 01 (PHP Syntax) + Demo

**Files:**
- Create: `app/src/lessons/week1/Lesson01.vue`, `app/src/lessons/week1/Lesson01Demo.vue`

Reference content: `/Users/timur/Documents/projects/my/backand-study/lessons/week-1-php-and-laravel-basics/01-php-syntax-for-js-devs.md`

- [ ] **Step 1: Create Lesson01.vue**

Four tab sections (rendered based on active tab from LessonLayout):

**Theory tab:**
- ParallelCard: "let/const → $variable"
- TheoryBlock: variables explanation with "У Vue ви робите X → в Laravel це Y"
- CodeComparison: JS variables vs PHP variables
- CodeComparison: JS arrays vs PHP arrays
- CodeComparison: JS arrow functions vs PHP fn()
- TheoryBlock: key operators (===, ??, match)
- CodeComparison: JS switch vs PHP match

**Practice tab:**
- Step-by-step instructions using TheoryBlock + CodeBlock (terminal)
- "Create file playground/01-basics.php"
- Run with "php playground/01-basics.php"
- TerminalOutput showing expected output

**Quiz tab:**
- Quiz component with 5 questions from the markdown lesson's quiz section

**Task tab:**
- TheoryBlock with exercise description (formatTask, filterByStatus, getTaskStats)
- Collapsible hint section

- [ ] **Step 2: Create Lesson01Demo.vue**

Demo panel content:
- FileTree showing PHP project structure
- MemoryCard with key JS→PHP parallels
- CodeBlock showing a quick PHP snippet that runs

- [ ] **Step 3: Verify lesson renders**

Navigate to `/lesson/01`, check all 4 tabs work, quiz is interactive, demo panel shows.

- [ ] **Step 4: Commit**

```bash
git add app/src/lessons/
git commit -m "feat: add Lesson 01 (PHP Syntax) with interactive content"
```

---

### Task 12: Lessons 02-06 + Week 1 remaining

**Files:**
- Create: `app/src/lessons/week1/Lesson02.vue` through `Lesson06.vue` + Demo files

Reference: markdown files in `/lessons/week-1-php-and-laravel-basics/`

- [ ] **Step 1: Create Lesson02.vue + Demo** (PHP OOP)

Key content: classes vs JS classes, traits vs composables, namespaces vs import/export, enums. CodeComparisons for each. Quiz from markdown. Demo: class hierarchy diagram.

- [ ] **Step 2: Create Lesson03.vue + Demo** (Installation)

Key content: installation steps, directory structure comparison (Laravel vs Vue/Nuxt). Demo: FileTree of Laravel project + FileTree of Vue project side-by-side. Terminal with artisan commands.

- [ ] **Step 3: Create Lesson04.vue + Demo** (Routing)

Key content: Vue Router vs Laravel routes, route parameters, apiResource. Demo: FlowDiagram (request → route → controller → response). TerminalOutput (route:list).

- [ ] **Step 4: Create Lesson05.vue + Demo** (Migrations)

Key content: migrations as DB version control, column types, Schema builder. Demo: animated database schema visualization, TerminalOutput (migrate output).

- [ ] **Step 5: Create Lesson06.vue + Demo** (Eloquent)

Key content: Eloquent = Pinia + fetch + types combined, CRUD operations, tinker. Demo: FlowDiagram (Eloquent query → SQL → result), TerminalOutput (tinker session).

- [ ] **Step 6: Verify all 6 lessons navigate and render**

- [ ] **Step 7: Commit**

```bash
git add app/src/lessons/week1/
git commit -m "feat: add Week 1 lessons 02-06 with interactive content"
```

---

### Task 13: Final polish and verification

**Files:**
- Modify: various

- [ ] **Step 1: Add .gitignore for app**

```
# app/.gitignore
node_modules
dist
.vite
```

- [ ] **Step 2: Add .superpowers/ to root .gitignore**

```bash
echo ".superpowers/" >> /Users/timur/Documents/projects/my/backand-study/.gitignore
```

- [ ] **Step 3: Full verification**

```bash
cd /Users/timur/Documents/projects/my/backand-study/app
npm run dev
```

Verify:
1. Dashboard renders with 4 week cards and progress
2. Navigate to lesson 01 — all 4 tabs work
3. Quiz gives instant green/red feedback
4. Demo panel shows FlowDiagram animation
5. Complete a quiz — progress updates in sidebar
6. Navigate between lessons — proper active state
7. Code blocks have syntax highlighting and copy button
8. Terminal blocks have typing animation

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: builds without errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Week 1 interactive learning platform"
```
