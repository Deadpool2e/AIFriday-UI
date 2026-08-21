import type {
  ActivityItem,
  AiActivityPoint,
  DashboardMetrics,
  RequestVolumePoint,
} from '@platform/types'

import { MOCK_REQUESTS } from './mock-data'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function computeDashboardMetrics(): DashboardMetrics {
  return {
    totalRequests: MOCK_REQUESTS.length,
    completed: MOCK_REQUESTS.filter((r) => r.status === 'completed').length,
    pending: MOCK_REQUESTS.filter((r) => r.status === 'pending' || r.status === 'running')
      .length,
    highRisk: MOCK_REQUESTS.filter((r) => r.risk === 'high' || r.risk === 'critical').length,
    aiProcessed: MOCK_REQUESTS.filter((r) => r.aiProcessed).length,
    humanReviewRequired: MOCK_REQUESTS.filter((r) => r.humanReviewRequired).length,
  }
}

function generateRequestVolume(days: number): RequestVolumePoint[] {
  const base = Date.parse('2026-08-18T00:00:00Z')
  const points: RequestVolumePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    const submitted = 8 + ((i * 7) % 11)
    const completed = Math.max(3, submitted - 2 - (i % 3))
    points.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submitted,
      completed,
    })
  }
  return points
}

function generateAiActivity(days: number): AiActivityPoint[] {
  const base = Date.parse('2026-08-18T00:00:00Z')
  const points: AiActivityPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    points.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      aiProcessed: 10 + ((i * 5) % 9),
      humanReview: 2 + (i % 4),
    })
  }
  return points
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'ACT-1',
    message: 'REQ-92831 completed with 94% confidence',
    timestamp: '8 min ago',
    severity: 'success',
  },
  {
    id: 'ACT-2',
    message: 'Guardrail blocked REQ-92809 — policy violation detected',
    timestamp: '31 min ago',
    severity: 'danger',
  },
  {
    id: 'ACT-3',
    message: 'REQ-92844 escalated to Manager review',
    timestamp: '1 hour ago',
    severity: 'warning',
  },
  {
    id: 'ACT-4',
    message: 'Compliance Agent flagged REQ-92822 for missing documentation',
    timestamp: '2 hours ago',
    severity: 'warning',
  },
  {
    id: 'ACT-5',
    message: 'REQ-92815 approved by M. Webb',
    timestamp: '3 hours ago',
    severity: 'success',
  },
  {
    id: 'ACT-6',
    message: 'New request REQ-92846 submitted by T. Yamamoto',
    timestamp: '4 hours ago',
    severity: 'info',
  },
]

export interface MetricsService {
  getDashboardMetrics(): Promise<DashboardMetrics>
  getRequestVolume(): Promise<RequestVolumePoint[]>
  getAiActivity(): Promise<AiActivityPoint[]>
  getRecentActivity(): Promise<ActivityItem[]>
}

// Same swap seam as requests-service.ts — real implementation calls
// GET /api/metrics later, consumers never change.
export const mockMetricsService: MetricsService = {
  async getDashboardMetrics() {
    await delay(300)
    return computeDashboardMetrics()
  },
  async getRequestVolume() {
    await delay(300)
    return generateRequestVolume(14)
  },
  async getAiActivity() {
    await delay(300)
    return generateAiActivity(14)
  },
  async getRecentActivity() {
    await delay(200)
    return MOCK_ACTIVITY
  },
}
