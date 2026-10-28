import { nftHandlers } from './nfts'
import { favoritesHandlers } from './favorites'
import { cartHandlers } from './cart'
import { authHandlers } from './auth'
import { profileHandlers } from './profile'
import { walletsHandlers } from './wallets'
import { ordersHandlers } from './orders'
import { realtimeHandlers } from './realtime'
import { quoteHandlers } from './quote'

export const handlers = [
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...walletsHandlers,
  ...ordersHandlers,
  ...realtimeHandlers,
  ...quoteHandlers,
]
