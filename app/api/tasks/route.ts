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

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('project_id')
    const weekId    = req.nextUrl.searchParams.get('week_id')
    const general   = req.nextUrl.searchParams.get('general') // '1' → só sem projeto
    const db = await initDb()

    let sql = 'SELECT * FROM tasks WHERE 1=1'
    const params: string[] = []

    if (general === '1') { sql += ' AND project_id IS NULL' }
    else if (projectId)  { sql += ' AND project_id = ?'; params.push(projectId) }
    if (weekId)          { sql += ' AND week_id = ?';    params.push(weekId)    }
    sql += ' ORDER BY created_at'

    const res = await db.execute({ sql, args: params })
    return NextResponse.json(res.rows.map(r => rowToTask(r as unknown as Record<string, unknown>)))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Task
    if (!body.id || !body.title) {
      return NextResponse.json({ error: 'id and title are required' }, { status: 400 })
    }
    const db = await initDb()
    await db.execute({
      sql: `
        INSERT INTO tasks
          (id, project_id, week_id, title, description, urgency, done, assigned_to, flags, flag_comment, deadline, created_at)
        VALUES
          (:id, :project_id, :week_id, :title, :description, :urgency, :done, :assigned_to, :flags, :flag_comment, :deadline, :created_at)
      `,
      args: {
        week_id:      body.week_id      ?? null,
        description:  body.description  ?? null,
        assigned_to:  body.assigned_to  ?? null,
        id:           body.id,
        title:        body.title,
        created_at:   body.created_at   ?? new Date().toISOString(),
        project_id:   body.project_id   || null,
        urgency:      body.urgency      || null,
        done:         body.done ? 1 : 0,
        flags:        body.flags?.length ? JSON.stringify(body.flags) : null,
        flag_comment: body.flag_comment || null,
        deadline:     body.deadline     ?? null,
      },
    })
    const res = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [body.id] })
    const row = res.rows[0] as unknown as Record<string, unknown>
    return NextResponse.json(rowToTask(row), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
