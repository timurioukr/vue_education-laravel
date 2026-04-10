<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'faker.person.name()', laravel: 'fake()->name()' },
  { vue: 'beforeEach()', laravel: 'DatabaseSeeder' },
  { vue: 'factory()', laravel: 'Factory::new()' },
  { vue: 'fixtures/', laravel: 'database/seeders/' },
  { vue: 'mock data', laravel: 'Factory states' },
  { vue: 'faker.helpers.arrayElement()', laravel: 'fake()->randomElement()' },
]

const seedOutput = [
  '$ php artisan migrate:fresh --seed',
  '',
  '  Dropping all tables .................................... 45ms DONE',
  '',
  '  2024_01_01_000001_create_users_table ................... 12ms DONE',
  '  2024_01_01_000002_create_categories_table .............. 8ms DONE',
  '  2024_01_01_000003_create_tasks_table ................... 15ms DONE',
  '  2024_01_01_000004_create_tags_table .................... 6ms DONE',
  '  2024_01_01_000005_create_task_tag_table ................ 9ms DONE',
  '',
  '  Seeding: Database\\Seeders\\CategorySeeder ............... DONE',
  '  Seeding: Database\\Seeders\\TagSeeder .................... DONE',
  '  Seeding: Database\\Seeders\\TaskSeeder ................... DONE',
  '',
  '  Database seeding completed successfully.',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="seedOutput" title="Seeding бази даних" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
