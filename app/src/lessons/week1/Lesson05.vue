<script setup lang="ts">
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import InteractiveDiagram from '@/components/interactive/InteractiveDiagram.vue'
import type { QuizQuestion, DiagramStep } from '@/types'

defineProps<{
  activeTab: string
}>()

const tsInterfaceCode = `// TypeScript -- форма даних на фронтенді
interface Task {
  id: number
  title: string
  description?: string    // nullable
  status: 'pending' | 'in_progress' | 'done'
  priority: number
  deadline?: Date          // nullable
  user_id: number          // foreign key
  category_id?: number     // nullable FK
  created_at: Date
  updated_at: Date
}`

const migrationCode = `// Laravel -- структура таблиці в базі даних
Schema::create('tasks', function (Blueprint $table) {
    $table->id();                                    // id: number
    $table->string('title');                         // title: string
    $table->text('description')->nullable();         // description?: string
    $table->string('status')->default('pending');    // status: string
    $table->unsignedTinyInteger('priority')->default(0);
    $table->date('deadline')->nullable();            // deadline?: Date
    $table->foreignId('user_id')
        ->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')
        ->nullable()->constrained()->nullOnDelete();
    $table->timestamps();                            // created_at, updated_at
    $table->softDeletes();                           // deleted_at?: Date
});`

const fullMigrationCode = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedTinyInteger('priority')->default(0);
            $table->date('deadline')->nullable();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};`

const zodComparisonJs = `// Zod schema (JavaScript)
const TaskSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  status: z.string().default('pending'),
  priority: z.number().default(0),
  deadline: z.date().nullable(),
})`

const zodComparisonPhp = `// Laravel Blueprint (PHP)
Schema::create('tasks', function (Blueprint $table) {
    $table->string('title');
    $table->text('description')->nullable();
    $table->string('status')->default('pending');
    $table->unsignedTinyInteger('priority')->default(0);
    $table->date('deadline')->nullable();
});`

const createMigrationLines = [
  '$ php artisan make:migration create_categories_table',
  '',
  '   INFO  Migration [database/migrations/2026_04_09_120001_create_categories_table.php] created successfully.',
  '',
  '$ php artisan make:migration create_tasks_table',
  '',
  '   INFO  Migration [database/migrations/2026_04_09_120002_create_tasks_table.php] created successfully.',
]

const migrateLines = [
  '$ php artisan migrate',
  '',
  '   INFO  Running migrations.',
  '',
  '  0001_01_01_000000_create_users_table ................ 12.45ms DONE',
  '  0001_01_01_000001_create_cache_table ................. 3.22ms DONE',
  '  0001_01_01_000002_create_jobs_table .................. 5.67ms DONE',
  '  2026_04_09_120001_create_categories_table ............ 2.15ms DONE',
  '  2026_04_09_120002_create_tasks_table ................. 3.42ms DONE',
  '  2026_04_09_120003_create_tags_table .................. 1.89ms DONE',
  '  2026_04_09_120004_create_task_tag_table .............. 2.03ms DONE',
]

const dbTableLines = [
  '$ php artisan db:table tasks',
  '',
  '  tasks',
  '',
  '  Column .............. Type .............. Modifiers',
  '  id .................. integer ........... autoincrement',
  '  title ............... varchar ...........',
  '  description ......... text .............. nullable',
  '  status .............. varchar ........... default: \'pending\'',
  '  priority ............ integer ........... default: 0',
  '  deadline ............ date .............. nullable',
  '  user_id ............. integer ...........',
  '  category_id ......... integer ........... nullable',
  '  created_at .......... datetime .......... nullable',
  '  updated_at .......... datetime .......... nullable',
  '  deleted_at .......... datetime .......... nullable',
]

const addColumnCode = `// Нова міграція -- додає колонку до існуючої таблиці
// $ php artisan make:migration add_notes_to_tasks_table

public function up(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->text('notes')->nullable()->after('description');
    });
}

public function down(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->dropColumn('notes');
    });
}`

const foreignKeyCode = `// Foreign keys -- зв'язки між таблицями
$table->foreignId('user_id')
    ->constrained()          // FK на users.id
    ->cascadeOnDelete();     // Видалити задачі при видаленні юзера

