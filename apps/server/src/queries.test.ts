import assert from 'node:assert/strict'
import test from 'node:test'
import { createDatabase, ingestBatch, queryBehaviors, queryErrors, queryPerformance, queryReplay } from './db.ts'

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

test('returns user behavior timeline events', () => {
  const db = createDatabase(':memory:')
  ingestBatch(db, [
    { ...baseEvent, id: 'click', type: 'behavior:click', payload: { tag: 'button', text: '立即上报数据', id: '' } },
    { ...baseEvent, id: 'route', type: 'behavior:route', timestamp: 1710000001000, payload: { url: 'https://example.test/profile' } },
    { ...baseEvent, id: 'request', type: 'behavior:request', timestamp: 1710000002000, payload: { kind: 'fetch', url: '/api/user', method: 'GET', status: 200, duration: 32 } },
  ])

  assert.deepEqual(queryBehaviors(db, 'demo'), [
    { type: 'behavior:request', timestamp: 1710000002000, sessionId: 'session-1', pageUrl: 'https://example.test', kind: 'fetch', url: '/api/user', method: 'GET', status: 200, duration: 32, tag: '', text: '' },
    { type: 'behavior:route', timestamp: 1710000001000, sessionId: 'session-1', pageUrl: 'https://example.test', kind: '', url: 'https://example.test/profile', method: '', status: null, duration: null, tag: '', text: '' },
    { type: 'behavior:click', timestamp: 1710000000000, sessionId: 'session-1', pageUrl: 'https://example.test', kind: '', url: '', method: '', status: null, duration: null, tag: 'button', text: '立即上报数据' },
  ])
})
