import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@platform/theme'
import { AuthProvider } from '@platform/auth'
import './index.css'
import { ControlTowerRoutes } from './control-tower-routes'

// Standalone entry, same reasoning as apps/main-app/src/main.tsx — only
// used for `pnpm --filter ai-control-tower dev` in isolation. Since
// ControlTowerRoutes expects to live under '/control-tower' (see that
// file), this redirects the bare root to there so opening localhost:5175
// directly lands somewhere real instead of a blank unmatched route.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/control-tower" replace /> },
  { path: '/*', element: <ControlTowerRoutes /> },
])

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
