import { addDays, format, getDay, parseISO } from 'date-fns'
import type { LocalHoliday } from '../types'
import { OFFICIAL_2026 } from './holidaysData'

/** Misma clasificación que https://www.argentina.gob.ar/feriados (+ "local" cargado por el usuario). */
export type HolidayType = 'inamovible' | 'trasladable' | 'no_laborable' | 'turistico' | 'especial' | 'local'

export const HOLIDAY_TYPES: HolidayType[] = [
  'inamovible',
  'trasladable',
  'no_laborable',
  'turistico',
  'especial',
  'local',
]

export interface HolidayEntry {
  /** ISO yyyy-MM-dd. */
  date: string
  name: string
  type: HolidayType
  /** Detalle adicional (traslados, alcance regional, otras celebraciones del mismo día). */
  note?: string
  /** Día no laborable solo para ciertas comunidades: se informa pero no se marca solo. */
  optional?: boolean
}

/** Feriado resuelto para una fecha. */
export interface Holiday {
  name: string
  type: HolidayType
  note?: string
}

/** Nombre completo de cada tipo (leyenda). */
export const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  inamovible: 'Feriado inamovible',
  trasladable: 'Feriado trasladable',
  no_laborable: 'Día no laborable',
  turistico: 'Feriado turístico',
  especial: 'Feriado especial',
  local: 'Feriado local',
}

/** Prefijo corto para la insignia de cada fila ("Feriado: Navidad", "No laborable: Jueves Santo"…). */
const HOLIDAY_PREFIX: Record<HolidayType, string> = {
  inamovible: 'Feriado',
  trasladable: 'Feriado',
  no_laborable: 'No laborable',
  turistico: 'Turístico',
  especial: 'Feriado especial',
  local: 'Feriado local',
}

export const holidayLabel = (type: HolidayType | undefined, name: string) =>
  `${HOLIDAY_PREFIX[type ?? 'inamovible']}: ${name}`

/** Menor número = prioridad más alta cuando coinciden varias celebraciones el mismo día. */
const PRIORITY: Record<HolidayType, number> = {
  local: 0,
  inamovible: 1,
  trasladable: 2,
  especial: 3,
  turistico: 4,
  no_laborable: 5,
}

/* ───────────────────────── Registro por año ───────────────────────── */
const byYear = new Map<number, HolidayEntry[]>()
let index = new Map<string, HolidayEntry[]>()

function rebuild() {
  index = new Map()
  for (const list of byYear.values())
    for (const e of list) index.set(e.date, [...(index.get(e.date) ?? []), e])
}

export function registerHolidays(year: number, entries: HolidayEntry[]) {
  byYear.set(year, entries)
  rebuild()
}

/** Años con datos oficiales incluidos en la app (no se pisan con datos remotos). */
const OFFICIAL_YEARS = new Set([2026])

/* ───────────────────────── Reglas de traslado (Ley 27.399, art. 6) ───────────────────────── */
/** Martes/miércoles → lunes anterior; jueves/viernes → lunes siguiente; el resto no se mueve. */
export function shiftMovable(iso: string): string {
  const d = parseISO(iso)
  switch (getDay(d)) {
    case 2:
      return format(addDays(d, -1), 'yyyy-MM-dd')
    case 3:
      return format(addDays(d, -2), 'yyyy-MM-dd')
    case 4:
      return format(addDays(d, 4), 'yyyy-MM-dd')
    case 5:
      return format(addDays(d, 3), 'yyyy-MM-dd')
    default:
      return iso
  }
}

const dm = (iso: string) => format(parseISO(iso), 'd/M')

interface RawHoliday {
  fecha: string
  tipo: string
  nombre: string
}

/** Normaliza el formato de api.argentinadatos.com (aplicando traslados a los feriados trasladables). */
function fromRaw(raw: RawHoliday[]): HolidayEntry[] {
  return raw.map((r): HolidayEntry => {
    if (r.tipo === 'trasladable') {
      const date = shiftMovable(r.fecha)
      return {
        date,
        name: r.nombre.trim(),
        type: 'trasladable',
        ...(date !== r.fecha ? { note: `Trasladado desde el ${dm(r.fecha)}` } : {}),
      }
    }
    if (r.tipo === 'puente')
      return {
        date: r.fecha,
        name: 'Fin de semana largo',
        type: 'turistico',
        note: 'Día no laborable con fines turísticos',
      }
    return { date: r.fecha, name: r.nombre.trim(), type: 'inamovible' }
  })
}

