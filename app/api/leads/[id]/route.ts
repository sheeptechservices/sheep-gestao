import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { rowToLead } from '@/app/api/leads/route'
import type { Lead } from '@/lib/types'

/** PUT /api/leads/[id] — update any field(s) */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Partial<Lead>
    const db   = await initDb()
    const { id } = params

    const fields: string[] = []
    const args:   unknown[] = []

    const add = (col: string, val: unknown) => { fields.push(`${col} = ?`); args.push(val) }

    if (body.name               !== undefined) add('name',                body.name)
    if (body.company            !== undefined) add('company',             body.company)
    if (body.context            !== undefined) add('context',             body.context)
    if (body.email              !== undefined) add('email',               body.email)
    if (body.phone              !== undefined) add('phone',               body.phone)
    if (body.first_contact_date !== undefined) add('first_contact_date',  body.first_contact_date)
    if (body.funnel_stage       !== undefined) add('funnel_stage',        body.funnel_stage)
    if (body.propensity         !== undefined) add('propensity',          body.propensity)
    if (body.project_types      !== undefined) add('project_types',       JSON.stringify(body.project_types))
    if (body.project_name       !== undefined) add('project_name',        body.project_name)
    if (body.estimated_value    !== undefined) add('estimated_value',     body.estimated_value)
    if (body.segment            !== undefined) add('segment',             body.segment)
    if (body.sub_segment        !== undefined) add('sub_segment',         body.sub_segment)
    if (body.commercial_origin  !== undefined) add('commercial_origin',   body.commercial_origin)
    if (body.acquisition_channel !== undefined) add('acquisition_channel', body.acquisition_channel)
    if (body.referred_by        !== undefined) add('referred_by',         body.referred_by)
    if (body.notes              !== undefined) add('notes',               body.notes)
    if (body.linkedin_id        !== undefined) add('linkedin_id',         body.linkedin_id)
    if (body.owner_id           !== undefined) add('owner_id',            body.owner_id || null)

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

    args.push(id)
    await db.execute({ sql: `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, args: args as (string | number | null)[] })

    const updated = await db.execute({ sql: `SELECT * FROM leads WHERE id = ?`, args: [id] })
    if (!updated.rows[0]) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

    return NextResponse.json(rowToLead(updated.rows[0] as unknown as Record<string, unknown>))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** DELETE /api/leads/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    await db.execute({ sql: `DELETE FROM leads WHERE id = ?`, args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
