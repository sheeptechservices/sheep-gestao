import { NextRequest, NextResponse } from 'next/server'
import { fetchRepoContext } from '@/lib/github'

export async function GET(
  _req: NextRequest,
  { params }: { params: { owner: string; repo: string } },
) {
  const { owner, repo } = params

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner e repo são obrigatórios' }, { status: 400 })
  }

  try {
    const ctx = await fetchRepoContext(owner, repo)

    // Se o repo não foi encontrado (privado sem token, ou inexistente), retorna 404
    if (!ctx.repo) {
      return NextResponse.json(
        { error: `Repositório ${owner}/${repo} não encontrado ou inacessível. Verifique se o GITHUB_TOKEN está configurado para repos privados.` },
        { status: 404 },
      )
    }

    return NextResponse.json(ctx)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
