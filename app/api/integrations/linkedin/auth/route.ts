import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

/** Cria um cliente Turso fresh a cada invocação — evita singleton com URL errada */
function freshDb() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error('TURSO_DATABASE_URL não configurada no ambiente Vercel')
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
}

/** GET /api/integrations/linkedin/auth — redirect to LinkedIn OAuth */
export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url)
  const appUrl = `${reqUrl.protocol}//${reqUrl.host}`

  try {
    const db  = freshDb()
    const row = await db.execute({
      sql:  `SELECT api_key, extra FROM integrations WHERE id = 'linkedin' LIMIT 1`,
      args: [],
    })

    const clientId = row.rows[0]?.api_key as string | undefined

    if (!clientId) {
      const rowExists = !!row.rows[0]
      const detail    = `row=${rowExists} keyLen=${clientId === undefined ? 'undef' : String(clientId).length} db=${(process.env.TURSO_DATABASE_URL ?? 'NO_URL').slice(0, 30)}…`
      return NextResponse.redirect(
        `${appUrl}/?linkedin_error=${encodeURIComponent('client_id_missing: ' + detail)}`
      )
    }

    const redirectUri = `${appUrl}/api/integrations/linkedin/callback`
    const state       = Math.random().toString(36).slice(2) + Date.now().toString(36)

    // Salva oauth_state para validação CSRF no callback
    const existingExtra = JSON.parse((row.rows[0]!.extra as string) || '{}')
    const newExtra      = { ...existingExtra, oauth_state: state }

    await db.execute({
      sql: `UPDATE integrations SET extra = ?, updated_at = ? WHERE id = 'linkedin'`,
      args: [JSON.stringify(newExtra), new Date().toISOString()],
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
    return NextResponse.redirect(
      `${appUrl}/?linkedin_error=${encodeURIComponent(String(err))}`
    )
  }
}
