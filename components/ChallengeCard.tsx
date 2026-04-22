import Link from "next/link";

export default function ChallengeCard({
  title,
  description,
  time,
  cost,
  category,
  href,
}: {
  title: string
  description: string
  time: string
  cost?: string
  category: string
  href: string
}) {
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(216,90,48,0.08)",
      }}
    >
      {/* Gradient accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, #D85A30 0%, #f97316 60%, #fbbf24 100%)" }}
      />

      <div className="p-5">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5"
          style={{ color: "#D85A30" }}
        >
          Today&apos;s Challenge
        </p>
        <h2
          className="text-[1.3rem] font-extrabold mb-2 leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </h2>
        <p
          className="text-[0.875rem] leading-relaxed mb-4"
          style={{ color: "var(--foreground)", opacity: 0.55 }}
        >
          {description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          <Tag label={time}>
            <ClockIcon />
          </Tag>
          {cost && (
            <Tag label={cost}>
              <CostIcon />
            </Tag>
          )}
          <Tag label={category}>
            <CompassIcon />
          </Tag>
        </div>

        <Link
          href={href}
          className="block w-full text-center text-white font-bold py-3 rounded-xl transition-all text-sm tracking-wide active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #D85A30 0%, #e8693e 100%)",
            boxShadow: "0 4px 14px rgba(216,90,48,0.35)",
          }}
        >
          View today&apos;s challenge →
        </Link>
      </div>
    </div>
  );
}

function Tag({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
      style={{
        background: "var(--accent-light)",
        color: "#D85A30",
        border: "1px solid rgba(216,90,48,0.12)",
      }}
    >
      <span className="w-3.5 h-3.5 shrink-0">{children}</span>
      {label}
    </span>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function CostIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
