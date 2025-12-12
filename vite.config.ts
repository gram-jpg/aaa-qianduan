import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    react(),
    // enable single-file output on build for easier deployment
    ...(command === 'build' ? [viteSingleFile()] : [])
  ],
  server: {
    proxy: {
      '/api': process.env.BACKEND_URL || 'http://localhost:3001'
    }
  }
}))
