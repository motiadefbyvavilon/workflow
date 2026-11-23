// Общий источник данных API (уровень 2). Имитирует реальный backend:
// задержка сети, случайные временные ошибки 500, возможность форсировать
// 429/500 через query-параметр fail (для демонстрации error-состояния).
// Часть записей намеренно содержит незаполненные необязательные поля,
// чтобы фронтенд учился отображать такие данные корректно.

export interface ApiUser {
  id: number
  name: string
  role: 'admin' | 'agent' | 'observer'
  email: string
}

export interface ApiCustomer {
  id: number
  name: string
  company?: string
  email?: string
}

export interface ApiCategory {
  id: number
  name: string
  slug: string
}

export type ApiRequestStatus = 'new' | 'in_progress' | 'waiting' | 'done' | 'cancelled'
export type ApiPriority = 1 | 2 | 3 | 4

/** Сырая модель заявки как отдаёт API (необязательные поля могут отсутствовать) */
export interface ApiRequest {
  id: string
  subject: string
  body: string
  status: ApiRequestStatus
  priority: ApiPriority
  category_id: number
  author_id: number
  assignee_id?: number
  created_at: string
  updated_at: string
  tags?: string[]
  timeline?: { at: string; actor_id: number; action: string }[]
  comments?: { at: string; author_id: number; text: string }[]
}

export const users: ApiUser[] = [
  { id: 1, name: 'Игорь Лебедев', role: 'agent', email: 'i.lebedev@octagon.local' },
  { id: 2, name: 'Ольга Соколова', role: 'agent', email: 'o.sokolova@octagon.local' },
  { id: 3, name: 'Марина Зайцева', role: 'admin', email: 'm.zaytseva@octagon.local' },
  { id: 4, name: 'Тимур Алиев', role: 'observer', email: 't.aliev@octagon.local' },
]

export const customers: ApiCustomer[] = [
  { id: 1, name: 'Анна Смирнова', company: 'ООО «Восток»', email: 'a.smirnova@vostok.ru' },
  { id: 2, name: 'Пётр Волков', company: 'АО «Гранит»', email: 'p.volkov@granit.ru' },
  { id: 3, name: 'Мария Ким', company: 'ИП Ким М.В.' },
  { id: 4, name: 'Дмитрий Орлов', email: 'd.ortlov@mail.ru' },
  { id: 5, name: 'Сергей Антонов', company: 'ООО «Полюс»' },
]

export const categories: ApiCategory[] = [
  { id: 1, name: 'Баг', slug: 'bug' },
  { id: 2, name: 'Фича', slug: 'feature' },
  { id: 3, name: 'Поддержка', slug: 'support' },
  { id: 4, name: 'Доступ', slug: 'access' },
  { id: 5, name: 'Инфраструктура', slug: 'infra' },
]

function daysAgo(n: number, hours = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hours, 15, 0, 0)
  return d.toISOString()
}

function mk(
  id: string,
  subject: string,
  status: ApiRequestStatus,
  priority: ApiPriority,
  category_id: number,
  author_id: number,
  assignee_id: number | undefined,
  createdDaysAgo: number,
  tags: string[] | undefined,
  body: string,
  extra?: Partial<ApiRequest>,
): ApiRequest {
  return {
    id,
    subject,
    body,
    status,
    priority,
    category_id,
    author_id,
    assignee_id,
    created_at: daysAgo(createdDaysAgo),
    updated_at: daysAgo(Math.max(0, createdDaysAgo - 1), 16),
    tags,
    timeline: [
      { at: daysAgo(createdDaysAgo), actor_id: author_id, action: 'Создана заявка' },
      ...(assignee_id
        ? [{ at: daysAgo(Math.max(0, createdDaysAgo - 1), 12), actor_id: assignee_id, action: 'Назначен исполнитель' }]
        : []),
    ],
    comments: assignee_id
      ? [{ at: daysAgo(Math.max(0, createdDaysAgo - 1), 14), author_id: assignee_id, text: 'Взял в работу, уточню детали у автора.' }]
      : [],
    ...extra,
  }
}

