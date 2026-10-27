import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js core + OrbitControls (~510 kB, loaded only on experiment pages) is the largest
    // legitimate chunk; anything above this still triggers Vite's size warning (T31).
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks keep the app entry small and cache well across deploys (T30).
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
});
