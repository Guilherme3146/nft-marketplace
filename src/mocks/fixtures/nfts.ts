import Decimal from 'decimal.js'
import type { Nft, NftCategory, NftEdition } from '@/features/nfts/types'
import { recomputeDerived } from '../nft-logic'

function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ADJECTIVES = ['Neon', 'Velvet', 'Hollow', 'Amber', 'Static', 'Lunar', 'Brass', 'Paper', 'Glass', 'Quiet', 'Solar', 'Feral']
const NOUNS = ['Orchid', 'Comet', 'Harbor', 'Signal', 'Garden', 'Engine', 'Tide', 'Mirror', 'Lantern', 'Fox', 'Canyon', 'Echo']
const COLLECTIONS = ['Aurora Drift', 'Pixel Orchard', 'Hollow Moons', 'Static Bloom', 'Brass Tides', 'Paper Comets']
const CREATORS = ['Marina Costa', 'Theo Park', 'Ayumi Sato', 'Lucas Brandt', 'Nadia Rahman', 'Iris Vega', 'Caio Mendes', 'Elsa Berg']
const CATEGORIES: NftCategory[] = ['art', 'music', 'photography', 'gaming', 'collectibles']
const EDITION_TEMPLATES = [
  { id: 'standard', multiplier: '1', total: 100 },
  { id: 'limited', multiplier: '1.5', total: 25 },
  { id: 'genesis', multiplier: '3', total: 5 },
]

const ATTRIBUTE_POOL = [
  'Óculos', 'Esmeralda', 'Raro', 'Dourado', 'Holográfico', 'Brilho',
  'Edição limitada', 'Fundo gradiente', 'Textura fosca', 'Contorno duplo',
  'Metálico', 'Vibrante',
]

const ARTWORKS = [
  '/nft-art/emerald-ape.jpg',
  '/nft-art/violet-nomad.jpg',
  '/nft-art/ivory-baron.jpg',
  '/nft-art/golden-beat.jpg',
]

function pickArtwork(index: number): string {
  return ARTWORKS[index % ARTWORKS.length]
}

export const NFT_COUNT = 48

function buildNft(index: number): Nft {
  const random = createRandom(index + 1)
  const number = index + 1
  const soldOut = number % 9 === 0
  const basePrice = new Decimal((0.05 + random() * 5).toFixed(3))
  const artwork = pickArtwork(index)
  const images = [artwork]

  const editions: NftEdition[] = EDITION_TEMPLATES.slice(0, 1 + (index % 3)).map((template) => {
    const drawn = 1 + Math.floor(random() * template.total)
    const editionSoldOut = soldOut || (template.id === 'genesis' && number % 7 === 0)
    return {
      id: template.id,
      label: `1/${template.total}`,
      priceEth: basePrice.times(template.multiplier).toDecimalPlaces(3).toFixed(),
      available: editionSoldOut ? 0 : drawn,
      total: template.total,
    }
  })

  const attributes = Array.from({ length: 3 }, (_, i) => {
    const poolIndex = (index * 7 + i * 5) % ATTRIBUTE_POOL.length
    return ATTRIBUTE_POOL[poolIndex]
  })

  const name = `${ADJECTIVES[index % ADJECTIVES.length]} ${NOUNS[(index * 5 + 3) % NOUNS.length]} #${String(number).padStart(2, '0')}`
  const collection = COLLECTIONS[index % COLLECTIONS.length]
  const creatorName = CREATORS[(index * 3) % CREATORS.length]
  const category = CATEGORIES[(index * 2) % CATEGORIES.length]

  const nft: Nft = {
    id: `nft-${String(number).padStart(3, '0')}`,
    name,
    collection,
    creatorName,
    category,
    coverUrl: images[0],
    priceEth: '0',
    available: 0,
    likes: Math.floor(random() * 2000),
    version: 1,
    description: `${name} faz parte da coleção ${collection}, criada por ${creatorName}. Uma peça de ${category} em edição limitada, com autenticidade registrada na rede.`,
    images,
    editions,
    attributes,
    createdAt: new Date(Date.UTC(2026, 0, 1) + index * 36 * 3_600_000).toISOString(),
  }
  recomputeDerived(nft)
  return nft
}

export const nftFixtures: Nft[] = Array.from({ length: NFT_COUNT }, (_, index) => buildNft(index))
