import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'

const MAX_CHARS = 40000   // ~10k tokens — safe limit para contexto do agente

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const name = file.name
    const ext  = name.split('.').pop()?.toLowerCase() ?? ''
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let text = ''

    // ── PDF ──────────────────────────────────────────────────────────────────
    // Importa o módulo interno diretamente para evitar o bug do pdf-parse v1
    // que tenta abrir test/data/05-versions-space.pdf ao inicializar via webpack.
    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse/lib/pdf-parse.js')
      const result = await pdfParse(buffer)
      text = result.text
    }

    // ── DOCX / DOC ───────────────────────────────────────────────────────────
    else if (ext === 'docx' || ext === 'doc') {
      const mammoth = await import('mammoth')
      const result  = await mammoth.extractRawText({ buffer })
      text = result.value
    }

    // ── PPTX / PPT ───────────────────────────────────────────────────────────
    // officeparser v6 precisa de um arquivo temporário com a extensão correta
    // para fazer a detecção do formato via nome de arquivo.
    else if (ext === 'pptx' || ext === 'ppt') {
      tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}.${ext}`)
      await fs.writeFile(tmpPath, buffer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { parseOffice } = await import('officeparser') as any
      const ast = await parseOffice(tmpPath, { newlineDelimiter: '\n', ignoreNotes: false })
      text = typeof ast?.toText === 'function' ? ast.toText() : String(ast)
    }

    // ── XLSX / XLS ───────────────────────────────────────────────────────────
    else if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
      const parts: string[] = []

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        // csv_output preserva a estrutura tabular com vírgulas — mais legível para o LLM
        const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false })
        if (csv.trim()) {
          parts.push(`=== Planilha: ${sheetName} ===\n${csv}`)
        }
      }

      text = parts.join('\n\n')
    }

    // ── Texto puro ───────────────────────────────────────────────────────────
    else if (['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'yaml', 'yml'].includes(ext)) {
      text = buffer.toString('utf-8')
    }

    else {
      return NextResponse.json(
        { error: `Formato .${ext} não suportado. Use PDF, DOCX, PPTX, XLSX, TXT, MD ou CSV.` },
        { status: 415 }
      )
    }

    // Remove caracteres de controle que quebram JSON (null bytes, etc.) e normaliza espaços
    text = text
      .replace(/\0/g, '')                    // null bytes — comuns em PDFs
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // outros controles (exceto \t \n)
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const truncated = text.length > MAX_CHARS
    if (truncated) text = text.slice(0, MAX_CHARS)

    return NextResponse.json({
      text,
      filename: name,
      chars: text.length,
      truncated,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    if (tmpPath) await fs.unlink(tmpPath).catch(() => {})
  }
}
