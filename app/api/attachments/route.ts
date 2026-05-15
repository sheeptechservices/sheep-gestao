import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { initDb } from '@/lib/db'
import type { TaskAttachment } from '@/lib/types'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB por arquivo

// ── GET /api/attachments?task_id=xxx ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get('task_id')
  if (!taskId) return NextResponse.json({ error: 'task_id obrigatório' }, { status: 400 })

  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  'SELECT * FROM task_attachments WHERE task_id = ? ORDER BY created_at ASC',
      args: [taskId],
    })
    return NextResponse.json(res.rows as unknown as TaskAttachment[])
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

    if (!file)   return NextResponse.json({ error: 'Arquivo não enviado'     }, { status: 400 })
    if (!taskId) return NextResponse.json({ error: 'task_id não informado'   }, { status: 400 })
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Arquivo muito grande. Limite: ${MAX_SIZE / 1024 / 1024} MB` }, { status: 413 })
    }

    // Upload para Vercel Blob (requer BLOB_READ_WRITE_TOKEN no env)
    const blob = await put(`task-attachments/${taskId}/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    const id  = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()

    const db = await initDb()
    await db.execute({
      sql:  `INSERT INTO task_attachments (id, task_id, filename, url, size, mime_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, taskId, file.name, blob.url, file.size, file.type || 'application/octet-stream', now],
    })

    const attachment: TaskAttachment = {
      id, task_id: taskId, filename: file.name,
      url: blob.url, size: file.size,
      mime_type: file.type || 'application/octet-stream',
      created_at: now,
    }
    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    const msg = String(err)
    // Mensagem amigável quando BLOB_READ_WRITE_TOKEN não está configurado
    if (msg.includes('BLOB_READ_WRITE_TOKEN') || msg.includes('token')) {
      return NextResponse.json({
        error: 'Armazenamento de arquivos não configurado. Adicione a variável BLOB_READ_WRITE_TOKEN no Vercel.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
