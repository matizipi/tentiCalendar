import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowDownUp, CalendarPlus, Plus } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import type { CourseSchedule } from '../types'
import { RowItem } from './RowItem'

export function CourseTable({ course }: { course: CourseSchedule }) {
  const { state, dispatch, appendBlankRow, duplicateLastRow, openDialog, toast } = useStore()
  const isActive = state.activeCourseId === course.id

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = course.rows.findIndex((r) => r.id === active.id)
    const to = course.rows.findIndex((r) => r.id === over.id)
    if (from > -1 && to > -1) dispatch({ type: 'moveRow', courseId: course.id, from, to })
  }

  const select = () => {
    if (!isActive) dispatch({ type: 'setActiveCourse', courseId: course.id })
  }

  const headingId = `course-title-${course.id}`

  return (
    <section
      id={`course-${course.id}`}
      aria-labelledby={headingId}
      onFocusCapture={select}
      onPointerDownCapture={select}
      className="scroll-mt-6"
    >
      <div
        className={[
          'wide:overflow-hidden wide:rounded-2xl wide:border wide:bg-white wide:shadow-md wide:shadow-plum/10',
          isActive ? 'wide:border-plum/30' : 'wide:border-head',
        ].join(' ')}
      >
        {/* Cabecera del curso */}
        <header className="course-head mb-3 flex items-center justify-between gap-3 rounded-xl bg-head px-4 py-2.5 text-ink wide:mb-0 wide:rounded-none">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 id={headingId} className="truncate text-lg font-bold tracking-wide uppercase">
              {course.courseName}
            </h2>
            {isActive && (
              <span className="rounded-full bg-plum px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase print:hidden">
                Activo
              </span>
            )}
            <span className="hidden text-xs text-ink/60 sm:inline print:hidden">
              {course.rows.length} {course.rows.length === 1 ? 'fecha' : 'fechas'}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 print:hidden">
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'sortRows', courseId: course.id })
                toast('Fechas ordenadas cronológicamente')
              }}
              title="Ordenar por fecha"
              aria-label={`Ordenar por fecha ${course.courseName}`}
              className="grid size-8 place-items-center rounded-lg text-ink/70 transition hover:bg-white/70 hover:text-ink"
            >
              <ArrowDownUp size={16} />
            </button>
            <button
              type="button"
              onClick={() => duplicateLastRow(course.id)}
              disabled={course.rows.length === 0}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink/80 transition hover:bg-white/70 hover:text-ink disabled:opacity-40"
            >
              <Plus size={15} /> Duplicar filas
            </button>
          </div>
        </header>

        {/* Encabezado de columnas (desktop / impresión) */}
        <div className="course-head hidden grid-cols-[9.5rem_minmax(0,1fr)] border-t border-white/70 bg-head/60 text-[15px] font-semibold wide:grid">
          <div className="px-3 py-2.5 text-center">Fechas</div>
          <div className="border-l border-white/70 px-4 py-2.5">Contenido / Planificación</div>
        </div>

        {course.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-head bg-white px-6 py-10 text-center wide:rounded-none wide:border-0">
            <CalendarPlus className="text-plum/60" size={28} />
            <p className="max-w-xs text-sm text-ink/70">
              Este curso todavía no tiene fechas. Generalas desde <strong>Filtros del año</strong> o agregá una a mano.
            </p>
            <div className="flex gap-2 print:hidden">
              <button type="button" className="btn btn-plum" onClick={() => openDialog('addDate')}>
                Agregar fecha
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => openDialog('filters')}>
                Filtros
              </button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={course.rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <ol className="flex flex-col gap-3 wide:gap-0">
                {course.rows.map((row) => (
                  <RowItem key={row.id} row={row} />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="mt-2 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => appendBlankRow(course.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-plum transition hover:bg-head/60"
        >
          <Plus size={16} /> Añadir / duplicar filas
        </button>
      </div>
    </section>
  )
}
