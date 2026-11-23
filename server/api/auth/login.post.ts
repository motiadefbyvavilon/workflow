// POST /api/auth/login — {email, password} → сессия + httpOnly cookie.
// 401 при неверных credentials; 400 при невалидном теле (Zod).
import { z } from 'zod'
import type { SessionUser } from '#shared/types'

const bodySchema = z.object({
  email: z.email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Невалидное тело запроса',
      data: { issues: parsed.error.issues },
    })
  }

  const db = await getDb()
  const { rows } = await db.query<SessionUser & { password_hash: string; active: boolean }>(
    'SELECT id, name, email, role, password_hash, active FROM users WHERE email = $1',
    [parsed.data.email.toLowerCase().trim()],
  )
  const user = rows[0]

  // Одна и та же ошибка для «нет такого email» и «пароль неверный» —
  // не раскрываем, какие адреса зарегистрированы.
  const ok = user && user.active && (await verifyPassword(parsed.data.password, user.password_hash))
  if (!ok || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Неверный email или пароль' })
  }

  const sessionId = await createSession(user.id)
  setCookie(event, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  return { id: user.id, name: user.name, email: user.email, role: user.role } satisfies SessionUser
})
