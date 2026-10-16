/** Feriados nacionales de Argentina 2026 (clave ISO → nombre). */
export interface Holiday {
  name: string
  /** Detalle adicional (ej. coincidencias con otras celebraciones). */
  note?: string
}

export const HOLIDAYS_AR_2026: Record<string, Holiday> = {
  '2026-01-01': { name: 'Año Nuevo' },
  '2026-02-16': { name: 'Carnaval' },
  '2026-02-17': { name: 'Carnaval' },
  '2026-03-24': { name: 'Día de la Memoria' },
  '2026-04-02': { name: 'Malvinas', note: 'Día del Veterano y de los Caídos en Malvinas · Jueves Santo' },
  '2026-04-03': { name: 'Viernes Santo' },
  '2026-05-01': { name: 'Día del Trabajador' },
  '2026-05-25': { name: 'Revolución de Mayo' },
  '2026-06-17': { name: 'Paso a la Inmortalidad de Güemes' },
  '2026-06-20': { name: 'Día de la Bandera' },
  '2026-07-09': { name: 'Día de la Independencia' },
  '2026-08-17': { name: 'Paso a la Inmortalidad de San Martín' },
  '2026-10-12': { name: 'Día del Respeto a la Diversidad Cultural' },
  '2026-11-20': { name: 'Día de la Soberanía Nacional' },
  '2026-12-08': { name: 'Inmaculada Concepción' },
  '2026-12-25': { name: 'Navidad' },
}

export function findHoliday(isoDate: string): Holiday | undefined {
  return HOLIDAYS_AR_2026[isoDate]
}
