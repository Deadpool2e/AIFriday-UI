import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

export default defineConfig({
  server: { port: 5175, strictPort: true },
  preview: { port: 5175, strictPort: true },
  build: { target: 'chrome89' },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'ai_control_tower',
      filename: 'remoteEntry.js',
      // Now owns real internal routing (mirrors main-app's shape) — the
      // Host imports this as `import('ai_control_tower/ControlTowerRoutes')`.
      exposes: {
        './ControlTowerRoutes': './src/control-tower-routes.tsx',
      },
      dts: false,
      // @platform/api-client and @platform/types are new this phase — this
      // remote now reads Agent/metrics/system-health data, and shares
      // @platform/api-client's mock store with main-app (see
      // control-tower-service.ts: some metrics are derived from the same
      // MOCK_REQUESTS array main-app reads, not a separate copy).
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router': { singleton: true },
        '@tanstack/react-query': { singleton: true },
        '@platform/ui': { singleton: true },
        '@platform/theme': { singleton: true },
        '@platform/auth': { singleton: true },
        '@platform/api-client': { singleton: true },
        '@platform/types': { singleton: true },
      },
      dev: { remoteHmr: true },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
