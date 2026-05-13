'use client'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { Client, ClientStatus } from '@/lib/types'

// ── Config ────────────────────────────────────────────────────────────────────

const CLIENT_STATUS: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Ativo',      color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)'   },
  inactive:  { label: 'Inativo',    color: '#666666', bg: 'rgba(18,19,22,0.06)'    },
  paused:    { label: 'Pausado',    color: '#7C3AED', bg: 'rgba(124,58,237,0.10)'  },
  cancelled: { label: 'Encerrado', color: '#D93025', bg: 'rgba(217,48,37,0.10)'   },
}

function fmt(date?: string | null) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>{value}</div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientDetailDrawer({ client, onClose }: {
  client: Client
  onClose: () => void
}) {
  const router = useRouter()
  const color  = client.color_hex ?? '#84CC16'
  const status = client.status ? CLIENT_STATUS[client.status] : null

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 98000,
          background: 'rgba(18,19,22,0.40)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.18s ease both',
        }}
      />

      {/* Centering wrapper */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 98001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {/* Modal */}
        <div style={{
          width: 'calc(100% - 48px)', maxWidth: 480,
          maxHeight: '88vh',
          background: 'var(--white)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column',
          animation: 'modalSlideUp 0.24s cubic-bezier(0.34,1.1,0.64,1) both',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}>

          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--gray3)',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: color + '20', border: `1.5px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color,
            }}>
              {client.name.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {client.name}
              </div>
              {status && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: status.color, background: status.bg,
                  padding: '2px 8px', borderRadius: 100,
                }}>
                  {status.label}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10, border: '1px solid var(--gray3)',
                background: 'transparent', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
                flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
              title="Fechar"
            >
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {client.segmento     && <InfoField label="Segmento"      value={client.segmento} />}
              {client.sub_segmento && <InfoField label="Sub-segmento"  value={client.sub_segmento} />}
              {client.cidade_estado && <InfoField label="Cidade / Estado" value={client.cidade_estado} />}
              {client.cnpj_cpf     && <InfoField label="CNPJ / CPF"    value={client.cnpj_cpf} />}
              {client.origem_comercial && <InfoField label="Origem comercial"  value={client.origem_comercial} />}
              {client.canal_aquisicao  && <InfoField label="Canal de aquisição" value={client.canal_aquisicao} />}
            </div>

            {/* Dates */}
            {(client.data_entrada || client.data_saida) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <InfoField label="Entrada" value={fmt(client.data_entrada)} />
                {client.data_saida && <InfoField label="Saída" value={fmt(client.data_saida)} />}
              </div>
            )}

            {/* Contact */}
            {(client.contact_name || client.contact_email) && (
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--gray3)', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  Contato
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {client.contact_name && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>
                      {client.contact_name}
                    </div>
                  )}
                  {client.contact_email && (
                    <a
                      href={`mailto:${client.contact_email}`}
                      style={{ fontSize: 12, color, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                        <rect x="1" y="2.5" width="10" height="7" rx="1.2" stroke="currentColor" strokeWidth={1.2}/>
                        <path d="M1 4l5 3.5L11 4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"/>
                      </svg>
                      {client.contact_email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Pasta */}
            {client.pasta && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                  Pasta no Drive
                </div>
                <a
                  href={client.pasta}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12, color, fontWeight: 600,
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width={12} height={12} viewBox="0 0 13 13" fill="none">
                    <path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8.5M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Abrir pasta
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 20px', borderTop: '1px solid var(--gray3)',
            flexShrink: 0, background: 'var(--white)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
                background: 'transparent', fontSize: 13, fontWeight: 600,
                color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray)' }}
            >
              Fechar
            </button>

            <button
              onClick={() => { onClose(); router.push(`/clients?open=${client.id}`) }}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', fontSize: 13, fontWeight: 700,
                color: 'var(--primary-text)', cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 2px 8px var(--primary-mid)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5a1.5 1.5 0 012.12 2.12L4 10.25H1.75V8L8.5 1.5z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
              </svg>
              Editar cliente
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
