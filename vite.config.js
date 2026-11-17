import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { apiHandler } from './server/index.js'

const localDatabaseApi = {
  name: 'llmcut-local-database-api',
  configureServer(server) {
    attachApi(server)
  },
  configurePreviewServer(server) {
    attachApi(server)
  },
}

function attachApi(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url?.startsWith('/api/')) return apiHandler(req, res)
    return next()
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localDatabaseApi],
})
