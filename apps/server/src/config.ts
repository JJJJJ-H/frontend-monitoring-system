export interface ServerConfig {
  release: string
  allowedOrigins: string[]
}

const localOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']

export function parseAllowedOrigins(value: string | undefined): string[] {
  return value?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []
}

export function getServerConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const allowedOrigins = parseAllowedOrigins(env.MONITOR_ALLOWED_ORIGINS)
  return {
    release: env.MONITOR_RELEASE || '0.1.0',
    allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : localOrigins,
  }
}
