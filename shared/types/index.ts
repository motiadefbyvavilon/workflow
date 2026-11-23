// Общие типы WorkFlow (уровень 4): единый источник для фронтенда (app/)
// и бэкенда (server/). Сюда попадают только действительно общие модели —
// без серверных деталей (password_hash, SQL) и без привязки к UI.

// ─── Роли и пользователи ─────────────────────────────────────────────────────

export type Role = 'client' | 'operator' | 'agent' | 'admin'

export const ROLE_LABELS: Record<Role, string> = {
  client: 'Клиент',
  operator: 'Оператор',
  agent: 'Сотрудник поддержки',
  admin: 'Администратор',
}

/** Пользователь как сущность БД (публичные поля; пароль никогда не отдаём) */
export interface User {
  id: number
  name: string
  email: string
  role: Role
  active: boolean
  created_at: string
}

/** Текущий пользователь сессии — то, что отдают /api/auth/* */
export interface SessionUser {
  id: number
  name: string
  email: string
  role: Role
}

// ─── Заявки ──────────────────────────────────────────────────────────────────

export type RequestStatus = 'new' | 'in_progress' | 'waiting' | 'done' | 'cancelled'

export type RequestPriority = 'low' | 'medium' | 'high' | 'critical'

/** 1 — низкий … 4 — критичный (как хранится в БД и отдаёт API) */
export type ApiPriority = 1 | 2 | 3 | 4

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критичный',
}

export const PRIORITY_TO_API: Record<RequestPriority, ApiPriority> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

export const API_TO_PRIORITY: Record<ApiPriority, RequestPriority> = {
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'critical',
}

// ─── Сырые модели API (snake_case, id-ссылки) ───────────────────────────────

/** Сотрудник/пользователь как отдаёт API (в списке /api/users) */
export interface ApiUser {
  id: number
  name: string
  email: string
  role: Role
  active: boolean
}

export interface ApiCustomer {
  id: number
  name: string
  company?: string | null
  email?: string | null
}

export interface ApiCategory {
  id: number
  name: string
  slug: string
}

export interface ApiTimelineEntry {
  at: string
  actor_id: number
  /** Имя автора события (join на сервере) — клиентам не нужен список users */
  actor_name?: string
  action: string
}

export interface ApiComment {
  id: number
  at: string
  author_id: number
  author_name?: string
  text: string
}

/** Заявка как отдаёт API. Формат полей сохранён с уровня 2 (snake_case,
 *  строковые id вида WF-101), чтобы фронтенд-мапперы продолжили работать. */
export interface ApiRequest {
  id: string
  subject: string
  body: string
  status: RequestStatus
  priority: ApiPriority
  category_id: number
  author_id: number
  customer_id?: number | null
  assignee_id?: number | null
  created_at: string
  updated_at: string
  /** Join-имена — чтобы любая роль видела авторов без доступа к /api/users */
  author_name?: string
  assignee_name?: string | null
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

// ─── Модели представления (view models) ──────────────────────────────────────

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
