import { useState } from 'react'
import { ErrorsPage } from './pages/errors-page'
import { OverviewPage } from './pages/overview-page'
import { PerformancePage } from './pages/performance-page'
import { ReplayPage } from './pages/replay-page'
import { SessionsPage } from './pages/sessions-page'

type Page = 'overview' | 'errors' | 'performance' | 'sessions'

const pageLabels: Record<Page, string> = {
  overview: '总览',
  errors: '错误',
  performance: '性能',
  sessions: '会话回放',
}

export function App() {
  const [page, setPage] = useState<Page>('overview')
  const [replay, setReplay] = useState('')
  return <div className="shell"><aside><h1>前端监控看板</h1><p>采集、分析、上报、复现</p>{(['overview', 'errors', 'performance', 'sessions'] as Page[]).map((item) =>
    <button className={page === item ? 'active' : ''} key={item} onClick={() => { setReplay(''); setPage(item) }}>{pageLabels[item]}</button>,
  )}</aside><main>{replay ? <ReplayPage sessionId={replay} /> : page === 'overview' ? <OverviewPage /> : page === 'errors' ? <ErrorsPage /> : page === 'performance' ? <PerformancePage /> : <SessionsPage openReplay={setReplay} />}</main></div>
}
