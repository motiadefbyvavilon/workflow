// useRequestMutations (уровень 5): optimistic update, rollback при 409/500/401,
// undo, комментарии. Fetcher подменяется моком — поведение, не реализация.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type { ApiRequest } from '~~/shared/types'
import { useRequestMutations } from '~/composables/useRequestMutations'
import { useRequestUiStore } from '~/stores/requestUi'

// auto-import в Nuxt; в тестах — явная связка store
;(globalThis as Record<string, unknown>).useRequestUiStore = useRequestUiStore

type Fetcher = (url: string, options?: { method?: string; body?: unknown }) => Promise<never>

function makeRequest(overrides: Partial<ApiRequest> = {}): ApiRequest {
  return {
    id: 'WF-1',
    subject: 'Тема',
    body: 'Описание заявки',
    status: 'new',
    priority: 2,
    category_id: 1,
    author_id: 5,
    created_at: '2026-11-23T00:00:00.000Z',
    updated_at: '2026-11-23T00:00:00.000Z',
    ...overrides,
  }
}

function setup(fetcherImpl: Fetcher) {
  const raw: Ref<ApiRequest | null> = ref(makeRequest())
  const refresh = vi.fn().mockResolvedValue(undefined)
  const mutations = useRequestMutations(raw, refresh, fetcherImpl)
  const ui = useRequestUiStore()
  return { raw, refresh, mutations, ui }
}

describe('useRequestMutations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('optimistic update: статус меняется мгновенно, потом подтверждается сервером', async () => {
    const serverVersion = makeRequest({ status: 'in_progress' })
    const fetcher = vi.fn().mockResolvedValue(serverVersion) as unknown as Fetcher
    const { raw, mutations, ui } = setup(fetcher)

    const pending = mutations.setStatus('in_progress')
    expect(raw.value?.status).toBe('in_progress') // optimistic — до ответа сервера
    await pending
    expect(raw.value).toEqual(serverVersion) // источник истины — ответ сервера
    expect(ui.lastChange?.field).toBe('status')
    expect(ui.notice?.kind).toBe('success')
  })

  it('rollback при 409: значение возвращается, есть понятное уведомление', async () => {
    const conflict = Object.assign(new Error('conflict'), {
      statusCode: 409,
      statusMessage: 'Конфликт: отменённую заявку нельзя вернуть в работу',
    })
    const fetcher = vi.fn().mockRejectedValue(conflict) as unknown as Fetcher
    const { raw, mutations, ui, refresh } = setup(fetcher)

    await mutations.setStatus('in_progress')
    expect(raw.value?.status).toBe('new') // откат к предыдущему значению
    expect(ui.notice?.kind).toBe('error')
    expect(ui.notice?.text).toContain('409')
    expect(refresh).toHaveBeenCalled() // синхронизация с сервером
  })

  it('rollback при 500: значение возвращается', async () => {
    const failure = Object.assign(new Error('boom'), { statusCode: 500 })
    const fetcher = vi.fn().mockRejectedValue(failure) as unknown as Fetcher
    const { raw, mutations, ui } = setup(fetcher)

    await mutations.setPriority('high')
    expect(raw.value?.priority).toBe(2)
    expect(ui.notice?.text).toContain('500')
  })

  it('401: понятное сообщение о протухшей сессии, значение возвращается', async () => {
    const unauthorized = Object.assign(new Error('unauthorized'), { statusCode: 401 })
    const fetcher = vi.fn().mockRejectedValue(unauthorized) as unknown as Fetcher
    const { raw, mutations, ui } = setup(fetcher)

    await mutations.setStatus('in_progress')
    expect(raw.value?.status).toBe('new')
    expect(ui.notice?.text).toContain('401')
    expect(ui.notice?.text).toContain('Сессия истекла')
  })

  it('undo: возвращает предыдущее значение через PATCH', async () => {
    const calls: unknown[] = []
    const fetcher = vi.fn(async (url: string, options?: { body?: unknown }) => {
      calls.push(options?.body)
      return makeRequest({ status: 'in_progress' })
    }) as unknown as Fetcher
    const { mutations } = setup(fetcher)

    await mutations.setStatus('in_progress')
    await mutations.undo()
    // второй PATCH — с телом отката к исходному статусу
    expect(calls[1]).toEqual({ status: 'new', priority: 2 })
  })

  it('undo при ошибке сервера: значение восстановлено к «to», показана ошибка', async () => {
    let n = 0
    const fetcher = vi.fn(async () => {
      n += 1
      if (n === 1) return makeRequest({ status: 'in_progress' })
      throw Object.assign(new Error('conflict'), { statusCode: 409 })
    }) as unknown as Fetcher
    const { raw, mutations, ui } = setup(fetcher)

    await mutations.setStatus('in_progress')
    await mutations.undo()
    expect(raw.value?.status).toBe('in_progress') // откат неудачного undo
    expect(ui.notice?.kind).toBe('error')
  })

  it('addComment: серверный комментарий добавляется в данные заявки', async () => {
    const created = { id: 42, at: '2026-11-23T01:00:00.000Z', author_id: 5, author_name: 'Анна', text: 'Привет' }
    const fetcher = vi.fn().mockResolvedValue(created) as unknown as Fetcher
    const { raw, mutations } = setup(fetcher)

    await mutations.addComment('Привет')
    expect(raw.value?.comments?.at(-1)).toEqual(created)
  })
})
