// E2E (уровень 5): полный сценарий — login (operator) → create request →
// assign agent → change status → comment → logout. Только web-first
// assertion'ы (expect(...).toBeVisible/toHaveURL) — никаких фиксированных
// таймаутов и sleep'ов. Селекторы — по data-testid.
import { expect, test } from '@playwright/test'

const OPERATOR = { email: 't.aliev@octagon.local', password: 'operator123' }

test('полный сценарий: заявка от создания до комментария', async ({ page }) => {
  // ── 1. login ────────────────────────────────────────────────────────────
  await page.goto('/login')
  await page.getByTestId('login-email').fill(OPERATOR.email)
  await page.getByTestId('login-password').fill(OPERATOR.password)
  await page.getByTestId('login-submit').click()
  await expect(page).toHaveURL(/\/dashboard/)

  // ── 2. create request ───────────────────────────────────────────────────
  await page.goto('/requests/new')
  await page.getByTestId('nr-subject').fill('E2E-заявка уровня 5')
  await page.getByTestId('nr-body').fill('Полный E2E-сценарий: создание, назначение, статус, комментарий.')
  await page.getByTestId('nr-category').selectOption({ label: 'Баг' })
  await page.getByTestId('nr-submit').click()
  await expect(page).toHaveURL(/\/requests\/WF-\d+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'E2E-заявка уровня 5' })).toBeVisible()

  // ── 3. assign agent ─────────────────────────────────────────────────────
  await page.getByTestId('assignee-select').selectOption({ label: 'Игорь Лебедев' })
  await expect(page.getByText('Изменение сохранено')).toBeVisible()

  // ── 4. change status: new → in_progress ─────────────────────────────────
  await page.getByTestId('status-select').selectOption('in_progress')
  await expect(page.getByText('Изменение сохранено')).toBeVisible()

  // ── 5. comment ──────────────────────────────────────────────────────────
  await page.getByTestId('comment-input').fill('E2E-комментарий от оператора')
  await page.getByTestId('comment-submit').click()
  await expect(page.getByText('E2E-комментарий от оператора')).toBeVisible()

  // ── 6. logout + приватный route недоступен ──────────────────────────────
  await page.goto('/profile')
  await page.getByTestId('logout-btn').click()
  await expect(page).toHaveURL(/\/login/)
  await page.goto('/requests')
  await expect(page).toHaveURL(/\/login/) // guard вернул на вход
})

test('после редиректа на /login вход возвращает на исходную страницу', async ({ page }) => {
  // аноним пытается открыть заявку — guard переносит на /login с redirect
  await page.goto('/requests/WF-101')
  await expect(page).toHaveURL(/\/login\?.*redirect=/)

  await page.getByTestId('login-email').fill(OPERATOR.email)
  await page.getByTestId('login-password').fill(OPERATOR.password)
  await page.getByTestId('login-submit').click()

  // возвращаемся туда, откуда выкинуло
  await expect(page).toHaveURL(/\/requests\/WF-101/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
