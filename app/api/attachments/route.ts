import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { TaskAttachment } from '@/lib/types'

const MAX_SIZE = 3 * 1024 * 1024 // 3 MB — base64 infla ~33%, fica dentro do limite da API

// ── GET /api/attachments?task_id=xxx  (só metadados, sem o campo data) ───────

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get('task_id')
  if (!taskId) return NextResponse.json({ error: 'task_id obrigatório' }, { status: 400 })

  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  'SELECT id, task_id, filename, url, size, mime_type, created_at FROM task_attachments WHERE task_id = ? ORDER BY created_at ASC',
      args: [taskId],
    })
    const response = NextResponse.json(res.rows as unknown as TaskAttachment[])
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return response
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST /api/attachments  (multipart/form-data: file + task_id) ─────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const taskId   = formData.get('task_id') as string | null

    if (!file)   return NextResponse.json({ error: 'Arquivo não enviado'   }, { status: 400 })
    if (!taskId) return NextResponse.json({ error: 'task_id não informado' }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Limite: ${MAX_SIZE / 1024 / 1024} MB` },
        { status: 413 },
      )
    }

    // Converte para base64 para persistir no Turso
    const bytes  = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const id  = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()
    // A URL aponta para o endpoint de download server-side
    const url = `/api/attachments/${id}/file`

    const db = await initDb()
    await db.execute({
      sql:  `INSERT INTO task_attachments (id, task_id, filename, url, size, mime_type, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, taskId, file.name, url, file.size, file.type || 'application/octet-stream', base64, now],
    })

    const attachment: TaskAttachment = {
      id, task_id: taskId, filename: file.name,
      url, size: file.size,
      mime_type: file.type || 'application/octet-stream',
      created_at: now,
    }
    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
