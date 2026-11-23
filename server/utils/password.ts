// Хеширование паролей (scrypt + соль). Отдельный модуль без зависимостей
// от БД — чтобы unit-тесты не тянули PGlite (уровень 5).
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb)

/** Формат хранения: "salt:hash" (hex) */
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
