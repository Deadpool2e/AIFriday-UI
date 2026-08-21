import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

export default defineConfig({
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
  build: { target: 'chrome89' },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'host',
      filename: 'remoteEntry.js',
      exposes: {},
      remotes: {
        main_app: {
          type: 'module',
          name: 'main_app',
          entry: 'http://localhost:5174/remoteEntry.js',
          entryGlobalName: 'main_app',
          shareScope: 'default',
        },
        ai_control_tower: {
          type: 'module',
          name: 'ai_control_tower',
          entry: 'http://localhost:5175/remoteEntry.js',
          entryGlobalName: 'ai_control_tower',
          shareScope: 'default',
        },
      },
      dts: false,
      // Only packages the Host's OWN code actually imports belong here.
      // @platform/api-client + @platform/types joined this list in Phase
      // 20 — the Demo Panel (shell/demo-panel.tsx) mutates the same mock
      // stores main-app/ai-control-tower read, which only works if Host
      // shares the SAME singleton instance of @platform/api-client those
      // remotes already share with each other, not a second copy bundled
      // into Host itself. This must still match main-app's/ai-control-
      // tower's shared config for every package that IS listed here — a
      // mismatch (e.g. sharing react-router in one app but not another)
      // is the most common way to end up with two React instances and a
      // broken "useAuth must be used within an AuthProvider" error
      // despite AuthProvider clearly being an ancestor in the JSX tree.
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
