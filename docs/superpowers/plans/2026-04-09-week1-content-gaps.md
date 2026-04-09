# Week 1 Content Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill missing educational content in Week 1 lessons (01-06) to match the markdown documentation.

**Architecture:** Add new TheoryBlock, CodeComparison, CodeBlock, and InteractiveDiagram sections into existing Theory tabs of 6 Vue lesson components. No files created — only modifications.

**Tech Stack:** Vue 3, TypeScript, existing components (TheoryBlock, CodeComparison, CodeBlock, InteractiveDiagram)

**Spec:** `docs/superpowers/specs/2026-04-09-week1-content-gaps-design.md`

---

### Task 1: Lesson 01 — Add heredoc/nowdoc and spread operator

**Files:**
- Modify: `app/src/lessons/week1/Lesson01.vue`

- [ ] **Step 1: Add new content in Theory tab**

In `app/src/lessons/week1/Lesson01.vue`, find the closing `</CodeComparison>` for the match/switch comparison (the one with `jsSwitch` and `phpMatch` props). After that `</CodeComparison>` and BEFORE the `<CodeFlowVisualizer`, insert:

```html
      <TheoryBlock title="Heredoc (Template Literals)">
        <p>
          В JS є template literals з бектіками. В PHP аналог — <strong>heredoc</strong> (<code>&lt;&lt;&lt;EOT</code>).
          Heredoc підтримує інтерполяцію змінних, як подвійні лапки. <strong>Nowdoc</strong> (<code>&lt;&lt;&lt;'EOT'</code>) —
          без інтерполяції, як одинарні лапки.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`const msg = \`Hello \${name},\ntotal: \${a + b}\`;`"
        :php="`\$msg = &lt;&lt;&lt;EOT\nHello {\$name},\ntotal: {\$total}\nEOT;`"
        js-title="JS (template literal)"
        php-title="PHP (heredoc)"
      />

      <TheoryBlock title="Spread operator">
        <p>
          Оператор <code>...</code> працює і в PHP (з версії 8.1 для масивів).
          Можна розпакувати масив у інший масив або передати аргументи у функцію.
        </p>
      </TheoryBlock>

      <CodeComparison
        js="const merged = [...arr1, ...arr2];"
        php="$merged = [...$arr1, ...$arr2];"
      />
```

- [ ] **Step 2: Verify and commit**

```bash
cd app && npx vue-tsc --noEmit && cd .. && git add app/src/lessons/week1/Lesson01.vue && git commit -m "content: add heredoc and spread operator to Lesson 01"
```

---

### Task 2: Lesson 02 — Add inheritance, static methods, readonly

**Files:**
- Modify: `app/src/lessons/week1/Lesson02.vue`

- [ ] **Step 1: Add new content in Theory tab**

In `app/src/lessons/week1/Lesson02.vue`, find the Theory tab. After the existing content about classes/constructor promotion and BEFORE the Traits section, insert the following 3 blocks:

```html
      <TheoryBlock title="Наслідування та parent::">
        <p>
          PHP <code>extends</code> працює як в JS. Різниця: замість <code>super</code>
          використовується <code>parent::</code> для виклику методів батьківського класу.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`class Admin extends User {\n  constructor(name, role) {\n    super(name);\n    this.role = role;\n  }\n}`"
        :php="`class Admin extends User\n{\n    public function __construct(\n        string \$name,\n        public string \$role,\n    ) {\n        parent::__construct(\$name);\n    }\n}`"
        js-title="JS extends"
        php-title="PHP extends"
      />

      <TheoryBlock title="Static методи">
        <p>
          <code>static</code> методи викликаються через <code>::</code> без створення об'єкта.
          В Laravel це скрізь: <code>Task::create()</code>, <code>Task::find()</code>,
          <code>Route::get()</code>. Аналог JS <code>Class.method()</code>.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`class Task {\n  static create(data) {\n    return new Task(data);\n  }\n}\nconst task = Task.create({...});`"
        :php="`class Task\n{\n    public static function create(array \$data): self\n    {\n        return new self(\$data);\n    }\n}\n\$task = Task::create([...]);`"
        js-title="JS static"
        php-title="PHP static (::)"
      />

      <TheoryBlock title="readonly (PHP 8.1+)">
        <p>
          Властивість <code>readonly</code> не можна змінити після ініціалізації — як <code>const</code>
          для полів об'єкта. Часто використовується з constructor promotion.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="`class Task {\n    public function __construct(\n        public readonly int \$id,\n        public readonly string \$title,\n        public string \$status = 'pending',\n    ) {}\n}\n\n\$task = new Task(1, 'Learn PHP');\n// \$task->id = 2;  // Error: Cannot modify readonly property`"
        lang="php"
        title="readonly properties"
      />
