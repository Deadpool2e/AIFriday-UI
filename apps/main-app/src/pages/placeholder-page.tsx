import { ConstructionIcon } from 'lucide-react'
import { EmptyState, useDocumentTitle } from '@platform/ui'

export function PlaceholderPage({
  title,
  phase,
}: {
  title: string
  phase: string
}) {
  useDocumentTitle(`${title} — Enterprise AI Platform`)
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <EmptyState
        icon={<ConstructionIcon />}
        title={`${title} isn't built yet`}
        description={`This screen arrives in ${phase}. The navigation, routing, and layout around it are already real.`}
        className="mt-6"
      />
    </div>
  )
}
