<script setup lang="ts">
import ParallelCard from '@/components/common/ParallelCard.vue'
import TheoryBlock from '@/components/common/TheoryBlock.vue'
import CodeComparison from '@/components/interactive/CodeComparison.vue'
import CodeBlock from '@/components/interactive/CodeBlock.vue'
import CodePlayground from '@/components/interactive/CodePlayground.vue'
import Quiz from '@/components/interactive/Quiz.vue'
import type { QuizQuestion } from '@/types'

defineProps<{
  activeTab: string
}>()

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Яка різниця між create() та make() у Laravel-фабриці?',
    options: [
      'create() створює об\'єкт в пам\'яті, make() зберігає в базу',
      'create() зберігає модель у базу і повертає її з id, make() створює об\'єкт тільки в пам\'яті',
      'Різниці немає — це синоніми',
      'make() створює кілька записів, create() тільки один',
    ],
    correct: 1,
    explanation:
      'create() виконує INSERT в базу і повертає модель з id. make() створює об\'єкт тільки в пам\'яті — корисно для unit-тестів, коли реальна база не потрібна. Це як різниця між generateFakeTask() і api.post(\'/tasks\', generateFakeTask()) у JavaScript.',
  },
  {
    question: 'Для чого використовується recycle() у фабриці?',
    options: [
      'Для видалення створених записів після тесту',
      'Для повторного використання існуючих моделей замість створення нових для кожного запису',
      'Для оновлення існуючих записів новими фейковими даними',
      'Для кешування фабрики між запусками seeders',
    ],
    correct: 1,
    explanation:
      'Без recycle() фабрика автоматично створює нову пов\'язану модель для кожного запису. З recycle($categories) — всі 10 задач використовують одну з існуючих категорій замість того, щоб створювати 10 нових. Це як повторне використання змінної замість виклику функції в циклі.',
  },
  {
    question: 'Навіщо потрібні factory states?',
    options: [
      'Для зберігання стану фабрики між запусками seeders',
      'Для створення іменованих варіацій моделі — overdue, completed, highPriority',
      'Для валідації даних перед збереженням в базу',
      'Для підключення фабрики до різних баз даних',
    ],
    correct: 1,
    explanation:
      'Factory states — це іменовані варіації моделі. Task::factory()->overdue() завжди створює задачу з дедлайном у минулому. Стани можна ланцюжково комбінувати: ->overdue()->highPriority(). Це як різні fixture presets у JavaScript-тестах.',
  },
  {
    question: 'Що робить php artisan migrate:fresh --seed?',
    options: [
      'Запускає тільки нові міграції та seeders',
      'Видаляє всі таблиці, запускає міграції заново, потім запускає DatabaseSeeder',
      'Видаляє тільки тестові дані без структури',
      'Робить резервну копію бази і створює нову',
    ],
    correct: 1,
    explanation:
      'migrate:fresh --seed видаляє всі таблиці, запускає всі міграції з нуля, а потім автоматично запускає DatabaseSeeder. Це "повний скид" до чистого стану з тестовими даними — як видалити node_modules, встановити заново і запустити setup-скрипт.',
  },
  {
    question: 'Що робить afterCreating() у фабриці?',
    options: [
      'Видаляє модель із бази після створення',
      'Виконує додаткові дії після збереження моделі в базу — наприклад, прикріплює many-to-many зв\'язки',
      'Перевіряє, чи модель збережена правильно',
      'Запускається автоматично після всіх seeders',
    ],
    correct: 1,
    explanation:
      'afterCreating() виконує код після того, як модель вже збережена в базу і має id. Це потрібно для зв\'язків, які вимагають id (наприклад, many-to-many через attach()). Аналог у JavaScript — .then() після async-операції створення.',
  },
]

// === Faker comparison ===
const jsFakerCode = `import { faker } from '@faker-js/faker';

faker.person.fullName();
// "John Doe"

faker.internet.email();
// "john@example.com"

faker.lorem.sentence();
// "The quick brown fox."

faker.datatype.boolean();
// true або false

faker.number.int({ min: 1, max: 5 });
// Випадкове число

faker.helpers.arrayElement(
  ['low', 'medium', 'high']
);
// Випадковий елемент

faker.date.between({
  from: new Date(),
  to: addMonths(new Date(), 2)
});
// Дата в діапазоні`

const phpFakerCode = `// Laravel (PHP Faker — вбудований)

fake()->name();
// "John Doe"

fake()->email();
// "john@example.com"

fake()->sentence();
// "The quick brown fox."

fake()->boolean();
// true або false

fake()->numberBetween(1, 5);
// Випадкове число

fake()->randomElement(
  ['low', 'medium', 'high']
);
// Випадковий елемент

fake()->dateTimeBetween(
  'now', '+2 months'
);
// Дата в діапазоні`

