import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api'
import { useApi } from '../hooks'

export function PerformancePage() {
  const { data, error } = useApi(api.performance, [])
  return <section><h2>Performance Timeline</h2>{error && <p className="error">{error}</p>}<div className="chart">
    <ResponsiveContainer><LineChart data={data}><XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} /><YAxis /><Tooltip /><Line dataKey="duration" stroke="#58a6ff" /></LineChart></ResponsiveContainer>
  </div>{!data.length && <p className="empty">No performance events captured yet.</p>}</section>
}
