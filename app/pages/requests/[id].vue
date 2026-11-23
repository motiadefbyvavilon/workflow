<script setup lang="ts">
// Детальная страница заявки (уровни 3–4): optimistic update, rollback при
// 409/500, Undo, комментарии. Уровень 4 добавил серверные права и роли:
// редакторы показываются по правилам роли (фронт — только UX, сервер решает).
definePageMeta({ middleware: 'auth' })

import type { ApiRequest, ApiUser, RequestPriority, RequestStatus, Role } from '~~/shared/types'
import { PRIORITY_LABELS } from '~~/shared/types'
import { canRoleTransition, STATUS_LABELS, STATUS_TRANSITIONS } from '~~/shared/utils/status'
import { formatDate, timeAgo } from '~/utils/format'
import { toRequestViewModel } from '~/utils/mappers'
import { useRequestUiStore } from '~/stores/requestUi'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)

useHead({ title: `Заявка ${id} — WorkFlow` })

const { dicts } = useDictionaries()
const ui = useRequestUiStore()
const auth = useAuthStore()

const {
  data: raw,
  status,
  error,
  refresh,
} = await useFetch<ApiRequest>(`/api/requests/${id}`)

// Список сотрудников для назначения — только Operator/Admin могут назначать;
// для остальных ролей /api/users вернул бы 403, поэтому не запрашиваем вовсе.
const agents = ref<ApiUser[]>([])
onMounted(async () => {
  const role = auth.me?.role
  if (role !== 'operator' && role !== 'admin') return
  try {
    const res = await $fetch<{ items: ApiUser[] }>('/api/users')
    agents.value = (res.items ?? []).filter((u) => u.active && u.role !== 'client')
  } catch {
    agents.value = []
  }
})

const errorCode = computed(() => (error.value as { statusCode?: number } | null)?.statusCode ?? 0)
const notFound = computed(() => errorCode.value === 404)
const accessDenied = computed(() => errorCode.value === 401 || errorCode.value === 403)

const request = computed(() => (raw.value ? toRequestViewModel(raw.value, dicts.value) : undefined))

const customer = computed(() =>
  raw.value ? dicts.value.customers.get(raw.value.customer_id ?? raw.value.author_id) : undefined,
)

// ─── Права текущей роли (UX; сервер проверяет всё сам при PATCH) ───────────
const role = computed(() => auth.me?.role ?? null)

const isStaff = computed(() => role.value === 'operator' || role.value === 'admin')
const isAssignedAgent = computed(
  () => role.value === 'agent' && raw.value?.assignee_id === auth.me?.id,
)
const isAuthorWhileNew = computed(
  () => !!raw.value && raw.value.author_id === auth.me?.id && raw.value.status === 'new',
)

/** Редактировать статус может staff, назначенный агент или автор новой заявки */
const canEditStatus = computed(
  () => isStaff.value || isAssignedAgent.value || isAuthorWhileNew.value,
)
/** Приоритет — staff и назначенный агент */
const canEditPriority = computed(() => isStaff.value || isAssignedAgent.value)
/** Назначение исполнителя — только staff */
const canAssign = computed(() => isStaff.value)

/** Доступные цели для смены статуса: общая карта переходов + роль */
const allowedStatuses = computed<RequestStatus[]>(() => {
  const current = raw.value?.status
  if (!current || !role.value || !canEditStatus.value) return []
  const authorCancelOnly = isAuthorWhileNew.value && !isStaff.value && !isAssignedAgent.value
  if (authorCancelOnly) return ['cancelled']
  return STATUS_TRANSITIONS[current].filter((to) => canRoleTransition(current, to, role.value as Role))
})

const mutations = useRequestMutations(raw as Ref<ApiRequest | null>, refresh)

// Значения селектов связаны с raw напрямую — optimistic update виден мгновенно
const statusValue = computed({
  get: () => raw.value?.status ?? 'new',
  set: (v) => mutations.setStatus(v),
})
const priorityValue = computed({
  get: () => request.value?.priority ?? 'medium',
  set: (v: RequestPriority) => mutations.setPriority(v),
})
const assigneeValue = computed({
  get: () => raw.value?.assignee_id ?? 0,
  set: (v: number) => mutations.setAssignee(v || null),
})

