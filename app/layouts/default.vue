<script setup lang="ts">
// Приватный layout: навигация приложения с полной клавиатурной поддержкой
const route = useRoute()

const links = [
  { to: '/dashboard', label: 'Дашборд' },
  { to: '/requests', label: 'Заявки' },
  { to: '/profile', label: 'Профиль' },
]

function isActive(to: string): boolean {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to))
}
</script>

<template>
  <div class="shell">
    <a class="skip-link" href="#main-content">Перейти к содержимому</a>

    <header class="topbar">
      <NuxtLink to="/dashboard" class="brand">Work<span>Flow</span></NuxtLink>
      <nav class="nav" aria-label="Основная навигация">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ active: isActive(link.to) }"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </header>

    <main id="main-content" class="main" tabindex="-1">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-wrap: wrap;
}

.brand {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text);
  text-decoration: none;
}

.brand span {
  color: var(--accent);
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 8px 14px;
  border-radius: var(--radius-m);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.nav-link:hover {
  background: var(--surface-2);
  color: var(--text);
}

.nav-link.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.main {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 26px 20px 56px;
}

@media (max-width: 560px) {
  .topbar {
    gap: 10px;
    padding: 10px 14px;
  }

  .nav {
    width: 100%;
    order: 2;
    overflow-x: auto;
  }
}
</style>
