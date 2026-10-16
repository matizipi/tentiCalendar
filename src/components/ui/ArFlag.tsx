/** Bandera de Argentina en SVG (los emojis de bandera no se ven en todos los sistemas). */
export function ArFlag({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size * 1.4}
      height={size}
      viewBox="0 0 28 20"
      role="img"
      aria-label="Argentina"
      className="shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]"
    >
      <rect width="28" height="20" fill="#74ACDF" />
      <rect y="6.67" width="28" height="6.66" fill="#fff" />
      <circle cx="14" cy="10" r="2.2" fill="#F6B40E" />
    </svg>
  )
}
