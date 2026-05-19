import Anthropic from '@anthropic-ai/sdk'
import { initDb } from '@/lib/db'

/**
 * Resolve a chave da API Anthropic:
 *   1. Linha `anthropic` na tabela `integrations` (configurada pela UI)
 *   2. Variável de ambiente ANTHROPIC_API_KEY (fallback)
 *   3. undefined — chamador deve retornar erro 500
 */
export async function resolveAnthropicKey(): Promise<string | undefined> {
  try {
    const db  = await initDb()
    const res = await db.execute({ sql: `SELECT api_key FROM integrations WHERE id = 'anthropic'`, args: [] })
    const row = res.rows[0] as { api_key: string } | undefined
    if (row?.api_key) return row.api_key
  } catch { /* DB ainda não pronta — usa env var */ }
  return process.env.ANTHROPIC_API_KEY || undefined
}

/** Cria um client Anthropic com a chave resolvida. Lança erro se não houver chave. */
export async function createAnthropicClient(): Promise<Anthropic> {
  const apiKey = await resolveAnthropicKey()
  if (!apiKey) throw new Error('Chave da API Anthropic não configurada. Acesse Sistema → Integrações para adicionar sua chave.')
  return new Anthropic({ apiKey })
}
