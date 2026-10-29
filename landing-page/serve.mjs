import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname, resolve, sep } from 'node:path'

const root = fileURLToPath(new URL(process.argv.includes('--dist') ? './dist/' : './', import.meta.url))
const port = Number(process.env.PORT || 4174)
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp' }

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || !contentTypes[extname(file)]) {
      response.writeHead(404).end('Not found')
      return
    }
    const body = await readFile(file)
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] }).end(body)
  } catch {
    response.writeHead(404).end('Not found')
  }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`))
