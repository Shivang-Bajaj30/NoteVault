import { useState } from 'react'
import { useReports, useResolveReport } from '../../api/useReportsApi'
import { Table, Button, Modal, StatusBadge, Badge } from '../../components/ui'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../lib/auth'

export function ReportsTab() {
  const { data: reports = [] } = useReports()
  const resolveMutation = useResolveReport()
  const { updateTrustCount } = useAuth()

  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [decision, setDecision] = useState<'valid' | 'dismissed'>('valid')

  const handleOpenResolve = (report: any, action: 'valid' | 'dismissed') => {
    setSelectedReport(report)
    setDecision(action)
  }

  const handleConfirmResolve = async () => {
    if (!selectedReport) return
    await resolveMutation.mutateAsync({
      id: selectedReport.id,
      decision,
    })

    if (decision === 'valid') {
      updateTrustCount(-999)
    }

    setSelectedReport(null)
  }

  const columns = [
    {
      key: 'noteTitle',
      label: 'Reported Material',
      render: (val: string, item: any) => (
        <div className="max-w-xs">
          <span className="font-semibold text-stone-900 dark:text-zinc-100 block text-xs truncate">
            {val}
          </span>
          <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
            ID: {item.noteId}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Report Concern',
      render: (val: string) => (
        <p className="text-xs text-stone-600 dark:text-zinc-300 line-clamp-2 max-w-sm">
          {val}
        </p>
      ),
    },
    {
      key: 'reportedByName',
      label: 'Reporter',
      render: (val: string) => (
        <span className="text-xs font-medium text-stone-700 dark:text-zinc-300">{val}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Filed',
      render: (val?: string) => (
        <span className="text-xs text-stone-500 dark:text-zinc-400">
          {val ? new Date(val).toLocaleDateString() : 'Recent'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Resolution',
      sortable: false,
      render: (_: any, item: any) => {
        if (item.status !== 'open') {
          return <span className="text-stone-400 text-xs">Resolved</span>
        }
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenResolve(item, 'valid')}
              className="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
            >
              Mark Valid (Reset Trust)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenResolve(item, 'dismissed')}
            >
              Dismiss
            </Button>
          </div>
        )
      },
    },
  ]

  const openCount = reports.filter((r) => r.status === 'open').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-rose-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Student Integrity Reports
          </h3>
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
            Peer complaints filed regarding formula inaccuracies, plagiarism, or exam leak concerns.
          </p>
        </div>
        <Badge tone={openCount > 0 ? 'danger' : 'success'}>
          {openCount} Open Report{openCount === 1 ? '' : 's'}
        </Badge>
      </div>

      <Table
        columns={columns}
        data={reports}
        searchPlaceholder="Filter reports by title or reason..."
        emptyTitle="No reports filed"
        emptyMessage="Academic integrity standards are healthy. No active complaints are open."
      />

      {/* Resolution Confirmation Modal */}
      <Modal
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={
          decision === 'valid' ? (
            <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              Mark Report Valid (Reset Contributor Trust)
            </span>
          ) : (
            <span className="flex items-center gap-2 text-stone-700 dark:text-zinc-200">
              <CheckCircle2 className="w-5 h-5" />
              Dismiss Report
            </span>
          )
        }
        description="Verify this report's validity and enforce platform reputation policies."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700">
            <p className="font-semibold text-stone-800 dark:text-zinc-200">
              {selectedReport?.noteTitle}
            </p>
            <p className="text-stone-600 dark:text-zinc-400 text-[11px] mt-1">
              <strong>Allegation:</strong> {selectedReport?.reason}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Reported by: {selectedReport?.reportedByName}
            </p>
          </div>

          {decision === 'valid' ? (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                Trust Engine Consequence
              </p>
              <p className="text-[11px] leading-relaxed">
                Confirming this report as valid will immediately revoke the moderator's auto-publish privilege, reset their clean upload count back to <strong>0 / 5</strong>, and log an audit event.
              </p>
            </div>
          ) : (
            <p className="text-stone-600 dark:text-zinc-400">
              Dismissing indicates the reported note meets acceptable guidelines and no reputation penalty is warranted.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === 'valid' ? 'danger' : 'secondary'}
              size="sm"
              isLoading={resolveMutation.isPending}
              onClick={handleConfirmResolve}
            >
              Confirm Resolution ({decision})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
