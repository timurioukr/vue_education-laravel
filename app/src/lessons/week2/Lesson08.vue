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
    question: 'Який HTTP-статус повертає Laravel при помилці валідації API-запиту?',
    options: [
      '400 Bad Request',
      '401 Unauthorized',
      '422 Unprocessable Entity',
      '500 Internal Server Error',
    ],
    correct: 2,
    explanation:
      'Laravel автоматично повертає 422 Unprocessable Entity при провалі валідації API-запиту. Відповідь містить JSON з полем errors, де описані всі помилки по кожному полю.',
  },
  {
    question: 'Що робить правило `sometimes` у Laravel-валідації?',
    options: [
      'Поле валідується випадковим чином',
      'Поле валідується тільки якщо воно присутнє в запиті',
      'Поле завжди обов\'язкове',
      'Поле ігнорується валідатором',
    ],
    correct: 1,
    explanation:
      'sometimes означає: "валідуй це поле тільки якщо воно є в запиті". Ідеально для PATCH-запитів — клієнт може надіслати лише змінені поля, і відсутні поля не спричинять помилку "required".',
  },
  {
    question: 'Що повертає метод `authorize()` у Form Request класі?',
    options: [
      'Масив правил валідації',
      'Список дозволених полів',
      'true або false — чи авторизований користувач для цього запиту',
      'HTTP-статус відповіді',
    ],
    correct: 2,
    explanation:
      'authorize() повертає bool: true — запит дозволено, false — Laravel автоматично поверне 403 Forbidden. Це аналог route guard у Vue Router — перевірка прав доступу до дії.',
  },
  {
    question: 'Яка різниця між `nullable` та `required` правилами?',
    options: [
      'Ніякої різниці — обидва є обов\'язковими',
      '`required` — поле обов\'язкове і не може бути null; `nullable` — поле може бути null або відсутнє',
      '`nullable` означає обов\'язкове поле з null-значенням',
      '`required` дозволяє null, `nullable` — ні',
    ],
    correct: 1,
    explanation:
      'required означає: поле обов\'язкове, не може бути null або порожнім рядком. nullable означає: поле може приймати null як валідне значення. Ці правила часто комбінують: nullable|string дозволяє або null, або рядок.',
  },
  {
    question: 'Що повертає `$request->validated()` порівняно з `$request->all()`?',
    options: [
      'Ніякої різниці — обидва повертають однакові дані',
      '`all()` повертає всі дані запиту, `validated()` — тільки поля, описані в rules()',
      '`validated()` повертає всі дані, `all()` — тільки валідовані',
      '`all()` працює тільки з GET-запитами',
    ],
    correct: 1,
    explanation:
      'validated() повертає тільки ті поля, що описані в rules() і пройшли валідацію. Це захист від mass assignment: навіть якщо зловмисник надішле "is_admin: true", це поле не потрапить в $validated, бо його немає в правилах.',
  },
]

// === ParallelCard ===
const parallelFrom = 'Zod-схема + VeeValidate'
const parallelTo = 'Form Request клас'

// === CodeComparison: JS Zod vs Laravel rules ===
const jsZodSchema = `// Zod-схема для форми задачі
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(5000).nullable(),
  status: z.enum(['pending', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.string().date().nullable(),
  category_id: z.number().int().nullable(),
})

// Валідація
const result = taskSchema.safeParse(formData)
if (!result.success) {
  console.log(result.error.flatten())
}`

const phpLaravelRules = `<?php
// Ті самі правила — у Form Request

class StoreTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'       => ['required', 'string',
                               'min:3', 'max:255'],
            'description' => ['nullable', 'string',
                               'max:5000'],
            'status'      => ['required',
                               'in:pending,in_progress,done'],
            'priority'    => ['required',
                               'in:low,medium,high'],
            'deadline'    => ['nullable', 'date',
                               'after_or_equal:today'],
            'category_id' => ['nullable', 'integer',
                               'exists:categories,id'],
        ];
    }
}`

