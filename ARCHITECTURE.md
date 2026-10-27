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
| `GET /api/profile` | Dados de perfil do usuário logado. | `401 UNAUTHENTICATED` |
| `PATCH /api/profile` | Body `{ name, username, email, ensName, walletNickname }`. Atualiza o perfil. | `401 UNAUTHENTICATED` |
| `PATCH /api/profile/password` | Body `{ currentPassword, newPassword }`. | `400 VALIDATION_ERROR` (senha atual errada ou nova senha curta) |
| `GET /api/wallets/primary` | Carteira principal do usuário logado, ou `null` se ainda não cadastrou. | `401 UNAUTHENTICATED` |
| `PUT /api/wallets/primary` | Cria ou substitui a carteira principal. | `400 VALIDATION_ERROR` (endereço fora do formato `0x...`) |
| `POST /api/orders` | Body `{ idempotencyKey, walletType, note? }`. Cria o pedido a partir do carrinho atual (recalcula o total no servidor, nunca confia no que o cliente mandaria) e esvazia o carrinho. Reenvio com a mesma `idempotencyKey` devolve o pedido já criado em vez de duplicar. | `400 EMPTY_CART`, `400 VALIDATION_ERROR` |
| `GET /api/orders/:id` | Detalhe de um pedido do usuário logado. | `404 NOT_FOUND` |

⏳ Cotação.

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
- **Sem otimismo + idempotência** (requisito do desafio): `useCreateOrder` (`src/features/orders/queries.ts`) é uma mutation comum, sem `onMutate` — a tela só avança pra confirmação depois que o servidor responde de verdade que o pedido existe (dinheiro/propriedade não se "chuta antes"). A chave de idempotência (`crypto.randomUUID()`, gerada uma vez quando a tela de pagamento monta) vira o próprio `id` do pedido no servidor; um reenvio da mesma tentativa (duplo clique, retry de rede) encontra o pedido já existente em vez de criar outro.
- **Eventos de tempo real** (`useRealtimeNftUpdates`, `src/features/nfts/realtime.ts`): em vez de invalidar e refazer a consulta, o evento é aplicado direto no cache via `queryClient.setQueriesData({ queryKey: nftKeys.all }, ...)` — mais barato que um refetch, e funciona tanto nas listas quanto no detalhe porque os dois ficam sob o mesmo prefixo de chave. Cada item só é sobrescrito se `evento.version > item.version`; eventos atrasados (fora de ordem) são descartados silenciosamente.

## 4. Sessão

"Sessão" aqui é propositalmente simplificada, sem JWT de verdade: `POST /auth/login`/`register` gera um token aleatório (`crypto.randomUUID()`) e anota num mapa em memória `sessions: Record<token, userId>` (`src/mocks/db.ts`). O token fica guardado no navegador em `localStorage` (`src/features/auth/token.ts`, chave separada do "banco" fake de propósito — num app real o token nunca fica ao lado dos dados do servidor). Um interceptor de **requisição** do Axios (`src/lib/api.ts`) anexa `Authorization: Bearer <token>` em toda chamada, automaticamente — nenhuma tela ou hook precisa saber que token existe. `useSession()` só tenta buscar `/auth/me` quando já existe um token salvo (`enabled: !!getToken()`), evitando uma chamada inútil pra quem nunca logou.

Dois usuários de demonstração (`src/mocks/fixtures/users.ts`): `ana@kurio.test` / `bruno@kurio.test`, senha `mock1234` para os dois (senha em texto puro — aceitável só porque é um mock de estudo).

**Proteção de rotas**: `/perfil` e `/carteiras` usam `beforeLoad` (`requireSession`, `src/features/auth/require-session.ts`) pra garantir que existe sessão válida antes da rota carregar — sem token, `redirect({ to: '/login' })` entra em ação antes do componente sequer montar, igual ao `notFound()` já usado no Detalhe do NFT, só que pra autenticação em vez de "recurso não existe".

## 5. Carrinho

Guardado no mesmo "banco" fake (`src/mocks/db.ts`, campo `cartByUser`, uma lista por usuário), como uma lista magra de `{ nftId, editionId, qty }` — o handler (`src/mocks/handlers/cart.ts`) junta isso com os dados reais do NFT/edição a cada resposta, parecido com um JOIN de banco de dados de verdade.

