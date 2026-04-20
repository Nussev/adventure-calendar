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
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="h-1.5 bg-[#D85A30]" />
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D85A30] mb-1">
          Today&apos;s Challenge
        </p>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2 leading-tight">
          {title}
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
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
          className="block w-full text-center bg-[#D85A30] hover:bg-[#c04f28] active:bg-[#a8431f] text-white font-bold py-3 rounded-xl transition-colors text-sm tracking-wide"
        >
          View today&apos;s challenge →
        </Link>
      </div>
    </div>
  );
}

function Tag({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#D85A30] text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-100">
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
