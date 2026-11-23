// POST /api/categories — новая категория. ТОЛЬКО Admin (403 остальным).
// Body: { name, slug } — Zod (400).
import { z } from 'zod'
import type { ApiCategory } from '#shared/types'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Название — минимум 2 символа').max(80),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'slug: строчные латинские буквы, цифры и дефис'),
})

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Невалидное тело запроса',
      data: { issues: parsed.error.issues },
    })
  }

  const db = await getDb()
  const { rows: dup } = await db.query('SELECT id FROM categories WHERE slug = $1', [
    parsed.data.slug,
  ])
  if (dup.length) {
    throw createError({ statusCode: 409, statusMessage: 'Категория с таким slug уже существует' })
  }

  const { rows } = await db.query<ApiCategory>(
    'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug',
    [parsed.data.name, parsed.data.slug],
  )
  return rows[0]
})
