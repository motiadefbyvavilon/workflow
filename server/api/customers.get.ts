// GET /api/customers — справочник заказчиков. Любой авторизованный (401 анониму).
import type { ApiCustomer } from '#shared/types'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const db = await getDb()
  const { rows } = await db.query<ApiCustomer>(
    'SELECT id, name, company, email FROM customers ORDER BY id',
  )
  return { items: rows }
})
