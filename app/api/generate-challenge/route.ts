import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkAiGenerationLimit, recordAiGeneration, tooManyRequestsResponse } from '@/lib/rateLimit'

const client = new Anthropic()

interface SuggestionRequest {
  city: string
  activities: string[]
  foods: string[]
  budget: string
}

interface NeighborhoodSuggestion {
  name: string
  reason: string
}

// Strip anything that isn't a word char, space, comma, ampersand, or hyphen.
// Caps at 100 chars to prevent prompt bloat.
function sanitize(str: string): string {
  return str.replace(/[^\w\s,&-]/g, '').slice(0, 100)
}

export async function POST(request: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Rate limit ──────────────────────────────────────────
  const sessionId: string | null = (() => {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      return payload.session_id ?? null
    } catch {
      return null
    }
  })()

  const { allowed, retryAfterMs } = await checkAiGenerationLimit(user.id)

  if (!allowed) {
    return tooManyRequestsResponse(retryAfterMs!)
  }

  // ── 3. Parse + sanitize input ──────────────────────────────
  let body: SuggestionRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.city?.trim()) {
    return Response.json({ error: 'City is required' }, { status: 400 })
  }

  const city       = sanitize(body.city)
  const activities = (body.activities ?? []).map(sanitize).filter(Boolean)
  const foods      = (body.foods ?? []).map(sanitize).filter(Boolean)
  const budget     = sanitize(body.budget ?? '')

  // ── 4. Generate suggestions ────────────────────────────────
  try {
    const prompt = `You are a local city expert helping someone find the best neighborhood to base their daily adventures from.

The user lives in: ${city}
Their activity interests: ${activities.length > 0 ? activities.join(', ') : 'general exploration'}
Their food preferences: ${foods.length > 0 ? foods.join(', ') : 'open to anything'}
Their budget: ${budget}

Suggest exactly 4 neighborhoods in ${city} that would be a great base for spontaneous daily adventures matching their preferences. For each neighborhood provide a name and a single short sentence (max 12 words) explaining why it suits them specifically.

Respond ONLY with a valid JSON array, no markdown, no explanation, just the array:
[
  { "name": "Neighborhood Name", "reason": "Short reason why it suits their preferences." },
  { "name": "Neighborhood Name", "reason": "Short reason why it suits their preferences." },
  { "name": "Neighborhood Name", "reason": "Short reason why it suits their preferences." },
  { "name": "Neighborhood Name", "reason": "Short reason why it suits their preferences." }
]`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    const suggestions: NeighborhoodSuggestion[] = JSON.parse(clean)

    // ── 5. Record the call ───────────────────────────────────
    await recordAiGeneration(user.id, 'generate-challenge', sessionId)

    return Response.json({ suggestions })

  } catch (err) {
    console.error('Neighborhood suggestions error:', err)
    return Response.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
