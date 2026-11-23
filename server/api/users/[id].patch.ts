// PATCH /api/users/:id — смена роли/активности. ТОЛЬКО Admin (403 остальным).
// Body: { role?, active? } — Zod (400).
import { z } from 'zod'
import type { ApiUser } from '#shared/types'

const bodySchema = z.object({
  role: z.enum(['client', 'operator', 'agent', 'admin']).optional(),
  active: z.boolean().optional(),
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
  const { rows: existing } = await db.query('SELECT id FROM users WHERE id = $1', [id])
  if (!existing.length) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  }

  if (parsed.data.role !== undefined) {
    await db.query('UPDATE users SET role = $2 WHERE id = $1', [id, parsed.data.role])
  }
  if (parsed.data.active !== undefined) {
    await db.query('UPDATE users SET active = $2 WHERE id = $1', [id, parsed.data.active])
  }

  const { rows } = await db.query<ApiUser>(
    'SELECT id, name, email, role, active FROM users WHERE id = $1',
    [id],
  )
  return rows[0]
})