$table->foreignId('category_id')
    ->nullable()             // Задача може бути без категорії
    ->constrained()          // FK на categories.id
    ->nullOnDelete();        // Встановити NULL при видаленні категорії`

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

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Що таке міграція в Laravel?',
    options: [
      'PHP-файл, який описує зміни в базі даних',
      'Процес переміщення даних між серверами',
      'Команда для створення бази даних',
      'Файл конфігурації підключення до БД',
    ],
    correct: 0,
    explanation: 'Міграція -- це PHP-файл з методами up() (застосувати зміни) та down() (відкотити зміни). Це version control для бази даних -- кожна міграція як "коміт" для структури БД.',
  },
  {
    question: 'Який метод робить колонку необов\'язковою (може бути NULL)?',
    options: [
      '->optional()',
      '->nullable()',
      '->null()',
      '->allowNull()',
    ],
    correct: 1,
    explanation: 'Метод ->nullable() дозволяє колонці мати значення NULL. Це аналог ? у TypeScript: description?: string. Без nullable() колонка буде обов\'язковою.',
  },
  {
    question: 'Що робить foreignId(\'user_id\')->constrained()->cascadeOnDelete()?',
    options: [
      'Створює колонку user_id як текст',
      'Створює зовнішній ключ на users.id; при видаленні юзера видаляє пов\'язані записи',
      'Створює колонку user_id і забороняє NULL',
      'Створює нову таблицю users',
    ],
    correct: 1,
    explanation: 'foreignId створює колонку BIGINT UNSIGNED, constrained() додає foreign key на users.id (визначається автоматично за назвою user_id), cascadeOnDelete() видаляє залежні записи при видаленні батьківського запису.',
  },
  {
    question: 'Що робить php artisan migrate:fresh?',
    options: [
      'Запускає тільки нові міграції',
      'Видаляє ВСІ таблиці та запускає всі міграції заново',
      'Відкочує останню міграцію',
      'Показує список всіх міграцій',
    ],
    correct: 1,
    explanation: 'migrate:fresh -- це "ядерна кнопка": видаляє ВСІ таблиці і запускає всі міграції з нуля. Використовуйте тільки в розробці, ніколи на продакшені!',
  },
  {
    question: 'Як правильно додати нову колонку до існуючої таблиці?',
    options: [
      'Змінити існуючу міграцію і запустити migrate:fresh',
      'Створити нову міграцію з Schema::table() і запустити migrate',
      'Напряму змінити базу даних через SQL',
      'Видалити таблицю і створити заново',
    ],
    correct: 1,
    explanation: 'Ніколи не змінюйте існуючу міграцію, яка вже виконана. Створіть нову міграцію з Schema::table() (не create!) -- це як новий коміт в git. Так ваші колеги зможуть застосувати зміни через php artisan migrate.',
  },
]
</script>

