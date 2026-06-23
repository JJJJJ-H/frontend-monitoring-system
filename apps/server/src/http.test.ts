import assert from 'node:assert/strict'
import test from 'node:test'
import { createCorsHeaders, isOriginAllowed } from './http.ts'

const allowedOrigins = ['https://dashboard.test', 'https://demo.test']

test('allows configured origins', () => {
  assert.equal(isOriginAllowed('https://dashboard.test', allowedOrigins), true)
})

test('denies unknown origins', () => {
  assert.equal(isOriginAllowed('https://unknown.test', allowedOrigins), false)
})

test('allows requests without origin for health checks and server-side tools', () => {
  assert.equal(isOriginAllowed(undefined, allowedOrigins), true)
})

test('creates cors headers for allowed browser origin', () => {
  assert.deepEqual(createCorsHeaders('https://demo.test', allowedOrigins), {
    'access-control-allow-origin': 'https://demo.test',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-monitor-internal',
    vary: 'Origin',
  })
})
