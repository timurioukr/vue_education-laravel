# Урок 16: Завантаження файлів та Storage

## Що ви вивчите

- Як працює файлова система Laravel: фасад `Storage`, диски (local, public, s3)
- Конфігурація дисків у `config/filesystems.php`
- Публічний диск та `php artisan storage:link` (симлінк `storage/app/public` -> `public/storage`)
- Завантаження файлів через API: `$request->file()`, збереження, отримання метаданих
- Валідація файлів: `'file'`, `'image'`, `'mimes:jpg,png,pdf'`, `'max:10240'`
- Генерація URL: `Storage::disk('public')->url($path)`
- Видалення файлів: `Storage::disk('public')->delete($path)`
- Повна реалізація вкладень до задач (task attachments)
- API ендпоінти: завантаження, скачування, видалення файлів

---

## Паралелі з JS/Vue

| Vue / Nuxt / JS | Laravel |
|---|---|
| `new FormData()` + `$fetch('/api/upload', { body: formData })` | `$request->file('attachment')` |
| `accept="image/*"` на `<input type="file">` | `'mimes:jpg,png,gif'` валідація на сервері |
| Nuxt `runtimeConfig` для різних середовищ | `config/filesystems.php` -- диск local для dev, s3 для production |
| `<img :src="imageUrl">` -- URL зображення | `Storage::disk('public')->url($path)` -- генерує цей URL |
| Vite `public/` директорія (статичні файли) | `php artisan storage:link` -- симлінк для доступу до завантажених файлів |
| `URL.createObjectURL(file)` -- превью до завантаження | Серверна валідація + збереження на диск |
| `file.name`, `file.size`, `file.type` | `$file->getClientOriginalName()`, `$file->getSize()`, `$file->getMimeType()` |
| Axios `onUploadProgress` для прогрес-бару | Laravel приймає файл цілком, прогрес -- це фронтенд |

---

## Теорія

### Файлова система Laravel

У Vue/Nuxt ви працюєте з файлами на клієнті: `<input type="file">`, `FileReader`, `FormData`. Але що відбувається, коли файл прилітає на сервер? Саме тут вступає Laravel Storage.

Laravel абстрагує роботу з файловою системою через **фасад `Storage`**. Незалежно від того, де зберігаються файли -- на локальному диску, у хмарному S3 чи на іншому сервері -- API залишається однаковим.

```php
use Illuminate\Support\Facades\Storage;

// Записати файл
Storage::disk('public')->put('avatars/user1.jpg', $fileContents);

// Прочитати файл
$contents = Storage::disk('public')->get('avatars/user1.jpg');

// Перевірити існування
Storage::disk('public')->exists('avatars/user1.jpg'); // true/false

// Видалити
Storage::disk('public')->delete('avatars/user1.jpg');

// Отримати URL
Storage::disk('public')->url('avatars/user1.jpg');
// -> /storage/avatars/user1.jpg
```

Це як різні "адаптери" для зберігання -- принцип той самий, що й у Nuxt, де `runtimeConfig` дозволяє використовувати різні URL залежно від середовища.

### Диски (Disks)

Конфігурація живе у `config/filesystems.php`. Кожен "диск" -- це налаштування для конкретного місця зберігання:

```php
// config/filesystems.php (скорочено)
'disks' => [
    'local' => [
        'driver' => 'local',
        'root' => storage_path('app/private'),
        // Файли доступні ТІЛЬКИ через додаток, не через URL
    ],

    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL') . '/storage',
        'visibility' => 'public',
        // Файли доступні через URL /storage/...
    ],

    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
        // Файли зберігаються в Amazon S3
    ],
],
```

**Для нашого Task Manager API** ми будемо використовувати диск `public` -- файли зберігаються локально і доступні через URL.

Аналогія з фронтендом: це як мати різні конфіги для `dev` та `production`. Локально файли лежать на диску, у продакшені -- в S3. Код залишається однаковим.

### php artisan storage:link

Диск `public` зберігає файли у `storage/app/public/`, але веб-сервер обслуговує файли з `public/`. Команда `storage:link` створює символічне посилання:

```
public/storage -> storage/app/public
```

Це як Vite, який створює символічне посилання до `public/` директорії. Після цього файл `storage/app/public/avatars/user1.jpg` стає доступним за URL `http://localhost:8000/storage/avatars/user1.jpg`.

```bash
php artisan storage:link
```

### Завантаження файлів через API

На фронтенді ви робите:

