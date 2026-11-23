// Vitest (уровень 5): unit/integration-тесты бизнес-правил и composables.
// Алиасы повторяют разрешения Nuxt (~ → app/, ~~ → корень, #shared → shared/).
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': `${root}app`,
      '~~': root,
      '#shared': `${root}shared`,
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.spec.ts', 'tests/integration/**/*.spec.ts'],
  },
})
