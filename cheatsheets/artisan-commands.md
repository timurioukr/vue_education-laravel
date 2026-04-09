# Artisan Commands: шпаргалка

Artisan -- це CLI-інструмент Laravel. Аналог того, як Vue CLI або Nuxt CLI генерують компоненти та запускають проєкт, тільки для бекенду.

Запуск: `php artisan <команда>`

Довідка по будь-якій команді: `php artisan <команда> --help`

---

## Проєкт

| Команда | Опис |
|---|---|
| `php artisan serve` | Запустити dev-сервер (як `npm run dev`) |
| `php artisan serve --port=8080` | Запустити на іншому порті |
| `php artisan about` | Інформація про проєкт: версія Laravel, PHP, драйвери БД, кеш |
| `php artisan env` | Показати поточне середовище (local, production) |
| `php artisan key:generate` | Згенерувати APP_KEY для шифрування (робиться один раз при створенні проєкту) |

```bash
# Створити новий проєкт (через Composer, не Artisan)
composer create-project laravel/laravel my-project
cd my-project
php artisan serve
# Відкрити http://localhost:8000
```

---

## Make: генерація коду

Головна суперсила Artisan -- генерація файлів. Як Vue CLI генерує компоненти, так Artisan генерує моделі, контролери, міграції.

### Моделі та база даних

| Команда | Опис |
|---|---|
| `php artisan make:model Task` | Створити модель (як створити інтерфейс сутності в TypeScript) |
| `php artisan make:model Task -m` | Модель + міграція (найчастіший варіант) |
| `php artisan make:model Task -mfsc` | Модель + міграція + сідер + контролер (все одразу) |
| `php artisan make:migration create_tasks_table` | Створити міграцію (версіонування схеми БД) |
| `php artisan make:factory TaskFactory` | Фабрика для генерації тестових даних |
| `php artisan make:seeder TaskSeeder` | Сідер для наповнення БД початковими даними |

```bash
# Найчастіше використовуваний варіант -- модель з усім необхідним:
php artisan make:model Task -mfsc
# Створить:
#   app/Models/Task.php
#   database/migrations/xxxx_create_tasks_table.php
#   database/factories/TaskFactory.php
#   database/seeders/TaskSeeder.php
#   app/Http/Controllers/TaskController.php
```

### Контролери та HTTP

| Команда | Опис |
|---|---|
| `php artisan make:controller TaskController` | Звичайний контролер |
| `php artisan make:controller TaskController --resource` | REST-контролер з усіма CRUD-методами |
| `php artisan make:controller TaskController --api` | API-контролер (без create/edit -- бо Vue рендерить форми) |
| `php artisan make:resource TaskResource` | API Resource -- формат JSON-відповіді (як DTO/serializer) |
| `php artisan make:resource TaskCollection --collection` | Ресурс для колекції (список задач) |
| `php artisan make:request StoreTaskRequest` | Form Request -- клас для валідації вхідних даних |
| `php artisan make:middleware CheckAdmin` | Middleware -- перехоплювач запитів (як navigation guard у Vue Router) |

```bash
# API-контролер з прив'язкою до моделі:
php artisan make:controller Api/TaskController --api --model=Task
```

### Авторизація та безпека

| Команда | Опис |
|---|---|
| `php artisan make:policy TaskPolicy` | Policy -- правила доступу (хто може редагувати задачу) |
| `php artisan make:policy TaskPolicy --model=Task` | Policy з готовими методами для моделі |

### Події та черги

| Команда | Опис |
|---|---|
| `php artisan make:event TaskCreated` | Подія (як emit в Vue) |
| `php artisan make:listener SendTaskNotification` | Слухач події (як on/watch у Vue) |
| `php artisan make:listener SendTaskNotification --event=TaskCreated` | Слухач прив'язаний до конкретної події |
| `php artisan make:job ProcessTaskReminder` | Job -- фонова задача для черги |
| `php artisan make:notification TaskDeadlineNotification` | Нотифікація (email, SMS, Slack тощо) |

### Інше

| Команда | Опис |
|---|---|
| `php artisan make:command SendDailyReport` | Консольна команда (як npm-скрипт) |
| `php artisan make:test TaskTest` | Feature-тест |
| `php artisan make:test TaskTest --unit` | Unit-тест |
| `php artisan make:rule Uppercase` | Кастомне правило валідації |
| `php artisan make:cast Json` | Кастомний cast для Eloquent |
| `php artisan make:enum TaskStatus` | Enum (PHP 8.1+) |

---

## База даних

| Команда | Опис |
|---|---|
| `php artisan migrate` | Запустити всі нові міграції |
| `php artisan migrate --seed` | Міграції + наповнити тестовими даними |
| `php artisan migrate:rollback` | Відкотити останню групу міграцій |
| `php artisan migrate:rollback --step=3` | Відкотити 3 останні міграції |
| `php artisan migrate:fresh` | Видалити ВСІ таблиці та запустити міграції заново |
| `php artisan migrate:fresh --seed` | Те саме + наповнити тестовими даними (найчастіше під час розробки) |
| `php artisan migrate:status` | Показати статус кожної міграції (запущена чи ні) |
| `php artisan db:seed` | Запустити всі сідери |
| `php artisan db:seed --class=TaskSeeder` | Запустити конкретний сідер |
| `php artisan db:show` | Інформація про базу даних |
| `php artisan db:table tasks` | Показати структуру таблиці tasks |

