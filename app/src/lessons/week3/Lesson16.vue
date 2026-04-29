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
    question: 'Яка команда створює символічне посилання для публічного диску Storage?',
    options: [
      'php artisan storage:create',
      'php artisan storage:link',
      'php artisan make:storage',
      'php artisan link:storage',
    ],
    correct: 1,
    explanation:
      'php artisan storage:link створює симлінк public/storage → storage/app/public. Без нього файли, що збережені на диску public, НЕ будуть доступні через URL — браузер просто отримає 404. Команду потрібно виконати один раз після клонування проекту.',
  },
  {
    question: 'В яких одиницях вказується max при валідації файлів?',
    options: ['Байти', 'Кілобайти', 'Мегабайти', 'Гігабайти'],
    correct: 1,
    explanation:
      '⚠️ Класична пастка! max:2048 = 2048 КБ = 2 МБ, а НЕ 2 ГБ. Якщо написати max:2 — це лише 2 КБ, і всі файли більше двох кілобайт відхиляться. Завжди рахуйте: 1 МБ = 1024, 10 МБ = 10240, 100 МБ = 102400.',
  },
  {
    question: "Що робить метод $file->store('attachments', 'public')?",
    options: [
      'Зберігає файл у public/attachments/ з оригінальним імʼям',
      'Зберігає файл у storage/app/public/attachments/ з УНІКАЛЬНИМ імʼям (UUID)',
      'Зберігає файл у storage/app/private/attachments/',
      'Створює символічне посилання на файл',
    ],
    correct: 1,
    explanation:
      'Перший аргумент — піддиректорія всередині диску, другий — назва диску. Laravel сам генерує UUID-імʼя файлу (наприклад, a1b2c3d4e5f6.pdf), щоб уникнути конфліктів. Оригінальне імʼя зберігаємо ОКРЕМО в БД (original_name), бо клієнт хоче бачити «report.pdf», а не UUID.',
  },
  {
    question: 'Як правильно отримати оригінальне імʼя завантаженого файлу від клієнта?',
    options: [
      "$request->file('attachment')->name",
      "$request->file('attachment')->originalName",
      "$request->file('attachment')->getClientOriginalName()",
      "$request->input('attachment_name')",
    ],
    correct: 2,
    explanation:
      '$file->getClientOriginalName() — метод обʼєкта Illuminate\\Http\\UploadedFile (під капотом Symfony). Інші корисні методи: getClientOriginalExtension(), getMimeType(), getSize(). Префікс «getClient» нагадує: ці дані надав клієнт, не довіряйте їм наосліп — для безпеки користуйтесь mimes:/extensions: правилами валідації.',
  },
  {
    question: "Що повертає Storage::disk('public')->url($path)?",
    options: [
      'Абсолютний шлях на файловій системі сервера (/var/www/storage/...)',
      'Публічний URL для браузера (http://app.test/storage/attachments/file.pdf)',
      'Base64-закодований вміст файлу',
      'Масив метаданих файлу',
    ],
    correct: 1,
    explanation:
      "url() будує URL виду APP_URL + /storage/ + $path — саме той, що йде у <img :src> чи <a :href>. На сервері він мапиться через симлінк на storage/app/public/. Для приватних файлів використовуйте Storage::disk('local')->download($path) — там URL не публічний, доступ контролює контролер.",
  },
]

