import type { GuardrailEvent, GuardrailRule, GuardrailSummary } from '@platform/types'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MOCK_GUARDRAIL_RULES: GuardrailRule[] = [
  {
    id: 'gr-pii',
    name: 'PII Exposure Check',
    category: 'pii',
    description: 'Blocks responses that would surface unredacted personal identifiers.',
    severity: 'high',
    enabled: true,
    blockCount: 14,
    passCount: 812,
  },
  {
    id: 'gr-prompt-injection',
    name: 'Prompt Injection Filter',
    category: 'prompt_injection',
    description: 'Detects instructions embedded in retrieved documents attempting to override the system prompt.',
    severity: 'critical',
    enabled: true,
    blockCount: 6,
    passCount: 1204,
  },
  {
    id: 'gr-jailbreak',
    name: 'Jailbreak Pattern Detector',
    category: 'jailbreak',
    description: 'Flags known jailbreak phrasing patterns in user input before it reaches an agent.',
    severity: 'critical',
    enabled: true,
    blockCount: 3,
    passCount: 967,
  },
  {
    id: 'gr-toxicity',
    name: 'Toxic Language Filter',
    category: 'toxicity',
    description: 'Screens generated output for hostile or abusive language before it reaches a user.',
    severity: 'medium',
    enabled: true,
    blockCount: 2,
    passCount: 1340,
  },
  {
    id: 'gr-data-leakage',
    name: 'Data Leakage Prevention',
    category: 'data_leakage',
    description: 'Blocks responses that would leak internal system prompts, credentials, or config values.',
    severity: 'high',
    enabled: true,
    blockCount: 5,
    passCount: 1189,
  },
  {
    id: 'gr-policy',
    name: 'Policy Compliance Check',
    category: 'policy',
    description: 'Cross-checks recommendations against active compliance and risk policy documents.',
    severity: 'medium',
    enabled: true,
    blockCount: 9,
    passCount: 1056,
  },
  {
    id: 'gr-legacy-profanity',
    name: 'Legacy Profanity Filter',
    category: 'toxicity',
    description: 'Superseded by the Toxic Language Filter; kept for audit history, not actively enforced.',
    severity: 'low',
    enabled: false,
    blockCount: 0,
    passCount: 0,
  },
]

const MOCK_GUARDRAIL_EVENTS: GuardrailEvent[] = [
  {
    id: 'GR-EVT-501',
    ruleId: 'gr-pii',
    ruleName: 'PII Exposure Check',
    severity: 'high',
    action: 'blocked',
    agent: 'Decision Agent',
    executionId: 'EXEC-4101',
    requestId: 'REQ-92809',
    timestamp: '12 min ago',
  },
  {
    id: 'GR-EVT-500',
    ruleId: 'gr-policy',
    ruleName: 'Policy Compliance Check',
    severity: 'medium',
    action: 'flagged',
    agent: 'Compliance Agent',
    executionId: 'EXEC-4102',
    requestId: 'REQ-92831',
    timestamp: '26 min ago',
  },
  {
    id: 'GR-EVT-499',
    ruleId: 'gr-prompt-injection',
    ruleName: 'Prompt Injection Filter',
    severity: 'critical',
    action: 'blocked',
    agent: 'RAG Agent',
    executionId: 'EXEC-4100',
    requestId: 'REQ-92844',
    timestamp: '41 min ago',
  },
  {
    id: 'GR-EVT-498',
    ruleId: 'gr-data-leakage',
    ruleName: 'Data Leakage Prevention',
    severity: 'high',
    action: 'blocked',
    agent: 'Decision Agent',
    executionId: 'EXEC-4099',
    requestId: 'REQ-92822',
    timestamp: '1 hour ago',
  },
  {
    id: 'GR-EVT-497',
    ruleId: 'gr-toxicity',
    ruleName: 'Toxic Language Filter',
    severity: 'medium',
    action: 'flagged',
    agent: 'Orchestrator',
    executionId: 'EXEC-4098',
    requestId: 'REQ-92815',
    timestamp: '2 hours ago',
  },
  {
    id: 'GR-EVT-496',
    ruleId: 'gr-jailbreak',
    ruleName: 'Jailbreak Pattern Detector',
    severity: 'critical',
    action: 'blocked',
    agent: 'Risk Agent',
    executionId: 'EXEC-4097',
    requestId: 'REQ-92798',
    timestamp: '3 hours ago',
  },
  {
    id: 'GR-EVT-495',
    ruleId: 'gr-policy',
    ruleName: 'Policy Compliance Check',
    severity: 'medium',
    action: 'blocked',
    agent: 'Compliance Agent',
    executionId: 'EXEC-4096',
    requestId: 'REQ-92780',
    timestamp: '5 hours ago',
  },
]

