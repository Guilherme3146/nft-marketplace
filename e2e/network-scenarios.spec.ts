import { expect, test } from '@playwright/test'

test.describe('Cenários de rede simulados (?scenario=)', () => {
  test('scenario=slow mostra o skeleton antes dos cards aparecerem', async ({ page }) => {
    await page.goto('/?scenario=slow')

    await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toBeVisible()
    await expect(page.locator('ul[aria-busy] > li')).toHaveCount(12)
  })

  test('scenario=empty mostra "nenhum NFT encontrado"', async ({ page }) => {
    await page.goto('/?scenario=empty')
    await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
  })

  test('scenario=server-error mostra o erro da API em vez de travar a tela', async ({ page }) => {
    await page.goto('/login?scenario=server-error')

    await page.locator('input[type="email"]').fill('ana@kurio.test')
    await page.locator('input[type="password"]').fill('mock1234')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(
      page.getByText('Erro interno simulado pelo cenário "server-error".'),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
