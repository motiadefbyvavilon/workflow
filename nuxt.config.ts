// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'WorkFlow',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { property: 'og:site_name', content: 'WorkFlow' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
  // Режимы рендеринга (уровень 6):
  // — публичные страницы SSR-first: содержательный HTML при первом запросе
  //   для поисковых систем и быстрый first paint;
  // — приватные страницы CSR-only (ssr: false): они требуют сессию и всё
  //   равно грузят данные на клиенте, серверный рендер им не нужен —
  //   Nitro отдаёт лёгкий SPA-шелл без двойного рендеринга и данных 401-ошибок.
  routeRules: {
    '/': { ssr: true },
    '/login': { ssr: true },
    '/faq': { ssr: true },
    '/help': { ssr: true },
    '/articles': { ssr: true },
    '/articles/**': { ssr: true },
    '/dashboard': { ssr: false },
    '/profile': { ssr: false },
    '/requests/**': { ssr: false },
  },
})
