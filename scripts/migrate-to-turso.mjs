/**
 * Migra dados do SQLite local (sheep-gestao.db) para o Turso.
 * Uso: node scripts/migrate-to-turso.mjs
 */
import { createClient } from '@libsql/client'
import path             from 'path'
import { fileURLToPath } from 'url'
import fs               from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

// ── Carrega .env.local manualmente ───────────────────────────────────────────
const envPath = path.join(ROOT, '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌  .env.local não encontrado')
  process.exit(1)
}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const [k, ...rest] = line.trim().split('=')
  if (k && !k.startsWith('#') && rest.length) process.env[k] = rest.join('=')
}

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌  TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não definidos no .env.local')
  process.exit(1)
}

// ── Clientes ──────────────────────────────────────────────────────────────────
const dbPath = path.join(ROOT, 'sheep-gestao.db').replace(/\\/g, '/')
if (!fs.existsSync(path.join(ROOT, 'sheep-gestao.db'))) {
  console.error('❌  sheep-gestao.db não encontrado na raiz do projeto')
  process.exit(1)
}

const local  = createClient({ url: `file:${dbPath}` })
const remote = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN })

async function readAll(db, table) {
  const res = await db.execute(`SELECT * FROM ${table}`)
  return res.rows
}

async function migrate() {
  console.log('🔄  Conectando ao banco local...')
  const [clients, projects, weeks, tasks] = await Promise.all([
    readAll(local,  'clients'),
    readAll(local,  'projects'),
    readAll(local,  'weeks'),
    readAll(local,  'tasks'),
  ])

  console.log(`📦  Local: ${clients.length} clientes, ${projects.length} projetos, ${weeks.length} semanas, ${tasks.length} tarefas`)

  // ── Clients ────────────────────────────────────────────────────────────────
  console.log('\n➡️   Migrando clientes...')
  for (const r of clients) {
    await remote.execute({
      sql: `INSERT OR REPLACE INTO clients
        (id, name, logo_url, contact_name, contact_email, created_at,
         color_hex, status, data_entrada, data_saida, segmento, sub_segmento,
         origem_comercial, canal_aquisicao, cidade_estado, cnpj_cpf, pasta)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        r.id, r.name, r.logo_url, r.contact_name, r.contact_email, r.created_at,
        r.color_hex, r.status, r.data_entrada, r.data_saida, r.segmento, r.sub_segmento,
        r.origem_comercial, r.canal_aquisicao, r.cidade_estado, r.cnpj_cpf, r.pasta,
      ],
    })
  }
  console.log(`   ✓ ${clients.length} clientes`)

  // ── Projects ───────────────────────────────────────────────────────────────
  console.log('➡️   Migrando projetos...')
  for (const r of projects) {
    await remote.execute({
      sql: `INSERT OR REPLACE INTO projects
        (id, client_id, name, description, status, type, color_hex,
         start_date, end_date, progress, created_at, gestor, observacoes,
         links, team_members, display_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        r.id, r.client_id, r.name, r.description, r.status, r.type, r.color_hex,
        r.start_date, r.end_date, r.progress, r.created_at, r.gestor, r.observacoes,
        r.links, r.team_members, r.display_order ?? 0,
      ],
    })
  }
  console.log(`   ✓ ${projects.length} projetos`)

  // ── Weeks (só atualiza goals/notes, as semanas já existem no Turso) ────────
  console.log('➡️   Migrando semanas com goals/notes...')
  const weeksWithData = weeks.filter(w => w.goals || w.notes)
  for (const r of weeksWithData) {
    await remote.execute({
      sql: `INSERT OR REPLACE INTO weeks (id, week_number, start_date, end_date, goals, notes, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [r.id, r.week_number, r.start_date, r.end_date, r.goals, r.notes, r.created_at],
    })
  }
  console.log(`   ✓ ${weeksWithData.length} semanas com dados (de ${weeks.length} total)`)

  // ── Tasks ──────────────────────────────────────────────────────────────────
  console.log('➡️   Migrando tarefas...')
  // Batch de 50 para não estourar limite do Turso
  const chunks = []
  for (let i = 0; i < tasks.length; i += 50) chunks.push(tasks.slice(i, i + 50))

  for (const chunk of chunks) {
    await remote.batch(
      chunk.map(r => ({
        sql: `INSERT OR REPLACE INTO tasks
          (id, project_id, week_id, title, description, done, assigned_to,
           flags, flag_comment, urgency, deadline, created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          r.id, r.project_id, r.week_id, r.title, r.description,
          r.done, r.assigned_to, r.flags, r.flag_comment,
          r.urgency, r.deadline, r.created_at,
        ],
      })),
      'write'
    )
  }
  console.log(`   ✓ ${tasks.length} tarefas`)

  console.log('\n✅  Migração concluída!')
  local.close()
  remote.close()
}

migrate().catch(err => {
  console.error('❌  Erro durante migração:', err)
  process.exit(1)
})
