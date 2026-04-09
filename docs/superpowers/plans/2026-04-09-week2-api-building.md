# Week 2: API Building — Lessons 07-12 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 12 Vue components (6 lessons + 6 demos) for Week 2 covering Eloquent relationships, validation, API resources, error handling, factories/seeders, and scopes/filtering.

**Architecture:** Each lesson follows the Week 1 pattern: `<script setup>` with quiz/code data, 4-tab template (Theory/Practice/Quiz/Tasks), scoped styles. Each demo has MemoryCard + FlowDiagram/TerminalOutput. Content sourced from markdown docs in `lessons/week-2-api-building/`.

**Tech Stack:** Vue 3, TypeScript, existing components (TheoryBlock, CodeComparison, CodeBlock, CodePlayground, InteractiveDiagram, Quiz, MemoryCard, FlowDiagram, TerminalOutput)

**Spec:** `docs/superpowers/specs/2026-04-09-week2-api-building-design.md`

**Pattern files to follow:**
- Lesson pattern: `app/src/lessons/week1/Lesson01.vue`
- Demo pattern: `app/src/lessons/week1/Lesson01Demo.vue`

---

## Instructions for Each Task

Each task creates one Vue file. The subagent MUST:

1. **Read the markdown doc** specified in the task — this is the primary content source
2. **Read the pattern file** (Lesson01.vue or Lesson01Demo.vue) — follow the exact structure
3. **Read the spec** for the specific lesson requirements
4. **Create the Vue file** with complete content
5. **Commit** with the specified message

**Lesson component structure:**
- Props: `activeTab: string`
- Script: quiz questions (QuizQuestion[]), code string constants, diagram data if needed
- Template: 4 divs with `v-show="activeTab === 'theory/practice/quiz/task'"`
- Theory tab: TheoryBlock, CodeComparison (JS vs PHP), CodeBlock, InteractiveDiagram
- Practice tab: TheoryBlock with instructions + CodePlayground
- Quiz tab: Quiz component
- Task tab: TheoryBlock with description + CodePlayground with testCode
- Styles: `.lesson-content` and `.tab-content` with flex/gap (same as Lesson01)

**Demo component structure:**
- Props: `activeTab: string`
- Script: memoryItems array, FlowDiagram steps or TerminalOutput lines
- Template: `<div class="demo-content">` with components
- Styles: `.demo-content` with flex/gap

---

### Task 1: Create Lesson07.vue — Eloquent Relationships

**Files:**
- Create: `app/src/lessons/week2/Lesson07.vue`

- [ ] **Step 1: Read source markdown**
Read: `lessons/week-2-api-building/07-eloquent-relationships.md`

- [ ] **Step 2: Read pattern**
Read: `app/src/lessons/week1/Lesson01.vue` (follow exact structure)
Read: `docs/superpowers/specs/2026-04-09-week2-api-building-design.md` (Lesson07 section)

- [ ] **Step 3: Create the component**

Create `app/src/lessons/week2/Lesson07.vue` with:

**Imports:** ParallelCard, TheoryBlock, CodeComparison, CodeBlock, CodePlayground, InteractiveDiagram, Quiz + types (QuizQuestion, DiagramStep)

**Script data:**
- 5 quiz questions from markdown (hasMany vs belongsTo, belongsToMany pivot, eager loading with(), withCount, whereHas)
- Code constants: relationship method examples, eager loading examples
- ER diagram with relationships (erDiagram mermaid) + 4 steps

**Theory tab content:**
- ParallelCard: `array.find()` → `belongsTo()`
- TheoryBlock "Три типи зв'язків" — hasMany, belongsTo, belongsToMany з поясненнями
- CodeComparison: JS manual query vs Laravel `$task->category`
- CodeBlock: Task model з relationship methods (category, user, tags)
- TheoryBlock "Eager Loading та N+1 проблема"
- CodeComparison: N+1 (100 queries) vs with() (2 queries)
- InteractiveDiagram: ER diagram

**Practice tab:** CodePlayground з моделлю Task — додати relationship methods
**Quiz:** 5 питань
**Tasks:** Реалізувати Category model з relationships (tasks, user)

- [ ] **Step 4: Commit**
```bash
git add app/src/lessons/week2/Lesson07.vue && git commit -m "content: add Lesson 07 — Eloquent Relationships"
```

---

### Task 2: Create Lesson07Demo.vue

**Files:**
- Create: `app/src/lessons/week2/Lesson07Demo.vue`

- [ ] **Step 1: Read demo pattern**
Read: `app/src/lessons/week1/Lesson01Demo.vue`

- [ ] **Step 2: Create the demo**

Create `app/src/lessons/week2/Lesson07Demo.vue` with:

