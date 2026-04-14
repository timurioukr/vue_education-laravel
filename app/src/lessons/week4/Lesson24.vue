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
    question: 'Чому APP_DEBUG=false критично важливий на production?',
    options: [
      'Щоб сайт працював швидше',
      'Щоб не показувати stack traces, SQL-запити та змінні .env відвідувачам',
      'Щоб Laravel не записував логи',
      'Щоб дозволити кешування конфігурації',
    ],
    correct: 1,
    explanation:
      'APP_DEBUG=true показує повний stack trace з SQL, .env змінними, шляхами файлів — це золота жила для хакера. На production ЗАВЖДИ APP_DEBUG=false. Помилки пишемо в лог (storage/logs), а юзеру показуємо generic 500 сторінку.',
  },
  {
    question: 'Що робить php artisan optimize?',
    options: [
      'Мініфікує PHP-код як npm run build',
      'Кешує конфігурацію, маршрути, view-шаблони та події в один файл',
      'Оптимізує базу даних (VACUUM / ANALYZE)',
      'Встановлює production-залежності',
    ],
    correct: 1,
    explanation:
      'php artisan optimize = config:cache + route:cache + view:cache + event:cache. Замість читання десятків .php-файлів на кожен запит Laravel бере все з одного кешованого файлу. Це аналог tree-shaking + bundling у Vite — менше I/O, швидший bootstrap.',
  },
  {
    question: 'Чому SQLite не підходить для production?',
    options: [
      'SQLite не підтримує міграції',
      'SQLite — файловий замок: один write блокує всю базу, concurrency обмежена',
      'SQLite не працює на Linux-серверах',
      'SQLite не підтримує Eloquent ORM',
    ],
    correct: 1,
    explanation:
      'SQLite чудовий для dev/testing (RefreshDatabase миттєво), але в production при 10+ одночасних запитах file-level locking стає bottleneck. MySQL/PostgreSQL обробляють тисячі паралельних запитів через row-level locking. Це як localStorage vs Redis.',
  },
  {
    question: 'Як налаштувати SPA-роутинг на Netlify для Vue Router (history mode)?',
    options: [
      'Додати .htaccess з RewriteRule',
      'Створити _redirects файл: /* /index.html 200 — всі шляхи повертають SPA',
      'Увімкнути SSR на Netlify',
      'Використовувати hash-mode замість history mode',
    ],
    correct: 1,
    explanation:
      'SPA має один index.html, а Vue Router обробляє шляхи на клієнті. Без redirect правила Netlify поверне 404 на /tasks/5. Файл public/_redirects з "/* /index.html 200" каже серверу: для БУДЬ-якого шляху віддай index.html, Vue Router розбереться сам.',
  },
  {
    question: 'Що робить composer install --no-dev?',
    options: [
      'Встановлює тільки PHP 8.x залежності',
      'Пропускає dev-залежності (Telescope, PHPUnit, Faker) — менший vendor, швидший autoload',
      'Видаляє composer.lock файл',
      'Встановлює залежності без перевірки версій',
    ],
    correct: 1,
    explanation:
      'require-dev у composer.json — це як devDependencies у package.json. На production Telescope, PHPUnit, Faker не потрібні. --no-dev пропускає їх: менший vendor/, швидший autoload, менша attack surface. Аналог npm ci --omit=dev.',
  },
]

// === CodeComparison: Vue build vs Laravel deploy ===
const jsVueBuild = `# Vue / Vite — збірка для production
npm run build
# Результат: dist/
#   index.html
#   assets/app-[hash].js   (tree-shaken, minified)
#   assets/app-[hash].css

# Деплой на Netlify / Vercel:
# 1. git push → auto build
# 2. Build command: npm run build
# 3. Publish dir: dist/
# 4. SPA routing: _redirects або vercel.json

# _redirects (Netlify):
/*    /index.html   200

# vercel.json:
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

# Environment variables:
# VITE_API_URL=https://api.myapp.com
# Доступні ТІЛЬКИ з префіксом VITE_`

