// Preferences store (уровень 5): сохранение в localStorage и синхронное
// восстановление applySavedPreferences до первого запроса приложения.
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { applySavedPreferences, PREFS_STORAGE_KEY, usePreferencesStore } from '~/stores/preferences'

describe('preferences store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('setPageSize/setDefaultSort сохраняются в localStorage', async () => {
    const prefs = usePreferencesStore()
    prefs.setPageSize(20)
    prefs.setDefaultSort('priority')
    await nextTick() // watcher пишет асинхронно
    const saved = JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? '{}')
    expect(saved).toEqual({ pageSize: 20, defaultSort: 'priority' })
  })

  it('applySavedPreferences восстанавливает сохранённые значения', () => {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ pageSize: 20, defaultSort: 'title' }))
    const prefs = usePreferencesStore()
    applySavedPreferences(prefs)
    expect(prefs.pageSize).toBe(20)
    expect(prefs.defaultSort).toBe('title')
  })

  it('игнорирует повреждённые данные и недопустимые значения', () => {
    localStorage.setItem(PREFS_STORAGE_KEY, '{не json')
    const prefs = usePreferencesStore()
    applySavedPreferences(prefs)
    expect(prefs.pageSize).toBe(5)
    expect(prefs.defaultSort).toBe('updated_desc')

    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ pageSize: 7, defaultSort: 'hack' }))
    applySavedPreferences(prefs)
    expect(prefs.pageSize).toBe(5)
    expect(prefs.defaultSort).toBe('updated_desc')
  })
})
