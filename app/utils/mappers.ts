// Единое место преобразования сырых моделей API в модель представления.
// Ни один компонент не должен знать о формате полей API (snake_case, id-ссылки) —
// только этот модуль.
import type {
  ApiCategory,
  ApiComment,
  ApiCustomer,
  ApiPriority,
  ApiRequest,
  ApiTimelineEntry,
  ApiUser,
} from '~/types/api'
import type { RequestComment, RequestPriority, RequestStatus, TimelineEntry, WorkflowRequest } from '~/types/request'

const PRIORITY_BY_LEVEL: Record<ApiPriority, RequestPriority> = {
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'critical',
}

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
    actor: dicts.users.get(e.actor_id)?.name ?? 'Неизвестный пользователь',
    action: e.action,
  }))
}

function mapComments(comments: ApiComment[] | undefined, dicts: Dictionaries): RequestComment[] {
  return (comments ?? []).map((c, i) => ({
    id: `${c.at}-${i}`,
    at: c.at,
    author: dicts.users.get(c.author_id)?.name ?? dicts.customers.get(c.author_id)?.name ?? 'Автор',
    text: c.text,
  }))
}

/** API-запись → модель представления. Безопасна для записей с пропущенными полями. */
export function toRequestViewModel(raw: ApiRequest, dicts: Dictionaries): WorkflowRequest {
  const author = dicts.customers.get(raw.author_id)
  const assignee = raw.assignee_id !== undefined ? dicts.users.get(raw.assignee_id) : undefined

  return {
    id: raw.id,
    title: raw.subject,
    description: raw.body,
    status: raw.status as RequestStatus,
    priority: PRIORITY_BY_LEVEL[raw.priority] ?? 'medium',
    author: author?.name ?? `Заказчик #${raw.author_id}`,
    authorCompany: author?.company,
    assignee: assignee?.name ?? '—',
    category: dicts.categories.get(raw.category_id)?.name ?? 'Без категории',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    tags: raw.tags ?? [],
    timeline: mapTimeline(raw.timeline, dicts),
    comments: mapComments(raw.comments, dicts),
  }
}

/** Короткая версия для списка (те же гарантии по умолчанию) */
export function toRequestCardModel(raw: ApiRequest, dicts: Dictionaries): WorkflowRequest {
  return toRequestViewModel(raw, dicts)
}