function computeSummary(rules: GuardrailRule[], events: GuardrailEvent[]): GuardrailSummary {
  const activeRules = rules.filter((r) => r.enabled)
  const totalBlocks = rules.reduce((sum, r) => sum + r.blockCount, 0)
  const totalPasses = rules.reduce((sum, r) => sum + r.passCount, 0)
  const topRule = [...rules]
    .filter((r) => r.blockCount > 0)
    .sort((a, b) => b.blockCount - a.blockCount)[0]

  return {
    totalRules: rules.length,
    activeRules: activeRules.length,
    blocksLast24h: events.filter((e) => e.action === 'blocked').length,
    blockRate: totalBlocks + totalPasses === 0 ? 0 : Math.round((totalBlocks / (totalBlocks + totalPasses)) * 1000) / 10,
    topRule: topRule ? { name: topRule.name, blockCount: topRule.blockCount } : null,
  }
}

let demoEventCounter = 0

// Phase 20 (Demo Mode): mutates the same MOCK_GUARDRAIL_EVENTS /
// MOCK_GUARDRAIL_RULES arrays every other guardrails query already reads
// (same pattern as triggerDemoPendingApproval in mock-data.ts) — a click
// on the Demo Panel makes a real block appear in this service's event
// list and bumps its rule's count, live. The executionId is a normal
// string trace-service.ts can build a full trace for, so the resulting
// event links to a real, working trace page.
export function triggerDemoGuardrailBlock(): GuardrailEvent {
  demoEventCounter += 1
  const rule = MOCK_GUARDRAIL_RULES[demoEventCounter % MOCK_GUARDRAIL_RULES.length]
  rule.blockCount += 1

  const event: GuardrailEvent = {
    id: `GR-EVT-DEMO-${demoEventCounter}`,
    ruleId: rule.id,
    ruleName: rule.name,
    severity: rule.severity,
    action: 'blocked',
    agent: 'Decision Agent',
    executionId: `EXEC-DEMO-${demoEventCounter}`,
    requestId: `REQ-DEMO-${demoEventCounter}`,
    timestamp: 'Just now',
  }

  MOCK_GUARDRAIL_EVENTS.unshift(event)
  return event
}

export interface GuardrailsService {
  getRules(): Promise<GuardrailRule[]>
  getEvents(): Promise<GuardrailEvent[]>
  getSummary(): Promise<GuardrailSummary>
}

// Swap for a real implementation calling GET /api/guardrails/rules and
// GET /api/guardrails/events later (Phase 21). Every consumer reaches this
// only through the hooks in hooks/use-guardrails.ts.
export const mockGuardrailsService: GuardrailsService = {
  async getRules() {
    await delay(300)
    return MOCK_GUARDRAIL_RULES
  },
  async getEvents() {
    await delay(300)
    return MOCK_GUARDRAIL_EVENTS
  },
  async getSummary() {
    await delay(250)
    return computeSummary(MOCK_GUARDRAIL_RULES, MOCK_GUARDRAIL_EVENTS)
  },
}
