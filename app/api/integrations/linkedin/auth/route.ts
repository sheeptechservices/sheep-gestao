import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/** GET /api/integrations/linkedin/auth — redirect to LinkedIn OAuth */
export async function GET(req: NextRequest) {
  try {
    // Usa getDb() diretamente para evitar que initDb() (que roda migrations)
    // interfira com dados já existentes no banco via transações implícitas
    const db = getDb()

    const row = await db.execute({
      sql:  `SELECT api_key, extra FROM integrations WHERE id = 'linkedin' LIMIT 1`,
      args: [],
    })

    const clientId = row.rows[0]?.api_key as string | undefined

    // Derive app URL early so we can redirect on error
    const reqUrl = new URL(req.url)
    const appUrl = `${reqUrl.protocol}//${reqUrl.host}`

    if (!clientId) {
      // Diagnóstico: inclui detalhes para facilitar o debug
      const rowExists   = !!row.rows[0]
      const keyRaw      = row.rows[0]?.api_key
      const keyType     = typeof keyRaw
      const keyLen      = keyRaw != null ? String(keyRaw).length : -1
      const extra       = rowExists ? JSON.parse((row.rows[0]!.extra as string) || '{}') : {}
      const hasSecret   = !!extra.client_secret
      const dbUrl       = process.env.TURSO_DATABASE_URL
        ? 'turso:' + (process.env.TURSO_DATABASE_URL as string).slice(0, 20) + '…'
        : 'local-file'
      const detail = `row=${rowExists} keyType=${keyType} keyLen=${keyLen} hasSecret=${hasSecret} db=${dbUrl}`
      return NextResponse.redirect(
        `${appUrl}/?linkedin_error=${encodeURIComponent('client_id_missing: ' + detail)}`
      )
    }

    const redirectUri = `${appUrl}/api/integrations/linkedin/callback`
    const state       = Math.random().toString(36).slice(2) + Date.now().toString(36)

    // Store state for CSRF validation in callback
    const existingExtra = row.rows[0]
      ? JSON.parse((row.rows[0].extra as string) || '{}')
      : {}
    const newExtra = { ...existingExtra, oauth_state: state }

    await db.execute({
      sql: `INSERT INTO integrations (id, api_key, extra, enabled, updated_at)
            VALUES ('linkedin', ?, ?, 0, ?)
            ON CONFLICT(id) DO UPDATE SET extra = excluded.extra, updated_at = excluded.updated_at`,
      args: [clientId, JSON.stringify(newExtra), new Date().toISOString()],
    })

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     clientId,
      redirect_uri:  redirectUri,
      state,
      scope:         'r_ads_leadgen_automation r_organization_social',
    })

    return NextResponse.redirect(
      `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
