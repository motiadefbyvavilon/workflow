// DELETE /api/categories/:id — удаление категории. ТОЛЬКО Admin (403 остальным).
// 409, если по категории есть заявки (нельзя удалить используемую).
export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const id = Number(getRouterParam(event, 'id') ?? 0)

  const db = await getDb()
  const { rows: existing } = await db.query('SELECT id FROM categories WHERE id = $1', [id])
  if (!existing.length) {
    throw createError({ statusCode: 404, statusMessage: 'Категория не найдена' })
  }

  const { rows: used } = await db.query(
    'SELECT COUNT(*)::int AS n FROM requests WHERE category_id = $1',
    [id],
  )
  if (used[0].n > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Нельзя удалить категорию, по которой есть заявки' })
  }

  await db.query('DELETE FROM categories WHERE id = $1', [id])
  return { ok: true }
})
