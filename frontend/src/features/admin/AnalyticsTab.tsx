import { useAdminAnalytics } from '../../api/useAdminApi'
import { Card, Badge, Skeleton } from '../../components/ui'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { Files, Users, ShieldCheck, Clock, Flag } from 'lucide-react'

export function AnalyticsTab() {
  const { data, isLoading } = useAdminAnalytics()

  if (isLoading || !data) {
    return <Skeleton rows={4} />
  }

  const totals = data.totals || {}
  const subjectChartData = Object.entries(data.uploadsPerSubject || {}).map(([name, count]) => ({
    name,
    count: Number(count),
  }))

  const colors = ['#4f46e5', '#059669', '#d97706', '#0284c7', '#dc2626']

  const statCards = [
    {
      label: 'Total Notes in Vault',
      value: totals.notes ?? 0,
      sub: `${totals.approved ?? 0} approved & live`,
      icon: Files,
      tone: 'indigo',
    },
    {
      label: 'Registered Students',
      value: totals.users ?? 0,
      sub: 'Across 6 university campuses',
      icon: Users,
      tone: 'emerald',
    },
    {
      label: 'Trusted Moderators',
      value: data.trustedModerators ?? 0,
      sub: `${data.unprovenModerators ?? 0} unproven (building trust)`,
      icon: ShieldCheck,
      tone: 'amber',
    },
    {
      label: 'Open Integrity Reports',
      value: totals.openReports ?? 0,
      sub: `${totals.pending ?? 0} pending queue reviews`,
      icon: Flag,
      tone: 'rose',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          const toneStyles: Record<string, { card: string; icon: string; sub: string }> = {
            indigo: {
              card: 'border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/20 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-zinc-900',
              icon: 'bg-indigo-600 text-white shadow-xs',
              sub: 'text-indigo-600 dark:text-indigo-400 font-semibold',
            },
            emerald: {
              card: 'border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-900',
              icon: 'bg-emerald-600 text-white shadow-xs',
              sub: 'text-emerald-600 dark:text-emerald-400 font-semibold',
            },
            amber: {
              card: 'border-amber-200/90 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-900',
              icon: 'bg-amber-500 text-stone-950 shadow-xs',
              sub: 'text-amber-600 dark:text-amber-400 font-semibold',
            },
            rose: {
              card: 'border-rose-200/90 dark:border-rose-800/60 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/20 dark:from-rose-950/30 dark:via-zinc-900 dark:to-zinc-900',
              icon: 'bg-rose-600 text-white shadow-xs',
              sub: 'text-rose-600 dark:text-rose-400 font-semibold',
            },
          }
          const currentTone = toneStyles[stat.tone] || toneStyles.indigo

          return (
            <Card key={i} className={`p-5 shadow-xs ${currentTone.card}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentTone.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 font-mono">
                  {stat.value}
                </span>
                <p className={`text-[11px] mt-0.5 ${currentTone.sub}`}>
                  {stat.sub}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uploads by Subject Bar Chart */}
        <Card className="lg:col-span-2 border-indigo-200/80 dark:border-zinc-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-100 dark:border-zinc-800">
            <div>
              <h4 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Uploaded Notes by Academic Discipline
              </h4>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                Distribution of peer-reviewed study packages across subject faculties.
              </p>
            </div>
            <Badge tone="accent">Active Semester</Badge>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-stone-500 dark:text-zinc-400"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-stone-500 dark:text-zinc-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '8px',
                    border: '1px solid #3f3f46',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {subjectChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Reputation Distribution Card */}
        <Card className="border-amber-200/80 dark:border-zinc-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-2 border-b border-amber-100 dark:border-zinc-800">
              <h4 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Reputation Engine Balance
              </h4>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                Breakdown of contributors who have unlocked instant auto-publish rights.
              </p>
            </div>

            <div className="my-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-900/60">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Trusted Contributors
                  </span>
                  <span className="text-base font-bold">{data.trustedModerators}</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  Passed the 5-approval threshold. Submissions skip review queue.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/60">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Unproven Contributors
                  </span>
                  <span className="text-base font-bold">{data.unprovenModerators}</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                  Currently building trust (0 to 4 clean uploads verified).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-zinc-800 text-[11px] text-stone-400 dark:text-zinc-500 flex items-center justify-between">
            <span>Ratio: {Math.round(((data.trustedModerators || 1) / ((data.trustedModerators || 1) + (data.unprovenModerators || 1))) * 100)}% Trusted</span>
            <span>Threshold: 5 clean uploads</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
