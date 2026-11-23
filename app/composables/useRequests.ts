// Composable с локальными mock-данными заявок.
// Имитирует асинхронный API: задержка, состояния loading / error / success / empty.
// На уровне 2 этот слой заменяется реальным fetch без изменения страниц.

import type { WorkflowRequest, RequestStatus, RequestPriority } from '~/types/request'

const LATENCY = 450

function daysAgo(n: number, hours = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hours, 15, 0, 0)
  return d.toISOString()
}

function seedRequests(): WorkflowRequest[] {
  const mk = (
    id: string,
    title: string,
    status: RequestStatus,
    priority: RequestPriority,
    author: string,
    assignee: string,
    createdDaysAgo: number,
    tags: string[],
    description: string,
  ): WorkflowRequest => ({
    id,
    title,
    description,
    status,
    priority,
    author,
    assignee,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(Math.max(0, createdDaysAgo - 1), 16),
    tags,
    timeline: [
      { id: `${id}-t1`, at: daysAgo(createdDaysAgo), actor: author, action: 'Создана заявка' },
      {
        id: `${id}-t2`,
        at: daysAgo(Math.max(0, createdDaysAgo - 1), 12),
        actor: assignee,
        action: 'Назначен исполнитель',
      },
    ],
    comments: [
      {
        id: `${id}-c1`,
        at: daysAgo(Math.max(0, createdDaysAgo - 1), 14),
        author: assignee,
        text: 'Взял в работу, уточню детали у автора.',
      },
    ],
  })

  return [
    mk('WF-101', 'Не открывается раздел отчётов', 'in_progress', 'critical', 'Анна Смирнова', 'Игорь Лебедев', 1, ['баг', 'отчёты'], 'При переходе в «Отчёты» бесконечный спиннер, в консоли ошибка 500.'),
    mk('WF-102', 'Добавить выгрузку заявок в CSV', 'new', 'medium', 'Пётр Волков', '—', 0, ['фича', 'экспорт'], 'Нужна кнопка «Скачать CSV» в списке заявок с учётом текущих фильтров.'),
    mk('WF-103', 'Исправить верстку карточки на 360px', 'waiting', 'high', 'Мария Ким', 'Ольга Соколова', 2, ['вёрстка', 'мобайл'], 'Карточка заявки обрезает кнопки на узких экранах.'),
    mk('WF-104', 'Уведомления о новых комментариях', 'new', 'low', 'Дмитрий Орлов', '—', 3, ['фича', 'уведомления'], 'Приходить письмо автору заявки о новом комментарии.'),
    mk('WF-105', 'Падение при пустом теге', 'done', 'high', 'Анна Смирнова', 'Игорь Лебедев', 5, ['баг'], 'Сохранение заявки без тегов приводит к 400. Исправлено валидацией.'),
    mk('WF-106', 'Тёмная тема', 'cancelled', 'low', 'Сергей Антонов', '—', 8, ['ux'], 'Отложено: вернёмся после редизайна токенов.'),
    mk('WF-107', 'Оптимизация загрузки списка', 'in_progress', 'medium', 'Мария Ким', 'Ольга Соколова', 4, ['производительность'], 'Список из 500 заявок рендерится 2.5 c — нужна виртуализация.'),
    mk('WF-108', 'Права доступа: роль наблюдателя', 'new', 'medium', 'Пётр Волков', '—', 2, ['доступ'], 'Роль с правом чтения без комментариев.'),
    mk('WF-109', 'Поиск по номеру заявки', 'done', 'low', 'Дмитрий Орлов', 'Игорь Лебедев', 6, ['поиск'], 'Поиск по WF-### из шапки.'),
    mk('WF-110', 'Ошибка часового пояса в timeline', 'waiting', 'critical', 'Анна Смирнова', 'Ольга Соколова', 1, ['баг', 'даты'], 'События отображаются со смещением −7 часов для пользователей из Владивостока.'),
    mk('WF-111', 'Импорт заявок из Jira', 'new', 'high', 'Сергей Антонов', '—', 3, ['интеграция', 'импорт'], 'Миграция 1200 заявок из старого трекера с сохранением истории.'),
    mk('WF-112', 'Улучшить пустые состояния', 'in_progress', 'low', 'Мария Ким', 'Игорь Лебедев', 7, ['ux', 'копирайтинг'], 'Добавить иллюстрации и подсказки в пустые списки.'),
    mk('WF-113', 'Двухфакторная авторизация', 'done', 'critical', 'Пётр Волков', 'Ольга Соколова', 10, ['безопасность'], 'TOTP для всех администраторов. Протестировано на 20 пользователях.'),
    mk('WF-114', 'Автозакрытие устаревших заявок', 'new', 'medium', 'Дмитрий Орлов', '—', 1, ['автоматизация'], 'Заявки без активности 90 дней переводить в «Отменена» с уведомлением.'),
  ]
}

export type Scenario = 'success' | 'error' | 'empty'

export function useRequests() {
  const requests = useState<WorkflowRequest[]>('requests', () => [])
  const pending = useState<boolean>('requests-pending', () => false)
  const failed = useState<boolean>('requests-failed', () => false)

  /** Демо-сценарий API: позволяет показать error и empty состояния без реального backend */
  const scenario = useState<Scenario>('requests-scenario', () => 'success')

  async function fetchRequests(): Promise<void> {
    pending.value = true
    failed.value = false
    await new Promise((resolve) => setTimeout(resolve, LATENCY))
    if (scenario.value === 'error') {
      pending.value = false
      failed.value = true
      return
    }
    requests.value = scenario.value === 'empty' ? [] : seedRequests()
    pending.value = false
  }

  function byId(id: string): WorkflowRequest | undefined {
    return requests.value.find((r) => r.id === id)
  }

  function filtered(status: RequestStatus | '', priority: RequestPriority | ''): WorkflowRequest[] {
    return requests.value.filter((r) => {
      if (status && r.status !== status) return false
      if (priority && r.priority !== priority) return false
      return true
    })
  }

  function countsByStatus(): Record<RequestStatus, number> {
    const base: Record<RequestStatus, number> = {
      new: 0,
      in_progress: 0,
      waiting: 0,
      done: 0,
      cancelled: 0,
    }
    for (const r of requests.value) base[r.status] += 1
    return base
  }

  return { requests, pending, failed, scenario, fetchRequests, byId, filtered, countsByStatus }
}
