# Eloquent ORM: шпаргалка

Eloquent -- це ORM (Object-Relational Mapping) Laravel. Замість того щоб писати SQL-запити вручну, ви працюєте з PHP-об'єктами. Для Vue-розробника це як працювати з реактивними даними в Pinia -- ви маніпулюєте об'єктами, а фреймворк сам вирішує, як зберегти зміни.

---

## Створення (Create)

> **Vue-паралель:** Як зробити POST-запит з форми або додати елемент до масиву в Pinia store.

```php
// create() -- створити і зберегти в БД одразу
// Як: await axios.post('/api/tasks', { title: 'New task', status: 'pending' })
$task = Task::create([
    'title' => 'New task',
    'status' => 'pending',
]);

// make() -- створити об'єкт, але НЕ зберігати в БД
// Як: const task = reactive({ title: 'Draft', status: 'pending' }) -- тільки в пам'яті
$task = Task::make([
    'title' => 'Draft',
    'status' => 'pending',
]);
$task->save(); // тепер зберегти

// save() -- зберегти нову або оновлену модель
// Як: натиснути "Зберегти" у формі
$task = new Task();
$task->title = 'Manual creation';
$task->status = 'pending';
$task->save();

// firstOrCreate() -- знайти або створити
// Як: перевірити чи є в масиві, якщо ні -- додати
$category = Category::firstOrCreate(
    ['slug' => 'work'],          // шукати за цими полями
    ['name' => 'Work Tasks']     // створити з цими, якщо не знайдено
);

// updateOrCreate() -- оновити існуючий або створити новий
// Як: upsert-логіка -- один метод замість if/else
$task = Task::updateOrCreate(
    ['external_id' => 'abc-123'],     // шукати за цим
    ['title' => 'Updated title', 'status' => 'active'] // оновити/створити з цим
);
```

> **Зверни увагу:** Для `create()` та `make()` потрібно вказати `$fillable` або `$guarded` в моделі -- це захист від масового присвоєння (mass assignment).

```php
// app/Models/Task.php
class Task extends Model
{
    protected $fillable = ['title', 'status', 'description', 'user_id'];
    // АБО
    protected $guarded = ['id']; // заборонити тільки id, решта дозволена
}
```

---

## Читання (Read)

> **Vue-паралель:** Як зробити GET-запит або відфільтрувати масив в computed/Pinia getter.

### Отримання записів

```php
// all() -- отримати всі записи
// Як: const tasks = await axios.get('/api/tasks') -- без фільтрів
$tasks = Task::all();

// find() -- знайти за ID
// Як: const task = tasks.find(t => t.id === 5)
$task = Task::find(5);
$tasks = Task::find([1, 2, 3]); // кілька ID

// findOrFail() -- знайти або кинути 404
// Як: find() + автоматичний if (!task) return router.push('/404')
$task = Task::findOrFail(5);

// first() -- отримати перший результат
// Як: const task = tasks[0]
$task = Task::where('status', 'active')->first();

// firstOrFail() -- перший або 404
$task = Task::where('slug', 'my-task')->firstOrFail();

// get() -- отримати колекцію результатів
// Як: const filteredTasks = tasks.filter(t => t.status === 'active')
$tasks = Task::where('status', 'active')->get();

// pluck() -- витягнути одне поле
// Як: tasks.map(t => t.title)
$titles = Task::pluck('title');
$titleById = Task::pluck('title', 'id'); // ['id' => 'title'] -- як Map

// count() -- порахувати кількість
// Як: tasks.length
$count = Task::where('status', 'active')->count();

// exists() / doesntExist()
$hasActive = Task::where('status', 'active')->exists(); // true/false
```

### Фільтрація (Query Helpers)

