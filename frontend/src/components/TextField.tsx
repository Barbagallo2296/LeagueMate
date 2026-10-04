import type { ComponentProps } from 'react'

type TextFieldProps = ComponentProps<'input'> & {
  label: string
  error?: string
}

export default function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...inputProps}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}
