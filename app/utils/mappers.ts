// Единое место преобразования сырых моделей API в модель представления.
// Ни один компонент не должен знать о формате полей API (snake_case, id-ссылки) —
// только этот модуль. Типы — из shared/ (уровень 4).
import {
  API_TO_PRIORITY,
  type ApiCategory,
  type ApiComment,
  type ApiCustomer,
  type ApiRequest,
  type ApiTimelineEntry,
  type ApiUser,
} from '~~/shared/types'
import type { RequestComment, TimelineEntry, WorkflowRequest } from '~~/shared/types'

export interface Dictionaries {
  users: Map<number, ApiUser>
  customers: Map<number, ApiCustomer>
  categories: Map<number, ApiCategory>
}

export function buildDictionaries(
  users: ApiUser[] | null | undefined,
  customers: ApiCustomer[] | null | undefined,
  categories: ApiCategory[] | null | undefined,
): Dictionaries {
  return {
    users: new Map((users ?? []).map((u) => [u.id, u])),
    customers: new Map((customers ?? []).map((c) => [c.id, c])),
    categories: new Map((categories ?? []).map((c) => [c.id, c])),
  }
}

function mapTimeline(entries: ApiTimelineEntry[] | undefined, dicts: Dictionaries): TimelineEntry[] {
  return (entries ?? []).map((e, i) => ({
    id: `${e.at}-${i}`,
    at: e.at,
    // actor_name приходит с сервера (join) — справочник users доступен не всем ролям
    actor: e.actor_name ?? dicts.users.get(e.actor_id)?.name ?? 'Неизвестный пользователь',
    action: e.action,
  }))
}

function mapComments(comments: ApiComment[] | undefined, dicts: Dictionaries): RequestComment[] {
  return (comments ?? []).map((c) => ({
    id: String(c.id),
    at: c.at,
    author: c.author_name ?? dicts.users.get(c.author_id)?.name ?? dicts.customers.get(c.author_id)?.name ?? 'Автор',
    text: c.text,
  }))
}

/** API-запись → модель представления. Безопасна для записей с пропущенными полями. */
export function toRequestViewModel(raw: ApiRequest, dicts: Dictionaries): WorkflowRequest {
  const author = raw.customer_id != null ? dicts.customers.get(raw.customer_id) : undefined
  const assignee = raw.assignee_id != null ? dicts.users.get(raw.assignee_id) : undefined

  return {
    id: raw.id,
    title: raw.subject,
    description: raw.body,
    status: raw.status,
    priority: API_TO_PRIORITY[raw.priority] ?? 'medium',
    author: raw.author_name ?? author?.name ?? `Пользователь #${raw.author_id}`,
    authorCompany: author?.company ?? undefined,
    assignee: raw.assignee_name ?? assignee?.name ?? '—',
    category: dicts.categories.get(raw.category_id)?.name ?? 'Без категории',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    tags: [],
    timeline: mapTimeline(raw.timeline, dicts),
    comments: mapComments(raw.comments, dicts),
  }
}

/** Короткая версия для списка (те же гарантии по умолчанию) */
export function toRequestCardModel(raw: ApiRequest, dicts: Dictionaries): WorkflowRequest {
  return toRequestViewModel(raw, dicts)
}
