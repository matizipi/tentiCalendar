import {
  addDays,
  eachDayOfInterval,
  format,
  getDay,
  isValid,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { findHoliday } from '../data/holidays'
import type { ContentBlock, ScheduleRow } from '../types'

export const ISO = 'yyyy-MM-dd'

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const toIso = (d: Date) => format(d, ISO)

export function formatShort(iso: string): string {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'dd/MM') : '--/--'
}

export function formatLong(iso: string): string {
  const d = parseISO(iso)
  return isValid(d) ? format(d, "EEEE d 'de' MMMM yyyy", { locale: es }) : 'Fecha inválida'
}

export function weekdayShort(iso: string): string {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'EEE', { locale: es }).replace('.', '') : ''
}

export const emptyBlock = (text = '', isHighlighted = false): ContentBlock => ({
  id: uid(),
  text,
  ...(isHighlighted ? { isHighlighted } : {}),
})

/** Crea una fila cruzando la fecha con el diccionario de feriados. */
export function makeRow(date: string, blocks?: ContentBlock[]): ScheduleRow {
  const h = findHoliday(date)
  return {
    id: uid(),
    date,
    isHoliday: !!h,
    ...(h ? { holidayName: h.name } : {}),
    blocks: blocks ?? [emptyBlock()],
  }
}

/** Días de la semana (0-6) → fechas ISO dentro del rango [from, to]. */
export function generateDates(days: number[], from: string, to: string): string[] {
  const start = parseISO(from)
  const end = parseISO(to)
  if (!isValid(start) || !isValid(end) || start > end || days.length === 0) return []
  return eachDayOfInterval({ start, end })
    .filter((d) => days.includes(getDay(d)))
    .map(toIso)
}

/** Siguiente fecha "natural" después de la última fila (próximo día de cursada o +7). */
export function nextDateAfter(rows: ScheduleRow[], days: number[]): string {
  const valid = rows.map((r) => parseISO(r.date)).filter(isValid)
  if (valid.length === 0) return toIso(new Date())
  const last = rows.length ? parseISO(rows[rows.length - 1].date) : valid[valid.length - 1]
  const base = isValid(last) ? last : valid[valid.length - 1]
  if (days.length > 0) {
    for (let i = 1; i <= 7; i++) {
      const c = addDays(base, i)
      if (days.includes(getDay(c))) return toIso(c)
    }
  }
  return toIso(addDays(base, 7))
}

/** Índice donde insertar una fecha manteniendo el orden si la lista ya está ordenada. */
export function insertIndexFor(rows: ScheduleRow[], date: string): number {
  const sorted = rows.every((r, i) => i === 0 || rows[i - 1].date <= r.date)
  if (!sorted) return rows.length
  const idx = rows.findIndex((r) => r.date > date)
  return idx === -1 ? rows.length : idx
}

export function sortRowsByDate(rows: ScheduleRow[]): ScheduleRow[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))
}

export const DAY_LABELS: { value: number; short: string; long: string }[] = [
  { value: 1, short: 'Lu', long: 'Lunes' },
  { value: 2, short: 'Ma', long: 'Martes' },
  { value: 3, short: 'Mi', long: 'Miércoles' },
  { value: 4, short: 'Ju', long: 'Jueves' },
  { value: 5, short: 'Vi', long: 'Viernes' },
]

export const PRESETS: { id: string; label: string; days: number[] }[] = [
  { id: 'tue', label: 'Todos los Martes', days: [2] },
  { id: 'monwed', label: 'Lunes y Miércoles', days: [1, 3] },
]