const phpLaravelDeploy = `# Laravel — deploy на production сервер
# 1. Код
git pull origin main

# 2. Залежності (БЕЗ dev — Telescope, PHPUnit)
composer install --no-dev --optimize-autoloader

# 3. Міграції (--force обов'язковий на production)
php artisan migrate --force

# 4. Кешування (config + routes + views + events)
php artisan optimize

# 5. Перезапуск воркерів (підхоплять новий код)
php artisan queue:restart

# .env на сервері:
APP_ENV=production
APP_DEBUG=false          # КРИТИЧНО!
APP_KEY=base64:...       # php artisan key:generate
DB_CONNECTION=mysql      # НЕ sqlite
DB_HOST=127.0.0.1
DB_DATABASE=taskapp
DB_USERNAME=taskapp_user
DB_PASSWORD=strong_password_here

QUEUE_CONNECTION=database  # або redis
CACHE_STORE=redis          # або file`

// === CodeBlock: production checklist ===
const checklistCode = `# Production Checklist — обов'язково перед деплоєм
#
# .env
# ─────────────────────────────────────────────
APP_ENV=production
APP_DEBUG=false        # ← НАЙВАЖЛИВІШЕ! true = витік stack trace + .env
APP_KEY=base64:...     # php artisan key:generate (унікальний для кожного сервера)
APP_URL=https://myapp.com

# База даних
# ─────────────────────────────────────────────
DB_CONNECTION=mysql    # НЕ sqlite (file-lock = bottleneck при навантаженні)
DB_HOST=127.0.0.1     # localhost або RDS endpoint
DB_DATABASE=taskapp_prod
DB_USERNAME=taskapp    # НЕ root!
DB_PASSWORD=...        # Довгий, випадковий пароль

# Кеш і черги
# ─────────────────────────────────────────────
CACHE_STORE=redis      # або file (redis швидший)
SESSION_DRIVER=redis   # або database
QUEUE_CONNECTION=database  # або redis

# Пошта
# ─────────────────────────────────────────────
MAIL_MAILER=smtp       # НЕ log
MAIL_HOST=smtp.mailgun.org

# Безпека
# ─────────────────────────────────────────────
# HTTPS обов'язково (Let's Encrypt = безкоштовно)
# CORS дозволити тільки ваш frontend домен
# Rate limiting увімкнено (ThrottleRequests middleware)`

// === CodeBlock: optimization commands ===
const optimizeCode = `# php artisan optimize — що всередині?
# Замість десятків файлів на кожен запит → один кешований файл

# Кешує ВСЕ:
php artisan optimize
# Еквівалент:
#   php artisan config:cache   — config/*.php → bootstrap/cache/config.php
#   php artisan route:cache    — routes/*.php → bootstrap/cache/routes-v7.php
#   php artisan view:cache     — Blade шаблони → storage/framework/views/
#   php artisan event:cache    — Event-Listener маппінг → bootstrap/cache/events.php

# Очистити кеш (для дебагу або після зміни .env):
php artisan optimize:clear
# Еквівалент:
#   php artisan config:clear
#   php artisan route:clear
#   php artisan view:clear
#   php artisan event:clear

# ⚠️ Після config:cache — .env читається ТІЛЬКИ з кешу!
#    Зміна .env → обов'язково php artisan config:cache заново

# Composer autoload optimization:
composer install --optimize-autoloader
# Генерує class map замість PSR-4 пошуку файлів`

