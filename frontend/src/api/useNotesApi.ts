import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Note } from '../lib/auth'

export function useNotes(params: { q?: string; classId?: string; subject?: string } = {}) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: async () => {
      const res = await api.get<{ notes: Note[] }>('/notes', { params })
      return res.data.notes
    },
    staleTime: 1000 * 30,
  })
}

export function useAllNotesAdmin() {
  return useQuery({
    queryKey: ['admin', 'notes', 'all'],
    queryFn: async () => {
      const res = await api.get<{ notes: Note[] }>('/admin/notes')
      return res.data.notes
    },
  })
}

export function useMyNotes() {
  return useQuery({
    queryKey: ['notes', 'mine'],
    queryFn: async () => {
      const res = await api.get<{ notes: Note[] }>('/notes/mine')
      return res.data.notes
    },
  })
}

export function useNote(id?: string) {
  return useQuery({
    queryKey: ['note', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<{ note: Note }>(`/notes/${id}`)
      return res.data.note
    },
  })
}

export interface UploadNotePayload {
  title: string
  file: File
  description: string
  subject: string
  classId?: string
  tags: string[]
  fileName: string
  isTrusted: boolean
  uploaderName: string
  uploaderId: string
}

export function useUploadNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UploadNotePayload) => {
      const formData = new FormData()
      formData.append('title', payload.title)
      formData.append('description', payload.description)
      formData.append('subject', payload.subject)
      if (payload.classId) formData.append('classId', payload.classId)
      payload.tags.forEach((tag) => formData.append('tags', tag))
      formData.append('file', payload.file)
      const res = await api.post<{ note: Note; autoPublished: boolean }>('/notes', formData)
      return { note: res.data.note, autoPublished: res.data.autoPublished }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useReviewNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, decision, reason }: { id: string; decision: 'approve' | 'reject'; reason?: string }) => {
      await api.post(`/admin/notes/${id}/review`, { decision, reason })
      return { id, decision }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notes/${id}/delete`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
