import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  base: '/agroforesterie/',
  plugins: [
    vue(),
    nodePolyfills({ include: ['buffer', 'string_decoder'] })
  ],
  optimizeDeps: {
    include: ['shpjs']
  }
})
