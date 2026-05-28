import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

/** Cria um cliente Turso fresh a cada invocação — evita singleton com URL errada */
function freshDb() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error('TURSO_DATABASE_URL não configurada no ambiente Vercel')
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
}

/** GET /api/integrations/linkedin/callback — handle OAuth callback */
export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url)
  // No Vercel, req.url pode chegar com http:// mesmo sendo HTTPS.
  // x-forwarded-proto é a fonte confiável em ambientes proxy.
  const proto  = req.headers.get('x-forwarded-proto') ?? reqUrl.protocol.replace(':', '')
  const appUrl = `${proto}://${reqUrl.host}`

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

    const db  = freshDb()
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
      sql: `UPDATE integrations SET extra = ?, enabled = 1, updated_at = ? WHERE id = 'linkedin'`,
      args: [JSON.stringify(newExtra), new Date().toISOString()],
    })

    // Auto-fetch ad accounts so the UI can show a dropdown immediately
    try {
      const acctRes = await fetch(
        'https://api.linkedin.com/rest/adAccounts?q=search&search.status.values[0]=ACTIVE&fields=id,name,status,currency&count=50',
        {
          headers: {
            Authorization:                `Bearer ${tokenData.access_token}`,
            'LinkedIn-Version':           '202401',
            'X-Restli-Protocol-Version':  '2.0.0',
          },
        }
      )
      if (acctRes.ok) {
        const acctData   = await acctRes.json() as { elements?: Array<{ id: string | number; name?: string }> }
        const adAccounts = (acctData.elements ?? []).map(el => ({
          id:   String(el.id),
          name: el.name ?? `Conta ${el.id}`,
        }))
        const finalExtra = { ...newExtra, ad_accounts: adAccounts }
        await db.execute({
          sql:  `UPDATE integrations SET extra = ?, updated_at = ? WHERE id = 'linkedin'`,
          args: [JSON.stringify(finalExtra), new Date().toISOString()],
        })
      }
    } catch { /* non-fatal */ }

    return NextResponse.redirect(`${appUrl}/?linkedin_connected=1`)
  } catch (err) {
    return NextResponse.redirect(`${appUrl}/?linkedin_error=${encodeURIComponent(String(err))}`)
  }
}
