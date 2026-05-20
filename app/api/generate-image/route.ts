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
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Erro na API OpenAI.' }, { status: r.status })
    }

    return NextResponse.json({
      url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
