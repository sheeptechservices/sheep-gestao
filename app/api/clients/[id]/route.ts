import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Client } from '@/lib/types'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Partial<Client>
    const db = await initDb()
    const payload = {
      logo_url: null, contact_name: null, contact_email: null,
      color_hex: '#84CC16',
      status: null, data_entrada: null, data_saida: null,
      segmento: null, sub_segmento: null, origem_comercial: null,
      canal_aquisicao: null, cidade_estado: null, cnpj_cpf: null, pasta: null,
      ...body, id: params.id,
    }
    await db.execute({
      sql: `
        UPDATE clients SET
          name = :name, logo_url = :logo_url, contact_name = :contact_name,
          contact_email = :contact_email, created_at = :created_at,
          color_hex = :color_hex,
          status = :status, data_entrada = :data_entrada, data_saida = :data_saida,
          segmento = :segmento, sub_segmento = :sub_segmento,
          origem_comercial = :origem_comercial, canal_aquisicao = :canal_aquisicao,
          cidade_estado = :cidade_estado, cnpj_cpf = :cnpj_cpf, pasta = :pasta
        WHERE id = :id
      `,
      args: payload,
    })
    // Cascade: sync all projects of this client to the new color
    if (payload.color_hex) {
      await db.execute({
        sql: 'UPDATE projects SET color_hex = ? WHERE client_id = ?',
        args: [payload.color_hex, params.id],
      })
    }
    const res = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [params.id] })
    const updated = res.rows[0] as unknown as Client
    return NextResponse.json(updated)
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
    await db.execute({ sql: 'DELETE FROM clients WHERE id = ?', args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
