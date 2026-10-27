import { nftHandlers } from './nfts'
import { favoritesHandlers } from './favorites'
import { cartHandlers } from './cart'
import { authHandlers } from './auth'
import { profileHandlers } from './profile'
import { walletsHandlers } from './wallets'
import { ordersHandlers } from './orders'

export const handlers = [
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...walletsHandlers,
  ...ordersHandlers,
]
