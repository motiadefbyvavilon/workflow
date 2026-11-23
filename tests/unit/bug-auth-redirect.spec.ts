// Регрессия (уровень 5): доступ к приватному route после logout.
// Баг: guard редиректил на /login без сохранения исходного пути — после
// входа пользователь терял контекст; авторизованный мог сидеть на /login.
// Фикс: middleware пишет ?redirect=<исходный путь> и возвращает авторизованного
// с /login на redirect/dashboard. Тест на поведении middleware с подменёнными
// useAuthStore/navigateTo.
import { beforeEach, describe, expect, it } from 'vitest'
import authMiddleware from '~/middleware/auth'

const g = globalThis as Record<string, unknown>

let me: unknown = null
const redirects: unknown[] = []

function callMiddleware(path: string, query: Record<string, string> = {}) {
  redirects.length = 0
  const qs = Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''
  return (authMiddleware as (to: unknown, from: unknown) => unknown)(
    { path, fullPath: `${path}${qs}`, query },
    {},
  )
}

describe('bug: приватный route после logout', () => {
  beforeEach(() => {
    me = null
    g.useAuthStore = () => ({ me, ready: true })
    g.navigateTo = (to: unknown) => {
      redirects.push(to)
      return { redirect: to }
    }
  })

  it('анонима с приватной страницы редиректит на /login с redirect', () => {
    me = null
    callMiddleware('/requests', { page: '2' })
    expect(redirects).toEqual([
      { path: '/login', query: { redirect: '/requests?page=2' } },
    ])
  })

  it('авторизованный проходит на приватную страницу без редиректа', () => {
    me = { id: 1, role: 'operator' }
    expect(callMiddleware('/requests')).toBeUndefined()
    expect(redirects).toHaveLength(0)
  })

  it('анониму /login доступна без редиректа', () => {
    me = null
    expect(callMiddleware('/login')).toBeUndefined()
    expect(redirects).toHaveLength(0)
  })

  it('авторизованного с /login уводит на redirect, если он есть', () => {
    me = { id: 1, role: 'client' }
    callMiddleware('/login', { redirect: '/requests/WF-101' })
    expect(redirects).toEqual(['/requests/WF-101'])
  })

  it('авторизованного с /login без redirect уводит на дашборд', () => {
    me = { id: 1, role: 'client' }
    callMiddleware('/login')
    expect(redirects).toEqual(['/dashboard'])
  })
})
