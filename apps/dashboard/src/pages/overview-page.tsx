import { api } from '../api'
import { useApi } from '../hooks'

export function OverviewPage() {
  const { data, error } = useApi(api.overview, { errors: 0, sessions: 0, events: 0, performance: 0 })
  return <section><h2>Overview</h2>{error && <p className="error">{error}</p>}<div className="cards">
    {Object.entries(data).map(([label, value]) => <article className="card" key={label}><span>{label}</span><strong>{value}</strong></article>)}
  </div></section>
}
