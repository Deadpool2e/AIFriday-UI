import { defineConfig } from 'vitest/config'

// Node environment — this package's tests cover the permission data model
// (permissions.ts), not rendered components.
export default defineConfig({
  test: {
    environment: 'node',
  },
})
