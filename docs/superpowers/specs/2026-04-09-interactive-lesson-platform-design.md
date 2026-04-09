# Інтерактивна навчальна платформа: редактор коду, виконання, візуальні схеми

## Контекст

Поточна платформа (Vue 3 SPA) показує уроки з read-only прикладами коду, квізами та статичними діаграмами. Юзери не можуть писати код і бачити результат прямо в браузері — всю практику треба робити локально в терміналі. Це знижує залученість і ускладнює навчання.

**Мета:** зробити платформу по-справжньому інтерактивною — з редактором коду, виконанням PHP/JS, візуальними анімованими схемами та покроковою візуалізацією виконання коду.

**Скоуп:** прототип на Lesson 01 (PHP синтаксис для JS-розробників). Після обкатки — масштабування на інші уроки.

## Стек

- **Редактор:** `monaco-editor` (npm пакет, інтеграція через Vite worker plugin)
- **Виконання PHP/JS:** Judge0 CE API (hosted: `https://judge0-ce.p.rapidapi.com`, безкоштовний tier — 50 запитів/день)
- **Діаграми:** Mermaid.js для flowchart, ER, sequence, class діаграм
- **Анімації:** CSS transitions + Vue transition API для покрокової анімації схем
- **Існуючий стек:** Vue 3, TypeScript, Vite, Pinia, Shiki

## Нові компоненти

### 1. `CodePlayground.vue`

Замінює read-only `CodeBlock` у Practice/Tasks табах.

**Layout:**
- Зліва (або зверху на мобільних): Monaco Editor з початковим кодом
- Справа (або знизу): панель результату — stdout, stderr, час виконання
- Toolbar: кнопки "Запустити" (▶), "Скинути" (↻), селектор мови

**Props:**
```typescript
interface CodePlaygroundProps {
  initialCode: string        // Стартовий код
  language: 'php' | 'javascript' | 'bash'
  expectedOutput?: string    // Очікуваний вивід для порівняння
  testCode?: string          // Код тестів що запускається після коду юзера
  title?: string
  readOnly?: boolean         // Для демо-прикладів
}
```

**Поведінка:**
- Натискання "Запустити" → відправляє код на Judge0 → показує результат
- Якщо є `expectedOutput` — порівнює з реальним виводом (зелений ✓ / червоний ✗)
- Якщо є `testCode` — додає його після коду юзера і запускає разом
- "Скинути" повертає `initialCode`
- Loading стан з спінером під час виконання
- Помилки компіляції/рантайму показуються червоним у панелі результату

### 2. `InteractiveDiagram.vue`

Обгортка над Mermaid.js з покроковою анімацією.

**Props:**
```typescript
interface InteractiveDiagramProps {
  definition: string          // Mermaid definition (тип визначається автоматично)
  steps?: DiagramStep[]       // Покрокові пояснення
  title?: string
}

interface DiagramStep {
  highlightNodes: string[]    // ID нод для підсвітки
  description: string         // Пояснення українською
  code?: string               // Пов'язаний код (опціонально)
}
```

**Поведінка:**
- Рендерить Mermaid-діаграму в SVG
- Якщо є `steps` — кнопки "Далі"/"Назад" під діаграмою
- Поточний крок: підсвічені ноди (яскравий колір), інші — приглушені
- Збоку або знизу — текст пояснення для поточного кроку
- Можливість відкрити на весь екран (fullscreen toggle)

### 3. `CodeFlowVisualizer.vue`

Покрокова візуалізація виконання коду.

**Props:**
```typescript
interface CodeFlowVisualizerProps {
  code: string
  language: 'php' | 'javascript'
  steps: CodeFlowStep[]
  title?: string
}

interface CodeFlowStep {
  line: number                // Номер підсвіченого рядка
  variables: Record<string, string>  // Стан змінних
  output?: string             // Що вивелось на цьому кроці
  note?: string               // Пояснення
}
```

