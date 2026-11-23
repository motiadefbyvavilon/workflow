<script setup lang="ts">
// Детальная страница заявки (уровень 2): данные с API, 404-состояние,
// карточка заказчика из справочника /api/customers, retry при ошибке.
definePageMeta({ middleware: 'auth' })

import type { ApiRequest } from '~/types/api'
import { STATUS_LABELS } from '~/types/request'
import { formatDate, timeAgo } from '~/utils/format'
import { toRequestViewModel } from '~/utils/mappers'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)

useHead({ title: `Заявка ${id} — WorkFlow` })

const { dicts } = useDictionaries()

const {
  data: raw,
  status,
  error,
  refresh,
} = await useFetch<ApiRequest>(`/api/requests/${id}`)

const notFound = computed(() => (error.value as { statusCode?: number } | null)?.statusCode === 404)

const request = computed(() => (raw.value ? toRequestViewModel(raw.value, dicts.value) : undefined))

const customer = computed(() =>
  raw.value ? dicts.value.customers.get(raw.value.author_id) : undefined,
)

const localComments = ref<string[]>([])

function addComment(text: string) {
  localComments.value.push(text)
}

const allComments = computed(() => [
  ...(request.value?.comments ?? []),
  ...localComments.value.map((text, i) => ({
    id: `local-${i}`,
    at: new Date().toISOString(),
    author: 'Вы',
    text,
  })),
])

function logout() {
  localStorage.removeItem('wf-auth')
  router.push('/login')
}
</script>

<template>
  <!-- Loading -->
  <div v-if="status === 'pending'" class="detail skeleton-wrap" aria-busy="true" aria-label="Загрузка заявки">
    <div class="card skeleton-card">
      <div class="skeleton" style="width: 25%"></div>
      <div class="skeleton" style="width: 60%; height: 22px"></div>
      <div class="skeleton" style="width: 90%"></div>
      <div class="skeleton" style="width: 45%"></div>
    </div>
    <div class="card skeleton-card">
      <div class="skeleton" style="width: 35%"></div>
      <div class="skeleton" style="width: 80%"></div>
    </div>
  </div>

  <!-- Не найдена -->
  <StateBlock
    v-else-if="notFound"
    title="Заявка не найдена"
    :description="`Заявки с номером ${id} нет в системе. Возможно, она удалена или ссылка устарела.`"
  >
    <NuxtLink to="/requests" class="btn btn-primary">К списку заявок</NuxtLink>
  </StateBlock>

  <!-- Временная ошибка сервера -->
  <StateBlock
    v-else-if="error"
    tone="danger"
    title="Не удалось загрузить заявку"
    description="Сервер временно недоступен. Попробуйте повторить запрос."
  >
    <button type="button" class="btn btn-primary" @click="refresh()">Повторить запрос</button>
  </StateBlock>

  <div v-else-if="request" class="detail">
    <nav class="crumbs" aria-label="Хлебные крошки">
      <NuxtLink to="/requests" class="crumb-link">← К списку заявок</NuxtLink>
    </nav>

    <header class="detail-head card">
      <div class="detail-top">
        <span class="mono detail-id">{{ request.id }}</span>
        <StatusTag :status="request.status" />
        <PriorityTag :priority="request.priority" />
        <span class="cat-badge">{{ request.category }}</span>
      </div>
      <h1>{{ request.title }}</h1>
      <p class="detail-desc">{{ request.description }}</p>

      <dl class="detail-meta">
        <div class="meta-item">
          <dt>Автор</dt>
          <dd>{{ request.author }}</dd>
        </div>
        <div class="meta-item">
          <dt>Исполнитель</dt>
          <dd>{{ request.assignee }}</dd>
        </div>
        <div class="meta-item">
          <dt>Создана</dt>
          <dd class="mono">{{ formatDate(request.createdAt) }}</dd>
        </div>
        <div class="meta-item">
          <dt>Обновлена</dt>
          <dd class="mono">{{ timeAgo(request.updatedAt) }}</dd>
        </div>
        <div class="meta-item">
          <dt>Статус</dt>
          <dd>{{ STATUS_LABELS[request.status] }}</dd>
        </div>
      </dl>

      <ul v-if="request.tags.length" class="tags" aria-label="Теги">
        <li v-for="tag in request.tags" :key="tag" class="tag-mini mono">{{ tag }}</li>
      </ul>
    </header>

    <div class="detail-grid">
      <div class="side-col">
        <section v-if="customer" class="card panel customer" aria-label="Заказчик">
          <h2 class="panel-title">Заказчик</h2>
          <p class="cust-name">{{ customer.name }}</p>
          <p v-if="customer.company" class="cust-line">{{ customer.company }}</p>
          <p v-if="customer.email" class="cust-line mono">{{ customer.email }}</p>
          <p v-if="!customer.company && !customer.email" class="cust-line faint">
            Дополнительных данных нет
          </p>
        </section>

        <section class="card panel" aria-labelledby="timeline-title">
          <h2 id="timeline-title" class="panel-title">Хронология</h2>
          <RequestTimeline v-if="request.timeline.length" :entries="request.timeline" />
          <p v-else class="faint">История по этой заявке пока недоступна.</p>
        </section>
      </div>

      <section class="card panel">
        <RequestComments :comments="allComments" @add="addComment" />
      </section>
    </div>

    <button type="button" class="btn btn-ghost btn-sm logout" @click="logout">Выйти (сброс сессии)</button>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-wrap {
  gap: 16px;
}

.skeleton-card {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crumbs {
  font-size: 13.5px;
}

.crumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
}

.crumb-link:hover {
  color: var(--accent);
}

.detail-head {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-id {
  font-size: 13px;
  color: var(--text-faint);
  font-weight: 600;
}

.cat-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--surface-2);
  border-radius: 6px;
  padding: 3px 8px;
}

.detail-head h1 {
  margin: 0;
  font-size: 22px;
}

.detail-desc {
  margin: 0;
  font-size: 14.5px;
  color: var(--text-secondary);
}

.detail-meta {
  margin: 6px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-item dt {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta-item dd {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.tags {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-mini {
  background: var(--surface-2);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11.5px;
  color: var(--text-secondary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 16px;
  align-items: start;
}

.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  padding: 20px 22px;
}

.panel-title {
  margin: 0 0 14px;
  font-size: 15.5px;
}

.cust-name {
  margin: 0 0 4px;
  font-weight: 700;
}

.cust-line {
  margin: 2px 0;
  font-size: 13.5px;
  color: var(--text-secondary);
}

.faint {
  color: var(--text-faint);
  font-size: 13.5px;
  margin: 0;
}

.logout {
  align-self: flex-start;
}

@media (max-width: 860px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
