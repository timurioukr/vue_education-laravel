<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import FileTree from '@/components/interactive/FileTree.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import type { TreeNode } from '@/types'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'npm create vue@latest', laravel: 'composer create-project laravel/laravel' },
  { vue: 'npm install', laravel: 'composer install' },
  { vue: 'npm run dev', laravel: 'php artisan serve' },
  { vue: 'src/', laravel: 'app/' },
  { vue: 'stores/ (Pinia)', laravel: 'app/Models/' },
  { vue: 'router/index.ts', laravel: 'routes/web.php' },
  { vue: 'node_modules/', laravel: 'vendor/' },
  { vue: 'package.json', laravel: 'composer.json' },
]

const laravelTree: TreeNode[] = [
  {
    name: 'task-manager',
    type: 'dir',
    children: [
      {
        name: 'app',
        type: 'dir',
        highlight: true,
        children: [
          {
            name: 'Http',
            type: 'dir',
            children: [
              {
                name: 'Controllers',
                type: 'dir',
                highlight: true,
                children: [{ name: 'Controller.php', type: 'file' }],
              },
            ],
          },
          {
            name: 'Models',
            type: 'dir',
            highlight: true,
            children: [{ name: 'User.php', type: 'file' }],
          },
          {
            name: 'Providers',
            type: 'dir',
            children: [{ name: 'AppServiceProvider.php', type: 'file' }],
          },
        ],
      },
      {
        name: 'bootstrap',
        type: 'dir',
        children: [
          { name: 'app.php', type: 'file' },
          { name: 'cache/', type: 'dir' },
        ],
      },
      {
        name: 'config',
        type: 'dir',
        children: [
          { name: 'app.php', type: 'file' },
          { name: 'auth.php', type: 'file' },
          { name: 'database.php', type: 'file', highlight: true },
          { name: 'logging.php', type: 'file' },
        ],
      },
      {
        name: 'database',
        type: 'dir',
        highlight: true,
        children: [
          { name: 'database.sqlite', type: 'file', highlight: true },
          {
            name: 'factories',
            type: 'dir',
            children: [{ name: 'UserFactory.php', type: 'file' }],
          },
          {
            name: 'migrations',
            type: 'dir',
            children: [
              { name: '0001_01_01_000000_create_users_table.php', type: 'file' },
              { name: '0001_01_01_000001_create_cache_table.php', type: 'file' },
              { name: '0001_01_01_000002_create_jobs_table.php', type: 'file' },
            ],
          },
          {
            name: 'seeders',
            type: 'dir',
            children: [{ name: 'DatabaseSeeder.php', type: 'file' }],
          },
        ],
      },
      {
        name: 'public',
        type: 'dir',
        children: [
          { name: 'index.php', type: 'file', highlight: true },
          { name: 'favicon.ico', type: 'file' },
        ],
      },
      {
        name: 'resources',
        type: 'dir',
        children: [
          { name: 'css/', type: 'dir' },
          { name: 'js/', type: 'dir' },
          {
            name: 'views',
            type: 'dir',
            children: [{ name: 'welcome.blade.php', type: 'file' }],
          },
        ],
      },
      {
        name: 'routes',
        type: 'dir',
        highlight: true,
        children: [
          { name: 'web.php', type: 'file', highlight: true },
          { name: 'console.php', type: 'file' },
        ],
      },
      {
        name: 'storage',
        type: 'dir',
        children: [
          { name: 'app/', type: 'dir' },
          { name: 'framework/', type: 'dir' },
          { name: 'logs/', type: 'dir' },
        ],
      },
      {
        name: 'tests',
        type: 'dir',
        children: [
          { name: 'Feature/', type: 'dir' },
          { name: 'Unit/', type: 'dir' },
        ],
      },
      { name: 'vendor/', type: 'dir' },
      { name: '.env', type: 'file', highlight: true },
      { name: 'artisan', type: 'file' },
      { name: 'composer.json', type: 'file', highlight: true },
      { name: 'composer.lock', type: 'file' },
      { name: 'phpunit.xml', type: 'file' },
      { name: 'vite.config.js', type: 'file' },
    ],
  },
]

const serveOutput = [
  '$ php artisan serve',
  '',
  '   INFO  Server running on [http://127.0.0.1:8000].',
  '',
  '  Press Ctrl+C to stop the server',
]
</script>

<template>
  <div class="demo-content">
    <FileTree :tree="laravelTree" :default-expanded="false" />
    <TerminalOutput :lines="serveOutput" title="php artisan serve" />
    <MemoryCard :items="memoryItems" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
