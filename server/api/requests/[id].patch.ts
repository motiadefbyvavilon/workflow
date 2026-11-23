// PATCH /api/requests/:id — частичное обновление заявки.
// Body: { status?, priority?, assignee_id? } — Zod-валидация (400 с issues).
//
// Права (сервер!):
//   Operator/Admin — всё, включая назначение исполнителя;
//   Agent — только назначенные ему, только status/priority;
//   Автор — пока статус new, только отмена (status → cancelled).
// Назначение: исполнитель должен существовать, быть active (иначе 409)
// и не быть клиентом (иначе 400). Переходы статусов — общая карта из
// shared/: невалидный переход → 409, переход Operator/Admin → 403.
import { z } from 'zod'
import type { RequestStatus } from '#shared/types'
import { canRoleTransition, canTransition, STATUS_LABELS } from '#shared/utils/status'
import { findRequest, requireRequestAccess } from '../../utils/access'

const bodySchema = z.object({
  status: z.enum(['new', 'in_progress', 'waiting', 'done', 'cancelled']).optional(),
  priority: z.number().int().min(1).max(4).optional(),
  assignee_id: z.number().int().positive().nullable().optional(),
})

const isStaff = (role: string) => role === 'operator' || role === 'admin'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  const { user, request } = await requireRequestAccess(event, id)

  const parsed = bodySchema.safeParse(await readBody(event) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Невалидное тело запроса',
      data: { issues: parsed.error.issues },
    })
  }
  const patch = parsed.data

  const staff = isStaff(user.role)
  const assignedAgent = user.role === 'agent' && request.assignee_id === user.id
  const authorWhileNew = request.author_id === user.id && request.status === 'new'

  // Кто вообще может редактировать?
  if (!staff && !assignedAgent && !authorWhileNew) {
    throw createError({ statusCode: 403, statusMessage: 'Недостаточно прав для изменения этой заявки' })
  }

  // Автор (не staff, не исполнитель) может только отменить свою новую заявку
  if (authorWhileNew && !staff && !assignedAgent) {
    if (patch.status !== undefined && patch.status !== 'cancelled') {
      throw createError({ statusCode: 403, statusMessage: 'Автор может только отменить заявку (статус new)' })
    }
  }

  // Исполнитель может менять только status/priority — не назначать других
  if (assignedAgent && !staff && patch.assignee_id !== undefined) {
    throw createError({ statusCode: 403, statusMessage: 'Назначать исполнителей может только оператор или администратор' })
  }

  const db = await getDb()

  // Назначение исполнителя — только Operator/Admin; валидация цели
  let newAssigneeName: string | null = null
  if (patch.assignee_id != null) {
    if (!staff) {
      throw createError({ statusCode: 403, statusMessage: 'Назначать исполнителей может только оператор или администратор' })
    }
    const { rows } = await db.query<{ id: number; name: string; active: boolean; role: string }>(
      'SELECT id, name, active, role FROM users WHERE id = $1',
      [patch.assignee_id],
    )
    const target = rows[0]
    if (!target) {
      throw createError({ statusCode: 404, statusMessage: 'Пользователь-исполнитель не найден' })
    }
    if (!target.active) {
      throw createError({ statusCode: 409, statusMessage: 'Нельзя назначить деактивированного пользователя исполнителем' })
    }
    if (target.role === 'client') {
      throw createError({ statusCode: 400, statusMessage: 'Клиент не может быть исполнителем заявки' })
    }
    newAssigneeName = target.name
  }

  // Переход статуса — общая карта из shared/
  const nextStatus = patch.status ?? request.status
  if (patch.status !== undefined && patch.status !== request.status) {
    if (!canTransition(request.status, patch.status)) {
      throw createError({
        statusCode: 409,
        statusMessage: `Недопустимый переход статуса: ${STATUS_LABELS[request.status]} → ${STATUS_LABELS[patch.status as RequestStatus]}`,
      })
    }
    if (!canRoleTransition(request.status, patch.status, user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Переход «${STATUS_LABELS[request.status]} → ${STATUS_LABELS[patch.status as RequestStatus]}» доступен только оператору или администратору`,
      })
    }
  }

  const now = new Date().toISOString()
  await db.query(
    `UPDATE requests
     SET status = $2, priority = $3, assignee_id = $4, updated_at = $5
     WHERE id = $1`,
    [id, nextStatus, patch.priority ?? request.priority, patch.assignee_id !== undefined ? patch.assignee_id : request.assignee_id, now],
  )

  // Хронология изменений
  if (patch.status !== undefined && patch.status !== request.status) {
    await db.query(
      'INSERT INTO request_events (request_id, actor_id, action, created_at) VALUES ($1, $2, $3, $4)',
      [id, user.id, `Статус: ${STATUS_LABELS[request.status]} → ${STATUS_LABELS[nextStatus]}`, now],
    )
  }
  if (patch.priority !== undefined && patch.priority !== request.priority) {
    await db.query(
      'INSERT INTO request_events (request_id, actor_id, action, created_at) VALUES ($1, $2, $3, $4)',
      [id, user.id, `Приоритет изменён (${patch.priority}/4)`, now],
    )
  }
  if (patch.assignee_id !== undefined && patch.assignee_id !== request.assignee_id) {
    const action = patch.assignee_id === null
      ? 'Исполнитель снят'
      : `Назначен исполнитель: ${newAssigneeName}`
    await db.query(
      'INSERT INTO request_events (request_id, actor_id, action, created_at) VALUES ($1, $2, $3, $4)',
      [id, user.id, action, now],
    )
  }

  return findRequest(db, id)
})
