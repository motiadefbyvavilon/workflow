// PostgreSQL через @electric-sql/pglite (уровень 4): настоящий PostgreSQL 16,
// скомпилированный в WASM, работает внутри Node-процесса Nitro. Данные
// персистентны в каталоге .data/pg (исключён из git и архива сборки).
//
// getDb() — ленивый синглтон: создаёт экземпляр, прогоняет DDL
// (CREATE TABLE IF NOT EXISTS) и seed (если таблицы пустые). Nitro-плагин
// server/plugins/db.ts прогревает БД до приёма первых запросов.
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { hashPassword } from './password'

let db: PGlite | null = null
let initPromise: Promise<PGlite> | null = null

export async function getDb(): Promise<PGlite> {
  if (db) return db
  // Повторные попытки инициализации (уровень 5): на Windows первый запуск
  // PGlite на свежем каталоге данных может словить транзиентную ошибку FS
  // (Emscripten ErrnoError ENOENT — антивирус/синхронизация облака держат
  // файл). Без повтора отклонённый initPromise кэшировался бы навсегда,
  // и каждый запрос получал бы 500.
  initPromise ??= (async (): Promise<PGlite> => {
    const attempts = 4
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await initOnce()
      } catch (err) {
        lastErr = err
        if (attempt < attempts) {
          console.warn(`[db] инициализация PGlite не удалась (попытка ${attempt}/${attempts}):`, err)
          await new Promise((r) => setTimeout(r, 250 * attempt))
        }
      }
    }
    throw lastErr
  })()
  return initPromise
}

async function initOnce(): Promise<PGlite> {
  // WF_DATA_DIR — переопределение каталога данных (E2E-тесты стартуют
  // сервер с чистой БД в отдельной папке, уровень 5)
  const dataDir = process.env.WF_DATA_DIR
    ? resolve(process.env.WF_DATA_DIR)
    : resolve(process.cwd(), '.data/pg')
  mkdirSync(dataDir, { recursive: true })
  const instance = new PGlite(dataDir)
  await migrate(instance)
  await seed(instance)
  db = instance
  return instance
}

