import { nftHandlers } from './nfts'
import { favoritesHandlers } from './favorites'

/** Cada módulo novo adiciona seus handlers aqui (auth, carrinho, pedidos...). */
export const handlers = [...nftHandlers, ...favoritesHandlers]
