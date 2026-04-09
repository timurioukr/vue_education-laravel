# Laravel Learning Web App — Design Spec

## Context

Interactive web application for learning Laravel, targeted at a Vue/Nuxt frontend developer. Replaces static markdown lessons with an engaging SPA featuring animated demonstrations, code comparisons (JS vs PHP), interactive quizzes, and progress tracking.

Content source: 24 lessons + 4 weekly tests + 3 cheatsheets already written as markdown in `/lessons/` and `/cheatsheets/`.

## Stack

- **Vue 3** + Vite + TypeScript
- **Vue Router** — page routing
- **Pinia** — progress state (persisted to localStorage)
- **Shiki** — syntax highlighting for code blocks
- **CSS transitions/animations** — flow diagrams, typing effects, step reveals

No backend. Pure static SPA served by `vite dev` or built as static files.

## Project Structure

```
backand-study/
├── app/                              # Vue 3 SPA
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   └── progress.ts          # localStorage-persisted progress
│   │   ├── data/
│   │   │   └── lessons.ts           # Lesson metadata (id, title, week, order, duration)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.vue        # Icon sidebar + lesson nav + content
│   │   │   │   ├── IconSidebar.vue      # 64px icon strip (dashboard, lessons, cheatsheets, quizzes, settings)
│   │   │   │   ├── LessonNav.vue        # Weeks + lessons list with progress indicators
│   │   │   │   ├── LessonLayout.vue     # Header + tabs + content/demo split
│   │   │   │   └── DashboardLayout.vue  # Progress cards, stats, upcoming
│   │   │   ├── interactive/
│   │   │   │   ├── CodeBlock.vue        # Shiki-highlighted code + copy + language label
│   │   │   │   ├── CodeComparison.vue   # JS (green) vs PHP (purple) side-by-side
│   │   │   │   ├── Quiz.vue            # Multiple-choice with instant feedback
│   │   │   │   ├── FlowDiagram.vue     # Animated step-by-step flow (request lifecycle etc.)
│   │   │   │   ├── TerminalOutput.vue  # Dark terminal with typing animation
│   │   │   │   ├── FileTree.vue        # Animated expandable directory tree
│   │   │   │   ├── MemoryCard.vue      # Gradient "remember this" card
│   │   │   │   └── ProgressRing.vue    # Circular progress indicator
│   │   │   └── common/
│   │   │       ├── ParallelCard.vue    # "Vue → Laravel" mapping banner
│   │   │       └── TheoryBlock.vue     # White card with theory content
│   │   ├── lessons/
│   │   │   ├── week1/
│   │   │   │   ├── Lesson01.vue        # Lesson content component
│   │   │   │   ├── Lesson01Demo.vue    # Demo panel for lesson
│   │   │   │   ├── Lesson02.vue
│   │   │   │   ├── Lesson02Demo.vue
│   │   │   │   └── ... (through 06 + WeekTest1)
│   │   │   ├── week2/                  # Lessons 07-12 + WeekTest2
│   │   │   ├── week3/                  # Lessons 13-18 + WeekTest3
│   │   │   └── week4/                  # Lessons 19-24 + WeekTest4
│   │   ├── views/
│   │   │   ├── DashboardView.vue
│   │   │   ├── LessonView.vue         # Loads lesson + demo components dynamically
│   │   │   └── CheatsheetView.vue
│   │   └── styles/
│   │       └── main.css               # Global styles, CSS variables, animations
│   └── public/
│       └── favicon.svg
├── lessons/                            # Original markdown (reference)
├── cheatsheets/                        # Original markdown (reference)
└── docs/
```

## UI Design

### Color Palette (Light Theme)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#F5F5FA` | Page background |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--border` | `#EBEBF0` | Subtle borders |
| `--primary` | `#7C5CFC` | Active states, links, accents |
| `--primary-light` | `#F0EEFF` | Primary tinted backgrounds |
| `--success` | `#34D399` | Completed, green badges |
| `--success-light` | `#E8FAF0` | Success tinted backgrounds |
| `--accent` | `#F472B6` | Pink highlights |
| `--warning` | `#FBBF24` | Tests, stars |
| `--text-primary` | `#1A1A2E` | Headings |
| `--text-secondary` | `#4B5563` | Body text |
| `--text-muted` | `#9CA3AF` | Labels, hints |
| `--code-bg` | `#1E1E2E` | Terminal/code dark blocks |
| `--js-color` | `#059669` | JavaScript code accent |
| `--php-color` | `#7C5CFC` | PHP/Laravel code accent |

### Layout: Three Columns

