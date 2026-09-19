/**
 * skills/McpView — MCP 页主区：编辑层提示行 + Server 列表。
 *
 * 搜索、计数分段、连接状态与刷新/添加按钮都在顶栏（McpTopBar）；这里只负责
 * 两个列表块：「继承的全局 Server」（预设层开关 = 遮蔽）与「该预设专属 Server」，
 * 每张卡片带工具级 chips（绿 = 启用、灰 = 禁用，点一下即切换）。
 */
import { useState } from 'react'
import {
  IconAgentPresetOutline16, IconArchiveOutline20, IconChevronDownOutline14, IconTrashOutline16, Modal, Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { ConfirmDialog } from '../confirm-dialog'
import { LockGlyph } from './icons.js'
import { McpPasteAdd } from './McpAddModal.js'
import { isToolRegistrationPending, type LiveMcpState, type LiveMcpStatus, type LiveMcpTool } from './mcp-live.js'
import { css } from './styles.js'
/**
 * 工具 chips：卡片上列出该 MCP 提供的**全部**工具名，绿 = 启用、灰 = 禁用，
 * 点击即切换（单个工具级 disabled，见 host 的 mcp-tool-disable）。
 *
 * 名单 = 注册工具 ∪ 账本禁用名：被禁用的工具在 agent 作用域里已被隐藏
 * （restrict），但账本仍留着名字，所以还能点回来。
 */
/** 卡片要列出的工具全名：注册列表 ∪ 账本禁用名（被隐藏的也要能点回来）。 */
export function mcpToolNames(tools: LiveMcpTool[], disabledTools: string[]): string[] {
  const known = new Set(tools.map(tool => tool.name))
  return [...tools.map(tool => tool.name), ...disabledTools.filter(name => !known.has(name))]
}

export function McpToolChips({ t, serverName, tools, disabledTools, locked, busy, onToggle }: {
  t: (key: string, params?: Record<string, string | number>) => string
  serverName: string
  tools: LiveMcpTool[]
  disabledTools: string[]
  /** 预设范围下「全局层已禁用」的名字：预设层只能加禁，不能打开它们。 */
  locked?: ReadonlySet<string>
  busy: string | null
  onToggle: (fullName: string, enabled: boolean) => void
}): JSX.Element | null {
  const prefix = `mcp__${serverName}__`
  const names = mcpToolNames(tools, disabledTools)
  if (names.length === 0) return null
  const off = new Set(disabledTools)
  return (
    <div className={css.mcpToolChips} role="group" aria-label={t('mcpToolChipsAria', { name: serverName })}>
      {names.map((name) => {
        const disabled = off.has(name)
        const isLocked = locked?.has(name) === true
        const short = name.startsWith(prefix) ? name.slice(prefix.length) : name
        const description = tools.find(tool => tool.name === name)?.description ?? ''
        return (
          <button
            key={name}
            type="button"
            className={css.mcpToolChip}
            data-on={disabled ? undefined : 'true'}
            data-locked={isLocked || undefined}
            data-busy={busy === name || undefined}
            disabled={busy !== null || isLocked}
            aria-pressed={!disabled}
            title={isLocked
              ? `${t('mcpToolGlobalOffTip')}\n${name}`
              : `${disabled ? t('mcpToolClickEnable') : t('mcpToolClickDisable')}\n${name}${description === '' ? '' : `\n${description}`}`}
            onClick={() => { onToggle(name, disabled) }}
          >
            {isLocked && <LockGlyph size={9} />}
            {short}
          </button>
        )
      })}
    </div>
  )
}

/**
 * MCP 页（与技能页同构）：四张统计卡 + 当前编辑层提示行 + 工具条（搜索 / 刷新 /
 * 添加）+ Server 列表。列表固定两块——「继承的全局 Server」（预设层开关 = 遮蔽）
 * 与「该预设专属 Server」（写进该预设组合文件）；「全部 Agent」层只有前者，
 * 开关直接启用/禁用全局条目。
 */
export function McpView({ t, live, scope, query, status, onRefresh, waitingTools, onWatchTools, addOwnOpen, onCloseAddOwn }: {
  t: (key: string, params?: Record<string, string | number>) => string
  live: LiveMcpStatus
  scope: string
  query: string
  status: 'all' | 'on' | 'off'
  onRefresh: () => void
  /** 正在等待注册工具的 Server（面板在轮询，无需用户手动刷新）。 */
  waitingTools: string[]
  /** 让面板开始轮询这些 Server 的工具注册（启用后自动等）。 */
  onWatchTools: (names: string[]) => void
  /** 「添加专属 Server」弹窗开关：按钮在顶栏，状态由面板持有。 */
  addOwnOpen: boolean
  onCloseAddOwn: () => void
}): JSX.Element {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** 两个列表块的折叠态（默认展开，点标题行收起）。 */
  const [globalOpen, setGlobalOpen] = useState(true)
  const [ownOpen, setOwnOpen] = useState(true)
  /** 正在切换的工具全名（防连点）。 */
  const [toolBusy, setToolBusy] = useState<string | null>(null)
  /** 全局条目删除确认（null=关闭）。 */
  const [removeReq, setRemoveReq] = useState<string | null>(null)
  /** 预设专属行移除确认（null=关闭）。 */
  const [removeOwnReq, setRemoveOwnReq] = useState<string | null>(null)

  const ready = live.state === 'ready' ? live.data : null
  const globals = ready?.servers ?? []
  const presets = ready?.presets ?? []
  const scoped = scope === '' ? undefined : presets.find(preset => preset.id === scope)
  const masked = new Set(Object.entries(ready?.masks?.[scope] ?? {})
    .filter(([, on]) => on === false).map(([name]) => name))
  const ownRows = scope === '' ? [] : (ready?.presetServers?.[scope] ?? [])
  const ownNames = new Set(ownRows.map(row => row.serverName))
  /* 工具级禁用两层账本：有效禁用 = 全局层 ∪ 当前预设层（预设层只加禁，不打开）。
   * 预设自带的卡只看预设层 —— 与继承来的全局 Server 彻底分离（不同名前缀也不会互相牵连）。 */
  const globalOff = ready?.toolDisabled ?? {}
  const presetTables = ready?.toolDisabledByPreset ?? {}
  /**
   * 某条「行」的有效禁用集合（同名也彻底独立）：
   *   inherit（继承的全局行）= 全局层 ∪ inherit 条目；own（预设自带行）= 仅 own 条目。
   * 两条行各记一份账，互不牵连 —— 撤掉其中一条时另一条的设置各自生效。
   */
  const offOf = (serverName: string, owner: 'own' | 'inherit'): string[] => {
    const entry = presetTables[scope]?.[serverName]
    if (owner === 'own') return entry?.own ?? []
    if (scope === '') return globalOff[serverName] ?? []
    return [...new Set([...(globalOff[serverName] ?? []), ...(entry?.inherit ?? [])])]
  }
  /** 全局层已禁用的名字：继承行无法在预设层打开它（与技能面板同模型）。 */
  const lockedOf = (serverName: string): Set<string> => new Set(scope === '' ? [] : globalOff[serverName] ?? [])
  /**
   * 遮蔽诊断：账本里标了「已遮蔽」但运行期一个工具都没拒到（或安装报错）时
   * 给出说明 —— 以前这种情况是静默的，面板看着「已遮蔽」但模型端工具照旧可见。
   */
  const maskInstall = ready?.maskInstall?.[scope]
  const maskWarn: string | null = (() => {
    if (scope === '' || masked.size === 0 || maskInstall === undefined) return null
    if (maskInstall.errors.length > 0) return t('mcpMaskInstallFailed', { message: maskInstall.errors[0]! })
    if (maskInstall.agents === 0) return t('mcpMaskNoAgent')
    if (maskInstall.deniedAgents === 0) return t('mcpMaskNoDeny')
    return null
  })()

  /** 统一写请求：成功刷新数据，失败收集错误文案。 */
  const write = (token: string, url: string, payload: Record<string, unknown>): void => {
    if (busy !== null) return
    setBusy(token)
    setError(null)
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
        if (response.ok && body?.ok === true) { onRefresh(); return }
        throw new Error(body?.error ?? String(response.status))
      })
      .catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : String(cause)) })
      .finally(() => { setBusy(null) })
  }
  const toggleGlobal = (serverName: string, disabled: boolean): void => {
    write(`toggle:${serverName}`, '/api/triad/mcp-config', { serverName, disabled })
  }
  const removeGlobal = (serverName: string): void => {
    write(`remove:${serverName}`, '/api/triad/mcp-config', { serverName, action: 'remove' })
  }
  const setMasked = (serverName: string, enabled: boolean): void => {
    if (busy !== null) return
    setBusy(`mask:${serverName}`)
    setError(null)
    void fetch(`/api/triad/mcp-masks/${encodeURIComponent(scope)}/${encodeURIComponent(serverName)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ enabled }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
        if (response.ok && body?.ok === true) { onRefresh(); return }
        throw new Error(body?.error ?? String(response.status))
      })
      .catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : String(cause)) })
      .finally(() => { setBusy(null) })
  }
  /**
   * 工具级启停（单条或多条一批）：`PUT /api/triad/mcp-tools/<server>`
   * `{ enabled, tools, preset?, source? }`。范围决定写哪条「行」：
   * 「全部 Agent」→ 全局行；某个预设 → 该预设层（`source` 指定哪条行）。
   */
  const putTools = (serverName: string, names: string[], enabled: boolean, source: 'own' | 'inherit'): void => {
    if (names.length === 0 || toolBusy !== null || busy !== null) return
    setToolBusy(names[0]!)
    setError(null)
    void fetch(`/api/triad/mcp-tools/${encodeURIComponent(serverName)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ enabled, tools: names, ...(scope === '' ? {} : { preset: scope, source }) }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
        if (response.ok && body?.ok === true) { onRefresh(); return }
        throw new Error(body?.error ?? String(response.status))
      })
      .catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : String(cause)) })
      .finally(() => { setToolBusy(null) })
  }
  const toggleTool = (serverName: string, fullName: string, enabled: boolean, source: 'own' | 'inherit'): void => {
    putTools(serverName, [fullName], enabled, source)
  }
  const removeOwn = (serverName: string): void => {
    if (busy !== null) return
    setBusy(`own:${serverName}`)
    setError(null)
    void fetch(`/api/triad/mcp-presets/${encodeURIComponent(scope)}/servers/${encodeURIComponent(serverName)}`, {
      method: 'DELETE', headers: { accept: 'application/json' },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
        if (response.ok && body?.ok === true) { onRefresh(); return }
        throw new Error(body?.error ?? String(response.status))
      })
      .catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : String(cause)) })
      .finally(() => { setBusy(null) })
  }
  /** 一键清空该预设的遮蔽（顺序逐个取消，避免并发写账本互相覆盖）。 */
  const clearMasks = (): void => {
    if (busy !== null || masked.size === 0) return
    setBusy('mask:__all__')
    setError(null)
    const names = [...masked]
    void (async () => {
      for (const serverName of names) {
        const response = await fetch(`/api/triad/mcp-masks/${encodeURIComponent(scope)}/${encodeURIComponent(serverName)}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ enabled: true }),
        })
        const body = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
        if (!(response.ok && body?.ok === true)) throw new Error(body?.error ?? String(response.status))
      }
      onRefresh()
    })()
      .catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : String(cause)) })
      .finally(() => { setBusy(null) })
  }

  /* 过滤：搜索命中 serverName 或工具名；状态档在全局层看启用状态、预设层看遮蔽。 */
  const needle = query.trim().toLowerCase()
  const shownGlobals = globals.filter(server => (needle === ''
    || server.serverName.toLowerCase().includes(needle)
    || server.tools.some(tool => tool.name.toLowerCase().includes(needle)))
    && (status === 'all'
      || (scope === '' ? (status === 'off' ? server.config.disabled : !server.config.disabled)
        : (status === 'off' ? masked.has(server.serverName) : !masked.has(server.serverName)))))
  const shownOwn = ownRows.filter(row => needle === ''
    || row.serverName.toLowerCase().includes(needle)
    || row.summary.toLowerCase().includes(needle))

  return (
    <div className={css.mcpServerMain}>
      {/* 当前编辑层提示行（与技能页 hintRow 同构） */}
      <div className={css.hintRow}>
        <span className={css.hintRowText}>
          {scope === ''
            ? t('mcpScopeHintAll')
            : t('mcpScopeHintScoped', { name: scoped?.name ?? scope })}
        </span>
        {scope !== '' && masked.size > 0 && (
          <button type="button" className={css.presetReset} disabled={busy !== null} onClick={clearMasks}>
            {t('presetReset')}
          </button>
        )}
      </div>

      {error !== null && <p className={css.error} role="alert">{t('mcpPresetFailed', { message: error })}</p>}

      {/* 遮蔽诊断：账本写了但运行期没拒到工具/安装报错时，明确说出来 */}
      {maskWarn !== null && <p className={css.error} role="alert">{maskWarn}</p>}

      {/* 添加/启用后的自动等待：面板在轮询，用户不用再手动点「刷新」 */}
      {waitingTools.length > 0 && (
        <p className={css.mcpEmptyList} role="status">{t('mcpWaitingTools', { names: waitingTools.join('、') })}</p>
      )}

      {live.state === 'unavailable' ? (
        <p className={css.mcpEmptyList}>{t('mcpLiveUnavailable')}</p>
      ) : (
        <>
          {/* ① 继承的全局 Server（预设层开关 = 遮蔽）；标题行可折叠，与技能页技能包同构 */}
          <section className={css.hubSection} data-open={globalOpen ? 'true' : undefined}>
            <header className={css.bundleRowOuter} data-open={globalOpen ? 'true' : undefined}>
              <button
                type="button"
                className={css.bundleRow}
                aria-expanded={globalOpen}
                onClick={() => { setGlobalOpen((value) => !value) }}
              >
                <span className={css.bundleIcon} aria-hidden="true"><IconArchiveOutline20 size={16} /></span>
                <span className={css.bundleName}>{scope === '' ? t('mcpListTitle') : t('mcpPresetGlobalSection')}</span>
                <span className={css.bundleCount}>{shownGlobals.length}</span>
                <IconChevronDownOutline14 className={css.chevron} size={13} aria-hidden="true" />
              </button>
            </header>
            {globalOpen && (<>
            {scope !== '' && <p className={css.mcpEmptyList}>{t('mcpPresetMaskHint')}</p>}
            {shownGlobals.length === 0 ? (
              <p className={css.mcpEmptyList}>{globals.length === 0 ? t('mcpLiveEmpty') : t('mcpListFilteredEmpty')}</p>
            ) : (
              <div className={css.mcpRecGrid}>
                {shownGlobals.map((server) => {
                  const isMasked = masked.has(server.serverName)
                  const covered = ownNames.has(server.serverName)
                  const offTools = offOf(server.serverName, 'inherit')
                  const lockedTools = lockedOf(server.serverName)
                  const listed = server.tools.length
                  const pendingReg = isToolRegistrationPending(server.toolCount, listed)
                  /** 被「全部 Agent」层一票否决的工具数（预设视图里才可能 > 0）。 */
                  const lockedCount = mcpToolNames(server.tools, offTools).filter(name => lockedTools.has(name)).length
                  return (
                    <section key={`global-${server.serverName}`} className={css.mcpRecCard}>
                      <div className={css.mcpRecCardHead}>
                        <span className={css.mcpRecCardTitleRow}>
                          <span className={css.mcpRecCardName}>{server.serverName}</span>
                          <span className={css.mcpRecCardTags}>
                            {/* 数量跟随卡片实际列出的工具：进程还在连时先按名单缓存显示，并标出「等待注册」 */}
                            <span className={css.mcpRecCatTag}>
                              {server.toolCount > 0 ? server.toolCount : listed} {t('mcpLiveToolsOf')}
                            </span>
                            {pendingReg && (
                              <span className={css.mcpRecCatTag} data-off="true" title={t('mcpToolsPendingRegTip')}>
                                {t('mcpToolsPendingReg')}
                              </span>
                            )}
                            {/* 全局一票否决：预设层这些工具被强制置灰、不可拨动 */}
                            {lockedCount > 0 && (
                              <span className={css.mcpRecCatTag} data-locked="true" title={t('mcpToolGlobalOffTip')}>
                                {t('mcpToolGlobalOff')}{lockedCount > 1 ? ` ${lockedCount}` : ''}
                              </span>
                            )}
                            {offTools.length > 0 && (
                              <span className={css.mcpRecCatTag} data-off="true">{t('mcpToolDisabledCount', { n: offTools.length })}</span>
                            )}
                            {scope === ''
                              ? (server.config.disabled ? <span className={css.mcpRecCatTag}>{t('mcpLiveDisabled')}</span> : null)
                              : (isMasked ? <span className={css.mcpRecCatTag}>{t('mcpPresetMasked')}</span> : null)}
                          </span>
                        </span>
                        <Tooltip
                          label={scope === ''
                            ? (server.config.disabled ? t('enableSkill') : t('mcpLiveDisabled'))
                            : covered
                              ? t('mcpPresetCoveredSwitchHint')
                              : isMasked ? t('enableSkill') : t('mcpPresetMasked')}
                          side="bottom"
                          delayMs={500}
                        >
                          <button
                            type="button"
                            role="switch"
                            aria-checked={scope === '' ? !server.config.disabled : !isMasked}
                            aria-label={scope === '' ? t('mcpLiveDisabled') : t('mcpPresetMasked')}
                            className={`${css.toggle} ${(scope === '' ? server.config.disabled : isMasked) ? css.toggleOff : css.toggleOn}`}
                            /* 预设层：即使该预设自带同名 Server，也允许遮蔽全局这一条 ——
                             * 遮蔽是「本预设不要全局那份」的持久表达，等自带的被移除后即刻生效。 */
                            disabled={busy !== null || (scope === '' && !server.config.editable)}
                            onClick={() => {
                              if (scope === '') {
                                const nextDisabled = !server.config.disabled
                                toggleGlobal(server.serverName, nextDisabled)
                                // 启用 = 重新拉起进程并注册工具：开始轮询，别让用户等 / 手点刷新。
                                if (!nextDisabled) onWatchTools([server.serverName])
                              } else setMasked(server.serverName, isMasked)
                            }}
                          >
                            <span className={css.toggleKnob} aria-hidden="true" />
                          </button>
                        </Tooltip>
                      </div>
                      <p className={css.mcpRecCardDesc}>
                        {server.config.disabled && scope === '' && server.tools.length === 0
                          ? `${t('mcpLiveDisabled')} · ${t('mcpToolsUnavailable')}`
                          : t('mcpToolsHint')}
                      </p>
                      <McpToolChips
                        t={t}
                        serverName={server.serverName}
                        tools={server.tools}
                        disabledTools={offTools}
                        locked={lockedTools}
                        busy={toolBusy}
                        onToggle={(fullName, enabled) => { toggleTool(server.serverName, fullName, enabled, 'inherit') }}
                      />
                      <div className={css.mcpCardFoot}>
                        <span className={css.mcpCardItem}>
                          <span className={css.mcpCardItemLabel}>
                            {scope === '' ? t('mcpLiveConfigHint')
                              : covered
                                ? (isMasked ? t('mcpPresetCoveredMasked') : t('mcpPresetCovered'))
                                : isMasked ? t('mcpPresetMasked') : t('mcpPresetMaskState')}
                          </span>
                        </span>
                        {scope === '' && server.config.editable ? (
                          <button
                            type="button"
                            className={css.mcpCardDelete}
                            title={t('mcpRemove')}
                            disabled={busy !== null}
                            onClick={() => { setRemoveReq(server.serverName) }}
                          >
                            <IconTrashOutline16 size={13} aria-hidden="true" />{t('mcpRemove')}
                          </button>
                        ) : null}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
            </>)}
          </section>

          {/* ② 该预设专属 Server（写进该预设组合文件）；标题行同样可折叠 */}
          {scope !== '' && (
            <section className={css.hubSection} data-open={ownOpen ? 'true' : undefined}>
              <header className={css.bundleRowOuter} data-open={ownOpen ? 'true' : undefined}>
                <button
                  type="button"
                  className={css.bundleRow}
                  aria-expanded={ownOpen}
                  onClick={() => { setOwnOpen((value) => !value) }}
                >
                  <span className={css.bundleIcon} aria-hidden="true"><IconAgentPresetOutline16 size={16} /></span>
                  <span className={css.bundleName}>{t('mcpPresetOwnSection')}</span>
                  <span className={css.bundleCount}>{shownOwn.length}</span>
                  <IconChevronDownOutline14 className={css.chevron} size={13} aria-hidden="true" />
                </button>
              </header>
              {ownOpen && (<>
              <p className={css.mcpEmptyList}>{t('mcpPresetOwnHint')}</p>
              {scoped?.trust === 'system' && <p className={css.mcpEmptyList}>{t('mcpPresetStorageHint')}</p>}
              {shownOwn.length === 0 ? (
                <p className={css.mcpEmptyList}>{ownRows.length === 0 ? t('mcpPresetOwnEmpty') : t('mcpListFilteredEmpty')}</p>
              ) : (
                <div className={css.mcpRecGrid}>
                  {shownOwn.map(row => {
                    /* 预设自带的这条行只认 own 条目：全局行/继承行的设置与它互不影响。 */
                    const offOwn = offOf(row.serverName, 'own')
                    /** 一键全禁/全开：一次请求带上该行的全部工具名。 */
                    const ownToolNames = (row.tools ?? []).map(tool => tool.name)
                    const allDisabled = ownToolNames.length > 0 && ownToolNames.every(name => offOwn.includes(name))
                    return (
                    <section key={`own-${row.serverName}`} className={css.mcpRecCard}>
                      <div className={css.mcpRecCardHead}>
                        <span className={css.mcpRecCardTitleRow}>
                          <span className={css.mcpRecCardName}>{row.serverName}</span>
                          <span className={css.mcpRecCardTags}>
                            <span className={css.mcpRecCatTag}>{row.transport}</span>
                            <span className={css.mcpRecCatTag}>
                              {(row.registeredCount ?? 0) > 0 ? row.registeredCount : (row.tools?.length ?? 0)} {t('mcpLiveToolsOf')}
                            </span>
                            {isToolRegistrationPending(row.registeredCount ?? 0, row.tools?.length ?? 0) && (
                              <span className={css.mcpRecCatTag} data-off="true" title={t('mcpToolsPendingRegTip')}>
                                {t('mcpToolsPendingReg')}
                              </span>
                            )}
                            {globals.some(item => item.serverName === row.serverName) && (
                              <span className={css.mcpRecCatTag} data-shadow="true" title={t('mcpPresetShadowGlobalTip')}>
                                {t('mcpPresetShadowGlobalTag')}
                              </span>
                            )}
                            {offOwn.length > 0 && (
                              <span className={css.mcpRecCatTag} data-off="true">{t('mcpToolDisabledCount', { n: offOwn.length })}</span>
                            )}
                          </span>
                        </span>
                        {/* 一键全禁/全开：预设自带这台的「快速禁用全部工具」滑块 */}
                        <Tooltip
                          label={ownToolNames.length === 0
                            ? t('mcpToolsPendingRegTip')
                            : allDisabled
                              ? t('mcpToolAllEnable')
                              : offOwn.length > 0
                                ? `${t('mcpToolAllPartial')} · ${t('mcpToolAllDisable')}`
                                : t('mcpToolAllDisable')}
                          side="bottom"
                          delayMs={400}
                        >
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!allDisabled}
                            aria-label={t('mcpToolAllAria', { name: row.serverName })}
                            className={`${css.toggle} ${allDisabled ? css.toggleOff : css.toggleOn}`}
                            disabled={busy !== null || toolBusy !== null || ownToolNames.length === 0}
                            onClick={() => { putTools(row.serverName, ownToolNames, allDisabled, 'own') }}
                          >
                            <span className={css.toggleKnob} aria-hidden="true" />
                          </button>
                        </Tooltip>
                      </div>
                      <p className={css.mcpRecCardDesc}>{row.summary}</p>
                      <McpToolChips
                        t={t}
                        serverName={row.serverName}
                        tools={row.tools ?? []}
                        disabledTools={offOwn}
                        busy={toolBusy}
                        onToggle={(fullName, enabled) => { toggleTool(row.serverName, fullName, enabled, 'own') }}
                      />
                      <div className={css.mcpCardFoot}>
                        <span className={css.mcpCardItem}>
                          <span className={css.mcpCardItemLabel}>{t('mcpPresetNewSession')}</span>
                        </span>
                        <button
                          type="button"
                          className={css.mcpCardDelete}
                          disabled={busy !== null}
                          onClick={() => { setRemoveOwnReq(row.serverName) }}
                        >
                          <IconTrashOutline16 size={13} aria-hidden="true" />{t('mcpRemove')}
                        </button>
                      </div>
                    </section>
                    )
                  })}
                </div>
              )}
              </>)}
            </section>
          )}
        </>
      )}

      {/* 预设专属添加：粘贴 JSON / DSH 原生 YAML（按钮在顶栏） */}
      <Modal
        open={addOwnOpen}
        onClose={onCloseAddOwn}
        closeLabel={t('close')}
        title={`${t('mcpPresetAddOwn')} · ${scoped?.name ?? scope}`}
      >
        <McpPasteAdd
          t={t}
          presetId={scope}
          onAdded={(added) => { onRefresh(); onWatchTools(added) }}
          onCancel={onCloseAddOwn}
        />
      </Modal>

      {/* 全局条目删除确认 */}
      {removeReq !== null && (
        <ConfirmDialog
          open
          title={t('mcpRemoveConfirmTitle')}
          message={t('mcpRemoveConfirmMsg', { name: removeReq })}
          confirmLabel={t('mcpRemove')}
          cancelLabel={t('cancel')}
          danger
          onConfirm={() => { const name = removeReq; setRemoveReq(null); removeGlobal(name) }}
          onClose={() => { setRemoveReq(null) }}
        />
      )}

      {/* 预设专属行移除确认（同名全局条目不受影响） */}
      {removeOwnReq !== null && (
        <ConfirmDialog
          open
          title={t('mcpOwnRemoveConfirmTitle')}
          message={t('mcpOwnRemoveConfirmMsg', { name: removeOwnReq })}
          confirmLabel={t('mcpRemove')}
          cancelLabel={t('cancel')}
          danger
          onConfirm={() => { const name = removeOwnReq; setRemoveOwnReq(null); removeOwn(name) }}
          onClose={() => { setRemoveOwnReq(null) }}
        />
      )}
    </div>
  )
}
