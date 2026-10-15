import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { TrustProgressWidget } from '../features/upload/TrustProgressWidget'
import { DropzoneUploader } from '../features/upload/DropzoneUploader'
import { UploadHistoryTable } from '../features/upload/UploadHistoryTable'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../components/ui'

export default function UploadPage() {
  const { isTrusted } = useAuth()

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header Card with Subtle Color Wash */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">
              Contributor upload
            </span>
            <Badge tone={isTrusted ? 'success' : 'warning'}>
              {isTrusted ? 'Auto-publish active' : 'Review required'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1.5">
            Share course notes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload lecture notes and exam guides. Trusted contributors auto-publish after 5 clean approvals.
          </p>
        </div>

        <Link
          to="/notes"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shrink-0 self-start sm:self-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          View Catalog
        </Link>
      </div>

      {/* Trust Progress Bar Widget (X/5 Approvals Tracker) */}
      <TrustProgressWidget />

      {/* Dropzone & Metadata Upload Form */}
      <DropzoneUploader />

      {/* Upload History Table (Moderator's Submissions & Review Status) */}
      <UploadHistoryTable />
    </div>
  )
}
