interface Props {
  route: string
  phase: number
}

/** Marcador temporal; se reemplaza en la fase indicada. */
export default function Placeholder({ route, phase }: Props) {
  return (
    <main style={{ padding: '2rem', display: 'grid', alignContent: 'end', minHeight: '100%' }}>
      <p className="mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
        Fase {phase}
      </p>
      <h1 style={{ fontSize: 'var(--step-4)' }}>{route}</h1>
    </main>
  )
}
