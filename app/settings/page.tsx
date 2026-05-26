'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettings, applyTheme, hexToRgb, hotkeyLabel, type HotkeyConfig } from '@/stores/settingsStore'
import { toast } from '@/stores/toastStore'
import { useAuth } from '@/stores/authStore'
import { UsersTab } from '@/components/settings/UsersTab'

// ── Seção exclusiva para role 'user' ─────────────────────────────────────────
function MyAccountSection() {
  const authUser = useAuth(s => s.user)
  const setUser  = useAuth(s => s.setUser)

  const [name,        setName]       = useState(authUser?.name ?? '')
  const [password,    setPassword]   = useState('')
  const [showPass,    setShowPass]   = useState(false)
  const [saving,      setSaving]     = useState(false)

  useEffect(() => { setName(authUser?.name ?? '') }, [authUser?.name])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('O nome não pode ficar em branco.'); return }
    if (password && password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return }

    setSaving(true)
    try {
      const body: Record<string, string> = { name: name.trim() }
      if (password) body.new_password = password

      const res = await fetch('/api/auth/me', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        toast.error(d.error ?? 'Erro ao salvar.')
        return
      }
      const updated = await res.json()
      setUser(updated)
      setPassword('')
      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 500,
    border: '1px solid var(--gray3)', borderRadius: 8, outline: 'none',
    background: 'var(--white)', color: 'var(--black)',
    transition: 'border-color .15s', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>
          Nome
        </label>
        <input
          style={inputStyle} value={name} onChange={e => setName(e.target.value)}
          placeholder="Seu nome" required
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--gray3)')}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>
          E-mail
        </label>
        <input
          style={{ ...inputStyle, background: 'var(--bg)', color: 'var(--gray2)' }}
          value={authUser?.email ?? ''} disabled
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>
          Nova senha <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray2)' }}>(deixe em branco para manter)</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingRight: 40 }}
            type={showPass ? 'text' : 'password'}
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--gray3)')}
          />
          <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray2)' }}>
            {showPass
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>
      </div>

      <div>
        <button type="submit" disabled={saving} style={{
          padding: '8px 22px', borderRadius: 8, border: 'none',
          background: saving ? 'var(--gray3)' : 'var(--primary)',
          color: saving ? 'var(--gray2)' : 'var(--primary-contrast)',
          fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

// ── Preset palette ────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Verde Lima',   hex: '#84CC16' },
  { label: 'Azul',        hex: '#2563EB' },
  { label: 'Roxo',        hex: '#7C3AED' },
  { label: 'Rosa',        hex: '#DB2777' },
  { label: 'Vermelho',    hex: '#DC2626' },
  { label: 'Laranja',     hex: '#EA580C' },
  { label: 'Âmbar',      hex: '#D97706' },
  { label: 'Ciano',       hex: '#0891B2' },
  { label: 'Emerald',     hex: '#059669' },
  { label: 'Índigo',      hex: '#4F46E5' },
  { label: 'Preto',       hex: '#1E1E1E' },
  { label: 'Cinza',       hex: '#64748B' },
]

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--gray3)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20,
    }}>
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--gray3)',
        background: 'var(--bg)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>{title}</span>
      </div>
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 500,
  border: '1px solid var(--gray3)', borderRadius: 8, outline: 'none',
  background: 'var(--white)', color: 'var(--black)',
  transition: 'border-color .15s',
  fontFamily: 'inherit',
}

// ── Color preview chip ─────────────────────────────────────────────────────────
function ColorChip({ hex, label, selected, onClick }: {
  hex: string; label: string; selected: boolean; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        width: 36, height: 36, borderRadius: 10, background: hex, border: 'none',
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        transform: hov || selected ? 'scale(1.12)' : 'scale(1)',
        transition: 'transform .15s, box-shadow .15s',
        boxShadow: selected
          ? `0 0 0 3px var(--white), 0 0 0 5px ${hex}`
          : hov ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.10)',
      }}
    />
  )
}

// ── Hotkey recorder ───────────────────────────────────────────────────────────

// Keys that are not meaningful alone (only as modifiers)
const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Meta', 'Shift'])

// Keys explicitly blocked (browser / OS reserved and non-remappable)
const BLOCKED_KEYS = new Set(['Tab', 'F5', 'F12', 'r', 'w', 't', 'n'])

