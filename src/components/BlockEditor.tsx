import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Highlighter, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { formatShort } from '../lib/schedule'
import { useStore } from '../store/StoreContext'
import type { ContentBlock } from '../types'

// `CSS` (dnd-kit) hace sombra al global: la detección usa window.CSS explícitamente.
const SUPPORTS_FIELD_SIZING =
  typeof window !== 'undefined' && !!window.CSS?.supports && window.CSS.supports('field-sizing', 'content')

interface Props {
  rowId: string
  date: string
  block: ContentBlock
  index: number
  total: number
  /** Nombre del feriado: se muestra como insignia a la izquierda del input (solo desktop/impresión). */
  holidayName?: string
  holidayNote?: string
}

export function BlockEditor({ rowId, date, block, index, total, holidayName, holidayNote }: Props) {
  const { dispatch, addBlock, focusBlock, focusBlockId, clearFocusBlock, setActiveRowId } = useStore()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  // Foco programático tras crear un bloque (Shift+Enter / botón).
  useEffect(() => {
    if (focusBlockId === block.id) {
      taRef.current?.focus({ preventScroll: false })
      clearFocusBlock()
    }
  }, [focusBlockId, block.id, clearFocusBlock])

  // Fallback de auto-altura para navegadores sin `field-sizing: content`.
  useLayoutEffect(() => {
    if (SUPPORTS_FIELD_SIZING) return
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [block.text])

  const hl = !!block.isHighlighted
  const label = `Contenido del ${formatShort(date)}, bloque ${index + 1} de ${total}`

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={[
        'group/block relative flex items-stretch overflow-hidden rounded-lg border text-sm transition-colors',
        'focus-within:ring-2 focus-within:ring-plum/50',
        hl
          ? 'border-hl-border bg-hl text-hl-text'
          : 'border-field-border bg-white text-ink focus-within:border-plum',
        isDragging ? 'z-20 opacity-80 shadow-xl' : '',
      ].join(' ')}
    >
      {holidayName && (
        <span
          title={holidayNote}
          className="hidden shrink-0 items-center border-r border-hl-border bg-hl px-3 text-sm font-semibold whitespace-nowrap text-hl-text wide:flex"
        >
          Feriado: {holidayName}
        </span>
      )}

      <textarea
        ref={taRef}
        rows={1}
        value={block.text}
        placeholder="Escribí el contenido de la clase…"
        aria-label={label}
        spellCheck
        onFocus={() => setActiveRowId(rowId)}
        onChange={(e) => dispatch({ type: 'updateBlockText', rowId, blockId: block.id, text: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            addBlock(rowId, block.id)
          } else if (e.key === 'Backspace' && block.text === '' && total > 1) {
            e.preventDefault()
            dispatch({ type: 'deleteBlock', rowId, blockId: block.id })
            // Devuelve el foco al bloque anterior (o al siguiente si era el primero).
            const sibling = taRef.current
              ?.closest('[data-blocks]')
              ?.querySelectorAll<HTMLElement>('[data-block-id]')
            if (sibling) {
              const ids = Array.from(sibling).map((n) => n.dataset.blockId as string)
              const i = ids.indexOf(block.id)
              const target = ids[i > 0 ? i - 1 : i + 1]
              if (target) focusBlock(target)
            }
          }
        }}
        data-block-id={block.id}
        className={[
          'autosize min-w-0 flex-1 bg-transparent px-3 py-2 leading-snug outline-none placeholder:text-slate-400',
          hl ? 'font-semibold placeholder:text-hl-text/50' : '',
          'wide:pr-[5.75rem] focus:pr-[5.75rem]',
          'print:placeholder:text-transparent',
        ].join(' ')}
      />

      <div
        className={[
          'absolute top-1 right-1 flex items-center gap-0.5 rounded-md bg-white/85 p-0.5 backdrop-blur-sm transition-opacity print:hidden',
          hl ? 'bg-hl/90' : '',
          'opacity-0 group-focus-within/block:opacity-100 group-hover/block:opacity-100',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => dispatch({ type: 'toggleHighlight', rowId, blockId: block.id })}
          aria-pressed={hl}
          aria-label={hl ? 'Quitar resaltado' : 'Resaltar bloque en rosa'}
          title={hl ? 'Quitar resaltado' : 'Resaltar (examen / evento especial)'}
          className={`grid size-7 place-items-center rounded transition ${
            hl ? 'bg-rasp text-white' : 'text-rasp-dark hover:bg-hl'
          }`}
        >
          <Highlighter size={15} />
        </button>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Reordenar bloque (arrastrá o usá espacio y flechas)"
          title="Arrastrar para reordenar"
          className="grid size-7 cursor-grab touch-none place-items-center rounded text-slate-500 transition hover:bg-head/70 active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'deleteBlock', rowId, blockId: block.id })}
          aria-label="Eliminar bloque"
          title="Eliminar bloque"
          className="grid size-7 place-items-center rounded text-slate-500 transition hover:bg-hl hover:text-hl-text"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
