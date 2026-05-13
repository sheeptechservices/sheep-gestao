import { NextRequest } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, ShadingType,
} from 'docx'

// ── Inline markdown parser ──────────────────────────────────────────────────
// Returns an array of TextRun for a line, handling **bold**, *italic*, `code`
function parseInlineRuns(text: string, baseSize = 24): TextRun[] {
  const runs: TextRun[] = []
  // Split on **bold**, *italic*, `code` patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+?)`)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      runs.push(new TextRun({ text: text.slice(last, match.index), size: baseSize }))
    }
    if (match[2] !== undefined) {
      runs.push(new TextRun({ text: match[2], bold: true, size: baseSize }))
    } else if (match[3] !== undefined) {
      runs.push(new TextRun({ text: match[3], italics: true, size: baseSize }))
    } else if (match[4] !== undefined) {
      runs.push(new TextRun({ text: match[4], font: 'Courier New', size: baseSize - 2,
        shading: { type: ShadingType.SOLID, color: 'F3F3F3', fill: 'F3F3F3' } }))
    }
    last = regex.lastIndex
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last), size: baseSize }))
  }
  return runs.length ? runs : [new TextRun({ text, size: baseSize })]
}

// ── Markdown → docx Paragraph array ─────────────────────────────────────────
function markdownToDocx(markdown: string): Paragraph[] {
  const lines = markdown.split('\n')
  const paragraphs: Paragraph[] = []
  let inCodeBlock = false
  const codeLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]

    // Code block fence
    if (raw.trimStart().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeLines.length = 0
      } else {
        inCodeBlock = false
        const codeText = codeLines.join('\n')
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: codeText,
            font: 'Courier New',
            size: 20,
          })],
          shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' },
          spacing: { before: 80, after: 80 },
          indent: { left: 200 },
        }))
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(raw)
      continue
    }

    // Headings
    const h1 = raw.match(/^# (.+)/)
    const h2 = raw.match(/^## (.+)/)
    const h3 = raw.match(/^### (.+)/)

    if (h1) {
      paragraphs.push(new Paragraph({
        text: h1[1],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }))
      continue
    }
    if (h2) {
      paragraphs.push(new Paragraph({
        text: h2[1],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }))
      continue
    }
    if (h3) {
      paragraphs.push(new Paragraph({
        text: h3[1],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 },
      }))
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(raw.trim())) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: '', size: 8 })],
        border: { bottom: { style: 'single', size: 6, color: 'DDDDDD', space: 1 } },
        spacing: { before: 120, after: 120 },
      }))
      continue
    }

    // Bullet list items (- or *)
    const bullet = raw.match(/^(\s*)[*-] (.+)/)
    if (bullet) {
      const depth = Math.floor(bullet[1].length / 2)
      paragraphs.push(new Paragraph({
        children: parseInlineRuns(bullet[2]),
        bullet: { level: depth },
        spacing: { before: 40, after: 40 },
      }))
      continue
    }

    // Numbered list
    const numbered = raw.match(/^\d+\. (.+)/)
    if (numbered) {
      paragraphs.push(new Paragraph({
        children: parseInlineRuns(numbered[1]),
        numbering: { reference: 'default-numbering', level: 0 },
        spacing: { before: 40, after: 40 },
      }))
      continue
    }

    // Blockquote
    const bq = raw.match(/^> (.+)/)
    if (bq) {
      paragraphs.push(new Paragraph({
        children: parseInlineRuns(bq[1]),
        indent: { left: 400 },
        border: { left: { style: 'single', size: 12, color: 'BBBBBB', space: 8 } },
        spacing: { before: 60, after: 60 },
      }))
      continue
    }

    // Empty line
    if (raw.trim() === '') {
      paragraphs.push(new Paragraph({ children: [new TextRun('')], spacing: { before: 40, after: 40 } }))
      continue
    }

    // Normal paragraph
    paragraphs.push(new Paragraph({
      children: parseInlineRuns(raw.trim()),
      spacing: { before: 60, after: 60 },
    }))
  }

  return paragraphs
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { content: string; filename: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { content, filename } = body ?? {}
  if (!content) return new Response(JSON.stringify({ error: 'No content' }), { status: 400 })

  const safeFilename = (filename ?? 'documento').replace(/[^a-zA-Z0-9\s_\-áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/g, '')

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } } }],
      }],
    },
    sections: [{
      children: markdownToDocx(content),
    }],
  })

  const buffer = await Packer.toBuffer(doc)

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}.docx"`,
    },
  })
}
