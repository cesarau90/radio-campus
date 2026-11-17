import './pantalla.css'

interface Props {
  /** Frases que corren, de izquierda a derecha, en bucle. */
  items: string[]
}

/** Cinta de avisos de /pantalla. El texto se repite dos veces para que el bucle no tenga saltos (la copia se oculta a lectores de pantalla). */
export default function Ticker({ items }: Props) {
  if (items.length === 0) return null
  return (
    <div className="pt-ticker" role="marquee" aria-label={items.join('. ')}>
      <div className="pt-ticker-track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span className="pt-ticker-set" key={copy}>
            {items.map((item) => (
              <span className="pt-ticker-item" key={item}>
                {item}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
