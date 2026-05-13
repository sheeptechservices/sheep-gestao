'use client'
import { useState, useEffect } from 'react'

interface Survey { id: string; client_name: string; project_name: string; score: number }

// ── useCountUp ────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    setVal(0)
    if (!target) return
    let raf: number
    const t = setTimeout(() => {
      let startTs = 0
      const tick = (ts: number) => {
        if (!startTs) startTs = ts
        const p = Math.min((ts - startTs) / duration, 1)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, 100)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [target])
  return val
}

// ── Zone config ───────────────────────────────────────────────────────────────
// Escala normalizada: scaled = (nps + 100) / 2
// scaled >= 90  ↔ nps >= 80  →  Excelência
// scaled >= 50  ↔ nps >= 0   →  Qualidade
// else                        →  Aperfeiçoamento
function getZone(nps: number) {
  if (nps >= 80) return {
    label: 'Excelência', color: '#1E8A3E',
    desc: 'Indica lealdade elevada. Os clientes confiam, recomendam espontaneamente e ajudam a fortalecer a reputação da empresa. O foco passa a ser alavancagem: transformar clientes em promotores ativos, gerar indicações e usar essas experiências como diferencial competitivo.',
  }
  if (nps >= 0) return {
    label: 'Qualidade', color: '#FFB400',
    desc: 'Representa uma entrega sólida e confiável. A maioria dos clientes está satisfeita e parte deles já recomenda a empresa. O desafio não é corrigir problemas graves, mas manter o padrão, reduzir variações e tornar a boa experiência previsível e repetível ao longo dos projetos.',
  }
  return {
    label: 'Aperfeiçoamento', color: '#D93025',
    desc: 'Indica que a experiência ainda não gera lealdade consistente. Há presença relevante de detratores e o cliente pode estar satisfeito em alguns pontos, mas não a ponto de recomendar. O foco deve ser identificar falhas, reduzir fricções e melhorar a experiência antes de buscar crescimento ou divulgação.',
  }
}

