'use client'
import { useState, useEffect } from 'react'
import { toast } from '@/stores/toastStore'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Integration {
  id: string
  api_key: string   // masked '••••••••' or ''
  has_key: boolean
  extra: Record<string, unknown>
  enabled: boolean
  updated_at: string | null
}

// ── Integration catalogue ─────────────────────────────────────────────────────

interface IntegrationMeta {
  id: string
  name: string
  description: string
  category: string
  emoji: string
  color: string
  keyLabel: string
  keyPlaceholder: string
  keyHint: string
  docsUrl: string
  comingSoon?: boolean
  extraFields?: { key: string; label: string; placeholder: string }[]
}

const CATALOGUE: IntegrationMeta[] = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Chave de API usada pelos especialistas para gerar respostas. Substitui a variável de ambiente ANTHROPIC_API_KEY.',
    category: 'IA Generativa',
    emoji: '🧠',
    color: '#D97706',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'Obtenha sua chave em console.anthropic.com → API Keys. Créditos são cobrados por uso de tokens.',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Geração de imagens com DALL·E 3, modelos GPT e embeddings.',
    category: 'IA Generativa',
    emoji: '🤖',
    color: '#10A37F',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-...',
    keyHint: 'Encontre sua chave em platform.openai.com → API Keys.',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Stable Diffusion, Flux e milhares de modelos de imagem e vídeo open source.',
    category: 'IA Generativa',
    emoji: '🎨',
    color: '#6366F1',
    keyLabel: 'API Token',
    keyPlaceholder: 'r8_...',
    keyHint: 'Gere seu token em replicate.com → Account → API Tokens.',
    docsUrl: 'https://replicate.com/docs/reference/http',
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Google Calendar e Gmail para a Secretária criar reuniões e enviar e-mails.',
    category: 'Produtividade',
    emoji: '📅',
    color: '#4285F4',
    keyLabel: 'OAuth Client ID',
    keyPlaceholder: 'xxxx.apps.googleusercontent.com',
    keyHint: 'Configure um OAuth 2.0 Client ID no Google Cloud Console.',
    docsUrl: 'https://console.cloud.google.com/',
    comingSoon: true,
  },
  {
    id: 'github_token',
    name: 'GitHub',
    description: 'Personal Access Token para o agente Dev consultar issues, PRs e commits de repositórios privados.',
    category: 'Desenvolvimento',
    emoji: '🐙',
    color: '#24292F',
    keyLabel: 'Personal Access Token',
    keyPlaceholder: 'ghp_...',
    keyHint: 'Crie um token em GitHub → Settings → Developer settings → Personal access tokens.',
    docsUrl: 'https://docs.github.com/en/rest',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Envio de notificações, resumos de reuniões e alertas de projeto para canais Slack.',
    category: 'Comunicação',
    emoji: '💬',
    color: '#4A154B',
    keyLabel: 'Bot Token',
    keyPlaceholder: 'xoxb-...',
    keyHint: 'Crie um Slack App e copie o Bot Token em OAuth & Permissions.',
    docsUrl: 'https://api.slack.com/authentication/basics',
    comingSoon: true,
  },
]

const CATEGORIES = ['IA Generativa', 'Desenvolvimento', 'Produtividade', 'Comunicação']

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--gray3)', background: 'var(--bg)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

// ── Integration card ──────────────────────────────────────────────────────────

