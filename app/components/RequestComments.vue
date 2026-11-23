<script setup lang="ts">
// Список комментариев с формой добавления (уровень 3 — через API)
import type { RequestComment } from '~~/shared/types'
import { formatDateTime, initials } from '~/utils/format'

const props = withDefaults(defineProps<{ comments: RequestComment[]; posting?: boolean }>(), {
  posting: false,
})

const emit = defineEmits<{ add: [text: string] }>()

const draft = ref('')
const inputId = useId()

// Регрессия (уровень 5, двойной комментарий): локальный флаг ставится
// СИНХРОННО в том же тике, что и emit. Раньше проверялся только props.posting,
// который обновляется после перерендера — двойной клик/Ctrl+Enter+клик в
// пределах одного тика проскакивал guard и отправлял два одинаковых запроса.
const sending = ref(false)

watch(
  () => props.posting,
  (posting) => {
    if (!posting) sending.value = false
  },
)

async function submit() {
  const text = draft.value.trim()
  if (!text || props.posting || sending.value) return
  sending.value = true
  emit('add', text)
  draft.value = ''
  await nextTick()
  // Если родитель не начал отправку (early return в addComment) — не блокируем
  // форму навсегда: снимаем флаг сразу. Иначе сброс — по окончании posting.
  if (!props.posting) sending.value = false
}

function onKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd+Enter — отправить из textarea
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <section class="comments" aria-label="Комментарии">
    <h3 class="comments-title">Комментарии ({{ props.comments.length }})</h3>

    <ul v-if="props.comments.length" class="comments-list">
      <li v-for="comment in props.comments" :key="comment.id" class="comment card">
        <header class="comment-head">
          <span class="avatar" aria-hidden="true">{{ initials(comment.author) }}</span>
          <span class="comment-author">{{ comment.author }}</span>
          <time :datetime="comment.at" class="mono comment-time">{{ formatDateTime(comment.at) }}</time>
        </header>
        <p class="comment-text">{{ comment.text }}</p>
      </li>
    </ul>

    <p v-else class="comments-empty">Пока нет комментариев — станьте первым.</p>

    <form class="comment-form" @submit.prevent="submit">
      <div class="field">
        <label :for="inputId">Новый комментарий</label>
        <textarea
          :id="inputId"
          data-testid="comment-input"
          v-model="draft"
          rows="3"
          placeholder="Напишите комментарий… (Ctrl+Enter — отправить)"
          :disabled="posting || sending"
          @keydown="onKeydown"
        ></textarea>
      </div>
      <button
        type="submit"
        class="btn btn-primary"
        data-testid="comment-submit"
        :disabled="!draft.trim() || posting || sending"
      >
        {{ posting || sending ? 'Отправка…' : 'Отправить' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.comments {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.comments-title {
  margin: 0;
  font-size: 15.5px;
}

.comments-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment {
  padding: 12px 14px;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.avatar {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
}

.comment-author {
  font-weight: 700;
  font-size: 13.5px;
}

.comment-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-faint);
}

.comment-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.comments-empty {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-faint);
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}
</style>
