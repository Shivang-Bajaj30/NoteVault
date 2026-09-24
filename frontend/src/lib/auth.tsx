import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, isDemoMode } from './api'
import axios from 'axios'

export type Role = 'student' | 'moderator' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  university: string
  cleanUploadCount?: number
  isTrusted?: boolean
  trustThreshold?: number
}

export type StudyClass = {
  id: string
  name: string
  subject: string
  description: string
  noteCount?: number
}

export type NoteStatus = 'pending' | 'approved' | 'rejected'

export type Note = {
  id: string
  title: string
  description: string
  subject: string
  classId?: string | null
  tags?: string[]
  fileName?: string
  fileUrl?: string
  uploadedBy?: string
  uploadedByName?: string
  status: NoteStatus
  createdAt?: string
  reviewedAt?: string | null
  downloads?: number
  pages?: number
  color?: string
  trusted?: boolean
  summary?: string
  keyConcepts?: string[]
  flashcards?: { q: string; a: string }[]
}

export type ModeratorRequest = {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  createdAt: string
}

export type Report = {
  id: string
  noteId: string
  noteTitle: string
  reportedByName: string
  reason: string
  status: 'open' | 'valid' | 'dismissed'
  createdAt: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
  university: string
  role: 'student' | 'moderator'
  reason?: string
}

export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: 'usr_admin',
    name: 'Sarah Connor',
    email: 'admin@notevault.com',
    role: 'admin',
    university: 'Stanford University',
  },
  aisha: {
    id: 'usr_aisha',
    name: 'Aisha Chen',
    email: 'aisha@notevault.com',
    role: 'moderator',
    university: 'UC Berkeley',
    cleanUploadCount: 5,
    isTrusted: true,
    trustThreshold: 5,
  },
  diego: {
    id: 'usr_diego',
    name: 'Diego Ramirez',
    email: 'diego@notevault.com',
    role: 'moderator',
    university: 'MIT',
    cleanUploadCount: 2,
    isTrusted: false,
    trustThreshold: 5,
  },
  student: {
    id: 'usr_student',
    name: 'Alex Morgan',
    email: 'student@notevault.com',
    role: 'student',
    university: 'Cornell University',
  },
}

type AuthState = {
  user: User | null
  loading: boolean
  isModerator: boolean
  isAdmin: boolean
  isTrusted: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
  switchPersona: (personaKey: 'admin' | 'aisha' | 'diego' | 'student') => Promise<void>
  updateTrustCount: (delta: number) => void
}

const AuthContext = createContext<AuthState | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('notevault_user')
    if (raw) return JSON.parse(raw) as User
    // Default to student persona for demo convenience if no user
    return DEMO_USERS.student
  } catch {
    return DEMO_USERS.student
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('notevault_token'))

  const persist = useCallback((token: string, nextUser: User) => {
    localStorage.setItem('notevault_token', token)
    localStorage.setItem('notevault_user', JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('notevault_token')
    if (!token) return
    setLoading(true)
    api
      .get<{ user: User }>('/auth/me')
      .then((res) => {
        localStorage.setItem('notevault_user', JSON.stringify(res.data.user))
        setUser(res.data.user)
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('notevault_token')
          localStorage.removeItem('notevault_user')
          setUser(null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      persist(res.data.token, res.data.user)
    },
    [persist],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      const res = await api.post<{ token: string; user: User }>('/auth/signup', input)
      persist(res.data.token, res.data.user)
    },
    [persist],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('notevault_token')
    localStorage.removeItem('notevault_user')
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const res = await api.get<{ user: User }>('/auth/me')
    localStorage.setItem('notevault_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }, [])

  const switchPersona = useCallback(
    async (personaKey: 'admin' | 'aisha' | 'diego' | 'student') => {
      const persona = DEMO_USERS[personaKey]
      if (!isDemoMode || !persona) return
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email: persona.email,
        password: 'password123',
      })
      persist(res.data.token, res.data.user)
    },
    [persist],
  )

  const updateTrustCount = useCallback((delta: number) => {
    setUser((prev) => {
      if (!prev) return prev
      const newCount = Math.max(0, (prev.cleanUploadCount ?? 0) + delta)
      const isTrusted = newCount >= 5
      const updated = { ...prev, cleanUploadCount: newCount, isTrusted }
      localStorage.setItem('notevault_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const isModerator = user?.role === 'moderator' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'
  const isTrusted = !!user?.isTrusted || user?.role === 'admin'

  const value = useMemo(
    () => ({
      user,
      loading,
      isModerator,
      isAdmin,
      isTrusted,
      login,
      signup,
      logout,
      refresh,
      switchPersona,
      updateTrustCount,
    }),
    [user, loading, isModerator, isAdmin, isTrusted, login, signup, logout, refresh, switchPersona, updateTrustCount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
