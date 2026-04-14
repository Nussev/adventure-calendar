import { createClient } from '@supabase/supabase-js'

// Uses the service role key so it can write to api_call_log and update
// profiles regardless of RLS. Never expose this client to the browser.
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local ' +
      '(Supabase dashboard → Project settings → API → service_role key). ' +
      'Never expose this key to the browser.'
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

/**
 * Enforce a once-per-N-hours limit for AI generation per user.
 *
 * @param {string} userId
 * @param {number} cooldownHours  - hours that must pass before another call
 * @returns {{ allowed: boolean, retryAfterMs: number | null }}
 */
export async function checkAiGenerationLimit(userId: string, cooldownHours = 24) {
  const supabase = getServerClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('last_ai_generated')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`checkAiGenerationLimit: ${error.message}`)

  if (profile.last_ai_generated) {
    const elapsed = Date.now() - new Date(profile.last_ai_generated).getTime()
    const cooldownMs = cooldownHours * 60 * 60 * 1000

    if (elapsed < cooldownMs) {
      return { allowed: false, retryAfterMs: cooldownMs - elapsed }
    }
  }

  return { allowed: true, retryAfterMs: null }
}

/**
 * Record a successful AI generation and stamp the profile's last_ai_generated.
 *
 * @param {string} userId
 * @param {string} endpoint
 * @param {string|null} sessionId  - Supabase Auth session ID from the JWT
 */
export async function recordAiGeneration(userId: string, endpoint = 'generate-challenge', sessionId: string | null = null) {
  const supabase = getServerClient()
  const now = new Date().toISOString()

  const [logResult, profileResult] = await Promise.all([
    supabase
      .from('api_call_log')
      .insert({ user_id: userId, endpoint, called_at: now, session_id: sessionId }),
    supabase
      .from('profiles')
      .update({ last_ai_generated: now })
      .eq('id', userId),
  ])

  if (logResult.error) throw new Error(`recordAiGeneration log: ${logResult.error.message}`)
  if (profileResult.error) throw new Error(`recordAiGeneration profile: ${profileResult.error.message}`)
}

/**
 * Build a standard 429 Response with a Retry-After header.
 *
 * @param {number} retryAfterMs
 */
export function tooManyRequestsResponse(retryAfterMs: number) {
  const retryAfterSecs = Math.ceil(retryAfterMs / 1000)
  return Response.json(
    { error: 'You have already generated a challenge today. Try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSecs) },
    }
  )
}
