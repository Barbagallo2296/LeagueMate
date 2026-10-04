import type { ReactNode } from 'react'
import Logo from './ui/Logo'
import ThemeToggle from './ui/ThemeToggle'

function PitchDrawing() {
  return (
    <svg
      viewBox="0 0 600 400"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)] stroke-hero-accent/25 sm:inset-10 sm:h-[calc(100%-5rem)] sm:w-[calc(100%-5rem)]"
      fill="none"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="10" y="10" width="580" height="380" rx="14" />
      <path d="M300 10V390" />
      <circle cx="300" cy="200" r="56" />
      <circle cx="300" cy="200" r="4" className="fill-hero-accent/40" />
      <rect x="10" y="110" width="90" height="180" />
      <rect x="10" y="160" width="34" height="80" />
      <rect x="500" y="110" width="90" height="180" />
      <rect x="556" y="160" width="34" height="80" />
      <path d="M100 160a48 48 0 0 1 0 80" />
      <path d="M500 160a48 48 0 0 0 0 80" />
    </svg>
  )
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-wrap">
      <section className="relative flex min-h-80 flex-[1_1_480px] items-center justify-center overflow-hidden bg-hero px-8 py-14 text-on-hero">
        <PitchDrawing />
        <div className="relative flex max-w-md flex-col items-center gap-5 text-center">
          <Logo size={40} onHero />
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-wide sm:text-5xl">
            Il tuo torneo, giornata dopo giornata.
          </h1>
          <p className="leading-relaxed text-hero-muted">
            Classifica, calendario e risultati sempre aggiornati. A fine giornata l'AI scrive la cronaca e un
            assistente risponde alle tue domande sul torneo.
          </p>
        </div>
      </section>
      <section className="relative flex flex-[1_1_420px] items-center justify-center px-6 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  )
}
