// ESLint flat config (уровень 5): минимальный разумный набор —
// js recommended + typescript-eslint recommended + vue essentials.
// no-undef отключён: Nuxt auto-imports покрывает typecheck (nuxi typecheck).
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'

export default [
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      '.data/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'tests/e2e/.data/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: ts.parser },
    },
  },
  {
    rules: {
      'no-undef': 'off',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]
