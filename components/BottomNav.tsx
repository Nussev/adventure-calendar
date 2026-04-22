import Link from "next/link";

type Tab = "home" | "badges" | "profile";

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav
      className="shrink-0 border-t"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--border)",
        boxShadow: "0 -1px 0 var(--border)",
      }}
    >
      <div className="max-w-md mx-auto flex">
        <NavItem href="/" label="Home" active={active === "home"}>
          <HomeIcon />
        </NavItem>
        <NavItem href="/badges" label="Badges" active={active === "badges"}>
          <BadgeIcon />
        </NavItem>
        <NavItem href="/profile" label="Profile" active={active === "profile"}>
          <ProfileIcon />
        </NavItem>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[11px] font-semibold transition-colors",
        active ? "text-[#D85A30]" : "text-gray-400 dark:text-stone-500 hover:text-gray-500 dark:hover:text-stone-400",
      ].join(" ")}
    >
      <span className="w-[22px] h-[22px]">{children}</span>
      <span>{label}</span>
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" />
      <path d="M9 21V12h6v9" />
      <path d="M3 12v9h18V12" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
