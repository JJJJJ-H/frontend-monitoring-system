import { createApp } from 'vue'
import { record } from 'rrweb'
import { onCLS, onINP, onLCP } from 'web-vitals'
import { createMonitor, createBehaviorPlugin, createErrorPlugin, createPerformancePlugin, createReplayPlugin, createReporterPlugin, createFetchTransport, createBeaconTransport, createImageTransport } from '@monitor/sdk'
import App from './App.vue'

const endpoint = 'http://localhost:3000/api/events/batch'
const observeVitals = (report: Parameters<typeof onCLS>[0]) => { onCLS(report); onINP(report); onLCP(report) }
const monitor = createMonitor({
  appId: 'vue-demo', endpoint, release: '1.0.0', plugins: [
    createErrorPlugin(), createBehaviorPlugin(), createPerformancePlugin({ observeVitals }), createReplayPlugin({ record }),
    createReporterPlugin({ transports: [createFetchTransport(endpoint), createBeaconTransport(endpoint), createImageTransport(endpoint)] }),
  ],
})
monitor.start()
createApp(App, { monitor }).mount('#app')
