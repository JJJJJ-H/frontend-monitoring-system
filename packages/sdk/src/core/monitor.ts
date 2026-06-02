import { EventBus } from './event-bus.ts'
import type { MonitorPlugin } from './plugin.ts'
import { createId } from './session.ts'
import type { MonitorBusEvents, MonitorEvent } from './types.ts'

export interface MonitorOptions {
  appId: string
  endpoint: string
  release: string
  environment?: string
  plugins?: MonitorPlugin[]
  clock?: () => number
  idFactory?: () => string
  sessionId?: string
  pageUrl?: () => string
  onError?: (error: unknown) => void
}

export interface Monitor {
  readonly bus: EventBus<MonitorBusEvents>
  start(): void
  stop(): void
  flush(): void
  capture<TPayload>(type: string, payload: TPayload): MonitorEvent<TPayload>
}

export function createMonitor(options: MonitorOptions): Monitor {
  const bus = new EventBus<MonitorBusEvents>(options.onError)
  const clock = options.clock ?? Date.now
  const idFactory = options.idFactory ?? createId
  const sessionId = options.sessionId ?? createId()
  const pageUrl = options.pageUrl ?? (() => globalThis.location?.href ?? '')
  let started = false

  for (const plugin of options.plugins ?? []) {
    try {
      plugin.setup(bus)
    } catch (error) {
      options.onError?.(error)
    }
  }

  return {
    bus,
    start() {
      if (started) return
      started = true
      bus.emit('lifecycle:start', undefined)
    },
    stop() {
      if (!started) return
      started = false
      bus.emit('lifecycle:stop', undefined)
    },
    flush() {
      bus.emit('report:flush', undefined)
    },
    capture<TPayload>(type: string, payload: TPayload) {
      const event: MonitorEvent<TPayload> = {
        id: idFactory(),
        appId: options.appId,
        sessionId,
        type,
        timestamp: clock(),
        pageUrl: pageUrl(),
        release: options.release,
        environment: options.environment ?? 'production',
        payload,
      }
      bus.emit('event:capture', event)
      return event
    },
  }
}
