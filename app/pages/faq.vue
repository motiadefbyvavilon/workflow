<script setup lang="ts">
// Публичная страница FAQ (уровень 6): вопросы сгруппированы по темам,
// раскрытие — нативным &lt;details&gt; (доступно, без JS-аккордеона,
// работает в отрендеренном на сервере HTML).
definePageMeta({ layout: 'public' })

import { FAQ_GROUPS } from '~/content/faq'

useSeoMeta({
  title: 'FAQ — частые вопросы о WorkFlow',
  description:
    'Ответы на частые вопросы о WorkFlow: вход в демо, создание заявок, статусы, права доступа и устройство сессий.',
  ogTitle: 'FAQ — частые вопросы о WorkFlow',
  ogDescription:
    'Ответы на частые вопросы о WorkFlow: вход в демо, создание заявок, статусы, права доступа и устройство сессий.',
  ogType: 'website',
  ogUrl: absoluteUrl('/faq'),
  ogSiteName: SITE_NAME,
})

useHead({
  link: [{ rel: 'canonical', href: absoluteUrl('/faq') }],
})
</script>

<template>
  <div class="faq-page">
    <header class="page-head">
      <h1>Частые вопросы</h1>
      <p class="lead">
        Короткие ответы на типовые вопросы. Подробные инструкции — в
        <NuxtLink to="/help">help center</NuxtLink> и <NuxtLink to="/articles">статьях</NuxtLink>.
      </p>
    </header>

    <section v-for="group in FAQ_GROUPS" :key="group.title" class="faq-group" :aria-labelledby="`faq-${group.title}`">
      <h2 :id="`faq-${group.title}`" class="group-title">{{ group.title }}</h2>
      <details v-for="(item, i) in group.items" :key="i" class="faq-item card">
        <summary>{{ item.q }}</summary>
        <p>{{ item.a }}</p>
      </details>
    </section>
  </div>
</template>

<style scoped>
.faq-page {
  flex: 1;
  width: 100%;
  max-width: 820px;
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
}

.lead a {
  color: var(--accent);
}

.group-title {
  margin: 0 0 10px;
  font-size: 17px;
}

.faq-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-item {
  padding: 0;
  overflow: hidden;
}

.faq-item summary {
  cursor: pointer;
  list-style: none;
  padding: 14px 18px;
  font-weight: 600;
  font-size: 14.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: '▾';
  color: var(--text-faint);
  transition: transform 0.15s ease-out;
}

.faq-item[open] summary::after {
  transform: rotate(180deg);
}

.faq-item summary:hover {
  background: var(--surface-2);
}

.faq-item p {
  margin: 0;
  padding: 0 18px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.55;
}
</style>
