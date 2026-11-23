// GET /api/customers — заказчики (авторы заявок)
import { customers, latency, maybeFail } from '../utils/db'

export default defineEventHandler(async (event) => {
  if (maybeFail(event) === 'failed') return
  await latency()
  return { items: customers }
})
