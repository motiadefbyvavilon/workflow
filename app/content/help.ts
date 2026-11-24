// Публичный контент WorkFlow (уровень 6): help center — разделы
// справки для страницы /help. Каждый раздел ссылается на статьи
// базы знаний или на раздел приложения.

export interface HelpSection {
  title: string
  description: string
  /** Ссылки внутри раздела: на статьи (/articles/<slug>) или страницы приложения */
  links: { label: string; to: string }[]
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'Первые шаги',
    description: 'Вход, создание первой заявки и обзор интерфейса.',
    links: [
      { label: 'Как создать заявку в WorkFlow', to: '/articles/kak-sozdat-zayavku' },
      { label: 'Статусы заявки и её жизненный цикл', to: '/articles/statusy-i-zhiznennyj-cikl' },
      { label: 'Войти в демо', to: '/login' },
    ],
  },
  {
    title: 'Работа с заявками',
    description: 'Поиск, фильтры, сортировка и комментарии.',
    links: [
      { label: 'Поиск, фильтры и сортировка списка заявок', to: '/articles/poisk-filtry-i-sortirovka' },
      { label: 'Optimistic update: почему интерфейс отвечает мгновенно', to: '/articles/optimistic-update-i-otkat' },
    ],
  },
  {
    title: 'Доступ и безопасность',
    description: 'Роли, права и устройство сессий.',
    links: [
      { label: 'Роли и права доступа: кто что видит', to: '/articles/roli-i-prava-dostupa' },
    ],
  },
  {
    title: 'Вопросы и ответы',
    description: 'Короткие ответы на частые вопросы.',
    links: [{ label: 'Открыть FAQ', to: '/faq' }],
  },
]
