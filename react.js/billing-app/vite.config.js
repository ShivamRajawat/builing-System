import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    caseSensitive: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://builing-system-1.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})