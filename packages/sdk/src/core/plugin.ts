import type { EventBus } from './event-bus.ts'
import type { MonitorBusEvents } from './types.ts'

export interface PluginContext {
  endpoint: string
  sessionId: string
  capture<TPayload>(type: string, payload: TPayload): void
}

export interface MonitorPlugin {
  name: string
  setup(bus: EventBus<MonitorBusEvents>, context?: PluginContext): void
}
