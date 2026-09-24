import axios from 'axios'

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
})

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string; error?: string; detail?: string }>(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('notevault_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
