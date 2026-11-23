// Бизнес-правила переходов статусов (shared/utils/status.ts) — уровень 5.
// Тесты на поведении: допустимость перехода и ограничения по ролям.
import { describe, expect, it } from 'vitest'
import {
  canRoleTransition,
  canTransition,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
} from '~~/shared/utils/status'
import type { RequestStatus, Role } from '~~/shared/types'

const ALL: Role[] = ['client', 'operator', 'agent', 'admin']
const STAFF: Role[] = ['operator', 'admin']

const VALID: [RequestStatus, RequestStatus][] = [
  ['new', 'in_progress'],
  ['new', 'cancelled'],
  ['in_progress', 'waiting'],
  ['in_progress', 'done'],
  ['in_progress', 'cancelled'],
  ['waiting', 'in_progress'],
  ['waiting', 'done'],
  ['waiting', 'cancelled'],
  ['done', 'in_progress'],
  ['cancelled', 'new'],
]

describe('canTransition — карта переходов', () => {
  it.each(VALID.map(([from, to]) => [`${from} → ${to}`, from, to] as const))(
    'разрешён переход %s',
    (_label, from, to) => {
      expect(canTransition(from, to)).toBe(true)
    },
  )

  it.each(ALL.map((s) => [s, s] as const))('запрещён «переход» %s → %s (без изменения)', (s) => {
    expect(canTransition(s, s)).toBe(false)
  })

  it('отклоняет переходы вне карты', () => {
    expect(canTransition('new', 'done')).toBe(false)
    expect(canTransition('new', 'waiting')).toBe(false)
    expect(canTransition('done', 'new')).toBe(false)
    expect(canTransition('done', 'cancelled')).toBe(false)
    expect(canTransition('cancelled', 'in_progress')).toBe(false)
    expect(canTransition('cancelled', 'done')).toBe(false)
  })
})

describe('canRoleTransition — ограничения по ролям', () => {
  it('обычные переходы доступны всем ролям', () => {
    for (const role of ALL) {
      expect(canRoleTransition('new', 'in_progress', role)).toBe(true)
      expect(canRoleTransition('in_progress', 'done', role)).toBe(true)
      expect(canRoleTransition('waiting', 'cancelled', role)).toBe(true)
    }
  })

  it('реопен done → in_progress — только operator/admin', () => {
    for (const role of STAFF) {
      expect(canRoleTransition('done', 'in_progress', role)).toBe(true)
    }
    expect(canRoleTransition('done', 'in_progress', 'agent')).toBe(false)
    expect(canRoleTransition('done', 'in_progress', 'client')).toBe(false)
  })

  it('реактивация cancelled → new — только operator/admin', () => {
    for (const role of STAFF) {
      expect(canRoleTransition('cancelled', 'new', role)).toBe(true)
    }
    expect(canRoleTransition('cancelled', 'new', 'agent')).toBe(false)
    expect(canRoleTransition('cancelled', 'new', 'client')).toBe(false)
  })

  it('невалидный переход отклоняется для любой роли', () => {
    for (const role of ALL) {
      expect(canRoleTransition('new', 'done', role)).toBe(false)
    }
  })
})

describe('карта статусов полна', () => {
  it('для каждого статуса есть записи и русские подписи', () => {
    const statuses = Object.keys(STATUS_TRANSITIONS) as RequestStatus[]
    expect(statuses).toHaveLength(5)
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeTruthy()
      expect(Array.isArray(STATUS_TRANSITIONS[s])).toBe(true)
    }
  })
})
