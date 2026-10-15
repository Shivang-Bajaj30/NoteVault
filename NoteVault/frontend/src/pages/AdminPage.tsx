import { useParams } from 'react-router-dom'
import { AdminConsole } from '../features/admin/AdminConsole'

export default function AdminPage() {
  const { section = 'queue' } = useParams<{ section?: string }>()

  return <AdminConsole initialTab={section} />
}
