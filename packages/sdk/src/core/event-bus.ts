export type EventMap = Record<string, unknown>
export type EventHandler<TPayload> = (payload: TPayload) => void

export class EventBus<TEvents extends Record<keyof TEvents, unknown>> {
  private readonly handlers = new Map<keyof TEvents, Set<EventHandler<unknown>>>()
  private readonly onError: (error: unknown) => void

  constructor(onError: (error: unknown) => void = console.error) {
    this.onError = onError
  }

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
    const handlers = this.handlers.get(event) ?? new Set<EventHandler<unknown>>()
    handlers.add(handler as EventHandler<unknown>)
    this.handlers.set(event, handlers)

    return () => {
      handlers.delete(handler as EventHandler<unknown>)
      if (handlers.size === 0) {
        this.handlers.delete(event)
      }
    }
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    for (const handler of this.handlers.get(event) ?? []) {
      try {
        handler(payload)
      } catch (error) {
        this.onError(error)
      }
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}
