import type { HolidayEntry } from './holidays'

/**
 * Feriados nacionales 2026 tal como los publica el Gobierno argentino
 * (https://www.argentina.gob.ar/feriados · holidays-2026-es.json, actualizado 02/10/2026).
 * Las entradas `optional` son días no laborables para comunidades puntuales (no se marcan solas).
 */
export const OFFICIAL_2026: HolidayEntry[] = [
  { date: "2026-01-01", name: "Año Nuevo", type: "inamovible" },
  { date: "2026-02-16", name: "Carnaval", type: "inamovible" },
  { date: "2026-02-17", name: "Carnaval", type: "inamovible" },
  { date: "2026-03-20", name: "Fiesta de la Ruptura del Ayuno del Sagrado Mes de Ramadán", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión islámica (Ley 27.399, fecha aproximada)" },
  { date: "2026-03-23", name: "Fin de semana largo", type: "turistico", note: "Día no laborable con fines turísticos" },
  { date: "2026-03-24", name: "Día Nacional de la Memoria por la Verdad y la Justicia", type: "inamovible" },
  { date: "2026-04-02", name: "Día del Veterano y de los Caídos en la Guerra de Malvinas", type: "inamovible" },
  { date: "2026-04-02", name: "Jueves Santo", type: "no_laborable" },
  { date: "2026-04-03", name: "Viernes Santo", type: "inamovible" },
  { date: "2026-04-02", name: "Primeros dos días de la Pascua Judía", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión judía (Ley 27.399)" },
  { date: "2026-04-03", name: "Primeros dos días de la Pascua Judía", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión judía (Ley 27.399)" },
  { date: "2026-04-08", name: "Últimos dos días de la Pascua Judía", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión judía (Ley 27.399)" },
  { date: "2026-04-09", name: "Últimos dos días de la Pascua Judía", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión judía (Ley 27.399)" },
  { date: "2026-04-24", name: "Día de acción por la tolerancia y el respeto entre los pueblos", type: "no_laborable", optional: true, note: "Día de conmemoración armenia (Ley 26.199): optativo para la comunidad armenia" },
  { date: "2026-05-01", name: "Día del Trabajador", type: "inamovible" },
  { date: "2026-05-25", name: "Día de la Revolución de Mayo", type: "inamovible" },
  { date: "2026-05-27", name: "Fiesta del Sacrificio", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión islámica (Ley 27.399, fecha aproximada)" },
  { date: "2026-06-15", name: "Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes", type: "trasladable", note: "Trasladado desde el 17/6" },
  { date: "2026-06-17", name: "Año Nuevo Islámico", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión islámica (Ley 27.399, fecha aproximada)" },
  { date: "2026-06-20", name: "Paso a la Inmortalidad del Gral. Manuel Belgrano", type: "inamovible" },
  { date: "2026-07-09", name: "Día de la Independencia", type: "inamovible" },
  { date: "2026-07-10", name: "Fin de semana largo", type: "turistico", note: "Día no laborable con fines turísticos" },
  { date: "2026-08-17", name: "Paso a la Inmortalidad del Gral. José de San Martín", type: "trasladable" },
  { date: "2026-09-12", name: "Año Nuevo Judío", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión judía (Ley 27.399)" },
  { date: "2026-09-13", name: "Año Nuevo Judío", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión judía (Ley 27.399)" },
  { date: "2026-09-21", name: "Día del Perdón", type: "no_laborable", optional: true, note: "Solo para quienes profesan la religión judía (Ley 27.399)" },
  { date: "2026-10-12", name: "Día de la Raza (Respeto a la Diversidad Cultural)", type: "trasladable" },
  { date: "2026-11-09", name: "Visita de Su Santidad el Papa León XIV", type: "inamovible" },
  { date: "2026-11-10", name: "Visita de Su Santidad el Papa León XIV", type: "especial", note: "Feriado en Córdoba y Ciudad Autónoma de Buenos Aires" },
  { date: "2026-11-11", name: "Visita de Su Santidad el Papa León XIV", type: "especial", note: "Feriado en Provincia de Buenos Aires" },
  { date: "2026-11-23", name: "Día de la Soberanía Nacional", type: "trasladable", note: "Trasladado desde el 20/11" },
  { date: "2026-12-07", name: "Fin de semana largo", type: "turistico", note: "Día no laborable con fines turísticos" },
  { date: "2026-12-08", name: "Inmaculada Concepción de María", type: "inamovible" },
  { date: "2026-12-25", name: "Navidad", type: "inamovible" },
]
