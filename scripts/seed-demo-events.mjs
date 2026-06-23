const apiUrl = process.argv[2]

if (!apiUrl) {
  console.error('Usage: node scripts/seed-demo-events.mjs https://your-api.onrender.com')
  process.exit(1)
}

const endpoint = `${apiUrl.replace(/\/$/, '')}/api/events/batch`
const now = Date.now()
const sessionId = `seed-${now}`

const base = {
  appId: 'react-demo',
  sessionId,
  pageUrl: 'https://pulseboard-demo.vercel.app',
  release: '1.0.0',
  environment: 'production',
}

const events = [
  {
    ...base,
    id: `${sessionId}-error`,
    type: 'error',
    timestamp: now - 4000,
    payload: { fingerprint: 'seed-runtime-error', message: 'Seeded runtime error' },
  },
  {
    ...base,
    id: `${sessionId}-lcp`,
    type: 'performance:lcp',
    timestamp: now - 3000,
    payload: { name: 'LCP', value: 1840, rating: 'good' },
  },
  {
    ...base,
    id: `${sessionId}-click`,
    type: 'behavior:click',
    timestamp: now - 2000,
    payload: { kind: 'click', tag: 'button', text: '立即上报数据' },
  },
  {
    ...base,
    id: `${sessionId}-fetch`,
    type: 'behavior:fetch',
    timestamp: now - 1000,
    payload: { kind: 'fetch', url: '/missing-api', method: 'GET', status: 404, duration: 120 },
  },
]

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ events }),
})

if (!response.ok) {
  console.error(`Seed failed: ${response.status}`)
  console.error(await response.text())
  process.exit(1)
}

console.log(await response.text())
