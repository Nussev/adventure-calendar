import CalendarGrid from "@/components/CalendarGrid";
import ChallengeCard from "@/components/ChallengeCard";
import Link from "next/link";

const STREAK = 7;
const TOTAL_DAYS = 30;

export default function Home() {
  const progressPct = Math.round((STREAK / TOTAL_DAYS) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto px-4">

          {/* ── Hero ── */}
          <section className="pt-10 pb-6">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-none">
              Adventure<br />
              <span className="text-[#D85A30]">Calendar</span>
            </h1>
            <p className="mt-2 text-base text-gray-500 font-medium">
              One spontaneous challenge, every day.
            </p>

            {/* Streak + Progress */}
            <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <FlameIcon className="w-5 h-5 text-[#D85A30]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      Current Streak
                    </p>
                    <p className="text-2xl font-black text-gray-900 leading-none">
                      {STREAK}{" "}
                      <span className="text-base font-semibold text-gray-500">
                        days
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Progress
                  </p>
                  <p className="text-2xl font-black text-[#D85A30] leading-none">
                    {STREAK}
                    <span className="text-base font-semibold text-gray-400">
                      /{TOTAL_DAYS}
                    </span>
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-[#D85A30] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-gray-400">
                {TOTAL_DAYS - STREAK} days to go
              </p>
            </div>
          </section>

          {/* ── Calendar Grid ── */}
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Your Journey
            </h2>
            <CalendarGrid
              totalDays={TOTAL_DAYS}
              completedDays={STREAK}
              activeDay={STREAK + 1}
            />
          </section>

          {/* ── Today's Challenge ── */}
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Day 8
            </h2>
            <ChallengeCard />
          </section>
        </div>
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-md mx-auto flex">
          <NavItem href="/" label="Home" active>
            <HomeIcon />
          </NavItem>
          <NavItem href="/badges" label="Badges">
            <BadgeIcon />
          </NavItem>
          <NavItem href="/profile" label="Profile">
            <ProfileIcon />
          </NavItem>
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  active = false,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-semibold transition-colors",
        active ? "text-[#D85A30]" : "text-gray-400 hover:text-gray-600",
      ].join(" ")}
    >
      <span className="w-6 h-6">{children}</span>
      <span>{label}</span>
    </Link>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11zm0 16a3 3 0 01-3-3c0-2.5 2-5.5 3-7.5 1 2 3 5 3 7.5a3 3 0 01-3 3z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" />
      <path d="M9 21V12h6v9" />
      <path d="M3 12v9h18V12" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
