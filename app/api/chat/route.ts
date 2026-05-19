import { NextRequest } from 'next/server'
import { createAnthropicClient } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch (parseErr) {
    console.error('[chat/route] JSON parse error:', parseErr)
    return new Response(JSON.stringify({ error: `Erro ao parsear corpo: ${String(parseErr)}` }), { status: 400 })
  }

  const { messages, systemPrompt, model } = body ?? {}

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'No messages' }), { status: 400 })
  }

  let client: Awaited<ReturnType<typeof createAnthropicClient>>
  try {
    client = await createAnthropicClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Chave Anthropic não configurada'
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
        type TextBlock  = { type: 'text';  text: string }
        type MsgImage   = { data: string; mediaType: string }

        const anthropicStream = client.messages.stream({
          model: model ?? 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: systemPrompt,
          messages: messages.map((m: { role: string; content: string; images?: MsgImage[] }) => {
            const imgs: MsgImage[] = m.images ?? []
            if (imgs.length > 0) {
              const imageBlocks: ImageBlock[] = imgs.map(img => ({
                type: 'image',
                source: { type: 'base64', media_type: img.mediaType, data: img.data },
              }))
              const blocks: (ImageBlock | TextBlock)[] = [...imageBlocks]
              if (m.content && m.content.trim()) {
                blocks.push({ type: 'text', text: m.content })
              }
              return { role: m.role as 'user' | 'assistant', content: blocks }
            }
            return { role: m.role as 'user' | 'assistant', content: m.content }
          }),
        })

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        console.error('[chat/route] stream error:', err)
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        controller.enqueue(encoder.encode(`_(Erro na API: ${msg})_`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
