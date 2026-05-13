import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { projectName, tasks } = await req.json()

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ summary: null })
  }

  const taskList = tasks
    .map((t: { title: string; status: string; priority: string }) =>
      `- ${t.title} [${t.status}] [${t.priority}]`
    )
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [
      {
        role: 'user',
        content: `Projeto: ${projectName}

Entregáveis da semana:
${taskList}

Escreva UMA frase curta (máx 15 palavras) em português que sintetize o foco desta semana de trabalho. Seja direto e objetivo, focando no que está sendo entregue, não nos títulos. Não use aspas.`,
      },
    ],
  })

  const summary =
    message.content[0].type === 'text' ? message.content[0].text.trim() : null

  return NextResponse.json({ summary })
}
