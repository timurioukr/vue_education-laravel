<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'vi.mock(module)', laravel: 'Event::fake() / Notification::fake()' },
  { vue: 'expect(fn).toHaveBeenCalled()', laravel: 'Event::assertDispatched(Class)' },
  { vue: 'vi.spyOn(service, method)', laravel: 'Notification::assertSentTo($user, Class)' },
  { vue: 'vi.mock("fs")', laravel: "Storage::fake('public')" },
  { vue: 'Pinia getter unit test', laravel: 'Task::overdue()->get() (scope test)' },
  { vue: 'guard / middleware test', laravel: 'new TaskPolicy() → view/update/delete' },
]

const curlOutput = [
  '$ php artisan test tests/Unit/Models/TaskTest.php',
  '',
  '  PASS  Tests\\Unit\\Models\\TaskTest',
  '  ✓ it returns only overdue non-done tasks                     0.08s',
  '  ✓ it filters by pending status                                0.05s',
  '  ✓ it searches in title and description (case-insensitive)     0.06s',
  '',
  '$ php artisan test tests/Unit/Policies/TaskPolicyTest.php',
  '',
  '  PASS  Tests\\Unit\\Policies\\TaskPolicyTest',
  '  ✓ it allows owner to view                                     0.04s',
  '  ✓ it denies stranger from viewing                             0.03s',
  '  ✓ it allows owner to update                                   0.03s',
  '  ✓ it denies stranger from updating                            0.03s',
  '  ✓ it allows owner to delete                                   0.03s',
  '  ✓ it denies stranger from deleting                            0.03s',
  '',
  '$ php artisan test tests/Unit/Observers/TaskObserverTest.php',
  '',
  '  PASS  Tests\\Unit\\Observers\\TaskObserverTest',
  '  ✓ it fires TaskCompleted when status → done                   0.06s',
  '  ✓ it does NOT fire TaskCompleted for title change             0.04s',
  '  ✓ it does NOT fire for status → in_progress                   0.04s',
  '',
  '  Tests:    12 passed (18 assertions)',
  '  Duration: 0.52s',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Unit tests — scopes, policy, observer fakes" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
