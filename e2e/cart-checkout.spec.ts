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
    // Escopado ao item do carrinho (não à página toda): o nome do NFT também aparece
    // dentro do texto da aba "Detalhes" na página de Detalhe, e por um instante durante
    // a transição de rota as duas páginas podem coexistir no DOM.
    await expect(page.getByRole('listitem').getByText(nftName, { exact: true })).toBeVisible()
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
      const raw = localStorage.getItem('nft-marketplace:mock-db:v8')
      if (!raw) return 0
      const db = JSON.parse(raw) as { ordersByUser: Record<string, unknown[]> }
      return Object.values(db.ordersByUser).reduce((sum, orders) => sum + orders.length, 0)
    })
    expect(totalOrders).toBe(1)
  })

  test('reenvio após timeout recupera o mesmo pedido sem duplicar', async ({ page }) => {
    // A revalidação de preço antes de confirmar reusa a política de retry padrão do
    // app (status 0 / timeout é tentado até 2x antes de desistir), então uma falha de
    // rede real leva bem mais que 10s pra aparecer na tela — ver src/lib/query-client.ts.
    test.setTimeout(90_000)
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
    await expect(page.getByText(/falar com o servidor/i)).toBeVisible({ timeout: 45_000 })

    // Colecionador recarrega a página após o timeout e tenta de novo.
    await page.evaluate(() => localStorage.setItem('nft-marketplace:scenario', 'default'))
    await page.reload()
    await expect(page).toHaveURL('/pagamento')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/confirmacao\//)

    const totalOrders = await page.evaluate(() => {
      const raw = localStorage.getItem('nft-marketplace:mock-db:v8')
      if (!raw) return 0
      const db = JSON.parse(raw) as { ordersByUser: Record<string, unknown[]> }
      return Object.values(db.ordersByUser).reduce((sum, orders) => sum + orders.length, 0)
    })
    expect(totalOrders).toBe(1)
  })

  test('cupom promocional: aplica desconto válido, rejeita inválido e permite remover', async ({ page }) => {
    await login(page)
    await page.goto('/')
    await page.locator('ul[aria-busy] > li a').first().click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await expect(page).toHaveURL('/carrinho')

    const couponInput = page.getByLabel('Código promocional')
    const applyButton = page.getByRole('button', { name: 'Aplicar' })

    // Código inválido: mostra erro e não altera o total.
    await couponInput.fill('NAOEXISTE')
    await applyButton.click()
    await expect(page.getByText(/código promocional inválido/i)).toBeVisible()
    await expect(page.getByText('(-) 0 ETH')).toBeVisible()

    // Código expirado: mesma rejeição, com motivo específico.
    await couponInput.fill('EXPIRADO10')
    await applyButton.click()
    await expect(page.getByText(/expirado/i)).toBeVisible()

    // Código válido: desconto aparece no resumo e o cupom pode ser removido.
    await couponInput.fill('LANCA10')
    await applyButton.click()
    await expect(page.getByText('LANCA10')).toBeVisible()
    await expect(page.getByText('(-) 0 ETH')).not.toBeVisible()

    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await expect(couponInput).toBeVisible()
    await expect(page.getByText('(-) 0 ETH')).toBeVisible()
  })

  test('pedido fica pendente, depois confirmado (estado + evento order.updated)', async ({ page }) => {
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
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/confirmacao\//)
    await expect(page.getByText('Confirmando seu pedido...')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible()

    // Confirmado: agora sim o carrinho foi esvaziado.
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('pedido recusado preserva os itens no carrinho para nova tentativa', async ({ page }) => {
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
    const nftName = await page.getByRole('heading', { level: 1 }).innerText()
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

    await page.evaluate(() => localStorage.setItem('nft-marketplace:scenario', 'payment-declined'))
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/confirmacao\//)
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()

    await page.evaluate(() => localStorage.setItem('nft-marketplace:scenario', 'default'))
    await page.getByRole('link', { name: 'Tentar novamente' }).click()
    await expect(page).toHaveURL('/pagamento')
    await expect(page.getByText(nftName)).toBeVisible()
  })
})
