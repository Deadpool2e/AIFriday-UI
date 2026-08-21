import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@platform/theme'
import { AuthProvider } from '@platform/auth'
import './index.css'
import { MainAppRoutes } from './main-app-routes'

// Standalone entry — ONLY used when running `pnpm --filter main-app dev`
// directly (independent deployment/testing, per Section 5). When federated
// into the Host, none of this file runs; the Host's main.tsx supplies
// these same providers instead, and only main-app-routes.tsx gets loaded.
//
// Known limitation of standalone mode: there's no /login route here (that
// lives in the Host), so ProtectedRoute's redirect-to-/login will fall
// through to this router's own NotFoundPage instead of a real login
// screen. Standalone mode is for verifying Main App builds/runs/renders
// independently — a full authenticated user journey requires the Host.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter([{ path: '/*', element: <MainAppRoutes /> }])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
