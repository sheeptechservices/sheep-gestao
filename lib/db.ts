import { createClient, type Client } from '@libsql/client'
import path from 'path'
import bcrypt from 'bcryptjs'
import { DEFAULT_AGENTS } from './agents'

let _client: Client | null = null
let _initialized = false

// ── ISO week helpers ──────────────────────────────────────────────────────────

function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dow   = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7)
  return monday
}

function isoWeeksInYear(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28))
  return (dec28.getUTCDay() || 7) >= 4 ? 53 : 52
}

// ── Client singleton ──────────────────────────────────────────────────────────

export function getDb(): Client {
  if (_client) return _client

  // Local dev → file:sheep-gestao.db  |  Vercel → TURSO_DATABASE_URL
  const url = process.env.TURSO_DATABASE_URL
    ?? `file:${path.join(process.cwd(), 'sheep-gestao.db').replace(/\\/g, '/')}`
  const authToken = process.env.TURSO_AUTH_TOKEN

  _client = createClient({ url, authToken })
  return _client
}

/** Call at the top of every API route — idempotent, runs schema once per process */
export async function initDb(): Promise<Client> {
  const db = getDb()
  if (_initialized) return db
  _initialized = true
  await createTables(db)
  await migrateDb(db)
  return db
}

// ── Schema creation ───────────────────────────────────────────────────────────

