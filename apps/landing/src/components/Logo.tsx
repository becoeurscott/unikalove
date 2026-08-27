/** UnikaLove brand logo — two figures (pink + gold) forming a heart. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 150" width={size} height={size * 0.75} aria-hidden>
      <defs>
        <linearGradient id="uk-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8477F" />
          <stop offset="100%" stopColor="#C2255C" />
        </linearGradient>
        <linearGradient id="uk-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E3B94E" />
          <stop offset="100%" stopColor="#A87B14" />
        </linearGradient>
      </defs>
      {/* heads */}
      <circle cx="78" cy="24" r="15" fill="url(#uk-pink)" />
      <circle cx="126" cy="20" r="15" fill="url(#uk-gold)" />
      {/* left figure: pink ribbon half-heart */}
      <path
        d="M96 130 C58 104 42 74 56 54 C66 40 88 42 96 58 C98 62 99 66 99 70"
        fill="none"
        stroke="url(#uk-pink)"
        strokeWidth="17"
        strokeLinecap="round"
      />
      {/* right figure: gold ribbon half-heart with longer tail */}
      <path
        d="M103 142 C144 106 160 72 146 52 C136 38 113 41 105 58 C103 62 102 66 102 70"
        fill="none"
        stroke="url(#uk-gold)"
        strokeWidth="17"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  size = 36,
  wordmark = true,
  onDark = false,
  suffix,
}: {
  size?: number;
  wordmark?: boolean;
  onDark?: boolean;
  suffix?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {wordmark && (
        <span className="font-bold" style={{ fontSize: size * 0.55 }}>
          <span className={onDark ? 'text-white' : 'text-brand-ink'}>Unika</span>
          <span className="text-brand">Love</span>
          {suffix && (
            <span className="ml-2 text-sm font-medium text-gray-400">{suffix}</span>
          )}
        </span>
      )}
    </span>
  );
}
