import { useEffect, useRef } from 'react'
import rrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'
import { api } from '../api'

export function ReplayPage({ sessionId }: { sessionId: string }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    api.replay(sessionId).then((events) => {
      if (host.current && events.length) new rrwebPlayer({ target: host.current, props: { events } })
    })
  }, [sessionId])
  return <section><h2>Session Replay</h2><p><code>{sessionId}</code></p><div ref={host} /></section>
}
