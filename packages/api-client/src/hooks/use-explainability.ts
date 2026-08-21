import { useQuery } from '@tanstack/react-query'

import { mockExplainabilityService } from '../explainability-service'

export function useExplainabilitySummary() {
  return useQuery({
    queryKey: ['explainability', 'summary'],
    queryFn: () => mockExplainabilityService.getSummary(),
  })
}

export function useConfidenceBands() {
  return useQuery({
    queryKey: ['explainability', 'confidence-bands'],
    queryFn: () => mockExplainabilityService.getConfidenceBands(),
  })
}

export function useDecisionFactors() {
  return useQuery({
    queryKey: ['explainability', 'decision-factors'],
    queryFn: () => mockExplainabilityService.getDecisionFactors(),
  })
}

export function useLowConfidenceDecisions() {
  return useQuery({
    queryKey: ['explainability', 'low-confidence'],
    queryFn: () => mockExplainabilityService.getLowConfidenceDecisions(),
  })
}
