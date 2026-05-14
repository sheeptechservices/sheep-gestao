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
    const root = document.documentElement
    root.classList.add('theme-switching')
    root.setAttribute('data-theme', colorMode)
    const t = setTimeout(() => root.classList.remove('theme-switching'), 400)
    return () => clearTimeout(t)
  }, [colorMode])

  return null
}
