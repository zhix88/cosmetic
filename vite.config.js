import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function localDemoDataApi() {
  const dataFile = path.resolve(process.cwd(), 'data', 'shared-settings.json')
  return {
    name: 'local-demo-data-api',
    configureServer(server) {
      server.middlewares.use('/api/shared-settings', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        if (req.method === 'GET') {
          try {
            res.end(await readFile(dataFile, 'utf8'))
          } catch {
            res.statusCode = 404
            res.end(JSON.stringify({ data: null }))
          }
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ message: 'Method not allowed' }))
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}')
            if (!payload.data || typeof payload.data !== 'object') throw new Error('Invalid settings payload')
            const result = { updatedAt: Date.now(), data: payload.data }
            await mkdir(path.dirname(dataFile), { recursive: true })
            await writeFile(dataFile, JSON.stringify(result), 'utf8')
            res.end(JSON.stringify(result))
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid settings payload' }))
          }
        })
      })
    }
  }
}

function mobileWorkbenchPreview() {
  const mobileRoot = path.resolve(process.cwd(), 'apps', 'h5')
  return {
    name: 'mobile-workbench-preview',
    configureServer(server) {
      server.middlewares.use('/mobile', async (req, res, next) => {
        const pathname = (req.url || '/').split('?')[0]
        try {
          if (pathname === '/' || pathname === '') {
            const html = await readFile(path.join(mobileRoot, 'index.html'), 'utf8')
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(html.replace('src="/main.js"', 'src="/mobile/main.js"'))
            return
          }
          if (pathname === '/main.js') {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
            res.end(await readFile(path.join(mobileRoot, 'main.js'), 'utf8'))
            return
          }
        } catch (error) {
          next(error)
          return
        }
        next()
      })
    }
  }
}

function localSharedWorkbenchApi() {
  const dataFile = path.resolve(process.cwd(), 'data', 'shared-workbench.json')
  return {
    name: 'local-shared-workbench-api',
    configureServer(server) {
      server.middlewares.use('/api/shared-workbench', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        if (req.method === 'GET') {
          try { res.end(await readFile(dataFile, 'utf8')) }
          catch { res.end(JSON.stringify({ data: [] })) }
          return
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ message: 'Method not allowed' })); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}')
            if (!Array.isArray(payload.data)) throw new Error('Invalid workbench payload')
            const result = { updatedAt: Date.now(), data: payload.data }
            await mkdir(path.dirname(dataFile), { recursive: true })
            await writeFile(dataFile, JSON.stringify(result), 'utf8')
            res.end(JSON.stringify(result))
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid workbench payload' }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  // 默认使用相对资源路径，支持域名根目录和二级目录静态部署。
  base: process.env.VITE_BASE_PATH || './',
  plugins: [vue(), localDemoDataApi(), localSharedWorkbenchApi(), mobileWorkbenchPreview()]
})
