// Servidor de produção leve para a SPA Vue no Dokku/Fabroku.
// Usa apenas módulos nativos do Node.js; funciona após prune das devDependencies.
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, 'dist')
const port = Number(process.env.PORT || 5000)
const host = process.env.HOST || '0.0.0.0'
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

function sendFile(req, res, file) {
  const extension = path.extname(file).toLowerCase()
  res.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', extension === '.html' || path.basename(file) === 'sw.js'
    ? 'no-cache'
    : (file.includes(path.sep + 'assets' + path.sep) ? 'public, max-age=31536000, immutable' : 'public, max-age=300'))
  if (req.method === 'HEAD') {
    res.writeHead(200)
    res.end()
    return
  }
  const stream = fs.createReadStream(file)
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500)
    res.end()
  })
  stream.pipe(res)
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' })
    res.end()
    return
  }
  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    res.writeHead(400)
    res.end()
    return
  }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) {
    res.writeHead(400)
    res.end()
    return
  }
  const file = path.resolve(root, '.' + pathname)
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403)
    res.end()
    return
  }
  let target = file
  try {
    if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html')
    if (!fs.statSync(target).isFile()) throw new Error('Not a file')
  } catch {
    // Rotas do Vue Router devem carregar o index.html.
    // Assets inexistentes não devem receber HTML com status 200.
    if (path.extname(pathname)) {
      res.writeHead(404)
      res.end()
      return
    }
    target = path.join(root, 'index.html')
    if (!fs.existsSync(target)) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Build de produção indisponível')
      return
    }
  }
  sendFile(req, res, target)
})
server.listen(port, host, () => console.log(`Momentum frontend pronto em http://${host}:${port}`))
