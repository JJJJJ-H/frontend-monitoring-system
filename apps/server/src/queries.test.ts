import assert from 'node:assert/strict'
import test from 'node:test'
import { createDatabase, ingestBatch, queryErrors, queryPerformance, queryReplay } from './db.ts'

const baseEvent = {
  appId: 'demo',
  sessionId: 'session-1',
  timestamp: 1710000000000,
  pageUrl: 'https://example.test',
  release: '1.0.0',
  environment: 'test',
}

test('groups errors by fingerprint', () => {
  const db = createDatabase(':memory:')
  ingestBatch(db, [
    { ...baseEvent, id: 'one', type: 'error', payload: { fingerprint: 'boom', message: 'boom' } },
    { ...baseEvent, id: 'two', type: 'error', timestamp: 1710000001000, payload: { fingerprint: 'boom', message: 'boom' } },
  ])

  assert.deepEqual(queryErrors(db, 'demo'), [
    { fingerprint: 'boom', message: 'boom', count: 2, latestTimestamp: 1710000001000 },
  ])
})

test('returns performance trends and replay events', () => {
  const db = createDatabase(':memory:')
  ingestBatch(db, [
    { ...baseEvent, id: 'perf', type: 'performance:longtask', payload: { duration: 80 } },
    { ...baseEvent, id: 'replay', type: 'replay', payload: { events: [{ type: 2 }, { type: 3 }] } },
  ])

  assert.deepEqual(queryPerformance(db, 'demo'), [
    { type: 'performance:longtask', timestamp: 1710000000000, value: 80, duration: 80, name: '', rating: '' },
  ])
  assert.deepEqual(queryReplay(db, 'session-1'), [{ type: 2 }, { type: 3 }])
})
