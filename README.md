# WorkFlow — система учёта заявок

Учебный full-stack проект практики «Октагон». Трекер заявок команды на
**Nuxt 4 + Vue 3 + TypeScript + Pinia + Nitro + PostgreSQL**.

## Уровень 5 — debugging, testing, надёжность

Найдены и исправлены 5 багов (для каждого — воспроизведение, причина,
фикс и защищающий регрессионный тест):

1. **Двойной комментарий** — двойной клик по «Отправить» создавал два
   комментария: дизейбл кнопки от `postingComment` поднимался только после
   реактивного цикла, второй клик успевал пройти. Фикс: синхронный локальный
   флаг `sending` в `RequestComments.vue` (инпут и кнопка дизейблятся сразу).
   Тест: `tests/unit/bug-double-comment.spec.ts`.
2. **Гонка поиска** — при быстрых вводе/очистке поиска ответы приходили не по
   порядку и устаревший результат перезаписывал актуальный; заодно возможен был
   цикл URL ↔ watcher. Фикс: `useRequests.ts` переведён на ручной `$fetch` с
   счётчиком `requestSeq` (устаревшие ответы и ошибки игнорируются) и guard'ы
   в watcher'ах. Тест: `tests/unit/bug-search-race.spec.ts`.
3. **Приватный route после logout** — middleware редиректил анонима на `/login`
   без сохранения адреса: после входа пользователь попадал не туда, откуда
   уходил; заодно авторизованный мог остаться на странице логина. Фикс:
   `middleware/auth.ts` редиректит на `/login?redirect=<полный путь>`, `login.vue`
   после входа возвращает на `redirect`; на странице 401/403 появилась кнопка
   «Войти снова» с тем же механизмом. Тест: `tests/unit/bug-auth-redirect.spec.ts`
   + E2E-сценарий «вернуться после логина».
4. **Потеря состояния после refresh** — сохранённые настройки (размер страницы,
   сортировка) терялись при перезагрузке из-за порядка гидратации SSR.
   Фикс: чистая функция `applySavedPreferences()` (валидация значений) +
   клиентский плагин `plugins/00-preferences.client.ts`, выполняющийся первым.
   Тест: `tests/unit/preferences.spec.ts`.
5. **Обработка 401/500/409** — истёкшая сессия раньше давала тихий отказ;
   теперь 401 в списке заявок сбрасывает сессию и ведёт на логин с `redirect`,
   мутации (409/500/401) откатываются с понятными сообщениями через общий
   `errorText()`. Тесты: `tests/unit/request-mutations.spec.ts`,
   401-сценарии в `bug-search-race.spec.ts`.

### Тестирование

- **Unit/integration (Vitest, happy-dom)**: переходы статусов, хеширование паролей
  и права доступа (scrypt, node-окружение), все 5 багов, мутации с мок-фетчером.
  `npm run test` — 51 тест.
- **E2E (Playwright)**: полный сценарий оператора (логин → создать заявку →
  назначить → сменить статус → комментарий → логаут) и возврат на защищённый
  адрес после повторного логина. Используется отдельная БД (env `WF_DATA_DIR`,
  по умолчанию `.data/pg`).
  Перед первым запуском: `npx playwright install chromium`, затем `npm run test:e2e`.
- Проверки качества: `npm run typecheck` (vue-tsc, 0 ошибок), `npm run lint`
  (eslint flat config, 0 ошибок).

## Уровень 4 — full-stack: Nitro, PostgreSQL, auth

