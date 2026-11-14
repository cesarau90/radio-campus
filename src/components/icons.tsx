/** Íconos dibujados a mano (SVG), un solo grosor de trazo (2.5) y esquinas rectas, como el resto del mundo visual. */

interface IconProps {
  size?: number
  className?: string
}

/** Marca de la radio: la aguja del dial sobre su escala. Misma figura que el favicon. */
export function DialMark({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 18 L21 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <circle cx="7" cy="15" r="2.4" fill="currentColor" />
      <path d="M3 22h18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 3" />
    </svg>
  )
}

export function CheckMark({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 12.5 L9.5 18 L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  )
}
