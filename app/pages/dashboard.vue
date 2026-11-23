<script setup lang="ts">
// Дашборд (уровень 2): статистика считается по данным API
definePageMeta({ middleware: 'auth' })

useHead({ title: 'Дашборд — WorkFlow' })

import type { RequestListResponse } from '~~/shared/types'
import { toRequestCardModel } from '~/utils/mappers'

const { dicts } = useDictionaries()

// Все заявки (их 16 < pageSize 50) — для статистики и блока «Последние обновления»
const { data, status, error, refresh } = await useFetch<RequestListResponse>('/api/requests', {
  query: { page: 1, pageSize: 50, sort: 'updated_desc' },
  default: () => ({ items: [], total: 0, page: 1, pageSize: 50 }),
})

const requests = computed(() => (data.value?.items ?? []).map((r) => toRequestCardModel(r, dicts.value)))

const counts = computed(() => {
  const base: Record<string, number> = { new: 0, in_progress: 0, waiting: 0, done: 0, cancelled: 0 }
  for (const r of requests.value) base[r.status] = (base[r.status] ?? 0) + 1
  return base
})

const total = computed(() => data.value?.total ?? 0)

const latest = computed(() => requests.value.slice(0, 5))

const STAT_CARDS: { key: string; label: string; tone: string }[] = [
  { key: 'new', label: 'Новые', tone: 'blue' },
  { key: 'in_progress', label: 'В работе', tone: 'violet' },
  { key: 'waiting', label: 'Ожидают ответа', tone: 'amber' },
  { key: 'done', label: 'Выполнены', tone: 'green' },
  { key: 'cancelled', label: 'Отменены', tone: 'gray' },
]
</script>

<template>
  <div class="dashboard">
    <header class="page-head">
      <h1>Дашборд</h1>
      <NuxtLink to="/requests" class="btn btn-ghost btn-sm">Все заявки →</NuxtLink>
    </header>

    <div v-if="status === 'pending'" class="stats" aria-label="Загрузка статистики" aria-busy="true">
      <div v-for="i in 5" :key="i" class="card stat">
        <div class="skeleton" style="width: 60%"></div>
        <div class="skeleton" style="width: 35%; height: 26px"></div>
      </div>
    </div>

    <StateBlock
      v-else-if="error"
      tone="danger"
      title="Не удалось загрузить дашборд"
      description="Сервер временно недоступен. Попробуйте повторить запрос."
    >
      <button type="button" class="btn btn-primary" @click="refresh()">Повторить</button>
    </StateBlock>

    <template v-else>
      <section class="stats" aria-label="Заявки по статусам">
        <div v-for="card in STAT_CARDS" :key="card.key" class="card stat" :data-tone="card.tone">
          <span class="stat-label">{{ card.label }}</span>
          <span class="stat-value mono">{{ counts[card.key] ?? 0 }}</span>
        </div>
      </section>

      <section aria-labelledby="latest-title">
        <h2 id="latest-title" class="section-title">Последние обновления</h2>
        <div class="latest">
          <RequestCard v-for="r in latest" :key="r.id" :request="r" />
        </div>
        <p class="total-note">Всего заявок: <strong class="mono">{{ total }}</strong></p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-head h1 {
  margin: 0;
  font-size: 24px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.stat {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 3px solid transparent;
}

.stat[data-tone='blue'] { border-top-color: var(--p-blue-600); }
.stat[data-tone='violet'] { border-top-color: var(--accent); }
.stat[data-tone='amber'] { border-top-color: var(--p-amber-700); }
.stat[data-tone='green'] { border-top-color: var(--p-green-600); }
.stat[data-tone='gray'] { border-top-color: var(--p-ink-400); }

.stat-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
}

.section-title {
  margin: 0 0 12px;
  font-size: 17px;
}

.latest {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.total-note {
  margin: 14px 0 0;
  font-size: 13.5px;
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .stats { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 560px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
