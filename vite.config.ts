import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base './' — чтобы сборку можно было открыть из любой папки и позже завернуть в Capacitor (APK/iOS)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Железо — дневник тренировок',
        short_name: 'Железо',
        description: 'Программы и дневник тренировок: бодибилдинг, фитнес, пауэрлифтинг',
        lang: 'ru',
        theme_color: '#111418',
        background_color: '#111418',
        display: 'standalone',
        start_url: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      }
    })
  ]
})
