'use client'
import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/* ── Cycling words for the headline ─────────────────────────────── */
const WORDS = ['conectada', 'inteligente', 'escalável', 'ágil', 'eficiente']

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? '/'

  const [greet,    setGreet]    = useState('')
  const [user,     setUser]     = useState('')
  const [pass,     setPass]     = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    const h = new Date().getHours()
    setGreet(h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite')
    setTimeout(() => setReady(true), 80)
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
    color: 'var(--black)', background: 'var(--white)',
    border: '1px solid var(--gray3)', borderRadius: 8,
    outline: 'none', transition: 'border-color .2s, box-shadow .2s',
    boxSizing: 'border-box',
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao entrar.')
      } else {
        router.push(from)
        router.refresh()
      }
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const stagger = (i: number): React.CSSProperties => ({
    opacity:   ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity .5s ease ${i * 0.07}s, transform .5s ease ${i * 0.07}s`,
  })

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ ...stagger(0), fontSize: 26, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 6 }}>
        {greet ? `${greet}.` : ' '}
      </div>
      <p style={{ ...stagger(1), fontSize: 14, color: 'var(--gray)', marginBottom: 32, lineHeight: 1.6 }}>
        Entre com suas credenciais para acessar o painel.
      </p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ ...stagger(2), display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.04em' }}>
            USUÁRIO <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
          </label>
          <input
            type="text" value={user} onChange={e => setUser(e.target.value)}
            placeholder="seu usuário" required autoComplete="username" style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-dim)' }}
            onBlur={e =>  { e.target.style.borderColor = 'var(--gray3)';   e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ ...stagger(3), display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.04em' }}>
            SENHA <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              style={{ ...inputStyle, paddingRight: 40 }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-dim)' }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--gray3)';   e.target.style.boxShadow = 'none' }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--gray2)', display: 'flex', alignItems: 'center' }}>
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ ...stagger(4), padding: '10px 14px', background: 'rgba(217,48,37,0.06)', border: '1px solid rgba(217,48,37,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--red)', animation: 'loginShake .35s ease' }}>
            {error}
          </div>
        )}

        <div style={stagger(4)}>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
            background: loading ? 'var(--gray3)' : 'var(--primary)',
            color: loading ? 'var(--gray)' : 'var(--primary-text)',
            border: 'none', borderRadius: 100, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all .2s', marginTop: 4,
          }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(132,204,22,0.4)' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      <div style={{ ...stagger(5), display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 12, marginTop: 24 }}>
        <div style={{ width: 28, height: 28, background: 'var(--primary-dim)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--primary-text)" strokeWidth="1.5">
            <rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/>
          </svg>
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--black)', fontWeight: 700, display: 'block' }}>Sem acesso?</strong>
          Solicite suas credenciais ao administrador da conta.
        </div>
      </div>
    </div>
  )
}

/* ── Matrix rain canvas ──────────────────────────────────────────── */
function MatrixRain() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const mouseRef  = React.useRef({ x: -9999, y: -9999 })
  const burstRef  = React.useRef<{ x: number; y: number; t: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const CHARS =
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
      'ァィゥェォッャュョあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん' +
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      'abcdefghijklmnopqrstuvwxyz' +
      '0123456789' +
      '<>{}[]|/\\;:=+-*%$#@!?&^~`\'",.ΔΩΣΠΦΨΛΘαβγδεζηθλμξπρστφψω' +
      '░▒▓█▄▀■□▪▫►◄▲▼◆◇○●∞≠≈≤≥±÷×∑∏√∂∇∈∉⊂⊃∩∪'
    const FONT_SIZE = 22
    const SPEED = 5
    let cols: number[] = []
    let frame = 0
    let raf: number

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const numCols = Math.floor(canvas.width / FONT_SIZE)
      cols = Array.from({ length: numCols }, () => Math.floor(Math.random() * -(canvas.height / FONT_SIZE)))
    }

    function draw() {
      frame++
      const now  = Date.now()
      const tick = frame % SPEED === 0
      const mx   = mouseRef.current.x
      const my   = mouseRef.current.y

      // Expire old bursts
      burstRef.current = burstRef.current.filter(b => now - b.t < 900)

      // Persistent fade — long trail
      ctx.fillStyle = 'rgba(18,19,22,0.045)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `bold ${FONT_SIZE}px monospace`

      for (let i = 0; i < cols.length; i++) {
        const x = i * FONT_SIZE
        const y = cols[i] * FONT_SIZE

        if (cols[i] >= 0) {
          const char = CHARS[Math.floor(Math.random() * CHARS.length)]

          // Mouse proximity: within 130px → brighter + stronger glow
          const dx   = x - mx
          const dy   = y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          const prox = Math.max(0, 1 - dist / 130)

          // Burst proximity: any active burst within 100px
          const burstProx = burstRef.current.reduce((acc, b) => {
            const age  = (now - b.t) / 900           // 0→1 as it ages
            const bdx  = x - b.x
            const bdy  = y - b.y
            const bd   = Math.sqrt(bdx * bdx + bdy * bdy)
            const ring = Math.abs(bd - age * 200)     // expanding ring radius
            return Math.max(acc, Math.max(0, 1 - ring / 40) * (1 - age))
          }, 0)

          const intensity = Math.max(prox, burstProx)

          if (intensity > 0) {
            ctx.fillStyle  = `rgba(255,255,220,${0.55 + intensity * 0.45})`
            ctx.shadowColor = '#84CC16'
            ctx.shadowBlur  = 10 + intensity * 28
          } else {
            ctx.fillStyle  = '#dfffaa'
            ctx.shadowColor = '#84CC16'
            ctx.shadowBlur  = 14
          }

          ctx.fillText(char, x, y)
          ctx.shadowBlur = 0
        }

        if (tick) {
          cols[i]++
          if (cols[i] * FONT_SIZE > canvas.height && Math.random() > 0.97) {
            cols[i] = Math.floor(Math.random() * -30)
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    // ── Event listeners on the parent panel (canvas is pointer-events:none) ──
    const panel = canvas.parentElement!

    function onMouseMove(e: MouseEvent) {
      const r = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 }
    }
    function onClick(e: MouseEvent) {
      const r  = canvas.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      burstRef.current.push({ x: cx, y: cy, t: Date.now() })

      // Inject new stream heads near click point
      const row = Math.floor(cy / FONT_SIZE)
      for (let i = 0; i < cols.length; i++) {
        const dist = Math.abs(i * FONT_SIZE - cx)
        if (dist < 100) {
          cols[i] = row - Math.round(dist / FONT_SIZE / 2)
        }
      }
    }

    panel.addEventListener('mousemove', onMouseMove)
    panel.addEventListener('mouseleave', onMouseLeave)
    panel.addEventListener('click', onClick)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    raf = requestAnimationFrame(draw)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      panel.removeEventListener('mousemove', onMouseMove)
      panel.removeEventListener('mouseleave', onMouseLeave)
      panel.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.75 }}
    />
  )
}

