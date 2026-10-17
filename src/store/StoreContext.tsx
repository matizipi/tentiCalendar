import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SEED_ACTIVE_ROW_ID } from '../data/seed'
import {
  emptyBlock,
  generateDates,
  insertIndexFor,
  isRowEmpty,
  makeRow,
  mergeGenerated,
  nextDateAfter,
  toIso,
  uid,
} from '../lib/schedule'
import { loadState, saveState } from '../lib/storage'
import type { AppState, CourseSchedule, ScheduleRow } from '../types'
import { reducer, type Action } from './reducer'

export type DialogName = 'addDate' | 'filters' | 'courses' | 'settings' | 'courseConfig'

export interface DateRange {
  from: string
  to: string
}

function defaultRange(): DateRange {
  const today = new Date()
  const from = toIso(today)
  const end = `${today.getFullYear()}-12-18`
  return { from, to: end >= from ? end : `${today.getFullYear()}-12-31` }
}

export interface Toast {
  id: number
  message: string
}

interface StoreValue {
  state: AppState
  dispatch: (a: Action) => void
  activeCourse: CourseSchedule
  activeRowId: string | null
  setActiveRowId: (id: string | null) => void
  /** Bloque que debe recibir foco en su próximo render (tras crearlo). */
  focusBlockId: string | null
  focusBlock: (id: string) => void
  clearFocusBlock: () => void
  dialog: DialogName | null
  openDialog: (d: DialogName) => void
  closeDialog: () => void
  editingRowId: string | null
  setEditingRowId: (id: string | null) => void
  range: DateRange
  setRange: (r: DateRange) => void
  toasts: Toast[]
  toast: (message: string) => void

  addDate: (courseId: string, date: string) => string
  addBlock: (rowId: string, afterBlockId?: string) => void
  generate: (courseId: string, days: number[], from: string, to: string) => { added: number; skipped: number }
  /** Guarda nombre, días y rango del curso y genera las fechas que falten. */
  applyCourseConfig: (
    courseId: string,
    cfg: { name: string; days: number[]; from: string; to: string; removeEmpty: boolean },
  ) => { added: number; removed: number }
  appendBlankRow: (courseId: string) => void
  duplicateLastRow: (courseId: string) => void
  duplicateRow: (rowId: string) => void
  createCourse: (name: string) => void
}

