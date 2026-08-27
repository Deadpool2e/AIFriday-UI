import * as React from 'react'

import { cn } from '../lib/cn'
import { LiveDot } from './live-indicator'

export type AgentGraphNodeStatus =
  'completed' | 'running' | 'failed' | 'blocked' | 'pending'

export interface AgentGraphDiagramNode {
  id: string
  label: string
  status: AgentGraphNodeStatus
}

export interface AgentGraphDiagramEdge {
  id: string
  source: string
  target: string
  conditional?: boolean
  active?: boolean
}

interface AgentGraphDiagramProps extends React.ComponentProps<'div'> {
  nodes: AgentGraphDiagramNode[]
  edges: AgentGraphDiagramEdge[]
  onSelectNode?: (id: string) => void
}

const NODE_WIDTH = 168
const NODE_HEIGHT = 56
const COLUMN_GAP = 96
const ROW_GAP = 28

const statusClassName: Record<AgentGraphNodeStatus, string> = {
  completed: 'border-success bg-success/10 text-success',
  // The box itself stays static — a running node is exactly the one a
  // viewer is watching during a live execution, and pulsing its whole
  // label halves its contrast every cycle. The small dot below carries
  // "active" instead.
  running: 'border-info bg-info/10 text-info',
  failed: 'border-danger bg-danger/10 text-danger',
  blocked: 'border-danger bg-danger/10 text-danger',
  pending: 'border-border bg-muted text-muted-foreground',
}

interface Position {
  x: number
  y: number
}

// Longest-path layering (a hand-rolled, dependency-free stand-in for what
// dagre gives Gyros' React Flow graph) — every node's column is 1 + the
// deepest column among its sources, so a fan-out/fan-in graph like this
// pipeline's conditional Guardrails branch still renders as clean left-to-
// right columns instead of overlapping.
function computeColumns(
  nodes: AgentGraphDiagramNode[],
  edges: AgentGraphDiagramEdge[],
): Map<number, string[]> {
  const incoming = new Map<string, string[]>()
  nodes.forEach((node) => incoming.set(node.id, []))
  edges.forEach((edge) => incoming.get(edge.target)?.push(edge.source))

  const layerById = new Map<string, number>()
  function resolveLayer(id: string, guard: Set<string>): number {
    const cached = layerById.get(id)
    if (cached !== undefined) return cached
    if (guard.has(id)) return 0
    guard.add(id)
    const sources = incoming.get(id) ?? []
    const layer =
      sources.length === 0
        ? 0
        : 1 + Math.max(...sources.map((s) => resolveLayer(s, guard)))
    layerById.set(id, layer)
    return layer
  }
  nodes.forEach((node) => resolveLayer(node.id, new Set()))

  const columns = new Map<number, string[]>()
  nodes.forEach((node) => {
    const layer = layerById.get(node.id) ?? 0
    columns.set(layer, [...(columns.get(layer) ?? []), node.id])
  })
  return columns
}

function computePositions(columns: Map<number, string[]>): {
  positions: Map<string, Position>
  width: number
  height: number
} {
  const numColumns = Math.max(...columns.keys()) + 1
  const maxRows = Math.max(
    ...Array.from(columns.values()).map((ids) => ids.length),
  )
  const positions = new Map<string, Position>()

  columns.forEach((ids, column) => {
    const totalHeight = ids.length * NODE_HEIGHT + (ids.length - 1) * ROW_GAP
    const columnHeight = maxRows * NODE_HEIGHT + (maxRows - 1) * ROW_GAP
    const offsetY = (columnHeight - totalHeight) / 2
    ids.forEach((id, row) => {
      positions.set(id, {
        x: column * (NODE_WIDTH + COLUMN_GAP),
        y: offsetY + row * (NODE_HEIGHT + ROW_GAP),
      })
    })
  })

  return {
    positions,
    width: numColumns * NODE_WIDTH + (numColumns - 1) * COLUMN_GAP,
    height: maxRows * NODE_HEIGHT + (maxRows - 1) * ROW_GAP,
  }
}

function edgePath(from: Position, to: Position): string {
  const sx = from.x + NODE_WIDTH
  const sy = from.y + NODE_HEIGHT / 2
  const tx = to.x
  const ty = to.y + NODE_HEIGHT / 2
  const midX = (sx + tx) / 2
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`
}

// A live, node-link view of the agent pipeline behind one execution — each
// node colored by that agent's current TraceStep status, each edge lit up
// once its target agent has actually been reached, and conditional
// branches (e.g. Guardrails -> Human Approval vs. Workflow Complete)
// rendered dashed so the untaken path stays visibly part of the graph
// instead of disappearing. Layout is computed purely from node/edge counts
// (fixed node size, no DOM measurement), so it renders correctly on first
// paint with no layout-effect flash.
function AgentGraphDiagram({
  nodes,
  edges,
  onSelectNode,
  className,
  ...props
}: AgentGraphDiagramProps) {
  const { positions, width, height } = React.useMemo(() => {
    if (nodes.length === 0)
      return { positions: new Map<string, Position>(), width: 0, height: 0 }
    return computePositions(computeColumns(nodes, edges))
  }, [nodes, edges])

  if (nodes.length === 0) return null

  return (
    <div
      data-slot="agent-graph"
      className={cn('overflow-x-auto', className)}
      {...props}
    >
      <div className="relative" style={{ width, height }}>
        <svg
          className="absolute inset-0"
          width={width}
          height={height}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="agent-graph-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-border" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const from = positions.get(edge.source)
            const to = positions.get(edge.target)
            if (!from || !to) return null
            return (
              <path
                key={edge.id}
                d={edgePath(from, to)}
                fill="none"
                strokeWidth={2}
                strokeDasharray={edge.conditional ? '5 4' : undefined}
                className={edge.active ? 'stroke-primary' : 'stroke-border'}
                markerEnd="url(#agent-graph-arrow)"
              />
            )
          })}
        </svg>
        {nodes.map((node) => {
          const position = positions.get(node.id)
          if (!position) return null
          return (
            <div
              key={node.id}
              role={onSelectNode ? 'button' : undefined}
              tabIndex={onSelectNode ? 0 : undefined}
              onClick={onSelectNode ? () => onSelectNode(node.id) : undefined}
              onKeyDown={
                onSelectNode
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelectNode(node.id)
                      }
                    }
                  : undefined
              }
              className={cn(
                'absolute flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 text-center text-sm font-medium shadow-sm transition-colors duration-(--duration-fast)',
                onSelectNode && 'cursor-pointer',
                statusClassName[node.status],
              )}
              style={{
                left: position.x,
                top: position.y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
              }}
            >
              {node.status === 'running' && <LiveDot dotClassName="bg-info" />}
              {node.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { AgentGraphDiagram }
