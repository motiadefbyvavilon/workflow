<script setup lang="ts">
// Список комментариев с формой добавления (локально, уровень 1 — mock)
import type { RequestComment } from '~/types/request'
import { formatDateTime, initials } from '~/utils/format'

const props = defineProps<{ comments: RequestComment[] }>()

const emit = defineEmits<{ add: [text: string] }>()

const draft = ref('')
const inputId = useId()

function submit() {
  const text = draft.value.trim()
  if (!text) return
  emit('add', text)
  draft.value = ''
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
          v-model="draft"
          rows="3"
          placeholder="Напишите комментарий… (Ctrl+Enter — отправить)"
          @keydown="onKeydown"
        ></textarea>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="!draft.trim()">Отправить</button>
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
