import { supabase } from '@/lib/supabase'
import { BottomNav } from '@/components/BottomNav'

// Slugs of badges the user has earned — hardcoded until auth lands
const EARNED_SLUGS = new Set(['first-step', 'week-one'])

export default async function BadgesPage() {
  const { data: badges, error } = await supabase
    .from('badges')
    .select('*')
    .order('created_at')

  if (error) throw new Error(`BadgesPage: ${error.message}`)

  const earned = badges?.filter(b => EARNED_SLUGS.has(b.slug)) ?? []
  const locked = badges?.filter(b => !EARNED_SLUGS.has(b.slug)) ?? []

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 pb-6">

          {/* Header */}
          <section className="pt-12 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D85A30] mb-2">
              Achievements
            </p>
            <h1
              className="text-[2.25rem] font-black tracking-tight leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              Badges
            </h1>
            <p className="mt-2 text-[0.925rem] font-medium" style={{ color: "var(--foreground)", opacity: 0.45 }}>
              {earned.length} of {badges?.length ?? 0} earned
            </p>
          </section>

          {/* Earned */}
          {earned.length > 0 && (
            <section className="mb-8">
              <SectionLabel>Earned</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {earned.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} earned />
                ))}
              </div>
            </section>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <section>
              <SectionLabel>Locked</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {locked.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} earned={false} />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <BottomNav active="badges" />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: "var(--foreground)", opacity: 0.4 }}>
      {children}
    </p>
  )
}

// ── BadgeCard ──────────────────────────────────────────────────

type Badge = {
  id: string
  slug: string
  name: string
  description: string
  requirement_type: string
  requirement_value: number | null
  requirement_meta: string | null
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5"
      style={
        earned
          ? {
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 2px 8px rgba(216,90,48,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            }
          : {
              background: "var(--locked-bg)",
              border: "1px solid var(--border)",
            }
      }
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={
          earned
            ? { background: "linear-gradient(135deg, #D85A30 0%, #f97316 100%)" }
            : { background: "var(--locked-icon)" }
        }
      >
        <span className="w-5 h-5" style={{ color: earned ? "#fff" : "var(--foreground)", opacity: earned ? 1 : 0.3 }}>
          <BadgeIcon slug={badge.slug} />
        </span>
      </div>

      {/* Text */}
      <div>
        <p
          className="text-sm font-bold leading-tight"
          style={{ color: earned ? "var(--foreground)" : "var(--foreground)", opacity: earned ? 1 : 0.35 }}
        >
          {badge.name}
        </p>
        <p
          className="text-xs mt-0.5 leading-snug"
          style={{ color: "var(--foreground)", opacity: earned ? 0.5 : 0.3 }}
        >
          {badge.description}
        </p>
      </div>

      {earned && (
        <span
          className="self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ color: "#D85A30", background: "var(--accent-light)" }}
        >
          Earned
        </span>
      )}
    </div>
  )
}

// ── Icon mapping by badge slug ────────────────────────────────

function BadgeIcon({ slug }: { slug: string }) {
  const icons: Record<string, React.ReactNode> = {
    'first-step': <FootprintIcon />,
    'week-one': <FlameIcon />,
    'trailblazer': <CompassIcon />,
    'social-butterfly': <UsersIcon />,
    'taste-explorer': <ForkIcon />,
    'mind-and-body': <HeartIcon />,
    'creative-force': <PencilIcon />,
    'iron-will': <BoltIcon />,
    'halfway-there': <TargetIcon />,
    'community-builder': <HandshakeIcon />,
    'unstoppable': <ShieldIcon />,
    'full-calendar': <TrophyIcon />,
  }
  return <>{icons[slug] ?? <StarIcon />}</>
}

// ── SVG icons ─────────────────────────────────────────────────

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function FootprintIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M8 18c0 2 1.5 3 3 3s3-1 3-3V9a3 3 0 00-6 0v9z"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/></svg>
}
function FlameIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 0-5 6-5 11a5 5 0 0010 0c0-5-5-11-5-11zm0 16a3 3 0 01-3-3c0-2.5 2-5.5 3-7.5 1 2 3 5 3 7.5a3 3 0 01-3 3z"/></svg>
}
function CompassIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
}
function UsersIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
}
function ForkIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
}
function HeartIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
}
function PencilIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
}
function BoltIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
}
function TargetIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}
function HandshakeIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
}
function ShieldIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
function TrophyIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H4a2 2 0 00-2 2v3c0 2.21 1.79 4 4 4h1"/><path d="M17 4h3a2 2 0 012 2v3c0 2.21-1.79 4-4 4h-1"/><rect x="7" y="2" width="10" height="12" rx="2" ry="2"/></svg>
}
function StarIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
