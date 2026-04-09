<script setup lang="ts">
import { ref } from 'vue'
import type { TreeNode } from '@/types'

const props = withDefaults(defineProps<{
  tree: TreeNode[]
  defaultExpanded?: boolean
  depth?: number
}>(), {
  defaultExpanded: false,
  depth: 0,
})

const expanded = ref<Record<string, boolean>>({})

function isExpanded(name: string): boolean {
  return expanded.value[name] ?? props.defaultExpanded
}

function toggle(name: string) {
  expanded.value[name] = !isExpanded(name)
}
</script>

<template>
  <div class="file-tree" :class="{ root: depth === 0 }">
    <div
      v-for="node in tree"
      :key="node.name"
      class="tree-node"
    >
      <div
        class="node-row"
        :class="{ highlight: node.highlight }"
        :style="{ paddingLeft: depth * 20 + 8 + 'px' }"
        @click="node.type === 'dir' ? toggle(node.name) : undefined"
      >
        <span v-if="node.type === 'dir'" class="icon">
          {{ isExpanded(node.name) ? '&#x1F4C2;' : '&#x1F4C1;' }}
        </span>
        <span v-else class="icon">&#x1F4C4;</span>
        <span class="node-name" :class="{ dir: node.type === 'dir' }">
          {{ node.name }}
        </span>
      </div>

      <Transition name="expand">
        <div
          v-if="node.type === 'dir' && node.children && isExpanded(node.name)"
          class="children"
        >
          <FileTree
            :tree="node.children"
            :default-expanded="defaultExpanded"
            :depth="depth + 1"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.file-tree.root {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 8px 0;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.node-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  cursor: default;
  border-radius: 6px;
  margin: 1px 6px;
  transition: background 0.15s;
  font-size: 0.9rem;
}

.node-row.highlight {
  background: var(--primary-light);
}

.node-row:hover {
  background: var(--bg);
}

.dir {
  cursor: pointer;
}

.icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.node-name {
  color: var(--text-primary);
}

.node-name.dir {
  font-weight: 600;
}

.children {
  overflow: hidden;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  max-height: 500px;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
