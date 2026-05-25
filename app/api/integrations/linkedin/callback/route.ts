import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/** GET /api/integrations/linkedin/callback — handle OAuth callback */
export async function GET(req: NextRequest) {
  // Derive app URL from request — no env var needed
  const reqUrl = new URL(req.url)
  const appUrl = `${reqUrl.protocol}//${reqUrl.host}`

  try {
    const { searchParams } = reqUrl
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=${encodeURIComponent(error)}`)
    }
    if (!code) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=no_code`)
    }

    const db = getDb()

    const row = await db.execute({
      sql:  `SELECT api_key, extra FROM integrations WHERE id = 'linkedin' LIMIT 1`,
      args: [],
    })

    if (!row.rows[0]) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=not_configured`)
    }

    const clientId    = row.rows[0].api_key as string
    const extra       = JSON.parse((row.rows[0].extra as string) || '{}') as Record<string, unknown>
    const storedState = extra.oauth_state as string | undefined

    // CSRF validation
    if (storedState && state !== storedState) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=invalid_state`)
    }

    // Read client_secret from DB — no env var needed
    const clientSecret = extra.client_secret as string | undefined
    if (!clientSecret) {
      return NextResponse.redirect(`${appUrl}/?linkedin_error=client_secret_missing`)
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

    // Store token, remove oauth_state
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

    // Auto-fetch ad accounts so the UI can show a dropdown immediately
    try {
      const acctRes = await fetch(
        'https://api.linkedin.com/rest/adAccounts?q=search&search.status.values[0]=ACTIVE&fields=id,name,status,currency&count=50',
        {
          headers: {
            Authorization:      `Bearer ${tokenData.access_token}`,
            'LinkedIn-Version': '202401',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      )
      if (acctRes.ok) {
        const acctData = await acctRes.json() as {
          elements?: Array<{ id: string | number; name?: string; status?: string; currency?: string }>
        }
        const adAccounts = (acctData.elements ?? []).map(el => ({
          id:   String(el.id),
          name: el.name ?? `Conta ${el.id}`,
        }))
        // Store accounts in extra
        const finalExtra = { ...newExtra, ad_accounts: adAccounts }
        await db.execute({
          sql: `UPDATE integrations SET extra = ?, updated_at = ? WHERE id = 'linkedin'`,
          args: [JSON.stringify(finalExtra), new Date().toISOString()],
        })
      }
    } catch { /* non-fatal — user can refresh accounts manually */ }

    return NextResponse.redirect(`${appUrl}/?linkedin_connected=1`)
  } catch (err) {
    return NextResponse.redirect(`${appUrl}/?linkedin_error=${encodeURIComponent(String(err))}`)
  }
}
