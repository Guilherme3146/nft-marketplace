import type { Nft } from '@/features/nfts/types'
import type { Wallet } from '@/features/wallets/types'
import { nftFixtures } from './fixtures/nfts'
import { userFixtures, type UserFixture } from './fixtures/users'

/**
 * "Banco de dados" da API simulada: vive em memória e é espelhado no localStorage
 * para sobreviver a refresh. resetDb() volta SEMPRE para o mesmo estado conhecido.
 * Nos próximos módulos entram aqui: carts, orders, wallets.
 */
export interface CartRecord {
  nftId: string
  editionId: string
  qty: number
}

export interface MockDb {
  nfts: Nft[]
  /** Uma lista de favoritos/carrinho por usuário; "guest" é quem não está logado. */
  favoritesByUser: Record<string, string[]>
  cartByUser: Record<string, CartRecord[]>
  users: UserFixture[]
  /** token → userId. "Sessão" fake: só um mapa em memória, sem JWT de verdade. */
  sessions: Record<string, string>
  /** Uma carteira principal por usuário (ou nenhuma ainda). */
  walletsByUser: Record<string, Wallet | null>
}

export const GUEST_USER_ID = 'guest'

/** Muda sempre que o formato do MockDb muda, pra dado salvo no formato antigo ser ignorado em vez de quebrar o app. */
const STORAGE_KEY = 'nft-marketplace:mock-db:v3'

const hasStorage = () => typeof localStorage !== 'undefined'

function seed(): MockDb {
  return {
    nfts: structuredClone(nftFixtures),
    favoritesByUser: {},
    cartByUser: {},
    users: structuredClone(userFixtures),
    sessions: {},
    walletsByUser: {},
  }
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
