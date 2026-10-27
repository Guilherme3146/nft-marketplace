import type { Page } from '@playwright/test'

/** Loga com um dos dois usuários de demonstração (ver README). */
export async function login(page: Page, email = 'ana@kurio.test', password = 'mock1234') {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Esperar o header mostrar o nome é mais confiável que esperar uma URL exata:
  // a URL final leva os parâmetros padrão da busca (?page=1&sort=recent...).
  await page.getByRole('link', { name: /^Olá,/ }).waitFor()
}
