<script setup lang="ts">
// Публичный лендинг (layout public): SSR-first, содержательный HTML
// при первом запросе — для пользователей и поисковых систем.
definePageMeta({ layout: 'public' })

import { ARTICLES } from '~/content/articles'

useSeoMeta({
  title: 'WorkFlow — простая система учёта заявок команды',
  description: SITE_DESCRIPTION,
  ogTitle: 'WorkFlow — простая система учёта заявок команды',
  ogDescription: SITE_DESCRIPTION,
  ogType: 'website',
  ogUrl: absoluteUrl('/'),
  ogSiteName: SITE_NAME,
})

useHead({
  link: [{ rel: 'canonical', href: absoluteUrl('/') }],
})

const features = [
  { title: 'Единая лента заявок', text: 'Все обращения команды в одном списке: статусы, приоритеты, исполнители.' },
  { title: 'История и комментарии', text: 'Полная хронология каждой заявки и обсуждение в реальном времени.' },
  { title: 'Быстрые фильтры', text: 'Отбор по статусу и приоритету в один клик, с полной поддержкой клавиатуры.' },
]

const steps = [
  { n: '01', title: 'Создайте заявку', text: 'Тема, описание, категория и приоритет — форма без лишних полей.' },
  { n: '02', title: 'Оператор назначает исполнителя', text: 'Новые заявки разбирает оператор и направляет нужному сотруднику.' },
  { n: '03', title: 'Статус виден всем', text: 'Каждый переход фиксируется в хронологии — автор всегда знает, что происходит.' },
]

// Свежие статьи для тизера на лендинге — статический контент, SSR отдаёт их сразу
const latestArticles = [...ARTICLES]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3)
</script>

<template>
  <div class="landing">
    <section class="hero">
      <p class="hero-eyebrow">Учебный проект · практика «Октагон»</p>
      <h1 class="hero-title">WorkFlow — простая система учёта заявок команды</h1>
      <p class="hero-sub">
        Full-stack приложение на Nuxt 4: PostgreSQL, серверная авторизация
        и роли, список заявок, детали с хронологией, фильтры и комментарии.
      </p>
      <div class="hero-actions">
        <NuxtLink to="/login" class="btn btn-primary">Войти в демо</NuxtLink>
        <NuxtLink to="/faq" class="btn btn-ghost">Частые вопросы</NuxtLink>
      </div>
      <img
        src="/images/hero-board.svg"
        alt="Схема доски заявок WorkFlow: колонки статусов и карточки задач"
        class="hero-art"
        width="880"
        height="320"
        fetchpriority="high"
        decoding="async"
      />
    </section>

    <section class="features" aria-label="Возможности">
      <article v-for="f in features" :key="f.title" class="feature card">
        <h2>{{ f.title }}</h2>
        <p>{{ f.text }}</p>
      </article>
    </section>

    <section aria-label="Как это работает">
      <h2 class="section-title">Как это работает</h2>
      <ol class="steps">
        <li v-for="s in steps" :key="s.n" class="step card">
          <span class="step-n mono" aria-hidden="true">{{ s.n }}</span>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <section aria-label="База знаний">
      <h2 class="section-title">База знаний</h2>
      <div class="articles-teaser">
        <NuxtLink
          v-for="a in latestArticles"
          :key="a.slug"
          :to="`/articles/${a.slug}`"
          class="card teaser-card"
        >
          <span class="teaser-date mono">{{ a.date }}</span>
          <h3>{{ a.title }}</h3>
          <p>{{ a.description }}</p>
        </NuxtLink>
      </div>
      <p class="section-more">
        <NuxtLink to="/articles" class="btn btn-ghost btn-sm">Все статьи →</NuxtLink>
        <NuxtLink to="/help" class="btn btn-ghost btn-sm">Help center</NuxtLink>
      </p>
    </section>

    <!-- CTA-полоса ниже сгиба: иллюстрация подгружается лениво -->
    <section class="cta-band card" aria-label="Начать работу">
      <div class="cta-text">
        <h2 class="section-title">Попробуйте демо</h2>
        <p>
          Демо-аккаунты подставляются одним нажатием, база пересоздаётся
          автоматически — можно смело менять статусы и оставлять комментарии.
        </p>
        <NuxtLink to="/login" class="btn btn-primary">Войти в демо</NuxtLink>
      </div>
      <img
        src="/images/flow-illustration.svg"
        alt=""
        class="cta-art"
        width="320"
        height="200"
        loading="lazy"
        decoding="async"
      />
    </section>
  </div>
</template>

<style scoped>
.landing {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 48px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 32px 0 8px;
}

.hero-eyebrow {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-title {
  margin: 0;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.12;
  letter-spacing: -0.02em;
  max-width: 720px;
}

.hero-sub {
  margin: 0;
  font-size: 16.5px;
  color: var(--text-secondary);
  max-width: 560px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.hero-art {
  width: min(880px, 100%);
  height: auto;
  margin-top: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius-l);
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.section-title {
  margin: 0 0 16px;
  font-size: 22px;
  letter-spacing: -0.01em;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature {
  padding: 20px 22px;
}

.feature h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.feature p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.step {
  padding: 20px 22px;
}

.step-n {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 6px;
}

.step h3 {
  margin: 0 0 8px;
  font-size: 15.5px;
}

.step p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.articles-teaser {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.teaser-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 22px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease-out, transform 0.15s ease-out;
}

.teaser-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.teaser-date {
  font-size: 12px;
  color: var(--text-faint);
}

.teaser-card h3 {
  margin: 0;
  font-size: 15.5px;
}

.teaser-card p {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-secondary);
}

.section-more {
  display: flex;
  gap: 8px;
  margin: 16px 0 0;
}

.cta-band {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 28px 30px;
}

.cta-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.cta-text p {
  margin: 0;
  font-size: 14.5px;
  color: var(--text-secondary);
  max-width: 460px;
}

.cta-art {
  width: 320px;
  height: auto;
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .cta-band {
    flex-direction: column;
    align-items: flex-start;
  }

  .cta-art {
    width: min(320px, 100%);
  }
}

@media (max-width: 768px) {
  .features,
  .steps,
  .articles-teaser {
    grid-template-columns: 1fr;
  }
}
</style>