// === CodeBlock: StoreTaskRequest ===
const storeTaskRequestCode = `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

class StoreTaskRequest extends FormRequest
{
    /**
     * Чи авторизований користувач для цього запиту.
     */
    public function authorize(): bool
    {
        return true; // Дозволяємо всім (авторизацію додамо пізніше)
    }

    /**
     * Правила валідації.
     */
    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'min:3', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status'      => ['required', 'in:pending,in_progress,done'],
            'priority'    => ['required', 'in:low,medium,high'],
            'deadline'    => ['nullable', 'date', 'after_or_equal:today'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'tag_ids'     => ['nullable', 'array'],
            'tag_ids.*'   => ['integer', 'exists:tags,id'],
        ];
    }

    /**
     * Кастомні повідомлення про помилки.
     */
    public function messages(): array
    {
        return [
            'title.required'          => 'Назва задачі обов\\'язкова.',
            'title.min'               => 'Назва задачі мінімум :min символи.',
            'title.max'               => 'Назва задачі максимум :max символів.',
            'status.in'               => 'Статус: pending, in_progress або done.',
            'priority.in'             => 'Пріоритет: low, medium або high.',
            'deadline.after_or_equal' => 'Дедлайн не може бути в минулому.',
            'category_id.exists'      => 'Обрана категорія не існує.',
            'tag_ids.*.exists'        => 'Один з тегів не існує.',
        ];
    }
}`

// === CodeComparison: Store vs Update rules (sometimes) ===
const storeRules = `// StoreTaskRequest — всі поля обов'язкові
public function rules(): array
{
    return [
        // required — без цього поля → 422
        'title'    => ['required', 'string',
                        'min:3', 'max:255'],
        'status'   => ['required',
                        'in:pending,in_progress,done'],
        'priority' => ['required',
                        'in:low,medium,high'],
    ];
}

// POST /api/tasks без title → 422:
// { "errors": { "title": ["Назва обов'язкова."] } }`

const updateRules = `// UpdateTaskRequest — sometimes для PATCH
public function rules(): array
{
    return [
        // sometimes — поле перевіряється ТІЛЬКИ
        // якщо воно присутнє в запиті
        'title'    => ['sometimes', 'required',
                        'string', 'min:3', 'max:255'],
        'status'   => ['sometimes', 'required',
                        'in:pending,in_progress,done'],
        'priority' => ['sometimes', 'required',
                        'in:low,medium,high'],
    ];
}

// PATCH /api/tasks/1 { "status": "done" } → 200 ✓
// title відсутній → не перевіряється`

// === 422 JSON format ===
const json422Response = `// Laravel автоматично повертає 422 при провалі валідації:
{
    "message": "Task title is required. (and 2 more errors)",
    "errors": {
        "title": [
            "Назва задачі обов'язкова."
        ],
        "status": [
            "Статус: pending, in_progress або done."
        ],
        "priority": [
            "Пріоритет: low, medium або high."
        ]
    }
}

// Vue — обробка на фронтенді:
try {
    await axios.post('/api/tasks', formData)
} catch (error) {
    if (error.response?.status === 422) {
        // errors — об'єкт { поле: [масив помилок] }
        formErrors.value = error.response.data.errors
    }
}`

