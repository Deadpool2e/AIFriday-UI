import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { useDocumentTitle } from './use-document-title'

function TitleSetter({ title }: { title: string }) {
  useDocumentTitle(title)
  return null
}

describe('useDocumentTitle', () => {
  it('sets document.title on mount', () => {
    render(<TitleSetter title="Guardrails — AI Control Tower" />)
    expect(document.title).toBe('Guardrails — AI Control Tower')
  })

  it('updates document.title when the title prop changes', () => {
    const { rerender } = render(<TitleSetter title="Overview" />)
    expect(document.title).toBe('Overview')

    rerender(<TitleSetter title="Agents" />)
    expect(document.title).toBe('Agents')
  })

  it('restores the previous title on unmount', () => {
    document.title = 'Enterprise AI Platform'
    const { unmount } = render(<TitleSetter title="Requests" />)
    expect(document.title).toBe('Requests')

    unmount()
    expect(document.title).toBe('Enterprise AI Platform')
  })
})
