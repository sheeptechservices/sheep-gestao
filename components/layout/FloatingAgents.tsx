'use client'
import { useState, useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useAgentsStore } from '@/stores/agentsStore'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { AgentType } from '@/lib/types'

export function FloatingAgents() {
  const [open,    setOpen]    = useState(false)
  const [hov,     setHov]     = useState<string | null>(null)
  const [fabHov,  setFabHov]  = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { isMobile } = useBreakpoint()
  const openChat  = useChatStore(s => s.openChat)
  const closeChat = useChatStore(s => s.closeChat)
  const openChats = useChatStore(s => s.openChats)
  const allAgents = useAgentsStore(s => s.agents)
  const AGENTS    = allAgents.filter(a => a.enabled)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!mounted) return null

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(18,19,22,0.20)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.18s ease both',
          }}
        />
      )}

      <div ref={ref} style={{ position: 'fixed', bottom: isMobile ? 72 : 32, right: isMobile ? 16 : 32, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, pointerEvents: 'none' }}>

        {/* Vertical agent list — rendered top-to-bottom (reversed so PO is nearest FAB) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', pointerEvents: open ? 'auto' : 'none' }}>
          {[...AGENTS].reverse().map((agent, ri) => {
            const i     = AGENTS.length - 1 - ri   // original index for stagger
            const delay = open ? i * 45 : (AGENTS.length - 1 - i) * 25
            const isH   = hov === agent.type

            const isOpen = openChats.includes(agent.type as AgentType)
            return (
              <div
                key={agent.type}
                title={isMobile ? `${agent.name} — ${agent.role}` : undefined}
                onMouseEnter={() => setHov(agent.type)}
                onMouseLeave={() => setHov(null)}
                onClick={() => {
                  const type = agent.type as AgentType
                  if (openChats.includes(type)) { closeChat(type) } else { openChat(type) }
                  setOpen(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  pointerEvents: open ? 'auto' : 'none',
                  transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.88)',
                  opacity: open ? 1 : 0,
                  transition: `transform 0.35s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms, opacity 0.22s ease ${delay}ms`,
                  cursor: 'pointer',
                }}
              >
                {/* Label card — hidden on mobile to avoid overflow */}
                {!isMobile && (
                  <div style={{
                    background: isH ? agent.color : 'var(--white)',
                    border: `1px solid ${isH ? agent.color : 'var(--gray3)'}`,
                    borderRadius: 10,
                    padding: '7px 14px',
                    boxShadow: isH ? `0 4px 16px ${agent.shadow}` : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
                    textAlign: 'right',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: isH ? '#fff' : 'var(--black)', lineHeight: 1.2, transition: 'color 0.18s' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: isH ? 'rgba(255,255,255,0.75)' : 'var(--gray2)', marginTop: 1, transition: 'color 0.18s' }}>
                      {agent.role}
                    </div>
                  </div>
                )}

                {/* Emoji circle — wrapper matches FAB width so circles align */}
                <div style={{ width: isMobile ? 44 : 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <div style={{
                    width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: '50%',
                    background: isH ? agent.color : '#fff',
                    border: `2px solid ${isOpen ? agent.color : agent.color}`,
                    boxShadow: isOpen ? `0 0 0 3px ${agent.color}30, 0 4px 14px ${agent.shadow}` : isH ? `0 4px 14px ${agent.shadow}` : '0 2px 8px rgba(0,0,0,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? 15 : 18,
                    transform: isH ? 'scale(1.12)' : 'scale(1)',
                    transition: 'background 0.18s, box-shadow 0.18s, transform 0.18s',
                  }}>
                    {agent.emoji}
                  </div>
                  {/* Green dot when chat is open */}
                  {isOpen && (
                    <div style={{ position: 'absolute', bottom: 2, right: 4, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg)', boxShadow: '0 0 0 1px rgba(34,197,94,0.3)' }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* FAB */}
        <button
          onClick={() => setOpen(o => !o)}
          onMouseEnter={() => setFabHov(true)}
          onMouseLeave={() => setFabHov(false)}
          style={{
            width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: '50%', flexShrink: 0,
            pointerEvents: 'auto',
            background: open ? 'var(--black)' : 'var(--primary)',
            filter: fabHov && !open ? 'brightness(1.12)' : 'none',
            border: 'none', cursor: 'pointer', outline: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: open
              ? '0 8px 28px rgba(18,19,22,0.30)'
              : fabHov ? '0 8px 24px var(--primary-mid)' : '0 4px 16px var(--primary-mid)',
            transform: fabHov && !open ? 'scale(1.07)' : 'scale(1)',
            transition: 'background 0.22s ease, box-shadow 0.22s ease, transform 0.18s ease',
            position: 'relative',
          }}
        >
          {!open && (
            <div style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: '2px solid var(--primary-mid)',
              animation: 'breathe-ring 2.4s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}
          <div style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.28s cubic-bezier(0.34,1.2,0.64,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {open ? (
              <svg width={isMobile ? 15 : 18} height={isMobile ? 15 : 18} viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2L2 16" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} viewBox="0 0 22 22" fill="none">
                {/* Crown */}
                <path d="M3 16h16M3 16l2.5-8 4.5 4 3-6 3 6 4.5-4L19 16" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="11" cy="6" r="1.2" fill="#fff"/>
                <circle cx="4.5" cy="9.5" r="1" fill="#fff"/>
                <circle cx="17.5" cy="9.5" r="1" fill="#fff"/>
              </svg>
            )}
          </div>
        </button>
      </div>
    </>
  )
}
