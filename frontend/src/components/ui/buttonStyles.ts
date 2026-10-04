export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-lime text-on-lime hover:bg-lime-hover',
  secondary: 'border border-line bg-panel text-ink hover:bg-raised',
  ghost: 'text-muted hover:bg-raised hover:text-ink',
  ai: 'border border-ai-line bg-ai-soft text-ai hover:border-ai',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`
}