## 5.1 Perfil e carteiras

Perfil (`src/features/profile`) e carteira principal (`src/features/wallets`) seguem o mesmo molde das demais features. A novidade aqui é que o formulário **edita** um dado existente em vez de criar algo do zero: a rota (`loader` + `ensureQueryData`) garante que o dado já está no cache antes do componente montar, e o componente usa `useSuspenseQuery` + passa o resultado direto como `defaultValues` do `useForm` — sem `useEffect` pra "carregar depois". O formulário de senha é opcional dentro do mesmo "Salvar": só dispara `PATCH /profile/password` se os três campos de senha vierem preenchidos (validado com um `.refine()` do Zod que compara campos entre si).

## 5.2 Pagamento e Confirmação de pedido

O Figma repete o formulário inteiro de carteira (`Nome de exibição`, `Rede`, `Endereço`...) dentro do checkout — exatamente os mesmos campos já preenchidos em `/carteiras`. Em vez de duplicar esse formulário, o checkout (`/pagamento`) **reaproveita** o perfil e a carteira principal já salvos (mostrados como resumo, não como formulário de novo) — é o que um checkout de verdade faz (usa o método de pagamento já cadastrado). Sem carteira cadastrada, o botão "Confirmar compra" fica desabilitado e a tela convida a cadastrar uma em `/carteiras`.

`/pagamento` também redireciona pra `/carrinho` se o carrinho estiver vazio (checado no `loader`, antes da tela montar). O pedido criado (`POST /orders`) leva para `/confirmacao/$orderId`, que segue o mesmo molde de `nfts.$id.tsx`: `loader` + `ensureQueryData` + `notFound()` se o pedido não existir ou não for do usuário logado.

## 6. Tempo real e reconciliação REST × Socket.IO

A API simulada não tem só REST: `src/mocks/handlers/realtime.ts` registra um canal WebSocket (`ws.link('*/socket.io/*')` do MSW) que, a cada conexão, começa a emitir eventos `nft:update` sozinho a cada ~4s — escolhe um NFT aleatório, soma uma curtida e (30% das vezes) reduz o estoque de uma edição, igual "alguém comprando em outra aba agora mesmo". `@mswjs/socket.io-binding` (`toSocketIo`) é quem traduz isso pro "idioma" do protocolo Socket.IO (framing de pacotes), então o código do handler só lida com `io.client.emit(...)` normal.

No navegador, `src/lib/socket.ts` é o único socket da aplicação (mesma ideia do `api.ts` único pro Axios), forçado a usar WebSocket puro (`transports: ['websocket']`) — é o único transporte que o MSW intercepta nesse projeto; o modo padrão do Socket.IO tentaria primeiro HTTP long-polling. `useRealtimeNftUpdates()` ouve esse socket uma única vez (chamado em `__root.tsx`, vale pro app inteiro) e escreve cada evento direto no cache do TanStack Query (ver seção 3) — nunca dispara um novo `fetch`.

**Reconciliação por versão**: cada `NftSummary`/`Nft` tem um campo `version` que só cresce a cada mudança no servidor. Ao chegar um evento, o cliente só aplica se `evento.version > item.version` — isso evita que um evento atrasado (chegou fora de ordem, problema inerente a qualquer canal assíncrono) sobrescreva um dado mais novo que o cliente já tem. Sem isso, dois eventos chegando fora de ordem fariam a tela "voltar no tempo" aleatoriamente.

**Evidência visual**: o contador de curtidas (❤) nos cards e na tela de Detalhe não existe no Figma — foi adicionado só porque sem ele não haveria nenhuma prova visual de que o tempo real está funcionando (o campo `likes` já existia no modelo de dado, mas nunca tinha sido desenhado em tela antes deste módulo).

## 7. API simulada (MSW)

