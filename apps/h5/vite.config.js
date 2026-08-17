import { defineConfig } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { mergeWorkbenchSnapshot } from '../../shared/demoDataContract.js'

function localSharedWorkbenchApi() {
  const dataFile = path.resolve(process.cwd(), '..', '..', 'data', 'shared-workbench.json')
  return {
    name: 'local-shared-workbench-api',
    configureServer(server) {
      server.middlewares.use('/api/shared-workbench', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        if (req.method === 'GET') {
          try {
            const raw = JSON.parse(await readFile(dataFile, 'utf8'))
            res.end(JSON.stringify(Array.isArray(raw) ? { updatedAt: 0, data: raw, config: {} } : { ...raw, config: raw.config || {} }))
          }
          catch { res.end(JSON.stringify({ data: [] })) }
          return
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ message: 'Method not allowed' })); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}')
            let current = {}
            try { current = JSON.parse(await readFile(dataFile, 'utf8')) } catch { /* seed file may not exist */ }
            const result = mergeWorkbenchSnapshot(payload, Array.isArray(current) ? { data: current } : current)
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
