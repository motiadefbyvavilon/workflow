<script setup lang="ts">
// Публичный список статей базы знаний (уровень 6): SSR-first,
// у каждой статьи — ссылка на детальную страницу /articles/<slug>.
definePageMeta({ layout: 'public' })

import { ARTICLES } from '~/content/articles'

useSeoMeta({
  title: 'Статьи — база знаний WorkFlow',
  description:
    'База знаний WorkFlow: создание заявок, жизненный цикл статусов, роли и права доступа, поиск и устройство optimistic update.',
  ogTitle: 'Статьи — база знаний WorkFlow',
  ogDescription:
    'База знаний WorkFlow: создание заявок, жизненный цикл статусов, роли и права доступа, поиск и устройство optimistic update.',
  ogType: 'website',
  ogUrl: absoluteUrl('/articles'),
  ogSiteName: SITE_NAME,
})

useHead({
  link: [{ rel: 'canonical', href: absoluteUrl('/articles') }],
})

// Свежие сверху; даты — ISO, лексикографическая сортировка корректна
const articles = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date))
</script>

<template>
  <div class="articles-page">
    <header class="page-head">
      <h1>База знаний</h1>
      <p class="lead">
        Статьи о работе с WorkFlow: от первой заявки до устройства интерфейса.
        Не нашли ответ — загляните в <NuxtLink to="/faq">FAQ</NuxtLink>.
      </p>
    </header>

    <ol class="list">
      <li v-for="a in articles" :key="a.slug" class="card article-row">
        <div class="article-meta">
          <time class="mono" :datetime="a.date">{{ a.date }}</time>
          <span v-for="t in a.tags" :key="t" class="tag">{{ t }}</span>
        </div>
        <h2>
          <NuxtLink :to="`/articles/${a.slug}`">{{ a.title }}</NuxtLink>
        </h2>
        <p>{{ a.description }}</p>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.articles-page {
  flex: 1;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 40px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-head h1 {
  margin: 0 0 8px;
  font-size: clamp(26px, 4vw, 34px);
  letter-spacing: -0.02em;
}

.lead {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15.5px;
}

.lead a {
  color: var(--accent);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-row {
  padding: 18px 22px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.article-meta time {
  font-size: 12.5px;
  color: var(--text-faint);
}

.tag {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 3px 10px;
}

.article-row h2 {
  margin: 0 0 6px;
  font-size: 17px;
}

.article-row h2 a {
  color: var(--text);
  text-decoration: none;
}

.article-row h2 a:hover {
  color: var(--accent);
}

.article-row p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
