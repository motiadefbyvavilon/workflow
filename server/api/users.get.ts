// GET /api/users — сотрудники (исполнители)
import { users, latency, maybeFail } from '../utils/db'

export default defineEventHandler(async (event) => {
  if (maybeFail(event) === 'failed') return
  await latency()
  return { items: users }
})