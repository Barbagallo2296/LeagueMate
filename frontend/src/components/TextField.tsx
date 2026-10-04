import type { ComponentProps } from 'react'

type TextFieldProps = ComponentProps<'input'> & {
  label: string
  error?: string
}

export default function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-reading">{label}</span>
      <input
        {...inputProps}
        className="h-11 w-full rounded-lg border border-line bg-field px-3 text-ink placeholder:text-muted focus:border-lime focus:outline-none"
      />
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}
