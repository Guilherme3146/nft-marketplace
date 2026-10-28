# Arquitetura

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
| `GET /api/profile` | Dados de perfil do usuário logado. | `401 UNAUTHENTICATED` |
| `PATCH /api/profile` | Body `{ name, username, email, ensName, walletNickname }`. Atualiza o perfil. | `401 UNAUTHENTICATED` |
| `PATCH /api/profile/password` | Body `{ currentPassword, newPassword }`. | `400 VALIDATION_ERROR` (senha atual errada ou nova senha curta) |
| `GET /api/wallets/primary` | Carteira principal do usuário logado, ou `null` se ainda não cadastrou. | `401 UNAUTHENTICATED` |
| `PUT /api/wallets/primary` | Cria ou substitui a carteira principal. | `400 VALIDATION_ERROR` (endereço fora do formato `0x...`) |
| `GET /api/wallets/secondary` | Carteira secundária do usuário logado, ou `null`. | `401 UNAUTHENTICATED` |
| `PUT /api/wallets/secondary` | Cria ou substitui a carteira secundária (independente da principal). | `400 VALIDATION_ERROR` |
| `DELETE /api/wallets/secondary` | Remove a carteira secundária. | — |
| `POST /api/wallets/connect` | Simula o "popup" de conexão de uma carteira (~900 ms). | `403 WALLET_CONNECTION_REJECTED` sob o cenário `wallet-rejected` |
| `GET /api/cotacao` | Recalcula no servidor: subtotal do carrinho atual, desconto do cupom aplicado (se houver), taxa de rede e total. | — |
| `PUT /api/cart/coupon` | Body `{ code }`. Valida o código (existe? expirado? atinge o subtotal mínimo?) e, se válido, aplica — a partir daí ele entra no cálculo de `/api/cotacao` e de `/api/orders`. | `400 INVALID_COUPON` |
| `DELETE /api/cart/coupon` | Remove o cupom aplicado. | — |
| `POST /api/orders` | Body `{ idempotencyKey, walletType, note? }`. Cria o pedido como **`pending`** a partir do carrinho atual, usando o total/desconto de `/api/cotacao` (nunca confia no que o cliente mandaria). Reenvio com a mesma `idempotencyKey` e os mesmos dados devolve o pedido já criado; com dados diferentes, `409 IDEMPOTENCY_CONFLICT`. | `400 EMPTY_CART`, `400 VALIDATION_ERROR`, `409 IDEMPOTENCY_CONFLICT` |
| `GET /api/orders/:id` | Detalhe de um pedido do usuário logado. Resolve o status (`pending` → `confirmed`/`declined`) se o tempo de confirmação simulado já passou. | `404 NOT_FOUND` |

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
- **Sem otimismo + idempotência** (requisito do desafio): `useCreateOrder` (`src/features/orders/queries.ts`) é uma mutation comum, sem `onMutate` — a tela só avança pra confirmação depois que o servidor responde de verdade que o pedido existe (dinheiro/propriedade não se "chuta antes"). A chave de idempotência (`src/features/orders/idempotency.ts`) é gerada uma vez (`crypto.randomUUID()`) e vira o próprio `id` do pedido no servidor, mas **persiste em `sessionStorage`** (não só em `useState`) — assim ela sobrevive a um reload no meio de um timeout, não só a um duplo clique na mesma renderização. Reenviar a mesma chave com os mesmos dados devolve o pedido já criado; reenviar com dados diferentes (ex.: carteira trocada) é tratado como uma tentativa genuinamente nova e retorna `409`, forçando o cliente a gerar uma chave nova em vez de confundir dois pedidos. Veja a seção 5.3 para o que acontece com o pedido depois de criado.
- **Eventos de tempo real** (`useRealtimeNftUpdates`, `src/features/nfts/realtime.ts`): em vez de invalidar e refazer a consulta, o evento (`nft.updated`) é aplicado direto no cache via `queryClient.setQueriesData({ queryKey: nftKeys.all }, ...)` — mais barato que um refetch, e funciona tanto nas listas quanto no detalhe porque os dois ficam sob o mesmo prefixo de chave. Cada item só é sobrescrito se `evento.version > item.version`; eventos atrasados (fora de ordem) são descartados silenciosamente.

