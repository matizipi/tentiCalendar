import { Flower2, Printer } from 'lucide-react'

export function Header() {
  return (
    <header className="flex flex-col items-center gap-3 desk:flex-row desk:items-center desk:justify-between">
      <h1 className="title-hand text-center text-[2.6rem] desk:text-left desk:text-6xl">
        Cronograma{' '}
        <span className="relative inline-block">
          Tentativo
          <svg
            aria-hidden
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            className="absolute -bottom-1.5 left-0 h-2.5 w-full"
          >
            <path
              d="M2 7 C 22 1, 38 12, 60 6 S 100 1, 124 7 S 170 11, 198 4"
              fill="none"
              stroke="var(--color-rasp)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </span>{' '}
        <span className="inline-flex items-center gap-1.5 align-baseline text-[0.62em] font-semibold tracking-wide whitespace-nowrap text-rasp-dark italic">
          de Florcita
          <Flower2 aria-hidden className="size-[0.8em] -rotate-12 text-rasp" strokeWidth={2.2} />
        </span>
      </h1>

      <button
        type="button"
        onClick={() => window.print()}
        className="btn btn-rasp w-full max-w-md px-6 wide:w-auto desk:max-w-none print:hidden"
      >
        <Printer size={18} />
        Imprimir Cronograma
      </button>
    </header>
  )
}
