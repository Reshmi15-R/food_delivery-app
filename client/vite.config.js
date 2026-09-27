import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development, API and socket requests are proxied to the Express server
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
})