/* ── Left panel — animated dark side ────────────────────────────── */
function LeftPanel() {
  const [wordIdx,  setWordIdx]  = useState(0)
  const [wordVis,  setWordVis]  = useState(true)
  const [panelIn,  setPanelIn]  = useState(false)

  useEffect(() => {
    setTimeout(() => setPanelIn(true), 50)

    const interval = setInterval(() => {
      setWordVis(false)
      setTimeout(() => {
        setWordIdx(i => (i + 1) % WORDS.length)
        setWordVis(true)
      }, 350)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const panelStagger = (i: number): React.CSSProperties => ({
    opacity:   panelIn ? 1 : 0,
    transform: panelIn ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity .6s ease ${i * 0.12}s, transform .6s ease ${i * 0.12}s`,
  })

  return (
    <div style={{
      background: 'var(--black)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: 48, position: 'relative', overflow: 'hidden', height: '100%',
    }}>
      {/* Matrix rain */}
      <MatrixRain />

      {/* Dark gradient overlay so text stays readable */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(18,19,22,0.72) 0%, rgba(18,19,22,0.45) 100%)',
      }} />

      {/* Logo */}
      <div style={{ ...panelStagger(0), display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 36, height: 36, background: 'var(--primary)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: 'var(--primary-text)', flexShrink: 0,
          boxShadow: '0 0 0 0 rgba(132,204,22,0.4)',
          animation: 'loginLogoPulse 3s ease infinite',
        }}>S</div>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Sheep Tech</span>
      </div>

      {/* Headline with cycling word */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ ...panelStagger(1), fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 14, letterSpacing: '-0.025em' }}>
          Gestão de projetos<br />
          <span style={{
            display: 'inline-block',
            color: 'var(--primary)',
            opacity: wordVis ? 1 : 0,
            transform: wordVis ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity .3s ease, transform .3s ease',
            minWidth: 160,
            background: 'rgba(132,204,22,0.12)',
            border: '1px solid rgba(132,204,22,0.25)',
            borderRadius: 10,
            padding: '2px 12px 4px 6px',
            animation: 'wordGlow 2.8s ease-in-out infinite',
          }}>
            {WORDS[wordIdx]}
          </span>
          <br />ao seu time.
        </h1>
        <p style={{ ...panelStagger(2), fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 340 }}>
          Acompanhe entregas, gerencie clientes e projetos — tudo em um só lugar.
        </p>
      </div>

      {/* Footer */}
      <div style={{ ...panelStagger(3), fontSize: 12, color: 'rgba(255,255,255,0.3)', position: 'relative', zIndex: 1 }}>
        © 2026 Sheep Tech
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <style>{`
        @keyframes loginLogoPulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(132,204,22,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(132,204,22,0);   }
        }
        @keyframes wordGlow {
          0%, 100% {
            text-shadow: 0 0 12px rgba(132,204,22,0.7), 0 0 28px rgba(132,204,22,0.35);
            box-shadow:  0 0 12px rgba(132,204,22,0.15), inset 0 0 12px rgba(132,204,22,0.06);
          }
          50% {
            text-shadow: 0 0 20px rgba(132,204,22,1.0), 0 0 50px rgba(132,204,22,0.55), 0 0 80px rgba(132,204,22,0.25);
            box-shadow:  0 0 22px rgba(132,204,22,0.30), inset 0 0 18px rgba(132,204,22,0.10);
          }
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        @media (max-width: 767px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
          .login-right { padding: 40px 24px !important; align-items: flex-start !important; padding-top: 72px !important; }
        }
      `}</style>

      <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
        <div className="login-left">
          <LeftPanel />
        </div>

        {/* Right panel */}
        <div className="login-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--bg)' }}>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </>
  )
}
