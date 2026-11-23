<script setup lang="ts">
import { STATUS_LABELS, type RequestStatus } from '~/types/request'

const props = defineProps<{ status: RequestStatus }>()

const TONES: Record<RequestStatus, string> = {
  new: 'blue',
  in_progress: 'violet',
  waiting: 'amber',
  done: 'green',
  cancelled: 'gray',
}
</script>

<template>
  <span class="tag" :class="`tag-${TONES[props.status]}`">{{ STATUS_LABELS[props.status] }}</span>
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
.tag-violet { background: var(--accent-soft); color: var(--accent); }
.tag-amber { background: var(--p-amber-100); color: var(--p-amber-700); }
.tag-green { background: var(--p-green-100); color: var(--p-green-600); }
.tag-gray { background: var(--surface-2); color: var(--text-faint); }
</style>
