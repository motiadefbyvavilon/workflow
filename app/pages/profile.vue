<script setup lang="ts">
// Профиль (уровень 2): текущий пользователь — из API /api/users,
// статистика — по данным /api/requests. Мок-сессия из localStorage.
definePageMeta({ middleware: 'auth' })

useHead({ title: 'Профиль — WorkFlow' })

import type { ApiUser, RequestListResponse } from '~/types/api'
import { toRequestCardModel } from '~/utils/mappers'

const router = useRouter()

const { data: usersData, status: usersStatus } = await useFetch<{ items: ApiUser[] }>('/api/users', {
  default: () => ({ items: [] }),
})

const { data: reqData } = await useFetch<RequestListResponse>('/api/requests', {
  query: { page: 1, pageSize: 50 },
  default: () => ({ items: [], total: 0, page: 1, pageSize: 50 }),
})

const { dicts } = useDictionaries()

const requests = computed(() => (reqData.value?.items ?? []).map((r) => toRequestCardModel(r, dicts.value)))

const counts = computed(() => {
  const base = { new: 0, in_progress: 0, waiting: 0, done: 0, cancelled: 0 }
  for (const r of requests.value) base[r.status] += 1
  return base
})

const active = computed(() => counts.value.new + counts.value.in_progress + counts.value.waiting)

const ROLE_LABELS: Record<ApiUser['role'], string> = {
  admin: 'Администратор',
  agent: 'Сотрудник поддержки',
  observer: 'Наблюдатель',
}

/** Текущий пользователь: из сессии по email, иначе первый админ из API */
const sessionEmail = ref('')

onMounted(() => {
  try {
    sessionEmail.value = JSON.parse(localStorage.getItem('wf-auth') || '{}').email ?? ''
  } catch {
    sessionEmail.value = ''
  }
})

const me = computed<ApiUser | undefined>(() => {
  const list = usersData.value?.items ?? []
  return list.find((u) => u.email === sessionEmail.value) ?? list.find((u) => u.role === 'admin') ?? list[0]
})

function logout() {
  localStorage.removeItem('wf-auth')
  router.push('/login')
}
</script>

<template>
  <div class="profile">
    <h1>Профиль</h1>

    <div v-if="usersStatus === 'pending'" class="card stat-skel" aria-busy="true">
      <div class="skeleton" style="width: 40%; height: 20px"></div>
      <div class="skeleton" style="width: 60%"></div>
      <div class="skeleton" style="width: 30%"></div>
    </div>

    <section v-else-if="me" class="card user-card" aria-label="Пользователь">
      <span class="avatar-big" aria-hidden="true">{{ me.name[0] }}</span>
      <div class="user-info">
        <h2>{{ me.name }}</h2>
        <p class="user-role">{{ ROLE_LABELS[me.role] }}</p>
        <p class="user-email mono">{{ me.email }}</p>
      </div>
      <button type="button" class="btn btn-ghost" @click="logout">Выйти</button>
    </section>

    <section aria-labelledby="activity-title">
      <h2 id="activity-title" class="section-title">Активность по заявкам</h2>
      <dl class="stats card">
        <div class="stat">
          <dt>Активных</dt>
          <dd class="mono">{{ active }}</dd>
        </div>
        <div class="stat">
          <dt>Выполнено</dt>
          <dd class="mono">{{ counts.done }}</dd>
        </div>
        <div class="stat">
          <dt>Отменено</dt>
          <dd class="mono">{{ counts.cancelled }}</dd>
        </div>
        <div class="stat">
          <dt>Всего</dt>
          <dd class="mono">{{ reqData?.total ?? 0 }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.profile h1 {
  margin: 0;
  font-size: 24px;
}

.stat-skel {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  flex-wrap: wrap;
}

.avatar-big {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 26px;
  font-weight: 800;
}

.user-info {
  flex: 1;
  min-width: 200px;
}

.user-info h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.user-role {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.user-email {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--text-secondary);
}

.section-title {
  margin: 0 0 12px;
  font-size: 17px;
}

.stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 8px;
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border-radius: var(--radius-m);
  background: var(--surface-2);
}

.stat dt {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.stat dd {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