// === CodeBlock: deployment options ===
const deployOptionsCode = `# Варіанти деплою Laravel + Vue SPA
#
# ╔═══════════════════╦═════════════════════╦════════════════════╗
# ║ Варіант           ║ Для кого            ║ Ціна               ║
# ╠═══════════════════╬═════════════════════╬════════════════════╣
# ║ VPS (DigitalOcean ║ Повний контроль,    ║ $4-12/міс          ║
# ║ Hetzner, Linode)  ║ потрібні DevOps     ║                    ║
# ╠═══════════════════╬═════════════════════╬════════════════════╣
# ║ Laravel Forge     ║ VPS + автоматизація ║ $12/міс + VPS      ║
# ║                   ║ (Nginx, SSL, deploy)║                    ║
# ╠═══════════════════╬═════════════════════╬════════════════════╣
# ║ Laravel Cloud     ║ Managed, auto-scale ║ Pay-per-use        ║
# ║                   ║ (як Vercel для PHP) ║                    ║
# ╠═══════════════════╬═════════════════════╬════════════════════╣
# ║ Netlify / Vercel  ║ Тільки Vue SPA      ║ Free tier          ║
# ║                   ║ (static hosting)    ║                    ║
# ╚═══════════════════╩═════════════════════╩════════════════════╝
#
# Типова архітектура:
#   Vue SPA (Netlify/Vercel) → HTTPS → Laravel API (VPS/Forge)
#   Frontend і Backend на РІЗНИХ серверах/доменах
#   CORS налаштований на Laravel стороні`

// === CodeBlock: database migrations in production ===
const migrationsCode = `# Міграції на production

# --force обов'язковий! Laravel захищає від випадкового запуску
php artisan migrate --force

# ⚠️ БЕЗ --force на production:
# "Are you sure you want to run this command? (yes/no)"
# В автоматичному deploy-скрипті це зламає процес!

# MySQL setup для production:
sudo mysql -u root -p

CREATE DATABASE taskapp_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taskapp'@'localhost' IDENTIFIED BY 'strong_random_password';
GRANT ALL PRIVILEGES ON taskapp_prod.* TO 'taskapp'@'localhost';
FLUSH PRIVILEGES;

# Backup перед міграцією (ОБОВ'ЯЗКОВО):
mysqldump -u taskapp -p taskapp_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Потім міграція:
php artisan migrate --force

# Rollback якщо щось пішло не так:
php artisan migrate:rollback --force`

// === CodeBlock: queue workers + cron ===
const queueCronCode = `# Queue Workers — Supervisor (процес-менеджер)
# /etc/supervisor/conf.d/taskapp-worker.conf

[program:taskapp-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/taskapp/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/taskapp/storage/logs/worker.log
stopwaitsecs=3600

# Запустити/перезапустити:
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start taskapp-worker:*
sudo supervisorctl restart taskapp-worker:*

# ─────────────────────────────────────────────
# Scheduled Tasks — Cron
# crontab -e (від user www-data):

* * * * * cd /var/www/taskapp && php artisan schedule:run >> /dev/null 2>&1

# Один рядок у cron → Laravel сам вирішує які команди запускати
# app/Console/Kernel.php або routes/console.php:

use Illuminate\\Support\\Facades\\Schedule;

Schedule::command('overdue:notify')->dailyAt('09:00');
Schedule::command('telescope:prune')->daily();
Schedule::command('backup:run')->weeklyOn(1, '03:00'); // Понеділок 3:00`

// === CodeBlock: HTTPS / SSL ===
const httpsCode = `# HTTPS з Let's Encrypt (безкоштовно)

# 1. Встановити certbot
sudo apt install certbot python3-certbot-nginx

# 2. Отримати сертифікат (автоматично налаштує Nginx)
sudo certbot --nginx -d api.myapp.com -d myapp.com

# 3. Auto-renew (certbot додає cron автоматично)
sudo certbot renew --dry-run  # тест

# Nginx config (certbot додає SSL блок):
server {
    listen 443 ssl;
    server_name api.myapp.com;

    ssl_certificate     /etc/letsencrypt/live/api.myapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.myapp.com/privkey.pem;

    root /var/www/taskapp/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\\.(?!well-known).* {
        deny all;  # Захист .env, .git тощо
    }
}

# HTTP → HTTPS redirect (certbot додає автоматично):
server {
    listen 80;
    server_name api.myapp.com;
    return 301 https://$server_name$request_uri;
}`

