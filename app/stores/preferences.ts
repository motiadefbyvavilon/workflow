// Пользовательские настройки интерфейса — app-level state.
// Используется несколькими страницами (список, дашборд), поэтому живёт
// в Pinia, а не в локальном ref страницы. Персистентность — в localStorage
// (приложение без backend-профиля, уровень 3).
import type { SortKey } from '~/composables/useRequests'

export const PREFS_STORAGE_KEY = 'wf-preferences'

interface PreferencesShape {
  pageSize: number
  defaultSort: SortKey
}
export type { PreferencesShape }

export const usePreferencesStore = defineStore('preferences', () => {
  const pageSize = ref<number>(5)
  const defaultSort = ref<SortKey>('updated_desc')

  // Восстановление после перезагрузки выполняет plugins/restore-preferences.client.ts:
  // SSR-состояние (payload) перезаписывает store при гидратации, поэтому читать
  // localStorage нужно после неё, иначе сохранённые настройки теряются.

  watch(
    [pageSize, defaultSort],
    ([ps, ds]) => {
      // guard по доступности localStorage: на сервере его нет,
      // в тестах (happy-dom) — есть без import.meta.client
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ pageSize: ps, defaultSort: ds }))
      }
    },
    { deep: true },
  )

  function setPageSize(value: number) {
    pageSize.value = value
  }

  function setDefaultSort(value: SortKey) {
    defaultSort.value = value
  }

  return { pageSize, defaultSort, setPageSize, setDefaultSort }
})

/** Тип store для функций-помощников (без привязки к usePreferencesStore) */
type PreferencesStore = ReturnType<typeof usePreferencesStore>

const PAGE_SIZE_OPTIONS = [5, 10, 20]
const SORTS: SortKey[] = ['updated_desc', 'created_desc', 'priority', 'title']

/**
 * Восстановление сохранённых настроек из localStorage (уровень 5).
 * Чистая синхронная функция — её вызывает клиентский плагин
 * plugins/00-preferences.client.ts ДО любых запросов приложения, а юнит-тест
 * проверяет без Nuxt-контекста. Невалидные данные игнорируются.
 */
export function applySavedPreferences(prefs: PreferencesStore): void {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? '{}') as {
      pageSize?: number
      defaultSort?: string
    }
    if (typeof saved.pageSize === 'number' && PAGE_SIZE_OPTIONS.includes(saved.pageSize)) {
      prefs.setPageSize(saved.pageSize)
    }
    if (SORTS.includes(saved.defaultSort as SortKey)) {
      prefs.setDefaultSort(saved.defaultSort as SortKey)
    }
  } catch {
    // повреждённые данные — остаются значения по умолчанию
  }
}