## 4. Sessão

"Sessão" aqui é propositalmente simplificada, sem JWT de verdade: `POST /auth/login`/`register` gera um token aleatório (`crypto.randomUUID()`) e anota num mapa em memória `sessions: Record<token, userId>` (`src/mocks/db.ts`). O token fica guardado no navegador em `localStorage` (`src/features/auth/token.ts`, chave separada do "banco" fake de propósito — num app real o token nunca fica ao lado dos dados do servidor). Um interceptor de **requisição** do Axios (`src/lib/api.ts`) anexa `Authorization: Bearer <token>` em toda chamada, automaticamente — nenhuma tela ou hook precisa saber que token existe. `useSession()` só tenta buscar `/auth/me` quando já existe um token salvo (`enabled: !!getToken()`), evitando uma chamada inútil pra quem nunca logou.

Dois usuários de demonstração (`src/mocks/fixtures/users.ts`): `ana@kurio.test` / `bruno@kurio.test`, senha `mock1234` para os dois (senha em texto puro — aceitável só porque é um mock de estudo).

**Proteção de rotas**: `/perfil` e `/carteiras` usam `beforeLoad` (`requireSession`, `src/features/auth/require-session.ts`) pra garantir que existe sessão válida antes da rota carregar — sem token, `redirect({ to: '/login' })` entra em ação antes do componente sequer montar, igual ao `notFound()` já usado no Detalhe do NFT, só que pra autenticação em vez de "recurso não existe".

## 5. Carrinho

Guardado no mesmo "banco" fake (`src/mocks/db.ts`, campo `cartByUser`, uma lista por usuário), como uma lista magra de `{ nftId, editionId, qty }` — o handler (`src/mocks/handlers/cart.ts`) junta isso com os dados reais do NFT/edição a cada resposta, parecido com um JOIN de banco de dados de verdade.

## 5.1 Perfil e carteiras

Perfil (`src/features/profile`) e carteiras (`src/features/wallets`) seguem o mesmo molde das demais features. A novidade aqui é que o formulário **edita** um dado existente em vez de criar algo do zero: a rota (`loader` + `ensureQueryData`) garante que o dado já está no cache antes do componente montar, e o componente usa `useSuspenseQuery` + passa o resultado direto como `defaultValues` do `useForm` — sem `useEffect` pra "carregar depois". O formulário de senha é opcional dentro do mesmo "Salvar": só dispara `PATCH /profile/password` se os três campos de senha vierem preenchidos (validado com um `.refine()` do Zod que compara campos entre si).

**Avatar**: upload lido inteiramente no cliente via `FileReader.readAsDataURL` (sem backend de arquivo — é mock), validado como imagem e limitado a 300 KB antes de virar uma data URL enviada em `PATCH /profile`. `useUpdateAvatar` é uma mutation separada de `useUpdateProfile` porque dispara no `onChange` do input de arquivo, não no submit do formulário.

**Carteira secundária**: endpoint e registro próprios (`/api/wallets/secondary`, `secondaryWalletsByUser` em `db.ts`), independentes da carteira principal — não é um campo dela. `SecondaryWalletSection` (`src/features/wallets/components`) alterna entre "resumo" e "formulário" com um `useState` local, reaproveitando `AccountFormField` e os mesmos enums (`WALLET_NETWORKS`/`WALLET_TYPES`) da carteira principal.

## 5.2 Pagamento e Confirmação de pedido

O Figma repete o formulário inteiro de carteira (`Nome de exibição`, `Rede`, `Endereço`...) dentro do checkout — exatamente os mesmos campos já preenchidos em `/carteiras`. Em vez de duplicar esse formulário, o checkout (`/pagamento`) **reaproveita** o perfil e a carteira principal já salvos (mostrados como resumo, não como formulário de novo) — é o que um checkout de verdade faz (usa o método de pagamento já cadastrado). Sem carteira cadastrada, o botão "Confirmar compra" fica desabilitado e a tela convida a cadastrar uma em `/carteiras`.

