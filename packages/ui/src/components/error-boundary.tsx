import * as React from 'react'

import { ErrorState } from './error-state'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackTitle?: string
  fallbackDescription?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

// A real React error boundary — must be a class component, there is no
// hook equivalent. Used both as the app-wide catch-all (Phase 4) and,
// later, around every micro-frontend remote (Phase 9), so a remote
// crashing can never take the whole Host down with it.
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Replaced with the real telemetry abstraction once it exists (Section 41).
    console.error('ErrorBoundary caught an error:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title={this.props.fallbackTitle ?? 'Something went wrong'}
          description={
            this.props.fallbackDescription ?? this.state.error.message
          }
          onRetry={this.reset}
          retryLabel="Try again"
        />
      )
    }
    return this.props.children
  }
}

export { ErrorBoundary }
