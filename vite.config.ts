import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: https://laktima.github.io/Boris_Table/
  base: '/Boris_Table/',
})
