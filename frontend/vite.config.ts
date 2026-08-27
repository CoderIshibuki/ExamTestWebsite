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
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@mediapipe') || id.includes('onnxruntime')) {
              return 'vendor-ai';
            }
          }
        }
      }
    }
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
