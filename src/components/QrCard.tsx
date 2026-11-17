import './pantalla.css'
import { useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { cssToken } from '../lib/playback'

interface Props {
  url: string
}

/** QR de /votar sobre papel claro, con margen (quiet zone) y de 280 px como mínimo para que lo lea un celular desde lejos. */
export default function QrCard({ url }: Props) {
  const colors = useMemo(() => ({ paper: cssToken('--color-text'), ink: cssToken('--color-bg') }), [])
  return (
    <figure className="pt-qr">
      <div className="pt-qr-paper">
        <QRCodeSVG value={url} bgColor={colors.paper} fgColor={colors.ink} marginSize={0} className="pt-qr-svg" />
      </div>
      <figcaption className="pt-qr-caption">
        <span className="pt-qr-title">Escanea y vota</span>
        <span className="pt-qr-url mono">{url.replace(/^https?:\/\//, '')}</span>
      </figcaption>
    </figure>
  )
}
