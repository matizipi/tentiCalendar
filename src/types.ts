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
  /** true si el docente marcó/editó el feriado a mano (no se recalcula al cambiar la fecha). */
  holidayManual?: boolean
  blocks: ContentBlock[]
}

export interface CourseSchedule {
  id: string
  courseName: string
  /** 0 = domingo … 6 = sábado (convención de date-fns / Date#getDay). */
  selectedDaysOfWeek: number[]
  rows: ScheduleRow[]
}

export interface AppState {
  version: 1
  courses: CourseSchedule[]
  activeCourseId: string
  showHolidays: boolean
}
