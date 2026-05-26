import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Lead } from '@/lib/types'

function rowToLead(r: Record<string, unknown>): Lead {
  return {
    id:                  r.id as string,
    name:                (r.name as string | null) ?? undefined,
    company:             (r.company as string | null) ?? undefined,
    context:             (r.context as string | null) ?? undefined,
    email:               (r.email as string | null) ?? undefined,
    phone:               (r.phone as string | null) ?? undefined,
    first_contact_date:  (r.first_contact_date as string | null) ?? undefined,
    funnel_stage:        (r.funnel_stage as Lead['funnel_stage']) ?? 'novo_lead',
    propensity:          (r.propensity as Lead['propensity']) ?? null,
    project_types:       JSON.parse((r.project_types as string | null) ?? '[]'),
    project_name:        (r.project_name as string | null) ?? undefined,
    estimated_value:     (r.estimated_value as number | null) ?? null,
    segment:             (r.segment as string | null) ?? undefined,
    sub_segment:         (r.sub_segment as string | null) ?? undefined,
    commercial_origin:   (r.commercial_origin as string | null) ?? undefined,
    acquisition_channel: (r.acquisition_channel as string | null) ?? undefined,
    referred_by:         (r.referred_by as string | null) ?? undefined,
    notes:               (r.notes as string | null) ?? undefined,
    linkedin_id:         (r.linkedin_id as string | null) ?? undefined,
    owner_id:            (r.owner_id as string | null) || undefined,
    created_at:          r.created_at as string,
  }
}

export { rowToLead }

/** GET /api/leads — list all leads, newest first */
export async function GET() {
  try {
    const db  = await initDb()
    const res = await db.execute(`SELECT * FROM leads ORDER BY created_at DESC`)
    return NextResponse.json(res.rows.map(r => rowToLead(r as unknown as Record<string, unknown>)))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** POST /api/leads — create a new lead */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Lead>
    const db   = await initDb()
    const id   = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now  = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO leads
        (id, name, company, context, email, phone, first_contact_date,
         funnel_stage, propensity, project_types, project_name, estimated_value,
         segment, sub_segment, commercial_origin, acquisition_channel, referred_by,
         notes, linkedin_id, owner_id, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id,
        body.name               ?? null,
        body.company            ?? null,
        body.context            ?? null,
        body.email              ?? null,
        body.phone              ?? null,
        body.first_contact_date ?? null,
        body.funnel_stage       ?? 'novo_lead',
        body.propensity         ?? null,
        JSON.stringify(body.project_types ?? []),
        body.project_name       ?? null,
        body.estimated_value    ?? null,
        body.segment            ?? null,
        body.sub_segment        ?? null,
        body.commercial_origin  ?? null,
        body.acquisition_channel ?? null,
        body.referred_by        ?? null,
        body.notes              ?? null,
        body.linkedin_id        ?? null,
        body.owner_id           || null,
        now,
      ],
    })

    const created = await db.execute({ sql: `SELECT * FROM leads WHERE id = ?`, args: [id] })
    return NextResponse.json(rowToLead(created.rows[0] as unknown as Record<string, unknown>), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
