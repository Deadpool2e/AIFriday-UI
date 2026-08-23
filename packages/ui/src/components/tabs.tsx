import * as React from 'react'

import { cn } from '../lib/cn'

// Hand-rolled rather than pulling in @radix-ui/react-tabs — Settings is
// currently the only consumer and a roving-tabindex tablist is ~40 lines
// of real logic, not worth a new dependency for. If a second consumer
// needs more (orientation, manual activation) this is the place to
// upgrade, not before.
interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  idBase: string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext(component: string) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error(`<${component}> must be used within <Tabs>`)
  return ctx
}

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const idBase = React.useId()
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange, idBase }}>
      <div data-slot="tabs" className={cn('space-y-4', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  const listRef = React.useRef<HTMLDivElement>(null)

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const triggers = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    )
    const currentIndex = triggers.findIndex((el) => el === document.activeElement)
    if (currentIndex === -1) return
    event.preventDefault()
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const next = triggers[(currentIndex + delta + triggers.length) % triggers.length]
    next?.focus()
    next?.click()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn('inline-flex items-center gap-1 border-b', className)}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: active, setValue, idBase } = useTabsContext('TabsTrigger')
  const isActive = active === value

  return (
    <button
      type="button"
      role="tab"
      id={`${idBase}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${idBase}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        'relative -mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: active, idBase } = useTabsContext('TabsContent')
  if (active !== value) return null

  return (
    <div role="tabpanel" id={`${idBase}-panel-${value}`} aria-labelledby={`${idBase}-tab-${value}`} tabIndex={0}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
