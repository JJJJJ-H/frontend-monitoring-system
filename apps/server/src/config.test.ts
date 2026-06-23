import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAllowedOrigins, getServerConfig } from './config.ts'

test('parses allowed origins from comma-separated env', () => {
  assert.deepEqual(parseAllowedOrigins(' https://a.test,https://b.test ,, '), [
    'https://a.test',
    'https://b.test',
  ])
})

test('includes local origins by default for development', () => {
  const config = getServerConfig({})
  assert.equal(config.release, '0.1.0')
  assert.ok(config.allowedOrigins.includes('http://localhost:5173'))
  assert.ok(config.allowedOrigins.includes('http://localhost:5174'))
  assert.ok(config.allowedOrigins.includes('http://localhost:5175'))
})

test('uses production env values when provided', () => {
  const config = getServerConfig({
    MONITOR_ALLOWED_ORIGINS: 'https://dashboard.test,https://demo.test',
    MONITOR_RELEASE: '1.2.3',
  })

  assert.deepEqual(config.allowedOrigins, ['https://dashboard.test', 'https://demo.test'])
  assert.equal(config.release, '1.2.3')
})