// === CodeBlock: monitoring ===
const monitoringCode = `# Моніторинг та health checks

# 1. Laravel Telescope (тільки для dev/staging!)
# ⚠️ НЕ ставити на production — зберігає ВСЕ: запити, SQL, .env
composer require laravel/telescope --dev  # --dev!
php artisan telescope:install

# 2. Health check endpoint
# routes/api.php:
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        Cache::store()->get('health-check');

        return response()->json([
            'status'  => 'ok',
            'time'    => now()->toISOString(),
            'db'      => 'connected',
            'cache'   => 'working',
            'version' => config('app.version', '1.0.0'),
        ]);
    } catch (\\Exception $e) {
        return response()->json([
            'status' => 'error',
            'error'  => $e->getMessage(),
        ], 503);
    }
});

# 3. Логування
# config/logging.php — stack channel:
'channels' => [
    'stack' => [
        'driver'   => 'stack',
        'channels' => ['daily', 'slack'],  # файл + Slack для critical
    ],
    'daily' => [
        'driver' => 'daily',
        'path'   => storage_path('logs/laravel.log'),
        'days'   => 14,  # зберігати 14 днів
    ],
    'slack' => [
        'driver'   => 'slack',
        'url'      => env('LOG_SLACK_WEBHOOK_URL'),
        'level'    => 'critical',  # тільки critical помилки
    ],
],

# 4. Перевірити логи:
tail -f storage/logs/laravel.log
# або Laravel Pail (real-time):
php artisan pail`

// === CodeBlock: roadmap ===
const roadmapCode = `# Що далі? Roadmap після курсу
#
# ╔══════════════════════════════════════════════════════════╗
# ║  Базовий рівень (цей курс)                             ║
# ║  ✅ Vue 3 + Composition API + Pinia + Router            ║
# ║  ✅ Laravel API: CRUD, Auth, Policies, Events           ║
# ║  ✅ Testing: Feature + Unit + Fakes                     ║
# ║  ✅ Deploy: VPS + Nginx + SSL + Queue                   ║
# ╠══════════════════════════════════════════════════════════╣
# ║  Наступний рівень                                       ║
# ║  🔄 WebSockets — Laravel Reverb (real-time updates)     ║
# ║  🔄 Horizon — dashboard для Redis queue                 ║
# ║  🔄 Inertia.js — Vue + Laravel без API (monolith SPA)  ║
# ║  🔄 CI/CD — GitHub Actions: test → build → deploy      ║
# ╠══════════════════════════════════════════════════════════╣
# ║  Просунутий рівень                                      ║
# ║  📦 GraphQL — Laravel Lighthouse                        ║
# ║  📦 Microservices — API Gateway + Message Broker        ║
# ║  📦 Docker — контейнеризація (Laravel Sail → prod)     ║
# ║  📦 Kubernetes — оркестрація контейнерів                ║
# ╠══════════════════════════════════════════════════════════╣
# ║  DevOps                                                  ║
# ║  🛠 GitHub Actions: tests + PHPStan + deploy             ║
# ║  🛠 Terraform / Ansible — infrastructure as code        ║
# ║  🛠 Monitoring: Sentry, Prometheus + Grafana            ║
# ╚══════════════════════════════════════════════════════════╝
#
# Рекомендований порядок:
# 1. CI/CD (GitHub Actions) — автоматизувати те що вже є
# 2. WebSockets (Reverb) — real-time нотифікації
# 3. Inertia.js — спробувати monolith-SPA підхід
# 4. Docker — стандартизувати dev-середовище`

