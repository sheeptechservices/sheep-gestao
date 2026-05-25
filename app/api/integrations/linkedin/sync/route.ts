import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

interface LinkedInFormField {
  name: string
  values: string[]
}

interface LinkedInFormResponse {
  id: string
  submittedAt: number
  formFieldResponses: LinkedInFormField[]
}

interface LinkedInApiResponse {
  elements?: LinkedInFormResponse[]
  message?: string
  status?: number
}

function extractField(fields: LinkedInFormField[], names: string[]): string | undefined {
  for (const name of names) {
    const f = fields.find(f => f.name.toLowerCase().includes(name.toLowerCase()))
    if (f?.values?.[0]) return f.values[0]
  }
  return undefined
}

/** POST /api/integrations/linkedin/sync — fetch LinkedIn Lead Gen Form responses */
export async function POST() {
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
    const accountId   = extra.linkedin_account_id as string | undefined

    if (!accessToken) {
      return NextResponse.json({ error: 'LinkedIn não autenticado. Conecte via OAuth.' }, { status: 401 })
    }

    if (!accountId) {
      return NextResponse.json({ error: 'linkedin_account_id não configurado nas Integrações.' }, { status: 400 })
    }

    const apiUrl = `https://api.linkedin.com/v2/adLeadGenerationFormResponses?q=account&account=urn:li:sponsoredAccount:${accountId}&count=100`

    const apiRes = await fetch(apiUrl, {
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'LinkedIn-Version': '202401',
      },
    })

    const apiData = await apiRes.json() as LinkedInApiResponse

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: apiData.message ?? `LinkedIn API error ${apiRes.status}` },
        { status: apiRes.status }
      )
    }

    const elements = apiData.elements ?? []
    const now      = new Date().toISOString()

    let imported = 0
    let skipped  = 0

    for (const el of elements) {
      const linkedinId = String(el.id)

      // Skip if already imported
      const existing = await db.execute({
        sql:  `SELECT id FROM leads WHERE linkedin_id = ? LIMIT 1`,
        args: [linkedinId],
      })
      if (existing.rows.length > 0) { skipped++; continue }

      const fields = el.formFieldResponses ?? []
      const name   = extractField(fields, ['firstName', 'lastName', 'fullName', 'name'])
      const email  = extractField(fields, ['email', 'emailAddress'])
      const phone  = extractField(fields, ['phone', 'phoneNumber'])
      const company = extractField(fields, ['company', 'companyName', 'organization'])
      const date   = el.submittedAt ? new Date(el.submittedAt).toISOString().slice(0, 10) : null

      const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await db.execute({
        sql: `INSERT INTO leads
          (id, name, company, email, phone, first_contact_date,
           linkedin_id, commercial_origin, funnel_stage, project_types, created_at)
          VALUES (?,?,?,?,?,?,?,'LinkedIn','contato_inicial','[]',?)`,
        args: [id, name ?? null, company ?? null, email ?? null, phone ?? null, date, linkedinId, now],
      })
      imported++
    }

    return NextResponse.json({ imported, skipped })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
