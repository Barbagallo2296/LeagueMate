export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'leaguemate.theme'

const BROWSER_BAR_COLORS: Record<Theme, string> = {
  dark: '#0e1116',
  light: '#f3f5f8',
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_BAR_COLORS[theme])
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    return
  }
}
