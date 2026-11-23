// GET /api/requests/:id/comments — комментарии заявки.
// Доступ — как к самой заявке (401 / 404 / 403).
import type { ApiComment } from '#shared/types'
import { requireRequestAccess } from '../../../utils/access'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  await requireRequestAccess(event, id)
  const db = await getDb()

  const { rows } = await db.query<ApiComment>(
    `SELECT c.id, c.created_at AS at, c.author_id,
            COALESCE(u.name, 'Автор') AS author_name, c.text
     FROM comments c
     LEFT JOIN users u ON u.id = c.author_id
     WHERE c.request_id = $1
     ORDER BY c.created_at`,
    [id],
  )
  return { items: rows }
})
