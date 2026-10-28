import path from 'node:path'
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

    await page.getByRole('button', { name: 'Sair' }).waitFor()
    await page.goto('/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste E2E')
  })

  test('login com senha errada mostra mensagem de erro e não navega', async ({ page }) => {
    await page.goto('/login')

    await page.locator('main input[type="email"]').fill('ana@kurio.test')
    await page.locator('main input[type="password"]').fill('senha-errada')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('logout volta a mostrar o link "Entrar" no header', async ({ page }) => {
    await login(page)
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
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/profile') && res.request().method() === 'PATCH'),
      page.getByRole('button', { name: 'Salvar' }).click(),
    ])

    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Atualizada')
  })

  test('trocar e remover avatar do perfil funciona de ponta a ponta', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')

    const avatarFixture = path.join(process.cwd(), 'public', 'nft-art', 'emerald-ape.jpg')
    await page.locator('input[type="file"]').setInputFiles(avatarFixture)

    await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).not.toBeVisible()
  })

  test('carteira secundária: adicionar, editar e remover', async ({ page }) => {
    await login(page)
    await page.goto('/carteiras')

    await page.getByRole('button', { name: 'Adicionar' }).click()
    const secondaryForm = page.locator('form').filter({ hasText: 'Apelido da carteira' }).last()
    await secondaryForm.getByLabel('Apelido da carteira').fill('Carteira de teste')
    await secondaryForm.getByLabel('Endereço da carteira').fill('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    await secondaryForm.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Carteira de teste')).toBeVisible()

    await page.getByRole('button', { name: 'Editar' }).click()
    const editForm = page.locator('form').filter({ hasText: 'Apelido da carteira' }).last()
    await editForm.getByLabel('Apelido da carteira').fill('Carteira renomeada')
    await editForm.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Carteira renomeada')).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
  })
})