```bash
# Типовий workflow під час розробки:
php artisan migrate:fresh --seed
# Це як "скинути базу і почати заново" -- зручно для розробки
```

> **Увага:** `migrate:fresh` видаляє ВСІ дані. Ніколи не використовуйте на production!

---

## Роутинг

| Команда | Опис |
|---|---|
| `php artisan route:list` | Показати всі зареєстровані маршрути (як Vue Router routes) |
| `php artisan route:list --path=api` | Тільки API-маршрути |
| `php artisan route:list --method=GET` | Тільки GET-маршрути |
| `php artisan route:list --name=task` | Пошук по імені маршруту |
| `php artisan route:cache` | Кешувати маршрути (для production) |
| `php artisan route:clear` | Очистити кеш маршрутів |

```bash
# Подивитись всі API ендпоінти:
php artisan route:list --path=api --columns=method,uri,name,action
```

---

## Кеш та оптимізація

| Команда | Опис |
|---|---|
| `php artisan cache:clear` | Очистити кеш додатку |
| `php artisan config:cache` | Кешувати конфігурацію (для production) |
| `php artisan config:clear` | Очистити кеш конфігурації |
| `php artisan view:cache` | Кешувати скомпільовані шаблони |
| `php artisan view:clear` | Очистити кеш шаблонів |
| `php artisan optimize` | Кешувати конфігурацію, маршрути, шаблони одразу |
| `php artisan optimize:clear` | Очистити весь кеш (конфіг, маршрути, шаблони, кеш додатку) |

```bash
# Коли щось працює дивно під час розробки -- очистити все:
php artisan optimize:clear
# Це як "видалити node_modules і встановити заново" :)
```

---

## Черги (Queues)

| Команда | Опис |
|---|---|
| `php artisan queue:work` | Запустити обробник черги (як окремий процес) |
| `php artisan queue:work --tries=3` | Максимум 3 спроби при помилці |
| `php artisan queue:listen` | Те саме, але перезапускається при зміні коду (для розробки) |
| `php artisan queue:retry all` | Повторити всі провалені задачі |
| `php artisan queue:retry <id>` | Повторити конкретну задачу |
| `php artisan queue:failed` | Показати список провалених задач |
| `php artisan queue:flush` | Видалити всі провалені задачі |

```bash
# Під час розробки -- запустити обробник в окремому терміналі:
php artisan queue:listen
# Він автоматично підхоплює зміни в коді
```

---

## Інші корисні команди

| Команда | Опис |
|---|---|
| `php artisan tinker` | Інтерактивна PHP-консоль з доступом до всього додатку (як DevTools Console) |
| `php artisan schedule:list` | Показати всі заплановані задачі (cron) |
| `php artisan schedule:run` | Виконати заплановані задачі (звичайно запускається через cron) |
| `php artisan storage:link` | Створити символічне посилання для публічних файлів |
| `php artisan install:api` | Встановити Sanctum для API-автентифікації (Laravel 11+) |
| `php artisan test` | Запустити тести (як `npm run test`) |
| `php artisan test --filter=TaskTest` | Запустити конкретний тест |
| `php artisan test --parallel` | Запустити тести паралельно (швидше) |

```bash
# Tinker -- найкрутіший інструмент для швидких експериментів:
php artisan tinker

# В tinker можна робити все:
>>> User::count()
=> 42
>>> Task::where('status', 'pending')->get()
>>> $user = User::factory()->create()
>>> $user->tasks()->create(['title' => 'Test'])
```

> **Зверни увагу:** `php artisan tinker` -- це як консоль браузера для бекенду. Можна виконувати будь-який PHP/Laravel-код в реальному часі. Дуже зручно для тестування Eloquent-запитів.

---

## Шпаргалка: найчастіші команди

```bash
# Розробка
php artisan serve                    # запустити сервер
php artisan tinker                   # інтерактивна консоль
php artisan route:list --path=api    # переглянути API-маршрути
php artisan optimize:clear           # очистити весь кеш

# Створення нового ресурсу
php artisan make:model Post -mfsc    # модель + міграція + фабрика + сідер + контролер
php artisan make:request StorePostRequest  # валідація
php artisan make:resource PostResource     # формат JSON-відповіді
php artisan make:policy PostPolicy --model=Post  # авторизація

# База даних
php artisan migrate                  # застосувати міграції
php artisan migrate:fresh --seed     # скинути БД і наповнити тестовими даними
php artisan db:seed                  # наповнити тестовими даними

# Тестування
php artisan test                     # запустити всі тести
php artisan test --filter=PostTest   # конкретний тест
```
