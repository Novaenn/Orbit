import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist-pages/', import.meta.url))
const base = '/Orbit/'
const port = Number(process.env.PORT || 4175)
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname === base.slice(0, -1) || url.pathname === `${base}app`) {
      response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end()
      return
    }
    if (!url.pathname.startsWith(base)) {
      response.writeHead(404).end('Not found')
      return
    }
    let file = resolve(root, decodeURIComponent(url.pathname.slice(base.length)))
    if (file !== root.slice(0, -1) && !file.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(404).end('Not found')
      return
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
    const body = await readFile(file)
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(body)
  } catch {
    response.writeHead(404).end('Not found')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Landing: http://127.0.0.1:${port}${base}`)
  console.log(`Dashboard: http://127.0.0.1:${port}${base}app/`)
})