const Ctx = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatchRaw] = useReducer(reducer, undefined, (): AppState => ({
    version: 1,
    courses: [],
    activeCourseId: '',
    showHolidays: true,
  }));
  const [loaded, setLoaded] = useState(false)
  // La fila 19/10 del seed arranca "activa" para mostrar la barra desplegada.
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  // Load persisted state (localStorage or Firebase) once on mount.
  useEffect(() => {
    let cancelled = false
    loadState().then((s) => {
      if (cancelled) return
      dispatchRaw({ type: 'replace', state: s })
      if (s.courses.some((c) => c.rows.some((r) => r.id === SEED_ACTIVE_ROW_ID))) {
        setActiveRowId(SEED_ACTIVE_ROW_ID)
      }
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  useEffect(() => {
    if (loaded) void saveState(state)
  }, [state, loaded]);

  // Siempre apuntamos al estado más reciente dentro de los helpers sin recrearlos.
  const stateRef = useRef(state)
  stateRef.current = state

  const dispatch = useCallback((a: Action) => dispatchRaw(a), [])

  const toast = useCallback((message: string) => {
    const id = ++toastSeq.current
    setToasts((t) => [...t.slice(-2), { id, message }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const findCourse = (id: string) => stateRef.current.courses.find((c) => c.id === id)

  const addDate = useCallback((courseId: string, date: string) => {
    const course = findCourse(courseId)
    if (!course) return ''
    const row = makeRow(date)
    dispatchRaw({ type: 'insertRows', courseId, rows: [row], index: insertIndexFor(course.rows, date) })
    dispatchRaw({ type: 'setActiveCourse', courseId })
    setActiveRowId(row.id)
    setFocusBlockId(row.blocks[0].id)
    return row.id
  }, [])

  const addBlock = useCallback((rowId: string, afterBlockId?: string) => {
    const block = emptyBlock()
    dispatchRaw({ type: 'addBlock', rowId, afterBlockId, block })
    setActiveRowId(rowId)
    setFocusBlockId(block.id)
  }, [])

  const generate = useCallback((courseId: string, days: number[], from: string, to: string) => {
    const course = findCourse(courseId)
    if (!course) return { added: 0, skipped: 0 }
    const existing = new Set(course.rows.map((r) => r.date))
    const dates = generateDates(days, from, to)
    const rows: ScheduleRow[] = dates.filter((d) => !existing.has(d)).map((d) => makeRow(d))
    dispatchRaw({
      type: 'configureCourse',
      courseId,
      patch: { days, from, to },
      rows: mergeGenerated(course.rows, rows),
    })
    return { added: rows.length, skipped: dates.length - rows.length }
  }, [])

  const applyCourseConfig = useCallback<StoreValue['applyCourseConfig']>((courseId, cfg) => {
    const course = findCourse(courseId)
    if (!course) return { added: 0, removed: 0 }
    const dates = generateDates(cfg.days, cfg.from, cfg.to)
    const wanted = new Set(dates)
    let kept = course.rows
    if (cfg.removeEmpty) kept = kept.filter((r) => !isRowEmpty(r) || wanted.has(r.date))
    const existing = new Set(kept.map((r) => r.date))
    const fresh = dates.filter((d) => !existing.has(d)).map((d) => makeRow(d))
    dispatchRaw({
      type: 'configureCourse',
      courseId,
      patch: { name: cfg.name.trim().toUpperCase() || course.courseName, days: cfg.days, from: cfg.from, to: cfg.to },
      rows: mergeGenerated(kept, fresh),
    })
    return { added: fresh.length, removed: course.rows.length - kept.length }
  }, [])

  const appendBlankRow = useCallback((courseId: string) => {
    const course = findCourse(courseId)
    if (!course) return
    const row = makeRow(nextDateAfter(course.rows, course.selectedDaysOfWeek))
    dispatchRaw({ type: 'insertRows', courseId, rows: [row] })
    setActiveRowId(row.id)
    setFocusBlockId(row.blocks[0].id)
  }, [])

  const duplicateRow = useCallback((rowId: string) => {
    dispatchRaw({ type: 'duplicateRow', rowId, newId: uid() })
  }, [])

  const duplicateLastRow = useCallback((courseId: string) => {
    const course = findCourse(courseId)
    if (!course) return
    const last = course.rows[course.rows.length - 1]
    const date = nextDateAfter(course.rows, course.selectedDaysOfWeek)
    const base = makeRow(
      date,
      last ? last.blocks.map((b) => ({ ...b, id: uid() })) : undefined,
    )
    dispatchRaw({ type: 'insertRows', courseId, rows: [base] })
    setActiveRowId(base.id)
  }, [])

  const createCourse = useCallback((name: string) => {
    const clean = name.trim()
    if (!clean) return
    dispatchRaw({ type: 'addCourse', id: uid(), name: clean.toUpperCase() })
  }, [])

  const activeCourse = state.courses.find((c) => c.id === state.activeCourseId) ?? state.courses[0]

  // El rango es propio de cada curso (con un valor por defecto si todavía no se configuró).
  const rangeFrom = activeCourse?.rangeFrom
  const rangeTo = activeCourse?.rangeTo
  const activeCourseId = activeCourse?.id
  const range = useMemo<DateRange>(() => {
    const d = defaultRange()
    return { from: rangeFrom ?? d.from, to: rangeTo ?? d.to }
  }, [rangeFrom, rangeTo])
  const setRange = useCallback(
    (r: DateRange) => {
      if (activeCourseId)
        dispatchRaw({ type: 'configureCourse', courseId: activeCourseId, patch: { from: r.from, to: r.to } })
    },
    [activeCourseId],
  )

  const value = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      activeCourse,
      activeRowId,
      setActiveRowId,
      focusBlockId,
      focusBlock: setFocusBlockId,
      clearFocusBlock: () => setFocusBlockId(null),
      dialog,
      openDialog: setDialog,
      closeDialog: () => setDialog(null),
      editingRowId,
      setEditingRowId,
      range,
      setRange,
      toasts,
      toast,
      addDate,
      addBlock,
      generate,
      applyCourseConfig,
      appendBlankRow,
      duplicateLastRow,
      duplicateRow,
      createCourse,
    }),
    [
      state,
      dispatch,
      activeCourse,
      activeRowId,
      focusBlockId,
      dialog,
      editingRowId,
      range,
      setRange,
      toasts,
      toast,
      addDate,
      addBlock,
      generate,
      applyCourseConfig,
      appendBlankRow,
      duplicateLastRow,
      duplicateRow,
      createCourse,
    ],
  )

  if (!loaded || !activeCourse) {
    return (
      <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center' }}>
        Cargando cronograma…
      </div>
    )
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return v
}
