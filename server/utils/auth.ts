// Серверная авторизация (уровень 4): scrypt-хеширование паролей, сессии
// в PostgreSQL, httpOnly-cookie wf_session, проверка прав ДЛЯ КАЖДОЙ
// защищённой операции. Скрытие кнопок на фронте — только UX; истина здесь.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { H3Event } from 'h3'
import type { Role, SessionUser } from '#shared/types'

const scrypt = promisify(scryptCb)

export const SESSION_COOKIE = 'wf_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 дней

// ─── Пароли (scrypt + соль, формат "salt:hash" в hex) ───────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = (await scrypt(password, salt, expected.length)) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// ─── Сессии ─────────────────────────────────────────────────────────────────

export async function createSession(userId: number): Promise<string> {
  const db = await getDb()
  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  await db.query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [
    id,
    userId,
    expiresAt,
  ])
  return id
}

export async function destroySession(id: string): Promise<void> {
  const db = await getDb()
  await db.query('DELETE FROM sessions WHERE id = $1', [id])
}

/** Пользователь текущей сессии или null (аноним / протухшая сессия) */
export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const id = getCookie(event, SESSION_COOKIE)
  if (!id) return null
  const db = await getDb()
  const res = await db.query<SessionUser & { expires_at: string }>(
    `SELECT u.id, u.name, u.email, u.role, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [id],
  )
  const row = res.rows[0]
  if (!row) return null
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await destroySession(id)
    return null
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role }
}

/** Обязательная авторизация: нет сессии → 401, роль не подходит → 403 */
export async function requireUser(event: H3Event, roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }
  if (roles && !roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Недостаточно прав для этой операции' })
  }
  return user
}
