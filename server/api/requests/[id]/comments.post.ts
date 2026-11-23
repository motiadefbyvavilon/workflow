// POST /api/requests/:id/comments — добавление комментария.
// Любой авторизованный с доступом к заявке. Body: { text } — Zod (400).
import { z } from 'zod'
import type { ApiComment } from '#shared/types'
import { requireRequestAccess } from '../../../utils/access'

const bodySchema = z.object({
  text: z.string().trim().min(1, 'Пустой комментарий').max(2000, 'Комментарий слишком длинный'),
})

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  const { user } = await requireRequestAccess(event, id)

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Невалидное тело запроса',
      data: { issues: parsed.error.issues },
    })
  }

  const db = await getDb()
  const now = new Date().toISOString()
  const { rows } = await db.query<ApiComment>(
    `INSERT INTO comments (request_id, author_id, text, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at AS at, author_id, text`,
    [id, user.id, parsed.data.text, now],
  )

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось сохранить комментарий' })
  }
  const comment: ApiComment = {
    id: row.id,
    at: row.at,
    author_id: row.author_id,
    text: row.text,
    author_name: user.name,
  }
  await db.query('UPDATE requests SET updated_at = $2 WHERE id = $1', [id, now])
  return comment
})
