# Week 2: Будуємо API — Lessons 07-12 + Demo

## Контекст

Week 2 має 6 уроків + тест з повною markdown-документацією, але жодного Vue-компонента. Потрібно створити 12 файлів (6 Lesson + 6 Demo) використовуючи ті самі компоненти і патерни що у Week 1.

**Мета:** створити інтерактивні Vue-компоненти для Lessons 07-12, кожен з 4 табами (Theory, Practice, Quiz, Tasks) + Demo-панель.

**Джерело контенту:** `lessons/week-2-api-building/*.md`

## Структура кожного уроку

Кожен Lesson*.vue:
- `<script setup lang="ts">` — імпорти, quiz data, code constants, diagram data
- Template з 4 табами через `v-show="activeTab === '...'"`:
  - **Theory** — TheoryBlock, CodeComparison, CodeBlock, InteractiveDiagram
  - **Practice** — TheoryBlock з інструкціями + CodePlayground
  - **Quiz** — Quiz component з 5 питань
  - **Tasks** — TheoryBlock з описом + CodePlayground з testCode
- Scoped styles (мінімальні, як в Week 1)

Кожен Lesson*Demo.vue:
- MemoryCard з 5-8 парами Vue ↔ Laravel
- FlowDiagram або TerminalOutput
- ~60-80 рядків

## Файли для створення

Всі в `app/src/lessons/week2/`:

### Lesson07.vue — Eloquent Relationships

**Theory:**
- ParallelCard: `array.find()` → `belongsTo()`
- TheoryBlock "Три типи зв'язків" (hasMany, belongsTo, belongsToMany)
- CodeComparison: JS manual join vs Laravel `$task->category`
- CodeBlock: повні моделі Task, Category з relationship methods
- TheoryBlock "Eager Loading та N+1" з поясненням
- CodeComparison: N+1 проблема vs `with()` рішення
- InteractiveDiagram: ER-діаграма з relationships (reuse erDiagram з Lesson05 але з belongsTo/hasMany стрілками)

**Practice:** CodePlayground з кодом моделі Task (додати relationship methods)
**Quiz:** 5 питань (hasMany vs belongsTo, belongsToMany pivot, eager loading, withCount, whereHas)
**Tasks:** Реалізувати relationship methods для Category і User моделей

### Lesson07Demo.vue
- MemoryCard: `array.find()` → `belongsTo()`, `array.filter()` → `hasMany()`, `join table` → `belongsToMany()`, `Promise.all()` → `with()`, `.length` → `withCount()`
- FlowDiagram: Eager loading flow (Query → with('category') → 2 queries → Result)

### Lesson08.vue — Validation & Form Requests

**Theory:**
- ParallelCard: `Zod/Yup` → `Form Request`
- TheoryBlock "Серверна валідація" — чому фронтенд-валідації недостатньо
- CodeComparison: JS Zod schema vs Laravel validation rules
- CodeBlock: StoreTaskRequest з rules(), authorize(), messages()
- TheoryBlock "Правила валідації" — таблиця основних правил
- CodeComparison: create rules (required) vs update rules (sometimes)
- TheoryBlock "422 JSON формат" — структура помилок

**Practice:** CodePlayground з валідаційними правилами
**Quiz:** 5 питань (required vs nullable, authorize, 422, sometimes, custom messages)
**Tasks:** Написати UpdateTaskRequest з правилами для часткового оновлення

### Lesson08Demo.vue
- MemoryCard: `required` → `required`, `z.string().min(3)` → `'string|min:3'`, `z.enum()` → `'in:a,b,c'`, `try/catch` → `422 auto`, `schema.parse()` → `$request->validated()`
- FlowDiagram: Request → Form Request → authorize() → rules() → Controller / 422 Error

### Lesson09.vue — API Resources

**Theory:**
- ParallelCard: `computed()` → `toArray()`
- TheoryBlock "Навіщо Resources" — проблема витоку внутрішньої структури
- CodeComparison: return model напряму vs return Resource
- CodeBlock: TaskResource з toArray(), whenLoaded(), when()
- TheoryBlock "Collections та Pagination" — автоматичне обгортання
- CodeBlock: Controller з Resource::collection() та paginate()
- CodeComparison: Response без Resource vs з Resource (before/after JSON)

