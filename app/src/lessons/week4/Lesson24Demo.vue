<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'npm run build → dist/', laravel: 'php artisan optimize → bootstrap/cache/' },
  { vue: 'Netlify _redirects: /* → index.html', laravel: 'Nginx try_files → /index.php' },
  { vue: 'VITE_API_URL (env prefix)', laravel: '.env → config:cache (серверний)' },
  { vue: 'npm ci --omit=dev', laravel: 'composer install --no-dev' },
  { vue: 'Vercel auto-deploy on push', laravel: 'Forge / GitHub Actions → deploy.sh' },
  { vue: 'localStorage (client state)', laravel: 'Redis / MySQL (server state + queue)' },
]

const deployOutput = [
  '$ bash deploy.sh',
  '',
  '[DEPLOY] Запуск: git pull origin main...',
  'Already up to date.',
  '[  OK  ] git pull origin main',
  '',
  '[DEPLOY] Запуск: composer install --no-dev...',
  'Installing dependencies from lock file',
  'Nothing to install, update or remove',
  'Generating optimized autoload files',
  '[  OK  ] composer install --no-dev --optimize-autoloader',
  '',
  '[DEPLOY] Запуск: php artisan migrate --force...',
  'Nothing to migrate.',
  '[  OK  ] php artisan migrate --force',
  '',
  '[DEPLOY] Запуск: php artisan optimize...',
  '   INFO  Caching framework bootstrap, config, routes, views, and events.',
  '',
  '  config ...... 125ms DONE',
  '  events ......  12ms DONE',
  '  routes ......  18ms DONE',
  '  views .......  84ms DONE',
  '',
  '[  OK  ] php artisan optimize',
  '',
  '[DEPLOY] Запуск: php artisan queue:restart...',
  '   INFO  Broadcasting queue restart signal.',
  '[  OK  ] php artisan queue:restart',
  '',
  '=== Deploy Checklist ===',
  '  ✓ git pull origin main',
  '  ✓ composer install --no-dev',
  '  ✓ php artisan migrate --force',
  '  ✓ php artisan optimize',
  '  ✓ php artisan queue:restart',
  '',
  'Deploy completed successfully!',
]

const nginxOutput = [
  '$ cat /etc/nginx/sites-available/taskapp',
  '',
  'server {',
  '    listen 443 ssl;',
  '    server_name api.taskapp.com;',
  '',
  '    ssl_certificate     /etc/letsencrypt/live/api.taskapp.com/fullchain.pem;',
  '    ssl_certificate_key /etc/letsencrypt/live/api.taskapp.com/privkey.pem;',
  '',
  '    root /var/www/taskapp/public;',
  '    index index.php;',
  '',
  '    add_header X-Frame-Options "SAMEORIGIN";',
  '    add_header X-Content-Type-Options "nosniff";',
  '',
  '    location / {',
  '        try_files $uri $uri/ /index.php?$query_string;',
  '    }',
  '',
  '    location ~ \\.php$ {',
  '        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;',
  '        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;',
  '        include fastcgi_params;',
  '    }',
  '',
  '    location ~ /\\.(?!well-known).* {',
  '        deny all;',
  '    }',
  '}',
]

const scheduleOutput = [
  '$ php artisan schedule:list',
  '',
  '  +-----------------------+-------------+-------------------------+',
  '  | Command               | Interval    | Next Due                |',
  '  +-----------------------+-------------+-------------------------+',
  '  | overdue:notify        | Daily 09:00 | 2026-04-14 09:00:00     |',
  '  | telescope:prune       | Daily 00:00 | 2026-04-14 00:00:00     |',
  '  | backup:run            | Weekly Mon  | 2026-04-20 03:00:00     |',
  '  | queue:prune-batches   | Daily 00:00 | 2026-04-14 00:00:00     |',
  '  +-----------------------+-------------+-------------------------+',
  '',
  '$ sudo supervisorctl status',
  '  taskapp-worker:taskapp-worker_00   RUNNING   pid 1234, uptime 3 days',
  '  taskapp-worker:taskapp-worker_01   RUNNING   pid 1235, uptime 3 days',
  '',
  '$ curl -s https://api.taskapp.com/api/health | jq',
  '{',
  '  "status": "ok",',
  '  "time": "2026-04-13T12:00:00.000000Z",',
  '  "db": "connected",',
  '  "cache": "working",',
  '  "version": "1.0.0"',
  '}',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="deployOutput" title="deploy.sh — автоматизований деплой Laravel" />
    <TerminalOutput :lines="nginxOutput" title="Nginx config — SSL + PHP-FPM + security headers" />
    <TerminalOutput :lines="scheduleOutput" title="schedule:list + supervisor + health check" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
