import { useStore } from '../../store/StoreContext'

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 desk:bottom-8 print:hidden"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="max-w-md rounded-xl bg-title px-4 py-2.5 text-sm font-medium text-white shadow-xl [animation:toast-in_0.2s_ease-out]"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
