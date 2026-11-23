// GET /api/requests/:id — одна заявка с хронологией и комментариями.
// 401 аноним, 404 нет такой, 403 нет прав (Client — только свои).
import type { ApiComment, ApiRequest, ApiTimelineEntry } from '#shared/types'
import { requireRequestAccess } from '../../utils/access'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  const { request } = await requireRequestAccess(event, id)
  const db = await getDb()

  const events = await db.query<ApiTimelineEntry>(
    `SELECT e.created_at AS at, e.actor_id, COALESCE(u.name, 'Система') AS actor_name, e.action
     FROM request_events e
     LEFT JOIN users u ON u.id = e.actor_id
     WHERE e.request_id = $1
     ORDER BY e.created_at`,
    [id],
  )

  const comments = await db.query<ApiComment>(
    `SELECT c.id, c.created_at AS at, c.author_id,
            COALESCE(u.name, 'Автор') AS author_name, c.text
     FROM comments c
     LEFT JOIN users u ON u.id = c.author_id
     WHERE c.request_id = $1
     ORDER BY c.created_at`,
    [id],
  )

  const response: ApiRequest = {
    ...request,
    timeline: events.rows,
    comments: comments.rows,
  }
  return response
})