```php
// where() -- основна фільтрація
// Як: tasks.filter(t => t.status === 'active')
$tasks = Task::where('status', 'active')->get();
$tasks = Task::where('priority', '>', 3)->get();
$tasks = Task::where('title', 'like', '%search%')->get();

// orWhere()
// Як: tasks.filter(t => t.status === 'active' || t.priority > 3)
$tasks = Task::where('status', 'active')
    ->orWhere('priority', '>', 3)
    ->get();

// whereIn() -- перевірка входження в масив
// Як: tasks.filter(t => ['active', 'pending'].includes(t.status))
$tasks = Task::whereIn('status', ['active', 'pending'])->get();

// whereBetween()
// Як: tasks.filter(t => t.priority >= 1 && t.priority <= 5)
$tasks = Task::whereBetween('priority', [1, 5])->get();

// whereNull() / whereNotNull()
// Як: tasks.filter(t => t.completed_at === null)
$tasks = Task::whereNull('completed_at')->get();
$tasks = Task::whereNotNull('completed_at')->get();

// whereDate() / whereMonth() / whereYear()
$tasks = Task::whereDate('deadline', '2026-04-09')->get();
$tasks = Task::whereMonth('deadline', 4)->get();

// whereHas() -- фільтр по зв'язаній моделі
// Як: tasks.filter(t => t.comments.length > 0)
$tasks = Task::whereHas('comments')->get();
$tasks = Task::whereHas('comments', function ($query) {
    $query->where('is_approved', true);
})->get();

// when() -- умовна фільтрація (дуже зручно для API-фільтрів)
// Як: if (filters.status) query.where('status', filters.status)
$tasks = Task::query()
    ->when($request->status, fn($q, $status) => $q->where('status', $status))
    ->when($request->search, fn($q, $search) => $q->where('title', 'like', "%{$search}%"))
    ->get();
```

### Сортування та пагінація

```php
// orderBy()
// Як: tasks.sort((a, b) => b.created_at - a.created_at)
$tasks = Task::orderBy('created_at', 'desc')->get();

// latest() / oldest() -- скорочення для orderBy('created_at')
$tasks = Task::latest()->get();        // найновіші спочатку
$tasks = Task::oldest()->get();        // найстаріші спочатку
$tasks = Task::latest('deadline')->get(); // можна вказати інше поле

// limit() та offset()
// Як: tasks.slice(0, 10) або tasks.slice(20, 10)
$tasks = Task::limit(10)->get();
$tasks = Task::offset(20)->limit(10)->get();

// paginate() -- автоматична пагінація з метаданими
// Повертає: { data: [...], current_page, last_page, per_page, total }
// Фронтенд отримає готову структуру для пагінації
$tasks = Task::paginate(15);
$tasks = Task::paginate(15, ['*'], 'page', 2); // конкретна сторінка

// simplePaginate() -- легша пагінація (тільки "далі"/"назад", без total)
$tasks = Task::simplePaginate(15);

// cursorPaginate() -- для дуже великих наборів даних (нескінченний скрол)
$tasks = Task::cursorPaginate(15);
```

---

## Оновлення (Update)

> **Vue-паралель:** Як зробити PUT/PATCH запит або змінити значення в Pinia store.

```php
// update() -- масове оновлення через запит
// Як: await axios.patch('/api/tasks/5', { status: 'completed' })
Task::where('id', 5)->update(['status' => 'completed']);

// Масове оновлення кількох записів
Task::where('status', 'pending')
    ->where('deadline', '<', now())
    ->update(['status' => 'overdue']);

// save() -- оновити конкретну модель
// Як: task.status = 'completed'; await saveTask(task)
$task = Task::findOrFail(5);
$task->status = 'completed';
$task->save();

// increment() / decrement()
// Як: task.views++
Task::where('id', 5)->increment('views');
Task::where('id', 5)->increment('views', 5);    // +5
Task::where('id', 5)->decrement('priority');     // -1
Task::where('id', 5)->increment('views', 1, ['last_viewed_at' => now()]); // +1 та оновити інше поле
```

---

## Видалення (Delete)

> **Vue-паралель:** Як зробити DELETE запит або видалити елемент з масиву в Pinia store.

```php
// delete() -- видалити конкретний запис
// Як: tasks = tasks.filter(t => t.id !== 5)
$task = Task::findOrFail(5);
$task->delete();

// destroy() -- видалити за ID (без попереднього завантаження)
// Як: await axios.delete('/api/tasks/5')
Task::destroy(5);
Task::destroy([1, 2, 3]); // кілька одразу

// Масове видалення через запит
Task::where('status', 'archived')
    ->where('updated_at', '<', now()->subYear())
    ->delete();
```

### Soft Deletes (м'яке видалення)

> Як корзина -- запис позначається видаленим, але лишається в БД. Дуже корисно для "Скасувати видалення".

