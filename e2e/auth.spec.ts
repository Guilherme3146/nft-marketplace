import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('Conta e sessão', () => {
  test('cadastro cria conta nova e loga automaticamente', async ({ page }) => {
    await page.goto('/cadastro')

    await page.locator('input[placeholder="Nome de usuário"]').fill('Teste E2E')
    await page.locator('input[placeholder="Digite seu e-mail"]').fill('novo@kurio.test')
    await page.locator('input[placeholder="Senha"]').fill('mock1234')
    await page.locator('input[placeholder="Confirmar senha"]').fill('mock1234')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByRole('link', { name: 'Olá, Teste E2E' })).toBeVisible()
  })

  test('login com senha errada mostra mensagem de erro e não navega', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input[type="email"]').fill('ana@kurio.test')
    await page.locator('input[type="password"]').fill('senha-errada')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('logout volta a mostrar o link "Entrar" no header', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('link', { name: 'Olá, Ana Collector' })).toBeVisible()

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  })

  test('/perfil sem login redireciona pro /login', async ({ page }) => {
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/carteiras sem login redireciona pro /login', async ({ page }) => {
    await page.goto('/carteiras')
    await expect(page).toHaveURL(/\/login/)
  })

  test('editar o perfil atualiza o nome mostrado no header', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')

    await page.getByLabel('Nome de exibição').fill('Ana Atualizada')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByRole('link', { name: 'Olá, Ana Atualizada' })).toBeVisible()
  })
})
