// GET /api/categories — справочник категорий. Любой авторизованный (401 анониму).
import type { ApiCategory } from '#shared/types'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const db = await getDb()
  const { rows } = await db.query<ApiCategory>(
    'SELECT id, name, slug FROM categories ORDER BY id',
  )
  return { items: rows }
})
