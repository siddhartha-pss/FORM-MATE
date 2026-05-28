import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Dev server config ──
  server: {
    port: 5173,
    proxy: {
      // Forward /api/* requests to Express backend on port 5000.
      // This lets us write axios.get('/api/users') instead of
      // axios.get('http://localhost:5000/api/users') and avoids CORS issues.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
