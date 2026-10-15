import { useParams, Link } from 'react-router-dom'
import { useNote } from '../api/useNotesApi'
import { NoteViewer } from '../features/viewer/NoteViewer'
import { Skeleton, Empty, Button } from '../components/ui'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>()
  const { data: note, isLoading, isError } = useNote(id)

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <Skeleton rows={3} />
      </div>
    )
  }

  if (isError || !note) {
    return (
      <div className="max-w-md mx-auto my-16">
        <Empty
          title="Document Not Found"
          hint="The requested study note could not be retrieved. It may have been relocated, deleted, or requires review."
          icon={BookOpen}
        >
          <Link to="/notes">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Catalog
            </Button>
          </Link>
        </Empty>
      </div>
    )
  }

  return <NoteViewer note={note} />
}
