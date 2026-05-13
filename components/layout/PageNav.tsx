'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export interface NavTab { label: string; tab: string }

const DEFAULT_TABS: NavTab[] = [
  { label: 'Visão Geral', tab: '' },
  { label: 'Projetos',    tab: 'projetos' },
]

interface PageNavProps {
  tabs?: NavTab[]
  basePath?: string   // e.g. '/' or '/projects'
}

export function PageNav({ tabs = DEFAULT_TABS, basePath = '/' }: PageNavProps) {
  const router      = useRouter()
  const params      = useSearchParams()
  const currentTab  = params.get('tab') ?? ''
  const [hov, setHov] = useState<string | null>(null)

  function go(tab: string) {
    router.push(tab ? `${basePath}?tab=${tab}` : basePath)
  }

  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--gray3)', marginBottom: 28 }}>
      {tabs.map(t => {
        const active = currentTab === t.tab
        const isH    = hov === t.tab

        return (
          <button
            key={t.tab}
            onClick={() => go(t.tab)}
            onMouseEnter={() => setHov(t.tab)}
            onMouseLeave={() => setHov(null)}
            style={{
              position: 'relative',
              padding: '0 4px 12px',
              marginRight: 24,
              fontSize: 13,
              fontWeight: 700,
              color: active ? 'var(--black)' : isH ? 'var(--gray)' : 'var(--gray2)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
            <span style={{
              position: 'absolute', bottom: -1, left: 0, right: 0,
              height: 2, borderRadius: 2, background: 'var(--primary)',
              opacity: active ? 1 : 0, transition: 'opacity 0.18s',
            }} />
            {!active && isH && (
              <span style={{
                position: 'absolute', bottom: -1, left: 0, right: 0,
                height: 2, borderRadius: 2, background: 'var(--gray3)',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
