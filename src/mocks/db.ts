import type { Nft } from '@/features/nfts/types'
import type { Wallet } from '@/features/wallets/types'
import type { Order } from '@/features/orders/types'
import { nftFixtures } from './fixtures/nfts'
import { userFixtures, type UserFixture } from './fixtures/users'

export interface CartRecord {
  nftId: string
  editionId: string
  qty: number
}

export interface MockDb {
  nfts: Nft[]
  favoritesByUser: Record<string, string[]>
  cartByUser: Record<string, CartRecord[]>
  users: UserFixture[]
  sessions: Record<string, string>
  walletsByUser: Record<string, Wallet | null>
  ordersByUser: Record<string, Order[]>
}

export const GUEST_USER_ID = 'guest'

const STORAGE_KEY = 'nft-marketplace:mock-db:v4'

const hasStorage = () => typeof localStorage !== 'undefined'

function seed(): MockDb {
  return {
    nfts: structuredClone(nftFixtures),
    favoritesByUser: {},
    cartByUser: {},
    users: structuredClone(userFixtures),
    sessions: {},
    walletsByUser: {},
    ordersByUser: {},
  }
}

function load(): MockDb {
  if (hasStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as MockDb
    } catch {
    }
  }
  return seed()
}

let state: MockDb = load()

export function getDb(): MockDb {
  return state
}

export function persistDb(): void {
  if (!hasStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
  }
}

export function resetDb(): void {
  state = seed()
  persistDb()
}