```javascript
// Vue -- відправка файлу
const formData = new FormData()
formData.append('attachment', fileInput.files[0])

await $fetch('/api/tasks/1/attachments', {
    method: 'POST',
    body: formData,
    // Не встановлюйте Content-Type вручну!
    // Браузер сам додасть multipart/form-data з boundary
})
```

На бекенді Laravel автоматично парсить `multipart/form-data` і надає зручний API:

```php
public function store(Request $request)
{
    // Отримати файл з запиту
    $file = $request->file('attachment');

    // Метаінформація (як file.name, file.size, file.type у JS)
    $file->getClientOriginalName();    // 'report.pdf'
    $file->getClientOriginalExtension(); // 'pdf'
    $file->getMimeType();               // 'application/pdf'
    $file->getSize();                   // 204800 (в байтах)

    // Зберегти файл на диск
    // store() генерує унікальне ім'я автоматично
    $path = $file->store('attachments', 'public');
    // -> 'attachments/a1b2c3d4e5f6.pdf'

    // Або зберегти з конкретним ім'ям
    $path = $file->storeAs('attachments', 'custom-name.pdf', 'public');
    // -> 'attachments/custom-name.pdf'

    return response()->json([
        'path' => $path,
        'url' => Storage::disk('public')->url($path),
    ], 201);
}
```

**Важливо:** метод `store()` автоматично генерує унікальне ім'я файлу (UUID), щоб уникнути конфліктів. Це як `crypto.randomUUID()` у JavaScript. Оригінальне ім'я файлу зберігаємо окремо в базі даних.

### Валідація файлів

На фронтенді ви обмежуєте файли через атрибут `accept`:

```html
<input type="file" accept=".jpg,.png,.pdf" />
```

Але це лише підказка для браузера -- користувач може обійти це обмеження. Серверна валідація -- обов'язкова:

```php
$request->validate([
    // Базова перевірка -- це файл
    'attachment' => 'required|file',

    // Тільки зображення (jpg, jpeg, png, bmp, gif, svg, webp)
    'avatar' => 'required|image|max:2048', // max 2MB (в кілобайтах!)

    // Конкретні MIME-типи
    'document' => 'required|file|mimes:pdf,doc,docx|max:10240', // max 10MB

    // Розміри зображення
    'photo' => 'required|image|dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',

    // Множинне завантаження
    'photos.*' => 'image|max:5120', // кожен файл max 5MB
    'photos' => 'required|array|max:5', // максимум 5 файлів
]);
```

**Увага:** `max` для файлів вказується в **кілобайтах**, не в мегабайтах! `max:2048` = 2MB, `max:10240` = 10MB.

### Генерація URL та видалення файлів

```php
use Illuminate\Support\Facades\Storage;

// Отримати публічний URL
$url = Storage::disk('public')->url('attachments/a1b2c3d4e5f6.pdf');
// -> http://localhost:8000/storage/attachments/a1b2c3d4e5f6.pdf

// Видалити файл
Storage::disk('public')->delete('attachments/a1b2c3d4e5f6.pdf');

// Видалити декілька файлів
Storage::disk('public')->delete([
    'attachments/file1.pdf',
    'attachments/file2.pdf',
]);

// Перевірити існування перед видаленням
if (Storage::disk('public')->exists($path)) {
    Storage::disk('public')->delete($path);
}
```

### Скачування файлів

Для приватних файлів (або контрольованого доступу) замість прямого URL використовуйте endpoint скачування:

```php
public function download(Task $task, TaskAttachment $attachment)
{
    return Storage::disk('public')->download(
        $attachment->path,
        $attachment->original_name // ім'я, яке побачить користувач
    );
}
```

Це як у Vue, коли ви створюєте `<a :href="url" download>` -- але сервер контролює доступ і може перевірити авторизацію перед видачею файлу.

---

## Практика: крок за кроком

> **Передумова:** ви маєте працюючий Task Manager API з авторизацією (Sanctum), політиками та middleware з попередніх уроків.

### Крок 1: Створіть символічне посилання для Storage

```bash
cd ~/task-manager-api
php artisan storage:link
```

Очікуваний результат:

```
The [public/storage] link has been connected to [storage/app/public].
The links have been created.
```

Тепер файли з `storage/app/public/` доступні через `http://localhost:8000/storage/`.

### Крок 2: Створіть міграцію для вкладень задач

```bash
php artisan make:migration create_task_attachments_table
```

