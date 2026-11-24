// SSR/SEO/hydration (уровень 6): публичные страницы отдают содержательный
// HTML с первого запроса, у каждой — уникальный title, несуществующая
// статья отдаёт 404, а в консоли браузера нет Vue hydration-предупреждений
// («переданный» hydration mismatch: баг не найден вручную, проверка закреплена
// регрессионным тестом — см. docs/PERFORMANCE.md).
import { expect, test } from '@playwright/test'
import { ARTICLES } from '../../app/content/articles'

// Ключевой текст, который обязан присутствовать в SSR-HTML страницы
const SSR_CONTENT: [string, string][] = [
  ['/', 'простая система учёта заявок'],
  ['/faq', 'Частые вопросы'],
  ['/help', 'Help center'],
  ['/articles', 'База знаний'],
  [`/articles/${ARTICLES[0]!.slug}`, ARTICLES[0]!.title],
  ['/login', 'Вход в WorkFlow'],
]

const UNIQUE_TITLES: [string, string][] = [
  ['/', 'WorkFlow — простая система учёта заявок команды'],
  ['/faq', 'FAQ — частые вопросы о WorkFlow'],
  ['/help', 'Help center — справка по WorkFlow'],
  ['/articles', 'Статьи — база знаний WorkFlow'],
  [`/articles/${ARTICLES[0]!.slug}`, `${ARTICLES[0]!.title} — WorkFlow`],
  ['/login', 'Вход — WorkFlow'],
]

async function freshPage(browser: import('@playwright/test').Browser) {
  const page = await browser.newPage()
  const hydrationIssues: string[] = []
  page.on('console', (m) => {
    const text = m.text()
    if (/hydration|Hydration|mismatch/i.test(text) || (m.type() === 'warning' && /\[Vue warn\]/.test(text))) {
      hydrationIssues.push(text)
    }
  })
  page.on('pageerror', (e) => hydrationIssues.push(`pageerror: ${e.message}`))
  return { page, hydrationIssues }
}

test.describe('публичные страницы: SSR-first и без hydration mismatch', () => {
  test('содержательный HTML и отсутствие hydration mismatch', async ({ browser }) => {
    for (const [url, text] of SSR_CONTENT) {
      const { page, hydrationIssues } = await freshPage(browser)
      const response = await page.goto(url, { waitUntil: 'networkidle' })
      expect(response?.status(), url).toBe(200)
      // контент отрендерен на сервере, а не догружен на клиенте
      await expect(page.locator(`text=${text}`).first()).toBeVisible()
      expect(hydrationIssues, `hydration issues на ${url}`).toEqual([])
      await page.close()
    }
  })

  test('уникальные title и canonical у каждой страницы', async ({ browser }) => {
    const titles = new Set<string>()
    for (const [url, expectedTitle] of UNIQUE_TITLES) {
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      const title = await page.title()
      expect(title, url).toBe(expectedTitle)
      titles.add(title)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical, `canonical на ${url}`).toBe(`https://workflow.example.com${url}`)
      await page.close()
    }
    // уникальность: ни одна пара страниц не делит title
    expect(titles.size).toBe(UNIQUE_TITLES.length)
  })

  test('статья имеет og:type=article и метаданные Open Graph', async ({ browser }) => {
    const page = await browser.newPage()
    const slug = ARTICLES[0]!.slug
    await page.goto(`/articles/${slug}`, { waitUntil: 'domcontentloaded' })
    expect(await page.locator('meta[property="og:type"]').getAttribute('content')).toBe('article')
    expect(await page.locator('meta[property="og:title"]').getAttribute('content')).toBe(ARTICLES[0]!.title)
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toBe(ARTICLES[0]!.description)
    await page.close()
  })

  test('несуществующая статья отдаёт HTTP 404', async ({ page }) => {
    const response = await page.goto('/articles/no-such-article', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(404)
  })

  test('robots.txt и sitemap.xml отдаются', async ({ page }) => {
    const robots = await page.goto('/robots.txt')
    expect(robots?.status()).toBe(200)
    expect(await robots?.text()).toContain('Sitemap: https://workflow.example.com/sitemap.xml')
    const sitemap = await page.goto('/sitemap.xml')
    expect(sitemap?.status()).toBe(200)
    expect(await sitemap?.text()).toContain(`${ARTICLES[0]!.slug}`)
  })
})
