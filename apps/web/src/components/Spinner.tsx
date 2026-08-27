/** Inline spinner for buttons and small inline waits. */
export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Full-area loader used while a route or major section resolves. */
export function LoadingScreen({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-400">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
        <span className="absolute inset-2 rounded-full bg-brand/40" />
        <Spinner size={48} className="relative text-brand" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}
