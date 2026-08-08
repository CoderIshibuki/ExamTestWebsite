/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost',
      '/ws': {
        target: 'http://localhost',
        ws: true
      }
    }
  }
})
