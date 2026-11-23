// Слой данных уровня 2: список заявок с API с поиском, фильтрами,
// сортировкой и пагинацией. Состояние параметров живёт в URL (query),
// поэтому прямая ссылка полностью восстанавливает страницу.
// Поиск debounce-ится — запрос уходит не чаще, чем раз в DEBOUNCE_MS.
import type { RequestListResponse } from '~/types/api'
import type { RequestPriority, RequestStatus, WorkflowRequest } from '~/types/request'
import { toRequestCardModel } from '~/utils/mappers'

const DEBOUNCE_MS = 350
export const PAGE_SIZE = 5

export const PAGE_SIZE_OPTIONS = [5, 10, 20] as const

export type SortKey = 'updated_desc' | 'created_desc' | 'priority' | 'title'

export interface RequestsQuery {
  search: string
  status: '' | RequestStatus
  priority: '' | RequestPriority
  category: number
  sort: SortKey
  page: number
}

export const SORT_LABELS: Record<SortKey, string> = {
  updated_desc: 'Сначала обновлённые',
  created_desc: 'Сначала новые',
  priority: 'По приоритету',
  title: 'По названию А–Я',
}

export function useRequests() {
  const route = useRoute()
  const router = useRouter()
  const { dicts } = useDictionaries()
  const prefs = usePreferencesStore()

  /** Чтение состояния фильтров из URL — восстановление по прямой ссылке */
  function fromQuery(): RequestsQuery {
    const q = route.query
    const sort = String(q.sort ?? '') as SortKey
    return {
      search: String(q.search ?? ''),
      status: (String(q.status ?? '') || '') as RequestsQuery['status'],
      priority: (String(q.priority ?? '') || '') as RequestsQuery['priority'],
      category: Number(q.category ?? 0) || 0,
      sort: sort in SORT_LABELS ? sort : 'updated_desc',
      page: Math.max(1, Number(q.page ?? 1) || 1),
    }
  }

  const filters = ref<RequestsQuery>(fromQuery())

  /** Локальное поле поиска — в URL уходит только debounce-версия */
  const searchInput = ref(filters.value.search)
  const debouncedSearch = useDebouncedRef(searchInput, DEBOUNCE_MS)

  watch(debouncedSearch, (value) => {
    if (value !== filters.value.search) {
      update({ search: value, page: 1 })
    }
  })

  // Синхронизация с браузерной навигацией (назад/вперёд)
  watch(
    () => route.query,
    () => {
      const next = fromQuery()
      filters.value = next
      if (next.search !== searchInput.value) searchInput.value = next.search
    },
  )

  /** Запись состояния в URL (replace — без мусора в истории) */
  function update(patch: Partial<RequestsQuery>) {
    filters.value = { ...filters.value, ...patch }
    const f = filters.value
    router.replace({
      query: {
        ...(f.search ? { search: f.search } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.priority ? { priority: f.priority } : {}),
        ...(f.category ? { category: String(f.category) } : {}),
        ...(f.sort !== 'updated_desc' ? { sort: f.sort } : {}),
        ...(f.page > 1 ? { page: String(f.page) } : {}),
      },
    })
  }

  const apiQuery = computed(() => ({
    search: filters.value.search || undefined,
    status: filters.value.status || undefined,
    priority: filters.value.priority || undefined,
    category: filters.value.category || undefined,
    sort: filters.value.sort,
    page: filters.value.page,
    pageSize: prefs.pageSize,
  }))

  const {
    data,
    status,
    error,
    refresh,
  } = useFetch<RequestListResponse>('/api/requests', {
    query: apiQuery,
    default: () => ({ items: [], total: 0, page: 1, pageSize: prefs.pageSize }),
  })

  /** Модели представления — маппинг только здесь и в mappers.ts */
  const requests = computed<WorkflowRequest[]>(() =>
    (data.value?.items ?? []).map((raw) => toRequestCardModel(raw, dicts.value)),
  )

  const total = computed(() => data.value?.total ?? 0)
  const page = computed(() => filters.value.page)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / prefs.pageSize)))
  const isLoading = computed(() => status.value === 'pending')
  const isEmpty = computed(() => status.value === 'success' && requests.value.length === 0)

  /** Человекочитаемое сообщение об ошибке, включая HTTP 429 и 500 */
  const errorMessage = computed(() => {
    if (!error.value) return ''
    const statusCode = (error.value as { statusCode?: number }).statusCode
    if (statusCode === 429) return 'Слишком много запросов (429). Подождите немного и повторите.'
    if (statusCode === 500) return 'Сервер временно недоступен (500). Попробуйте ещё раз.'
    return 'Не удалось загрузить заявки. Проверьте соединение и повторите.'
  })

  function retry() {
    return refresh()
  }

  function setPage(p: number) {
    const next = Math.min(Math.max(1, p), pageCount.value)
    if (next !== page.value) update({ page: next })
  }

  return {
    filters,
    searchInput,
    requests,
    total,
    page,
    pageCount,
    isLoading,
    isEmpty,
    error,
    errorMessage,
    status,
    update,
    setPage,
    retry,
  }
}
