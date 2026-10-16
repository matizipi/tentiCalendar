import { CalendarPlus, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { CourseSelect } from './Filters'
import { ArFlag } from './ui/ArFlag'

/** Barra rápida bajo el título (solo < desktop): curso compacto + chip de feriados. */
export function MobileStatusBar() {
  const { state, dispatch } = useStore()
  const on = state.showHolidays
  return (
    <div className="mt-3 flex items-center justify-between gap-3 desk:hidden print:hidden">
      <div className="w-36">
        <CourseSelect compact />
      </div>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => dispatch({ type: 'setShowHolidays', value: !on })}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
          on ? 'border-hl-border bg-hl text-hl-text' : 'border-field-border bg-white text-ink/60'
        }`}
      >
        <ArFlag size={14} />
        Feriados AR {on ? 'Activos' : 'Inactivos'}
      </button>
    </div>
  )
}

/** Barra inferior fija con las dos acciones principales (solo < desktop). */
export function BottomActionBar() {
  const { openDialog } = useStore()
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-3 border-t border-head bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(104_59_94/0.35)] backdrop-blur-md desk:hidden print:hidden">
      <button type="button" className="btn btn-plum" onClick={() => openDialog('addDate')}>
        <CalendarPlus size={17} />
        Agregar Fecha
      </button>
      <button type="button" className="btn btn-plum" onClick={() => openDialog('filters')}>
        <SlidersHorizontal size={17} />
        Filtros
      </button>
    </div>
  )
}
