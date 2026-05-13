import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Client } from '@/lib/types'

const DEFAULTS: Partial<Client> = {
  logo_url: undefined, contact_name: undefined, contact_email: undefined,
  color_hex: '#84CC16',
  status: undefined, data_entrada: undefined, data_saida: undefined,
  segmento: undefined, sub_segmento: undefined, origem_comercial: undefined,
  canal_aquisicao: undefined, cidade_estado: undefined, cnpj_cpf: undefined, pasta: undefined,
}

export async function GET() {
  try {
    const db = getDb()
    const clients = db.prepare('SELECT * FROM clients ORDER BY name').all() as Client[]
    return NextResponse.json(clients)
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
    const db = getDb()
    db.prepare(`
      INSERT INTO clients
        (id, name, logo_url, contact_name, contact_email, created_at,
         color_hex, status, data_entrada, data_saida, segmento, sub_segmento,
         origem_comercial, canal_aquisicao, cidade_estado, cnpj_cpf, pasta)
      VALUES
        (@id, @name, @logo_url, @contact_name, @contact_email, @created_at,
         @color_hex, @status, @data_entrada, @data_saida, @segmento, @sub_segmento,
         @origem_comercial, @canal_aquisicao, @cidade_estado, @cnpj_cpf, @pasta)
    `).run({ ...DEFAULTS, ...body })
    const inserted = db.prepare('SELECT * FROM clients WHERE id = ?').get(body.id) as Client
    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
