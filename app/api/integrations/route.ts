import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

const DEFAULT_IDS = ['anthropic', 'openai', 'replicate', 'google', 'github_token', 'slack']

/** GET /api/integrations — returns all integration rows (api_key masked) */
export async function GET() {
  try {
    const db  = await initDb()
    const res = await db.execute(`SELECT id, api_key, extra, enabled, updated_at FROM integrations`)

    // Ensure all default integrations exist in response even if not yet in DB
    const rows = res.rows as { id: string; api_key: string; extra: string; enabled: number; updated_at: string }[]
    const map  = Object.fromEntries(rows.map(r => [r.id, r]))

    const out = DEFAULT_IDS.map(id => {
      const row = map[id]
      return {
        id,
        api_key:    row ? (row.api_key ? '••••••••' : '') : '',   // mask key, keep empty string if none
        has_key:    row ? row.api_key.length > 0 : false,
        extra:      row ? JSON.parse(row.extra || '{}') : {},
        enabled:    row ? row.enabled === 1 : false,
        updated_at: row?.updated_at ?? null,
      }
    })
    return NextResponse.json(out)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/integrations — upsert one integration */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      id: string
      api_key?: string    // undefined = don't change; '' = clear
      extra?: Record<string, unknown>
      enabled?: boolean
    }
    if (!body.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const db  = await initDb()
    const now = new Date().toISOString()

    // Read existing row to preserve fields not being updated
    const existing = await db.execute({ sql: `SELECT * FROM integrations WHERE id = ?`, args: [body.id] })
    const row = existing.rows[0] as { id: string; api_key: string; extra: string; enabled: number } | undefined

    const newKey     = body.api_key !== undefined ? body.api_key : (row?.api_key ?? '')
    const newExtra   = body.extra   !== undefined ? JSON.stringify(body.extra) : (row?.extra ?? '{}')
    const newEnabled = body.enabled !== undefined ? (body.enabled ? 1 : 0) : (row?.enabled ?? 0)

    await db.execute({
      sql: `INSERT INTO integrations (id, api_key, extra, enabled, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              api_key    = excluded.api_key,
              extra      = excluded.extra,
              enabled    = excluded.enabled,
              updated_at = excluded.updated_at`,
      args: [body.id, newKey, newExtra, newEnabled, now],
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
