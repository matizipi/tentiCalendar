import { isValid, parseISO } from 'date-fns'
import { createSeedState } from '../data/seed'
import type { AppState, ContentBlock, CourseSchedule, ScheduleRow } from '../types'

/** Clave versionada: lista para migrar o reemplazar por una API/base de datos. */
export const STORAGE_KEY = 'cronograma-tentativo:v1'

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function sanitizeBlock(v: unknown): ContentBlock | null {
  if (!isObj(v) || typeof v.id !== 'string') return null
  return {
    id: v.id,
    text: typeof v.text === 'string' ? v.text : '',
    ...(v.isHighlighted ? { isHighlighted: true } : {}),
  }
}

function sanitizeRow(v: unknown): ScheduleRow | null {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.date !== 'string') return null
  if (!isValid(parseISO(v.date))) return null
  const blocks = Array.isArray(v.blocks)
    ? (v.blocks.map(sanitizeBlock).filter(Boolean) as ContentBlock[])
    : []
  return {
    id: v.id,
    date: v.date,
    isHoliday: !!v.isHoliday,
    ...(typeof v.holidayName === 'string' ? { holidayName: v.holidayName } : {}),
    ...(v.holidayManual ? { holidayManual: true } : {}),
    blocks: blocks.length ? blocks : [{ id: `${v.id}-b`, text: '' }],
  }
}

function sanitizeCourse(v: unknown): CourseSchedule | null {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.courseName !== 'string') return null
  const days = Array.isArray(v.selectedDaysOfWeek)
    ? v.selectedDaysOfWeek.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6)
    : []
  const rows = Array.isArray(v.rows) ? (v.rows.map(sanitizeRow).filter(Boolean) as ScheduleRow[]) : []
  return { id: v.id, courseName: v.courseName, selectedDaysOfWeek: days, rows }
}

/** Valida y normaliza un JSON importado/guardado. Lanza si no es un cronograma válido. */
export function parseState(raw: unknown): AppState {
  if (!isObj(raw) || !Array.isArray(raw.courses)) throw new Error('Formato inválido')
  const courses = raw.courses.map(sanitizeCourse).filter(Boolean) as CourseSchedule[]
  if (courses.length === 0) throw new Error('El archivo no contiene cursos')
  const activeCourseId =
    typeof raw.activeCourseId === 'string' && courses.some((c) => c.id === raw.activeCourseId)
      ? raw.activeCourseId
      : courses[0].id
  return {
    version: 1,
    courses,
    activeCourseId,
    showHolidays: raw.showHolidays !== false,
  }
}

export function loadState(): AppState {
  try {
    const txt = localStorage.getItem(STORAGE_KEY)
    if (txt) return parseState(JSON.parse(txt))
  } catch {
    /* datos corruptos → seed */
  }
  return createSeedState()
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* cuota llena o modo privado: la app sigue funcionando en memoria */
  }
}

export function exportJson(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cronograma-tentativo-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
