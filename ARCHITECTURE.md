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
| `POST /api/auth/login` | Body `{ email, password }`. Resposta `{ user, token }`. | `401 INVALID_CREDENTIALS` |
| `POST /api/auth/register` | Body `{ name, email, password }`. Resposta `{ user, token }`. | `400 VALIDATION_ERROR` (campos faltando ou e-mail já cadastrado) |
| `POST /api/auth/logout` | Invalida o token enviado em `Authorization`. | — |
| `GET /api/auth/me` | Usuário da sessão atual (a partir do token). | `401 UNAUTHENTICATED` |

⏳ Cotação, pedidos, perfil e carteiras.

**Favoritos e carrinho são isolados por usuário**: o handler lê o header `Authorization: Bearer <token>` (anexado automaticamente pelo interceptor de requisição do Axios, `src/lib/api.ts`), resolve o `userId` dono daquele token (`resolveUserId`, `src/mocks/utils.ts`) e usa isso como chave em `favoritesByUser`/`cartByUser`. Sem token válido, cai no "usuário" `guest` — por isso favoritos/carrinho continuam funcionando antes do login, só que anônimos. **Nenhuma query key do front-end precisou mudar** para isso funcionar: a isolação por usuário é inteiramente uma decisão da camada de rede (mock), confirmando a separação de camadas da seção 1.

Valores em ETH trafegam como **string decimal** (`"0.25"`) e os cálculos usam `decimal.js`. Quantidades são inteiras.

## 3. Estratégia de cache, retries e sincronização

- `staleTime` 30 s; `gcTime` 5 min.
- Query keys incluem os parâmetros (`['nfts', 'list', params]`): parâmetros diferentes têm cache diferente, o que impede uma resposta antiga de sobrescrever a nova.
- `signal` do TanStack Query é repassado ao Axios: consultas que saem de uso são canceladas.
- `placeholderData: keepPreviousData` na listagem: a página anterior permanece até a próxima chegar.
- Retries: no máximo 2, **somente** para falhas transitórias (sem resposta, 408, 429, 5xx). Erros 4xx não repetem.
- Mutations não repetem sozinhas (evita compra duplicada); a idempotência cobre o reenvio manual.
- **Atualização otimista** (requisito do desafio): `useToggleFavorite` (`src/features/favorites/queries.ts`) e `useUpdateCartItemQty` (`src/features/cart/queries.ts`) mudam o cache antes da resposta chegar (`onMutate`), guardam o estado anterior, desfazem em `onError` se a chamada falhar, e sempre revalidam em `onSettled`.
- **Troca de identidade** (login/logout/cadastro): `useLogin`, `useRegister` e `useLogout` (`src/features/auth/queries.ts`) chamam `queryClient.invalidateQueries()` **sem query key** — ou seja, invalidam o cache inteiro. Motivo: quando quem está logado muda, qualquer coisa que o cache guardava (favoritos, carrinho) pode pertencer à pessoa errada; jogar tudo fora é mais simples e mais seguro do que tentar invalidar seletivamente.
- ⏳ Invalidação por eventos de tempo real.

## 4. Sessão

"Sessão" aqui é propositalmente simplificada, sem JWT de verdade: `POST /auth/login`/`register` gera um token aleatório (`crypto.randomUUID()`) e anota num mapa em memória `sessions: Record<token, userId>` (`src/mocks/db.ts`). O token fica guardado no navegador em `localStorage` (`src/features/auth/token.ts`, chave separada do "banco" fake de propósito — num app real o token nunca fica ao lado dos dados do servidor). Um interceptor de **requisição** do Axios (`src/lib/api.ts`) anexa `Authorization: Bearer <token>` em toda chamada, automaticamente — nenhuma tela ou hook precisa saber que token existe. `useSession()` só tenta buscar `/auth/me` quando já existe um token salvo (`enabled: !!getToken()`), evitando uma chamada inútil pra quem nunca logou.

Dois usuários de demonstração (`src/mocks/fixtures/users.ts`): `ana@kurio.test` / `bruno@kurio.test`, senha `mock1234` para os dois (senha em texto puro — aceitável só porque é um mock de estudo).

⏳ Proteção de rotas (perfil/carteiras exigirem login) entra junto com os módulos que as usam.

## 5. Carrinho

Guardado no mesmo "banco" fake (`src/mocks/db.ts`, campo `cartByUser`, uma lista por usuário), como uma lista magra de `{ nftId, editionId, qty }` — o handler (`src/mocks/handlers/cart.ts`) junta isso com os dados reais do NFT/edição a cada resposta, parecido com um JOIN de banco de dados de verdade.

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
- **Header global**: "Criadores" e "Aprenda" não têm tela correspondente no escopo deste desafio — ficam como texto sem link. O ícone de busca é decorativo (a busca de verdade já existe na própria página de catálogo). Usamos o ícone `LogIn` em vez do ícone de "logout" que o Figma usa no botão "Entrar" (decisão nossa — "logout" ao lado de um botão de login não faz sentido semântico). O badge do carrinho mostra a contagem real de itens (soma das quantidades), não o valor fixo "6" do Figma.
- **Login/Cadastro**: no Figma são um modal flutuando sobre a página de catálogo (com dois bugs visuais "congelados de propósito" no fundo, documentados pelo próprio arquivo Figma). Implementamos como páginas próprias (`/login`, `/cadastro`) com o mesmo cartão do modal, sem duplicar o catálogo de fundo — é só cenário decorativo no Figma, sem requisito funcional. "Esqueceu a senha?" e os botões "Continuar com Google/Facebook" são renderizados iguais ao Figma, mas não funcionais (não há backend de recuperação de senha nem OAuth social no desafio).
