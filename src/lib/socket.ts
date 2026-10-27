import { io } from 'socket.io-client'

/**
 * Único socket da aplicação — mesma ideia do cliente Axios único (api.ts),
 * só que pro canal de tempo real. Conecta na própria origem do app (sem
 * endereço = usa a URL atual) e força WebSocket puro (sem long-polling),
 * que é o transporte que o MSW consegue interceptar.
 */
export const socket = io({ transports: ['websocket'] })
