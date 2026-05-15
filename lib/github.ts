// ── GitHub API service ────────────────────────────────────────────────────────
// Chamado exclusivamente server-side (API routes). Usa GITHUB_TOKEN do env.

const GH_BASE = 'https://api.github.com'

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'sheep-gestao/1.0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function ghFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${GH_BASE}${path}`, {
      headers: ghHeaders(),
      next: { revalidate: 120 }, // cache 2 min (Next.js fetch cache)
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GhIssue {
  number: number
  title: string
  state: 'open' | 'closed'
  labels: { name: string; color: string }[]
  created_at: string
  html_url: string
  body?: string
  pull_request?: unknown // marca PRs (presentes na lista de issues)
}

export interface GhPR {
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  merged_at: string | null
  created_at: string
  html_url: string
  head: { ref: string }
  base: { ref: string }
  body?: string
  draft: boolean
}

export interface GhCommit {
  sha: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
  html_url: string
}

export interface GhRepo {
  full_name: string
  description: string | null
  default_branch: string
  stargazers_count: number
  open_issues_count: number
  language: string | null
  topics: string[]
  pushed_at: string
  visibility: 'public' | 'private'
}

export interface GhRepoContext {
  repo: GhRepo | null
  openIssues: GhIssue[]
  recentPRs: GhPR[]
  recentCommits: GhCommit[]
}

// ── Main fetch — tudo em paralelo ─────────────────────────────────────────────

export async function fetchRepoContext(owner: string, repo: string): Promise<GhRepoContext> {
  const [repoData, issuesData, prsData, commitsData] = await Promise.all([
    ghFetch<GhRepo>(`/repos/${owner}/${repo}`),
    ghFetch<GhIssue[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=20&sort=created&direction=desc`),
    ghFetch<GhPR[]>(`/repos/${owner}/${repo}/pulls?state=all&per_page=15&sort=updated&direction=desc`),
    ghFetch<GhCommit[]>(`/repos/${owner}/${repo}/commits?per_page=15`),
  ])

  // Filtra PRs da lista de issues (GitHub mistura os dois)
  const openIssues = (issuesData ?? []).filter(i => !i.pull_request)

  return {
    repo: repoData,
    openIssues,
    recentPRs: prsData ?? [],
    recentCommits: commitsData ?? [],
  }
}

// ── Formata contexto como texto para injetar no system prompt ─────────────────

export function formatRepoContextForPrompt(ctx: GhRepoContext, repoSlug: string): string {
  const lines: string[] = []

  lines.push(`\n\n--- REPOSITÓRIO GITHUB: ${repoSlug} ---`)

  if (ctx.repo) {
    const r = ctx.repo
    lines.push(`Visibilidade: ${r.visibility} | Branch padrão: ${r.default_branch} | Linguagem principal: ${r.language ?? 'N/A'}`)
    if (r.description) lines.push(`Descrição: ${r.description}`)
    if (r.topics?.length) lines.push(`Tópicos: ${r.topics.join(', ')}`)
    lines.push(`Issues abertas: ${r.open_issues_count} | Último push: ${r.pushed_at?.slice(0, 10) ?? 'N/A'}`)
  }

  if (ctx.openIssues.length > 0) {
    lines.push(`\nISSUES ABERTAS (${ctx.openIssues.length}):`)
    ctx.openIssues.slice(0, 10).forEach(i => {
      const labels = i.labels.length ? ` [${i.labels.map(l => l.name).join(', ')}]` : ''
      lines.push(`  #${i.number} ${i.title}${labels}`)
    })
  } else {
    lines.push('\nNenhuma issue aberta.')
  }

  if (ctx.recentPRs.length > 0) {
    const open  = ctx.recentPRs.filter(p => p.state === 'open' && !p.draft)
    const draft = ctx.recentPRs.filter(p => p.draft)
    const merged = ctx.recentPRs.filter(p => p.merged_at)

    if (open.length) {
      lines.push(`\nPULL REQUESTS ABERTOS (${open.length}):`)
      open.forEach(p => lines.push(`  #${p.number} ${p.title} (${p.head.ref} → ${p.base.ref})`))
    }
    if (draft.length) {
      lines.push(`\nPULL REQUESTS DRAFT (${draft.length}):`)
      draft.forEach(p => lines.push(`  #${p.number} ${p.title}`))
    }
    if (merged.length) {
      lines.push(`\nÚLTIMOS PRs MERGED:`)
      merged.slice(0, 5).forEach(p => lines.push(`  #${p.number} ${p.title} (${p.merged_at?.slice(0, 10)})`))
    }
  }

  if (ctx.recentCommits.length > 0) {
    lines.push(`\nCOMMITS RECENTES:`)
    ctx.recentCommits.slice(0, 10).forEach(c => {
      const msg   = c.commit.message.split('\n')[0].slice(0, 90)
      const author = c.commit.author.name
      const date   = c.commit.author.date.slice(0, 10)
      lines.push(`  ${c.sha.slice(0, 7)} ${msg} — ${author} (${date})`)
    })
  }

  return lines.join('\n')
}
