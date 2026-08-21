import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

// Module Federation requires native dynamic import()/top-level await in
// the target — 'chrome89' is the plugin's own documented minimum, safely
// modern for a hackathon demo running on current browsers.
export default defineConfig({
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
  build: { target: 'chrome89' },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'main_app',
      filename: 'remoteEntry.js',
      // The Host imports this as `import('main_app/MainAppRoutes')` — see
      // apps/host/src/remotes/remote-main-app.tsx.
      exposes: {
        './MainAppRoutes': './src/main-app-routes.tsx',
      },
      // Off on purpose — the live type-hint generation feature needs a
      // second tsc process per build and (in dev) the consuming app's dev
      // server running just to typecheck. apps/host's manual ambient
      // declarations (src/types/remotes.d.ts) cover this instead, with no
      // such dependency.
      dts: false,
      // Every one of these must also be singleton:true in the Host's
      // config (and ai-control-tower's, once it needs them) — mismatched
      // shared config is the #1 way to accidentally end up with two React
      // instances and a very confusing "useAuth must be used within an
      // AuthProvider" error despite AuthProvider clearly being an ancestor.
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
