import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  // ── Auth ───────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────
  let body: { challengeId: string; dayNumber: number; notes?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { challengeId, dayNumber, notes } = body
  if (!challengeId || !dayNumber) {
    return Response.json({ error: 'challengeId and dayNumber are required' }, { status: 400 })
  }

  try {
    // ── Mark complete ────────────────────────────────────────
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          challenge_id: challengeId,
          day_number: dayNumber,
          completed_at: new Date().toISOString(),
          skipped: false,
          notes: notes ?? null,
        },
        { onConflict: 'user_id,day_number' }
      )
      .select()
      .single()

    if (progressError) throw new Error(`Failed to save progress: ${progressError.message}`)

    // ── Fetch all completed days for streak + badge logic ────
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('day_number, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)

    const completedDays = allProgress?.length ?? 0

    // ── Award milestone badges via user_badges ───────────────
    const milestones: Record<number, string> = {
      1:  'first-step',
      7:  'week-one',
      15: 'halfway-there',
      30: 'full-calendar',
    }

    const newBadges: string[] = []

    if (milestones[completedDays]) {
      const { data: badge } = await supabase
        .from('badges')
        .select('id')
        .eq('slug', milestones[completedDays])
        .single()

      if (badge) {
        const { error: badgeError } = await supabase
          .from('user_badges')
          .upsert(
            { user_id: user.id, badge_id: badge.id, earned_at: new Date().toISOString() },
            { onConflict: 'user_id,badge_id' }
          )
        if (!badgeError) newBadges.push(milestones[completedDays])
      }
    }

    // ── Calculate streak ─────────────────────────────────────
    const sortedDays = (allProgress ?? [])
      .map(p => p.day_number)
      .sort((a, b) => a - b)

    let streak = 0
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      if (sortedDays[i] === dayNumber - streak) streak++
      else break
    }

    return Response.json({ progress, newBadges, completedDays, streak, nextDayUnlocked: dayNumber + 1 })

  } catch (err) {
    console.error('Complete challenge error:', err)
    return Response.json({ error: 'Failed to complete challenge' }, { status: 500 })
  }
}
