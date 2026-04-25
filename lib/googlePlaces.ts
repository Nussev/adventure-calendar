// ── Google Places API (New) — server-side only ───────────────────────────────
//
// Uses the Text Search endpoint to find real venues near a location.
// Never call this from the browser — the API key must stay server-side.
//
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

export interface PlaceResult {
  name:        string
  address:     string
  rating:      number | null
  reviewCount: number | null
  priceLevel:  string | null   // "$" | "$$" | "$$$" | "$$$$" | null
  mapsUrl:     string | null
}

// Maps our profile venue_type labels to a search phrase Google understands
const VENUE_TYPE_QUERIES: Record<string, string> = {
  'Restaurants':       'best restaurants',
  'Bars':              'best bars cocktail bars',
  'Coffee shops':      'best coffee shops cafes',
  'Museums':           'museums',
  'Art galleries':     'art galleries',
  'Parks':             'parks gardens',
  'Live music venues': 'live music venues',
  'Markets':           'markets food halls',
  'Fitness studios':   'fitness studios gyms',
  'Theatres':          'theatres cinemas',
  'Bookshops':         'bookshops bookstores',
  'Hidden gems':       'local favourites hidden gems unique',
}

function formatPriceLevel(raw: string | undefined): string | null {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE:          'Free',
    PRICE_LEVEL_INEXPENSIVE:   '$',
    PRICE_LEVEL_MODERATE:      '$$',
    PRICE_LEVEL_EXPENSIVE:     '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE:'$$$$',
  }
  return raw ? (map[raw] ?? null) : null
}

/**
 * Fetch up to `maxResults` real venues from Google Places for a given type.
 *
 * @param venueType  - one of the keys in VENUE_TYPE_QUERIES
 * @param city       - e.g. "New York"
 * @param neighborhood - e.g. "Williamsburg, Brooklyn" (optional)
 * @param maxResults - how many results to return (max 20 per Google)
 */
export async function searchVenuesByType(
  venueType: string,
  city: string,
  neighborhood: string,
  maxResults = 5
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set — skipping Google Places lookup')
    return []
  }

  const queryPhrase = VENUE_TYPE_QUERIES[venueType] ?? venueType.toLowerCase()
  const location    = [neighborhood, city].filter(Boolean).join(', ')
  const textQuery   = `${queryPhrase} in ${location}`

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'X-Goog-Api-Key':  apiKey,
          // Only request the fields we actually use — keeps billing low
          'X-Goog-FieldMask': [
            'places.displayName',
            'places.formattedAddress',
            'places.rating',
            'places.userRatingCount',
            'places.priceLevel',
            'places.googleMapsUri',
            'places.businessStatus',
          ].join(','),
        },
        body: JSON.stringify({
          textQuery,
          maxResultCount: maxResults,
          // Bias toward highly rated venues
          rankPreference: 'RELEVANCE',
        }),
      }
    )

    if (!res.ok) {
      console.error(`Google Places API error ${res.status}:`, await res.text())
      return []
    }

    const data = await res.json() as {
      places?: Array<{
        displayName?:     { text: string }
        formattedAddress?: string
        rating?:          number
        userRatingCount?: number
        priceLevel?:      string
        googleMapsUri?:   string
        businessStatus?:  string
      }>
    }

    return (data.places ?? [])
      // Filter out permanently closed venues
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .map(p => ({
        name:        p.displayName?.text ?? 'Unknown venue',
        address:     p.formattedAddress ?? '',
        rating:      p.rating ?? null,
        reviewCount: p.userRatingCount ?? null,
        priceLevel:  formatPriceLevel(p.priceLevel),
        mapsUrl:     p.googleMapsUri ?? null,
      }))
  } catch (err) {
    console.error('Google Places fetch failed:', err)
    return []
  }
}

/**
 * Fetch venues for multiple types in parallel, then return a flat list
 * deduped by name, sorted by rating descending (or shuffled when randomize=true).
 *
 * @param venueTypes  - array of venue type labels from the user's preferences
 * @param city        - user's city
 * @param neighborhood - user's neighbourhood
 * @param perType     - max results per venue type query
 * @param randomize   - shuffle results instead of sorting by rating
 */
export async function searchVenuesForChallenge(
  venueTypes: string[],
  city: string,
  neighborhood: string,
  perType = 5,
  randomize = false
): Promise<PlaceResult[]> {
  if (!venueTypes.length) return []

  // Run all type searches in parallel — max 4 types to keep latency down
  const typesToSearch = venueTypes.slice(0, 4)

  const results = await Promise.all(
    typesToSearch.map(t => searchVenuesByType(t, city, neighborhood, perType))
  )

  const flat = results.flat()

  // Deduplicate by name (case-insensitive)
  const seen = new Set<string>()
  const deduped = flat.filter(p => {
    const key = p.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (randomize) {
    // Fisher-Yates shuffle so re-rolls surface different venues
    for (let i = deduped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deduped[i], deduped[j]] = [deduped[j], deduped[i]]
    }
    return deduped
  }

  return deduped.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
}

/**
 * Format a list of PlaceResults into a plain-text block suitable for
 * injecting into a Claude prompt.
 */
export function formatVenuesForPrompt(
  venues: PlaceResult[],
  _venueType: string
): string {
  if (!venues.length) return ''

  return venues
    .map((v, i) => {
      const rating  = v.rating    ? `${v.rating}/5 (${v.reviewCount?.toLocaleString() ?? '?'} reviews)` : 'no rating'
      const price   = v.priceLevel ? `· ${v.priceLevel}` : ''
      return `  ${i + 1}. ${v.name} — ${v.address} — ${rating} ${price}`
    })
    .join('\n')
}
