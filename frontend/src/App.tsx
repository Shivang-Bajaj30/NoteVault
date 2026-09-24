import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './lib/theme'
import { AuthProvider } from './lib/auth'
import { WorkspaceProvider } from './lib/workspace'
import { ProtectedRoute } from './lib/routeGuards'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import { DashboardPage, BrowsePage, ClassesPage } from './pages/WorkspacePages'
import SearchPage from './pages/SearchPage'
import ViewerPage from './pages/ViewerPage'
import UploadPage from './pages/UploadPage'
import AdminPage from './pages/AdminPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <WorkspaceProvider>
            <Routes>
              {/* Public Unauthenticated Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/auth/login" element={<Navigate to="/login" replace />} />
              <Route path="/auth/signup" element={<Navigate to="/signup" replace />} />
              <Route path="/login" element={<AuthPage signup={false} />} />
              <Route path="/signup" element={<AuthPage signup={true} />} />

              {/* Application Layout Routes */}
              <Route element={<AppLayout />}>
                <Route path="/home" element={<DashboardPage />} />
                <Route path="/notes" element={<BrowsePage />} />
                <Route path="/notes/:id" element={<ViewerPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/saved" element={<BrowsePage savedOnly />} />
                <Route path="/search" element={<SearchPage />} />

                {/* Moderator Only Route */}
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute requiredRole={['moderator', 'admin']}>
                      <UploadPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/studio" element={<Navigate to="/upload" replace />} />

                {/* Admin Only Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/:section"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