```php
// В моделі:
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes; // додає поле deleted_at
}

// В міграції:
$table->softDeletes(); // додає колонку deleted_at

// Використання:
$task->delete();          // м'яке видалення (встановлює deleted_at)
$task->trashed();         // true, якщо м'яко видалений
$task->restore();         // відновити (очистити deleted_at)
$task->forceDelete();     // видалити назавжди (фізично з БД)

// Запити:
Task::withTrashed()->get();   // всі, включно з видаленими
Task::onlyTrashed()->get();   // тільки видалені (як "Корзина")
```

---

## Scopes (області запитів)

> **Vue-паралель:** Як computed properties або методи-фільтри, які можна перевикористовувати.

### Local Scopes

```php
// В моделі Task:
class Task extends Model
{
    // Метод починається з scope, приймає $query
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }

    public function scopeOverdue(Builder $query): void
    {
        $query->where('deadline', '<', now())
              ->where('status', '!=', 'completed');
    }

    public function scopeForUser(Builder $query, int $userId): void
    {
        $query->where('user_id', $userId);
    }
}

// Використання -- виклик без "scope" і з маленької літери:
$tasks = Task::active()->get();
$tasks = Task::active()->overdue()->get();     // можна комбінувати
$tasks = Task::active()->forUser(1)->latest()->paginate(15);
```

### Global Scopes

```php
// Автоматично застосовується до КОЖНОГО запиту моделі
// В моделі:
protected static function booted(): void
{
    static::addGlobalScope('active', function (Builder $builder) {
        $builder->where('is_active', true);
    });
}

// Тепер Task::all() завжди повертає тільки is_active = true
// Щоб обійти:
Task::withoutGlobalScope('active')->get();
```

---

## Зв'язки (Relationships)

> **Vue-паралель:** Як вкладені об'єкти з API. Замість `task.user_id` ви отримуєте `task.user` з повним об'єктом користувача. Eloquent робить це автоматично.

### Один до одного (hasOne / belongsTo)

```php
// User має один Profile
class User extends Model
{
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }
}

// Profile належить User
class Profile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// Використання:
$user->profile;          // об'єкт Profile
$user->profile->bio;     // поле
$profile->user;          // зворотний зв'язок
```

### Один до багатьох (hasMany / belongsTo)

```php
// User має багато Tasks
class User extends Model
{
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}

// Task належить User
class Task extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// Використання:
$user->tasks;            // колекція задач (як масив)
$user->tasks->count();   // кількість
$task->user;             // автор задачі
$task->user->name;       // ім'я автора
```

### Багато до багатьох (belongsToMany)

```php
// Task має багато Tags, Tag має багато Tasks
// Потрібна проміжна таблиця: tag_task (алфавітний порядок)
class Task extends Model
{
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }
}

class Tag extends Model
{
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class);
    }
}

// Використання:
$task->tags;                              // колекція тегів
$task->tags()->attach(1);                 // додати тег
$task->tags()->detach(1);                 // видалити тег
$task->tags()->sync([1, 2, 3]);          // встановити точний набір тегів
$task->tags()->toggle([1, 2]);           // додати/видалити (як toggle в UI)
```

### Has Many Through (через проміжну модель)

```php
// Отримати всі задачі проєкту через користувачів
// Project -> Users -> Tasks
class Project extends Model
{
    public function tasks(): HasManyThrough
    {
        return $this->hasManyThrough(Task::class, User::class);
    }
}

$project->tasks; // всі задачі всіх користувачів проєкту
```

---

## Eager Loading (жадібне завантаження)

> **Vue-паралель:** Як включити `?include=user,tags` в API-запит замість робити окремий запит для кожного зв'язку. Без eager loading Laravel зробить N+1 запитів до БД -- це як робити fetch в циклі.

```php
// ПРОБЛЕМА: N+1 запитів (1 запит на список + N запитів на кожного автора)
$tasks = Task::all();
foreach ($tasks as $task) {
    echo $task->user->name; // кожен раз -- окремий запит до БД!
}

// РІШЕННЯ: with() -- eager loading
// 2 запити замість N+1: один для tasks, один для users
$tasks = Task::with('user')->get();
foreach ($tasks as $task) {
    echo $task->user->name; // вже завантажено, без додаткових запитів
}

// Кілька зв'язків
$tasks = Task::with(['user', 'tags', 'category'])->get();

// Вкладені зв'язки
$tasks = Task::with('user.profile')->get();

// Eager loading з фільтром
$tasks = Task::with(['comments' => function ($query) {
    $query->where('is_approved', true)->latest();
}])->get();

// load() -- для вже завантаженої моделі (lazy eager loading)
$task = Task::findOrFail(5);
$task->load('user', 'tags');

// withCount() -- порахувати зв'язані записи без завантаження
// Додає атрибут comments_count
$tasks = Task::withCount('comments')->get();
echo $tasks[0]->comments_count; // число

// withCount з умовою
$tasks = Task::withCount(['comments', 'comments as approved_comments_count' => function ($query) {
    $query->where('is_approved', true);
}])->get();
```

