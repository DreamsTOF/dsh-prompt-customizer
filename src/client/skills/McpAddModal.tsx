/**
 * skills/McpAddModal — 粘贴添加 MCP Server（JSON / DSH 原生 YAML：校验预览 → 落盘）。
 */
import { useState } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { GuideArtIconSmall } from './icons.js'
import { css } from './styles.js'

/**
 * 粘贴添加 MCP：JSON（其它 harness 的 `.mcp.json` 形态）或 DSH 原生 YAML，
 * 先「校验并预览」（宿主解析，带行号报错），确认后写入目标（全局 patch / 预设）。
 * 一次粘贴可含多个 server；已存在的 serverName 自动跳过。
 */
export function McpPasteAdd({ t, presetId, onAdded, onCancel }: {
  t: (key: string, params?: Record<string, string | number>) => string
  /** 目标预设；undefined = 全局 profile patch。 */
  presetId?: string
  /** 添加成功回调：带上本次新增的 serverName（面板据此自动等工具注册）。 */
  onAdded: (added: string[]) => void
  onCancel: () => void
}): JSX.Element {
  const [format, setFormat] = useState<'json' | 'yaml'>('json')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<'preview' | 'add' | null>(null)
  const [preview, setPreview] = useState<{ names: string[]; yaml: string } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const target = presetId === undefined ? 'global' : 'preset'
  const placeholder = format === 'json'
    ? '{ "mcpServers": { "my-server": { "command": "npx", "args": ["-y", "@scope/mcp-server"] } } }'
    : 'mcpServers:\n  my-server:\n    command: npx\n    args: ["-y", "@scope/mcp-server"]'
  const empty = text.trim() === ''

  const call = (path: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> =>
    fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const body = await response.json().catch(() => null) as Record<string, unknown> | null
      return body ?? { ok: false, error: `HTTP ${response.status}` }
    })

  const reset = (): void => { setErrors([]); setWarnings([]); setNotice(null); setPreview(null) }

  const previewNow = (): void => {
    if (busy !== null || empty) return
    setBusy('preview'); reset()
    void call('/api/triad/mcp-preview', { format, text, target })
      .then((body) => {
        const list = Array.isArray(body.errors) ? (body.errors as string[]) : []
        setErrors(list)
        if (Array.isArray(body.warnings)) setWarnings(body.warnings as string[])
        if (typeof body.yaml === 'string') {
          const servers = Array.isArray(body.servers) ? (body.servers as Array<{ name?: unknown }>) : []
          setPreview({ names: servers.map(item => String(item.name ?? '')), yaml: body.yaml })
        }
        if (list.length === 0 && typeof body.error === 'string') setErrors([body.error])
      })
      .catch((error: unknown) => { setErrors([error instanceof Error ? error.message : String(error)]) })
      .finally(() => { setBusy(null) })
  }

  const addNow = (): void => {
    if (busy !== null || empty) return
    setBusy('add'); reset()
    const path = presetId === undefined
      ? '/api/triad/mcp-config'
      : `/api/triad/mcp-presets/${encodeURIComponent(presetId)}/servers`
    const payload = presetId === undefined ? { action: 'add', format, text } : { format, text }
    void call(path, payload)
      .then((body) => {
        const list = Array.isArray(body.errors) ? (body.errors as string[]) : []
        if (list.length > 0) {
          setErrors(list)
          if (Array.isArray(body.warnings)) setWarnings(body.warnings as string[])
          return
        }
        if (body.ok !== true) { setErrors([String(body.error ?? t('mcpPasteFailed'))]); return }
        const added = Array.isArray(body.added) ? (body.added as string[]) : []
        const skipped = Array.isArray(body.skipped) ? (body.skipped as number | string[]) : []
        setNotice(t('mcpPasteAdded', { added: added.length, skipped: Array.isArray(skipped) ? skipped.length : Number(skipped) }))
        if (Array.isArray(body.warnings)) setWarnings(body.warnings as string[])
        onAdded(added)
      })
      .catch((error: unknown) => { setErrors([error instanceof Error ? error.message : String(error)]) })
      .finally(() => { setBusy(null) })
  }

  return (
    <div className={css.mcpAddForm}>
      <p className={css.installHint}>
        {t('mcpPasteHint', { scope: presetId === undefined ? t('mcpPasteScopeGlobal') : `${t('mcpPasteScopePreset')} “${presetId}”` })}
      </p>
      <div className={css.installRow}>
        <div className={css.mcpAddTypeRow} role="group" aria-label={t('mcpPasteFormat')}>
          {(['json', 'yaml'] as const).map(value => (
            <button
              key={value}
              type="button"
              className={`${css.mcpAddTypeBtn} ${format === value ? css.mcpAddTypeActive : ''}`}
              data-active={format === value || undefined}
              aria-pressed={format === value}
              onClick={() => { setFormat(value); reset() }}
            >
              {value.toUpperCase()}{value === 'yaml' ? ` · ${t('mcpPasteNative')}` : ''}
            </button>
          ))}
        </div>
      </div>
      <textarea
        className={css.inlineInput}
        value={text}
        placeholder={placeholder}
        aria-label={t('mcpPasteFormat')}
        rows={8}
        spellCheck={false}
        autoFocus
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
          fontSize: 12,
          lineHeight: '18px',
          minHeight: 120,
          resize: 'vertical',
          whiteSpace: 'pre',
        }}
        onChange={(event) => { setText(event.currentTarget.value); reset() }}
      />
      {errors.length > 0 && (
        <div className={css.error} role="alert">
          {errors.map(item => <div key={item}>{item}</div>)}
        </div>
      )}
      {warnings.length > 0 && (
        <div className={css.installHint} role="status">
          {warnings.map(item => <div key={item}>· {item}</div>)}
        </div>
      )}
      {preview !== null && (
        <div>
          <p className={css.installHint}>{t('mcpPasteParsed', { n: preview.names.length, names: preview.names.join(', ') })}</p>
          <pre style={{
            margin: 0,
            maxHeight: 200,
            overflow: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
            fontSize: 11,
            lineHeight: '16px',
            whiteSpace: 'pre-wrap',
          }}>{preview.yaml}</pre>
        </div>
      )}
      {notice !== null && <p className={css.mcpCopyHint} role="status">{notice}</p>}
      <div className={css.inlineForm}>
        <Button variant="outline" type="button" disabled={busy !== null || empty} onClick={previewNow}>
          {busy === 'preview' ? t('mcpPasteChecking') : t('mcpPasteCheck')}
        </Button>
        <Button variant="primary" type="button" disabled={busy !== null || empty} onClick={addNow}>
          {busy === 'add' ? t('mcpPasteAdding') : t('mcpAddConfirm')}
        </Button>
        <Button variant="outline" type="button" onClick={onCancel}>{t('cancel')}</Button>
      </div>
    </div>
  )
}

/** 添加全局 MCP Server 弹窗：粘贴 JSON / DSH 原生 YAML，直接写入 profile patch。 */
export function McpAddModal({ t, open, onClose, onAdded }: {
  t: (key: string) => string
  open: boolean
  onClose: () => void
  onAdded: (added: string[]) => void
}): JSX.Element {
  return (
    <Modal open={open} onClose={onClose} closeLabel={t('close')} title={t('mcpAddModalTitle')}>
      <McpPasteAdd t={t} onAdded={onAdded} onCancel={onClose} />
    </Modal>
  )
}

/** 指南面板 logo：小书块。 */
export function GuideArtIconSmall(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="2" width="13" height="12" rx="2.5" fill="var(--dsw-alias-state-business-primary,#3d6be5)" />
      <path d="M4.5 5h7M4.5 8h7M4.5 11h4.5" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