async function migrate(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL CHECK (role IN ('client','operator','agent','admin')),
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id serial PRIMARY KEY,
      name text NOT NULL,
      company text,
      email text
    );

    CREATE TABLE IF NOT EXISTS categories (
      id serial PRIMARY KEY,
      name text NOT NULL,
      slug text NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS requests (
      id text PRIMARY KEY,
      subject text NOT NULL,
      body text NOT NULL,
      status text NOT NULL CHECK (status IN ('new','in_progress','waiting','done','cancelled')),
      priority int NOT NULL CHECK (priority BETWEEN 1 AND 4),
      category_id int NOT NULL REFERENCES categories(id),
      author_id int NOT NULL REFERENCES users(id),
      customer_id int REFERENCES customers(id),
      assignee_id int REFERENCES users(id),
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id serial PRIMARY KEY,
      request_id text NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      author_id int NOT NULL REFERENCES users(id),
      text text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS request_events (
      id serial PRIMARY KEY,
      request_id text NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      actor_id int REFERENCES users(id),
      action text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_requests_author ON requests(author_id);
    CREATE INDEX IF NOT EXISTS idx_requests_assignee ON requests(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_comments_request ON comments(request_id);
    CREATE INDEX IF NOT EXISTS idx_events_request ON request_events(request_id);
  `)
}

// ─── Seed (локальная разработка) ────────────────────────────────────────────
// Демо-аккаунты (пароли задокументированы здесь, в README и на странице логина):
//   admin@octagon.local     / admin123     — Марина Зайцева, администратор
//   t.aliev@octagon.local   / operator123  — Тимур Алиев, оператор
//   i.lebedev@octagon.local / agent123     — Игорь Лебедев, сотрудник
//   o.sokolova@octagon.local/ agent123     — Ольга Соколова, сотрудник
//   a.smirnova@vostok.ru    / client123    — Анна Смирнова, клиент
//   p.volkov@granit.ru      / client123    — Пётр Волков, клиент
//   s.antonov@octagon.local / agent123     — СЕРГЕЙ АНТОНОВ, деактивирован (демо 409)
const SEED_USERS: { name: string; email: string; role: string; password: string; active: boolean }[] = [
  { name: 'Игорь Лебедев', email: 'i.lebedev@octagon.local', role: 'agent', password: 'agent123', active: true },
  { name: 'Ольга Соколова', email: 'o.sokolova@octagon.local', role: 'agent', password: 'agent123', active: true },
  { name: 'Марина Зайцева', email: 'admin@octagon.local', role: 'admin', password: 'admin123', active: true },
  { name: 'Тимур Алиев', email: 't.aliev@octagon.local', role: 'operator', password: 'operator123', active: true },
  { name: 'Анна Смирнова', email: 'a.smirnova@vostok.ru', role: 'client', password: 'client123', active: true },
  { name: 'Пётр Волков', email: 'p.volkov@granit.ru', role: 'client', password: 'client123', active: true },
  // Деактивированный сотрудник: проверка «нельзя назначить deactivated» → 409
  { name: 'Сергей Антонов', email: 's.antonov@octagon.local', role: 'agent', password: 'agent123', active: false },
]

const SEED_CUSTOMERS = [
  { name: 'Анна Смирнова', company: 'ООО «Восток»', email: 'a.smirnova@vostok.ru' },
  { name: 'Пётр Волков', company: 'АО «Гранит»', email: 'p.volkov@granit.ru' },
  { name: 'Мария Ким', company: 'ИП Ким М.В.', email: null },
  { name: 'Дмитрий Орлов', company: null, email: 'd.ortlov@mail.ru' },
  { name: 'Сергей Антонов', company: 'ООО «Полюс»', email: null },
]

const SEED_CATEGORIES = [
  { name: 'Баг', slug: 'bug' },
  { name: 'Фича', slug: 'feature' },
  { name: 'Поддержка', slug: 'support' },
  { name: 'Доступ', slug: 'access' },
  { name: 'Инфраструктура', slug: 'infra' },
]

function daysAgo(n: number, hours = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hours, 15, 0, 0)
  return d.toISOString()
}

/** 16 заявок WF-101..WF-116 — миграция данных уровня 2.
 *  oldAuthor: автор как клиент-пользователь (5 — Смирнова, 6 — Волков);
 *  customerId — справочник заказчиков из уровня 2. */
const SEED_REQUESTS: {
  id: string
  subject: string
  status: string
  priority: number
  categoryId: number
  authorUserId: number
  customerId: number
  assigneeId: number | null
  createdDaysAgo: number
  body: string
  noTimeline?: boolean
}[] = [
  { id: 'WF-101', subject: 'Не открывается раздел отчётов', status: 'in_progress', priority: 4, categoryId: 1, authorUserId: 5, customerId: 1, assigneeId: 1, createdDaysAgo: 1, body: 'При переходе в «Отчёты» бесконечный спиннер, в консоли ошибка 500.' },
  { id: 'WF-102', subject: 'Добавить выгрузку заявок в CSV', status: 'new', priority: 2, categoryId: 2, authorUserId: 6, customerId: 2, assigneeId: null, createdDaysAgo: 0, body: 'Нужна кнопка «Скачать CSV» в списке заявок с учётом текущих фильтров.' },
  { id: 'WF-103', subject: 'Исправить верстку карточки на 360px', status: 'waiting', priority: 3, categoryId: 1, authorUserId: 5, customerId: 3, assigneeId: 2, createdDaysAgo: 2, body: 'Карточка заявки обрезает кнопки на узких экранах.' },
  { id: 'WF-104', subject: 'Уведомления о новых комментариях', status: 'new', priority: 1, categoryId: 2, authorUserId: 6, customerId: 4, assigneeId: null, createdDaysAgo: 3, body: 'Приходить письмо автору заявки о новом комментарии.' },
  { id: 'WF-105', subject: 'Падение при пустом теге', status: 'done', priority: 3, categoryId: 1, authorUserId: 5, customerId: 1, assigneeId: 1, createdDaysAgo: 5, body: 'Сохранение заявки без тегов приводит к 400. Исправлено валидацией.' },
  { id: 'WF-106', subject: 'Тёмная тема', status: 'cancelled', priority: 1, categoryId: 3, authorUserId: 6, customerId: 5, assigneeId: null, createdDaysAgo: 8, body: 'Отложено: вернёмся после редизайна токенов.' },
  { id: 'WF-107', subject: 'Оптимизация загрузки списка', status: 'in_progress', priority: 2, categoryId: 5, authorUserId: 5, customerId: 3, assigneeId: 2, createdDaysAgo: 4, body: 'Список из 500 заявок рендерится 2.5 c — нужна виртуализация.' },
  { id: 'WF-108', subject: 'Права доступа: роль наблюдателя', status: 'new', priority: 2, categoryId: 4, authorUserId: 6, customerId: 2, assigneeId: null, createdDaysAgo: 2, body: 'Роль с правом чтения без комментариев.' },
  { id: 'WF-109', subject: 'Поиск по номеру заявки', status: 'done', priority: 1, categoryId: 3, authorUserId: 6, customerId: 4, assigneeId: 1, createdDaysAgo: 6, body: 'Поиск по WF-### из шапки.' },
  { id: 'WF-110', subject: 'Ошибка часового пояса в timeline', status: 'waiting', priority: 4, categoryId: 1, authorUserId: 5, customerId: 1, assigneeId: 2, createdDaysAgo: 1, body: 'События отображаются со смещением −7 часов для пользователей из Владивостока.' },
  { id: 'WF-111', subject: 'Импорт заявок из Jira', status: 'new', priority: 3, categoryId: 5, authorUserId: 6, customerId: 5, assigneeId: null, createdDaysAgo: 3, body: 'Миграция 1200 заявок из старого трекера с сохранением истории.' },
  { id: 'WF-112', subject: 'Улучшить пустые состояния', status: 'in_progress', priority: 1, categoryId: 3, authorUserId: 5, customerId: 3, assigneeId: 1, createdDaysAgo: 7, body: 'Добавить иллюстрации и подсказки в пустые списки.' },
  { id: 'WF-113', subject: 'Двухфакторная авторизация', status: 'done', priority: 4, categoryId: 4, authorUserId: 6, customerId: 2, assigneeId: 2, createdDaysAgo: 10, body: 'TOTP для всех администраторов. Протестировано на 20 пользователях.' },
  { id: 'WF-114', subject: 'Автозакрытие устаревших заявок', status: 'new', priority: 2, categoryId: 5, authorUserId: 6, customerId: 4, assigneeId: null, createdDaysAgo: 1, body: 'Заявки без активности 90 дней переводить в «Отменена» с уведомлением.' },
  { id: 'WF-115', subject: 'Локализация интерфейса', status: 'new', priority: 2, categoryId: 3, authorUserId: 5, customerId: 3, assigneeId: null, createdDaysAgo: 2, body: 'Подготовить интерфейс к переводу: вынести строки в словарь.', noTimeline: true },
  { id: 'WF-116', subject: 'Починить деплой staging-окружения', status: 'done', priority: 4, categoryId: 5, authorUserId: 6, customerId: 5, assigneeId: 1, createdDaysAgo: 4, body: 'Сборка падает на шаге миграций, staging недоступен с понедельника.' },
]

async function seed(db: PGlite): Promise<void> {
  const { rows } = await db.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM users')
  if ((rows[0]?.n ?? 0) > 0) return

  for (const u of SEED_USERS) {
    const passwordHash = await hashPassword(u.password)
    await db.query(
      'INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, $5)',
      [u.name, u.email, passwordHash, u.role, u.active],
    )
  }

  for (const c of SEED_CUSTOMERS) {
    await db.query('INSERT INTO customers (name, company, email) VALUES ($1, $2, $3)', [
      c.name,
      c.company,
      c.email,
    ])
  }

  for (const c of SEED_CATEGORIES) {
    await db.query('INSERT INTO categories (name, slug) VALUES ($1, $2)', [c.name, c.slug])
  }

  for (const r of SEED_REQUESTS) {
    const createdAt = daysAgo(r.createdDaysAgo)
    const updatedAt = daysAgo(Math.max(0, r.createdDaysAgo - 1), 16)
    await db.query(
      `INSERT INTO requests (id, subject, body, status, priority, category_id, author_id, customer_id, assignee_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [r.id, r.subject, r.body, r.status, r.priority, r.categoryId, r.authorUserId, r.customerId, r.assigneeId, createdAt, updatedAt],
    )

    if (!r.noTimeline) {
      await db.query(
        'INSERT INTO request_events (request_id, actor_id, action, created_at) VALUES ($1, $2, $3, $4)',
        [r.id, r.authorUserId, 'Создана заявка', createdAt],
      )
      if (r.assigneeId !== null) {
        await db.query(
          'INSERT INTO request_events (request_id, actor_id, action, created_at) VALUES ($1, $2, $3, $4)',
          [r.id, r.assigneeId, 'Назначен исполнитель', daysAgo(Math.max(0, r.createdDaysAgo - 1), 12)],
        )
        await db.query(
          'INSERT INTO comments (request_id, author_id, text, created_at) VALUES ($1, $2, $3, $4)',
          [r.id, r.assigneeId, 'Взял в работу, уточню детали у автора.', daysAgo(Math.max(0, r.createdDaysAgo - 1), 14)],
        )
      }
    }
  }
}

/** Следующий строковый номер заявки вида WF-117 (формат уровня 2 сохранён) */
export async function nextRequestId(db: PGlite): Promise<string> {
  const { rows } = await db.query<{ n: number }>(
    "SELECT COALESCE(MAX(CAST(substring(id FROM 4) AS int)), 100) AS n FROM requests WHERE id LIKE 'WF-%'",
  )
  return `WF-${(rows[0]?.n ?? 100) + 1}`
}
