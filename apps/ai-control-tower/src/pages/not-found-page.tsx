import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button, EmptyState, useDocumentTitle } from '@platform/ui'

export function NotFoundPage() {
  useDocumentTitle('Page Not Found — AI Control Tower')
  return (
    <EmptyState
      icon={<CompassIcon />}
      title="Page not found"
      description="The Control Tower page you're looking for doesn't exist or may have moved."
      action={
        <Button asChild size="sm">
          <Link to="/control-tower">Back to Overview</Link>
        </Button>
      }
      className="mx-auto mt-16 max-w-md"
    />
  )
}
