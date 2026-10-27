import { expect, test } from '@playwright/test'

test.describe('Detalhe do NFT', () => {
  test('abre a partir do card e mostra preço/edição/favoritar', async ({ page }) => {
    await page.goto('/')

    const firstCardLink = page.locator('ul[aria-busy] > li a').first()
    const nftName = await firstCardLink.locator('h3').innerText()
    await firstCardLink.click()

    await expect(page.getByRole('heading', { level: 1, name: nftName })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Edição' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Favoritar' })).toBeVisible()
  })

  test('favoritar muda o estado na hora (otimista)', async ({ page }) => {
    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()

    const favoriteButton = page.getByRole('button', { name: 'Favoritar' })
    await favoriteButton.click()

    await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('NFT inexistente mostra "não encontrado" (404 de negócio)', async ({ page }) => {
    await page.goto('/nfts/isto-nao-existe')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  })
})
