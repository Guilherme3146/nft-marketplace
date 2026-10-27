import type { Nft } from '@/features/nfts/types'
import { nftFixtures } from './fixtures/nfts'

/**
 * "Banco de dados" da API simulada: vive em memória e é espelhado no localStorage
 * para sobreviver a refresh. resetDb() volta SEMPRE para o mesmo estado conhecido.
 * Nos próximos módulos entram aqui: users, sessions, favorites, carts, orders, wallets.
 */
export interface CartRecord {
  nftId: string
  editionId: string
  qty: number
}

export interface MockDb {
  nfts: Nft[]
  favorites: string[]
  cart: CartRecord[]
}

const STORAGE_KEY = 'nft-marketplace:mock-db:v1'

const hasStorage = () => typeof localStorage !== 'undefined'

function seed(): MockDb {
  return { nfts: structuredClone(nftFixtures), favorites: [], cart: [] }
}

function load(): MockDb {
  if (hasStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as MockDb
    } catch {
      // Dado corrompido no localStorage: ignora e recomeça do seed.
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
    // Quota cheia ou storage bloqueado: a API simulada continua funcionando em memória.
  }
}

export function resetDb(): void {
  state = seed()
  persistDb()
}
