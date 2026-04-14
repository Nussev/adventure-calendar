import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { challengeId, dayNumber, notes }: {
      challengeId: string
      dayNumber: number
      notes?: string
    } = body

    if (!challengeId || !dayNumber) {
      return Response.json({ error: 'challengeId and dayNumber are required' }, { status: 400 })
    }

    // Mark challenge as complete
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          challenge_id: challengeId,
          day_number: dayNumber,
          completed_at: new Date().toISOString(),
          skipped: false,
          notes: notes || null,
        },
        { onConflict: 'user_id,day_number' }
      )
      .select()
      .single()

    if (progressError) throw new Error(`Failed to save progress: ${progressError.message}`)

    // Check and award badges
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('day_number, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)

    const completedDays = allProgress?.length || 0
    const newBadges: string[] = []

    const badgeMilestones: Record<number, string> = {
      1: 'first_steps',
      7: 'week_one',
      15: 'halfway',
      30: 'adventurer',
    }

    for (const [milestone, badgeSlug] of Object.entries(badgeMilestones)) {
      if (completedDays === Number(milestone)) {
        const { error: badgeError } = await supabase
          .from('badges')
          .upsert(
            {
              user_id: user.id,
              slug: badgeSlug,
              earned_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,slug' }
          )
        if (!badgeError) newBadges.push(badgeSlug)
      }
    }

    // Calculate current streak
    const sortedDays = (allProgress || [])
      .map(p => p.day_number)
      .sort((a, b) => a - b)

    let streak = 0
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      if (sortedDays[i] === dayNumber - streak) {
        streak++
      } else break
    }

    return Response.json({
      progress,
      newBadges,
      completedDays,
      streak,
      nextDayUnlocked: dayNumber + 1,
    })

  } catch (err) {
    console.error('Complete challenge error:', err)
    return Response.json({ error: 'Failed to complete challenge' }, { status: 500 })
  }
}