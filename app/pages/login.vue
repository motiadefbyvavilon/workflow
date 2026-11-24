<script setup lang="ts">
// Реальный вход (уровень 4): POST /api/auth/login, httpOnly-cookie сессия,
// ошибка 401 показывается под формой. Демо-аккаунты — в подсказке ниже.
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Вход — WorkFlow',
  description: 'Вход в демо WorkFlow: учебный трекер заявок команды с ролями, статусами и хронологией.',
  ogTitle: 'Вход — WorkFlow',
  ogDescription: 'Вход в демо WorkFlow: учебный трекер заявок команды с ролями, статусами и хронологией.',
  ogType: 'website',
  ogUrl: absoluteUrl('/login'),
  ogSiteName: SITE_NAME,
})

useHead({
  link: [{ rel: 'canonical', href: absoluteUrl('/login') }],
})

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

/** Куда возвращать после входа: если guard перенаправил с приватной страницы —
 *  обратно туда (query redirect), иначе на дашборд */
const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '/dashboard',
)

const email = ref('')
const password = ref('')
const errors = ref<{ email?: string; password?: string }>({})
const serverError = ref('')
const busy = ref(false)

/** Демо-аккаунты seed-данных (пароли совпадают с server/utils/db.ts) */
const DEMO_ACCOUNTS = [
  { label: 'Админ', email: 'admin@octagon.local', password: 'admin123' },
  { label: 'Оператор', email: 't.aliev@octagon.local', password: 'operator123' },
  { label: 'Сотрудник', email: 'i.lebedev@octagon.local', password: 'agent123' },
  { label: 'Клиент', email: 'a.smirnova@vostok.ru', password: 'client123' },
]

function fill(account: (typeof DEMO_ACCOUNTS)[number]) {
  email.value = account.email
  password.value = account.password
  serverError.value = ''
}

function validate(): boolean {
  const next: { email?: string; password?: string } = {}
  if (!email.value.trim()) next.email = 'Укажите email'
  else if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) next.email = 'Некорректный email'
  if (!password.value) next.password = 'Введите пароль'
  errors.value = next
  return Object.keys(next).length === 0
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  busy.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    router.push(redirectTarget.value)
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode
    serverError.value = statusCode === 401
      ? 'Неверный email или пароль'
      : 'Не удалось войти. Попробуйте ещё раз.'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  if (auth.me) router.push(redirectTarget.value)
})
</script>

<template>
  <div class="login-wrap">
    <form class="login card" novalidate @submit.prevent="submit">
      <h1>Вход в WorkFlow</h1>

      <div class="field">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          data-testid="login-email"
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
          data-testid="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          :aria-invalid="!!errors.password"
          aria-describedby="login-password-err"
        />
        <span v-if="errors.password" id="login-password-err" class="field-error">{{ errors.password }}</span>
      </div>

      <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

      <button class="btn btn-primary login-btn" type="submit" data-testid="login-submit" :disabled="busy">
        {{ busy ? 'Входим…' : 'Войти' }}
      </button>

      <div class="demo" aria-label="Демо-аккаунты">
        <p class="demo-title">Демо-аккаунты (нажмите, чтобы подставить):</p>
        <ul class="demo-list">
          <li v-for="a in DEMO_ACCOUNTS" :key="a.email">
            <button type="button" class="demo-btn" @click="fill(a)">
              <strong>{{ a.label }}</strong>
              <span class="mono">{{ a.email }}</span>
            </button>
          </li>
        </ul>
      </div>

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
  width: min(420px, 100%);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login h1 {
  margin: 0;
  font-size: 22px;
}

.server-error {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: var(--radius-s);
  padding: 8px 12px;
}

.login-btn {
  width: 100%;
}

.demo {
  border-top: 1px solid var(--border);
  padding-top: 14px;
}

.demo-title {
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.demo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  border-radius: var(--radius-s);
  padding: 7px 12px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.demo-btn:hover {
  border-color: var(--accent);
}

.demo-btn .mono {
  color: var(--text-faint);
  font-size: 12px;
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
