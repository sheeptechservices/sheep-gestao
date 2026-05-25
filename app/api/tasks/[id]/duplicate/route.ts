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
    member_id:    row.member_id    as string | undefined,
    member_ids:   row.member_ids   ? JSON.parse(row.member_ids as string) : undefined,
    flags:        row.flags        ? JSON.parse(row.flags as string) : undefined,
    flag_comment: row.flag_comment as string | undefined,
    deadline:     row.deadline     as string | undefined,
    created_at:   row.created_at   as string,
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()

    // Fetch the original task
    const res = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [params.id] })
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    const original = res.rows[0] as unknown as Record<string, unknown>

    const newId  = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now    = new Date().toISOString()
    const title  = `Cópia de ${original.title as string}`

    const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

    await db.execute({
      sql: `
        INSERT INTO tasks
          (id, project_id, week_id, title, description, urgency, done,
           assigned_to, member_id, member_ids, flags, flag_comment, deadline, is_draft, created_at)
        VALUES
          (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 0, ?)
      `,
      args: [
        newId,
        str(original.project_id),
        str(original.week_id),
        title,
        str(original.description),
        str(original.urgency),
        str(original.assigned_to),
        str(original.member_id),
        str(original.member_ids),
        str(original.flags),
        str(original.flag_comment),
        str(original.deadline),
        now,
      ],
    })

    const created = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [newId] })
    return NextResponse.json(rowToTask(created.rows[0] as unknown as Record<string, unknown>), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