// === Practice playground ===
const practiceCode = `<?php
// Запустіть цей код щоб побачити, як Laravel валідує дані
// (симуляція вхідного запиту)

$rules = [
    'title'    => 'required|string|min:3|max:255',
    'status'   => 'required|in:pending,in_progress,done',
    'priority' => 'required|in:low,medium,high',
    'deadline' => 'nullable|date',
];

// Тестові дані — спробуйте змінити!
$data = [
    'title'    => 'Buy groceries',
    'status'   => 'pending',
    'priority' => 'high',
    'deadline' => null,
];

// Симуляція валідації
$errors = [];

foreach ($rules as $field => $ruleString) {
    $fieldRules = explode('|', $ruleString);
    $value = $data[$field] ?? null;

    foreach ($fieldRules as $rule) {
        if ($rule === 'required' && empty($value) && $value !== '0') {
            $errors[$field][] = "Поле {$field} обов'язкове.";
        }
        if (str_starts_with($rule, 'min:')) {
            $min = (int) substr($rule, 4);
            if (is_string($value) && strlen($value) < $min) {
                $errors[$field][] = "Поле {$field} мінімум {$min} символів.";
            }
        }
        if (str_starts_with($rule, 'max:')) {
            $max = (int) substr($rule, 4);
            if (is_string($value) && strlen($value) > $max) {
                $errors[$field][] = "Поле {$field} максимум {$max} символів.";
            }
        }
        if (str_starts_with($rule, 'in:')) {
            $allowed = explode(',', substr($rule, 3));
            if ($value !== null && !in_array($value, $allowed)) {
                $errors[$field][] = "Поле {$field} має бути одним з: " . implode(', ', $allowed);
            }
        }
    }
}

if (empty($errors)) {
    echo "✅ Валідація пройшла успішно!\\n";
    echo "Дані прийнято:\\n";
    foreach ($data as $key => $value) {
        $display = $value ?? 'null';
        echo "  {$key}: {$display}\\n";
    }
} else {
    echo "❌ Помилки валідації (422):\\n";
    foreach ($errors as $field => $fieldErrors) {
        foreach ($fieldErrors as $error) {
            echo "  {$field}: {$error}\\n";
        }
    }
}`

// === Task: write UpdateTaskRequest ===
const taskStarterCode = `<?php
// Завдання: реалізуйте UpdateTaskRequest з правилом sometimes
// Це Form Request для PATCH /api/tasks/{id}

// Клас має:
// 1. authorize() → повертає true
// 2. rules() → всі поля з sometimes + правилами
// 3. messages() → кастомні повідомлення українською

// Симуляція UpdateTaskRequest
class UpdateTaskRequest
{
    // Поверніть масив правил
    // Кожне поле починається з 'sometimes'
    public function rules(): array
    {
        return [
            // Заповніть правила для:
            // title — sometimes, required, string, min:3, max:255
            // description — sometimes, nullable, string, max:5000
            // status — sometimes, required, in:pending,in_progress,done
            // priority — sometimes, required, in:low,medium,high
            // deadline — sometimes, nullable, date
            // Ваш код тут:
        ];
    }

    public function messages(): array
    {
        return [
            // Додайте кастомні повідомлення українською
            // Ваш код тут:
        ];
    }
}

// ===== Тест =====
$request = new UpdateTaskRequest();
$rules = $request->rules();
$messages = $request->messages();

$pass = 0;
$total = 5;

// Тест 1: title має sometimes
if (isset($rules['title']) && in_array('sometimes', (array)$rules['title'])) {
    echo "✓ title має sometimes\\n"; $pass++;
} else {
    echo "✗ title не має sometimes\\n";
}

// Тест 2: status має sometimes + in-правило
$statusRules = (array)($rules['status'] ?? []);
if (in_array('sometimes', $statusRules) && in_array('in:pending,in_progress,done', $statusRules)) {
    echo "✓ status: sometimes + in\\n"; $pass++;
} else {
    echo "✗ status: перевірте sometimes та in:pending,in_progress,done\\n";
}

// Тест 3: deadline є nullable
$deadlineRules = (array)($rules['deadline'] ?? []);
if (in_array('sometimes', $deadlineRules) && in_array('nullable', $deadlineRules)) {
    echo "✓ deadline: sometimes + nullable\\n"; $pass++;
} else {
    echo "✗ deadline: має бути sometimes та nullable\\n";
}

// Тест 4: messages не порожній
if (!empty($messages)) {
    echo "✓ messages() не порожній\\n"; $pass++;
} else {
    echo "✗ messages() порожній — додайте повідомлення\\n";
}

// Тест 5: description має nullable
$descRules = (array)($rules['description'] ?? []);
if (in_array('sometimes', $descRules) && in_array('nullable', $descRules)) {
    echo "✓ description: sometimes + nullable\\n"; $pass++;
} else {
    echo "✗ description: перевірте sometimes та nullable\\n";
}

echo "\\nРезультат: {$pass}/{$total}\\n";`
</script>

