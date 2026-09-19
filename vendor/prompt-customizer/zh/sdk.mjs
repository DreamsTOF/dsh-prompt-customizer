/**
 * 中文段译本（专属定制）—— tools:sdk。
 * 该段 95% 是 TS 类型声明代码块（工具签名契约），逐字翻译既无意义又有抄写
 * 风险 —— 译本因此是**函数形态**：只替换前导散文，代码块从原文的 \`\`\`ts
 * 围栏起逐字节保留（运行时取自原文，绝不手抄）。引擎约定：函数返回
 * null/undefined = 放弃替换、保持原文。
 * ponytail: 依赖 \`\`\`ts 围栏标记存在；宿主若改掉围栏风格，函数返回 null
 * 自动退回英文原文，升级路径是把整段改成纯静态译本。
 */
export const SDK_ZH = (original) => {
  const at = String(original ?? '').indexOf('\`\`\`ts')
  if (at < 0) return null
  const head = `## 为 run_code 编写代码

\`run_code\` 接受两个必填参数：\`code\` —— 一个异步 TypeScript 函数的函数体（只允许可擦除语法 —— 不用 \`enum\` 与命名空间；类型注解仅供参考，运行时会剥离类型）—— 和 \`description\`，一段说明该程序做什么的简短摘要。在程序内部：

- 用 \`await tools.name(args)\` 调用工具 —— 名称古怪时用引号访问：\`tools["my-tool"](args)\`。每次调用都会解析为该工具的规范化 JSON 值。工具参数必须是无损 JSON。
- 失败的工具调用会以 \`ToolCallError\` reject，其 \`toolName\` 标识失败的工具，\`message\` 人类可读 —— 用 \`try/catch\` 捕获后继续。
- 相互独立的只读调用可以在 \`Promise.all\` 下并行（安全调用并发执行；会改动状态的调用单独按提交顺序执行）。有依赖的工作用 \`await\` 串行。
- 用 \`return\` 和/或 \`console.log(...)\` 输出结果。只有你打印或返回的内容才算程序输出。包含图片的成功工具结果会在运行结束后附上，供你下一步查看；其它所有中间结果都不会进入对话，因此只提取你需要的部分。`
  return head + '\n\n可用工具：\n\n' + original.slice(at)
}
