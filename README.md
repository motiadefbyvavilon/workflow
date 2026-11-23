# WorkFlow — система учёта заявок

Учебный фронтенд-проект практики «Октагон» (компетенция «Фронтенд-разработка», уровень 1).
Трекер заявок команды на **Nuxt 4 + Vue 3 + TypeScript** (`<script setup lang="ts">`).

## Функциональность (уровень 1 — локальные mock-данные)

- **Страницы**: `/` (лендинг), `/login`, `/dashboard`, `/requests`, `/requests/:id`, `/profile`
- **Layout-ы**: общий (приложение) и публичный (лендинг/вход)
- **14 заявок** на локальных данных с тегами, приоритетами и статусами
- **Детали заявки**: хронология событий (timeline) и комментарии с формой добавления
- **Фильтры** по статусу и приоритету (radiogroup-паттерн, навигация стрелками)
- **Состояния интерфейса**: loading (скелетоны), empty, error — переключаются демо-сценарием API
- **Мок-авторизация**: флаг сессии в `localStorage`, guard-мiddleware на прикладных страницах
- **Доступность**: skip-link, focus trap в модалке, aria-атрибуты, навигация с клавиатуры
- **Адаптив**: 360 / 768 / 1280 px

## Запуск

```bash
npm install
npm run dev
```

## Структура

```
app/
  components/    StatusTag, PriorityTag, RequestCard, RequestFilters,
                 RequestTimeline, RequestComments, AppModal, StateBlock
  composables/   useRequests — слой данных (уровень 2 заменится на реальный API)
  layouts/       default (приложение), public (лендинг)
  middleware/    auth — guard прикладных страниц
  pages/         index, login, dashboard, requests/, requests/[id], profile
  types/         доменная модель заявки
  utils/         форматирование дат и строк
```

Архитектурно слой данных вынесен в `useRequests`: на следующих уровнях
замена mock-источника на реальный `fetch` не потребует правок страниц.