// ── Mini Donut ────────────────────────────────────────────────────────────────
function NpsDonut({ promotores, neutros, detratores }: { promotores: number; neutros: number; detratores: number }) {
  const [hov, setHov] = useState<string | null>(null)
  const total = promotores + neutros + detratores
  if (total === 0) return null

  const slices = [
    { key: 'promotores', label: 'Promotores', color: '#1E8A3E', count: promotores },
    { key: 'neutros',    label: 'Neutros',    color: '#FFB400', count: neutros    },
    { key: 'detratores', label: 'Detratores', color: '#D93025', count: detratores },
  ].filter(s => s.count > 0)

  const r = 42, circ = 2 * Math.PI * r, gap = slices.length > 1 ? 3 : 0
  let cum = 0
  const computed = slices.map(s => {
    const len = (s.count / total) * circ
    const drawLen = Math.max(len - gap, 0.1)
    const offset = circ * 0.25 - cum
    cum += len
    return { ...s, drawLen, offset, pct: ((s.count / total) * 100).toFixed(0) }
  })

  const hovSlice = hov ? computed.find(s => s.key === hov) : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
        <svg width="130" height="130" viewBox="0 0 100 100" overflow="visible">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--gray3)" strokeWidth={14} />
          {computed.map(s => (
            <circle key={s.key} cx="50" cy="50" r={r} fill="none"
              stroke={s.color}
              strokeWidth={hov === s.key ? 19 : 14}
              strokeDasharray={`${s.drawLen} ${circ - s.drawLen}`}
              strokeDashoffset={s.offset}
              style={{ transition: 'opacity 0.22s ease, stroke-width 0.2s ease', opacity: hov && hov !== s.key ? 0.22 : 1, cursor: 'pointer' }}
              onMouseEnter={() => setHov(s.key)}
              onMouseLeave={() => setHov(null)}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {hovSlice ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: hovSlice.color, lineHeight: 1 }}>{hovSlice.count}</div>
              <div style={{ fontSize: 10, color: hovSlice.color, fontWeight: 700, opacity: 0.8 }}>{hovSlice.pct}%</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--black)', lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 9, color: 'var(--gray2)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>respostas</div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {computed.map(s => (
          <div key={s.key}
            onMouseEnter={() => setHov(s.key)}
            onMouseLeave={() => setHov(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: hov && hov !== s.key ? 0.25 : 1, transition: 'opacity 0.2s', cursor: 'default' }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0, transform: hov === s.key ? 'scale(1.5)' : 'scale(1)', transition: 'transform 0.15s ease' }} />
            <span style={{ fontSize: 12, color: 'var(--gray)', flex: 1, fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 11, color: 'var(--gray2)', minWidth: 32, textAlign: 'right', fontWeight: 600 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Scatter plot ──────────────────────────────────────────────────────────────
// ── NPS by client ─────────────────────────────────────────────────────────────
function NpsClientBars({ surveys }: { surveys: Survey[] }) {
  const [hov, setHov] = useState<string | null>(null)

  const byClient: Record<string, number[]> = {}
  for (const s of surveys) {
    if (!byClient[s.client_name]) byClient[s.client_name] = []
    byClient[s.client_name].push(s.score)
  }

  const clients = Object.entries(byClient).map(([name, scores]) => {
    const p = scores.filter(s => s >= 9).length
    const d = scores.filter(s => s <= 6).length
    const nps = Math.round(((p - d) / scores.length) * 100)
    return { name, nps, count: scores.length }
  }).sort((a, b) => b.nps - a.nps)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        NPS por cliente
      </div>
      <div className="scrollbar-hide" style={{ overflowY: 'auto', maxHeight: 160, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {clients.map((c, i) => {
          const isH = hov === c.name
          const zone = getZone(c.nps)
          const barW = ((c.nps + 100) / 200) * 100
          return (
            <div key={c.name}
              onMouseEnter={() => setHov(c.name)}
              onMouseLeave={() => setHov(null)}
              style={{ opacity: hov && !isH ? 0.3 : 1, transition: 'opacity 0.2s', cursor: 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: isH ? 700 : 500, color: isH ? 'var(--black)' : 'var(--gray)', transition: 'color .15s' }}>
                  {c.name.split(' ')[0]}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isH && (
                    <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, animation: 'fadeIn 0.15s ease both' }}>
                      {c.count} resp.
                    </span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 800, color: zone.color }}>{c.nps}</span>
                </div>
              </div>
              <div style={{ height: isH ? 10 : 6, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden', transition: 'height 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: zone.color,
                  width: `${barW}%`,
                  boxShadow: isH ? `0 0 12px ${zone.color}88` : 'none',
                  transition: `width 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms, box-shadow 0.22s`,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── NPS Progress bar ──────────────────────────────────────────────────────────
function NpsBar({ nps }: { nps: number }) {
  const [hov, setHov] = useState(false)
  const pct = ((nps + 100) / 200) * 100
  const zone = getZone(nps)
  const zones = [
    { label: 'Aperfeiçoamento', from: 0,  to: 50,  color: '#D93025' },
    { label: 'Qualidade',       from: 50, to: 90,  color: '#FFB400' },
    { label: 'Excelência',      from: 90, to: 100, color: '#1E8A3E' },
  ]
  return (
    <div style={{ marginTop: 12 }}>
      {/* wrapper sem overflow para o dot não ser cortado */}
      <div
        style={{ position: 'relative', padding: '6px 0', cursor: 'default' }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {/* barra colorida */}
        <div style={{ height: 8, borderRadius: 100, overflow: 'hidden', display: 'flex' }}>
          {zones.map(z => (
            <div key={z.label} style={{
              width: `${z.to - z.from}%`,
              background: z.color,
              opacity: hov ? 0.45 : 0.28,
              transition: 'opacity 0.22s',
            }} />
          ))}
        </div>

        {/* dot — fora do overflow:hidden */}
        <div style={{
          position: 'absolute',
          left: `${pct}%`,
          top: '50%',
          transform: `translate(-50%, -50%) scale(${hov ? 1.35 : 1})`,
          width: 14, height: 14,
          borderRadius: '50%',
          background: zone.color,
          border: '2.5px solid var(--white)',
          boxShadow: hov
            ? `0 0 0 3px ${zone.color}30, 0 0 14px ${zone.color}`
            : `0 0 8px ${zone.color}80`,
          transition: 'left 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.2s ease, box-shadow 0.2s ease',
          zIndex: 1,
        }} />

        {/* tooltip on hover */}
        {hov && (
          <div style={{
            position: 'absolute',
            left: `${pct}%`,
            bottom: 'calc(100% + 2px)',
            transform: pct > 85 ? 'translateX(-90%)' : pct < 15 ? 'translateX(-10%)' : 'translateX(-50%)',
            background: 'var(--black)',
            color: '#fff',
            borderRadius: 7,
            padding: '4px 9px',
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'fadeIn 0.12s ease both',
            boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
          }}>
            <span style={{ color: zone.color }}>{nps > 0 ? '+' : ''}{nps}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginLeft: 5 }}>{zone.label}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        {['-100', '-50', '0', '50', '100'].map(l => (
          <span key={l} style={{ fontSize: 9, color: 'var(--gray2)', fontWeight: 600 }}>{l}</span>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function NpsSection({ nps, surveys }: { nps: number; surveys: Survey[] }) {
  const zone = getZone(nps)
  const counted = useCountUp(nps)
  const promotores = surveys.filter(s => s.score >= 9).length
  const neutros    = surveys.filter(s => s.score >= 7 && s.score <= 8).length
  const detratores = surveys.filter(s => s.score <= 6).length

  return (
    <div
      className="animate-slide-up delay-4"
      style={{
        background: 'var(--white)',
      border: '1px solid var(--gray3)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 28,
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Satisfação e sucesso dos projetos
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, alignItems: 'center' }}>

        {/* Left — Score + bar + zone */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray2)' }}>NPS</span>
            <span style={{ fontSize: 52, fontWeight: 900, color: zone.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {counted}
            </span>
          </div>

          <NpsBar nps={nps} />

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 500 }}>
              Está na zona de{' '}
              <span style={{ color: zone.color, fontWeight: 800 }}>{zone.label}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray2)', lineHeight: 1.6, marginTop: 8, fontWeight: 400 }}>
              {zone.desc}
            </p>
          </div>
        </div>

        {/* Center — Donut */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <NpsDonut promotores={promotores} neutros={neutros} detratores={detratores} />
        </div>

        {/* Right — Client bars */}
        <NpsClientBars surveys={surveys} />
      </div>
    </div>
  )
}
