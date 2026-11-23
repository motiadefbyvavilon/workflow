<script setup lang="ts">
// Создание заявки (уровень 4): форма → POST /api/requests → редирект
// на созданную заявку. Ошибки валидации Zod (400) показываем полями.
definePageMeta({ middleware: 'auth' })

useHead({ title: 'Новая заявка — WorkFlow' })

import { PRIORITY_LABELS, PRIORITY_TO_API } from '~~/shared/types'
import type { ApiRequest, RequestPriority } from '~~/shared/types'

const router = useRouter()
const { categories } = useDictionaries()
const ui = useRequestUiStore()

const subject = ref('')
const body = ref('')
const categoryId = ref(0)
const priority = ref<RequestPriority>('medium')

const errors = ref<{ subject?: string; body?: string; category?: string }>({})
const serverError = ref('')
const busy = ref(false)

function validate(): boolean {
  const next: typeof errors.value = {}
  if (subject.value.trim().length < 3) next.subject = 'Тема — минимум 3 символа'
  if (body.value.trim().length < 10) next.body = 'Описание — минимум 10 символов'
  if (!categoryId.value) next.category = 'Выберите категорию'
  errors.value = next
  return Object.keys(next).length === 0
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  busy.value = true
  try {
    const created = await $fetch<ApiRequest>('/api/requests', {
      method: 'POST',
      body: {
        subject: subject.value.trim(),
        body: body.value.trim(),
        category_id: categoryId.value,
        priority: PRIORITY_TO_API[priority.value],
      },
    })
    ui.showNotice({ kind: 'success', text: `Заявка ${created.id} создана` })
    router.push(`/requests/${created.id}`)
  } catch (err) {
    const e = err as { statusCode?: number; statusMessage?: string; data?: { issues?: { message: string }[] } }
    if (e.statusCode === 400 && e.data?.issues?.length) {
      serverError.value = e.data.issues[0].message
    } else {
      serverError.value = e.statusMessage ?? 'Не удалось создать заявку. Попробуйте ещё раз.'
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="new-request">
    <nav class="crumbs" aria-label="Хлебные крошки">
      <NuxtLink to="/requests" class="crumb-link">← К списку заявок</NuxtLink>
    </nav>

    <form class="card form" novalidate @submit.prevent="submit">
      <h1>Новая заявка</h1>

      <div class="field">
        <label for="nr-subject">Тема</label>
        <input
          id="nr-subject"
          v-model="subject"
          type="text"
          maxlength="200"
          placeholder="Коротко о проблеме или задаче"
          :aria-invalid="!!errors.subject"
        />
        <span v-if="errors.subject" class="field-error">{{ errors.subject }}</span>
      </div>

      <div class="field">
        <label for="nr-body">Описание</label>
        <textarea
          id="nr-body"
          v-model="body"
          rows="5"
          maxlength="5000"
          placeholder="Что случилось, как воспроизвести, что ожидается…"
          :aria-invalid="!!errors.body"
        ></textarea>
        <span v-if="errors.body" class="field-error">{{ errors.body }}</span>
      </div>

      <div class="form-row">
        <div class="field">
          <label for="nr-category">Категория</label>
          <select id="nr-category" v-model.number="categoryId" :aria-invalid="!!errors.category">
            <option :value="0">Выберите категорию…</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <span v-if="errors.category" class="field-error">{{ errors.category }}</span>
        </div>

        <div class="field">
          <label for="nr-priority">Приоритет</label>
          <select id="nr-priority" v-model="priority">
            <option v-for="(label, key) in PRIORITY_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
      </div>

      <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="busy">
          {{ busy ? 'Создаём…' : 'Создать заявку' }}
        </button>
        <NuxtLink to="/requests" class="btn btn-ghost">Отмена</NuxtLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.new-request {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crumbs {
  font-size: 13.5px;
}

.crumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
}

.crumb-link:hover {
  color: var(--accent);
}

.form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
}

.form h1 {
  margin: 0;
  font-size: 22px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-row .field {
  flex: 1;
  min-width: 200px;
}

.server-error {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: var(--radius-s);
  padding: 8px 12px;
}

.actions {
  display: flex;
  gap: 10px;
}
</style>
