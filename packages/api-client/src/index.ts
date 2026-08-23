export type { RequestsService } from './requests-service'
export { mockRequestsService, requestsService } from './requests-service'
export { triggerDemoPendingApproval } from './mock-data'

export { USE_MOCK_API } from './lib/env'
export { ApiError } from './lib/http-client'

export type { MetricsService } from './metrics-service'
export { mockMetricsService } from './metrics-service'

export { useRequests } from './hooks/use-requests'
export { useRequest } from './hooks/use-request'
export {
  useDashboardMetrics,
  useRequestVolume,
  useAiActivity,
  useRecentActivity,
} from './hooks/use-dashboard'

export type { AIAssistantService } from './ai-assistant-service'
export { mockAIAssistantService, STEP_LABELS } from './ai-assistant-service'
export { useAIAssistant } from './hooks/use-ai-assistant'

export type { ApprovalsService, ApprovalActionInput } from './approvals-service'
export { mockApprovalsService } from './approvals-service'
export { usePendingApprovals } from './hooks/use-pending-approvals'
export { useSubmitApproval } from './hooks/use-submit-approval'

export type { ControlTowerService } from './control-tower-service'
export { mockControlTowerService } from './control-tower-service'
export {
  useControlTowerMetrics,
  useAgents,
  useAgent,
  useAgentExecutions,
  useAgentPerformanceTrend,
  useSystemHealth,
  useAgentSuccessRateTrend,
  useRecentExecutions,
} from './hooks/use-control-tower'

export type { TraceService, TraceEventTone } from './trace-service'
export {
  mockTraceService,
  traceService,
  describeTraceEvent,
  buildAgentGraphTopology,
} from './trace-service'
export { useAgentTrace, useLiveAgentTrace } from './hooks/use-agent-trace'

export type { EventStreamHandle, EventStreamSource } from './lib/event-stream'
export { createMockEventSource, createSSESource } from './lib/event-stream'

export type { GuardrailsService } from './guardrails-service'
export { mockGuardrailsService, triggerDemoGuardrailBlock } from './guardrails-service'
export { useGuardrailRules, useGuardrailEvents, useGuardrailSummary } from './hooks/use-guardrails'

export type { RagService } from './rag-service'
export { mockRagService } from './rag-service'
export {
  useRagDocuments,
  useRagQueries,
  useRagSummary,
  useRagRelevanceTrend,
} from './hooks/use-rag'

export type { LlmUsageService } from './llm-usage-service'
export { mockLlmUsageService } from './llm-usage-service'
export { useModelUsage, useLlmUsageSummary, useLlmUsageTrend } from './hooks/use-llm-usage'

export type { LatencyService } from './latency-service'
export { mockLatencyService } from './latency-service'
export {
  useAgentLatencyBreakdown,
  useLatencySummary,
  useLatencyTrend,
  useSlowExecutions,
} from './hooks/use-latency'

export type { SystemHealthService } from './system-health-service'
export { mockSystemHealthService, triggerDemoIncident } from './system-health-service'
export {
  useSystemComponentMetrics,
  useSystemIncidents,
} from './hooks/use-system-health-detail'

export type { AuditLogService } from './audit-log-service'
export { mockAuditLogService } from './audit-log-service'
export { useAuditLog, useAuditCategoryCounts } from './hooks/use-audit-log'

export type { ExplainabilityService } from './explainability-service'
export { mockExplainabilityService } from './explainability-service'
export {
  useExplainabilitySummary,
  useConfidenceBands,
  useDecisionFactors,
  useLowConfidenceDecisions,
} from './hooks/use-explainability'
