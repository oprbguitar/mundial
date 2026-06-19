import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: '/mundial/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname,'index.html'),
        fixture: resolve(__dirname,'fixture.html'),
      },
    },
  },
})
