import assert from 'node:assert/strict'
import test from 'node:test'
import { createDatabase, ingestBatch, queryOverview } from './db.ts'

const baseEvent = {
  appId: 'demo',
  sessionId: 'session-1',
  timestamp: 1710000000000,
  pageUrl: 'https://example.test',
  release: '1.0.0',
  environment: 'test',
}

test('ingests telemetry batches transactionally and returns overview counts', () => {
  const db = createDatabase(':memory:')

  ingestBatch(db, [
    { ...baseEvent, id: 'error-1', type: 'error', payload: { fingerprint: 'boom', message: 'boom' } },
    { ...baseEvent, id: 'replay-1', type: 'replay', payload: { events: [{ type: 2 }] } },
  ])

  assert.deepEqual(queryOverview(db, 'demo'), {
    errors: 1,
    sessions: 1,
    events: 2,
    performance: 0,
  })
})

test('rejects invalid batches without partial writes', () => {
  const db = createDatabase(':memory:')

  assert.throws(() =>
    ingestBatch(db, [
      { ...baseEvent, id: 'good', type: 'error', payload: { fingerprint: 'boom' } },
      { ...baseEvent, id: '', type: 'error', payload: {} },
    ]),
  )
  assert.equal(queryOverview(db, 'demo').events, 0)
})
