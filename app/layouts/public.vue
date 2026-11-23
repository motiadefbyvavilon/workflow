<script setup lang="ts">
// Публичный layout для лендинга и страницы входа — без прикладной навигации
</script>

<template>
  <div class="public-shell">
    <a class="skip-link" href="#main-content">Перейти к содержимому</a>
    <header class="pub-top">
      <NuxtLink to="/" class="brand">Work<span>Flow</span></NuxtLink>
      <nav class="pub-nav" aria-label="Навигация">
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
  padding: 14px 28px;
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

main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
