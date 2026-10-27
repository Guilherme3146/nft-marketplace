# NFT Marketplace

Marketplace de NFTs em React + TypeScript, com API **simulada** (MSW), tempo real simulado (Socket.IO sobre MSW) e testes E2E (Playwright). Desafio de front-end.

> Estado atual: catálogo, Detalhe do NFT, Carrinho, Conta/Sessão, Perfil/Carteiras, Pagamento/Confirmação de pedido e Tempo real (curtidas/estoque atualizando sozinhos via Socket.IO, com reconciliação por versão) prontos. As seções marcadas com ⏳ são preenchidas à medida que cada módulo é entregue.

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
npx playwright install chromium   # só na 1ª vez
npm run test:e2e       # testes Playwright (faz build + preview sozinho)
```

⏳ Auditoria Lighthouse: será adicionada com o script `npm run lighthouse`.

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

## Credenciais fictícias

Dois usuários de demonstração (ou cadastre uma conta nova em `/cadastro`):

| E-mail | Senha |
| --- | --- |
| `ana@kurio.test` | `mock1234` |
| `bruno@kurio.test` | `mock1234` |

## Estrutura

```
src/
  routes/            rotas (um arquivo = uma rota; routeTree.gen.ts é gerado)
  features/nfts/     tipos, chamadas Axios e queries do TanStack Query
  lib/               cliente Axios (api.ts) e QueryClient (query-client.ts)
  mocks/             MSW: handlers, db, fixtures, cenários
e2e/                 testes Playwright
```

## Deploy (Vercel)

Importe o repositório na Vercel (preset **Vite**, comando `npm run build`, saída `dist`). O `vercel.json` já reescreve todas as rotas para `index.html` (acesso direto e refresh funcionam) e mantém o service worker do MSW sem cache. A API simulada fica ativa no deploy via `.env.production`.

## Documentação de arquitetura

Veja [ARCHITECTURE.md](./ARCHITECTURE.md): contratos, cache, sessão, carrinho, tempo real, limitações e desvios do Figma.
