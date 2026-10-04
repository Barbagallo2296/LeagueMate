interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-800">
          {title}
        </h2>
        <p className="mt-2 text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {pending ? 'Attendere...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
