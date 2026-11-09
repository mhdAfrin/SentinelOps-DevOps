import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_PROXY_')
  const proxy = {
    '/api/': env.API_PROXY_TARGET || 'http://127.0.0.1:5000',
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
