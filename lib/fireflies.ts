const ENDPOINT = 'https://api.fireflies.ai/graphql'

// ── Tipos da resposta da API ───────────────────────────────────────────────────

export interface FirefliesSentence {
  text: string
  speaker_name?: string
}

export interface FirefliesTranscript {
  id: string
  title: string
  date: number          // timestamp em ms
  duration: number      // segundos
  summary?: {
    overview?: string
    action_items?: string
    keywords?: string[]
  }
  sentences?: FirefliesSentence[]
  participants?: string[]
}

// ── Query GraphQL ─────────────────────────────────────────────────────────────

const TRANSCRIPT_QUERY = `
  query Transcript($transcriptId: String!) {
    transcript(id: $transcriptId) {
      id
      title
      date
      duration
      summary {
        overview
        action_items
        keywords
      }
      sentences {
        text
        speaker_name
      }
      participants
    }
  }
`

// ── Fetch transcript por ID ───────────────────────────────────────────────────

export async function fetchFirefliesTranscript(
  transcriptId: string,
  apiKey?: string,
): Promise<FirefliesTranscript | null> {
  const key = apiKey ?? process.env.FIREFLIES_API_KEY
  if (!key) throw new Error('FIREFLIES_API_KEY não configurado')

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ query: TRANSCRIPT_QUERY, variables: { transcriptId } }),
  })

  if (!res.ok) throw new Error(`Fireflies API retornou ${res.status}`)

  const json = await res.json() as { data?: { transcript?: FirefliesTranscript }; errors?: { message: string }[] }

  // Erros "not found" retornam null em vez de lançar (ex: ID falso do Test Webhook)
  if (json.errors?.length) {
    const msg = json.errors[0].message.toLowerCase()
    if (msg.includes('not found') || msg.includes('does not exist')) return null
    throw new Error(json.errors[0].message)
  }

  return json.data?.transcript ?? null
}

// ── Query de listagem ─────────────────────────────────────────────────────────

const TRANSCRIPTS_LIST_QUERY = `
  query Transcripts($limit: Int, $skip: Int) {
    transcripts(limit: $limit, skip: $skip) {
      id
      title
      date
      duration
      summary {
        overview
        action_items
      }
      sentences {
        text
        speaker_name
      }
      participants
    }
  }
`

// ── Lista transcrições (paginado) ─────────────────────────────────────────────

export async function listFirefliesTranscripts(
  apiKey?: string,
  skip = 0,
  limit = 50,
): Promise<FirefliesTranscript[]> {
  const key = apiKey ?? process.env.FIREFLIES_API_KEY
  if (!key) throw new Error('FIREFLIES_API_KEY não configurado')

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ query: TRANSCRIPTS_LIST_QUERY, variables: { limit, skip } }),
  })

  if (!res.ok) throw new Error(`Fireflies API retornou ${res.status}`)

  const json = await res.json() as { data?: { transcripts?: FirefliesTranscript[] }; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors[0].message)

  return json.data?.transcripts ?? []
}

// ── Monta texto da transcrição agrupado por speaker ───────────────────────────

export function buildTranscriptText(sentences: FirefliesSentence[]): string {
  let currentSpeaker = ''
  const parts: string[] = []

  for (const s of sentences) {
    if (s.speaker_name && s.speaker_name !== currentSpeaker) {
      currentSpeaker = s.speaker_name
      parts.push(`\n**${currentSpeaker}:** ${s.text}`)
    } else {
      parts.push(s.text)
    }
  }

  return parts.join(' ').trim()
}
