import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ChatMessageItem {
  id?: string
  sender: 'user' | 'assistant'
  text: string
  timestamp?: string
}

export interface StudyAnalysisData {
  summary: string
  keyConcepts: string[]
  studyOutline?: { title: string; points: string[] }[]
  difficulty?: string
  estimatedStudyTime?: string
}

export interface QuizQuestionItem {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface FlashcardItem {
  id: string
  question: string
  answer: string
}

export function useNoteChat(noteId?: string) {
  return useMutation({
    mutationFn: async ({ message, history }: { message: string; history?: ChatMessageItem[] }) => {
      const res = await api.post<{ reply: string; noteId: string; noteTitle: string }>(
        `/notes/${noteId}/chat`,
        { message, history }
      )
      return res.data
    },
  })
}

export function useStudyAnalysis(noteId?: string, enabled = false) {
  return useQuery({
    queryKey: ['note', noteId, 'study-analysis'],
    enabled: !!noteId && enabled,
    queryFn: async () => {
      const res = await api.post<{ analysis: StudyAnalysisData }>(`/notes/${noteId}/study/analyze`)
      return res.data.analysis
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useStudyQuiz(noteId?: string, enabled = false) {
  return useQuery({
    queryKey: ['note', noteId, 'study-quiz'],
    enabled: !!noteId && enabled,
    queryFn: async () => {
      const res = await api.post<{ quiz: QuizQuestionItem[] }>(`/notes/${noteId}/study/quiz`)
      return res.data.quiz
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useStudyFlashcards(noteId?: string, enabled = false) {
  return useQuery({
    queryKey: ['note', noteId, 'study-flashcards'],
    enabled: !!noteId && enabled,
    queryFn: async () => {
      const res = await api.post<{ flashcards: FlashcardItem[] }>(`/notes/${noteId}/study/flashcards`)
      return res.data.flashcards
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useGeneralChat() {
  return useMutation({
    mutationFn: async ({ message, history }: { message: string; history?: ChatMessageItem[] }) => {
      const res = await api.post<{ reply: string }>('/chat', { message, history })
      return res.data
    },
  })
}
