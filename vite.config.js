import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 默认使用相对资源路径，支持域名根目录和二级目录静态部署。
  base: process.env.VITE_BASE_PATH || './',
  plugins: [vue()]
})
