// Интеграция (уровень 5): серверные бизнес-правила, не требующие БД.
// node-окружение — серверные модули без DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/utils/password'
import { canViewRequest, visibilityClause } from '../../server/utils/access'
import type { SessionUser } from '../../shared/types'

describe('password (scrypt)', () => {
  it('roundtrip: верный пароль проходит, хеш не содержит пароль открытым текстом', async () => {
    const hash = await hashPassword('secret123')
    expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/)
    expect(hash).not.toContain('secret123')
    await expect(verifyPassword('secret123', hash)).resolves.toBe(true)
  })

  it('неверный пароль отклоняется', async () => {
    const hash = await hashPassword('secret123')
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false)
  })

  it('каждый хеш уникален (случайная соль)', async () => {
    const a = await hashPassword('same')
    const b = await hashPassword('same')
    expect(a).not.toBe(b)
  })

  it('битый формат хеша не падает', async () => {
    await expect(verifyPassword('x', 'garbage')).resolves.toBe(false)
  })
})

describe('access rules (права на заявки)', () => {
  const client = { id: 5, role: 'client' } as SessionUser
  const agentAssigned = { id: 1, role: 'agent' } as SessionUser
  const agentOther = { id: 2, role: 'agent' } as SessionUser
  const operator = { id: 4, role: 'operator' } as SessionUser
  const admin = { id: 3, role: 'admin' } as SessionUser

  const own = { author_id: 5, assignee_id: 1 }
  const assignedOnly = { author_id: 6, assignee_id: 1 }
  const foreign = { author_id: 6, assignee_id: 2 }

  it('client видит только свои заявки', () => {
    expect(canViewRequest(client, own)).toBe(true)
    expect(canViewRequest(client, assignedOnly)).toBe(false)
    expect(canViewRequest(client, foreign)).toBe(false)
  })

  it('agent видит назначенные на него и созданные им', () => {
    expect(canViewRequest(agentAssigned, own)).toBe(true) // исполнитель
    expect(canViewRequest(agentAssigned, assignedOnly)).toBe(true) // исполнитель
    expect(canViewRequest(agentAssigned, foreign)).toBe(false)
    const authoredByOther = { author_id: 2, assignee_id: null }
    const neitherAuthorNorAssignee = { author_id: 6, assignee_id: null }
    expect(canViewRequest(agentOther, authoredByOther)).toBe(true) // автор
    expect(canViewRequest(agentOther, neitherAuthorNorAssignee)).toBe(false)
  })

  it('operator и admin видят всё', () => {
    for (const req of [own, assignedOnly, foreign]) {
      expect(canViewRequest(operator, req)).toBe(true)
      expect(canViewRequest(admin, req)).toBe(true)
    }
  })

  it('visibilityClause строит SQL-условие по роли', () => {
    expect(visibilityClause(client)).toBe('r.author_id = $1')
    expect(visibilityClause(agentAssigned)).toBe('(r.assignee_id = $1 OR r.author_id = $1)')
    expect(visibilityClause(operator)).toBe('TRUE')
    expect(visibilityClause(admin)).toBe('TRUE')
  })
})