Відкрийте створений файл міграції та заповніть:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->string('filename');       // унікальне ім'я файлу на диску (UUID)
            $table->string('original_name');  // оригінальне ім'я файлу від користувача
            $table->string('path');           // повний шлях на диску: 'attachments/abc123.pdf'
            $table->string('mime_type');      // 'application/pdf', 'image/jpeg'
            $table->unsignedBigInteger('size'); // розмір в байтах
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_attachments');
    }
};
```

Запустіть міграцію:

```bash
php artisan migrate
```

### Крок 3: Створіть модель TaskAttachment

```bash
php artisan make:model TaskAttachment
```

Відкрийте `app/Models/TaskAttachment.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TaskAttachment extends Model
{
    protected $fillable = [
        'task_id',
        'filename',
        'original_name',
        'path',
        'mime_type',
        'size',
    ];

    /**
     * Задача, до якої належить вкладення
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Публічний URL файлу
     */
    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }

    /**
     * Людино-читабельний розмір файлу
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;

        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        }

        if ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' B';
    }

    /**
     * Чи є файл зображенням
     */
    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }
}
```

### Крок 4: Додайте зв'язок у модель Task

Відкрийте `app/Models/Task.php` і додайте зв'язок з вкладеннями:

```php
use Illuminate\Database\Eloquent\Relations\HasMany;

// Додайте цей метод у клас Task
public function attachments(): HasMany
{
    return $this->hasMany(TaskAttachment::class);
}
```

### Крок 5: Створіть TaskAttachmentController

```bash
php artisan make:controller TaskAttachmentController
```

Відкрийте `app/Http/Controllers/TaskAttachmentController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskAttachmentController extends Controller
{
    /**
     * GET /api/tasks/{task}/attachments
     * Список вкладень задачі
     */
    public function index(Task $task): JsonResponse
    {
        // Перевіряємо, що задача належить поточному користувачу
        $this->authorize('view', $task);

        $attachments = $task->attachments()->latest()->get()->map(function (TaskAttachment $attachment) {
            return [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'human_size' => $attachment->human_size,
                'is_image' => $attachment->is_image,
                'url' => $attachment->url,
                'created_at' => $attachment->created_at->toISOString(),
            ];
        });

        return response()->json(['data' => $attachments]);
    }

    /**
     * POST /api/tasks/{task}/attachments
     * Завантажити файл до задачі
     */
    public function store(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $request->validate([
            'attachment' => [
                'required',
                'file',
                'max:10240', // 10MB максимум
                'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip',
            ],
        ]);

        $file = $request->file('attachment');

        // Зберігаємо файл у storage/app/public/attachments/
        // store() автоматично генерує унікальне ім'я
        $path = $file->store('attachments', 'public');

        // Створюємо запис у базі даних
        $attachment = $task->attachments()->create([
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'data' => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'human_size' => $attachment->human_size,
                'is_image' => $attachment->is_image,
                'url' => $attachment->url,
                'created_at' => $attachment->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * GET /api/tasks/{task}/attachments/{attachment}
     * Скачати файл
     */
    public function show(Task $task, TaskAttachment $attachment): StreamedResponse
    {
        $this->authorize('view', $task);

        // Перевіряємо, що вкладення належить саме цій задачі
        if ($attachment->task_id !== $task->id) {
            abort(404);
        }

        // Перевіряємо, що файл існує на диску
        if (!Storage::disk('public')->exists($attachment->path)) {
            abort(404, 'File not found on disk.');
        }

        // Повертаємо файл для скачування з оригінальним ім'ям
        return Storage::disk('public')->download(
            $attachment->path,
            $attachment->original_name
        );
    }

    /**
     * DELETE /api/tasks/{task}/attachments/{attachment}
     * Видалити вкладення
     */
    public function destroy(Task $task, TaskAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $task);

        // Перевіряємо, що вкладення належить саме цій задачі
        if ($attachment->task_id !== $task->id) {
            abort(404);
        }

        // Видаляємо файл з диску
        Storage::disk('public')->delete($attachment->path);

        // Видаляємо запис з бази даних
        $attachment->delete();

        return response()->json(null, 204);
    }
}
```

### Крок 6: Додайте маршрути

Відкрийте `routes/api.php` і додайте маршрути для вкладень:

```php
use App\Http\Controllers\TaskAttachmentController;

// Вкладення задач (всередині middleware групи auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // ... існуючі маршрути ...

    // Вкладення задач
    Route::get('/tasks/{task}/attachments', [TaskAttachmentController::class, 'index']);
    Route::post('/tasks/{task}/attachments', [TaskAttachmentController::class, 'store']);
    Route::get('/tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'show']);
    Route::delete('/tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'destroy']);
});
```

### Крок 7: Включіть вкладення у TaskResource

Якщо у вас є `TaskResource` (з попередніх уроків), додайте вкладення:

```php
// app/Http/Resources/TaskResource.php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'description' => $this->description,
        'status' => $this->status,
        'priority' => $this->priority,
        'due_date' => $this->due_date?->toISOString(),
        'created_at' => $this->created_at->toISOString(),
        'updated_at' => $this->updated_at->toISOString(),

        // Вкладення -- завантажуються тільки якщо вони були eager-loaded
        'attachments' => $this->whenLoaded('attachments', function () {
            return $this->attachments->map(function (TaskAttachment $attachment) {
                return [
                    'id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                    'mime_type' => $attachment->mime_type,
                    'size' => $attachment->size,
                    'human_size' => $attachment->human_size,
                    'is_image' => $attachment->is_image,
                    'url' => $attachment->url,
                ];
            });
        }),
    ];
}
```

Не забудьте додати import:

```php
use App\Models\TaskAttachment;
```

І в контролері при отриманні задач підвантажуйте вкладення:

```php
// У TaskController::show()
public function show(Task $task): TaskResource
{
    return new TaskResource($task->load('attachments'));
}