```

- [ ] **Step 2: Verify and commit**

```bash
cd app && npx vue-tsc --noEmit && cd .. && git add app/src/lessons/week1/Lesson02.vue && git commit -m "content: add inheritance, static methods, readonly to Lesson 02"
```

---

### Task 3: Lesson 03 — Add Laravel directory structure diagram

**Files:**
- Modify: `app/src/lessons/week1/Lesson03.vue`

- [ ] **Step 1: Add InteractiveDiagram import**

In `app/src/lessons/week1/Lesson03.vue`, add the import for InteractiveDiagram to the script imports section. Add this line alongside the other component imports:

```typescript
import InteractiveDiagram from '@/components/interactive/InteractiveDiagram.vue'
```

Also add the type import if not present:

```typescript
import type { DiagramStep } from '@/types'
```

- [ ] **Step 2: Add diagram data in script section**

Add the following constants in the `<script setup>` section, after the existing data constants:

```typescript
const laravelStructureDiagram = `flowchart TB
  ROOT["Laravel Project"] --> APP["app/"]
  ROOT --> CONFIG["config/"]
  ROOT --> DB["database/"]
  ROOT --> ROUTES["routes/"]
  ROOT --> RES["resources/"]
  APP --> MODELS["Models/"]
  APP --> HTTP["Http/Controllers/"]
  APP --> PROV["Providers/"]
  DB --> MIG["migrations/"]
  DB --> SEED["seeders/"]
  DB --> FACT["factories/"]
  ROUTES --> WEB["web.php"]
  ROUTES --> API["api.php"]
`

const laravelStructureSteps: DiagramStep[] = [
  {
    highlightNodes: ['APP', 'MODELS', 'HTTP', 'PROV'],
    description: 'app/ — серце додатку. Тут живуть моделі (Models/), контролери (Http/Controllers/) та провайдери (Providers/). Аналог src/ у Vue-проєкті.',
  },
  {
    highlightNodes: ['CONFIG'],
    description: 'config/ — налаштування додатку: бази даних, кеш, пошта, автентифікація. Як .env + конфіг файли у Vue/Nuxt.',
  },
  {
    highlightNodes: ['DB', 'MIG', 'SEED', 'FACT'],
    description: 'database/ — все про БД: міграції (версіонування схеми), seeders (тестові дані), factories (генератори фейкових даних).',
  },
  {
    highlightNodes: ['ROUTES', 'WEB', 'API'],
    description: 'routes/ — маршрутизація. web.php для HTML-сторінок, api.php для API-ендпоінтів. Аналог Vue Router але на сервері.',
  },
  {
    highlightNodes: ['RES'],
    description: 'resources/ — frontend: Blade-шаблони, CSS, JS. Коли підключаємо Vue SPA — це місце де живе фронтенд.',
  },
]
```

- [ ] **Step 3: Add diagram in Theory tab template**

In the Theory tab, after the last existing content (Artisan CLI section), before the closing `</div>` of the theory tab, insert:

```html
      <InteractiveDiagram
        title="Структура Laravel проєкту"
        :definition="laravelStructureDiagram"
        :steps="laravelStructureSteps"
      />
