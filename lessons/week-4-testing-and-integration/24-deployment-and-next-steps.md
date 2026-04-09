# Урок 24: Deployment та подальший розвиток

## Що ви вивчите

- Production checklist: що потрібно зробити перед деплоєм Laravel-додатку
- Різниця між development та production середовищами
- Оптимізація: кешування конфігурації, маршрутів, views
- Варіанти деплою: VPS, Laravel Forge, Laravel Cloud, Vercel для Vue SPA
- Налаштування бази даних для production (MySQL/PostgreSQL замість SQLite)
- HTTPS/SSL, environment variables, міграції в production
- Моніторинг та логування
- Roadmap подальшого навчання: WebSockets, Queues, CI/CD та інше

---

## Паралелі з JS/Vue

| Laravel / PHP | Vue / Nuxt / JS | Коментар |
|---|---|---|
| `APP_ENV=production` | `NODE_ENV=production` | Режим, що визначає поведінку додатку |
| `APP_DEBUG=false` | Source maps вимкнені в production | Не показувати деталі помилок юзерам |
| `php artisan optimize` | `npm run build` | Кешування/компіляція для продуктивності |
| `.env` на сервері | `.env.production` у Vite / Vercel Environment Variables | Секрети зберігаються в env, не в коді |
| `php artisan migrate --force` | Database migrations (Prisma, Drizzle) | Зміни схеми БД на production |
| Nginx reverse proxy | Vercel/Netlify CDN | Хто обслуговує запити |
| Supervisor для queue worker | PM2 для Node.js процесів | Демон-менеджер для background процесів |
| Laravel Forge | Vercel / Netlify | Автоматизований деплой |
| Laravel Telescope | Vue DevTools (але для production -- Sentry) | Інструменти дебагу |
| Cron + `schedule:run` | Cron jobs / GitHub Actions scheduled workflows | Періодичні завдання |

---

## Теорія

### 1. Production Checklist

Перед деплоєм на production потрібно пройти цей чек-лист. Кожен пункт -- критично важливий.

#### Environment Variables

```env
# .env (production)

APP_NAME="Task Manager"
APP_ENV=production          # <-- НЕ local!
APP_KEY=base64:...          # <-- згенерований ключ
APP_DEBUG=false             # <-- НЕ true! Інакше юзери бачитимуть stack traces
APP_URL=https://api.yourdomain.com

LOG_CHANNEL=daily           # Логи по днях, а не один файл
LOG_LEVEL=warning           # Тільки warnings та errors

DB_CONNECTION=mysql         # <-- НЕ sqlite для production!
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_manager
DB_USERNAME=task_manager_user
DB_PASSWORD=super_secret_password

CACHE_STORE=redis           # Redis для кешу в production
SESSION_DRIVER=redis        # Redis для сесій
QUEUE_CONNECTION=redis      # Redis для черг

SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

**Чому `APP_DEBUG=false` критичний:**

З `APP_DEBUG=true` у production помилка 500 покаже:
- Повний stack trace з шляхами файлів
- Назви таблиць та SQL-запити
- Environment variables (включно з паролями!)

```json
// APP_DEBUG=true (НЕБЕЗПЕЧНО в production!)
{
    "message": "SQLSTATE[42S02]: Base table or view not found: 1146 Table 'task_manager.taks' doesn't exist",
    "exception": "Illuminate\\Database\\QueryException",
    "file": "/var/www/app/Http/Controllers/TaskController.php",
    "line": 42,
    "trace": [...]
}

// APP_DEBUG=false (правильно для production)
{
    "message": "Server Error."
}
```

#### APP_KEY

Ключ шифрування додатку. Використовується для шифрування cookies, сесій, токенів.

```bash
# Генерація ключа (зробіть це один раз при першому деплої)
php artisan key:generate

# Або скопіюйте значення APP_KEY з .env у нове середовище
```

**Важливо:** якщо змінити APP_KEY в production -- всі існуючі сесії, зашифровані cookies та токени стануть невалідними. Всі користувачі будуть розлогінені.

#### База даних для Production

SQLite -- чудова для розробки та тестів, але для production потрібна "справжня" СУБД:

| Характеристика | SQLite | MySQL/PostgreSQL |
|---|---|---|
| Конкурентний доступ | Обмежений (file lock) | Повний (row-level locking) |
| Масштабування | Один файл, один сервер | Реплікація, кластери |
| Бекапи | Копія файлу | `mysqldump`, point-in-time recovery |
| Продуктивність | Добра для малих обʼємів | Оптимізована для великих обʼємів |
| Хостинг | Тільки локально | Managed services (RDS, PlanetScale) |

```bash
# Встановлення MySQL (macOS)
brew install mysql
brew services start mysql