// === CodeComparison: Vue FormData vs Laravel UploadedFile ===
const jsFormData = `// Vue/Nuxt — клієнт відправляє файл
const fileInput = ref(null)

async function uploadFile() {
  const file = fileInput.value.files[0]

  // Метаінформація на клієнті
  console.log(file.name)  // 'report.pdf'
  console.log(file.size)  // 204800 (bytes)
  console.log(file.type)  // 'application/pdf'

  // FormData — multipart/form-data
  const formData = new FormData()
  formData.append('attachment', file)

  // ⚠️ НЕ встановлюйте Content-Type вручну!
  // Браузер сам додасть multipart/form-data;
  // boundary=... — інакше Laravel не зможе
  // розпарсити запит.
  const { data } = await axios.post(
    \`/api/tasks/\${taskId}/attachments\`,
    formData,
    {
      headers: {
        Authorization: \`Bearer \${token}\`,
        // Content-Type — НЕ ставити!
      },
      onUploadProgress: (e) => {
        progress.value = (e.loaded / e.total) * 100
      },
    }
  )
  // data.url → '/storage/attachments/abc123.pdf'
}`

const phpUploadedFile = `<?php
// Laravel — серверне приймання
namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Storage;

class TaskAttachmentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        // ⚠️ max — у КІЛОБАЙТАХ! 10240 = 10 МБ
        $request->validate([
            'attachment' => [
                'required', 'file', 'max:10240',
                'mimes:jpg,jpeg,png,pdf,doc,docx,zip',
            ],
        ]);

        // UploadedFile — обгортка над $_FILES
        $file = $request->file('attachment');

        // Метаінформація — як file.name/.size/.type
        $file->getClientOriginalName();      // 'report.pdf'
        $file->getClientOriginalExtension(); // 'pdf'
        $file->getMimeType();                // 'application/pdf'
        $file->getSize();                    // 204800

        // store() — згенерує УНІКАЛЬНЕ імʼя (UUID),
        // покладе у storage/app/public/attachments/
        $path = $file->store('attachments', 'public');
        // → 'attachments/a1b2c3d4e5f6.pdf'

        $attachment = $task->attachments()->create([
            'filename'      => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'path'          => $path,
            'mime_type'     => $file->getMimeType(),
            'size'          => $file->getSize(),
        ]);

        return response()->json([
            'data' => [
                'id'  => $attachment->id,
                'url' => Storage::disk('public')->url($path),
            ],
        ], 201);
    }
}`

// === CodeBlock: Storage facade ===
const storageFacadeCode = `<?php

use Illuminate\\Support\\Facades\\Storage;

// === Один і той самий API для local / public / s3 ===

// Записати
Storage::disk('public')->put('avatars/user1.jpg', $bytes);

// Прочитати (повертає вміст файлу)
$contents = Storage::disk('public')->get('avatars/user1.jpg');

// Перевірити існування
Storage::disk('public')->exists('avatars/user1.jpg'); // true/false
Storage::disk('public')->missing('avatars/user1.jpg'); // протилежне

// Видалити
Storage::disk('public')->delete('avatars/user1.jpg');

// Видалити кілька
Storage::disk('public')->delete([
    'avatars/old1.jpg',
    'avatars/old2.jpg',
]);

// Метадані
Storage::disk('public')->size('avatars/user1.jpg');         // bytes
Storage::disk('public')->mimeType('avatars/user1.jpg');     // 'image/jpeg'
Storage::disk('public')->lastModified('avatars/user1.jpg'); // unix timestamp

// Публічний URL — для <img :src> чи <a :href>
Storage::disk('public')->url('avatars/user1.jpg');
// → http://localhost:8000/storage/avatars/user1.jpg

// 📌 Цей URL працює тому, що ви виконали php artisan storage:link
//    і зʼявився symlink public/storage → storage/app/public/`

// === CodeBlock: filesystems.php config ===
const filesystemsCode = `<?php
// config/filesystems.php — три типові диски

return [
    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [
        // ❌ ПРИВАТНИЙ: файли НЕ доступні через URL
        // Тільки через додаток (наприклад, для контрактів)
        'local' => [
            'driver' => 'local',
            'root'   => storage_path('app/private'),
        ],

        // ✅ ПУБЛІЧНИЙ: доступний через /storage/...
        // Потрібен symlink: php artisan storage:link
        'public' => [
            'driver'     => 'local',
            'root'       => storage_path('app/public'),
            'url'        => env('APP_URL') . '/storage',
            'visibility' => 'public',
        ],

        // ☁️ ХМАРНИЙ: Amazon S3 — той самий API!
        // У dev використовуйте 'public', у production — 's3'
        's3' => [
            'driver' => 's3',
            'key'    => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
        ],
    ],
];

// 💡 Перемикання між local / s3 — це лише FILESYSTEM_DISK у .env.
//    Жодного коду переписувати не треба.`

