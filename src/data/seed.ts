import type { AppState, ContentBlock, CourseSchedule, ScheduleRow } from '../types'

const b = (id: string, text: string, isHighlighted?: boolean): ContentBlock => ({
  id,
  text,
  ...(isHighlighted ? { isHighlighted } : {}),
})

const nivelVRows: ScheduleRow[] = [
  {
    id: 'v-1019',
    date: '2026-10-19',
    isHoliday: false,
    blocks: [b('v-1019-a', '19/10 → Comienzo ciencia ficción: Apocalipsis')],
  },
  {
    id: 'v-1026',
    date: '2026-10-26',
    isHoliday: false,
    blocks: [b('v-1026-a', '2/11 → El eternauta')],
  },
  {
    id: 'v-1109',
    date: '2026-11-09',
    isHoliday: false,
    blocks: [b('v-1109-a', '9/11 → Ver si viene el Papa', true)],
  },
  {
    id: 'v-0324',
    date: '2026-03-24',
    isHoliday: true,
    holidayName: 'Día de la Memoria',
    blocks: [
      b('v-0324-a', 'No hay clases presenciales'),
      b('v-0324-b', '24/03 → Comienzo ciencia ficción: Apocalipsis'),
    ],
  },
  {
    id: 'v-0402',
    date: '2026-04-02',
    isHoliday: true,
    holidayName: 'Malvinas',
    blocks: [b('v-0402-a', 'Leer material online')],
  },
]

const nivelIVRows: ScheduleRow[] = [
  {
    id: 'iv-1020',
    date: '2026-10-20',
    isHoliday: false,
    blocks: [b('iv-1020-a', '')],
  },
]

export function createSeedState(): AppState {
  const courses: CourseSchedule[] = [
    { id: 'nivel-v', courseName: 'NIVEL V', selectedDaysOfWeek: [1, 2, 3], rows: nivelVRows },
    { id: 'nivel-iv', courseName: 'NIVEL IV', selectedDaysOfWeek: [2], rows: nivelIVRows },
  ]
  return { version: 1, courses, activeCourseId: 'nivel-v', showHolidays: true }
}

/** Fila que arranca con la barra "+ Añadir otro contenido…" desplegada. */
export const SEED_ACTIVE_ROW_ID = 'v-1019'
