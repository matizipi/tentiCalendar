import { addMonths, endOfYear, startOfYear } from 'date-fns'
import { CalendarRange, Trash2, Wand2 } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { DAY_LABELS, formatShort, generateDates, isRowEmpty, toIso } from '../lib/schedule'
import { useStore } from '../store/StoreContext'
import type { CourseSchedule } from '../types'
import { Modal } from './ui/Modal'

/** Atajos para fijar el rango (siempre arrancan hoy, salvo "Todo el año"). */
const RANGE_PRESETS: { id: string; label: string; make: (today: Date) => { from: string; to: string } }[] = [
  { id: '3m', label: '3 meses', make: (t) => ({ from: toIso(t), to: toIso(addMonths(t, 3)) }) },
  { id: '6m', label: '6 meses', make: (t) => ({ from: toIso(t), to: toIso(addMonths(t, 6)) }) },
  { id: '12m', label: '12 meses', make: (t) => ({ from: toIso(t), to: toIso(addMonths(t, 12)) }) },
  { id: 'eoy', label: 'Hasta fin de año', make: (t) => ({ from: toIso(t), to: toIso(endOfYear(t)) }) },
  { id: 'year', label: 'Todo el año', make: (t) => ({ from: toIso(startOfYear(t)), to: toIso(endOfYear(t)) }) },
]

function CourseConfigForm({ course }: { course: CourseSchedule }) {
  const { state, range, applyCourseConfig, dispatch, closeDialog, toast } = useStore()
  const uid = useId()
  const [name, setName] = useState(course.courseName)
  const [days, setDays] = useState<number[]>(course.selectedDaysOfWeek)
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const [removeEmpty, setRemoveEmpty] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const canDelete = state.courses.length > 1
  const rangeValid = !!from && !!to && from <= to

  const preview = useMemo(() => {
    const dates = rangeValid ? generateDates(days, from, to) : []
    const wanted = new Set(dates)
    const existing = new Set(course.rows.map((r) => r.date))
    return {
      total: dates.length,
      fresh: dates.filter((d) => !existing.has(d)).length,
      first: dates[0],
      last: dates[dates.length - 1],
      // Filas vacías que no coinciden con los días/rango elegidos (candidatas a limpiar).
      stale: course.rows.filter((r) => isRowEmpty(r) && !wanted.has(r.date)).length,
    }
  }, [course.rows, days, from, to, rangeValid])

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rangeValid) return
    const { added, removed } = applyCourseConfig(course.id, { name, days, from, to, removeEmpty })
    const parts = [
      added ? `${added} ${added === 1 ? 'fecha agregada' : 'fechas agregadas'}` : 'Configuración guardada',
      removed ? `${removed} ${removed === 1 ? 'fecha vacía quitada' : 'fechas vacías quitadas'}` : '',
    ].filter(Boolean)
    toast(parts.join(' · '))
    closeDialog()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <label htmlFor={`${uid}-name`} className="label">
          Nombre del curso
        </label>
        <input
          id={`${uid}-name`}
          className="field font-semibold uppercase"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <fieldset>
        <legend className="label">Días en los que se dicta</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map((d) => {
            const on = days.includes(d.value)
            return (
              <button
                key={d.value}
                type="button"
                aria-pressed={on}
                title={d.long}
                onClick={() => toggleDay(d.value)}
                className={`grid h-10 place-items-center rounded-lg border text-sm font-semibold transition ${
                  on
                    ? 'border-plum bg-plum text-white'
                    : 'border-field-border bg-white text-ink hover:border-plum/50'
                }`}
              >
                {d.short}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-xs text-ink/60">
          {days.length === 0
            ? 'Elegí al menos un día.'
            : DAY_LABELS.filter((d) => days.includes(d.value))
                .map((d) => d.long)
                .join(', ')}
        </p>
      </fieldset>

      <fieldset>
        <legend className="label">Rango de fechas a generar</legend>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rounded-full border border-head bg-head/40 px-3 py-1 text-xs font-semibold text-plum transition hover:bg-head"
              onClick={() => {
                const r = p.make(new Date())
                setFrom(r.from)
                setTo(r.to)
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${uid}-from`} className="label">
              Desde
            </label>
            <input
              id={`${uid}-from`}
              type="date"
              required
              className="field"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-to`} className="label">
              Hasta
            </label>
            <input
              id={`${uid}-to`}
              type="date"
              required
              className="field"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        {!rangeValid && <p className="mt-1.5 text-xs font-semibold text-hl-text">«Hasta» debe ser posterior a «Desde».</p>}
      </fieldset>

      <div className="rounded-xl border border-head bg-head/30 p-3 text-sm" aria-live="polite">
        <p className="flex items-center gap-2 font-semibold text-plum">
          <CalendarRange size={16} aria-hidden />
          {preview.total === 0
            ? 'Con esta configuración no se genera ninguna fecha'
            : `${preview.total} ${preview.total === 1 ? 'fecha' : 'fechas'} en el rango`}
        </p>
        {preview.total > 0 && (
          <p className="mt-1 text-xs text-ink/70">
            {formatShort(preview.first)} → {formatShort(preview.last)} ·{' '}
            {preview.fresh === 0
              ? 'todas ya existen en el cronograma'
              : `${preview.fresh} ${preview.fresh === 1 ? 'nueva' : 'nuevas'}, ${preview.total - preview.fresh} ya existían`}
          </p>
        )}
        {preview.stale > 0 && (
          <label className="mt-2.5 flex cursor-pointer items-start gap-2 text-xs text-ink/80 select-none">
            <input
              type="checkbox"
              className="mt-0.5 size-4"
              checked={removeEmpty}
              onChange={(e) => setRemoveEmpty(e.target.checked)}
            />
            <span>
              Quitar {preview.stale} {preview.stale === 1 ? 'fecha vacía' : 'fechas vacías'} que no coinciden con estos
              días/rango (las que tienen contenido no se tocan).
            </span>
          </label>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-ghost" onClick={closeDialog}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-plum" disabled={!rangeValid || !name.trim()}>
          <Wand2 size={16} />
          {preview.fresh > 0 ? `Guardar y generar ${preview.fresh}` : 'Guardar'}
        </button>
      </div>

      <div className="border-t border-head pt-4">
        <h3 className="label">Zona de peligro</h3>
        <button
          type="button"
          disabled={!canDelete}
          className="btn btn-danger w-full sm:w-auto"
          onClick={() => {
            if (!confirmDelete) return setConfirmDelete(true)
            dispatch({ type: 'deleteCourse', courseId: course.id })
            toast(`Curso ${course.courseName} eliminado`)
            closeDialog()
          }}
        >
          <Trash2 size={16} />
          {confirmDelete ? `¿Seguro? Eliminar con sus ${course.rows.length} fechas` : 'Eliminar curso'}
        </button>
        <p className="mt-1.5 text-xs text-ink/60">
          {canDelete
            ? 'Se borran el curso y todas sus fechas y contenidos. No se puede deshacer.'
            : 'Debe quedar al menos un curso: creá otro antes de eliminar este.'}
        </p>
      </div>
    </form>
  )
}

export function CourseConfigDialog() {
  const { dialog, closeDialog, activeCourse } = useStore()
  // Guard: activeCourse puede ser undefined durante la sincronización con Firebase.
  if (!activeCourse) return null
  return (
    <Modal open={dialog === 'courseConfig'} onClose={closeDialog} title={`Configurar ${activeCourse.courseName}`}>
      <CourseConfigForm key={activeCourse.id} course={activeCourse} />
    </Modal>
  )
}
