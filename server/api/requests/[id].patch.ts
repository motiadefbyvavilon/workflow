// PATCH /api/requests/:id — частичное обновление заявки
// Body: { status?, priority?, assignee_id? }
// Демо ошибок: ?fail=500 → всегда 500 (проверка rollback);
// попытка изменить отменённую заявку → 409 (конфликт состояния).
import { requests, latency, maybeFail } from '../../utils/db'
import type { ApiRequest } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (maybeFail(event) === 'failed') return
  await latency(500)

  const id = String(getRouterParam(event, 'id') ?? '')
  const request = requests.find((r) => r.id === id)
  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'Заявка не найдена' })
  }

  const body = (await readBody<Partial<ApiRequest>>(event)) ?? {}

  if (request.status === 'cancelled' && body.status !== undefined && body.status !== 'cancelled') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Конфликт: отменённую заявку нельзя вернуть в работу',
    })
  }

  if (body.status !== undefined) request.status = body.status
  if (body.priority !== undefined) request.priority = body.priority
  if (body.assignee_id !== undefined) request.assignee_id = body.assignee_id
  request.updated_at = new Date().toISOString()

  return request
})