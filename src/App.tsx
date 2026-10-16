import { AddDateDialog, CoursesDialog, EditRowDialog, FiltersSheet, SettingsDialog } from './components/Dialogs'
import { CourseTable } from './components/CourseTable'
import { FiltersCard, HolidayCard } from './components/Filters'
import { Header } from './components/Header'
import { BottomActionBar, MobileStatusBar } from './components/MobileBars'
import { SideNav } from './components/SideNav'
import { Toasts } from './components/ui/Toasts'
import { StoreProvider, useStore } from './store/StoreContext'

function Workspace() {
  const { state } = useStore()
  return (
    <div className="relative min-h-dvh overflow-x-clip print:overflow-visible">
      {/* Hojas de cuaderno decorativas (no se imprimen) */}
      <div aria-hidden className="paper -top-10 -right-24 hidden h-80 w-72 rotate-6 opacity-70 desk:block" />
      <div aria-hidden className="paper -bottom-16 -left-20 hidden h-72 w-80 -rotate-3 opacity-60 desk:block" />

      <div className="relative z-10 mx-auto max-w-[1360px] desk:p-6 print:max-w-none print:p-0">
        <div className="desk:grid desk:grid-cols-[4rem_minmax(0,1fr)] desk:overflow-hidden desk:rounded-2xl desk:bg-sheet desk:shadow-lg desk:shadow-plum/15 print:block print:shadow-none">
          <SideNav />

          <div className="px-4 pt-5 pb-28 desk:px-8 desk:pt-6 desk:pb-10 print:p-0">
            <Header />
            <MobileStatusBar />

            <div className="mt-6 desk:mt-8 desk:grid desk:grid-cols-[280px_minmax(0,1fr)] desk:items-start desk:gap-7 print:block">
              <aside
                aria-label="Filtros y feriados"
                className="sticky top-6 hidden flex-col gap-4 desk:flex print:hidden"
              >
                <FiltersCard />
                <HolidayCard />
              </aside>

              <main className="flex min-w-0 flex-col gap-7 print:gap-6">
                {state.courses.map((course) => (
                  <CourseTable key={course.id} course={course} />
                ))}
              </main>
            </div>
          </div>
        </div>
      </div>

      <BottomActionBar />
      <FiltersSheet />
      <AddDateDialog />
      <EditRowDialog />
      <CoursesDialog />
      <SettingsDialog />
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Workspace />
    </StoreProvider>
  )
}
