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

// ── Brand logos (official SVGs) ───────────────────────────────────────────────

const LOGOS: Record<string, React.ReactNode> = {
  anthropic: (
    <svg viewBox="0 0 100 100" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50,50)" fill="#CC785C">
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(0)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(30)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(60)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(90)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(120)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(150)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(180)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(210)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(240)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(270)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(300)"/>
        <rect x="-4.5" y="-46" width="9" height="31" rx="4.5" transform="rotate(330)"/>
      </g>
    </svg>
  ),
  openai: (
    <svg viewBox="0 0 24 24" fill="#10A37F" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.032.067L9.564 19.923a4.5 4.5 0 0 1-5.964-1.619zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.05 13.985A4.5 4.5 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.768 2.751a4.5 4.5 0 0 1-.696 8.115V11.97a.79.79 0 0 0-.32-.219zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.76-2.744a4.5 4.5 0 0 1 6.684 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  ),
  replicate: (
    <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#6366F1"/>
      <path d="M6 6h5.5a4.5 4.5 0 0 1 0 9H9v3H6V6zm3 6.5h2.5a1.5 1.5 0 0 0 0-3H9v3z" fill="#fff"/>
      <path d="M11.5 15h1l3 3h-3.5l-.5-3z" fill="#fff" opacity="0.7"/>
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  github_token: (
    <svg viewBox="0 0 24 24" fill="#24292F" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  ),
  slack: (
    <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
    </svg>
  ),
  fireflies: (
    <svg viewBox="0 0 28 28" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#7B5EA7"/>
      {/* Upper wings */}
      <ellipse cx="9.5" cy="10" rx="5.5" ry="4.5" fill="rgba(255,255,255,0.88)" transform="rotate(-18 9.5 10)"/>
      <ellipse cx="18.5" cy="10" rx="5.5" ry="4.5" fill="rgba(255,255,255,0.88)" transform="rotate(18 18.5 10)"/>
      {/* Lower wings */}
      <ellipse cx="9.5" cy="19.5" rx="3.8" ry="3" fill="rgba(255,255,255,0.6)" transform="rotate(22 9.5 19.5)"/>
      <ellipse cx="18.5" cy="19.5" rx="3.8" ry="3" fill="rgba(255,255,255,0.6)" transform="rotate(-22 18.5 19.5)"/>
      {/* Body */}
      <ellipse cx="14" cy="14" rx="1.4" ry="5.5" fill="white"/>
    </svg>
  ),
}

// ── Integration catalogue ─────────────────────────────────────────────────────

interface IntegrationMeta {
  id: string
  name: string
  description: string
  category: string
  color: string
  keyLabel: string
  keyPlaceholder: string
  keyHint: string
  docsUrl: string
  webhookPath?: string   // if set, shows a read-only webhook URL field in the expanded form
  syncPath?: string      // if set, shows a "Sincronizar histórico" button
  comingSoon?: boolean
}

const CATALOGUE: IntegrationMeta[] = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Chave de API usada pelos especialistas para gerar respostas. Substitui a variável de ambiente ANTHROPIC_API_KEY.',
    category: 'IA Generativa',
    color: '#C96A2B',
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
    color: '#E01E5A',
    keyLabel: 'Bot Token',
    keyPlaceholder: 'xoxb-...',
    keyHint: 'Crie um Slack App e copie o Bot Token em OAuth & Permissions.',
    docsUrl: 'https://api.slack.com/authentication/basics',
    comingSoon: true,
  },
  {
    id: 'fireflies',
    name: 'Fireflies.ai',
    description: 'Transcrição automática de reuniões via webhook. Vincula resumos, action items e transcrições completas aos projetos automaticamente.',
    category: 'Reuniões',
    color: '#7B5EA7',
    keyLabel: 'API Key',
    keyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    keyHint: 'Obtenha sua chave em app.fireflies.ai → Integrações → API. Guarde também em FIREFLIES_API_KEY no arquivo .env.local para uso pelo servidor.',
    docsUrl: 'https://docs.fireflies.ai/getting-started/api-usage',
    webhookPath: '/api/webhooks/fireflies',
    syncPath: '/api/integrations/fireflies/sync',
  },
]

const CATEGORIES = ['IA Generativa', 'Reuniões', 'Desenvolvimento', 'Produtividade', 'Comunicação']

