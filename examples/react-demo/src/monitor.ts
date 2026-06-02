import { createMonitor, createBehaviorPlugin, createErrorPlugin, createPerformancePlugin, createReplayPlugin, createReporterPlugin, createBeaconTransport, createFetchTransport, createImageTransport } from '@monitor/sdk'
import { record } from 'rrweb'
import { onCLS, onINP, onLCP } from 'web-vitals'

const endpoint = 'http://localhost:3000/api/events/batch'
const observeVitals = (report: Parameters<typeof onCLS>[0]) => { onCLS(report); onINP(report); onLCP(report) }
export const monitor = createMonitor({
  appId: 'react-demo',
  endpoint,
  release: '1.0.0',
  plugins: [
    createErrorPlugin(),
    createBehaviorPlugin(),
    createPerformancePlugin({ observeVitals }),
    createReplayPlugin({ record }),
    createReporterPlugin({ transports: [createFetchTransport(endpoint), createBeaconTransport(endpoint), createImageTransport(endpoint)] }),
  ],
})
monitor.start()
