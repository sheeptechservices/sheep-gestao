'use client'
import { useEffect } from 'react'
import { useSettings, applyTheme } from '@/stores/settingsStore'

/**
 * Mounts silently in AppShell and keeps CSS variables in sync
 * with the stored primary color whenever the app loads or the color changes.
 */
export function ThemeProvider() {
  const primaryColor = useSettings(s => s.primaryColor)

  useEffect(() => {
    applyTheme(primaryColor)
  }, [primaryColor])

  return null
}
