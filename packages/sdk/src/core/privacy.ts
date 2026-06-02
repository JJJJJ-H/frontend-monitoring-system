export function maskInput(value: string): string {
  return '*'.repeat(value.length)
}

export function sanitizeText(value: string, maxLength = 120): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}
