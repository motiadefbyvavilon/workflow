# WorkFlow — система учёта заявок

Учебный фронтенд-проект практики «Октагон» (компетенция «Фронтенд-разработка», уровень 2).
Трекер заявок команды на **Nuxt 4 + Vue 3 + TypeScript** (`<script setup lang="ts">`).

## Уровень 2 — реальные данные и API

- **API на Nitro**: `GET /api/requests` (поиск, фильтры, сортировка, пагинация),
  `GET /api/requests/:id`, `GET /api/users`, `GET /api/customers`, `GET /api/categories`
- **useFetch / useAsyncData** для всех запросов; при смене query данные перезапрашиваются автоматически
- **Состояние в URL**: `?search=&status=&priority=&category=&sort=&page=` — прямая ссылка
  полностью восстанавливает страницу (SSR отдаёт нужную страницу сразу)
- **Debounce поиска** (350 мс) — запрос не уходит на каждый введённый символ
- **Состояния**: skeleton loading, empty state, error state с повтором запроса;
  HTTP 429 и 500 показываются с понятным сообщением и кнопкой «Повторить»
- **TS-модели API без any** (`app/types/api.ts`), преобразование в модель
  представления — в одном месте (`app/utils/mappers.ts`), справочники подтягиваются
  через `useDictionaries` (`useAsyncData` с ключом, без повторных запросов)
- **Устойчивость к данным**: записи с отсутствующими `assignee_id`, `tags`,
  `timeline`, `company`/`email` заказчика отображаются корректно
- Демо ошибок API: `?fail=500` или `?fail=429` в query к `/api/requests`;
  без параметра сервер с шансом ~4% возвращает временную 500 (для проверки retry)

## Запуск

```bash
npm install
npm run dev        # dev-сервер
npm run build && node .output/server/index.mjs   # production
```

## Структура

```
app/
  components/    StatusTag, PriorityTag, RequestCard, RequestFilters (radiogroup + категории),
                 RequestTimeline, RequestComments, AppModal, StateBlock, AppPagination
  composables/   useRequests (список с query-параметрами), useDictionaries,
                 useDebounce
  pages/         index, login, dashboard, requests/ (список + детали), profile
  types/         request.ts (view model), api.ts (модели API)
  utils/         mappers.ts (единая точка преобразования API → UI), format.ts
  middleware/    auth
server/
  api/           requests.get, requests/[id].get, users.get, customers.get, categories.get
  utils/         db.ts (данные, задержка, имитация временных 500/429)
```
