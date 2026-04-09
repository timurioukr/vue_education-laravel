# Week 1: Заповнення прогалин у навчальному контенті

## Контекст

Аудит показав що Vue-компоненти Lessons 01-06 покривають 65-90% матеріалу з markdown-документації. Критичні теми (inheritance, pivot tables, Route Model Binding) пропущені. Потрібно додати відсутній контент в існуючі уроки, використовуючи ті самі інтерактивні компоненти (TheoryBlock, CodeComparison, CodeBlock, InteractiveDiagram, CodeFlowVisualizer).

**Мета:** підняти покриття кожного уроку до 90-100% без переписування існуючого контенту.

**Підхід:** додаємо нові секції в Theory таби існуючих компонентів. Жоден існуючий контент не видаляється.

## Зміни по урокам

### Lesson 01: PHP Syntax (90% → 100%)

**Файл:** `app/src/lessons/week1/Lesson01.vue`

Додати в Theory таб (після секції "Оператори", перед CodeFlowVisualizer):

1. **TheoryBlock "Heredoc та Nowdoc"** — пояснення що heredoc (`<<<EOT`) це template literals з JS, nowdoc (`<<<'EOT'`) — без інтерполяції.

2. **CodeComparison** — JS template literal vs PHP heredoc:
   - JS: `` `Hello ${name}, total: ${a + b}` ``
   - PHP: `"Hello {$name}, total: " . ($a + $b)`  та heredoc варіант

3. **TheoryBlock "Spread operator"** — `...` працює і в PHP 8.1+ для масивів.

4. **CodeComparison** — JS spread vs PHP spread:
   - JS: `const merged = [...arr1, ...arr2]`
   - PHP: `$merged = [...$arr1, ...$arr2];`

---

### Lesson 02: PHP OOP (70% → 95%)

**Файл:** `app/src/lessons/week1/Lesson02.vue`

Додати в Theory таб (після секції про класи, перед Traits/Enums):

1. **TheoryBlock "Наслідування та parent::"** — PHP extends аналог JS extends, parent:: аналог super.

2. **CodeComparison** — JS class extends vs PHP class extends:
   - JS: `class Admin extends User { constructor() { super(); } }`
   - PHP: `class Admin extends User { public function __construct() { parent::__construct(); } }`

3. **TheoryBlock "Static методи та Factory Pattern"** — static аналог JS static methods, часто використовується в Laravel для factory/builder patterns.

4. **CodeComparison** — JS static vs PHP static:
   - JS: `class Task { static create(data) { ... } }` → `Task.create({...})`
   - PHP: `class Task { public static function create(array $data) { ... } }` → `Task::create([...])`

5. **TheoryBlock "readonly (PHP 8.1+)"** — readonly properties не можна змінити після ініціалізації. Як const для властивостей.

6. **CodeBlock** — PHP readonly приклад:
   ```php
   class Task {
       public function __construct(
           public readonly int $id,
           public readonly string $title,
       ) {}
   }
   ```

---

### Lesson 03: Installation & Structure (75% → 90%)

**Файл:** `app/src/lessons/week1/Lesson03.vue`

Додати в Theory таб (після огляду структури):

1. **InteractiveDiagram** — flowchart з основними директоріями Laravel проєкту:
   ```
   app/ → Models, Http/Controllers, Providers
   config/ → app.php, database.php, auth.php
   database/ → migrations, seeders, factories
   routes/ → web.php, api.php
   resources/ → views, css, js
   ```
   З покроковими поясненнями (5 кроків): що таке app/, config/, database/, routes/, resources/.

---

### Lesson 04: Routing & Controllers (85% → 95%)

**Файл:** `app/src/lessons/week1/Lesson04.vue`

Додати в Theory таб (після секції apiResource):

1. **TheoryBlock "Route Model Binding"** — Laravel автоматично знаходить модель по {id} в URL. Не потрібно писати `findOrFail()` вручну.

2. **CodeComparison** — без binding vs з binding:
   - Без: `Route::get('/tasks/{id}', function (string $id) { $task = Task::findOrFail($id); });`
   - З: `Route::get('/tasks/{task}', function (Task $task) { return $task; });`

3. **TheoryBlock "HTTP Status Codes для API"** — таблиця основних кодів.

4. **CodeBlock** — таблиця кодів у вигляді коментованого PHP:
   ```php
   // 200 OK — успішний GET/PUT
   // 201 Created — успішний POST (створення)
   // 204 No Content — успішний DELETE
   // 404 Not Found — ресурс не знайдено
   // 422 Unprocessable — помилка валідації
   // 500 Server Error — внутрішня помилка
   ```

---

### Lesson 05: Migrations & Schema (65% → 95%)

**Файл:** `app/src/lessons/week1/Lesson05.vue`

Додати в Theory таб (після секції про foreign keys):

1. **TheoryBlock "Pivot таблиці (Many-to-Many)"** — коли задача може мати багато тегів, і тег може бути у багатьох задачах — потрібна pivot таблиця.

2. **CodeBlock** — міграція для pivot таблиці:
   ```php
   Schema::create('task_tag', function (Blueprint $table) {
       $table->id();
       $table->foreignId('task_id')->constrained()->cascadeOnDelete();
       $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
       $table->timestamps();
       $table->unique(['task_id', 'tag_id']);
   });
   ```

3. **InteractiveDiagram** — ER-діаграма зв'язків:
   ```mermaid
   erDiagram
       users ||--o{ tasks : "hasMany"
       categories ||--o{ tasks : "hasMany"
       tasks }o--o{ tags : "belongsToMany"
       tasks ||--o{ task_tag : ""
       tags ||--o{ task_tag : ""
   ```
   З покроковими поясненнями (4 кроки): users→tasks, categories→tasks, tasks↔tags через pivot, що лежить в task_tag.

4. **CodeComparison** — JS many-to-many vs Laravel:
   - JS: `task.tags = await db.query('SELECT... JOIN task_tag...')`
   - PHP: `$task->tags` (Eloquent робить JOIN автоматично через `belongsToMany`)

---

### Lesson 06: Eloquent Models (90% → 95%)

**Файл:** `app/src/lessons/week1/Lesson06.vue`

Додати в Theory таб (після секції про $fillable):

1. **TheoryBlock "$guarded — альтернатива $fillable"** — замість переліку дозволених полів, перелічуємо заборонені. `$guarded = []` — все дозволено (зручно для прототипу, небезпечно для продакшну).

2. **CodeComparison** — $fillable vs $guarded:
   - `$fillable = ['title', 'status'];` → тільки ці поля можна масово заповнити
   - `$guarded = ['id'];` → все можна, крім id

## Файли для зміни

- `app/src/lessons/week1/Lesson01.vue`
- `app/src/lessons/week1/Lesson02.vue`
- `app/src/lessons/week1/Lesson03.vue`
- `app/src/lessons/week1/Lesson04.vue`
- `app/src/lessons/week1/Lesson05.vue`
- `app/src/lessons/week1/Lesson06.vue`

## Верифікація

1. `cd app && npx vue-tsc --noEmit` — без TypeScript помилок
2. Відкрити кожен урок в браузері, перейти на Theory таб, прокрутити до нових секцій
3. InteractiveDiagram (Lesson 03, 05) — покрокова навігація працює
4. CodeComparison/CodeBlock — код рендериться з підсвіткою
