// Публичные константы сайта (уровень 6): домен для canonical и Open Graph.
// Домен условный — в проде заменяется на реальный без изменения страниц.

/** Условный домен сайта: используется в canonical и og:url */
export const SITE_URL = 'https://workflow.example.com'

export const SITE_NAME = 'WorkFlow'

export const SITE_DESCRIPTION =
  'WorkFlow — простая система учёта заявок команды: статусы, приоритеты, исполнители, хронология и комментарии.'

/** Абсолютный URL для canonical/og:url по пути вида /faq или /articles/x */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === '/' ? '/' : path}`
}
