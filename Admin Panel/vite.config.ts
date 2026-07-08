import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { appConfig } from './src/config.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: appConfig.apiBaseUrl,
        changeOrigin: true,
      },
      '/health': {
        target: appConfig.apiBaseUrl,
        changeOrigin: true,
      },
      '/live': {
        target: appConfig.apiBaseUrl,
        changeOrigin: true,
      },
      '/ready': {
        target: appConfig.apiBaseUrl,
        changeOrigin: true,
      },
    },
  },
})