**MemoryCard items:**
```typescript
const memoryItems = [
  { vue: 'array.find()', laravel: 'belongsTo()' },
  { vue: 'array.filter()', laravel: 'hasMany()' },
  { vue: 'join table', laravel: 'belongsToMany()' },
  { vue: 'Promise.all()', laravel: "with('relation')" },
  { vue: '.length', laravel: 'withCount()' },
  { vue: 'arr.some()', laravel: 'whereHas()' },
]
```

**FlowDiagram steps:**
```typescript
const steps: FlowStep[] = [
  { icon: '📋', title: 'Task', subtitle: 'belongsTo Category, User', color: '#7C5CFC' },
  { icon: '📁', title: 'Category', subtitle: 'hasMany Tasks', color: '#059669' },
  { icon: '👤', title: 'User', subtitle: 'hasMany Tasks', color: '#F472B6' },
  { icon: '🏷️', title: 'Tag', subtitle: 'belongsToMany Tasks', color: '#FBBF24' },
  { icon: '🔗', title: 'task_tag', subtitle: 'pivot table', color: '#9CA3AF' },
]
```

- [ ] **Step 3: Commit**
```bash
git add app/src/lessons/week2/Lesson07Demo.vue && git commit -m "content: add Lesson 07 Demo — Relationships overview"
```

---

### Task 3: Create Lesson08.vue — Validation & Form Requests

**Files:**
- Create: `app/src/lessons/week2/Lesson08.vue`

- [ ] **Step 1: Read source and pattern**
Read: `lessons/week-2-api-building/08-validation-form-requests.md`
Read: `app/src/lessons/week1/Lesson01.vue`
Read: `docs/superpowers/specs/2026-04-09-week2-api-building-design.md` (Lesson08 section)

- [ ] **Step 2: Create the component**

Create `app/src/lessons/week2/Lesson08.vue` with:

**Script data:**
- 5 quiz questions (required vs nullable, authorize(), 422 status, sometimes, custom messages)
- Code: StoreTaskRequest, UpdateTaskRequest, validation rules table, 422 JSON format

**Theory tab:**
- ParallelCard: `Zod/Yup` → `Form Request`
- TheoryBlock "Серверна валідація" — чому фронтенд-валідації недостатньо
- CodeComparison: JS Zod schema vs Laravel rules
- CodeBlock: StoreTaskRequest (rules, authorize, messages)
- TheoryBlock "Основні правила" — required, string, min, max, in, exists, unique
- CodeComparison: create rules vs update rules (sometimes)
- TheoryBlock "422 JSON формат"

**Practice/Quiz/Tasks** per spec

- [ ] **Step 3: Commit**
```bash
git add app/src/lessons/week2/Lesson08.vue && git commit -m "content: add Lesson 08 — Validation & Form Requests"
```

---

### Task 4: Create Lesson08Demo.vue

**Files:**
- Create: `app/src/lessons/week2/Lesson08Demo.vue`

- [ ] **Step 1: Create the demo**

MemoryCard: `required` → `required`, `z.string().min(3)` → `'string|min:3'`, `z.enum()` → `'in:a,b,c'`, `try/catch` → `422 auto`, `schema.parse()` → `$request->validated()`

FlowDiagram: Request → Form Request → authorize() → rules() → Controller / 422 Error

- [ ] **Step 2: Commit**
```bash
git add app/src/lessons/week2/Lesson08Demo.vue && git commit -m "content: add Lesson 08 Demo — Validation flow"
```

---

### Task 5: Create Lesson09.vue — API Resources

**Files:**
- Create: `app/src/lessons/week2/Lesson09.vue`

- [ ] **Step 1: Read source and pattern**
Read: `lessons/week-2-api-building/09-api-resources.md`
Read: `app/src/lessons/week1/Lesson01.vue`

- [ ] **Step 2: Create per spec (Lesson09 section)**

**Theory:** Resources as transformation layer, toArray(), whenLoaded(), collections, pagination
**Quiz:** 5 questions on Resource pattern
**Practice/Tasks:** Create CategoryResource, update controller

- [ ] **Step 3: Commit**
```bash
git add app/src/lessons/week2/Lesson09.vue && git commit -m "content: add Lesson 09 — API Resources"
```

---

### Task 6: Create Lesson09Demo.vue

**Files:**
- Create: `app/src/lessons/week2/Lesson09Demo.vue`

- [ ] **Step 1: Create the demo**

MemoryCard: `computed()` → `toArray()`, `v-if` → `when()`, `v-if loaded` → `whenLoaded()`, `Array.map()` → `::collection()`, `ref([])` → `paginate()`

FlowDiagram: Model → Resource toArray() → JSON → Frontend

