/** zh/index.mjs 的类型声明（仅供电类型检查；运行时代码在 .mjs 中）。 */

/** 译本条目：字符串 = 整段替换；函数 = 入参该段原文，返回译本（空值 = 放弃
 *  替换、保持原文，见 sdk.mjs 的围栏守卫）。 */
export type ZhEntry = string | ((original: string) => string | null | undefined)

/** 段名 → 中文译本（按名字精确匹配，未命中保持原文）。 */
export const ZH_SECTIONS: Record<string, ZhEntry>