// У TaskController::index() -- якщо потрібні вкладення у списку
public function index(Request $request)
{
    $tasks = $request->user()
        ->tasks()
        ->with('attachments') // eager loading
        ->latest()
        ->paginate();

    return TaskResource::collection($tasks);
}
```

### Крок 8: Тестування через curl

Запустіть сервер і протестуйте:

```bash
php artisan serve
```

Спочатку отримайте токен авторизації:

```bash
# Логін (якщо ще не маєте токен)
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' \
  | php -r 'echo json_decode(file_get_contents("php://stdin"))->token;')

echo $TOKEN
```

Завантаження файлу:

```bash
# Створіть тестовий файл
echo "This is a test document for Task Manager" > /tmp/test-document.txt

# Завантажте файл до задачі (замініть {task_id} на реальний ID)
curl -X POST http://localhost:8000/api/tasks/1/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "attachment=@/tmp/test-document.txt"

# Очікуваний результат:
# {
#   "data": {
#     "id": 1,
#     "original_name": "test-document.txt",
#     "mime_type": "text/plain",
#     "size": 42,
#     "human_size": "42 B",
#     "is_image": false,
#     "url": "http://localhost:8000/storage/attachments/abc123def456.txt",
#     "created_at": "2026-04-09T..."
#   }
# }
```

Список вкладень задачі:

```bash
curl http://localhost:8000/api/tasks/1/attachments \
  -H "Authorization: Bearer $TOKEN"

# Очікуваний результат:
# {
#   "data": [
#     {
#       "id": 1,
#       "original_name": "test-document.txt",
#       ...
#     }
#   ]
# }
```

Скачування файлу:

```bash
curl -O -J http://localhost:8000/api/tasks/1/attachments/1 \
  -H "Authorization: Bearer $TOKEN"

# -O -- зберегти файл локально
# -J -- використати ім'я файлу з відповіді сервера
```

Видалення вкладення:

```bash
curl -X DELETE http://localhost:8000/api/tasks/1/attachments/1 \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# HTTP Status: 204
```

Тест валідації (файл занадто великий або неправильного типу):

```bash
# Спробуйте завантажити файл з непідтримуваним розширенням
echo "fake executable" > /tmp/test.exe

curl -X POST http://localhost:8000/api/tasks/1/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "attachment=@/tmp/test.exe"

