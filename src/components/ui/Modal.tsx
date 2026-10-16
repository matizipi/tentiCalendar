import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** En mobile se muestra como bottom sheet anclado abajo. */
  sheet?: boolean
  children: ReactNode
}

/** Diálogo modal nativo (<dialog>): foco atrapado, Esc y backdrop gestionados por el navegador. */
export function Modal({ open, onClose, title, sheet = true, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${sheet ? 'sheet' : ''} print:hidden`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="mx-auto flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-head bg-sheet shadow-2xl wide:w-[min(30rem,92vw)] wide:rounded-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-head bg-head/50 px-5 py-3">
            <h2 id={titleId} className="text-base font-bold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid size-8 place-items-center rounded-full text-ink/70 transition hover:bg-head hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
        </div>
      )}
    </dialog>
  )
}
