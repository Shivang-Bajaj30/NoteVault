import { useModeratorRequests, useReviewModeratorRequest } from '../../api/useAdminApi'
import { Table, Button, StatusBadge, Badge } from '../../components/ui'
import { CheckCircle2, XCircle, Mail } from 'lucide-react'

export function ModeratorRequestsTab() {
  const { data: requests = [] } = useModeratorRequests()
  const reviewMutation = useReviewModeratorRequest()

  const handleReview = async (id: string, decision: 'approved' | 'rejected') => {
    await reviewMutation.mutateAsync({ id, decision })
  }

  const columns = [
    {
      key: 'userName',
      label: 'Applicant',
      render: (val: string, item: any) => (
        <div>
          <span className="font-semibold text-stone-900 dark:text-zinc-100 text-xs block">
            {val}
          </span>
          <span className="text-[10px] text-stone-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3" />
            {item.userEmail}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Application Rationale',
      render: (val: string) => (
        <p className="text-xs text-stone-600 dark:text-zinc-300 line-clamp-2 max-w-md">
          {val}
        </p>
      ),
    },
    {
      key: 'createdAt',
      label: 'Requested',
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
      label: 'Review Decision',
      sortable: false,
      render: (_: any, item: any) => {
        if (item.status !== 'pending') {
          return <span className="text-stone-400 text-xs">Reviewed</span>
        }
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleReview(item.id, 'approved')}
              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Verify & Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReview(item.id, 'rejected')}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Decline
            </Button>
          </div>
        )
      },
    },
  ]

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cyan-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            Moderator Verification Applications
          </h3>
          <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5">
            Students and teaching assistants applying for permission to upload and curate peer materials.
          </p>
        </div>
        <Badge tone={pendingCount > 0 ? 'warning' : 'neutral'}>
          {pendingCount} Pending Verification
        </Badge>
      </div>

      <Table
        columns={columns}
        data={requests}
        searchPlaceholder="Filter applicants by name or email..."
        emptyTitle="No verification requests"
        emptyMessage="No students are currently awaiting moderator verification."
      />
    </div>
  )
}