// === Practice: deploy script simulation ===
const practiceCode = `<?php
declare(strict_types=1);

// Симуляція deploy-скрипта Laravel на чистому PHP
// Показуємо послідовність кроків та перевірку health check

// ===== Deploy Step Runner =====
class DeployRunner
{
    private array $log = [];
    private array $checklist = [];

    public function runStep(string $name, callable $action): bool {
        $this->log[] = "[DEPLOY] Запуск: {$name}...";
        try {
            $result = $action();
            $this->checklist[$name] = true;
            $this->log[] = "[  OK  ] {$name} — успішно";
            return true;
        } catch (\\Exception $e) {
            $this->checklist[$name] = false;
            $this->log[] = "[ FAIL ] {$name} — {$e->getMessage()}";
            return false;
        }
    }

    public function getLog(): array { return $this->log; }
    public function getChecklist(): array { return $this->checklist; }
    public function allPassed(): bool { return !in_array(false, $this->checklist, true); }
}

// ===== Health Check =====
function verifyHealth(array $config): array {
    $checks = [];

    // APP_DEBUG перевірка
    $checks['debug_off'] = ($config['APP_DEBUG'] ?? 'true') === 'false';

    // Database connection
    $checks['db_type'] = ($config['DB_CONNECTION'] ?? 'sqlite') !== 'sqlite';

    // APP_KEY встановлено
    $checks['app_key'] = !empty($config['APP_KEY']) && str_starts_with($config['APP_KEY'], 'base64:');

    // APP_ENV = production
    $checks['env_production'] = ($config['APP_ENV'] ?? 'local') === 'production';

    // HTTPS
    $checks['https'] = str_starts_with($config['APP_URL'] ?? '', 'https://');

    return $checks;
}

// ===== Симуляція deploy =====
$runner = new DeployRunner();

// Крок 1: git pull
$runner->runStep('git pull origin main', function () {
    // Симулюємо git pull
    return ['status' => 'Already up to date.', 'files_changed' => 3];
});

// Крок 2: composer install --no-dev
$runner->runStep('composer install --no-dev', function () {
    // Пропускаємо dev залежності (Telescope, PHPUnit, Faker)
    return ['packages_installed' => 47, 'dev_skipped' => 12];
});

// Крок 3: php artisan migrate --force
$runner->runStep('php artisan migrate --force', function () {
    return ['migrations_run' => 2, 'tables_created' => 0];
});

// Крок 4: php artisan optimize
$runner->runStep('php artisan optimize', function () {
    return [
        'config:cache' => 'cached',
        'route:cache'  => 'cached',
        'view:cache'   => 'cached',
        'event:cache'  => 'cached',
    ];
});

// Крок 5: php artisan queue:restart
$runner->runStep('queue:restart', function () {
    return ['signal' => 'SIGTERM sent to workers'];
});

// ===== Вивід логу =====
echo "=== Deploy Script Output ===\\n\\n";
foreach ($runner->getLog() as $line) {
    echo "{$line}\\n";
}

// ===== Checklist =====
echo "\\n=== Deploy Checklist ===\\n";
foreach ($runner->getChecklist() as $step => $ok) {
    $icon = $ok ? '✓' : '✗';
    echo "  {$icon} {$step}\\n";
}
echo "\\nВсі кроки пройшли: " . ($runner->allPassed() ? 'ТАК' : 'НІ') . "\\n";

// ===== Health Check =====
echo "\\n=== Health Check ===\\n";

$prodConfig = [
    'APP_ENV'        => 'production',
    'APP_DEBUG'      => 'false',
    'APP_KEY'        => 'base64:abc123secretkeyhere==',
    'APP_URL'        => 'https://api.myapp.com',
    'DB_CONNECTION'  => 'mysql',
];

$health = verifyHealth($prodConfig);
foreach ($health as $check => $passed) {
    $icon = $passed ? '✓' : '✗';
    echo "  {$icon} {$check}\\n";
}

$allHealthy = !in_array(false, $health, true);
echo "\\nHealth status: " . ($allHealthy ? 'HEALTHY' : 'UNHEALTHY') . "\\n";

// ===== Перевірка поганого конфігу =====
echo "\\n=== Health Check (BAD config) ===\\n";
$badConfig = [
    'APP_ENV'        => 'local',
    'APP_DEBUG'      => 'true',      // ← НЕБЕЗПЕЧНО!
    'APP_KEY'        => '',           // ← Не встановлений!
    'APP_URL'        => 'http://localhost',  // ← HTTP!
    'DB_CONNECTION'  => 'sqlite',    // ← File locking!
];

$badHealth = verifyHealth($badConfig);
foreach ($badHealth as $check => $passed) {
    $icon = $passed ? '✓' : '✗';
    echo "  {$icon} {$check}\\n";
}
echo "\\nHealth status: " . (!in_array(false, $badHealth, true) ? 'HEALTHY' : 'UNHEALTHY') . "\\n";`

