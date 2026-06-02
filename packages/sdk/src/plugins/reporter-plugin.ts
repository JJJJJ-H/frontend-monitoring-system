import type { MonitorPlugin } from '../core/plugin.ts'
import type { MonitorBusEvents, MonitorEvent } from '../core/types.ts'
import type { EventBus } from '../core/event-bus.ts'
import type { Transport } from '../transports/types.ts'

export interface ReporterOptions {
  transports: Transport[]
  batchSize?: number
  flushInterval?: number
  maxRetries?: number
}

export function createReporterPlugin(options: ReporterOptions): MonitorPlugin {
  const queue: MonitorEvent[] = []
  const batchSize = options.batchSize ?? 10
  const flushInterval = options.flushInterval ?? 5000
  const maxRetries = options.maxRetries ?? 1
  let timer: ReturnType<typeof setInterval> | undefined
  let sending = false

  async function flush(bus: EventBus<MonitorBusEvents>): Promise<void> {
    if (sending || queue.length === 0) return
    sending = true
    const batch = queue.splice(0, batchSize)
    let attempts = 0
    try {
      while (attempts <= maxRetries) {
        attempts++
        for (const transport of options.transports) {
          if (await transport.send(batch)) {
            bus.emit('report:success', { count: batch.length })
            return
          }
        }
      }
      queue.unshift(...batch)
      bus.emit('report:failure', { error: new Error('All transports failed'), attempts })
    } finally {
      sending = false
    }
  }

  return {
    name: 'reporter',
    setup(bus) {
      bus.on('event:capture', (event) => {
        queue.push(event)
        if (queue.length >= batchSize) void flush(bus)
      })
      bus.on('report:flush', () => void flush(bus))
      bus.on('lifecycle:start', () => {
        if (flushInterval > 0) timer = setInterval(() => void flush(bus), flushInterval)
      })
      bus.on('lifecycle:stop', () => {
        if (timer) clearInterval(timer)
        timer = undefined
        void flush(bus)
      })
    },
  }
}