`/pagamento` também redireciona pra `/carrinho` se o carrinho estiver vazio (checado no `loader`, antes da tela montar). O pedido criado (`POST /orders`) leva para `/confirmacao/$orderId`, que segue o mesmo molde de `nfts.$id.tsx`: `loader` + `ensureQueryData` + `notFound()` se o pedido não existir ou não for do usuário logado.

**Conexão de carteira (simulada)**: "Conectar e finalizar" no carrinho não navega direto pra `/pagamento` — abre `WalletConnectModal`, que chama `POST /api/wallets/connect` (um "popup" simulado de ~900 ms) e só segue adiante se a conexão for aceita; sob o cenário `wallet-rejected`, o endpoint responde `403` e o modal oferece tentar de novo ou cancelar. O estado "conectado" fica em `sessionStorage` (`src/features/wallets/connection.ts`), então a pessoa não precisa reconectar a cada navegação na mesma aba — mas pode se "desconectar" explicitamente em `/pagamento` (botão "Desconectar carteira"), o que bloqueia o formulário até reconectar. Esse endpoint não guarda nenhum estado no "banco" (não é um recurso REST no sentido de CRUD); ele existe só pra manter a simulação de conexão na mesma camada de rede que todo o resto (nunca checar cenário de rede dentro de um componente — ver seção 1), e pra ser testável via Playwright exatamente como qualquer outro cenário.

## 5.3 Cupom e Cotação

`computeQuote(userId, couponCodeOverride?)` (`src/mocks/handlers/quote.ts`) é a única função que calcula subtotal, desconto, taxa e total — usada por `GET /api/cotacao`, por `PUT /api/cart/coupon` (pra validar o código antes de aplicar) e por `POST /api/orders` (pra nunca confiar no total que o cliente mostrou). Cupons são fixtures determinísticas (`src/mocks/fixtures/coupons.ts`): percentual, valor fixo, com piso de subtotal e um código sempre expirado — cobrem os casos "inválido", "expirado" e "válido" pedidos no desafio sem depender de nenhuma lógica de data real.

O cupom aplicado fica em `couponByUser` (não no carrinho) e sobrevive a refresh; `/carrinho` e `/pagamento` consomem a mesma `quoteQueryOptions()` em vez de recalcular localmente, então os dois nunca podem mostrar números diferentes.

**Revalidação antes de confirmar**: o `onSubmit` de `/pagamento` busca uma cotação fresca (`queryClient.fetchQuery` com `staleTime: 0`) e só chama `POST /orders` se ela bater com o que já estava na tela — se algo mudou (estoque/preço via tempo real, cupom expirou), atualiza o resumo e exige um segundo clique em vez de completar a compra com números que o usuário não viu. Esse fetch extra usa a mesma política de retry do resto do app (ver seção 3), então uma falha de rede nessa etapa também aparece como erro em vez de travar a tela em "Verificando valores..." para sempre — um bug real que apareceu e foi corrigido durante este módulo.

## 5.4 Pedido pendente, confirmado e recusado

`POST /orders` cria o pedido com `status: "pending"` e resolve o resultado (`confirmed` ou `declined`) **de forma preguiçosa, por tempo decorrido** (`resolveIfDue`, `src/mocks/handlers/orders.ts`), não só por um `setTimeout`. Um `setTimeout` de ~1,5 s dispara a resolução enquanto a aba continua aberta, mas se o usuário recarregar a página antes disso, a mesma função roda de novo no próximo `GET /orders/:id` e chega ao mesmo resultado — porque a decisão depende de `Date.now()` e do cenário de rede ativo, não de um timer que só existe na memória daquela aba. Isso é o que torna a recuperação após refresh/reconexão possível sem precisar de um backend de verdade por trás.

O carrinho (e o cupom aplicado) só são limpos **quando o pedido é confirmado** — não na criação. Numa recusa, os itens continuam no carrinho pro usuário tentar de novo; isso só foi corrigido depois de notar que a versão anterior limpava o carrinho otimisticamente na criação do pedido, o que apagaria os itens mesmo numa recusa.

