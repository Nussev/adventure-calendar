import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()

// Rate limit map — in-memory per server instance
const rateLimitMap = new Map<string, number[]>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const max = 5

  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, [])
  const requests = rateLimitMap.get(ip)!.filter(t => now - t < windowMs)
  requests.push(now)
  rateLimitMap.set(ip, requests)
  return requests.length <= max
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
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) {
      return Response.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Auth check
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if challenge already generated today
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('completed_at, day_number')
      .eq('user_id', user.id)
      .order('day_number', { ascending: false })
      .limit(1)
      .single()

    const body = await request.json()
    const { dayNumber, profile }: { dayNumber: number; profile: UserProfile } = body

    if (!dayNumber || !profile) {
      return Response.json({ error: 'dayNumber and profile are required' }, { status: 400 })
    }

    // Sanitize inputs
    const sanitize = (str: string) => str.replace(/[^\w\s,&\-]/g, '').slice(0, 100)
    const safeCity = sanitize(profile.city)
    const safeNeighborhood = sanitize(profile.neighborhood)

    const prompt = `You are an expert local adventure guide for ${safeCity}.

Generate a single spontaneous daily challenge for Day ${dayNumber} of 30 for this person:
- Neighborhood: ${safeNeighborhood}
- Max distance: ${profile.distance}
- Activity interests: ${profile.activities.join(', ')}
- Food preferences: ${profile.foods.join(', ')}
- Available times: ${profile.available_times.join(', ')}
- Budget: ${profile.budget}
- Time limit: ${profile.duration}

Rules:
- The challenge must be completable within their time limit and budget
- Suggest a REAL, specific venue or location in ${safeCity} near ${safeNeighborhood}
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
    const clean = raw.replace(/```json|```/g, '').trim()
    const challenge: GeneratedChallenge = JSON.parse(clean)

    // Save generated challenge to Supabase
    const { data: savedChallenge, error: saveError } = await supabase
      .from('challenges')
      .upsert({
        user_id: user.id,
        day_number: dayNumber,
        ...challenge,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,day_number' })
      .select()
      .single()

    if (saveError) throw new Error(`Failed to save challenge: ${saveError.message}`)

    return Response.json({ challenge: savedChallenge })

  } catch (err) {
    console.error('Generate challenge error:', err)
    return Response.json({ error: 'Failed to generate challenge' }, { status: 500 })
  }
}