// Общая карта статусов заявки (уровень 4): переходы валидируются на сервере,
// фронтенд использует ту же карту, чтобы показывать только допустимые цели.
import type { RequestStatus, Role } from '../types/index'

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  waiting: 'Ожидает ответа',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

/** Допустимые переходы статусов (изменение статуса заявки) */
export const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['in_progress', 'cancelled'],
  in_progress: ['waiting', 'done', 'cancelled'],
  waiting: ['in_progress', 'done', 'cancelled'],
  done: ['in_progress'],
  cancelled: ['new'],
}

/**
 * Переходы, доступные только Operator/Admin (реопен выполненной,
 * реактивация отменённой). Остальные переходы разрешены любому,
 * кто вообще имеет право редактировать заявку.
 */
export const RESTRICTED_TRANSITION_ROLES: Role[] = ['operator', 'admin']

const TRANSITION_KEY_SEPARATOR = '→'

export function transitionKey(from: RequestStatus, to: RequestStatus): string {
  return `${from}${TRANSITION_KEY_SEPARATOR}${to}`
}

/** Переходы с ограничением по роли: 'done→in_progress', 'cancelled→new' */
export const RESTRICTED_TRANSITIONS: Record<string, Role[]> = {
  [transitionKey('done', 'in_progress')]: RESTRICTED_TRANSITION_ROLES,
  [transitionKey('cancelled', 'new')]: RESTRICTED_TRANSITION_ROLES,
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/** Может ли роль выполнить конкретный переход (с учётом ограничений) */
export function canRoleTransition(from: RequestStatus, to: RequestStatus, role: Role): boolean {
  if (!canTransition(from, to)) return false
  const allowed = RESTRICTED_TRANSITIONS[transitionKey(from, to)]
  if (!allowed) return true
  return allowed.includes(role)
}
