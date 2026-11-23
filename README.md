# WorkFlow — система учёта заявок

Учебный фронтенд-проект практики «Октагон» (компетенция «Фронтенд-разработка», уровень 3).
Трекер заявок команды на **Nuxt 4 + Vue 3 + TypeScript + Pinia**.

## Уровень 3 — состояние приложения и взаимодействия

- **Pinia** подключена только для состояния, которым пользуются несколько частей приложения:
  - `stores/preferences.ts` — UI-настройки (размер страницы, сортировка по умолчанию),
    персистентность в localStorage, восстановление после перезагрузки;
  - `stores/requestUi.ts` — undo-стек последнего изменения и транзакционные уведомления.
  Предметные данные заявок в store НЕ дублируются — это server state (кэш useFetch).
- **Мутации**: `PATCH /api/requests/:id` (статус, приоритет, исполнитель),
  `POST /api/requests/:id/comments` (комментарии).
- **Optimistic update**: изменение применяется к данным мгновенно, запрос уходит в фоне;
  при ответе **409** или **500** — автоматический **rollback** к предыдущему значению
  с понятным сообщением о причине; после отказа список дополнительно
  синхронизируется с сервером (`refresh()`).
- **Undo**: последнее изменение статуса/приоритета попадает в стек; кнопка
  «Отменить последнее изменение» возвращает предыдущее значение (с PATCH на сервер).
- **Классификация состояния**:
  | Вид | Что здесь | Где хранится |
  |---|---|---|
  | URL state | поиск, фильтры, сортировка, страница | `route.query` |
  | Server state | заявки, справочники, комментарии | кэш `useFetch` / API |
  | App state | UI-настройки, undo-стек, уведомления | Pinia (+localStorage) |
  | Local state | ввод до debounce, draft комментария, фокус | refs в компонентах |

## Уровень 2 — реальные данные и API (база)

- API Nitro: `GET /api/requests` (поиск/фильтры/сортировка/пагинация), `GET /api/requests/:id`,
  `GET /api/users`, `GET /api/customers`, `GET /api/categories`;
- `useFetch`/`useAsyncData`, состояние в query-параметрах URL (прямая ссылка
  восстанавливает страницу), debounce поиска 350 мс;
- skeleton / empty / error состояния, HTTP 429/500 с повтором запроса;
- TS-модели API без `any` (`app/types/api.ts`), маппинг в одном месте (`app/utils/mappers.ts`);
- демо ошибок API: `?fail=500` / `?fail=429`, плюс случайные временные 500 (~4 %).

## Уровень 1 — UI и компонентное мышление (база)

Nuxt 4, `<script setup lang="ts">`, страницы `/`, `/login`, `/dashboard`, `/requests`,
`/requests/:id`, `/profile`; общий и публичный layout; 16 заявок; детали с timeline
и комментариями; фильтры; переиспользуемые компоненты; loading/empty/error;
клавиатурная навигация (skip-link, focus trap, radiogroup-стрелки); адаптив 360/768/1280.

## Запуск

```bash
npm install
npm run dev
```

## Структура

```
app/
  components/    StatusTag, PriorityTag, RequestCard, RequestFilters, RequestTimeline,
                 RequestComments, AppModal, StateBlock, AppPagination
  composables/   useRequests (список, URL state), useRequestMutations (optimistic/rollback/undo),
                 useDictionaries, useDebounce
  stores/        preferences.ts (UI-настройки), requestUi.ts (undo + уведомления)
  pages/         index, login, dashboard, requests/ (список + детали), profile
  types/         request.ts (view model), api.ts (модели API)
  utils/         mappers.ts (единая точка преобразования API → UI), format.ts
  middleware/    auth
server/
  api/           requests.get/patch, requests/:id.get, requests/:id/comments.post,
                 users.get, customers.get, categories.get
  utils/         db.ts (данные, задержка, имитация временных 500/429, 409-конфликт)
```
