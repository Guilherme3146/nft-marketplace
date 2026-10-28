# NFT Marketplace

Marketplace de NFTs em React + TypeScript, com API **simulada** (MSW), tempo real simulado (Socket.IO sobre MSW) e testes E2E (Playwright). Desafio de front-end.

> Estado atual: catálogo, Detalhe do NFT, Carrinho, Conta/Sessão, Perfil/Carteiras, Pagamento/Confirmação de pedido, Tempo real, layout responsivo (mobile-first) e testes E2E (Playwright, 50/50 — desktop e mobile) prontos.

## Funcionalidades

- **Catálogo** — busca, filtros (categoria, faixa de preço), ordenação, paginação e destaque, tudo refletido na URL.
- **Detalhe do NFT** — galeria de imagens, seleção de edição, quantidade e favoritar.
- **Carrinho** — itens, alteração de quantidade, remoção e resumo de valores.
- **Conta** — cadastro, login, logout e sessão; favoritos e carrinho isolados por usuário.
- **Perfil e Carteiras** — edição de dados pessoais, troca de senha e cadastro de carteira (rotas protegidas).
- **Pagamento e Confirmação de pedido** — checkout reaproveitando a carteira já cadastrada, sem atualização otimista. Idempotente contra cliques repetidos e contra reenvio após timeout (chave de idempotência persistida em `sessionStorage`; reuso com dados diferentes retorna conflito em vez de duplicar o pedido).
- **Tempo real** — curtidas e estoque atualizando sozinhos via Socket.IO, com reconciliação por número de versão.
- **Responsivo** — layout mobile-first em todas as telas.
- **Testes E2E** — 50 testes Playwright (projetos desktop e mobile).

## Stack

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface / linguagem | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Roteamento | TanStack Router (rotas em arquivos, search params validados com Zod) |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios (único ponto de acesso à API) |
| Estilização / componentes | Tailwind CSS 4 + shadcn/ui |
| API simulada | MSW (`msw` 2.x) |
| Tempo real | Socket.IO (`socket.io-client`) sobre MSW (`@mswjs/socket.io-binding`) |
| Testes E2E | Playwright |
| Lint | oxlint |

## Requisitos

- **Node.js ≥ 20.19** (recomendado 22). Confira com `node -v`.

## Como rodar

```bash
npm install
npm run dev            # desenvolvimento, com a API simulada ligada (http://localhost:5173)
npm run typecheck      # verificação de tipos
npm run lint           # lint
npm run build          # typecheck + build de produção (dist/)
npm run preview        # serve o build em http://localhost:4173 (também com mocks)
```

Instruções de teste E2E na seção [Testes](#testes), mais abaixo.

## Variáveis de ambiente

| Variável | Valor | Efeito |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Liga a API simulada (MSW). Já vem `true` em `.env.development` e `.env.production`, então o build de demonstração também roda com mocks. |

## API simulada (MSW)

As chamadas `/api/*` são interceptadas por um *service worker* (`public/mockServiceWorker.js`) e respondidas pelos handlers em `src/mocks/handlers`. Nenhum componente, hook ou o cliente Axios contém resposta fictícia: toda a simulação está na camada de rede.

- **Estado:** `src/mocks/db.ts` (memória + `localStorage`, para sobreviver a refresh).
- **Reset para o estado conhecido:** abra `/?mock-reset=1` ou rode `window.__mock.reset()` no console.
- **Dados:** `src/mocks/fixtures` são determinísticos (sem `Math.random()`/`Date.now()`): 48 NFTs, 6 coleções, 5 categorias.

### Cenários de rede

Escolha por URL (`/?scenario=slow`), pelo console (`window.__mock.setScenario('offline')`) ou, nos testes, com `page.evaluate`. A escolha fica salva até você trocar; `default` volta ao normal.

| Cenário | O que simula |
| --- | --- |
| `default` | Resposta normal (~200 ms) |
| `empty` | Listagem sem resultados |
| `slow` | 2,5 s de latência (para ver os skeletons) |
| `variable-latency` | Latência alternada 1,8 s / 0,1 s / 0,9 s / 0,05 s (respostas fora de ordem) |
| `timeout` | A resposta nunca chega (o Axios desiste em 10 s) |
| `offline` | Falha de conexão |
| `server-error` | HTTP 500 |
| `flaky` | A 1ª tentativa de cada requisição falha com 503; a repetição funciona |

### Como reproduzir os fluxos de falha

Troque o cenário (URL `?scenario=...` ou `window.__mock.setScenario(...)`) e navegue pela tela correspondente:

| Fluxo | Cenário | O que observar |
| --- | --- | --- |
| Catálogo | `offline` ou `server-error` | Mensagem de erro no lugar da grade, sem tela em branco |
| Catálogo | `empty` | Estado "nenhum NFT encontrado" |
| Catálogo / Detalhe | `slow` | Skeletons (shimmer) antes dos cards/página carregarem |
| Favoritar | `flaky` | A 1ª tentativa falha com 503 e desfaz o estado otimista; repetir o clique funciona |
| Pagamento → Confirmar compra | `timeout` | Erro "Não foi possível falar com o servidor"; recarregando a página e confirmando de novo **recupera o mesmo pedido** em vez de duplicar (idempotência via `sessionStorage`, coberta em `e2e/cart-checkout.spec.ts`) |
| Pagamento → Confirmar compra | duplo clique (qualquer cenário) | Botão desabilita no primeiro clique; a chave de idempotência garante um único pedido mesmo se o clique duplo escapar da UI |

Para voltar ao estado normal, selecione o cenário `default` (ou recarregue após `window.__mock.setScenario('default')`).

## Credenciais fictícias

Dois usuários de demonstração (ou cadastre uma conta nova em `/cadastro`):

| E-mail | Senha |
| --- | --- |
| `ana@kurio.test` | `mock1234` |
| `bruno@kurio.test` | `mock1234` |

## Estrutura

```
src/
  routes/              rotas (um arquivo = uma rota; routeTree.gen.ts é gerado)
  features/
    nfts/              catálogo, detalhe, busca/filtros
    favorites/         favoritos
    cart/              carrinho
    auth/              cadastro, login, sessão
    profile/           dados do perfil
    wallets/           carteira principal
    orders/            pedidos e checkout
    account/           componentes compartilhados de perfil/carteiras
  lib/                 cliente Axios (api.ts), socket (socket.ts), QueryClient (query-client.ts)
  mocks/               MSW: handlers, db, fixtures, cenários de rede
e2e/                   testes Playwright
```

Cada pasta em `features/` segue o mesmo padrão: `types.ts` (formato dos dados) → `api.ts` (chamadas Axios) → `queries.ts` (hooks do TanStack Query) → `components/` (telas e peças de UI).

## Testes

```bash
npx playwright install chromium   # só na 1ª vez
npm run test:e2e                  # desktop + mobile
npm run test:e2e:ui               # modo interativo
```

50 testes cobrindo catálogo, Detalhe do NFT, carrinho/checkout completo (incluindo duplo clique e reenvio após timeout sem duplicar pedido), conta/sessão e cenários de rede simulados, rodando contra o build de produção em dois tamanhos de viewport (1440px e 390px).

## Deploy (Vercel)

Importe o repositório na Vercel (preset **Vite**, comando `npm run build`, saída `dist`). O `vercel.json` já reescreve todas as rotas para `index.html` (acesso direto e refresh funcionam) e mantém o service worker do MSW sem cache. A API simulada fica ativa no deploy via `.env.production`.