<template>
  <!-- Theory Tab -->
  <div v-show="activeTab === 'theory'">
    <div class="lesson-content-blocks">
      <ParallelCard from="Prisma schema / TypeScript interface" to="Migration + Blueprint" />

      <TheoryBlock title="Міграції -- version control для бази даних">
        <p>
          Уявіть, що ваш колега додав нову таблицю в базу даних, але ви про це не знаєте.
          Ви робите <code>git pull</code>, запускаєте проєкт -- і все ламається.
        </p>
        <p>
          <strong>Міграції вирішують цю проблему.</strong> Міграція -- це PHP-файл, який описує
          зміни в базі даних. Це як <code>git</code> для коду, тільки для структури БД.
          Кожна міграція -- це "коміт" для бази даних.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="tsInterfaceCode"
        :php="migrationCode"
        js-title="TypeScript interface"
        php-title="Laravel Migration"
      />

      <TheoryBlock title="Типи колонок та модифікатори">
        <p>Основні типи колонок в Blueprint:</p>
        <ul>
          <li><code>$table-&gt;id()</code> -- автоінкремент primary key (як <code>id: number</code>)</li>
          <li><code>$table-&gt;string('name')</code> -- VARCHAR(255) (як <code>name: string</code>)</li>
          <li><code>$table-&gt;text('body')</code> -- TEXT для довгого тексту</li>
          <li><code>$table-&gt;boolean('active')</code> -- BOOLEAN (як <code>active: boolean</code>)</li>
          <li><code>$table-&gt;integer('count')</code> -- INTEGER (як <code>count: number</code>)</li>
          <li><code>$table-&gt;date('deadline')</code> -- DATE (як <code>deadline: string</code>)</li>
          <li><code>$table-&gt;timestamps()</code> -- додає created_at та updated_at</li>
          <li><code>$table-&gt;foreignId('user_id')</code> -- зовнішній ключ</li>
        </ul>
        <p>Модифікатори: <code>-&gt;nullable()</code> (як <code>?</code> в TS),
          <code>-&gt;default('value')</code>, <code>-&gt;unique()</code>, <code>-&gt;index()</code>
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="zodComparisonJs"
        :php="zodComparisonPhp"
        js-title="Zod schema (JS)"
        php-title="Laravel Blueprint"
      />

      <TheoryBlock title="Foreign Keys (зовнішні ключі)">
        <p>
          У Vue ви працюєте з вкладеними об'єктами: <code>task.category.name</code>.
          У базі даних зв'язки реалізуються через foreign keys -- посилання з однієї таблиці
          на іншу. <code>constrained()</code> автоматично визначає цільову таблицю за назвою колонки.
        </p>
      </TheoryBlock>

      <CodeBlock lang="php" :code="foreignKeyCode" title="Foreign Keys" />

      <CodeBlock lang="php" :code="fullMigrationCode" title="Повна міграція tasks" :show-line-numbers="true" />

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
    </div>
  </div>

  <!-- Practice Tab -->
  <div v-show="activeTab === 'practice'">
    <div class="lesson-content-blocks">
      <TheoryBlock title="Крок 1: Створіть міграції">
        <p>
          Категорії створюємо <strong>першими</strong>, бо tasks будуть посилатись на categories
          через foreign key. Порядок має значення!
        </p>
      </TheoryBlock>

      <TerminalOutput :lines="createMigrationLines" title="Створення міграцій" />

      <TheoryBlock title="Крок 2: Запустіть міграції">
        <p>
          Команда <code>php artisan migrate</code> застосовує всі нові (ще не виконані) міграції.
          Laravel відстежує, які міграції вже виконані, у спеціальній таблиці <code>migrations</code>.
        </p>
      </TheoryBlock>

      <TerminalOutput :lines="migrateLines" title="php artisan migrate" />

      <TheoryBlock title="Крок 3: Перевірте структуру таблиці">
        <p>
          Команда <code>php artisan db:table tasks</code> показує структуру конкретної таблиці:
          назви колонок, типи даних та модифікатори.
        </p>
      </TheoryBlock>

      <TerminalOutput :lines="dbTableLines" title="php artisan db:table tasks" />

      <TheoryBlock title="Корисні команди">
        <ul>
          <li><code>php artisan migrate</code> -- запустити нові міграції</li>
          <li><code>php artisan migrate:rollback</code> -- відкотити останню пачку</li>
          <li><code>php artisan migrate:fresh</code> -- видалити все і почати з нуля</li>
          <li><code>php artisan migrate:status</code> -- перевірити статус міграцій</li>
          <li><code>php artisan db:show</code> -- загальна інформація про БД</li>
          <li><code>php artisan db:table tasks</code> -- структура таблиці</li>
        </ul>
      </TheoryBlock>
    </div>
  </div>

  <!-- Quiz Tab -->
  <div v-show="activeTab === 'quiz'">
    <Quiz :questions="quizQuestions" lesson-id="week1-lesson05" />
  </div>

  <!-- Task Tab -->
  <div v-show="activeTab === 'task'">
    <div class="lesson-content-blocks">
      <TheoryBlock title="Завдання: Додайте колонку notes до таблиці tasks">
        <p>
          Не змінюйте існуючу міграцію! Створіть <strong>нову</strong> міграцію для додавання
          колонки -- так само, як ви створюєте новий коміт в git, а не змінюєте старий.
        </p>
        <ol>
          <li>Створіть нову міграцію: <code>php artisan make:migration add_notes_to_tasks_table</code></li>
          <li>Використайте <code>Schema::table()</code> (не <code>create</code>!) для зміни існуючої таблиці</li>
          <li>Додайте колонку <code>notes</code> типу <code>text</code>, <code>nullable</code>, після <code>description</code></li>
          <li>В методі <code>down()</code> видаліть колонку через <code>dropColumn('notes')</code></li>
          <li>Запустіть <code>php artisan migrate</code> і перевірте через <code>php artisan db:table tasks</code></li>
          <li>Спробуйте <code>php artisan migrate:rollback</code> і переконайтесь, що колонка зникла</li>
        </ol>
      </TheoryBlock>

      <CodeBlock lang="php" :code="addColumnCode" title="Підказка: додавання колонки" :show-line-numbers="true" />
    </div>
  </div>
</template>

<style scoped>
.lesson-content-blocks {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