- [ ] **Step 2: Commit**
```bash
git add app/src/lessons/week2/Lesson09Demo.vue && git commit -m "content: add Lesson 09 Demo — Resource transformation"
```

---

### Task 7: Create Lesson10.vue — Error Handling

**Files:**
- Create: `app/src/lessons/week2/Lesson10.vue`

- [ ] **Step 1: Read source and pattern**
Read: `lessons/week-2-api-building/10-error-handling.md`
Read: `app/src/lessons/week1/Lesson01.vue`

- [ ] **Step 2: Create per spec (Lesson10 section)**

**Theory:** JSON errors, abort/findOrFail, custom exceptions, Log facade, APP_DEBUG
**Quiz:** 5 questions
**Practice/Tasks:** Create custom exception + exception handler config

- [ ] **Step 3: Commit**
```bash
git add app/src/lessons/week2/Lesson10.vue && git commit -m "content: add Lesson 10 — Error Handling"
```

---

### Task 8: Create Lesson10Demo.vue

**Files:**
- Create: `app/src/lessons/week2/Lesson10Demo.vue`

- [ ] **Step 1: Create the demo**

MemoryCard: `throw new Error()` → `abort(404)`, `try/catch` → `Exception Handler`, `console.error()` → `Log::error()`, `.catch()` → `render()`, `process.env.NODE_ENV` → `APP_DEBUG`

FlowDiagram: Request → Controller → Exception → Handler → render() → JSON Response

- [ ] **Step 2: Commit**
```bash
git add app/src/lessons/week2/Lesson10Demo.vue && git commit -m "content: add Lesson 10 Demo — Error handling flow"
```

---

### Task 9: Create Lesson11.vue — Seeders & Factories

**Files:**
- Create: `app/src/lessons/week2/Lesson11.vue`

- [ ] **Step 1: Read source and pattern**
Read: `lessons/week-2-api-building/11-seeders-and-factories.md`
Read: `app/src/lessons/week1/Lesson01.vue`

- [ ] **Step 2: Create per spec (Lesson11 section)**

**Theory:** Factories with definition(), states, relationships (for/has/recycle), seeders, create vs make
**Quiz:** 5 questions
**Practice/Tasks:** Write TaskFactory with states

- [ ] **Step 3: Commit**
```bash
git add app/src/lessons/week2/Lesson11.vue && git commit -m "content: add Lesson 11 — Seeders & Factories"
```

---

### Task 10: Create Lesson11Demo.vue

**Files:**
- Create: `app/src/lessons/week2/Lesson11Demo.vue`

- [ ] **Step 1: Create the demo**

MemoryCard: `faker.name()` → `fake()->name()`, `beforeEach()` → `DatabaseSeeder`, `factory()` → `Factory::new()`, `fixtures/` → `database/seeders/`, `mock data` → `states()`

TerminalOutput: `php artisan db:seed` and `php artisan migrate:fresh --seed` output

- [ ] **Step 2: Commit**
```bash
git add app/src/lessons/week2/Lesson11Demo.vue && git commit -m "content: add Lesson 11 Demo — Seeder commands"
```

---

### Task 11: Create Lesson12.vue — Scopes, Filtering, Sorting

**Files:**
- Create: `app/src/lessons/week2/Lesson12.vue`

- [ ] **Step 1: Read source and pattern**
Read: `lessons/week-2-api-building/12-scopes-filtering-sorting.md`
Read: `app/src/lessons/week1/Lesson01.vue`

- [ ] **Step 2: Create per spec (Lesson12 section)**

**Theory:** Query scopes, when(), whitelist sorting, pagination types
**Quiz:** 5 questions
**Practice/Tasks:** Write index() controller with filtering, sorting, pagination

- [ ] **Step 3: Commit**
```bash
git add app/src/lessons/week2/Lesson12.vue && git commit -m "content: add Lesson 12 — Scopes, Filtering, Sorting"
```

---

### Task 12: Create Lesson12Demo.vue

**Files:**
- Create: `app/src/lessons/week2/Lesson12Demo.vue`

- [ ] **Step 1: Create the demo**

MemoryCard: `.filter()` → `scopeByStatus()`, `.sort()` → `orderBy()`, `.slice()` → `paginate()`, `if (query)` → `when()`, `allowedFields` → `whitelist`

TerminalOutput: curl examples with query params

- [ ] **Step 2: Commit**
```bash
git add app/src/lessons/week2/Lesson12Demo.vue && git commit -m "content: add Lesson 12 Demo — Query examples"
```

---

### Task 13: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Type check**
```bash
cd app && npx vue-tsc --noEmit
```

- [ ] **Step 2: Build**
```bash
cd app && npm run build
```

- [ ] **Step 3: Visual verification**
Open each lesson 07-12 in browser, verify all tabs and demo panels render.
