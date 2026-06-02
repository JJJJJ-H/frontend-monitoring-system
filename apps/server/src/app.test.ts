import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from './app.ts'
import { createDatabase } from './db.ts'

const event = {
  id: 'one',
  appId: 'demo',
  sessionId: 'session',
  type: 'error',
  timestamp: 1710000000000,
  pageUrl: 'https://example.test',
  release: '1.0.0',
  environment: 'test',
  payload: { fingerprint: 'boom', message: 'boom' },
}

test('serves health, ingestion, and overview endpoints', () => {
  const app = createApp(createDatabase(':memory:'))

  assert.deepEqual(app.handle({ method: 'GET', url: '/api/health' }), { status: 200, body: { ok: true } })
  assert.equal(app.handle({ method: 'POST', url: '/api/events/batch', body: { events: [event] } }).status, 202)
  assert.deepEqual(app.handle({ method: 'GET', url: '/api/overview?appId=demo' }), {
    status: 200,
    body: { errors: 1, sessions: 1, events: 1, performance: 0 },
  })
})
