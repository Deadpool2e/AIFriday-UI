export interface DashboardMetrics {
  totalRequests: number
  completed: number
  pending: number
  highRisk: number
  aiProcessed: number
  humanReviewRequired: number
}

export interface RequestVolumePoint {
  date: string
  submitted: number
  completed: number
}

export interface AiActivityPoint {
  date: string
  aiProcessed: number
  humanReview: number
}

export interface ActivityItem {
  id: string
  message: string
  timestamp: string
  severity: 'info' | 'success' | 'warning' | 'danger'
}
