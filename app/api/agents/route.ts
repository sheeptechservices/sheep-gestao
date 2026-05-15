import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { DEFAULT_AGENTS, type AgentDefinition } from '@/lib/agents'

// ── GET /api/agents ────────────────────────────────────────────────────────────
// Lê os agentes diretamente do banco (source of truth).
// O seed em initDb garante que todos os DEFAULT_AGENTS estão presentes.
// Campos visuais (emoji, color, shadow, model) vêm do código — não são editáveis.
export async function GET() {
  try {
    const db  = await initDb()
    const res = await db.execute(`SELECT * FROM agents ORDER BY rowid`)

    // Index dos campos visuais/modelo por type (não armazenados no banco)
    const codeMap = Object.fromEntries(DEFAULT_AGENTS.map(a => [a.type, a]))

    const agents: AgentDefinition[] = res.rows
      .map(row => {
        const r   = row as unknown as Record<string, unknown>
        const def = codeMap[r.type as string]
        if (!def) return null  // type obsoleto — ignora
        return {
          ...def,              // emoji, color, shadow, model do código
          enabled:        r.enabled === 1 || r.enabled === true,
          name:           r.name          as string,
          role:           r.role          as string,
          temperature:    r.temperature   as number,
          systemPrompt:   r.system_prompt as string,
          knowledgeFiles: JSON.parse((r.knowledge_files as string) ?? '[]'),
        }
      })
      .filter((a): a is AgentDefinition => a !== null)

    return NextResponse.json(agents)
  } catch (err) {
    console.error('GET /api/agents error:', err)
    return NextResponse.json({ error: 'Erro ao carregar especialistas' }, { status: 500 })
  }
}

// ── PUT /api/agents ────────────────────────────────────────────────────────────
// Atualiza um agente existente no banco. O registro sempre existe (seed no boot).
export async function PUT(req: Request) {
  try {
    const body = await req.json() as Partial<AgentDefinition> & { type: string }
    const { type } = body

    if (!DEFAULT_AGENTS.find(a => a.type === type)) {
      return NextResponse.json({ error: 'Tipo de agente inválido' }, { status: 400 })
    }

    const db  = await initDb()
    const now = new Date().toISOString()

    await db.execute({
      sql: `
        UPDATE agents SET
          enabled         = :enabled,
          name            = :name,
          role            = :role,
          temperature     = :temperature,
          system_prompt   = :system_prompt,
          knowledge_files = :knowledge_files,
          updated_at      = :updated_at
        WHERE type = :type
      `,
      args: {
        type,
        enabled:         body.enabled ? 1 : 0,
        name:            body.name            ?? '',
        role:            body.role            ?? '',
        temperature:     body.temperature     ?? 0.7,
        system_prompt:   body.systemPrompt    ?? '',
        knowledge_files: JSON.stringify(body.knowledgeFiles ?? []),
        updated_at:      now,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/agents error:', err)
    return NextResponse.json({ error: 'Erro ao salvar especialista' }, { status: 500 })
  }
}