function HotkeyRecorder({ value, onChange }: {
  value: HotkeyConfig
  onChange: (h: HotkeyConfig) => void
}) {
  const [recording, setRecording] = useState(false)
  const [preview,   setPreview]   = useState<HotkeyConfig | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!recording) return
    e.preventDefault()
    e.stopPropagation()

    if (MODIFIER_KEYS.has(e.key)) return  // wait for actual key

    const candidate: HotkeyConfig = {
      key:   e.key === ' ' ? ' ' : e.key.toLowerCase(),
      ctrl:  e.ctrlKey,
      alt:   e.altKey,
      meta:  e.metaKey,
      shift: e.shiftKey,
    }

    // Must have at least one modifier
    if (!candidate.ctrl && !candidate.alt && !candidate.meta) {
      setPreview(null)
      return
    }

    // Block browser-reserved combos (Ctrl+R, Ctrl+W, Ctrl+T, Ctrl+N...)
    if (candidate.ctrl && BLOCKED_KEYS.has(candidate.key)) {
      setPreview(null)
      return
    }

    setPreview(candidate)
    setRecording(false)
    onChange(candidate)
  }, [recording, onChange])

  useEffect(() => {
    if (recording) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [recording, handleKeyDown])

  // Click outside → cancel recording
  useEffect(() => {
    if (!recording) return
    function onMouseDown(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setRecording(false)
        setPreview(null)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [recording])

  const displayed = preview ?? value

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        ref={btnRef}
        onClick={() => { setRecording(r => !r); setPreview(null) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', borderRadius: 10,
          border: `1.5px solid ${recording ? 'var(--primary)' : 'var(--gray3)'}`,
          background: recording ? 'var(--primary-dim)' : 'var(--bg)',
          cursor: 'pointer', transition: 'all 0.15s',
          boxShadow: recording ? '0 0 0 3px var(--primary-dim)' : 'none',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      >
        {/* Keyboard icon */}
        <svg width={15} height={15} viewBox="0 0 15 15" fill="none"
          style={{ color: recording ? 'var(--primary)' : 'var(--gray2)', flexShrink: 0 }}>
          <rect x="1" y="3.5" width="13" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <line x1="4" y1="6.5" x2="4" y2="6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="7.5" y1="6.5" x2="7.5" y2="6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="11" y1="6.5" x2="11" y2="6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="5.5" y1="6.5" x2="5.5" y2="6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="9" y1="6.5" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="4" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>

        {recording ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', minWidth: 120 }}>
            Pressione a combinação…
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {hotkeyLabel(displayed).split('+').map((part, i, arr) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <kbd style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--black)',
                  background: 'var(--white)', border: '1px solid var(--gray3)',
                  borderRadius: 5, padding: '2px 7px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  fontFamily: 'inherit',
                }}>
                  {part}
                </kbd>
                {i < arr.length - 1 && (
                  <span style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 600 }}>+</span>
                )}
              </span>
            ))}
          </span>
        )}
      </button>

      {recording && (
        <span style={{ fontSize: 11, color: 'var(--gray2)' }}>
          Use pelo menos um modificador (Ctrl, Alt, ⌘). Clique fora para cancelar.
        </span>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { title, description, primaryColor, setTitle, setDescription, setPrimaryColor,
          quickSearchHotkey, setQuickSearchHotkey } = useSettings()
  const authUser = useAuth(s => s.user)

  const [localTitle, setLocalTitle]       = useState(title)
  const [localDesc, setLocalDesc]         = useState(description)
  const [localColor, setLocalColor]       = useState(primaryColor)
  const [customHex, setCustomHex]         = useState(primaryColor)
  const [identityDirty, setIdentityDirty] = useState(false)

  // Keep local in sync if store is hydrated after mount
  useEffect(() => { setLocalTitle(title) },       [title])
  useEffect(() => { setLocalDesc(description) },  [description])
  useEffect(() => { setLocalColor(primaryColor); setCustomHex(primaryColor) }, [primaryColor])

  // Live preview while the user picks
  useEffect(() => { applyTheme(localColor) }, [localColor])

  function pickColor(hex: string) {
    setLocalColor(hex)
    setCustomHex(hex)
  }

  function handleCustomHexChange(raw: string) {
    setCustomHex(raw)
    // Only apply when it looks like a valid 6-char hex
    const clean = raw.trim()
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      setLocalColor(clean)
    }
  }

  function saveIdentity() {
    setTitle(localTitle.trim() || 'Sheep Tech')
    setDescription(localDesc.trim())
    setIdentityDirty(false)
    toast.success('Identidade salva!')
  }

  function saveColor() {
    setPrimaryColor(localColor)
    toast.success('Cor principal salva!')
  }

  // Validate hex for the custom input
  const customValid = /^#[0-9A-Fa-f]{6}$/.test(customHex.trim())

  // Build a small live preview of the color
  const [pr, pg, pb] = hexToRgb(localColor)

  // Usuários comuns veem só a seção de perfil
  if (authUser && authUser.role !== 'master') {
    return (
      <div style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Configurações</h1>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>Minha conta</p>
        </div>
        <SectionCard title="Minha conta">
          <MyAccountSection />
        </SectionCard>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Configurações</h1>
        <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>Preferências do sistema</p>
      </div>

      {/* ── Identidade ── */}
      <SectionCard title="Identidade">
        <Field label="Nome do sistema" hint="Exibido no topo da barra de navegação.">
          <input
            value={localTitle}
            onChange={e => { setLocalTitle(e.target.value); setIdentityDirty(true) }}
            placeholder="Sheep Tech"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--gray3)')}
          />
        </Field>
        <Field label="Descrição / subtítulo" hint="Texto secundário exibido abaixo do nome.">
          <input
            value={localDesc}
            onChange={e => { setLocalDesc(e.target.value); setIdentityDirty(true) }}
            placeholder="Gestão de Projetos"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--gray3)')}
          />
        </Field>

        {/* Preview */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 8,
          background: 'var(--bg)', border: '1px solid var(--gray3)',
          marginBottom: 20,
        }}>
          <div style={{
            width: 24, height: 24, background: 'var(--primary)', borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: 'var(--primary-contrast)',
          }}>
            {(localTitle || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)', lineHeight: 1.2 }}>
              {localTitle || 'Sheep Tech'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, lineHeight: 1 }}>
              {localDesc || 'Gestão de Projetos'}
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={saveIdentity}
            disabled={!identityDirty}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: identityDirty ? 'pointer' : 'default',
              background: identityDirty ? 'var(--primary)' : 'var(--gray3)',
              color: identityDirty ? 'var(--primary-contrast)' : 'var(--gray2)',
              fontSize: 13, fontWeight: 700, transition: 'all .15s',
              fontFamily: 'inherit',
            }}
          >
            Salvar identidade
          </button>
        </div>
      </SectionCard>

      {/* ── Cor principal ── */}
      <SectionCard title="Cor principal">
        <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 20 }}>
          A cor principal é usada em botões, badges, links ativos, barras de progresso e outros elementos de destaque em todo o sistema.
        </p>

        {/* Palette */}
        <Field label="Paleta de cores">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {PRESETS.map(({ hex, label }) => (
              <ColorChip
                key={hex} hex={hex} label={label}
                selected={localColor.toLowerCase() === hex.toLowerCase()}
                onClick={() => pickColor(hex)}
              />
            ))}
          </div>
        </Field>

        {/* Custom hex */}
        <Field label="Cor personalizada" hint="Informe qualquer cor em hexadecimal, ex: #3B82F6">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Native color picker */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <input
                type="color"
                value={customValid ? customHex : '#84CC16'}
                onChange={e => pickColor(e.target.value)}
                style={{
                  width: 38, height: 38, border: '1px solid var(--gray3)',
                  borderRadius: 8, padding: 2, cursor: 'pointer',
                  background: 'var(--white)',
                }}
              />
            </div>
            {/* Hex text input */}
            <input
              value={customHex}
              onChange={e => handleCustomHexChange(e.target.value)}
              placeholder="#84CC16"
              maxLength={7}
              style={{
                ...inputStyle,
                width: 130,
                borderColor: customValid ? 'var(--gray3)' : '#fca5a5',
                fontFamily: 'monospace',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = customValid ? 'var(--gray3)' : '#fca5a5')}
            />
            {/* Live swatch */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: `rgba(${pr}, ${pg}, ${pb}, 0.12)`,
              border: `1px solid rgba(${pr}, ${pg}, ${pb}, 0.30)`,
              fontSize: 12, fontWeight: 700,
              color: localColor,
              transition: 'all .2s',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: localColor }} />
              Prévia
            </div>
          </div>
        </Field>

        {/* Contrast preview strip */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap',
        }}>
          {[
            { bg: localColor, fg: 'var(--primary-contrast)', label: 'Botão primário' },
            { bg: `rgba(${pr}, ${pg}, ${pb}, 0.12)`, fg: localColor, label: 'Badge / fundo suave' },
            { bg: 'var(--white)', fg: localColor, label: 'Link / texto ativo' },
          ].map(({ bg, fg, label }) => (
            <div key={label} style={{
              padding: '7px 14px', borderRadius: 8, background: bg,
              border: `1px solid rgba(${pr}, ${pg}, ${pb}, 0.20)`,
              fontSize: 12, fontWeight: 700, color: fg,
              transition: 'all .2s',
            }}>
              {label}
            </div>
          ))}
        </div>

        <button
          onClick={saveColor}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: localColor,
            color: 'var(--primary-contrast)',
            fontSize: 13, fontWeight: 700, transition: 'all .15s',
            fontFamily: 'inherit',
          }}
        >
          Salvar cor
        </button>
      </SectionCard>

      {/* ── Atalhos de teclado ── */}
      <SectionCard title="Atalhos de teclado">
        <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 20 }}>
          Personalize os atalhos de teclado globais do sistema. Clique no campo e pressione a combinação desejada.
        </p>

        <Field
          label="Pesquisa rápida"
          hint="Abre o overlay de busca de projetos e clientes em qualquer página."
        >
          <HotkeyRecorder
            value={quickSearchHotkey}
            onChange={h => {
              setQuickSearchHotkey(h)
              toast.success('Atalho salvo!', `Pesquisa rápida: ${hotkeyLabel(h)}`)
            }}
          />
        </Field>
      </SectionCard>

      {/* ── Usuários — apenas para Master ── */}
      {authUser?.role === 'master' && (
        <SectionCard title="Usuários">
          <UsersTab selfId={authUser.id} />
        </SectionCard>
      )}
    </div>
  )
}