**Practice:** CodePlayground — написати CategoryResource
**Quiz:** 5 питань (toArray, whenLoaded, collection, pagination meta, pivot leakage)
**Tasks:** Створити TagResource + оновити controller

### Lesson09Demo.vue
- MemoryCard: `computed()` → `toArray()`, `v-if` → `when()`, `v-if loaded` → `whenLoaded()`, `Array.map()` → `::collection()`, `ref([])` → `paginate()`
- FlowDiagram: Model → Resource toArray() → JSON Response → Frontend

### Lesson10.vue — Error Handling

**Theory:**
- ParallelCard: `try/catch` → `Exception Handler`
- TheoryBlock "JSON замість HTML" — налаштування handler
- CodeBlock: bootstrap/app.php exception handler config
- TheoryBlock "abort() та findOrFail()" — швидкі помилки
- CodeComparison: JS throw vs PHP abort/findOrFail
- TheoryBlock "Custom Exceptions" — створення власних класів
- CodeBlock: TaskLimitExceededException
- TheoryBlock "Логування" — Log facade та рівні

**Practice:** CodePlayground з exception handler setup
**Quiz:** 5 питань (abort vs throw, findOrFail, log levels, APP_DEBUG, render method)
**Tasks:** Створити custom exception та інтегрувати в controller

### Lesson10Demo.vue
- MemoryCard: `throw new Error()` → `abort(404)`, `try/catch` → `Exception Handler`, `console.error()` → `Log::error()`, `.catch()` → `render()`, `process.env.NODE_ENV` → `APP_DEBUG`
- FlowDiagram: Request → Controller → Exception → Handler → render() → JSON 4xx/5xx

### Lesson11.vue — Seeders & Factories

**Theory:**
- ParallelCard: `@faker-js/faker` → `Faker (built-in)`
- TheoryBlock "Factories" — definition(), states, relationships
- CodeComparison: JS faker vs PHP Faker usage
- CodeBlock: TaskFactory з definition() та states (overdue, completed, highPriority)
- TheoryBlock "Seeders" — DatabaseSeeder, ordering
- CodeBlock: TaskSeeder з create(), for(), has(), recycle()
- TheoryBlock "create() vs make()" — різниця

**Practice:** CodePlayground з factory definition
**Quiz:** 5 питань (create vs make, recycle, states, migrate:fresh --seed, afterCreating)
**Tasks:** Написати CategoryFactory з предвизначеними назвами

### Lesson11Demo.vue
- MemoryCard: `faker.name()` → `fake()->name()`, `beforeEach()` → `DatabaseSeeder`, `factory()` → `Factory::new()`, `fixtures/` → `database/seeders/`, `mock data` → `states()`
- TerminalOutput: `php artisan db:seed` та `php artisan migrate:fresh --seed`

### Lesson12.vue — Scopes, Filtering, Sorting

**Theory:**
- ParallelCard: `computed()` → `scopeMethod()`
- TheoryBlock "Query Scopes" — reusable query fragments
- CodeComparison: JS filter/sort vs Laravel scopes
- CodeBlock: scopeOverdue(), scopeByStatus(), scopeSearch()
- TheoryBlock "when() для умовних фільтрів" — conditional query building
- CodeBlock: index() controller з when() та whitelist
- TheoryBlock "Pagination" — paginate vs simplePaginate vs cursorPaginate

**Practice:** CodePlayground з scope definitions
**Quiz:** 5 питань (scope naming, when(), whitelist, paginate types, LIKE search)
**Tasks:** Написати index() controller з фільтрацією, сортуванням, пагінацією

### Lesson12Demo.vue
- MemoryCard: `.filter()` → `scopeByStatus()`, `.sort()` → `orderBy()`, `.slice()` → `paginate()`, `if (query)` → `when()`, `allowedFields` → `whitelist`
- TerminalOutput: curl приклади з query params (`?status=pending&sort=deadline&order=asc`)

## Верифікація

1. `cd app && npx vue-tsc --noEmit` — TypeScript check
2. `npm run build` — production build
3. Відкрити кожен урок (07-12) в браузері, перевірити всі 4 таби
4. Перевірити Demo-панелі (MemoryCard, FlowDiagram, TerminalOutput)
5. Перевірити що InteractiveDiagram та CodePlayground працюють
