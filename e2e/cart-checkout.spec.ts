import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('Carrinho e Checkout', () => {
  test('comprar no Detalhe leva pro carrinho com o item', async ({ page }) => {
    await login(page)
    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()

    const nftName = await page.getByRole('heading', { level: 1 }).innerText()
    await page.getByRole('button', { name: 'COMPRAR' }).click()

    await expect(page).toHaveURL('/carrinho')
    await expect(page.getByText(nftName)).toBeVisible()
  })

  test('alterar quantidade atualiza o total da linha', async ({ page }) => {
    await login(page)
    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()

    const cartRow = page.locator('li').filter({ has: page.getByRole('button', { name: 'Aumentar quantidade' }) })
    await cartRow.getByRole('button', { name: 'Aumentar quantidade' }).click()

    await expect(cartRow.getByText('2', { exact: true })).toBeVisible()
  })

  test('remover item deixa o carrinho vazio', async ({ page }) => {
    await login(page)
    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()

    await page.getByRole('button', { name: /Remover .* do carrinho/ }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('ir pro pagamento com carrinho vazio volta pro carrinho', async ({ page }) => {
    await login(page)
    await page.goto('/pagamento')
    await expect(page).toHaveURL('/carrinho')
  })

  test('pagamento sem login redireciona pro login', async ({ page }) => {
    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/login/)
  })

  test('fluxo completo: carteira -> carrinho -> pagamento -> confirmação', async ({ page }) => {
    await login(page)

    await page.goto('/carteiras')
    await page.getByLabel('Nome de exibição').fill('Ana Collector')
    await page.getByLabel('Apelido da carteira').fill('Carteira principal')
    await page.getByLabel('Rede').selectOption('ethereum')
    await page.getByLabel('Nome do perfil').fill('Ana')
    await page.getByLabel('Endereço da carteira').fill('0x1234567890123456789012345678901234567890')
    await page.getByLabel('Tipo de carteira').selectOption('metamask')
    await page.getByLabel('Código de indicação').fill('AMIGO123')
    await page.getByLabel('E-mail').fill('ana@kurio.test')
    await page.getByLabel('Nome ENS').fill('ana')

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/wallets/primary') && res.status() === 200),
      page.getByRole('button', { name: 'Salvar carteira' }).click(),
    ])

    await page.reload()
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
      '0x1234567890123456789012345678901234567890',
    )

    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await expect(page).toHaveURL('/carrinho')

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL('/pagamento')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/confirmacao\//)
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible()

    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('clique duplo em Confirmar compra gera apenas um pedido', async ({ page }) => {
    await login(page)
    await page.goto('/carteiras')
    await page.getByLabel('Nome de exibição').fill('Ana Collector')
    await page.getByLabel('Apelido da carteira').fill('Carteira principal')
    await page.getByLabel('Rede').selectOption('ethereum')
    await page.getByLabel('Nome do perfil').fill('Ana')
    await page.getByLabel('Endereço da carteira').fill('0x1234567890123456789012345678901234567890')
    await page.getByLabel('Tipo de carteira').selectOption('metamask')
    await page.getByLabel('Código de indicação').fill('AMIGO123')
    await page.getByLabel('E-mail').fill('ana@kurio.test')
    await page.getByLabel('Nome ENS').fill('ana')
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/wallets/primary') && res.status() === 200),
      page.getByRole('button', { name: 'Salvar carteira' }).click(),
    ])

    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL('/pagamento')

    // Cenário "slow" mantém a primeira requisição pendente por 2,5s, garantindo
    // uma janela estável para disparar o segundo clique antes da navegação.
    // Seletor por atributo (e não por nome acessível) porque o texto do botão
    // muda para "Confirmando..." assim que o primeiro clique dispara o isPending.
    await page.evaluate(() => localStorage.setItem('nft-marketplace:scenario', 'slow'))
    const confirmButton = page.locator('form button[type="submit"]')
    await confirmButton.dispatchEvent('click')
    await confirmButton.dispatchEvent('click')

    await expect(page).toHaveURL(/\/confirmacao\//, { timeout: 15_000 })

    const totalOrders = await page.evaluate(() => {
      const raw = localStorage.getItem('nft-marketplace:mock-db:v6')
      if (!raw) return 0
      const db = JSON.parse(raw) as { ordersByUser: Record<string, unknown[]> }
      return Object.values(db.ordersByUser).reduce((sum, orders) => sum + orders.length, 0)
    })
    expect(totalOrders).toBe(1)
  })

  test('reenvio após timeout recupera o mesmo pedido sem duplicar', async ({ page }) => {
    await login(page)
    await page.goto('/carteiras')
    await page.getByLabel('Nome de exibição').fill('Ana Collector')
    await page.getByLabel('Apelido da carteira').fill('Carteira principal')
    await page.getByLabel('Rede').selectOption('ethereum')
    await page.getByLabel('Nome do perfil').fill('Ana')
    await page.getByLabel('Endereço da carteira').fill('0x1234567890123456789012345678901234567890')
    await page.getByLabel('Tipo de carteira').selectOption('metamask')
    await page.getByLabel('Código de indicação').fill('AMIGO123')
    await page.getByLabel('E-mail').fill('ana@kurio.test')
    await page.getByLabel('Nome ENS').fill('ana')
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/wallets/primary') && res.status() === 200),
      page.getByRole('button', { name: 'Salvar carteira' }).click(),
    ])

    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL('/pagamento')

    // Cenário "timeout" já embutido no mock: a requisição nunca responde, e o
    // axios (timeout de 10s) desiste sozinho — reproduzindo um timeout real.
    await page.evaluate(() => localStorage.setItem('nft-marketplace:scenario', 'timeout'))
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText(/falar com o servidor/i)).toBeVisible({ timeout: 15_000 })

    // Colecionador recarrega a página após o timeout e tenta de novo.
    await page.evaluate(() => localStorage.setItem('nft-marketplace:scenario', 'default'))
    await page.reload()
    await expect(page).toHaveURL('/pagamento')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/confirmacao\//)

    const totalOrders = await page.evaluate(() => {
      const raw = localStorage.getItem('nft-marketplace:mock-db:v6')
      if (!raw) return 0
      const db = JSON.parse(raw) as { ordersByUser: Record<string, unknown[]> }
      return Object.values(db.ordersByUser).reduce((sum, orders) => sum + orders.length, 0)
    })
    expect(totalOrders).toBe(1)
  })
})
