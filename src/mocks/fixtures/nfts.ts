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
  { id: 'standard', label: 'Standard', multiplier: '1', total: 100 },
  { id: 'limited', label: 'Limited', multiplier: '1.5', total: 25 },
  { id: 'genesis', label: 'Genesis', multiplier: '3', total: 5 },
]

function artDataUri(seed: number, variant: number): string {
  const hueA = (seed * 47 + variant * 31) % 360
  const hueB = (hueA + 70 + ((seed * 13) % 90)) % 360
  const cx = 200 + ((seed * 53 + variant * 97) % 400)
  const cy = 200 + ((seed * 29 + variant * 61) % 400)
  const radius = 120 + ((seed * 17 + variant * 23) % 180)
  const rotation = (seed * 11 + variant * 25) % 90
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hueA} 70% 55%)"/><stop offset="1" stop-color="hsl(${hueB} 70% 35%)"/>` +
    `</linearGradient></defs><rect width="800" height="800" fill="url(#g)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="hsl(${hueB} 80% 75%)" fill-opacity=".55"/>` +
    `<rect x="${800 - cx}" y="${800 - cy}" width="${radius}" height="${radius}" rx="24" fill="hsl(${hueA} 80% 85%)" ` +
    `fill-opacity=".35" transform="rotate(${rotation} 400 400)"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const NFT_COUNT = 48

function buildNft(index: number): Nft {
  const random = createRandom(index + 1)
  const number = index + 1
  const soldOut = number % 9 === 0
  const basePrice = new Decimal((0.05 + random() * 5).toFixed(3))
  const images = [0, 1, 2].map((variant) => artDataUri(number, variant))

  const editions: NftEdition[] = EDITION_TEMPLATES.slice(0, 1 + (index % 3)).map((template) => {
    const drawn = 1 + Math.floor(random() * template.total)
    const editionSoldOut = soldOut || (template.id === 'genesis' && number % 7 === 0)
    return {
      id: template.id,
      label: template.label,
      priceEth: basePrice.times(template.multiplier).toDecimalPlaces(3).toFixed(),
      available: editionSoldOut ? 0 : drawn,
      total: template.total,
    }
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
    createdAt: new Date(Date.UTC(2026, 0, 1) + index * 36 * 3_600_000).toISOString(),
  }
  recomputeDerived(nft)
  return nft
}

export const nftFixtures: Nft[] = Array.from({ length: NFT_COUNT }, (_, index) => buildNft(index))
