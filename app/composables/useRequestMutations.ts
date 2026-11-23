// Мутации заявки: изменение статуса/приоритета/исполнителя и комментарии.
// Optimistic update: интерфейс обновляется мгновенно, запрос уходит в фоне;
// при ошибке API (409/500) — rollback к предыдущему значению с понятным
// сообщением, изменение попадает в Undo-стек (stores/requestUi.ts).
// Компоненты-потребители работают только с этим composable — детали
// хранения и отката им не важны.
import type { ApiComment, ApiPriority, ApiRequest, RequestPriority, RequestStatus } from '~~/shared/types'
import { PRIORITY_TO_API } from '~~/shared/types'
import { useRequestUiStore, type UndoableField } from '~/stores/requestUi'

function errorText(err: unknown): string {
  const statusCode = (err as { statusCode?: number })?.statusCode
  const statusMessage = (err as { statusMessage?: string })?.statusMessage
  if (statusCode === 401) return 'Сессия истекла (401). Выполните вход заново — изменение отменено.'
  if (statusCode === 409) return `Конфликт данных (409): ${statusMessage ?? 'изменение отклонено сервером'}`
  if (statusCode === 500) return 'Сервер временно недоступен (500). Изменение отменено.'
  return 'Не удалось сохранить изменение. Значение возвращено назад.'
}

/** Функция запроса — для тестов можно подставить мок (уровень 5) */
type Fetcher = <T>(url: string, options?: { method?: string; body?: unknown }) => Promise<T>

export function useRequestMutations(
  raw: Ref<ApiRequest | null>,
  refresh: () => Promise<void>,
  fetcher: Fetcher = $fetch as unknown as Fetcher,
) {
  const ui = useRequestUiStore()
  const busyField = ref<UndoableField | 'assignee' | 'comment' | null>(null)

  interface Patch {
    status?: RequestStatus
    priority?: ApiPriority
    assignee_id?: number
  }

  /** Меняет поле оптимистично: сразу в UI, потом PATCH; при ошибке — откат.
   *  ВАЖНО: data из useFetch — shallowRef, поэтому обновляем объект целиком
   *  (raw.value = {...}), а не мутируем вложенные поля. */
  async function patchField(field: 'status' | 'priority' | 'assignee', patch: Patch) {
    const current = raw.value
    if (!current || busyField.value) return

    const prev = { ...current }
    // 1. Optimistic update — мгновенно видно в интерфейсе
    raw.value = { ...current, ...patch }
    busyField.value = field

    try {
      const updated = await fetcher<ApiRequest>(`/api/requests/${current.id}`, { method: 'PATCH', body: patch })
      // сервер — источник истины: применяем его ответ
      raw.value = updated
      // 2. Успех — регистрируем изменение для Undo
      if (field === 'status' || field === 'priority') {
        ui.pushChange({
          requestId: current.id,
          field,
          from: { status: prev.status, priority: prev.priority },
          to: { status: updated.status, priority: updated.priority },
          at: Date.now(),
        })
      }
      ui.showNotice({ kind: 'success', text: 'Изменение сохранено' })
    } catch (err) {
      // 3. Rollback — возвращаем предыдущее значение
      raw.value = prev
      ui.showNotice({ kind: 'error', text: errorText(err) })
      // согласуемся с сервером на случай частичного изменения
      await refresh()
    } finally {
      busyField.value = null
    }
  }

  function setStatus(status: RequestStatus) {
    return patchField('status', { status })
  }

  function setPriority(priority: RequestPriority) {
    return patchField('priority', { priority: PRIORITY_TO_API[priority] })
  }

  function setAssignee(assignee_id: number | null) {
    const id = assignee_id ?? undefined
    return patchField('assignee', id !== undefined ? { assignee_id: id } : {})
  }

  /** Отмена последнего изменения статуса/приоритета */
  async function undo() {
    const change = ui.consumeChange()
    const current = raw.value
    if (!change || !current || current.id !== change.requestId) return

    const rolledBack: ApiRequest = { ...current, status: change.from.status, priority: change.from.priority }
    raw.value = rolledBack
    try {
      await fetcher(`/api/requests/${current.id}`, {
        method: 'PATCH',
        body: { status: change.from.status, priority: change.from.priority },
      })
      ui.showNotice({ kind: 'success', text: 'Изменение отменено (Undo)' })
    } catch (err) {
      raw.value = { ...rolledBack, status: change.to.status, priority: change.to.priority }
      ui.showNotice({ kind: 'error', text: errorText(err) })
      await refresh()
    }
  }

  const postingComment = ref(false)

  async function addComment(text: string) {
    const current = raw.value
    if (!current || postingComment.value || !text.trim()) return
    postingComment.value = true
    try {
      const created = await fetcher<ApiComment>(`/api/requests/${current.id}/comments`, {
        method: 'POST',
        body: { text: text.trim() },
      })
      // сервер вернул комментарий — добавляем его в данные заявки (shallowRef-safe)
      raw.value = {
        ...current,
        comments: [...(current.comments ?? []), created],
        updated_at: created.at,
      }
    } catch (err) {
      ui.showNotice({ kind: 'error', text: errorText(err) })
    } finally {
      postingComment.value = false
    }
  }

  return { busyField, postingComment, setStatus, setPriority, setAssignee, undo, addComment }
}
