import { nftHandlers } from './nfts'
import { favoritesHandlers } from './favorites'
import { cartHandlers } from './cart'

/** Cada módulo novo adiciona seus handlers aqui (auth, pedidos...). */
export const handlers = [...nftHandlers, ...favoritesHandlers, ...cartHandlers]
