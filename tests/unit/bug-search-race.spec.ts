// Регрессия (уровень 5): устаревший ответ поиска перезаписывал более новый
// результат, а устаревший debounce-тик после навигации «назад» возвращал
// старый поиск. Фикс: порядковый номер запроса (устаревшие ответы игнорируются)
// и guard'ы в watch(debouncedSearch) (значение должно совпадать с полем ввода,
// URL и текущим состоянием). Тесты на поведении через подмену Nuxt-глобалов.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive, ref } from 'vue'
import type { RequestListResponse } from '~~/shared/types'
import { useRequests } from '~/composables/useRequests'

const g = globalThis as Record<string, unknown>

interface Deferred {
  resolve: (value: RequestListResponse) => void
  reject: (err: unknown) => void
}

function makeResponse(mark: string): RequestListResponse {
  return {
    items: [
      {
        id: mark,
        subject: `Заявка ${mark}`,
        body: 'Описание',
        status: 'new',
        priority: 2,
        category_id: 1,
        author_id: 5,
        created_at: '2026-11-23T00:00:00.000Z',
        updated_at: '2026-11-23T00:00:00.000Z',
      },
    ],
    total: 1,
    page: 1,
    pageSize: 5,
  }
}

function flush() {
  return nextTick().then(() => nextTick())
}

describe('bug: гонка поиска (useRequests)', () => {
  let route: { query: Record<string, string>; fullPath: string }
  let fetchDeferreds: Deferred[]
  let fetchCalls: { url: string; query: Record<string, unknown> }[]
  let replaceCalls: Record<string, unknown>[]
  let expireSession: ReturnType<typeof vi.fn>
  let navigateTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // как в vue-router: query — НОВЫЙ объект на каждую навигацию
    route = reactive({ query: {}, fullPath: '/' }) as {
      query: Record<string, string>
      fullPath: string
    }
    fetchDeferreds = []
    fetchCalls = []
    replaceCalls = []
    expireSession = vi.fn()
    navigateTo = vi.fn()

    g.useRoute = () => route
    g.useRouter = () => ({
      replace: (to: { query: Record<string, unknown> }) => {
        replaceCalls.push(to.query)
        route.query = { ...to.query } as Record<string, string>
        return Promise.resolve()
      },
    })
    g.useDictionaries = () => ({
      dicts: computed(() => ({ users: new Map(), customers: new Map(), categories: new Map() })),
      categories: ref([]),
    })
    g.usePreferencesStore = () => ({
      pageSize: ref(5),
      defaultSort: ref('updated_desc'),
      setPageSize: () => {},
      setDefaultSort: () => {},
    })
    g.useAuthStore = () => ({ me: ref(null), expireSession })
    g.navigateTo = navigateTo
    g.$fetch = (url: string, options?: { query: Record<string, unknown> }) => {
      fetchCalls.push({ url, query: options?.query ?? {} })
      return new Promise<never>((resolve, reject) => {
        fetchDeferreds.push({ resolve: resolve as Deferred['resolve'], reject })
      })
    }
  })

  it('устаревший ответ не перезаписывает более новый результат', async () => {
    const list = useRequests()

    list.update({ search: 'foo' })
    await flush()
    list.update({ search: 'bar' })
    await flush()

    expect(fetchCalls).toHaveLength(2)

    // новый ответ приходит ПЕРВЫМ, старый — позже (гонка)
    fetchDeferreds[1].resolve(makeResponse('WF-BAR'))
    await flush()
    expect(list.requests.value.map((r) => r.id)).toEqual(['WF-BAR'])

    fetchDeferreds[0].resolve(makeResponse('WF-FOO'))
    await flush()
    // устаревший ответ проигнорирован — данные не перезаписаны
    expect(list.requests.value.map((r) => r.id)).toEqual(['WF-BAR'])
    expect(list.isLoading.value).toBe(false)
  })

  it('устаревший debounce-тик после навигации назад не возвращает старый поиск', async () => {
    vi.useFakeTimers()
    try {
      const list = useRequests()

      // пользователь ввёл запрос — ушло в URL
      list.searchInput.value = 'старый запрос'
      await vi.advanceTimersByTimeAsync(350)
      await flush()
      expect(replaceCalls.at(-1)).toMatchObject({ search: 'старый запрос' })

      // навигация «назад»: URL очищен, поле ввода синхронизировано
      route.query = {}
      await flush()
      expect(list.searchInput.value).toBe('')

      // пользователь сразу печатает новый запрос
      list.searchInput.value = 'новый'
      await vi.advanceTimersByTimeAsync(350)
      await flush()

      // применился ТОЛЬКО новый поиск: ни один вызов replace после навигации
      // не вернул 'старый запрос' обратно
      const callsAfterBackNav = replaceCalls.slice(
        replaceCalls.findIndex((q) => q.search === 'старый запрос') + 1,
      )
      expect(callsAfterBackNav.at(-1)).toMatchObject({ search: 'новый' })
      for (const call of callsAfterBackNav) {
        expect(call.search ?? '').not.toBe('старый запрос')
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('смена фильтра сбрасывает страницу на первую', async () => {
    const list = useRequests()

    list.update({ page: 3 })
    await flush()
    expect(list.page.value).toBe(3)

    list.update({ status: 'new' })
    await flush()
    expect(list.page.value).toBe(1)
  })

  it('HTTP 401: сессия сброшена, навигация на /login с redirect', async () => {
    const list = useRequests()

    list.update({ search: 'x' })
    await flush()
    fetchDeferreds[0].reject(Object.assign(new Error('unauthorized'), { statusCode: 401 }))
    await flush()

    expect(expireSession).toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/login', query: expect.objectContaining({ redirect: '/' }) }),
    )
    expect(list.errorMessage.value).toContain('Сессия истекла')
  })
})
