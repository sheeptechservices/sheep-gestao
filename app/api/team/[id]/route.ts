import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { TeamMember } from '@/lib/types'

function rowToMember(row: Record<string, unknown>): TeamMember {
  return {
    id:         row.id         as string,
    name:       row.name       as string,
    cargo:      (row.cargo     as string) ?? '',
    email:      row.email      as string | undefined,
    photo_url:  row.photo_data ? `/api/team/${row.id}/photo` : undefined,
    joined_at:  row.joined_at  as string | undefined,
    status:     (row.status    as TeamMember['status']) ?? 'active',
    color_hex:  (row.color_hex as string) ?? '#84CC16',
    created_at: row.created_at as string,

    sexo:             row.sexo             as TeamMember['sexo']      | undefined,
    data_nascimento:  row.data_nascimento  as string | undefined,
    whatsapp:         row.whatsapp         as string | undefined,
    linkedin:         row.linkedin         as string | undefined,
    github:           row.github           as string | undefined,
    indicacao_nome:   row.indicacao_nome   as string | undefined,
    indicacao_email:  row.indicacao_email  as string | undefined,

    estado: row.estado as string | undefined,
    cidade: row.cidade as string | undefined,

    resumo_profissional: row.resumo_profissional as string | undefined,
    papel_principal:     row.papel_principal     as string | undefined,
    senioridade:         row.senioridade         as TeamMember['senioridade']      | undefined,
    tempo_experiencia:   row.tempo_experiencia   as TeamMember['tempo_experiencia'] | undefined,
    nivel_ingles:        row.nivel_ingles        as TeamMember['nivel_ingles']      | undefined,
    outro_idioma:        row.outro_idioma        as string | undefined,

    possui_cnpj:   row.possui_cnpj  != null ? Boolean(row.possui_cnpj)  : undefined,
    regime_fiscal: row.regime_fiscal as TeamMember['regime_fiscal'] | undefined,

    curriculo_url: row.curriculo_data ? `/api/team/${row.id}/cv` : undefined,

    lgpd_consent:       row.lgpd_consent       != null ? Boolean(row.lgpd_consent)       : undefined,
    newsletter_consent: row.newsletter_consent  != null ? Boolean(row.newsletter_consent)  : undefined,
  }
}

const ALLOWED = [
  'name', 'cargo', 'email', 'joined_at', 'status', 'color_hex',
  'sexo', 'data_nascimento', 'whatsapp', 'linkedin', 'github',
  'indicacao_nome', 'indicacao_email', 'estado', 'cidade',
  'resumo_profissional', 'papel_principal', 'senioridade', 'tempo_experiencia',
  'nivel_ingles', 'outro_idioma', 'possui_cnpj', 'regime_fiscal',
  'lgpd_consent', 'newsletter_consent',
] as const

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Partial<TeamMember> & Record<string, unknown>
    const db   = await initDb()

    const updates = ALLOWED.filter(k => k in body)
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    const payload: Record<string, unknown> = { id: params.id }
    for (const k of updates) {
      if (k === 'possui_cnpj' || k === 'lgpd_consent' || k === 'newsletter_consent') {
        payload[k] = body[k] ? 1 : 0
      } else {
        payload[k] = body[k] ?? null
      }
    }

    const setClauses = updates.map(k => `${k} = :${k}`).join(', ')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.execute({ sql: `UPDATE team_members SET ${setClauses} WHERE id = :id`, args: payload as any })

    const res = await db.execute({
      sql: `SELECT id, name, cargo, email, joined_at, status, color_hex, created_at,
              sexo, data_nascimento, whatsapp, linkedin, github,
              indicacao_nome, indicacao_email, estado, cidade,
              resumo_profissional, papel_principal, senioridade, tempo_experiencia,
              nivel_ingles, outro_idioma, possui_cnpj, regime_fiscal,
              lgpd_consent, newsletter_consent,
              CASE WHEN photo_data     IS NOT NULL THEN 1 ELSE 0 END AS has_photo,
              CASE WHEN curriculo_data IS NOT NULL THEN 1 ELSE 0 END AS has_cv
            FROM team_members WHERE id = ?`,
      args: [params.id],
    })
    const row = res.rows[0] as unknown as Record<string, unknown>
    return NextResponse.json(rowToMember({
      ...row,
      photo_data:     row.has_photo ? '1' : null,
      curriculo_data: row.has_cv    ? '1' : null,
    }))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    await db.execute({ sql: `UPDATE tasks SET member_id = NULL WHERE member_id = ?`, args: [params.id] })
    await db.execute({ sql: `DELETE FROM team_members WHERE id = ?`, args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