// === Task starter code ===
const taskStarterCode = `<?php
declare(strict_types=1);

/**
 * Завдання: реалізуйте 3 функції для deploy-процесу.
 *
 * 1) deployChecklist(array $config): array
 *    - Приймає конфігурацію (.env масив)
 *    - Повертає масив перевірок:
 *      'debug_disabled'  => bool  (APP_DEBUG === 'false')
 *      'env_production'  => bool  (APP_ENV === 'production')
 *      'key_set'         => bool  (APP_KEY не пустий і починається з 'base64:')
 *      'db_not_sqlite'   => bool  (DB_CONNECTION !== 'sqlite')
 *      'https_enabled'   => bool  (APP_URL починається з 'https://')
 *
 * 2) runDeployStep(string $name, callable $action): array
 *    - Виконує callable
 *    - Повертає ['name' => $name, 'success' => true/false, 'error' => null|string]
 *    - Якщо callable кидає Exception → success=false, error=повідомлення
 *
 * 3) verifyHealth(array $checkResults): array
 *    - Приймає масив від deployChecklist()
 *    - Повертає ['passed' => int, 'failed' => int, 'healthy' => bool]
 *    - healthy = true тільки якщо ВСІ перевірки passed
 */

function deployChecklist(array $config): array {
    // Ваш код тут
    return [];
}

function runDeployStep(string $name, callable $action): array {
    // Ваш код тут
    return [];
}

function verifyHealth(array $checkResults): array {
    // Ваш код тут
    return [];
}`

const taskTestCode = `
// === Авто-тест ===
echo "\\n=== Авто-перевірка ===\\n";
$pass  = 0;
$total = 10;

function check(string $name, bool $ok): void {
    global $pass;
    if ($ok) { $pass++; echo "✓ {$name}\\n"; }
    else     { echo "✗ {$name}\\n"; }
}

// 1. deployChecklist — good config
$good = deployChecklist([
    'APP_DEBUG' => 'false',
    'APP_ENV' => 'production',
    'APP_KEY' => 'base64:abc123==',
    'DB_CONNECTION' => 'mysql',
    'APP_URL' => 'https://myapp.com',
]);
check('Checklist: debug_disabled=true', ($good['debug_disabled'] ?? false) === true);
check('Checklist: env_production=true', ($good['env_production'] ?? false) === true);
check('Checklist: key_set=true', ($good['key_set'] ?? false) === true);
check('Checklist: db_not_sqlite=true', ($good['db_not_sqlite'] ?? false) === true);
check('Checklist: https_enabled=true', ($good['https_enabled'] ?? false) === true);

// 2. deployChecklist — bad config
$bad = deployChecklist([
    'APP_DEBUG' => 'true',
    'APP_ENV' => 'local',
    'APP_KEY' => '',
    'DB_CONNECTION' => 'sqlite',
    'APP_URL' => 'http://localhost',
]);
check('Checklist bad: all false', array_filter($bad) === []);

// 3. runDeployStep — success
$result = runDeployStep('migrate', function () { return 'done'; });
check('DeployStep success: name+success', $result['name'] === 'migrate' && $result['success'] === true && $result['error'] === null);

// 4. runDeployStep — failure
$result2 = runDeployStep('migrate', function () { throw new \\Exception('Connection refused'); });
check('DeployStep fail: success=false, error set', $result2['success'] === false && $result2['error'] === 'Connection refused');

// 5. verifyHealth — all passed
$health = verifyHealth($good);
check('Health: 5 passed, 0 failed, healthy=true', $health['passed'] === 5 && $health['failed'] === 0 && $health['healthy'] === true);

// 6. verifyHealth — all failed
$healthBad = verifyHealth($bad);
check('Health bad: 0 passed, 5 failed, healthy=false', $healthBad['passed'] === 0 && $healthBad['failed'] === 5 && $healthBad['healthy'] === false);

echo "\\nРезультат: {$pass}/{$total}\\n";`
</script>

