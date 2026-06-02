import type { Database } from './db.ts'

interface SourceMapPayload {
  version: number
  file?: string
  sourceRoot?: string
  sources: string[]
  names?: string[]
  mappings: string
}

interface SaveSourceMapInput {
  appId: string
  release: string
  generatedFile: string
  map: SourceMapPayload
}

interface Frame {
  appId: string
  release: string
  generatedFile: string
  line: number
  column: number
}

const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodeVlq(segment: string): number[] {
  const values: number[] = []
  let value = 0
  let shift = 0
  for (const character of segment) {
    const digit = base64.indexOf(character)
    if (digit < 0) throw new Error(`Invalid VLQ character: ${character}`)
    value += (digit & 31) << shift
    if (digit & 32) {
      shift += 5
      continue
    }
    const negative = value & 1
    values.push(negative ? -(value >> 1) : value >> 1)
    value = 0
    shift = 0
  }
  return values
}

export function saveSourceMap(db: Database, input: SaveSourceMapInput): void {
  if (!input.appId || !input.release || !input.generatedFile || input.map.version !== 3) {
    throw new Error('Invalid source map')
  }
  db.prepare(`
    INSERT INTO source_maps (app_id, release, generated_file, map_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(app_id, release, generated_file) DO UPDATE SET map_json = excluded.map_json
  `).run(input.appId, input.release, input.generatedFile, JSON.stringify(input.map))
}

export function restoreFrame(db: Database, frame: Frame) {
  const fallback = { source: frame.generatedFile, line: frame.line, column: frame.column }
  const row = db
    .prepare('SELECT map_json FROM source_maps WHERE app_id = ? AND release = ? AND generated_file = ?')
    .get(frame.appId, frame.release, frame.generatedFile) as { map_json: string } | undefined
  if (!row) return fallback

  try {
    const map = JSON.parse(row.map_json) as SourceMapPayload
    let sourceIndex = 0
    let originalLine = 0
    let originalColumn = 0
    const lines = map.mappings.split(';')
    let match: { source: string; line: number; column: number } | undefined

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let generatedColumn = 0
      for (const segment of lines[lineIndex].split(',').filter(Boolean)) {
        const values = decodeVlq(segment)
        generatedColumn += values[0] ?? 0
        if (values.length < 4) continue
        sourceIndex += values[1]
        originalLine += values[2]
        originalColumn += values[3]
        if (lineIndex === frame.line - 1 && generatedColumn <= frame.column) {
          match = {
            source: `${map.sourceRoot ?? ''}${map.sources[sourceIndex]}`,
            line: originalLine + 1,
            column: originalColumn,
          }
        }
      }
    }
    return match ?? fallback
  } catch {
    return fallback
  }
}