```

- [ ] **Step 4: Verify and commit**

```bash
cd app && npx vue-tsc --noEmit && cd .. && git add app/src/lessons/week1/Lesson03.vue && git commit -m "content: add Laravel directory structure diagram to Lesson 03"
```

---

### Task 4: Lesson 04 — Add Route Model Binding and HTTP status codes

**Files:**
- Modify: `app/src/lessons/week1/Lesson04.vue`

- [ ] **Step 1: Add new content in Theory tab**

In `app/src/lessons/week1/Lesson04.vue`, find the Theory tab. After the existing apiResource section, insert:

```html
      <TheoryBlock title="Route Model Binding">
        <p>
          Laravel може автоматично знайти модель по <code>{id}</code> в URL.
          Замість ручного <code>Task::findOrFail($id)</code> — просто типізуйте параметр.
          Якщо запис не знайдено — Laravel автоматично поверне 404.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`// Vue Router + API call\nrouter.get('/tasks/:id', async (to) => {\n  const res = await fetch('/api/tasks/' + to.params.id);\n  if (!res.ok) throw new Error('Not found');\n  return res.json();\n});`"
        :php="`// Laravel Route Model Binding\nRoute::get('/tasks/{task}', function (Task \$task) {\n    return \$task; // автоматичний findOrFail!\n});\n\n// В контролері:\npublic function show(Task \$task): JsonResponse\n{\n    return response()->json(\$task);\n}`"
        js-title="JS (ручний fetch)"
        php-title="PHP (auto binding)"
      />

      <TheoryBlock title="HTTP Status Codes для API">
        <p>
          Кожна відповідь API має числовий код. Ви вже знаєте їх з fetch/axios на фронтенді.
          В Laravel повертаємо їх явно через <code>response()->json($data, $code)</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="`// Основні коди для REST API:\n//\n// 200 OK            — успішний GET або PUT\n// 201 Created       — успішний POST (ресурс створено)\n// 204 No Content    — успішний DELETE (тіло порожнє)\n// 404 Not Found     — ресурс не знайдено\n// 422 Unprocessable — помилка валідації\n// 500 Server Error  — щось зламалось на сервері\n\n// Приклад у контролері:\npublic function store(Request \$request): JsonResponse\n{\n    \$task = Task::create(\$request->validated());\n    return response()->json(\$task, 201); // Created\n}\n\npublic function destroy(Task \$task): JsonResponse\n{\n    \$task->delete();\n    return response()->json(null, 204); // No Content\n}`"
        lang="php"
        title="HTTP Status Codes"
        :show-line-numbers="true"
      />
```

- [ ] **Step 2: Verify and commit**

```bash
cd app && npx vue-tsc --noEmit && cd .. && git add app/src/lessons/week1/Lesson04.vue && git commit -m "content: add Route Model Binding and HTTP status codes to Lesson 04"
```

---

### Task 5: Lesson 05 — Add pivot tables and ER diagram

**Files:**
- Modify: `app/src/lessons/week1/Lesson05.vue`

- [ ] **Step 1: Add InteractiveDiagram import**

In `app/src/lessons/week1/Lesson05.vue`, add the import for InteractiveDiagram to the script imports section:

```typescript
import InteractiveDiagram from '@/components/interactive/InteractiveDiagram.vue'
```

Also add the type import:

```typescript
import type { DiagramStep } from '@/types'
```

- [ ] **Step 2: Add diagram and pivot table data in script section**

Add these constants in the `<script setup>` section, after the existing data:

```typescript
const pivotMigrationCode = `<?php
// database/migrations/..._create_task_tag_table.php

Schema::create('task_tag', function (Blueprint $table) {
    $table->id();
    $table->foreignId('task_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->timestamps();

    $table->unique(['task_id', 'tag_id']); // одна задача — один тег лише раз
});`

const erDiagram = `erDiagram
  users ||--o{ tasks : "hasMany"
  categories ||--o{ tasks : "hasMany"
  tasks }o--o{ tags : "belongsToMany"
  tasks {
    int id PK
    string title
    string status
    int user_id FK
    int category_id FK
  }
  tags {
    int id PK
    string name
  }
  task_tag {
    int task_id FK
    int tag_id FK
  }
`

