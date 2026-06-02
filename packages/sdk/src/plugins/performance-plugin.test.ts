import assert from 'node:assert/strict'
import test from 'node:test'
import { EventBus } from '../core/event-bus.ts'
import type { MonitorBusEvents } from '../core/types.ts'
import { createPerformancePlugin } from './performance-plugin.ts'

test('captures metrics from injected web vitals observers', () => {
  const captured: Array<{ type: string; payload: unknown }> = []
  const bus = new EventBus<MonitorBusEvents>()
  const plugin = createPerformancePlugin({
    observeVitals(report) {
      report({ name: 'LCP', value: 1200, rating: 'good' })
    },
  })
  plugin.setup(bus, {
    endpoint: '/events',
    sessionId: 'session',
    capture(type, payload) {
      captured.push({ type, payload })
    },
  })

  bus.emit('lifecycle:start', undefined)

  assert.deepEqual(captured, [{ type: 'performance:vital', payload: { name: 'LCP', value: 1200, rating: 'good' } }])
})
