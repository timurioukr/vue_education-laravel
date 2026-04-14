<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  {
    vue: "it('renders tasks', () => {...})",
    laravel: "it('returns list of tasks', function () {...})",
  },
  { vue: 'expect(result).toHaveLength(5)', laravel: "->assertJsonCount(5, 'data')" },
  { vue: 'describe / beforeEach / it', laravel: 'describe / beforeEach / it — той самий API' },
  { vue: 'vi.mock(authStore)', laravel: '$this->actingAs($user)' },
  { vue: 'const mockTask = {...}', laravel: 'Task::factory()->create()' },
  { vue: 'it.each(datasets)', laravel: "it('...')->with([datasets])" },
]

const curlOutput = [
  '$ php artisan test',
  '',
  '  PASS  Tests\\Feature\\TaskControllerTest',
  '  ✓ it returns paginated list of own tasks              0.15s',
  '  ✓ it does not return tasks of other users              0.08s',
  '  ✓ it filters tasks by status                           0.07s',
  '  ✓ it requires authentication                           0.03s',
  '  ✓ it creates task with valid data                      0.08s',
  '  ✓ it rejects task with invalid data                    0.05s',
  '  ✓ it rejects invalid data (missing title)              0.04s',
  '  ✓ it rejects invalid data (title too long)             0.04s',
  '  ✓ it rejects invalid data (invalid status)             0.04s',
  '  ✓ it returns own task                                  0.06s',
  '  ✓ it forbids access to others task                     0.05s',
  '  ✓ it updates own task                                  0.07s',
  '  ✓ it forbids updating others task                      0.05s',
  '  ✓ it deletes own task                                  0.05s',
  '  ✓ it forbids deleting others task                      0.05s',
  '',
  '  PASS  Tests\\Feature\\AuthControllerTest',
  '  ✓ it registers user with valid data                    0.10s',
  '  ✓ it rejects registration with existing email          0.06s',
  '  ✓ it logs in with valid credentials                    0.06s',
  '  ✓ it rejects invalid credentials                       0.05s',
  '',
  '  Tests:    19 passed (48 assertions)',
  '  Duration: 1.42s',
  '',
  '# Запуск одного тесту:',
  '$ php artisan test --filter="forbids updating others"',
  '  ✓ it forbids updating others task',
  '  Tests:    1 passed (2 assertions)',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="php artisan test — 19 passed, 0 failed" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
