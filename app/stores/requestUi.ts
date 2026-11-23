// UI-состояние мутаций заявок — app-level state, общее для страниц.
// Хранит только то, что реально нужно нескольким потребителям:
// UndoableChange — последнее изменение (для Undo), notice — транзакционное
// уведомление (rollback/успех). Сами данные заявок здесь НЕ хранятся —
// это server state и остаётся в useFetch/кэше Nuxt.
import type { RequestPriority, RequestStatus } from '~/types/request'

export type UndoableField = 'status' | 'priority'

export interface UndoableChange {
  requestId: string
  field: UndoableField
  from: { status: RequestStatus; priority: RequestPriority }
  to: { status: RequestStatus; priority: RequestPriority }
  at: number
}

export interface UiNotice {
  kind: 'success' | 'error'
  text: string
}

export const useRequestUiStore = defineStore('request-ui', () => {
  const lastChange = ref<UndoableChange | null>(null)
  const notice = ref<UiNotice | null>(null)

  let noticeTimer: ReturnType<typeof setTimeout> | undefined

  function pushChange(change: UndoableChange) {
    lastChange.value = change
  }

  /** Забрать изменение для Undo (одноразово) */
  function consumeChange(): UndoableChange | null {
    const change = lastChange.value
    lastChange.value = null
    return change
  }

  function showNotice(next: UiNotice) {
    notice.value = next
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => {
      notice.value = null
    }, 5000)
  }

  function clearNotice() {
    if (noticeTimer) clearTimeout(noticeTimer)
    notice.value = null
  }

  return { lastChange, notice, pushChange, consumeChange, showNotice, clearNotice }
})
