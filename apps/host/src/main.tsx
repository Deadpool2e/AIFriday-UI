import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@platform/theme'
import { AuthProvider } from '@platform/auth'
import { ToastProvider } from '@platform/ui'
import './index.css'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* Above AuthProvider and the router so any of them can raise
            feedback — including a session-expiry notice fired before a
            single page has mounted. */}
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Hand off from the inline boot screen (index.html) to the real app. Two
// rAFs rather than one: the first lands after React's commit, the second
// after the browser has actually painted it — dismissing on the first
// frame occasionally revealed one blank frame between the boot screen
// fading and the app's first paint, which is the exact stutter the boot
// screen exists to prevent.
const boot = document.getElementById('boot')
if (boot) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      boot.dataset.ready = 'true'
      boot.addEventListener('transitionend', () => boot.remove(), {
        once: true,
      })
      // Fallback for the case where the transition never fires (reduced
      // motion, backgrounded tab) — the overlay must never outlive its
      // purpose and sit on top of a working app.
      setTimeout(() => boot.remove(), 600)
    }),
  )
}