# Або PostgreSQL
brew install postgresql
brew services start postgresql
```

Створення бази даних для production:

```sql
-- MySQL
CREATE DATABASE task_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'task_manager_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON task_manager.* TO 'task_manager_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### 2. Оптимізація для Production

#### Кешування конфігурації, маршрутів та views

Laravel при кожному запиті читає `.env`, парсить конфігураційні файли, реєструє маршрути. Для production це все можна закешувати:

```bash
# Кеш усього разом (рекомендований спосіб)
php artisan optimize

# Що робить optimize:
# - php artisan config:cache    (кешує config/*.php в один файл)
# - php artisan route:cache     (кешує маршрути в один файл)
# - php artisan view:cache      (компілює Blade-шаблони)
# - php artisan event:cache     (кешує events та listeners)
```

```bash
# Очистити кеш (потрібно при зміні конфігурації)
php artisan optimize:clear
```

**Аналогія з Vue:** `php artisan optimize` -- це як `npm run build` для Vue. Ви компілюєте все один раз, і production-сервер працює з кешованою версією замість парсингу файлів при кожному запиті.

#### Storage Link

Якщо ваш додаток зберігає файли (зображення, вкладення задач):

```bash
# Створює symlink: public/storage -> storage/app/public
php artisan storage:link
```

Без цього публічні файли з `storage` не будуть доступні через HTTP.

#### File Permissions

```bash
# Storage та cache повинні бути writable для веб-сервера
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

### 3. Варіанти Deployment

#### Варіант A: VPS (DigitalOcean, Hetzner)

Ручне налаштування сервера. Дає повний контроль, але вимагає знань Linux.

**Стек:** Ubuntu + Nginx + PHP-FPM + MySQL + Redis

Послідовність:

```bash
# 1. Встановлення PHP та розширень
sudo apt install php8.3-fpm php8.3-mysql php8.3-redis php8.3-xml \
  php8.3-mbstring php8.3-curl php8.3-zip

# 2. Встановлення Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# 3. Встановлення MySQL
sudo apt install mysql-server

# 4. Встановлення Redis
sudo apt install redis-server

# 5. Встановлення Nginx
sudo apt install nginx

# 6. Клонування проєкту
cd /var/www
git clone git@github.com:your-repo/task-manager.git
cd task-manager

# 7. Встановлення залежностей (без dev-пакетів!)
composer install --no-dev --optimize-autoloader

# 8. Налаштування .env
cp .env.example .env
# Відредагуйте .env з production-значеннями

# 9. Генерація ключа
php artisan key:generate

# 10. Міграції
php artisan migrate --force

# 11. Оптимізація
php artisan optimize
php artisan storage:link
```

**Nginx конфігурація:**

```nginx
# /etc/nginx/sites-available/task-manager

server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/task-manager/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
# Активація сайту
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Варіант B: Laravel Forge

**Laravel Forge** (forge.laravel.com) -- це платний сервіс від творців Laravel, який автоматизує налаштування серверів.

Що робить Forge:
- Створює та налаштовує VPS (DigitalOcean, AWS, Hetzner)
- Встановлює PHP, Nginx, MySQL, Redis
- Налаштовує SSL (Lets Encrypt)
- Автоматичний деплой з GitHub (push-to-deploy)
- Управління queue workers та cron
- Моніторинг сервера

```
GitHub push --> Forge webhook --> git pull, composer install,
                                  php artisan migrate --force,
                                  php artisan optimize
```

Для кого: коли хочете VPS-контроль без ручного адміністрування Linux.

#### Варіант C: Laravel Cloud

**Laravel Cloud** (cloud.laravel.com) -- serverless платформа для Laravel від офіційної команди.

Що робить Cloud:
- Автоматичне масштабування (serverless)
- Вбудовані бази даних, Redis, черги
- Zero-downtime deployments
- Інтеграція з GitHub

Для кого: коли не хочете думати про сервери взагалі.

#### Vue SPA: Vercel / Netlify / Cloudflare Pages

Vue SPA -- це статичні файли (HTML, CSS, JS). Їх можна розмістити на CDN:

