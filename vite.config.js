import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // 터널링(cloudflared / localtunnel)으로 외부 공유할 때 Vite가 호스트를 차단하지 않도록 허용
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app'],
  },
})
