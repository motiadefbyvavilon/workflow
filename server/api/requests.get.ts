// GET /api/requests — список заявок: поиск, фильтры, сортировка, пагинация.
// Query: search, status, category, priority, sort, page, pageSize.
// Авторизация обязательна (401 анониму); выдача ограничена по роли:
// Client — только свои, Agent — назначенные + созданные им, остальные — все.
import type { RequestListResponse } from '#shared/types'
import { visibilityClause, type RequestRow } from '../utils/access'

const PRIORITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

const SORTS: Record<string, string> = {
  updated_desc: 'r.updated_at DESC',
  created_desc: 'r.created_at DESC',
  priority: 'r.priority DESC, r.updated_at DESC',
  title: 'r.subject',
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await getDb()

  const query = getQuery(event)
  const search = String(query.search ?? '').trim()
  const status = String(query.status ?? '')
  const category = Number(query.category ?? 0) || 0
  const priority = String(query.priority ?? '')
  const sort = String(query.sort ?? 'updated_desc')
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 5) || 5))

  const visibility = visibilityClause(user)
  // параметр $1 используется только в условиях client/agent — иначе bind-ошибка PGlite
  const conditions: string[] = [visibility]
  const params: unknown[] = visibility.includes('$1') ? [user.id] : []

  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(r.id ILIKE $${params.length} OR r.subject ILIKE $${params.length} OR r.body ILIKE $${params.length})`)
  }
  if (status) {
    params.push(status)
    conditions.push(`r.status = $${params.length}`)
  }
  if (category) {
    params.push(category)
    conditions.push(`r.category_id = $${params.length}`)
  }
  if (priority in PRIORITY_WEIGHT) {
    // в БД priority — INTEGER-вес (4/3/2/1), API — строка
    params.push(PRIORITY_WEIGHT[priority])
    conditions.push(`r.priority = $${params.length}`)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const orderBy = SORTS[sort] ?? SORTS.updated_desc

  const { rows } = await db.query<RequestRow>(
    `SELECT r.id, r.subject, r.body, r.status, r.priority, r.category_id,
            r.author_id, r.customer_id, r.assignee_id, r.created_at, r.updated_at,
            au.name AS author_name, uu.name AS assignee_name
     FROM requests r
     JOIN users au ON au.id = r.author_id
     LEFT JOIN users uu ON uu.id = r.assignee_id
     ${where}
     ORDER BY ${orderBy}
     LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    params,
  )

  const { rows: countRows } = await db.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM requests r ${where}`,
    params,
  )

  const response: RequestListResponse = {
    items: rows,
    total: countRows[0]?.n ?? 0,
    page,
    pageSize,
  }
  return response
})
