import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Client } from '@/lib/types'

const DEFAULTS = {
  logo_url: null, contact_name: null, contact_email: null,
  color_hex: '#84CC16',
  status: null, data_entrada: null, data_saida: null,
  segmento: null, sub_segmento: null, origem_comercial: null,
  canal_aquisicao: null, cidade_estado: null, cnpj_cpf: null, pasta: null,
}

export async function GET() {
  try {
    const db = await initDb()
    const result = await db.execute('SELECT * FROM clients ORDER BY name')
    return NextResponse.json(result.rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Client
    if (!body.id || !body.name) {
      return NextResponse.json({ error: 'id and name are required' }, { status: 400 })
    }
    const db = await initDb()
    const args = { ...DEFAULTS, ...body }
    await db.execute({
      sql: `INSERT INTO clients
        (id, name, logo_url, contact_name, contact_email, created_at,
         color_hex, status, data_entrada, data_saida, segmento, sub_segmento,
         origem_comercial, canal_aquisicao, cidade_estado, cnpj_cpf, pasta)
      VALUES
        (:id, :name, :logo_url, :contact_name, :contact_email, :created_at,
         :color_hex, :status, :data_entrada, :data_saida, :segmento, :sub_segmento,
         :origem_comercial, :canal_aquisicao, :cidade_estado, :cnpj_cpf, :pasta)`,
      args,
    })
    const inserted = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [body.id] })
    return NextResponse.json(inserted.rows[0], { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
