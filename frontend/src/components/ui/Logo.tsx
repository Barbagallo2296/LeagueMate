export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="11" className="fill-lime" />
      <rect x="10" y="13" width="28" height="22" rx="2" fill="none" className="stroke-on-lime" strokeWidth="2.5" />
      <path d="M24 13V35" className="stroke-on-lime" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="4.5" fill="none" className="stroke-on-lime" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="1.6" className="fill-on-lime" />
    </svg>
  )
}

export default function Logo({ size = 32, onHero = false }: { size?: number; onHero?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className={`font-display text-2xl font-bold tracking-wide ${onHero ? 'text-on-hero' : 'text-ink'}`}>
        League<span className={onHero ? 'text-hero-accent' : 'text-lime'}>Mate</span>
      </span>
    </span>
  )
}
