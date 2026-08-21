import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from './button'

describe('Button', () => {
  it('renders its children and responds to clicks', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Approve</Button>)

    const button = screen.getByRole('button', { name: 'Approve' })
    expect(button).toBeInTheDocument()

    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies the destructive variant class', () => {
    render(<Button variant="destructive">Reject</Button>)
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveClass('bg-destructive')
  })

  it('is disabled and inert when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Submit
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
