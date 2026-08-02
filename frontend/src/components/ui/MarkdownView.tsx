import type { ReactNode } from 'react'

type MarkdownViewProps = {
  markdown: string
  className?: string
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`b-${key++}`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`i-${key++}`}>{token.slice(1, -1)}</em>)
    } else {
      nodes.push(token)
    }
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function renderBlock(line: string, key: number): ReactNode {
  if (line.startsWith('### ')) {
    return <h3 key={key}>{renderInline(line.slice(4))}</h3>
  }
  if (line.startsWith('## ')) {
    return <h2 key={key}>{renderInline(line.slice(3))}</h2>
  }
  if (line.startsWith('# ')) {
    return <h1 key={key}>{renderInline(line.slice(2))}</h1>
  }
  return (
    <p key={key} className="markdown-view__p">
      {renderInline(line)}
    </p>
  )
}

/**
 * Small safe Markdown renderer (headings, paragraphs, bold/italic, lists).
 * Does not interpret raw HTML.
 */
export function MarkdownView({ markdown, className }: MarkdownViewProps) {
  const source = markdown?.trim() ?? ''
  if (!source) {
    return null
  }

  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) {
      return
    }
    blocks.push(
      <ul key={`ul-${key++}`}>
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const listMatch = line.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      listItems.push(listMatch[1])
      continue
    }
    flushList()
    if (line.trim() === '') {
      continue
    }
    blocks.push(renderBlock(line.trim(), key++))
  }
  flushList()

  return (
    <div className={className ? `markdown-view ${className}` : 'markdown-view'}>
      {blocks}
    </div>
  )
}
