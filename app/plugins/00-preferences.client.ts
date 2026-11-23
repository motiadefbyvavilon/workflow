// Восстановление пользовательских настроек UI (уровень 5).
// Префикс 00- в имени файла: плагин выполняется ПЕРВЫМ, синхронно и до
// сетевых плагинов (auth ждёт /api/auth/me) — сохранённые pageSize/defaultSort
// применяются до первого запроса списка заявок, поэтому после F5 не бывает
// рассинхронизации «показано 5 элементов вместо сохранённых 20».
import { applySavedPreferences } from '~/stores/preferences'

export default defineNuxtPlugin(() => {
  applySavedPreferences(usePreferencesStore())
})
