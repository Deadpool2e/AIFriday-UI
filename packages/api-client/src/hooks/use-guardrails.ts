import { useQuery } from '@tanstack/react-query'

import { mockGuardrailsService } from '../guardrails-service'

export function useGuardrailRules() {
  return useQuery({
    queryKey: ['guardrails', 'rules'],
    queryFn: () => mockGuardrailsService.getRules(),
  })
}

export function useGuardrailEvents() {
  return useQuery({
    queryKey: ['guardrails', 'events'],
    queryFn: () => mockGuardrailsService.getEvents(),
  })
}

export function useGuardrailSummary() {
  return useQuery({
    queryKey: ['guardrails', 'summary'],
    queryFn: () => mockGuardrailsService.getSummary(),
  })
}
