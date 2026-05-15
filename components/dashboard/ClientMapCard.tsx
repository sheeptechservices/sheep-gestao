'use client'
import dynamic from 'next/dynamic'
import type { Client } from '@/lib/types'

const ClientMapInner = dynamic(() => import('./ClientMapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="shimmer-bar"
      style={{ width: '100%', height: 280, borderRadius: 8, background: 'var(--gray3)' }}
    />
  ),
})

export function ClientMapCard({ clients }: { clients: Client[] }) {
  const withLocation = clients.filter(c => c.cidade_estado)
  const total        = clients.length

  // Count unique states/countries for the sub-label
  const locations = Array.from(
    new Set(
      withLocation
        .map(c => c.cidade_estado?.split(',')[1]?.trim() ?? '')
        .filter(Boolean)
    )
  )

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--gray3)',
      borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
          }}>
            Localização dos clientes
          </div>
          {withLocation.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 500 }}>
              {withLocation.length} de {total} cliente{total !== 1 ? 's' : ''} mapeado{withLocation.length !== 1 ? 's' : ''}
              {locations.length > 0 && (
                <span style={{ color: 'var(--gray2)' }}>
                  {' '}· {locations.length} estado{locations.length !== 1 ? 's' : ''} / região{locations.length !== 1 ? 'ões' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dot legend */}
        {withLocation.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: '#84CC16', border: '1.5px solid #fff',
              boxShadow: '0 0 0 1px #84CC1660',
            }} />
            <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600 }}>Cliente</span>
          </div>
        )}
      </div>

      {/* Map or empty state */}
      {withLocation.length === 0 ? (
        <div style={{
          height: 280, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'var(--bg)', borderRadius: 8,
        }}>
          <div style={{ fontSize: 28 }}>🗺️</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray2)' }}>
            Nenhum cliente com localização cadastrada
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray2)' }}>
            Adicione o campo <strong>Cidade / Estado</strong> nos cadastros de clientes
          </div>
        </div>
      ) : (
        <ClientMapInner clients={withLocation} />
      )}
    </div>
  )
}
