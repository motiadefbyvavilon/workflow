<script setup lang="ts">
// Список заявок (уровень 2): данные с API через useFetch, поиск с debounce,
// фильтры/сортировка/страница — в query-параметрах URL (прямая ссылка
// восстанавливает состояние), skeleton / empty / error состояния, повтор запроса.
definePageMeta({ middleware: 'auth' })

useHead({ title: 'Заявки — WorkFlow' })

const {
  filters, searchInput,
  requests, total, page, pageCount,
  isLoading, isEmpty, error, errorMessage,
  update, setPage, retry,
} = useRequests()

const { categories } = useDictionaries()

// Переключение фильтров всегда возвращает на первую страницу
// (источники по одному — иначе массив-геттер триггерится на любое изменение)
watch(
  [() => filters.value.status, () => filters.value.priority, () => filters.value.category],
  () => {
    if (page.value !== 1) update({ page: 1 })
  },
)

const sort = computed({
  get: () => filters.value.sort,
  set: (v) => update({ sort: v, page: 1 }),
})

// Пользовательские настройки UI — app state, персистентен (Pinia + localStorage)
const prefs = usePreferencesStore()
const pageSize = computed({
  get: () => prefs.pageSize,
  set: (v: number) => {
    prefs.setPageSize(v)
    if (page.value !== 1) update({ page: 1 })
  },
})

// Фильтры через сеттеры — каждое изменение сразу пишется в URL и сбрасывает страницу
const statusFilter = computed({
  get: () => filters.value.status,
  set: (v) => update({ status: v, page: 1 }),
})
const priorityFilter = computed({
  get: () => filters.value.priority,
  set: (v) => update({ priority: v, page: 1 }),
})
const categoryFilter = computed({
  get: () => filters.value.category,
  set: (v) => update({ category: v, page: 1 }),
})
</script>

<template>
  <div class="requests-page">
    <header class="page-head">
      <h1>Заявки</h1>
      <div class="head-controls">
        <NuxtLink to="/requests/new" class="btn btn-primary btn-sm">+ Новая заявка</NuxtLink>
        <div class="sort-box">
          <label for="page-size" class="sort-label">На странице</label>
          <select id="page-size" v-model.number="pageSize" class="sort-select">
            <option v-for="n in PAGE_SIZE_OPTIONS" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="sort-box">
          <label for="sort-select" class="sort-label">Сортировка</label>
          <select id="sort-select" v-model="sort" class="sort-select">
            <option v-for="(label, key) in SORT_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
      </div>
    </header>

    <div class="search-box">
      <div class="field">
        <label for="search-input">Поиск</label>
        <input
          id="search-input"
          v-model="searchInput"
          type="search"
          placeholder="Номер, название или текст заявки…"
          autocomplete="off"
        />
      </div>
      <p class="search-hint" aria-live="polite">
        Запрос отправляется с задержкой 350 мс после окончания ввода (debounce)
      </p>
    </div>

    <RequestFilters
      v-model:status="statusFilter"
      v-model:priority="priorityFilter"
      v-model:category-id="categoryFilter"
      :categories="categories"
    />

    <!-- Loading: скелетоны списка -->
    <div v-if="isLoading" class="req-list" aria-label="Загрузка заявок" aria-busy="true">
      <div v-for="i in 5" :key="i" class="card skeleton-card">
        <div class="skeleton" style="width: 30%"></div>
        <div class="skeleton" style="width: 70%"></div>
        <div class="skeleton" style="width: 45%"></div>
      </div>
    </div>

    <!-- Error: временная ошибка сервера / rate limit, есть повтор -->
    <StateBlock v-else-if="error" tone="danger" title="Ошибка загрузки" :description="errorMessage">
      <button type="button" class="btn btn-primary" @click="retry()">Повторить запрос</button>
    </StateBlock>

    <!-- Empty: нет результатов по текущим параметрам -->
    <StateBlock
      v-else-if="isEmpty"
      title="Заявок не найдено"
      :description="
        total === 0
          ? 'По текущим параметрам ничего не найдено. Измените поиск или сбросьте фильтры.'
          : 'Нет данных.'
      "
    >
      <button type="button" class="btn btn-ghost" @click="update({ search: '', status: '', priority: '', category: 0, page: 1 }); searchInput = ''">
        Сбросить всё
      </button>
    </StateBlock>

    <!-- Success -->
    <template v-else>
      <p class="count-note" role="status">Найдено: {{ total }} · страница {{ page }} из {{ pageCount }}</p>
      <div class="req-list">
        <RequestCard v-for="r in requests" :key="r.id" :request="r" />
      </div>
      <AppPagination :page="page" :page-count="pageCount" :total="total" @change="setPage" />
    </template>
  </div>
</template>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-head h1 {
  margin: 0;
  font-size: 24px;
}

.head-controls {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.sort-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sort-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sort-select {
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  padding: 8px 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search-box .field {
  max-width: 460px;
}

.search-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-faint);
}

.req-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.count-note {
  margin: 0;
  font-size: 13px;
  color: var(--text-faint);
}

.skeleton-card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