// === CodeBlock: validation ===
const validationCode = `<?php

$request->validate([
    // === Базова перевірка — це файл ===
    'attachment' => 'required|file',

    // === Тільки зображення (jpg/png/gif/svg/webp) ===
    // ⚠️ max — у КІЛОБАЙТАХ! 2048 = 2 МБ
    'avatar'   => 'required|image|max:2048',

    // === Конкретні розширення ===
    'document' => 'required|file|mimes:pdf,doc,docx,xls,xlsx|max:10240',

    // === Конкретні MIME-типи (точніше за mimes:) ===
    'photo'    => 'required|file|mimetypes:image/jpeg,image/png',

    // === Розміри зображення ===
    'banner'   => [
        'required', 'image',
        'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',
    ],

    // === Множинне завантаження ===
    'photos'   => 'required|array|max:5',     // максимум 5 файлів
    'photos.*' => 'image|max:5120',           // кожен файл — max 5 МБ

    // === Точний розмір (наприклад, тільки квадратні аватари) ===
    'square'   => 'image|dimensions:ratio=1/1',
]);

// 🔑 Ключове правило: НЕ довіряйте accept="..." на <input> —
//    клієнт може його обійти. mimes:/file/image на сервері — обовʼязково.`

// === CodeBlock: download endpoint ===
const downloadCode = `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Task;
use App\\Models\\TaskAttachment;
use Illuminate\\Support\\Facades\\Storage;
use Symfony\\Component\\HttpFoundation\\StreamedResponse;

class TaskAttachmentController extends Controller
{
    /**
     * GET /api/tasks/{task}/attachments/{attachment}
     *
     * Контрольоване скачування: перевіряємо власника
     * через Policy і ТІЛЬКИ ПОТІМ віддаємо файл.
     * Це краще за прямий URL для приватних файлів.
     */
    public function show(Task $task, TaskAttachment $attachment): StreamedResponse
    {
        $this->authorize('view', $task);

        // Anti-IDOR: вкладення дійсно належить цій задачі?
        if ($attachment->task_id !== $task->id) {
            abort(404);
        }

        // Файл досі є на диску? (могли руками видалити)
        if (! Storage::disk('public')->exists($attachment->path)) {
            abort(404, 'File not found on disk.');
        }

        // download() віддає файл як attachment
        // з оригінальним іменем — клієнт побачить
        // 'report.pdf', а не UUID.
        return Storage::disk('public')->download(
            $attachment->path,
            $attachment->original_name
        );
    }

    /**
     * DELETE /api/tasks/{task}/attachments/{attachment}
     */
    public function destroy(Task $task, TaskAttachment $attachment)
    {
        $this->authorize('update', $task);

        if ($attachment->task_id !== $task->id) {
            abort(404);
        }

        // ❗ Завжди видаляйте і файл, і запис.
        //   Інакше у storage збираються «осиротілі» файли.
        Storage::disk('public')->delete($attachment->path);
        $attachment->delete();

        return response()->noContent(); // 204
    }
}`

