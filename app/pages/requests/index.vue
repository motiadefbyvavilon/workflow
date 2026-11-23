<script setup lang="ts">
// Список заявок: фильтры по статусу/приоритету, loading / error / empty состояния.
// Демо-переключатель сценария API позволяет показать все состояния без backend.
definePageMeta({ middleware: 'auth' })

import type { RequestPriority, RequestStatus } from '~/types/request'

useHead({ title: 'Заявки — WorkFlow' })

const {
  requests, pending, failed, scenario,
  fetchRequests,
} = useRequests()

const status = ref<RequestStatus | ''>('')
const priority = ref<RequestPriority | ''>('')

const list = computed(() => {
  return requests.value.filter((r) => {
    if (status.value && r.status !== status.value) return false
    if (priority.value && r.priority !== priority.value) return false
    return true
  })
})

const isEmpty = computed(() => !pending.value && !failed.value && list.value.length === 0)

const modalOpen = ref(false)

async function applyScenario(next: 'success' | 'error' | 'empty') {
  scenario.value = next
  modalOpen.value = false
  await fetchRequests()
}

// Первичная загрузка на сервере (SSR): список сразу присутствует в HTML
await fetchRequests()
</script>

<template>
  <div class="requests-page">
    <header class="page-head">
      <h1>Заявки</h1>
      <button type="button" class="btn btn-ghost btn-sm" @click="modalOpen = true">
        Сценарий API: {{ scenario === 'success' ? 'успех' : scenario === 'error' ? 'ошибка' : 'пусто' }}
      </button>
    </header>

    <RequestFilters v-model:status="status" v-model:priority="priority" />

    <!-- Загрузка: скелетон-список -->
    <div v-if="pending" class="req-list" aria-label="Загрузка заявок" aria-busy="true">
      <div v-for="i in 4" :key="i" class="card skeleton-card">
        <div class="skeleton" style="width: 30%"></div>
        <div class="skeleton" style="width: 70%"></div>
        <div class="skeleton" style="width: 45%"></div>
      </div>
    </div>

    <!-- Ошибка загрузки -->
    <StateBlock
      v-else-if="failed"
      tone="danger"
      title="Не удалось загрузить заявки"
      description="Проверьте соединение и попробуйте ещё раз. Состояние имитирует ответ API с ошибкой."
    >
      <button type="button" class="btn btn-primary" @click="fetchRequests">Повторить</button>
    </StateBlock>

    <!-- Пустой результат (пустой API-ответ или слишком строгие фильтры) -->
    <StateBlock
      v-else-if="isEmpty"
      title="Заявок не найдено"
      :description="
        requests.length === 0
          ? 'API вернул пустой список — так выглядит пустое состояние.'
          : 'По текущим фильтрам ничего нет. Ослабьте условия отбора.'
      "
    >
      <button v-if="requests.length > 0" type="button" class="btn btn-ghost" @click="status = ''; priority = ''">
        Сбросить фильтры
      </button>
    </StateBlock>

    <!-- Успех: список -->
    <div v-else class="req-list">
      <p class="count-note" role="status">Найдено: {{ list.length }}</p>
      <TransitionGroup name="fade" tag="div" class="req-list-inner">
        <RequestCard v-for="r in list" :key="r.id" :request="r" />
      </TransitionGroup>
    </div>

    <AppModal :open="modalOpen" title="Демо-сценарий API" @close="modalOpen = false">
      <p class="modal-text">
        Уровень 1 работает на локальных mock-данных. Выберите, что должен вернуть условный API,
        чтобы проверить все состояния интерфейса:
      </p>
      <div class="scenario-btns">
        <button type="button" class="btn btn-ghost" @click="applyScenario('success')">Успех (14 заявок)</button>
        <button type="button" class="btn btn-ghost" @click="applyScenario('error')">Ошибка</button>
        <button type="button" class="btn btn-ghost" @click="applyScenario('empty')">Пустой ответ</button>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.req-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.req-list-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.count-note {
  margin: 0;
  font-size: 13px;
  color: var(--text-faint);
}

.skeleton-card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-text {
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--text-secondary);
}

.scenario-btns {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
