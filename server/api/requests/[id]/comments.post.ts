// POST /api/requests/:id/comments — добавление комментария
// Body: { text: string }. Демо ошибок: ?fail=500.
import { requests, users, latency, maybeFail } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  if (maybeFail(event) === 'failed') return
  await latency(400)

  const id = String(getRouterParam(event, 'id') ?? '')
  const request = requests.find((r) => r.id === id)
  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'Заявка не найдена' })
  }

  const body = (await readBody<{ text?: string }>(event)) ?? {}
  const text = String(body.text ?? '').trim()
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Пустой комментарий' })
  }

  const actor = users.find((u) => u.role === 'agent') ?? users[0]
  const comment = { at: new Date().toISOString(), author_id: actor.id, text }
  if (!request.comments) request.comments = []
  request.comments.push(comment)
  request.updated_at = new Date().toISOString()

  return comment
})