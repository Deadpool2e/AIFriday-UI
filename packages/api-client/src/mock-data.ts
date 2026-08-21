import type {
  ApprovalState,
  GuardrailCheckSummary,
  Request,
  RequestPriority,
  RequestStatus,
  RiskLevel,
} from '@platform/types'

const TITLES = [
  'High-risk transaction review',
  'Vendor contract compliance check',
  'Quarterly expense anomaly review',
  'New hire access provisioning',
  'Customer refund exception approval',
  'Third-party API integration risk assessment',
  'Invoice duplicate detection review',
  'Cross-border payment compliance check',
  'Data retention policy exception',
  'Supplier onboarding risk review',
  'Contract renewal risk assessment',
  'Chargeback dispute review',
  'Access control policy exception',
  'Regulatory filing accuracy check',
  'Merchant risk re-assessment',
]

const OWNERS = [
  'R. Chandran',
  'S. Okafor',
  'M. Ibarra',
  'Priya Nair',
  'Marcus Webb',
  'Elena Torres',
  'J. Alavi',
  'K. Sundaram',
  'A. Petrov',
  'L. Fontaine',
  'T. Yamamoto',
  'D. Osei',
]

const STATUSES: RequestStatus[] = [
  'completed',
  'completed',
  'completed',
  'running',
  'pending',
  'pending',
  'escalated',
  'blocked',
  'degraded',
  'failed',
]

const PRIORITIES: RequestPriority[] = ['normal', 'normal', 'high', 'low', 'urgent']

const RISKS: RiskLevel[] = ['low', 'low', 'medium', 'medium', 'high', 'critical']

function generateGuardrailChecks(id: string, risk: RiskLevel): GuardrailCheckSummary[] {
  const checks: GuardrailCheckSummary[] = [
    { id: `${id}-GR1`, rule: 'Sensitive data exposure', status: 'passed' },
    {
      id: `${id}-GR2`,
      rule: 'Policy compliance',
      status: risk === 'critical' ? 'flagged' : 'passed',
    },
  ]
  if (risk === 'high' || risk === 'critical') {
    checks.push({
      id: `${id}-GR3`,
      rule: 'Transaction threshold',
      status: risk === 'critical' ? 'blocked' : 'flagged',
      detail: 'Amount exceeds the standard auto-approval threshold.',
    })
  }
  return checks
}

function generateRequests(count: number): Request[] {
  const baseDate = Date.parse('2026-08-18T09:00:00Z')
  const requests: Request[] = []

  for (let i = 0; i < count; i++) {
    const id = `REQ-${92800 + i}`
    const title = TITLES[i % TITLES.length]
    const owner = OWNERS[(i * 3 + 1) % OWNERS.length]
    const status = STATUSES[(i * 7) % STATUSES.length]
    const priority = PRIORITIES[(i * 5) % PRIORITIES.length]
    const risk = RISKS[(i * 11) % RISKS.length]
    const createdAt = new Date(baseDate - i * 3 * 60 * 60 * 1000).toISOString()
    const updatedAt = new Date(
      baseDate - i * 3 * 60 * 60 * 1000 + 45 * 60 * 1000,
    ).toISOString()

    const aiProcessed = status !== 'pending'
    const humanReviewRequired =
      risk === 'high' || risk === 'critical' || status === 'escalated'
    const approvalState: ApprovalState = !humanReviewRequired
      ? 'not_required'
      : status === 'completed'
        ? 'approved'
        : status === 'blocked'
          ? 'rejected'
          : 'pending'

    requests.push({
      id,
      title: `${title} — ${id}`,
      status,
      priority,
      risk,
      owner,
      createdAt,
      updatedAt,
      aiProcessed,
      humanReviewRequired,
      approvalState,
      aiRecommendation: aiProcessed
        ? {
            decision:
              risk === 'critical' ? 'escalate' : risk === 'high' ? 'review' : 'approve',
            confidence: 60 + ((i * 13) % 38),
            risk,
            summary: `Automated review found ${risk} risk based on transaction pattern and policy match history.`,
          }
        : undefined,
      agentExecutions: [
        { agent: 'Orchestrator', status: 'completed', durationMs: 120 + (i % 5) * 40 },
        {
          agent: 'Risk Agent',
          status: aiProcessed ? 'completed' : 'skipped',
          durationMs: 800 + (i % 7) * 120,
        },
        {
          agent: 'Compliance Agent',
          status: aiProcessed ? 'completed' : 'skipped',
          durationMs: 650 + (i % 4) * 90,
        },
        {
          agent: 'Decision Agent',
          status: aiProcessed ? 'completed' : 'skipped',
          durationMs: 400 + (i % 6) * 60,
        },
      ],
      documents: [
        { id: `${id}-DOC-1`, name: 'Supporting evidence.pdf', type: 'PDF', sizeLabel: '482 KB' },
        { id: `${id}-DOC-2`, name: 'Policy reference.docx', type: 'DOCX', sizeLabel: '128 KB' },
      ],
      timeline: [
        { id: `${id}-T1`, label: 'Request submitted', timestamp: createdAt, status: 'completed' },
        {
          id: `${id}-T2`,
          label: 'AI review completed',
          timestamp: updatedAt,
          status: aiProcessed ? 'completed' : 'upcoming',
        },
        {
          id: `${id}-T3`,
          label: 'Human approval',
          timestamp: updatedAt,
          status:
            approvalState === 'approved' || approvalState === 'rejected'
              ? 'completed'
              : humanReviewRequired
                ? 'current'
                : 'upcoming',
        },
      ],
      guardrailChecks: generateGuardrailChecks(id, risk),
    })
  }

  return requests
}

