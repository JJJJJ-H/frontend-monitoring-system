import type { Database } from './db.ts'
import type { ServerConfig } from './config.ts'
import { ingestBatch, queryBehaviors, queryErrors, queryOverview, queryPerformance, queryReplay, querySessions } from './db.ts'
import { restoreFrame, saveSourceMap } from './source-map.ts'

interface AppRequest {
  method: string
  url: string
  body?: any
}

interface AppResponse {
  status: number
  body: unknown
}

const defaultConfig: ServerConfig = {
  release: '0.1.0',
  allowedOrigins: [],
}

export function createApp(db: Database, config: ServerConfig = defaultConfig) {
  return {
    handle(request: AppRequest): AppResponse {
      try {
        const url = new URL(request.url, 'http://monitor.local')
        const appId = url.searchParams.get('appId') ?? ''

        if (request.method === 'GET' && url.pathname === '/api/health') {
          return {
            status: 200,
            body: {
              ok: true,
              service: 'pulseboard-api',
              release: config.release,
              database: 'ready',
            },
          }
        }
        if (request.method === 'POST' && url.pathname === '/api/events/batch') {
          ingestBatch(db, request.body?.events)
          return { status: 202, body: { accepted: request.body.events.length } }
        }
        if (request.method === 'GET' && url.pathname === '/api/events/batch' && url.searchParams.has('data')) {
          const body = JSON.parse(url.searchParams.get('data')!)
          ingestBatch(db, body.events)
          return { status: 202, body: { accepted: body.events.length } }
        }
        if (request.method === 'GET' && url.pathname === '/api/overview') return { status: 200, body: queryOverview(db, appId) }
        if (request.method === 'GET' && url.pathname === '/api/errors') return { status: 200, body: queryErrors(db, appId) }
        if (request.method === 'GET' && url.pathname === '/api/behaviors') return { status: 200, body: queryBehaviors(db, appId) }
        if (request.method === 'GET' && url.pathname === '/api/performance') return { status: 200, body: queryPerformance(db, appId) }
        if (request.method === 'GET' && url.pathname === '/api/sessions') return { status: 200, body: querySessions(db, appId) }
        if (request.method === 'GET' && /^\/api\/sessions\/[^/]+\/replay$/.test(url.pathname)) {
          return { status: 200, body: queryReplay(db, decodeURIComponent(url.pathname.split('/')[3])) }
        }
        if (request.method === 'POST' && url.pathname === '/api/sourcemaps') {
          saveSourceMap(db, request.body)
          return { status: 201, body: { stored: true } }
        }
        if (request.method === 'POST' && url.pathname === '/api/sourcemaps/restore') {
          return { status: 200, body: restoreFrame(db, request.body) }
        }
        return { status: 404, body: { error: 'Not found' } }
      } catch (error) {
        return { status: 400, body: { error: error instanceof Error ? error.message : 'Invalid request' } }
      }
    },
  }
}
