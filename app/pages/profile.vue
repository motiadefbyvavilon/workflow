<script setup lang="ts">
// Профиль демо-пользователя: данные мок-авторизации + статистика по заявкам
definePageMeta({ middleware: 'auth' })

useHead({ title: 'Профиль — WorkFlow' })

const router = useRouter()
const { requests, fetchRequests, countsByStatus } = useRequests()

if (requests.value.length === 0) {
  await fetchRequests()
}

interface Session {
  email: string
  at: number
}

const session = ref<Session | null>(null)

onMounted(() => {
  try {
    session.value = JSON.parse(localStorage.getItem('wf-auth') || 'null')
  } catch {
    session.value = null
  }
})

const counts = computed(() => countsByStatus())
const active = computed(() => counts.value.new + counts.value.in_progress + counts.value.waiting)

function logout() {
  localStorage.removeItem('wf-auth')
  router.push('/login')
}
</script>

<template>
  <div class="profile">
    <h1>Профиль</h1>

    <section class="card user-card" aria-label="Пользователь">
      <span class="avatar-big" aria-hidden="true">{{ (session?.email?.[0] || 'U').toUpperCase() }}</span>
      <div class="user-info">
        <h2>Демо-пользователь</h2>
        <p class="user-email mono">{{ session?.email || '—' }}</p>
        <p class="user-since">
          Сессия создана:
          <time class="mono" :datetime="new Date(session?.at || 0).toISOString()">
            {{ session?.at ? new Date(session.at).toLocaleString('ru-RU') : '—' }}
          </time>
        </p>
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
          <dd class="mono">{{ requests.length }}</dd>
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

.user-email {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.user-since {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--text-faint);
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
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
