import type { Page } from '@playwright/test'

export async function login(page: Page, email = 'ana@kurio.test', password = 'mock1234') {
  await page.goto('/login')
  await page.locator('main input[type="email"]').fill(email)
  await page.locator('main input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('button', { name: 'Sair' }).waitFor()
}
