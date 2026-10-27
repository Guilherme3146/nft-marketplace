import { expect, test } from '@playwright/test'

test('a home lista os NFTs servidos pela API simulada (MSW)', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'NFT Marketplace' })).toBeVisible()
  await expect(page.getByTestId('nft-card')).toHaveCount(12)
})

test('a paginação vive na URL e sobrevive ao refresh', async ({ page }) => {
  await page.goto('/?page=2')
  await expect(page.getByText('Página 2 de 4')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Página 2 de 4')).toBeVisible()

  await page.getByRole('link', { name: 'Próxima' }).click()
  await expect(page).toHaveURL(/page=3/)
})

test('rota inexistente mostra a tela de "não encontrado"', async ({ page }) => {
  await page.goto('/isto-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})
