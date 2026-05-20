import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt inválido.' }, { status: 400 })
    }

    const db  = await initDb()
    const res = await db.execute({
      sql: 'SELECT api_key FROM integrations WHERE id = ?',
      args: ['openai'],
    })
    const key = (res.rows[0] as { api_key: string } | undefined)?.api_key
    if (!key) {
      return NextResponse.json({ error: 'Chave OpenAI não configurada nas integrações.' }, { status: 500 })
    }

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Erro na API OpenAI.' }, { status: r.status })
    }

    const item = data.data[0]
    // gpt-image-1 returns b64_json; older models return url
    const url = item.url ?? `data:image/png;base64,${item.b64_json}`

    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
