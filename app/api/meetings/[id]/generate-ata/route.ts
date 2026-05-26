import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { createAnthropicClient } from '@/lib/anthropic'

function fmtDateLong(iso?: string | null): string {
  if (!iso) return 'Data não disponível'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── POST /api/meetings/[id]/generate-ata ──────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = await initDb()

    // Busca a reunião
    const mtgRes = await db.execute({
      sql: `SELECT * FROM meetings WHERE id = ? LIMIT 1`,
      args: [params.id],
    })
    const row = mtgRes.rows[0] as Record<string, unknown> | undefined
    if (!row) return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })

    // Busca o projeto ou lead vinculado
    const projectId = row.project_id as string | null
    const leadId    = row.lead_id    as string | null
    let projectName = ''
    let clientName  = ''
    let leadContext = ''   // bloco de contexto para reuniões de lead
    if (projectId) {
      const projRes = await db.execute({
        sql: `SELECT p.name AS pname, c.name AS cname
              FROM projects p LEFT JOIN clients c ON c.id = p.client_id
              WHERE p.id = ? LIMIT 1`,
        args: [projectId],
      })
      const pr = projRes.rows[0] as Record<string, unknown> | undefined
      projectName = (pr?.pname as string) ?? ''
      clientName  = (pr?.cname as string) ?? ''
    } else if (leadId) {
      const leadRes = await db.execute({
        sql: `SELECT name, company, funnel_stage, propensity, segment FROM leads WHERE id = ? LIMIT 1`,
        args: [leadId],
      })
      const lr = leadRes.rows[0] as Record<string, unknown> | undefined
      if (lr) {
        const leadName    = (lr.name    as string) ?? ''
        const leadCompany = (lr.company as string) ?? ''
        projectName = leadName || leadCompany
        clientName  = leadCompany || leadName
        leadContext = [
          `Lead: ${leadName || '—'}`,
          `Empresa: ${leadCompany || '—'}`,
          `Etapa: ${(lr.funnel_stage as string) ?? '—'}`,
          lr.propensity ? `Propensão: ${lr.propensity}` : '',
          lr.segment    ? `Segmento: ${lr.segment}`    : '',
        ].filter(Boolean).join(' | ')
      }
    }

    const title       = row.title        as string
    const date        = row.date         as string | null
    const summary     = row.summary      as string | null
    const actionItems = row.action_items as string | null
    const transcript  = row.transcript   as string | null

    // Convidados (calendário) — lista de nomes/emails
    const participants: string[] = row.participants
      ? JSON.parse(row.participants as string)
      : []

    // Quem realmente entrou na chamada
    type Attendee = { displayName?: string; name?: string; email?: string }
    const meetingAttendees: Attendee[] = row.meeting_attendees
      ? JSON.parse(row.meeting_attendees as string)
      : []

    // Nomes legíveis dos presentes
    const attendeeNames = meetingAttendees
      .map(a => a.displayName || a.name || a.email || '')
      .filter(Boolean)

    // Quem foi convidado mas não aparece nos attendees → ausentes
    const absentNames = participants.filter(p => {
      const pLower = p.toLowerCase()
      return !meetingAttendees.some(a =>
        (a.displayName ?? '').toLowerCase().includes(pLower) ||
        (a.name        ?? '').toLowerCase().includes(pLower) ||
        (a.email       ?? '').toLowerCase().includes(pLower) ||
        pLower.includes((a.displayName ?? '').toLowerCase().split(' ')[0]) ||
        pLower.includes((a.name        ?? '').toLowerCase().split(' ')[0])
      )
    })

    // ── Prompt ───────────────────────────────────────────────────────────────
    const systemPrompt = `Você é um assistente especialista em síntese de reuniões para a Sheep Tech, consultoria de IA.

## Princípio fundamental
Produza uma ata **enxuta e densa**. Cada linha deve carregar informação real — corte cumprimentos, repetições, efeitos de estilo e qualquer frase que não acrescente conteúdo novo. Se algo foi dito três vezes na reunião, escreva uma vez. Se um ponto foi levantado mas não gerou decisão nem encaminhamento, omita-o.

## Regras de formatação
- Use Markdown conforme a estrutura abaixo — **nem mais, nem menos seções**
- Tópicos discutidos: **máximo 2 linhas** por item; prefira 1
- Objetivo: **máximo 3 frases**
- Próximos passos: lista de bullet, sem parágrafos
- Ausentes/presentes: só liste se houver dados reais
- Se uma informação não existir, use "—" e siga em frente — não explique a ausência

## Estrutura obrigatória

---
# Ata — {{TITULO}} | {{CLIENTE}}
{{DATA_EXTENSO}}

| Campo | |
|---|---|
| **Projeto** | {{PROJETO}} |
| **Cliente** | {{CLIENTE}} |
| **Data** | {{DATA_CURTA}} |
| **Horário** | {{HORARIO}} |
| **Modalidade** | Videoconferência |

## Participantes

### ✅ Presentes
- Nome — Empresa / Cargo (se identificado)

### ❌ Ausentes
- Nome — (convidado, ausente)

## Objetivo

_Síntese em até 3 frases do que a reunião se propunha a resolver ou avançar._

## Tópicos discutidos

- **Tópico:** síntese objetiva — 1 a 2 linhas, sem repetir o que já está nas decisões/encaminhamentos.

## Decisões

| # | Decisão |
|---|---------|
| 1 | |

## Encaminhamentos

| # | Ação | Responsável | Prazo |
|---|------|-------------|-------|
| 1 | | | |

## Próximos passos

- bullet curto por item

---
*Ata Sheep Tech — dúvidas ou correções em até 2 dias úteis.*`

    const userMessage = `Gere a ata da reunião abaixo. Seja sintético: capture o essencial, descarte o acessório.

**Título:** ${title}
${leadContext ? `**Contexto do Lead:** ${leadContext}` : `**Projeto:** ${projectName || '—'}\n**Cliente:** ${clientName || '—'}`}
**Data:** ${fmtDateLong(date)} (${date ? new Date(date).toLocaleDateString('pt-BR') : '—'})
**Horário:** ${fmtTime(date)}

**Convidados:** ${participants.length > 0 ? participants.join(', ') : '—'}
**Presentes:** ${attendeeNames.length > 0 ? attendeeNames.join(', ') : '(use os speakers da transcrição)'}
**Ausentes:** ${absentNames.length > 0 ? absentNames.join(', ') : attendeeNames.length > 0 ? 'Nenhum' : '—'}

**Resumo automático:**
${summary || '(não disponível)'}

**Action items:**
${actionItems || '(não disponível)'}

**Transcrição:**
${transcript ? transcript.slice(0, 12000) : '(não disponível)'}

---
Preencha os placeholders {{TITULO}}, {{CLIENTE}}, {{PROJETO}}, {{DATA_EXTENSO}}, {{DATA_CURTA}}, {{HORARIO}} com os valores reais.
Lembre: ata enxuta — cada linha deve justificar sua presença.`

    // ── Chamada à API ─────────────────────────────────────────────────────────
    const client   = await createAnthropicClient()
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const ataText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ ok: true, ata: ataText })
  } catch (err) {
    console.error('[generate-ata]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
