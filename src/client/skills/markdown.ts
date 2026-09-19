/**
 * skills/markdown — 技能内容预览的极简 markdown 渲染（零外部依赖，只拼 HTML 字符串）。
 */
/** ---------------------------------------------------------------- markdown 预览 */

// 技能内容预览：极简 markdown 渲染（frontmatter 隐藏，标题/列表/代码块/粗体/行内代码/链接）。
export function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function inlineMd(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

export function renderSkillMarkdown(text: string): string {
  const body = String(text).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
  const lines = body.split('\n')
  let html = ''
  let inCode = false
  let codeBuf: string[] = []
  let inList = false
  let inQuote = false
  const closeList = (): void => {
    if (inList) { html += '</ul>'; inList = false }
  }
  const closeQuote = (): void => {
    if (inQuote) { html += '</blockquote>'; inQuote = false }
  }
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      if (inCode) {
        html += '<pre>' + escapeHtml(codeBuf.join('\n')) + '</pre>'
        codeBuf = []
        inCode = false
      } else {
        closeList(); closeQuote()
        inCode = true
      }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }
    if (trimmed === '---' || trimmed === '***') {
      closeList(); closeQuote()
      html += '<hr>'
      continue
    }
    if (trimmed.startsWith('>')) {
      if (!inQuote) { closeList(); html += '<blockquote>'; inQuote = true }
      html += '<p>' + inlineMd(trimmed.replace(/^>\s?/, '')) + '</p>'
      continue
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed)
    if (heading !== null) {
      closeList(); closeQuote()
      // 直接用真实层级（# → h1 …… ###### → h6）：查看器字号一档一档拉得开，
      // 旧写法把 # 压成 h3，一级标题只有 15px，整篇文档看起来像没放大。
      const level = Math.min(heading[1].length, 6)
      html += `<h${String(level)}>` + inlineMd(heading[2]) + `</h${String(level)}>`
      continue
    }
    const item = /^[-*]\s+(.*)$/.exec(trimmed)
    if (item !== null) {
      if (!inList) { closeQuote(); html += '<ul>'; inList = true }
      html += '<li>' + inlineMd(item[1]) + '</li>'
      continue
    }
    closeList(); closeQuote()
    if (trimmed === '') { html += '<p></p>'; continue }
    html += '<p>' + inlineMd(trimmed) + '</p>'
  }
  closeList(); closeQuote()
  if (inCode) html += '<pre>' + escapeHtml(codeBuf.join('\n')) + '</pre>'
  return html
}
