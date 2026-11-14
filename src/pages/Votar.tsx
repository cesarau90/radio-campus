import VotarView from '../components/VotarView'
import { useVotar } from '../hooks/useVotar'

export default function Votar() {
  const votar = useVotar()
  return <VotarView {...votar} />
}
