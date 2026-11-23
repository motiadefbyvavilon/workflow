<script setup lang="ts">
// Вертикальная лента событий заявки — семантический список для скринридеров
import type { TimelineEntry } from '~~/shared/types'
import { formatDateTime, initials } from '~/utils/format'

defineProps<{ entries: TimelineEntry[] }>()
</script>

<template>
  <ol class="timeline">
    <li v-for="entry in entries" :key="entry.id" class="timeline-item">
      <span class="dot" aria-hidden="true"></span>
      <div class="timeline-body">
        <p class="timeline-action">{{ entry.action }}</p>
        <p class="timeline-meta">
          <span class="avatar" aria-hidden="true">{{ initials(entry.actor) }}</span>
          {{ entry.actor }} ·
          <time :datetime="entry.at" class="mono">{{ formatDateTime(entry.at) }}</time>
        </p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 12px;
  position: relative;
  padding-bottom: 18px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: var(--border);
}

.timeline-item:last-child::before {
  display: none;
}

.dot {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  margin-top: 4px;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-action {
  margin: 0;
  font-weight: 600;
  font-size: 14px;
}

.timeline-meta {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-faint);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.avatar {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 9.5px;
  font-weight: 700;
}
</style>
