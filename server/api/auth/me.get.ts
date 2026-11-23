// GET /api/auth/me — текущий пользователь сессии. 401 для анонима.
import type { SessionUser } from '#shared/types'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }
  return user satisfies SessionUser
})