/** Calendario 2027 de respaldo (Ley 27.399) por si no hay conexión; se reemplaza si la API responde. */
const FALLBACK_2027: RawHoliday[] = [
  { fecha: '2027-01-01', tipo: 'inamovible', nombre: 'Año Nuevo' },
  { fecha: '2027-02-08', tipo: 'inamovible', nombre: 'Carnaval' },
  { fecha: '2027-02-09', tipo: 'inamovible', nombre: 'Carnaval' },
  { fecha: '2027-03-24', tipo: 'inamovible', nombre: 'Día Nacional de la Memoria por la Verdad y la Justicia' },
  { fecha: '2027-03-26', tipo: 'inamovible', nombre: 'Viernes Santo' },
  { fecha: '2027-04-02', tipo: 'inamovible', nombre: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
  { fecha: '2027-05-01', tipo: 'inamovible', nombre: 'Día del Trabajador' },
  { fecha: '2027-05-25', tipo: 'inamovible', nombre: 'Día de la Revolución de Mayo' },
  { fecha: '2027-06-17', tipo: 'trasladable', nombre: 'Paso a la Inmortalidad del Gral. Martín Miguel de Güemes' },
  { fecha: '2027-06-20', tipo: 'inamovible', nombre: 'Paso a la Inmortalidad del Gral. Manuel Belgrano' },
  { fecha: '2027-07-09', tipo: 'inamovible', nombre: 'Día de la Independencia' },
  { fecha: '2027-08-17', tipo: 'trasladable', nombre: 'Paso a la Inmortalidad del Gral. José de San Martín' },
  { fecha: '2027-10-12', tipo: 'trasladable', nombre: 'Día del Respeto a la Diversidad Cultural' },
  { fecha: '2027-11-20', tipo: 'trasladable', nombre: 'Día de la Soberanía Nacional' },
  { fecha: '2027-12-08', tipo: 'inamovible', nombre: 'Inmaculada Concepción de María' },
  { fecha: '2027-12-25', tipo: 'inamovible', nombre: 'Navidad' },
]

registerHolidays(2026, OFFICIAL_2026.filter((e) => e.date.startsWith('2026')))
registerHolidays(2027, fromRaw(FALLBACK_2027))

/* ───────────────────────── Actualización remota (años sin dato oficial) ───────────────────────── */
const API = 'https://api.argentinadatos.com/v1/feriados'
const CACHE_PREFIX = 'cronograma-tentativo:holidays:'
const CACHE_TTL = 7 * 24 * 3600 * 1000

async function fetchYear(year: number): Promise<HolidayEntry[] | null> {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + year)
    if (cached) {
      const { at, data } = JSON.parse(cached) as { at: number; data: HolidayEntry[] }
      if (Date.now() - at < CACHE_TTL && Array.isArray(data)) return data
    }
  } catch {
    // caché ilegible: se vuelve a pedir
  }
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), 3500)
  try {
    const res = await fetch(`${API}/${year}`, { signal: ctrl.signal })
    if (!res.ok) return null
    const raw = (await res.json()) as RawHoliday[]
    if (!Array.isArray(raw) || raw.length === 0) return null
    const data = fromRaw(raw)
    try {
      localStorage.setItem(CACHE_PREFIX + year, JSON.stringify({ at: Date.now(), data }))
    } catch {
      // sin espacio: no pasa nada
    }
    return data
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/** Pide a la API los feriados de los años dados (salvo los oficiales ya incluidos). */
export async function refreshHolidays(years: number[]): Promise<void> {
  await Promise.all(
    years
      .filter((y) => !OFFICIAL_YEARS.has(y))
      .map(async (y) => {
        const data = await fetchYear(y)
        if (data) registerHolidays(y, data)
      }),
  )
}

/* ───────────────────────── Consulta ───────────────────────── */
const localEntries = (date: string, local?: LocalHoliday[]): HolidayEntry[] =>
  (local ?? []).filter((l) => l.date === date).map((l) => ({ date, name: l.name, type: 'local' }))

/** Feriado "principal" de una fecha (nacionales + locales cargados por el usuario). */
export function findHoliday(isoDate: string, local?: LocalHoliday[]): Holiday | undefined {
  const all = [...localEntries(isoDate, local), ...(index.get(isoDate) ?? [])].filter((e) => !e.optional)
  if (all.length === 0) return undefined
  const sorted = [...all].sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type])
  const [main, ...others] = sorted
  const notes = [main.note, ...others.map((o) => (o.type === 'no_laborable' ? `${o.name} (día no laborable)` : o.name))]
  const note = notes.filter(Boolean).join(' · ')
  return { name: main.name, type: main.type, ...(note ? { note } : {}) }
}

/** Días no laborables solo para ciertas comunidades (se informan, no se marcan solos). */
export function findNotices(isoDate: string): HolidayEntry[] {
  return (index.get(isoDate) ?? []).filter((e) => e.optional)
}
