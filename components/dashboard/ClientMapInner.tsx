'use client'
import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import type { Client } from '@/lib/types'

// World TopoJSON via CDN (110m resolution — lightweight)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ── City name (lowercase, with/without accents) → [longitude, latitude] ───────
const CITY_COORDS: Record<string, [number, number]> = {
  // ── São Paulo ──────────────────────────────────────────────────────────────
  'são paulo':             [-46.6333, -23.5505],
  'sao paulo':             [-46.6333, -23.5505],
  'campinas':              [-47.0626, -22.9099],
  'guarulhos':             [-46.5333, -23.4628],
  'osasco':                [-46.7920, -23.5329],
  'sorocaba':              [-47.4577, -23.5015],
  'ribeirão preto':        [-47.8099, -21.1775],
  'ribeirao preto':        [-47.8099, -21.1775],
  'são josé dos campos':   [-45.8872, -23.1896],
  'sao jose dos campos':   [-45.8872, -23.1896],
  'santos':                [-46.3332, -23.9608],
  'são bernardo do campo': [-46.5650, -23.6939],
  'sao bernardo do campo': [-46.5650, -23.6939],
  'santo andré':           [-46.5384, -23.6647],
  'santo andre':           [-46.5384, -23.6647],
  'bauru':                 [-49.0630, -22.3154],
  'são carlos':            [-47.8964, -22.0174],
  'sao carlos':            [-47.8964, -22.0174],
  'piracicaba':            [-47.6476, -22.7253],
  'presidente prudente':   [-51.3886, -22.1206],
  'araçatuba':             [-50.4354, -21.2090],
  'aracatuba':             [-50.4354, -21.2090],
  // ── Rio de Janeiro ─────────────────────────────────────────────────────────
  'rio de janeiro':        [-43.1729, -22.9068],
  'niterói':               [-43.1033, -22.8833],
  'niteroi':               [-43.1033, -22.8833],
  'petrópolis':            [-43.1789, -22.5046],
  'petropolis':            [-43.1789, -22.5046],
  // ── Minas Gerais ───────────────────────────────────────────────────────────
  'belo horizonte':        [-43.9378, -19.9208],
  'contagem':              [-44.0536, -19.9317],
  'betim':                 [-44.1978, -19.9680],
  'juiz de fora':          [-43.3494, -21.7643],
  'uberlândia':            [-48.2767, -18.9188],
  'uberlandia':            [-48.2767, -18.9188],
  'montes claros':         [-43.8617, -16.7286],
  // ── Sul ───────────────────────────────────────────────────────────────────
  'curitiba':              [-49.2733, -25.4290],
  'londrina':              [-51.1732, -23.3045],
  'maringá':               [-51.9333, -23.4273],
  'maringa':               [-51.9333, -23.4273],
  'cascavel':              [-53.4553, -24.9578],
  'foz do iguaçu':         [-54.5714, -25.5484],
  'foz do iguacu':         [-54.5714, -25.5484],
  'porto alegre':          [-51.2177, -30.0346],
  'caxias do sul':         [-51.1769, -29.1681],
  'pelotas':               [-52.3383, -31.7654],
  'novo hamburgo':         [-51.1308, -29.6783],
  'florianópolis':         [-48.5482, -27.5969],
  'florianopolis':         [-48.5482, -27.5969],
  'joinville':             [-48.8461, -26.3044],
  'blumenau':              [-49.0661, -26.9194],
  'chapecó':               [-52.6202, -27.0966],
  'chapeco':               [-52.6202, -27.0966],
  'itajaí':                [-48.6647, -26.9077],
  'itajai':                [-48.6647, -26.9077],
  // ── Centro-Oeste ──────────────────────────────────────────────────────────
  'brasília':              [-47.9292, -15.7801],
  'brasilia':              [-47.9292, -15.7801],
  'goiânia':               [-49.2533, -16.6864],
  'goiania':               [-49.2533, -16.6864],
  'campo grande':          [-54.6152, -20.4697],
  'cuiabá':                [-56.0677, -15.5961],
  'cuiaba':                [-56.0677, -15.5961],
  // ── Nordeste ──────────────────────────────────────────────────────────────
  'salvador':              [-38.5014, -12.9718],
  'feira de santana':      [-38.9663, -12.2664],
  'ilhéus':                [-39.0453, -14.7899],
  'ilheus':                [-39.0453, -14.7899],
  'vitória da conquista':  [-40.8389, -14.8661],
  'vitoria da conquista':  [-40.8389, -14.8661],
  'recife':                [-34.8813,  -8.0539],
  'caruaru':               [-36.0218,  -8.2760],
  'petrolina':             [-40.5022,  -9.3985],
  'fortaleza':             [-38.5434,  -3.7172],
  'juazeiro do norte':     [-39.3136,  -7.2097],
  'caucaia':               [-38.6583,  -3.7378],
  'mossoró':               [-37.3440,  -5.1878],
  'mossoro':               [-37.3440,  -5.1878],
  'natal':                 [-35.2094,  -5.7793],
  'são luís':              [-44.3028,  -2.5307],
  'sao luis':              [-44.3028,  -2.5307],
  'são luis':              [-44.3028,  -2.5307],
  'teresina':              [-42.8016,  -5.0892],
  'maceió':                [-35.7353,  -9.6658],
  'maceio':                [-35.7353,  -9.6658],
  'aracaju':               [-37.0731, -10.9167],
  'joão pessoa':           [-34.8631,  -7.1195],
  'joao pessoa':           [-34.8631,  -7.1195],
  // ── Norte ─────────────────────────────────────────────────────────────────
  'manaus':                [-60.0212,  -3.1190],
  'belém':                 [-48.5044,  -1.4558],
  'belem':                 [-48.5044,  -1.4558],
  'porto velho':           [-63.9004,  -8.7612],
  'macapá':                [-51.0694,   0.0356],
  'macapa':                [-51.0694,   0.0356],
  'rio branco':            [-67.8100,  -9.9754],
  'palmas':                [-48.3543, -10.2128],
  'boa vista':             [-60.6733,   2.8235],
  // ── Espírito Santo / outros ────────────────────────────────────────────────
  'vitória':               [-40.3378, -20.3155],
  'vitoria':               [-40.3378, -20.3155],
  // ── Internacional ──────────────────────────────────────────────────────────
  'nova york':             [-74.0060,  40.7128],
  'new york':              [-74.0060,  40.7128],
  'miami':                 [-80.1918,  25.7617],
  'los angeles':           [-118.2437, 34.0522],
  'san francisco':         [-122.4194, 37.7749],
  'chicago':               [-87.6298,  41.8781],
  'toronto':               [-79.3832,  43.6532],
  'lisboa':                [-9.1393,   38.7223],
  'lisbon':                [-9.1393,   38.7223],
  'madrid':                [-3.7038,   40.4168],
  'paris':                 [2.3522,    48.8566],
  'london':                [-0.1278,   51.5074],
  'londres':               [-0.1278,   51.5074],
  'berlin':                [13.4050,   52.5200],
  'amsterdam':             [4.9041,    52.3676],
  'dubai':                 [55.2708,   25.2048],
  'tokyo':                 [139.6917,  35.6895],
  'sydney':                [151.2093, -33.8688],
  'buenos aires':          [-58.3816, -34.6037],
  'bogotá':                [-74.0721,   4.7110],
  'bogota':                [-74.0721,   4.7110],
  'santiago':              [-70.6693, -33.4489],
  'lima':                  [-77.0428, -12.0464],
}

