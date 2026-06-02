import { useState } from 'react'
import { ErrorsPage } from './pages/errors-page'
import { OverviewPage } from './pages/overview-page'
import { PerformancePage } from './pages/performance-page'
import { ReplayPage } from './pages/replay-page'
import { SessionsPage } from './pages/sessions-page'

type Page = 'overview' | 'errors' | 'performance' | 'sessions'

export function App() {
  const [page, setPage] = useState<Page>('overview')
  const [replay, setReplay] = useState('')
  return <div className="shell"><aside><h1>PulseBoard</h1><p>Frontend monitor</p>{(['overview', 'errors', 'performance', 'sessions'] as Page[]).map((item) =>
    <button className={page === item ? 'active' : ''} key={item} onClick={() => { setReplay(''); setPage(item) }}>{item}</button>,
  )}</aside><main>{replay ? <ReplayPage sessionId={replay} /> : page === 'overview' ? <OverviewPage /> : page === 'errors' ? <ErrorsPage /> : page === 'performance' ? <PerformancePage /> : <SessionsPage openReplay={setReplay} />}</main></div>
}
