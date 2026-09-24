import { useState } from 'react'
import { useAdminStreams, useAdminEvents } from '../../api/useAdminApi'
import { Table, Button, Modal, KafkaTopicBadge, Badge, Card } from '../../components/ui'
import { Radio, Activity, Cpu, Database, RefreshCw, Eye } from 'lucide-react'
import type { StreamEvent } from '../../api/contracts'

export function StreamsTab() {
  const { data: streams, refetch: refetchStreams, isError: streamsError } = useAdminStreams()
  const { data: events = [], refetch: refetchEvents, isError: eventsError } = useAdminEvents()
  const [inspectEvent, setInspectEvent] = useState<StreamEvent | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refetchStreams(), refetchEvents()])
    setIsRefreshing(false)
  }

  const columns = [
    { key: 'id', label: 'Event ID', render: (value: string) => <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{value}</span> },
    { key: 'topic', label: 'Topic', render: (value: string) => <KafkaTopicBadge topic={value} /> },
    { key: 'type', label: 'Event type', render: (value: string) => <span className="font-mono text-xs text-stone-700 dark:text-zinc-300">{value}</span> },
    { key: 'createdAt', label: 'Recorded', render: (value: string) => <span className="text-xs text-stone-500 dark:text-zinc-400">{new Date(value).toLocaleString()}</span> },
    { key: 'actions', label: 'Details', sortable: false, render: (_: unknown, item: StreamEvent) => <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => setInspectEvent(item)} leftIcon={<Eye className="w-3.5 h-3.5" />}>Inspect</Button></div> },
  ]

  const status = streamsError || eventsError ? 'Connection unavailable' : streams?.status || 'Loading'
  const statusTone: 'danger' | 'success' | 'neutral' = streamsError || eventsError
    ? 'danger'
    : streams?.status === 'KAFKA_CONFIGURED' ? 'success' : 'neutral'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Radio className="w-5 h-5" /></div>
          <div><span className="text-xs font-medium text-stone-500 block">Pipeline status</span><Badge tone={statusTone} size="sm">{status}</Badge></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Activity className="w-5 h-5" /></div>
          <div><span className="text-xs font-medium text-stone-500 block">Recorded events</span><span className="text-lg font-bold font-mono text-stone-900">{streams?.totalProcessed?.toLocaleString() ?? '—'}</span></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0"><Cpu className="w-5 h-5" /></div>
          <div><span className="text-xs font-medium text-stone-500 block">Event source</span><span className="text-xs font-mono font-semibold text-stone-800">{streams?.instance ?? '—'}</span></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0"><Database className="w-5 h-5" /></div>
          <div><span className="text-xs font-medium text-stone-500 block">Kafka Streams processor</span><span className="text-xs font-semibold text-stone-800">{streams?.processor?.status ?? 'Not reported'}</span></div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">Backend event activity <Badge tone="neutral" size="sm">Polls every 6 seconds</Badge></h3>
          <p className="text-xs text-stone-500 mt-1">MongoDB stores the durable event mirror. Kafka processing status is read from the streams service; consumer lag is {streams?.consumerLag >= 0 ? streams.consumerLag : 'not reported'}.</p>
          {streams?.lastProcessedAt && <p className="text-xs text-stone-400 mt-1">Latest event: {streams.lastProcessedAt}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={handleManualRefresh} isLoading={isRefreshing} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Button>
      </div>

      {(streamsError || eventsError) ? <Card className="p-5 text-sm text-rose-700">Could not load pipeline data. Check your admin session and backend connection, then refresh.</Card> : <Table columns={columns} data={events} searchPlaceholder="Filter by event ID, type, or topic..." emptyTitle="No backend events yet" emptyMessage="Events appear here after the backend records application activity." />}

      <Modal open={!!inspectEvent} onClose={() => setInspectEvent(null)} maxWidth="lg" title={<div className="flex items-center gap-2 font-mono text-xs"><Radio className="w-4 h-4 text-indigo-600" /><span>Event: {inspectEvent?.id}</span></div>} description={`Topic: ${inspectEvent?.topic} · Type: ${inspectEvent?.type}`}>
        <div className="space-y-3 text-xs">
          <div className="text-[11px] text-stone-500">Recorded: {inspectEvent?.createdAt}</div>
          <pre className="p-4 rounded-xl bg-stone-950 text-stone-100 font-mono text-xs overflow-x-auto border border-stone-800 max-h-80 leading-relaxed">{inspectEvent?.payload}</pre>
          <div className="flex justify-end pt-2"><Button variant="secondary" size="sm" onClick={() => setInspectEvent(null)}>Close</Button></div>
        </div>
      </Modal>
    </div>
  )
}
