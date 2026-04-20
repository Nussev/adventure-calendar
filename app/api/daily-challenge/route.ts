import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { DailyChallenge } from '@/lib/getDailyChallenge'

const client = new Anthropic()

const FALLBACK: DailyChallenge = {
  title: 'Explore Your Neighborhood',
  description:
    "Take a 20-minute walk and find three things you've never noticed before. Photograph them and share with a friend.",
  difficulty: 'easy',
  category: 'nature',
  estimatedTime: '20 minutes',
}

// Per-IP rate limit — prevents cost abuse on cache misses
const ipHits = new Map<string, { count: number; resetAt: number }>()
const IP_LIMIT = 5
const IP_WINDOW_MS = 60 * 60 * 1000

function todayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

function checkIpLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS })
    return true
  }
  if (entry.count >= IP_LIMIT) return false
  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') ?? todayUTC()

  // Block arbitrary date probing — each unique date would bypass client-side caching
  if (dateStr !== todayUTC()) {
    return Response.json({ error: "Only today's date is accepted" }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkIpLimit(ip)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Read user preferences from query params
  const city         = searchParams.get('city') ?? ''
  const neighborhood = searchParams.get('neighborhood') ?? ''
  const distance     = searchParams.get('distance') ?? ''
  const budget       = searchParams.get('budget') ?? ''
  const duration     = searchParams.get('duration') ?? ''
  const activities   = searchParams.get('activities') ?? ''
  const foods        = searchParams.get('foods') ?? ''
  const times        = searchParams.get('times') ?? ''

  const month = new Date(`${dateStr}T12:00:00`).toLocaleString('en-US', { month: 'long' })

  const prefLines = [
    city         && `- Location: ${city}${neighborhood ? `, ${neighborhood}` : ''}`,
    distance     && `- Max travel distance: ${distance}`,
    activities   && `- Activity interests: ${activities}`,
    foods        && `- Food & drink preferences: ${foods}`,
    times        && `- Available times: ${times}`,
    budget       && `- Budget: ${budget}`,
    duration     && `- Time available: ${duration}`,
  ].filter(Boolean).join('\n')

  const prompt = prefLines
    ? `Generate a personalized adventure challenge for today, ${dateStr} (${month}), based on these user preferences:\n${prefLines}\n\nReturn JSON only with fields: title (short, exciting, 5 words max), description (2-3 sentences), difficulty (easy/medium/hard), category (nature/fitness/social/creative/food/culture), estimatedTime (e.g. "45 minutes"). No markdown, raw JSON only.`
    : `Generate a fun outdoor adventure challenge for today, ${dateStr} (${month}). Return JSON only with fields: title (short, exciting, 5 words max), description (2-3 sentences), difficulty (easy/medium/hard), category (nature/fitness/social/creative/food/culture), estimatedTime (e.g. "45 minutes"). No markdown, raw JSON only.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const challenge = JSON.parse(raw.replace(/```json\n?|```/g, '').trim()) as DailyChallenge
    return Response.json(challenge)
  } catch (err) {
    console.error('Daily challenge generation failed:', err)
    return Response.json(FALLBACK)
  }
}
