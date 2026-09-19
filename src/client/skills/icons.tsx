/**
 * skills/icons — 面板自绘图标：统计卡实心图标 + Skills Hub 线性图标（Feather 风）。
 */
/** ---------------------------------------------------------------- 统计卡图标（实心渐变，与设计稿一致） */

/** 蓝色实心立方体（管理的技能）。 */
export function StatCubeIcon({ size = 20 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 3 20.4 7.4 12 11.8 3.6 7.4Z" fill="#6C92FF" />
      <path d="M12 11.8 20.4 7.4v9.2L12 21Z" fill="#2A55F2" />
      <path d="M12 11.8 3.6 7.4v9.2L12 21Z" fill="#174BFC" />
      <path d="M12 3 20.4 7.4 12 11.8 3.6 7.4Z" fill="none" stroke="#FFFFFF" strokeWidth="0.9" strokeLinejoin="round" opacity=".9" />
    </svg>
  )
}

/** 绿色实心圆 + 白色对勾（全局启用）。 */
export function StatCheckCircleIcon({ size = 20 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="9.4" fill="#0FC566" />
      <path d="M7.9 12.3 10.7 15.1 16.2 9.2" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 紫色实心圆角方块 + 白色内格（散装技能）。 */
export function StatSquareIcon({ size = 20 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="3.2" fill="#6C33F2" />
      <path d="M7.8 7.8h8.4v8.4H7.8Z" fill="#FFFFFF" opacity=".92" />
      <path d="M7.8 7.8h4.2v4.2H7.8ZM12 12h4.2v4.2H12Z" fill="#6C33F2" />
    </svg>
  )
}

/** 橙色实心心形 + 白色高光点（技能健康）。 */
export function StatHeartIcon({ size = 20 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 20.6C7.2 17.2 3.9 14 3.9 10.2 3.9 7.3 6.2 5.2 8.8 5.2c1.4 0 2.6.6 3.2 1.6.6-1 1.8-1.6 3.2-1.6 2.6 0 4.9 2.1 4.9 5 0 3.8-3.3 7-8.1 10.4z" fill="#F4502A" />
      <circle cx="8.9" cy="9.3" r="1.6" fill="#FFFFFF" opacity=".95" />
    </svg>
  )
}

/** ---------------------------------------------------------------- 左栏/工具栏小图标（线框风格 currentColor） */

export function catStroke(): { fill: 'none'; stroke: 'currentColor'; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round' } {
  return { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
}

/** 全部：蓝方内白四格（active 主导色）。 */
export function CatAllIcon({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4.5" fill="currentColor" />
      <path d="M9.2 9.2h5.6v5.6H9.2Z" fill="#FFFFFF" opacity=".92" />
    </svg>
  )
}

/** 小锁：该工具在「全部 Agent」层被停用（全局一票否决，预设层不可拨动）。 */
export function LockGlyph({ size = 10 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...catStroke()} strokeWidth={2}>
      <rect x="5" y="10.5" width="14" height="9" rx="2.4" />
      <path d="M8.2 10.5V8.4a3.8 3.8 0 0 1 7.6 0v2.1" />
    </svg>
  )
}

/** 拖放云图标。 */
export function CloudUpIcon({ size = 18 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...catStroke()}>
      <path d="M17.7 9.5A5.2 5.2 0 0 0 7.6 8.2 4 4 0 0 0 6.5 16h10.9a3.8 3.8 0 0 0 .5-7.6Z" />
      <path d="M12 17.5v-5M9.6 14.6 12 12.2l2.4 2.4" />
    </svg>
  )
}

/** 名称排序箭头（↑/↓）。 */
export function SortDirIcon({ dir, size = 12 }: { dir: 'asc' | 'desc'; size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...catStroke()}>
      {dir === 'asc' ? <path d="M12 19V5M5.8 10.8 12 4.6l6.2 6.2" /> : <path d="M12 5v14M5.8 13.2 12 19.4l6.2-6.2" />}
    </svg>
  )
}

