import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

interface ImportRow {
  name?: string
  company?: string
  email?: string
  phone?: string
  first_contact_date?: string
  linkedin_id?: string
  commercial_origin?: string
}

/** POST /api/leads/import — bulk import leads, skipping duplicates by linkedin_id */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { leads: ImportRow[] }
    if (!Array.isArray(body.leads)) {
      return NextResponse.json({ error: 'leads array obrigatório' }, { status: 400 })
    }

    const db  = await initDb()
    const now = new Date().toISOString()

    let imported = 0
    let skipped  = 0

    for (const row of body.leads) {
      // Skip duplicate by linkedin_id if provided
      if (row.linkedin_id) {
        const existing = await db.execute({
          sql:  `SELECT id FROM leads WHERE linkedin_id = ? LIMIT 1`,
          args: [row.linkedin_id],
        })
        if (existing.rows.length > 0) { skipped++; continue }
      }

      const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await db.execute({
        sql: `INSERT INTO leads
          (id, name, company, email, phone, first_contact_date,
           linkedin_id, commercial_origin, funnel_stage, project_types, created_at)
          VALUES (?,?,?,?,?,?,?,?,'novo_lead','[]',?)`,
        args: [
          id,
          row.name               ?? null,
          row.company            ?? null,
          row.email              ?? null,
          row.phone              ?? null,
          row.first_contact_date ?? null,
          row.linkedin_id        ?? null,
          row.commercial_origin  ?? null,
          now,
        ],
      })
      imported++
    }

    return NextResponse.json({ imported, skipped })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
