// Пользовательские настройки интерфейса — app-level state.
// Используется несколькими страницами (список, дашборд), поэтому живёт
// в Pinia, а не в локальном ref страницы. Персистентность — в localStorage
// (приложение без backend-профиля, уровень 3).
import type { SortKey } from '~/composables/useRequests'

export const PREFS_STORAGE_KEY = 'wf-preferences'

interface PreferencesState {
  pageSize: number
  defaultSort: SortKey
}

export const usePreferencesStore = defineStore('preferences', () => {
  const pageSize = ref<number>(5)
  const defaultSort = ref<SortKey>('updated_desc')

  // Восстановление после перезагрузки выполняет plugins/restore-preferences.client.ts:
  // SSR-состояние (payload) перезаписывает store при гидратации, поэтому читать
  // localStorage нужно после неё, иначе сохранённые настройки теряются.

  watch(
    [pageSize, defaultSort],
    ([ps, ds]) => {
      if (import.meta.client) {
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
