import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DataTable, type DataTableColumn } from './data-table'

interface Row {
  id: string
  name: string
  score: number
}

const rows: Row[] = [
  { id: '1', name: 'Bravo', score: 10 },
  { id: '2', name: 'Alpha', score: 30 },
  { id: '3', name: 'Charlie', score: 20 },
]

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', sortable: true, sortValue: (r) => r.name, cell: (r) => r.name },
  { id: 'score', header: 'Score', sortable: true, sortValue: (r) => r.score, cell: (r) => r.score },
]

function renderTable(overrides: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  return render(
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.id}
      page={1}
      pageSize={2}
      onPageChange={vi.fn()}
      {...overrides}
    />,
  )
}

function bodyRowNames() {
  return screen.getAllByRole('row').slice(1).map((row) => row.textContent)
}

describe('DataTable', () => {
  it('renders rows in original order with no sort applied', () => {
    renderTable({ pageSize: 10 })
    const names = bodyRowNames()
    expect(names[0]).toContain('Bravo')
    expect(names[1]).toContain('Alpha')
    expect(names[2]).toContain('Charlie')
  })

  it('sorts ascending then descending then back to unsorted on repeated header clicks', async () => {
    renderTable({ pageSize: 10 })
    const nameHeader = screen.getByRole('button', { name: /Name/ })

    await userEvent.click(nameHeader)
    expect(bodyRowNames()[0]).toContain('Alpha')

    await userEvent.click(nameHeader)
    expect(bodyRowNames()[0]).toContain('Charlie')

    await userEvent.click(nameHeader)
    expect(bodyRowNames()[0]).toContain('Bravo') // back to original order
  })

  it('shows pageSize rows on page 1', () => {
    renderTable({ page: 1, pageSize: 2 })
    expect(bodyRowNames()).toHaveLength(2)
  })

  it('shows the remainder on the last page', () => {
    renderTable({ page: 2, pageSize: 2 })
    expect(bodyRowNames()).toHaveLength(1)
  })

  it('shows the loading skeleton instead of rows when isLoading', () => {
    renderTable({ isLoading: true })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the empty state when data is empty', () => {
    renderTable({ data: [], emptyState: <p>Nothing here</p> })
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