/** 分组行蓝色文件夹（实心）。 */
export function FolderBlueIcon({ size = 17 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M3.5 7.2a2.2 2.2 0 0 1 2.2-2.2h4l2 2.1h6.6a2.2 2.2 0 0 1 2.2 2.2v7.5a2.2 2.2 0 0 1-2.2 2.2H5.7a2.2 2.2 0 0 1-2.2-2.2Z" fill="var(--dsw-alias-state-business-primary,#3d6be5)" />
      <path d="M3.5 9.5h17v1.6a2.2 2.2 0 0 0-2.2-2.2H5.7a2.2 2.2 0 0 0-2.2 2Z" fill="#FFFFFF" opacity=".25" />
    </svg>
  )
}

/** 右箭头（指南按钮）。 */
export function ArrowRightIcon({ size = 13 }: { size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...catStroke()}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}


/** 快速上手指南：底部 3D 书本插图 + 星点装饰。 */
export function GuideArtIcon(): JSX.Element {
  return (
    <svg width="150" height="86" viewBox="0 0 150 86" aria-hidden="true">
      <defs>
        <linearGradient id="skm-guide-book" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DB7F7" />
          <stop offset="1" stopColor="#6E8FF0" />
        </linearGradient>
        <linearGradient id="skm-guide-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9E4FF" />
        </linearGradient>
      </defs>
      {/* 背面书页 (右) */}
      <path d="M96 34 L141 52 L120 66 L78 50 Z" fill="url(#skm-guide-page)" stroke="#C7D6F7" strokeWidth="1" />
      {/* 背面书页 (左) */}
      <path d="M84 32 L50 52 L28 44 L64 26 Z" fill="url(#skm-guide-page)" stroke="#C7D6F7" strokeWidth="1" />
      {/* 书封面底座 */}
      <path d="M64 26 L96 34 L78 50 L50 52 Z" fill="url(#skm-guide-book)" stroke="var(--dsw-alias-state-business-primary,#5b82e5)" strokeWidth="1" />
      <path d="M50 52 L28 44 L30 56 L52 66 Z" fill="#B7C9F5" stroke="var(--dsw-alias-state-business-primary,#5b82e5)" strokeWidth="1" />
      <path d="M78 50 L120 66 L118 78 L76 62 Z" fill="#A9BEF1" stroke="var(--dsw-alias-state-business-primary,#5b82e5)" strokeWidth="1" />
      {/* 封面上的圆形徽章 */}
      <circle cx="73" cy="44" r="9" fill="#FFFFFF" opacity=".85" />
      <circle cx="73" cy="44" r="5.5" fill="#6E8FF0" />
      {/* 星点装饰 */}
      <path d="M118 10c.6 2.6 1.6 3.6 4.2 4.2-2.6.6-3.6 1.6-4.2 4.2-.6-2.6-1.6-3.6-4.2-4.2 2.6-.6 3.6-1.6 4.2-4.2Z" fill="#BCCFFF" />
      <path d="M126 26c.4 1.7 1 2.3 2.7 2.7-1.7.4-2.3 1-2.7 2.7-.4-1.7-1-2.3-2.7-2.7 1.7-.4 2.3-1 2.7-2.7Z" fill="#C9D9FF" />
      <circle cx="111" cy="24" r="2" fill="#C9D9FF" />
    </svg>
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

/** 复制图标（Feather copy，线性描边，与导航手绘图标同风）。 */
export function CopyIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

/** 完成勾图标（Feather check）。 */
export function CheckIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/* ── Skills Hub 页面图标（Feather 线性风） ─────────────── */

export function SearchIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function TagIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

export function BulbIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
    </svg>
  )
}

/** 品牌字标：侧栏 Logo 区加粗「skill」文字 SVG（无底色，currentColor = 品牌蓝）。 */
export function HubWordmarkIcon(): JSX.Element {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
      <text
        x="13"
        y="10"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="800"
        letterSpacing="-0.15"
        fontFamily="ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif"
        fill="currentColor"
      >skill</text>
    </svg>
  )
}

/** 技能字标：瓷片内的「skill」文字 SVG（替换原图标，随瓷片 currentColor 着色）。 */
export function SkillWordmarkIcon(): JSX.Element {
  return (
    <svg width="34" height="15" viewBox="0 0 34 15" aria-hidden="true">
      <text
        x="17"
        y="12"
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        letterSpacing="-0.2"
        fontFamily="ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif"
        fill="currentColor"
      >skill</text>
    </svg>
  )
}