# Очікуваний результат:
# {
#   "message": "The attachment field must be a file of type: jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt, zip.",
#   "errors": {
#     "attachment": ["The attachment field must be a file of type: ..."]
#   }
# }
```

---

## Перевірка

Після виконання всіх кроків ви повинні бачити:

1. `php artisan route:list` показує 4 маршрути для вкладень (`GET`, `POST`, `GET/{attachment}`, `DELETE`)
2. `public/storage` -- символічне посилання існує (створене через `storage:link`)
3. `POST /api/tasks/{task}/attachments` з `FormData` файлом повертає JSON з метаданими файлу та статус 201
4. Файл фізично з'являється у `storage/app/public/attachments/`
5. `GET /api/tasks/{task}/attachments` повертає список вкладень з URL
6. `GET /api/tasks/{task}/attachments/{attachment}` скачує файл з оригінальним ім'ям
7. `DELETE` видаляє файл і з диску, і з бази даних, повертає 204
8. Невалідні файли (неправильний тип, занадто великі) відхиляються з помилкою 422

---

## Міні-тест

**1. Яка команда створює символічне посилання для публічного диску Storage?**

a) `php artisan storage:create`
b) `php artisan storage:link`
c) `php artisan make:storage`
d) `php artisan link:storage`

**2. В яких одиницях вказується `max` при валідації файлів?**

a) Байти
b) Кілобайти
c) Мегабайти
d) Гігабайти

**3. Що робить метод `$file->store('attachments', 'public')`?**

a) Зберігає файл у `public/attachments/` з оригінальним ім'ям
b) Зберігає файл у `storage/app/public/attachments/` з унікальним ім'ям
c) Зберігає файл у `storage/app/private/attachments/`
d) Створює символічне посилання на файл

**4. Як правильно отримати оригінальне ім'я завантаженого файлу?**

a) `$request->file('attachment')->name`
b) `$request->file('attachment')->originalName`
c) `$request->file('attachment')->getClientOriginalName()`
d) `$request->input('attachment_name')`

**5. Що повертає `Storage::disk('public')->url($path)`?**

a) Абсолютний шлях на файловій системі сервера
b) Публічний URL, доступний через браузер
c) Base64-закодований вміст файлу
d) Масив метаданих файлу

---

## Практичне завдання

### Завдання: Аватар користувача

Реалізуйте завантаження аватара для профілю користувача:

1. **Створіть міграцію** для додавання колонки `avatar_path` до таблиці `users`:

```bash
php artisan make:migration add_avatar_path_to_users_table --table=users
```

```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('avatar_path')->nullable()->after('email');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('avatar_path');
    });
}
```

2. **Оновіть модель User** -- додайте `avatar_path` у `$fillable` та accessor для URL:

```php
public function getAvatarUrlAttribute(): ?string
{
    if (!$this->avatar_path) {
        return null;
    }

    return Storage::disk('public')->url($this->avatar_path);
}
```

3. **Створіть endpoint** `POST /api/profile/avatar`:

- Валідація: `'avatar' => 'required|image|max:2048'` (тільки зображення, максимум 2MB)
- Якщо у користувача вже є аватар -- видаліть старий файл з диску
- Збережіть новий файл у `avatars/` директорію
- Оновіть `avatar_path` у базі даних
- Поверніть URL нового аватара

4. **Створіть endpoint** `DELETE /api/profile/avatar`:

- Видаліть файл з диску
- Встановіть `avatar_path` в `null`

5. **Протестуйте**:

```bash
# Завантажити аватар (підготуйте будь-яке jpg зображення)
curl -X POST http://localhost:8000/api/profile/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@/path/to/photo.jpg"

# Перевірте, що URL працює у браузері

# Видалити аватар
curl -X DELETE http://localhost:8000/api/profile/avatar \
  -H "Authorization: Bearer $TOKEN"
```

---

## Відповіді на тест

1. **b) `php artisan storage:link`** -- ця команда створює символічне посилання `public/storage` -> `storage/app/public`, що дозволяє публічно доступати завантажені файли через URL.

2. **b) Кілобайти** -- правило `max:2048` означає 2048 КБ = 2 МБ. Це часта помилка -- розробники пишуть `max:2` думаючи, що це мегабайти, але насправді це лише 2 КБ.

3. **b) Зберігає файл у `storage/app/public/attachments/` з унікальним ім'ям** -- перший аргумент `'attachments'` -- це піддиректорія, другий `'public'` -- назва диску. Laravel автоматично генерує унікальне ім'я файлу (UUID).

4. **c) `$request->file('attachment')->getClientOriginalName()`** -- це метод об'єкта `UploadedFile`, який повертає оригінальне ім'я файлу, яке надав клієнт. Назва методу відповідає стилю Symfony (Laravel використовує Symfony HttpFoundation під капотом).

5. **b) Публічний URL, доступний через браузер** -- метод `url()` генерує публічний URL (наприклад, `http://localhost:8000/storage/attachments/file.pdf`), який можна використати в `<img :src="">` або `<a :href="">` на фронтенді.
