<script setup lang="ts">
// Публичная статья базы знаний (уровень 6): /articles/<slug>.
// Контент — статический модуль app/content/articles.ts.
// Несуществующий слаг → 404: Nuxt отдаёт error-страницу с HTTP-статусом 404
// (поисковики исключают такие URL из индекса).
definePageMeta({ layout: 'public' })

import { getArticle } from '~/content/articles'

const route = useRoute()
const slug = String(route.params.slug ?? '')
const article = getArticle(slug)

if (!article) {
  throw createError({
    statusCode: 404,
    statusMessage: `Статья не найдена: ${slug}`,
  })
}

// og:type=article для детальных страниц статей
useSeoMeta({
  title: `${article.title} — WorkFlow`,
  description: article.description,
  ogTitle: article.title,
  ogDescription: article.description,
  ogType: 'article',
  ogUrl: absoluteUrl(`/articles/${article.slug}`),
  ogSiteName: SITE_NAME,
})

useHead({
  link: [{ rel: 'canonical', href: absoluteUrl(`/articles/${article.slug}`) }],
})
</script>

<template>
  <article class="article-page">
    <nav class="crumbs" aria-label="Хлебные крошки">
      <NuxtLink to="/articles" class="crumb-link">← База знаний</NuxtLink>
    </nav>

    <header class="article-head">
      <div class="article-meta">
        <time class="mono" :datetime="article.date">{{ article.date }}</time>
        <span v-for="t in article.tags" :key="t" class="tag">{{ t }}</span>
      </div>
      <h1>{{ article.title }}</h1>
      <p class="lead">{{ article.description }}</p>
    </header>

    <div class="body">
      <p v-for="(p, i) in article.body" :key="i">{{ p }}</p>
    </div>

    <footer class="article-foot">
      <NuxtLink to="/help" class="btn btn-ghost btn-sm">← Help center</NuxtLink>
      <NuxtLink to="/faq" class="btn btn-ghost btn-sm">FAQ</NuxtLink>
    </footer>
  </article>
</template>

<style scoped>
.article-page {
  flex: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.crumbs {
  font-size: 13.5px;
}

.crumb-link {
  color: var(--text-secondary);
  text-decoration: none;
}

.crumb-link:hover {
  color: var(--accent);
}

.article-head h1 {
  margin: 10px 0 10px;
  font-size: clamp(24px, 4vw, 32px);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
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

.lead {
  margin: 0;
  font-size: 16px;
  color: var(--text-secondary);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.body p {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--text);
}

.article-foot {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
