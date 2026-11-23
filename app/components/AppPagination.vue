<script setup lang="ts">
// Пагинация: prev/next + номера страниц, доступная с клавиатуры
const props = defineProps<{
  page: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

const pages = computed<(number | '…')[]>(() => {
  const n = props.pageCount
  const cur = props.page
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const set = new Set<number>([1, 2, n - 1, n, cur - 1, cur, cur + 1])
  const sorted = [...set].filter((p) => p >= 1 && p <= n).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…')
    out.push(p)
    prev = p
  }
  return out
})

function go(p: number | '…') {
  if (p === '…') return
  emit('change', p)
}

function onKey(e: KeyboardEvent, p: number | '…') {
  if ((e.key === 'Enter' || e.key === ' ') && p !== '…') {
    e.preventDefault()
    emit('change', p)
  }
}
</script>

<template>
  <nav v-if="pageCount > 1" class="pager" aria-label="Пагинация">
    <button
      type="button"
      class="pg-btn"
      :disabled="page <= 1"
      aria-label="Предыдущая страница"
      @click="emit('change', page - 1)"
    >
      ←
    </button>
    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '…'" class="dots" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="pg-btn"
        :class="{ active: p === page }"
        :aria-current="p === page ? 'page' : undefined"
        @click="go(p)"
        @keydown="onKey($event, p)"
      >
        {{ p }}
      </button>
    </template>
    <button
      type="button"
      class="pg-btn"
      :disabled="page >= pageCount"
      aria-label="Следующая страница"
      @click="emit('change', page + 1)"
    >
      →
    </button>
    <span class="total-note" role="status">Всего: {{ total }}</span>
  </nav>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pg-btn {
  min-width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.pg-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.pg-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.pg-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dots {
  color: var(--text-faint);
  padding: 0 2px;
}

.total-note {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-faint);
}
</style>
