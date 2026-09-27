import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      useCredentials: true,
      workbox: {
        // The default glob omits woff2, so the fonts were never precached and
        // an offline visitor silently dropped to the system font. Without this
        // line, self-hosting them fixes nothing for the offline case.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      // favicon.ico does not exist in public/; listing it achieved nothing.
      includeAssets: ['apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Lexia Cameroon',
        short_name: 'Lexia',
        description: 'Bilingual Literacy Tool for Cameroon',
        // Matches <meta name="theme-color"> in index.html. They disagreed once
        // and the installed PWA got an indigo splash with a green tab.
        theme_color: '#059669',
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
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        /**
         * Stop rollup emitting sub-kilobyte chunks for individual icons.
         *
         * On a fast connection a dozen tiny files are free. On a weak
         * connection in rural Cameroon, latency dominates: each extra request
         * costs a round trip of several hundred milliseconds regardless of how
         * few bytes come back, so three 1KB chunks are far worse than one 3KB
         * one. Merging anything under 20KB trades a little duplication for
         * fewer round trips, which is the right way round here.
         */
        experimentalMinChunkSize: 20000,
      },
    },
  },
  server: {
    host: true
  }
})
