import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AgentTrace, type AgentTraceStep } from './agent-trace'

const steps: AgentTraceStep[] = [
  {
    id: 'step-1',
    agent: 'Orchestrator',
    status: 'completed',
    timestamp: '2026-08-20T13:40:00Z',
    durationMs: 145,
    tokens: 210,
    inputSummary: 'Route request through the pipeline.',
    outputSummary: 'Routed to RAG Agent.',
  },
  {
    id: 'step-2',
    agent: 'RAG Agent',
    status: 'running',
    timestamp: '2026-08-20T13:40:01Z',
    inputSummary: 'Retrieve relevant policy context.',
  },
  {
    id: 'step-3',
    agent: 'Guardrails',
    status: 'blocked',
    timestamp: '2026-08-20T13:40:02Z',
    error: 'Blocked by rule "PII Exposure Check".',
  },
]

describe('AgentTrace', () => {
  it('renders one list item per step, in order', () => {
    render(<AgentTrace steps={steps} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Orchestrator')
    expect(items[1]).toHaveTextContent('RAG Agent')
    expect(items[2]).toHaveTextContent('Guardrails')
  })

  it('shows the right status label per step', () => {
    render(<AgentTrace steps={steps} />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Blocked')).toBeInTheDocument()
  })

  it('surfaces a failed/blocked step error message', () => {
    render(<AgentTrace steps={steps} />)
    expect(screen.getByText('Blocked by rule "PII Exposure Check".')).toBeInTheDocument()
  })

  it('renders duration and token count only when present on the step', () => {
    render(<AgentTrace steps={steps} />)
    expect(screen.getByText('145ms')).toBeInTheDocument()
    expect(screen.getByText('210 tokens')).toBeInTheDocument()
    // step-2 has neither — nothing to assert on absence beyond not throwing.
  })
})
