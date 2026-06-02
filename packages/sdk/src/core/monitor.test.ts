import assert from 'node:assert/strict'
import test from 'node:test'
import type { MonitorPlugin } from './plugin.ts'
import { createMonitor } from './monitor.ts'

test('starts and stops plugins through lifecycle events only once', () => {
  const calls: string[] = []
  const plugin: MonitorPlugin = {
    name: 'observer',
    setup(bus) {
      bus.on('lifecycle:start', () => calls.push('start'))
      bus.on('lifecycle:stop', () => calls.push('stop'))
    },
  }
  const monitor = createMonitor({
    appId: 'demo',
    endpoint: '/events',
    release: '1.0.0',
    plugins: [plugin],
  })

  monitor.start()
  monitor.start()
  monitor.stop()
  monitor.stop()

  assert.deepEqual(calls, ['start', 'stop'])
})

test('wraps captured payloads in normalized event envelopes', () => {
  const events: unknown[] = []
  const plugin: MonitorPlugin = {
    name: 'collector',
    setup(bus) {
      bus.on('event:capture', (event) => events.push(event))
    },
  }
  const monitor = createMonitor({
    appId: 'demo',
    endpoint: '/events',
    release: '1.0.0',
    plugins: [plugin],
    clock: () => 1710000000000,
    idFactory: () => 'event-id',
    sessionId: 'session-id',
    pageUrl: () => 'https://example.test/profile',
  })

  monitor.capture('behavior:click', { tag: 'button' })

  assert.deepEqual(events, [
    {
      id: 'event-id',
      appId: 'demo',
      sessionId: 'session-id',
      type: 'behavior:click',
      timestamp: 1710000000000,
      pageUrl: 'https://example.test/profile',
      release: '1.0.0',
      environment: 'production',
      payload: { tag: 'button' },
    },
  ])
})

test('flush publishes a report event', () => {
  let flushes = 0
  const plugin: MonitorPlugin = {
    name: 'reporter',
    setup(bus) {
      bus.on('report:flush', () => flushes++)
    },
  }
  const monitor = createMonitor({
    appId: 'demo',
    endpoint: '/events',
    release: '1.0.0',
    plugins: [plugin],
  })

  monitor.flush()

  assert.equal(flushes, 1)
})
