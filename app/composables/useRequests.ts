// Слой данных: список заявок с API с поиском, фильтрами, сортировкой
// и пагинацией. Состояние параметров живёт в URL (query) — прямая ссылка
// полностью восстанавливает страницу после перезагрузки.
//
// Уровень 5 (надёжность): ручной fetch с порядковым номером запроса —
// устаревший ответ (пришёл позже более нового) игнорируется и не
// перезаписывает актуальные данные; устаревший debounce-тик после
// браузерной навигации «назад/вперёд» не применяется. HTTP 401 в любом
// запросе → сброс сессии и редирект на /login с параметром redirect.
import type { RequestListResponse, RequestPriority, RequestStatus, WorkflowRequest } from '~~/shared/types'
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
  const auth = useAuthStore()

  /** Чтение состояния фильтров из URL — восстановление по прямой ссылке.
   *  Сортировка по умолчанию — из пользовательских настроек (уровень 5:
   *  настройка defaultSort переживает перезагрузку и реально применяется). */
  function fromQuery(): RequestsQuery {
    const q = route.query
    const sort = String(q.sort ?? '') as SortKey
    const fallback: SortKey = prefs.defaultSort in SORT_LABELS ? prefs.defaultSort : 'updated_desc'
    return {
      search: String(q.search ?? ''),
      status: (String(q.status ?? '') || '') as RequestsQuery['status'],
      priority: (String(q.priority ?? '') || '') as RequestsQuery['priority'],
      category: Number(q.category ?? 0) || 0,
      sort: sort in SORT_LABELS ? sort : fallback,
      page: Math.max(1, Number(q.page ?? 1) || 1),
    }
  }

  const filters = ref<RequestsQuery>(fromQuery())

  /** Локальное поле поиска — в URL уходит только debounce-версия */
  const searchInput = ref(filters.value.search)
  const debouncedSearch = useDebouncedRef(searchInput, DEBOUNCE_MS)

  // Регрессия (уровень 5, гонка поиска): применяем debounce-значение только
  // если оно всё ещё актуально — равно текущему полю ввода, не совпадает с
  // уже записанным в URL и не совпадает с текущим состоянием фильтров.
  // Иначе устаревший тик после навигации назад/вперёд перезаписывал бы
  // более новое состояние поиска.
  watch(debouncedSearch, (value) => {
    if (value !== searchInput.value) return // тик устарел: ввод уже другой
    if (value === String(route.query.search ?? '')) return // уже синхронизировано с URL
    if (value !== filters.value.search) update({ search: value, page: 1 })
  })

  // Синхронизация с браузерной навигацией (назад/вперёд). Границы (уровень 5):
  // не трогаем состояние, если URL идентичен текущему — иначе собственный
  // router.replace порождал бы лишние циклы и запросы.
  watch(
    () => route.query,
    () => {
      const next = fromQuery()
      const current = filters.value
      const same =
        next.search === current.search &&
        next.status === current.status &&
        next.priority === current.priority &&
        next.category === current.category &&
        next.sort === current.sort &&
        next.page === current.page
      if (same) return
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

  // ─── Данные: ручной fetch с защитой от гонок (уровень 5) ─────────────────
  const data = ref<RequestListResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize: prefs.pageSize,
  })
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<Error | null>(null)

  /** Порядковый номер последнего запроса: ответ с меньшим номером —
   *  устаревший и игнорируется. */
  let requestSeq = 0

  /** HTTP 401 в любом запросе: сессия протухла → сброс auth и редирект */
  function handleAuthError(err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode
    if (statusCode === 401) {
      auth.expireSession()
      navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  }

  async function load(): Promise<void> {
    const seq = ++requestSeq
    status.value = 'pending'
    try {
      const res = await $fetch<RequestListResponse>('/api/requests', { query: apiQuery.value })
      if (seq !== requestSeq) return // гонка: пришёл устаревший ответ
      data.value = res
      error.value = null
      status.value = 'success'
    } catch (err) {
      if (seq !== requestSeq) return // гонка: ошибка от устаревшего запроса
      error.value = err as Error
      status.value = 'error'
      handleAuthError(err)
    }
  }

  // Первый запрос и любое изменение параметров → загрузка.
  // SSR не выполняет запрос: относительный $fetch на сервере требует
  // абсолютного URL, поэтому список загружается на клиенте (skeleton —
  // как и при переключении страниц).
  if (import.meta.client) {
    load()
  }

  watch(apiQuery, () => {
    error.value = null
    load()
  })

  /** Модели представления — маппинг только здесь и в mappers.ts */
  const requests = computed<WorkflowRequest[]>(() =>
    (data.value?.items ?? []).map((raw) => toRequestCardModel(raw, dicts.value)),
  )

  const total = computed(() => data.value?.total ?? 0)
  const page = computed(() => filters.value.page)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / prefs.pageSize)))
  const isLoading = computed(() => status.value === 'pending' || status.value === 'idle')
  const isEmpty = computed(() => status.value === 'success' && requests.value.length === 0)

  /** Человекочитаемое сообщение об ошибке, включая HTTP 401/409/429/500 */
  const errorMessage = computed(() => {
    if (!error.value) return ''
    const statusCode = (error.value as { statusCode?: number }).statusCode
    if (statusCode === 401) return 'Сессия истекла. Выполните вход заново.'
    if (statusCode === 409) return 'Конфликт данных (409). Обновите страницу и повторите.'
    if (statusCode === 429) return 'Слишком много запросов (429). Подождите немного и повторите.'
    if (statusCode === 500) return 'Сервер временно недоступен (500). Попробуйте ещё раз.'
    return 'Не удалось загрузить заявки. Проверьте соединение и повторите.'
  })

  function retry() {
    error.value = null
    return load()
  }

  function setPage(p: number) {
    const next = Math.min(Math.max(1, p), pageCount.value)
    if (next !== page.value) update({ page: next })
  }

  // Переключение фильтров всегда возвращает на первую страницу
  // (источники по одному — иначе массив-геттер триггерится на любое изменение)
  watch(
    [() => filters.value.status, () => filters.value.priority, () => filters.value.category],
    () => {
      if (page.value !== 1) update({ page: 1 })
    },
  )

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
