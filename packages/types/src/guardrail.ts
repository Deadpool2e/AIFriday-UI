export type GuardrailCategory =
  | 'pii'
  | 'prompt_injection'
  | 'jailbreak'
  | 'toxicity'
  | 'data_leakage'
  | 'policy'

export type GuardrailSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface GuardrailRule {
  id: string
  name: string
  category: GuardrailCategory
  description: string
  severity: GuardrailSeverity
  enabled: boolean
  blockCount: number
  passCount: number
}

export interface GuardrailEvent {
  id: string
  ruleId: string
  ruleName: string
  severity: GuardrailSeverity
  action: 'blocked' | 'flagged'
  agent: string
  executionId: string
  requestId: string
  timestamp: string
}

export interface GuardrailSummary {
  totalRules: number
  activeRules: number
  blocksLast24h: number
  blockRate: number
  topRule: { name: string; blockCount: number } | null
}
