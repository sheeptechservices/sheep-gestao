import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const CLIENTS = [
  { id: 'c-01', name: 'J17 Bank',             data_entrada: '2001-01-01', segmento: 'Financeiro',    origem_comercial: 'Indicação' },
  { id: 'c-02', name: 'FM Rocket',             data_entrada: '2001-01-01', segmento: 'Marketing',     origem_comercial: 'Indicação' },
  { id: 'c-03', name: 'Cheirin Bão',           data_entrada: '2001-01-01', segmento: 'Alimentação',   origem_comercial: 'Indicação' },
  { id: 'c-04', name: 'Click Promocional',     data_entrada: '2001-01-01', segmento: 'Produtos',      origem_comercial: 'Indicação' },
  { id: 'c-05', name: 'Prontomed',             data_entrada: '2001-01-01', segmento: 'Saúde',         origem_comercial: 'Indicação' },
  { id: 'c-06', name: 'Consigo Cred',          data_entrada: '2001-01-01', segmento: 'Financeiro',    origem_comercial: 'Indicação' },
  { id: 'c-07', name: 'Kênia Gama',            data_entrada: '2001-01-01', segmento: 'Marketing',     origem_comercial: 'Indicação' },
  { id: 'c-08', name: 'Segsmart',              data_entrada: '2001-01-01', segmento: 'Marketing',     origem_comercial: 'Indicação' },
  { id: 'c-09', name: '300 Franchising',       data_entrada: '2001-01-01', segmento: 'Franquias',     origem_comercial: 'Indicação' },
  { id: 'c-10', name: 'Nogueira e Barros',     data_entrada: '2001-01-01', segmento: 'Advocacia',     origem_comercial: 'Indicação' },
  { id: 'c-11', name: 'Vale (Bitka)',          data_entrada: '2001-01-01', segmento: 'Mineradora',    origem_comercial: 'Indicação' },
  { id: 'c-12', name: 'Shell (Bip)',           data_entrada: '2001-01-01', segmento: 'Diesel',        origem_comercial: 'Indicação' },
  { id: 'c-13', name: 'Madeiras Matas Verde',  data_entrada: '2001-01-01', segmento: 'Madeira',       origem_comercial: 'Indicação' },
  { id: 'c-14', name: 'Orteconte',             data_entrada: '2001-01-01', segmento: 'Contabilidade', origem_comercial: 'Indicação', cidade_estado: 'Manhuaçu - MG' },
  { id: 'c-15', name: 'Gestão PD',             data_entrada: '2001-01-01', segmento: null,            origem_comercial: 'Indicação' },
  { id: 'c-16', name: 'Linda Todo Dia',        data_entrada: '2001-01-01', segmento: 'Franquias',     origem_comercial: 'Indicação' },
  { id: 'c-17', name: 'HOVEP',                 data_entrada: '2026-02-23', segmento: 'Pet',           origem_comercial: 'Indicação',
    status: 'active', sub_segmento: 'Plano de benefícios', canal_aquisicao: 'WhatsApp', cidade_estado: 'Ponte Nova - MG' },
]

export async function POST() {
  try {
    const db = getDb()
    const count = (db.prepare('SELECT COUNT(*) as n FROM clients').get() as { n: number }).n
    if (count > 0) {
      return NextResponse.json({ message: 'Banco já tem dados — seed ignorado.', count }, { status: 409 })
    }

    const now = new Date().toISOString().split('T')[0]
    const stmt = db.prepare(`
      INSERT INTO clients
        (id, name, logo_url, contact_name, contact_email, created_at,
         status, data_entrada, data_saida, segmento, sub_segmento,
         origem_comercial, canal_aquisicao, cidade_estado, cnpj_cpf, pasta)
      VALUES
        (@id, @name, @logo_url, @contact_name, @contact_email, @created_at,
         @status, @data_entrada, @data_saida, @segmento, @sub_segmento,
         @origem_comercial, @canal_aquisicao, @cidade_estado, @cnpj_cpf, @pasta)
    `)

    const insertMany = db.transaction(() => {
      for (const c of CLIENTS) {
        stmt.run({
          logo_url: null, contact_name: null, contact_email: null,
          data_saida: null, sub_segmento: null, canal_aquisicao: null,
          cidade_estado: null, cnpj_cpf: null, pasta: null,
          status: null, created_at: now, ...c,
        })
      }
    })
    insertMany()

    return NextResponse.json({ message: `${CLIENTS.length} clientes importados com sucesso.` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
