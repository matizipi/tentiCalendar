import { CalendarPlus, ChevronDown, Wand2 } from 'lucide-react'
import { useId, useMemo } from 'react'
import { DAY_LABELS, PRESETS, formatShort, generateDates } from '../lib/schedule'
import { useStore } from '../store/StoreContext'

export function CourseSelect({ compact = false, id }: { compact?: boolean; id?: string }) {
  const { state, activeCourse, dispatch, openDialog } = useStore()
  const autoId = useId()
  return (
    <div className="relative">
      <select
        id={id ?? autoId}
        aria-label="Curso"
        value={activeCourse.id}
        onChange={(e) => {
          if (e.target.value === '__new__') {
            openDialog('courses')
            return
          }
          dispatch({ type: 'setActiveCourse', courseId: e.target.value })
          document.getElementById(`course-${e.target.value}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        className={[
          'w-full appearance-none rounded-lg border border-field-border bg-white font-medium text-ink outline-none transition',
          'focus:border-plum focus:ring-2 focus:ring-plum/40',
          compact ? 'py-1.5 pr-8 pl-3 text-sm' : 'py-2 pr-9 pl-3 text-sm',
        ].join(' ')}
      >
        {state.courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.courseName}
          </option>
        ))}
        <option value="__new__">+ Crear curso…</option>
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink/60"
        aria-hidden
      />
    </div>
  )
}

/** Tarjeta "Curso + Filtros del año": selector, patrones de días, rango y generación de fechas. */
export function FiltersCard() {
  const { activeCourse, dispatch, range, setRange, generate, openDialog, closeDialog, toast, dialog } = useStore()
  const uid = useId()
  const days = activeCourse.selectedDaysOfWeek

  const preview = useMemo(() => {
    const existing = new Set(activeCourse.rows.map((r) => r.date))
    const all = generateDates(days, range.from, range.to)
    return { total: all.length, fresh: all.filter((d) => !existing.has(d)).length }
  }, [activeCourse.rows, days, range.from, range.to])

  const setDays = (next: number[]) => dispatch({ type: 'setDays', courseId: activeCourse.id, days: next })

  const togglePreset = (presetDays: number[]) => {
    const all = presetDays.every((d) => days.includes(d))
    setDays(all ? days.filter((d) => !presetDays.includes(d)) : [...new Set([...days, ...presetDays])])
  }

  const toggleDay = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])

  const onGenerate = () => {
    const { added, skipped } = generate(activeCourse.id, days, range.from, range.to)
    toast(
      added === 0
        ? 'No hay fechas nuevas para ese rango y días'
        : `Se agregaron ${added} ${added === 1 ? 'fecha' : 'fechas'}${skipped ? ` (${skipped} ya existían)` : ''}`,
    )
    if (dialog === 'filters' && added > 0) closeDialog()
  }

  return (
    <div className="card">
      <label htmlFor={`${uid}-course`} className="mb-1.5 block text-base font-bold text-ink">
        Curso
      </label>
      <CourseSelect id={`${uid}-course`} />

      <h3 className="mt-4 mb-2 text-base font-bold text-ink">Filtros del año</h3>
      <div className="flex flex-col gap-1.5">
        {PRESETS.map((p) => {
          const checked = p.days.every((d) => days.includes(d))
          return (
            <label key={p.id} className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePreset(p.days)}
                className="size-[18px] cursor-pointer rounded"
              />
              {p.label}
            </label>
          )
        })}
      </div>

      <details className="group mt-3 rounded-lg border border-head/80 bg-head/20" open={dialog === 'filters'}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-plum select-none [&::-webkit-details-marker]:hidden">
          <span>Días y rango personalizados</span>
          <ChevronDown size={16} className="transition group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-3 border-t border-head/80 p-3">
          <fieldset>
            <legend className="label">Días de cursada</legend>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((d) => {
                const on = days.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={on}
                    title={d.long}
                    onClick={() => toggleDay(d.value)}
                    className={`grid h-9 flex-1 place-items-center rounded-lg border text-sm font-semibold transition ${
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
          </fieldset>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${uid}-from`} className="label">
                Desde
              </label>
              <input
                id={`${uid}-from`}
                type="date"
                className="field"
                value={range.from}
                max={range.to}
                onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-to`} className="label">
                Hasta
              </label>
              <input
                id={`${uid}-to`}
                type="date"
                className="field"
                value={range.to}
                min={range.from}
                onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })}
              />
            </div>
          </div>
        </div>
      </details>

      <button
        type="button"
        onClick={onGenerate}
        disabled={days.length === 0 || preview.fresh === 0}
        className="btn btn-ghost mt-3 w-full"
      >
        <Wand2 size={16} />
        {days.length === 0
          ? 'Elegí días para generar'
          : preview.fresh === 0
            ? 'Sin fechas nuevas'
            : `Generar ${preview.fresh} ${preview.fresh === 1 ? 'fecha' : 'fechas'}`}
      </button>
      <p className="mt-1.5 text-center text-xs text-ink/55">
        {formatShort(range.from)} → {formatShort(range.to)}
      </p>

      <button type="button" className="btn btn-plum mt-3 w-full" onClick={() => openDialog('addDate')}>
        <CalendarPlus size={16} />
        Agregar Fecha
      </button>
    </div>
  )
}

/** Tarjeta de feriados nacionales con toggle. */
export function HolidayCard() {
  const { state, dispatch } = useStore()
  return (
    <div className="card">
      <h3 className="text-base font-bold text-ink">Feriados (Arg. 2026)</h3>
      <label className="mt-2.5 flex cursor-pointer items-center gap-3 select-none">
        <span className="relative inline-flex h-6 w-11 shrink-0">
          <input
            type="checkbox"
            role="switch"
            checked={state.showHolidays}
            onChange={(e) => dispatch({ type: 'setShowHolidays', value: e.target.checked })}
            className="peer absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-full opacity-0"
          />
          <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-plum peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-plum" />
          <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
        <span className="text-sm leading-tight font-medium text-ink">Mostrar feriados nacionales</span>
      </label>
    </div>
  )
}
