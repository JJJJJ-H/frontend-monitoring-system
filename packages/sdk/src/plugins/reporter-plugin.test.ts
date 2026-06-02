import assert from 'node:assert/strict'
import test from 'node:test'
import { EventBus } from '../core/event-bus.ts'
import type { MonitorBusEvents, MonitorEvent } from '../core/types.ts'
import type { Transport } from '../transports/types.ts'
import { createReporterPlugin } from './reporter-plugin.ts'

function event(id: string): MonitorEvent {
  return {
    id,
    appId: 'demo',
    sessionId: 'session',
    type: 'behavior:click',
    timestamp: 1,
    pageUrl: 'https://example.test',
    release: '1.0.0',
    environment: 'test',
    payload: {},
  }
}

test('flushes queued events when the batch threshold is reached', async () => {
  const batches: MonitorEvent[][] = []
  const transport: Transport = {
    name: 'test',
    send(batch) {
      batches.push(batch)
      return Promise.resolve(true)
    },
  }
  const bus = new EventBus<MonitorBusEvents>()
  createReporterPlugin({ transports: [transport], batchSize: 2, flushInterval: 0 }).setup(bus)

  bus.emit('event:capture', event('one'))
  bus.emit('event:capture', event('two'))
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.deepEqual(batches.map((batch) => batch.map(({ id }) => id)), [['one', 'two']])
})

test('uses the next transport when delivery fails', async () => {
  const used: string[] = []
  const bus = new EventBus<MonitorBusEvents>()
  createReporterPlugin({
    batchSize: 10,
    flushInterval: 0,
    transports: [
      { name: 'fetch', send: async () => (used.push('fetch'), false) },
      { name: 'image', send: async () => (used.push('image'), true) },
    ],
  }).setup(bus)

  bus.emit('event:capture', event('one'))
  bus.emit('report:flush', undefined)
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.deepEqual(used, ['fetch', 'image'])
})
