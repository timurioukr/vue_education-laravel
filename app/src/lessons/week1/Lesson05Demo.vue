<script setup lang="ts">
import FileTree from '@/components/interactive/FileTree.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import type { TreeNode } from '@/types'

const migrationTree: TreeNode[] = [
  {
    name: 'database',
    type: 'dir',
    children: [
      {
        name: 'migrations',
        type: 'dir',
        children: [
          { name: '0001_01_01_000000_create_users_table.php', type: 'file' },
          { name: '0001_01_01_000001_create_cache_table.php', type: 'file' },
          { name: '0001_01_01_000002_create_jobs_table.php', type: 'file' },
          { name: '2026_04_09_120001_create_categories_table.php', type: 'file', highlight: true },
          { name: '2026_04_09_120002_create_tasks_table.php', type: 'file', highlight: true },
          { name: '2026_04_09_120003_create_tags_table.php', type: 'file', highlight: true },
          { name: '2026_04_09_120004_create_task_tag_table.php', type: 'file', highlight: true },
        ],
      },
      { name: 'database.sqlite', type: 'file' },
    ],
  },
]

const dbTableLines = [
  '$ php artisan db:table tasks',
  '',
  '  tasks',
  '',
  '  Column .............. Type .............. Modifiers',
  '  id .................. integer ........... autoincrement',
  '  title ............... varchar ...........',
  '  description ......... text .............. nullable',
  '  status .............. varchar ........... default: \'pending\'',
  '  priority ............ integer ........... default: 0',
  '  deadline ............ date .............. nullable',
  '  user_id ............. integer ...........',
  '  category_id ......... integer ........... nullable',
  '  created_at .......... datetime .......... nullable',
  '  updated_at .......... datetime .......... nullable',
  '  deleted_at .......... datetime .......... nullable',
]

const memoryItems = [
  { vue: 'interface Task { id: number }', laravel: '$table->id()' },
  { vue: 'title: string', laravel: "$table->string('title')" },
  { vue: 'description?: string', laravel: "$table->text('description')->nullable()" },
  { vue: "status = 'pending'", laravel: "$table->string('status')->default('pending')" },
  { vue: 'git commit', laravel: 'php artisan migrate' },
  { vue: 'git revert', laravel: 'php artisan migrate:rollback' },
]
</script>

<template>
  <div class="demo-blocks">
    <h3 class="demo-title">Структура файлів міграцій</h3>
    <FileTree :tree="migrationTree" :default-expanded="true" />

    <h3 class="demo-title">Структура таблиці tasks</h3>
    <TerminalOutput :lines="dbTableLines" title="php artisan db:table tasks" />

    <h3 class="demo-title">Порівняння типів</h3>
    <MemoryCard :items="memoryItems" />
  </div>
</template>

<style scoped>
.demo-blocks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
