import * as React from 'react'

// React Router doesn't set document.title on navigation — nothing in this
// app did, until now, which meant every page (and every browser tab in a
// multi-tab demo) showed the same static "Enterprise AI Platform" title
// from index.html forever. Restores the previous title on unmount mostly
// for correctness in nested/transient cases; top-level page navigation
// overwrites it again immediately regardless.
export function useDocumentTitle(title: string) {
  React.useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
