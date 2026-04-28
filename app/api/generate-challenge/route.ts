import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { checkAiGenerationLimit, checkCallLogLimit, recordAiGeneration, tooManyRequestsResponse } from '@/lib/rateLimit'
import { searchVenuesForChallenge, formatVenuesForPrompt, type PlaceResult } from '@/lib/googlePlaces'

const anthropic = new Anthropic()

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function sanitize(str: string): string {
  return str.replace(/[^\w\s,&\-'.]/g, '').slice(0, 120)
}
function sanitizeArr(arr: string[]): string[] {
  return arr.map(sanitize).filter(Boolean)
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  city:                   string | null
  neighborhood:           string | null
  max_distance:           string | null
  preferred_activities:   string[]
  preferred_foods:        string[]
  preferred_venue_types:  string[]
  available_times:        string[]
  budget:                 string | null
  max_duration:           string | null
}

export interface VenueStop {
  order:         number
  venue_name:    string
  venue_address: string
  venue_type:    string
  what_to_do:    string[]  // 2-3 short action fragments (not sentences)
  google_rating: number | null
  review_count:  number | null
  price_level:   string | null
  tip:           string    // one short practical tip
}

interface GeneratedChallenge {
  title:              string
  description:        string   // 2-3 sentence teaser for the whole adventure
  category:           string
  estimated_duration: string
  estimated_cost:     string
  time_of_day:        string
  difficulty:         string
  venue_stops:        VenueStop[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dayNumberFromDateStr(dateStr: string): number {
  const date = new Date(dateStr)
  const start = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1
  return ((dayOfYear - 1) % 30) + 1
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  // Accepts { challengeDate, force } (new) or { dayNumber } (legacy).
  let challengeDate: string
  let dayNumber: number
  let force = false
  try {
    const body = await request.json()
    force = body.force === true

    if (body.challengeDate && typeof body.challengeDate === 'string') {
      challengeDate = body.challengeDate
      dayNumber = dayNumberFromDateStr(challengeDate)
    } else if (body.dayNumber && typeof body.dayNumber === 'number') {
      dayNumber = body.dayNumber
      challengeDate = new Date().toISOString().split('T')[0]
    } else {
      throw new Error()
    }
  } catch {
    return Response.json({ error: 'challengeDate (string) or dayNumber (number) is required' }, { status: 400 })
  }

  const randomSeed = force ? Math.random().toString(36).substring(2, 9) : null

  const serviceClient = getServiceClient()

  // ── 3. DB cache check — skip Anthropic if row already exists ───────────────
  if (!force) {
    const { data: existing } = await serviceClient
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_date', challengeDate)
      .maybeSingle()

    if (existing) return Response.json({ challenge: existing })
  }

  // ── 4. Rate limit ──────────────────────────────────────────────────────────
  if (force) {
    // Force re-rolls are not subject to the 24h generation limit, but are
    // capped at 5 per day to prevent unlimited Anthropic spend.
    const { allowed, retryAfterMs } = await checkCallLogLimit(
      user.id, 'generate-challenge-force', 5, 24 * 60 * 60 * 1000
    )
    if (!allowed) return tooManyRequestsResponse(retryAfterMs!)
  } else {
    const { allowed, retryAfterMs } = await checkAiGenerationLimit(user.id)
    if (!allowed) return tooManyRequestsResponse(retryAfterMs!)
  }

  // ── 5. Fetch user preferences from Supabase (source of truth) ─────────────
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select(`
      city, neighborhood, max_distance,
      preferred_activities, preferred_foods, preferred_venue_types,
      available_times, budget, max_duration
    `)
    .eq('id', user.id)
    .single<UserProfile>()

  if (profileError || !profile) {
    return Response.json({ error: 'Could not load user profile' }, { status: 500 })
  }

  // ── 5b. Fetch recent completed challenge history ───────────────────────────
  const { data: recentCompleted } = await serviceClient
    .from('challenges')
    .select('title, category, venue_stops')
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(10)

  // ── 6. Sanitize all preference values before they touch the prompt ──────────
  const city        = sanitize(profile.city ?? '')
  const neighborhood = sanitize(profile.neighborhood ?? '')
  const distance    = sanitize(profile.max_distance ?? 'nearby')
  const budget      = sanitize(profile.budget ?? 'flexible')
  const duration    = sanitize(profile.max_duration ?? 'a few hours')
  const activities  = sanitizeArr(profile.preferred_activities ?? [])
  const foods       = sanitizeArr(profile.preferred_foods ?? [])
  const venueTypes  = sanitizeArr(profile.preferred_venue_types ?? [])
  const times       = sanitizeArr(profile.available_times ?? [])

  if (!city) {
    return Response.json(
      { error: 'Please set your city in Profile → Preferences before generating a challenge.' },
      { status: 422 }
    )
  }

  // ── 7. Fetch real venues from Google Places ────────────────────────────────
  //
  // On normal generation: search user's preferred venue types, sort by rating.
  // On force re-roll: inject 1-2 complementary types the user didn't select,
  // then shuffle results so Claude sees different venues each time.
  //
  const VARIETY_TYPES = ['Coffee shops', 'Parks', 'Art galleries', 'Markets', 'Bookshops']

  let searchTypes = venueTypes
  if (force && venueTypes.length > 0) {
    const extras = VARIETY_TYPES
      .filter(t => !venueTypes.includes(t))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    searchTypes = [...venueTypes, ...extras]
  }

  let googleVenues: PlaceResult[] = []
  let venueContext = ''

  if (searchTypes.length > 0) {
    googleVenues = await searchVenuesForChallenge(searchTypes, city, neighborhood, 5, force)

    if (googleVenues.length > 0) {
      venueContext = `
I searched Google Places and found these REAL venues near ${neighborhood ? `${neighborhood}, ` : ''}${city}:

${formatVenuesForPrompt(googleVenues, '')}

You MUST choose 2-3 venues from the list above for the challenge stops.
Do not invent any other venue names — only use venues from this list.`
    }
  }

  // Fallback when no venue types are set or Google returned nothing
  const noVenueData = googleVenues.length === 0
  if (noVenueData) {
    venueContext = `
No specific venue data is available. Use your knowledge of well-known, real, highly-rated venues in ${neighborhood ? `${neighborhood}, ` : ''}${city}.
Only name venues you are confident actually exist — if uncertain, describe the type of place without a specific name.`
  }

  // ── 8. Build the prompt ────────────────────────────────────────────────────

  const historyLines = recentCompleted && recentCompleted.length > 0
    ? recentCompleted.map(c => {
        // Sanitize stored Claude output before re-injecting — prevents stored prompt injection
        const title    = sanitize(c.title ?? '')
        const category = sanitize(c.category ?? '')
        const venueTypes = (c.venue_stops as { venue_type?: string }[] | null)
          ?.map(s => sanitize(s.venue_type ?? '')).filter(Boolean).join(', ')
        return `- ${title} (${category}${venueTypes ? `, stops at: ${venueTypes}` : ''})`
      }).join('\n')
    : null

  const prompt = `You are a spontaneous adventure planner for ${city}.

USER PREFERENCES:
- City/area: ${city}${neighborhood ? `, ${neighborhood}` : ''}
- Max travel distance: ${distance}
- Interests: ${[...activities, ...foods].filter(Boolean).join(', ') || 'open to anything'}
- Available: ${times.join(', ') || 'flexible'}
- Budget: ${budget}
- Time available: ${duration}
${historyLines ? `
COMPLETED CHALLENGES — do NOT repeat these categories, venue types, or activity styles:
${historyLines}

Generate something meaningfully different in category, venue type, and vibe from everything above.` : ''}
${venueContext}

${randomSeed ? `RANDOMIZE SEED: ${randomSeed}
Use this seed to push yourself toward an unexpected direction — a different neighborhood, a venue type you haven't defaulted to, an activity style that contrasts with the obvious choice.` : ''}
YOUR TASK:
Create a multi-stop spontaneous adventure with 2-3 specific venue stops.

RULES:
1. Each stop must be a specific, named venue — not generic ("a bar") or made-up.
2. ${noVenueData ? 'Only name venues you are confident exist in ' + city + '.' : 'Only use venues from the Google Places list above.'}
3. Each stop needs 2-3 short action fragments in what_to_do — short phrases like "Order the X", "Ask for Y", "Sit at the Z counter". No full sentences.
4. The stops should flow together as an evening/afternoon/morning out — they should be geographically sensible (walkable or a short transit ride between them).
5. The challenge must fit within the user's time and budget.
6. Make it feel genuinely spontaneous — not a typical tourist itinerary.
7. Maximum 1 bar, pub, or drinking-focused venue across all stops — even if bars are a user preference. "Prefers bars" means include one bar stop, not make every stop a bar. The remaining stops MUST be a clearly different venue type (coffee shop, museum, gallery, park, market, bookshop, etc.).
8. No two stops can be the same venue type. Every stop must offer a genuinely different kind of experience.

Respond ONLY with a single valid JSON object. No markdown, no explanation.

{
  "title": "Punchy adventure title, 5 words max",
  "description": "2-3 sentences selling the whole adventure — make it exciting",
  "category": "One of: Food & drink, Art & culture, Music, Outdoors, Social, Fitness, Hidden gem",
  "difficulty": "easy | medium | hard",
  "estimated_duration": "e.g. 3 hours, Half a day",
  "estimated_cost": "e.g. Under $30, $40-60 per person",
  "time_of_day": "Morning | Afternoon | Evening | Night",
  "venue_stops": [
    {
      "order": 1,
      "venue_name": "Exact name of the venue",
      "venue_address": "Full street address",
      "venue_type": "Restaurant | Bar | Coffee shop | Museum | Gallery | Park | Music venue | Market | Other",
      "what_to_do": ["Short action fragment — not a sentence", "e.g. Order the X, ask for Y, try the Z", "One more specific action"],
      "google_rating": 4.5,
      "review_count": 312,
      "price_level": "$ | $$ | $$$ | $$$$",
      "tip": "One short practical tip — timing, what to avoid, insider knowledge"
    }
  ]
}`

  // ── 9. Call Anthropic ──────────────────────────────────────────────────────
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const challenge = JSON.parse(
      raw.replace(/```json\n?|```/g, '').trim()
    ) as GeneratedChallenge

    // Annotate each stop with real Google data if we have it
    if (googleVenues.length > 0 && challenge.venue_stops) {
      challenge.venue_stops = challenge.venue_stops.map(stop => {
        const match = googleVenues.find(
          v => v.name.toLowerCase().includes(stop.venue_name.toLowerCase()) ||
               stop.venue_name.toLowerCase().includes(v.name.toLowerCase())
        )
        if (match) {
          return {
            ...stop,
            venue_address: match.address || stop.venue_address,
            google_rating: match.rating ?? stop.google_rating,
            review_count:  match.reviewCount ?? stop.review_count,
            price_level:   match.priceLevel ?? stop.price_level,
          }
        }
        return stop
      })
    }

    // ── 10. Save to database — insert or overwrite (force) ──────────────────
    const challengeRow = {
      user_id:            user.id,
      day_number:         dayNumber,
      challenge_date:     challengeDate,
      title:              challenge.title,
      description:        challenge.description,
      category:           challenge.category,
      difficulty:         challenge.difficulty,
      estimated_duration: challenge.estimated_duration,
      estimated_cost:     challenge.estimated_cost,
      time_of_day:        challenge.time_of_day,
      venue_stops:        challenge.venue_stops,
      ai_generated:       true,
      generated_at:       new Date().toISOString(),
      is_completed:       false,
      completed_at:       null,
    }

    // Check for an existing row to decide insert vs update
    const { data: existingForUpdate } = await serviceClient
      .from('challenges')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_date', challengeDate)
      .maybeSingle()

    let savedChallenge: Record<string, unknown> | null = null
    let saveError: { message: string } | null = null

    if (existingForUpdate) {
      const { data, error } = await serviceClient
        .from('challenges')
        .update(challengeRow)
        .eq('id', existingForUpdate.id)
        .select()
        .single()
      savedChallenge = data
      saveError = error
    } else {
      const { data, error } = await serviceClient
        .from('challenges')
        .insert(challengeRow)
        .select()
        .single()
      savedChallenge = data
      saveError = error
    }

    if (saveError) throw new Error(`DB save failed: ${saveError.message}`)

    // ── 11. Record for rate limiting ─────────────────────────────────────────
    // Force re-rolls use a separate endpoint key so they count against
    // their own 5/day bucket, not the regular 1/day generation limit.
    await recordAiGeneration(user.id, force ? 'generate-challenge-force' : 'generate-challenge')

    return Response.json({ challenge: savedChallenge })

  } catch (err) {
    console.error('Generate challenge error:', err)
    return Response.json({ error: 'Failed to generate challenge' }, { status: 500 })
  }
}
