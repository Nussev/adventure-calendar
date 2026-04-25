import CalendarGrid from "@/components/CalendarGrid";
import DailyChallengeSection from "@/components/DailyChallengeSection";
import { BottomNav } from "@/components/BottomNav";
import { getDayNumberForDate } from "@/lib/getDailyChallenge";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const TOTAL_DAYS = 30;

export default async function Home() {
  const todayDayNumber = getDayNumberForDate();

  // Fetch real completed challenge dates — graceful if unauthenticated
  let completedDates: string[] = []
  let streak = 0

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: challenges } = await supabase
        .from('challenges')
        .select('challenge_date')
        .eq('user_id', user.id)
        .eq('is_completed', true)

      if (challenges) {
        completedDates = challenges
          .map(c => c.challenge_date as string)
          .filter(Boolean)

        const completedSet = new Set(completedDates)

        // Walk backwards from today to compute streak
        const cursor = new Date()
        while (completedSet.has(cursor.toISOString().split('T')[0])) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        }
      }
    }
  } catch {
    // Show empty calendar rather than crash
  }

  const completedCount = completedDates.length
  const progressPct    = Math.round((completedCount / TOTAL_DAYS) * 100)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>

      {/* Decorative ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, #D85A30 0%, #f97316 60%, transparent 100%)",
            filter: "blur(60px)",
            opacity: 0.1,
          }}
        />
        <div
          className="absolute top-[55%] -left-24 w-[300px] h-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, #f97316 0%, transparent 70%)",
            filter: "blur(50px)",
            opacity: 0.06,
          }}
        />
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 pb-6">

          {/* ── Hero ── */}
          <section className="pt-12 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D85A30] mb-2">
              Daily Adventure
            </p>
            <h1
              className="text-[2.75rem] font-black tracking-tight leading-[1.05]"
              style={{ color: "var(--foreground)" }}
            >
              Adventure<br />
              <span
                style={{
                  background: "linear-gradient(135deg, #D85A30 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Calendar
              </span>
            </h1>
            <p className="mt-2.5 text-[0.925rem] font-medium" style={{ color: "var(--foreground)", opacity: 0.45 }}>
              One spontaneous challenge, every day.
            </p>

            {/* Streak + Progress */}
            <div
              className="mt-5 rounded-2xl p-4 border"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent-light)" }}
                  >
                    <FlameIcon className="w-5 h-5 text-[#D85A30]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                      Current Streak
                    </p>
                    <p className="text-2xl font-black leading-none" style={{ color: "var(--foreground)" }}>
                      {streak}{" "}
                      <span className="text-sm font-semibold" style={{ opacity: 0.4 }}>days</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                    Progress
                  </p>
                  <p
                    className="text-2xl font-black leading-none"
                    style={{
                      background: "linear-gradient(135deg, #D85A30, #f97316)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {completedCount}
                    <span
                      className="text-sm font-semibold"
                      style={{ WebkitTextFillColor: "var(--foreground)", opacity: 0.35 }}
                    >
                      /{TOTAL_DAYS}
                    </span>
                  </p>
                </div>
              </div>

              <div
                className="w-full rounded-full h-2 overflow-hidden"
                style={{ background: "var(--muted)" }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, #D85A30 0%, #f97316 100%)",
                  }}
                />
              </div>
              <p className="mt-1.5 text-right text-[11px] font-medium" style={{ color: "var(--foreground)", opacity: 0.35 }}>
                {TOTAL_DAYS - completedCount} days to go
              </p>
            </div>
          </section>

          {/* ── Calendar Grid ── */}
          <section className="mb-6">
            <SectionLabel>Your Journey</SectionLabel>
            <CalendarGrid completedDates={completedDates} todayDayNumber={todayDayNumber} />
          </section>

          {/* ── Today's Challenge ── */}
          <section className="mb-6">
            <SectionLabel>Day {todayDayNumber}</SectionLabel>
            <DailyChallengeSection />
          </section>

        </div>
      </main>

      <BottomNav active="home" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: "var(--foreground)", opacity: 0.4 }}>
      {children}
    </p>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11zm0 16a3 3 0 01-3-3c0-2.5 2-5.5 3-7.5 1 2 3 5 3 7.5a3 3 0 01-3 3z" />
    </svg>
  );
}
