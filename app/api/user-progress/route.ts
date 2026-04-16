import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  // ── Auth ───────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ── Fetch progress + profile + earned badges in parallel ─
    const [progressRes, profileRes, badgesRes] = await Promise.all([
      supabase
        .from('user_progress')
        .select('*, challenge:challenges(*)')
        .eq('user_id', user.id)
        .order('day_number'),
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', user.id)
        .order('earned_at'),
    ])

    if (progressRes.error) throw new Error(`Progress: ${progressRes.error.message}`)
    if (profileRes.error)  throw new Error(`Profile: ${profileRes.error.message}`)
    if (badgesRes.error)   throw new Error(`Badges: ${badgesRes.error.message}`)

    // ── Calculate streak ─────────────────────────────────────
    const completedDays = (progressRes.data ?? [])
      .filter(p => p.completed_at)
      .map(p => p.day_number)
      .sort((a, b) => a - b)

    let streak = 0
    const today = completedDays[completedDays.length - 1] ?? 0
    for (let i = completedDays.length - 1; i >= 0; i--) {
      if (completedDays[i] === today - streak) streak++
      else break
    }

    const currentDay = Math.min(completedDays.length + 1, 30)

    return Response.json({
      progress: progressRes.data ?? [],
      profile:  profileRes.data,
      badges:   badgesRes.data ?? [],
      stats: { completedDays: completedDays.length, currentDay, streak, totalDays: 30 },
    })

  } catch (err) {
    console.error('User progress error:', err)
    return Response.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
