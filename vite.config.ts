import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'node:url'

// base './' — чтобы сборку можно было открыть из любой папки и позже завернуть в Capacitor (APK/iOS).
// Режим `artifact` (npm run build:preview) собирает всё в один HTML без service worker — для просмотра по ссылке.
export default defineConfig(({ mode }) => {
  const single = mode === 'artifact'
  return {
    base: './',
    build: single ? { outDir: 'dist-preview', assetsInlineLimit: 100_000_000 } : undefined,
    resolve: single
      ? { alias: { 'virtual:pwa-register': fileURLToPath(new URL('./src/stubs/pwa-register.ts', import.meta.url)) } }
      : undefined,
    plugins: [
      react(),
      single
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'],
            workbox: { maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
            manifest: {
              name: 'Железо',
              short_name: 'Железо',
              description: 'Программы и дневник тренировок: бодибилдинг, фитнес, пауэрлифтинг',
              lang: 'ru',
              theme_color: '#0e0d0c',
              background_color: '#0e0d0c',
              display: 'standalone',
              start_url: './',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
              orientation: 'portrait',
            },
          }),
    ],
  }
})
