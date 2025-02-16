import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import VitePluginWasm from 'vite-plugin-wasm';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePluginWasm()],
  // build: {
  //   target: 'ES2022', // Supports top-level await
  // },
  optimizeDeps: { esbuildOptions: { target: "esnext" } }, // 
})
