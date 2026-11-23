// GET /api/requests — список заявок с поиском, фильтрацией, сортировкой и пагинацией.
// Query: search, status, category, priority, sort, page, pageSize, fail
import { requests, latency, maybeFail } from '../utils/db'

const PRIORITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

export default defineEventHandler(async (event) => {
  if (maybeFail(event) === 'failed') return
  await latency()

  const query = getQuery(event)
  const search = String(query.search ?? '').trim().toLowerCase()
  const status = String(query.status ?? '')
  const category = Number(query.category ?? 0) || 0
  const priority = String(query.priority ?? '')
  const sort = String(query.sort ?? 'updated_desc')
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 5) || 5))

  let items = [...requests]

  if (search) {
    items = items.filter((r) =>
      `${r.id} ${r.subject} ${r.body}`.toLowerCase().includes(search),
    )
  }
  if (status) items = items.filter((r) => r.status === status)
  if (category) items = items.filter((r) => r.category_id === category)
  if (priority) {
    const byName = Object.entries(PRIORITY_WEIGHT).find(([k]) => k === priority)?.[1]
    if (byName !== undefined) items = items.filter((r) => r.priority === byName)
  }

  switch (sort) {
    case 'created_desc':
      items.sort((a, b) => b.created_at.localeCompare(a.created_at))
      break
    case 'priority':
      items.sort((a, b) => b.priority - a.priority || b.updated_at.localeCompare(a.updated_at))
      break
    case 'title':
      items.sort((a, b) => a.subject.localeCompare(b.subject, 'ru'))
      break
    default: // updated_desc
      items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  }

  const total = items.length
  const start = (page - 1) * pageSize
  const paged = items.slice(start, start + pageSize)

  return { items: paged, total, page, pageSize }
})