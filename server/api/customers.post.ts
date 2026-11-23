// POST /api/customers — новый заказчик. Operator/Admin (403 остальным).
// Body: { name, company?, email? } — Zod (400).
import { z } from 'zod'
import type { ApiCustomer } from '#shared/types'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Имя — минимум 2 символа').max(120),
  company: z.string().trim().max(200).nullish(),
  email: z.email('Некорректный email').nullish(),
})

export default defineEventHandler(async (event) => {
  await requireUser(event, ['operator', 'admin'])

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Невалидное тело запроса',
      data: { issues: parsed.error.issues },
    })
  }

  const db = await getDb()
  const { rows } = await db.query<ApiCustomer>(
    'INSERT INTO customers (name, company, email) VALUES ($1, $2, $3) RETURNING id, name, company, email',
    [parsed.data.name, parsed.data.company ?? null, parsed.data.email ?? null],
  )
  return rows[0]
})
