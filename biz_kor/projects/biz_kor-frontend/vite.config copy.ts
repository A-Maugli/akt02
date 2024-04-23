import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser', // 'terser' or 'esbuild'
    rollupOptions: {
      treeshake: true,
    },
    sourcemap: true, // enables map file generation
  }
})