/** 16 заявок; у части намеренно отсутствуют необязательные поля */
export const requests: ApiRequest[] = [
  mk('WF-101', 'Не открывается раздел отчётов', 'in_progress', 4, 1, 1, 1, 1, ['отчёты', 'регрессия'], 'При переходе в «Отчёты» бесконечный спиннер, в консоли ошибка 500.'),
  mk('WF-102', 'Добавить выгрузку заявок в CSV', 'new', 2, 2, 2, undefined, 0, ['экспорт'], 'Нужна кнопка «Скачать CSV» в списке заявок с учётом текущих фильтров.'),
  mk('WF-103', 'Исправить верстку карточки на 360px', 'waiting', 3, 1, 3, 2, 2, ['вёрстка', 'мобайл'], 'Карточка заявки обрезает кнопки на узких экранах.'),
  mk('WF-104', 'Уведомления о новых комментариях', 'new', 1, 2, 4, undefined, 3, undefined, 'Приходить письмо автору заявки о новом комментарии.'),
  mk('WF-105', 'Падение при пустом теге', 'done', 3, 1, 1, 1, 5, ['баг'], 'Сохранение заявки без тегов приводит к 400. Исправлено валидацией.'),
  mk('WF-106', 'Тёмная тема', 'cancelled', 1, 3, 5, undefined, 8, ['ux'], 'Отложено: вернёмся после редизайна токенов.'),
  mk('WF-107', 'Оптимизация загрузки списка', 'in_progress', 2, 5, 3, 2, 4, ['производительность'], 'Список из 500 заявок рендерится 2.5 c — нужна виртуализация.'),
  mk('WF-108', 'Права доступа: роль наблюдателя', 'new', 2, 4, 2, undefined, 2, ['доступ'], 'Роль с правом чтения без комментариев.'),
  mk('WF-109', 'Поиск по номеру заявки', 'done', 1, 3, 4, 1, 6, ['поиск'], 'Поиск по WF-### из шапки.'),
  mk('WF-110', 'Ошибка часового пояса в timeline', 'waiting', 4, 1, 1, 2, 1, ['баг', 'даты'], 'События отображаются со смещением −7 часов для пользователей из Владивостока.'),
  mk('WF-111', 'Импорт заявок из Jira', 'new', 3, 5, 5, undefined, 3, ['интеграция', 'импорт'], 'Миграция 1200 заявок из старого трекера с сохранением истории.'),
  mk('WF-112', 'Улучшить пустые состояния', 'in_progress', 1, 3, 3, 1, 7, ['ux'], 'Добавить иллюстрации и подсказки в пустые списки.'),
  mk('WF-113', 'Двухфакторная авторизация', 'done', 4, 4, 2, 2, 10, ['безопасность'], 'TOTP для всех администраторов. Протестировано на 20 пользователях.'),
  mk('WF-114', 'Автозакрытие устаревших заявок', 'new', 2, 5, 4, undefined, 1, ['автоматизация'], 'Заявки без активности 90 дней переводить в «Отменена» с уведомлением.'),
  mk('WF-115', 'Локализация интерфейса', 'new', 2, 3, 3, undefined, 2, undefined, 'Подготовить интерфейс к переводу: вынести строки в словарь.', {
    timeline: undefined, // у этой заявки API не вернуло историю — UI должен пережить это
  }),
  mk('WF-116', 'Починить деплой staging-окружения', 'done', 4, 5, 5, 1, 4, ['ci', 'деплой'], 'Сборка падает на шаге миграций, staging недоступен с понедельника.'),
]

export function findUser(id: number | undefined): ApiUser | undefined {
  return users.find((u) => u.id === id)
}

export function findCustomer(id: number): ApiCustomer | undefined {
  return customers.find((c) => c.id === id)
}

export function findCategory(id: number): ApiCategory | undefined {
  return categories.find((c) => c.id === id)
}

/** Имитация сетевой задержки */
export function latency(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Имитация нестабильного backend.
 * - query fail=500  → всегда 500 (демо error-состояния)
 * - query fail=429  → всегда 429 (демо rate limit)
 * - иначе ~4% случайных 500, чтобы показать «временную ошибку сервера» и retry
 */
export function maybeFail(event: {
  node?: { req?: { url?: string } }
  respondWith: (r: Response) => void
}): 'failed' | 'ok' {
  const url = event.node?.req?.url ?? ''
  const fail = /[?&]fail=(\d{3})/.exec(url)?.[1]
  const roll = Math.random()
  if (fail === '500' || (!fail && roll < 0.04)) {
    event.respondWith(
      new Response(JSON.stringify({ message: 'Внутренняя ошибка сервера' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    return 'failed'
  }
  if (fail === '429') {
    event.respondWith(
      new Response(JSON.stringify({ message: 'Слишком много запросов, повторите позже' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    return 'failed'
  }
  return 'ok'
}