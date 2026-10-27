import { io } from 'socket.io-client'

/**
 * Único socket da aplicação — mesma ideia do cliente Axios único (api.ts),
 * só que pro canal de tempo real. Conecta na própria origem do app (sem
 * endereço = usa a URL atual) e força WebSocket puro (sem long-polling),
 * que é o transporte que o MSW consegue interceptar.
 *
 * `autoConnect: false` de propósito: este arquivo é importado bem cedo (via
 * routeTree.gen.ts → __root.tsx), antes do MSW terminar de ligar. Se o
 * socket conectasse sozinho aqui, a 1ª tentativa fugiria do MSW — o mesmo
 * problema que o comentário em main.tsx já evita pro Axios. Por isso quem
 * chama `socket.connect()` é o main.tsx, só depois do `enableMocking()`.
 */
export const socket = io({ transports: ['websocket'], autoConnect: false })
