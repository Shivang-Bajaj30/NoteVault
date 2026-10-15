import axios from 'axios'

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
})

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data) {
      if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        // FastAPI / Pydantic validation error lists
        return data.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ')
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message
      }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error
      }
    }
    if (error.response?.status === 401) {
      return 'Authentication required. Please sign in to continue.'
    }
    if (error.response?.status === 403) {
      return 'Access restricted. Contributor or Administrator role required.'
    }
    if (error.response?.status === 404) {
      return 'The requested record was not found.'
    }
    if (error.response?.status === 409) {
      return 'This item or entry already exists.'
    }
    if (error.response?.status === 413) {
      return 'File exceeds maximum upload limit of 25 MB.'
    }
    if (error.message === 'Network Error' || !error.response) {
      return 'Network Error: Unable to reach backend server. Please check your connection.'
    }
    return error.message || fallback
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
