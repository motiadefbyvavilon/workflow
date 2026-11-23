// Справочники API (пользователи, заказчики, категории).
// useAsyncData с ключом — данные кешируются между страницами,
// повторных запросов при переходах по SPA не происходит.
// ВАЖНО: запросы идут через useRequestFetch() — при SSR он пробрасывает
// cookie сессии на сервер API; голый $fetch в SSR-контексте анонимен,
// и справочники при прямом заходе на страницу оказывались пустыми (реальный
// баг уровня 5, пойман E2E: категории не грузились на /requests/new).
import type { ApiCategory, ApiCustomer, ApiUser, ListResponse } from '~~/shared/types'
import { buildDictionaries, type Dictionaries } from '~/utils/mappers'

export function useDictionaries() {
  const requestFetch = useRequestFetch()

  const { data: usersData } = useAsyncData('api-users', () =>
    requestFetch<ListResponse<ApiUser>>('/api/users'),
  )
  const { data: customersData } = useAsyncData('api-customers', () =>
    requestFetch<ListResponse<ApiCustomer>>('/api/customers'),
  )
  const { data: categoriesData } = useAsyncData('api-categories', () =>
    requestFetch<ListResponse<ApiCategory>>('/api/categories'),
  )

  const dicts = computed<Dictionaries>(() =>
    buildDictionaries(usersData.value?.items, customersData.value?.items, categoriesData.value?.items),
  )

  const categories = computed<ApiCategory[]>(() => categoriesData.value?.items ?? [])

  return { dicts, categories }
}
