import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ConfidenceScore } from './confidence-score'

describe('ConfidenceScore', () => {
  it('renders the clamped percentage label', () => {
    render(<ConfidenceScore value={87.6} />)
    expect(screen.getByText('88%')).toBeInTheDocument()
  })

  it('clamps out-of-range values into 0-100', () => {
    const { rerender } = render(<ConfidenceScore value={140} />)
    expect(screen.getByText('100%')).toBeInTheDocument()

    rerender(<ConfidenceScore value={-20} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  // Same threshold bands the rest of the app assumes this component
  // established (explainability-service.ts's confidenceBand() and
  // guardrails-page.tsx's severity tones both reuse this success/warning/
  // danger vocabulary) — if these thresholds ever drift, that assumption
  // breaks silently elsewhere, so it's worth pinning down here.
  it.each([
    [95, 'bg-success'],
    [80, 'bg-success'],
    [79, 'bg-warning'],
    [50, 'bg-warning'],
    [49, 'bg-danger'],
    [0, 'bg-danger'],
  ])('uses tone %s -> %s at the correct threshold', (value, expectedClass) => {
    const { container } = render(<ConfidenceScore value={value} />)
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar).toHaveClass(expectedClass)
  })
})