<template>
  <div class="lesson-content">
    <!-- ===== THEORY TAB ===== -->
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard :from="parallelFrom" :to="parallelTo" />

      <TheoryBlock title="Чому серверна валідація обов'язкова">
        <p>
          Ви звикли валідувати форми на клієнті — Zod, VeeValidate, HTML5 атрибути. Це покращує UX,
          але <strong>не захищає дані</strong>. Будь-хто може обійти фронтенд і надіслати запит напряму через
          <code>curl</code> або Postman.
        </p>
        <p>
          Золоте правило: <strong>ніколи не довіряй даним від клієнта</strong>. Фронтенд-валідація —
          це ввічливість, серверна — це безпека. Laravel Form Request — це ваш перший рубіж захисту на сервері.
        </p>
        <p>
          Form Request також розділяє обов'язки: контролер містить тільки бізнес-логіку, а весь код
          валідації живе в окремому класі — як Zod-схема у власному файлі замість того, щоб бути всередині компонента.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsZodSchema"
        :php="phpLaravelRules"
        js-title="JavaScript (Zod)"
        php-title="Laravel (Form Request)"
      />

      <TheoryBlock title="StoreTaskRequest — повний приклад">
        <p>
          Form Request — це PHP-клас з трьома методами:
        </p>
        <ul>
          <li>
            <code>authorize()</code> — повертає <code>true/false</code>, чи дозволено виконати запит
            (аналог route guard у Vue Router)
          </li>
          <li>
            <code>rules()</code> — масив правил валідації для кожного поля
          </li>
          <li>
            <code>messages()</code> — кастомні повідомлення про помилки
          </li>
        </ul>
        <p>
          Laravel автоматично запускає валідацію <strong>до входу в метод контролера</strong>,
          якщо type-hint на Form Request. Аналогія — TypeScript перевіряє типи до запуску коду.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="storeTaskRequestCode"
        lang="php"
        title="app/Http/Requests/StoreTaskRequest.php"
      />

      <TheoryBlock title="Каталог правил валідації">
        <p>Ось правила, які ви будете використовувати найчастіше:</p>
        <table class="rules-table">
          <thead>
            <tr>
              <th>Правило</th>
              <th>Опис</th>
              <th>Zod-аналог</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>required</code></td>
              <td>Поле обов'язкове, не може бути null</td>
              <td><code>z.string()</code></td>
            </tr>
            <tr>
              <td><code>nullable</code></td>
              <td>Може бути <code>null</code></td>
              <td><code>.nullable()</code></td>
            </tr>
            <tr>
              <td><code>sometimes</code></td>
              <td>Валідувати тільки якщо поле присутнє</td>
              <td><code>.optional()</code></td>
            </tr>
            <tr>
              <td><code>string</code></td>
              <td>Рядок</td>
              <td><code>z.string()</code></td>
            </tr>
            <tr>
              <td><code>integer</code></td>
              <td>Ціле число</td>
              <td><code>z.number().int()</code></td>
            </tr>
            <tr>
              <td><code>boolean</code></td>
              <td>true/false, 1/0, "1"/"0"</td>
              <td><code>z.boolean()</code></td>
            </tr>
            <tr>
              <td><code>array</code></td>
              <td>Масив</td>
              <td><code>z.array(...)</code></td>
            </tr>
            <tr>
              <td><code>date</code></td>
              <td>Валідна дата</td>
              <td><code>z.string().date()</code></td>
            </tr>
            <tr>
              <td><code>email</code></td>
              <td>Email-адреса</td>
              <td><code>z.string().email()</code></td>
            </tr>
            <tr>
              <td><code>min:N</code></td>
              <td>Мінімум N символів (рядки) або N (числа)</td>
              <td><code>.min(N)</code></td>
            </tr>
            <tr>
              <td><code>max:N</code></td>
              <td>Максимум N символів або N</td>
              <td><code>.max(N)</code></td>
            </tr>
            <tr>
              <td><code>in:a,b,c</code></td>
              <td>Одне з перелічених значень</td>
              <td><code>z.enum(['a','b','c'])</code></td>
            </tr>
            <tr>
              <td><code>exists:table,col</code></td>
              <td>Значення існує в таблиці БД</td>
              <td>— (тільки на сервері)</td>
            </tr>
            <tr>
              <td><code>unique:table,col</code></td>
              <td>Значення унікальне в таблиці БД</td>
              <td>— (тільки на сервері)</td>
            </tr>
            <tr>
              <td><code>after:today</code></td>
              <td>Дата після сьогодні</td>
              <td><code>.refine(d => d > new Date())</code></td>
            </tr>
          </tbody>
        </table>
      </TheoryBlock>

      <CodeComparison
        :js="storeRules"
        :php="updateRules"
        js-title="StoreTaskRequest (required)"
        php-title="UpdateTaskRequest (sometimes)"
      />

      <TheoryBlock title="Формат 422 JSON-відповіді">
        <p>
          Коли валідація провалюється, Laravel автоматично повертає HTTP <code>422 Unprocessable Entity</code>
          з JSON-об'єктом, де <code>errors</code> — це словник <code>{ поле: [масив помилок] }</code>.
        </p>
        <p>
          Щоб Laravel повертав JSON (а не HTML-редірект), запит повинен містити заголовок
          <code>Accept: application/json</code>. Для Vue/axios це зазвичай налаштовано глобально.
        </p>
        <p>
          Це <strong>стандартний формат</strong> — ваш фронтенд вже знає його.
          Помилки можна відразу прив'язати до полів форми без жодної додаткової обробки.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="json422Response"
        lang="javascript"
        title="422 JSON-відповідь + обробка у Vue"
      />
    </div>

    <!-- ===== PRACTICE TAB ===== -->
    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: симуляція валідації">
        <p>
          Нижче — PHP-скрипт, що симулює роботу <code>$request->validate()</code>.
          Запустіть його, спостерігайте результат, потім спробуйте:
        </p>
        <ol>
          <li>Очистити <code>title</code> — отримайте помилку "required"</li>
          <li>Поставити <code>title</code> = <code>'ab'</code> — помилка "min:3"</li>
          <li>Поставити <code>status</code> = <code>'INVALID'</code> — помилка "in:"</li>
          <li>Виправити всі помилки і побачити "✅ Валідація пройшла успішно!"</li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/08-validation.php"
      />
    </div>

    <!-- ===== QUIZ TAB ===== -->
    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="2-8" />
    </div>

    <!-- ===== TASK TAB ===== -->
    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте UpdateTaskRequest">
        <p>
          Напишіть Form Request для PATCH-запиту оновлення задачі.
          Ключова відмінність від <code>StoreTaskRequest</code> — правило <code>sometimes</code>:
          поле перевіряється тільки якщо воно є в запиті.
        </p>
        <ol>
          <li>
            Метод <code>authorize()</code> — повертає <code>true</code>
          </li>
          <li>
            Метод <code>rules()</code> — всі поля починаються з <code>'sometimes'</code>:
            <ul>
              <li><code>title</code> — sometimes, required, string, min:3, max:255</li>
              <li><code>description</code> — sometimes, nullable, string, max:5000</li>
              <li><code>status</code> — sometimes, required, in:pending,in_progress,done</li>
              <li><code>priority</code> — sometimes, required, in:low,medium,high</li>
              <li><code>deadline</code> — sometimes, nullable, date</li>
            </ul>
          </li>
          <li>
            Метод <code>messages()</code> — додайте хоча б 2-3 повідомлення українською
          </li>
        </ol>
        <p>
          Підказка: <code>sometimes</code> завжди першим у масиві правил.
          Якщо є <code>sometimes</code> + <code>required</code> — поле перевіряється тільки якщо присутнє,
          але якщо присутнє — не може бути порожнім.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте UpdateTaskRequest"
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

.rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  margin-top: 8px;
}

.rules-table th,
.rules-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid var(--color-border, #e2e8f0);
}

.rules-table th {
  background: var(--color-bg-soft, #f8fafc);
  font-weight: 600;
}

.rules-table td code {
  background: var(--color-bg-mute, #f1f5f9);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.8rem;
}

.rules-table tr:hover td {
  background: var(--color-bg-soft, #f8fafc);
}
</style>
