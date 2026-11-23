// PATCH /api/categories/:id — правка категории. ТОЛЬКО Admin (403 остальным).
// Body: { name?, slug? } — Zod (400).
import { z } from 'zod'
import type { ApiCategory } from '#shared/types'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Название — минимум 2 символа').max(80).optional(),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'slug: строчные латинские буквы, цифры и дефис').optional(),
})

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const id = Number(getRouterParam(event, 'id') ?? 0)

  const parsed = bodySchema.safeParse(await readBody(event) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Невалидное тело запроса',
      data: { issues: parsed.error.issues },
    })
  }

  const db = await getDb()
  const { rows: existing } = await db.query('SELECT id FROM categories WHERE id = $1', [id])
  if (!existing.length) {
    throw createError({ statusCode: 404, statusMessage: 'Категория не найдена' })
  }

  if (parsed.data.name !== undefined) {
    await db.query('UPDATE categories SET name = $2 WHERE id = $1', [id, parsed.data.name])
  }
  if (parsed.data.slug !== undefined) {
    const { rows: dup } = await db.query('SELECT id FROM categories WHERE slug = $2 AND id <> $1', [
      id,
      parsed.data.slug,
    ])
    if (dup.length) {
      throw createError({ statusCode: 409, statusMessage: 'Категория с таким slug уже существует' })
    }
    await db.query('UPDATE categories SET slug = $2 WHERE id = $1', [id, parsed.data.slug])
  }

  const { rows } = await db.query<ApiCategory>(
    'SELECT id, name, slug FROM categories WHERE id = $1',
    [id],
  )
  return rows[0]
})
