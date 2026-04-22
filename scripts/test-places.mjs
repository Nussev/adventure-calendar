// Quick script to verify your Google Places API key is working.
// Run from the project root with: node scripts/test-places.mjs
//
// It searches for bars near Williamsburg, Brooklyn and prints the results.
// Swap the city/neighborhood/type to match wherever you actually live.

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Read GOOGLE_PLACES_API_KEY straight from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const keyLine = envLines.find(l => l.startsWith('GOOGLE_PLACES_API_KEY='))
const API_KEY = keyLine?.split('=')[1]?.trim()

if (!API_KEY) {
  console.error('❌  GOOGLE_PLACES_API_KEY not found in .env.local')
  console.error('    Paste your key in .env.local next to GOOGLE_PLACES_API_KEY=')
  process.exit(1)
}

// ── Config — change these to your actual city/neighborhood ──────────────────
const CITY         = 'New York'
const NEIGHBORHOOD = 'Williamsburg, Brooklyn'
const VENUE_TYPE   = 'bars'   // try: restaurants, coffee shops, museums
// ─────────────────────────────────────────────────────────────────────────────

const textQuery = `best ${VENUE_TYPE} in ${NEIGHBORHOOD}, ${CITY}`
console.log(`\n🔍  Searching: "${textQuery}"\n`)

const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
  method: 'POST',
  headers: {
    'Content-Type':    'application/json',
    'X-Goog-Api-Key':  API_KEY,
    'X-Goog-FieldMask': [
      'places.displayName',
      'places.formattedAddress',
      'places.rating',
      'places.userRatingCount',
      'places.priceLevel',
      'places.businessStatus',
    ].join(','),
  },
  body: JSON.stringify({ textQuery, maxResultCount: 5 }),
})

if (!res.ok) {
  const err = await res.text()
  console.error(`❌  Google Places API returned ${res.status}:`)
  console.error(err)
  process.exit(1)
}

const data = await res.json()

if (!data.places?.length) {
  console.warn('⚠️   No places returned — try a different city or venue type')
  process.exit(0)
}

const priceMap = {
  PRICE_LEVEL_FREE:           'Free',
  PRICE_LEVEL_INEXPENSIVE:    '$',
  PRICE_LEVEL_MODERATE:       '$$',
  PRICE_LEVEL_EXPENSIVE:      '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

console.log(`✅  Found ${data.places.length} venues:\n`)
data.places.forEach((p, i) => {
  const name    = p.displayName?.text ?? 'Unknown'
  const address = p.formattedAddress ?? ''
  const rating  = p.rating ? `★ ${p.rating} (${p.userRatingCount} reviews)` : 'no rating'
  const price   = priceMap[p.priceLevel] ?? ''
  const status  = p.businessStatus !== 'OPERATIONAL' ? ` [${p.businessStatus}]` : ''
  console.log(`  ${i + 1}. ${name}${status}`)
  console.log(`     ${address}`)
  console.log(`     ${rating}  ${price}\n`)
})
