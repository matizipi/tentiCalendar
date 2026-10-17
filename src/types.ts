import type { HolidayType } from './data/holidays'

export interface ContentBlock {
  id: string
  text: string
  /** Resalta el bloque en rosa pastel (exámenes, eventos especiales…). */
  isHighlighted?: boolean
}

export interface ScheduleRow {
  id: string
  /** ISO "YYYY-MM-DD" (se muestra como "DD/MM"). */
  date: string
  isHoliday: boolean
  /** Nombre sin prefijo, ej: "Día de la Memoria" (la UI antepone "Feriado: "). */
  holidayName?: string
  /** Clasificación oficial del feriado (inamovible, trasladable, turístico, local…). */
  holidayType?: HolidayType
  /** true si el docente marcó/editó el feriado a mano (no se recalcula al cambiar la fecha). */
  holidayManual?: boolean
  blocks: ContentBlock[]
}

export interface CourseSchedule {
  id: string
  courseName: string
  /** 0 = domingo … 6 = sábado (convención de date-fns / Date#getDay). */
  selectedDaysOfWeek: number[]
  /** Rango (ISO) con el que se generan las fechas del curso; si falta se usa uno por defecto. */
  rangeFrom?: string
  rangeTo?: string
  rows: ScheduleRow[]
}

/** Feriado propio de la ciudad/provincia/institución, cargado a mano. */
export interface LocalHoliday {
  id: string
  /** ISO "YYYY-MM-DD". */
  date: string
  name: string
}

export interface AppState {
  version: 1
  courses: CourseSchedule[]
  activeCourseId: string
  showHolidays: boolean
  localHolidays?: LocalHoliday[]
}
