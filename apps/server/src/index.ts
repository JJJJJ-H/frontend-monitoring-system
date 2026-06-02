import { createServer } from 'node:http'
import { createApp } from './app.ts'
import { createDatabase } from './db.ts'

const app = createApp(createDatabase())
const port = Number(process.env.PORT ?? 3000)

createServer((request, response) => {
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
      'content-type': 'application/json; charset=utf-8',
    })
    response.end(JSON.stringify(result.body))
  })
}).listen(port, () => console.log(`monitor server listening on http://localhost:${port}`))
