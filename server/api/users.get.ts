// GET /api/users — сотрудники. Только Operator/Admin (403 остальным, 401 анониму).
// Operator видит только активных, Admin — всех, включая деактивированных.
import type { ApiUser } from '#shared/types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, ['operator', 'admin'])
  const db = await getDb()

  const where = user.role === 'admin' ? '' : 'WHERE active = true'
  const { rows } = await db.query<ApiUser>(
    `SELECT id, name, email, role, active FROM users ${where} ORDER BY id`,
  )
  return { items: rows }
})
