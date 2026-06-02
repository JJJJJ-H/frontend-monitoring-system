import type { MonitorPlugin, PluginContext } from '../core/plugin.ts'

interface VitalMetric {
  name: string
  value: number
  rating?: string
}

interface PerformanceOptions {
  observeVitals?: (report: (metric: VitalMetric) => void) => void
}

export function createPerformancePlugin(options: PerformanceOptions = {}): MonitorPlugin {
  let observers: PerformanceObserver[] = []

  return {
    name: 'performance',
    setup(bus, context?: PluginContext) {
      bus.on('lifecycle:start', () => {
        options.observeVitals?.((metric) => context?.capture('performance:vital', metric))
        if (!globalThis.PerformanceObserver) return
        for (const type of ['longtask', 'resource']) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                context?.capture(`performance:${type}`, {
                  name: entry.name,
                  startTime: entry.startTime,
                  duration: entry.duration,
                })
              }
            })
            observer.observe({ type, buffered: true })
            observers.push(observer)
          } catch {
            // Browsers may not support every performance entry type.
          }
        }
      })
      bus.on('lifecycle:stop', () => {
        observers.forEach((observer) => observer.disconnect())
        observers = []
      })
    },
  }
}
