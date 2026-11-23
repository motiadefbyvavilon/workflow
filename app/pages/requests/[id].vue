<script setup lang="ts">
// Детальная страница заявки: описание, хронология, комментарии.
// Обрабатывает неизвестный id — состояние «не найдено».
definePageMeta({ middleware: 'auth' })

import { STATUS_LABELS, type RequestComment } from '~/types/request'
import { formatDate, timeAgo } from '~/utils/format'

const route = useRoute()
const router = useRouter()
const { requests, fetchRequests, byId } = useRequests()

useHead({ title: `Заявка ${route.params.id} — WorkFlow` })

if (requests.value.length === 0) {
  await fetchRequests()
}

const request = computed(() => byId(String(route.params.id)))

const comments = ref<RequestComment[]>(request.value ? [...request.value.comments] : [])

function addComment(text: string) {
  comments.value.push({
    id: `local-${Date.now()}`,
    at: new Date().toISOString(),
    author: 'Вы',
    text,
  })
}

function logout() {
  localStorage.removeItem('wf-auth')
  router.push('/login')
}
</script>

<template>
  <div v-if="request" class="detail">
    <nav class="crumbs" aria-label="Хлебные крошки">
      <NuxtLink to="/requests" class="crumb-link">← К списку заявок</NuxtLink>
    </nav>

    <header class="detail-head card">
      <div class="detail-top">
        <span class="mono detail-id">{{ request.id }}</span>
        <StatusTag :status="request.status" />
        <PriorityTag :priority="request.priority" />
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
      <section class="card panel" aria-labelledby="timeline-title">
        <h2 id="timeline-title" class="panel-title">Хронология</h2>
        <RequestTimeline :entries="request.timeline" />
      </section>

      <section class="card panel">
        <RequestComments :comments="comments" @add="addComment" />
      </section>
    </div>

    <button type="button" class="btn btn-ghost btn-sm logout" @click="logout">Выйти (сброс сессии)</button>
  </div>

  <StateBlock
    v-else
    title="Заявка не найдена"
    :description="`Заявки с номером ${route.params.id} нет в системе. Возможно, она удалена или ссылка устарела.`"
  >
    <NuxtLink to="/requests" class="btn btn-primary">К списку заявок</NuxtLink>
  </StateBlock>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.panel {
  padding: 20px 22px;
}

.panel-title {
  margin: 0 0 14px;
  font-size: 15.5px;
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