Resolução "recusada" é determinística (não por sorteio): só acontece com o cenário de rede `payment-declined` ativo. Isso evita que os testes E2E fiquem flaky por causa de uma moeda sendo jogada a cada execução — o caminho de recusa é 100% reproduzível sob demanda.

## 6. Tempo real e reconciliação REST × Socket.IO

A API simulada não tem só REST: `src/mocks/handlers/realtime.ts` registra um canal WebSocket (`ws.link('*')` do MSW) que, a cada conexão, começa a emitir eventos `nft.updated` sozinho a cada ~4s — escolhe um NFT aleatório, soma uma curtida e (30% das vezes) reduz o estoque de uma edição, igual "alguém comprando em outra aba agora mesmo". `@mswjs/socket.io-binding` (`toSocketIo`) é quem traduz isso pro "idioma" do protocolo Socket.IO (framing de pacotes), então o código do handler só lida com `io.client.emit(...)` normal. O mesmo módulo mantém um `Set` das conexões ativas e expõe `broadcastOrderUpdate()`, usado por `src/mocks/handlers/orders.ts` pra emitir `order.updated` quando um pedido sai de `pending` (ver seção 5.4).

No navegador, `src/lib/socket.ts` é o único socket da aplicação (mesma ideia do `api.ts` único pro Axios), forçado a usar WebSocket puro (`transports: ['websocket']`) — é o único transporte que o MSW intercepta nesse projeto; o modo padrão do Socket.IO tentaria primeiro HTTP long-polling. `useRealtimeNftUpdates()` ouve `nft.updated` uma única vez (chamado em `__root.tsx`, vale pro app inteiro); `useRealtimeOrderStatus(orderId)` (`src/features/orders/realtime.ts`) ouve `order.updated` só enquanto a tela de confirmação daquele pedido está montada. Os dois escrevem direto no cache do TanStack Query (ver seção 3) — nunca disparam um novo `fetch`.

**Reconciliação por versão** (NFTs): cada `NftSummary`/`Nft` tem um campo `version` que só cresce a cada mudança no servidor. Ao chegar um evento, o cliente só aplica se `evento.version > item.version` — isso evita que um evento atrasado (chegou fora de ordem, problema inerente a qualquer canal assíncrono) sobrescreva um dado mais novo que o cliente já tem. Sem isso, dois eventos chegando fora de ordem fariam a tela "voltar no tempo" aleatoriamente.

**Reconciliação por tempo** (pedidos): como o status de um pedido só anda numa direção (`pending` → `confirmed`/`declined`, nunca volta), não precisa de número de versão — a tela de confirmação também faz `refetchInterval` via REST enquanto o status é `pending` (`orderQueryOptions`, `src/features/orders/queries.ts`), então mesmo que o evento de socket se perca (ex.: reconexão depois de ficar offline), a próxima consulta REST corrige o estado sozinha.

**Evidência visual**: o contador de curtidas (❤) nos cards e na tela de Detalhe não existe no Figma — foi adicionado só porque sem ele não haveria nenhuma prova visual de que o tempo real está funcionando (o campo `likes` já existia no modelo de dado, mas nunca tinha sido desenhado em tela antes deste módulo).

## 7. API simulada (MSW)

- Handlers em `src/mocks/handlers`; estado em `src/mocks/db.ts` (memória + `localStorage`); reset por `?mock-reset=1` ou `window.__mock.reset()`.
- Cenários de rede configuráveis e reproduzíveis (`src/mocks/scenarios.ts`), descritos no README.
- Fixtures determinísticas: mesma semente, mesmos dados.
- Transporte do Socket.IO sobre MSW: `ws.link()` + `@mswjs/socket.io-binding` (ver seção 6).

## 7.1 Testes E2E (Playwright)

`e2e/` cobre os fluxos principais: catálogo (busca, filtro, paginação, estado vazio), Detalhe do NFT (favoritar, 404), carrinho/checkout (adicionar, alterar quantidade, remover, cupom válido/inválido/expirado, conexão/recusa/desconexão de carteira, duplo clique, reenvio após timeout, pedido pendente→confirmado, pedido recusado preservando o carrinho, fluxo completo de compra ponta a ponta), conta/sessão (cadastro, login com erro, logout, rotas protegidas, edição de perfil, avatar, carteira secundária) e cenários de rede simulados (`?scenario=slow/empty/server-error/timeout/payment-declined/wallet-rejected`). Roda contra o **build de produção** (`vite preview`), não o servidor de desenvolvimento — pega problema que só aparece com os assets finais.

