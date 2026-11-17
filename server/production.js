import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distRoot = resolve(projectRoot, 'dist')
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  let pathname
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) }
  catch { res.writeHead(400).end('Bad request'); return }

  let target = resolve(distRoot, `.${pathname}`)
  if (target !== distRoot && !target.startsWith(`${distRoot}${sep}`)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  if (!existsSync(target) || !statSync(target).isFile()) target = resolve(distRoot, 'index.html')
  if (!existsSync(target)) {
    res.writeHead(503).end('Build the app before starting the server.')
    return
  }

  res.writeHead(200, {
    'content-type': contentTypes[extname(target)] || 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  })
  if (req.method === 'HEAD') res.end()
  else createReadStream(target).pipe(res)
})

const port = Number(process.env.PORT || 4173)
const host = process.env.HOST || '0.0.0.0'
server.listen(port, host, () => console.log(`LLMcut web server listening on ${host}:${port}`))
