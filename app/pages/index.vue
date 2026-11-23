<script setup lang="ts">
// Публичный лендинг (layout public)
definePageMeta({ layout: 'public' })

useHead({ title: 'WorkFlow — система заявок' })

const features = [
  { title: 'Единая лента заявок', text: 'Все обращения команды в одном списке: статусы, приоритеты, исполнители.' },
  { title: 'История и комментарии', text: 'Полная хронология каждой заявки и обсуждение в реальном времени.' },
  { title: 'Быстрые фильтры', text: 'Отбор по статусу и приоритету в один клик, с полной поддержкой клавиатуры.' },
]
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
        <NuxtLink to="/requests" class="btn btn-ghost">Смотреть заявки</NuxtLink>
      </div>
    </section>

    <section class="features" aria-label="Возможности">
      <article v-for="f in features" :key="f.title" class="feature card">
        <h2>{{ f.title }}</h2>
        <p>{{ f.text }}</p>
      </article>
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
  gap: 40px;
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

@media (max-width: 768px) {
  .features {
    grid-template-columns: 1fr;
  }
}
</style>
