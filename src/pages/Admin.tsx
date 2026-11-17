import AdminView from '../components/AdminView'
import { useAdmin } from '../hooks/useAdmin'

export default function Admin() {
  const admin = useAdmin()
  return <AdminView {...admin} />
}
