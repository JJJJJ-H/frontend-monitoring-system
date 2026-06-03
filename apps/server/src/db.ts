import { DatabaseSync } from 'node:sqlite'
import { schema } from './schema.ts'

export interface StoredEvent {
  id: string
  appId: string
  sessionId: string
  type: string
  timestamp: number
  pageUrl: string
  release: string
  environment: string
  payload: Record<string, any>
}

export type Database = InstanceType<typeof DatabaseSync>

export function createDatabase(path = process.env.MONITOR_DB_PATH ?? './monitor.db'): Database {
  const db = new DatabaseSync(path)
  db.exec(schema)
  return db
}

function validateEvent(event: StoredEvent): void {
  for (const field of ['id', 'appId', 'sessionId', 'type', 'pageUrl', 'release', 'environment'] as const) {
    if (!event[field] || typeof event[field] !== 'string') throw new Error(`Invalid event field: ${field}`)
  }
  if (!Number.isFinite(event.timestamp)) throw new Error('Invalid event field: timestamp')
  if (!event.payload || typeof event.payload !== 'object') throw new Error('Invalid event field: payload')
}

export function ingestBatch(db: Database, events: StoredEvent[]): void {
  if (!Array.isArray(events) || events.length === 0) throw new Error('A non-empty events array is required')
  const insert = db.prepare(`
    INSERT INTO events (id, app_id, session_id, type, timestamp, page_url, release, environment, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  db.exec('BEGIN')
  try {
    for (const event of events) {
      validateEvent(event)
      insert.run(
        event.id,
        event.appId,
        event.sessionId,
        event.type,
        event.timestamp,
        event.pageUrl,
        event.release,
        event.environment,
        JSON.stringify(event.payload),
      )
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export function queryOverview(db: Database, appId: string) {
  const rows = db.prepare('SELECT type, session_id FROM events WHERE app_id = ?').all(appId) as Array<{
    type: string
    session_id: string
  }>
  return {
    errors: rows.filter(({ type }) => type === 'error').length,
    sessions: new Set(rows.map(({ session_id }) => session_id)).size,
    events: rows.length,
    performance: rows.filter(({ type }) => type.startsWith('performance:')).length,
  }
}

export function queryErrors(db: Database, appId: string) {
  const rows = db
    .prepare("SELECT timestamp, payload FROM events WHERE app_id = ? AND type = 'error' ORDER BY timestamp DESC")
    .all(appId) as Array<{ timestamp: number; payload: string }>
  const groups = new Map<string, { fingerprint: string; message: string; count: number; latestTimestamp: number }>()
  for (const row of rows) {
    const payload = JSON.parse(row.payload)
    const fingerprint = payload.fingerprint ?? 'unknown'
    const group = groups.get(fingerprint) ?? {
      fingerprint,
      message: payload.message ?? '',
      count: 0,
      latestTimestamp: row.timestamp,
    }
    group.count++
    group.latestTimestamp = Math.max(group.latestTimestamp, row.timestamp)
    groups.set(fingerprint, group)
  }
  return [...groups.values()].sort((a, b) => b.latestTimestamp - a.latestTimestamp)
}

export function queryPerformance(db: Database, appId: string) {
  const rows = db
    .prepare("SELECT type, timestamp, payload FROM events WHERE app_id = ? AND type LIKE 'performance:%' ORDER BY timestamp ASC")
    .all(appId) as Array<{ type: string; timestamp: number; payload: string }>
  return rows.map((row) => {
    const payload = JSON.parse(row.payload)
    return {
      type: row.type,
      timestamp: row.timestamp,
      value: payload.value ?? payload.duration ?? 0,
      duration: payload.duration ?? payload.value ?? 0,
      name: payload.name ?? '',
      rating: payload.rating ?? '',
    }
  })
}

export function queryReplay(db: Database, sessionId: string): unknown[] {
  const rows = db
    .prepare("SELECT payload FROM events WHERE session_id = ? AND type = 'replay' ORDER BY timestamp ASC")
    .all(sessionId) as Array<{ payload: string }>
  return rows.flatMap(({ payload }) => JSON.parse(payload).events ?? [])
}

export function querySessions(db: Database, appId: string) {
  return db
    .prepare(`
      SELECT session_id AS sessionId, MIN(timestamp) AS startedAt, MAX(timestamp) AS endedAt, COUNT(*) AS eventCount
      FROM events WHERE app_id = ? GROUP BY session_id ORDER BY endedAt DESC
    `)
    .all(appId)
}
