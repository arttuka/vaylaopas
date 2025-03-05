import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import config from './config.json'

export default defineConfig({
  root: 'src/client/',
  define: { CLIENT_CONFIG: JSON.stringify(config.client) },
  plugins: [react()],
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  server: {
    port: config.server.devserverPort,
    host: 'localhost',
    proxy: {
      '/api/': { target: `http://${config.server.host}:${config.server.port}` },
    },
  },
  preview: {
    port: config.server.devserverPort,
    host: 'localhost',
    proxy: {
      '/api/': { target: `http://${config.server.host}:${config.server.port}` },
    },
  },
})
