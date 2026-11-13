import DiagnosticoPanel from '../components/DiagnosticoPanel'
import { useDiagnostico } from '../hooks/useDiagnostico'

export default function Diagnostico() {
  const data = useDiagnostico()
  return <DiagnosticoPanel {...data} />
}
