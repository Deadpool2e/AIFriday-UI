import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Badge } from './badge'

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge>Enabled</Badge>)
    expect(screen.getByText('Enabled')).toBeInTheDocument()
  })

  it('applies the destructive variant class', () => {
    render(<Badge variant="destructive">Blocked</Badge>)
    expect(screen.getByText('Blocked')).toHaveClass('bg-destructive')
  })

  it('defaults to the default variant when none is given', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default')).toHaveClass('bg-primary')
  })
})
