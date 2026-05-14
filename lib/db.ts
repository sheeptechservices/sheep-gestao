import { createClient, type Client } from '@libsql/client'
import path from 'path'

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

    CREATE INDEX IF NOT EXISTS idx_tasks_week_id    ON tasks(week_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_weeks_start_date ON weeks(start_date);
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
    // tasks
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN done         INTEGER NOT NULL DEFAULT 0`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN flag_comment TEXT`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN urgency      TEXT`),
    tryAlter(db, `ALTER TABLE tasks ADD COLUMN deadline     TEXT`),
  ])

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
}
