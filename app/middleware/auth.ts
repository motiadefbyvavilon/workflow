// Клиентский guard (уровни 4–5): прикладные страницы — только с серверной
// сессией (Pinia auth store, httpOnly-cookie). Реальные права всё равно
// проверяются на сервере при каждом запросе — это навигационный UX.
//
// Регрессия (уровень 5, доступ к приватному route после logout): редирект
// на /login сохраняет исходный путь в query redirect — после входа
// пользователь возвращается туда, откуда его выкинуло, а не на дашборд.
// Авторизованный, зашедший на /login, уходит на redirect/dashboard.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const auth = useAuthStore()

  if (to.path === '/login') {
    if (auth.me) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/dashboard'
      return navigateTo(redirect)
    }
    return
  }

  if (!auth.me) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
