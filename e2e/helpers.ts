import type { Page } from '@playwright/test'

/** Loga com um dos dois usuários de demonstração (ver README). */
export async function login(page: Page, email = 'ana@kurio.test', password = 'mock1234') {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // O botão "Sair" só aparece logado, e existe em qualquer tamanho de tela —
  // mais confiável que esperar uma URL exata ou um texto que o mobile esconde.
  await page.getByRole('button', { name: 'Sair' }).waitFor()
}