- **PostgreSQL** через [`@electric-sql/pglite`](https://pglite.dev) — настоящий
  PostgreSQL 16, скомпилированный в WASM и работающий внутри Node-процесса Nitro.
  Данные персистентны в `.data/pg` (каталог исключён из git). Мок-БД уровня 2
  удалена: `server/utils/db.ts` теперь синглтон PGlite с миграциями
  (`CREATE TABLE IF NOT EXISTS`) и seed-данными.
- **Схема**: users, sessions, customers, categories, requests, comments,
  request_events (хронология заявки). Заявки сохранили строковые id вида
  `WF-101`, чтобы фронтенд уровней 1–3 продолжил работать без изменений.
- **Auth**: `POST /api/auth/login` (scrypt-хеш паролей, соль), сессии в БД
  (uuid, 7 дней), httpOnly-cookie `wf_session` (sameSite=lax), `logout`, `me`.
  Скрытие кнопок на фронте — только UX: каждая защищённая операция проверяет
  сессию и роль на сервере (`requireUser`).
- **Роли**: `client`, `operator`, `agent`, `admin`.
  Client видит только свои заявки; Agent — назначенные на него и созданные им;
  Operator/Admin — все. Назначение исполнителя — только Operator/Admin,
  нельзя назначить деактивированного пользователя (409) или клиента (400).
- **Переходы статусов** — общая карта `shared/utils/status.ts`
  (используется и сервером, и фронтом): невалидный переход → 409,
  реопен (`done → in_progress`) и реактивация (`cancelled → new`) — только
  Operator/Admin (403). Каждое изменение пишется в `request_events`.
- **Zod-валидация** тел всех POST/PATCH: невалидно → 400 с issues.
- **shared/**: общие типы (`shared/types/index.ts`) и карта статусов
  (`shared/utils/status.ts`) импортируются из app/ и server/. Ничего из app-only
  кода в server не попадает и наоборот.
- **Создание заявок**: `POST /api/requests` + страница `/requests/new`.

### Демо-аккаунты (seed)

| Роль | Email | Пароль |
|---|---|---|
| Админ | `admin@octagon.local` | `admin123` |
| Оператор | `t.aliev@octagon.local` | `operator123` |
| Сотрудник | `i.lebedev@octagon.local` | `agent123` |
| Сотрудник | `o.sokolova@octagon.local` | `agent123` |
| Клиент | `a.smirnova@vostok.ru` | `client123` |
| Клиент | `p.volkov@granit.ru` | `client123` |
| Сотрудник (деактивирован) | `s.antonov@octagon.local` | `agent123` |

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

## Уровень 2 — реальные данные и API (база)

- API Nitro: `GET /api/requests` (поиск/фильтры/сортировка/пагинация), `GET /api/requests/:id`,
  справочники users/customers/categories;
- `useFetch`/`useAsyncData`, состояние в query-параметрах URL (прямая ссылка
  восстанавливает страницу), debounce поиска 350 мс;
- skeleton / empty / error состояния, повтор запроса;
- TS-модели API без `any`, маппинг в одном месте (`app/utils/mappers.ts`).

## Уровень 1 — UI и компонентное мышление (база)

Nuxt 4, `<script setup lang="ts">`, страницы `/`, `/login`, `/dashboard`, `/requests`,
`/requests/:id`, `/profile`; общий и публичный layout; детали с timeline
и комментариями; фильтры; переиспользуемые компоненты; loading/empty/error;
клавиатурная навигация; адаптив 360/768/1280.

## Запуск

```bash
npm install
npm run dev        # дев-сервер (БД инициализируется автоматически)
# production:
npx nuxi build
node .output/server/index.mjs   # данные PostgreSQL — в .data/pg рядом с проектом
# каталог данных можно переопределить: WF_DATA_DIR=/path/to/pg node .output/server/index.mjs
```

## Структура

```
shared/          types/index.ts (общие типы), utils/status.ts (переходы статусов)
app/
  components/    StatusTag, PriorityTag, RequestCard, RequestFilters, RequestTimeline,
                 RequestComments, AppModal, StateBlock, AppPagination
  composables/   useRequests (список, URL state), useRequestMutations (optimistic/rollback/undo),
                 useDictionaries, useDebounce
  stores/        auth.ts (сессия), preferences.ts (UI-настройки), requestUi.ts (undo + уведомления)
  pages/         index, login, dashboard, requests/ (список, детали, /new), profile
  utils/         mappers.ts (единая точка преобразования API → UI), format.ts
  middleware/    auth (guard по auth store)
server/
  api/           auth/ (login, logout, me), requests (GET/POST), requests/:id (GET/PATCH),
                 requests/:id/comments (GET/POST), users (GET, :id PATCH),
                 customers, categories
  plugins/       db.ts (прогрев PGlite до приёма запросов)
  utils/         db.ts (PGlite: схема + seed), auth.ts (scrypt, сессии, requireUser),
                 access.ts (права на заявки)
```
