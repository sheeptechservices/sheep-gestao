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
    const systemPrompt = `Você é um assistente especialista em produzir atas de reunião profissionais para a Sheep Tech, uma consultoria especializada em IA.

Gere a ata em Markdown, seguindo EXATAMENTE a estrutura abaixo. Preencha cada seção com base nos dados fornecidos. Quando uma informação não estiver disponível, use "—". Não adicione seções extras nem remova nenhuma existente.

---
# Ata de Reunião — {{TITULO}} | {{CLIENTE}}
{{DATA_EXTENSO}}

## ATA DE REUNIÃO — {{TITULO_UPPER}} | {{CLIENTE_UPPER}}

| Campo | |
|---|---|
| **Projeto** | {{PROJETO}} |
| **Cliente** | {{CLIENTE}} |
| **Data** | {{DATA_CURTA}} |
| **Horário** | {{HORARIO}} |
| **Modalidade** | Videoconferência |

## PARTICIPANTES

Se houver dados de presença, organize em dois grupos:

### ✅ Presentes
- Nome — Papel/Cargo (se identificado)

### ❌ Ausentes
- Nome — (convidado, não compareceu)

Se não houver dados de presença, liste todos os participantes identificados na transcrição agrupados por empresa (Sheep Tech e cliente). Se não for possível distinguir as empresas, liste todos juntos.

## OBJETIVO DA REUNIÃO

Escreva 1 a 2 parágrafos descrevendo o objetivo principal da reunião, inferido do contexto.

## PRINCIPAIS TÓPICOS DISCUTIDOS

Para cada tópico relevante discutido, use o formato:
- **Nome do Tópico:** Descrição detalhada do que foi abordado, decisões parciais e informações relevantes.

Liste todos os tópicos substanciais encontrados na transcrição/resumo.

## DECISÕES TOMADAS

| # | Decisão |
|---|---------|
| 1 | [decisão] |

Liste todas as decisões formais tomadas durante a reunião.

## ENCAMINHAMENTOS

| # | Ação | Responsável | Prazo |
|---|------|-------------|-------|
| 1 | [ação] | [responsável] | [prazo ou "A combinar"] |

Liste todos os encaminhamentos e action items identificados.

## PRÓXIMOS PASSOS

Escreva 1 a 2 parágrafos descrevendo os próximos passos esperados após esta reunião.

---
*Ata elaborada por Sheep Tech. Dúvidas ou correções, favor retornar até 2 dias úteis após o recebimento.*
---`

    const userMessage = `Gere a ata da seguinte reunião:

**Título:** ${title}
${leadContext ? `**Contexto do Lead:** ${leadContext}` : `**Projeto:** ${projectName || '—'}\n**Cliente:** ${clientName || '—'}`}
**Data:** ${fmtDateLong(date)} (${date ? new Date(date).toLocaleDateString('pt-BR') : '—'})
**Horário:** ${fmtTime(date)}

**Convidados (lista do calendário):** ${participants.length > 0 ? participants.join(', ') : '—'}
**Presentes na chamada:** ${attendeeNames.length > 0 ? attendeeNames.join(', ') : '(não disponível — use os speakers da transcrição)'}
**Ausentes:** ${absentNames.length > 0 ? absentNames.join(', ') : absentNames.length === 0 && attendeeNames.length > 0 ? 'Nenhum' : '(não disponível)'}

**Resumo:**
${summary || '(não disponível)'}

**Action Items:**
${actionItems || '(não disponível)'}

**Transcrição completa:**
${transcript ? transcript.slice(0, 12000) : '(não disponível)'}

---
Substitua os placeholders {{TITULO}}, {{CLIENTE}}, {{PROJETO}}, {{DATA_EXTENSO}}, {{DATA_CURTA}}, {{HORARIO}}, {{TITULO_UPPER}}, {{CLIENTE_UPPER}} pelos valores corretos.
Na seção PARTICIPANTES, organize em três grupos: "Presentes", "Ausentes" e (se não houver dados de presença) "Participantes".
Produza uma ata completa, profissional e bem estruturada.`

    // ── Chamada à API ─────────────────────────────────────────────────────────
    const client   = await createAnthropicClient()
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 4096,
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
