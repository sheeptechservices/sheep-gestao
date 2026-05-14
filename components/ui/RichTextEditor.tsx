'use client'
import { useRef, useEffect, useState } from 'react'

// ── Toolbar button ─────────────────────────────────────────────────────────────
function ToolBtn({
  title, active, onCmd, children,
}: {
  title: string
  active?: boolean
  onCmd: () => void
  children: React.ReactNode
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      title={title}
      // onMouseDown prevents stealing focus from the editor
      onMouseDown={e => { e.preventDefault(); onCmd() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 26, height: 26, borderRadius: 5, border: 'none',
        background: active ? 'var(--primary-dim)' : hov ? 'var(--bg)' : 'transparent',
        color: active ? 'var(--primary-text)' : 'var(--gray)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        transition: 'background 0.1s, color 0.1s',
        flexShrink: 0, padding: 0,
      }}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 16, background: 'var(--gray3)', margin: '0 2px', flexShrink: 0 }} />
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function cmd(command: string, value?: string) {
  document.execCommand(command, false, value ?? undefined)
}

function isActive(tag: string) {
  try { return document.queryCommandState(tag) } catch { return false }
}

function blockTag() {
  try { return (document.queryCommandValue('formatBlock') as string).toLowerCase() } catch { return '' }
}

// ── Main component ─────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Detalhes adicionais...',
  minHeight = 120,
}: RichTextEditorProps) {
  const editorRef    = useRef<HTMLDivElement>(null)
  const internalRef  = useRef(false)   // true while onChange is being dispatched
  const [, rerender] = useState(0)     // force toolbar to re-check active states

  // Sync external value → editor (e.g. when modal opens with existing task)
  useEffect(() => {
    const el = editorRef.current
    if (!el || internalRef.current) return
    if (el.innerHTML !== (value ?? '')) {
      el.innerHTML = value ?? ''
    }
  }, [value])

  const handleInput = () => {
    internalRef.current = true
    onChange(editorRef.current?.innerHTML ?? '')
    setTimeout(() => { internalRef.current = false }, 0)
    rerender(n => n + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+B / Ctrl+I / Ctrl+U handled by browser execCommand natively
    if (e.key === 'Tab') {
      e.preventDefault()
      cmd('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
  }

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus()
    cmd(command, value)
    rerender(n => n + 1)
    setTimeout(handleInput, 0)
  }

  const toggleBlock = (tag: string) => {
    editorRef.current?.focus()
    const current = blockTag()
    cmd('formatBlock', current === tag ? 'p' : tag)
    rerender(n => n + 1)
    setTimeout(handleInput, 0)
  }

  const bold      = isActive('bold')
  const italic    = isActive('italic')
  const strike    = isActive('strikeThrough')
  const ul        = isActive('insertUnorderedList')
  const ol        = isActive('insertOrderedList')
  const quote     = blockTag() === 'blockquote'
  const h1        = blockTag() === 'h1'
  const h2        = blockTag() === 'h2'

  return (
    <div style={{ border: '1.5px solid var(--gray3)', borderRadius: 10, background: 'var(--white)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1, padding: '5px 8px',
        borderBottom: '1px solid var(--gray3)', background: 'var(--bg)', flexWrap: 'wrap',
      }}>
        <ToolBtn title="Título 1" active={h1} onCmd={() => toggleBlock('h1')}>H1</ToolBtn>
        <ToolBtn title="Título 2" active={h2} onCmd={() => toggleBlock('h2')}>H2</ToolBtn>
        <Sep />
        <ToolBtn title="Negrito (Ctrl+B)" active={bold} onCmd={() => exec('bold')}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M3 2h3.5a2 2 0 010 4H3V2zM3 6h4a2 2 0 010 4H3V6z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Itálico (Ctrl+I)" active={italic} onCmd={() => exec('italic')}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M7 2H5M9 10H5M7 2l-2 8M7 2h0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Tachado" active={strike} onCmd={() => exec('strikeThrough')}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            <path d="M4 3.5C4 2.7 4.7 2 6 2s2 .7 2 1.5M4.5 9c.3.8 1 1.3 1.8 1.3 1.2 0 1.7-.7 1.7-1.3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <Sep />
        <ToolBtn title="Lista com marcadores" active={ul} onCmd={() => exec('insertUnorderedList')}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <circle cx="1.5" cy="3" r="1" fill="currentColor"/>
            <circle cx="1.5" cy="6" r="1" fill="currentColor"/>
            <circle cx="1.5" cy="9" r="1" fill="currentColor"/>
            <path d="M4 3h8M4 6h8M4 9h8" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Lista numerada" active={ol} onCmd={() => exec('insertOrderedList')}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <path d="M1 2h1v4M1 6h2M4.5 3h8M4.5 6h8M4.5 9h8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 9.5c0-.8 2-1 2-.5 0 .8-2 1.5-2 2h2" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Citação" active={quote} onCmd={() => toggleBlock('blockquote')}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M1 4c0-1 .7-1.5 1.5-1.5S4 3 4 4s-.7 1.5-1.5 1.5L2 6.5V8M7 4c0-1 .7-1.5 1.5-1.5S10 3 10 4s-.7 1.5-1.5 1.5L8 6.5V8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <Sep />
        <ToolBtn title="Divisor horizontal" onCmd={() => exec('insertHorizontalRule')}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <path d="M1 6h11" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="1.5 2"/>
            <circle cx="1" cy="6" r="0.8" fill="currentColor"/>
            <circle cx="12" cy="6" r="0.8" fill="currentColor"/>
          </svg>
        </ToolBtn>
        <Sep />
        <ToolBtn title="Desfazer (Ctrl+Z)" onCmd={() => exec('undo')}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M2 5H7a3 3 0 010 6H4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 5L4 3M2 5l2 2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Refazer (Ctrl+Y)" onCmd={() => exec('redo')}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M10 5H5a3 3 0 000 6h3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 5L8 3M10 5l-2 2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={() => rerender(n => n + 1)}
        onMouseUp={() => rerender(n => n + 1)}
        data-placeholder={placeholder}
        style={{
          minHeight,
          outline: 'none',
          padding: '10px 12px',
          fontSize: 13,
          lineHeight: 1.65,
          color: 'var(--black)',
          fontFamily: 'inherit',
          cursor: 'text',
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--gray2);
          opacity: 0.6;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 16px; font-weight: 800; margin: 6px 0 3px; }
        [contenteditable] h2 { font-size: 14px; font-weight: 700; margin: 5px 0 3px; }
        [contenteditable] p  { margin: 0 0 4px; }
        [contenteditable] ul { padding-left: 20px; margin: 4px 0; list-style-type: disc; }
        [contenteditable] ol { padding-left: 20px; margin: 4px 0; list-style-type: decimal; }
        [contenteditable] li { margin: 2px 0; display: list-item; }
        [contenteditable] blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 10px; margin: 6px 0;
          color: var(--gray); font-style: italic;
        }
        [contenteditable] hr {
          border: none; border-top: 1.5px dashed var(--gray3); margin: 10px 0;
        }
        [contenteditable] strong, [contenteditable] b { font-weight: 700; }
        [contenteditable] em, [contenteditable] i { font-style: italic; }
        [contenteditable] s, [contenteditable] strike { text-decoration: line-through; color: var(--gray2); }
      `}</style>
    </div>
  )
}