// === Practice: симулятор Storage facade на голому PHP ===
const practiceCode = `<?php
declare(strict_types=1);

// Симулюємо Laravel Storage facade у памʼяті,
// без реальних файлів. Це показує суть:
//   - як Storage абстрагує дисковий бекенд
//   - як store() генерує унікальне імʼя (UUID-подібне)
//   - як url() вибудовується з диск-конфігу + path
//   - чому в БД треба зберігати ОБИДВА імені:
//     filename (для diск) і original_name (для UI)

// === In-memory диск (емуляція storage/app/public) ===
class InMemoryDisk
{
    public function __construct(
        public string $name,
        public string $rootPath,
        public string $publicUrl,
        /** @var array<string, array{contents: string, mime: string}> */
        public array $files = [],
    ) {}

    public function put(string $path, string $contents, string $mime = 'application/octet-stream'): bool {
        $this->files[$path] = ['contents' => $contents, 'mime' => $mime];
        echo "  📥 disk[{$this->name}]->put('{$path}') → " . strlen($contents) . " bytes\\n";
        return true;
    }

    public function exists(string $path): bool {
        return isset($this->files[$path]);
    }

    public function get(string $path): ?string {
        return $this->files[$path]['contents'] ?? null;
    }

    public function size(string $path): ?int {
        return isset($this->files[$path]) ? strlen($this->files[$path]['contents']) : null;
    }

    public function delete(string $path): bool {
        if (isset($this->files[$path])) {
            unset($this->files[$path]);
            echo "  🗑  disk[{$this->name}]->delete('{$path}') ✓\\n";
            return true;
        }
        return false;
    }

    public function url(string $path): string {
        // url() = диск.url + '/' + path
        // (саме тому потрібен symlink — без нього 404)
        return rtrim($this->publicUrl, '/') . '/' . ltrim($path, '/');
    }
}

// === UploadedFile — обгортка над файлом, який «прислав клієнт» ===
class UploadedFile
{
    public function __construct(
        public string $clientOriginalName,
        public string $clientOriginalExtension,
        public string $mimeType,
        public string $contents,
    ) {}

    public function getClientOriginalName(): string      { return $this->clientOriginalName; }
    public function getClientOriginalExtension(): string { return $this->clientOriginalExtension; }
    public function getMimeType(): string                { return $this->mimeType; }
    public function getSize(): int                       { return strlen($this->contents); }

    /** store() — генерує УНІКАЛЬНЕ імʼя і кладе на диск */
    public function store(string $folder, InMemoryDisk $disk): string {
        $filename = bin2hex(random_bytes(8)) . '.' . $this->clientOriginalExtension;
        $path = trim($folder, '/') . '/' . $filename;
        $disk->put($path, $this->contents, $this->mimeType);
        return $path;
    }

    /** storeAs() — кладе з конкретним імʼям */
    public function storeAs(string $folder, string $name, InMemoryDisk $disk): string {
        $path = trim($folder, '/') . '/' . $name;
        $disk->put($path, $this->contents, $this->mimeType);
        return $path;
    }
}

// ====== Сценарій ======

$publicDisk = new InMemoryDisk(
    name:      'public',
    rootPath:  'storage/app/public',
    publicUrl: 'http://localhost:8000/storage',
);

echo "=== 1) Клієнт надсилає report.pdf ===\\n";
$file = new UploadedFile(
    clientOriginalName:      'Quarterly Report Q1.pdf',
    clientOriginalExtension: 'pdf',
    mimeType:                'application/pdf',
    contents:                str_repeat('FAKE PDF DATA ', 1000),
);

echo "  Метадані з клієнта:\\n";
echo "    name = {$file->getClientOriginalName()}\\n";
echo "    ext  = {$file->getClientOriginalExtension()}\\n";
echo "    mime = {$file->getMimeType()}\\n";
echo "    size = {$file->getSize()} bytes (" . round($file->getSize() / 1024, 2) . " KB)\\n\\n";

echo "=== 2) store() — генерує UUID-імʼя ===\\n";
$path = $file->store('attachments', $publicDisk);
echo "  path у БД:  {$path}\\n";
echo "  publicUrl:  " . $publicDisk->url($path) . "\\n\\n";

echo "=== 3) Запис у «БД» зберігає ДВА імені ===\\n";
$row = [
    'id'            => 1,
    'task_id'       => 42,
    'filename'      => basename($path),                  // a1b2c3d4.pdf — для диску
    'original_name' => $file->getClientOriginalName(),   // Quarterly Report Q1.pdf — для UI
    'path'          => $path,
    'mime_type'     => $file->getMimeType(),
    'size'          => $file->getSize(),
];
print_r($row);

echo "\\n=== 4) Скачування — клієнт бачить ОРИГІНАЛЬНЕ імʼя ===\\n";
echo "  HTTP Header: Content-Disposition: attachment; filename=\\"{$row['original_name']}\\"\\n";
echo "  Контент бере з диску по $row['path']: " . substr($publicDisk->get($row['path']) ?? '', 0, 30) . "...\\n\\n";

echo "=== 5) Видалення вкладення ===\\n";
$publicDisk->delete($row['path']);
echo "  exists після delete: " . ($publicDisk->exists($row['path']) ? 'YES (баг!)' : 'NO ✓') . "\\n\\n";

echo "=== 6) storeAs() — конкретне імʼя (для аватарок: avatar-{userId}.jpg) ===\\n";
$avatar = new UploadedFile('me.jpg', 'jpg', 'image/jpeg', 'FAKE-JPEG-BYTES');
$avatarPath = $avatar->storeAs('avatars', 'avatar-7.jpg', $publicDisk);
echo "  path: {$avatarPath}\\n";
echo "  url:  " . $publicDisk->url($avatarPath) . "\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте Storage-адаптер + UploadedFile + аватар-флоу.
 *
 * Контекст: це повна симуляція Laravel-сценарію
 *   POST   /api/profile/avatar   — завантажити аватар (старий видалити)
 *   DELETE /api/profile/avatar   — прибрати аватар
 *
 * Реалізуйте 5 функцій:
 *
 *   1) makeUniqueFilename(string $extension): string
 *      повертає рядок виду '<16-hex>.<extension>'
 *      (підказка: bin2hex(random_bytes(8)))
 *
 *   2) storageDiskUrl(string $publicUrlBase, string $path): string
 *      повертає publicUrlBase + '/' + path БЕЗ подвійних слешів
 *
 *   3) validateAvatar(array $file): array
 *      приймає масив виду
 *        ['mime' => 'image/jpeg', 'size_bytes' => 1234]
 *      повертає список помилок (порожній масив = ОК).
 *      Правила:
 *        - mime має починатись на 'image/' → інакше "must be an image"
 *        - size_bytes / 1024 > 2048 (тобто > 2МБ) →
 *          "avatar may not be greater than 2048 kilobytes"
 *
 *   4) uploadAvatar(int $userId, array $file, array &$users, array &$disk): array
 *      $file: ['name','ext','mime','contents']
 *      $users[id]: ['avatar_path' => ?string]
 *      $disk[path]: contents
 *      Логіка:
 *        a) валідація — якщо є помилки, повернути ['status' => 422, 'errors' => [...]]
 *        b) якщо у $users[$userId]['avatar_path'] вже щось є — видалити старий файл з $disk
 *        c) згенерувати унікальне імʼя через makeUniqueFilename()
 *        d) шлях = "avatars/<filename>"
 *        e) покласти контент у $disk
 *        f) оновити $users[$userId]['avatar_path']
 *        g) повернути ['status' => 201, 'url' => storageDiskUrl(...)]
 *
 *   5) deleteAvatar(int $userId, array &$users, array &$disk): array
 *      - якщо avatar_path порожній → ['status' => 204]
 *      - інакше: видалити з диску, обнулити avatar_path, ['status' => 204]
 */

const PUBLIC_URL = 'http://localhost:8000/storage';

function makeUniqueFilename(string $extension): string {
    // Ваш код тут
}

function storageDiskUrl(string $publicUrlBase, string $path): string {
    // Ваш код тут
}

function validateAvatar(array $file): array {
    // Ваш код тут
}

function uploadAvatar(int $userId, array $file, array &$users, array &$disk): array {
    // Ваш код тут
}

function deleteAvatar(int $userId, array &$users, array &$disk): array {
    // Ваш код тут
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 8;

// 1. makeUniqueFilename: формат
$fn = makeUniqueFilename('jpg');
if (preg_match('/^[a-f0-9]{16}\\.jpg$/', $fn)) {
    echo "✓ makeUniqueFilename: формат '<16-hex>.jpg'\\n"; $pass++;
} else {
    echo "✗ makeUniqueFilename: очікувався 16-hex.jpg, отримано {$fn}\\n";
}

// 2. storageDiskUrl: без подвійних слешів
$url = storageDiskUrl('http://app.test/storage/', '/avatars/me.jpg');
if ($url === 'http://app.test/storage/avatars/me.jpg') {
    echo "✓ storageDiskUrl: коректно склеює без подвійних слешів\\n"; $pass++;
} else {
    echo "✗ storageDiskUrl: '{$url}'\\n";
}

// 3. validateAvatar: приймає валідний JPEG 1 МБ
$errors = validateAvatar(['mime' => 'image/jpeg', 'size_bytes' => 1024 * 1024]);
if ($errors === []) {
    echo "✓ validateAvatar: 1МБ JPEG — без помилок\\n"; $pass++;
} else {
    echo "✗ validateAvatar: мав пройти, помилки: " . json_encode($errors) . "\\n";
}

// 4. validateAvatar: відхиляє text/plain
$errors = validateAvatar(['mime' => 'text/plain', 'size_bytes' => 100]);
if (count($errors) === 1 && str_contains($errors[0], 'image')) {
    echo "✓ validateAvatar: text/plain → 'must be an image'\\n"; $pass++;
} else {
    echo "✗ validateAvatar: text/plain мав дати помилку про image\\n";
}

// 5. validateAvatar: відхиляє 3 МБ
$errors = validateAvatar(['mime' => 'image/png', 'size_bytes' => 3 * 1024 * 1024]);
if (count($errors) === 1 && str_contains($errors[0], '2048')) {
    echo "✓ validateAvatar: 3МБ → 'may not be greater than 2048 kilobytes'\\n"; $pass++;
} else {
    echo "✗ validateAvatar: 3МБ мав дати помилку про розмір\\n";
}

// 6. uploadAvatar — happy path
$users = [7 => ['avatar_path' => null]];
$disk  = [];
$file  = ['name' => 'me.jpg', 'ext' => 'jpg', 'mime' => 'image/jpeg', 'contents' => 'JPEG-BYTES'];
$resp  = uploadAvatar(7, $file, $users, $disk);
if (
    $resp['status'] === 201
    && isset($resp['url'])
    && str_starts_with($resp['url'], PUBLIC_URL . '/avatars/')
    && str_starts_with($users[7]['avatar_path'], 'avatars/')
    && count($disk) === 1
) {
    echo "✓ uploadAvatar: 201, файл у диску, avatar_path оновлено\\n"; $pass++;
} else {
    echo "✗ uploadAvatar: щось не так:\\n";
    print_r(['response' => $resp, 'users' => $users, 'disk_keys' => array_keys($disk)]);
}

// 7. uploadAvatar повторно — старий файл має зникнути з диску
$file2 = ['name' => 'me2.jpg', 'ext' => 'jpg', 'mime' => 'image/jpeg', 'contents' => 'NEW'];
$resp2 = uploadAvatar(7, $file2, $users, $disk);
if ($resp2['status'] === 201 && count($disk) === 1) {
    echo "✓ uploadAvatar: повторне завантаження видалило старий файл (1 у диску)\\n"; $pass++;
} else {
    echo "✗ uploadAvatar: при заміні має лишитись 1 файл, а у диску " . count($disk) . "\\n";
}

// 8. deleteAvatar
$resp3 = deleteAvatar(7, $users, $disk);
if ($resp3['status'] === 204 && $users[7]['avatar_path'] === null && count($disk) === 0) {
    echo "✓ deleteAvatar: 204, avatar_path = null, диск порожній\\n"; $pass++;
} else {
    echo "✗ deleteAvatar: щось не так:\\n";
    print_r(['response' => $resp3, 'users' => $users, 'disk' => $disk]);
}

echo "\\nРезультат: $pass/$total\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="new FormData() + axios.post(/api/upload, formData)"
        to="$request->file('attachment') + Storage::disk('public')->put()"
      />

      <TheoryBlock title="Storage facade — єдиний API для всіх дисків">
        <p>
          У Vue/Nuxt ви працюєте з файлами на клієнті:
          <code>&lt;input type="file"&gt;</code>, <code>FormData</code>,
          <code>onUploadProgress</code>. На сервері Laravel абстрагує файлову систему через фасад
          <code>Storage</code>: один і той самий код працює для локального диску, S3, Google Cloud
          Storage, FTP — змінюється тільки конфіг.
        </p>
        <p>
          Це як <code>runtimeConfig</code> у Nuxt: у dev використовуємо <code>public</code>, у
          production — <code>s3</code>, а контролер залишається ідентичним.
        </p>
      </TheoryBlock>

      <CodeBlock :code="storageFacadeCode" lang="php" title="Storage facade — основні операції" />

      <TheoryBlock title="Disks (диски) у config/filesystems.php">
        <p>Кожен «диск» — це іменована конфігурація сховища. Три класичні диски:</p>
        <ul>
          <li>
            <strong>local</strong> — приватні файли в <code>storage/app/private/</code>. НЕ доступні
            через URL — лише через додаток (наприклад, контракти, які віддає окремий ендпоінт після
            перевірки).
          </li>
          <li>
            <strong>public</strong> — публічні файли в <code>storage/app/public/</code>. Доступні
            через URL <code>/storage/...</code> завдяки симлінку.
          </li>
          <li>
            <strong>s3</strong> — Amazon S3. Той самий API,
            <code>Storage::disk('s3')->put(...)</code> — і файл вже у хмарі.
          </li>
        </ul>
        <p>
          Перемикання між дисками для всього додатку — це лише
          <code>FILESYSTEM_DISK=s3</code> у <code>.env</code>. Жодного коду переписувати не треба.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="filesystemsCode"
        lang="php"
        title="config/filesystems.php — три типові диски"
      />

      <TheoryBlock title="php artisan storage:link — критичний крок!">
        <p>
          Диск <code>public</code> зберігає файли у <code>storage/app/public/</code>, але веб-сервер
          віддає тільки те, що в <code>public/</code>. Команда
          <code>php artisan storage:link</code> створює симлінк
          <code>public/storage → storage/app/public</code> — і файли стають доступними через URL.
        </p>
        <p>
          ⚠️ Без цієї команди браузер отримуватиме <strong>404</strong>, навіть якщо файл фізично на
          диску і <code>Storage::disk('public')->url()</code> повертає правильний URL. Це найчастіша
          «WTF» проблема новачків.
        </p>
      </TheoryBlock>

      <CodeComparison
        :js="jsFormData"
        :php="phpUploadedFile"
        js-title="Vue/Nuxt — клієнт надсилає FormData"
        php-title="Laravel — приймає UploadedFile"
      />

      <TheoryBlock title="Валідація файлів — НЕ довіряйте accept= на клієнті">
        <p>
          Атрибут <code>accept=".jpg,.png"</code> на <code>&lt;input type="file"&gt;</code> — це
          лише підказка для діалогу вибору файлу. Користувач може обійти його через DevTools, curl
          чи Postman. <strong>Серверна валідація — обовʼязкова.</strong>
        </p>
        <p>
          ⚠️ <strong>Найкритичніша пастка:</strong> правило <code>max</code> вказується у
          <strong>кілобайтах</strong>, не в мегабайтах! <code>max:2048</code> = 2 МБ;
          <code>max:10240</code> = 10 МБ. Написавши <code>max:10</code>, ви відхилите будь-який
          файл, більший за 10 КБ.
        </p>
      </TheoryBlock>

      <CodeBlock :code="validationCode" lang="php" title="Правила валідації файлів" />

      <TheoryBlock title="store() vs storeAs() — генерація унікального імені">
        <p>
          <code>$file->store('attachments', 'public')</code> кладе файл у
          <code>storage/app/public/attachments/</code> і генерує
          <strong>унікальне UUID-імʼя</strong> (наприклад, <code>a1b2c3d4e5f6.pdf</code>). Це
          запобігає колізіям, коли двоє користувачів завантажать файл з однаковим імʼям.
        </p>
        <p>
          В БД треба зберігати <strong>обидва</strong> імені: <code>filename</code> (для диску,
          UUID) і <code>original_name</code> (для UI — клієнт хоче бачити «Звіт Q1.pdf»). При
          скачуванні через <code>Storage::download($path, $original)</code> Laravel сам поставить
          правильний <code>Content-Disposition</code> з оригінальним імʼям.
        </p>
        <p>
          Альтернатива — <code>$file->storeAs('avatars', 'avatar-7.jpg', 'public')</code> з
          конкретним імʼям. Корисно для аватарок: один файл на користувача, унікальність — за
          <code>userId</code>.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="downloadCode"
        lang="php"
        title="Скачування + видалення з anti-IDOR перевірками"
      />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: симуляція Storage facade на чистому PHP">
        <p>
          У playground ми <strong>самі реалізуємо</strong> Laravel <code>Storage</code> та
          <code>UploadedFile</code> у памʼяті. Це показує суть: <code>store()</code> повертає шлях,
          який ви кладете в БД як <code>path</code>; <code>url()</code> склеює
          <code>publicUrl</code> з <code>path</code>; видалення — двоетапне (диск + БД).
        </p>
        <p>
          Сценарій проводить файл «Quarterly Report Q1.pdf» через повний шлях: завантаження →
          UUID-імʼя → запис у БД (з <em>двома</em> іменами) → скачування з
          <code>Content-Disposition</code> → видалення → завантаження аватара через
          <code>storeAs()</code>.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/16-storage.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="3-16" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: повний avatar-flow з валідацією та видаленням старого файлу">
        <p>
          Реалізуйте 5 функцій, які разом утворюють робочий ендпоінт
          <code>POST /api/profile/avatar</code>. Натисніть <strong>«Запустити»</strong> — 8
          авто-тестів перевірять формат UUID-імен, склейку URL, валідацію і <em>обидва</em> важливих
          edge-case: повторне завантаження видаляє старий файл, видалення обнуляє
          <code>avatar_path</code>.
        </p>
        <ol>
          <li>
            <strong>makeUniqueFilename($ext)</strong> — формат
            <code>&lt;16-hex&gt;.&lt;ext&gt;</code> через <code>bin2hex(random_bytes(8))</code>.
          </li>
          <li>
            <strong>storageDiskUrl($base, $path)</strong> — склеює
            <code>$base + / + $path</code> без подвійних слешів.
          </li>
          <li>
            <strong>validateAvatar($file)</strong> — повертає масив помилок: mime має починатись на
            <code>image/</code>; розмір ≤ 2 МБ (2048 КБ).
          </li>
          <li>
            <strong>uploadAvatar(...)</strong> — головна логіка: валідація → видалити старий →
            покласти новий → оновити <code>avatar_path</code> → повернути URL.
          </li>
          <li><strong>deleteAvatar(...)</strong> — видалити файл і обнулити поле; завжди 204.</li>
        </ol>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте avatar-flow зі Storage-семантикою"
        :test-code="taskTestCode"
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
