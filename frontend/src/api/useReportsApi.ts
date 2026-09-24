import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Report } from '../lib/auth'

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get<{ reports: Report[] }>('/reports')
      return res.data.reports
    },
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, reason, noteTitle, reportedByName }: { noteId: string; reason: string; noteTitle?: string; reportedByName?: string }) => {
      const res = await api.post<{ report: Report }>('/reports', { noteId, reason })
      return res.data.report
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useResolveReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'valid' | 'dismissed' }) => {
      await api.post(`/reports/${id}/resolve`, { decision })
      return { id, decision }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
