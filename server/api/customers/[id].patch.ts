// PATCH /api/customers/:id — правка заказчика. Operator/Admin (403 остальным).
// Body: { name?, company?, email? } — Zod (400).
import { z } from 'zod'
import type { ApiCustomer } from '#shared/types'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Имя — минимум 2 символа').max(120).optional(),
  company: z.string().trim().max(200).nullable().optional(),
  email: z.email('Некорректный email').nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireUser(event, ['operator', 'admin'])
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
  const { rows: existing } = await db.query('SELECT id FROM customers WHERE id = $1', [id])
  if (!existing.length) {
    throw createError({ statusCode: 404, statusMessage: 'Заказчик не найден' })
  }

  if (parsed.data.name !== undefined) {
    await db.query('UPDATE customers SET name = $2 WHERE id = $1', [id, parsed.data.name])
  }
  if (parsed.data.company !== undefined) {
    await db.query('UPDATE customers SET company = $2 WHERE id = $1', [id, parsed.data.company])
  }
  if (parsed.data.email !== undefined) {
    await db.query('UPDATE customers SET email = $2 WHERE id = $1', [id, parsed.data.email])
  }

  const { rows } = await db.query<ApiCustomer>(
    'SELECT id, name, company, email FROM customers WHERE id = $1',
    [id],
  )
  return rows[0]
})
