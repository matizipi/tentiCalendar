import { isValid, parseISO } from 'date-fns'
import { HOLIDAY_TYPES, type HolidayType } from '../data/holidays'
import { createSeedState } from '../data/seed'
import type { AppState, ContentBlock, CourseSchedule, LocalHoliday, ScheduleRow } from '../types'

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
    ...(HOLIDAY_TYPES.includes(v.holidayType as HolidayType) ? { holidayType: v.holidayType as HolidayType } : {}),
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
  const validIso = (s: unknown): s is string => typeof s === 'string' && isValid(parseISO(s))
  return {
    id: v.id,
    courseName: v.courseName,
    selectedDaysOfWeek: days,
    ...(validIso(v.rangeFrom) ? { rangeFrom: v.rangeFrom } : {}),
    ...(validIso(v.rangeTo) ? { rangeTo: v.rangeTo } : {}),
    rows,
  }
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
  const localHolidays = Array.isArray(raw.localHolidays)
    ? raw.localHolidays.flatMap((h): LocalHoliday[] =>
        isObj(h) && typeof h.id === 'string' && typeof h.name === 'string' && typeof h.date === 'string' && isValid(parseISO(h.date))
          ? [{ id: h.id, date: h.date, name: h.name }]
          : [],
      )
    : []
  return {
    version: 1,
    courses,
    activeCourseId,
    showHolidays: raw.showHolidays !== false,
    localHolidays,
  }
}

// ---------------------------------------------------------------------------
// IDataProvider abstraction – allows swapping between localStorage and Firebase.
// ---------------------------------------------------------------------------
export interface IDataProvider {
  load(): Promise<AppState>
  save(state: AppState): Promise<void>
}

// ---------- Local storage implementation (fallback) ----------
class LocalProvider implements IDataProvider {
  async load(): Promise<AppState> {
    try {
      const txt = localStorage.getItem(STORAGE_KEY)
      if (txt) return parseState(JSON.parse(txt))
    } catch {
      // fall through to seed
    }
    return createSeedState()
  }
  async save(state: AppState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }
}

// ---------- Firebase implementation ----------
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

class FirebaseProvider implements IDataProvider {
  private readonly local = new LocalProvider()
  private readonly ref = doc(db, 'schedules', 'default')

  async load(): Promise<AppState> {
    try {
      const snap = await getDoc(this.ref)
      if (snap.exists()) return parseState(snap.data())
      // Primera vez: usar lo que hubiera en localStorage (o el seed) y subirlo.
      const initial = await this.local.load()
      await this.save(initial)
      return initial
    } catch (err) {
      console.error('Firestore no disponible, usando localStorage', err)
      return this.local.load()
    }
  }
  async save(state: AppState): Promise<void> {
    // Copia local siempre, por si Firestore falla.
    await this.local.save(state)
    try {
      // JSON round-trip: Firestore rechaza valores `undefined`.
      await setDoc(this.ref, JSON.parse(JSON.stringify(state)))
    } catch (err) {
      console.error('No se pudo guardar en Firestore', err)
    }
  }
}

// Export a singleton that selects Firebase if config is present, otherwise Local.
export const dataProvider: IDataProvider = (() => {
  return import.meta.env.VITE_FIREBASE_API_KEY ? new FirebaseProvider() : new LocalProvider()
})()

// ---------------------------------------------------------------------------
// Legacy helper functions – delegate to dataProvider.
// ---------------------------------------------------------------------------
export async function loadState(): Promise<AppState> {
  return dataProvider.load()
}

export async function saveState(state: AppState): Promise<void> {
  return dataProvider.save(state)
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
