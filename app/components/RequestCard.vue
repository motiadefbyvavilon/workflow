<script setup lang="ts">
// Карточка заявки в списке — семантическая ссылка, доступная с клавиатуры
import type { WorkflowRequest } from '~/types/request'
import { timeAgo } from '~/utils/format'

defineProps<{ request: WorkflowRequest }>()
</script>

<template>
  <NuxtLink class="card req-card" :to="`/requests/${request.id}`">
    <div class="req-top">
      <span class="req-id mono">{{ request.id }}</span>
      <StatusTag :status="request.status" />
      <PriorityTag :priority="request.priority" />
    </div>
    <h3 class="req-title">{{ request.title }}</h3>
    <p class="req-desc">{{ request.description }}</p>
    <div class="req-meta">
      <span>{{ request.assignee }}</span>
      <time :datetime="request.updatedAt" class="mono">{{ timeAgo(request.updatedAt) }}</time>
    </div>
  </NuxtLink>
</template>

<style scoped>
.req-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease-out, transform 0.15s ease-out;
}

.req-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.req-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.req-id {
  font-size: 12.5px;
  color: var(--text-faint);
  font-weight: 600;
}

.req-title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 700;
}

.req-desc {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.req-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-faint);
}
</style>
