import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html'],
    include: ['framer-motion', 'lucide-react', 'zustand', 'canvas-confetti'],
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/.DS_Store'],
    },
    hmr: {
      overlay: true,
    },
  },
})
