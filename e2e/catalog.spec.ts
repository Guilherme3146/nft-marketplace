import { expect, test } from '@playwright/test'

test.describe('Catálogo', () => {
  test('lista os NFTs servidos pela API simulada (MSW)', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'NFT Marketplace' })).toBeVisible()
    await expect(page.locator('ul[aria-busy] > li')).toHaveCount(12)
  })

  test('busca filtra a lista e atualiza a URL', async ({ page }) => {
    await page.goto('/')
    const cardCountBefore = await page.locator('ul[aria-busy] > li').count()

    await page.getByPlaceholder('Buscar por nome, coleção ou criador...').fill('zzzznada-encontravel')
    await expect(page).toHaveURL(/q=zzzznada-encontravel/)
    await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()

    await page.getByPlaceholder('Buscar por nome, coleção ou criador...').fill('')
    await expect(page.locator('ul[aria-busy] > li')).toHaveCount(cardCountBefore)
  })

  test('filtro de categoria marca a URL e volta pra página 1', async ({ page }) => {
    await page.goto('/?page=2')

    await page.getByRole('checkbox', { name: /Arte digital/ }).click()
    await expect(page.getByRole('checkbox', { name: /Arte digital/ })).toBeChecked()
    await expect(page).toHaveURL(/category=/)
    await expect(page).toHaveURL(/page=1/)
  })

  test('paginação vive na URL e sobrevive ao refresh', async ({ page }) => {
    await page.goto('/?page=2')
    await expect(page.getByRole('link', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')

    await page.reload()
    await expect(page.getByRole('link', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')

    await page.getByRole('link', { name: 'Próxima página' }).click()
    await expect(page).toHaveURL(/page=3/)
  })

  test('rota inexistente mostra a tela de "não encontrado"', async ({ page }) => {
    await page.goto('/isto-nao-existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })
})
