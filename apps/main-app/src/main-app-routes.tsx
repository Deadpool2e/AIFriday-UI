import { Outlet, Route, Routes } from 'react-router'
import { ProtectedRoute } from '@platform/auth'

import { DashboardPage } from './pages/dashboard-page'
import { RequestsPage } from './pages/requests-page'
import { RequestDetailPage } from './pages/request-detail-page'
import { DocumentsPage } from './pages/documents-page'
import { AiAssistantPage } from './pages/ai-assistant-page'
import { ApprovalsPage } from './pages/approvals-page'
import { ApprovalDetailPage } from './pages/approval-detail-page'
import { NotFoundPage } from './pages/not-found-page'

// This is the piece the Host federates in — a bare <Routes> tree, no
// providers, no router of its own. It reads from whatever router context
// is already ambient (the Host's RouterProvider), which only works because
// react-router is a shared singleton (see vite.config.ts). Fine-grained
// permission gates live HERE, not in the Host — the Host only knows
// "authenticated users can reach Main App at all," Main App decides which
// of its own pages need which specific permission.
export function MainAppRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route
        path="requests"
        element={
          <ProtectedRoute permission="REQUEST_VIEW">
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route index element={<RequestsPage />} />
        <Route path=":id" element={<RequestDetailPage />} />
      </Route>
      <Route
        path="documents"
        element={
          <ProtectedRoute permission="DOCUMENT_VIEW">
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="ai-assistant"
        element={
          <ProtectedRoute permission="AI_ASSISTANT">
            <AiAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="approvals"
        element={
          <ProtectedRoute permission="REQUEST_APPROVE">
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route index element={<ApprovalsPage />} />
        <Route path=":id" element={<ApprovalDetailPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

// React.lazy() (used by the Host to load this remote) requires a default
// export.
export default MainAppRoutes
