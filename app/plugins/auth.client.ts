// Восстановление сессии при старте приложения (клиент, после гидратации):
// один запрос /api/auth/me — и весь интерфейс знает текущую роль.
export default defineNuxtPlugin(async () => {
  await useAuthStore().init()
})
