// Сессия текущего пользователя (уровень 4): реальная серверная авторизация
// через httpOnly-cookie wf_session. init() зовёт /api/auth/me и вызывается
// клиентским плагином при старте приложения; me === null — аноним.
import type { SessionUser } from '~~/shared/types'

export const useAuthStore = defineStore('auth', () => {
  const me = ref<SessionUser | null>(null)
  const ready = ref(false)

  async function init() {
    try {
      me.value = await $fetch<SessionUser>('/api/auth/me')
    } catch {
      me.value = null
    } finally {
      ready.value = true
    }
  }

  async function login(email: string, password: string): Promise<SessionUser> {
    me.value = await $fetch<SessionUser>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    ready.value = true
    return me.value
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      me.value = null
    }
  }

  /** Сессия протухла на сервере (HTTP 401 в любом запросе) — сброс без редиректа */
  function expireSession() {
    me.value = null
  }

  return { me, ready, init, login, logout, expireSession }
})
