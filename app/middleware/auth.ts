// Клиентский guard: прикладные страницы доступны после мок-авторизации
// (флаг в localStorage). Уровень 1 — без реального backend.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const authed = localStorage.getItem('wf-auth')
  if (!authed) {
    return navigateTo('/login')
  }
})
