<script setup lang="ts">
// Публичный layout: лендинг, FAQ, help center, статьи и вход.
// Лёгкий навигационный хедер между публичными страницами + вход в демо.
</script>

<template>
  <div class="public-shell">
    <a class="skip-link" href="#main-content">Перейти к содержимому</a>
    <header class="pub-top">
      <NuxtLink to="/" class="brand">Work<span>Flow</span></NuxtLink>
      <nav class="pub-nav" aria-label="Навигация">
        <NuxtLink to="/" class="pub-link" exact-active-class="active">Главная</NuxtLink>
        <NuxtLink to="/faq" class="pub-link" active-class="active">FAQ</NuxtLink>
        <NuxtLink to="/help" class="pub-link" active-class="active">Help center</NuxtLink>
        <NuxtLink to="/articles" class="pub-link" active-class="active">Статьи</NuxtLink>
        <NuxtLink to="/login" class="btn btn-primary btn-sm">Войти</NuxtLink>
      </nav>
    </header>
    <main id="main-content" tabindex="-1">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.public-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.pub-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  flex-wrap: wrap;
}

.brand {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  text-decoration: none;
}

.brand span {
  color: var(--accent);
}

.pub-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.pub-link {
  padding: 8px 12px;
  border-radius: var(--radius-m);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.pub-link:hover {
  background: var(--surface-2);
  color: var(--text);
}

.pub-link.active {
  background: var(--accent-soft);
  color: var(--accent);
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 560px) {
  .pub-top {
    padding: 10px 14px;
  }
}
</style>
