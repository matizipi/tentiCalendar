import { BookOpen, Home, LogOut, Settings, Users, type LucideIcon } from 'lucide-react'
import { useStore } from '../store/StoreContext'

function NavButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-current={active ? 'page' : undefined}
      className={`grid size-10 place-items-center rounded-xl transition ${
        active ? 'bg-head text-plum shadow-inner' : 'text-ink/55 hover:bg-head/60 hover:text-plum'
      }`}
    >
      <Icon size={19} />
    </button>
  )
}

export function SideNav() {
  const { state, dispatch, openDialog, toast } = useStore()
  return (
    <nav
      aria-label="Navegación principal"
      className="hidden flex-col items-center justify-between border-r border-head/70 py-5 desk:flex print:hidden"
    >
      <div className="flex flex-col items-center gap-2">
        <NavButton
          icon={Home}
          label="Inicio"
          active
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            dispatch({ type: 'setActiveCourse', courseId: state.courses[0].id })
          }}
        />
        <NavButton icon={BookOpen} label="Cursos" onClick={() => openDialog('courses')} />
        <NavButton
          icon={Users}
          label="Docentes"
          onClick={() => toast('Gestión de docentes: próximamente. Por ahora el cronograma es personal.')}
        />
        <NavButton icon={Settings} label="Ajustes" onClick={() => openDialog('settings')} />
      </div>
      <NavButton
        icon={LogOut}
        label="Salir"
        onClick={() =>
          toast('Trabajás en modo local: tus datos quedan en este navegador. Exportalos desde Ajustes.')
        }
      />
    </nav>
  )
}
