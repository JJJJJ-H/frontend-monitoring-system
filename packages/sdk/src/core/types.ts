export interface MonitorEvent<TPayload = unknown> {
  id: string
  appId: string
  sessionId: string
  type: string
  timestamp: number
  pageUrl: string
  release: string
  environment: string
  payload: TPayload
}

export interface MonitorBusEvents {
  'lifecycle:start': undefined
  'lifecycle:stop': undefined
  'event:capture': MonitorEvent
  'report:flush': undefined
  'report:success': { count: number }
  'report:failure': { error: unknown; attempts: number }
}
