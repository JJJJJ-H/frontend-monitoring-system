import type { EventBus } from './event-bus.ts'
import type { MonitorBusEvents } from './types.ts'

export interface MonitorPlugin {
  name: string
  setup(bus: EventBus<MonitorBusEvents>): void
}
