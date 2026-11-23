<script setup lang="ts">
import { PRIORITY_LABELS, type RequestPriority } from '~/types/request'

const props = defineProps<{ priority: RequestPriority }>()

const TONES: Record<RequestPriority, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
}
</script>

<template>
  <span class="tag" :class="`tag-${TONES[props.priority]}`">{{ PRIORITY_LABELS[props.priority] }}</span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.tag-blue { background: var(--p-blue-100); color: var(--p-blue-600); }
.tag-amber { background: var(--p-amber-100); color: var(--p-amber-700); }
.tag-red { background: var(--danger-soft); color: var(--danger); }
.tag-gray { background: var(--surface-2); color: var(--text-faint); }
</style>
