// Общий setup Vitest (уровень 5): Nuxt auto-imports не существуют вне сборки
// Nuxt, поэтому глобалы Vue/Pinia и автоматический импортируемые идентификаторы
// предоставляем явно. Тесты подменяют контекстные глобалы (useRoute, $fetch и т.п.)
// через vi.stubGlobal / присвоение globalThis.
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { createPinia, defineStore, setActivePinia } from 'pinia'

const g = globalThis as Record<string, unknown>

// Vue API — auto-import в Nuxt, здесь — явные глобалы
Object.assign(g, { ref, computed, watch, nextTick, onBeforeUnmount, useId })

// Pinia
g.defineStore = defineStore
setActivePinia(createPinia())

// Nuxt-глобалы, используемые в тестируемых модулях (вызовы подменяются в тестах)
g.defineNuxtRouteMiddleware = (fn: unknown) => fn
g.navigateTo = (to: unknown) => ({ redirect: to })
g.$fetch = () => Promise.reject(new Error('$fetch не подменён в тесте'))

// Реальные composables, используемые внутри других composables
import { useDebouncedRef } from '../app/composables/useDebounce'
g.useDebouncedRef = useDebouncedRef
