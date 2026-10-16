import { Copy, Download, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { findHoliday } from '../data/holidays'
import { createSeedState } from '../data/seed'
import { formatLong, nextDateAfter } from '../lib/schedule'
import { exportJson, parseState } from '../lib/storage'
import { useStore } from '../store/StoreContext'
import { FiltersCard, HolidayCard } from './Filters'
import { Modal } from './ui/Modal'

/* ───────────────────────── Agregar fecha ───────────────────────── */
function AddDateForm() {
  const { state, activeCourse, addDate, closeDialog, toast } = useStore()
  const [courseId, setCourseId] = useState(activeCourse.id)
  const course = state.courses.find((c) => c.id === courseId) ?? activeCourse
  const [date, setDate] = useState(() => nextDateAfter(activeCourse.rows, activeCourse.selectedDaysOfWeek))
  const holiday = date ? findHoliday(date) : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!date) return
    const rowId = addDate(course.id, date)
    closeDialog()
    toast(`Fecha agregada a ${course.courseName}`)
    window.setTimeout(
      () => document.getElementById(`row-${rowId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      80,
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="add-course" className="label">
          Curso
        </label>
        <select id="add-course" className="field" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {state.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.courseName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="add-date" className="label">
          Fecha
        </label>
        <input id="add-date" type="date" required autoFocus className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && (
          <p className="mt-1.5 text-sm text-ink/70 capitalize first-letter:uppercase">{formatLong(date)}</p>
        )}
        {holiday && (
          <p className="mt-2 rounded-lg border border-hl-border bg-hl px-3 py-2 text-sm font-semibold text-hl-text">
            Feriado: {holiday.name}
            <span className="block text-xs font-normal">Se agrega igual: podés planificar contenido ese día.</span>
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={closeDialog}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-plum">
          <Plus size={16} /> Agregar fecha
        </button>
      </div>
    </form>
  )
}

export function AddDateDialog() {
  const { dialog, closeDialog } = useStore()
  return (
    <Modal open={dialog === 'addDate'} onClose={closeDialog} title="Agregar fecha">
      <AddDateForm />
    </Modal>
  )
}

/* ───────────────────────── Editar fila ───────────────────────── */
function EditRowForm({ rowId }: { rowId: string }) {
  const { state, dispatch, duplicateRow, setEditingRowId, toast } = useStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const row = state.courses.flatMap((c) => c.rows).find((r) => r.id === rowId)
  if (!row) return null
  const close = () => setEditingRowId(null)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="edit-date" className="label">
          Fecha
        </label>
        <input
          id="edit-date"
          type="date"
          className="field"
          value={row.date}
          onChange={(e) => e.target.value && dispatch({ type: 'updateRowDate', rowId, date: e.target.value })}
        />
        <p className="mt-1.5 text-sm text-ink/70 first-letter:uppercase">{formatLong(row.date)}</p>
      </div>

      <div className="rounded-xl border border-hl-border/70 bg-hl/40 p-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-hl-text select-none">
          <input
            type="checkbox"
            checked={row.isHoliday}
            className="size-[18px]"
            onChange={(e) =>
              dispatch({ type: 'setRowHoliday', rowId, isHoliday: e.target.checked, name: row.holidayName })
            }
          />
          Marcar como feriado
        </label>
        {row.isHoliday && (
          <div className="mt-2.5">
            <label htmlFor="edit-holiday" className="label">
              Nombre del feriado
            </label>
            <input
              id="edit-holiday"
              type="text"
              className="field"
              value={row.holidayName ?? ''}
              placeholder="Ej: Día no laborable"
              onChange={(e) => dispatch({ type: 'setRowHoliday', rowId, isHoliday: true, name: e.target.value })}
            />
          </div>
        )}
        <p className="mt-2 text-xs text-ink/60">
          Las fechas que coinciden con un feriado nacional se marcan solas. La fila nunca se bloquea.
        </p>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              duplicateRow(rowId)
              toast('Fila duplicada')
              close()
            }}
          >
            <Copy size={16} /> Duplicar
          </button>
          {confirmDelete ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                dispatch({ type: 'deleteRow', rowId })
                toast('Fila eliminada')
                close()
              }}
            >
              <Trash2 size={16} /> ¿Seguro? Eliminar
            </button>
          ) : (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} /> Eliminar
            </button>
          )}
        </div>
        <button type="button" className="btn btn-plum" onClick={close}>
          Listo
        </button>
      </div>
    </div>
  )
}

export function EditRowDialog() {
  const { editingRowId, setEditingRowId } = useStore()
  return (
    <Modal open={!!editingRowId} onClose={() => setEditingRowId(null)} title="Editar fecha">
      {editingRowId && <EditRowForm key={editingRowId} rowId={editingRowId} />}
    </Modal>
  )
}

/* ───────────────────────── Cursos ───────────────────────── */
function CoursesForm() {
  const { state, dispatch, createCourse, toast } = useStore()
  const [name, setName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2">
        {state.courses.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <input
              aria-label={`Nombre del curso ${c.courseName}`}
              className="field font-semibold uppercase"
              value={c.courseName}
              onChange={(e) => dispatch({ type: 'renameCourse', courseId: c.id, name: e.target.value })}
            />
            <button
              type="button"
              disabled={state.courses.length <= 1}
              onClick={() => {
                if (pendingDelete === c.id) {
                  dispatch({ type: 'deleteCourse', courseId: c.id })
                  setPendingDelete(null)
                  toast('Curso eliminado')
                } else setPendingDelete(c.id)
              }}
              aria-label={`Eliminar curso ${c.courseName}`}
              title={state.courses.length <= 1 ? 'Debe quedar al menos un curso' : 'Eliminar curso'}
              className={`btn shrink-0 px-3 ${pendingDelete === c.id ? 'btn-danger' : 'btn-ghost'}`}
            >
              <Trash2 size={16} />
              {pendingDelete === c.id && <span>¿Seguro?</span>}
            </button>
          </li>
        ))}
      </ul>

      <form
        className="border-t border-head pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          createCourse(name)
          setName('')
          toast('Curso creado')
        }}
      >
        <label htmlFor="new-course" className="label">
          Nuevo curso
        </label>
        <div className="flex gap-2">
          <input
            id="new-course"
            autoFocus
            className="field"
            placeholder="Ej: NIVEL III"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-plum shrink-0" disabled={!name.trim()}>
            <Plus size={16} /> Crear
          </button>
        </div>
      </form>
    </div>
  )
}

export function CoursesDialog() {
  const { dialog, closeDialog } = useStore()
  return (
    <Modal open={dialog === 'courses'} onClose={closeDialog} title="Cursos">
      <CoursesForm />
    </Modal>
  )
}

/* ───────────────────────── Ajustes (exportar / importar) ───────────────────────── */
function SettingsForm() {
  const { state, dispatch, toast, closeDialog } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const next = parseState(JSON.parse(await file.text()))
      dispatch({ type: 'replace', state: next })
      toast(`Importado: ${next.courses.length} ${next.courses.length === 1 ? 'curso' : 'cursos'}`)
      closeDialog()
    } catch (err) {
      toast(`No se pudo importar: ${err instanceof Error ? err.message : 'archivo inválido'}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink/70">
        Tus cronogramas se guardan automáticamente en este navegador (<code>localStorage</code>). Exportalos a JSON
        para respaldarlos o llevarlos a otra computadora.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" className="btn btn-plum" onClick={() => exportJson(state)}>
          <Download size={16} /> Exportar JSON
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Importar JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => onImport(e.target.files?.[0])}
        />
      </div>
      <div className="border-t border-head pt-4">
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                dispatch({ type: 'replace', state: createSeedState() })
                toast('Datos de ejemplo restaurados')
                closeDialog()
              }}
            >
              <RotateCcw size={16} /> Sí, reemplazar todo
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Restaurar datos de ejemplo
          </button>
        )}
      </div>
    </div>
  )
}

export function SettingsDialog() {
  const { dialog, closeDialog } = useStore()
  return (
    <Modal open={dialog === 'settings'} onClose={closeDialog} title="Ajustes">
      <SettingsForm />
    </Modal>
  )
}

/* ───────────────────────── Filtros (bottom sheet mobile) ───────────────────────── */
export function FiltersSheet() {
  const { dialog, closeDialog } = useStore()
  return (
    <Modal open={dialog === 'filters'} onClose={closeDialog} title="Filtros">
      <div className="flex flex-col gap-4 [&_.card]:border-0 [&_.card]:p-0 [&_.card]:shadow-none">
        <FiltersCard />
        <HolidayCard />
      </div>
    </Modal>
  )
}
