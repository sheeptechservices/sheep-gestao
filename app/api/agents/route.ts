import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { DEFAULT_AGENTS, type AgentDefinition } from '@/lib/agents'

// ── GET /api/agents ────────────────────────────────────────────────────────────
// Retorna DEFAULT_AGENTS mesclado com as customizações salvas no banco.
// Agentes novos (adicionados no código mas ainda sem linha no banco) chegam
// com os valores padrão — nenhuma ação manual necessária.
export async function GET() {
  try {
    const db  = await initDb()
    const res = await db.execute(`SELECT * FROM agents`)

    // Indexar overrides por type para lookup O(1)
    const overrides: Record<string, Record<string, unknown>> = {}
    for (const row of res.rows) {
      const r = row as unknown as Record<string, unknown>
      overrides[r.type as string] = r
    }

    const agents: AgentDefinition[] = DEFAULT_AGENTS.map(def => {
      const ov = overrides[def.type]
      if (!ov) return def   // novo agente — usa defaults do código
      return {
        ...def,
        enabled:        ov.enabled === 1 || ov.enabled === true,
        name:           (ov.name           as string) ?? def.name,
        role:           (ov.role           as string) ?? def.role,
        temperature:    (ov.temperature    as number) ?? def.temperature,
        systemPrompt:   (ov.system_prompt  as string) ?? def.systemPrompt,
        knowledgeFiles: JSON.parse((ov.knowledge_files as string) ?? '[]'),
      }
    })

    return NextResponse.json(agents)
  } catch (err) {
    console.error('GET /api/agents error:', err)
    return NextResponse.json({ error: 'Erro ao carregar especialistas' }, { status: 500 })
  }
}

// ── PUT /api/agents ────────────────────────────────────────────────────────────
// Upsert de um agente. Recebe um AgentDefinition parcial com pelo menos { type }.
export async function PUT(req: Request) {
  try {
    const body = await req.json() as Partial<AgentDefinition> & { type: string }
    const { type } = body

    // Buscar defaults do código para esse type
    const def = DEFAULT_AGENTS.find(a => a.type === type)
    if (!def) return NextResponse.json({ error: 'Tipo de agente inválido' }, { status: 400 })

    const db  = await initDb()
    const now = new Date().toISOString()

    await db.execute({
      sql: `
        INSERT INTO agents (type, enabled, name, role, temperature, system_prompt, knowledge_files, updated_at)
        VALUES (:type, :enabled, :name, :role, :temperature, :system_prompt, :knowledge_files, :updated_at)
        ON CONFLICT(type) DO UPDATE SET
          enabled         = excluded.enabled,
          name            = excluded.name,
          role            = excluded.role,
          temperature     = excluded.temperature,
          system_prompt   = excluded.system_prompt,
          knowledge_files = excluded.knowledge_files,
          updated_at      = excluded.updated_at
      `,
      args: {
        type,
        enabled:         (body.enabled ?? def.enabled) ? 1 : 0,
        name:            body.name            ?? def.name,
        role:            body.role            ?? def.role,
        temperature:     body.temperature     ?? def.temperature,
        system_prompt:   body.systemPrompt    ?? def.systemPrompt,
        knowledge_files: JSON.stringify(body.knowledgeFiles ?? def.knowledgeFiles),
        updated_at:      now,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/agents error:', err)
    return NextResponse.json({ error: 'Erro ao salvar especialista' }, { status: 500 })
  }
}
