import { createApp } from 'vue'
import { record } from 'rrweb'
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals'
import { createMonitor, createBehaviorPlugin, createErrorPlugin, createPerformancePlugin, createReplayPlugin, createReporterPlugin, createWhiteScreenPlugin, createFetchTransport, createBeaconTransport, createImageTransport } from '@monitor/sdk'
import App from './App.vue'

const endpoint = 'http://localhost:3000/api/events/batch'
const observeVitals = (report: (metric: Metric) => void) => { onCLS(report); onINP(report); onLCP(report) }
const monitor = createMonitor({
  appId: 'vue-demo', endpoint, release: '1.0.0', plugins: [
    createErrorPlugin(), createWhiteScreenPlugin(), createBehaviorPlugin(), createPerformancePlugin({ observeVitals }), createReplayPlugin({ record }),
    createReporterPlugin({ transports: [createFetchTransport(endpoint), createBeaconTransport(endpoint), createImageTransport(endpoint)] }),
  ],
})
monitor.start()
createApp(App, { monitor }).mount('#app')
