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

    // Identificação & Contato
    sexo:             row.sexo             as TeamMember['sexo']      | undefined,
    data_nascimento:  row.data_nascimento  as string | undefined,
    whatsapp:         row.whatsapp         as string | undefined,
    linkedin:         row.linkedin         as string | undefined,
    github:           row.github           as string | undefined,
    indicacao_nome:   row.indicacao_nome   as string | undefined,
    indicacao_email:  row.indicacao_email  as string | undefined,

    // Localização
    estado: row.estado as string | undefined,
    cidade: row.cidade as string | undefined,

    // Perfil Profissional
    resumo_profissional: row.resumo_profissional as string | undefined,
    papel_principal:     row.papel_principal     as string | undefined,
    senioridade:         row.senioridade         as TeamMember['senioridade']      | undefined,
    tempo_experiencia:   row.tempo_experiencia   as TeamMember['tempo_experiencia'] | undefined,
    nivel_ingles:        row.nivel_ingles        as TeamMember['nivel_ingles']      | undefined,
    outro_idioma:        row.outro_idioma        as string | undefined,

    // Situação Fiscal
    possui_cnpj:  row.possui_cnpj  != null ? Boolean(row.possui_cnpj)  : undefined,
    regime_fiscal: row.regime_fiscal as TeamMember['regime_fiscal'] | undefined,

    // Documentos
    curriculo_url: row.curriculo_data ? `/api/team/${row.id}/cv` : undefined,

    // LGPD
    lgpd_consent:       row.lgpd_consent       != null ? Boolean(row.lgpd_consent)       : undefined,
    newsletter_consent: row.newsletter_consent  != null ? Boolean(row.newsletter_consent)  : undefined,
  }
}

export async function GET() {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql: `SELECT id, name, cargo, email, joined_at, status, color_hex, created_at,
              sexo, data_nascimento, whatsapp, linkedin, github,
              indicacao_nome, indicacao_email, estado, cidade,
              resumo_profissional, papel_principal, senioridade, tempo_experiencia,
              nivel_ingles, outro_idioma, possui_cnpj, regime_fiscal,
              lgpd_consent, newsletter_consent,
              CASE WHEN photo_data     IS NOT NULL THEN 1 ELSE 0 END AS has_photo,
              CASE WHEN curriculo_data IS NOT NULL THEN 1 ELSE 0 END AS has_cv
            FROM team_members ORDER BY name ASC`,
      args: [],
    })
    const members = res.rows.map(r => {
      const row = r as unknown as Record<string, unknown>
      return rowToMember({
        ...row,
        photo_data:     row.has_photo ? '1' : null,
        curriculo_data: row.has_cv    ? '1' : null,
      })
    })
    return NextResponse.json(members)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<TeamMember>
    if (!body.name) return NextResponse.json({ error: 'name obrigatório' }, { status: 400 })

    const id  = `mbr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()
    const db  = await initDb()

    await db.execute({
      sql: `INSERT INTO team_members (
              id, name, cargo, email, joined_at, status, color_hex, created_at,
              sexo, data_nascimento, whatsapp, linkedin, github,
              indicacao_nome, indicacao_email, estado, cidade,
              resumo_profissional, papel_principal, senioridade, tempo_experiencia,
              nivel_ingles, outro_idioma, possui_cnpj, regime_fiscal,
              lgpd_consent, newsletter_consent
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?
            )`,
      args: [
        id, body.name, body.cargo ?? '', body.email ?? null,
        body.joined_at ?? null, body.status ?? 'active', body.color_hex ?? '#84CC16', now,
        body.sexo ?? null, body.data_nascimento ?? null, body.whatsapp ?? null,
        body.linkedin ?? null, body.github ?? null,
        body.indicacao_nome ?? null, body.indicacao_email ?? null,
        body.estado ?? null, body.cidade ?? null,
        body.resumo_profissional ?? null, body.papel_principal ?? null,
        body.senioridade ?? null, body.tempo_experiencia ?? null,
        body.nivel_ingles ?? null, body.outro_idioma ?? null,
        body.possui_cnpj ? 1 : 0, body.regime_fiscal ?? null,
        body.lgpd_consent ? 1 : 0, body.newsletter_consent ? 1 : 0,
      ],
    })

    const res = await db.execute({
      sql: `SELECT id, name, cargo, email, joined_at, status, color_hex, created_at,
              sexo, data_nascimento, whatsapp, linkedin, github,
              indicacao_nome, indicacao_email, estado, cidade,
              resumo_profissional, papel_principal, senioridade, tempo_experiencia,
              nivel_ingles, outro_idioma, possui_cnpj, regime_fiscal,
              lgpd_consent, newsletter_consent
            FROM team_members WHERE id = ?`,
      args: [id],
    })
    const member = rowToMember({
      ...(res.rows[0] as unknown as Record<string, unknown>),
      photo_data: null, curriculo_data: null,
    })
    return NextResponse.json(member, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
