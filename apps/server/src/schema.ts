export const schema = `
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    page_url TEXT NOT NULL,
    release TEXT NOT NULL,
    environment TEXT NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_app_type_time ON events(app_id, type, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_events_session_time ON events(session_id, timestamp ASC);

  CREATE TABLE IF NOT EXISTS source_maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT NOT NULL,
    release TEXT NOT NULL,
    generated_file TEXT NOT NULL,
    map_json TEXT NOT NULL,
    UNIQUE(app_id, release, generated_file)
  );
`
