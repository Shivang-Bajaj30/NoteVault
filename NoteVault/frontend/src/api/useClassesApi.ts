import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { StudyClass } from '../lib/auth'

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get<{ classes: StudyClass[] }>('/classes')
      return res.data.classes
    },
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string; subject: string; description: string }) => {
      const res = await api.post<{ class: StudyClass }>('/classes', payload)
      return res.data.class
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
