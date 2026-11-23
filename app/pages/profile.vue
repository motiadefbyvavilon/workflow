<script setup lang="ts">
// Профиль (уровень 4): текущий пользователь — из сессии (auth store,
// /api/auth/me), статистика — по доступному ему списку /api/requests.
// Выход — реальный POST /api/auth/logout.
definePageMeta({ middleware: 'auth' })

useHead({ title: 'Профиль — WorkFlow' })

import { ROLE_LABELS } from '~~/shared/types'
import type { RequestListResponse } from '~~/shared/types'
import { toRequestCardModel } from '~/utils/mappers'

const router = useRouter()
const auth = useAuthStore()

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

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="profile">
    <h1>Профиль</h1>

    <section v-if="auth.me" class="card user-card" aria-label="Пользователь">
      <span class="avatar-big" aria-hidden="true">{{ auth.me.name[0] }}</span>
      <div class="user-info">
        <h2>{{ auth.me.name }}</h2>
        <p class="user-role">{{ ROLE_LABELS[auth.me.role] }}</p>
        <p class="user-email mono">{{ auth.me.email }}</p>
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
