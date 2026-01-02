import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { subresourceIntegrity } from 'vite-plugin-sri'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    subresourceIntegrity()
  ],
})
