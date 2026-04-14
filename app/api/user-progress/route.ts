import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all progress with challenge data joined
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*, challenge:challenges(*)')
      .eq('user_id', user.id)
      .order('day_number')

    if (progressError) throw new Error(`Failed to fetch progress: ${progressError.message}`)

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`)

    // Fetch earned badges
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at')

    if (badgesError) throw new Error(`Failed to fetch badges: ${badgesError.message}`)

    // Calculate streak
    const completedDays = (progress || [])
      .filter(p => p.completed_at)
      .map(p => p.day_number)
      .sort((a, b) => a - b)

    let streak = 0
    const today = completedDays[completedDays.length - 1] || 0
    for (let i = completedDays.length - 1; i >= 0; i--) {
      if (completedDays[i] === today - streak) {
        streak++
      } else break
    }

    // Determine current active day
    const currentDay = Math.min(completedDays.length + 1, 30)

    return Response.json({
      progress: progress || [],
      profile,
      badges: badges || [],
      stats: {
        completedDays: completedDays.length,
        currentDay,
        streak,
        totalDays: 30,
      }
    })

  } catch (err) {
    console.error('User progress error:', err)
    return Response.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}