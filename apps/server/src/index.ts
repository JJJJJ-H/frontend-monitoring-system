import { createServer } from 'node:http'
import { createApp } from './app.ts'
import { getServerConfig } from './config.ts'
import { createDatabase } from './db.ts'

const app = createApp(createDatabase(), getServerConfig())
const port = Number(process.env.PORT ?? 3000)

createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,x-monitor-internal',
    })
    response.end()
    return
  }
  const chunks: Buffer[] = []
  request.on('data', (chunk) => chunks.push(chunk))
  request.on('end', () => {
    const rawBody = Buffer.concat(chunks).toString('utf8')
    const result = app.handle({
      method: request.method ?? 'GET',
      url: request.url ?? '/',
      body: rawBody ? JSON.parse(rawBody) : undefined,
    })
    response.writeHead(result.status, {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type,x-monitor-internal',
      'content-type': 'application/json; charset=utf-8',
    })
    response.end(JSON.stringify(result.body))
  })
}).listen(port, () => console.log(`monitor server listening on http://localhost:${port}`))
