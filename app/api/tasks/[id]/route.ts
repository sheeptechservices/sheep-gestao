import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Task, TaskUrgency } from '@/lib/types'

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id:           row.id           as string,
    project_id:   row.project_id   as string,
    week_id:      row.week_id      as string | undefined,
    title:        row.title        as string,
    description:  row.description  as string | undefined,
    urgency:      row.urgency      as TaskUrgency | undefined,
    done:         (row.done as number) === 1,
    assigned_to:  row.assigned_to  as string | undefined,
    flags:        row.flags        ? JSON.parse(row.flags as string) : undefined,
    flag_comment: row.flag_comment as string | undefined,
    deadline:     row.deadline     as string | undefined,
    created_at:   row.created_at   as string,
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Partial<Task>
    const db = await initDb()

    const allowed: (keyof Task)[] = [
      'project_id', 'week_id', 'title', 'description', 'urgency', 'done', 'assigned_to', 'flags', 'flag_comment', 'deadline',
    ]
    const updates = allowed.filter(k => k in body)
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    const payload: Record<string, unknown> = { ...body, id: params.id }
    if ('done'         in body) payload.done         = body.done ? 1 : 0
    if ('flags'        in body) payload.flags        = body.flags?.length ? JSON.stringify(body.flags) : null
    if ('flag_comment' in body) payload.flag_comment = body.flag_comment || null
    if ('urgency'      in body) payload.urgency      = body.urgency      || null
    if ('description'  in body) payload.description  = body.description  || null
    if ('assigned_to'  in body) payload.assigned_to  = body.assigned_to  || null
    if ('week_id'      in body) payload.week_id      = body.week_id      || null
    if ('project_id'   in body) payload.project_id   = body.project_id   || null
    if ('deadline'     in body) payload.deadline     = body.deadline     || null

    const setClauses = updates.map(k => `${k} = :${k}`).join(', ')
    await db.execute({ sql: `UPDATE tasks SET ${setClauses} WHERE id = :id`, args: payload })

    const res = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [params.id] })
    const row = res.rows[0] as unknown as Record<string, unknown>
    return NextResponse.json(rowToTask(row))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
