// Клиентский guard (уровень 4): прикладные страницы — только с серверной
// сессией (Pinia auth store, httpOnly-cookie). Реальные права всё равно
// проверяются на сервере при каждом запросе — это только навигационный UX.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const auth = useAuthStore()
  if (!auth.me) {
    return navigateTo('/login')
  }
})
