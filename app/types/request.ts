// Доменная модель заявки WorkFlow (уровень 1 — локальные mock-данные)

export type RequestStatus = 'new' | 'in_progress' | 'waiting' | 'done' | 'cancelled'

export type RequestPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TimelineEntry {
  id: string
  at: string // ISO
  actor: string
  action: string
}

export interface RequestComment {
  id: string
  at: string // ISO
  author: string
  text: string
}

export interface WorkflowRequest {
  id: string
  title: string
  description: string
  status: RequestStatus
  priority: RequestPriority
  author: string
  authorCompany?: string
  assignee: string
  category: string
  createdAt: string
  updatedAt: string
  tags: string[]
  timeline: TimelineEntry[]
  comments: RequestComment[]
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  waiting: 'Ожидает ответа',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критичный',
}
