import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { checkAiGenerationLimit, recordAiGeneration, tooManyRequestsResponse } from '@/lib/rateLimit'

const client = new Anthropic()

function sanitize(str: string): string {
  return str.replace(/[^\w\s,&-]/g, '').slice(0, 100)
}

interface UserProfile {
  neighborhood: string
  city: string
  distance: string
  activities: string[]
  foods: string[]
  available_times: string[]
  budget: string
  duration: string
}

interface GeneratedChallenge {
  title: string
  description: string
  category: string
  estimated_cost: string
  estimated_duration: string
  time_of_day: string
  venue_suggestion: string
  venue_address: string
  venue_price: string
  route_tip: string
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  // ── 1. Auth ────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Rate limit ──────────────────────────────────────────
  const { allowed, retryAfterMs } = await checkAiGenerationLimit(user.id)
  if (!allowed) return tooManyRequestsResponse(retryAfterMs!)

  // ── 3. Parse + sanitize ────────────────────────────────────
  let body: { dayNumber: number; profile: UserProfile }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { dayNumber, profile } = body
  if (!dayNumber || !profile) {
    return Response.json({ error: 'dayNumber and profile are required' }, { status: 400 })
  }

  const city          = sanitize(profile.city ?? '')
  const neighborhood  = sanitize(profile.neighborhood ?? '')
  const activities    = (profile.activities ?? []).map(sanitize).filter(Boolean)
  const foods         = (profile.foods ?? []).map(sanitize).filter(Boolean)

  // ── 4. Generate ────────────────────────────────────────────
  try {
    const prompt = `You are an expert local adventure guide for ${city}.

Generate a single spontaneous daily challenge for Day ${dayNumber} of 30 for this person:
- Neighborhood: ${neighborhood}
- Max distance: ${sanitize(profile.distance ?? '')}
- Activity interests: ${activities.join(', ') || 'general exploration'}
- Food preferences: ${foods.join(', ') || 'open to anything'}
- Available times: ${(profile.available_times ?? []).join(', ') || 'flexible'}
- Budget: ${sanitize(profile.budget ?? '')}
- Time limit: ${sanitize(profile.duration ?? '')}

Rules:
- The challenge must be completable within their time limit and budget
- Suggest a REAL, specific venue or location in ${city} near ${neighborhood}
- Make it spontaneous and slightly outside their comfort zone but achievable
- Do NOT repeat obvious tourist traps

Respond ONLY with a valid JSON object, no markdown:
{
  "title": "Short punchy challenge title (5 words max)",
  "description": "2-3 sentence description of what they should do and why it will be great",
  "category": "One of: Outdoors, Food & drink, Art & culture, Music, Social, Fitness, Hidden gem",
  "estimated_cost": "e.g. Free, $10-15, $20-30",
  "estimated_duration": "e.g. 1 hour, 2 hours",
  "time_of_day": "Morning, Afternoon, or Evening",
  "venue_suggestion": "Specific venue or location name",
  "venue_address": "Full street address",
  "venue_price": "e.g. Free, $15/person, $8 entry",
  "route_tip": "One sentence on how to get there or best approach"
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const challenge: GeneratedChallenge = JSON.parse(raw.replace(/```json|```/g, '').trim())

    // ── 5. Save to challenges ──────────────────────────────────
    const { data: savedChallenge, error: saveError } = await supabase
      .from('challenges')
      .upsert(
        { user_id: user.id, day_number: dayNumber, ...challenge, ai_generated: true, generated_at: new Date().toISOString() },
        { onConflict: 'user_id,day_number' }
      )
      .select()
      .single()

    if (saveError) throw new Error(`Failed to save challenge: ${saveError.message}`)

    // ── 6. Record rate limit ───────────────────────────────────
    await recordAiGeneration(user.id, 'generate-challenge')

    return Response.json({ challenge: savedChallenge })

  } catch (err) {
    console.error('Generate challenge error:', err)
    return Response.json({ error: 'Failed to generate challenge' }, { status: 500 })
  }
}
