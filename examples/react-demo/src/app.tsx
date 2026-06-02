import { useState } from 'react'
import { monitor } from './monitor'

export function App() {
  const [route, setRoute] = useState('home')
  return <main><h1>React Monitoring Demo</h1><p>Use these controls, then inspect PulseBoard.</p>
    <button onClick={() => { throw new Error('React demo runtime error') }}>Runtime error</button>
    <button onClick={() => Promise.reject(new Error('React demo rejected promise'))}>Rejected promise</button>
    <button onClick={() => fetch('/missing-api')}>Failed request</button>
    <button onClick={() => { history.pushState({}, '', `#/${route === 'home' ? 'profile' : 'home'}`); setRoute(route === 'home' ? 'profile' : 'home') }}>Route change</button>
    <button onClick={() => monitor.flush()}>Flush telemetry</button>
    <label>Replay-safe input <input placeholder="Input is masked in replay" /></label>
    <p>Current route: {route}</p>
  </main>
}
