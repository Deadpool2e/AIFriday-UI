import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '@platform/auth'

import { AppShell } from './shell/app-shell'
import { LoginPage } from './pages/login-page'
import { RouteErrorPage } from './pages/route-error-page'
import { RemoteMainApp } from './remotes/remote-main-app'
import { RemoteControlTower } from './remotes/remote-control-tower'

// Host-owned pages only — everything business-domain now lives in
// apps/main-app, loaded via RemoteMainApp. Settings and the design system
// showcase are Host/platform-level concerns (theme, accessibility,
// component library), not a specific business feature, so they stay here.
const SettingsPage = lazy(() =>
  import('./pages/settings-page').then((m) => ({ default: m.SettingsPage })),
)
const DesignSystemPage = lazy(() =>
  import('./pages/design-system-page').then((m) => ({
    default: m.DesignSystemPage,
  })),
)

const controlTowerElement = (
  <ProtectedRoute
    permission={['AGENT_VIEW', 'AI_TRACE_VIEW', 'GUARDRAIL_VIEW', 'AUDIT_VIEW']}
  >
    <RemoteControlTower />
  </ProtectedRoute>
)

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      // A plain string path (e.g. `{ path: 'control-tower' }`) does NOT
      // reliably match when its element renders a nested <Routes> — same
      // root cause as the Main App bug, but a real `index: true` route
      // (which DOES work — proven on Main App) can only match its
      // PARENT's own resolved path, and "control-tower" isn't Host's
      // root. The fix: give "control-tower" its own parent route (no
      // element — React Router auto-renders <Outlet/> for a childless
      // element), then use index + '*' as ITS children. That makes
      // "control-tower" the effective "root" the index route matches
      // exactly, exactly mirroring the working Main App pattern one
      // level down instead of trying to fake it with a string path.
      {
        path: 'control-tower',
        children: [
          { index: true, element: controlTowerElement },
          { path: '*', element: controlTowerElement },
        ],
      },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'design-system', element: <DesignSystemPage /> },
      // Same pattern for Main App, at the true root — verified
      // empirically (Playwright): neither a bare '*' nor '/*' matches the
      // exact parent path when the matched element renders a nested
      // <Routes>; an explicit index route resolves it. Triggers a benign,
      // dev-only React Router warning that's stripped from production
      // builds.
      { index: true, element: <RemoteMainApp /> },
      { path: '*', element: <RemoteMainApp /> },
    ],
  },
])
