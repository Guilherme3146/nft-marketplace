# Arquitetura

Itens marcados com ⏳ são preenchidos conforme cada módulo é entregue.

## 1. Camadas

```
Interface (rotas/componentes)
   └─ hooks de dados (TanStack Query: queryOptions, mutations)
        └─ funções de API (Axios, tipadas)           src/features/*/api.ts
             └─ cliente Axios (erros normalizados)   src/lib/api.ts
                  └─ rede ── MSW (service worker) ── handlers + db   src/mocks
```

Regra: a interface nunca conhece Axios nem MSW. O MSW só existe na camada de rede.

## 2. Contratos REST

Todo erro segue o mesmo corpo: `{ "error": { "code": string, "message": string, "details"?: { campo: string[] } } }`.
O Axios converte isso em `ApiError` (`status`, `code`, `message`, `details`); `status === 0` significa "sem resposta" (rede/timeout).

| Método e rota | Descrição | Erros |
| --- | --- | --- |
| `GET /api/nfts` | Listagem. Query: `q`, `category` (repetível), `collection` (repetível), `minPrice`, `maxPrice`, `availableOnly`, `sort` (`recent` \| `popular` \| `price-asc` \| `price-desc`), `page`, `pageSize` (máx. 48). Resposta: `items`, `page`, `pageSize`, `total`, `totalPages`, `facets`. | 5xx simulados |
| `GET /api/nfts/:id` | Detalhe, com edições e galeria. | `404 NOT_FOUND` |
| `GET /api/favorites` | Lista de IDs favoritados. | — |
| `POST /api/favorites` | Body `{ nftId }`. Favorita. | `404 NOT_FOUND` se o NFT não existe |
| `DELETE /api/favorites/:nftId` | Remove dos favoritos. | — |
| `GET /api/cart` | Itens do carrinho, já com dados do NFT/edição "juntados" (join feito no handler). | — |
| `POST /api/cart` | Body `{ nftId, editionId, qty }`. Adiciona (ou soma `qty` se já existir a mesma edição no carrinho), limitado ao estoque da edição. | `404 NOT_FOUND`, `400 OUT_OF_STOCK` |
| `PATCH /api/cart/:nftId/:editionId` | Body `{ qty }`. Define a quantidade; `qty <= 0` remove a linha. | — |

⏳ Sessão, cotação, pedidos, perfil e carteiras.

**Limitação atual de favoritos**: ainda não existe sessão/usuário (módulo seguinte), então a lista de favoritos é global ao navegador, não por conta. Quando a sessão existir, a query key e o handler precisam isolar por `userId` — hoje isso não acontece, e é um ponto de atenção explícito para não virar exposição de dados entre usuários.

Valores em ETH trafegam como **string decimal** (`"0.25"`) e os cálculos usam `decimal.js`. Quantidades são inteiras.

## 3. Estratégia de cache, retries e sincronização

- `staleTime` 30 s; `gcTime` 5 min.
- Query keys incluem os parâmetros (`['nfts', 'list', params]`): parâmetros diferentes têm cache diferente, o que impede uma resposta antiga de sobrescrever a nova.
- `signal` do TanStack Query é repassado ao Axios: consultas que saem de uso são canceladas.
- `placeholderData: keepPreviousData` na listagem: a página anterior permanece até a próxima chegar.
- Retries: no máximo 2, **somente** para falhas transitórias (sem resposta, 408, 429, 5xx). Erros 4xx não repetem.
- Mutations não repetem sozinhas (evita compra duplicada); a idempotência cobre o reenvio manual.
- **Atualização otimista** (requisito do desafio): `useToggleFavorite` (`src/features/favorites/queries.ts`) e `useUpdateCartItemQty` (`src/features/cart/queries.ts`) mudam o cache antes da resposta chegar (`onMutate`), guardam o estado anterior, desfazem em `onError` se a chamada falhar, e sempre revalidam em `onSettled`.
- ⏳ Invalidação após mutations e eventos; isolamento por usuário (query keys com `userId` e limpeza do cache no logout).

## 4. Sessão ⏳

## 5. Carrinho

Guardado no mesmo "banco" fake (`src/mocks/db.ts`, campo `cart`), como uma lista magra de `{ nftId, editionId, qty }` — o handler (`src/mocks/handlers/cart.ts`) junta isso com os dados reais do NFT/edição a cada resposta, parecido com um JOIN de banco de dados de verdade. Mesma limitação dos favoritos: carrinho é global ao navegador até a sessão existir.

## 6. Tempo real e reconciliação REST × Socket.IO ⏳

## 7. API simulada (MSW)

- Handlers em `src/mocks/handlers`; estado em `src/mocks/db.ts` (memória + `localStorage`); reset por `?mock-reset=1` ou `window.__mock.reset()`.
- Cenários de rede configuráveis e reproduzíveis (`src/mocks/scenarios.ts`), descritos no README.
- Fixtures determinísticas: mesma semente, mesmos dados.
- ⏳ Transporte do Socket.IO sobre MSW e suas limitações.

## 8. Decisões de UX ⏳

## 9. Limitações e desvios do Figma

- **Início**: sem carrossel no banner (estático) e sem as seções de blog ("Diário da Cunhagem") e newsletter — são conteúdo editorial, fora do escopo do README ("páginas editoriais... não fazem parte da entrega").
- **Filtro "Rede"** (Ethereum/Polygon/Solana): renderizado visualmente igual ao Figma, mas sem funcionalidade — o modelo de dado e a API não têm esse campo por NFT.
- **Detalhe do NFT**: sem estrelas/avaliações de colecionadores e sem a aba "Avaliações" — não existem no modelo de dado nem são pedidos pelo README; sem ícones de compartilhamento (decorativo, sem requisito). Os chips de edição usam os nomes reais do nosso modelo (`Standard`/`Limited`/`Genesis`) em vez do texto do Figma (`1/1`/`1/10`/`1/50`), pelo mesmo motivo.
- **Favoritos**: coração removido do card do catálogo (só existe no Detalhe) — bate com a tabela de telas do README e com o próprio Figma, que só mostra o coração como estado ilustrativo pontual, não em todo card.
- **Carrinho**: sem o carrossel "Colecionadores também viram" e sem o footer completo do Figma — são seções decorativas/editoriais sem requisito funcional no README (footer global fica para o final do projeto). O input de "Código promocional" e o botão "Conectar e finalizar" são renderizados iguais ao Figma, mas não funcionais — não há backend de cupom nem de conexão de carteira/sessão neste módulo.
