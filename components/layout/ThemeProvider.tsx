'use client'
import { useEffect } from 'react'
import { useSettings, applyTheme } from '@/stores/settingsStore'

/**
 * Mounts silently in AppShell and keeps CSS variables in sync
 * with the stored primary color and color mode whenever the app loads or they change.
 */
export function ThemeProvider() {
  const primaryColor = useSettings(s => s.primaryColor)
  const colorMode    = useSettings(s => s.colorMode)

  useEffect(() => {
    applyTheme(primaryColor)
  }, [primaryColor])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode)
  }, [colorMode])

  return null
}
