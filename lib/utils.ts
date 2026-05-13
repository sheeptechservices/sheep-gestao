/**
 * Calculates project progress as a percentage based on timeline.
 * - Returns 0 if end_date is missing or today is before start
 * - Returns 100 if today is on or past end_date
 * - Otherwise: (today - start) / (end - start) * 100, rounded
 */
export function calcProgress(start_date: string, end_date?: string | null): number {
  if (!end_date) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(start_date)
  const end   = new Date(end_date)
  if (today >= end)   return 100
  if (today <= start) return 0
  return Math.round((today.getTime() - start.getTime()) / (end.getTime() - start.getTime()) * 100)
}

/** Merges class names, filtering out falsy values. */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Returns uppercase initials from a name (up to 2 letters). */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}
