import type { ApprovalAction, ApprovalState, Request, RequestStatus } from '@platform/types'

import { MOCK_REQUESTS } from './mock-data'

export interface ApprovalActionInput {
  requestId: string
  action: ApprovalAction
  comment?: string
}

export interface ApprovalsService {
  listPending(): Promise<Request[]>
  submitAction(input: ApprovalActionInput): Promise<Request>
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ACTION_RESULT: Record<
  ApprovalAction,
  { approvalState: ApprovalState; status?: RequestStatus }
> = {
  approve: { approvalState: 'approved', status: 'completed' },
  reject: { approvalState: 'rejected', status: 'blocked' },
  send_back: { approvalState: 'pending', status: 'pending' },
  request_info: { approvalState: 'pending', status: 'pending' },
}

// Swap for a real implementation calling POST /api/approvals/{id}/approve
// etc. later (Phase 21). The real backend owns the actual workflow — this
// mock only exists so the approval UI has something real to act on and
// react to during the hackathon.
export const mockApprovalsService: ApprovalsService = {
  async listPending() {
    await delay(300)
    // Only requests with a real AI recommendation to review (you can't
    // review a recommendation that doesn't exist yet — see mock-data.ts: a
    // request can be high-risk but not yet AI-processed), and only ones
    // nobody has acted on this session — "Send Back"/"Request More Info"
    // keep approvalState 'pending' (the workflow isn't resolved), but the
    // queue should still stop asking you about something you just acted on.
    return MOCK_REQUESTS.filter(
      (r) =>
        r.humanReviewRequired &&
        r.approvalState === 'pending' &&
        r.aiRecommendation &&
        !r.lastApprovalAction,
    )
  },

  async submitAction({ requestId, action, comment }) {
    await delay(400)
    const index = MOCK_REQUESTS.findIndex((r) => r.id === requestId)
    if (index === -1) {
      throw new Error(`Request ${requestId} not found`)
    }
    const current = MOCK_REQUESTS[index]
    const result = ACTION_RESULT[action]
    const updated: Request = {
      ...current,
      approvalState: result.approvalState,
      status: result.status ?? current.status,
      updatedAt: new Date().toISOString(),
      lastApprovalAction: {
        action,
        comment: comment || undefined,
        actedAt: new Date().toISOString(),
        actedBy: 'You',
      },
    }
    MOCK_REQUESTS[index] = updated
    return updated
  },
}