async function createTables(db: Client) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS clients (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      logo_url         TEXT,
      contact_name     TEXT,
      contact_email    TEXT,
      created_at       TEXT NOT NULL,
      color_hex        TEXT DEFAULT '#84CC16',
      status           TEXT,
      data_entrada     TEXT,
      data_saida       TEXT,
      segmento         TEXT,
      sub_segmento     TEXT,
      origem_comercial TEXT,
      canal_aquisicao  TEXT,
      cidade_estado    TEXT,
      cnpj_cpf         TEXT,
      pasta            TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id            TEXT PRIMARY KEY,
      client_id     TEXT NOT NULL REFERENCES clients(id),
      name          TEXT NOT NULL,
      description   TEXT,
      status        TEXT NOT NULL DEFAULT 'active',
      type          TEXT NOT NULL DEFAULT 'Other',
      color_hex     TEXT NOT NULL DEFAULT '#84CC16',
      start_date    TEXT NOT NULL,
      end_date      TEXT,
      progress      INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL,
      gestor        TEXT,
      observacoes   TEXT,
      links         TEXT,
      team_members  TEXT,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS weeks (
      id          TEXT PRIMARY KEY,
      week_number INTEGER NOT NULL,
      start_date  TEXT NOT NULL,
      end_date    TEXT NOT NULL,
      goals       TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      project_id   TEXT REFERENCES projects(id),
      week_id      TEXT REFERENCES weeks(id),
      title        TEXT NOT NULL,
      description  TEXT,
      done         INTEGER NOT NULL DEFAULT 0,
      assigned_to  TEXT,
      flags        TEXT,
      flag_comment TEXT,
      urgency      TEXT,
      deadline     TEXT,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_attachments (
      id         TEXT PRIMARY KEY,
      task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      filename   TEXT NOT NULL,
      url        TEXT NOT NULL DEFAULT '',
      size       INTEGER NOT NULL DEFAULT 0,
      mime_type  TEXT NOT NULL DEFAULT '',
      data       TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agents (
      type            TEXT PRIMARY KEY,
      enabled         INTEGER NOT NULL DEFAULT 1,
      name            TEXT NOT NULL,
      role            TEXT NOT NULL,
      temperature     REAL NOT NULL DEFAULT 0.7,
      system_prompt   TEXT NOT NULL,
      knowledge_files TEXT NOT NULL DEFAULT '[]',
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id           TEXT PRIMARY KEY,
      project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      filename     TEXT NOT NULL,
      mime_type    TEXT NOT NULL DEFAULT '',
      size         INTEGER NOT NULL DEFAULT 0,
      text_content TEXT NOT NULL DEFAULT '',
      created_at   TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_week_id         ON tasks(week_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id      ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client_id    ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at      ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_weeks_start_date      ON weeks(start_date);
    CREATE INDEX IF NOT EXISTS idx_attachments_task_id   ON task_attachments(task_id);
    CREATE INDEX IF NOT EXISTS idx_project_files_proj_id ON project_files(project_id);

    CREATE TABLE IF NOT EXISTS integrations (
      id         TEXT PRIMARY KEY,
      api_key    TEXT NOT NULL DEFAULT '',
      extra      TEXT NOT NULL DEFAULT '{}',
      enabled    INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      cargo      TEXT NOT NULL DEFAULT '',
      email      TEXT,
      photo_data TEXT,
      joined_at  TEXT,
      status     TEXT NOT NULL DEFAULT 'active',
      color_hex  TEXT NOT NULL DEFAULT '#84CC16',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

    CREATE TABLE IF NOT EXISTS meetings (
      id           TEXT PRIMARY KEY,
      fireflies_id TEXT UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      date         TEXT,
      duration     INTEGER,
      summary      TEXT,
      transcript   TEXT,
      action_items TEXT,
      participants TEXT,
      project_id   TEXT REFERENCES projects(id),
      auto_matched INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      type       TEXT NOT NULL,
      payload    TEXT NOT NULL DEFAULT '{}',
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id                  TEXT PRIMARY KEY,
      name                TEXT,
      company             TEXT,
      context             TEXT,
      email               TEXT,
      phone               TEXT,
      first_contact_date  TEXT,
      funnel_stage        TEXT DEFAULT 'contato_inicial',
      propensity          TEXT,
      project_types       TEXT DEFAULT '[]',
      project_name        TEXT,
      estimated_value     REAL,
      segment             TEXT,
      sub_segment         TEXT,
      commercial_origin   TEXT,
      acquisition_channel TEXT,
      referred_by         TEXT,
      notes               TEXT,
      linkedin_id         TEXT,
      created_at          TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leads_created_at   ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_funnel_stage ON leads(funnel_stage);

    CREATE TABLE IF NOT EXISTS lead_attachments (
      id         TEXT PRIMARY KEY,
      lead_id    TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      filename   TEXT NOT NULL,
      url        TEXT NOT NULL DEFAULT '',
      size       INTEGER NOT NULL DEFAULT 0,
      mime_type  TEXT NOT NULL DEFAULT '',
      data       TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments(lead_id);

    CREATE TABLE IF NOT EXISTS lead_files (
      id           TEXT PRIMARY KEY,
      lead_id      TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      filename     TEXT NOT NULL,
      mime_type    TEXT NOT NULL DEFAULT '',
      size         INTEGER NOT NULL DEFAULT 0,
      text_content TEXT NOT NULL DEFAULT '',
      created_at   TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_lead_files_lead_id ON lead_files(lead_id);

    CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
    CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_read  ON notifications(read);

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      allowed_pages TEXT NOT NULL DEFAULT '[]',
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL,
      last_login    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `)
}

// ── Migrations (idempotent via try/catch) ─────────────────────────────────────

async function tryAlter(db: Client, sql: string) {
  try { await db.execute(sql) } catch { /* column already exists — ok */ }
}

async function migrateDb(db: Client) {
  // Run all ALTER TABLE columns in parallel — one round-trip per group, not per column
  await Promise.all([
    // clients
    tryAlter(db, `ALTER TABLE clients ADD COLUMN color_hex        TEXT DEFAULT '#84CC16'`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN status           TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN data_entrada     TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN data_saida       TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN segmento         TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN sub_segmento     TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN origem_comercial TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN canal_aquisicao  TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN cidade_estado    TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN cnpj_cpf         TEXT`),
    tryAlter(db, `ALTER TABLE clients ADD COLUMN pasta            TEXT`),
    // projects
    tryAlter(db, `ALTER TABLE projects ADD COLUMN gestor        TEXT`),
    tryAlter(db, `ALTER TABLE projects ADD COLUMN observacoes   TEXT`),
    tryAlter(db, `ALTER TABLE projects ADD COLUMN links         TEXT`),
    tryAlter(db, `ALTER TABLE projects ADD COLUMN team_members  TEXT`),
    tryAlter(db, `ALTER TABLE projects ADD COLUMN display_order INTEGER DEFAULT 0`),
    tryAlter(db, `ALTER TABLE projects ADD COLUMN github_repo         TEXT`),
    tryAlter(db, `ALTER TABLE projects ADD COLUMN project_member_ids  TEXT`),
    // task_attachments — coluna data adicionada após a criação inicial
    tryAlter(db, `ALTER TABLE task_attachments ADD COLUMN data TEXT`),
    // tasks
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN done         INTEGER NOT NULL DEFAULT 0`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN flag_comment TEXT`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN urgency      TEXT`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN deadline     TEXT`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN is_draft     INTEGER NOT NULL DEFAULT 0`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN member_id    TEXT REFERENCES team_members(id)`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN member_ids   TEXT`),
    // meetings
    tryAlter(db, `ALTER TABLE meetings ADD COLUMN meeting_attendees TEXT DEFAULT '[]'`),
    tryAlter(db, `ALTER TABLE meetings ADD COLUMN lead_id TEXT REFERENCES leads(id)`),
    // leads
    tryAlter(db, `ALTER TABLE leads ADD COLUMN owner_id TEXT`),
    // team_members — expanded profile fields
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN sexo               TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN data_nascimento     TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN whatsapp            TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN linkedin            TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN github              TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN indicacao_nome      TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN indicacao_email     TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN estado              TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN cidade              TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN resumo_profissional TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN papel_principal     TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN senioridade         TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN tempo_experiencia   TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN nivel_ingles        TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN outro_idioma        TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN possui_cnpj         INTEGER DEFAULT 0`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN regime_fiscal       TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN curriculo_data      TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN lgpd_consent        INTEGER DEFAULT 0`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN newsletter_consent  INTEGER DEFAULT 0`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN curriculo_mime      TEXT`),
    tryAlter(db, `ALTER TABLE team_members ADD COLUMN curriculo_filename  TEXT`),
  ])

  // Limpa rascunhos órfãos:
  // 1. Novos (is_draft = 1) com mais de 2 horas
  // 2. Legados com título '(rascunho)' que existiam antes da coluna is_draft
  await db.execute({
    sql:  `DELETE FROM tasks WHERE is_draft = 1 AND created_at < datetime('now', '-2 hours')`,
    args: [],
  })
  await db.execute({
    sql:  `DELETE FROM tasks WHERE title = '(rascunho)' AND (is_draft = 0 OR is_draft IS NULL)`,
    args: [],
  })

  // Generate ISO weeks for 2025–2028 only if not yet populated
  // Single COUNT check avoids 156 INSERT round-trips when weeks already exist
  const YEARS = [2025, 2026, 2027, 2028]
  const lastYear = YEARS[YEARS.length - 1]
  const checkRes = await db.execute({
    sql:  `SELECT COUNT(*) AS cnt FROM weeks WHERE id LIKE ?`,
    args: [`global-w-${lastYear}-%`],
  })
  const alreadySeeded = (checkRes.rows[0] as unknown as { cnt: number }).cnt > 0

  if (!alreadySeeded) {
    const now   = new Date().toISOString()
    const stmts: { sql: string; args: (string | number)[] }[] = []

    for (const year of YEARS) {
      const total = isoWeeksInYear(year)
      for (let w = 1; w <= total; w++) {
        const monday = isoWeekMonday(year, w)
        const sunday = new Date(monday)
        sunday.setUTCDate(monday.getUTCDate() + 6)
        stmts.push({
          sql:  `INSERT OR IGNORE INTO weeks (id, week_number, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?)`,
          args: [
            `global-w-${year}-${String(w).padStart(2, '0')}`,
            w,
            monday.toISOString().slice(0, 10),
            sunday.toISOString().slice(0, 10),
            now,
          ],
        })
      }
    }

    // Batch in chunks of 50 to stay within Turso limits
    for (let i = 0; i < stmts.length; i += 50) {
      await db.batch(stmts.slice(i, i + 50), 'write')
    }
  }

  // Seed de membros — importa assigned_to únicos de tasks que ainda não têm cadastro
  {
    const COLORS = ['#84CC16','#6366F1','#F59E0B','#EC4899','#14B8A6','#8B5CF6','#3B82F6','#D93025','#1E8A3E','#F97316']
    const assignedRes = await db.execute({
      sql:  `SELECT DISTINCT assigned_to FROM tasks WHERE assigned_to IS NOT NULL AND assigned_to != '' ORDER BY assigned_to`,
      args: [],
    })
    const names = assignedRes.rows.map(r => (r as unknown as { assigned_to: string }).assigned_to)
    if (names.length > 0) {
      const seedNow = new Date().toISOString()
      const memberStmts = names.map((name, i) => ({
        sql:  `INSERT OR IGNORE INTO team_members (id, name, cargo, status, color_hex, created_at) VALUES (?, ?, '', 'active', ?, ?)`,
        args: [
          `mbr-seed-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 20)}-${i}`,
          name,
          COLORS[i % COLORS.length],
          seedNow,
        ] as (string | number)[],
      }))
      await db.batch(memberStmts, 'write')
    }
  }

  // Vincula member_id nas tasks que já têm assigned_to mas ainda não têm member_id
  await db.execute({
    sql:  `UPDATE tasks
           SET member_id = (
             SELECT id FROM team_members WHERE name = tasks.assigned_to LIMIT 1
           )
           WHERE assigned_to IS NOT NULL
             AND assigned_to != ''
             AND member_id IS NULL`,
    args: [],
  })

  // Promove member_id → member_ids (JSON array) onde member_ids ainda está vazio
  await db.execute({
    sql:  `UPDATE tasks
           SET member_ids = json_array(member_id)
           WHERE member_id IS NOT NULL
             AND (member_ids IS NULL OR member_ids = '')`,
    args: [],
  })

  // Seed / migração do usuário master protegido
  {
    const countRes = await db.execute({ sql: `SELECT COUNT(*) AS cnt FROM users`, args: [] })
    const cnt = (countRes.rows[0] as unknown as { cnt: number }).cnt
    if (cnt === 0) {
      // Primeira vez: cria o master com o e-mail definitivo
      const hash = await bcrypt.hash('sheep2026', 10)
      await db.execute({
        sql: `INSERT INTO users (id, name, email, password_hash, role, allowed_pages, active, created_at)
              VALUES (?, ?, ?, ?, 'master', '[]', 1, ?)`,
        args: ['usr-master-001', 'Guilherme Zaidan', 'gestao.master@sheeptechnology.com.br', hash, new Date().toISOString()],
      })
    } else {
      // Migração: garante que o master protegido tem o e-mail correto (atualiza registros legados)
      await db.execute({
        sql: `UPDATE users SET email = 'gestao.master@sheeptechnology.com.br', role = 'master', active = 1
              WHERE id = 'usr-master-001' AND email != 'gestao.master@sheeptechnology.com.br'`,
        args: [],
      })
    }
  }

  // Seed de agentes — INSERT OR IGNORE garante idempotência.
  // Agentes novos adicionados no código aparecem automaticamente no próximo boot.
  // Customizações salvas pelo usuário (UPDATE) não são sobrescritas.
  const now = new Date().toISOString()
  const agentStmts = DEFAULT_AGENTS.map(a => ({
    sql:  `INSERT OR IGNORE INTO agents (type, enabled, name, role, temperature, system_prompt, knowledge_files, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [a.type, a.enabled ? 1 : 0, a.name, a.role, a.temperature, a.systemPrompt, JSON.stringify(a.knowledgeFiles), now] as (string | number)[],
  }))
  await db.batch(agentStmts, 'write')
}