**Projetos `desktop` (1440×900) e `mobile` (390×844): 64/64 passando.** A primeira rodada do `mobile` expôs que o catálogo e o header não tinham nenhum breakpoint responsivo (sidebar sobrepondo o grid, cliques bloqueados) — ver seção 8 para o que foi corrigido. Os testes de idempotência (duplo clique / reenvio após timeout) expuseram dois bugs reais que só apareciam sob condição de corrida: o nome acessível do botão de confirmar muda pra "Confirmando..." assim que o primeiro clique dispara, então um segundo clique por nome de papel (`getByRole`) deixa de encontrar o elemento — corrigido localizando por atributo (`button[type="submit"]`) nesse teste específico.

## 7.2 Auditoria Lighthouse

`npm run audit:lighthouse` (`scripts/lighthouse-audit.mjs`) builda o app, sobe o preview de produção e roda o Lighthouse **3 vezes** em cada form factor (desktop/mobile, com o throttling padrão do Lighthouse), reportando a **mediana** de cada categoria. Relatórios HTML/JSON ficam versionados em `lighthouse/reports/`; as 3 corridas brutas de cada viewport ficam em `lighthouse/tmp/` (não versionado). Resultado atual e a explicação de por que a performance mobile fica abaixo da meta estão no README (seção "Auditoria Lighthouse") — resumindo: acessibilidade/boas práticas/SEO acima da meta nos dois viewports; performance desktop 98, mobile 66 (o boot do MSW bloqueia a montagem do app inteiro, dominando o LCP sob o throttling pesado do Lighthouse mobile).

A primeira rodada encontrou dois problemas reais de acessibilidade, corrigidos: o combobox de ordenação do catálogo (Base UI `Select`) não tinha nome acessível, e os dois thumbs do slider de faixa de preço (Base UI `Slider`) não tinham label — ambos resolvidos com `aria-label` explícito (`SelectTrigger`/`thumbLabels` no `Slider`).

## 8. Decisões de UX — responsivo

Padrão adotado em todas as telas: **mobile-first**. Qualquer layout de duas colunas (sidebar de filtros, galeria+info do NFT, lista do carrinho+resumo, sidebar de conta+formulário, checkout) nasce empilhado (`flex-col`) e só vira lado a lado a partir de um breakpoint (`md:flex-row` ou `lg:flex-row`, dependendo de quanto conteúdo precisa de espaço). Larguras fixas em pixel (`w-[310px]`, `w-[500px]`...) viraram `w-full` com a largura fixa restrita ao breakpoint maior (`lg:w-[310px] lg:shrink-0`).

- **Header**: abaixo de `md` (768px), o menu (Início/Mercado/Criadores/Aprenda) some — não cabe sem quebrar, e o catálogo continua alcançável pelo logo "KURIO". O "Olá, Nome" vira só um ícone de usuário; o texto continua existindo pra leitor de tela via um `<span>` com `sr-only` só visível nesse breakpoint (técnica importante: nunca usar `aria-label` fixo num elemento cujo conteúdo visível muda por breakpoint — isso faz o nome acessível ficar errado num dos dois tamanhos).
- **Carrinho**: a linha de item usa `md:contents` — abaixo de `md` vira um cartão empilhado (duas linhas: imagem+nome, depois preço/quantidade/total/remover); a partir de `md`, o mesmo HTML "devolve" os filhos pro grid de 5 colunas do `<li>` pai, sem precisar de dois componentes diferentes.
- **Detalhe do NFT**: a galeria de miniaturas rola na horizontal abaixo de `md` em vez de empilhar na vertical ao lado da imagem principal.

Encontrado e corrigido durante este módulo (via Playwright, projeto `mobile`): o `useEffect` de debounce da busca do catálogo resetava a página pra 1 em toda montagem, mesmo sem o usuário mexer na busca — ver seção 7.1.