1. **Icon Sidebar** (64px) — fixed left, icon-based navigation: Dashboard, Lessons, Cheatsheets, Quizzes, Settings
2. **Lesson Nav** (220px) — weeks accordion, lesson list with progress (✓ green / number purple active / gray locked), search, overall progress bar
3. **Main Area** (flex) — splits into:
   - **Content** (flex) — lesson tabs (Theory / Practice / Quiz / Task), white cards with theory, code comparisons, quizzes
   - **Demo Panel** (260px) — animated visualizations, terminal, flow diagrams, memory cards

### Lesson Content Tabs

| Tab | Content |
|-----|---------|
| **Теорія** | ParallelCard + TheoryBlocks + CodeComparisons |
| **Практика** | Step-by-step instructions with CodeBlocks + TerminalOutputs |
| **Квіз** | 5 Quiz questions with instant feedback |
| **Завдання** | Exercise description + hints (collapsible) |

### Dashboard (`/`)

- **Week cards** — 4 cards with icons, week number, title, ProgressRing showing %
- **Stats row** — lessons completed, quizzes passed, current streak
- **Continue learning** — card with current lesson, "Continue" button
- **Upcoming test** — next weekly test card

### Design Principles

- Rounded corners: 14px on cards, 10px on buttons/badges
- Subtle box-shadows: `0 1px 3px rgba(0,0,0,0.04)`
- Generous whitespace and padding
- Code blocks are the only dark elements (terminal aesthetic)
- Animations: CSS transitions for tab switching, step reveals in FlowDiagram, typing effect in TerminalOutput

## Components Detail

### CodeBlock

- Uses Shiki for syntax highlighting (supports php, javascript, bash, json)
- Copy button (top-right)
- Language label badge
- Optional line numbers
- Light background for inline, dark `--code-bg` for terminal-style blocks

### CodeComparison

- Two CodeBlocks side by side
- Left: green header "🟢 JavaScript", right: purple header "🟣 PHP (Laravel)"
- Props: `js: string`, `php: string`, `jsLang?: string`, `phpLang?: string`

### Quiz

- Props: `questions: QuizQuestion[]`
- QuizQuestion: `{ question: string, options: string[], correct: number, explanation: string }`
- Click option → green if correct, red if wrong → show explanation
- Track score in progress store
- After all questions: summary with score + "retry" button

### FlowDiagram

- Props: `steps: FlowStep[]`
- FlowStep: `{ icon: string, title: string, subtitle: string, color: string }`
- Steps appear one by one with CSS transition (staggered delay)
- Connecting dashed lines between steps
- Can replay animation on button click

### TerminalOutput

- Dark block with macOS window dots (red/yellow/green)
- Props: `lines: string[]`, `animate?: boolean`
- If animate: lines appear one by one with typing effect
- Green `$` prompt prefix for commands

### FileTree

- Props: `tree: TreeNode[]`
- TreeNode: `{ name: string, type: 'file' | 'dir', children?: TreeNode[], highlight?: boolean }`
- Expandable directories with smooth animation
- Highlighted nodes for current lesson's relevant files

### ProgressRing

- SVG circular progress
- Props: `value: number` (0-100), `size?: number`, `color?: string`
- Animated fill on mount

## Data Flow

```
lessons.ts (metadata) → router (dynamic import) → LessonView
                                                      ├─ Lesson{N}.vue (content)
                                                      └─ Lesson{N}Demo.vue (demo panel)

progress.ts (Pinia) ←→ localStorage
  ├─ completedLessons: string[]
  ├─ quizScores: Record<string, number>
  ├─ currentLesson: string
  └─ lastVisited: string
```

Lesson components are lazy-loaded via dynamic imports in router to keep initial bundle small.

## Router

```typescript
const routes = [
  { path: '/', component: () => import('./views/DashboardView.vue') },
  { path: '/lesson/:id', component: () => import('./views/LessonView.vue') },
  { path: '/cheatsheet/:name', component: () => import('./views/CheatsheetView.vue') },
]
```

LessonView resolves the lesson component dynamically:
```typescript
const lessonComponent = computed(() => 
  defineAsyncComponent(() => import(`../lessons/week${week}/Lesson${id}.vue`))
)
const demoComponent = computed(() =>
  defineAsyncComponent(() => import(`../lessons/week${week}/Lesson${id}Demo.vue`))
)
```

## Verification

1. `npm run dev` — app starts, dashboard shows 4 week cards
2. Navigate to lesson 1 — theory tab renders with CodeComparison, ParallelCard
3. Switch to Quiz tab — interactive quiz works with instant feedback
4. Complete quiz — progress store updates, localStorage persists
5. Sidebar shows green checkmark on completed lessons
6. Demo panel shows FlowDiagram with animation
7. Dashboard updates with correct progress stats
8. `npm run build` — static build succeeds, all pages accessible