- Handlers em `src/mocks/handlers`; estado em `src/mocks/db.ts` (memória + `localStorage`); reset por `?mock-reset=1` ou `window.__mock.reset()`.
- Cenários de rede configuráveis e reproduzíveis (`src/mocks/scenarios.ts`), descritos no README.
- Fixtures determinísticas: mesma semente, mesmos dados.
- Transporte do Socket.IO sobre MSW: `ws.link()` + `@mswjs/socket.io-binding` (ver seção 6).

## 7.1 Testes E2E (Playwright)

`e2e/` cobre os fluxos principais: catálogo (busca, filtro, paginação, estado vazio), Detalhe do NFT (favoritar, 404), carrinho/checkout (adicionar, alterar quantidade, remover, fluxo completo de compra ponta a ponta), conta/sessão (cadastro, login com erro, logout, rotas protegidas, edição de perfil) e cenários de rede simulados (`?scenario=slow/empty/server-error`). Roda contra o **build de produção** (`vite preview`), não o servidor de desenvolvimento — pega problema que só aparece com os assets finais.

**Projetos `desktop` (1440×900) e `mobile` (390×844): 46/46 passando.** A primeira rodada do `mobile` expôs que o catálogo e o header não tinham nenhum breakpoint responsivo (sidebar sobrepondo o grid, cliques bloqueados) — ver seção 8 para o que foi corrigido.

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
- **Carrinho**: sem o carrossel "Colecionadores também viram" e sem o footer completo do Figma — são seções decorativas/editoriais sem requisito funcional no README (footer global fica para o final do projeto). O input de "Código promocional" e o botão "Conectar e finalizar" são renderizados iguais ao Figma, mas não funcionais — não há backend de cupom nem de conexão de carteira/sessão neste módulo.
- **Header global**: "Criadores" e "Aprenda" não têm tela correspondente no escopo deste desafio — ficam como texto sem link. O ícone de busca é decorativo (a busca de verdade já existe na própria página de catálogo). Usamos o ícone `LogIn` em vez do ícone de "logout" que o Figma usa no botão "Entrar" (decisão nossa — "logout" ao lado de um botão de login não faz sentido semântico). O badge do carrinho mostra a contagem real de itens (soma das quantidades), não o valor fixo "6" do Figma.
- **Login/Cadastro**: no Figma são um modal flutuando sobre a página de catálogo (com dois bugs visuais "congelados de propósito" no fundo, documentados pelo próprio arquivo Figma). Implementamos como páginas próprias (`/login`, `/cadastro`) com o mesmo cartão do modal, sem duplicar o catálogo de fundo — é só cenário decorativo no Figma, sem requisito funcional. "Esqueceu a senha?" e os botões "Continuar com Google/Facebook" são renderizados iguais ao Figma, mas não funcionais (não há backend de recuperação de senha nem OAuth social no desafio).
- **Perfil**: upload de avatar é só visual ("Alterar"/"Remover" não têm ação) — não há backend de upload de arquivo no desafio. O campo "Nome ENS" vira só um input com sufixo fixo `.eth` em vez do select de uma opção só do Figma (mesma informação, sem uma escolha que não existe de verdade).
- **Carteiras**: só a "Carteira principal" é funcional (criar/editar). A seção "Carteira secundária" é renderizada igual ao Figma (texto "Você ainda não adicionou..." + link "Adicionar"), mas sem ação — gerenciar várias carteiras por conta está fora do escopo deste desafio. Os campos "Tipo de carteira" (MetaMask/WalletConnect/Coinbase) e "Código de indicação" são salvos como texto simples, sem nenhuma integração real com carteiras de blockchain (não existe conexão de carteira de verdade no desafio).
- **Pagamento**: não repete o formulário de carteira (ver seção 5.2) — mostra o resumo do que já foi salvo em `/carteiras`. "Usar outra carteira?" (opção de pagar com uma carteira diferente da principal só nessa compra) e o footer completo da tela não são funcionais, mesmo padrão de deviation já adotado em outras telas. Sem backend de cotação em tempo real, a taxa de rede continua fixa (mesma de `/carrinho`).
- **Confirmação de pedido**: no Figma é um modal sobre a página de pagamento; implementamos como página própria (`/confirmacao/:orderId`), mesmo padrão usado em login/cadastro. O botão "Ver no Etherscan" é só visual — não existe blockchain real nem Etherscan nesse mock.
