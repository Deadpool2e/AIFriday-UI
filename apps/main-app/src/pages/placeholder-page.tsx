import {
  EmptyState,
  NotBuiltIllustration,
  PageHeader,
  useDocumentTitle,
} from '@platform/ui'

export function PlaceholderPage({
  title,
  phase,
  eyebrow = 'Workspace',
}: {
  title: string
  phase: string
  eyebrow?: string
}) {
  useDocumentTitle(`${title} — Enterprise AI Platform`)
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} />
      <EmptyState
        icon={<NotBuiltIllustration />}
        title={`${title} isn't built yet`}
        description={`This screen arrives in ${phase}. The navigation, routing, and layout around it are already real.`}
      />
    </div>
  )
}
