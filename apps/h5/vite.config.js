import { defineConfig } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function localSharedWorkbenchApi() {
  const dataFile = path.resolve(process.cwd(), '..', '..', 'data', 'shared-workbench.json')
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

export default defineConfig({ plugins: [localSharedWorkbenchApi()] })
