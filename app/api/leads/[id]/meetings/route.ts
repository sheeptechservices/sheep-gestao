import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { randomUUID } from 'crypto'

/** POST /api/leads/[id]/meetings — cria reunião manual linkada ao lead */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as {
      title: string
      date?: string
      notes?: string
      transcript?: string
    }
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'title obrigatório' }, { status: 400 })
    }

    const db  = await initDb()
    const id  = randomUUID()
    // ID sintético para compatibilidade com o campo fireflies_id (NOT NULL)
    const fireflyId = `manual-${id.slice(0, 8)}`
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO meetings
              (id, fireflies_id, title, date, summary, transcript, lead_id, auto_matched, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [
        id,
        fireflyId,
        body.title.trim(),
        body.date ?? null,
        body.notes ?? null,
        body.transcript ?? null,
        params.id,
        now,
      ],
    })

    return NextResponse.json({
      id,
      fireflies_id: fireflyId,
      title: body.title.trim(),
      date: body.date ?? null,
      summary: body.notes ?? null,
      transcript: body.transcript ?? null,
      lead_id: params.id,
      auto_matched: false,
      created_at: now,
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
