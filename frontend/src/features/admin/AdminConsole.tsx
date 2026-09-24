import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs'
import { ReviewQueueTab } from './ReviewQueueTab'
import { ReportsTab } from './ReportsTab'
import { ModeratorRequestsTab } from './ModeratorRequestsTab'
import { AnalyticsTab } from './AnalyticsTab'
import { StreamsTab } from './StreamsTab'
import { AuditLogTab } from './AuditLogTab'
import { ShieldCheck, Files, Flag, UserCheck, BarChart3, Radio, History } from 'lucide-react'
import { Badge } from '../../components/ui'
import { useAllNotesAdmin } from '../../api/useNotesApi'
import { useReports } from '../../api/useReportsApi'
import { useModeratorRequests } from '../../api/useAdminApi'

export interface AdminConsoleProps {
  initialTab?: string
}

export function AdminConsole({ initialTab = 'queue' }: AdminConsoleProps) {
  const { data: allNotes = [] } = useAllNotesAdmin()
  const { data: reports = [] } = useReports()
  const { data: requests = [] } = useModeratorRequests()

  const pendingNotesCount = allNotes.filter((n) => n.status === 'pending').length
  const openReportsCount = reports.filter((r) => r.status === 'open').length
  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin console</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1.5">
            Review queues, integrity reports, reputation, and Kafka event streams.
          </p>
        </div>

        <Badge tone="accent" size="md">
          🛡️ Admin Privilege Active
        </Badge>
      </div>

      {/* 6 Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="flex flex-wrap border-b border-stone-200 dark:border-zinc-800 gap-1.5 pb-2">
          <TabsTrigger value="queue" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-amber-50 data-[state=active]:text-amber-800 data-[state=active]:border-amber-300 dark:data-[state=active]:bg-amber-950/50 dark:data-[state=active]:text-amber-300">
            <Files className="w-3.5 h-3.5 text-amber-500" />
            Review Queue
            {pendingNotesCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-mono text-[10px] font-bold shadow-xs">
                {pendingNotesCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="reports" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-rose-50 data-[state=active]:text-rose-800 data-[state=active]:border-rose-300 dark:data-[state=active]:bg-rose-950/50 dark:data-[state=active]:text-rose-300">
            <Flag className="w-3.5 h-3.5 text-rose-500" />
            Integrity Reports
            {openReportsCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold shadow-xs">
                {openReportsCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="requests" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-800 data-[state=active]:border-cyan-300 dark:data-[state=active]:bg-cyan-950/50 dark:data-[state=active]:text-cyan-300">
            <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
            Moderator Requests
            {pendingRequestsCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500 text-stone-950 font-mono text-[10px] font-bold shadow-xs">
                {pendingRequestsCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-violet-50 data-[state=active]:text-violet-800 data-[state=active]:border-violet-300 dark:data-[state=active]:bg-violet-950/50 dark:data-[state=active]:text-violet-300">
            <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
            Analytics Dashboard
          </TabsTrigger>

          <TabsTrigger value="streams" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:border-emerald-300 dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            Kafka Streams Observability
          </TabsTrigger>

          <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-800 data-[state=active]:border-indigo-300 dark:data-[state=active]:bg-indigo-950/50 dark:data-[state=active]:text-indigo-300">
            <History className="w-3.5 h-3.5 text-indigo-500" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <div className="pt-4">
          <TabsContent value="queue">
            <ReviewQueueTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="requests">
            <ModeratorRequestsTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="streams">
            <StreamsTab />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