<template>
  <div class="lesson-content">
    <div v-show="activeTab === 'theory'" class="tab-content">
      <ParallelCard
        from="npm run build + Vercel/Netlify"
        to="composer install --no-dev + php artisan optimize + Forge/VPS"
      />

      <TheoryBlock title="Production Checklist — перші 3 речі">
        <p>
          <strong>APP_DEBUG=false</strong> — найкритичніша настройка. З <code>true</code> Laravel
          показує повний stack trace: SQL-запити, змінні <code>.env</code> (паролі!), шляхи файлів.
          Це золота жила для хакера. <strong>APP_KEY</strong> — унікальний ключ шифрування (сесії,
          cookies). <strong>DB_CONNECTION=mysql</strong> — SQLite не підходить для production через
          file-level locking (один write блокує всю базу).
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="checklistCode"
        lang="bash"
        title="Production .env — обов'язкові налаштування"
      />

      <TheoryBlock title="Оптимізація — php artisan optimize">
        <p>
          <code>php artisan optimize</code> = <code>config:cache</code> + <code>route:cache</code> +
          <code>view:cache</code> + <code>event:cache</code>. Замість десятків PHP-файлів на кожен
          запит Laravel читає один кешований файл. Це як tree-shaking + bundling у Vite.
          <strong>Важливо:</strong> після <code>config:cache</code> зміна <code>.env</code> потребує
          повторного <code>config:cache</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="optimizeCode" lang="bash" title="php artisan optimize — кешування всього" />

      <CodeComparison
        :js="jsVueBuild"
        :php="phpLaravelDeploy"
        js-title="Vue — npm run build + Netlify/Vercel"
        php-title="Laravel — deploy script на сервер"
      />

      <TheoryBlock title="Варіанти деплою — VPS, Forge, Cloud">
        <p>
          <strong>VPS</strong> (DigitalOcean, Hetzner) — повний контроль, Ubuntu + Nginx + PHP-FPM.
          <strong>Laravel Forge</strong> — автоматизує VPS: Nginx, SSL, deploy з GitHub.
          <strong>Laravel Cloud</strong> — managed, auto-scale, як Vercel для PHP.
          <strong>Netlify/Vercel</strong> — тільки для Vue SPA (static hosting). Типова архітектура:
          Vue на Netlify + Laravel API на VPS.
        </p>
      </TheoryBlock>

      <CodeBlock :code="deployOptionsCode" lang="text" title="Порівняння варіантів деплою" />

      <TheoryBlock title="Міграції на production">
        <p>
          <code>php artisan migrate --force</code> — прапорець <code>--force</code> обовʼязковий, бо
          Laravel захищає від випадкового запуску міграцій на production. MySQL/PostgreSQL замість
          SQLite: <code>CREATE DATABASE</code>, окремий юзер (НЕ root), <code>utf8mb4</code> для
          емоджі. <strong>Backup перед міграцією</strong> — <code>mysqldump</code> обовʼязково.
        </p>
      </TheoryBlock>

      <CodeBlock :code="migrationsCode" lang="bash" title="MySQL setup + міграції з --force" />

      <TheoryBlock title="Queue Workers (Supervisor) + Cron">
        <p>
          <strong>Supervisor</strong> — процес-менеджер, який тримає
          <code>queue:work</code> запущеним і перезапускає при падінні. <code>numprocs=2</code> —
          два паралельних воркери. <strong>Cron</strong> — один рядок
          <code>* * * * * php artisan schedule:run</code>, а Laravel сам вирішує які команди
          запускати за розкладом.
        </p>
      </TheoryBlock>

      <CodeBlock
        :code="queueCronCode"
        lang="bash"
        title="Supervisor config + Cron для schedule:run"
      />

      <TheoryBlock title="HTTPS / SSL — Let's Encrypt">
        <p>
          <strong>Let's Encrypt</strong> — безкоштовний SSL-сертифікат.
          <code>certbot</code> автоматично налаштовує Nginx і додає auto-renew у cron. HTTP → HTTPS
          redirect обовʼязковий. Nginx конфіг: <code>try_files</code> для Laravel,
          <code>fastcgi_pass</code> для PHP-FPM, блокування доступу до <code>.env</code> і
          <code>.git</code>.
        </p>
      </TheoryBlock>

      <CodeBlock :code="httpsCode" lang="nginx" title="Let's Encrypt + Nginx config для Laravel" />

      <TheoryBlock title="Моніторинг — Telescope, Logging, Health Checks">
        <p>
          <strong>Telescope</strong> — тільки для dev/staging (зберігає все!).
          <strong>Health check endpoint</strong> — <code>/api/health</code> перевіряє DB, Cache.
          <strong>Логування</strong> — <code>daily</code> channel (14 днів ротація) +
          <code>slack</code> для critical помилок. <code>php artisan pail</code> — real-time
          перегляд логів.
        </p>
      </TheoryBlock>

      <CodeBlock :code="monitoringCode" lang="php" title="Health check + Logging + Telescope" />

      <TheoryBlock title="Що далі? — Roadmap розвитку">
        <p>
          Після курсу: <strong>CI/CD</strong> (GitHub Actions — автоматизувати test + deploy),
          <strong>WebSockets</strong> (Laravel Reverb — real-time), <strong>Inertia.js</strong> (Vue
          + Laravel без REST API), <strong>Horizon</strong> (Redis queue dashboard). Просунутий
          рівень: GraphQL, Docker, Kubernetes.
        </p>
      </TheoryBlock>

      <CodeBlock :code="roadmapCode" lang="text" title="Roadmap — від Junior до Senior" />
    </div>

    <div v-show="activeTab === 'practice'" class="tab-content">
      <TheoryBlock title="Практика: Deploy Script Simulation">
        <p>
          У playground ми <strong>симулюємо deploy-процес</strong> на чистому PHP: 5 кроків (git
          pull, composer install, migrate, optimize, queue:restart) з логуванням та checklist. Потім
          <strong>health check</strong> — перевірка конфігурації: APP_DEBUG, DB_CONNECTION, APP_KEY,
          HTTPS. Порівняйте результат для good і bad конфігурацій.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="practiceCode"
        language="php"
        title="playground/24-deploy-script.php"
      />
    </div>

    <div v-show="activeTab === 'quiz'" class="tab-content">
      <Quiz :questions="quizQuestions" lesson-id="4-24" />
    </div>

    <div v-show="activeTab === 'task'" class="tab-content">
      <TheoryBlock title="Завдання: реалізуйте deployChecklist, runDeployStep, verifyHealth">
        <p>
          Реалізуйте 3 функції: <code>deployChecklist()</code> — перевірка .env конфігурації (5
          перевірок), <code>runDeployStep()</code> — виконання кроку з обробкою помилок,
          <code>verifyHealth()</code> — підсумок перевірок (passed/failed/healthy). Натисніть
          <strong>Запустити</strong> — 10 тестів перевірять коректність.
        </p>
      </TheoryBlock>

      <CodePlayground
        :initial-code="taskStarterCode"
        language="php"
        title="Реалізуйте deploy-функції"
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
