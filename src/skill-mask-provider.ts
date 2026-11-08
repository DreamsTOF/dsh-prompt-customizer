/** 技能禁用桩的提供者身份。身份只在一处定义：闸门写它，面板按它识别。 */
export const SKILL_MASK_PROVIDER = 'triad-preset-mask'

/** 判断一条内核技能摘要是否本插件生成的「禁用桩」。 */
export function isSkillMaskStub(summary: unknown): boolean {
  const provider = (summary as { provider?: unknown } | null | undefined)?.provider
  return provider === SKILL_MASK_PROVIDER || provider === `${SKILL_MASK_PROVIDER}-global`
}
