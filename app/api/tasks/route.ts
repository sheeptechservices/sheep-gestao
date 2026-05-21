import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Task, TaskUrgency } from '@/lib/types'

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id:               row.id           as string,
    project_id:       row.project_id   as string,
    week_id:          row.week_id      as string | undefined,
    title:            row.title        as string,
    description:      row.description  as string | undefined,
    urgency:          row.urgency      as TaskUrgency | undefined,
    done:             (row.done as number) === 1,
    assigned_to:      row.assigned_to  as string | undefined,
    flags:            row.flags        ? JSON.parse(row.flags as string) : undefined,
    flag_comment:     row.flag_comment as string | undefined,
    deadline:         row.deadline     as string | undefined,
    created_at:       row.created_at   as string,
    attachment_count: (row.attachment_count as number | undefined) ?? 0,
    member_id:        row.member_id    as string | undefined,
    member_ids:       row.member_ids   ? JSON.parse(row.member_ids as string) : undefined,
  }
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('project_id')
    const weekId    = req.nextUrl.searchParams.get('week_id')
    const general   = req.nextUrl.searchParams.get('general') // '1' → só sem projeto
    const db = await initDb()

    let sql = `
      SELECT t.*,
        (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) AS attachment_count
      FROM tasks t
      WHERE 1=1`
    const params: string[] = []

    // Nunca retorna rascunhos ao front — são artefatos internos de criação
    sql += ' AND (t.is_draft = 0 OR t.is_draft IS NULL)'

    if (general === '1') { sql += ' AND t.project_id IS NULL' }
    else if (projectId)  { sql += ' AND t.project_id = ?'; params.push(projectId) }
    if (weekId)          { sql += ' AND t.week_id = ?';    params.push(weekId)    }
    sql += ' ORDER BY t.created_at'

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
          (id, project_id, week_id, title, description, urgency, done, assigned_to, member_id, member_ids, flags, flag_comment, deadline, is_draft, created_at)
        VALUES
          (:id, :project_id, :week_id, :title, :description, :urgency, :done, :assigned_to, :member_id, :member_ids, :flags, :flag_comment, :deadline, :is_draft, :created_at)
      `,
      args: {
        week_id:      body.week_id      ?? null,
        description:  body.description  ?? null,
        assigned_to:  body.assigned_to  ?? null,
        member_id:    body.member_ids?.[0] ?? body.member_id ?? null,
        member_ids:   body.member_ids?.length ? JSON.stringify(body.member_ids) : null,
        id:           body.id,
        title:        body.title,
        created_at:   body.created_at   ?? new Date().toISOString(),
        project_id:   body.project_id   || null,
        urgency:      body.urgency      || null,
        done:         body.done ? 1 : 0,
        flags:        body.flags?.length ? JSON.stringify(body.flags) : null,
        flag_comment: body.flag_comment || null,
        deadline:     body.deadline     ?? null,
        is_draft:     body.is_draft ? 1 : 0,
      },
    })
    const res = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [body.id] })
    const row = res.rows[0] as unknown as Record<string, unknown>
    return NextResponse.json(rowToTask(row), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