---

## Casts (приведення типів)

> **Vue-паралель:** Як computed property, що автоматично перетворює дані при читанні/записі. Наприклад, рядок з БД автоматично стає Carbon-об'єктом (для роботи з датами) або масивом.

```php
class Task extends Model
{
    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',        // '1' з БД -> true в PHP
            'priority' => 'integer',            // '3' з БД -> 3 в PHP
            'settings' => 'array',              // JSON-рядок з БД -> PHP-масив
            'settings' => 'collection',         // JSON -> Laravel Collection
            'metadata' => 'object',             // JSON -> stdClass
            'deadline' => 'datetime',           // рядок -> Carbon (бібліотека для дат)
            'published_at' => 'date',           // тільки дата без часу
            'amount' => 'decimal:2',            // число з 2 знаками після коми
            'status' => TaskStatus::class,      // PHP enum
            'secret' => 'encrypted',            // автоматичне шифрування/дешифрування
            'options' => AsCollection::class,    // JSON як Collection
        ];
    }
}

// Тепер працює автоматично:
$task->is_completed;     // true (не '1')
$task->settings;         // ['key' => 'value'] (не JSON-рядок)
$task->deadline;         // Carbon-об'єкт з методами: $task->deadline->diffForHumans()
$task->deadline->isPast(); // true/false
$task->deadline->format('d.m.Y'); // '09.04.2026'
```

---

## Корисні методи колекцій

> Eloquent повертає `Collection` -- це як масив з вбудованими методами (дуже схоже на lodash або методи масивів JS).

```php
$tasks = Task::all();

// Ті самі методи, що й у JS-масивів:
$tasks->map(fn($t) => $t->title);              // .map()
$tasks->filter(fn($t) => $t->is_completed);    // .filter()
$tasks->first(fn($t) => $t->priority > 3);     // .find()
$tasks->contains(fn($t) => $t->is_urgent);     // .some()
$tasks->every(fn($t) => $t->is_completed);     // .every()
$tasks->reduce(fn($sum, $t) => $sum + $t->hours, 0); // .reduce()
$tasks->sortBy('priority');                      // .sort()
$tasks->sortByDesc('created_at');               // .sort() desc
$tasks->groupBy('status');                       // як lodash groupBy
$tasks->pluck('title');                          // .map(t => t.title)
$tasks->unique('status');                        // унікальні значення
$tasks->sum('hours');                            // .reduce() для суми
$tasks->avg('priority');                         // середнє значення
$tasks->count();                                 // .length
$tasks->isEmpty();                               // .length === 0
$tasks->isNotEmpty();                            // .length > 0
$tasks->toArray();                               // в звичайний масив
$tasks->toJson();                                // в JSON-рядок
```

---

## Швидкий довідник: типові задачі

```php
// Отримати всі активні задачі поточного юзера, з тегами, посортовані, з пагінацією
$tasks = Task::where('user_id', auth()->id())
    ->where('status', 'active')
    ->with(['tags', 'category'])
    ->withCount('comments')
    ->latest()
    ->paginate(15);

// Створити задачу для поточного юзера
$task = auth()->user()->tasks()->create([
    'title' => $request->title,
    'description' => $request->description,
    'status' => 'pending',
]);

// Оновити статус та зберегти
$task = Task::findOrFail($id);
$task->update(['status' => 'completed', 'completed_at' => now()]);

// Знайти або створити категорію
$category = Category::firstOrCreate(
    ['slug' => Str::slug($request->name)],
    ['name' => $request->name]
);

// Порахувати задачі по статусах
$stats = Task::where('user_id', auth()->id())
    ->selectRaw("status, count(*) as count")
    ->groupBy('status')
    ->pluck('count', 'status');
// ['active' => 10, 'completed' => 25, 'pending' => 3]
```
