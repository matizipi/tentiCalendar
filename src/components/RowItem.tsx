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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Plus } from 'lucide-react'
import { findHoliday } from '../data/holidays'
import { formatLong, formatShort, weekdayShort } from '../lib/schedule'
import { useStore } from '../store/StoreContext'
import type { ScheduleRow } from '../types'
import { BlockEditor } from './BlockEditor'

export function RowItem({ row }: { row: ScheduleRow }) {
  const { state, dispatch, activeRowId, setActiveRowId, addBlock, setEditingRowId, focusBlock } = useStore()
  const active = activeRowId === row.id
  const showHoliday = state.showHolidays && row.isHoliday
  const holidayName = showHoliday ? row.holidayName?.trim() || 'Feriado' : undefined
  const holidayNote = showHoliday ? findHoliday(row.date)?.note : undefined

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onBlocksDragEnd = ({ active: a, over }: DragEndEvent) => {
    if (!over || a.id === over.id) return
    const from = row.blocks.findIndex((b) => b.id === a.id)
    const to = row.blocks.findIndex((b) => b.id === over.id)
    if (from > -1 && to > -1) dispatch({ type: 'moveBlock', rowId: row.id, from, to })
  }

  const onDatePress = () => {
    if (active) {
      setEditingRowId(row.id)
    } else {
      setActiveRowId(row.id)
      focusBlock(row.blocks[0].id)
    }
  }

  const dateLabel = `${formatLong(row.date)}${showHoliday ? ` (feriado: ${holidayName})` : ''}`

  return (
    <li
      ref={setNodeRef}
      id={`row-${row.id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-active={active}
      data-holiday={showHoliday}
      className={[
        'row-item group/row relative scroll-mt-24 overflow-hidden rounded-xl border bg-white shadow-sm',
        'wide:scroll-mt-6 wide:rounded-none wide:border-0 wide:border-t wide:border-pill-border wide:shadow-none wide:first:border-t-0',
        active ? 'border-plum/40 ring-1 ring-plum/20 wide:bg-[#fcf9fd] wide:ring-0' : 'border-pill-border',
        isDragging ? 'z-30 opacity-90 shadow-2xl ring-2 ring-plum/40' : '',
        'print:bg-white',
      ].join(' ')}
    >
      <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] wide:grid-cols-[9.5rem_minmax(0,1fr)]">
        {/* ── Columna fecha: franja vertical en mobile / pastilla en desktop ── */}
        <div
          className={[
            'flex flex-col items-center justify-center gap-0.5 border-r py-2',
            'wide:flex-row wide:items-start wide:justify-start wide:gap-1.5 wide:border-0 wide:bg-transparent wide:px-3 wide:py-3',
            showHoliday ? 'border-hl-border bg-hl' : 'border-pill-border bg-pill',
          ].join(' ')}
        >
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar la fecha ${formatShort(row.date)}`}
            title="Arrastrar para reordenar la fecha"
            className="grid h-5 w-8 shrink-0 cursor-grab touch-none place-items-center rounded text-slate-400 transition hover:text-plum active:cursor-grabbing wide:mt-1.5 wide:h-6 wide:w-4 print:hidden"
          >
            <GripVertical size={16} className="rotate-90 wide:rotate-0" />
          </button>

          <button
            type="button"
            onClick={onDatePress}
            aria-label={`${dateLabel}. ${active ? 'Editar fecha' : 'Seleccionar fecha'}`}
            title={active ? 'Editar fecha' : formatLong(row.date)}
            className={[
              'flex flex-col items-center justify-center leading-tight transition',
              'wide:h-9 wide:w-[4.5rem] wide:rounded-lg wide:border wide:border-pill-border wide:bg-pill wide:shadow-pill',
              'wide:hover:border-plum/50 wide:hover:bg-white',
              active ? 'wide:border-plum/60' : '',
            ].join(' ')}
          >
            <span className="text-base font-semibold text-pill-text tabular-nums wide:text-sm">
              {formatShort(row.date)}
            </span>
            {showHoliday ? (
              <span className="text-center text-[11px] font-semibold text-hl-text wide:hidden">Feriado Nacional</span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500 capitalize wide:hidden print:hidden">
                {weekdayShort(row.date)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setEditingRowId(row.id)}
            aria-label={`Editar fecha ${formatShort(row.date)}`}
            title="Editar fecha / feriado"
            className={[
              'hidden size-6 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-head/70 hover:text-plum print:hidden!',
              'group-data-[active=true]/row:grid wide:mt-1.5 wide:group-hover/row:grid',
            ].join(' ')}
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* ── Columna contenido: N bloques apilados + barra de agregar ── */}
        <div className="flex min-w-0 flex-col gap-2 p-2 wide:p-3" data-blocks>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onBlocksDragEnd}
          >
            <SortableContext items={row.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {row.blocks.map((block, i) => (
                <BlockEditor
                  key={block.id}
                  rowId={row.id}
                  date={row.date}
                  block={block}
                  index={i}
                  total={row.blocks.length}
                  holidayName={i === 0 ? holidayName : undefined}
                  holidayNote={holidayNote}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="add-bar print:hidden">
            <div>
              <div className="flex items-stretch gap-2 pt-0.5">
                <div className="flex min-w-0 flex-1 items-center rounded-lg border border-pill-border bg-slate-100/80 text-sm text-slate-600">
                  <button
                    type="button"
                    onClick={() => addBlock(row.id)}
                    className="hidden flex-1 items-center gap-1.5 truncate rounded-l-lg px-3 py-1.5 text-left transition hover:bg-slate-200/70 wide:flex"
                  >
                    <Plus size={14} /> Añadir otro contenido…
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock(row.id)}
                    className="flex flex-1 items-center justify-end gap-1.5 rounded-lg px-3 py-1.5 font-medium transition hover:bg-slate-200/70 wide:flex-none wide:rounded-l-none"
                  >
                    <Plus size={14} className="wide:block" /> Agregar bloque
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => addBlock(row.id)}
                  aria-label="Agregar bloque"
                  className="grid size-8 shrink-0 place-items-center self-center rounded-md bg-plum text-white shadow-sm transition hover:bg-plum-dark active:scale-95 wide:hidden"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
