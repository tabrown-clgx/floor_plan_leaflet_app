import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/floor_plan_leaflet_app/',
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom'
    }
  }
})
