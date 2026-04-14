import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Slugs of badges the user has earned — hardcoded until auth lands
// TODO: fetch from user_badges once auth is wired
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-24">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Badges</h1>
          <p className="text-sm text-gray-400 mt-1">
            {earned.length} of {badges?.length ?? 0} earned
          </p>
        </div>

        {/* Earned */}
        {earned.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Earned
            </h2>
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
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Locked
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {locked.map(badge => (
                <BadgeCard key={badge.id} badge={badge} earned={false} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-md mx-auto flex">
          <NavItem href="/" label="Home"><HomeIcon /></NavItem>
          <NavItem href="/badges" label="Badges" active><BadgeNavIcon /></NavItem>
          <NavItem href="/profile" label="Profile"><ProfileIcon /></NavItem>
        </div>
      </nav>
    </div>
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
      className={[
        'rounded-2xl p-4 border flex flex-col gap-2',
        earned
          ? 'bg-white border-gray-100 shadow-sm'
          : 'bg-gray-50 border-gray-100',
      ].join(' ')}
    >
      {/* Icon */}
      <div
        className={[
          'w-11 h-11 rounded-xl flex items-center justify-center',
          earned ? 'bg-[#D85A30]' : 'bg-gray-200',
        ].join(' ')}
      >
        <span className={`w-5 h-5 ${earned ? 'text-white' : 'text-gray-400'}`}>
          <BadgeIcon slug={badge.slug} />
        </span>
      </div>

      {/* Text */}
      <div>
        <p className={`text-sm font-bold leading-tight ${earned ? 'text-gray-900' : 'text-gray-400'}`}>
          {badge.name}
        </p>
        <p className={`text-xs mt-0.5 leading-snug ${earned ? 'text-gray-500' : 'text-gray-400'}`}>
          {badge.description}
        </p>
      </div>

      {earned && (
        <span className="self-start text-[10px] font-semibold uppercase tracking-wider text-[#D85A30] bg-orange-50 px-2 py-0.5 rounded-full">
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

// ── Nav helpers ───────────────────────────────────────────────

function NavItem({
  href, label, active = false, children,
}: {
  href: string; label: string; active?: boolean; children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={[
        'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-semibold transition-colors',
        active ? 'text-[#D85A30]' : 'text-gray-400 hover:text-gray-600',
      ].join(' ')}
    >
      <span className="w-6 h-6">{children}</span>
      <span>{label}</span>
    </Link>
  )
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
function HomeIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 12v9h18V12"/></svg>
}
function BadgeNavIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="6"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
}
