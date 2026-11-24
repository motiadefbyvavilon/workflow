<script setup lang="ts">
// Публичный help center (уровень 6): разделы справки со ссылками
// на статьи базы знаний и страницы приложения.
definePageMeta({ layout: 'public' })

import { HELP_SECTIONS } from '~/content/help'

useSeoMeta({
  title: 'Help center — справка по WorkFlow',
  description:
    'Разделы справки WorkFlow: первые шаги, работа с заявками, доступ и безопасность, частые вопросы.',
  ogTitle: 'Help center — справка по WorkFlow',
  ogDescription:
    'Разделы справки WorkFlow: первые шаги, работа с заявками, доступ и безопасность, частые вопросы.',
  ogType: 'website',
  ogUrl: absoluteUrl('/help'),
  ogSiteName: SITE_NAME,
})

useHead({
  link: [{ rel: 'canonical', href: absoluteUrl('/help') }],
})
</script>

<template>
  <div class="help-page">
    <header class="page-head">
      <h1>Help center</h1>
      <p class="lead">
        Собрали справку по темам. Начните с раздела «Первые шаги», если только
        познакомились с WorkFlow, или откройте <NuxtLink to="/faq">FAQ</NuxtLink>.
      </p>
    </header>

    <div class="sections">
      <section v-for="s in HELP_SECTIONS" :key="s.title" class="card section-card" :aria-labelledby="`help-${s.title}`">
        <h2 :id="`help-${s.title}`">{{ s.title }}</h2>
        <p>{{ s.description }}</p>
        <ul class="section-links">
          <li v-for="link in s.links" :key="link.to + link.label">
            <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.help-page {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 28px;
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
  max-width: 620px;
}

.lead a {
  color: var(--accent);
}

.sections {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.section-card {
  padding: 20px 22px;
}

.section-card h2 {
  margin: 0 0 6px;
  font-size: 16.5px;
}

.section-card > p {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.section-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-links a {
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.section-links a:hover {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .sections {
    grid-template-columns: 1fr;
  }
}
</style>
