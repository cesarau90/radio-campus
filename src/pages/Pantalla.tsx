import PantallaView from '../components/PantallaView'
import { usePantalla } from '../hooks/usePantalla'

export default function Pantalla() {
  const pantalla = usePantalla()
  return <PantallaView {...pantalla} />
}
