import type { MonitorEvent } from '../core/types.ts'

export interface Transport {
  name: string
  send(events: MonitorEvent[]): Promise<boolean>
}
