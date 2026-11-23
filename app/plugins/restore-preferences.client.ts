// Восстановление пользовательских настроек UI после перезагрузки страницы.
// Клиентский плагин: выполняется после гидратации Pinia из SSR-payload,
// поэтому значения из localStorage не перезаписываются серверными дефолтами.
import { PREFS_STORAGE_KEY, usePreferencesStore } from '~/stores/preferences'
import type { SortKey } from '~/composables/useRequests'

const SORTS: SortKey[] = ['updated_desc', 'created_desc', 'priority', 'title']

export default defineNuxtPlugin(() => {
  const prefs = usePreferencesStore()

  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? '{}') as {
      pageSize?: number
      defaultSort?: string
    }
    if (typeof saved.pageSize === 'number' && [5, 10, 20].includes(saved.pageSize)) {
      prefs.setPageSize(saved.pageSize)
    }
    if (SORTS.includes(saved.defaultSort as SortKey)) {
      prefs.setDefaultSort(saved.defaultSort as SortKey)
    }
  } catch {
    // повреждённые данные — остаются значения по умолчанию
  }
})
