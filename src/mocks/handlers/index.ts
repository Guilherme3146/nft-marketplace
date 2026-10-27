import { nftHandlers } from './nfts'
import { favoritesHandlers } from './favorites'
import { cartHandlers } from './cart'
import { authHandlers } from './auth'

/** Cada módulo novo adiciona seus handlers aqui (pedidos, perfil, carteiras...). */
export const handlers = [...nftHandlers, ...favoritesHandlers, ...cartHandlers, ...authHandlers]
