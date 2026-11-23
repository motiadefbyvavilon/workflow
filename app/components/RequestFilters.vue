<script setup lang="ts">
// Фильтры списка заявок — переключатели-радио с полной клавиатурной навигацией
// (стрелки внутри группы, Tab между группами) по паттерну WAI-ARIA Radio Group.
import { PRIORITY_LABELS, STATUS_LABELS, type RequestPriority, type RequestStatus } from '~/types/request'

const status = defineModel<RequestStatus | ''>('status', { required: true })
const priority = defineModel<RequestPriority | ''>('priority', { required: true })

const STATUS_KEYS = Object.keys(STATUS_LABELS) as RequestStatus[]
const PRIORITY_KEYS = Object.keys(PRIORITY_LABELS) as RequestPriority[]

const statusRefs = ref<HTMLButtonElement[]>([])
const priorityRefs = ref<HTMLButtonElement[]>([])

function move(refs: HTMLButtonElement[], from: number, delta: number) {
  const next = (from + delta + refs.length) % refs.length
  refs[next]?.focus()
}

function onStatusKey(e: KeyboardEvent, index: number) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    const next = (index + 1) % STATUS_KEYS.length
    status.value = STATUS_KEYS[next]
    nextTick(() => statusRefs.value[next]?.focus())
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = (index - 1 + STATUS_KEYS.length) % STATUS_KEYS.length
    status.value = STATUS_KEYS[prev]
    nextTick(() => statusRefs.value[prev]?.focus())
  }
}

function onPriorityKey(e: KeyboardEvent, index: number) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    const next = (index + 1) % PRIORITY_KEYS.length
    priority.value = PRIORITY_KEYS[next]
    nextTick(() => priorityRefs.value[next]?.focus())
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = (index - 1 + PRIORITY_KEYS.length) % PRIORITY_KEYS.length
    priority.value = PRIORITY_KEYS[prev]
    nextTick(() => priorityRefs.value[prev]?.focus())
  }
}

function reset() {
  status.value = ''
  priority.value = ''
}

const hasActive = computed(() => status.value !== '' || priority.value !== '')
</script>

<template>
  <div class="filters card">
    <div class="filter-group">
      <span id="filter-status-label" class="filter-label">Статус</span>
      <div
        class="chips"
        role="radiogroup"
        aria-labelledby="filter-status-label"
      >
        <button
          ref="statusRefs"
          v-for="(key, i) in ['' as const, ...STATUS_KEYS]"
          :key="key || 'all'"
          type="button"
          class="chip"
          :class="{ active: status === key }"
          role="radio"
          :aria-checked="status === key"
          :tabindex="status === key ? 0 : -1"
          @click="status = key"
          @keydown="onStatusKey($event, i)"
        >
          {{ key === '' ? 'Все' : STATUS_LABELS[key] }}
        </button>
      </div>
    </div>

    <div class="filter-group">
      <span id="filter-priority-label" class="filter-label">Приоритет</span>
      <div
        class="chips"
        role="radiogroup"
        aria-labelledby="filter-priority-label"
      >
        <button
          ref="priorityRefs"
          v-for="(key, i) in ['' as const, ...PRIORITY_KEYS]"
          :key="key || 'all'"
          type="button"
          class="chip"
          :class="{ active: priority === key }"
          role="radio"
          :aria-checked="priority === key"
          :tabindex="priority === key ? 0 : -1"
          @click="priority = key"
          @keydown="onPriorityKey($event, i)"
        >
          {{ key === '' ? 'Все' : PRIORITY_LABELS[key] }}
        </button>
      </div>
    </div>

    <button v-if="hasActive" type="button" class="btn btn-ghost btn-sm reset" @click="reset">
      Сбросить фильтры
    </button>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 18px;
  padding: 14px 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.chip:hover {
  border-color: var(--text-faint);
  color: var(--text);
}

.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.reset {
  margin-left: auto;
}
</style>
