// POST /api/requests — создание заявки. Любой авторизованный пользователь;
// автор = текущий пользователь, статус new, событие «Создана заявка».
// Тело валидируется Zod: невалидно → 400 с issues.
import { z } from 'zod'
import { nextRequestId } from '../utils/db'
import { findRequest } from '../utils/access'

const bodySchema = z.object({
  subject: z.string().trim().min(3, 'Тема — минимум 3 символа').max(200, 'Тема — максимум 200 символов'),
  body: z.string().trim().min(10, 'Описание — минимум 10 символов').max(5000, 'Описание слишком длинное'),
  category_id: z.number().int().positive('Укажите категорию'),
  priority: z.number().int().min(1).max(4).default(2),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Невалидное тело запроса',
      data: { issues: parsed.error.issues },
    })
  }

  const db = await getDb()

  const { rows: catRows } = await db.query('SELECT id FROM categories WHERE id = $1', [
    parsed.data.category_id,
  ])
  if (!catRows.length) {
    throw createError({ statusCode: 400, statusMessage: 'Такой категории не существует' })
  }

  const id = await nextRequestId(db)
  const now = new Date().toISOString()

  await db.query(
    `INSERT INTO requests (id, subject, body, status, priority, category_id, author_id, created_at, updated_at)
     VALUES ($1, $2, $3, 'new', $4, $5, $6, $7, $7)`,
    [id, parsed.data.subject, parsed.data.body, parsed.data.priority, parsed.data.category_id, user.id, now],
  )
  await db.query(
    'INSERT INTO request_events (request_id, actor_id, action, created_at) VALUES ($1, $2, $3, $4)',
    [id, user.id, 'Создана заявка', now],
  )

  return findRequest(db, id)
})
