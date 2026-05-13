'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Color helpers ─────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

function toLinear(c: number) {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function relativeLuminance(r: number, g: number, b: number) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function darkenHex(hex: string, factor = 0.45): string {
  const [r, g, b] = hexToRgb(hex)
  return '#' + [r, g, b]
    .map(c => Math.max(0, Math.round(c * (1 - factor))).toString(16).padStart(2, '0'))
    .join('')
}

export function buildTheme(hex: string) {
  const [r, g, b] = hexToRgb(hex)
  const lum = relativeLuminance(r, g, b)
  return {
    '--primary':          hex,
    '--primary-dim':      `rgba(${r}, ${g}, ${b}, 0.12)`,
    '--primary-mid':      `rgba(${r}, ${g}, ${b}, 0.40)`,
    '--primary-text':     darkenHex(hex, 0.42),
    '--primary-contrast': lum > 0.30 ? '#1a1a1a' : '#FFFFFF',
  }
}

export function applyTheme(hex: string) {
  const vars = buildTheme(hex)
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

// ── Store ─────────────────────────────────────────────────────────────────────

// ── Hotkey helpers ────────────────────────────────────────────────────────────

export interface HotkeyConfig {
  key:   string   // e.g. 'k', 'g', 'p', ' '
  ctrl:  boolean
  alt:   boolean
  meta:  boolean
  shift: boolean
}

export const DEFAULT_QUICK_SEARCH_HOTKEY: HotkeyConfig = {
  key: 'k', ctrl: true, alt: false, meta: false, shift: false,
}

export function hotkeyLabel(h: HotkeyConfig): string {
  const parts: string[] = []
  if (h.ctrl)  parts.push('Ctrl')
  if (h.alt)   parts.push('Alt')
  if (h.meta)  parts.push('⌘')
  if (h.shift) parts.push('Shift')
  parts.push(h.key === ' ' ? 'Space' : h.key.toUpperCase())
  return parts.join('+')
}

export function matchesHotkey(e: KeyboardEvent, h: HotkeyConfig): boolean {
  return (
    e.key.toLowerCase() === (h.key === ' ' ? ' ' : h.key.toLowerCase()) &&
    !!e.ctrlKey  === h.ctrl  &&
    !!e.altKey   === h.alt   &&
    !!e.metaKey  === h.meta  &&
    !!e.shiftKey === h.shift
  )
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface SettingsState {
  title: string
  description: string
  primaryColor: string
  quickSearchHotkey: HotkeyConfig
  setTitle: (v: string) => void
  setDescription: (v: string) => void
  setPrimaryColor: (v: string) => void
  setQuickSearchHotkey: (v: HotkeyConfig) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      title:               'Sheep Tech',
      description:         'Gestão de Projetos',
      primaryColor:        '#84CC16',
      quickSearchHotkey:   DEFAULT_QUICK_SEARCH_HOTKEY,
      setTitle:               (title)               => set({ title }),
      setDescription:         (description)         => set({ description }),
      setPrimaryColor:        (primaryColor)         => set({ primaryColor }),
      setQuickSearchHotkey:   (quickSearchHotkey)   => set({ quickSearchHotkey }),
    }),
    { name: 'sheep-settings' }
  )
)
