import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

// ── GET — LinkedIn webhook URL validation challenge ───────────────────────────
// LinkedIn sends GET ?challengeCode=xxx and expects { "challengeCode": "xxx" }

export async function GET(req: NextRequest) {
  const challengeCode = req.nextUrl.searchParams.get('challengeCode')
  if (!challengeCode) {
    return NextResponse.json({ error: 'No challengeCode' }, { status: 400 })
  }
  return NextResponse.json({ challengeCode })
}

// ── POST — LinkedIn webhook event payload ─────────────────────────────────────
// Receives Lead Gen Form submission events and imports them as leads

interface LIFormField { name: string; values: string[] }
interface LIFormResponse {
  id: string
  submittedAt: number
  formFieldResponses: LIFormField[]
}
interface LIWebhookPayload {
  elements?: LIFormResponse[]
  // single event format
  id?: string
  submittedAt?: number
  formFieldResponses?: LIFormField[]
}

function extractField(fields: LIFormField[], names: string[]): string | undefined {
  for (const name of names) {
    const f = fields.find(f => f.name.toLowerCase().includes(name.toLowerCase()))
    if (f?.values?.[0]) return f.values[0]
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LIWebhookPayload

    // Normalize to array — LinkedIn may send a single object or { elements: [...] }
    const responses: LIFormResponse[] = body.elements
      ? body.elements
      : body.id
        ? [{ id: body.id, submittedAt: body.submittedAt ?? Date.now(), formFieldResponses: body.formFieldResponses ?? [] }]
        : []

    if (responses.length === 0) {
      return NextResponse.json({ ok: true, imported: 0, skipped: 0 })
    }

    const db  = await initDb()
    const now = new Date().toISOString()
    let imported = 0
    let skipped  = 0

    for (const el of responses) {
      const linkedinId = String(el.id)

      const existing = await db.execute({
        sql:  `SELECT id FROM leads WHERE linkedin_id = ? LIMIT 1`,
        args: [linkedinId],
      })
      if (existing.rows.length > 0) { skipped++; continue }

      const fields  = el.formFieldResponses ?? []
      const name    = extractField(fields, ['firstName', 'lastName', 'fullName', 'name'])
      const email   = extractField(fields, ['email', 'emailAddress'])
      const phone   = extractField(fields, ['phone', 'phoneNumber'])
      const company = extractField(fields, ['company', 'companyName', 'organization'])
      const date    = el.submittedAt ? new Date(el.submittedAt).toISOString().slice(0, 10) : null

      const id = `lead-li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await db.execute({
        sql: `INSERT INTO leads
          (id, name, company, email, phone, first_contact_date,
           linkedin_id, commercial_origin, funnel_stage, project_types, created_at)
          VALUES (?,?,?,?,?,?,?,'LinkedIn','novo_lead','[]',?)`,
        args: [id, name ?? null, company ?? null, email ?? null, phone ?? null, date, linkedinId, now],
      })
      imported++
    }

    return NextResponse.json({ ok: true, imported, skipped })
  } catch (err) {
    console.error('[linkedin-webhook]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
