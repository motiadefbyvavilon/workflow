// Правила доступа к заявкам (уровень 4) — серверная истина прав:
// проверяются ПРИ КАЖДОЙ операции, независимо от того, что показывал UI.
//   Client — только свои заявки (author_id = свой id)
//   Agent — назначенные на него + созданные им
//   Operator/Admin — все
import type { H3Event } from 'h3'
import type { PGlite } from '@electric-sql/pglite'
import type { ApiRequestStatus, SessionUser } from '#shared/types'
import { requireUser } from './auth'

export interface RequestRow {
  id: string
  subject: string
  body: string
  status: ApiRequestStatus
  priority: number
  category_id: number
  author_id: number
  customer_id: number | null
  assignee_id: number | null
  created_at: string
  updated_at: string
  author_name?: string
  assignee_name?: string | null
}

/** Видит ли пользователь заявку (чтение) */
export function canViewRequest(user: SessionUser, req: Pick<RequestRow, 'author_id' | 'assignee_id'>): boolean {
  if (user.role === 'admin' || user.role === 'operator') return true
  if (user.role === 'agent') return req.assignee_id === user.id || req.author_id === user.id
  return req.author_id === user.id
}

/** SQL-условие видимости списка заявок для роли (params передаётся отдельно) */
export function visibilityClause(user: SessionUser): string {
  switch (user.role) {
    case 'client':
      return 'r.author_id = $1'
    case 'agent':
      return '(r.assignee_id = $1 OR r.author_id = $1)'
    default:
      return 'TRUE'
  }
}

const REQUEST_SELECT = `
  SELECT r.id, r.subject, r.body, r.status, r.priority, r.category_id,
         r.author_id, r.customer_id, r.assignee_id, r.created_at, r.updated_at,
         au.name AS author_name, uu.name AS assignee_name
  FROM requests r
  JOIN users au ON au.id = r.author_id
  LEFT JOIN users uu ON uu.id = r.assignee_id
`

export async function findRequest(db: PGlite, id: string): Promise<RequestRow | null> {
  const { rows } = await db.query<RequestRow>(`${REQUEST_SELECT} WHERE r.id = $1`, [id])
  return rows[0] ?? null
}

/**
 * Загружает заявку и проверяет доступ: 401 (аноним) → 404 (нет такой)
 * → 403 (нет прав). Возвращает { user, request } для дальнейших проверок.
 */
export async function requireRequestAccess(
  event: H3Event,
  id: string,
): Promise<{ user: SessionUser; request: RequestRow }> {
  const user = await requireUser(event)
  const db = await getDb()
  const request = await findRequest(db, id)
  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'Заявка не найдена' })
  }
  if (!canViewRequest(user, request)) {
    throw createError({ statusCode: 403, statusMessage: 'Нет доступа к этой заявке' })
  }
  return { user, request }
}
