import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

/** GET /api/integrations/linkedin/callback — handle OAuth callback */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (error) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=no_code`)
    }

    const db = await initDb()

    // Load stored client_id and state
    const row = await db.execute({
      sql:  `SELECT api_key, extra FROM integrations WHERE id = 'linkedin' LIMIT 1`,
      args: [],
    })

    if (!row.rows[0]) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=not_configured`)
    }

    const clientId  = row.rows[0].api_key as string
    const extra     = JSON.parse((row.rows[0].extra as string) || '{}') as Record<string, unknown>
    const storedState = extra.oauth_state as string | undefined

    // Validate state
    if (storedState && state !== storedState) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=invalid_state`)
    }

    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    if (!clientSecret) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=no_client_secret`)
    }

    const redirectUri = `${appUrl}/api/integrations/linkedin/callback`

    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    const tokenData = await tokenRes.json() as {
      access_token?: string
      expires_in?: number
      error?: string
      error_description?: string
    }

    if (!tokenData.access_token) {
      const msg = tokenData.error_description ?? tokenData.error ?? 'token_error'
      return NextResponse.redirect(`${appUrl}/?linkedin_error=${encodeURIComponent(msg)}`)
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 5184000) * 1000).toISOString()

    // Store token in integrations extra, remove oauth_state
    const { oauth_state: _removed, ...restExtra } = extra
    const newExtra = {
      ...restExtra,
      access_token: tokenData.access_token,
      expires_at:   expiresAt,
    }

    await db.execute({
      sql: `INSERT INTO integrations (id, api_key, extra, enabled, updated_at)
            VALUES ('linkedin', ?, ?, 1, ?)
            ON CONFLICT(id) DO UPDATE SET
              extra      = excluded.extra,
              enabled    = 1,
              updated_at = excluded.updated_at`,
      args: [clientId, JSON.stringify(newExtra), new Date().toISOString()],
    })

    return NextResponse.redirect(`${appUrl}/?linkedin_connected=1`)
  } catch (err) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/?linkedin_error=${encodeURIComponent(String(err))}`)
  }
}
