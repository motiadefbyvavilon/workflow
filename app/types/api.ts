// Модели API (сырые, как их отдаёт backend). Обязательные и необязательные
// поля различаются явно — фронтенд обязан корректно отображать записи,
// в которых необязательные поля отсутствуют.

export interface ApiUser {
  id: number
  name: string
  role: 'admin' | 'agent' | 'observer'
  email: string
}

export interface ApiCustomer {
  id: number
  name: string
  company?: string
  email?: string
}

export interface ApiCategory {
  id: number
  name: string
  slug: string
}

export type ApiRequestStatus = 'new' | 'in_progress' | 'waiting' | 'done' | 'cancelled'

/** 1 — низкий … 4 — критичный */
export type ApiPriority = 1 | 2 | 3 | 4

export interface ApiTimelineEntry {
  at: string
  actor_id: number
  action: string
}

export interface ApiComment {
  at: string
  author_id: number
  text: string
}

export interface ApiRequest {
  id: string
  subject: string
  body: string
  status: ApiRequestStatus
  priority: ApiPriority
  category_id: number
  author_id: number
  assignee_id?: number
  created_at: string
  updated_at: string
  tags?: string[]
  timeline?: ApiTimelineEntry[]
  comments?: ApiComment[]
}

export interface RequestListResponse {
  items: ApiRequest[]
  total: number
  page: number
  pageSize: number
}

export interface ListResponse<T> {
  items: T[]
}
