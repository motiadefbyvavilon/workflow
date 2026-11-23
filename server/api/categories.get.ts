// GET /api/categories — категории заявок (справочник)
import { categories, latency, maybeFail } from '../utils/db'

export default defineEventHandler(async (event) => {
  if (maybeFail(event) === 'failed') return
  await latency()
  return { items: categories }
})