// State abbreviation → capital coordinates (fallback when city not found)
const STATE_COORDS: Record<string, [number, number]> = {
  AC: [-67.8100,  -9.9754],  AL: [-35.7353,  -9.6658],
  AM: [-60.0212,  -3.1190],  AP: [-51.0694,   0.0356],
  BA: [-38.5014, -12.9718],  CE: [-38.5434,  -3.7172],
  DF: [-47.9292, -15.7801],  ES: [-40.3378, -20.3155],
  GO: [-49.2533, -16.6864],  MA: [-44.3028,  -2.5307],
  MG: [-43.9378, -19.9208],  MS: [-54.6152, -20.4697],
  MT: [-56.0677, -15.5961],  PA: [-48.5044,  -1.4558],
  PB: [-34.8631,  -7.1195],  PE: [-34.8813,  -8.0539],
  PI: [-42.8016,  -5.0892],  PR: [-49.2733, -25.4290],
  RJ: [-43.1729, -22.9068],  RN: [-35.2094,  -5.7793],
  RO: [-63.9004,  -8.7612],  RR: [-60.6733,   2.8235],
  RS: [-51.2177, -30.0346],  SC: [-48.5482, -27.5969],
  SE: [-37.0731, -10.9167],  SP: [-46.6333, -23.5505],
  TO: [-48.3543, -10.2128],
}

