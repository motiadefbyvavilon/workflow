// Nitro plugin (уровень 4): прогревает PostgreSQL (PGlite) до приёма
// первых запросов — схема создана, seed выполнен, API сразу рабочий.
export default defineNitroPlugin(async () => {
  await getDb()
})
