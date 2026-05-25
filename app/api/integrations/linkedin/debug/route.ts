import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/** GET /api/integrations/linkedin/debug
 *  Retorna informações diagnósticas sobre o estado do LinkedIn no banco.
 *  NÃO expõe valores reais — apenas tamanhos e prefixos.
 */
export async function GET() {
  try {
    const db = getDb()   // mesmo método que auth/route.ts agora usa

    const res = await db.execute({
      sql:  `SELECT api_key, extra, enabled, updated_at FROM integrations WHERE id = 'linkedin' LIMIT 1`,
      args: [],
    })

    if (!res.rows[0]) {
      return NextResponse.json({
        row_exists:        false,
        db_url:            process.env.TURSO_DATABASE_URL ?? '(não definida — usando arquivo local)',
        db_has_auth_token: !!process.env.TURSO_AUTH_TOKEN,
        message:           'Nenhuma linha com id=linkedin encontrada na tabela integrations',
      })
    }

    const row        = res.rows[0]
    const apiKey     = row.api_key as string | null
    const extraRaw   = row.extra   as string | null
    const extra      = JSON.parse(extraRaw || '{}') as Record<string, unknown>

    const tursoUrl = process.env.TURSO_DATABASE_URL ?? '(não definida — usando arquivo local)'
    const hasToken = !!process.env.TURSO_AUTH_TOKEN

    return NextResponse.json({
      // ─── banco sendo usado ───
      db_url:              tursoUrl,   // URL COMPLETA para comparar
      db_has_auth_token:   hasToken,

      // ─── linha linkedin ───
      row_exists:          true,
      api_key_is_null:     apiKey === null,
      api_key_is_empty:    apiKey === '',
      api_key_length:      apiKey?.length ?? 0,
      api_key_prefix:      apiKey ? apiKey.slice(0, 6) + '****' : '(vazio)',
      has_client_secret:   typeof extra.client_secret === 'string' && (extra.client_secret as string).length > 0,
      client_secret_length: typeof extra.client_secret === 'string' ? (extra.client_secret as string).length : 0,
      has_access_token:    typeof extra.access_token === 'string' && (extra.access_token as string).length > 0,
      enabled:             row.enabled,
      updated_at:          row.updated_at,
      extra_keys:          Object.keys(extra),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
