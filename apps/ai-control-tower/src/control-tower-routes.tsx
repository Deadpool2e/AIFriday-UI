import { Outlet, Route, Routes } from 'react-router'
import { ProtectedRoute } from '@platform/auth'

import { ControlTowerNav } from './control-tower-nav'
import { OverviewPage } from './pages/overview-page'
import { AgentsPage } from './pages/agents-page'
import { AgentDetailPage } from './pages/agent-detail-page'
import { ExecutionTracePage } from './pages/execution-trace-page'
import { GuardrailsPage } from './pages/guardrails-page'
import { RagMonitoringPage } from './pages/rag-monitoring-page'
import { LlmUsagePage } from './pages/llm-usage-page'
import { LatencyPage } from './pages/latency-page'
import { SystemHealthPage } from './pages/system-health-page'
import { AuditLogsPage } from './pages/audit-logs-page'
import { ExplainabilityPage } from './pages/explainability-page'
import { NotFoundPage } from './pages/not-found-page'

// Renders the section tabs once, above whichever page is currently routed
// — every route below is a child of this layout route, so none of them
// need to render ControlTowerNav themselves.
function ControlTowerLayout() {
  return (
    <div className="space-y-6">
      <ControlTowerNav />
      <Outlet />
    </div>
  )
}

// A nested <Routes> matches relative to whatever path segment its
// ancestor <Route> already consumed — since Host mounts this remote under
// a real 'control-tower' <Route> (not the bare root), that segment is
// already "used up" by the time this component renders. Routes here are
// therefore relative to '/control-tower', exactly like main-app-routes.tsx
// is relative to '/'. 'agents' and 'agents/:id' are plain leaf pages
// (neither renders its own nested <Routes>), so they use the same
// straightforward nested-Outlet pattern as Main App's 'requests' — no
// index/splat-pair trick needed there, that's only for routes whose
// element itself renders another <Routes>.
export function ControlTowerRoutes() {
  return (
    <Routes>
      <Route element={<ControlTowerLayout />}>
        <Route index element={<OverviewPage />} />
        <Route
          path="agents"
          element={
            <ProtectedRoute permission="AGENT_VIEW">
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgentsPage />} />
          <Route path=":id" element={<AgentDetailPage />} />
        </Route>
        <Route path="executions/:executionId" element={<ExecutionTracePage />} />
        <Route
          path="guardrails"
          element={
            <ProtectedRoute permission="GUARDRAIL_VIEW">
              <GuardrailsPage />
            </ProtectedRoute>
          }
        />
        <Route path="rag" element={<RagMonitoringPage />} />
        <Route path="llm-usage" element={<LlmUsagePage />} />
        <Route path="latency" element={<LatencyPage />} />
        <Route path="system-health" element={<SystemHealthPage />} />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute permission="AUDIT_VIEW">
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="explainability" element={<ExplainabilityPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default ControlTowerRoutes
