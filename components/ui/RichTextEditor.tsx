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

function getClosestLi(node: Node | null): HTMLElement | null {
  if (!node) return null
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element
  return el?.closest('li') as HTMLElement | null
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
  const internalRef  = useRef(false)
  const [, rerender] = useState(0)

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

  // ── Checklist: insert or toggle off ────────────────────────────────────────
  const insertChecklist = () => {
    const el = editorRef.current
    if (!el) return
    el.focus()

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const li = getClosestLi(sel.getRangeAt(0).startContainer)
    if (li?.closest('ul.rte-checklist')) {
      // Already in checklist → convert back to plain list
      const ul = li.closest('ul.rte-checklist') as HTMLElement
      ul.classList.remove('rte-checklist')
      ul.querySelectorAll('.rte-chk').forEach(s => s.remove())
      ul.querySelectorAll('li[data-checked]').forEach(l => l.removeAttribute('data-checked'))
    } else {
      // Insert new checklist
      cmd('insertHTML',
        '<ul class="rte-checklist"><li data-checked="false">' +
        '<span class="rte-chk" contenteditable="false"></span>​</li></ul>'
      )
      // Place cursor after the rte-chk span
      setTimeout(() => {
        const newLi = el.querySelector('ul.rte-checklist li:last-child')
        if (!newLi) return
        const textNode = Array.from(newLi.childNodes).find(n => n.nodeType === Node.TEXT_NODE)
        if (textNode) {
          const r = document.createRange()
          r.setStart(textNode, (textNode.textContent ?? '').length)
          r.collapse(true)
          sel.removeAllRanges()
          sel.addRange(r)
        }
      }, 0)
    }
    rerender(n => n + 1)
    setTimeout(handleInput, 0)
  }

  // ── Click: toggle checkbox ──────────────────────────────────────────────────
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element
    if (target.classList.contains('rte-chk')) {
      const li = target.closest('li')
      if (li) {
        const checked = li.getAttribute('data-checked') === 'true'
        li.setAttribute('data-checked', String(!checked))
        handleInput()
        e.preventDefault()
      }
    }
  }

  // ── Key handler ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const sel = window.getSelection()

    // ── Tab: indent/outdent ────────────────────────────────────────────────────
    if (e.key === 'Tab') {
      e.preventDefault()
      if (isActive('insertUnorderedList') || isActive('insertOrderedList')) {
        cmd(e.shiftKey ? 'outdent' : 'indent')
      } else {
        cmd('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
      }
      rerender(n => n + 1)
      setTimeout(handleInput, 0)
      return
    }

    // ── Enter in checklist ─────────────────────────────────────────────────────
    if (e.key === 'Enter' && sel && sel.rangeCount > 0) {
      const li = getClosestLi(sel.getRangeAt(0).startContainer)
      if (li?.closest('ul.rte-checklist')) {
        const textContent = (li.textContent ?? '').replace(/​/g, '').trim()

        if (!textContent) {
          // Empty item → exit checklist, insert paragraph
          e.preventDefault()
          const ul = li.closest('ul')!
          li.remove()
          const p = document.createElement('p')
          p.innerHTML = '<br>'
          if (ul.children.length === 0) {
            ul.replaceWith(p)
          } else {
            ul.after(p)
          }
          const r = document.createRange()
          r.setStart(p, 0)
          r.collapse(true)
          sel.removeAllRanges()
          sel.addRange(r)
          rerender(n => n + 1)
          setTimeout(handleInput, 0)
          return
        }

        // Non-empty → let browser create new <li>, then inject rte-chk span
        setTimeout(() => {
          const sel2 = window.getSelection()
          if (!sel2 || sel2.rangeCount === 0) return
          const newLi = getClosestLi(sel2.getRangeAt(0).startContainer)
          if (newLi && newLi.closest('ul.rte-checklist') && !newLi.querySelector('.rte-chk')) {
            const chk = document.createElement('span')
            chk.className = 'rte-chk'
            chk.contentEditable = 'false'
            newLi.setAttribute('data-checked', 'false')
            newLi.prepend(chk)
          }
          rerender(n => n + 1)
          setTimeout(handleInput, 0)
        }, 0)
        return
      }
    }

    // ── Space triggers ──────────────────────────────────────────────────────────
    if (e.key === ' ' && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (range.collapsed) {
        const node = range.startContainer
        const textBefore = node.nodeType === Node.TEXT_NODE
          ? (node.textContent ?? '').slice(0, range.startOffset)
          : ''

        // "- " → bullet list
        if (textBefore === '-') {
          e.preventDefault()
          const del = range.cloneRange()
          del.setStart(node, range.startOffset - 1)
          del.deleteContents()
          cmd('insertUnorderedList')
          rerender(n => n + 1)
          setTimeout(handleInput, 0)
          return
        }

        // "[ " → checklist
        if (textBefore === '[') {
          e.preventDefault()
          const del = range.cloneRange()
          del.setStart(node, range.startOffset - 1)
          del.deleteContents()
          insertChecklist()
          return
        }
      }
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

  // Checklist active state: cursor inside a rte-checklist
  const selNode = (() => {
    try { return window.getSelection()?.getRangeAt(0).startContainer ?? null } catch { return null }
  })()
  const checklist = !!(selNode && getClosestLi(selNode)?.closest('ul.rte-checklist'))

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
        {/* Checklist */}
        <ToolBtn title="Checklist (ou digite '[ ')" active={checklist} onCmd={insertChecklist}>
          <svg width={13} height={12} viewBox="0 0 13 12" fill="none">
            <rect x="1" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth={1.3}/>
            <path d="M2 3.5l1 1 1.5-1.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="1" y="6.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth={1.3}/>
            <path d="M7 4h5M7 9h5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
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
        onClick={handleClick}
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
        [contenteditable] ul ul { list-style-type: circle; }
        [contenteditable] ul ul ul { list-style-type: square; }
        [contenteditable] ol ol { list-style-type: lower-alpha; }
        [contenteditable] ol ol ol { list-style-type: lower-roman; }
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

        /* ── Checklist ── */
        [contenteditable] ul.rte-checklist {
          list-style: none;
          padding-left: 2px;
          margin: 4px 0;
        }
        [contenteditable] ul.rte-checklist > li {
          position: relative;
          padding-left: 22px;
          margin: 4px 0;
          min-height: 18px;
          display: block;
        }
        .rte-chk {
          position: absolute;
          left: 0;
          top: 3px;
          width: 14px;
          height: 14px;
          border: 1.5px solid var(--gray2);
          border-radius: 3px;
          background: var(--bg);
          cursor: pointer;
          display: inline-block;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
          user-select: none;
        }
        .rte-chk:hover {
          border-color: var(--primary);
          background: var(--primary-dim);
        }
        [contenteditable] ul.rte-checklist > li[data-checked="true"] > .rte-chk {
          background: var(--primary);
          border-color: var(--primary);
        }
        [contenteditable] ul.rte-checklist > li[data-checked="true"] > .rte-chk::after {
          content: '';
          position: absolute;
          left: 2px;
          top: 1px;
          width: 7px;
          height: 4px;
          border-left: 1.5px solid #fff;
          border-bottom: 1.5px solid #fff;
          transform: rotate(-45deg);
          display: block;
        }
        [contenteditable] ul.rte-checklist > li[data-checked="true"] {
          color: var(--gray2);
          text-decoration: line-through;
        }
      `}</style>
    </div>
  )
}