// === TaskFactory with states ===
const taskFactoryCode = `<?php

namespace Database\\Factories;

use App\\Models\\Category;
use App\\Models\\Task;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title'       => fake()->sentence(4),
            'description' => fake()->optional(0.8)->paragraph(),
            'status'      => fake()->randomElement(['pending', 'in_progress', 'completed']),
            'priority'    => fake()->randomElement(['low', 'medium', 'high']),
            'deadline'    => fake()->optional(0.7)->dateTimeBetween('now', '+3 months'),
            'category_id' => Category::factory(),
        ];
    }

    /**
     * 🔴 Прострочена задача — дедлайн у минулому, статус pending.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'   => 'pending',
            'deadline' => fake()->dateTimeBetween('-2 months', '-1 day'),
        ]);
    }

    /**
     * ✅ Завершена задача.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    /**
     * 🔥 Задача з високим пріоритетом — терміново!
     */
    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'   => 'pending',
            'priority' => 'high',
            'deadline' => fake()->dateTimeBetween('now', '+1 week'),
        ]);
    }

    /**
     * 🏷️ Після створення — прикріпити випадкові теги (many-to-many).
     */
    public function withTags(int $count = 3): static
    {
        return $this->afterCreating(function (Task $task) use ($count) {
            $tags = \\App\\Models\\Tag::inRandomOrder()->limit($count)->get();

            if ($tags->count() < $count) {
                $newTags = \\App\\Models\\Tag::factory()
                    ->count($count - $tags->count())
                    ->create();
                $tags = $tags->merge($newTags);
            }

            $task->tags()->attach($tags);
        });
    }
}`

// === TaskSeeder with recycle/has ===
const taskSeederCode = `<?php

namespace Database\\Seeders;

use App\\Models\\Category;
use App\\Models\\Task;
use Illuminate\\Database\\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // Отримуємо категорії, створені CategorySeeder
        $categories = Category::all();

        // 15 звичайних задач — кожна отримає випадкову з існуючих категорій
        Task::factory()
            ->count(15)
            ->recycle($categories)    // 🔄 повторно використовуємо категорії
            ->withTags(2)
            ->create();

        // 5 прострочених задач
        Task::factory()
            ->count(5)
            ->overdue()               // 🔴 state: дедлайн у минулому
            ->recycle($categories)
            ->withTags(1)
            ->create();

        // 5 завершених задач
        Task::factory()
            ->count(5)
            ->completed()             // ✅ state: status = completed
            ->recycle($categories)
            ->create();

        // 3 задачі з високим пріоритетом
        Task::factory()
            ->count(3)
            ->highPriority()          // 🔥 state: priority = high
            ->recycle($categories)
            ->withTags(3)
            ->create();
    }
}`

// === Practice starter code ===
const practiceCode = `<?php
// Демонстрація: як працює фабрика та seeder

// create() — зберігає в базу, повертає модель з id
$task1 = Task::factory()->create();
echo "Створено: [{$task1->status}] {$task1->title}\\n";

// make() — тільки в пам'яті, id = null
$task2 = Task::factory()->make();
echo "В пам'яті: {$task2->title}, id = " . ($task2->id ?? 'null') . "\\n";

// count() — кілька записів
$tasks = Task::factory()->count(3)->create([
    'status' => 'pending',
]);
echo "Створено задач: " . $tasks->count() . "\\n";

// States — іменовані варіації
$overdue = Task::factory()->overdue()->create();
echo "Прострочена: дедлайн = {$overdue->deadline}\\n";

// Комбінація станів
$urgent = Task::factory()
    ->overdue()
    ->highPriority()
    ->create();
echo "Термінова+прострочена: {$urgent->priority} / {$urgent->status}\\n";`

