// Чистое окружение E2E (уровень 5): каждый прогон получает УНИКАЛЬНЫЙ
// каталог данных БД (workflow-e2e-pg-<rnd> во временном каталоге ОС).
// Уникальность решает две проблемы: (1) сервер прошлого прогона может ещё
// держать файлы БД — конфликта имён не будет; (2) каталог вне репозитория —
// облачная синхронизация (OneDrive) не трогает файлы PGlite (иначе возможны
// транзиентные ErrnoError ENOENT при init).
// Путь передаётся серверу через process.env.WF_DATA_DIR: globalSetup работает
// в том же процессе Playwright, что и старт webServer, и дочерний сервер
// наследует окружение. Если WF_DATA_DIR задан снаружи — уважаем его.
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DIR_PREFIX = 'workflow-e2e-pg-'

export default function globalSetup() {
  if (!process.env.WF_DATA_DIR) {
    process.env.WF_DATA_DIR = join(
      tmpdir(),
      `${DIR_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    )
  }
  const dir = process.env.WF_DATA_DIR

  // best-effort: убираем каталоги прошлых прогонов (заблокированные пропускаем)
  for (const name of readdirSync(tmpdir())) {
    if (name.startsWith(DIR_PREFIX)) {
      try {
        rmSync(join(tmpdir(), name), { recursive: true, force: true })
      } catch {
        /* занят живым процессом — не мешает, каталог уникальный */
      }
    }
  }
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
}
