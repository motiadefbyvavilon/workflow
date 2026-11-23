// Справочники API (пользователи, заказчики, категории).
// useAsyncData с ключом — данные кешируются между страницами,
// повторных запросов при переходах по SPA не происходит.
import type { ApiCategory, ApiCustomer, ApiUser, ListResponse } from '~~/shared/types'
import { buildDictionaries, type Dictionaries } from '~/utils/mappers'

export function useDictionaries() {
  const { data: usersData } = useAsyncData('api-users', () =>
    $fetch<ListResponse<ApiUser>>('/api/users'),
  )
  const { data: customersData } = useAsyncData('api-customers', () =>
    $fetch<ListResponse<ApiCustomer>>('/api/customers'),
  )
  const { data: categoriesData } = useAsyncData('api-categories', () =>
    $fetch<ListResponse<ApiCategory>>('/api/categories'),
  )

  const dicts = computed<Dictionaries>(() =>
    buildDictionaries(usersData.value?.items, customersData.value?.items, categoriesData.value?.items),
  )

  const categories = computed<ApiCategory[]>(() => categoriesData.value?.items ?? [])

  return { dicts, categories }
}
