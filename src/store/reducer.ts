import { arrayMove } from '@dnd-kit/sortable'
import { findHoliday } from '../data/holidays'
import { emptyBlock, sortRowsByDate, syncRowHoliday, uid } from '../lib/schedule'
import type { AppState, ContentBlock, CourseSchedule, LocalHoliday, ScheduleRow } from '../types'

export type Action =
  | { type: 'replace'; state: AppState }
  | { type: 'addCourse'; id: string; name: string }
  | { type: 'renameCourse'; courseId: string; name: string }
  | { type: 'deleteCourse'; courseId: string }
  | { type: 'setActiveCourse'; courseId: string }
  | { type: 'setShowHolidays'; value: boolean }
  | { type: 'addLocalHoliday'; holiday: LocalHoliday }
  | { type: 'removeLocalHoliday'; id: string }
  | { type: 'syncHolidays' }
  | { type: 'setDays'; courseId: string; days: number[] }
  | {
      type: 'configureCourse'
      courseId: string
      patch: { name?: string; days?: number[]; from?: string; to?: string }
      rows?: ScheduleRow[]
    }
  | { type: 'insertRows'; courseId: string; rows: ScheduleRow[]; index?: number }
  | { type: 'updateRowDate'; rowId: string; date: string }
  | { type: 'setRowHoliday'; rowId: string; isHoliday: boolean; name?: string }
  | { type: 'deleteRow'; rowId: string }
  | { type: 'duplicateRow'; rowId: string; newId: string }
  | { type: 'moveRow'; courseId: string; from: number; to: number }
  | { type: 'sortRows'; courseId: string }
  | { type: 'addBlock'; rowId: string; afterBlockId?: string; block: ContentBlock }
  | { type: 'updateBlockText'; rowId: string; blockId: string; text: string }
  | { type: 'toggleHighlight'; rowId: string; blockId: string }
  | { type: 'deleteBlock'; rowId: string; blockId: string }
  | { type: 'moveBlock'; rowId: string; from: number; to: number }

const mapCourse = (s: AppState, courseId: string, fn: (c: CourseSchedule) => CourseSchedule): AppState => ({
  ...s,
  courses: s.courses.map((c) => (c.id === courseId ? fn(c) : c)),
})

const mapRow = (s: AppState, rowId: string, fn: (r: ScheduleRow) => ScheduleRow): AppState => ({
  ...s,
  courses: s.courses.map((c) =>
    c.rows.some((r) => r.id === rowId) ? { ...c, rows: c.rows.map((r) => (r.id === rowId ? fn(r) : r)) } : c,
  ),
})

const withSyncedHolidays = (s: AppState): AppState => ({
  ...s,
  courses: s.courses.map((c) => ({ ...c, rows: c.rows.map((r) => syncRowHoliday(r, s.localHolidays)) })),
})