// Brazil bounding box
const BR = { minLng: -73.99, maxLng: -28.85, minLat: -33.75, maxLat: 5.27 }
function isBrazilian([lng, lat]: [number, number]) {
  return lng >= BR.minLng && lng <= BR.maxLng && lat >= BR.minLat && lat <= BR.maxLat
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function parseCoords(raw: string): [number, number] | null {
  if (!raw?.trim()) return null

  // Normalise separators: "City - UF", "City/UF", "City,UF", "City UF"
  // Collapse any separator (space+dash, slash, comma) into a single comma
  const normalised = raw
    .replace(/\s*[-/]\s*/g, ',')   // " - " or "/" → ","
    .replace(/\s*,\s*/g, ',')      // tidy commas
    .trim()

  const parts = normalised.split(',')
  const cityRaw   = parts[0]?.trim() ?? ''
  const stateRaw  = parts[1]?.trim().toUpperCase() ?? ''

  // Helpers
  const cityLow  = cityRaw.toLowerCase()
  const cityNorm = normalize(cityRaw)   // accent-free lowercase

  // 1. Exact city name (with accents)
  if (CITY_COORDS[cityLow])  return CITY_COORDS[cityLow]

  // 2. City name without accents
  if (CITY_COORDS[cityNorm]) return CITY_COORDS[cityNorm]

  // 3. Only a 2-letter state code was given (e.g. "SP")
  if (cityRaw.length === 2 && STATE_COORDS[cityRaw.toUpperCase()])
    return STATE_COORDS[cityRaw.toUpperCase()]

  // 4. State abbreviation in the second part
  if (stateRaw.length === 2 && STATE_COORDS[stateRaw])
    return STATE_COORDS[stateRaw]

  // 5. Try to find a 2-letter state code anywhere in the string (last word)
  const tokens = raw.trim().split(/\s+/)
  const last   = tokens[tokens.length - 1]?.replace(/[^A-Za-z]/g, '').toUpperCase()
  if (last?.length === 2 && STATE_COORDS[last]) return STATE_COORDS[last]

  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LocationGroup {
  coords: [number, number]
  names: string[]
  location: string
}

export default function ClientMapInner({ clients }: { clients: Client[] }) {
  const [tooltip, setTooltip] = useState<string | null>(null)
  const [tipPos,  setTipPos]  = useState({ x: 0, y: 0 })

  // Group clients by resolved coordinates
  const groups: LocationGroup[] = []
  const seen = new Map<string, number>()

  clients.forEach(c => {
    if (!c.cidade_estado) return
    const coords = parseCoords(c.cidade_estado)
    if (!coords) return
    const key = `${coords[0].toFixed(4)},${coords[1].toFixed(4)}`
    if (seen.has(key)) {
      groups[seen.get(key)!].names.push(c.name)
    } else {
      seen.set(key, groups.length)
      groups.push({ coords, names: [c.name], location: c.cidade_estado })
    }
  })

  const hasIntl = groups.some(g => !isBrazilian(g.coords))

  const projConfig = hasIntl
    ? { center: [-20, -10] as [number, number], scale: 130 }
    : { center: [-52, -15] as [number, number], scale: 680 }

  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={projConfig}
        style={{ width: '100%', height: 280, display: 'block' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: '#E3E4DE', stroke: '#F8F8F6', strokeWidth: 0.6, outline: 'none' },
                  hover:   { fill: '#E3E4DE', outline: 'none' },
                  pressed: { fill: '#E3E4DE', outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {groups.map((g, i) => {
          const r = Math.min(4 + g.names.length * 2, 14)
          return (
            <Marker key={i} coordinates={g.coords}>
              <circle
                r={r}
                fill="#84CC16"
                fillOpacity={0.88}
                stroke="#fff"
                strokeWidth={1.5}
                onMouseEnter={e => {
                  setTooltip(g.names.join(' · ') + (g.location ? `  —  ${g.location}` : ''))
                  setTipPos({ x: e.clientX, y: e.clientY })
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}
              />
              {g.names.length > 1 && (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: Math.min(r - 1, 8),
                    fontWeight: 700,
                    fill: '#fff',
                    pointerEvents: 'none',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  {g.names.length}
                </text>
              )}
            </Marker>
          )
        })}
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tipPos.x + 12,
          top: tipPos.y - 28,
          background: 'var(--black)',
          color: 'var(--white)',
          fontSize: 11,
          fontWeight: 600,
          padding: '5px 10px',
          borderRadius: 8,
          pointerEvents: 'none',
          zIndex: 9999,
          maxWidth: 280,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}>
          {tooltip}
        </div>
      )}

      {/* Overlay when no coords resolved */}
      {groups.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)' }}>
            Formato de localização não reconhecido
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray2)' }}>
            Use o formato: <strong>Cidade, UF</strong> &nbsp;(ex: São Paulo, SP)
          </div>
        </div>
      )}
    </div>
  )
}