function IntegrationCard({ meta, data, onSave }: {
  meta: IntegrationMeta
  data: Integration | undefined
  onSave: (id: string, key: string, enabled: boolean) => Promise<void>
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [keyValue,  setKeyValue]  = useState('')
  const [showKey,   setShowKey]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [clearing,  setClearing]  = useState(false)

  const hasKey   = data?.has_key ?? false
  const enabled  = data?.enabled ?? false

  const handleSave = async () => {
    if (!keyValue.trim()) return
    setSaving(true)
    await onSave(meta.id, keyValue.trim(), true)
    setKeyValue('')
    setExpanded(false)
    setSaving(false)
  }

  const handleClear = async () => {
    setClearing(true)
    await onSave(meta.id, '', false)
    setClearing(false)
  }

  return (
    <div style={{
      border: `1px solid ${hasKey ? meta.color + '35' : 'var(--gray3)'}`,
      borderRadius: 12,
      background: hasKey ? meta.color + '04' : 'var(--white)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: meta.color + '14', border: `1.5px solid ${meta.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {meta.emoji}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)' }}>{meta.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', background: 'var(--bg)', border: '1px solid var(--gray3)', borderRadius: 20, padding: '1px 7px', letterSpacing: '0.04em' }}>
              {meta.category}
            </span>
            {meta.comingSoon && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 20, padding: '1px 7px' }}>
                Em breve
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3, lineHeight: 1.45 }}>{meta.description}</div>
        </div>

        {/* Status + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {hasKey ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(30,138,62,0.1)', border: '1px solid rgba(30,138,62,0.25)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E8A3E' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1E8A3E' }}>Conectado</span>
              </div>
              {!meta.comingSoon && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  title="Editar chave"
                  style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}
                >
                  <svg width={13} height={13} viewBox="0 0 14 14" fill="none"><path d="M2 11h10M8 3l3 3-5 5-3-3 5-5z" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
            </>
          ) : (
            !meta.comingSoon && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: `1px solid ${meta.color}40`,
                  background: meta.color + '10', color: meta.color,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = meta.color + '22' }}
                onMouseLeave={e => { e.currentTarget.style.background = meta.color + '10' }}
              >
                Conectar
              </button>
            )
          )}
          <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer" title="Documentação" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)', transition: 'all 0.15s', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}>
            <svg width={12} height={12} viewBox="0 0 13 13" fill="none"><path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8.5M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && !meta.comingSoon && (
        <div style={{ borderTop: `1px solid ${meta.color}20`, padding: '16px 18px', background: meta.color + '04', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)', display: 'block', marginBottom: 6 }}>
              {meta.keyLabel}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyValue}
                  onChange={e => setKeyValue(e.target.value)}
                  placeholder={hasKey ? '••••••••  (deixe em branco para manter a atual)' : meta.keyPlaceholder}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                  style={{ width: '100%', padding: '8px 36px 8px 12px', fontSize: 13, fontWeight: 500, border: `1px solid ${meta.color}40`, borderRadius: 8, background: 'var(--white)', color: 'var(--black)', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${meta.color}20` }}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray2)', padding: 0, display: 'flex' }}
                >
                  {showKey
                    ? <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth={1.4}/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth={1.4}/><path d="M2 2l12 12" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/></svg>
                    : <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth={1.4}/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth={1.4}/></svg>
                  }
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || (!keyValue.trim() && !hasKey)}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: (saving || (!keyValue.trim() && !hasKey)) ? 'var(--gray3)' : meta.color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: (saving || (!keyValue.trim() && !hasKey)) ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!saving && keyValue.trim()) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 6, lineHeight: 1.5 }}>{meta.keyHint}</p>
          </div>

          {hasKey && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{ fontSize: 11, fontWeight: 600, color: '#D93025', background: 'none', border: 'none', cursor: clearing ? 'wait' : 'pointer', opacity: clearing ? 0.5 : 1, padding: '2px 0', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
              >
                {clearing ? 'Removendo…' : 'Remover integração'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then(data => { setIntegrations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async (id: string, key: string, enabled: boolean) => {
    const body: Record<string, unknown> = { id, enabled }
    if (key !== undefined) body.api_key = key
    const res = await fetch('/api/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      // Refresh list
      const updated = await fetch('/api/integrations').then(r => r.json())
      setIntegrations(Array.isArray(updated) ? updated : [])
      toast(key ? `${CATALOGUE.find(c => c.id === id)?.name} conectado com sucesso!` : 'Integração removida.')
    } else {
      toast('Erro ao salvar integração.')
    }
  }

  const connectedCount = integrations.filter(i => i.has_key).length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 860, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--black)', marginBottom: 6 }}>Integrações</h1>
        <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6 }}>
          Conecte ferramentas externas para expandir as capacidades dos especialistas — geração de imagens, acesso a repositórios, calendário e muito mais.
        </p>
        {!loading && connectedCount > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '5px 12px', borderRadius: 20, background: 'rgba(30,138,62,0.09)', border: '1px solid rgba(30,138,62,0.2)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E8A3E' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1E8A3E' }}>{connectedCount} integraç{connectedCount === 1 ? 'ão ativa' : 'ões ativas'}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--gray2)', fontSize: 13 }}>
          Carregando…
        </div>
      ) : (
        CATEGORIES.map(cat => {
          const items = CATALOGUE.filter(c => c.category === cat)
          return (
            <SectionCard key={cat} title={cat}>
              {items.map(meta => (
                <IntegrationCard
                  key={meta.id}
                  meta={meta}
                  data={integrations.find(i => i.id === meta.id)}
                  onSave={handleSave}
                />
              ))}
            </SectionCard>
          )
        })
      )}

      <p style={{ fontSize: 11, color: 'var(--gray2)', lineHeight: 1.6, marginTop: 8 }}>
        As chaves de API são armazenadas de forma segura no servidor e nunca expostas ao navegador após o salvamento.
      </p>
    </div>
  )
}
