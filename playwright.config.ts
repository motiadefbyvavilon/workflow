// Playwright (уровень 5): E2E против production-сборки Nuxt.
// Чистое окружение: отдельный порт 5210 и СВЕЖАЯ БД через WF_DATA_DIR
// (PGlite-seed выполняется при старте сервера). webServer запускает
// node .output/server/index.mjs сам — main-сервер на 5205 не нужен.
// Данные БД — во временном каталоге ОС: вне репозитория (OneDrive/облачная
// синхронизация держала файлы PGlite и давала транзиентные ENOENT).
import { defineConfig } from '@playwright/test'

const E2E_PORT = 5210

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${E2E_PORT}`,
    trace: 'retain-on-failure',
  },
  globalSetup: './tests/e2e/global-setup.ts',
  webServer: {
    command: 'node .output/server/index.mjs',
    // ждём не просто открытый порт, а реальный HTTP-ответ (SSR главной),
    // чтобы тесты не стартовали на полуинициализированном сервере
    url: `http://localhost:${E2E_PORT}/`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      PORT: String(E2E_PORT),
      // WF_DATA_DIR НЕ задаём здесь: global-setup.ts присваивает уникальный
      // каталог в process.env.WF_DATA_DIR, и сервер унаследует его.
    },
  },
})