export const MOCK_REQUESTS = generateRequests(47)

const DEMO_TITLES = [
  'Urgent wire transfer risk review',
  'Flagged cross-border payment',
  'Suspicious activity escalation',
  'High-value refund exception',
]

let demoRequestCounter = 0

// Phase 20 (Demo Mode): mutates the exact same MOCK_REQUESTS array every
// other page already reads — submitAction() above already established
// that this array is a live, mutable store, not a frozen fixture. Calling
// this from the Demo Panel makes a new pending approval appear in Main
// App's Requests/Approvals lists AND shift Control Tower's Overview,
// LLM Usage, and Explainability KPIs, all from one click, because they all
// ultimately read this one array.
export function triggerDemoPendingApproval(): Request {
  demoRequestCounter += 1
  const id = `REQ-DEMO-${demoRequestCounter}`
  const title = DEMO_TITLES[(demoRequestCounter - 1) % DEMO_TITLES.length]
  const now = new Date().toISOString()

  const request: Request = {
    id,
    title: `Live Demo: ${title} — ${id}`,
    status: 'escalated',
    priority: 'urgent',
    risk: 'high',
    owner: 'Demo Panel',
    createdAt: now,
    updatedAt: now,
    aiProcessed: true,
    humanReviewRequired: true,
    approvalState: 'pending',
    aiRecommendation: {
      decision: 'review',
      confidence: 68,
      risk: 'high',
      summary: 'Automated review found high risk based on transaction pattern and policy match history.',
    },
    agentExecutions: [
      { agent: 'Orchestrator', status: 'completed', durationMs: 140 },
      { agent: 'Risk Agent', status: 'completed', durationMs: 890 },
      { agent: 'Compliance Agent', status: 'completed', durationMs: 760 },
      { agent: 'Decision Agent', status: 'completed', durationMs: 410 },
    ],
    documents: [
      { id: `${id}-DOC-1`, name: 'Supporting evidence.pdf', type: 'PDF', sizeLabel: '512 KB' },
    ],
    timeline: [
      { id: `${id}-T1`, label: 'Request submitted', timestamp: now, status: 'completed' },
      { id: `${id}-T2`, label: 'AI review completed', timestamp: now, status: 'completed' },
      { id: `${id}-T3`, label: 'Human approval', timestamp: now, status: 'current' },
    ],
    guardrailChecks: generateGuardrailChecks(id, 'high'),
  }

  MOCK_REQUESTS.unshift(request)
  return request
}
