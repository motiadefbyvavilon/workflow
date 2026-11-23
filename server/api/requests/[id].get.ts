// GET /api/requests/:id — одна заявка; 404 если не найдена
import { requests, latency, maybeFail } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (maybeFail(event) === 'failed') return
  await latency()

  const id = String(getRouterParam(event, 'id') ?? '')
  const request = requests.find((r) => r.id === id)

  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'Заявка не найдена' })
  }

  return request
})