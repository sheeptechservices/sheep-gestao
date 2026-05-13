/**
 * Returns today's date as 'YYYY-MM-DD' in the LOCAL timezone.
 *
 * ⚠️  Never use `new Date().toISOString().slice(0, 10)` for "today" comparisons —
 * that gives the UTC date which differs from local date when the UTC offset is
 * negative (e.g. BRT = UTC-3: at 21 h local time it is already midnight UTC).
 */
export function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Formats any Date object as 'YYYY-MM-DD' using LOCAL calendar fields.
 * Use this instead of d.toISOString().slice(0,10) when the date came from
 * local arithmetic (e.g. adding days to a local Date).
 */
export function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
