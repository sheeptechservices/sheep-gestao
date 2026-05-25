import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

/** GET /api/integrations/linkedin/auth — redirect to LinkedIn OAuth */
export async function GET() {
  try {
    const db = await initDb()

    // Try to get client_id from integrations table first, then env
    const row = await db.execute({
      sql:  `SELECT api_key, extra FROM integrations WHERE id = 'linkedin' LIMIT 1`,
      args: [],
    })

    const clientId =
      (row.rows[0]?.api_key as string | undefined) ||
      process.env.LINKEDIN_CLIENT_ID

    if (!clientId) {
      return NextResponse.json(
        { error: 'LinkedIn Client ID não configurado. Adicione em Integrações ou defina LINKEDIN_CLIENT_ID no .env.local.' },
        { status: 500 }
      )
    }

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/integrations/linkedin/callback`
    const state       = Math.random().toString(36).slice(2) + Date.now().toString(36)

    // Store state temporarily in integrations extra for validation in callback
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
