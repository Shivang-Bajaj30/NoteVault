import { useAdminAudit } from '../../api/useAdminApi'
import { Table, Badge } from '../../components/ui'
import { History, User } from 'lucide-react'

export function AuditLogTab() {
  const { data: logs = [] } = useAdminAudit()

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (val?: string) => (
        <span className="text-xs font-mono text-stone-500 dark:text-zinc-400">
          {val ? new Date(val).toLocaleString() : 'Recent'}
        </span>
      ),
    },
    {
      key: 'userName',
      label: 'Authorized Actor',
      render: (val: string) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-zinc-200">
          <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{val}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action Emitted',
      render: (val: string) => (
        <Badge tone={val.includes('promoted') || val.includes('approved') ? 'success' : 'neutral'}>
          {val}
        </Badge>
      ),
    },
    {
      key: 'target',
      label: 'Target Entity',
      render: (val: string) => (
        <span className="text-xs font-medium text-stone-800 dark:text-zinc-200 max-w-xs truncate block">
          {val}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Audit Trail Details',
      render: (val: string) => (
        <p className="text-xs text-stone-600 dark:text-zinc-300 max-w-md line-clamp-2">
          {val}
        </p>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Immutable Moderation Audit Log</span>
          </h3>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
            Cryptographically timestamped record of note approvals, report resolutions, and moderator verifications.
          </p>
        </div>
        <Badge tone="academic">
          {logs.length} Logged Entries
        </Badge>
      </div>

      <Table
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit trail by actor, action, or note..."
        emptyTitle="No audit records"
        emptyMessage="Actions performed in the admin console will automatically record an immutable audit entry."
      />
    </div>
  )
}
