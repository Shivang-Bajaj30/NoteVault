import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ModeratorRequest } from '../lib/auth'
import type { StreamEvent } from './contracts'

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data,
  })
}

export function useAdminStreams() {
  return useQuery({
    queryKey: ['admin', 'streams'],
    queryFn: async () => (await api.get('/admin/streams')).data,
    refetchInterval: 5000,
  })
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => (await api.get<{ events: StreamEvent[] }>('/admin/events')).data.events,
    refetchInterval: 6000,
  })
}

export function useAdminAudit() {
  return useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: async () => (await api.get<{ logs: Record<string, any>[] }>('/admin/audit')).data.logs,
  })
}

export function useModeratorRequests() {
  return useQuery({
    queryKey: ['admin', 'moderator-requests'],
    queryFn: async () => (await api.get<{ requests: ModeratorRequest[] }>('/moderator-requests')).data.requests,
  })
}

export function useReviewModeratorRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => {
      await api.post(`/moderator-requests/${id}/review`, { decision })
      return { id, decision }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderator-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] })
    },
  })
}
