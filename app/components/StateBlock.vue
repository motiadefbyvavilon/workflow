<script setup lang="ts">
// Единый блок для пустых / ошибочных / не найденных состояний.
// Зона role="status" — скринридер объявит текст автоматически.
withDefaults(
  defineProps<{
    title: string
    description?: string
    tone?: 'default' | 'danger'
  }>(),
  { tone: 'default' },
)
</script>

<template>
  <div class="state card" :class="`state-${tone}`" role="status">
    <div class="state-icon" aria-hidden="true">{{ tone === 'danger' ? '⚠' : '∅' }}</div>
    <h2 class="state-title">{{ title }}</h2>
    <p v-if="description" class="state-desc">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 40px 24px;
}

.state-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-faint);
  font-size: 22px;
  margin-bottom: 4px;
}

.state-danger .state-icon {
  background: var(--danger-soft);
  color: var(--danger);
}

.state-title {
  margin: 0;
  font-size: 17px;
}

.state-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 420px;
}
</style>
