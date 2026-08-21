import { defineConfig } from 'vitest/config'

// Node environment, not jsdom — every test in this package exercises pure
// service/reducer logic or apiFetch() against an MSW-mocked fetch, never a
// rendered component. Component-level tests belong in packages/ui.
export default defineConfig({
  test: {
    environment: 'node',
  },
})