const erDiagramSteps: DiagramStep[] = [
  {
    highlightNodes: ['users', 'tasks'],
    description: 'User hasMany Tasks — один юзер має багато задач. В tasks є user_id (foreign key).',
  },
  {
    highlightNodes: ['categories', 'tasks'],
    description: 'Category hasMany Tasks — одна категорія має багато задач. В tasks є category_id.',
  },
  {
    highlightNodes: ['tasks', 'tags', 'task_tag'],
    description: 'Tasks belongsToMany Tags — багато-до-багатьох через pivot таблицю task_tag. Кожен рядок у task_tag зв\'язує одну задачу з одним тегом.',
  },
  {
    highlightNodes: ['task_tag'],
    description: 'Pivot таблиця task_tag — містить лише два foreign keys: task_id та tag_id. Це "міст" між tasks і tags. Laravel створює цей зв\'язок автоматично через belongsToMany.',
  },
]
```

- [ ] **Step 3: Add content in Theory tab template**

In the Theory tab, after the existing foreign keys content, before the closing `</div>`, insert:

```html
      <TheoryBlock title="Pivot таблиці (Many-to-Many)">
        <p>
          Коли задача може мати <strong>багато тегів</strong>, і тег може бути у
          <strong>багатьох задачах</strong> — це зв'язок many-to-many. Для нього потрібна
          окрема <strong>pivot таблиця</strong> (як join table в SQL).
        </p>
        <p>
          В JavaScript ви б створили окрему таблицю вручну і писали JOIN-запити.
          В Laravel — просто вказуєте <code>belongsToMany</code> в моделі, а Laravel
          робить все автоматично.
        </p>
      </TheoryBlock>

      <CodeBlock :code="pivotMigrationCode" lang="php" title="Міграція pivot таблиці" :show-line-numbers="true" />

      <CodeComparison
        :js="`// JS: ручний JOIN\nconst tags = await db.query(\n  'SELECT t.* FROM tags t ' +\n  'JOIN task_tag tt ON t.id = tt.tag_id ' +\n  'WHERE tt.task_id = ?', [taskId]\n);`"
        :php="`// Laravel: автоматично\n\$tags = \$task->tags;\n\n// В моделі Task:\npublic function tags(): BelongsToMany\n{\n    return \$this->belongsToMany(Tag::class);\n}`"
        js-title="JS (ручний SQL)"
        php-title="Laravel (belongsToMany)"
      />

      <InteractiveDiagram
        title="ER-діаграма: зв'язки Task Manager"
        :definition="erDiagram"
        :steps="erDiagramSteps"
      />
```

- [ ] **Step 4: Verify and commit**

```bash
cd app && npx vue-tsc --noEmit && cd .. && git add app/src/lessons/week1/Lesson05.vue && git commit -m "content: add pivot tables and ER diagram to Lesson 05"
```

---

### Task 6: Lesson 06 — Add $guarded

**Files:**
- Modify: `app/src/lessons/week1/Lesson06.vue`

- [ ] **Step 1: Add new content in Theory tab**

In `app/src/lessons/week1/Lesson06.vue`, find the Theory tab. After the `$fillable` TheoryBlock, insert:

```html
      <TheoryBlock title="$guarded — альтернатива $fillable">
        <p>
          Замість переліку <strong>дозволених</strong> полів (<code>$fillable</code>), можна
          перелічити <strong>заборонені</strong> (<code>$guarded</code>). Якщо <code>$guarded = []</code> —
          всі поля дозволені для масового заповнення. Зручно для прототипу, але небезпечно
          для продакшну.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="`// JS: немає вбудованого захисту\nconst task = await db.insert('tasks', req.body);\n// будь-яке поле з body потрапить в БД!`"
        :php="`// Laravel: $fillable (whitelist)\nprotected \$fillable = ['title', 'status'];\n// Тільки title і status можна масово заповнити\n\n// Laravel: $guarded (blacklist)\nprotected \$guarded = ['id'];\n// Все можна, крім id`"
        js-title="JS (без захисту)"
        php-title="Laravel ($fillable vs $guarded)"
      />
```

- [ ] **Step 2: Verify and commit**

```bash
cd app && npx vue-tsc --noEmit && cd .. && git add app/src/lessons/week1/Lesson06.vue && git commit -m "content: add $guarded explanation to Lesson 06"
```

---

### Task 7: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full type check**

```bash
cd app && npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 2: Run production build**

```bash
cd app && npm run build
```
Expected: Build succeeds.

- [ ] **Step 3: Visual verification**

Start dev server: `cd app && npm run dev`

Open each lesson in browser and verify new content appears in Theory tab:
1. Lesson 01: scroll down — heredoc and spread operator sections visible
2. Lesson 02: inheritance, static methods, readonly sections visible before Traits
3. Lesson 03: Laravel directory structure diagram with clickable steps
4. Lesson 04: Route Model Binding and HTTP status codes table
5. Lesson 05: Pivot tables, ER diagram with 4 steps
6. Lesson 06: $guarded section after $fillable