/** Undo доступно, если последнее изменение относится к этой заявке */
const canUndo = computed(() => ui.lastChange?.requestId === id)

const allComments = computed(() => request.value?.comments ?? [])

async function logout() {
  await auth.logout()
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

  <!-- Нет доступа / сессия истекла -->
  <StateBlock
    v-else-if="accessDenied"
    title="Нет доступа к заявке"
    description="Эта заявка не входит в ваши доступные, либо сессия истекла. Войдите под подходящей учётной записью."
  >
    <div class="denied-actions">
      <NuxtLink
        :to="{ path: '/login', query: { redirect: `/requests/${id}` } }"
        class="btn btn-primary"
        data-testid="denied-login"
      >
        Войти снова
      </NuxtLink>
      <NuxtLink to="/requests" class="btn btn-ghost">К списку заявок</NuxtLink>
    </div>
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

    <!-- Транзакционные уведомления: успех / причина rollback -->
    <p v-if="ui.notice" class="notice" :class="`notice-${ui.notice.kind}`" role="status">
      {{ ui.notice.text }}
      <button type="button" class="notice-close" aria-label="Закрыть уведомление" @click="ui.clearNotice()">✕</button>
    </p>

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

      <!-- Редакторы: optimistic update, откат при ошибке API, Undo.
           Видимость — по роли (сервер всё равно проверяет каждый PATCH) -->
      <div v-if="canEditStatus || canEditPriority || canAssign" class="editors" aria-label="Изменение заявки">
        <div v-if="canEditStatus" class="field editor">
          <label for="edit-status">Статус</label>
          <select id="edit-status" v-model="statusValue" data-testid="status-select" :disabled="mutations.busyField.value !== null">
            <option :value="raw?.status" disabled>{{ STATUS_LABELS[raw?.status ?? 'new'] }} (текущий)</option>
            <option v-for="key in allowedStatuses" :key="key" :value="key">{{ STATUS_LABELS[key] }}</option>
          </select>
        </div>
        <div v-if="canEditPriority" class="field editor">
          <label for="edit-priority">Приоритет</label>
          <select id="edit-priority" v-model="priorityValue" :disabled="mutations.busyField.value !== null">
            <option v-for="(label, key) in PRIORITY_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div v-if="canAssign" class="field editor">
          <label for="edit-assignee">Исполнитель</label>
          <select id="edit-assignee" v-model.number="assigneeValue" data-testid="assignee-select" :disabled="mutations.busyField.value !== null">
            <option :value="0">Не назначен</option>
            <option v-for="u in agents" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <button
          v-if="canUndo"
          type="button"
          class="btn btn-ghost undo"
          :disabled="mutations.busyField.value !== null"
          @click="mutations.undo()"
        >
          ↩︎ Отменить последнее изменение
        </button>
      </div>
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
        <RequestComments :comments="allComments" :posting="mutations.postingComment.value" @add="mutations.addComment" />
      </section>
    </div>

    <button type="button" class="btn btn-ghost btn-sm logout" @click="logout">Выйти</button>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.denied-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

/* Уведомления об успехе / rollback */
.notice {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  font-size: 13.5px;
  font-weight: 600;
}

.notice-success {
  background: var(--p-green-100);
  color: var(--p-green-600);
}

.notice-error {
  background: var(--danger-soft);
  color: var(--danger);
}

.notice-close {
  margin-left: auto;
  border: none;
  background: transparent;
  font-size: 13px;
  color: inherit;
  cursor: pointer;
}

/* Редакторы полей */
.editors {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.editor select {
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  padding: 8px 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  min-width: 160px;
}

.editor select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.editor select:disabled {
  opacity: 0.6;
  cursor: wait;
}

.undo {
  margin-left: auto;
}

.logout {
  align-self: flex-start;
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

@media (max-width: 860px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
