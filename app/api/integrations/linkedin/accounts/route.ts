import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

interface LIAccount {
  id: string
  name: string
  status?: string
  currency?: string
}

/** GET /api/integrations/linkedin/accounts
 *  Fetches available LinkedIn Ads accounts for the authenticated user
 *  and stores the list in integrations.extra.ad_accounts for the UI dropdown.
 */
export async function GET() {
  try {
    const db = await initDb()

    const row = await db.execute({
      sql:  `SELECT api_key, extra FROM integrations WHERE id = 'linkedin' LIMIT 1`,
      args: [],
    })

    if (!row.rows[0]) {
      return NextResponse.json({ error: 'LinkedIn não conectado' }, { status: 401 })
    }

    const extra       = JSON.parse((row.rows[0].extra as string) || '{}') as Record<string, unknown>
    const accessToken = extra.access_token as string | undefined

    if (!accessToken) {
      return NextResponse.json({ error: 'LinkedIn não autenticado. Conecte via OAuth primeiro.' }, { status: 401 })
    }

    // Fetch ad accounts — try REST API first (newer), fallback to v2
    const res = await fetch(
      'https://api.linkedin.com/rest/adAccounts?q=search&search.status.values[0]=ACTIVE&fields=id,name,status,currency&count=50',
      {
        headers: {
          Authorization:      `Bearer ${accessToken}`,
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    const data = await res.json() as {
      elements?: Array<{ id: string | number; name?: string; status?: string; currency?: string }>
      serviceErrorCode?: number
      message?: string
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? `LinkedIn API error ${res.status}` },
        { status: res.status }
      )
    }

    const accounts: LIAccount[] = (data.elements ?? []).map(el => ({
      id:       String(el.id),
      name:     el.name ?? `Conta ${el.id}`,
      status:   el.status,
      currency: el.currency,
    }))

    // Persist the list so the UI can show it without re-fetching
    const newExtra = { ...extra, ad_accounts: accounts }
    await db.execute({
      sql: `UPDATE integrations SET extra = ?, updated_at = ? WHERE id = 'linkedin'`,
      args: [JSON.stringify(newExtra), new Date().toISOString()],
    })

    return NextResponse.json({ accounts })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
