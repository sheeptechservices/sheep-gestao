'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState } from 'react'

// ── Strip HTML to plain text (for AI context) ─────────────────────────────────
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n---\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Toolbar button ─────────────────────────────────────────────────────────────
function ToolBtn({
  active, disabled, title, onClick, children,
}: {
  active?: boolean
  disabled?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 26, height: 26, borderRadius: 5, border: 'none',
        background: active
          ? 'var(--primary-dim)'
          : hov ? 'var(--bg)' : 'transparent',
        color: active ? 'var(--primary-text)' : 'var(--gray)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, opacity: disabled ? 0.3 : 1,
        transition: 'background 0.1s, color 0.1s', flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 16, background: 'var(--gray3)', margin: '0 2px', flexShrink: 0 }} />
}

// ── Main component ─────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string        // HTML string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({ value, onChange, placeholder = 'Descreva o entregável...', minHeight = 120 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: [
          `min-height: ${minHeight}px`,
          'outline: none',
          'padding: 10px 12px',
          'font-size: 13px',
          'line-height: 1.65',
          'color: var(--black)',
          'font-family: inherit',
        ].join('; '),
      },
    },
  })

  // Sync external value changes (e.g. modal opens with existing task)
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value || '', false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  const btn = editor  // alias for brevity

  return (
    <div style={{
      border: '1.5px solid var(--gray3)',
      borderRadius: 10,
      background: 'var(--white)',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}
      onFocus={() => {}}
    >
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1,
        padding: '5px 8px',
        borderBottom: '1px solid var(--gray3)',
        background: 'var(--bg)',
        flexWrap: 'wrap',
      }}>
        {/* Heading */}
        <ToolBtn title="Título 1" active={btn.isActive('heading', { level: 1 })} onClick={() => btn.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </ToolBtn>
        <ToolBtn title="Título 2" active={btn.isActive('heading', { level: 2 })} onClick={() => btn.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolBtn>

        <Divider />

        {/* Inline marks */}
        <ToolBtn title="Negrito (Ctrl+B)" active={btn.isActive('bold')} onClick={() => btn.chain().focus().toggleBold().run()}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M3 2h3.5a2 2 0 010 4H3V2zM3 6h4a2 2 0 010 4H3V6z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Itálico (Ctrl+I)" active={btn.isActive('italic')} onClick={() => btn.chain().focus().toggleItalic().run()}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M7 2H5M9 10H5M7 2l-2 8M7 2h0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Tachado" active={btn.isActive('strike')} onClick={() => btn.chain().focus().toggleStrike().run()}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            <path d="M4 3c0-1 .7-1.5 2-1.5 1.2 0 2 .6 2 1.5M4.5 9c.3.8 1 1.3 1.8 1.3 1.2 0 1.7-.8 1.7-1.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Código inline" active={btn.isActive('code')} onClick={() => btn.chain().focus().toggleCode().run()}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M4 3L1 6l3 3M8 3l3 3-3 3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn title="Lista com marcadores" active={btn.isActive('bulletList')} onClick={() => btn.chain().focus().toggleBulletList().run()}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <circle cx="1.5" cy="3" r="1" fill="currentColor"/>
            <circle cx="1.5" cy="6" r="1" fill="currentColor"/>
            <circle cx="1.5" cy="9" r="1" fill="currentColor"/>
            <path d="M4 3h8M4 6h8M4 9h8" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Lista numerada" active={btn.isActive('orderedList')} onClick={() => btn.chain().focus().toggleOrderedList().run()}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <path d="M1 2h1v4M1 6h2M4.5 3h8M4.5 6h8M4.5 9h8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 9.5c0-.8 2-1 2-.5 0 .8-2 1.5-2 2h2" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Bloco de citação" active={btn.isActive('blockquote')} onClick={() => btn.chain().focus().toggleBlockquote().run()}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M1 4c0-1 .7-1.5 1.5-1.5S4 3 4 4s-.7 1.5-1.5 1.5L2 6.5V8M7 4c0-1 .7-1.5 1.5-1.5S10 3 10 4s-.7 1.5-1.5 1.5L8 6.5V8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Block */}
        <ToolBtn title="Bloco de código" active={btn.isActive('codeBlock')} onClick={() => btn.chain().focus().toggleCodeBlock().run()}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <rect x="1" y="1.5" width="11" height="9" rx="2" stroke="currentColor" strokeWidth={1.3}/>
            <path d="M4 5L2.5 6.5 4 8M9 5l1.5 1.5L9 8M6 4.5l1 3" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Divisor horizontal" onClick={() => btn.chain().focus().setHorizontalRule().run()}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <path d="M1 6h11" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="1.5 2"/>
            <circle cx="1" cy="6" r="0.8" fill="currentColor"/>
            <circle cx="12" cy="6" r="0.8" fill="currentColor"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn title="Desfazer (Ctrl+Z)" disabled={!btn.can().undo()} onClick={() => btn.chain().focus().undo().run()}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M2 5H7a3 3 0 010 6H4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 5L4 3M2 5l2 2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Refazer (Ctrl+Y)" disabled={!btn.can().redo()} onClick={() => btn.chain().focus().redo().run()}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M10 5H5a3 3 0 000 6h3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 5L8 3M10 5l-2 2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
      </div>

      {/* ── Editor area ────────────────────────────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* ── Global styles injected once ────────────────────────────────────── */}
      <style>{`
        .tiptap { outline: none; }
        .tiptap p { margin: 0 0 6px; }
        .tiptap p:last-child { margin-bottom: 0; }
        .tiptap h1 { font-size: 16px; font-weight: 800; margin: 8px 0 4px; color: var(--black); }
        .tiptap h2 { font-size: 14px; font-weight: 700; margin: 6px 0 4px; color: var(--black); }
        .tiptap h3 { font-size: 13px; font-weight: 700; margin: 4px 0 3px; color: var(--black); }
        .tiptap ul { margin: 4px 0; padding-left: 20px; }
        .tiptap ol { margin: 4px 0; padding-left: 20px; }
        .tiptap li { margin: 2px 0; }
        .tiptap li p { margin: 0; }
        .tiptap blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 10px;
          margin: 6px 0;
          color: var(--gray);
          font-style: italic;
        }
        .tiptap code {
          background: var(--bg);
          border: 1px solid var(--gray3);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
        }
        .tiptap pre {
          background: var(--bg);
          border: 1px solid var(--gray3);
          border-radius: 7px;
          padding: 10px 12px;
          margin: 6px 0;
          overflow-x: auto;
        }
        .tiptap pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 12px;
        }
        .tiptap hr {
          border: none;
          border-top: 1.5px dashed var(--gray3);
          margin: 10px 0;
        }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap s { text-decoration: line-through; color: var(--gray2); }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--gray2);
          opacity: 0.6;
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  )
}
