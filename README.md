# Cronograma Tentativo

Planificador docente por fechas, cursos y bloques de contenido, con los feriados nacionales de Argentina 2026.

React + Vite + TypeScript · Tailwind CSS v4 · date-fns (es) · @dnd-kit · lucide-react.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Estructura

| Ruta | Contenido |
| --- | --- |
| `src/types.ts` | Modelo de datos (`ContentBlock`, `ScheduleRow`, `CourseSchedule`) |
| `src/data/holidays.ts` | Feriados AR 2026 · `src/data/seed.ts` datos de ejemplo |
| `src/lib/schedule.ts` | Generación de fechas recurrentes y utilidades |
| `src/lib/storage.ts` | `localStorage` + exportar/importar JSON (único punto a reemplazar por una API/DB) |
| `src/store/` | Reducer + contexto (acciones de alto nivel) |
| `src/components/` | UI: tabla, filas, bloques, filtros, diálogos, barras mobile |

## Notas

- **Layout responsivo en una sola estructura DOM**: tabla en ≥768px y al imprimir (variante `wide`), tarjetas en mobile.
- **Impresión**: `window.print()` + `@media print` ocultan navegación, filtros, controles y barras; los rosas pastel se conservan (`print-color-adjust: exact`).
- **Atajos**: `Shift + Enter` agrega un bloque debajo; `Backspace` en un bloque vacío lo elimina.
