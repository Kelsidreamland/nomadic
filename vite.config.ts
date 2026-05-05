import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'node:child_process'

const getGitVersion = () => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

const appVersion = (process.env.VERCEL_GIT_COMMIT_SHA || getGitVersion()).slice(0, 7)
const appBuiltAt = new Date().toISOString()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILT_AT__: JSON.stringify(appBuiltAt),
  },
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'nomadic-version-file',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: appVersion, builtAt: appBuiltAt }, null, 2),
        })
      },
    },
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        cleanupOutdatedCaches: true
      },
      manifest: {
        name: 'Nomadic : my luggage',
        short_name: 'Nomadic',
        description: 'Smart packing and travel management',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