export function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'replace':
      return a.state

    case 'addCourse':
      return {
        ...state,
        courses: [...state.courses, { id: a.id, courseName: a.name, selectedDaysOfWeek: [], rows: [] }],
        activeCourseId: a.id,
      }

    case 'renameCourse':
      return mapCourse(state, a.courseId, (c) => ({ ...c, courseName: a.name }))

    case 'deleteCourse': {
      if (state.courses.length <= 1) return state
      const courses = state.courses.filter((c) => c.id !== a.courseId)
      return {
        ...state,
        courses,
        activeCourseId: state.activeCourseId === a.courseId ? courses[0].id : state.activeCourseId,
      }
    }

    case 'setActiveCourse':
      return state.courses.some((c) => c.id === a.courseId) ? { ...state, activeCourseId: a.courseId } : state

    case 'setShowHolidays':
      return { ...state, showHolidays: a.value }

    case 'addLocalHoliday':
      return withSyncedHolidays({ ...state, localHolidays: [...(state.localHolidays ?? []), a.holiday] })

    case 'removeLocalHoliday':
      return withSyncedHolidays({
        ...state,
        localHolidays: (state.localHolidays ?? []).filter((h) => h.id !== a.id),
      })

    case 'syncHolidays':
      return withSyncedHolidays(state)

    case 'setDays':
      return mapCourse(state, a.courseId, (c) => ({ ...c, selectedDaysOfWeek: [...a.days].sort() }))

    case 'configureCourse':
      return mapCourse(state, a.courseId, (c) => ({
        ...c,
        ...(a.patch.name !== undefined ? { courseName: a.patch.name } : {}),
        ...(a.patch.days ? { selectedDaysOfWeek: [...a.patch.days].sort() } : {}),
        ...(a.patch.from ? { rangeFrom: a.patch.from } : {}),
        ...(a.patch.to ? { rangeTo: a.patch.to } : {}),
        ...(a.rows ? { rows: a.rows } : {}),
      }))

    case 'insertRows':
      return mapCourse(state, a.courseId, (c) => {
        const at = a.index ?? c.rows.length
        return { ...c, rows: [...c.rows.slice(0, at), ...a.rows, ...c.rows.slice(at)] }
      })

    case 'updateRowDate':
      return mapRow(state, a.rowId, (r) => syncRowHoliday({ ...r, date: a.date }, state.localHolidays))

    case 'setRowHoliday':
      return mapRow(state, a.rowId, (r) => {
        const { holidayName: _drop, holidayType: _type, ...rest } = r
        if (!a.isHoliday) {
          // Si coincide con un feriado nacional y se desmarcó, se respeta la decisión manual.
          return { ...rest, isHoliday: false, holidayManual: true }
        }
        const found = findHoliday(r.date, state.localHolidays)
        const name = a.name ?? found?.name ?? 'Feriado'
        return { ...rest, isHoliday: true, holidayName: name, holidayManual: true }
      })

    case 'deleteRow':
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.rows.some((r) => r.id === a.rowId) ? { ...c, rows: c.rows.filter((r) => r.id !== a.rowId) } : c,
        ),
      }

    case 'duplicateRow':
      return {
        ...state,
        courses: state.courses.map((c) => {
          const i = c.rows.findIndex((r) => r.id === a.rowId)
          if (i === -1) return c
          const src = c.rows[i]
          const copy: ScheduleRow = {
            ...src,
            id: a.newId,
            blocks: src.blocks.map((b) => ({ ...b, id: uid() })),
          }
          return { ...c, rows: [...c.rows.slice(0, i + 1), copy, ...c.rows.slice(i + 1)] }
        }),
      }

    case 'moveRow':
      return mapCourse(state, a.courseId, (c) => ({ ...c, rows: arrayMove(c.rows, a.from, a.to) }))

    case 'sortRows':
      return mapCourse(state, a.courseId, (c) => ({ ...c, rows: sortRowsByDate(c.rows) }))

    case 'addBlock':
      return mapRow(state, a.rowId, (r) => {
        const i = a.afterBlockId ? r.blocks.findIndex((b) => b.id === a.afterBlockId) : r.blocks.length - 1
        const at = i === -1 ? r.blocks.length : i + 1
        return { ...r, blocks: [...r.blocks.slice(0, at), a.block, ...r.blocks.slice(at)] }
      })

    case 'updateBlockText':
      return mapRow(state, a.rowId, (r) => ({
        ...r,
        blocks: r.blocks.map((b) => (b.id === a.blockId ? { ...b, text: a.text } : b)),
      }))

    case 'toggleHighlight':
      return mapRow(state, a.rowId, (r) => ({
        ...r,
        blocks: r.blocks.map((b) => (b.id === a.blockId ? { ...b, isHighlighted: !b.isHighlighted } : b)),
      }))

    case 'deleteBlock':
      return mapRow(state, a.rowId, (r) => {
        const blocks = r.blocks.filter((b) => b.id !== a.blockId)
        // Una fecha siempre conserva al menos un bloque (vacío) donde escribir.
        return { ...r, blocks: blocks.length ? blocks : [emptyBlock()] }
      })

    case 'moveBlock':
      return mapRow(state, a.rowId, (r) => ({ ...r, blocks: arrayMove(r.blocks, a.from, a.to) }))

    default:
      return state
  }
}
