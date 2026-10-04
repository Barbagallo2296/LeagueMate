import { useState } from 'react'
import { applyTheme, currentTheme, type Theme } from '../../theme/theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  function toggle() {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={next === 'light' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={next === 'light' ? 'Tema chiaro' : 'Tema scuro'}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-raised hover:text-ink"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}
