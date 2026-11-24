// Контент базы знаний (уровень 6): целостность данных и синхронизация
// со статическим public/sitemap.xml — регрессионная защита от «забыли
// добавить статью в sitemap».
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARTICLES, articleSlugs, getArticle } from '~/content/articles'
import { FAQ_GROUPS } from '~/content/faq'
import { HELP_SECTIONS } from '~/content/help'
import { SITE_URL, absoluteUrl } from '~/utils/site'

describe('articles: целостность контента', () => {
  it('слаги уникальны', () => {
    const slugs = articleSlugs()
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('у каждой статьи заполнены title, description, date и тело', () => {
    for (const a of ARTICLES) {
      expect(a.title.length).toBeGreaterThan(3)
      expect(a.description.length).toBeGreaterThan(20)
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(a.tags.length).toBeGreaterThan(0)
      expect(a.body.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('getArticle находит статью по слагу и undefined для неизвестного', () => {
    const slug = ARTICLES[0]!.slug
    expect(getArticle(slug)?.slug).toBe(slug)
    expect(getArticle('no-such-article')).toBeUndefined()
  })
})

describe('sitemap.xml синхронизирован с контентом', () => {
  const sitemap = readFileSync(join(process.cwd(), 'public', 'sitemap.xml'), 'utf8')

  it('каждая статья есть в sitemap', () => {
    for (const slug of articleSlugs()) {
      expect(sitemap).toContain(`${SITE_URL}/articles/${slug}`)
    }
  })

  it('публичные маршруты есть в sitemap', () => {
    for (const path of ['/', '/faq', '/help', '/articles', '/login']) {
      expect(sitemap).toContain(absoluteUrl(path))
    }
  })

  it('robots.txt ссылается на sitemap', () => {
    const robots = readFileSync(join(process.cwd(), 'public', 'robots.txt'), 'utf8')
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })
})

describe('faq и help: ссылки существуют', () => {
  it('все ссылки help ведут на статьи из контента или на приложение', () => {
    const known = new Set(['/login', '/faq'])
    for (const slug of articleSlugs()) known.add(`/articles/${slug}`)
    for (const section of HELP_SECTIONS) {
      for (const link of section.links) {
        expect(known.has(link.to), `неизвестная ссылка ${link.to}`).toBe(true)
      }
    }
  })

  it('FAQ непуст и вопросы имеют ответы', () => {
    expect(FAQ_GROUPS.length).toBeGreaterThan(0)
    for (const group of FAQ_GROUPS) {
      expect(group.items.length).toBeGreaterThan(0)
      for (const item of group.items) {
        expect(item.q.length).toBeGreaterThan(3)
        expect(item.a.length).toBeGreaterThan(10)
      }
    }
  })
})