```bash
# Збірка Vue SPA
cd task-manager-frontend
npm run build
# Створює dist/ з index.html, assets/
```

**Vercel:**

```bash
# Встановіть Vercel CLI
npm i -g vercel

# Деплой
cd task-manager-frontend
vercel
# Vercel автоматично визначить Vite/Vue та налаштує build
```

**Netlify:**

```bash
# netlify.toml у корені Vue-проєкту
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> Redirect `/*` -> `/index.html` потрібен для SPA routing. Без нього при оновленні сторінки `/tasks/5` Netlify поверне 404, бо файлу `tasks/5/index.html` не існує.

**Environment variable для production:**

```env
# Vercel / Netlify Environment Variables (налаштовуються у dashboard)
VITE_API_URL=https://api.yourdomain.com/api
```

---

### 4. Міграції в Production

```bash
# --force потрібен, бо Laravel запитає підтвердження в production
php artisan migrate --force
```

**Правила для production міграцій:**

1. **Ніколи не змінюйте** вже виконану міграцію -- створюйте нову
2. **Тестуйте міграції** локально та на staging перед production
3. **Робіть бекап** бази перед міграцією
4. **Використовуйте `down()`** для можливості rollback

```bash
# Перевірити статус міграцій
php artisan migrate:status

# Rollback останньої міграції (якщо щось пішло не так)
php artisan migrate:rollback
```

---

### 5. Queue Worker та Scheduled Tasks

#### Queue Worker з Supervisor

Якщо ваш додаток використовує черги (email, notifications), потрібен постійно працюючий worker:

```ini
# /etc/supervisor/conf.d/task-manager-worker.conf

[program:task-manager-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/task-manager/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/task-manager/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start task-manager-worker:*
```

#### Scheduled Tasks з Cron

```bash
# Додайте до crontab веб-сервера
# crontab -e -u www-data

* * * * * cd /var/www/task-manager && php artisan schedule:run >> /dev/null 2>&1
```

Це запускає Laravel scheduler щохвилини. Конкретні задачі визначаються у `routes/console.php`:

```php
// routes/console.php

use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::command('queue:prune-batches --hours=48')->daily();
```

---

### 6. HTTPS/SSL

Для production HTTPS обовʼязковий. Використовуйте Lets Encrypt (безкоштовний):

```bash
# Certbot (Lets Encrypt клієнт)
sudo apt install certbot python3-certbot-nginx

# Отримання сертифіката
sudo certbot --nginx -d api.yourdomain.com

# Автоматичне оновлення (certbot додає cron автоматично)
sudo certbot renew --dry-run
```

Після налаштування SSL оновіть `.env`:

```env
APP_URL=https://api.yourdomain.com
```

І CORS конфігурацію:

```php
// config/cors.php
'allowed_origins' => [
    'https://yourdomain.com',        // Production Vue SPA
    'http://localhost:5173',          // Локальна розробка
],
```

---

### 7. Моніторинг

#### Laravel Telescope (для development/staging)

Telescope -- це дебаг-панель для Laravel. Показує запити, запити до БД, черги, логи.

```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

> Telescope використовується тільки в development/staging. В production використовуйте зовнішні інструменти.

#### Логування

```php
// config/logging.php -- для production використовуйте 'daily' або 'stack'

'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'warning'), // Тільки warning+
        'days' => 14,  // Зберігати логи 14 днів
    ],
],
```

#### Health Check для моніторингу

Ваш health check endpoint з Уроку 22 (`GET /api/health`) -- використовуйте його з зовнішнім сервісом моніторингу:

- **Uptime Robot** (uptimerobot.com) -- безкоштовний, перевіряє кожні 5 хвилин
- **Better Uptime** (betteruptime.com) -- сповіщення в Slack/Telegram
- Налаштуйте перевірку `https://api.yourdomain.com/api/health`, очікуючи `"status": "ok"`

---

### 8. Що далі: Roadmap подальшого навчання

Ви вже маєте повноцінний API з автентифікацією, авторизацією, валідацією, тестами та Vue SPA. Ось напрямки подальшого розвитку:

#### Real-time: WebSockets та Broadcasting

```
Користувач A створює задачу --> Laravel Event --> WebSocket --> Vue SPA Користувача B оновлюється
```

- **Laravel Reverb** -- офіційний WebSocket-сервер Laravel
- **Laravel Echo** -- JavaScript-бібліотека для підписки на events на фронтенді
- **Broadcasting** -- механізм надсилання events по WebSocket каналах

```php
// Laravel: Event
class TaskCreated implements ShouldBroadcast
{
    public function __construct(public Task $task) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('user.' . $this->task->user_id);
    }
}
```

```typescript
// Vue: підписка на event
import Echo from 'laravel-echo'

echo.private(`user.${userId}`)
  .listen('TaskCreated', (event) => {
    taskStore.tasks.unshift(event.task)
  })
```

#### Laravel Horizon (Redis Queue Dashboard)

Якщо ви використовуєте Redis для черг, Horizon дає веб-інтерфейс для моніторингу:

```bash
composer require laravel/horizon
php artisan horizon:install
```

#### Inertia.js -- SSR без SPA

Inertia.js дозволяє писати "SPA-подібний" додаток, де Vue компоненти рендеряться на сервері через Laravel:

```php
// Laravel контролер
return inertia('Tasks/Index', [
    'tasks' => TaskResource::collection($tasks),
]);
```

Переваги: SEO, швидший перший рендер, єдиний деплой. Мінуси: тісна звʼязка фронтенду з бекендом.

#### CI/CD з GitHub Actions

Автоматичні тести та деплой при кожному push:

```yaml
# .github/workflows/deploy.yml
name: Test and Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
      - run: composer install --no-dev
      - run: php artisan test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          ssh deploy@your-server "cd /var/www/task-manager && git pull && composer install --no-dev && php artisan migrate --force && php artisan optimize"
```

#### Інші напрямки

| Тема | Опис | Коли вивчати |
|---|---|---|
| **GraphQL (Lighthouse)** | Альтернатива REST, клієнт запитує тільки потрібні поля | Коли REST стає обмеженням |
| **Multi-tenancy** | Один додаток для кількох клієнтів/організацій | Для SaaS-продуктів |
| **Microservices** | Розділення моноліту на окремі сервіси | Коли моноліт стає надто великим |
| **Sanctum SPA Auth** | Cookie-based auth замість token-based | Для SPA на тому ж домені |
| **Laravel Pulse** | Моніторинг продуктивності в реальному часі | Для production optimization |
| **Laravel Pennant** | Feature flags -- вмикання/вимикання функцій для різних юзерів | Для поступового розгортання фіч |

#### Рекомендовані ресурси

- **Офіційна документація**: laravel.com/docs -- найкращий ресурс, завжди актуальний
- **Laracasts**: laracasts.com -- відео-курси від Jeffrey Way (платно, але варто)
- **Laravel News**: laravel-news.com -- новини та туторіали
- **Laravel Daily**: youtube.com/@LaravelDaily -- практичні відео від Povilas Korop

---

## Практика: крок за кроком

### Production Checklist -- пройдіть кожен пункт

#### Крок 1: Перевірте Environment

```bash
# Поточний режим
php artisan env
# Очікуємо: local (для розробки)

# Перевірте, що APP_KEY існує
php artisan env:show APP_KEY
# Очікуємо: base64:... (не порожнє)
```

#### Крок 2: Згенеруйте optimized cache

```bash
# Кешуйте все
php artisan optimize

# Перевірте, що кеш створено
ls bootstrap/cache/
# Очікуємо: config.php, routes-v7.php, events.php, ...
```

#### Крок 3: Перевірте production-ready конфігурацію

```bash
# Перевірте, що всі тести проходять
php artisan test
# Очікуємо: всі тести зелені

# Перевірте маршрути
php artisan route:list --compact
# Очікуємо: всі маршрути відображаються

# Перевірте health check
php artisan serve &
curl -s http://localhost:8000/api/health | jq
# Очікуємо: { "status": "ok" }
```

#### Крок 4: Зберіть Vue SPA для production

```bash
cd task-manager-frontend

# Створіть .env.production
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production

# Build
npm run build

# Перевірте результат
ls dist/
# Очікуємо: index.html, assets/

# Розмір бандлу
du -sh dist/
# Очікуємо: кілька MB максимум
```

#### Крок 5: Створіть deployment script

Створіть `deploy.sh` у корені Laravel-проєкту:

```bash
#!/bin/bash
# deploy.sh -- скрипт деплою Laravel

set -e  # Зупинити при помилці

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
composer install --no-dev --optimize-autoloader

echo "Running migrations..."
php artisan migrate --force

echo "Optimizing..."
php artisan optimize

echo "Restarting queue workers..."
php artisan queue:restart

echo "Deployment complete!"
```

```bash
chmod +x deploy.sh
```

---

## Перевірка

```bash
# 1. Кеш створено
php artisan optimize
# Очікуємо: без помилок

# 2. Тести проходять
php artisan test
# Очікуємо: Tests: XX passed

# 3. Vue SPA збирається
cd task-manager-frontend && npm run build
# Очікуємо: dist/ створено без помилок

# 4. Health check працює
curl -s http://localhost:8000/api/health | jq '.status'
# Очікуємо: "ok"
```

---

## Міні-тест

**1. Чому `APP_DEBUG=false` обовʼязковий у production?**

a) Щоб додаток працював швидше
b) Щоб не показувати юзерам stack traces з шляхами файлів, SQL-запитами та env-змінними
c) Без цього Laravel не стартує в production
d) Щоб вимкнути логування

**2. Що робить `php artisan optimize`?**

a) Видаляє невикористаний код
b) Мінімізує PHP-файли
c) Кешує конфігурацію, маршрути, views та events для швидшого завантаження
d) Оптимізує базу даних

**3. Чому SQLite не рекомендується для production?**

a) SQLite не підтримує SQL-запити
b) SQLite має обмежений конкурентний доступ (file lock), не масштабується та не має managed hosting
c) SQLite не працює з Laravel
d) SQLite не підтримує міграції

**4. Навіщо потрібен redirect `/*` -> `/index.html` при деплої Vue SPA на Netlify?**

a) Для SEO-оптимізації
b) Для кешування
c) Щоб SPA routing працював -- при оновленні сторінки `/tasks/5` сервер повертав `index.html`, а Vue Router обробляв шлях
d) Для HTTPS

**5. Що робить `composer install --no-dev`?**

a) Встановлює всі пакети, включно з dev
b) Встановлює тільки production-залежності, без dev-пакетів (Telescope, PHPUnit, Faker)
c) Не встановлює нічого
d) Видаляє всі залежності

---

## Практичне завдання

Підготуйте повний deployment plan для вашого Task Manager:

### Вимоги

1. **Створіть файл `DEPLOYMENT.md`** у корені Laravel-проєкту з:
   - Production environment variables (шаблон .env.production)
   - Кроки деплою (послідовність команд)
   - Rollback план (що робити, якщо деплой зламав додаток)

2. **Створіть `deploy.sh`** скрипт, що:
   - Робить `git pull`
   - Встановлює залежності
   - Виконує міграції
   - Очищує та перестворює кеш
   - Перезапускає queue workers

3. **Зберіть Vue SPA** для production (`npm run build`)

4. **Перевірте**, що після `php artisan optimize` додаток працює коректно (тести проходять, endpoints відповідають)

### Перевірка

```bash
# Deploy script існує і executable
test -x deploy.sh && echo "OK" || echo "FAIL"

# Vue SPA зібрано
test -d task-manager-frontend/dist && echo "OK" || echo "FAIL"

# Laravel optimized
php artisan optimize && echo "OK" || echo "FAIL"

# Тести проходять
php artisan test && echo "OK" || echo "FAIL"
```

---

## Відповіді на тест

1. **b)** З `APP_DEBUG=true` Laravel показує детальні помилки: stack traces, шляхи до файлів, SQL-запити, і навіть environment variables. Це серйозна вразливість безпеки. В production завжди `APP_DEBUG=false`.
2. **c)** `php artisan optimize` кешує конфігурацію (один файл замість десятків), маршрути (серіалізований масив замість реєстрації при кожному запиті), views (pre-compiled Blade templates) та events. Це значно прискорює завантаження додатку.
3. **b)** SQLite використовує file-level locking, що обмежує конкурентний доступ. При кількох одночасних запитах на запис -- один чекатиме іншого. Також SQLite не має managed hosting (AWS RDS, PlanetScale), реплікації та point-in-time recovery.
4. **c)** Vue SPA -- це один файл `index.html` з JavaScript, який обробляє маршрутизацію. Коли юзер оновлює сторінку `/tasks/5`, браузер запитує цей шлях у сервера. Без redirect сервер поверне 404, бо файлу `tasks/5/index.html` не існує. Redirect повертає `index.html`, і Vue Router розбирає шлях.
5. **b)** `--no-dev` виключає пакети з `require-dev` у `composer.json`: PHPUnit, Faker, Telescope, IDE Helper тощо. Це зменшує розмір деплою та усуває непотрібний код з production.