## 9. Limitações e desvios do Figma

- **Início**: o banner existe (estático, sem carrossel) com o botão "EXPLORAR" rolando até o catálogo (`#catalogo`). Sem as seções de blog ("Diário da Cunhagem") — conteúdo editorial, fora do escopo do README ("páginas editoriais... não fazem parte da entrega"). O footer existe em todas as telas (mesmo texto/estrutura do Figma), mas as colunas de links, os ícones sociais e o formulário de newsletter são decorativos — sem páginas de destino nem backend de e-mail no desafio.
- **Filtro "Rede"** (Ethereum/Polygon/Solana): renderizado visualmente igual ao Figma, mas sem funcionalidade — o modelo de dado e a API não têm esse campo por NFT.
- **Detalhe do NFT**: sem estrelas/avaliações de colecionadores e sem a aba "Avaliações" — não existem no modelo de dado nem são pedidos pelo README; sem ícones de compartilhamento (decorativo, sem requisito). Os chips de edição usam os nomes reais do nosso modelo (`Standard`/`Limited`/`Genesis`) em vez do texto do Figma (`1/1`/`1/10`/`1/50`), pelo mesmo motivo.
- **Favoritos**: coração removido do card do catálogo (só existe no Detalhe) — bate com a tabela de telas do README e com o próprio Figma, que só mostra o coração como estado ilustrativo pontual, não em todo card.
- **Carrinho**: sem o carrossel "Colecionadores também viram" — seção decorativa/editorial sem requisito funcional. O "Código promocional" **é funcional** (ver seção 5.3); o botão "Conectar e finalizar" continua sem simular conexão/recusa/desconexão de carteira (ver item sobre Pagamento abaixo).
- **Header global**: "Criadores" e "Aprenda" não têm tela correspondente no escopo deste desafio — ficam como texto sem link. O ícone de busca é decorativo (a busca de verdade já existe na própria página de catálogo). Usamos o ícone `LogIn` em vez do ícone de "logout" que o Figma usa no botão "Entrar" (decisão nossa — "logout" ao lado de um botão de login não faz sentido semântico). O badge do carrinho mostra a contagem real de itens (soma das quantidades), não o valor fixo "6" do Figma.
- **Login/Cadastro**: no Figma são um modal flutuando sobre a página de catálogo (com dois bugs visuais "congelados de propósito" no fundo, documentados pelo próprio arquivo Figma). Implementamos como páginas próprias (`/login`, `/cadastro`) com o mesmo cartão do modal, sem duplicar o catálogo de fundo — é só cenário decorativo no Figma, sem requisito funcional. "Esqueceu a senha?" e os botões "Continuar com Google/Facebook" são renderizados iguais ao Figma, mas não funcionais (não há backend de recuperação de senha nem OAuth social no desafio).
- **Perfil**: avatar **é funcional** (ver seção 5.1) — upload lido no cliente como data URL, sem backend de arquivo real (é mock). O campo "Nome ENS" vira só um input com sufixo fixo `.eth` em vez do select de uma opção só do Figma (mesma informação, sem uma escolha que não existe de verdade).
- **Carteiras**: carteira principal **e secundária** são funcionais (criar/editar/remover — ver seção 5.1), com registros independentes. Os campos "Tipo de carteira" (MetaMask/WalletConnect/Coinbase) e "Código de indicação" são salvos como texto simples, sem nenhuma integração real com carteiras de blockchain — o desafio não pede uma extensão de carteira de verdade, só o cadastro/edição dos dados.
- **Pagamento**: não repete o formulário de carteira (ver seção 5.2) — mostra o resumo do que já foi salvo em `/carteiras`. Conexão/recusa/desconexão de carteira **é simulada** (ver seção 5.2). "Usar outra carteira?" (pagar com uma carteira diferente da principal só nessa compra) e o footer completo da tela continuam decorativos.
- **Confirmação de pedido**: no Figma é um modal sobre a página de pagamento; implementamos como página própria (`/confirmacao/:orderId`), mesmo padrão usado em login/cadastro. O botão "Ver no Etherscan" é só visual — não existe blockchain real nem Etherscan nesse mock.
