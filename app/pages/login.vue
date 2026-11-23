<script setup lang="ts">
// Мок-авторизация (уровень 1): любые непустые логин/пароль,
// флаг сохраняется в localStorage. Данные формы валидируются локально.
definePageMeta({ layout: 'public' })

useHead({ title: 'Вход — WorkFlow' })

const router = useRouter()

const email = ref('')
const password = ref('')
const errors = ref<{ email?: string; password?: string }>({})
const busy = ref(false)

function validate(): boolean {
  const next: { email?: string; password?: string } = {}
  if (!email.value.trim()) next.email = 'Укажите email'
  else if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) next.email = 'Некорректный email'
  if (!password.value) next.password = 'Введите пароль'
  else if (password.value.length < 4) next.password = 'Минимум 4 символа'
  errors.value = next
  return Object.keys(next).length === 0
}

async function submit() {
  if (!validate()) return
  busy.value = true
  // Имитация запроса
  await new Promise((r) => setTimeout(r, 400))
  localStorage.setItem('wf-auth', JSON.stringify({ email: email.value.trim(), at: Date.now() }))
  busy.value = false
  router.push('/dashboard')
}

onMounted(() => {
  if (localStorage.getItem('wf-auth')) router.push('/dashboard')
})
</script>

<template>
  <div class="login-wrap">
    <form class="login card" novalidate @submit.prevent="submit">
      <h1>Вход в WorkFlow</h1>
      <p class="hint">Демо-режим: подойдут любые email и пароль (от 4 символов).</p>

      <div class="field">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="username"
          placeholder="you@example.com"
          :aria-invalid="!!errors.email"
          aria-describedby="login-email-err"
        />
        <span v-if="errors.email" id="login-email-err" class="field-error">{{ errors.email }}</span>
      </div>

      <div class="field">
        <label for="login-password">Пароль</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          :aria-invalid="!!errors.password"
          aria-describedby="login-password-err"
        />
        <span v-if="errors.password" id="login-password-err" class="field-error">{{ errors.password }}</span>
      </div>

      <button class="btn btn-primary login-btn" type="submit" :disabled="busy">
        {{ busy ? 'Входим…' : 'Войти' }}
      </button>

      <NuxtLink class="back" to="/">← На главную</NuxtLink>
    </form>
  </div>
</template>

<style scoped>
.login-wrap {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 40px 16px;
}

.login {
  width: min(400px, 100%);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login h1 {
  margin: 0;
  font-size: 22px;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-faint);
}

.login-btn {
  width: 100%;
}

.back {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  text-align: center;
}

.back:hover {
  color: var(--accent);
}
</style>
