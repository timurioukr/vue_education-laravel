<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import FileTree from '@/components/interactive/FileTree.vue'
import type { TreeNode } from '@/types'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'let/const', laravel: '$variable' },
  { vue: '{key: val}', laravel: "['key' => val]" },
  { vue: '(x) => x*2', laravel: 'fn($x) => $x*2' },
  { vue: 'console.log', laravel: 'echo / var_dump' },
  { vue: 'arr.map(fn)', laravel: 'array_map(fn, $arr)' },
  { vue: 'str.includes()', laravel: 'str_contains()' },
  { vue: '`Hello ${name}`', laravel: '"Hello $name"' },
  { vue: '+ (concat)', laravel: '. (concat)' },
]

const phpProject: TreeNode[] = [
  {
    name: 'playground',
    type: 'dir',
    children: [
      { name: '00-hello.php', type: 'file' },
      { name: '01-basics.php', type: 'file', highlight: true },
      { name: '01-task-functions.php', type: 'file', highlight: true },
    ],
  },
  {
    name: 'task-manager',
    type: 'dir',
    children: [
      {
        name: 'app',
        type: 'dir',
        children: [
          { name: 'Models/', type: 'dir' },
          { name: 'Http/', type: 'dir' },
        ],
      },
      { name: 'routes/', type: 'dir' },
      { name: 'composer.json', type: 'file' },
      { name: '.env', type: 'file' },
    ],
  },
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <FileTree :tree="phpProject" :default-expanded="true" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