// === Task: write CategoryFactory ===
const taskStarterCode = `<?php

namespace Database\\Factories;

use App\\Models\\Category;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

/**
 * @extends Factory<Category>
 *
 * Завдання: реалізуйте CategoryFactory.
 *
 * Вимоги:
 * 1. Поле 'name' — вибирається з реалістичного списку категорій
 *    (Work, Personal, Shopping, Health, Education тощо)
 *    Підказка: fake()->randomElement([...])
 *
 * 2. Поле 'color' — випадковий HEX-колір
 *    Підказка: fake()->hexColor()
 *
 * 3. Додайте state 'work' — завжди повертає name = 'Work' та color = '#3b82f6'
 *    Підказка: return $this->state(fn() => [...]);
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        // TODO: реалізуйте definition()
        // name — faker()->randomElement зі списку категорій
        // color — fake()->hexColor()
    }

    // TODO: реалізуйте state 'work'
    // public function work(): static { ... }
}

// === Перевірка після реалізації (в Tinker) ===
// Category::factory()->create();
// // => Category { name: "Personal", color: "#a3c1f2", ... }

// Category::factory()->work()->create();
// // => Category { name: "Work", color: "#3b82f6", ... }

// Category::factory()->count(5)->create();
// // => Collection of 5 categories`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard from="@faker-js/faker" to="fake() вбудований" />

      <TheoryBlock title="Проблема: порожня база даних">
        <p>
          Уявіть: ви запускаєте <code>migrate:fresh</code> — база порожня. Щоб перевірити список задач,
          потрібно вручну створити через curl або Postman кілька задач, категорій, користувачів.
          Це займає 5–10 хвилин. А потім знову скинули базу — і все спочатку.
        </p>
        <p>
          У фронтенд-розробці та сама проблема: коли MSW повертає порожній масив, тестувати нема що.
          Тому пишуть mock-дані вручну або використовують <code>@faker-js/faker</code>.
        </p>
        <p>
          Laravel вирішує це елегантно: <strong>Factories</strong> генерують реалістичні фейкові дані,
          а <strong>Seeders</strong> наповнюють базу цими даними однією командою.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsFakerCode"
        :php="phpFakerCode"
        js-title="@faker-js/faker (JavaScript)"
        php-title="fake() — вбудований Laravel"
      />

      <TheoryBlock title="Model Factories">
        <p>
          Factory — це клас, який описує, як створити фейковий екземпляр моделі.
          Кожен Factory має метод <code>definition()</code>, що повертає масив атрибутів з faker-значеннями.
        </p>
        <p>
          Щоб фабрика працювала, модель повинна використовувати трейт <code>HasFactory</code>.
          Laravel автоматично знаходить фабрику за конвенцією імен: модель <code>Task</code>
          шукає <code>TaskFactory</code> у <code>database/factories/</code>.
        </p>
        <p>
          <strong>States</strong> — іменовані варіації моделі. Наприклад, "прострочена задача",
          "завершена задача", "задача з високим пріоритетом". Стани можна ланцюжково комбінувати:
          <code>->overdue()->highPriority()</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="taskFactoryCode"
        language="php"
        title="database/factories/TaskFactory.php — фабрика зі станами"
      />

      <TheoryBlock title="Seeders та порядок запуску">
        <p>
          Seeder — клас, який наповнює базу тестовими даними через фабрики.
          <code>DatabaseSeeder</code> — точка входу, яка викликає інші seeders у правильному порядку.
        </p>
        <p>
          <strong>Порядок важливий:</strong> спочатку створюємо Users та Categories (бо Tasks залежать від них),
          потім Tasks. Це як <code>await</code>-ланцюжок у JavaScript — наступний крок залежить від попереднього.
        </p>
        <p>
          <code>recycle($categories)</code> каже фабриці повторно використовувати існуючі категорії
          замість створення нових для кожного запису. Без нього 15 задач створили б 15 різних категорій.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="taskSeederCode"
        language="php"
        title="database/seeders/TaskSeeder.php — seeder з recycle та states"
      />

      <TheoryBlock title="create() vs make() — коли що використовувати">
        <p>
          <code>create()</code> — виконує INSERT в базу, повертає модель з <code>id</code>.
          Використовуйте в seeders та feature-тестах, де потрібні реальні дані в базі.
        </p>
        <p>
          <code>make()</code> — створює об'єкт тільки в пам'яті, <code>id = null</code>.
          Використовуйте в unit-тестах, де реальна база не потрібна — швидше і чистіше.
        </p>
        <p>
          <code>afterCreating()</code> виконується після <code>create()</code>, коли модель вже має
          <code>id</code>. Це єдиний спосіб прикріпити many-to-many зв'язки — вони вимагають
          збереженого запису для роботи <code>attach()</code>.
        </p>
      </TheoryBlock>
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: фабрики та seeders в дії">
        <p>
          Запустіть код нижче та спостерігайте, як фабрики генерують дані.
          Спробуйте змінити параметри <code>count()</code>, додати інший стан або перезаписати атрибути.
        </p>
        <ul>
          <li>
            Команда запуску seeders: <code>php artisan migrate:fresh --seed</code>
          </li>
          <li>
            Перевірити в tinker: <code>Task::count()</code>, <code>Task::where('status', 'pending')->count()</code>
          </li>
          <li>
            Запустити конкретний seeder: <code>php artisan db:seed --class=TaskSeeder</code>
          </li>
        </ul>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/11-factories.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="2-11" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: CategoryFactory зі станом">
        <p>
          Реалізуйте <code>CategoryFactory</code> з реалістичними даними та factory state.
        </p>
        <ol>
          <li>
            <strong>definition()</strong> — поле <code>name</code> вибирається з реалістичного списку
            категорій через <code>fake()->randomElement([...])</code>, поле <code>color</code> — випадковий
            HEX-колір через <code>fake()->hexColor()</code>.
          </li>
          <li>
            <strong>state work()</strong> — повертає state з фіксованими значеннями:
            <code>name = 'Work'</code> та <code>color = '#3b82f6'</code>.
          </li>
          <li>
            <strong>Бонус:</strong> Додайте state <code>personal()</code> зі своїми фіксованими значеннями.
          </li>
        </ol>
        <p>
          Підказка: для state використовуйте
          <code>return $this->state(fn (array $attributes) => [...])</code>.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="database/factories/CategoryFactory.php"
      />
    </div>
  </div>
</template>

<style scoped>
.lesson-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