**Поведінка:**
- Зліва: код з підсвіткою (Shiki, вже в проєкті), поточний рядок виділено
- Справа: таблиця змінних (назва → значення), оновлюється на кожному кроці
- Внизу: accumulated output (що вже вивелось)
- Кнопки: "Крок вперед" (→), "Крок назад" (←), "Автоплей" (▶), "Скинути"
- Автоплей: автоматично переходить до наступного кроку кожні 1.5с

### 4. `Judge0Service.ts`

Сервіс для взаємодії з Judge0 API.

```typescript
interface Judge0Service {
  execute(code: string, language: 'php' | 'javascript' | 'bash'): Promise<ExecutionResult>
}

interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  time: string        // Час виконання
  memory: number      // Пам'ять (KB)
  status: 'success' | 'error' | 'timeout' | 'compilation_error'
}
```

**Поведінка:**
- Submit код → poll результат (Judge0 async workflow)
- Кешування: однаковий код не відправляється двічі (Map у пам'яті)
- Таймаут: 5 секунд на виконання
- Rate limiting: максимум 10 запитів на хвилину на клієнті
- Fallback: якщо Judge0 недоступний — повідомлення "Сервіс тимчасово недоступний"
- API ключ зберігається в `.env` (`VITE_JUDGE0_API_KEY`)

## Зміни в Lesson 01

### Theory таб

Додається:
1. **InteractiveDiagram** — "Як PHP виконує код":
   ```
   .php файл → PHP інтерпретатор → Парсинг → Виконання → stdout
   ```
   vs JS: `.js → V8 → Парсинг → JIT-компіляція → Виконання → console.log`
   4 кроки з поясненнями

2. **InteractiveDiagram** — "Типи даних: PHP vs JS" (classDiagram):
   Порівняння типів зі стрілками-аналогами

3. **InteractiveDiagram** — "Масив vs Об'єкт" (flowchart):
   PHP array = і масив, і асоціативний масив

4. **CodeFlowVisualizer** — foreach цикл:
   ```php
   $items = ['task1', 'task2', 'task3'];
   foreach ($items as $index => $item) {
       echo "$index: $item\n";
   }
   ```
   6 кроків: ініціалізація масиву → 3 ітерації (підсвітка рядка + змінні)

### Practice таб

Замінюється:
- Read-only `CodeBlock` зі стартер-кодом → `CodePlayground` з тим самим кодом
- `TerminalOutput` з очікуваним виводом → `expectedOutput` prop у CodePlayground
- Юзер може редагувати код, запустити, побачити реальний вивід, порівняти з очікуваним

### Tasks таб

Замінюється:
- Текстовий опис завдання залишається
- Read-only `CodeBlock` із заглушками → `CodePlayground` з `testCode`
- Юзер пише реалізацію → натискає "Запустити" → тести перевіряють результат

### Quiz таб

Без змін.

## Файли для створення/зміни

### Нові файли:
- `app/src/components/interactive/CodePlayground.vue`
- `app/src/components/interactive/InteractiveDiagram.vue`
- `app/src/components/interactive/CodeFlowVisualizer.vue`
- `app/src/services/judge0.ts`

### Змінювані файли:
- `app/src/lessons/week1/Lesson01.vue` — інтеграція нових компонентів
- `app/package.json` — додати `monaco-editor`, `mermaid`, `vite-plugin-monaco-editor`
- `app/.env.example` (створити) — `VITE_JUDGE0_API_KEY=`

## Верифікація

1. **CodePlayground:** Написати PHP-код → натиснути "Запустити" → побачити stdout у панелі результату
2. **InteractiveDiagram:** Відкрити Lesson 01 Theory → побачити діаграму → натиснути "Далі" → побачити покрокову анімацію з поясненнями
3. **CodeFlowVisualizer:** Натиснути "Крок вперед" → побачити підсвічений рядок + оновлені змінні
4. **Tasks валідація:** Написати правильну реалізацію функції → побачити зелений ✓, написати неправильну → побачити червоний ✗
5. **Мобільна адаптація:** Перевірити що CodePlayground та діаграми виглядають нормально на вузькому екрані
6. **Fallback:** Вимкнути інтернет → побачити повідомлення "Сервіс тимчасово недоступний"
