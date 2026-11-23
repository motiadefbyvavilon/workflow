<script setup lang="ts">
// Доступное модальное окно: focus trap, Esc, aria-modal, возврат фокуса
const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{ close: [] }>()

const overlayEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null)
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  if (e.key !== 'Tab') return
  const focusables = panelEl.value ? focusableIn(panelEl.value) : []
  if (focusables.length === 0) {
    e.preventDefault()
    return
  }
  const first = focusables[0] as HTMLElement
  const last = focusables[focusables.length - 1] as HTMLElement
  const active = document.activeElement as HTMLElement | null
  if (e.shiftKey && (active === first || !panelEl.value?.contains(active))) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      await nextTick()
      focusableIn(panelEl.value!)[0]?.focus()
    } else {
      previousFocus?.focus()
    }
  },
)

onBeforeUnmount(() => {
  previousFocus?.focus()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        ref="overlayEl"
        class="modal-overlay"
        role="presentation"
        @keydown="onKeydown"
        @click.self="emit('close')"
      >
        <div
          ref="panelEl"
          class="modal-panel card"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="modal-head">
            <h2>{{ title }}</h2>
            <button type="button" class="modal-close" aria-label="Закрыть диалог" @click="emit('close')">
              ✕
            </button>
          </header>
          <div class="modal-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: oklch(25% 0.03 265 / 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal-panel {
  width: min(520px, 100%);
  max-height: min(80dvh, 640px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-pop);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 0;
}

.modal-head h2 {
  margin: 0;
  font-size: 17px;
}

.modal-close {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-s);
  width: 32px;
  height: 32px;
  font-size: 14px;
  line-height: 1;
}

.modal-close:hover {
  background: var(--surface-2);
}

.modal-body {
  padding: 14px 18px 18px;
  overflow-y: auto;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 18px 16px;
}
</style>
