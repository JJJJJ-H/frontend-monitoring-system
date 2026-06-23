import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApp } from './app.ts'
import type { ServerConfig } from './config.ts'
import type { Database } from './db.ts'

const jsonContentType = 'application/json; charset=utf-8'

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  return !origin || allowedOrigins.includes(origin)
}

export function createCorsHeaders(origin: string | undefined, allowedOrigins: string[]): Record<string, string> {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? '*'
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-monitor-internal',
    vary: 'Origin',
  }
}

export function createRequestListener(db: Database, config: ServerConfig) {
  const app = createApp(db, config)

  return (request: IncomingMessage, response: ServerResponse) => {
    const origin = Array.isArray(request.headers.origin) ? request.headers.origin[0] : request.headers.origin
    const corsHeaders = createCorsHeaders(origin, config.allowedOrigins)

    const writeJson = (status: number, body: unknown) => {
      response.writeHead(status, {
        ...corsHeaders,
        'content-type': jsonContentType,
      })
      response.end(JSON.stringify(body))
    }

    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      writeJson(403, { error: 'Origin not allowed' })
      return
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders)
      response.end()
      return
    }

    const chunks: Buffer[] = []

    request.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    request.on('error', () => {
      writeJson(400, { error: 'Invalid request' })
    })

    request.on('end', () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8')
        const result = app.handle({
          method: request.method ?? 'GET',
          url: request.url ?? '/',
          body: rawBody ? JSON.parse(rawBody) : undefined,
        })
        writeJson(result.status, result.body)
      } catch {
        writeJson(400, { error: 'Invalid request' })
      }
    })
  }
}