// ── Shimmer skeleton ──────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="shimmer-bar" style={{
      border: '1px solid var(--gray3)', borderRadius: 12,
      background: 'var(--white)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--gray3)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 130, height: 13, borderRadius: 4, background: 'var(--gray3)' }} />
            <div style={{ width: 80, height: 18, borderRadius: 20, background: 'var(--gray3)' }} />
          </div>
          <div style={{ width: '60%', height: 11, borderRadius: 4, background: 'var(--gray3)' }} />
        </div>
        <div style={{ width: 88, height: 28, borderRadius: 20, background: 'var(--gray3)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

function ShimmerSection({ count }: { count: number }) {
  return (
    <div className="shimmer-bar" style={{
      background: 'var(--white)', border: '1px solid var(--gray3)',
      borderRadius: 12, overflow: 'hidden', marginBottom: 20,
    }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--gray3)', background: 'var(--bg)' }}>
        <div style={{ width: 120, height: 13, borderRadius: 4, background: 'var(--gray3)' }} />
      </div>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: count }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────

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
  const [expanded,    setExpanded]    = useState(false)
  const [keyValue,    setKeyValue]    = useState('')
  const [showKey,     setShowKey]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [clearing,    setClearing]    = useState(false)
  const [syncing,     setSyncing]     = useState(false)
  const [syncResult,  setSyncResult]  = useState<{ imported: number; skipped: number } | null>(null)

  const hasKey  = data?.has_key ?? false
  const logo    = LOGOS[meta.id]

  const handleSave = async () => {
    if (!keyValue.trim()) return
    setSaving(true)
    try {
      await onSave(meta.id, keyValue.trim(), true)
      setKeyValue('')
      setExpanded(false)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      await onSave(meta.id, '', false)
    } finally {
      setClearing(false)
    }
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
        {/* Logo */}
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: meta.color + '12', border: `1.5px solid ${meta.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logo}
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
          <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer" title="Documentação"
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)', transition: 'all 0.15s', textDecoration: 'none' }}
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
                disabled={saving || !keyValue.trim()}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: (saving || !keyValue.trim()) ? 'var(--gray3)' : meta.color, color: (saving || !keyValue.trim()) ? 'var(--gray2)' : '#fff', fontSize: 12, fontWeight: 700, cursor: (saving || !keyValue.trim()) ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!saving && keyValue.trim()) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 6, lineHeight: 1.5 }}>{meta.keyHint}</p>
          </div>

          {meta.webhookPath && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)', display: 'block', marginBottom: 6 }}>
                URL do Webhook
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}${meta.webhookPath}` : meta.webhookPath}
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 500,
                    border: `1px solid ${meta.color}30`, borderRadius: 8,
                    background: 'var(--bg)', color: 'var(--gray)',
                    fontFamily: 'monospace', boxSizing: 'border-box' as const,
                    outline: 'none', cursor: 'default',
                  }}
                />
                <button
                  onClick={() => {
                    const url = `${window.location.origin}${meta.webhookPath!}`
                    navigator.clipboard.writeText(url).then(() => toast.success('URL copiada!')).catch(() => {})
                  }}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: `1px solid ${meta.color}35`,
                    background: meta.color + '10', color: meta.color,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = meta.color + '22' }}
                  onMouseLeave={e => { e.currentTarget.style.background = meta.color + '10' }}
                >
                  Copiar
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 6, lineHeight: 1.55 }}>
                Cole esta URL em <strong style={{ color: 'var(--gray)' }}>app.fireflies.ai → Settings → Webhooks</strong>. O Fireflies enviará cada nova reunião automaticamente para a plataforma.
              </p>
            </div>
          )}

          {/* Sincronizar histórico */}
          {meta.syncPath && (
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--gray3)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)', marginBottom: 4 }}>
                Sincronizar histórico
              </div>
              <p style={{ fontSize: 11, color: 'var(--gray2)', marginBottom: 10, lineHeight: 1.5 }}>
                Importa todas as reuniões do Fireflies ainda não salvas no sistema. Cada uma aparecerá no sino para você vincular ao projeto desejado.
              </p>

              {syncResult && (
                <div style={{
                  fontSize: 11, fontWeight: 600, marginBottom: 10,
                  color: syncResult.imported > 0 ? '#1E8A3E' : 'var(--gray2)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {syncResult.imported > 0
                    ? `${syncResult.imported} reunião${syncResult.imported !== 1 ? 'ões' : ''} importada${syncResult.imported !== 1 ? 's' : ''} · ${syncResult.skipped} já existia${syncResult.skipped !== 1 ? 'm' : ''}`
                    : `Tudo sincronizado (${syncResult.skipped} já existiam)`
                  }
                </div>
              )}

              <button
                onClick={async () => {
                  setSyncing(true)
                  setSyncResult(null)
                  try {
                    const res  = await fetch(meta.syncPath!, { method: 'POST' })
                    const data = await res.json() as { imported?: number; skipped?: number; error?: string }
                    if (data.error) { toast.error(data.error); return }
                    setSyncResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 })
                    if ((data.imported ?? 0) > 0) toast.success(`${data.imported} reuniões importadas para o sino!`)
                  } catch { toast.error('Erro ao sincronizar.') }
                  finally { setSyncing(false) }
                }}
                disabled={syncing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  border: `1px solid ${meta.color}40`,
                  background: meta.color + '10', color: meta.color,
                  fontSize: 12, fontWeight: 700, cursor: syncing ? 'wait' : 'pointer',
                  transition: 'all 0.15s', opacity: syncing ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!syncing) e.currentTarget.style.background = meta.color + '22' }}
                onMouseLeave={e => { if (!syncing) e.currentTarget.style.background = meta.color + '10' }}
              >
                {syncing ? (
                  <>
                    <div style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${meta.color}40`, borderTopColor: meta.color, animation: 'spin-slow 0.7s linear infinite' }} />
                    Sincronizando…
                  </>
                ) : (
                  <>
                    <svg width={12} height={12} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2v4h-4M1 12V8h4"/>
                      <path d="M2.5 5A5.5 5.5 0 0 1 12.4 8M11.5 9a5.5 5.5 0 0 1-9.9-3"/>
                    </svg>
                    Sincronizar histórico
                  </>
                )}
              </button>
            </div>
          )}

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
      const updated = await fetch('/api/integrations').then(r => r.json())
      setIntegrations(Array.isArray(updated) ? updated : [])
      toast.success(key ? `${CATALOGUE.find(c => c.id === id)?.name} conectado com sucesso!` : 'Integração removida.')
    } else {
      toast.error('Erro ao salvar integração.')
    }
  }

  const connectedCount = integrations.filter(i => i.has_key).length

  return (
    <div>
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
        <>
          <ShimmerSection count={3} />
          <ShimmerSection count={1} />
          <ShimmerSection count={1} />
          <ShimmerSection count={1} />
        </>
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
