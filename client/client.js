window.__ModuleLoader__.load({ id: "dsh-prompt-customizer", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply2,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/skills/entry.tsx
var import_react18 = require("react");
var import_client = require("react-dom/client");

// src/client/skills/SkillsPanel.tsx
var import_react15 = require("react");
var import_dsh_client_ui_primitives10 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/popover-shell.tsx
var import_react2 = require("react");
var import_react_dom = require("react-dom");

// src/client/modal-animation.ts
var import_react = require("react");
var MODAL_ANIM_MS = 240;
var STYLE_ID = "dsh-prompt-customizer-modal-animation-styles";
var SHEET = `
@keyframes dsh-modal-slide-in {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dsh-modal-slide-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(24px); }
}
@keyframes dsh-modal-side-in {
  from { opacity: 0; transform: translateX(-14px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes dsh-modal-side-out {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-10px); }
}
@keyframes dsh-modal-drawer-in {
  from { opacity: 0; transform: translateX(56px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes dsh-modal-drawer-out {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(40px); }
}
@keyframes dsh-modal-rise-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dsh-modal-mask-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes dsh-modal-mask-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
.dsh-modal-slide-in { animation: dsh-modal-slide-in ${MODAL_ANIM_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.dsh-modal-slide-out { animation: dsh-modal-slide-out ${MODAL_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.dsh-modal-side-in { animation: dsh-modal-side-in ${MODAL_ANIM_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.dsh-modal-side-out { animation: dsh-modal-side-out ${MODAL_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.dsh-modal-drawer-in { animation: dsh-modal-drawer-in ${MODAL_ANIM_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.dsh-modal-drawer-out { animation: dsh-modal-drawer-out ${MODAL_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
/* \u5185\u5BB9\u9519\u843D\uFF1A\u5361\u7247\u64AD\u653E\u6ED1\u5165\uFF08\u5E95\u90E8\u4E0A\u6ED1 / \u53F3\u4FA7\u6ED1\u5165\u5747\u53EF\uFF09\u65F6\u751F\u6548\uFF0C\u5173\u95ED\u65F6\u968F\u5361\u7247\u6574\u4F53\u6536\u56DE\u3002
   fill-mode \u5FC5\u987B\u7528 backwards\uFF08\u5EF6\u8FDF\u671F\u5E94\u7528 from \u5E27\u9690\u85CF\uFF09\u800C\u975E both\u2014\u2014both \u4F1A\u5728\u52A8\u753B
   \u7ED3\u675F\u540E\u6B8B\u7559 to \u5E27 transform\uFF08\u5373\u4F7F translateY(0)\uFF09\uFF0C\u4F7F\u8BE5\u5BB9\u5668\u6210\u4E3A\u540E\u4EE3 position:fixed
   \u5143\u7D20\uFF08\u56FE\u8868 tooltip\uFF09\u7684\u5305\u542B\u5757\uFF0C\u6D6E\u5C42\u6574\u4F53\u504F\u79FB\u3002 */
.dsh-modal-slide-in .dsh-modal-stagger,
.dsh-modal-side-in .dsh-modal-stagger,
.dsh-modal-drawer-in .dsh-modal-stagger {
  animation: dsh-modal-rise-in ${MODAL_ANIM_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
  animation-delay: 60ms;
}
.dsh-modal-mask-in { animation: dsh-modal-mask-in ${MODAL_ANIM_MS}ms ease; }
.dsh-modal-mask-out { animation: dsh-modal-mask-out ${MODAL_ANIM_MS}ms ease forwards; }
@media (prefers-reduced-motion: reduce) {
  .dsh-modal-slide-in, .dsh-modal-slide-out, .dsh-modal-side-in, .dsh-modal-side-out,
  .dsh-modal-drawer-in, .dsh-modal-drawer-out,
  .dsh-modal-mask-in, .dsh-modal-mask-out { animation: none; }
  .dsh-modal-slide-in .dsh-modal-stagger, .dsh-modal-side-in .dsh-modal-stagger, .dsh-modal-drawer-in .dsh-modal-stagger { animation: none; }
}
`;
function ensureModalAnimStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID) !== null) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = SHEET;
  document.head.appendChild(tag);
}
function modalAnimClass(closing) {
  return closing ? "dsh-modal-slide-out" : "dsh-modal-slide-in";
}
function modalDrawerAnimClass(closing) {
  return closing ? "dsh-modal-drawer-out" : "dsh-modal-drawer-in";
}
function modalMaskAnimClass(closing) {
  return closing ? "dsh-modal-mask-out" : "dsh-modal-mask-in";
}
var modalStaggerClass = "dsh-modal-stagger";
function useModalClose(open, onClose, durationMs = MODAL_ANIM_MS) {
  const [closing, setClosing] = (0, import_react.useState)(false);
  const timerRef = (0, import_react.useRef)(null);
  const closingRef = (0, import_react.useRef)(false);
  (0, import_react.useLayoutEffect)(() => {
    if (open) {
      closingRef.current = false;
      setClosing(false);
    }
  }, [open]);
  const requestClose = (0, import_react.useCallback)(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timerRef.current = window.setTimeout(() => {
      onClose();
    }, durationMs);
  }, [onClose, durationMs]);
  (0, import_react.useEffect)(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);
  return { closing, requestClose };
}

// src/client/popover-shell.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var STYLE_ID2 = "dsh-popover-shell-styles";
var FALLBACK_MAIN_LEFT = 280;
var NARROW_VP = 768;
function readMainLeft() {
  try {
    const host = document.getElementById("dsh-prompt-customizer-nav-host");
    if (host !== null) {
      const hostRight = host.getBoundingClientRect().right;
      let node = host.parentElement;
      while (node !== null && node !== document.body) {
        const rect = node.getBoundingClientRect();
        if (rect.height >= window.innerHeight * 0.7 && rect.left <= 8 && rect.right >= hostRight - 4) {
          return Math.round(rect.right);
        }
        node = node.parentElement;
      }
    }
  } catch {
  }
  return FALLBACK_MAIN_LEFT;
}
var SHEET2 = `
/* \u2500\u2500 \u906E\u7F69\uFF1A\u6DE1\u5165\u6DE1\u51FA \u2500\u2500 */
.psh-mask{position:fixed;inset:0;z-index:999;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45))}
.psh-mask[data-anim='in']{animation:dsh-modal-mask-in ${MODAL_ANIM_MS}ms ease both}
.psh-mask[data-anim='out']{animation:dsh-modal-mask-out ${MODAL_ANIM_MS}ms ease both}
/* \u2500\u2500 \u5361\u7247\uFF1A\u4F1A\u8BDD\u5F0F\u53F3\u4FA7\u62BD\u5C49 / \u5E95\u90E8 sheet \u56DE\u9000 \u2500\u2500 */
.psh-card{position:fixed;z-index:1000;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:14px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2,#16181d));box-shadow:var(--dsw-shadow-lv3,0 8px 40px rgba(0,0,0,.5));overflow:hidden;transition:width ${MODAL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1),height ${MODAL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1)}
/* \u8986\u76D6\u4F1A\u8BDD\u4E3B\u533A\uFF1A\u4FA7\u680F\u53F3\u7F18 \u2192 \u89C6\u53E3\u53F3\u7F18\u5168\u9AD8\u5E73\u94FA\uFF0C\u65E0\u5706\u89D2\u65E0\u9634\u5F71\uFF0C\u50CF\u5207\u4E86\u4E2A\u89C6\u56FE */
.psh-card[data-mode='drawer']{top:0;right:0;bottom:0;height:100vh;height:100dvh;max-height:100vh;max-height:100dvh;border-radius:0;border:none;border-left:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06));box-shadow:none;transition:left ${MODAL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1)}
/* in \u52A8\u753B\u4E0D\u5F97\u5E26 fill-mode\uFF08both/forwards \u4F1A\u6B8B\u7559 to \u5E27 transform\uFF0C\u4F7F\u5361\u7247\u6210\u4E3A
   \u540E\u4EE3 position:fixed \u5143\u7D20\uFF08\u56FE\u8868 tooltip\uFF09\u7684\u5305\u542B\u5757\uFF0C\u6D6E\u5C42\u6574\u4F53\u504F\u79FB\uFF09\uFF1Bout \u9700\u8981
   forwards \u4FDD\u6301\u9690\u85CF\u6001\u76F4\u5230\u5378\u8F7D\uFF0C\u6B64\u65F6\u65E0\u4EA4\u4E92\u3001\u65E0\u526F\u4F5C\u7528\u3002 */
.psh-card[data-mode='drawer'][data-anim='in']{animation:dsh-modal-drawer-in ${MODAL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1)}
.psh-card[data-mode='drawer'][data-anim='out']{animation:dsh-modal-drawer-out ${MODAL_ANIM_MS}ms cubic-bezier(.4,0,.2,1) both}
.psh-card[data-mode='sheet']{left:12px !important;right:12px;bottom:12px;top:auto !important}
/* Windows \u684C\u9762\u7248\uFF1ADSH \u5728 .frame::before \u94FA\u4E86\u4E00\u6761 --dsh-windows-titlebar-height
   \u9AD8\u7684 -webkit-app-region:drag \u62D6\u62FD\u6761\u3002Electron \u7684 app-region \u662F\u51E0\u4F55 + \u6587\u6863\u987A\u5E8F
   \u5408\u6210\u7684\uFF0C\u843D\u5728\u8BE5\u6761\u51E0\u4F55\u5185\u7684\u5143\u7D20\u6536\u4E0D\u5230\u9F20\u6807\u4E8B\u4EF6\uFF1BDSH \u53EA\u5728 darwin \u4E0A\u5199\u4E86
   body > :not(#root){no-drag} \u7684\u653E\u884C\u89C4\u5219\uFF0CWindows \u6CA1\u6709\u7B49\u4EF7\u89C4\u5219\u3002
   \u672C\u9762\u677F portal \u5230 body\u3001drawer \u4ECE top:0 \u8D77\uFF0C\u5934\u90E8\uFF08\u80FD\u529B\u7BA1\u7406 / SKILL / MCP /
   \u63D0\u793A\u8BCD \u90A3\u4E00\u884C\uFF09\u6B63\u597D\u843D\u5728\u62D6\u62FD\u6761\u91CC \u2014\u2014 \u8868\u73B0\u4E3A\u70B9 tab \u5B8C\u5168\u6CA1\u53CD\u5E94\uFF08web \u7248\u65E0\u62D6\u62FD\u6761\uFF0C
   \u6240\u4EE5\u770B\u4E0D\u51FA\u95EE\u9898\uFF09\u3002\u8BA9\u51FA\u8FD9\u6761\u9AD8\u5EA6\u5373\u53EF\uFF1Bweb \u7248\u6CA1\u6709\u8BE5\u53D8\u91CF\uFF0Ccalc \u7ED3\u679C\u4E3A 0\u3002 */
[data-windows-titlebar] .psh-card{top:var(--dsh-windows-titlebar-height,0px)}
[data-windows-titlebar] .psh-card[data-mode='drawer']{height:auto;bottom:0}
/* \u5B9E\u5E95\u5361\u7247\uFF08solid \u6A21\u5F0F\uFF09\uFF1A\u73BB\u7483\u8D28\u611F\u5F00\u542F\u65F6\u4E5F\u4FDD\u6301\u4E0D\u900F\u660E\u8868\u9762\u3002
   \u4E24\u6761\u5FC5\u8981\u6761\u4EF6\u2014\u2014
   1) \u5E95\u8272\u5FC5\u987B\u7528 static token\uFF08bg-layer-* \u7B49 alias \u5728\u73BB\u7483\u6A21\u5F0F\u4E0B\u88AB
      overrideTokens \u6362\u6210 rgba\uFF0C\u7528\u5B83\u4EEC\u4ECD\u7136\u900F\uFF09\uFF1B
   2) \u9009\u62E9\u5668\u9700\u5E26 html[data-dsh-glass] \u524D\u7F00\u4EE5\u538B\u8FC7 glass.ts \u91CC
      \u300C\u63D2\u4EF6\u81EA\u7ED8\u9762\u677F\u4E00\u5F8B transparent\u300D\u90A3\u6761\u89C4\u5219\uFF08\u540C\u7279\u5F02\u6027\u9760\u987A\u5E8F\u53D6\u80DC\u4E0D\u53EF\u9760\uFF09\u3002 */
.psh-card[data-solid],html[data-dsh-glass] .psh-card[data-solid]{
  background:var(--dsw-static-neutral-bluish-00,#fff);
  backdrop-filter:none;-webkit-backdrop-filter:none}
body[data-ds-dark-theme] .psh-card[data-solid],
html[data-dsh-glass] body[data-ds-dark-theme] .psh-card[data-solid]{
  background:var(--dsw-static-neutral-bluish-850,#2c2c2e)}
.psh-card[data-mode='sheet'][data-anim='in']{animation:dsh-modal-slide-in ${MODAL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1)}
.psh-card[data-mode='sheet'][data-anim='out']{animation:dsh-modal-slide-out ${MODAL_ANIM_MS}ms cubic-bezier(.4,0,.2,1) both}
/* \u2500\u2500 \u901A\u7528\u5361\u7247\u5934\u90E8\uFF1A\u6807\u9898 + \u5173\u95ED\uFF08\u5BF9\u9F50 auto-card-head \u89C4\u683C\uFF09\u2500\u2500 */
.psh-head{flex:none;display:flex;align-items:center;gap:8px;padding:12px 16px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.psh-title{flex:1;min-width:0;font-size:15px;font-weight:600;line-height:22px;color:var(--dsw-alias-label-primary,#eee)}
.psh-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:8px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-secondary,#bbb)}
.psh-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}
/* \u5361\u7247\u4E3B\u4F53\u6EDA\u52A8\u533A */
.psh-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
/* \u2500\u2500 \u79FB\u52A8\u7AEF\uFF1A\u4EFB\u4F55\u6A21\u5F0F\u5F3A\u5236\u5168\u5C4F sheet\uFF08100vw / 100dvh\uFF0Cradius 0\uFF09\u3002
    \u53C2\u8003 tool-summary .dts__modal \u7684 767.98px \u5199\u6CD5\uFF1B!important \u538B\u8FC7\u7EC4\u4EF6\u5185\u8054
    left/top/width/height\uFF08drawer \u6A21\u5F0F\u7528\u5185\u8054\u5BBD\u5EA6\uFF0C\u5FC5\u987B\u8986\u76D6\u5230 0/\u5168\u5C4F\uFF09\u3002
    transform:none \u4EC5\u4F5C\u9759\u6001\u515C\u5E95\uFF0C\u6ED1\u5165/\u6ED1\u51FA\u52A8\u753B\u7684 keyframe transform \u4ECD\u4F18\u5148\u64AD\u653E\uFF1B
    \u672C\u5757\u6CE8\u91CA\u5185\u5BB9\u672A\u5199\u51FA\u300C\u661F\u53F7\u7D27\u8DDF\u6B63\u659C\u6760\u300D\u4E24\u5B57\u7B26\u5E8F\u5217\u3002 \u2500\u2500 */
@media (max-width: 767.98px){
  .psh-card{
    left:0 !important;
    top:0 !important;
    right:auto !important;
    bottom:auto !important;
    width:100vw !important;
    max-width:100vw !important;
    height:100vh !important;
    height:100dvh !important;
    max-height:100vh !important;
    max-height:100dvh !important;
    border-radius:0 !important;
    transform:none !important;
  }
}
@media (prefers-reduced-motion:reduce){
  .psh-mask,.psh-card{animation:none!important}
  .psh-card{transition:none!important}
}
`;
function ensureShellStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID2) !== null) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID2;
  tag.dataset.plugin = "dsh-prompt-customizer";
  tag.textContent = SHEET2;
  document.head.appendChild(tag);
}
function PopoverShell({
  closing,
  onClose,
  width = 560,
  size,
  onCardMouseEnter,
  onCardMouseLeave,
  ariaLabel,
  solid = false,
  children
}) {
  const [vw, setVw] = (0, import_react2.useState)(window.innerWidth);
  const [mainLeft, setMainLeft] = (0, import_react2.useState)(readMainLeft);
  (0, import_react2.useEffect)(() => {
    const reread = () => {
      setVw(window.innerWidth);
      setMainLeft(readMainLeft());
    };
    reread();
    window.addEventListener("resize", reread);
    const observer = new MutationObserver(reread);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-sidebar-collapsed"], subtree: true });
    const timer = window.setInterval(reread, 1500);
    return () => {
      window.removeEventListener("resize", reread);
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);
  void (size?.width ?? width);
  const anim = closing ? "out" : "in";
  const narrow = vw < NARROW_VP;
  const mode = narrow ? "sheet" : "drawer";
  const style = narrow ? void 0 : { left: mainLeft };
  (0, import_react2.useEffect)(() => {
    if (closing) return void 0;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [closing, onClose]);
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      narrow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "psh-mask", "data-anim": anim, "aria-hidden": "true", onClick: onClose }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          className: `psh-card ${modalDrawerAnimClass(closing)}`,
          "data-anim": anim,
          "data-mode": mode,
          "data-solid": solid ? "" : void 0,
          style,
          role: "dialog",
          "aria-modal": "true",
          "aria-label": ariaLabel,
          onMouseEnter: onCardMouseEnter,
          onMouseLeave: onCardMouseLeave,
          children
        }
      )
    ] }),
    document.body
  );
}
function PshBody({ children, className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: className !== void 0 && className !== "" ? `psh-body ${className}` : "psh-body", children });
}

// src/client/prompt/Panel.tsx
var import_react9 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/skills/styles.ts
var css = {
  entry: "skm-entry",
  label: "skm-label",
  // SKILL / MCP 顶层 tab + MCP 占位
  kindTabs: "skm-kind-tabs",
  kindTab: "skm-kind-tab",
  kindTabActive: "skm-kind-tab-active",
  mcpEmpty: "skm-mcp-empty",
  mcpEmptyIcon: "skm-mcp-empty-icon",
  mcpEmptyTitle: "skm-mcp-empty-title",
  mcpEmptyDesc: "skm-mcp-empty-desc",
  mcpPage: "skm-mcp-view-root",
  mcpViewRoot: "skm-mcp-view-root",
  mcpSide: "skm-mcp-side",
  mcpMain: "skm-mcp-main",
  mcpServerLayout: "skm-mcp-server-layout",
  mcpServerMain: "skm-mcp-server-main",
  mcpHeader: "skm-mcp-header",
  mcpHeaderText: "skm-mcp-header-text",
  mcpHeaderTitleRow: "skm-mcp-header-title-row",
  mcpHeaderTitle: "skm-mcp-header-title",
  mcpHeaderBadge: "skm-mcp-header-badge",
  mcpHeaderSub: "skm-mcp-header-sub",
  mcpHeaderActions: "skm-mcp-header-actions",
  mcpMarketBtn: "skm-mcp-market-btn",
  mcpAddBtn: "skm-mcp-add-btn",
  mcpBellBtn: "skm-mcp-bell-btn",
  mcpEmptyList: "skm-mcp-empty-list",
  mcpCopyHint: "skm-mcp-copy-hint",
  mcpIntroCard: "skm-mcp-intro-card",
  mcpIntroBody: "skm-mcp-intro-body",
  mcpIntroTitle: "skm-mcp-intro-title",
  mcpIntroDesc: "skm-mcp-intro-desc",
  mcpIntroBtn: "skm-mcp-intro-btn",
  mcpInfoOverlay: "skm-mcp-info-overlay",
  mcpInfoOverlayHead: "skm-mcp-info-overlay-head",
  mcpInfoOverlayIcon: "skm-mcp-info-overlay-icon",
  mcpInfoOverlayTitle: "skm-mcp-info-overlay-title",
  mcpInfoOverlayBody: "skm-mcp-info-overlay-body",
  mcpRow: "skm-mcp-row",
  mcpRowLogo: "skm-mcp-row-logo",
  mcpRowBody: "skm-mcp-row-body",
  mcpRowNameRow: "skm-mcp-row-name-row",
  mcpRowName: "skm-mcp-row-name",
  mcpRowTag: "skm-mcp-row-tag",
  mcpRowExt: "skm-mcp-row-ext",
  mcpRowDesc: "skm-mcp-row-desc",
  mcpRowStatus: "skm-mcp-row-status",
  mcpViewAll: "skm-mcp-view-all",
  mcpAddSmallBtn: "skm-mcp-add-small-btn",
  mcpRecommendTitle: "skm-mcp-recommend-title",
  mcpRecHead: "skm-mcp-rec-head",
  mcpRecCatsRow: "skm-mcp-rec-cats-row",
  mcpRecResultsTitle: "skm-mcp-rec-results-title",
  mcpRecStars: "skm-mcp-rec-stars",
  mcpOpenLink: "skm-mcp-open-link",
  mcpRecCardExternal: "skm-mcp-rec-card-external",
  mcpResolveErr: "skm-mcp-resolve-err",
  mcpExtActions: "skm-mcp-ext-actions",
  mcpCardFoot: "skm-mcp-card-foot",
  mcpCardItem: "skm-mcp-card-item",
  mcpCardItemLabel: "skm-mcp-card-item-label",
  mcpCardItemMeta: "skm-mcp-card-item-meta",
  mcpCardDelete: "skm-mcp-card-delete",
  mcpToolChips: "skm-mcp-tool-chips",
  mcpToolChip: "skm-mcp-tool-chip",
  mcpRecCats: "skm-mcp-rec-cats",
  mcpRecCat: "skm-mcp-rec-cat",
  mcpRecCatActive: "skm-mcp-rec-cat-active",
  mcpRecGrid: "skm-mcp-rec-grid",
  mcpRecCard: "skm-mcp-rec-card",
  mcpRecCardHead: "skm-mcp-rec-card-head",
  mcpRecCardTitleRow: "skm-mcp-rec-card-title-row",
  mcpRecCardName: "skm-mcp-rec-card-name",
  mcpRecCardTags: "skm-mcp-rec-card-tags",
  mcpRecCatTag: "skm-mcp-rec-cat-tag",
  mcpRecCardDesc: "skm-mcp-rec-card-desc",
  mcpRecCardFoot: "skm-mcp-rec-card-foot",
  mcpRecCardMeta: "skm-mcp-rec-card-meta",
  mcpAddedTag: "skm-mcp-added-tag",
  mcpAddForm: "skm-mcp-add-form",
  mcpAddTypeRow: "skm-mcp-add-type-row",
  mcpAddTypeBtn: "skm-mcp-add-type-btn",
  mcpAddTypeActive: "skm-mcp-add-type-active",
  mcpToolSearch: "skm-mcp-tool-search",
  mcpToolSearchInput: "skm-mcp-tool-search-input",
  mcpConfigGrid: "skm-mcp-config-grid",
  mcpConfigCard: "skm-mcp-config-card",
  mcpConfigHead: "skm-mcp-config-head",
  mcpConfigTitle: "skm-mcp-config-title",
  mcpConfigCopy: "skm-mcp-config-copy",
  mcpConfigCode: "skm-mcp-config-code",
  mcpInfoCol: "skm-mcp-info-col",
  mcpInfoCard: "skm-mcp-info-card",
  mcpInfoCardTitle: "skm-mcp-info-card-title",
  mcpInfoDesc: "skm-mcp-info-desc",
  mcpInfoPoints: "skm-mcp-info-points",
  mcpPoint: "skm-mcp-point",
  mcpPointIcon: "skm-mcp-point-icon",
  mcpPointBody: "skm-mcp-point-body",
  mcpPointTitle: "skm-mcp-point-title",
  mcpPointDesc: "skm-mcp-point-desc",
  mcpFlow: "skm-mcp-flow",
  mcpFlowNode: "skm-mcp-flow-node",
  mcpFlowIcon: "skm-mcp-flow-icon",
  mcpFlowLabel: "skm-mcp-flow-label",
  mcpFlowArrow: "skm-mcp-flow-arrow",
  mcpFlowArrowText: "skm-mcp-flow-arrow-text",
  mcpFlowExt: "skm-mcp-flow-ext",
  mcpFlowExtLabel: "skm-mcp-flow-ext-label",
  mcpFlowExtIcons: "skm-mcp-flow-ext-icons",
  mcpFlowExtIcon: "skm-mcp-flow-ext-icon",
  mcpApiText: "skm-mcp-api-text",
  mcpSteps: "skm-mcp-steps",
  mcpStep: "skm-mcp-step",
  mcpStepNum: "skm-mcp-step-num",
  mcpStepBody: "skm-mcp-step-body",
  mcpStepTitle: "skm-mcp-step-title",
  mcpStepDesc: "skm-mcp-step-desc",
  modal: "skm-modal",
  modalBody: "skm-modal-body",
  panel: "skm-panel",
  topRow: "skm-top-row",
  newBundleButton: "skm-new-bundle",
  upload: "skm-upload",
  uploadActive: "skm-upload-active",
  hiddenInput: "skm-hidden-input",
  installForm: "skm-install-form",
  installRow: "skm-install-row",
  inlineForm: "skm-inline-form",
  // 技能包分类：顶栏胶囊行 / 包名旁标签 / 分类编辑器
  stackForm: "skm-stack-form",
  catChipRow: "skm-cat-chip-row",
  catChipLabel: "skm-cat-chip-label",
  catChip: "skm-cat-chip",
  catChipCount: "skm-cat-chip-count",
  bundleCats: "skm-bundle-cats",
  bundleCatTag: "skm-bundle-cat-tag",
  catEditor: "skm-cat-editor",
  catEmpty: "skm-cat-empty",
  catSelected: "skm-cat-selected",
  catSelectedTag: "skm-cat-selected-tag",
  catSelectedName: "skm-cat-selected-name",
  catRemove: "skm-cat-remove",
  catSuggest: "skm-cat-suggest",
  catPreset: "skm-cat-preset",
  catPresetPlus: "skm-cat-preset-plus",
  catInput: "skm-cat-input",
  catLimit: "skm-cat-limit",
  // 块级变体：改名输入行独占一整行（整行内容保留，表单追加在其下方）。
  inlineFormBlock: "skm-inline-form-block",
  inlineInput: "skm-inline-input",
  bundleSelect: "skm-bundle-select",
  installMeta: "skm-install-meta",
  installActions: "skm-install-actions",
  sectionTitle: "skm-section-title",
  status: "skm-status",
  failure: "skm-failure",
  error: "skm-error",
  bundleList: "skm-bundle-list",
  bundle: "skm-bundle",
  bundleRow: "skm-bundle-row",
  bundleName: "skm-bundle-name",
  bundleCount: "skm-bundle-count",
  chevron: "skm-chevron",
  bundleActions: "skm-bundle-actions",
  iconAction: "skm-icon-action",
  skillList: "skm-skill-list",
  skillItem: "skm-skill-item",
  skillRow: "skm-skill-row",
  skillLabel: "skm-skill-label",
  skillName: "skm-skill-name",
  skillDescription: "skm-skill-desc",
  skillExpand: "skm-skill-expand",
  skillCount: "skm-skill-count",
  skillCompat: "skm-skill-compat",
  // 技能卡片（Skills Hub 风格）
  skillGrid: "skm-skill-grid",
  skillCard: "skm-skill-card",
  skillCardHead: "skm-skill-card-head",
  skillIcon: "skm-skill-icon",
  skillBadge: "skm-skill-badge",
  skillTitleWrap: "skm-skill-title-wrap",
  skillTitle: "skm-skill-title",
  skillCopy: "skm-skill-copy",
  skillCardToggle: "skm-skill-card-toggle",
  skillDesc: "skm-skill-card-desc",
  skillTags: "skm-skill-tags",
  tag: "skm-tag",
  tagSource: "skm-tag-source",
  tagScope: "skm-tag-scope",
  skillMeta: "skm-skill-meta",
  skillCardFoot: "skm-skill-card-foot",
  skillFootLabel: "skm-skill-foot-label",
  skillFootIcon: "skm-skill-foot-icon",
  skillFootIconDanger: "skm-skill-foot-icon-danger",
  skillCardActions: "skm-skill-card-actions",
  // Skills Hub 页面结构
  hub: "skm-hub",
  hubRow: "skm-hub-row",
  hubSide: "skm-hub-side",
  topbar: "skm-topbar",
  chipRow: "skm-chip-row",
  hubBrand: "skm-hub-brand",
  hubLogo: "skm-hub-logo",
  hubBrandText: "skm-hub-brand-text",
  hubBrandTitle: "skm-hub-brand-title",
  hubBrandSub: "skm-hub-brand-sub",
  hubGroup: "skm-hub-group",
  hubItem: "skm-hub-item",
  hubItemActive: "skm-hub-item-active",
  hubItemIcon: "skm-hub-item-icon",
  hubItemLabel: "skm-hub-item-label",
  hubItemCount: "skm-hub-item-count",
  // 左栏：技能分类 / 快捷筛选 / 添加技能卡
  catTitle: "skm-cat-title",
  catItem: "skm-cat-item",
  catItemActive: "skm-cat-item-active",
  catIcon: "skm-cat-icon",
  catLabel: "skm-cat-label",
  catCount: "skm-cat-count",
  filterBlock: "skm-filter-block",
  filterRow: "skm-filter-row",
  filterRowLabel: "skm-filter-row-label",
  filterRowLabelStrong: "skm-filter-row-label-strong",
  filterRowChevron: "skm-filter-row-chevron",
  filterRowWrap: "skm-filter-row-wrap",
  filterMenu: "skm-filter-menu",
  filterOption: "skm-filter-option",
  presetDot: "skm-preset-dot",
  filtersTitle: "skm-filters-title",
  statusSeg: "skm-status-seg",
  statusSegBtn: "skm-status-seg-btn",
  statusSegActive: "skm-status-seg-active",
  statusSegCount: "skm-status-seg-count",
  topbarActions: "skm-topbar-actions",
  healthInline: "skm-health-inline",
  addCard: "skm-add-card",
  addCardActive: "skm-add-card-active",
  addCardHead: "skm-add-card-head",
  addCardIcon: "skm-add-card-icon",
  addCardTitle: "skm-add-card-title",
  addCardSub: "skm-add-card-sub",
  addDrop: "skm-add-drop",
  addDropIcon: "skm-add-drop-icon",
  addDropText: "skm-add-drop-text",
  addDropHint: "skm-add-drop-hint",
  addBtn: "skm-add-btn",
  // 快速上手指南卡
  guideCard: "skm-guide-card",
  guideTitle: "skm-guide-title",
  guideDesc: "skm-guide-desc",
  guideBtn: "skm-guide-btn",
  guideArt: "skm-guide-art",
  // 右侧指南栏
  guidePanel: "skm-guide-panel",
  guidePanelHead: "skm-guide-panel-head",
  guidePanelLogo: "skm-guide-panel-logo",
  guidePanelTitle: "skm-guide-panel-title",
  guidePanelClose: "skm-guide-panel-close",
  guidePanelBody: "skm-guide-panel-body",
  guideSec: "skm-guide-sec",
  guideSecHead: "skm-guide-sec-head",
  guideSecIcon: "skm-guide-sec-icon",
  guideSecTitle: "skm-guide-sec-title",
  guideWhatDesc: "skm-guide-what-desc",
  guideCaps: "skm-guide-caps",
  guideCap: "skm-guide-cap",
  guideCapIcon: "skm-guide-cap-icon",
  guideCapLabel: "skm-guide-cap-label",
  guideStep: "skm-guide-step",
  guideStepNum: "skm-guide-step-num",
  guideStepBody: "skm-guide-step-body",
  guideStepTitleRow: "skm-guide-step-title-row",
  guideStepTitle: "skm-guide-step-title",
  guideStepArrow: "skm-guide-step-arrow",
  guideStepDesc: "skm-guide-step-desc",
  guideFullBtn: "skm-guide-full-btn",
  guideBest: "skm-guide-best",
  guideBestTitle: "skm-guide-best-title",
  guideBestList: "skm-guide-best-list",
  guideBestItem: "skm-guide-best-item",
  guideMoreBtn: "skm-guide-more-btn",
  guideBestArt: "skm-guide-best-art",
  hubMain: "skm-hub-main",
  // 分组行
  bundleRowOuter: "skm-bundle-row-outer",
  bundleIcon: "skm-bundle-icon",
  bundleMore: "skm-bundle-more",
  bundleMoreBtn: "skm-bundle-more-btn",
  // 分页
  pagination: "skm-pagination",
  pageInfo: "skm-page-info",
  pageBtns: "skm-page-btns",
  pageBtn: "skm-page-btn",
  pageBtnActive: "skm-page-btn-active",
  pageSizeSel: "skm-page-size-sel",
  newBundleBtn: "skm-new-bundle-btn",
  newBundleBtnOpen: "skm-new-bundle-btn-open",
  toolbar: "skm-toolbar",
  searchBox: "skm-search-box",
  searchInput: "skm-search-input",
  toolSelectWrap: "skm-tool-select-wrap",
  toolSelect: "skm-tool-select",
  toolSelectChevron: "skm-tool-select-chevron",
  dropWrap: "skm-drop-wrap",
  dropMenu: "skm-drop-menu",
  dropItem: "skm-drop-item",
  dropCheck: "skm-drop-check",
  dropBadge: "skm-drop-badge",
  toolButton: "skm-tool-button",
  toolbarSpacer: "skm-toolbar-spacer",
  bulkOverlay: "skm-bulk-overlay",
  dropLabelEllipsis: "skm-drop-label-ellipsis",
  scopeTag: "skm-scope-tag",
  presetPill: "skm-preset-pill",
  presetSelect: "skm-preset-select",
  presetPillChevron: "skm-preset-pill-chevron",
  presetPillLabel: "skm-preset-pill-label",
  viewToggle: "skm-view-toggle",
  viewBtn: "skm-view-btn",
  hintRow: "skm-hint-row",
  hintRowText: "skm-hint-row-text",
  banner: "skm-banner",
  bannerActive: "skm-banner-active",
  bannerIcon: "skm-banner-icon",
  bannerText: "skm-banner-text",
  bannerTitle: "skm-banner-title",
  bannerSub: "skm-banner-sub",
  bannerBtn: "skm-banner-btn",
  mainScroll: "skm-main-scroll",
  hubSection: "skm-hub-section",
  hubSectionHead: "skm-hub-section-head",
  noResult: "skm-no-result",
  // 归入技能包弹窗（卡片化）
  assignModal: "skm-assign-modal",
  assignModalBody: "skm-assign-modal-body",
  assignList: "skm-assign-list",
  assignCard: "skm-assign-card",
  assignCardIcon: "skm-assign-card-icon",
  assignCardBody: "skm-assign-card-body",
  assignCardName: "skm-assign-card-name",
  assignCardDesc: "skm-assign-card-desc",
  assignGo: "skm-assign-go",
  // 同步状态健康检查
  healthNotice: "skm-health-notice",
  healthNoticeTitle: "skm-health-notice-title",
  skillFiles: "skm-skill-files",
  skillFile: "skm-skill-file",
  skillPreview: "skm-skill-preview",
  viewerModal: "skm-viewer-modal",
  viewerBody: "skm-viewer-body",
  viewerLayout: "skm-viewer-layout",
  viewerNav: "skm-viewer-nav",
  viewerNavItem: "skm-viewer-nav-item",
  viewerNavDir: "skm-viewer-nav-dir",
  viewerContent: "skm-viewer-content",
  viewerModalFull: "skm-viewer-modal-full",
  viewerToolbar: "skm-viewer-toolbar",
  viewerPath: "skm-viewer-path",
  viewerToolGroup: "skm-viewer-tool-group",
  viewerToolBtn: "skm-viewer-tool-btn",
  viewerToolBtnA1: "skm-viewer-tool-btn-a1",
  viewerToolBtnA3: "skm-viewer-tool-btn-a3",
  viewerToolBtnFrame: "skm-viewer-tool-btn-frame",
  looseEmpty: "skm-loose-empty",
  visuallyHidden: "skm-visually-hidden",
  // 技能/技能包开关
  toggle: "skm-toggle",
  toggleOn: "skm-toggle-on",
  toggleOff: "skm-toggle-off",
  toggleKnob: "skm-toggle-knob",
  bundleToggle: "skm-bundle-toggle",
  // Agent 预设分类（圆球）
  presetStrip: "skm-preset-strip",
  presetBallWrap: "skm-preset-ball-wrap",
  presetBall: "skm-preset-ball",
  presetBallLabel: "skm-preset-ball-label",
  presetHint: "skm-preset-hint",
  presetHintText: "skm-preset-hint-text",
  presetReset: "skm-preset-reset",
  // 空技能包 / 失效引用 / 面板级提示条
  toastStack: "skm-toast-stack",
  toast: "skm-toast",
  toastOk: "skm-toast-ok",
  toastErr: "skm-toast-err",
  toastDot: "skm-toast-dot",
  bundleEmpty: "skm-bundle-empty",
  bundleEmptyTitle: "skm-bundle-empty-title",
  bundleEmptyHint: "skm-bundle-empty-hint",
  bundleEmptyBtn: "skm-bundle-empty-btn",
  bundleMissing: "skm-bundle-missing",
  bundleMissingBtn: "skm-bundle-missing-btn",
  installHint: "skm-install-hint",
  tagStatus: "skm-tag-status"
};
var STYLE_ID3 = "dsh-skill-manager-styles";
var SHEET3 = `
.skm-entry{flex:1 1 50%;min-width:0;display:inline-flex;align-items:center;gap:8px;height:32px;box-sizing:border-box;border:none;border-radius:10px;padding:0 8px;background:transparent;cursor:pointer;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;font-size:14px;line-height:20px;overflow:hidden}
.skm-entry:hover{background:transparent}
.skm-entry[aria-expanded='true']{background:transparent;color:var(--dsw-alias-label-primary,#eee)}
.skm-entry:focus,.skm-entry:focus-visible{outline:none;border:none}
.skm-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-modal-body{overflow:hidden;display:flex;flex-direction:column}
.skm-panel{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;overflow-y:auto;padding:2px 2px 6px;box-sizing:border-box}
.skm-top-row{flex:none;display:flex;align-items:center;justify-content:flex-end;gap:8px}
.skm-new-bundle{flex:none;display:inline-flex;align-items:center;gap:4px;appearance:none;border:none;border-radius:12px;padding:4px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#999);background:transparent;cursor:pointer}
.skm-new-bundle:hover,.skm-new-bundle[aria-expanded='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}
.skm-upload{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:10px 12px;box-sizing:border-box;border:1px dashed var(--dsw-alias-border-l3,#444);border-radius:12px;color:var(--dsw-alias-label-tertiary,#888);font-size:12px;line-height:18px;text-align:center;cursor:pointer;user-select:none}
.skm-upload:hover{border-color:var(--dsw-alias-state-business-primary,#4a9eff);color:var(--dsw-alias-label-secondary,#bbb)}
.skm-upload-active{border-color:var(--dsw-alias-state-business-primary,#4a9eff);background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-hidden-input{display:none}
.skm-install-form{flex:none;display:flex;flex-direction:column;gap:8px;padding:10px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:12px;background:var(--dsw-alias-bg-layer-1,#1c1f26)}
.skm-install-row{display:flex;flex-direction:column;gap:6px}
.skm-inline-form{flex:none;display:flex;align-items:center;gap:6px}
/* \u5757\u7EA7\u53D8\u4F53\uFF1Awidth:100% \u8BA9\u5B83\u5728 .skm-bundle\uFF08flex-wrap\uFF09\u91CC\u81EA\u52A8\u6362\u884C\u72EC\u5360\u4E00\u884C\uFF0C
   \u8F93\u5165\u6846\u56E0\u6B64\u80FD\u5403\u6EE1\u6574\u884C\u5BBD\u5EA6\uFF0C\u4E0D\u5FC5\u88AB\u4E24\u4E2A\u6309\u94AE\u6324\u5230\u53EA\u5269\u9ED8\u8BA4 20 \u5B57\u7B26\u3002 */
.skm-inline-form-block{width:100%;box-sizing:border-box;padding:0 8px 8px;animation:skm-form-in 160ms ease-out}
@keyframes skm-form-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
/* \u6539\u540D\u6210\u529F\uFF1A\u5361\u7247\u8FB9\u6846\u9AD8\u4EAE\u8109\u51B2\uFF081 \u79D2\u540E\u56DE\u843D\uFF09\uFF0C\u4E0E\u6574\u4F53\u6DF1\u8272\u5361\u7247\u8282\u594F\u4E00\u81F4 */
.skm-bundle[data-renamed='true']{animation:skm-card-pop 900ms ease-out}
@keyframes skm-card-pop{0%{border-color:var(--dsw-alias-state-business-primary,#4a9eff);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary,#4a9eff)}55%{border-color:var(--dsw-alias-state-business-primary,#4a9eff);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary,#4a9eff)}100%{border-color:var(--dsw-alias-border-l1,rgba(255,255,255,.08));box-shadow:none}}
.skm-inline-input{flex:1;min-width:0;height:32px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:8px;padding:0 10px;font-size:13px;color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-bg-base,#0e1116)}
.skm-inline-input::placeholder{color:var(--dsw-alias-label-tertiary,#888)}
.skm-bundle-select{display:flex;align-items:center}
.skm-bundle-select select{flex:1;height:32px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:8px;padding:0 8px;font-size:13px;color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-bg-base,#0e1116)}
.skm-install-meta{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-install-actions{display:flex;align-items:center;gap:6px}
.skm-section-title{margin:6px 2px 0;font-size:12px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-secondary,#bbb)}
.skm-status{margin:2px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-failure{display:flex;align-items:center;gap:8px}
.skm-failure p{margin:2px;font-size:13px;line-height:20px;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-error{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-bundle-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
/* \u5206\u7EC4\u884C\uFF08\u53C2\u8003\u8BBE\u8BA1\u7A3F\uFF09\uFF1A\u767D\u5E95\u5706\u89D2\u884C\uFF0C\u84DD\u6587\u4EF6\u5939\u56FE\u6807 + \u540D\u79F0 + \u8BA1\u6570 pill + chevron + \u66F4\u591A */
.skm-bundle-row-outer{flex:none;display:flex;align-items:center;gap:6px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:11px;background:var(--dsw-alias-bg-base,#fff);padding:2px 6px 2px 10px;min-height:40px;transition:border-color 160ms ease,box-shadow 160ms ease,background 160ms ease}
.skm-bundle-row-outer:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.14));box-shadow:0 2px 8px rgba(16,24,40,.06)}
.skm-bundle-row{flex:1;min-width:0;display:inline-flex;align-items:center;gap:10px;appearance:none;border:none;background:transparent;padding:6px 2px;font-size:14px;cursor:pointer;color:var(--dsw-alias-label-primary,#1f2430);font-family:inherit;border-radius:8px;text-align:left;transition:background 140ms ease}
.skm-bundle-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.02))}
.skm-bundle-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-bundle-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;display:inline-flex;align-items:center;gap:6px}
.skm-bundle-count{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b);background:var(--dsw-alias-bg-module-platform,#f1f3f5);border-radius:999px;padding:0 8px;white-space:nowrap}
/* \u2500\u2500 \u6280\u80FD\u5305\u5206\u7C7B\uFF1A\u9876\u680F\u80F6\u56CA\u7B5B\u9009 / \u5305\u540D\u65C1\u6807\u7B7E / \u5206\u7C7B\u7F16\u8F91\u5668 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
/* \u914D\u8272\u53EA\u8D70\u4E3B\u9898\u84DD\u4E00\u628A\u5237\u5B50\uFF08\u4E0E .skm-tag \u540C\u8BED\u8A00\uFF09\uFF1B\u5206\u7C7B\u540D\u4E0D\u53C2\u4E0E\u914D\u8272\u2014\u2014
   \u5F69\u8679\u8272\u677F\u5B9E\u6D4B\u89C6\u89C9\u592A\u5435\uFF0C\u4E0E\u9762\u677F\u5176\u4F59\u90E8\u5206\u6253\u67B6\uFF0C\u5DF2\u5426\u3002 */
.skm-stack-form{display:flex;flex-direction:column;gap:10px}
.skm-cat-chip-row{flex:1 1 100%;order:3;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:2px;animation:skm-cat-row-in 220ms cubic-bezier(.2,.8,.2,1) both}
@keyframes skm-cat-row-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.skm-cat-chip-label{flex:none;font-size:11.5px;line-height:18px;letter-spacing:.02em;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-cat-chip{flex:none;display:inline-flex;align-items:center;gap:5px;height:26px;box-sizing:border-box;padding:0 9px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-family:inherit;font-size:12px;line-height:18px;cursor:pointer;transition:color 150ms ease,border-color 150ms ease,background 150ms ease,box-shadow 200ms ease,transform 120ms ease}
.skm-cat-chip:hover{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 52%,transparent);color:var(--dsw-alias-label-primary,#1f2430);transform:translateY(-1px)}
.skm-cat-chip:active{transform:translateY(0) scale(.97)}
.skm-cat-chip[data-active]{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 15%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-weight:600;box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 36%,transparent),0 2px 10px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 20%,transparent)}
.skm-cat-chip-count{flex:none;min-width:16px;padding:0 5px;box-sizing:border-box;border-radius:999px;background:var(--dsw-alias-bg-module-platform,rgba(0,0,0,.05));color:var(--dsw-alias-label-tertiary,#81858c);font-size:10.5px;line-height:16px;font-variant-numeric:tabular-nums;transition:background 160ms ease,color 160ms ease}
.skm-cat-chip[data-active] .skm-cat-chip-count{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
/* \u5305\u540D\u65C1\u6807\u7B7E\uFF1A\u6574\u9897\u53EF\u70B9\uFF08\u70B9\u5728\u6807\u9898\u884C\u91CC\uFF0C\u7531 JS \u5206\u6D41\u6210\u7B5B\u9009\u800C\u975E\u5C55\u5F00\uFF09\uFF0C\u5E26\u5165\u573A\u5F39\u5165\u3002 */
.skm-bundle-cats{flex:none;display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap;min-width:0}
.skm-bundle-cat-tag{display:inline-flex;align-items:center;gap:4px;height:19px;box-sizing:border-box;padding:0 7px;border-radius:999px;font-size:11px;line-height:17px;white-space:nowrap;cursor:pointer;color:var(--dsw-alias-state-business-primary,#3d6be5);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 11%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent);animation:skm-cat-tag-in 200ms cubic-bezier(.2,.9,.3,1.1) both;transition:background 150ms ease,border-color 150ms ease,transform 120ms ease,box-shadow 180ms ease}
.skm-bundle-cat-tag:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 20%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 45%,transparent);transform:translateY(-1px);box-shadow:0 2px 7px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent)}
.skm-bundle-cat-tag[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:transparent;color:#fff;box-shadow:0 2px 9px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 40%,transparent)}
@keyframes skm-cat-tag-in{from{opacity:0;transform:translateY(3px) scale(.94)}to{opacity:1;transform:none}}
/* \u5206\u7C7B\u7F16\u8F91\u5668 */
.skm-cat-editor{display:flex;flex-direction:column;gap:8px;box-sizing:border-box;width:100%}
.skm-cat-empty{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-cat-selected{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:5px}
.skm-cat-selected-tag{display:inline-flex;align-items:center;gap:5px;height:24px;box-sizing:border-box;padding:0 4px 0 9px;border-radius:999px;font-size:12px;line-height:20px;color:var(--dsw-alias-state-business-primary,#3d6be5);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 26%,transparent);animation:skm-cat-tag-in 200ms cubic-bezier(.2,.9,.3,1.1) both}
.skm-cat-selected-name{white-space:nowrap}
.skm-cat-remove{flex:none;display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;padding:0;border:none;border-radius:50%;background:transparent;color:inherit;cursor:pointer;opacity:.6;transition:opacity 140ms ease,background 140ms ease,transform 140ms ease}
.skm-cat-remove:hover{opacity:1;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent)}
.skm-cat-remove:active{transform:scale(.9)}
.skm-cat-suggest{display:flex;flex-wrap:wrap;gap:4px}
.skm-cat-preset{display:inline-flex;align-items:center;gap:3px;height:23px;box-sizing:border-box;padding:0 8px;border:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.16));border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);font-family:inherit;font-size:11.5px;line-height:19px;cursor:pointer;transition:color 140ms ease,border-color 140ms ease,background 140ms ease,transform 120ms ease}
.skm-cat-preset:hover:not(:disabled){color:var(--dsw-alias-state-business-primary,#3d6be5);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 55%,transparent);border-style:solid;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 9%,transparent);transform:translateY(-1px)}
.skm-cat-preset:active:not(:disabled){transform:translateY(0) scale(.96)}
.skm-cat-preset:disabled{opacity:.4;cursor:default}
.skm-cat-preset-plus{font-size:13px;line-height:16px;opacity:.7}
.skm-cat-input{box-sizing:border-box;width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:9px;padding:0 10px;font-family:inherit;font-size:12.5px;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430);background:var(--dsw-alias-bg-base,#fff);transition:border-color 150ms ease,box-shadow 150ms ease}
.skm-cat-input:focus,.skm-cat-input:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 0 0 3px rgba(61,107,229,.12)}
.skm-cat-limit{margin:0;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}

.skm-chevron{flex:none;margin-left:auto;color:var(--dsw-alias-label-caption,#adb2b8);transition:transform 120ms}
.skm-bundle-row-outer[data-open='true'] .skm-chevron{transform:rotate(180deg)}
.skm-bundle-more{flex:none;display:flex;align-items:center}
.skm-bundle-more-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:8px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-caption,#adb2b8);transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-bundle-more-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-bundle-more-btn:active{transform:scale(.9)}
.skm-bundle-actions{margin-left:auto;display:flex;align-items:center;gap:2px;padding-right:2px}
.skm-icon-action{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:none;border-radius:50%;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-tertiary,#888);transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-icon-action:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary,#0f1115)}
.skm-icon-action:active{transform:scale(.9)}

/* \u2500\u2500 \u6280\u80FD\u5361\u7247\uFF08Skills Hub \u98CE\u683C\uFF09\uFF1A\u53CC\u5217\u7F51\u683C\uFF1B\u5217\u8868\u89C6\u56FE\u5207\u5355\u5217\u5BBD\u5361 \u2500\u2500 */
.skm-skill-grid{list-style:none;margin:8px 0 0;padding:0;width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;box-sizing:border-box}
.skm-skill-grid > .skm-status{grid-column:1/-1;padding-top:4px}
.skm-skill-card{position:relative;min-width:0;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-base,#fff);padding:14px 16px 0;overflow:hidden;opacity:0;animation:skm-card-in 260ms cubic-bezier(.2,.7,.3,1.06) forwards;animation-delay:calc(var(--skm-i,0)*40ms);transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}
.skm-skill-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));box-shadow:0 3px 14px rgba(16,24,40,.08);transform:translateY(-1px)}
@keyframes skm-card-in{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
.skm-skill-card-head{display:flex;align-items:center;gap:10px;min-width:0}
.skm-skill-icon{flex:none;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:12px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b);transition:color 160ms ease,border-color 160ms ease,transform 160ms ease}
.skm-skill-badge{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:10.5px;font-weight:700;letter-spacing:.2px}
.skm-skill-title-wrap{flex:1;min-width:0;display:flex;align-items:center;gap:6px}
.skm-skill-title{flex:1;min-width:0;appearance:none;border:none;background:transparent;padding:0;text-align:left;font-family:inherit;font-size:15px;font-weight:600;line-height:22px;color:var(--dsw-alias-label-primary,#0f1115);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;border-radius:6px;transition:color 140ms ease}
.skm-skill-title:hover{color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-skill-title:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}
.skm-skill-copy{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:none;border-radius:6px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-caption,#adb2b8);opacity:.55;transition:opacity 140ms ease,color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-skill-copy:hover{opacity:1;color:var(--dsw-alias-label-secondary,#61666b);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));transform:scale(1.08)}
.skm-skill-copy:active{transform:scale(.9)}
.skm-skill-copy[data-copied='true']{opacity:1;color:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-skill-card-toggle{flex:none;display:inline-flex;align-items:center}
.skm-skill-card-desc{margin:8px 0 0;appearance:none;border:none;background:transparent;padding:0;text-align:left;font-family:inherit;font-size:13px;line-height:19px;color:var(--dsw-alias-label-tertiary,#81858c);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;min-height:38px;cursor:pointer;transition:color 140ms ease}
.skm-skill-card-desc:hover{color:var(--dsw-alias-label-secondary,#61666b)}
.skm-skill-tags{display:flex;align-items:center;gap:8px;margin-top:12px;min-width:0}
.skm-tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 10px;border-radius:999px;font-size:12px;line-height:20px;box-sizing:border-box;white-space:nowrap;transition:color 160ms ease,border-color 160ms ease,background 160ms ease}
.skm-tag-source{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-tag-scope{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-tag-scope[data-off='true']{border-color:var(--dsw-alias-border-l2,rgba(0,0,0,.12));color:var(--dsw-alias-label-tertiary,#81858c)}
/* \u5173\u6389\u7684\u6280\u80FD\u7559\u5728\u5217\u8868\u91CC\uFF0C\u4F46\u8981\u4E00\u773C\u770B\u51FA\u662F\u5173\u7684\uFF1A\u5DE6\u4FA7\u72B6\u6001\u6761 + \u6807\u9898\u964D\u9971\u548C\uFF08\u5E26\u8FC7\u6E21\uFF09 */
.skm-skill-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background 220ms ease}
.skm-skill-card[data-off='true']{background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.02))}
.skm-skill-card[data-off='true']::before{background:var(--dsw-alias-border-l3,rgba(0,0,0,.2))}
.skm-skill-card[data-off='true'] .skm-skill-badge,.skm-skill-card[data-off='true'] .skm-skill-title{color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-skill-card[data-off='true'] .skm-skill-card-desc{color:var(--dsw-alias-label-quaternary,#a5aab2)}
.skm-skill-badge,.skm-skill-title{transition:color 220ms ease}
.skm-tag-status{background:transparent;border:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.18));color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-skill-meta{margin-left:auto;flex:none;font-size:12px;line-height:17px;color:var(--dsw-alias-label-caption,#adb2b8);white-space:nowrap}
.skm-skill-card-foot{display:flex;align-items:center;gap:6px;margin:12px -16px 0;padding:8px 14px 8px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06))}
.skm-skill-foot-label{flex:none;font-size:12px;line-height:17px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-skill-foot-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;border-radius:8px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-secondary,#61666b);transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-skill-foot-icon:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#f1f3f5);color:var(--dsw-alias-label-primary,#0f1115);transform:scale(1.05)}
.skm-skill-foot-icon:active{transform:scale(.92)}
.skm-skill-foot-icon:disabled{opacity:.38;cursor:default}
.skm-skill-foot-icon:disabled:hover{background:transparent;color:var(--dsw-alias-label-secondary,#61666b);transform:none}
.skm-skill-foot-icon-danger:hover{background:#fdebeb;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-skill-card-actions{margin-left:auto;display:flex;align-items:center;gap:4px}

/* \u2500\u2500 Skills Hub \u9875\u9762\u9AA8\u67B6\uFF1A\u5DE6\u680F\uFF08\u5206\u7C7B/\u7B5B\u9009/\u6DFB\u52A0\uFF09 / \u7EDF\u8BA1\u884C / \u5DE5\u5177\u680F / tabs / \u5206\u7EC4 / \u5361\u7247 \u2500\u2500 */
.skm-hub{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;min-width:0;background:var(--dsw-alias-bg-base,#fff)}
.skm-topbar{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));background:var(--dsw-alias-bg-base,#fff)}
.skm-topbar[data-drop]{outline:2px dashed var(--dsw-alias-state-business-primary,#3d6be5);outline-offset:-2px}
.skm-chip-row{flex:1 1 auto;min-width:200px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.skm-topbar .skm-cat-item{flex:none;width:auto}
.skm-topbar .skm-new-bundle-btn{flex:none;width:auto;margin-top:0;height:32px;font-size:12px}
/* SKILL / MCP \u9876\u5C42 tab\uFF08\u7D27\u8D34\u6807\u9898\u6587\u5B57\u53F3\u4FA7\uFF09 */
.skm-kind-tabs{flex:none;display:inline-flex;align-items:center;gap:4px;padding:2px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:999px;background:var(--dsw-alias-bg-module-platform,#f2f4f7)}
.skm-kind-tab{flex:none;display:inline-flex;align-items:center;justify-content:center;height:24px;box-sizing:border-box;border:none;border-radius:999px;background:transparent;padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-kind-tab:hover{color:var(--dsw-alias-label-primary,#1f2430)}
.skm-kind-tab:active{transform:scale(.96)}
.skm-kind-tab[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 1px 5px rgba(61,107,229,.3)}
/* MCP \u89C6\u56FE\u6839\uFF1A\u5DE6\u4FA7\u7AD6\u6392\u83DC\u5355\uFF08\u540C\u6280\u80FD\u5DE6\u680F\u98CE\u683C\uFF09+ \u5185\u5BB9\u533A */
.skm-mcp-view-root{flex:1;min-height:0;display:flex;min-width:0;overflow-y:auto;padding:14px 20px 22px 0}
.skm-mcp-side{flex:none;width:216px;box-sizing:border-box;padding:4px 12px 0 20px;border-right:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));display:flex;flex-direction:column;gap:2px}
.skm-mcp-main{flex:1;min-width:0;padding:0 4px 0 18px;display:flex;flex-direction:column}
.skm-mcp-tabs{flex:none;display:flex;align-items:center;gap:10px}
.skm-mcp-tab{flex:none;display:inline-flex;align-items:center;justify-content:center;height:34px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 18px;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-tab:hover{color:var(--dsw-alias-label-primary,#1f2430);border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16))}
.skm-mcp-tab:active{transform:scale(.97)}
.skm-mcp-tab[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 2px 8px rgba(61,107,229,.3)}
/* MCP Server \u9875\uFF1A\u5DE6\u4E3B\u5217 + \u53F3\u4FE1\u606F\u5217 */
.skm-mcp-server-layout{flex:none;display:flex;align-items:flex-start;gap:18px;min-width:0}
/* MCP \u9875\u4E3B\u5BB9\u5668 = \u6EDA\u52A8\u5BB9\u5668\uFF1A\u5361\u7247\u591A\u4E86/\u5DE5\u5177\u591A\u4E86\u90FD\u80FD\u6EDA\u5230\u5E95\uFF08\u7236\u5C42 .skm-hub-main \u662F overflow:hidden\uFF09\u3002 */
.skm-mcp-server-main{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;gap:16px;overflow-y:auto;overflow-x:hidden;padding-right:6px;scrollbar-gutter:stable}
/* \u56FE\u4E00\uFF1A\u5934\u90E8 */
.skm-mcp-header{flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.skm-mcp-header-text{min-width:0;display:flex;flex-direction:column;gap:5px}
.skm-mcp-header-title-row{display:flex;align-items:center;gap:10px}
.skm-mcp-header-title{font-size:20px;font-weight:700;line-height:26px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-header-badge{flex:none;display:inline-flex;align-items:center;height:20px;padding:0 9px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:10.5px;font-weight:600;line-height:14px}
.skm-mcp-header-sub{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-mcp-header-actions{flex:none;display:inline-flex;align-items:center;gap:8px}
.skm-mcp-market-btn{flex:none;display:inline-flex;align-items:center;height:34px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;font-size:13px;line-height:18px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:border-color 140ms ease,color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-mcp-market-btn:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.18));color:var(--dsw-alias-label-primary,#1f2430);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.02))}
.skm-mcp-market-btn:active{transform:scale(.98)}
.skm-mcp-add-btn{flex:none;display:inline-flex;align-items:center;height:34px;box-sizing:border-box;border:none;border-radius:10px;background:var(--dsw-alias-state-business-primary,#3d6be5);padding:0 14px;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(61,107,229,.3);transition:background 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-add-btn:hover{background:#3059cf;box-shadow:0 3px 12px rgba(61,107,229,.4);transform:translateY(-1px)}
.skm-mcp-add-btn:active{transform:translateY(0) scale(.98)}
.skm-mcp-bell-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:none;border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-mcp-bell-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-bell-btn:active{transform:scale(.94)}
.skm-mcp-copy-hint{flex:none;margin:0;padding:8px 12px;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#2fb344) 10%,transparent);color:var(--dsw-alias-state-success-primary,#2fb344);font-size:12px;line-height:17px}
/* \u7EDF\u8BA1\u5361\uFF08\u590D\u7528\u6280\u80FD\u7EDF\u8BA1\u5361\u6837\u5F0F\uFF0C\u53BB\u6389\u5217\u8868\u9875\u5185\u8FB9\u8DDD\uFF09 */
/* \u56FE\u4E8C\uFF1A\u5217\u8868\u5361 */
/* MCP \u5FEB\u901F\u4E86\u89E3\u5F15\u5BFC\u5361\uFF08\u5DE6\u680F\u5E95\u90E8\uFF0C\u70B9\u51FB\u53F3\u4FA7\u60AC\u6D6E\uFF1B\u540C\u6280\u80FD\u6307\u5357\u5361\u6837\u5F0F\uFF09 */
.skm-mcp-intro-card{flex:none;display:flex;flex-direction:column;gap:5px;margin-top:auto;box-sizing:border-box;border:1px solid #e4e9f8;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#f3f7ff);padding:14px;cursor:pointer;box-shadow:0 1px 2px rgba(16,24,40,.03);transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-intro-card:hover{border-color:#cdd9f7;box-shadow:0 4px 14px rgba(61,107,229,.08)}
.skm-mcp-intro-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-intro-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-mcp-intro-btn{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;margin-top:4px;height:28px;box-sizing:border-box;border:none;border-radius:999px;background:var(--dsw-alias-state-business-primary,#3d6be5);padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:#fff;cursor:pointer;box-shadow:0 2px 6px rgba(61,107,229,.3);transition:background 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-intro-btn:hover{background:#3059cf;box-shadow:0 3px 10px rgba(61,107,229,.38);transform:translateY(-1px)}
.skm-mcp-intro-btn:active{transform:translateY(0) scale(.97)}
/* MCP \u89E3\u91CA\u60AC\u6D6E\u5C42\uFF08\u540C\u6280\u80FD\u6307\u5357\u6D6E\u5C42\uFF09 */
.skm-mcp-info-overlay{position:fixed;z-index:1001;width:330px;max-height:calc(100vh - 24px);box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 12px 40px rgba(16,24,40,.16);display:flex;flex-direction:column;overflow:hidden;animation:skm-guide-in 240ms cubic-bezier(.2,.7,.3,1.06) both}
.skm-mcp-info-overlay-head{flex:none;display:flex;align-items:center;gap:8px;padding:12px 12px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-mcp-info-overlay-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-info-overlay-title{flex:1;min-width:0;font-size:15px;font-weight:700;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-info-overlay-body{flex:1;min-height:0;overflow-y:auto;padding:12px 14px 20px;display:flex;flex-direction:column;gap:12px}
.skm-mcp-row{display:flex;align-items:center;gap:10px;padding:10px 4px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-mcp-row:first-child{border-top:none}
.skm-mcp-row-logo{flex:none;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-row-logo[data-kind='slack']{background:#fff}
.skm-mcp-row-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.skm-mcp-row-name-row{display:flex;align-items:center;gap:7px;min-width:0}
.skm-mcp-row-name{font-size:13px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-row-tag{flex:none;display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;font-size:10px;line-height:14px;background:#f1f3f5;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-row-tag[data-official]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-row-ext{flex:none;display:inline-flex;border:none;background:transparent;padding:2px;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:color 140ms ease}
.skm-mcp-row-ext:hover{color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-row-desc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-row-status{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11px;line-height:16px;background:#f0f4ee;color:#2f9e44}
.skm-mcp-row-status[data-on]{background:#e7f6ec}
.skm-mcp-row-status:not([data-on]){background:#f2f3f5;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-mcp-view-all{flex:none;align-self:center;display:inline-flex;align-items:center;gap:5px;margin-top:8px;border:none;background:transparent;padding:6px 10px;font-size:12px;line-height:17px;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;font-family:inherit;transition:color 140ms ease}
.skm-mcp-view-all:hover{color:#3059cf}
/* \u63A8\u8350\u884C\u300C\u6DFB\u52A0\u300D\u5C0F\u6309\u94AE */
.skm-mcp-add-small-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:26px;box-sizing:border-box;border:1px solid #bccff5;border-radius:999px;background:#f4f8ff;padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;transition:background 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-add-small-btn:hover{border-color:#9db6ef;background:#e9f1ff}
.skm-mcp-add-small-btn:active{transform:scale(.96)}
/* \u63A8\u8350 MCP Server \u6807\u9898 */
.skm-mcp-recommend-title{flex:none;font-size:15px;font-weight:700;line-height:21px;color:var(--dsw-alias-state-business-primary,#3d6be5)}
/* \u63A8\u8350\u533A\uFF1A\u6807\u9898\u884C + \u5206\u7C7B pills + \u5361\u7247\u7F51\u683C */
.skm-mcp-rec-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px}
.skm-mcp-rec-cats-row{flex:none;display:flex;align-items:center}
.skm-mcp-rec-results-title{flex:none;font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-rec-stars{flex:none;display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;background:var(--dsw-alias-bg-module-platform,#f1f3f5);color:var(--dsw-alias-label-secondary,#61666b);font-size:10.5px;line-height:16px}
.skm-mcp-open-link{flex:none;display:inline-flex;align-items:center;gap:4px;height:26px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 30%,transparent);border-radius:999px;background:transparent;padding:0 11px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-state-business-primary,#3d6be5);text-decoration:none;cursor:pointer;transition:background 140ms ease,transform 140ms ease}
.skm-mcp-open-link:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 10%,transparent)}
.skm-mcp-open-link:active{transform:scale(.96)}
.skm-mcp-rec-card-external{border-style:dashed}
.skm-mcp-resolve-err{flex:none;margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-state-warn-primary,#e0851c)}
.skm-mcp-ext-actions{flex:none;display:inline-flex;align-items:center;gap:6px}
/* MCP Server \u5361\uFF1A\u81EA\u542F\u52A8/\u542F\u7528 \u8BBE\u7F6E\u884C */
.skm-mcp-card-foot{flex:none;display:flex;align-items:center;gap:12px;margin-top:auto;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-mcp-card-item{flex:none;display:inline-flex;align-items:center;gap:6px}
.skm-mcp-card-item-label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-card-item-meta{flex:none;margin-left:auto;font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-card-item-meta[data-on]{color:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-mcp-card-delete{flex:none;margin-left:auto;display:inline-flex;align-items:center;gap:4px;height:26px;box-sizing:border-box;border:1px solid transparent;border-radius:8px;background:transparent;padding:0 8px;font:inherit;font-size:11.5px;font-weight:600;line-height:1;font-family:inherit;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-card-delete:hover{background:#fdebeb;border-color:#f3c4c4;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-mcp-card-delete:active{transform:scale(.94)}
.skm-mcp-card-delete:disabled{opacity:.5;cursor:default;transform:none}
.skm-mcp-rec-cats{flex:none;display:inline-flex;align-items:center;gap:6px}
.skm-mcp-rec-cat{flex:none;display:inline-flex;align-items:center;justify-content:center;height:28px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;font-size:12px;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-rec-cat:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-rec-cat:active{transform:scale(.96)}
.skm-mcp-rec-cat[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff}
.skm-mcp-rec-grid{flex:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.skm-mcp-rec-card{flex:none;min-width:0;display:flex;flex-direction:column;gap:9px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;background:var(--dsw-alias-bg-base,#fff);padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.03);opacity:0;animation:skm-card-in 260ms cubic-bezier(.2,.7,.3,1.06) forwards;transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}
.skm-mcp-rec-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.13));box-shadow:0 4px 14px rgba(16,24,40,.08);transform:translateY(-1px)}
.skm-mcp-rec-card-head{display:flex;align-items:center;gap:10px;min-width:0}
.skm-mcp-rec-card-title-row{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.skm-mcp-rec-card-name{font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-rec-card-tags{display:flex;align-items:center;gap:6px}
.skm-mcp-rec-cat-tag{flex:none;display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:10px;line-height:14px}
.skm-mcp-rec-cat-tag[data-off]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f5a524) 16%,transparent);color:var(--dsw-alias-state-warn-label,#b26b00)}
.skm-mcp-rec-cat-tag[data-shadow]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 10%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);border:1px dashed color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 40%,transparent)}
.skm-mcp-rec-cat-tag[data-locked]{background:var(--dsw-alias-bg-module-platform,#f1f3f5);color:var(--dsw-alias-label-tertiary,#81858c);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08))}
.skm-mcp-tool-chip[data-locked]{text-decoration:line-through}
.skm-mcp-tool-chips{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 8px;max-height:132px;overflow-y:auto}
.skm-mcp-tool-chip[data-locked]{opacity:.5;cursor:not-allowed;text-decoration:line-through}
.skm-mcp-tool-chip{font:inherit;font-size:11px;line-height:16px;padding:1px 7px;border-radius:999px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));background:var(--dsw-alias-bg-module-platform,#f1f3f5);color:var(--dsw-alias-label-tertiary,#81858c);transition:background .12s,color .12s,border-color .12s}
.skm-mcp-tool-chip[data-on]{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#2ba471) 12%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#2ba471) 34%,transparent);color:var(--dsw-alias-state-success-primary,#2ba471)}
.skm-mcp-tool-chip:hover:not(:disabled){border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 50%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-tool-chip:disabled{opacity:.55;cursor:default}
.skm-mcp-tool-chip[data-busy]{opacity:.35}
.skm-mcp-rec-card-desc{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;min-height:36px}
.skm-mcp-rec-card-foot{display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:6px}
.skm-mcp-rec-card-meta{flex:1;min-width:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption,#adb2b8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-added-tag{flex:none;display:inline-flex;align-items:center;gap:4px;height:26px;box-sizing:border-box;border:1px solid #b7e0c3;border-radius:999px;background:#e7f6ec;padding:0 10px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:#2f9e44;cursor:pointer;transition:background 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-added-tag:hover{border-color:#93cfa6;background:#d9f0e1}
.skm-mcp-added-tag:active{transform:scale(.96)}
/* \u6DFB\u52A0 MCP Server \u8868\u5355 */
.skm-mcp-add-form{display:flex;flex-direction:column;gap:8px}
.skm-mcp-add-type-row{display:flex;align-items:center;gap:6px}
.skm-mcp-add-type-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:28px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-add-type-btn:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-add-type-btn:active{transform:scale(.96)}
.skm-mcp-add-type-btn[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff}
/* \u5DE5\u5177\u5217\u8868\u641C\u7D22\u6846 */
.skm-mcp-tool-search{flex:none;display:flex;align-items:center;gap:8px;height:32px;width:260px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:0 10px;color:var(--dsw-alias-label-caption,#adb2b8);transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-mcp-tool-search:focus-within{border-color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 14%,transparent)}
.skm-mcp-tool-search-input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430);font-family:inherit}
.skm-mcp-tool-search-input::placeholder{color:var(--dsw-alias-label-caption,#adb2b8)}
/* \u8FDE\u63A5\u65E5\u5FD7\u884C */
/* \u914D\u7F6E\u6A21\u677F\u5361 */
.skm-mcp-config-grid{flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.skm-mcp-config-card{flex:none;min-width:0;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;background:var(--dsw-alias-bg-base,#fff);padding:12px 14px;box-shadow:0 1px 2px rgba(16,24,40,.03);transition:border-color 160ms ease,box-shadow 160ms ease}
.skm-mcp-config-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.13));box-shadow:0 3px 10px rgba(16,24,40,.07)}
.skm-mcp-config-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.skm-mcp-config-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-config-copy{flex:none;display:inline-flex;align-items:center;height:24px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 30%,transparent);border-radius:999px;background:transparent;padding:0 10px;font-size:11px;line-height:16px;font-family:inherit;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-mcp-config-copy:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 10%,transparent)}
.skm-mcp-config-copy:active{transform:scale(.96)}
.skm-mcp-config-code{flex:none;margin:0;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:17px;overflow:auto}
/* \u56FE\u4E09\uFF1A\u53F3\u4FA7\u4FE1\u606F\u680F */
.skm-mcp-info-col{flex:none;width:322px;display:flex;flex-direction:column;gap:12px}
.skm-mcp-info-card{flex:none;display:flex;flex-direction:column;gap:9px;box-sizing:border-box;border:1px solid #dfe8fa;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#f1f5ff);padding:14px}
.skm-mcp-info-card-title{font-size:14px;font-weight:700;line-height:20px;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-info-desc{margin:0;font-size:12px;line-height:19px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-info-points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.skm-mcp-point{display:flex;gap:8px;align-items:flex-start}
.skm-mcp-point-icon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#e7effe;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-point-body{min-width:0;display:flex;flex-direction:column;gap:1px}
.skm-mcp-point-title{font-size:12px;font-weight:600;line-height:17px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-point-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
/* \u5DE5\u4F5C\u539F\u7406\u6D41\u7A0B */
.skm-mcp-flow{flex:none;display:flex;align-items:center;gap:4px}
.skm-mcp-flow-node{flex:none;width:64px;display:inline-flex;flex-direction:column;align-items:center;gap:4px}
.skm-mcp-flow-icon{flex:none;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:#e7effe;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-flow-icon[data-client]{background:#dbebfd;color:#2276d2}
.skm-mcp-flow-icon[data-server]{background:#eae8fa;color:#6b46e5}
.skm-mcp-flow-label{font-size:10px;line-height:14px;color:var(--dsw-alias-label-secondary,#61666b);white-space:nowrap}
.skm-mcp-flow-arrow{flex:1;min-width:0;display:inline-flex;flex-direction:column;align-items:center;gap:2px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-flow-arrow-text{font-size:9px;line-height:12px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-flow-ext{flex:none;display:flex;flex-direction:column;gap:6px;padding-top:6px;border-top:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.skm-mcp-flow-ext-label{font-size:10px;line-height:14px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-flow-ext-icons{display:flex;gap:8px}
.skm-mcp-flow-ext-icon{flex:none;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.07));border-radius:8px;background:#fff;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-api-text{font-size:9px;font-weight:700;color:var(--dsw-alias-state-business-primary,#3d6be5)}
/* \u5FEB\u901F\u4E0A\u624B */
.skm-mcp-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.skm-mcp-step{display:flex;gap:8px;align-items:flex-start}
.skm-mcp-step-num{flex:none;width:22px;height:22px;border-radius:50%;background:#e7effe;color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:12px;font-weight:700;line-height:22px;text-align:center}
.skm-mcp-step-body{min-width:0;display:flex;flex-direction:column;gap:1px}
.skm-mcp-step-title{font-size:12px;font-weight:600;line-height:17px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-step-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
/* MCP \u7A7A\u6001\uFF08\u5DE5\u5177\u5217\u8868/\u8FDE\u63A5\u65E5\u5FD7/\u914D\u7F6E\u6A21\u677F\u5360\u4F4D\uFF09 */
.skm-mcp-empty{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px}
.skm-mcp-empty-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 4px 12px rgba(61,107,229,.1)}
.skm-mcp-empty-title{font-size:16px;font-weight:700;line-height:22px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-empty-desc{font-size:13px;line-height:19px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-hub-row{flex:1;min-height:0;min-width:0;display:flex}
/* \u53F3\u4FA7\u6307\u5357\u6D6E\u5C42\u5361\uFF08\u70B9\u51FB\u300C\u5F00\u59CB\u5B66\u4E60\u300D\u51FA\u73B0\uFF0C\u8D34\u9762\u677F\u53F3\u7F18\uFF0C\u4E0D\u538B\u7F29\u9762\u677F\uFF09 */
.skm-guide-panel{position:fixed;z-index:1001;width:300px;max-height:calc(100vh - 24px);box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 12px 40px rgba(16,24,40,.16);display:flex;flex-direction:column;overflow:hidden;animation:skm-guide-in 240ms cubic-bezier(.2,.7,.3,1.06) both}
@keyframes skm-guide-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
.skm-guide-panel-head{flex:none;display:flex;align-items:center;gap:8px;padding:12px 12px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-guide-panel-logo{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-guide-panel-title{flex:1;min-width:0;font-size:15px;font-weight:700;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-panel-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-guide-panel-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-panel-close:active{transform:scale(.9)}
.skm-guide-panel-body{flex:1;min-height:0;overflow-y:auto;padding:12px 14px 20px;display:flex;flex-direction:column;gap:14px}
.skm-guide-sec{flex:none;display:flex;flex-direction:column;gap:8px}
.skm-guide-sec-head{display:flex;align-items:center;gap:7px}
.skm-guide-sec-icon{flex:none;display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-guide-sec-title{font-size:14px;font-weight:700;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-what-desc{margin:0;font-size:12px;line-height:19px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-guide-caps{display:flex;flex-wrap:wrap;gap:6px 10px}
.skm-guide-cap{flex:none;display:inline-flex;align-items:center;gap:4px}
.skm-guide-cap-icon{flex:none;display:inline-flex;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-guide-cap-label{font-size:10px;line-height:14px;color:var(--dsw-alias-label-tertiary,#81858c);white-space:nowrap}
.skm-guide-step{display:flex;gap:8px;padding:2px 0}
.skm-guide-step-num{flex:none;width:22px;height:22px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;font-size:12px;font-weight:700;line-height:22px;text-align:center}
.skm-guide-step-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.skm-guide-step-title-row{display:flex;align-items:center;gap:6px}
.skm-guide-step-title{font-size:13px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-step-arrow{margin-left:auto;flex:none;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-guide-step-desc{margin:0;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-guide-full-btn{flex:none;align-self:stretch;display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;height:32px;box-sizing:border-box;border:1px solid #bccff5;border-radius:999px;background:#f4f8ff;color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:12px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;transition:background 140ms ease,border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-guide-full-btn:hover{border-color:#9db6ef;background:#e9f1ff;box-shadow:0 2px 8px rgba(61,107,229,.1)}
.skm-guide-full-btn:active{transform:scale(.98)}
.skm-guide-best{flex:none;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;border:1px solid #dbe6fb;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#eef4ff);padding:12px 12px 0;overflow:hidden;position:relative}
.skm-guide-best-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-best-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.skm-guide-best-item{display:flex;align-items:center;gap:7px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-guide-best-item svg{flex:none;color:#2fb26b}
.skm-guide-more-btn{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;border:none;background:transparent;padding:2px 0;font-size:11px;line-height:16px;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;font-family:inherit;transition:color 140ms ease}
.skm-guide-more-btn:hover{color:#3059cf}
.skm-guide-best-art{flex:none;display:inline-flex;align-items:flex-end;justify-content:center;margin:2px -12px 0;transform:scale(.8);transform-origin:bottom right;pointer-events:none}
.skm-hub-side{flex:none;width:216px;box-sizing:border-box;padding:16px 14px 16px 16px;border-right:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));background:var(--dsw-alias-bg-base,#fff);overflow-y:auto;display:flex;flex-direction:column;gap:2px}
.skm-cat-title{flex:none;margin:0 6px 10px;font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-cat-list{flex:none;display:flex;flex-direction:column;gap:4px;max-height:190px;overflow-y:auto;padding-right:2px;box-sizing:border-box;--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2,rgba(0,0,0,.18));--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2,rgba(0,0,0,.3))}
.skm-cat-item{flex:none;display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;border:1px solid transparent;border-radius:10px;padding:8px 10px;background:transparent;cursor:pointer;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);transition:background 140ms ease,border-color 140ms ease,color 140ms ease,box-shadow 140ms ease}
.skm-cat-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-cat-item[data-active]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);border-color:rgba(61,107,229,.10);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-cat-icon{flex:none;display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;color:var(--dsw-alias-label-caption,#adb2b8);transition:color 140ms ease}
.skm-cat-icon[data-active]{color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-cat-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;font-size:13px;font-weight:500;line-height:18px}
.skm-cat-item[data-active] .skm-cat-label{font-weight:600}
.skm-cat-count{flex:none;font-size:12px;line-height:16px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-cat-item[data-active] .skm-cat-count{color:var(--dsw-alias-state-business-primary,#5b82e5)}
.skm-cat-count[data-warn]{color:#e0851c;font-weight:600}
.skm-filters-title{flex:none;margin:18px 6px 8px;font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-filter-block{flex:none;display:flex;flex-direction:column;gap:8px}
/* \u542F\u7528\u72B6\u6001\uFF1A\u5E73\u94FA\u4E09\u6863\u5206\u6BB5\u6309\u94AE */
.skm-status-seg{flex:none;display:flex;align-items:center;gap:6px;padding:0 2px}
.skm-status-seg-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:30px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 10px;font-size:12px;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;white-space:nowrap;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-status-seg-btn:hover{color:var(--dsw-alias-label-primary,#1f2430);border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16))}
.skm-status-seg-btn:active{transform:scale(.96)}
.skm-status-seg-btn[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 2px 6px rgba(61,107,229,.28)}
.skm-filter-row-wrap{position:relative;flex:none}
.skm-filter-row{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:34px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:9px;background:var(--dsw-alias-bg-base,#fff);padding:0 10px;font-family:inherit;cursor:pointer;transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-filter-row:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16))}
.skm-filter-row[aria-expanded='true']{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-state-business-primary,#3d6be5));box-shadow:0 0 0 2px rgba(61,107,229,.12)}
.skm-filter-row-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-filter-row-label-strong{font-weight:600;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-filter-row-chevron{flex:none;color:var(--dsw-alias-label-caption,#adb2b8);transition:transform 140ms ease}
.skm-filter-row-chevron[data-open]{transform:rotate(180deg)}
.skm-filter-menu{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:60;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 8px 22px rgba(16,24,40,.12);padding:4px;display:flex;flex-direction:column;gap:2px;animation:skm-form-in 140ms ease-out}
.skm-filter-option{display:flex;align-items:center;gap:8px;width:100%;border:none;border-radius:8px;padding:7px 10px;background:transparent;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;font-family:inherit;text-align:left;white-space:nowrap;transition:background 120ms ease,color 120ms ease}
.skm-filter-option:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-preset-dot{flex:none;justify-content:center;width:8px;height:8px;border-radius:50%;background:transparent;margin-left:auto}
.skm-preset-dot[data-on]{background:var(--dsw-alias-state-business-primary,#e0851c)}
/* \u65B0\u5EFA\u6280\u80FD\u5305\u6309\u94AE\uFF08\u5DE6\u680F\uFF0C\u6DFB\u52A0\u6280\u80FD\u5361\u4E0A\u65B9\uFF09 */
.skm-new-bundle-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;width:100%;box-sizing:border-box;margin-top:18px;border:1px solid #c7d6f7;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:13px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;transition:background 140ms ease,border-color 140ms ease,color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-new-bundle-btn:hover{border-color:#9db6ef;background:#e3ecff;box-shadow:0 2px 8px rgba(61,107,229,.12)}
.skm-new-bundle-btn:active{transform:scale(.98)}
.skm-new-bundle-btn-open{border-color:var(--dsw-alias-state-business-primary,#3d6be5);background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 2px 8px rgba(61,107,229,.3)}
.skm-new-bundle-btn-open:hover{background:#3059cf;border-color:#3059cf;color:#fff}
/* \u6DFB\u52A0\u6280\u80FD\u5361 */
.skm-add-card{flex:none;display:flex;flex-direction:column;gap:8px;margin-top:18px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;background:var(--dsw-alias-bg-base,#fff);padding:12px;cursor:pointer;box-shadow:0 1px 2px rgba(16,24,40,.04);transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-add-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.14));box-shadow:0 4px 14px rgba(16,24,40,.08)}
.skm-add-card-active{border-color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 0 0 2px rgba(61,107,229,.14)}
.skm-add-card-head{display:flex;align-items:center;gap:8px}
.skm-add-card-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;color:var(--dsw-alias-state-business-primary,#3d6be5);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent)}
.skm-add-card-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-add-card-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-add-drop{flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;border:1px dashed var(--dsw-alias-border-l3,rgba(0,0,0,.18));border-radius:10px;padding:12px 8px;color:var(--dsw-alias-label-tertiary,#81858c);background:var(--dsw-alias-bg-module-platform,#fafbfc);transition:border-color 140ms ease,background 140ms ease}
.skm-add-card:hover .skm-add-drop{border-color:rgba(61,107,229,.4);background:#f5f8ff}
.skm-add-drop-icon{flex:none;display:inline-flex}
.skm-add-drop-text{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-add-drop-hint{font-size:10px;line-height:14px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-add-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:32px;box-sizing:border-box;border:none;border-radius:9px;background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;box-shadow:0 1px 3px rgba(61,107,229,.35);transition:background 140ms ease,transform 140ms ease,box-shadow 140ms ease}
.skm-add-btn:hover{background:#3059cf;box-shadow:0 2px 8px rgba(61,107,229,.4);transform:translateY(-1px)}
.skm-add-btn:active{transform:translateY(0) scale(.98)}
/* \u5FEB\u901F\u4E0A\u624B\u6307\u5357\u5361\uFF08\u6DFB\u52A0\u6280\u80FD\u5361\u4E0B\u65B9\uFF09 */
.skm-guide-card{flex:none;display:flex;flex-direction:column;gap:5px;margin-top:18px;box-sizing:border-box;border:1px solid #e4e9f8;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#f3f7ff);padding:14px;overflow:hidden;position:relative;box-shadow:0 1px 2px rgba(16,24,40,.03);transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-guide-card:hover{border-color:#cdd9f7;box-shadow:0 4px 14px rgba(61,107,229,.08)}
.skm-guide-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-guide-btn{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;margin-top:4px;height:28px;box-sizing:border-box;border:none;border-radius:999px;background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;font-size:12px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;box-shadow:0 2px 6px rgba(61,107,229,.3);transition:background 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-guide-btn:hover{background:#3059cf;box-shadow:0 3px 10px rgba(61,107,229,.38);transform:translateY(-1px)}
.skm-guide-btn:active{transform:translateY(0) scale(.97)}
.skm-guide-art{flex:none;display:inline-flex;align-items:flex-end;justify-content:center;margin:8px -14px 0;padding-top:6px;background:linear-gradient(180deg,rgba(61,107,229,.06),rgba(61,107,229,.14))}
.skm-guide-modal-text{margin:0;font-size:13px;line-height:22px;color:var(--dsw-alias-label-secondary,#4a4f5a)}
.skm-hub-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.skm-health-notice{flex:none;margin:8px 16px 0;box-sizing:border-box;border:1px solid #f0cf9e;border-radius:10px;background:#fdf6e3;padding:8px 12px;display:flex;flex-direction:column;gap:4px;animation:skm-form-in 180ms ease-out}
.skm-health-notice-title{font-size:12px;font-weight:700;line-height:17px;color:#b45309}
.skm-health-notice ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.skm-health-notice li{font-size:12px;line-height:17px;color:#8a5a17}
.skm-toolbar{flex:none;display:flex;align-items:center;gap:8px;padding:12px 16px 4px;flex-wrap:wrap}
.skm-search-box{flex:1;min-width:170px;display:flex;align-items:center;gap:8px;height:36px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;color:var(--dsw-alias-label-caption,#adb2b8);transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-search-box:focus-within{border-color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 0 0 3px rgba(65,118,230,.14)}
.skm-search-input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary,#0f1115);font-family:inherit}
.skm-search-input::placeholder{color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-tool-select-wrap{position:relative;flex:none;display:inline-flex;align-items:center}
.skm-tool-select{appearance:none;-webkit-appearance:none;height:36px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-size:13px;line-height:18px;font-family:inherit;padding:0 26px 0 12px;cursor:pointer;transition:border-color 140ms ease,background 140ms ease}
.skm-tool-select:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.18))}
.skm-tool-select:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-tool-select-chevron{position:absolute;right:9px;pointer-events:none;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-tool-button{flex:none;display:inline-flex;align-items:center;gap:6px;height:36px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-size:13px;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;transition:border-color 140ms ease,background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-tool-button:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#f7f8f9);color:var(--dsw-alias-label-primary,#0f1115)}
.skm-drop-label-ellipsis{display:block;min-width:0;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* \u5DE5\u4F5C\u533A/\u5168\u5C40\u6765\u6E90\u6807\u7B7E\uFF1A\u9762\u677F\u5757\u4E0A\u533A\u5206\u300C\u8FD9\u6761\u5C5E\u4E8E\u5F53\u524D\u5DE5\u4F5C\u533A\u300D\u8FD8\u662F\u300C\u5168\u5C40\u5171\u7528\u300D\u3002 */
.skm-scope-tag{flex:none;display:inline-flex;align-items:center;gap:3px;height:17px;padding:0 6px;border-radius:6px;font-size:11px;line-height:17px;font-weight:600;letter-spacing:.02em;white-space:nowrap}
.skm-scope-tag[data-scope='workspace']{background:var(--dsw-alias-bg-accent,rgba(88,101,242,.14));color:var(--dsw-alias-label-accent,#4b57d6)}
.skm-scope-tag[data-scope='global']{background:var(--dsw-alias-bg-neutral,rgba(0,0,0,.06));color:var(--dsw-alias-label-secondary,#61666b)}
.skm-scope-tag[data-side='closed']{background:var(--dsw-alias-bg-danger,rgba(220,38,38,.12));color:var(--dsw-alias-label-danger,#c02424)}
.skm-tool-button:active{transform:scale(.97)}
.skm-tool-button:disabled{opacity:.5;cursor:default}
.skm-toolbar-spacer{flex:1 1 12px}
.skm-bulk-overlay{position:fixed;inset:0;z-index:995;border:none;background:transparent;cursor:default;padding:0}
.skm-preset-pill{position:relative;flex:none;display:inline-flex;align-items:center;gap:6px;height:36px;box-sizing:border-box;border:1px solid #c9d6f5;border-radius:10px;background:#eef3fd;color:#3b62d6;padding:0 10px;font-family:inherit;font-size:13px;line-height:18px;cursor:pointer;transition:border-color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-preset-pill:active{transform:scale(.97)}
.skm-preset-pill-label{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-preset-select{appearance:none;-webkit-appearance:none;border:none;outline:none;background:transparent;color:inherit;font-size:13px;line-height:18px;font-family:inherit;padding:0 18px 0 0;cursor:pointer;max-width:150px}
.skm-preset-pill-chevron{pointer-events:none;color:#6f8cd6;transition:transform 140ms ease}
.skm-preset-pill[aria-expanded='true'] .skm-preset-pill-chevron{transform:rotate(180deg)}
.skm-drop-wrap{position:relative;flex:none}
.skm-drop-menu{position:absolute;top:calc(100% + 4px);left:0;z-index:996;min-width:180px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 6px 20px rgba(16,24,40,.12);padding:4px;display:flex;flex-direction:column;gap:2px;animation:skm-form-in 140ms ease-out;max-height:320px;overflow-y:auto}
.skm-drop-item{display:flex;align-items:center;gap:8px;border:none;border-radius:8px;padding:7px 10px;background:transparent;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;font-family:inherit;text-align:left;white-space:nowrap;transition:background 120ms ease,color 120ms ease}
.skm-drop-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#0f1115)}
.skm-drop-item[aria-checked='true']{color:var(--dsw-alias-label-primary,#0f1115);font-weight:600}
.skm-drop-check{flex:none;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--dsw-alias-state-business-primary,#4176e6);opacity:0;transform:scale(.6);transition:opacity 140ms ease,transform 140ms ease}
.skm-drop-check[data-on]{opacity:1;transform:scale(1)}
.skm-drop-badge{margin-left:auto;flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b);background:var(--dsw-alias-bg-module-platform,#f1f3f5);border-radius:999px;padding:0 8px}
.skm-view-toggle{flex:none;display:inline-flex;align-items:center;gap:2px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:3px;transition:border-color 140ms ease}
.skm-view-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:30px;height:28px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-view-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary,#61666b)}
.skm-view-btn[data-active]{background:var(--dsw-alias-bg-module-platform,#eef0f2);color:var(--dsw-alias-label-primary,#0f1115)}
.skm-view-btn:active{transform:scale(.94)}
.skm-hint-row{flex:none;display:flex;align-items:center;gap:10px;padding:6px 16px 0}
.skm-hint-row-text{flex:1;min-width:0;font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-banner{flex:none;display:flex;align-items:center;gap:12px;margin:10px 16px 0;box-sizing:border-box;border:1px solid #f2df9e;border-radius:14px;background:#fdf8e3;padding:10px 12px;cursor:pointer;transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-banner:hover{border-color:#ecd58a;box-shadow:0 2px 8px rgba(232,163,61,.12)}
.skm-banner:active{transform:scale(.995)}
.skm-banner-active{border-color:#e8a33d;box-shadow:0 0 0 3px rgba(232,163,61,.18)}
.skm-banner-icon{flex:none;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:1.5px solid #e8a33d;color:#e8a33d;background:transparent}
.skm-banner-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.skm-banner-title{font-size:14px;font-weight:700;line-height:20px;color:#1f2937}
.skm-banner-sub{font-size:12px;line-height:17px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-banner-btn{flex:none;display:inline-flex;align-items:center;height:32px;box-sizing:border-box;border:none;border-radius:10px;background:#e8850c;color:#fff;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;padding:0 14px;cursor:pointer;box-shadow:0 1px 3px rgba(232,133,12,.35);transition:background 140ms ease,transform 140ms ease,box-shadow 140ms ease}
.skm-banner-btn:hover{background:#d67906;box-shadow:0 2px 8px rgba(232,133,12,.4);transform:translateY(-1px)}
.skm-banner-btn:active{transform:translateY(0) scale(.98)}
.skm-main-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:12px 16px 20px;display:flex;flex-direction:column;gap:12px;scrollbar-gutter:stable}
.skm-hub-section{min-width:0;width:100%;box-sizing:border-box}
/* \u5C55\u5F00/\u6298\u53E0\u6052\u4E3A\u6574\u884C\u5BBD\uFF1A\u65E7\u89C4\u5219\u53EA\u8BA9 data-open \u7684 section \u8DE8\u4E24\u5217\uFF0C\u6536\u8D77\u65F6\u4F1A\u7F29\u6210\u534A\u5BBD\u3002 */
.skm-hub-section{display:flex;flex-direction:column;min-width:0}
.skm-hub-section-head{display:flex;align-items:center;gap:8px;min-width:0;padding:2px 4px 0}
.skm-no-result{padding:18px 4px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,#81858c)}
/* \u65B0\u5EFA\u6280\u80FD\u5305\u5165\u53E3\uFF08\u7070\u5B57\u6309\u94AE\u884C\uFF09 */
.skm-new-bundle-line{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:4px;border:none;border-radius:8px;padding:6px 10px;margin:2px 0 0 4px;background:transparent;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c);cursor:pointer;font-family:inherit;transition:background 140ms ease,color 140ms ease}
.skm-new-bundle-line:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary,#61666b)}
/* \u5206\u9875\u884C */
.skm-pagination{flex:none;display:flex;align-items:center;gap:10px;padding:4px 4px 0}
.skm-page-info{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-page-btns{flex:1;display:flex;align-items:center;gap:4px}
.skm-page-btn{flex:none;min-width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-size:12px;line-height:18px;font-family:inherit;cursor:pointer;transition:border-color 140ms ease,color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-page-btn:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-page-btn:active{transform:scale(.94)}
.skm-page-btn:disabled{opacity:.45;cursor:default}
.skm-page-btn[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff}
.skm-page-size-sel{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b)}

/* \u2500\u2500 \u5F52\u5165\u6280\u80FD\u5305\u5F39\u7A97\uFF08\u5361\u7247\u5316\uFF0C\u4E0E\u6280\u80FD\u5361\u7247\u540C\u8BED\u8A00\uFF09 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.skm-assign-modal{width:min(560px,calc(100vw - 48px))}
.skm-assign-modal-body{overflow:hidden;display:flex;flex-direction:column;max-height:min(560px,calc(100vh - 180px))}
.skm-assign-list{list-style:none;margin:0;padding:4px 2px 2px;display:flex;flex-direction:column;gap:8px;overflow-y:auto}
.skm-assign-card{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));border-radius:12px;background:var(--dsw-alias-bg-base,#fff);padding:10px 12px;cursor:pointer;font-family:inherit;text-align:left;opacity:0;animation:skm-card-in 240ms cubic-bezier(.2,.7,.3,1.06) forwards;animation-delay:calc(var(--skm-i,0)*45ms);transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-assign-card:hover{border-color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 2px 8px rgba(16,24,40,.07);transform:translateY(-1px)}
.skm-assign-card:active{transform:translateY(0) scale(.99)}
.skm-assign-card-icon{flex:none;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b);transition:color 140ms ease,border-color 140ms ease}
.skm-assign-card:hover .skm-assign-card-icon{color:var(--dsw-alias-label-primary,#0f1115);border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.14))}
.skm-assign-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.skm-assign-card-name{font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary,#0f1115);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-assign-card-desc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-assign-go{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;color:var(--dsw-alias-label-caption,#adb2b8);transform:rotate(-90deg);transition:transform 160ms ease,background 140ms ease,color 140ms ease}
.skm-assign-card:hover .skm-assign-go{transform:rotate(-90deg) translateX(2px);color:var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03))}
.skm-skill-list{list-style:none;margin:0;padding:2px 6px 6px;width:100%;display:flex;flex-direction:column;gap:2px}
.skm-skill-item{display:flex;flex-direction:column;gap:2px;padding:2px 0;border-radius:8px}
.skm-skill-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-row{display:flex;align-items:center;gap:6px;padding:2px 6px;border-radius:8px}
.skm-skill-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-label{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.skm-skill-name{font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary,#eee);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-skill-desc{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-skill-expand{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:none;border-radius:6px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-tertiary,#888);transition:transform 120ms}
.skm-skill-expand:hover{color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-expand[data-open='true']{transform:rotate(180deg)}
.skm-skill-count{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:8px;padding:0 6px;white-space:nowrap}
.skm-skill-compat{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}
.skm-skill-files{list-style:none;margin:0 0 2px 10px;padding:2px 0 2px 10px;border-left:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));display:flex;flex-direction:column;gap:0}
.skm-skill-file{display:flex;align-items:center;gap:6px;padding:2px 6px;border-radius:6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#bbb);font-family:ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.skm-skill-file:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-file[data-main='true']{color:var(--dsw-alias-label-primary,#eee);font-weight:500}
.skm-skill-dir{color:var(--dsw-alias-label-tertiary,#888)}
.skm-skill-preview{border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:10px;background:var(--dsw-alias-bg-base,#0e1116);padding:8px 12px;margin:0 0 2px 10px;font-size:12px;line-height:20px;color:var(--dsw-alias-label-primary,#eee);overflow:auto;max-height:280px;box-sizing:border-box}
.skm-skill-preview h3,.skm-skill-preview h4,.skm-skill-preview h5{margin:10px 0 4px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary,#eee)}
.skm-skill-preview p{margin:4px 0}
.skm-skill-preview pre{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:8px;padding:8px 10px;overflow:auto;font-family:ui-monospace,monospace;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#bbb);margin:6px 0}
.skm-skill-preview code{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:4px;padding:0 4px;font-family:ui-monospace,monospace;font-size:11px}
.skm-skill-preview a{color:var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-skill-preview ul{margin:4px 0;padding-left:18px}
.skm-skill-preview li{margin:2px 0}
/* \u67E5\u770B\u5668\u9ED8\u8BA4\u5C31\u662F\u5927\u753B\u5E45\uFF081280\xD7880 \u4E0A\u9650\uFF0C\u968F\u89C6\u53E3\u6536\u7F29\uFF09\uFF0C\u53EF\u4E00\u952E\u5168\u5C4F\uFF1B\u5BBD/\u9AD8\u5E26\u7F13\u52A8\u8FC7\u6E21\u3002 */
.skm-viewer-modal{width:min(1280px,calc(100vw - 64px));animation:skm-viewer-in 260ms cubic-bezier(.2,.7,.3,1.06);transition:width 320ms cubic-bezier(.22,.72,.24,1)}
.skm-viewer-modal-full{width:calc(100vw - 48px)}
@keyframes skm-viewer-in{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
.skm-viewer-body{overflow:hidden;display:flex;flex-direction:column;height:min(880px,calc(100vh - 96px));transition:height 320ms cubic-bezier(.22,.72,.24,1);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2)}
/* \u5B98\u65B9 Modal \u7684 root \u81EA\u5E26 24px \u5185\u8FB9\u8DDD\u3001dialog \u81EA\u5E26 24px \u4E0B\u5185\u8FB9\u8DDD\uFF1A
   \u5168\u5C4F\u6863\u6309\u8FD9\u4E24\u5904\u7559\u767D\u6536\uFF0C\u514D\u5F97\u88AB flex-shrink \u622A\u65AD\u6216\u4E0A\u4E0B\u6EA2\u51FA\u3002 */
.skm-viewer-modal-full .skm-viewer-body{height:calc(100vh - 76px)}
/* \u5F39\u7A97\u5934\u90E8\uFF08\u5B98\u65B9 Modal \u7684 header \u662F\u672C\u5BB9\u5668\u7B2C\u4E00\u4E2A div\uFF09\uFF1A\u968F\u5927\u753B\u5E45\u653E\u5927\u4E00\u6863\u3002 */
.skm-viewer-body > div:first-child{padding:20px 18px 0 26px}
.skm-viewer-body > div:first-child h2{font-size:17px;line-height:26px;font-weight:600}
.skm-viewer-body > div:nth-of-type(2){flex:1;min-height:0;display:flex;flex-direction:column;margin-top:2px;padding:0 20px 20px}
.skm-viewer-toolbar{flex:none;display:flex;align-items:center;gap:10px;padding:0 2px 12px}
.skm-viewer-path{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font-size:12.5px;line-height:18px;font-family:ui-monospace,monospace;color:var(--dsw-alias-label-tertiary,#888);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.skm-viewer-path b{font-weight:600;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-viewer-tool-group{flex:none;display:inline-flex;align-items:center;gap:2px;padding:2px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7)}
.skm-viewer-tool-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:26px;padding:0 7px;box-sizing:border-box;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);font-family:inherit;font-weight:600;line-height:16px;cursor:pointer;transition:background 140ms ease,color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-viewer-tool-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-viewer-tool-btn:active{transform:scale(.93)}
.skm-viewer-tool-btn[data-active='true']{background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 1px 3px rgba(16,24,40,.12)}
.skm-viewer-tool-btn-a1{font-size:11px}
.skm-viewer-tool-btn-a3{font-size:15px}
.skm-viewer-tool-btn-frame{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:10px;background:var(--dsw-alias-bg-base,#fff)}
.skm-viewer-tool-btn-frame[data-active='true']{border-color:var(--dsw-alias-state-business-primary,#4176e6);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4176e6) 10%,transparent);color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:none}
.skm-viewer-layout{flex:1;min-height:0;display:flex;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:14px;overflow:hidden}
.skm-viewer-nav{flex:none;width:252px;border-right:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));overflow-y:auto;padding:8px;box-sizing:border-box;background:var(--dsw-alias-bg-module-platform,#f5f6f7)}
.skm-viewer-nav-item{display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:8px;font-size:12.5px;line-height:20px;color:var(--dsw-alias-label-secondary,#bbb);font-family:ui-monospace,monospace;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background 140ms ease,color 140ms ease,box-shadow 160ms ease}
.skm-viewer-nav-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-viewer-nav-item[data-active='true']{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4a9eff) 14%,transparent);color:var(--dsw-alias-label-primary,#eee);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-viewer-nav-dir{cursor:default;color:var(--dsw-alias-label-tertiary,#888)}
/* \u6B63\u6587\u5168\u90E8\u8D70 em\uFF1A--skm-vfs \u4E00\u4E2A\u53D8\u91CF\u9A71\u52A8\u5B57\u53F7\u4E09\u6863\uFF0C\u5207\u6362\u65F6\u53EA\u8FC7\u6E21 font-size\u3002 */
.skm-viewer-content{flex:1;min-width:0;overflow:auto;padding:26px 34px 48px;box-sizing:border-box;font-size:var(--skm-vfs,15px);line-height:1.75;color:var(--dsw-alias-label-primary,#eee);transition:font-size 180ms ease}
.skm-viewer-content > :first-child{margin-top:0}
.skm-viewer-content h1,.skm-viewer-content h2,.skm-viewer-content h3,.skm-viewer-content h4,.skm-viewer-content h5{margin:1.15em 0 .5em;line-height:1.35;font-weight:600;color:var(--dsw-alias-label-primary,#eee);max-width:84ch}
.skm-viewer-content h1{font-size:1.72em;letter-spacing:-.012em}
.skm-viewer-content h2{font-size:1.38em}
.skm-viewer-content h3{font-size:1.16em}
.skm-viewer-content h4,.skm-viewer-content h5{font-size:1.04em}
.skm-viewer-content p{margin:.62em 0;max-width:92ch}
.skm-viewer-content pre{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:10px;padding:14px 16px;overflow:auto;font-family:ui-monospace,monospace;font-size:.86em;line-height:1.7;color:var(--dsw-alias-label-secondary,#bbb)}
.skm-viewer-content code{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:5px;padding:1px 5px;font-family:ui-monospace,monospace;font-size:.86em}
.skm-viewer-content pre code{background:transparent;padding:0}
.skm-viewer-content a{color:var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-viewer-content ul,.skm-viewer-content ol{margin:.62em 0;padding-left:1.6em}
.skm-viewer-content li{margin:.32em 0;max-width:92ch}
.skm-viewer-content blockquote{margin:.9em 0;padding:.25em 1em;border-left:3px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));color:var(--dsw-alias-label-secondary,#bbb);max-width:82ch}
.skm-viewer-content hr{border:none;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));margin:1.5em 0}
.skm-loose-empty{margin:2px;padding:4px 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* \u2500\u2500 \u6280\u80FD/\u6280\u80FD\u5305\u5F00\u5173\uFF08Skills Hub \u98CE\u683C\uFF1A\u7EFF\u8272\u80F6\u56CA + \u767D\u8272\u5706\u94AE\uFF0C\u56DE\u5F39\u8FC7\u6E21\uFF09 \u2500\u2500 */
.skm-toggle{flex:none;display:inline-flex;align-items:center;width:34px;height:20px;box-sizing:border-box;border-radius:10px;padding:2px;appearance:none;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:var(--dsw-alias-bg-module-platform,#e9ebee);cursor:pointer;transition:background 160ms ease,border-color 160ms ease,filter 160ms ease}
.skm-toggle:hover{filter:brightness(1.03)}
.skm-toggle:disabled{opacity:.55;cursor:not-allowed;filter:none}
.skm-toggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}
.skm-toggle-on{border-color:transparent;background:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-toggle-off{background:var(--dsw-alias-bg-module-platform,#e9ebee);border-color:var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.skm-toggle-knob{display:block;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform 180ms cubic-bezier(.3,1.4,.5,1)}
.skm-toggle-on .skm-toggle-knob{transform:translateX(14px)}
.skm-toggle-off .skm-toggle-knob{transform:translateX(0)}
.skm-bundle-toggle{flex:none;display:inline-flex;align-items:center;gap:4px;margin-left:0}

/* \u2500\u2500 Agent \u9884\u8BBE\u5206\u7C7B\u5706\u7403\u6761\uFF08\u5F27\u5F62\u6062\u590D\uFF0C\u6574\u5217\u4F4D\u4E8E\u7EDF\u8BA1\u884C\u4E0E\u5DE5\u5177\u680F\u4E4B\u95F4\uFF09 \u2500\u2500 */
.skm-preset-strip{flex:none;display:flex;align-items:flex-start;gap:10px;padding:12px 16px 0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
.skm-preset-strip::-webkit-scrollbar{display:none}
.skm-preset-ball-wrap{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;width:56px;border:none;background:transparent;padding:0;cursor:pointer;font-family:inherit}
.skm-preset-ball{position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;box-sizing:border-box;font-size:17px;font-weight:600;line-height:1;color:var(--dsw-alias-label-primary,#eee);text-transform:uppercase;background:var(--dsw-alias-bg-layer-2,#262b36);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));transition:border-color 140ms,filter 140ms}
.skm-preset-ball-wrap:hover .skm-preset-ball{filter:brightness(1.15)}
.skm-preset-ball-wrap[data-active='true'] .skm-preset-ball{border-color:var(--dsw-alias-state-business-primary,#4a9eff);box-shadow:inset 0 0 0 1px var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-preset-ball[data-dot='true']::after{content:'';position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#4a9eff);border:2px solid var(--dsw-alias-bg-layer-1,#1c1f26);box-sizing:border-box}
.skm-preset-ball-label{max-width:56px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.skm-preset-ball-wrap[data-active='true'] .skm-preset-ball-label{color:var(--dsw-alias-label-primary,#eee)}
.skm-preset-hint{flex:none;display:flex;align-items:center;gap:8px;padding:0 2px 2px}
.skm-preset-hint-text{flex:1;min-width:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-preset-reset{flex:none;appearance:none;border:none;border-radius:12px;padding:2px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#999);background:transparent;cursor:pointer;font-family:inherit}
.skm-preset-reset:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}

/* \u2500\u2500 \u9762\u677F\u7EA7\u63D0\u793A\u6761\uFF1A\u5220\u9664/\u5F52\u7EC4/\u6539\u540D/\u5B89\u88C5\u7684\u6210\u8D25\u90FD\u8981\u8BA9\u7528\u6237\u770B\u89C1 \u2500\u2500 */
.skm-toast-stack{position:absolute;right:18px;bottom:18px;z-index:6;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}
.skm-toast{display:inline-flex;align-items:center;gap:8px;max-width:min(460px,72vw);box-sizing:border-box;padding:8px 14px;border-radius:10px;font-size:12.5px;line-height:18px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:var(--dsw-static-neutral-bluish-00,#fff);color:var(--dsw-alias-label-primary,#222);box-shadow:var(--dsw-shadow-lv2,0 6px 22px rgba(0,0,0,.16));animation:skm-toast-in 260ms cubic-bezier(.2,.9,.25,1) both}
.skm-toast-ok{border-color:rgba(35,160,90,.38);color:#1c7a45}
.skm-toast-err{border-color:rgba(226,80,64,.42);color:#b3271c}
.skm-toast-dot{flex:none;width:6px;height:6px;border-radius:50%;background:currentColor;animation:skm-toast-ping 1.7s ease-out infinite}
@keyframes skm-toast-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes skm-toast-ping{0%{box-shadow:0 0 0 0 currentColor;opacity:.9}70%{box-shadow:0 0 0 7px rgba(0,0,0,0);opacity:.35}100%{box-shadow:0 0 0 0 rgba(0,0,0,0);opacity:1}}
body[data-ds-dark-theme] .skm-toast{background:var(--dsw-static-neutral-bluish-850,#2c2c2e)}
body[data-ds-dark-theme] .skm-toast-ok{color:#6ee7a8}
body[data-ds-dark-theme] .skm-toast-err{color:#ff8a7a}

/* \u2500\u2500 \u7A7A\u6280\u80FD\u5305\uFF1A\u53EF\u89C1 + \u53EF\u64CD\u4F5C\uFF08\u65E7\u5B9E\u73B0\u628A 0 \u6210\u5458\u7684\u5305\u6574\u6BB5\u8FC7\u6EE4\u6389\uFF0C\u5EFA\u5B8C\u5305\u5C31\u300C\u6D88\u5931\u300D\uFF09 \u2500\u2500 */
.skm-bundle-empty{grid-column:1/-1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-sizing:border-box;margin:2px 0 6px;padding:14px 16px;border:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.18));border-radius:12px;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.02));animation:skm-fade-up 260ms ease both}
.skm-bundle-empty-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,#333)}
.skm-bundle-empty-hint{flex:1 1 200px;min-width:160px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8b9099)}
.skm-bundle-empty-btn{flex:none;display:inline-flex;align-items:center;gap:6px;appearance:none;border:1px solid var(--dsw-alias-state-business-primary,#4176e6);border-radius:9px;padding:5px 12px;font-size:12px;line-height:18px;font-family:inherit;cursor:pointer;color:var(--dsw-alias-state-business-primary,#4176e6);background:transparent;transition:background 160ms ease,color 160ms ease,transform 160ms ease,box-shadow 160ms ease}
.skm-bundle-empty-btn:hover{background:var(--dsw-alias-state-business-primary,#4176e6);color:#fff;transform:translateY(-1px);box-shadow:0 4px 14px rgba(65,118,230,.28)}
.skm-bundle-empty-btn:active{transform:translateY(0)}
@keyframes skm-fade-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* \u2500\u2500 \u8D26\u672C\u5931\u6548\u5F15\u7528\uFF1A\u660E\u8BF4\u300C\u5305\u91CC\u6709\u6307\u5411\u5DF2\u5220\u9664\u6280\u80FD\u7684\u6761\u76EE\u300D\u5E76\u4E00\u952E\u6E05\u7406 \u2500\u2500 */
.skm-bundle-missing{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:2px 0 6px;padding:8px 12px;border-radius:10px;border:1px solid rgba(240,150,40,.38);background:rgba(240,150,40,.09);font-size:12px;line-height:18px;color:#8a5a12;animation:skm-fade-up 260ms ease both}
.skm-bundle-missing code{padding:1px 6px;border-radius:5px;background:rgba(240,150,40,.16);font-size:11.5px}
.skm-bundle-missing-btn{appearance:none;border:1px solid rgba(240,150,40,.55);background:transparent;border-radius:8px;padding:2px 9px;font-size:11.5px;line-height:18px;font-family:inherit;cursor:pointer;color:inherit;transition:background 140ms ease,transform 140ms ease}
.skm-bundle-missing-btn:hover{background:rgba(240,150,40,.2);transform:translateY(-1px)}
body[data-ds-dark-theme] .skm-bundle-missing{color:#f0c48a}
.skm-install-hint{margin:2px 0 0;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-tertiary,#8b9099)}

/* \u2500\u2500 SKILL \u9876\u680F\u64CD\u4F5C\u884C\uFF1A\u641C\u7D22 + \u72B6\u6001\u5206\u6BB5\uFF08\u5E26\u8BA1\u6570\uFF09+ \u5065\u5EB7\u6307\u793A + \u5237\u65B0/\u65B0\u5EFA/\u6DFB\u52A0 \u2500\u2500 */
.skm-topbar-actions{flex:1 1 100%;order:4;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.skm-status-seg-count{margin-left:6px;font-size:11px;line-height:15px;font-variant-numeric:tabular-nums;opacity:.72}
.skm-health-inline{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:17px;white-space:nowrap;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-health-inline::before{content:'';flex:none;width:7px;height:7px;border-radius:50%;background:currentColor}
.skm-health-inline[data-tone='ok']{color:#12805c}
.skm-health-inline[data-tone='warn']{color:#c2410c}
.skm-health-inline[data-tone='pending'],.skm-health-inline[data-tone='idle']{color:var(--dsw-alias-label-caption,#adb2b8)}

/* \u2500\u2500 \u79FB\u52A8\u7AEF\uFF1A\u4FA7\u680F\u6536\u7A84/\u9690\u85CF\u3001\u67E5\u770B\u5668\u4E0A\u4E0B\u5806\u53E0\u3001\u5361\u7247\u7F51\u683C\u5355\u5217 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (max-width: 767.98px) {
  .skm-viewer-modal,.skm-viewer-modal-full{width:calc(100vw - 48px)}
  .skm-viewer-body,.skm-viewer-modal-full .skm-viewer-body{height:calc(100vh - 76px)}
  .skm-viewer-body > div:nth-of-type(2){padding:0 10px 10px}
  .skm-viewer-toolbar{flex-wrap:wrap;gap:6px;padding-bottom:8px}
  .skm-viewer-layout{flex-direction:column}
  .skm-viewer-nav{width:100%;border-right:none;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));flex:none;max-height:38%}
  .skm-viewer-content{flex:1;min-height:0;padding:16px 14px 28px}
  .skm-hub-side{display:none}
  .skm-skill-grid{grid-template-columns:minmax(0,1fr)}
  .skm-toolbar{padding:12px 12px 4px}
  .skm-banner{margin:10px 12px 0}
  .skm-main-scroll{padding:12px 12px 20px}
}

/* \u2500\u2500 \u51CF\u5F31\u52A8\u6548\uFF1A\u5361\u7247\u5165\u573A/\u60AC\u505C\u4F4D\u79FB\u4E0E\u5F00\u5173\u56DE\u5F39\u5168\u90E8\u6536\u655B \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (prefers-reduced-motion: reduce) {
  .skm-skill-card{animation:none;opacity:1;transition:none}
  .skm-assign-card{animation:none;opacity:1;transition:none}
  .skm-drop-menu{animation:none}
  .skm-viewer-modal{animation:none}
  .skm-viewer-modal,.skm-viewer-body,.skm-viewer-content,.skm-viewer-nav-item,.skm-viewer-tool-btn{transition:none}
  .skm-toggle-knob{transition:none}
  .skm-toggle{transition:none}
  .skm-tag{transition:none}
  .skm-skill-copy,.skm-skill-icon,.skm-skill-foot-icon,.skm-icon-action,.skm-bundle,.skm-hub-item,.skm-tool-button,.skm-banner,.skm-banner-btn,.skm-view-btn,.skm-drop-item,.skm-assign-card{transition:none}
  .skm-toast{animation:none}
  .skm-toast-dot{animation:none}
  .skm-bundle-empty,.skm-bundle-missing{animation:none}
  .skm-bundle-empty-btn,.skm-bundle-missing-btn{transition:none}
  .skm-skill-card::before,.skm-skill-badge,.skm-skill-title,.skm-tag-status{transition:none}
  .skm-cat-chip-row{animation:none}
  .skm-bundle-cat-tag,.skm-cat-selected-tag{animation:none}
  .skm-cat-chip,.skm-bundle-cat-tag,.skm-cat-preset,.skm-cat-remove,.skm-cat-input,.skm-cat-chip-count{transition:none}
}
`;
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID3) !== null) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID3;
  tag.textContent = SHEET3;
  document.head.appendChild(tag);
}

// src/client/prompt/dnd.ts
var MIME = "application/x-dsh-prompt-part";
function isPanelDrag(event) {
  const types = event.dataTransfer?.types;
  if (types === void 0) return false;
  return Array.from(types).includes(MIME);
}
var current = null;
var phaseDrop = null;
function beginDrag(event, payload) {
  current = payload;
  try {
    event.dataTransfer.setData(MIME, JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", payload.name);
    event.dataTransfer.effectAllowed = "copyMove";
  } catch {
  }
}
function finishDrag() {
  current = null;
}
function payloadOf(event) {
  try {
    const raw = event.dataTransfer.getData(MIME);
    if (raw !== "") return JSON.parse(raw);
  } catch {
  }
  return current;
}
function acceptsDrop(event, kind) {
  const payload = payloadOf(event);
  return payload !== null && payload.kind === kind;
}
function setPhaseDropHandler(next) {
  phaseDrop = next;
}
function dropOnPhase(key, payload) {
  if (payload === null) return;
  phaseDrop?.(key, payload);
}

// src/client/prompt/styles.ts
var s = (() => {
  const flex = { display: "flex", alignItems: "center" };
  return {
    // ── 面板骨架（抽屉内部分栏布局） ──────────────────────────────────
    pRoot: { height: "100%", display: "flex", flexDirection: "column", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5, minHeight: 0 },
    head: { ...flex, gap: 10, padding: "10px 14px 8px", flexWrap: "wrap", borderBottom: "1px solid rgba(128,128,128,.18)" },
    headTitle: { ...flex, gap: 8, fontSize: 15, fontWeight: 600, whiteSpace: "nowrap" },
    seg: { ...flex, gap: 2, padding: 2, border: "1px solid rgba(128,128,128,.28)", borderRadius: 8 },
    segBtn: { padding: "3px 12px", border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", color: "inherit", opacity: 0.72, fontSize: 13, whiteSpace: "nowrap" },
    segBtnActive: { padding: "3px 12px", border: "none", borderRadius: 6, background: "rgba(88,166,255,.22)", cursor: "pointer", color: "inherit", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" },
    // 拖拽悬停在阶段按钮上（松手 = 复制到该阶段）。
    segBtnDrop: { padding: "3px 12px", border: "none", borderRadius: 6, background: "rgba(88,166,255,.16)", outline: "2px dashed rgba(88,166,255,.85)", outlineOffset: 1, cursor: "pointer", color: "inherit", fontSize: 13, whiteSpace: "nowrap" },
    segBtnDropActive: { padding: "3px 12px", border: "none", borderRadius: 6, background: "rgba(88,166,255,.3)", outline: "2px dashed rgba(88,166,255,.9)", outlineOffset: 1, cursor: "pointer", color: "inherit", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" },
    grow: { flex: 1, minWidth: 0 },
    headActions: { ...flex, gap: 6, marginLeft: "auto" },
    iconBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, border: "none", borderRadius: 8, background: "transparent", cursor: "pointer", color: "inherit", opacity: 0.75 },
    // 预设（编辑目标）行改用能力面板顶栏的 chips 类名（见 Panel.tsx 的 css.topbar / css.catItem），
    // 这里不再保留自绘的 subhead / targetRow / targetTab 样式。
    body: { flex: 1, minHeight: 0, display: "flex", alignItems: "stretch" },
    colLeft: { width: 420, flex: "none", display: "flex", flexDirection: "column", minHeight: 0, borderRight: "1px solid rgba(128,128,128,.18)", boxSizing: "border-box" },
    colScroll: { flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px" },
    colFoot: { flex: "none", ...flex, gap: 8, padding: "8px 12px", borderTop: "1px solid rgba(128,128,128,.18)", flexWrap: "wrap" },
    colRight: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 },
    colRightScroll: { flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 14px" },
    groupHead: { ...flex, gap: 8, marginBottom: 6, color: "rgba(128,128,128,.95)", fontSize: 12, fontWeight: 600 },
    // ── 通用控件（沿用旧面板的观感） ──────────────────────────────────
    list: { display: "flex", flexDirection: "column", gap: 6 },
    row: { ...flex, gap: 8, padding: "6px 8px", border: "1px solid rgba(128,128,128,.2)", borderRadius: 8, background: "rgba(128,128,128,.06)" },
    switchWrap: { ...flex, gap: 6, minWidth: 90 },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: { ...flex, gap: 6, alignItems: "baseline", flexWrap: "wrap" },
    code: { fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" },
    orderTag: { color: "rgba(128,128,128,.8)", fontSize: 11 },
    preview: { color: "rgba(128,128,128,.85)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    previewText: { fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1, minHeight: 0, overflowY: "auto", padding: 10, border: "1px solid rgba(128,128,128,.2)", borderRadius: 8, background: "rgba(0,0,0,.18)", margin: 0 },
    toolWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
    toolChip: { fontFamily: "monospace", fontSize: 12, color: "rgba(128,128,128,.95)", border: "1px solid rgba(128,128,128,.3)", borderRadius: 6, padding: "2px 6px", cursor: "help" },
    badgeOk: { color: "#3fb950", fontSize: 11, border: "1px solid rgba(63,185,80,.5)", borderRadius: 999, padding: "0 6px" },
    badgeBlocked: { color: "#f85149", fontSize: 11, border: "1px solid rgba(248,81,73,.5)", borderRadius: 999, padding: "0 6px" },
    badgeReplaced: { color: "#d29922", fontSize: 11, border: "1px solid rgba(210,153,34,.5)", borderRadius: 999, padding: "0 6px" },
    badgeCustom: { color: "#58a6ff", fontSize: 11, border: "1px solid rgba(88,166,255,.5)", borderRadius: 999, padding: "0 6px" },
    badgeSystem: { color: "rgba(128,128,128,.85)", fontSize: 11, border: "1px solid rgba(128,128,128,.4)", borderRadius: 999, padding: "0 6px" },
    mini: { padding: "3px 8px", border: "1px solid rgba(128,128,128,.35)", borderRadius: 6, background: "transparent", cursor: "pointer", color: "inherit", whiteSpace: "nowrap" },
    arrowCol: { display: "flex", flexDirection: "column", gap: 2 },
    arrow: { padding: "0 6px", border: "1px solid rgba(128,128,128,.3)", borderRadius: 4, background: "transparent", cursor: "pointer", color: "inherit", fontSize: 11, lineHeight: 1.4, opacity: 0.8 },
    rowBlocked: { opacity: 0.55 },
    // ── 拖拽（见 dnd.ts）：抓手 / 拖动中的行 / 行上的插入位置 / 整块投放区 ──
    dragHandle: { flex: "none", cursor: "grab", color: "rgba(128,128,128,.85)", fontSize: 13, lineHeight: 1, userSelect: "none", padding: "0 2px" },
    dragging: { opacity: 0.5 },
    dropAbove: { boxShadow: "inset 0 2px 0 0 #58a6ff" },
    dropBelow: { boxShadow: "inset 0 -2px 0 0 #58a6ff" },
    dropZone: { outline: "2px dashed rgba(88,166,255,.55)", outlineOffset: -3, borderRadius: 8 },
    dropZoneActive: { outline: "2px dashed rgba(88,166,255,.9)", outlineOffset: -3, borderRadius: 8, background: "rgba(88,166,255,.06)" },
    injectBox: { marginTop: 10, padding: "8px", border: "1px dashed rgba(128,128,128,.4)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 6 },
    injectRow: { ...flex, gap: 6 },
    editBox: { display: "flex", flexDirection: "column", gap: 6, marginTop: 4 },
    editInput: { padding: "6px", border: "1px solid rgba(128,128,128,.35)", borderRadius: 6, background: "transparent", color: "inherit", fontFamily: "inherit", fontSize: 12, resize: "vertical", width: "100%", boxSizing: "border-box" },
    input: { padding: "4px 6px", border: "1px solid rgba(128,128,128,.35)", borderRadius: 6, background: "transparent", color: "inherit" },
    muted: { color: "rgba(128,128,128,.75)", fontSize: 12 },
    error: { color: "#f85149", fontSize: 12, marginBottom: 6 },
    noticeOk: { color: "#3fb950", fontSize: 12, marginBottom: 6 },
    noticeWarn: { color: "#d29922", fontSize: 12, marginBottom: 6 },
    saveBtn: { padding: "4px 12px", border: "1px solid rgba(128,128,128,.35)", borderRadius: 6, background: "transparent", cursor: "pointer", color: "inherit" },
    saveBtnDirty: { padding: "4px 12px", border: "1px solid #d29922", borderRadius: 6, background: "rgba(210,153,34,.15)", cursor: "pointer", color: "inherit" }
  };
})();

// src/client/prompt/types.ts
var PHASES = [
  { key: "bootstrap", sectionField: "sectionsBootstrap", contextField: "contextsBootstrap", toolField: "bootstrap", status: { promoted: false, boundary: -1 } },
  { key: "active", sectionField: "sections", contextField: "contexts", toolField: void 0, status: { promoted: true, boundary: -1 } },
  { key: "compaction", sectionField: "sectionsCompaction", contextField: "contextsCompaction", toolField: "compaction", status: { promoted: false, boundary: 1 } }
];
var PHASE_KEYS = PHASES.map((phase) => phase.key);
var PHASE_LABEL_KEY = {
  bootstrap: "phaseStageGuide",
  active: "phaseStageResident",
  compaction: "phaseStageControlled"
};
var SOURCE_LABEL_KEY = {
  global: "sourceGlobal",
  preset: "sourcePreset",
  agent: "sourceAgent",
  executor: "sourceExecutor",
  workspace: "sourceWorkspace"
};
function normalizeSource(source) {
  if (source === null || source === void 0) return void 0;
  if (typeof source === "string") return void 0;
  if (typeof source === "object" && typeof source.kind === "string") {
    return typeof source.id === "string" && source.id !== "" ? { kind: source.kind, id: source.id } : { kind: source.kind };
  }
  return void 0;
}
function sourceKey(source) {
  const normalized = normalizeSource(source);
  return normalized === void 0 ? "" : `${normalized.kind}:${normalized.id ?? ""}`;
}
function normalizeEntry(value) {
  if (typeof value === "string") return value === "" ? void 0 : { name: value };
  if (value === null || value === void 0 || typeof value !== "object") return void 0;
  if (typeof value.name !== "string" || value.name === "") return void 0;
  const source = normalizeSource(value.source);
  return source === void 0 ? { name: value.name } : { name: value.name, source };
}
function entryKey(entry) {
  const normalized = normalizeEntry(entry);
  return normalized === void 0 ? "" : `${normalized.name}\0${sourceKey(normalized.source)}`;
}
function sameEntry(left, right) {
  const aEntry = normalizeEntry(left);
  const bEntry = normalizeEntry(right);
  if (aEntry?.source?.kind === "agent" && bEntry?.source?.kind === "agent" && aEntry.name === bEntry.name) return true;
  const a = entryKey(left);
  return a !== "" && a === entryKey(right);
}
function hasContent(value) {
  if (value === null || value === void 0) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(hasContent);
  return value !== "";
}

// src/client/prompt/phase-ops.ts
function descriptorOf(key) {
  const phase = PHASES.find((item) => item.key === key);
  if (phase === void 0) throw new Error(`unknown phase: ${String(key)}`);
  return phase;
}
function sectionFieldOf(key) {
  return descriptorOf(key).sectionField;
}
function contextFieldOf(key) {
  return descriptorOf(key).contextField;
}
function toolFieldOf(key) {
  return descriptorOf(key).toolField ?? "static";
}
function acceptsInjectFor(key, phase) {
  return phase === "always" || phase === key;
}
function sectionEntries(cfg, key) {
  return normalizeList(cfg?.[sectionFieldOf(key)]);
}
function contextEntries(cfg, key) {
  return normalizeList(cfg?.[contextFieldOf(key)]);
}
function contextPatch(cfg, key, entry, hidden) {
  const field = contextFieldOf(key);
  const current2 = contextEntries(cfg, key);
  const index = current2.findIndex((item) => sameEntry(item, entry));
  if (hidden) {
    if (index < 0) current2.push({ name: entry.name, ...entry.source === void 0 ? {} : { source: entry.source } });
  } else if (index >= 0) {
    current2.splice(index, 1);
  }
  return { [field]: current2 };
}
function normalizeList(list) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const value of list ?? []) {
    const entry = normalizeEntry(value);
    if (entry === void 0) continue;
    const key = entryKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}
function replacementEntriesFor(cfg, key) {
  return (cfg?.replacements ?? []).filter((item) => acceptsInjectFor(key, item?.phase ?? "always"));
}
function injectedAt(cfg, key) {
  const names = /* @__PURE__ */ new Set();
  const custom = /* @__PURE__ */ new Set();
  const text = /* @__PURE__ */ new Map();
  const order = /* @__PURE__ */ new Map();
  for (const item of cfg?.inject ?? []) {
    const entry = normalizeEntry(item);
    if (entry === void 0) continue;
    const identity = entryKey(entry);
    const phase = item.phase ?? "always";
    if (phase === key) order.set(identity, item.order ?? 0);
    if (!acceptsInjectFor(key, phase)) continue;
    names.add(identity);
    if (item.text) {
      if (phase === key || !text.has(identity)) text.set(identity, item.text);
    }
    if (item.custom === true) custom.add(identity);
  }
  return { names, custom, text, order };
}
function blockPatch(cfg, key, entry, blocked) {
  const field = sectionFieldOf(key);
  const current2 = sectionEntries(cfg, key);
  const index = current2.findIndex((item) => sameEntry(item, entry));
  if (blocked) {
    if (index >= 0) return {};
    current2.push({ name: entry.name, ...entry.source === void 0 ? {} : { source: entry.source } });
  } else {
    if (index < 0) return {};
    current2.splice(index, 1);
  }
  return { [field]: current2 };
}
function phaseRows(cfg, view, key) {
  const base = view?.baseSections ?? [];
  const post = view?.sections ?? [];
  const denied = sectionEntries(cfg, key);
  const deniedKeys = new Set(denied.map((entry) => entryKey(entry)));
  const baseByKey = new Map(base.map((entry) => [entryKey(entry), entry]));
  const postByKey = new Map(post.map((entry) => [entryKey(entry), entry]));
  const injected = injectedAt(cfg, key);
  const replacements = replacementEntriesFor(cfg, key);
  const order = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (entry) => {
    const identity = entryKey(entry);
    if (identity === "" || seen.has(identity)) return;
    seen.add(identity);
    order.push({ name: entry.name, ...entry.source === void 0 ? {} : { source: entry.source } });
  };
  for (const section of base) {
    const identity = entryKey(section);
    if (postByKey.has(identity) || deniedKeys.has(identity) || section.blocked === true) push(section);
  }
  for (const section of post) {
    const identity = entryKey(section);
    if (!baseByKey.has(identity) && injected.names.has(identity)) push(section);
  }
  for (const item of cfg?.inject ?? []) {
    const entry = normalizeEntry(item);
    if (entry === void 0) continue;
    const identity = entryKey(entry);
    if ((item.phase ?? "always") !== key) continue;
    if (item.custom === true || injected.text.has(identity) || baseByKey.has(identity) || postByKey.has(identity)) push(entry);
  }
  for (const entry of denied) push(entry);
  for (const identity of injected.custom) {
    const item = (cfg?.inject ?? []).find((candidate) => entryKey(candidate) === identity);
    if (item !== void 0) push(item);
  }
  const rows = order.map((entry) => {
    const identity = entryKey(entry);
    const baseSection = baseByKey.get(identity);
    const postSection = postByKey.get(identity);
    const override = injected.text.get(identity) ?? "";
    const replacement = replacements.find((item) => sameEntry(item, entry));
    const dynamic = typeof baseSection?.dynamic === "boolean" ? baseSection.dynamic : typeof postSection?.dynamic === "boolean" ? postSection.dynamic : void 0;
    const toolPrompt = baseSection?.toolPrompt ?? postSection?.toolPrompt;
    return {
      name: entry.name,
      ...entry.source === void 0 ? {} : { source: entry.source },
      text: postSection?.text ?? baseSection?.text ?? "",
      replaced: replacement !== void 0 || override !== "",
      custom: injected.custom.has(identity),
      override,
      blocked: deniedKeys.has(identity),
      ...dynamic === void 0 ? {} : { dynamic },
      ...toolPrompt === void 0 ? {} : { toolPrompt }
    };
  });
  if (injected.order.size > 0) {
    const fallback = new Map(rows.map((row, index) => [entryKey(row), index]));
    rows.sort((left, right) => {
      const a = injected.order.get(entryKey(left)) ?? fallback.get(entryKey(left)) ?? 0;
      const b = injected.order.get(entryKey(right)) ?? fallback.get(entryKey(right)) ?? 0;
      return a - b;
    });
  }
  return rows;
}
function phaseInjectEntries(cfg, key, rows) {
  const remaining = (cfg?.inject ?? []).filter((item) => (item.phase ?? "always") !== key);
  const entries = rows.map((row, index) => ({
    name: row.name,
    ...row.source === void 0 ? {} : { source: row.source },
    order: index,
    text: row.override || (row.custom ? row.text ?? "" : ""),
    phase: key,
    custom: row.custom
  }));
  return [...remaining, ...entries];
}
function reorderInsert(rows, drag, target, pos) {
  const base = rows.filter((row) => !sameEntry(row, drag));
  const index = base.findIndex((row) => sameEntry(row, target));
  if (index < 0) return null;
  const entry = rows.find((row) => sameEntry(row, drag));
  if (entry === void 0) return null;
  base.splice(pos === "above" ? index : index + 1, 0, entry);
  return base;
}
var MIRROR_ORDER = ["active", ...PHASE_KEYS.filter((key) => key !== "active")];
function mirroredRows(cfg, views, nativeOf) {
  const picked = /* @__PURE__ */ new Map();
  const order = [];
  for (const key of MIRROR_ORDER) {
    for (const row of phaseRows(cfg, views?.[key] ?? null, key)) {
      const identity = entryKey(row);
      const native = nativeOf?.(key, row) === true;
      const current2 = picked.get(identity);
      if (current2 === void 0) {
        picked.set(identity, { row, native });
        order.push(identity);
      } else if (current2.native !== true && native) {
        picked.set(identity, { row, native });
      }
    }
  }
  return order.map((identity) => picked.get(identity).row);
}
function mirrorText(row, native) {
  if (row.custom === true) return row.override || (row.text ?? "");
  if (row.override !== "") return row.override;
  if (native === true) return "";
  if (row.dynamic === true) return "";
  return row.text ?? "";
}
function mirrorPhaseInjectEntries(cfg, rows, nativeOf) {
  const names = new Set(rows.map((row) => entryKey(row)));
  const always = (cfg?.inject ?? []).filter((item) => (item.phase ?? "always") === "always" && names.has(entryKey(item)));
  const entries = [];
  for (const key of PHASE_KEYS) {
    let order = 0;
    for (const row of rows) {
      const native = nativeOf?.(key, row);
      if (native === null || native === void 0) continue;
      const text = mirrorText(row, native);
      if (native !== true && text === "") continue;
      entries.push({
        name: row.name,
        ...row.source === void 0 ? {} : { source: row.source },
        order: order++,
        text,
        phase: key,
        custom: row.custom
      });
    }
  }
  return [...always, ...entries];
}
function mirrorSkippedNames(rows, nativeOf) {
  const skipped = /* @__PURE__ */ new Set();
  for (const key of PHASE_KEYS) {
    for (const row of rows) {
      const native = nativeOf?.(key, row);
      if (native === null || native === void 0 || native === true) continue;
      if (mirrorText(row, false) === "") skipped.add(row.name);
    }
  }
  return [...skipped];
}
function mirroredDeniedLists(rows) {
  const blocked = rows.filter((row) => row.blocked === true).map((row) => ({ name: row.name, ...row.source === void 0 ? {} : { source: row.source } }));
  const out = {};
  for (const phase of PHASES) out[phase.sectionField] = blocked.map((entry) => ({ ...entry }));
  return out;
}

// src/client/prompt/presets.ts
function phaseFieldValues(source) {
  const out = {};
  for (const phase of PHASES) {
    out[phase.sectionField] = [...source?.[phase.sectionField] ?? []];
    out[phase.contextField] = [...source?.[phase.contextField] ?? []];
  }
  return out;
}
function normalizeToolsConfig(tools) {
  const out = {
    exclude: [...tools?.exclude ?? []],
    add: [...tools?.add ?? []]
  };
  for (const phase of PHASES) {
    if (phase.toolField === void 0) continue;
    const group = tools?.[phase.toolField];
    out[phase.toolField] = {
      exclude: [...group?.exclude ?? []],
      add: [...group?.add ?? []]
    };
  }
  return out;
}
function toChain(items, phase) {
  return items.map((item, index) => ({
    name: item.name,
    ...item.source === void 0 ? {} : { source: item.source },
    after: index > 0 ? entryKey(items[index - 1]) : void 0,
    text: item.custom === true ? item.text ?? "" : "",
    custom: item.custom === true,
    ...phase === void 0 ? {} : { phase }
  }));
}
function buildPresetData(cfg, merged) {
  const alwaysText = /* @__PURE__ */ new Map();
  for (const item of cfg.inject ?? []) {
    if ((item.phase ?? "always") !== "always") continue;
    alwaysText.set(entryKey(item), item.text ?? "");
  }
  const globalRows = merged.filter((section) => !section.custom || alwaysText.has(entryKey(section)));
  const order = toChain(globalRows.map((section) => ({
    name: section.name,
    ...section.source === void 0 ? {} : { source: section.source },
    text: section.custom ? alwaysText.get(entryKey(section)) ?? section.text ?? "" : "",
    custom: section.custom
  })));
  for (const phase of PHASE_KEYS) {
    const items = (cfg.inject ?? []).filter((item) => (item.phase ?? "always") === phase).slice().sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
    if (items.length === 0) continue;
    order.push(...toChain(items.map((item) => ({
      name: item.name,
      ...item.source === void 0 ? {} : { source: item.source },
      text: item.text,
      custom: item.custom === true
    })), phase));
  }
  return {
    ...phaseFieldValues(cfg),
    replacements: [...cfg.replacements ?? []],
    order,
    tools: normalizeToolsConfig(cfg.tools)
  };
}
function mergeSections(inv, cfg, blockedKeys) {
  const map = /* @__PURE__ */ new Map();
  for (const section of inv?.sections ?? []) {
    const entry = normalizeEntry(section);
    if (entry === void 0) continue;
    map.set(entryKey(entry), {
      ...entry,
      order: section.order,
      text: section.text ?? "",
      active: blockedKeys.has(entryKey(entry)) ? false : section.active !== false,
      replaced: section.replaced === true,
      custom: false,
      ...section.dynamic === void 0 ? {} : { dynamic: section.dynamic }
    });
  }
  for (const item of cfg.inject ?? []) {
    const entry = normalizeEntry(item);
    if (entry === void 0) continue;
    const identity = entryKey(entry);
    const custom = item.custom === true;
    const existing = map.get(identity);
    const replacement = (cfg.replacements ?? []).some((candidate) => sameEntry(candidate, entry));
    if (existing !== void 0) {
      map.set(identity, {
        ...existing,
        order: item.order ?? existing.order,
        ...item.text !== void 0 && item.text !== "" ? { text: item.text } : {},
        custom: custom || existing.custom,
        active: !blockedKeys.has(identity),
        replaced: replacement || existing.replaced
      });
    } else {
      map.set(identity, {
        ...entry,
        order: item.order ?? 0,
        text: item.text ?? "",
        active: !blockedKeys.has(identity),
        replaced: replacement,
        custom
      });
    }
  }
  return [...map.values()].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name)).map((section, index) => ({ ...section, order: index }));
}
function resolveChain(list) {
  const byKey = /* @__PURE__ */ new Map();
  for (const item of list) {
    const entry = normalizeEntry(item);
    if (entry === void 0) continue;
    byKey.set(entryKey(entry), { ...item, ...entry });
  }
  const result = [];
  const placed = /* @__PURE__ */ new Set();
  const insert = (item) => {
    const entry = normalizeEntry(item);
    if (entry === void 0) return;
    const identity = entryKey(entry);
    if (placed.has(identity)) return;
    placed.add(identity);
    result.push({ ...entry, text: item.text, custom: item.custom });
  };
  for (const item of byKey.values()) {
    if (item.after === void 0 || item.after === "" || !byKey.has(item.after)) insert(item);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of byKey.values()) {
      const entry = normalizeEntry(item);
      if (entry === void 0) continue;
      const identity = entryKey(entry);
      if (placed.has(identity)) continue;
      const anchor = item.after;
      if (anchor !== void 0 && placed.has(anchor)) {
        const anchorIndex = result.findIndex((candidate) => entryKey(candidate) === anchor);
        result.splice(anchorIndex + 1, 0, { ...entry, text: item.text, custom: item.custom });
        placed.add(identity);
        changed = true;
      }
    }
  }
  for (const item of byKey.values()) insert(item);
  return result;
}
function resolveOrder(presetOrder) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of presetOrder ?? []) {
    const phase = item.phase ?? "always";
    const group = groups.get(phase);
    if (group === void 0) groups.set(phase, [item]);
    else group.push(item);
  }
  const out = [];
  for (const phase of ["always", ...PHASE_KEYS]) {
    const members = groups.get(phase);
    if (members === void 0) continue;
    resolveChain(members).forEach((entry, index) => {
      out.push({
        name: entry.name,
        ...entry.source === void 0 ? {} : { source: entry.source },
        order: index,
        text: entry.text ?? "",
        custom: entry.custom === true,
        ...phase === "always" ? {} : { phase }
      });
    });
  }
  return out;
}
function reindexInject(entries) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of entries) {
    const phase = item.phase ?? "always";
    const group = groups.get(phase);
    if (group === void 0) groups.set(phase, /* @__PURE__ */ new Map([[entryKey(item), item]]));
    else group.set(entryKey(item), item);
  }
  const out = [];
  for (const phase of ["always", ...PHASE_KEYS]) {
    const group = groups.get(phase);
    if (group === void 0) continue;
    let order = 0;
    for (const item of group.values()) {
      out.push({
        name: item.name,
        ...item.source === void 0 ? {} : { source: item.source },
        order: order++,
        text: item.text ?? "",
        custom: item.custom === true,
        ...phase === "always" ? {} : { phase }
      });
    }
  }
  return out;
}
function mergeReplacements(base, incoming) {
  const map = /* @__PURE__ */ new Map();
  for (const item of base ?? []) map.set(`${item.phase ?? "always"}\0${entryKey(item)}`, item);
  for (const item of incoming ?? []) map.set(`${item.phase ?? "always"}\0${entryKey(item)}`, item);
  return [...map.values()];
}
function mergeToolsSnapshot(base, snapshot) {
  const out = normalizeToolsConfig(base);
  if (snapshot === void 0) return out;
  if (Array.isArray(snapshot.exclude)) out.exclude = [...snapshot.exclude];
  if (Array.isArray(snapshot.add)) out.add = [...snapshot.add];
  for (const phase of PHASES) {
    if (phase.toolField === void 0) continue;
    const incoming = snapshot[phase.toolField];
    if (incoming === void 0) continue;
    const current2 = out[phase.toolField] ?? {};
    out[phase.toolField] = {
      exclude: incoming.exclude !== void 0 ? [...incoming.exclude] : current2.exclude,
      add: incoming.add !== void 0 ? [...incoming.add] : current2.add
    };
  }
  return out;
}
function applyPresetData(data, cfg, current2) {
  const mapCurrent = current2 instanceof Map ? current2 : void 0;
  const entryOf2 = (identity) => mapCurrent?.get(identity) ?? { name: identity };
  const currentKeys = mapCurrent === void 0 ? current2 : new Set(mapCurrent.keys());
  const presetOrder = data.order ?? [];
  const presetKeys = new Set(presetOrder.map((item) => entryKey(item)));
  const known = /* @__PURE__ */ new Map();
  const remember = (entry) => {
    const normalized = normalizeEntry(entry);
    if (normalized !== void 0) known.set(entryKey(normalized), normalized);
  };
  for (const entry of data.sections ?? []) remember(entry);
  for (const entry of presetOrder) remember(entry);
  for (const entry of cfg.sections ?? []) remember(entry);
  for (const entry of cfg.sectionsBootstrap ?? []) remember(entry);
  for (const entry of cfg.sectionsCompaction ?? []) remember(entry);
  for (const item of cfg.inject ?? []) remember(item);
  if (mapCurrent !== void 0) for (const entry of mapCurrent.values()) remember(entry);
  const blocked = /* @__PURE__ */ new Set();
  for (const entry of data.sections ?? []) {
    const identity = entryKey(entry);
    if (currentKeys.has(identity)) blocked.add(identity);
  }
  const inject2 = resolveOrder(presetOrder.filter((item) => currentKeys.has(entryKey(item))));
  const kept = new Set(inject2.map((item) => entryKey(item)));
  for (const item of cfg.inject ?? []) {
    const identity = entryKey(item);
    if (identity === "" || presetKeys.has(identity) || kept.has(identity)) continue;
    kept.add(identity);
    inject2.push(item);
  }
  const finalInject = reindexInject(inject2);
  if (presetOrder.length > 0) {
    const active = new Set([...presetKeys].filter((identity) => !blocked.has(identity)));
    for (const identity of currentKeys) if (!presetKeys.has(identity)) blocked.add(identity);
    for (const identity of active) blocked.delete(identity);
  }
  const patch = {
    sections: [...blocked].map((identity) => known.get(identity) ?? entryOf2(identity)),
    replacements: mergeReplacements(cfg.replacements, data.replacements),
    inject: finalInject,
    tools: mergeToolsSnapshot(cfg.tools, data.tools)
  };
  for (const phase of PHASES) {
    const sectionList = data[phase.sectionField];
    const contextList = data[phase.contextField];
    if (Array.isArray(sectionList)) patch[phase.sectionField] = [...sectionList];
    if (Array.isArray(contextList)) patch[phase.contextField] = [...contextList];
  }
  return patch;
}
function withPhaseExclude(tools, key, exclude) {
  const base = tools ?? {};
  const field = toolFieldOf(key);
  if (field === "static") return { ...base, exclude };
  return { ...base, [field]: { ...base[field] ?? {}, exclude } };
}
function withPhaseAdd(tools, key, add) {
  const base = tools ?? {};
  const field = toolFieldOf(key);
  if (field === "static") return { ...base, add };
  return { ...base, [field]: { ...base[field] ?? {}, add } };
}
function overrideView(cfg, ovr) {
  const o = ovr ?? {};
  return {
    ...phaseFieldValues(o),
    replacements: [...o.replacements ?? []],
    inject: [...o.inject ?? []],
    tools: normalizeToolsConfig(o.tools),
    presets: cfg.presets,
    activePreset: cfg.activePreset,
    // 全局开关 / 黑名单不经 override：显示与写入都落在顶层，避免面板显示成默认值。
    forceSections: cfg.forceSections,
    envBlocklist: cfg.envBlocklist
  };
}
function editView(cfg, target) {
  if (!target) return cfg;
  return overrideView(cfg, cfg.overrides?.[target]);
}
function presetExportFilename(name) {
  const sanitized = String(name).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim().replace(/[. ]+$/, "");
  const base = sanitized === "" ? "preset" : sanitized;
  return `${base}.json`;
}
function addImportedPresets(existing, parsed, makeId) {
  const incoming = Array.isArray(parsed) ? parsed : [parsed];
  const existingNames = new Set(existing.map((preset) => preset.name));
  const added = incoming.filter((preset) => preset && typeof preset.name === "string" && !existingNames.has(preset.name)).map((preset) => ({ id: makeId(), name: preset.name, data: preset.data ?? {} }));
  return added.length > 0 ? [...existing, ...added] : existing;
}
function removePreset(presets, id, activeId) {
  return {
    presets: presets.filter((preset) => preset.id !== id),
    activeId: activeId === id ? void 0 : activeId
  };
}
function genId() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// src/client/prompt/SectionsPane.tsx
var import_react4 = require("react");

// src/client/prompt/drag-scroll.ts
var import_react3 = require("react");
var EDGE = 56;
var MAX_STEP = 18;
function useDragAutoScroll(ref) {
  (0, import_react3.useEffect)(() => {
    const el = ref.current;
    if (el === null) return void 0;
    let frame = 0;
    let step = 0;
    let pendingY = null;
    const stopScroll = () => {
      step = 0;
      pendingY = null;
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const stepFrame = () => {
      frame = 0;
      if (step === 0) return;
      const before = el.scrollTop;
      el.scrollTop += step;
      if (el.scrollTop === before) {
        step = 0;
        return;
      }
      frame = requestAnimationFrame(stepFrame);
    };
    const measure = (clientY) => {
      const rect = el.getBoundingClientRect();
      const fromTop = clientY - rect.top;
      const fromBottom = rect.bottom - clientY;
      step = fromTop < EDGE ? -Math.ceil((EDGE - fromTop) / EDGE * MAX_STEP) : fromBottom < EDGE ? Math.ceil((EDGE - fromBottom) / EDGE * MAX_STEP) : 0;
      if (step === 0) {
        stopScroll();
        return;
      }
      if (frame === 0) frame = requestAnimationFrame(stepFrame);
    };
    const onDragOver = (event) => {
      if (!isPanelDrag(event)) {
        stopScroll();
        return;
      }
      pendingY = event.clientY;
      measure(event.clientY);
    };
    const onDragLeave = (event) => {
      const to = event.relatedTarget;
      if (to !== null && el.contains(to)) return;
      stopScroll();
    };
    const onEnd = () => stopScroll();
    el.addEventListener("dragover", onDragOver, true);
    el.addEventListener("dragleave", onDragLeave, true);
    el.addEventListener("drop", onEnd, true);
    window.addEventListener("dragend", onEnd);
    window.addEventListener("dragstart", onEnd);
    return () => {
      stopScroll();
      el.removeEventListener("dragover", onDragOver, true);
      el.removeEventListener("dragleave", onDragLeave, true);
      el.removeEventListener("drop", onEnd, true);
      window.removeEventListener("dragend", onEnd);
      window.removeEventListener("dragstart", onEnd);
      pendingY = null;
    };
  }, [ref]);
}

// src/client/prompt/SectionsPane.tsx
var editKey = (key, entry) => `${key}:${entryKey(entry)}`;
function SectionsPane({ cfg, inv, phases, phase, syncAll, t, write }) {
  const [filter, setFilter] = (0, import_react4.useState)("all");
  const [editing, setEditing] = (0, import_react4.useState)(null);
  const [draft, setDraft] = (0, import_react4.useState)("");
  const [addOpen, setAddOpen] = (0, import_react4.useState)(false);
  const [notice, setNotice] = (0, import_react4.useState)(null);
  const [dragName, setDragName] = (0, import_react4.useState)(null);
  const [dropMark, setDropMark] = (0, import_react4.useState)(null);
  const scrollRef = (0, import_react4.useRef)(null);
  useDragAutoScroll(scrollRef);
  const nativeIn = (key, entry) => {
    const view = phases?.[key];
    if (view === void 0 || view === null) return null;
    return (view.baseSections ?? []).some((section) => sameEntry(section, entry));
  };
  const mirrorReady = () => PHASE_KEYS.every((key) => phases?.[key] !== null && phases?.[key] !== void 0);
  const mirrorRows = () => mirroredRows(cfg, phases, nativeIn);
  const rowsOf = (key) => syncAll === true ? mirrorRows() : phaseRows(cfg, phases?.[key] ?? null, key);
  const applyBlock = (key, entry, blocked) => {
    const patch = blockPatch(cfg, key, entry, blocked);
    for (const [field, value] of Object.entries(patch)) {
      write(field, value);
    }
  };
  const persistMirror = (rows2) => {
    if (!mirrorReady()) {
      setNotice(t("syncNotReady"));
      return;
    }
    write("inject", mirrorPhaseInjectEntries(cfg, rows2, nativeIn));
    const denied = mirroredDeniedLists(rows2);
    for (const descriptor of PHASES) write(descriptor.sectionField, denied[descriptor.sectionField]);
  };
  const inBaseOf = (key, entry) => nativeIn(key, entry) === true;
  const persistPhase = (key, rows2) => {
    write("inject", phaseInjectEntries(cfg, key, rows2));
  };
  const persistRows = (key, rows2) => {
    if (syncAll === true) persistMirror(rows2);
    else persistPhase(key, rows2);
  };
  const toggleBlocked = (key, row) => {
    if (syncAll === true) {
      const rows2 = rowsOf(key);
      const target = rows2.find((item) => sameEntry(item, row));
      if (target === void 0) return;
      persistMirror(rows2.map((item) => sameEntry(item, row) ? { ...item, blocked: !item.blocked } : item));
      return;
    }
    applyBlock(key, row, !row.blocked);
  };
  const moveRow = (key, index, dir) => {
    const rows2 = rowsOf(key);
    const target = index + dir;
    if (target < 0 || target >= rows2.length) return;
    const next = rows2.slice();
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    persistRows(key, next);
  };
  const removeFromPart = (key, row) => {
    if (syncAll === true) {
      persistMirror(rowsOf(key).filter((item) => !sameEntry(item, row)));
      return;
    }
    const inject2 = (cfg.inject ?? []).filter((item) => !((item.phase ?? "always") === key && sameEntry(item, row)));
    const stillAlways = inject2.some((item) => (item.phase ?? "always") === "always" && sameEntry(item, row));
    write("inject", inject2);
    if (stillAlways) applyBlock(key, row, true);
  };
  const startReplace = (key, row) => {
    setEditing(editKey(key, row));
    setDraft(row.override || row.text);
  };
  const commitReplace = (key, row) => {
    const patchRow = (candidate) => sameEntry(candidate, row) ? { ...candidate, override: draft, text: draft } : candidate;
    persistRows(key, rowsOf(key).map(patchRow));
    setEditing(null);
  };
  const restoreReplace = (key, row) => {
    const next = rowsOf(key).map(
      (candidate) => sameEntry(candidate, row) ? { ...candidate, override: "", text: candidate.custom ? candidate.text : "" } : candidate
    );
    persistRows(key, next);
    const rest = (cfg.replacements ?? []).filter((item) => !(sameEntry(item, row) && ((item.phase ?? "always") === "always" || (item.phase ?? "always") === key)));
    if (rest.length !== (cfg.replacements ?? []).length) write("replacements", rest);
  };
  const addSection = (name, text, phase2) => {
    const row = { name, text, replaced: false, custom: true, override: text, blocked: false };
    if (syncAll === true) {
      persistMirror([...rowsOf(phase2), row]);
      return;
    }
    write("inject", phaseInjectEntries(cfg, phase2, [...rowsOf(phase2), row]));
  };
  const dynamicOf = (entry) => {
    for (const key of PHASE_KEYS) {
      const section = (phases?.[key]?.baseSections ?? []).find((candidate) => sameEntry(candidate, entry));
      if (section !== void 0 && typeof section.dynamic === "boolean") return section.dynamic;
    }
    const poolSection = (inv?.sections ?? []).find((candidate) => sameEntry(candidate, entry));
    return typeof poolSection?.dynamic === "boolean" ? poolSection.dynamic : void 0;
  };
  const addFromPool = (key, entry, text, copiedFrom) => {
    const dynamic = dynamicOf(entry);
    if (dynamic === true) {
      setNotice(t("sectionDynamicNoAdd", { name: entry.name }));
      return;
    }
    if (dynamic === void 0) {
      setNotice(t("sectionDynamicUnsupported", { name: entry.name }));
      return;
    }
    setNotice(null);
    const rows2 = rowsOf(key);
    const existing = rows2.find((row) => sameEntry(row, entry));
    const next = existing !== void 0 ? [...rows2.filter((row) => !sameEntry(row, entry)), syncAll === true ? { ...existing, blocked: false } : existing] : [...rows2, {
      name: entry.name,
      ...entry.source === void 0 ? {} : { source: entry.source },
      text: "",
      replaced: (cfg.replacements ?? []).some((item) => sameEntry(item, entry)),
      custom: false,
      override: text,
      blocked: false
    }];
    if (syncAll !== true && (existing === void 0 || existing.blocked) && inBaseOf(key, entry)) {
      const patch = blockPatch(cfg, key, entry, false);
      for (const [field, value] of Object.entries(patch)) write(field, value);
    }
    persistRows(key, next);
    if (copiedFrom !== void 0) setNotice(t("sectionCopied", { name: entry.name, to: stageLabel(key), from: copiedFrom }));
  };
  const entryOfPayload2 = (payload) => ({
    name: payload.name,
    ...payload.source === void 0 ? {} : { source: payload.source }
  });
  const removeFromPhase = (entry) => {
    const rows2 = rowsOf(phase);
    const row = rows2.find((item) => sameEntry(item, entry));
    if (row === void 0) return;
    if (syncAll === true) {
      const native = PHASE_KEYS.some((key) => nativeIn(key, row) === true);
      persistMirror(row.custom || !native ? rows2.filter((item) => !sameEntry(item, row)) : rows2.map((item) => sameEntry(item, row) ? { ...item, blocked: true } : item));
    } else if (row.custom || row.override !== "" || injectedNames.has(entryKey(row))) {
      removeFromPart(phase, row);
    } else {
      applyBlock(phase, row, true);
    }
    setNotice(t("sectionRemoved", { name: row.name, from: stageLabel(phase) }));
  };
  const dropOnRow = (event, target) => {
    const payload = payloadOf(event);
    if (payload === null || payload.kind !== "section") return;
    event.preventDefault();
    event.stopPropagation();
    setDropMark(null);
    const entry = entryOfPayload2(payload);
    if (sameEntry(entry, target)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pos = event.clientY < rect.top + rect.height / 2 ? "above" : "below";
    if (payload.from === phase) {
      const next = reorderInsert(rowsOf(phase), entry, target, pos);
      if (next !== null) {
        persistRows(phase, next);
        setNotice(null);
      }
      return;
    }
    addFromPool(phase, entry, payload.text ?? "", payload.from === "pool" ? void 0 : stageLabel(payload.from));
  };
  const dropOnList = (event) => {
    const payload = payloadOf(event);
    if (payload === null || payload.kind !== "section") return;
    event.preventDefault();
    setDropMark(null);
    const entry = entryOfPayload2(payload);
    if (payload.from !== phase) {
      addFromPool(phase, entry, payload.text ?? "", payload.from === "pool" ? void 0 : stageLabel(payload.from));
      return;
    }
    const list = rowsOf(phase);
    const last = list[list.length - 1];
    if (last === void 0 || sameEntry(last, entry)) return;
    const next = reorderInsert(list, entry, last, "below");
    if (next !== null) persistRows(phase, next);
  };
  const dropOnPool = (event) => {
    const payload = payloadOf(event);
    if (payload === null || payload.kind !== "section") return;
    event.preventDefault();
    event.stopPropagation();
    setDropMark(null);
    if (payload.from !== phase) return;
    removeFromPhase(entryOfPayload2(payload));
  };
  (0, import_react4.useEffect)(() => {
    setPhaseDropHandler((key, payload) => {
      if (payload.kind !== "section" || key === phase) return;
      if (syncAll === true && payload.from !== "pool") return;
      addFromPool(key, entryOfPayload2(payload), payload.text ?? "", stageLabel(phase));
    });
    return () => setPhaseDropHandler(null);
  });
  const stageLabel = (key) => t(PHASE_LABEL_KEY[key]);
  const partNote = (key) => {
    const view = phases?.[key];
    if (view === void 0 || view === null) return null;
    if (cfg.forceSections !== false) return null;
    if (view.takenOverBy !== void 0) {
      return (0, import_react4.createElement)("div", { style: s.noticeWarn }, t("sectionsTakenOver", { name: view.takenOverBy }));
    }
    const lost = view.lostSections;
    if (lost !== void 0) {
      return (0, import_react4.createElement)("div", { style: s.noticeWarn }, t("sectionsLost", { emitted: lost.emitted, survived: lost.survived }));
    }
    return null;
  };
  const isEditing = (key, row) => editing === editKey(key, row);
  const renderRow = (key, row, index, total) => {
    if (!rowVisible(row)) return null;
    const identity = entryKey(row);
    const toolPrompt = row.toolPrompt ?? (row.name.startsWith("tool:") ? { tools: [row.name.slice("tool:".length)], empty: row.text.length === 0 } : void 0);
    const mark = dropMark !== null && dropMark.startsWith(`${identity}:`) ? dropMark.slice(identity.length + 1) : null;
    return (0, import_react4.createElement)("div", {
      key: identity,
      style: {
        ...s.row,
        ...row.blocked ? s.rowBlocked : {},
        ...mark === "above" ? s.dropAbove : {},
        ...mark === "below" ? s.dropBelow : {},
        ...dragName === identity ? s.dragging : {}
      },
      onDragOver: (event) => {
        if (!acceptsDrop(event, "section")) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setDropMark(`${identity}:${event.clientY < rect.top + rect.height / 2 ? "above" : "below"}`);
      },
      onDrop: (event) => dropOnRow(event, row)
    }, [
      // 拖拽抓手：整行 draggable 会把勾选框 / 文本域的选择手势一起吃掉。
      (0, import_react4.createElement)("span", {
        draggable: true,
        title: t("drag"),
        style: s.dragHandle,
        onDragStart: (event) => {
          setDragName(identity);
          beginDrag(event, {
            kind: "section",
            name: row.name,
            ...row.source === void 0 ? {} : { source: row.source },
            from: key,
            text: row.override || row.text
          });
        },
        onDragEnd: () => {
          setDragName(null);
          setDropMark(null);
          finishDrag();
        }
      }, "\u283F"),
      (0, import_react4.createElement)("input", {
        type: "checkbox",
        checked: !row.blocked,
        onChange: () => toggleBlocked(key, row),
        title: row.blocked ? t("blockedOn") : t("blockedOff"),
        style: { margin: 0, cursor: "pointer", flex: "none" }
      }),
      (0, import_react4.createElement)("div", { style: s.rowBody }, [
        (0, import_react4.createElement)("div", { style: s.rowTitle }, [
          (0, import_react4.createElement)("span", { style: s.code }, row.name),
          (0, import_react4.createElement)("span", { style: s.orderTag }, "#" + index),
          (0, import_react4.createElement)("span", { style: row.custom ? s.badgeCustom : s.badgeSystem }, row.custom ? t("manual") : t("system")),
          row.source === void 0 ? null : (0, import_react4.createElement)("span", { style: s.badgeSystem }, `${row.source.kind}${row.source.id === void 0 ? "" : `:${row.source.id}`}`),
          // 会话级：只在 agent 自己的作用域里注册（预设 scope 的注册表没有它，
          // 但真实会话装配一定有）—— 预览已把它并进列表，这里标出来免得误会。
          agentScoped.has(identity) ? (0, import_react4.createElement)("span", { style: s.badgeSystem, title: t("agentScopedHint") }, t("agentScoped")) : null,
          toolPrompt === void 0 ? null : (0, import_react4.createElement)("span", {
            style: s.badgeSystem,
            title: t("toolPromptToolsHint", { tools: toolPrompt.tools.join(", ") })
          }, t("toolPromptBadge")),
          row.replaced ? (0, import_react4.createElement)("span", { style: s.badgeReplaced }, t("replaced")) : null,
          row.blocked ? (0, import_react4.createElement)("span", { style: s.badgeBlocked }, t("blockedOn")) : null
        ]),
        isEditing(key, row) ? (0, import_react4.createElement)("div", { style: s.editBox }, [
          (0, import_react4.createElement)("textarea", { style: s.editInput, value: draft, onChange: (e) => setDraft(e.target.value), rows: 3 }),
          (0, import_react4.createElement)("div", { style: s.injectRow }, [
            (0, import_react4.createElement)("button", { style: s.mini, onClick: () => commitReplace(key, row) }, t("save")),
            (0, import_react4.createElement)("button", { style: s.mini, onClick: () => setDraft("") }, t("clearInput")),
            !row.custom && row.replaced ? (0, import_react4.createElement)("button", { style: s.mini, onClick: () => restoreReplace(key, row) }, t("restore")) : null
          ])
        ]) : (0, import_react4.createElement)("div", { style: s.preview }, String(row.override || row.text || "").slice(0, 140) || (row.dynamic === true ? t("dynamic") : t("empty"))),
        toolPrompt === void 0 ? null : (0, import_react4.createElement)(
          "div",
          { style: { ...s.muted, fontSize: "11px" } },
          `${t("toolPromptToolsLabel")}: ${toolPrompt.tools.join(" / ")}${toolPrompt.empty === true ? ` \xB7 ${t("empty")}` : ""}`
        )
      ]),
      (0, import_react4.createElement)("div", { style: s.arrowCol }, [
        (0, import_react4.createElement)("button", { style: s.arrow, disabled: index === 0, onClick: () => moveRow(key, index, -1), title: t("moveUp") }, "\u2191"),
        (0, import_react4.createElement)("button", { style: s.arrow, disabled: index === total - 1, onClick: () => moveRow(key, index, 1), title: t("moveDown") }, "\u2193")
      ]),
      isEditing(key, row) ? null : (0, import_react4.createElement)("button", { style: s.mini, onClick: () => startReplace(key, row) }, t("replace")),
      !isEditing(key, row) && !row.custom && row.replaced ? (0, import_react4.createElement)("button", { style: s.mini, onClick: () => restoreReplace(key, row) }, t("restore")) : null,
      row.custom ? (0, import_react4.createElement)("button", { style: s.mini, onClick: () => removeFromPart(key, row), title: t("delete") }, t("delete")) : null
    ]);
  };
  const rows = rowsOf(phase);
  const mirrorSkipped = syncAll === true && mirrorReady() ? mirrorSkippedNames(rows, nativeIn) : [];
  const injectedNames = injectedAt(cfg, phase).names;
  const agentScoped = /* @__PURE__ */ new Set();
  for (const view of Object.values(phases ?? {})) {
    for (const section of view?.baseSections ?? []) {
      if (section.scope === "agent") agentScoped.add(entryKey(section));
    }
  }
  const onCount = rows.filter((row) => !row.blocked).length;
  const offCount = rows.length - onCount;
  const rowVisible = (row) => filter === "all" || (filter === "on" ? !row.blocked : row.blocked);
  const poolSections = inv?.sections ?? [];
  return (0, import_react4.createElement)("div", { style: s.colLeft }, [
    (0, import_react4.createElement)("div", {
      ref: scrollRef,
      style: { ...s.colScroll, ...dropMark === "list" ? s.dropZone : {} },
      // 列表空白处 = 「本阶段末尾」的投放点（池里拖进来的段也从这里进）。
      onDragOver: (event) => {
        const payload = payloadOf(event);
        if (payload === null || payload.kind !== "section" || payload.from === phase) return;
        event.preventDefault();
        setDropMark("list");
      },
      onDrop: dropOnList
    }, [
      notice ? (0, import_react4.createElement)("div", { style: s.noticeWarn }, notice) : null,
      mirrorSkipped.length > 0 ? (0, import_react4.createElement)("div", { style: s.noticeWarn }, t("syncSkippedDynamic", { names: mirrorSkipped.join("\u3001") })) : null,
      partNote(phase),
      rows.map((row, i) => renderRow(phase, row, i, rows.length)),
      rows.length === 0 ? (0, import_react4.createElement)("div", { style: s.muted }, t("empty")) : null,
      addOpen ? (0, import_react4.createElement)(InjectForm, {
        onAdd: (name, text) => {
          addSection(name, text, phase);
          setAddOpen(false);
        },
        phaseLabel: stageLabel(phase),
        t
      }) : null,
      // 本系统全部提示词：跨预设累积的只读池（折叠区）。加入某个阶段靠拖拽：
      // 把行拖进上面的阶段列表 = 加入本阶段，拖到头部阶段 Tab = 加入那个阶段
      // （行上不再放三个按钮 —— 拖拽是唯一路径，池同时是「从阶段拿掉」的投放点）。
      (0, import_react4.createElement)("details", {
        style: { ...s.injectBox, ...dropMark === "pool" ? s.dropZoneActive : {} },
        onDragOver: (event) => {
          if (!acceptsDrop(event, "section")) return;
          event.preventDefault();
          event.stopPropagation();
          setDropMark("pool");
        },
        onDrop: dropOnPool
      }, [
        (0, import_react4.createElement)(
          "summary",
          { style: { ...s.muted, cursor: "pointer" } },
          `${t("allSectionsTitle")} (${poolSections.length})`
        ),
        (0, import_react4.createElement)("div", { style: { ...s.muted, marginBottom: 4 } }, t("sectionsFourHint")),
        poolSections.length === 0 ? (0, import_react4.createElement)("div", { style: s.muted }, t("empty")) : null,
        poolSections.map((sec) => (0, import_react4.createElement)("div", {
          key: entryKey(sec),
          style: { ...s.row, opacity: 0.92 },
          draggable: true,
          title: t("drag"),
          onDragStart: (event) => beginDrag(event, {
            kind: "section",
            name: sec.name,
            ...sec.source === void 0 ? {} : { source: sec.source },
            from: "pool",
            text: sec.text ?? ""
          }),
          onDragEnd: finishDrag
        }, [
          (0, import_react4.createElement)("div", { style: s.rowBody }, [
            (0, import_react4.createElement)("div", { style: s.rowTitle }, [
              (0, import_react4.createElement)("span", { style: s.code }, sec.name),
              sec.source === void 0 ? null : (0, import_react4.createElement)("span", { style: s.badgeSystem }, `${sec.source.kind}${sec.source.id === void 0 ? "" : `:${sec.source.id}`}`)
            ]),
            (0, import_react4.createElement)("div", { style: s.preview }, String(sec.text ?? "").slice(0, 140) || t("dynamic"))
          ])
        ]))
      ]),
      // 「+ 注入」入口放在滚动区末尾：新段通常追加在当前阶段列表尾部。
      (0, import_react4.createElement)("div", { style: { ...s.injectRow, marginTop: 8 } }, [
        (0, import_react4.createElement)(
          "button",
          { style: s.mini, onClick: () => setAddOpen(!addOpen), title: t("injectNew") },
          addOpen ? `\xD7 ${t("clearInput")}` : `+ ${t("injectNew")}`
        )
      ])
    ]),
    // 左栏底部固定条：三态过滤（全部 / 已启用 / 已停用），只统计当前阶段。
    (0, import_react4.createElement)("div", { style: s.colFoot }, [
      (0, import_react4.createElement)("div", { style: s.seg }, [
        (0, import_react4.createElement)(
          "button",
          { style: filter === "all" ? s.segBtnActive : s.segBtn, onClick: () => setFilter("all") },
          `${t("filterAll")} ${rows.length}`
        ),
        (0, import_react4.createElement)(
          "button",
          { style: filter === "on" ? s.segBtnActive : s.segBtn, onClick: () => setFilter("on") },
          `${t("filterOn")} ${onCount}`
        ),
        (0, import_react4.createElement)(
          "button",
          { style: filter === "off" ? s.segBtnActive : s.segBtn, onClick: () => setFilter("off") },
          `${t("filterOff")} ${offCount}`
        )
      ])
    ])
  ]);
}
function InjectForm({ onAdd, phaseLabel, t }) {
  const [name, setName] = (0, import_react4.useState)("");
  const [text, setText] = (0, import_react4.useState)("");
  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), text);
    setName("");
    setText("");
  };
  return (0, import_react4.createElement)("div", { style: s.injectRow }, [
    (0, import_react4.createElement)("input", { style: { ...s.input, width: "30%" }, placeholder: t("name"), value: name, onChange: (e) => setName(e.target.value) }),
    (0, import_react4.createElement)("input", { style: { ...s.input, flex: 1 }, placeholder: `${t("text")}\uFF08${phaseLabel}\uFF09`, value: text, onChange: (e) => setText(e.target.value) }),
    (0, import_react4.createElement)("button", { style: s.mini, onClick: submit }, t("add"))
  ]);
}

// src/client/prompt/ToolsPane.tsx
var import_react5 = require("react");

// src/client/prompt/tool-pool.ts
function toolStateOf(tool) {
  return tool.state ?? (tool.scope === "agent" ? "locked-agent" : tool.scope === "executor" ? "locked-executor" : tool.maskedByOwnPlugin === true ? "masked-own" : tool.maskedByShadow === true ? "masked-shadow" : tool.maskedByPtc === true ? "masked-ptc" : tool.maskedByPlugin === true ? "masked-plugin" : "controllable");
}
function buildMaskedPool(tools) {
  const map = /* @__PURE__ */ new Map();
  for (const tool of tools) {
    if (tool.name === "") continue;
    const state = toolStateOf(tool);
    if (state !== "masked-own" && state !== "masked-plugin" && state !== "masked-shadow" && state !== "masked-ptc") continue;
    const entry = normalizeEntry(tool);
    if (entry === void 0) continue;
    const identity = entryKey(entry);
    const existing = map.get(identity);
    if (existing === void 0) {
      map.set(identity, {
        entry,
        description: tool.description ?? "",
        states: /* @__PURE__ */ new Set([state]),
        reversible: state === "masked-own",
        ...tool.layer === void 0 ? {} : { layer: tool.layer }
      });
    } else {
      existing.states.add(state);
      if (state === "masked-own") existing.reversible = true;
      if (existing.layer === void 0 && tool.layer !== void 0) existing.layer = tool.layer;
      if (existing.description === "" && (tool.description ?? "") !== "") existing.description = tool.description ?? "";
    }
  }
  return [...map.values()].sort((left, right) => left.entry.name.localeCompare(right.entry.name));
}
function buildMaskedPoolGrouped(tools) {
  const reversible = [];
  const irreversible = [];
  for (const row of buildMaskedPool(tools)) (row.reversible ? reversible : irreversible).push(row);
  return { reversible, irreversible };
}

// src/client/prompt/ToolsPane.tsx
function entryOf(tool) {
  return normalizeEntry(tool);
}
function entryOfPayload(payload) {
  return {
    name: payload.name,
    ...payload.source === void 0 ? {} : { source: payload.source }
  };
}
function listHas(list, entry) {
  return list.some((item) => sameEntry(item, entry));
}
function listWithout(list, entry) {
  return list.filter((item) => !sameEntry(item, entry));
}
function listWith(list, entry) {
  if (listHas(list, entry)) return list;
  return [...list, { name: entry.name, ...entry.source === void 0 ? {} : { source: entry.source } }];
}
function ToolsPane({ cfg, inv, phases, phase, syncAll, t, write, onOpenSection }) {
  const [filter, setFilter] = (0, import_react5.useState)("all");
  const [notice, setNotice] = (0, import_react5.useState)(null);
  const [dragName, setDragName] = (0, import_react5.useState)(null);
  const [dropMark, setDropMark] = (0, import_react5.useState)(null);
  const scrollRef = (0, import_react5.useRef)(null);
  useDragAutoScroll(scrollRef);
  const excludeOf = (key) => {
    const tools = cfg.tools ?? {};
    const field = toolFieldOf(key);
    const list = field === "static" ? tools.exclude : tools[field]?.exclude;
    return list ?? [];
  };
  const addOf = (key) => {
    const tools = cfg.tools ?? {};
    const field = toolFieldOf(key);
    const list = field === "static" ? tools.add : tools[field]?.add;
    return list ?? [];
  };
  const writeLists = (key, exclude, add) => {
    write("tools", withPhaseAdd(withPhaseExclude(cfg.tools ?? {}, key, exclude), key, add));
  };
  const writeSynced = (apply3) => {
    let tools = cfg.tools;
    let changed = false;
    for (const key of PHASE_KEYS) {
      const next = apply3(key, excludeOf(key), addOf(key));
      if (next === null) continue;
      changed = true;
      tools = withPhaseExclude(withPhaseAdd(tools, key, next.add), key, next.exclude);
    }
    if (changed) write("tools", tools);
  };
  const catalogOf = (key) => phases?.[key]?.catalogTools ?? phases?.[key]?.baseTools ?? [];
  const isInCatalog = (key, entry) => catalogOf(key).some((tool) => sameEntry(tool, entry));
  const registry = (() => {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const key of PHASE_KEYS) {
      for (const value of phases?.[key]?.registryTools ?? []) {
        const entry = entryOf(value);
        if (entry === void 0) continue;
        const identity = entryKey(entry);
        if (seen.has(identity)) continue;
        seen.add(identity);
        out.push(entry);
      }
    }
    return out;
  })();
  const inRegistry = (entry) => registry.some((candidate) => sameEntry(candidate, entry) || candidate.source === void 0 && candidate.name === entry.name);
  const stateOf = (tool) => toolStateOf(tool);
  const isToggleable = (tool) => {
    const state = stateOf(tool);
    return state === "controllable" || state === "locked-agent";
  };
  const isLockedExec = (tool) => stateOf(tool) === "locked-executor";
  const addToPhase = (key, entry, hidden) => {
    let exclude = excludeOf(key);
    let add = addOf(key);
    if (!isInCatalog(key, entry) && !listHas(add, entry)) add = listWith(add, entry);
    if (hidden) {
      exclude = listHas(exclude, entry) ? exclude : listWith(exclude, entry);
    } else {
      const exact = listWithout(exclude, entry);
      exclude = exact.length === exclude.length ? exclude.filter((item) => normalizeEntry(item)?.name !== entry.name) : exact;
    }
    writeLists(key, exclude, add);
  };
  const promptSectionsOfName = (name) => {
    for (const tool of inv?.tools ?? []) {
      if (tool.name === name && Array.isArray(tool.promptSections)) return tool.promptSections;
    }
    for (const key of PHASE_KEYS) {
      const view = phases?.[key];
      for (const tool of [...view?.baseTools ?? [], ...view?.catalogTools ?? []]) {
        if (tool.name === name && Array.isArray(tool.promptSections)) return tool.promptSections;
      }
    }
    return [];
  };
  const rowsOf = (key) => {
    const catalog = catalogOf(key).filter((tool) => isToggleable(tool) || isLockedExec(tool)).map((tool) => ({
      name: tool.name,
      ...tool.source === void 0 ? {} : { source: tool.source },
      description: tool.description ?? "",
      promptSections: tool.promptSections ?? [],
      hidden: isLockedExec(tool) ? false : tool.hidden === true,
      added: false,
      state: stateOf(tool),
      ...tool.scope === "agent" || tool.scope === "executor" ? { scope: tool.scope } : {},
      ...tool.keySuffix === void 0 ? {} : { keySuffix: tool.keySuffix },
      ...tool.layer === void 0 ? {} : { layer: tool.layer }
    }));
    const added = addOf(key).filter((entry) => !catalog.some((row) => sameEntry(row, entry))).map((entry) => ({
      name: entry.name,
      ...entry.source === void 0 ? {} : { source: entry.source },
      description: "",
      promptSections: promptSectionsOfName(entry.name),
      hidden: false,
      added: true,
      state: "controllable"
    }));
    return [...catalog, ...added];
  };
  const toggleHide = (key, row, currentlyHidden) => {
    if (syncAll) {
      writeSynced((_key, exclude, add) => {
        if (currentlyHidden) return { exclude: listWithout(exclude, row), add };
        if (listHas(add, row)) return { exclude, add: listWithout(add, row) };
        return listHas(exclude, row) ? null : { exclude: listWith(exclude, row), add };
      });
      setNotice(null);
      return;
    }
    if (currentlyHidden) {
      addToPhase(key, row, false);
    } else {
      let exclude = excludeOf(key);
      let add = addOf(key);
      if (listHas(add, row)) add = listWithout(add, row);
      else if (!listHas(exclude, row)) exclude = listWith(exclude, row);
      writeLists(key, exclude, add);
    }
    setNotice(null);
  };
  const addFromPool = (key, entry) => {
    if (!isInCatalog(key, entry) && !inRegistry(entry)) {
      setNotice({ kind: "warn", text: t("toolNotInRegistry", { name: entry.name }) });
      return;
    }
    if (syncAll) {
      writeSynced((phaseKey, exclude, add) => ({
        exclude: listWithout(exclude, entry),
        add: !isInCatalog(phaseKey, entry) && !listHas(add, entry) ? listWith(add, entry) : add
      }));
      setNotice({ kind: "ok", text: t("toolSyncShown", { name: entry.name }) });
      return;
    }
    addToPhase(key, entry, false);
    setNotice({
      kind: "ok",
      text: isInCatalog(key, entry) ? t("toolShown", { name: entry.name, to: stageLabel(key) }) : t("toolAdded", { name: entry.name, phase: stageLabel(key) })
    });
  };
  const removeFromPhase = (key, entry) => {
    let exclude = excludeOf(key);
    let add = addOf(key);
    if (listHas(add, entry)) add = listWithout(add, entry);
    else if (!listHas(exclude, entry)) exclude = listWith(exclude, entry);
    writeLists(key, exclude, add);
    setNotice({ kind: "ok", text: t("toolRemovedFromPhase", { name: entry.name, from: stageLabel(key) }) });
  };
  const dropToolInto = (key, payload) => {
    if (payload.kind !== "tool" || payload.from === key) return;
    const entry = entryOfPayload(payload);
    if (payload.from === "pool") {
      addFromPool(key, entry);
      return;
    }
    addToPhase(key, entry, payload.hidden === true);
    setNotice({ kind: "ok", text: t("toolCopied", { name: entry.name, to: stageLabel(key), from: stageLabel(payload.from) }) });
  };
  const dropOnPane = (event) => {
    const payload = payloadOf(event);
    if (payload === null || payload.kind !== "tool") return;
    event.preventDefault();
    event.stopPropagation();
    setDropMark(null);
    dropToolInto(phase, payload);
  };
  const dropOnPool = (event) => {
    const payload = payloadOf(event);
    if (payload === null || payload.kind !== "tool") return;
    event.preventDefault();
    event.stopPropagation();
    setDropMark(null);
    if (payload.from === phase) removeFromPhase(phase, entryOfPayload(payload));
  };
  (0, import_react5.useEffect)(() => {
    setPhaseDropHandler((key, payload) => dropToolInto(key, payload));
    return () => setPhaseDropHandler(null);
  });
  const stageLabel = (key) => t(PHASE_LABEL_KEY[key]);
  const rows = rowsOf(phase);
  const truth = phases?.[phase]?.truth;
  const onCount = rows.filter((row) => !row.hidden).length;
  const offCount = rows.length - onCount;
  const rowVisible = (row) => filter === "all" || (filter === "on" ? !row.hidden : row.hidden);
  const renderRow = (row) => {
    if (!rowVisible(row)) return null;
    const locked = row.state === "locked-executor";
    const identity = `${entryKey(row)}\0${row.keySuffix ?? ""}`;
    const promptSectionEmpty = (section) => {
      if (section.empty === true) return true;
      for (const key of PHASE_KEYS) {
        const base = phases?.[key]?.baseSections ?? [];
        const match = base.find((candidate) => sameEntry(candidate, section));
        if (match !== void 0 && String(match.text ?? "").length === 0) return true;
      }
      return false;
    };
    const promptSectionList = () => {
      if (row.state === "locked-executor") return null;
      if (row.promptSections.length === 0) {
        return (0, import_react5.createElement)(
          "div",
          { style: { ...s.muted, fontSize: "11px" } },
          `${t("toolPromptSections")}: ${t("toolPromptNone")}`
        );
      }
      return (0, import_react5.createElement)("div", {
        style: { ...s.muted, fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }
      }, [
        (0, import_react5.createElement)("span", {}, `${t("toolPromptSections")}:`),
        ...row.promptSections.map((section) => {
          const label = `${section.name}${promptSectionEmpty(section) ? ` ${t("empty")}` : ""}`;
          const key = `${section.name}\0${sourceKey(section.source)}`;
          return onOpenSection === void 0 ? (0, import_react5.createElement)("span", {
            key,
            style: s.badgeSystem,
            title: t("toolPromptHint")
          }, label) : (0, import_react5.createElement)("button", {
            key,
            style: s.mini,
            title: t("toolPromptHint"),
            onClick: () => onOpenSection({ name: section.name, ...section.source === void 0 ? {} : { source: section.source } })
          }, label);
        })
      ]);
    };
    return (0, import_react5.createElement)("div", {
      key: identity,
      style: {
        ...s.row,
        ...row.hidden ? s.rowBlocked : {},
        ...dropMark === identity ? s.dropZoneActive : {},
        ...dragName === identity ? s.dragging : {}
      },
      title: row.description.slice(0, 120),
      onDragOver: (event) => {
        if (!acceptsDrop(event, "tool")) return;
        event.preventDefault();
        event.stopPropagation();
        setDropMark(identity);
      },
      onDrop: dropOnPane
    }, [
      // 拖拽抓手：整行 draggable 会把勾选框的手势一起吃掉。
      (0, import_react5.createElement)("span", {
        draggable: !locked,
        title: locked ? t("toolExecutorScopedHint") : t("drag"),
        style: s.dragHandle,
        onDragStart: (event) => {
          setDragName(identity);
          beginDrag(event, {
            kind: "tool",
            name: row.name,
            ...row.source === void 0 ? {} : { source: row.source },
            ...row.keySuffix === void 0 ? {} : { keySuffix: row.keySuffix },
            from: phase,
            hidden: row.hidden
          });
        },
        onDragEnd: () => {
          setDragName(null);
          setDropMark(null);
          finishDrag();
        }
      }, "\u283F"),
      (0, import_react5.createElement)("input", {
        type: "checkbox",
        checked: locked ? true : !row.hidden,
        disabled: locked,
        onChange: () => toggleHide(phase, row, row.hidden),
        title: locked ? t("toolExecutorScopedHint") : row.hidden ? t("hiddenOn") : t("hiddenOff"),
        style: { margin: 0, cursor: locked ? "not-allowed" : "pointer", flex: "none" }
      }),
      (0, import_react5.createElement)("div", { style: s.rowBody }, [
        (0, import_react5.createElement)("div", { style: s.rowTitle }, [
          (0, import_react5.createElement)("span", { style: s.code }, row.name),
          row.source === void 0 ? null : (0, import_react5.createElement)("span", { style: s.badgeSystem }, sourceLabel(row.source)),
          row.keySuffix === void 0 ? null : (0, import_react5.createElement)("span", { style: s.badgeSystem }, row.keySuffix),
          row.added ? (0, import_react5.createElement)("span", { style: s.badgeCustom }, t("toolAddedTag")) : null,
          row.state === "locked-agent" ? (0, import_react5.createElement)("span", { style: s.badgeSystem, title: t("toolAgentScopedHint") }, t("toolAgentScoped")) : null,
          row.state === "locked-executor" ? (0, import_react5.createElement)("span", { style: s.badgeSystem, title: t("toolExecutorScopedHint") }, t("toolExecutorScoped")) : null,
          !locked && row.hidden ? (0, import_react5.createElement)("span", {
            style: s.badgeBlocked,
            ...row.state === "controllable" ? { title: t("toolOwnHiddenHint") } : {}
          }, row.state === "controllable" ? t("toolOwnHidden") : t("hiddenOn")) : null,
          layerBadge(row.layer)
        ]),
        row.description !== "" ? (0, import_react5.createElement)("div", { style: s.preview }, `${t("toolDescriptionLabel")}: ${row.description.slice(0, 120)}`) : null,
        promptSectionList()
      ])
    ]);
  };
  const allTools = (inv?.tools ?? []).filter((tool) => isToggleable(tool)).map((tool) => ({
    name: tool.name,
    ...tool.source === void 0 ? {} : { source: tool.source },
    description: tool.description ?? "",
    keySuffix: tool.keySuffix
  }));
  const poolGroups = buildMaskedPoolGrouped([
    ...inv?.tools ?? [],
    ...PHASE_KEYS.flatMap((key) => catalogOf(key))
  ]);
  const poolTotal = poolGroups.reversible.length + poolGroups.irreversible.length;
  const sourceLabel = (source) => {
    if (source === void 0) return t("sourceUnknown");
    const label = t(SOURCE_LABEL_KEY[source.kind] ?? "sourceUnknown");
    return source.id === void 0 ? label : `${label} \xB7 ${source.id}`;
  };
  const stateBadge = (state) => {
    const own = state === "masked-own";
    const shadow = state === "masked-shadow";
    const ptc = state === "masked-ptc";
    const agent = state === "locked-agent";
    const hint = own ? t("toolMaskedByOwnPluginHint") : shadow ? t("toolMaskedByShadowHint") : ptc ? t("toolMaskedByPtcHint") : agent ? t("toolAgentScopedHint") : t("toolMaskedByExternalHint");
    const label = own ? t("toolMaskedByOwnPlugin") : shadow ? t("toolMaskedByShadow") : ptc ? t("toolMaskedByPtc") : agent ? t("toolAgentScoped") : t("toolMaskedByExternal");
    return (0, import_react5.createElement)("span", {
      style: s.badgeReplaced,
      title: hint
    }, label);
  };
  const LAYER_LABEL_KEY = {
    global: "layerGlobal",
    preset: "layerPreset",
    agent: "layerAgent",
    executor: "sourceExecutor"
  };
  const layerBadge = (layer) => layer === void 0 ? null : (0, import_react5.createElement)("span", { style: { ...s.badgeSystem, marginLeft: "auto" } }, t(LAYER_LABEL_KEY[layer]));
  const renderPoolRow = (row) => (0, import_react5.createElement)("div", {
    key: entryKey(row.entry),
    style: { ...s.row, opacity: 0.8 }
  }, [
    (0, import_react5.createElement)("div", { style: s.rowBody }, [
      (0, import_react5.createElement)("div", { style: s.rowTitle }, [
        (0, import_react5.createElement)("span", { style: s.code }, row.entry.name),
        row.entry.source === void 0 ? null : (0, import_react5.createElement)("span", { style: s.badgeSystem }, sourceLabel(row.entry.source)),
        ...[...row.states].map((state) => stateBadge(state)),
        layerBadge(row.layer)
      ]),
      row.description !== "" ? (0, import_react5.createElement)("div", { style: s.preview }, row.description.slice(0, 120)) : null
    ])
  ]);
  const poolGroup = (title, groupRows) => groupRows.length === 0 ? null : (0, import_react5.createElement)("details", { style: s.injectBox }, [
    (0, import_react5.createElement)("summary", { style: { ...s.muted, cursor: "pointer" } }, `${title} (${groupRows.length})`),
    groupRows.map(renderPoolRow)
  ]);
  return (0, import_react5.createElement)("div", { style: s.colLeft }, [
    (0, import_react5.createElement)("div", {
      ref: scrollRef,
      style: { ...s.colScroll, ...dropMark === "list" ? s.dropZone : {} },
      // 列表空白处投放：池里 / 别的阶段拖来的工具放进本阶段。
      onDragOver: (event) => {
        const payload = payloadOf(event);
        if (payload === null || payload.kind !== "tool" || payload.from === phase) return;
        event.preventDefault();
        setDropMark("list");
      },
      onDrop: dropOnPane
    }, [
      truth?.linked === false ? (0, import_react5.createElement)("div", { style: s.noticeWarn }, t("noSessionBanner")) : null,
      truth?.ptcCollapsed === true ? (0, import_react5.createElement)("div", { style: s.noticeWarn }, t("ptcCollapsedBanner")) : null,
      (0, import_react5.createElement)("div", { style: s.muted }, t("toolsFourHint")),
      notice ? (0, import_react5.createElement)("div", { style: notice.kind === "ok" ? s.noticeOk : s.noticeWarn }, notice.text) : null,
      rows.map(renderRow),
      rows.length === 0 ? (0, import_react5.createElement)("div", { style: s.muted }, t("empty")) : null,
      // 本系统全部工具：注册表的完整目录，只读池；拖入 / 拖出改变阶段名单。
      (0, import_react5.createElement)("details", {
        style: { ...s.injectBox, ...dropMark === "pool" ? s.dropZoneActive : {} },
        onDragOver: (event) => {
          if (!acceptsDrop(event, "tool")) return;
          event.preventDefault();
          event.stopPropagation();
          setDropMark("pool");
        },
        onDrop: dropOnPool
      }, [
        (0, import_react5.createElement)(
          "summary",
          { style: { ...s.muted, cursor: "pointer" } },
          `${t("allToolsTitle")} (${allTools.length})`
        ),
        allTools.length === 0 ? (0, import_react5.createElement)("div", { style: s.muted }, t("empty")) : null,
        allTools.map((tool) => (0, import_react5.createElement)("div", {
          key: `${entryKey(tool)}\0${tool.keySuffix ?? ""}`,
          style: { ...s.row, opacity: 0.92 },
          draggable: true,
          title: t("dragHint"),
          onDragStart: (event) => beginDrag(event, {
            kind: "tool",
            name: tool.name,
            ...tool.source === void 0 ? {} : { source: tool.source },
            ...tool.keySuffix === void 0 ? {} : { keySuffix: tool.keySuffix },
            from: "pool"
          }),
          onDragEnd: finishDrag
        }, [
          (0, import_react5.createElement)("div", { style: s.rowBody }, [
            (0, import_react5.createElement)("div", { style: s.rowTitle }, [
              (0, import_react5.createElement)("span", { style: s.code }, tool.name),
              tool.source === void 0 ? null : (0, import_react5.createElement)("span", { style: s.badgeSystem }, sourceLabel(tool.source))
            ]),
            tool.description !== "" ? (0, import_react5.createElement)("div", { style: s.preview }, tool.description.slice(0, 120)) : null
          ])
        ]))
      ]),
      // 只读池：两个 <details> 分组（可反选 / 不可反选），行只读、无勾选框。
      poolTotal === 0 ? null : (0, import_react5.createElement)("div", {
        style: { ...s.injectBox, ...dropMark === "pool" ? s.dropZoneActive : {} },
        onDragOver: (event) => {
          if (!acceptsDrop(event, "tool")) return;
          event.preventDefault();
          event.stopPropagation();
          setDropMark("pool");
        },
        onDrop: dropOnPool
      }, [
        (0, import_react5.createElement)("div", { style: { ...s.muted, fontWeight: 600 } }, `${t("completeCatalogTitle")} (${poolTotal})`),
        (0, import_react5.createElement)("div", { style: s.muted }, t("completeCatalogHint")),
        poolGroup(t("poolReversible"), poolGroups.reversible),
        poolGroup(t("poolIrreversible"), poolGroups.irreversible)
      ])
    ]),
    // 左栏底部固定条：三态过滤（全部 / 已启用 = 可见 / 已停用 = 隐藏）。
    (0, import_react5.createElement)("div", { style: s.colFoot }, [
      (0, import_react5.createElement)("div", { style: s.seg }, [
        (0, import_react5.createElement)(
          "button",
          { style: filter === "all" ? s.segBtnActive : s.segBtn, onClick: () => setFilter("all") },
          `${t("filterAll")} ${rows.length}`
        ),
        (0, import_react5.createElement)(
          "button",
          { style: filter === "on" ? s.segBtnActive : s.segBtn, onClick: () => setFilter("on") },
          `${t("filterOn")} ${onCount}`
        ),
        (0, import_react5.createElement)(
          "button",
          { style: filter === "off" ? s.segBtnActive : s.segBtn, onClick: () => setFilter("off") },
          `${t("filterOff")} ${offCount}`
        )
      ])
    ])
  ]);
}

// src/client/prompt/PresetsPane.tsx
var import_react6 = require("react");

// src/client/prompt/preset-io.ts
function isTauriEnv(win) {
  if (win === null || win === void 0) return false;
  const w = win;
  return w.__TAURI_INTERNALS__ !== void 0 || w.__TAURI__ !== void 0;
}
function invokeOf(win) {
  if (!isTauriEnv(win)) return null;
  const internals = win.__TAURI_INTERNALS__;
  return internals && typeof internals.invoke === "function" ? internals.invoke : null;
}
var JSON_FILTERS = [{ name: "JSON", extensions: ["json"] }];
async function tauriSaveText(invoke, defaultName, text) {
  try {
    const path = await invoke("plugin:dialog|save", { defaultPath: defaultName, filters: JSON_FILTERS });
    if (typeof path !== "string" || path === "") return { kind: "cancelled" };
    await invoke("plugin:fs|write_text_file", { path, contents: text });
    return { kind: "saved" };
  } catch {
    return { kind: "unavailable" };
  }
}
async function tauriOpenText(invoke) {
  try {
    const picked = await invoke("plugin:dialog|open", { multiple: false, directory: false, filters: JSON_FILTERS });
    const path = Array.isArray(picked) ? picked[0] : picked;
    if (typeof path !== "string" || path === "") return { kind: "cancelled" };
    const text = await invoke("plugin:fs|read_text_file", { path });
    if (typeof text !== "string") return { kind: "unavailable" };
    return { kind: "text", text };
  } catch {
    return { kind: "unavailable" };
  }
}
function webDownload(target, filename, text) {
  const blob = target.makeBlob(text);
  const url = target.objectUrl(blob);
  const anchor = target.makeAnchor();
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  target.revoke(url);
}
function encodePresetExport(preset, envBlocklist) {
  return JSON.stringify({ name: preset.name, data: preset.data, ...Array.isArray(envBlocklist) ? { envBlocklist } : {} }, null, 2);
}
function decodePresetExport(text) {
  const trimmed = String(text).trim();
  if (trimmed === "") throw new Error("EMPTY_EXPORT");
  return JSON.parse(trimmed);
}
function browserDownloadTarget() {
  const g = globalThis;
  const doc = g.document;
  const url = g.URL;
  return {
    makeAnchor: () => doc.createElement("a"),
    makeBlob: (text) => new Blob([text], { type: "application/json" }),
    objectUrl: (blob) => url.createObjectURL(blob),
    revoke: (u) => url.revokeObjectURL(u)
  };
}
function makeIoEnv(win) {
  const w = win !== void 0 ? win : typeof window !== "undefined" ? window : void 0;
  const invoke = invokeOf(w);
  const tauri = invoke !== null;
  return {
    tauri,
    saveText: (name, text) => tauri ? tauriSaveText(invoke, name, text) : Promise.resolve({ kind: "unavailable" }),
    openText: () => tauri ? tauriOpenText(invoke) : Promise.resolve({ kind: "unavailable" }),
    download: (name, text) => webDownload(browserDownloadTarget(), name, text)
  };
}
async function exportPresetFile(preset, io, envBlocklist) {
  const env = io ?? makeIoEnv();
  try {
    const text = encodePresetExport(preset, envBlocklist);
    const filename = presetExportFilename(preset.name);
    if (env.tauri) {
      const out = await env.saveText(filename, text);
      if (out.kind === "saved") return { ok: true, via: "tauri" };
      if (out.kind === "cancelled") return { ok: false, via: "tauri", cancelled: true };
    }
    env.download(filename, text);
    return { ok: true, via: "browser" };
  } catch (e) {
    return { ok: false, via: "browser", message: e instanceof Error ? e.message : String(e) };
  }
}
async function importPresetFile(io) {
  const env = io ?? makeIoEnv();
  try {
    if (env.tauri) {
      const out = await env.openText();
      if (out.kind === "text") return { kind: "text", text: out.text, via: "tauri" };
      if (out.kind === "cancelled") return { kind: "cancelled" };
    }
  } catch {
  }
  return { kind: "unavailable" };
}

// src/client/prompt/PresetsPane.tsx
function useNotice() {
  const [notice, setNotice] = (0, import_react6.useState)(null);
  const noticeTimer = (0, import_react6.useRef)(null);
  (0, import_react6.useEffect)(() => () => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
  }, []);
  const show = (kind, text) => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = setTimeout(() => setNotice(null), 4e3);
  };
  return { notice, show };
}
function PresetsPane({ cfg, inv, phases, t, writePatch, writeGlobal, writeGlobalBatch, envBlocklist, applyLevel, applyTargetName }) {
  const presets = cfg.presets ?? [];
  const [name, setName] = (0, import_react6.useState)("");
  const { notice, show } = useNotice();
  const fileRef = (0, import_react6.useRef)(null);
  const blockedKeys = new Set((cfg.sections ?? []).map((entry) => entryKey(entry)));
  const merged = mergeSections(inv, cfg, blockedKeys);
  const currentEntries = /* @__PURE__ */ new Map();
  for (const section of merged) currentEntries.set(entryKey(section), { name: section.name, ...section.source === void 0 ? {} : { source: section.source } });
  for (const key of PHASE_KEYS) {
    for (const section of phases?.[key]?.baseSections ?? []) {
      currentEntries.set(entryKey(section), { name: section.name, ...section.source === void 0 ? {} : { source: section.source } });
    }
  }
  const saveCurrent = async () => {
    const presetName = name.trim() || `${t("preset")} ${presets.length + 1}`;
    const data = buildPresetData(cfg, merged);
    const written = await writeGlobal("presets", [...presets, { id: genId(), name: presetName, data }]);
    if (written) setName("");
  };
  const applyPreset = async (preset) => {
    const applied = await writePatch(applyPresetData(preset.data, cfg, currentEntries));
    if (!applied) return;
    if (applyLevel !== "workspace") await writeGlobal("activePreset", preset.id);
  };
  const deletePreset = async (id) => {
    const next = removePreset(presets, id, cfg.activePreset);
    const deleted = await writeGlobal("presets", next.presets);
    if (deleted && next.activeId === void 0 && cfg.activePreset === id) await writeGlobal("activePreset", void 0);
  };
  const exportPreset = async (preset) => {
    try {
      const res = await exportPresetFile(preset, void 0, envBlocklist);
      if (res.ok) show("ok", t("exportOk"));
      else if (res.cancelled) show("ok", t("exportCancel"));
      else show("error", `${t("exportFail")}${res.message ? ": " + res.message : ""}`);
    } catch (e) {
      show("error", `${t("exportFail")}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const importParsed = async (text) => {
    try {
      const parsed = decodePresetExport(text);
      const next = addImportedPresets(presets, parsed, genId);
      const added = next.length - presets.length;
      const fileBlock = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.envBlocklist) ? (parsed.envBlocklist ?? []).filter((e) => typeof e === "string") : [];
      const fresh = fileBlock.filter((e) => !envBlocklist.includes(e));
      const mergedNote = fresh.length > 0 ? t("importBlockMerge", { count: fresh.length }) : "";
      if (added <= 0) show("ok", t("importNone") + mergedNote);
      const fields = {};
      if (fresh.length > 0) fields.envBlocklist = [...envBlocklist, ...fresh];
      if (added > 0) fields.presets = next;
      if (Object.keys(fields).length > 0) {
        const written = await writeGlobalBatch(fields);
        if (!written) return;
      }
      if (added > 0) show("ok", `${t("importOk")} (+${added})${mergedNote}`);
    } catch (e) {
      show("error", `${t("importFail")}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const importPreset = async () => {
    try {
      const res = await importPresetFile();
      if (res.kind === "text") {
        void importParsed(res.text);
        return;
      }
      if (res.kind === "cancelled") {
        show("ok", t("importCancel"));
        return;
      }
      fileRef.current?.click();
    } catch (e) {
      show("error", `${t("importFail")}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      void importParsed(String(reader.result));
    };
    reader.onerror = () => show("error", t("importFail"));
    reader.readAsText(file);
  };
  return (0, import_react6.createElement)("div", { style: s.colLeft }, [
    (0, import_react6.createElement)("div", { style: s.colScroll }, [
      notice ? (0, import_react6.createElement)("div", { style: notice.kind === "ok" ? s.noticeOk : s.error }, notice.text) : null,
      (0, import_react6.createElement)("div", { style: s.groupHead }, t("libraryTitle")),
      (0, import_react6.createElement)("div", { style: s.muted }, t(applyLevel === "workspace" ? "applyToWorkspace" : "applyToPreset", { name: applyTargetName ?? "" })),
      (0, import_react6.createElement)("div", { style: s.injectBox }, [
        (0, import_react6.createElement)("div", { style: s.injectRow }, [
          (0, import_react6.createElement)("input", { style: { ...s.input, flex: 1 }, placeholder: t("presetName"), value: name, onChange: (e) => setName(e.target.value) }),
          (0, import_react6.createElement)("button", { style: s.mini, onClick: saveCurrent }, t("save"))
        ]),
        (0, import_react6.createElement)("div", { style: s.injectRow }, [
          (0, import_react6.createElement)("button", { style: s.mini, onClick: () => {
            void importPreset();
          } }, t("import")),
          (0, import_react6.createElement)("input", { ref: fileRef, type: "file", accept: ".json,application/json", style: { display: "none" }, onChange: onImportFile })
        ])
      ]),
      presets.length === 0 ? (0, import_react6.createElement)("div", { style: s.muted }, t("empty")) : null,
      presets.map((preset) => {
        const active = cfg.activePreset === preset.id;
        return (0, import_react6.createElement)("div", { key: preset.id, style: s.row }, [
          (0, import_react6.createElement)("div", { style: s.rowBody }, [
            (0, import_react6.createElement)("div", { style: s.rowTitle }, [
              (0, import_react6.createElement)("span", { style: s.code }, preset.name),
              active ? (0, import_react6.createElement)("span", { style: s.badgeOk }, t("active")) : null
            ])
          ]),
          (0, import_react6.createElement)("button", { style: s.mini, onClick: () => applyPreset(preset) }, t("apply")),
          (0, import_react6.createElement)("button", { style: s.mini, onClick: () => {
            void exportPreset(preset);
          } }, t("export")),
          (0, import_react6.createElement)("button", { style: s.mini, onClick: () => deletePreset(preset.id) }, t("delete"))
        ]);
      })
    ])
  ]);
}
function SettingsPane({ cfg, inv, t, writeGlobal, onReset, envBlocklist, target, onExportPreset, onImportPreset, onCleanupEmpty, onBackupAll, onRestoreAll, backingUp, restoring, cleaning }) {
  const [blockInput, setBlockInput] = (0, import_react6.useState)("");
  const backupFileRef = (0, import_react6.useRef)(null);
  const presetFileRef = (0, import_react6.useRef)(null);
  const removeBlockEntry = (entry) => {
    writeGlobal("envBlocklist", envBlocklist.filter((e) => e !== entry));
  };
  const addBlockEntry = () => {
    const entry = blockInput.trim();
    setBlockInput("");
    if (entry === "" || envBlocklist.includes(entry)) return;
    writeGlobal("envBlocklist", [...envBlocklist, entry]);
  };
  return (0, import_react6.createElement)("div", { style: s.colRight }, [
    (0, import_react6.createElement)("div", { style: { ...s.colRightScroll, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, alignContent: "start" } }, [
      target === void 0 ? null : (0, import_react6.createElement)("div", { style: s.injectBox }, [
        (0, import_react6.createElement)("div", { style: s.rowTitle }, t("presetIoTitle")),
        (0, import_react6.createElement)("div", { style: s.muted }, t("presetIoHint")),
        (0, import_react6.createElement)("div", { style: s.injectRow }, [
          (0, import_react6.createElement)("button", { style: s.mini, onClick: onExportPreset }, t("presetExport")),
          (0, import_react6.createElement)("button", { style: s.mini, onClick: () => presetFileRef.current?.click() }, t("presetImport")),
          (0, import_react6.createElement)("button", { style: s.mini, disabled: cleaning, onClick: onCleanupEmpty }, cleaning ? t("cleanupRunning") : t("cleanupEmpty")),
          (0, import_react6.createElement)("input", {
            ref: presetFileRef,
            type: "file",
            accept: ".json,application/json",
            style: { display: "none" },
            onChange: (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onImportPreset(String(reader.result));
              reader.readAsText(file);
            }
          })
        ])
      ]),
      (0, import_react6.createElement)("div", { style: s.injectBox }, [
        (0, import_react6.createElement)("div", { style: s.rowTitle }, t("backupTitle")),
        (0, import_react6.createElement)("div", { style: s.muted }, t("backupHint")),
        (0, import_react6.createElement)("div", { style: s.injectRow }, [
          (0, import_react6.createElement)("button", { style: s.mini, disabled: backingUp, onClick: onBackupAll }, backingUp ? t("backupExportRunning") : t("backupExport")),
          (0, import_react6.createElement)("button", { style: s.mini, disabled: restoring, onClick: () => backupFileRef.current?.click() }, restoring ? t("backupRestoreRunning") : t("backupRestore")),
          (0, import_react6.createElement)("input", {
            ref: backupFileRef,
            type: "file",
            accept: ".json,application/json",
            style: { display: "none" },
            onChange: (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onRestoreAll(String(reader.result));
              reader.readAsText(file);
            }
          })
        ])
      ]),
      (0, import_react6.createElement)("div", { style: s.injectBox }, [
        (0, import_react6.createElement)("div", { style: s.rowTitle }, t("forceTitle")),
        (0, import_react6.createElement)("div", { style: s.muted }, t("forceHint")),
        (0, import_react6.createElement)("div", { style: s.injectRow }, [
          (0, import_react6.createElement)("label", { style: s.switchWrap }, [
            (0, import_react6.createElement)("input", {
              type: "checkbox",
              checked: cfg.forceSections !== false,
              // forceSections 是全局字段，与 presets/activePreset 一样永远写顶层。
              onChange: (e) => writeGlobal("forceSections", e.target.checked)
            }),
            (0, import_react6.createElement)(
              "span",
              { style: cfg.forceSections !== false ? s.badgeOk : s.badgeBlocked },
              cfg.forceSections !== false ? t("forceOn") : t("forceOff")
            )
          ])
        ])
      ]),
      (0, import_react6.createElement)("div", { style: s.injectBox }, [
        (0, import_react6.createElement)("div", { style: s.rowTitle }, t("envBlockTitle")),
        (0, import_react6.createElement)("div", { style: s.muted }, t("envBlockHint")),
        (0, import_react6.createElement)("div", { style: { ...s.toolWrap, marginTop: 6 } }, envBlocklist.map((entry) => (0, import_react6.createElement)("span", {
          key: entry,
          style: { ...s.toolChip, display: "inline-flex", alignItems: "center", gap: 4 }
        }, [
          entry,
          (0, import_react6.createElement)("span", { style: { cursor: "pointer" }, title: t("delete"), onClick: () => removeBlockEntry(entry) }, "\xD7")
        ]))),
        envBlocklist.length === 0 ? (0, import_react6.createElement)("div", { style: s.muted }, t("envBlockEmpty")) : null,
        (0, import_react6.createElement)("div", { style: { ...s.injectRow, marginTop: 6 } }, [
          (0, import_react6.createElement)("input", {
            style: { ...s.input, flex: 1 },
            placeholder: t("envBlockAdd"),
            value: blockInput,
            onChange: (e) => setBlockInput(e.target.value)
          }),
          (0, import_react6.createElement)("button", { style: s.mini, disabled: blockInput.trim() === "", onClick: addBlockEntry }, t("envBlockAddAction"))
        ]),
        (0, import_react6.createElement)("details", { style: { marginTop: 6 } }, [
          (0, import_react6.createElement)("summary", { style: { ...s.muted, cursor: "pointer" } }, `${t("envVarsTitle")} (${inv?.variables?.length ?? 0})`),
          (0, import_react6.createElement)("div", { style: { ...s.muted, marginTop: 4 } }, t("envVarsHint")),
          (0, import_react6.createElement)("div", { style: { ...s.toolWrap, marginTop: 4 } }, (inv?.variables ?? []).map((varName) => (0, import_react6.createElement)("span", { key: varName, style: s.toolChip }, `{{${varName}}}`)))
        ])
      ]),
      (0, import_react6.createElement)("div", { style: s.injectBox }, [
        (0, import_react6.createElement)("div", { style: s.rowTitle }, t("resetTitle")),
        (0, import_react6.createElement)("div", { style: s.muted }, t("resetHint")),
        (0, import_react6.createElement)("div", { style: s.injectRow }, [
          (0, import_react6.createElement)("button", { style: s.mini, onClick: () => {
            if (window.confirm(t("resetConfirm"))) onReset();
          } }, t("resetAction"))
        ])
      ])
    ])
  ]);
}

// src/client/prompt/PreviewPane.tsx
var import_react8 = require("react");

// src/client/prompt/PreviewTools.tsx
var import_react7 = require("react");
function norm(tool) {
  if (typeof tool === "string") return { name: tool, description: "" };
  return {
    name: tool.name,
    description: tool.description ?? "",
    ...tool.source === void 0 ? {} : { source: tool.source },
    ...tool.keySuffix === void 0 ? {} : { keySuffix: tool.keySuffix }
  };
}
function PreviewTools({ tools, t }) {
  if (tools.length === 0) return (0, import_react7.createElement)("div", { style: s.muted }, t("empty"));
  return (0, import_react7.createElement)("div", { style: s.list }, [
    (0, import_react7.createElement)("div", { style: s.rowTitle }, [
      (0, import_react7.createElement)("span", { style: s.orderTag }, `${tools.length} ${t("previewToolCount")}`)
    ]),
    tools.map((tool, index) => {
      const { name, description, source, keySuffix } = norm(tool);
      const identity = `${entryKey({ name, ...source === void 0 ? {} : { source } })}:${index}:${keySuffix ?? ""}`;
      return (0, import_react7.createElement)("div", { key: identity, style: s.row }, [
        (0, import_react7.createElement)("div", { style: s.rowBody }, [
          (0, import_react7.createElement)("div", { style: s.rowTitle }, [
            (0, import_react7.createElement)("span", { style: s.code }, name),
            source === void 0 ? null : (0, import_react7.createElement)("span", { style: s.badgeSystem }, `${source.kind}${source.id === void 0 ? "" : `:${source.id}`}`),
            keySuffix === void 0 ? null : (0, import_react7.createElement)("span", { style: s.badgeSystem }, keySuffix)
          ]),
          (0, import_react7.createElement)("div", { style: s.preview }, String(description ?? "").slice(0, 140))
        ])
      ]);
    })
  ]);
}

// src/client/prompt/PreviewPane.tsx
function PreviewPane({ t, phases, phase, sub, onToggleContext }) {
  const data = phases?.[phase] ?? null;
  const lossNote = data === null || data === void 0 ? null : data.takenOverBy !== void 0 ? t("sectionsTakenOver", { name: data.takenOverBy }) : data.lostSections !== void 0 ? t("sectionsLost", { emitted: data.lostSections.emitted, survived: data.lostSections.survived }) : null;
  const baseContexts = data?.baseContexts;
  return (0, import_react8.createElement)("div", { style: s.colRight }, [
    (0, import_react8.createElement)("div", { style: s.colRightScroll }, [
      // 该阶段的本插件段级产出没进最终提示词（整段接管或被下游丢弃）。
      lossNote !== null ? (0, import_react8.createElement)("div", { style: s.noticeWarn }, lossNote) : null,
      // scope 挂载失败回退全局层时明确警示：这不是该预设的原生装配。
      data !== null && data.scopeResolved === false ? (0, import_react8.createElement)("div", { style: s.noticeWarn }, t("scopeFallback")) : null,
      phases === null ? (0, import_react8.createElement)("div", { style: s.muted }, t("loading")) : null,
      phases !== null && data === null ? (0, import_react8.createElement)("div", { style: s.error }, t("previewFail")) : null,
      data ? (0, import_react8.createElement)("div", { style: s.muted }, t("previewPreset")) : null,
      sub === "prompt" ? data ? [
        (0, import_react8.createElement)("div", { style: s.rowTitle }, [
          (0, import_react8.createElement)("span", { style: s.muted }, t("previewHint")),
          (0, import_react8.createElement)("span", { style: s.orderTag }, `${data.sections.length} ${t("previewSections")}`)
        ]),
        (0, import_react8.createElement)("pre", { style: s.previewText }, data.text || t("empty")),
        (0, import_react8.createElement)("div", { style: s.rowTitle }, t("runtimeContexts")),
        baseContexts === void 0 ? (0, import_react8.createElement)("div", { style: s.noticeWarn }, t("contextsUnsupported")) : baseContexts.length === 0 ? (0, import_react8.createElement)("div", { style: s.muted }, t("empty")) : baseContexts.map((context, index) => {
          const identity = `${entryKey(context)}:${index}`;
          const disabled = onToggleContext === void 0;
          const hidden = context.blocked === true || context.active === false;
          return (0, import_react8.createElement)("div", { key: identity, style: { opacity: hidden ? 0.5 : 1 } }, [
            (0, import_react8.createElement)("label", { style: { ...s.muted, display: "flex", alignItems: "center", gap: 6, cursor: disabled ? "default" : "pointer" } }, [
              (0, import_react8.createElement)("input", {
                type: "checkbox",
                checked: !hidden,
                disabled,
                onChange: (e) => onToggleContext?.(context, !e.currentTarget.checked)
              }),
              context.name,
              context.source === void 0 ? null : (0, import_react8.createElement)("span", { style: s.badgeSystem }, `${context.source.kind}${context.source.id === void 0 ? "" : `:${context.source.id}`}`),
              context.dynamic === true ? (0, import_react8.createElement)("span", { style: s.badgeSystem }, t("dynamic")) : null
            ]),
            (0, import_react8.createElement)("pre", { style: s.previewText }, context.text || t("empty"))
          ]);
        })
      ] : null : data ? [
        // 模型视角 vs 注册表视角的对照：预览按所选阶段运行全部装配规则
        //（含预设原生的阶段裁剪），某些预设（如 PTC / Code Mode）会把
        // 完整目录包装成单一工具，注册表原始目录仍列在工具子视图。
        (0, import_react8.createElement)("div", { style: s.rowTitle }, [
          (0, import_react8.createElement)("span", { style: s.muted }, t("previewToolsHint")),
          (0, import_react8.createElement)(
            "span",
            { style: s.orderTag },
            `${data.tools.length} / ${data.registryTotal ?? "?"} ${t("previewToolsCount")}`
          )
        ]),
        (0, import_react8.createElement)(PreviewTools, { tools: data.tools, t })
      ] : null
    ])
  ]);
}

// src/client/prompt/Panel.tsx
var INVENTORY_URL = "/api/prompt-customizer/inventory";
var AGENT_PRESETS_URL = "/api/prompt-customizer/agent-presets";
var CONFIG_URL = "/api/prompt-customizer/config";
var CONFIG_BATCH_URL = "/api/prompt-customizer/config/batch";
var CONFIG_SET_URL = "/api/prompt-customizer/config/set";
var CONFIG_UNSET_URL = "/api/prompt-customizer/config/unset";
var CONFIG_APPLY_URL = "/api/prompt-customizer/config/apply";
var CONFIG_RESET_URL = "/api/prompt-customizer/config/reset";
var PREVIEW_URL = "/api/prompt-customizer/preview";
var REVISION_URL = "/api/prompt-customizer/revision";
var DRAFT_FIELDS = [
  ...PHASES.flatMap((phase) => [phase.sectionField, phase.contextField]),
  "replacements",
  "inject",
  "tools"
];
function Panel({ t, onClose, level = "preset", workspace }) {
  const [cfg, setCfg] = (0, import_react9.useState)(null);
  const [inv, setInv] = (0, import_react9.useState)(null);
  const [phases, setPhases] = (0, import_react9.useState)(null);
  const [agentPresets, setAgentPresets] = (0, import_react9.useState)([]);
  const [currentPreset, setCurrentPreset] = (0, import_react9.useState)(void 0);
  const [workspaceOverrides, setWorkspaceOverrides] = (0, import_react9.useState)({});
  const [currentWorkspace, setCurrentWorkspace] = (0, import_react9.useState)(void 0);
  const [mode, setMode] = (0, import_react9.useState)("sections");
  const [error, setError] = (0, import_react9.useState)(null);
  const [version, setVersion] = (0, import_react9.useState)(0);
  const [phase, setPhase] = (0, import_react9.useState)("bootstrap");
  const [dropPhase, setDropPhase] = (0, import_react9.useState)(null);
  const syncSeq = (0, import_react9.useRef)(0);
  const refreshSeq = (0, import_react9.useRef)(0);
  const scopeKeyRef = (0, import_react9.useRef)("");
  const [target, setTarget] = (0, import_react9.useState)(void 0);
  const [syncAll, setSyncAll] = (0, import_react9.useState)(false);
  const [previewSub, setPreviewSub] = (0, import_react9.useState)("prompt");
  const [draft, setDraft] = (0, import_react9.useState)(null);
  const [saving, setSaving] = (0, import_react9.useState)(false);
  const writeChain = (0, import_react9.useRef)(Promise.resolve());
  const enqueueWrite = (operation) => {
    const next = writeChain.current.then(operation, operation);
    writeChain.current = next.then(() => void 0, () => void 0);
    return next;
  };
  const [flash, setFlash] = (0, import_react9.useState)(null);
  const [flashKind, setFlashKind] = (0, import_react9.useState)("ok");
  const [backingUp, setBackingUp] = (0, import_react9.useState)(false);
  const [restoring, setRestoring] = (0, import_react9.useState)(false);
  const [cleaning, setCleaning] = (0, import_react9.useState)(false);
  const flashTimer = (0, import_react9.useRef)(null);
  const loadConfig = () => fetch(CONFIG_URL + `?t=${Date.now()}`).then((r) => r.json()).then((body) => {
    if (body?.ok !== true) throw new Error(body?.error ?? "config failed");
    setCfg(body.config);
    setWorkspaceOverrides(body.workspaceOverrides ?? {});
    setCurrentWorkspace(typeof body.currentWorkspace === "string" && body.currentWorkspace !== "" ? body.currentWorkspace : void 0);
    setError(null);
    return null;
  }).catch((e) => {
    const error2 = e instanceof Error ? e : new Error(String(e));
    setError(error2.message);
    return error2;
  });
  const load = () => {
    void loadConfig();
  };
  (0, import_react9.useEffect)(load, []);
  const refresh = () => {
    const configReady = loadConfig();
    const seq = ++refreshSeq.current;
    const scopeKey = `${level}\0${target ?? ""}\0${level === "workspace" ? workspace ?? currentWorkspace ?? "" : ""}`;
    scopeKeyRef.current = scopeKey;
    if (level === "preset" && target === void 0) {
      setPhases(null);
      setInv(null);
      return Promise.resolve();
    }
    const wsSel = level === "workspace" ? workspace ?? currentWorkspace ?? "" : "";
    const qs = `${target ? `?scope=${encodeURIComponent(target)}` : ""}${wsSel === "" ? "" : `${target ? "&" : "?"}workspace=${encodeURIComponent(wsSel)}`}`;
    setPhases(null);
    setInv(null);
    const params = (phase2) => `${qs}${qs ? "&" : "?"}phase=${phase2}&t=${Date.now()}`;
    const failures = [];
    const grab = (phase2) => fetch(PREVIEW_URL + params(phase2)).then((r) => r.json()).then((body) => {
      if (body.ok === false) throw new Error(body.error ?? t("previewFail"));
      return body;
    }).catch((error2) => {
      failures.push(`${phase2}: ${String(error2 instanceof Error ? error2.message : error2)}`);
      return null;
    });
    return Promise.all([configReady, ...PHASE_KEYS.map(grab), fetch(INVENTORY_URL + qs).then((r) => r.json()).then((body) => {
      if (body.ok === false) throw new Error(body.error ?? "inventory failed");
      return body;
    }).catch((error2) => {
      failures.push(String(error2 instanceof Error ? error2.message : error2));
      return null;
    })]).then((responses) => {
      const inventoryData = responses[responses.length - 1];
      if (seq !== refreshSeq.current || scopeKey !== scopeKeyRef.current) return;
      const views = { ...{} };
      PHASE_KEYS.forEach((key, index) => {
        views[key] = responses[index + 1];
      });
      setPhases(views);
      setInv(inventoryData);
      const configError = responses[0];
      setError(configError !== null ? configError.message : failures.length ? failures.join("\n") : null);
    }).catch((e) => {
      if (seq !== refreshSeq.current || scopeKey !== scopeKeyRef.current) return;
      const empty = {};
      for (const key of PHASE_KEYS) empty[key] = null;
      setPhases(empty);
      setError(String(e instanceof Error ? e.message : e));
    });
  };
  (0, import_react9.useEffect)(() => {
    void refresh();
  }, [target, version, level, workspace, currentWorkspace]);
  const revisionRef = (0, import_react9.useRef)(null);
  (0, import_react9.useEffect)(() => {
    let stopped = false;
    let timer = null;
    const tick = () => {
      if (stopped) return;
      if (typeof document !== "undefined" && document.hidden) {
        timer = setTimeout(tick, 1500);
        return;
      }
      fetch(REVISION_URL, { cache: "no-store" }).then((response) => response.json()).then((body) => {
        if (stopped || body?.ok !== true || typeof body.revision !== "number") return;
        const previous = revisionRef.current;
        revisionRef.current = body.revision;
        if (previous !== null && previous !== body.revision) void refresh();
      }).catch(() => {
      }).finally(() => {
        if (!stopped) timer = setTimeout(tick, 1500);
      });
    };
    timer = setTimeout(tick, 1500);
    return () => {
      stopped = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [level, target, workspace, currentWorkspace]);
  const syncDraftPreview = () => {
    if (draft === null || !draft.dirty) return;
    if (level !== "preset") return;
    const patch = {};
    const source = draft;
    for (const field of DRAFT_FIELDS) {
      if (Object.hasOwn(source, field)) patch[field] = source[field];
    }
    if (Object.keys(patch).length === 0) return;
    const seq = ++syncSeq.current;
    const scopeQs = target !== void 0 ? `?scope=${encodeURIComponent(target)}` : "";
    fetch(PREVIEW_URL + scopeQs, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target, patch, phase })
    }).then((r) => r.json()).then((body) => {
      if (body?.ok === false) throw new Error(body?.error ?? "preview failed");
      if (seq !== syncSeq.current) return;
      setPhases((prev) => prev === null ? prev : { ...prev, [phase]: body });
      setError(null);
    }).catch((e) => {
      setError(`${t("previewSyncFail")}\uFF1A${e instanceof Error ? e.message : String(e)}`);
    });
  };
  (0, import_react9.useEffect)(() => {
    if (draft === null || !draft.dirty) return void 0;
    const timer = setTimeout(syncDraftPreview, 600);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, phase, target, level, workspace, currentWorkspace]);
  const fetchPresets = () => {
    fetch(AGENT_PRESETS_URL + `?t=${Date.now()}`).then((r) => r.json()).then((body) => {
      setAgentPresets(Array.isArray(body?.presets) ? body.presets : []);
      setCurrentPreset(typeof body?.currentPreset === "string" && body.currentPreset !== "" ? body.currentPreset : void 0);
    }).catch(() => {
      setAgentPresets([]);
      setCurrentPreset(void 0);
    });
  };
  (0, import_react9.useEffect)(() => {
    fetchPresets();
  }, []);
  (0, import_react9.useEffect)(() => {
    setTarget((current2) => {
      if (current2 !== void 0) return current2;
      const live = currentPreset === void 0 ? void 0 : agentPresets.find((p) => p.id === currentPreset && !p.broken);
      if (live !== void 0) return live.id;
      const first = agentPresets.find((p) => !p.broken) ?? agentPresets[0];
      return first?.id;
    });
  }, [agentPresets, currentPreset]);
  const showFlash = (text, kind = "ok") => {
    if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    setFlash(text);
    setFlashKind(kind);
    flashTimer.current = setTimeout(() => setFlash(null), 3200);
  };
  const clearDraft = () => {
    syncSeq.current += 1;
    setDraft(null);
  };
  if (cfg === null) {
    return (0, import_react9.createElement)("div", { style: { ...s.pRoot, padding: 16 } }, t("loading"));
  }
  const wsKey = workspace ?? currentWorkspace ?? void 0;
  const base = level === "workspace" ? overrideView(cfg, wsKey !== void 0 ? workspaceOverrides[wsKey] : void 0) : editView(cfg, target);
  const view = (() => {
    if (draft === null) return base;
    const next = {
      ...base,
      replacements: draft.replacements ?? base.replacements,
      inject: draft.inject ?? base.inject,
      tools: draft.tools ?? base.tools
    };
    for (const phase2 of PHASES) {
      next[phase2.sectionField] = draft[phase2.sectionField] ?? base[phase2.sectionField];
      next[phase2.contextField] = draft[phase2.contextField] ?? base[phase2.contextField];
    }
    return next;
  })();
  const ep = phases;
  const writeField = (field, value) => {
    const url = value === void 0 ? CONFIG_UNSET_URL : CONFIG_SET_URL;
    return enqueueWrite(async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ field, value })
      });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "write failed");
      setCfg(body.config);
      setError(null);
      setVersion((n) => n + 1);
      return true;
    }).catch((e) => {
      setError(String(e instanceof Error ? e.message : e));
      return false;
    });
  };
  const writeGlobalBatch = (fields) => {
    return enqueueWrite(async () => {
      const response = await fetch(CONFIG_BATCH_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fields })
      });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "batch write failed");
      setCfg(body.config);
      setError(null);
      setVersion((n) => n + 1);
      return true;
    }).catch((e) => {
      setError(String(e instanceof Error ? e.message : e));
      return false;
    });
  };
  const edit = (field, value) => {
    setDraft((d) => ({
      ...d ?? { dirty: false },
      [field]: value,
      dirty: true
    }));
  };
  const save = () => {
    if (draft === null || saving) return;
    if (level === "workspace" && wsKey === void 0) {
      showFlash(t("workspaceRequired"), "err");
      return;
    }
    const patch = {};
    const edited = draft;
    for (const field of DRAFT_FIELDS) {
      if (Object.hasOwn(edited, field)) patch[field] = edited[field];
    }
    setSaving(true);
    void enqueueWrite(async () => {
      const response = await fetch(CONFIG_APPLY_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(level === "workspace" ? { level: "workspace", workspace: wsKey, patch } : { target, patch })
      });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "save failed");
      setCfg(body.config);
      if (body.workspaceOverrides !== void 0) setWorkspaceOverrides(body.workspaceOverrides);
      clearDraft();
      setError(null);
      setVersion((n) => n + 1);
      showFlash(t("saveOk"));
    }).catch((e) => setError(`${t("saveFail")}: ${e instanceof Error ? e.message : String(e)}`)).finally(() => setSaving(false));
  };
  const writePatch = (patch) => {
    return enqueueWrite(async () => {
      const response = await fetch(CONFIG_APPLY_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, patch })
      });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "apply failed");
      setCfg(body.config);
      setError(null);
      setVersion((n) => n + 1);
      return true;
    }).catch((e) => {
      setError(String(e instanceof Error ? e.message : e));
      return false;
    });
  };
  const writePatchLayered = (patch) => {
    if (level === "workspace") {
      const cwd = workspace ?? currentWorkspace;
      if (cwd === void 0 || cwd === null || cwd === "") {
        showFlash(t("workspaceRequired"), "err");
        return Promise.resolve(false);
      }
      return enqueueWrite(async () => {
        const response = await fetch(CONFIG_APPLY_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ level: "workspace", workspace: cwd, patch })
        });
        const body = await response.json();
        if (body?.ok !== true) throw new Error(body?.error ?? "apply failed");
        setCfg(body.config);
        if (body.workspaceOverrides !== void 0) setWorkspaceOverrides(body.workspaceOverrides);
        setError(null);
        setVersion((n) => n + 1);
        return true;
      }).catch((e) => {
        setError(String(e instanceof Error ? e.message : e));
        return false;
      });
    }
    return writePatch(patch);
  };
  const toggleContext = (entry, hide) => {
    const keys = syncAll ? PHASE_KEYS : [phase];
    const targets = keys.map((key) => ({ key, view: phases?.[key] }));
    if (targets.some(({ view: view2 }) => view2 === null || view2 === void 0 || !Array.isArray(view2.baseContexts))) {
      showFlash(t("contextsNotReady"), "err");
      return;
    }
    for (const { key } of targets) {
      const patch = contextPatch(view, key, entry, hide);
      for (const [field, value] of Object.entries(patch)) edit(field, value);
    }
  };
  const writeGlobal = writeField;
  const nativeIn = (key, entry) => {
    const view2 = ep?.[key];
    if (view2 === void 0 || view2 === null) return null;
    return (view2.baseSections ?? []).some((section) => sameEntry(section, entry));
  };
  const toggleSyncAll = (on) => {
    if (!on) {
      setSyncAll(false);
      return;
    }
    if (ep === null || PHASE_KEYS.some((key) => ep[key] === null)) {
      showFlash(t("syncNotReady"), "err");
      return;
    }
    const rows = mirroredRows(view, ep, nativeIn);
    if (rows.length === 0) {
      showFlash(t("syncNotReady"), "err");
      return;
    }
    setSyncAll(true);
    edit("inject", mirrorPhaseInjectEntries(view, rows, nativeIn));
    const denied = mirroredDeniedLists(rows);
    for (const descriptor of PHASES) edit(descriptor.sectionField, denied[descriptor.sectionField]);
    const skipped = mirrorSkippedNames(rows, nativeIn);
    showFlash(skipped.length > 0 ? `${t("syncApplied")} ${t("syncSkippedDynamic", { names: skipped.join("\u3001") })}` : t("syncApplied"));
  };
  const resetAll = () => {
    void enqueueWrite(async () => {
      const response = await fetch(CONFIG_RESET_URL, {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "reset failed");
      setCfg(body.config);
      clearDraft();
      setError(null);
      setVersion((n) => n + 1);
      showFlash(t("resetOk"));
    }).catch((e) => setError(`${t("resetFail")}: ${e instanceof Error ? e.message : String(e)}`));
  };
  const switchMode = (next) => {
    const leaving = (mode === "sections" || mode === "tools") && next === "presets";
    if (leaving) {
      if (draft?.dirty && !window.confirm(t("discardConfirm"))) return;
      clearDraft();
    }
    setMode(next);
    setPreviewSub(next === "tools" ? "tools" : "prompt");
  };
  const switchTarget = (next) => {
    if (draft?.dirty && !window.confirm(t("discardConfirm"))) return;
    clearDraft();
    setTarget(next);
  };
  const exportPreset = () => {
    if (target === void 0) {
      showFlash(t("presetIoNoTarget"), "err");
      return;
    }
    fetch(`/api/prompt-customizer/export?scope=${encodeURIComponent(target)}`).then((r) => r.json()).then((body) => {
      if (body?.ok !== true) throw new Error(body?.error ?? "export failed");
      const filename = `prompt-customizer-${target}.json`;
      const text = JSON.stringify(body, null, 2);
      const io = makeIoEnv();
      void io.saveText(filename, text).then((outcome) => {
        if (outcome.kind === "saved") showFlash(t("presetIoOk", { name: filename }), "ok");
        else if (outcome.kind === "unavailable") {
          io.download(filename, text);
          showFlash(t("presetIoOk", { name: filename }), "ok");
        }
      });
    }).catch((e) => showFlash(`${t("presetIoFail")}: ${String(e instanceof Error ? e.message : e)}`, "err"));
  };
  const importPreset = (text) => {
    if (target === void 0) {
      showFlash(t("presetIoNoTarget"), "err");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      showFlash(t("presetIoBadFormat"), "err");
      return;
    }
    const customization = parsed?.customization;
    if (parsed?.format !== "dsh-prompt-customizer/export@1" || customization === null || typeof customization !== "object" || Array.isArray(customization)) {
      showFlash(t("presetIoBadFormat"), "err");
      return;
    }
    if (!window.confirm(t("presetIoConfirm", { target }))) return;
    void enqueueWrite(async () => {
      const response = await fetch("/api/prompt-customizer/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, customization })
      });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "import failed");
      setCfg(body.config);
      setVersion((n) => n + 1);
      showFlash(t("presetIoImported"), "ok");
    }).catch((e) => showFlash(`${t("presetIoFail")}: ${String(e instanceof Error ? e.message : e)}`, "err"));
  };
  const cleanupEmpty = () => {
    if (cleaning) return;
    if (!window.confirm(t("cleanupConfirm"))) return;
    setCleaning(true);
    void enqueueWrite(async () => {
      const response = await fetch("/api/prompt-customizer/overrides/cleanup", { method: "POST" });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "cleanup failed");
      setCfg(body.config);
      setVersion((n) => n + 1);
      showFlash(t("cleanupOk", { n: Array.isArray(body.removed) ? body.removed.length : 0 }), "ok");
    }).catch((e) => showFlash(`${t("cleanupFail")}: ${String(e instanceof Error ? e.message : e)}`, "err")).finally(() => setCleaning(false));
  };
  const backupAll = () => {
    if (backingUp) return;
    setBackingUp(true);
    fetch("/api/prompt-customizer/backup").then((r) => r.json()).then((body) => {
      if (body?.ok !== true) throw new Error(body?.error ?? "backup failed");
      const filename = `dsh-prompt-customizer-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
      const text = JSON.stringify(body, null, 2);
      const io = makeIoEnv();
      void io.saveText(filename, text).then((outcome) => {
        if (outcome.kind === "saved") showFlash(t("backupOk", { name: filename }), "ok");
        else if (outcome.kind === "unavailable") {
          io.download(filename, text);
          showFlash(t("backupOk", { name: filename }), "ok");
        }
      });
    }).catch((e) => showFlash(`${t("backupFail")}\uFF1A${String(e instanceof Error ? e.message : e)}`, "err")).finally(() => setBackingUp(false));
  };
  const restoreAll = (text) => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      showFlash(t("restoreBadFormat"), "err");
      return;
    }
    if (parsed?.format !== "dsh-prompt-customizer/backup@1" || parsed.docs === null || typeof parsed.docs !== "object") {
      showFlash(t("restoreBadFormat"), "err");
      return;
    }
    if (!window.confirm(t("restoreConfirm"))) return;
    setRestoring(true);
    void enqueueWrite(async () => {
      const response = await fetch("/api/prompt-customizer/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const body = await response.json();
      if (body?.ok !== true) throw new Error(body?.error ?? "restore failed");
      setCfg(body.config);
      if (body.workspaceOverrides !== void 0) setWorkspaceOverrides(body.workspaceOverrides);
      clearDraft();
      setError(null);
      setVersion((n) => n + 1);
      showFlash(t("restoreOk"), "ok");
    }).catch((e) => setError(`${t("restoreFail")}: ${e instanceof Error ? e.message : String(e)}`)).finally(() => setRestoring(false));
  };
  const modeBtn = (key, label) => (0, import_react9.createElement)("button", { key, style: mode === key ? s.segBtnActive : s.segBtn, onClick: () => switchMode(key) }, label);
  const stageLabel = (key) => t(PHASE_LABEL_KEY[key]);
  const draftDirty = draft?.dirty === true;
  const targetChip = (id, label, icon, broken) => {
    const active = target === id;
    const bad = broken !== void 0 && broken !== "";
    const customized = Object.values(cfg?.overrides?.[id] ?? {}).filter(hasContent).length;
    return (0, import_react9.createElement)("button", {
      key: id,
      type: "button",
      className: css.catItem,
      "data-active": active || void 0,
      onClick: () => switchTarget(id),
      title: bad ? `${label} \u2014 ${t("broken")}` : customized > 0 ? `${label} \xB7 ${t("targetCustomized", { n: customized })}` : label
    }, [
      (0, import_react9.createElement)("span", { className: css.catIcon, "data-active": active || void 0 }, icon),
      (0, import_react9.createElement)("span", { className: css.catLabel }, label),
      bad ? (0, import_react9.createElement)("span", { className: css.catCount, "data-warn": true }, t("broken")) : null,
      !bad && customized > 0 ? (0, import_react9.createElement)("span", { className: css.catCount, "data-warn": true }, String(customized)) : null
    ]);
  };
  return (0, import_react9.createElement)("div", { style: s.pRoot }, [
    // ── 第一行：agent 预设（编辑目标）──
    // 与 SKILL / MCP 顶栏同款 chips 行（同一套类名 + 图标 + 计数），且排在
    // 定制面板自己的头部之上：三个 tab 的「预设在上」节奏一致。
    // 0.9.0 起「全部 Agent」入口移除：提示词必须按具体预设修改，无全局目标。
    (0, import_react9.createElement)("div", { key: "targets", className: css.topbar }, [
      (0, import_react9.createElement)("div", { className: css.chipRow, role: "group", "aria-label": t("targetLabel") }, [
        ...agentPresets.map((p) => targetChip(p.id, p.name, (0, import_react9.createElement)(import_dsh_client_ui_primitives.IconAgentPresetOutlineRegular, { size: 15 }), p.broken))
      ])
    ]),
    // ── 第二行：标题 + 模式切换 + （阶段切换 + 开关） + 工具栏 ──
    // 阶段按钮合并放在三态同步选择框左侧：左栏列表与右栏预览跟着同一个
    // 阶段状态走，一处切换两边联动。仅在提示词 / 工具两个模式显示。
    (0, import_react9.createElement)("div", { style: s.head }, [
      (0, import_react9.createElement)("span", { style: s.headTitle }, [
        (0, import_react9.createElement)("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { flex: "none" } }, [
          (0, import_react9.createElement)("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
          (0, import_react9.createElement)("path", { d: "M14 2v6h6" }),
          (0, import_react9.createElement)("path", { d: "M16 13H8" }),
          (0, import_react9.createElement)("path", { d: "M16 17H8" }),
          (0, import_react9.createElement)("path", { d: "M10 9H8" })
        ]),
        t("nav")
      ]),
      (0, import_react9.createElement)("div", { style: s.seg }, [
        modeBtn("sections", t("tabsSections")),
        modeBtn("tools", t("tabsTools")),
        modeBtn("presets", t("tabsPresets"))
      ]),
      (0, import_react9.createElement)("div", { style: s.headActions }, [
        mode === "sections" || mode === "tools" ? (0, import_react9.createElement)("div", { style: s.seg }, PHASE_KEYS.map((key) => (0, import_react9.createElement)("button", {
          key,
          style: dropPhase === key ? phase === key ? s.segBtnDropActive : s.segBtnDrop : phase === key ? s.segBtnActive : s.segBtn,
          onClick: () => setPhase(key),
          // 拖到阶段 Tab = 把行复制到那个阶段（段 / 工具各按自己的语义落地）。
          onDragOver: (event) => {
            if (payloadOf(event) === null) return;
            event.preventDefault();
            setDropPhase(key);
          },
          onDragLeave: () => setDropPhase((current2) => current2 === key ? null : current2),
          onDrop: (event) => {
            const payload = payloadOf(event);
            setDropPhase(null);
            if (payload === null) return;
            event.preventDefault();
            dropOnPhase(key, payload);
          }
        }, stageLabel(key)))) : null,
        draftDirty && (mode === "sections" || mode === "tools") ? (0, import_react9.createElement)("span", { style: s.badgeReplaced, title: t("draftBadge") }, t("draftBadge")) : null,
        mode === "sections" || mode === "tools" ? (0, import_react9.createElement)("label", {
          style: { ...s.muted, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", whiteSpace: "nowrap" },
          title: t("syncAllPhasesHint")
        }, [
          (0, import_react9.createElement)("input", {
            type: "checkbox",
            checked: syncAll,
            onChange: (e) => toggleSyncAll(e.target.checked),
            style: { margin: 0, cursor: "pointer" }
          }),
          t("syncAllPhases")
        ]) : null,
        (0, import_react9.createElement)("button", {
          style: draft?.dirty ? s.saveBtnDirty : s.saveBtn,
          disabled: !draft?.dirty || saving,
          onClick: save
        }, t("save")),
        // 刷新 = GET 磁盘权威状态；有脏草稿时再补一次当前阶段的草稿叠加预览，
        // 避免预览短暂回退到「上次保存」的状态。
        (0, import_react9.createElement)("button", { style: s.saveBtn, onClick: () => {
          void refresh().then(() => syncDraftPreview());
        } }, t("refresh")),
        // 关闭按钮只在独立开窗时给出（onClose 缺省 = 由外层 tab 承载，不需要它）。
        onClose === void 0 ? null : (0, import_react9.createElement)(
          "button",
          { style: s.iconBtn, onClick: onClose, "aria-label": t("close"), title: t("close") },
          (0, import_react9.createElement)("svg", { width: 15, height: 15, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, [
            (0, import_react9.createElement)("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" })
          ])
        )
      ])
    ]),
    // ── 消息条（错误 / 闪示 / 目标异常警示） ──
    (0, import_react9.createElement)("div", { style: { padding: "0 14px" } }, [
      error ? (0, import_react9.createElement)("div", { style: s.error }, String(error)) : null,
      flash ? (0, import_react9.createElement)("div", { style: flashKind === "err" ? s.error : s.noticeOk }, flash) : null,
      target && agentPresets.find((p) => p.id === target)?.broken ? (0, import_react9.createElement)("div", { style: s.error }, t("brokenPreset")) : null,
      inv?.scopeResolved === false && mode !== "presets" ? (0, import_react9.createElement)("div", { style: s.noticeWarn }, t("scopeFallback")) : null,
      level === "workspace" && currentWorkspace === void 0 ? (0, import_react9.createElement)("div", { style: s.noticeWarn }, t("workspaceNoSession")) : null
    ]),
    // ── 主体分栏（flex row：左栏列表 / 右栏预览）──
    // 顶部选「提示词」= 提示词编辑 + 提示词预览；选「工具」= 工具编辑 +
    // 工具预览（previewSub 跟随模式，无手动切换）。阶段由头部统一控制。
    (0, import_react9.createElement)(
      "div",
      { key: "body", style: s.body },
      mode === "sections" ? [
        (0, import_react9.createElement)(SectionsPane, { key: "sections", cfg: view, inv, phases: ep, phase, syncAll, t, write: edit }),
        (0, import_react9.createElement)(PreviewPane, { key: "preview", t, phases: ep, phase, sub: previewSub, onToggleContext: toggleContext })
      ] : mode === "tools" ? [
        (0, import_react9.createElement)(ToolsPane, {
          key: "tools",
          cfg: view,
          inv,
          phases: ep,
          phase,
          syncAll,
          t,
          write: edit,
          onOpenSection: () => switchMode("sections")
        }),
        (0, import_react9.createElement)(PreviewPane, { key: "preview", t, phases: ep, phase, sub: previewSub, onToggleContext: toggleContext })
      ] : [
        (0, import_react9.createElement)(PresetsPane, {
          key: "presets",
          cfg: view,
          inv,
          phases: ep,
          t,
          writePatch: writePatchLayered,
          applyLevel: level,
          applyTargetName: level === "workspace" ? workspace ?? currentWorkspace ?? void 0 : target,
          writeGlobal,
          writeGlobalBatch,
          // 黑名单永远是全局字段：取原始配置（不经 editView 的目标叠加）。
          envBlocklist: cfg.envBlocklist ?? []
        }),
        (0, import_react9.createElement)(SettingsPane, {
          key: "settings",
          cfg: view,
          inv,
          t,
          writeGlobal,
          onBackupAll: backupAll,
          onRestoreAll: restoreAll,
          backingUp,
          restoring,
          cleaning,
          target,
          onExportPreset: exportPreset,
          onImportPreset: importPreset,
          onCleanupEmpty: cleanupEmpty,
          onReset: resetAll,
          envBlocklist: cfg.envBlocklist ?? []
        })
      ]
    )
  ]);
}

// src/client/prompt/locales.ts
var DICT = {
  zh: {
    nav: "\u63D0\u793A\u8BCD\u5B9A\u5236",
    previewPreset: "\u6765\u6E90\uFF1A\u5F53\u524D\u6A21\u5F0F\u9884\u8BBE\u3002\u6709\u540C\u9884\u8BBE\u6D3B\u52A8\u4F1A\u8BDD\u65F6\uFF0C\u63D0\u793A\u8BCD\u6E05\u5355\u4E0E\u53F3\u680F\u663E\u793A\u8BE5\u4F1A\u8BDD\u7684\u771F\u5B9E\u88C5\u914D\uFF08\u542B\u63D2\u4EF6\u6CE8\u5165\u7684\u4F1A\u8BDD\u7EA7\u6BB5\uFF09\uFF1B\u5DE5\u5177\u76EE\u5F55\u4ECD\u6309\u6B64\u9884\u8BBE\u72EC\u7ACB\u88C5\u914D\u3002",
    runtimeContexts: "\u8FD0\u884C\u65F6\u4E0A\u4E0B\u6587\uFF08\u53EF\u663E\u9690\uFF1Bhost \u5E76\u5165\u7CFB\u7EDF\u63D0\u793A\u8BCD\u7684\u90E8\u5206\uFF09",
    loading: "\u52A0\u8F7D\u4E2D\u2026",
    tabsSections: "\u63D0\u793A\u8BCD",
    tabsTools: "\u5DE5\u5177",
    tabsPresets: "\u914D\u7F6E",
    refresh: "\u5237\u65B0",
    blockedOff: "\u672A\u5C4F\u853D",
    blockedOn: "\u5DF2\u5C4F\u853D",
    replaced: "\u5DF2\u66FF\u6362",
    manual: "\u624B\u52A8",
    system: "\u7CFB\u7EDF",
    replace: "\u7F16\u8F91",
    clearInput: "\u6E05\u7A7A",
    injectNew: "\u6CE8\u5165\u65B0\u6BB5",
    name: "\u540D\u79F0",
    text: "\u6587\u672C",
    add: "\u6DFB\u52A0",
    hiddenOff: "\u53EF\u89C1",
    hiddenOn: "\u5DF2\u9690\u85CF",
    empty: "\uFF08\u7A7A\uFF09",
    dynamic: "<\u52A8\u6001\u751F\u6210>",
    drag: "\u62D6\u52A8\u6392\u5E8F",
    moveUp: "\u4E0A\u79FB",
    moveDown: "\u4E0B\u79FB",
    previewHint: "\u4EE5\u4E0B\u4E3A\u5C4F\u853D/\u66FF\u6362/\u6CE8\u5165\u540E\u7684\u6700\u7EC8\u7CFB\u7EDF\u63D0\u793A\u8BCD\uFF1A",
    previewSections: "\u6BB5",
    previewToolCount: "\u4E2A\u5DE5\u5177",
    presetName: "\u914D\u7F6E\u540D\u79F0",
    backupTitle: "\u5B8C\u6574\u5907\u4EFD\uFF08\u5168\u90E8\u63D0\u793A\u8BCD / \u5DE5\u5177\uFF09",
    backupHint: "\u5168\u90E8\u9884\u8BBE\u5B9A\u5236\u5BFC\u51FA\uFF1A\u6240\u6709\u9884\u8BBE\u7684\u63D0\u793A\u8BCD\u3001\u5DE5\u5177\u3001\u73AF\u5883\u53D8\u91CF\u9ED1\u540D\u5355\u4E0E\u63D2\u4EF6\u8D26\u672C\uFF0C\u4E00\u4E2A JSON\u3002\u6062\u590D\u4F1A\u6574\u4F53\u8986\u76D6\u5F53\u524D\u6570\u636E\u3002",
    backupExport: "\u5BFC\u51FA\u5B8C\u6574\u5907\u4EFD",
    backupExportRunning: "\u5BFC\u51FA\u4E2D\u2026",
    backupRestore: "\u6062\u590D\u5907\u4EFD",
    backupRestoreRunning: "\u6062\u590D\u4E2D\u2026",
    backupOk: "\u5DF2\u5BFC\u51FA {name}",
    backupFail: "\u5BFC\u51FA\u5907\u4EFD\u5931\u8D25",
    presetIoTitle: "\u5F53\u524D\u9884\u8BBE\u5BFC\u5165 / \u5BFC\u51FA",
    presetIoHint: "\u53EA\u5904\u7406\u5F53\u524D\u9884\u8BBE\u7684\u5B9A\u5236\uFF08overrides\uFF09\uFF0C\u4E0D\u5305\u542B\u5BBF\u4E3B\u9884\u8BBE\u5B9A\u4E49\u3002",
    presetExport: "\u5BFC\u51FA\u5F53\u524D\u9884\u8BBE",
    presetImport: "\u5BFC\u5165\u5230\u5F53\u524D\u9884\u8BBE",
    presetIoOk: "\u5DF2\u5BFC\u51FA {name}",
    presetIoImported: "\u5DF2\u5BFC\u5165\u5F53\u524D\u9884\u8BBE\u5B9A\u5236",
    presetIoFail: "\u9884\u8BBE\u5BFC\u5165/\u5BFC\u51FA\u5931\u8D25",
    presetIoBadFormat: "\u4E0D\u662F\u6709\u6548\u7684\u9884\u8BBE\u5B9A\u5236\u6587\u4EF6",
    presetIoNoTarget: "\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A agent \u9884\u8BBE",
    presetIoConfirm: "\u5C06\u628A\u6587\u4EF6\u4E2D\u7684\u5B9A\u5236\u5BFC\u5165\u5230\u9884\u8BBE\u300C{target}\u300D\uFF0C\u8986\u76D6\u8BE5\u9884\u8BBE\u73B0\u6709\u5B9A\u5236\u3002\u7EE7\u7EED\uFF1F",
    cleanupEmpty: "\u6E05\u7406\u7A7A\u914D\u7F6E",
    cleanupRunning: "\u6E05\u7406\u4E2D\u2026",
    cleanupConfirm: "\u5220\u9664\u6240\u6709\u5B57\u6BB5\u90FD\u4E3A\u7A7A\u7684\u9884\u8BBE overrides\uFF1F\u4E0D\u4F1A\u5F71\u54CD\u6709\u5185\u5BB9\u7684\u914D\u7F6E\u3002",
    cleanupOk: "\u5DF2\u6E05\u7406 {n} \u4EFD\u7A7A\u914D\u7F6E",
    cleanupFail: "\u6E05\u7406\u7A7A\u914D\u7F6E\u5931\u8D25",
    restoreOk: "\u5DF2\u6062\u590D\u5907\u4EFD",
    restoreFail: "\u6062\u590D\u5907\u4EFD\u5931\u8D25",
    restoreBadFormat: "\u4E0D\u662F\u6709\u6548\u7684\u5907\u4EFD\u6587\u4EF6\uFF08\u683C\u5F0F\u4E0D\u5339\u914D\uFF09",
    restoreConfirm: "\u6062\u590D\u5907\u4EFD\u4F1A\u6574\u4F53\u8986\u76D6\u5F53\u524D\u5168\u90E8\u63D0\u793A\u8BCD / \u5DE5\u5177 / \u8D26\u672C\u6570\u636E\uFF0C\u786E\u5B9A\u7EE7\u7EED\uFF1F",
    save: "\u4FDD\u5B58",
    import: "\u5BFC\u5165",
    apply: "\u5E94\u7528",
    export: "\u5BFC\u51FA",
    delete: "\u5220\u9664",
    restore: "\u8FD8\u539F",
    active: "\u4F7F\u7528\u4E2D",
    preset: "\u9884\u8BBE",
    syncAllPhases: "\u4E09\u6001\u540C\u6B65",
    syncAllPhasesHint: "\u52FE\u9009\u540E\u4E09\u4E2A\u9636\u6BB5\u5171\u7528\u540C\u4E00\u4EFD\u6BB5\u5217\u8868\uFF08\u5E38\u9A7B\u671F\u4E3A\u9AA8\u67B6\uFF0C\u5176\u4F59\u4E24\u6001\u72EC\u6709\u7684\u6BB5\u8FFD\u52A0\u5728\u5C3E\u90E8\uFF0C\u540C\u540D\u6BB5\u4EE5\u539F\u751F\u90A3\u9636\u6BB5\u4E3A\u51C6\uFF09\uFF0C\u589E\u5220 / \u6392\u5E8F / \u52FE\u9009 / \u6587\u672C\u7F16\u8F91\u4E00\u6B21\u5199\u5168\u4E09\u4E2A\u9636\u6BB5\uFF1B\u52FE\u9009\u77AC\u95F4\u5373\u6309\u5E38\u9A7B\u671F\u8986\u5199\u53E6\u5916\u4E24\u6001\uFF08\u5199\u5165\u7F16\u8F91\u8349\u7A3F\uFF0C\u70B9\u300C\u4FDD\u5B58\u300D\u751F\u6548\uFF09\u3002\u5DE5\u5177\u680F\u7684\u9690\u85CF / \u663E\u793A\u4E0E\u52A0\u56DE\u540C\u6837\u5BF9\u4E09\u6001\u4E00\u8D77\u751F\u6548\u3002\u9ED8\u8BA4\u5173\u95ED\uFF1A\u4E09\u4E2A\u9636\u6BB5\u5404\u7BA1\u5404\u7684\u3002",
    syncApplied: "\u5DF2\u6309\u5E38\u9A7B\u671F\u8986\u5199\u53E6\u5916\u4E24\u6001\uFF1A\u4E09\u9636\u6BB5\u5171\u7528\u540C\u4E00\u4EFD\u6BB5\u5217\u8868\u4E0E\u6587\u672C\uFF08\u5199\u5165\u8349\u7A3F\uFF0C\u70B9\u300C\u4FDD\u5B58\u300D\u751F\u6548\uFF09\u3002",
    syncNotReady: "\u4E09\u9636\u6BB5\u88C5\u914D\u672A\u5C31\u7EEA\uFF08\u6216\u4E3A\u7A7A\uFF09\uFF0C\u65E0\u6CD5\u6267\u884C\u4E09\u6001\u540C\u6B65 \u2014\u2014 \u8BF7\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5\u3002",
    syncSkippedDynamic: "\u300C{names}\u300D\u662F\u8FD0\u884C\u65F6\u52A8\u6001\u6BB5\uFF0C\u65E0\u6CD5\u52A0\u5165\u5176\u5B83\u9636\u6BB5\uFF08\u5B83\u7684\u5185\u5BB9\u53EA\u6709\u88C5\u914D\u65F6\u624D\u77E5\u9053\uFF09\u3002",
    broken: "\u635F\u574F",
    brokenPreset: "\u8BE5 agent \u9884\u8BBE\u5F53\u524D\u65E0\u6CD5\u6302\u8F7D\uFF0C\u4ECD\u53EF\u7F16\u8F91\u5176\u5B9A\u5236\uFF08\u4FEE\u590D\u9884\u8BBE\u540E\u81EA\u52A8\u751F\u6548\uFF09\u3002",
    // agent 周期三阶段的展示命名（引导期 → 常驻期 → 压缩受控期）。
    phaseStageGuide: "\u5F15\u5BFC\u671F",
    phaseStageResident: "\u5E38\u9A7B\u671F",
    phaseStageControlled: "\u538B\u7F29\u53D7\u63A7\u671F",
    allToolsTitle: "\u672C\u7CFB\u7EDF\u5168\u90E8\u5DE5\u5177",
    allSectionsTitle: "\u672C\u7CFB\u7EDF\u5168\u90E8\u63D0\u793A\u8BCD",
    toolsFourHint: "\u4E09\u4E2A\u9636\u6BB5\u5404\u4E00\u4EFD\u540D\u5355\uFF0C\u4E92\u4E0D\u7EE7\u627F\uFF1A\u52FE\u9009 = \u8BE5\u9636\u6BB5\u662F\u5426\u5BF9\u6A21\u578B\u53EF\u89C1\uFF1B\u4ECE\u300C\u5168\u90E8\u300D\u62D6\u5165\u67D0\u9636\u6BB5 = \u8BA9\u8FD9\u4E00\u4E2A\u5DE5\u5177\u5728\u8BE5\u9636\u6BB5\u51FA\u73B0\uFF08\u82E5\u8BE5\u9636\u6BB5\u9ED8\u8BA4\u88C1\u6389\u4E86\u5B83\uFF0C\u5C31\u52A0\u56DE\u53BB\uFF09\uFF1B\u5728\u4E24\u4E2A\u9636\u6BB5\u4E4B\u95F4\u62D6\u52A8\uFF08\u62D6\u5230\u4E0A\u65B9\u9636\u6BB5\u6309\u94AE\uFF09= \u590D\u5236\uFF08\u6E90\u9636\u6BB5\u4E0D\u52A8\uFF0C\u76EE\u6807\u9636\u6BB5\u591A\u4E00\u4EFD\uFF0C\u9690\u85CF/\u542F\u7528\u72B6\u6001\u4E00\u8D77\u5E26\u8FC7\u53BB\uFF09\uFF1B\u62D6\u56DE\u300C\u5168\u90E8\u300D= \u4ECE\u8BE5\u9636\u6BB5\u62FF\u6389\u5B83\u3002\u6BCF\u4E2A\u52A8\u4F5C\u53EA\u5F71\u54CD\u88AB\u62D6\u7684\u90A3\u4E00\u4E2A\u5DE5\u5177\u3002",
    sectionsFourHint: "\u62D6\u62FD\u53CC\u5411\uFF1A\u628A\u300C\u5168\u90E8\u300D\u91CC\u7684\u6BB5\u62D6\u8FDB\u4E0A\u65B9\u5217\u8868 = \u52A0\u5165\u8BE5\u9636\u6BB5\u5E76\u9ED8\u8BA4\u5F00\u542F\uFF1B\u4ECE\u9636\u6BB5\u62D6\u56DE\u300C\u5168\u90E8\u300D= \u4ECE\u8BE5\u9636\u6BB5\u79FB\u9664\uFF08\u539F\u751F\u6BB5\u8F6C\u4E3A\u5C4F\u853D\uFF09\u3002\u540C\u4E00\u4E2A\u9636\u6BB5\u91CC\u62D6\u52A8\u884C\u6293\u624B = \u6392\u5E8F\uFF1B\u62D6\u5230\u4E0A\u65B9\u7684\u9636\u6BB5\u6309\u94AE = \u590D\u5236\u5230\u90A3\u4E2A\u9636\u6BB5\u3002\u5C4F\u853D\u6BB5\u4E0E\u666E\u901A\u6BB5\u5B8C\u5168\u4E00\u6837\u53EF\u62D6\u62FD / \u7F16\u8F91\uFF0C\u53EA\u662F\u4E0D\u6CE8\u5165\u6A21\u578B\u3002",
    dragHint: "\u62D6\u5165 = \u8BA9\u8BE5\u5DE5\u5177\u5728\u8FD9\u4E2A\u9636\u6BB5\u51FA\u73B0",
    toolAddedTag: "\u52A0\u56DE",
    toolAdded: "\u5DF2\u628A\u300C{name}\u300D\u52A0\u56DE{phase}\uFF1A\u8BE5\u9636\u6BB5\u9ED8\u8BA4\u88C1\u6389\u4E86\u5B83\uFF0C\u4FDD\u5B58\u540E\u5B83\u4F1A\u91CD\u65B0\u51FA\u73B0\u5728\u8BE5\u9636\u6BB5\uFF08\u5F53\u524D\u9884\u8BBE\u6CE8\u518C\u8868\u91CC\u6709\u5B83\uFF09\u3002",
    toolNotInRegistry: "\u300C{name}\u300D\u4E0D\u5728\u672C\u9884\u8BBE\u7684\u6CE8\u518C\u8868\u91CC\uFF08\u5B83\u662F\u522B\u7684\u9884\u8BBE\u72EC\u6709\u7684\u5DE5\u5177\uFF09\uFF0C\u5F53\u524D\u9884\u8BBE\u6CA1\u6709\u5B83\u7684\u5B9A\u4E49\uFF0C\u52A0\u4E0D\u8FDB\u6765\u3002",
    toolCopied: "\u5DF2\u628A\u300C{name}\u300D\u590D\u5236\u5230{to}\uFF1A{from}\u90A3\u4EFD\u4FDD\u6301\u4E0D\u52A8\uFF0C\u9690\u85CF/\u542F\u7528\u72B6\u6001\u4E00\u8D77\u5E26\u8FC7\u53BB\u3002",
    toolRemovedFromPhase: "\u5DF2\u628A\u300C{name}\u300D\u4ECE{from}\u62FF\u6389\uFF1A\u5DF2\u52A0\u56DE\u7684\u64A4\u9500\u52A0\u56DE\uFF0C\u539F\u751F\u5DE5\u5177\u5219\u5728\u8BE5\u9636\u6BB5\u9690\u85CF\uFF08\u4ECD\u53EF\u5728\u8FD9\u91CC\u53CD\u9009\u56DE\u6765\uFF09\u3002",
    sectionCopied: "\u5DF2\u628A\u300C{name}\u300D\u590D\u5236\u5230{to}\uFF08\u6E90{from}\u4FDD\u6301\u4E0D\u52A8\uFF09\uFF1A\u65B0\u9636\u6BB5\u91CC\u5B83\u662F\u5F00\u542F\u7684\uFF0C\u53EF\u7EE7\u7EED\u7F16\u8F91\u6587\u672C\u6216\u62D6\u52A8\u6392\u5E8F\u3002",
    sectionRemoved: "\u5DF2\u628A\u300C{name}\u300D\u4ECE{from}\u62FF\u6389\uFF1A\u65B0\u52A0\u5165\u7684\u64A4\u9500\u52A0\u5165\uFF0C\u539F\u751F\u6BB5\u5219\u8F6C\u4E3A\u5C4F\u853D\uFF08\u53EF\u52FE\u9009\u56DE\u6765\uFF09\u3002",
    toolShown: "\u300C{name}\u300D\u5DF2\u5728{to}\u663E\u793A\u3002",
    toolSyncShown: "\u300C{name}\u300D\u5DF2\u5728\u4E09\u4E2A\u9636\u6BB5\u663E\u793A\uFF08\u8BE5\u9636\u6BB5\u76EE\u5F55\u91CC\u6CA1\u6709\u7684\u5DF2\u5199\u8FDB\u5404\u81EA\u7684\u52A0\u56DE\u540D\u5355\uFF09\u3002",
    sectionsTakenOver: "\u300C{name}\u300D\u6BB5\u58F0\u660E\u4E86 complete \u6574\u6BB5\u63A5\u7BA1\uFF08\u5BBF\u4E3B\u5728\u88C5\u914D\u7011\u5E03\u6D41\u4E4B\u540E\u5F3A\u5236\u8FD8\u539F\u4E3A\u90A3\u4E00\u6761\u6BB5\uFF09\u3002\u672C\u63D2\u4EF6\u9ED8\u8BA4\u7684 forceSections \u5DF2\u7ED5\u5F00\u8BE5\u673A\u5236\uFF0C\u6BB5\u7EA7\u5C4F\u853D / \u66FF\u6362 / \u6CE8\u5165 / \u6392\u5E8F\u7167\u5E38\u751F\u6548\uFF1B\u6B64\u63D0\u793A\u53EA\u4F1A\u5728 forceSections \u5173\u95ED\u6216\u5F3A\u5236\u8986\u76D6\u5931\u6548\u65F6\u51FA\u73B0\uFF0C\u5F00\u542F forceSections \u5373\u53EF\u6062\u590D\u3002",
    sectionsLost: "\u672C\u63D2\u4EF6\u5728\u8BE5\u9636\u6BB5\u4EA7\u51FA\u7684 {emitted} \u4E2A\u6BB5\u91CC\uFF0C\u53EA\u6709 {survived} \u4E2A\u8FDB\u5165\u6700\u7EC8\u63D0\u793A\u8BCD\uFF1A\u5176\u4F59\u88AB\u4E0B\u6E38\u88C5\u914D\u89C4\u5219\u4E22\u5F03\uFF0C\u6BB5\u7EA7\u5B9A\u5236\u4E0D\u4F1A\u5B8C\u5168\u751F\u6548\uFF08\u5DE5\u5177\u8FC7\u6EE4\u4E0D\u53D7\u5F71\u54CD\uFF09\u3002",
    sectionDynamicNoAdd: "\u300C{name}\u300D\u662F\u8FD0\u884C\u65F6\u624D\u751F\u6210\u7684\u52A8\u6001\u6BB5\uFF0C\u6CA1\u6CD5\u9884\u5148\u52A0\u8FDB\u67D0\u4E2A\u9636\u6BB5\uFF08\u5B83\u7684\u5185\u5BB9\u53EA\u6709\u88C5\u914D\u65F6\u624D\u77E5\u9053\uFF09\u3002",
    exportOk: "\u5BFC\u51FA\u6210\u529F",
    exportCancel: "\u5DF2\u53D6\u6D88\u5BFC\u51FA",
    exportFail: "\u5BFC\u51FA\u5931\u8D25",
    importOk: "\u5BFC\u5165\u5B8C\u6210",
    importNone: "\u6CA1\u6709\u65B0\u589E\u9884\u8BBE\uFF08\u540C\u540D\u5DF2\u5B58\u5728\u6216\u6587\u4EF6\u4E3A\u7A7A\uFF09",
    importCancel: "\u5DF2\u53D6\u6D88\u5BFC\u5165",
    importFail: "\u5BFC\u5165\u5931\u8D25",
    saveOk: "\u5DF2\u4FDD\u5B58",
    saveFail: "\u4FDD\u5B58\u5931\u8D25",
    discardConfirm: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF0C\u79BB\u5F00\u5C06\u4E22\u5F03\u3002\u786E\u5B9A\u79BB\u5F00\u5417\uFF1F",
    forceTitle: "\u5F3A\u5236\u8986\u76D6\uFF08forceSections\uFF09",
    forceHint: "\u5F00\u542F\u540E\uFF0C\u4EC5\u5F53\u5F53\u524D\u9636\u6BB5\u5B58\u5728\u5B9E\u9645\u6BB5\u7B56\u7565\uFF08\u5C4F\u853D / \u66FF\u6362 / \u6CE8\u5165 / \u6392\u5E8F\uFF09\u65F6\uFF0C\u6700\u7EC8\u63D0\u793A\u8BCD\u6BB5\u4EE5\u672C\u63D2\u4EF6\u4E3A\u51C6\uFF08\u53EF\u7ED5\u8FC7 complete \u6574\u6BB5\u63A5\u7BA1\u4E0E\u9884\u8BBE\u9636\u6BB5\u88C1\u6BB5\uFF09\uFF1B\u6CA1\u6709\u6BB5\u5B9A\u5236\u65F6\u4FDD\u6301\u5BBF\u4E3B\u539F\u6837\u3002\u300C\u6062\u590D\u521D\u59CB\u72B6\u6001\u300D\u4F1A\u81EA\u52A8\u5173\u95ED\u5B83\u3002",
    forceOn: "\u5DF2\u5F00\u542F",
    forceOff: "\u5DF2\u5173\u95ED",
    envBlockTitle: "\u73AF\u5883\u53D8\u91CF\u9ED1\u540D\u5355\uFF08envBlocklist\uFF09",
    envBlockHint: "\u7CFB\u7EDF\u73AF\u5883\u53D8\u91CF\uFF08process.env\uFF09\u5DF2\u5168\u91CF\u6CE8\u518C\u4E3A\u63D0\u793A\u8BCD\u53D8\u91CF\uFF1A\u6BB5\u6587\u672C\u91CC\u5199 {{env_\u952E\u540D\u5C0F\u5199}} \u5F15\u7528\uFF08\u5982 {{env_path}}\uFF09\uFF1B\u547D\u4E2D\u9ED1\u540D\u5355\u7684\u952E\u4E0D\u6CE8\u518C\u2014\u2014env \u91CC\u5E38\u6709\u5BC6\u94A5\uFF0C\u8FDB\u4E86\u63D0\u793A\u8BCD\u5C31\u4F1A\u968F\u8BF7\u6C42\u53D1\u7ED9\u6A21\u578B\u3002\u6761\u76EE\u652F\u6301 * \u901A\u914D\u3001\u5927\u5C0F\u5199\u4E0D\u654F\u611F\u3002\u5185\u7F6E\u53D8\u91CF {{date}} {{time}} {{datetime}} {{weekday}} {{hostname}} {{platform}} {{arch}} {{username}} {{home}} {{shell}} {{locale}} {{node_version}} \u6052\u53EF\u7528\u3002",
    envBlockAdd: "\u952E\u540D\u6216\u901A\u914D\uFF0C\u5982 GITHUB_TOKEN \u6216 *_KEY*",
    envBlockAddAction: "\u6DFB\u52A0",
    envBlockEmpty: "\u9ED1\u540D\u5355\u4E3A\u7A7A\uFF1A\u6240\u6709\u73AF\u5883\u53D8\u91CF\u90FD\u4F1A\u88AB\u6CE8\u518C",
    envVarsTitle: "\u5DF2\u6CE8\u518C\u7684\u63D0\u793A\u8BCD\u53D8\u91CF",
    envVarsHint: "\u6BB5\u6587\u672C\u91CC\u5F15\u7528 {{\u53D8\u91CF\u540D}}\uFF1B\u5F15\u7528\u672A\u6CE8\u518C\u7684\u540D\u5B57\u4F1A\u8BA9\u6574\u6B21\u6E32\u67D3\u62A5\u9519\uFF08\u5BBF\u4E3B\u4E25\u683C\u6A21\u5F0F\uFF09\u3002",
    importBlockMerge: "\uFF0C\u6587\u4EF6\u4E2D\u7684\u73AF\u5883\u53D8\u91CF\u9ED1\u540D\u5355\u5DF2\u5E76\u5165\uFF08+{count} \u6761\uFF09",
    resetTitle: "\u6062\u590D\u521D\u59CB\u72B6\u6001",
    resetHint: "\u6E05\u7A7A\u5168\u90E8\u5B9A\u5236\uFF08\u5C4F\u853D / \u66FF\u6362 / \u6CE8\u5165 / \u6392\u5E8F\u3001\u9636\u6BB5\u5DE5\u5177\u76EE\u5F55\u3001\u914D\u7F6E\u5FEB\u7167\u3001agent \u9884\u8BBE\u8986\u76D6\uFF09\uFF0C\u5E76\u5173\u95ED forceSections \u2014\u2014 \u4E4B\u540E\u6240\u6709 AI \u5BF9\u8BDD\u4E0D\u518D\u53D7\u672C\u63D2\u4EF6\u5F71\u54CD\uFF0C\u4E0E\u5378\u8F7D\u63D2\u4EF6\u7B49\u6548\uFF0C\u65E0\u9700\u5378\u8F7D\u6216\u91CD\u542F\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\uFF1B\u8981\u91CD\u65B0\u542F\u7528\u5B9A\u5236\uFF0C\u5728\u4E0A\u65B9\u6253\u5F00\u300C\u5F3A\u5236\u8986\u76D6\u300D\u5F00\u5173\u5373\u53EF\u3002",
    resetConfirm: "\u786E\u5B9A\u6E05\u7A7A\u5168\u90E8\u5B9A\u5236\u5E76\u6062\u590D\u521D\u59CB\u72B6\u6001\u5417\uFF1F\n\n\u5C06\u5220\u9664\uFF1A\u5C4F\u853D\u540D\u5355\u3001\u6BB5\u66FF\u6362\u3001\u6CE8\u5165\u6BB5\u3001\u9636\u6BB5\u5DE5\u5177\u76EE\u5F55\u3001\u914D\u7F6E\u5FEB\u7167\u3001agent \u9884\u8BBE\u8986\u76D6\uFF1B\u5E76\u5173\u95ED forceSections\u3002\n\u4E4B\u540E\u6240\u6709 AI \u5BF9\u8BDD\u90FD\u4E0D\u518D\u53D7\u672C\u63D2\u4EF6\u5F71\u54CD\uFF08\u4E0E\u5378\u8F7D\u63D2\u4EF6\u7B49\u6548\uFF09\u3002\n\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002",
    resetAction: "\u6E05\u7A7A\u5168\u90E8\u5B9A\u5236",
    resetOk: "\u5DF2\u6062\u590D\u521D\u59CB\u72B6\u6001\uFF1A\u6240\u6709 AI \u5BF9\u8BDD\u4E0D\u518D\u53D7\u672C\u63D2\u4EF6\u5F71\u54CD",
    resetFail: "\u6062\u590D\u521D\u59CB\u72B6\u6001\u5931\u8D25",
    scopeFallback: "\u8BE5 agent \u9884\u8BBE\u7684\u5E38\u9A7B scope \u672A\u80FD\u6302\u8F7D\uFF0C\u4EE5\u4E0B\u663E\u793A\u7684\u662F\u5168\u5C40\u5C42\u5185\u5BB9\uFF08\u5E76\u975E\u8BE5\u9884\u8BBE\u7684\u539F\u751F\u6BB5\u4E0E\u5DE5\u5177\uFF09\u3002",
    previewFail: "\u8BE5\u9636\u6BB5\u88C5\u914D\u5931\u8D25\uFF08scope \u6302\u8F7D\u5931\u8D25\u6216\u9884\u8BBE\u63D2\u4EF6\u5F02\u5E38\uFF09\uFF0C\u8BF7\u5207\u6362\u76EE\u6807\u6216\u67E5\u770B\u670D\u52A1\u65E5\u5FD7\u3002",
    previewToolsHint: "\u6A21\u578B\u5B9E\u9645\u53EF\u89C1\u7684\u5DE5\u5177\u76EE\u5F55\uFF08\u6309\u6240\u9009\u9636\u6BB5\u8FD0\u884C\u9884\u8BBE\u7684\u5168\u90E8\u88C5\u914D\u89C4\u5219\uFF0C\u542B\u539F\u751F\u9636\u6BB5\u88C1\u526A\uFF09\uFF1A",
    previewToolsCount: "\u6CE8\u518C\u8868",
    toolAgentScoped: "\u4F1A\u8BDD\u7EA7",
    toolAgentScopedHint: "\u8BE5\u5DE5\u5177\u7531\u63D2\u4EF6\u5728 agent \u81EA\u5DF1\u7684\u4F5C\u7528\u57DF\u6CE8\u518C\uFF08\u4E0D\u662F\u9884\u8BBE\u6CE8\u518C\u8868\u9879\uFF09\uFF1Brestrict \u7BA1\u4E0D\u5230\u4F5C\u7528\u57DF\u5185\u540D\u5B57\uFF0C\u672C\u63D2\u4EF6\u9760\u88C5\u914D\u540E\u8FC7\u6EE4 tools \u5B9E\u73B0\u6309\u9636\u6BB5\u9690\u85CF\uFF0C\u53EF\u5728\u4E0A\u9762\u7684\u542F\u7528\u5217\u8868\u52FE\u9009\u3002\u7EE7\u627F\u5C42\u6CA1\u6709\u540C\u540D\u539F\u5B9A\u4E49\u65F6\u5B83\u4E0D\u662F\u300C\u906E\u853D\u300D\uFF0C\u53EA\u8BFB\u6C60\u6309\u300C\u4F1A\u8BDD\u7EA7\u300D\u5982\u5B9E\u5217\u51FA\u3002",
    toolDescriptionLabel: "\u5DE5\u5177\u63CF\u8FF0\uFF08\u53EA\u8BFB\uFF09",
    toolPromptSections: "\u63D0\u793A\u8BCD\u6BB5",
    toolPromptNone: "\u65E0\u63D0\u793A\u8BCD\u6BB5",
    toolPromptHint: "\u5DE5\u5177\u7684\u7CFB\u7EDF\u63D0\u793A\u8BCD\u6BB5\uFF08\u7B2C\u4E00\u90E8\u5206\uFF09\uFF1B\u5DE5\u5177\u663E\u9690\u5728\u5DE5\u5177\u9875\u5355\u72EC\u63A7\u5236\uFF0Cdescription / JSON Schema \u4E0D\u5728\u8FD9\u91CC\u7F16\u8F91\u3002",
    toolPromptBadge: "\u5DE5\u5177\u63D0\u793A\u8BCD",
    toolPromptToolsLabel: "\u5173\u8054\u5DE5\u5177",
    toolPromptToolsHint: "\u8FD9\u4E2A\u63D0\u793A\u8BCD\u6BB5\u670D\u52A1\u7684\u5DE5\u5177\uFF1A{tools}",
    toolExecutorScoped: "\u6267\u884C\u5668\u5305\u88C5",
    toolExecutorScopedHint: "\u8BE5\u5DE5\u5177\u662F\u6267\u884C\u5668\u63D0\u4F9B\u7ED9\u6A21\u578B\u7684\u5305\u88C5\u9879\uFF08\u5982 PTC \u7684 run_code\uFF09\uFF0C\u4E0D\u662F\u666E\u901A\u6CE8\u518C\u8868\u5DE5\u5177\uFF1B\u4E0D\u80FD\u6309\u9636\u6BB5\u52FE\u9009\u3002",
    toolMaskedByPlugin: "\u63D2\u4EF6\u906E\u853D",
    toolMaskedByPluginHint: "\u8BE5\u5DE5\u5177\u5728\u9884\u8BBE\u6CE8\u518C\u8868\u91CC\u6709\uFF0C\u4F46\u88AB\u5176\u5B83\u63D2\u4EF6\u5728 agent \u4F5C\u7528\u57DF restrict \u6389\u4E86\uFF1B\u672C\u63D2\u4EF6\u65E0\u6CD5\u53CD\u5411\u89E3\u9664\u3002",
    toolMaskedByShadow: "\u540C\u540D\u88AB\u8986\u76D6",
    toolMaskedByShadowHint: "\u8BE5\u5DE5\u5177\u662F\u7EE7\u627F\u5C42\uFF08global / preset\uFF09\u7684\u539F\u751F\u5DE5\u5177\uFF0C\u88AB\u63D2\u4EF6\u5728 agent \u4F5C\u7528\u57DF\u6CE8\u518C\u7684\u540C\u540D\u5DE5\u5177\u9876\u6389\uFF1B\u672C\u63D2\u4EF6\u65E0\u6CD5\u53CD\u5411\u89E3\u9664\uFF0C\u6A21\u578B\u53EA\u4F1A\u770B\u5230\u63D2\u4EF6\u90A3\u4E00\u4E2A\u3002",
    toolMaskedByOwnPlugin: "\u672C\u63D2\u4EF6\u906E\u853D",
    toolMaskedByOwnPluginHint: "\u8BE5\u5DE5\u5177\u88AB\u672C\u63D2\u4EF6\u7684 MCP \u5DE5\u5177\u7EA7\u7981\u7528 / \u9884\u8BBE\u906E\u853D / \u5DE5\u4F5C\u533A\u5173\u95ED\u9690\u85CF\uFF0C\u53EF\u5728 MCP Tab \u6062\u590D\u3002",
    // 2.2.0：主列表「本插件遮蔽」徽标、只读池双组（可反选 / 不可反选）、层徽标与顶部横幅。
    toolOwnHidden: "\u672C\u63D2\u4EF6\u906E\u853D",
    toolOwnHiddenHint: "\u8BE5\u884C\u88AB\u672C\u9636\u6BB5\u7684\u5DE5\u5177\u540D\u5355\u9690\u85CF\uFF08\u672C\u63D2\u4EF6\u53EF\u53CD\u9009\uFF1A\u52FE\u9009\u5373\u53EF\u6062\u590D\u53EF\u89C1\uFF09\u3002",
    toolMaskedByExternal: "\u5916\u90E8\u4E0D\u53EF\u89C1",
    toolMaskedByExternalHint: "\u8BE5\u5DE5\u5177\u5728\u9884\u8BBE\u6CE8\u518C\u8868\u91CC\u6709\uFF0C\u4F46\u88AB\u5176\u5B83\u63D2\u4EF6\u5728 agent \u4F5C\u7528\u57DF restrict \u6389\u4E86\uFF1A\u5916\u90E8\u51B3\u5B9A\uFF0C\u672C\u63D2\u4EF6\u4E0D\u53EF\u53CD\u9009\u3002",
    toolMaskedByPtc: "PTC \u6298\u53E0",
    toolMaskedByPtcHint: "PTC \u6298\u53E0\u751F\u6548\u65F6\u6A21\u578B\u53EA\u6536\u5230 run_code\uFF0C\u8BE5\u5DE5\u5177\u5728\u7A0B\u5E8F\u7ED1\u5B9A\u5185\u53EF\u7528\uFF1A\u5916\u90E8\u51B3\u5B9A\uFF0C\u672C\u63D2\u4EF6\u4E0D\u53EF\u53CD\u9009\u3002",
    poolReversible: "\u53EF\u53CD\u9009\uFF08\u672C\u63D2\u4EF6\u906E\u853D\uFF09",
    poolIrreversible: "\u4E0D\u53EF\u53CD\u9009\uFF08\u5916\u90E8\u51B3\u5B9A\uFF09",
    layerGlobal: "\u5168\u5C40",
    layerPreset: "\u9884\u8BBE",
    layerAgent: "\u4F1A\u8BDD",
    noSessionBanner: "\u672A\u94FE\u63A5\u4F1A\u8BDD\uFF1A\u5F53\u524D\u6CA1\u6709\u540C\u9884\u8BBE\u7684\u6D3B\u52A8\u4F1A\u8BDD\uFF0C\u5916\u90E8\u53EF\u89C1\u6027\u672A\u77E5\u3002",
    ptcCollapsedBanner: "PTC \u6A21\u5F0F\uFF1A\u6A21\u578B\u53EA\u6536\u5230 run_code\uFF0C\u5176\u4F59\u5DE5\u5177\u5728\u7A0B\u5E8F\u7ED1\u5B9A\u5185\u53EF\u7528\uFF1B\u672C\u63D2\u4EF6\u4ECD\u53EF\u52FE\u9009\u63A7\u5236\uFF08\u5168\u5C40/\u7EE7\u627F\u5C42\u5DE5\u5177\u771F\u4ECE SDK \u79FB\u9664\uFF0Cagent/\u9884\u8BBE\u81EA\u5E26\u5DE5\u5177\u4EC5\u8FD0\u884C\u65F6\u62E6\u622A\uFF09\u3002",
    completeCatalogTitle: "\u5B8C\u6574\u76EE\u5F55 / \u5DF2\u906E\u853D\uFF08\u53EA\u8BFB\uFF09",
    completeCatalogHint: "\u53EA\u8BFB\u6C60\uFF1A\u53EF\u53CD\u9009\u7EC4\u5217\u672C\u63D2\u4EF6\u906E\u853D\u7684\u5DE5\u5177\uFF08\u53EF\u5728 MCP Tab \u6062\u590D\uFF09\uFF1B\u4E0D\u53EF\u53CD\u9009\u7EC4\u5217\u5916\u90E8\u51B3\u5B9A\u7684\u5DE5\u5177\uFF08\u5916\u90E8\u4E0D\u53EF\u89C1 / \u540C\u540D\u88AB\u8986\u76D6 / PTC \u6298\u53E0\uFF09\u3002\u4E24\u7EC4\u90FD\u4E0D\u53C2\u4E0E\u4E0A\u9762\u7684\u9636\u6BB5\u52FE\u9009\u3002",
    workspaceRequired: "\u5DE5\u4F5C\u533A\u7EA7\u4FDD\u5B58\u9700\u8981\u5F53\u524D\u5DE5\u4F5C\u533A\uFF08\u6D3B\u52A8\u4F1A\u8BDD\u7684 cwd\uFF09",
    workspaceNoSession: "\u5DE5\u4F5C\u533A\u7EA7\uFF1A\u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4F1A\u8BDD\uFF0C\u53D6\u4E0D\u5230\u5DE5\u4F5C\u533A\u8DEF\u5F84\uFF1B\u5F00\u4F1A\u8BDD\u540E\u518D\u7F16\u8F91\u5DE5\u4F5C\u533A\u7EA7\u3002",
    // 独立面板（侧边栏入口 + 抽屉分栏）新增。
    close: "\u5173\u95ED",
    filterAll: "\u5168\u90E8",
    filterOn: "\u5DF2\u542F\u7528",
    filterOff: "\u5DF2\u505C\u7528",
    targetLabel: "\u7F16\u8F91\u76EE\u6807\uFF08Agent \u9884\u8BBE\uFF09",
    targetCustomized: "\u8BE5\u9884\u8BBE {n} \u9879\u5B9A\u5236",
    agentScoped: "\u4F1A\u8BDD\u7EA7",
    agentScopedHint: "\u8FD9\u4E00\u6BB5\u7531\u63D2\u4EF6\u5728\u5F53\u524D\u6D3B\u52A8 agent \u81EA\u5DF1\u7684\u4F5C\u7528\u57DF\u91CC\u6CE8\u518C\uFF08\u4E0D\u662F\u672C\u9884\u8BBE scope \u7684\u6CE8\u518C\u8868\u9879\uFF09\uFF1A\u9762\u677F\u7528\u540C\u9884\u8BBE\u6D3B\u52A8 agent \u7684\u771F\u5B9E\u88C5\u914D\u679A\u4E3E\u5230\u5B83\uFF0C\u5E76\u5728\u53F3\u680F\u9884\u89C8\u91CC\u663E\u793A\u5B83\u3002\u5B83\u9ED8\u8BA4\u5C31\u5728\u7CFB\u7EDF\u63D0\u793A\u8BCD\u91CC\uFF0C\u8EAB\u4EFD\u6309 agent \u6765\u6E90\u8DE8\u4F1A\u8BDD\u7A33\u5B9A\uFF0C\u6240\u4EE5\u53EF\u4EE5\u50CF\u666E\u901A\u6BB5\u4E00\u6837\u5C4F\u853D / \u66FF\u6362 / \u6392\u5E8F\u3002",
    libraryTitle: "\u914D\u7F6E\u5FEB\u7167\u5E93",
    applyToPreset: "\u5E94\u7528\u5C06\u5199\u5165\uFF1A\u9884\u8BBE\u7EA7\u300C{name}\u300D",
    applyToWorkspace: "\u5E94\u7528\u5C06\u5199\u5165\uFF1A\u5DE5\u4F5C\u533A\u7EA7\u300C{name}\u300D",
    draftBadge: "\u9884\u89C8\u542B\u672A\u4FDD\u5B58\u8349\u7A3F",
    previewSyncFail: "\u5B9E\u65F6\u9884\u89C8\u540C\u6B65\u5931\u8D25\uFF08\u4E0B\u6B21\u7F16\u8F91\u4F1A\u81EA\u52A8\u91CD\u8BD5\uFF0C\u6216\u70B9\u300C\u5237\u65B0\u300D\uFF09",
    sectionDynamicUnsupported: "\u5BBF\u4E3B\u6CA1\u6709\u4E3A\u8BE5\u6BB5\u63D0\u4F9B dynamic \u6807\u8BB0\uFF0C\u65E0\u6CD5\u5224\u65AD\u5B83\u662F\u4E0D\u662F\u8FD0\u884C\u65F6\u52A8\u6001\u6BB5 \u2014\u2014 \u5DF2\u7981\u7528\u52A0\u5165\uFF08\u4E0D\u731C\u6D4B\uFF09\u3002",
    contextsUnsupported: "\u5BBF\u4E3B\u6CA1\u6709\u63D0\u4F9B\u8BE5\u9636\u6BB5\u7684\u8FD0\u884C\u65F6\u4E0A\u4E0B\u6587\u6E05\u5355\uFF08baseContexts\uFF09\uFF0C\u65E0\u6CD5\u5728\u8FD9\u91CC\u663E\u9690\uFF1B\u4E0D\u4F2A\u9020\u72B6\u6001\u3002",
    contextsNotReady: "\u4E09\u9636\u6BB5\u88C5\u914D\u5C1A\u672A\u5C31\u7EEA\uFF0C\u65E0\u6CD5\u6267\u884C\u4E0A\u4E0B\u6587\u7684\u4E09\u6001\u540C\u6B65 \u2014\u2014 \u8BF7\u70B9\u300C\u5237\u65B0\u300D\u540E\u91CD\u8BD5\u3002",
    sourceGlobal: "\u5168\u5C40",
    sourcePreset: "\u9884\u8BBE",
    sourceAgent: "\u4F1A\u8BDD",
    sourceExecutor: "\u6267\u884C\u5668",
    sourceWorkspace: "\u5DE5\u4F5C\u533A",
    sourceUnknown: "\u6765\u6E90\u672A\u77E5"
  },
  en: {
    nav: "Prompt Customizer",
    previewPreset: "Source: selected mode preset. With a same-preset active session, the prompt inventory and preview show that session's real assembly (including plugin-injected session-level sections); the tool catalog stays on the pure preset assembly.",
    runtimeContexts: "Runtime contexts (toggleable; the part the host folds into the system prompt)",
    loading: "Loading\u2026",
    tabsSections: "Sections",
    tabsTools: "Tools",
    tabsPresets: "Presets",
    refresh: "Refresh",
    blockedOff: "Active",
    blockedOn: "Blocked",
    replaced: "Replaced",
    manual: "Manual",
    system: "System",
    replace: "Replace",
    clearInput: "Clear",
    injectNew: "Inject section",
    name: "Name",
    text: "Text",
    add: "Add",
    hiddenOff: "Visible",
    hiddenOn: "Hidden",
    empty: "(empty)",
    dynamic: "<dynamic>",
    drag: "Drag to reorder",
    moveUp: "Move up",
    moveDown: "Move down",
    previewHint: "Final system prompt after block/replace/inject:",
    previewSections: "sections",
    previewToolCount: "tools",
    presetName: "Config name",
    backupTitle: "Full backup (all prompts / tools)",
    backupHint: "All preset customizations: prompts, tools, env blocklist and plugin ledgers in one JSON. Restore overwrites current data.",
    backupExport: "Export full backup",
    backupExportRunning: "Exporting\u2026",
    backupRestore: "Restore backup",
    backupRestoreRunning: "Restoring\u2026",
    backupOk: "Exported {name}",
    backupFail: "Backup export failed",
    presetIoTitle: "Current preset import / export",
    presetIoHint: "Only the current preset customization (overrides); host preset definitions are not included.",
    presetExport: "Export current preset",
    presetImport: "Import into current preset",
    presetIoOk: "Exported {name}",
    presetIoImported: "Imported current preset customization",
    presetIoFail: "Preset import/export failed",
    presetIoBadFormat: "Not a valid preset customization file",
    presetIoNoTarget: "Select an agent preset first",
    presetIoConfirm: 'Import the customization into preset "{target}" and overwrite its current customization?',
    cleanupEmpty: "Clean empty overrides",
    cleanupRunning: "Cleaning\u2026",
    cleanupConfirm: "Delete all preset overrides whose fields are empty? Non-empty configurations are untouched.",
    cleanupOk: "Removed {n} empty configurations",
    cleanupFail: "Cleaning empty overrides failed",
    restoreOk: "Backup restored",
    restoreFail: "Restore failed",
    restoreBadFormat: "Not a valid backup file (format mismatch)",
    restoreConfirm: "Restoring will overwrite ALL current prompt / tool / ledger data. Continue?",
    save: "Save",
    import: "Import",
    apply: "Apply",
    export: "Export",
    delete: "Delete",
    restore: "Restore",
    active: "Active",
    preset: "Preset",
    syncAllPhases: "Sync phases",
    syncAllPhasesHint: "When checked, the three phases share one section list (the resident period is the backbone; sections only the other two phases have are appended at the end, and a same-named row follows the phase where it natively exists), and add / remove / reorder / check / text edits are written to all three phases at once. Ticking the box immediately overwrites the other two phases with the resident-period content (written to the edit draft; press Save to apply). Tool hiding / showing and adding back also apply to all three phases. Unchecked (default): handle each phase separately.",
    syncApplied: "The other two phases were overwritten from the resident period: all three phases now share one section list and text (written to the draft; press Save to apply).",
    syncNotReady: "The three phase assemblies are not ready (or are empty); cannot sync phases \u2014 press Refresh and retry.",
    syncSkippedDynamic: '"{names}" is a runtime-generated dynamic section and cannot be added to the other phases (its content is only known during assembly).',
    broken: "broken",
    brokenPreset: "This agent preset cannot mount right now; its customization is still editable and applies once fixed.",
    // agent 周期三阶段的展示命名（引导期 → 常驻期 → 压缩受控期）。
    phaseStageGuide: "Guide period",
    phaseStageResident: "Resident period",
    phaseStageControlled: "Compaction-controlled period",
    allToolsTitle: "All system tools",
    allSectionsTitle: "All system sections",
    toolsFourHint: 'Each of the three periods keeps its own list, with no inheritance: the checkbox = visible to the model in that period; dragging a tool from "All" into a period makes it appear there (if the period trims it by default, it is added back); dragging between two periods copies it (the source is untouched, the target gains one, and the hidden/enabled state carries over); dragging it back to "All" removes it from that period. Every action touches only the tool you dragged.',
    sectionsFourHint: 'Drag both ways: drop a section from "All" onto a period part to enable it there; drag from a part back to "All" to remove it from that period. Blocked sections stay fully operable \u2014 they are just not injected.',
    dragHint: "Drag in to make this tool appear in this period",
    toolAddedTag: "added",
    toolAdded: 'Added "{name}" back to {phase}: the period trims it by default, so it will reappear there once saved (it exists in this preset\u2019s registry).',
    toolNotInRegistry: '"{name}" is not in this preset\u2019s registry (it belongs to another preset). There is no definition for it here, so it cannot be added.',
    toolCopied: 'Copied "{name}" to {to}: the copy in {from} is left untouched, and its hidden/enabled state carries over.',
    toolRemovedFromPhase: 'Removed "{name}" from {from}: an add-back is reverted, a native tool is hidden in that period (still selectable back here).',
    sectionCopied: 'Copied "{name}" to {to} (the source {from} is untouched): it is enabled there and can be edited or dragged to reorder.',
    sectionRemoved: 'Removed "{name}" from {from}: an added-in section is reverted, a native section becomes blocked (tick it to restore).',
    toolShown: '"{name}" is now visible in {to}.',
    toolSyncShown: '"{name}" is now visible in all three phases (periods without it in their catalog got it added back).',
    sectionsTakenOver: 'The "{name}" section declares a complete takeover (the host restores that single section after the assembly waterfall). This plugin\u2019s forceSections (default on) bypasses that mechanism, so section-level blocking / replacement / injection / ordering still applies; this notice only appears when forceSections is off or the override fails \u2014 enable it to restore.',
    sectionsLost: "Only {survived} of the {emitted} sections this plugin emitted for this phase reach the final prompt \u2014 the rest are dropped by downstream assembly rules, so section-level customization cannot fully apply (tool filtering is unaffected).",
    sectionDynamicNoAdd: '"{name}" is generated at runtime \u2014 it cannot be added to a phase ahead of time (its content is only known during assembly).',
    exportOk: "Exported",
    exportCancel: "Export cancelled",
    exportFail: "Export failed",
    importOk: "Import complete",
    importNone: "Nothing imported (duplicate names or empty file)",
    importCancel: "Import cancelled",
    importFail: "Import failed",
    saveOk: "Saved",
    saveFail: "Save failed",
    discardConfirm: "You have unsaved changes; leaving will discard them. Leave anyway?",
    forceTitle: "Force override (forceSections)",
    forceHint: 'When on, final prompt sections follow this plugin only when the current phase has an actual section policy (block / replace / inject / order). With no section customization the host output is kept unchanged, including a complete persona. "Restore initial state" turns this off automatically.',
    forceOn: "On",
    forceOff: "Off",
    envBlockTitle: "Environment variable blocklist (envBlocklist)",
    envBlockHint: "All system environment variables (process.env) are registered as prompt variables: reference them in section text as {{env_lowercase_key}} (e.g. {{env_path}}); keys hit by the blocklist are not registered \u2014 env often carries secrets, and anything in the prompt is sent to the model. Entries support * wildcards, case-insensitive. Built-ins {{date}} {{time}} {{datetime}} {{weekday}} {{hostname}} {{platform}} {{arch}} {{username}} {{home}} {{shell}} {{locale}} {{node_version}} are always available.",
    envBlockAdd: "Key or wildcard, e.g. GITHUB_TOKEN or *_KEY*",
    envBlockAddAction: "Add",
    envBlockEmpty: "Blocklist is empty: every environment variable gets registered",
    envVarsTitle: "Registered prompt variables",
    envVarsHint: "Reference {{name}} in section text; an unregistered name fails the whole render (host strict mode).",
    importBlockMerge: ", the file\u2019s env-variable blocklist was merged in (+{count} entries)",
    resetTitle: "Restore initial state",
    resetHint: 'Clears all customization (blocking / replacement / injection / ordering, per-phase tool catalogs, config snapshots, agent-preset overrides) and turns forceSections off \u2014 every AI conversation goes back to being unaffected by this plugin, equivalent to uninstalling it, without uninstalling or restarting. This cannot be undone; to re-enable customization, turn the "Force override" switch above back on.',
    resetConfirm: "Clear all customization and restore the initial state?\n\nThis will delete: block lists, section replacements, injected sections, per-phase tool catalogs, config snapshots, and agent-preset overrides; forceSections will be turned off.\nAfterwards no AI conversation is affected by this plugin (equivalent to uninstalling).\nThis cannot be undone.",
    resetAction: "Clear all customization",
    resetOk: "Initial state restored: no AI conversation is affected by this plugin anymore",
    resetFail: "Failed to restore initial state",
    scopeFallback: "This agent preset's standing scope could not be mounted; what you see is the global layer (not the preset's native sections/tools).",
    previewFail: "Assembly for this phase failed (scope mount error or a preset plugin threw); switch target or check the server log.",
    previewToolsHint: "Tool catalog as the model actually sees it (all assembly rules run for the selected phase, including native phase narrowing):",
    previewToolsCount: "of registry",
    toolAgentScoped: "session-level",
    toolAgentScopedHint: `Registered by a plugin in the agent's own scope (not a preset registry entry). restrict cannot deny scope-local names; this plugin hides it per phase by filtering the assembled tools, so it stays toggleable in the enabled list. With no inherited same-name definition it is not "masked" \u2014 the read-only pool lists it as session-level rather than inventing a shadow.`,
    toolDescriptionLabel: "Tool description (read-only)",
    toolPromptSections: "Prompt sections",
    toolPromptNone: "No prompt section",
    toolPromptHint: "The tool's system-prompt section (part 1); tool visibility is controlled separately in the Tools tab. description / JSON Schema are not edited here.",
    toolPromptBadge: "tool prompt",
    toolPromptToolsLabel: "Associated tools",
    toolPromptToolsHint: "Tools served by this prompt section: {tools}",
    toolExecutorScoped: "executor wrapper",
    toolExecutorScopedHint: "Provided by the tool executor as a model-facing wrapper (such as PTC run_code), not an ordinary registry tool; it cannot be toggled per phase.",
    toolMaskedByPlugin: "plugin-masked",
    toolMaskedByPluginHint: "Present in the preset registry but restricted away by another plugin in the agent scope; this plugin cannot lift that restriction.",
    toolMaskedByShadow: "shadowed by same name",
    toolMaskedByShadowHint: "An inherited (global/preset) tool displaced by a plugin tool with the same name registered in the agent scope. This plugin cannot lift it; the model sees only the plugin tool.",
    toolMaskedByOwnPlugin: "masked by this plugin",
    toolMaskedByOwnPluginHint: "Hidden by this plugin's MCP tool disable / preset mask / workspace close ledger; re-enable it in the MCP tab.",
    // 2.2.0: main-list "masked here" badge, the two read-only pool groups, layer badges and top banners.
    toolOwnHidden: "masked by this plugin",
    toolOwnHiddenHint: "Hidden by this phase's tool list (this plugin can toggle it back: tick it to restore visibility).",
    toolMaskedByExternal: "invisible externally",
    toolMaskedByExternalHint: "Present in the preset registry but restricted away by another plugin in the agent scope: decided externally, this plugin cannot toggle it back.",
    toolMaskedByPtc: "PTC collapsed",
    toolMaskedByPtcHint: "With PTC collapse in effect the model only receives run_code; this tool stays available inside the program binding: decided externally, this plugin cannot toggle it back.",
    poolReversible: "Reversible (masked by this plugin)",
    poolIrreversible: "Irreversible (decided externally)",
    layerGlobal: "Global",
    layerPreset: "Preset",
    layerAgent: "Session",
    noSessionBanner: "No linked session: there is no active session on this preset, so external visibility is unknown.",
    ptcCollapsedBanner: "PTC collapse is in effect: the model only receives run_code; the other tools are available inside the program binding.",
    completeCatalogTitle: "Complete catalog / masked (read-only)",
    completeCatalogHint: "Read-only pool: the reversible group lists tools masked by this plugin (restorable in the MCP tab); the irreversible group lists externally decided tools (invisible externally / shadowed by same name / PTC collapsed). Neither group takes part in the phase checkboxes above.",
    workspaceRequired: "Saving workspace-level requires a current workspace (active session cwd).",
    workspaceNoSession: "Workspace level: no active session, so the workspace path is unknown; open a session first.",
    // 独立面板（侧边栏入口 + 抽屉分栏）新增。
    close: "Close",
    filterAll: "All",
    filterOn: "Enabled",
    filterOff: "Disabled",
    targetLabel: "Edit target (agent preset)",
    targetCustomized: "{n} overridden field(s)",
    agentScoped: "session-level",
    agentScopedHint: "This section is registered by a plugin in the active agent\u2019s own scope (not in this preset scope\u2019s registry): the panel enumerates it from the same-preset active agent\u2019s real assembly and shows it in the preview. It is in the system prompt by default, its identity stays stable across sessions as an agent source, and it can be blocked / replaced / reordered like any other row.",
    libraryTitle: "Config snapshots",
    applyToPreset: 'Apply writes to: preset "{name}"',
    applyToWorkspace: 'Apply writes to: workspace "{name}"',
    draftBadge: "Preview includes unsaved draft",
    previewSyncFail: "Live preview sync failed (retries on next edit, or press Refresh)",
    sectionDynamicUnsupported: "The host supplies no dynamic marker for this section, so it cannot be told apart from a runtime-generated one \u2014 adding it is disabled rather than guessed.",
    contextsUnsupported: "The host supplies no runtime-context list (baseContexts) for this phase; visibility cannot be toggled here and no fake state is shown.",
    contextsNotReady: "The three phase assemblies are not ready; cannot sync contexts across phases \u2014 press Refresh and retry.",
    sourceGlobal: "Global",
    sourcePreset: "Preset",
    sourceAgent: "Session",
    sourceExecutor: "Executor",
    sourceWorkspace: "Workspace",
    sourceUnknown: "Source unknown"
  }
};

// src/client/prompt/index.ts
var NS = "prompt-customizer";
var bound;
function promptT() {
  if (bound !== void 0) return bound;
  return (key, params) => {
    let text = DICT.zh[key] ?? key;
    if (params !== void 0) {
      for (const name of Object.keys(params)) text = text.split(`{${name}}`).join(String(params[name]));
    }
    return text;
  };
}
function applyPrompt(ctx) {
  const locale = ctx.locale;
  if (locale === void 0 || typeof locale.bind !== "function") {
    console.warn("[dsh-prompt-customizer] prompt locale unavailable: \u63D0\u793A\u8BCD\u9762\u677F\u56DE\u843D\u4E2D\u6587\u6587\u6848");
    return;
  }
  ctx.effect(() => {
    try {
      return locale.register(NS, DICT);
    } catch (error) {
      console.error("[dsh-prompt-customizer] prompt locale register failed:", error);
      return () => {
      };
    }
  }, "prompt-customizer: prompt locale");
  try {
    bound = locale.bind(NS);
  } catch (error) {
    console.warn("[dsh-prompt-customizer] prompt locale bind failed, \u56DE\u843D\u4E2D\u6587\u6587\u6848:", error);
  }
}

// src/client/prompt/PromptView.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function PromptView() {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Panel, { t: promptT() }) });
}

// src/client/skills/types.ts
var UNCATEGORIZED = "\0none";
var MAX_BUNDLE_CATEGORIES = 8;
function sortCategories(counts) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh")).map((entry) => entry[0]);
}
var ALL_PRESETS = "";
function isValidPresetId(value) {
  return value.trim() !== "";
}
var SKILL_SOURCE_ORIGINS = {
  "project-dsh": "workspace",
  "project-agents": "workspace",
  "user-dsh": "global",
  "user-agents": "global",
  bundled: "global",
  runtime: "global",
  custom: "global",
  // 宿主显式 origin 字段可能直接是桶名。
  workspace: "workspace",
  global: "global",
  project: "workspace",
  user: "global"
};
function skillOriginOf(skill) {
  const raw = skill.origin ?? skill.scope;
  if (typeof raw === "string" && raw.trim() !== "") {
    const mapped2 = SKILL_SOURCE_ORIGINS[raw.trim()];
    return mapped2 === void 0 ? { kind: "unknown", label: raw.trim() } : { kind: mapped2 };
  }
  if (typeof raw === "object" && raw !== null) {
    const bucket = [raw.kind, raw.origin, raw.scope].find((value) => typeof value === "string" && value.trim() !== "");
    const label = typeof raw.label === "string" && raw.label.trim() !== "" ? raw.label.trim() : void 0;
    if (bucket !== void 0) {
      const mapped2 = SKILL_SOURCE_ORIGINS[bucket.trim()];
      return mapped2 === void 0 ? { kind: "unknown", label: label ?? bucket.trim() } : { kind: mapped2 };
    }
    if (label !== void 0) return { kind: "unknown", label };
  }
  if (skill.root === void 0 || skill.root.trim() === "") return void 0;
  const source = skill.root.trim();
  const mapped = SKILL_SOURCE_ORIGINS[source];
  return mapped === void 0 ? { kind: "unknown", label: source } : { kind: mapped };
}
function enabledStateAt(scope, name, tables) {
  if (scope.level === "workspace" && scope.cwd !== null) {
    const workspace = tables.workspaceOverrides[scope.cwd] ?? {};
    if (Object.hasOwn(workspace, name)) return workspace[name] !== false;
    const workspaceBase = tables.workspaceSkills?.[name];
    if (workspaceBase !== void 0) return workspaceBase !== false;
  }
  if (scope.presetId !== ALL_PRESETS) {
    const preset = tables.overrides[scope.presetId] ?? {};
    if (Object.hasOwn(preset, name)) return preset[name] !== false;
  }
  return tables.skills[name] !== false;
}
function skillOverridesAt(scope, tables) {
  if (scope.level === "workspace") {
    return scope.cwd === null ? {} : tables.workspaceOverrides[scope.cwd] ?? {};
  }
  return scope.presetId === ALL_PRESETS ? {} : tables.overrides[scope.presetId] ?? {};
}
function bundleVisibleInList(bundle, filtering) {
  return bundle.skills.length > 0 || (bundle.missingSkills?.length ?? 0) > 0 || bundle.skillCount === 0 && !filtering;
}

// src/client/skills/api.ts
var SKILL_API_BASE = "/api/skill-manager";
function assertPresetId(presetId) {
  if (!isValidPresetId(presetId)) throw new Error(`invalid preset id: ${JSON.stringify(presetId)}`);
}
async function skillRequest(path, options) {
  const response = await fetch(SKILL_API_BASE + path, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "request failed (" + String(response.status) + ")");
  return body;
}
var skillApi = {
  /** 技能快照；`cwd` 指定工作区（缺省按当前会话）。 */
  list: (cwd) => skillRequest(
    cwd === void 0 || cwd === null || cwd === "" ? "/list" : `/list?cwd=${encodeURIComponent(cwd)}`,
    { headers: { accept: "application/json" } }
  ),
  /** 可选工作区清单（面板顶栏选择器）。 */
  workspaces: () => skillRequest("/workspaces", { headers: { accept: "application/json" } }),
  toggleStatus: (cwd) => fetch(cwd === void 0 || cwd === null || cwd === "" ? "/api/skill-toggles/status" : `/api/skill-toggles/status?workspace=${encodeURIComponent(cwd)}`, { headers: { accept: "application/json" } }).then((response) => response.json()).then((body) => {
    if (typeof body !== "object" || body === null || body.skills === void 0) {
      throw new Error("toggle status unavailable");
    }
    return body;
  }),
  setSkillEnabled: (name, enabled) => fetch(`/api/skill-toggles/skills/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ enabled })
  }).then((response) => response.json()).then((body) => {
    if (!body.ok) throw new Error(body.error || "toggle failed");
    return body;
  }),
  setBundleEnabled: (bundleId, enabled) => fetch(`/api/skill-toggles/bundles/${encodeURIComponent(bundleId)}`, {
    method: "PUT",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ enabled })
  }).then((response) => response.json()).then((body) => {
    if (!body.ok) throw new Error(body.error || "toggle failed");
    return body;
  }),
  /** 预设名单 + 各预设覆盖 + 全局层状态(一次拉齐)。 */
  presetStatus: (cwd) => fetch(cwd === void 0 || cwd === null || cwd === "" ? "/api/skill-toggles/presets" : `/api/skill-toggles/presets?workspace=${encodeURIComponent(cwd)}`, { headers: { accept: "application/json" } }).then((response) => response.json()).then((body) => {
    if (typeof body !== "object" || body === null || !Array.isArray(body.presets)) {
      throw new Error("preset status unavailable");
    }
    return body;
  }),
  setPresetSkillEnabled: (presetId, name, enabled) => {
    assertPresetId(presetId);
    return fetch(`/api/skill-toggles/presets/${encodeURIComponent(presetId)}/skills/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ enabled })
    }).then((response) => response.json()).then((body) => {
      if (!body.ok) throw new Error(body.error || "toggle failed");
      return body;
    });
  },
  setPresetBundleEnabled: (presetId, bundleId, enabled) => {
    assertPresetId(presetId);
    return fetch(`/api/skill-toggles/presets/${encodeURIComponent(presetId)}/bundles/${encodeURIComponent(bundleId)}`, {
      method: "PUT",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ enabled })
    }).then((response) => response.json()).then((body) => {
      if (!body.ok) throw new Error(body.error || "toggle failed");
      return body;
    });
  },
  resetPreset: (presetId) => {
    assertPresetId(presetId);
    return fetch(`/api/skill-toggles/presets/${encodeURIComponent(presetId)}/reset`, {
      method: "POST",
      headers: { accept: "application/json" }
    }).then((response) => response.json()).then((body) => {
      if (!body.ok) throw new Error(body.error || "reset failed");
      return body;
    });
  },
  /** 工作区级开关：全部工作区覆盖（按 cwd）。 */
  workspaceStatus: () => fetch("/api/skill-toggles/workspaces", { headers: { accept: "application/json" } }).then((response) => response.json()).then((body) => {
    if (body.error) throw new Error(body.error);
    return { workspaces: body.workspaces ?? {} };
  }),
  setWorkspaceSkillEnabled: (cwd, name, enabled) => fetch(`/api/skill-toggles/workspaces/${encodeURIComponent(cwd)}/skills/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ enabled })
  }).then((response) => response.json()).then((body) => {
    if (!body.ok) throw new Error(body.error || "toggle failed");
    return body;
  }),
  setWorkspaceBundleEnabled: (cwd, bundleId, enabled) => fetch(`/api/skill-toggles/workspaces/${encodeURIComponent(cwd)}/bundles/${encodeURIComponent(bundleId)}`, {
    method: "PUT",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ enabled })
  }).then((response) => response.json()).then((body) => {
    if (!body.ok) throw new Error(body.error || "toggle failed");
    return body;
  }),
  /** 清空某工作区的全部技能开关覆盖（按 cwd，回落预设/全局）。 */
  resetWorkspace: (cwd) => fetch(`/api/skill-toggles/workspaces/${encodeURIComponent(cwd)}/reset`, {
    method: "POST",
    headers: { accept: "application/json" }
  }).then((response) => response.json()).then((body) => {
    if (!body.ok) throw new Error(body.error || "reset failed");
    return body;
  }),
  createBundle: (name, categories = []) => skillRequest("/bundles", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ name, categories }) }),
  renameBundle: (bundleId, name) => skillRequest(`/bundles/${encodeURIComponent(bundleId)}`, { method: "PATCH", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ name }) }),
  /** 只改分类的 PATCH：host 侧 name 缺省即保持原值，不必回传包名。 */
  setBundleCategories: (bundleId, categories) => skillRequest(`/bundles/${encodeURIComponent(bundleId)}`, { method: "PATCH", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ categories }) }),
  deleteBundle: (bundleId) => skillRequest(`/bundles/${encodeURIComponent(bundleId)}`, { method: "DELETE", headers: { accept: "application/json" } }),
  setBundleSkills: (bundleId, skillNames) => skillRequest(`/bundles/${encodeURIComponent(bundleId)}/skills`, { method: "PUT", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ skillNames }) }),
  deleteSkill: (name) => skillRequest(`/skills/${encodeURIComponent(name)}`, { method: "DELETE", headers: { accept: "application/json" } }),
  installSkill: (input) => skillRequest("/skills", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(input) }),
  /** 技能目录健康检查：只读扫描（缺 SKILL.md / frontmatter 无效 / 名称不一致 / 账本悬挂引用）。 */
  health: () => fetch("/api/skill-health", { headers: { accept: "application/json" } }).then((response) => response.json()).then((body) => {
    if (typeof body !== "object" || body === null || !Array.isArray(body.issues)) {
      throw new Error("health unavailable");
    }
    return body;
  })
};

// src/client/skills/files.ts
function readEntryFile(entry) {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}
async function collectEntry(entry, prefix, out) {
  if (entry.isFile) {
    const fileEntry = entry;
    const file = await readEntryFile(fileEntry);
    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    out.push({ path, file });
    return;
  }
  if (entry.isDirectory) {
    const dirEntry = entry;
    const reader = dirEntry.createReader();
    const all = [];
    while (true) {
      const batch = await new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      if (batch.length === 0) break;
      all.push(...batch);
    }
    const nextPrefix = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    for (const child of all) await collectEntry(child, nextPrefix, out);
  }
}
function fileToBase64(file) {
  return file.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 32768;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  });
}

// src/client/skills/GuidePanel.tsx
var import_react_dom2 = require("react-dom");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/skills/icons.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function catStroke() {
  return { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
}
function CatAllIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "4", y: "4", width: "16", height: "16", rx: "4.5", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M9.2 9.2h5.6v5.6H9.2Z", fill: "#FFFFFF", opacity: ".92" })
  ] });
}
function LockGlyph({ size = 10 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", ...catStroke(), strokeWidth: 2, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "5", y: "10.5", width: "14", height: "9", rx: "2.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M8.2 10.5V8.4a3.8 3.8 0 0 1 7.6 0v2.1" })
  ] });
}
function CloudUpIcon({ size = 18 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", ...catStroke(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M17.7 9.5A5.2 5.2 0 0 0 7.6 8.2 4 4 0 0 0 6.5 16h10.9a3.8 3.8 0 0 0 .5-7.6Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 17.5v-5M9.6 14.6 12 12.2l2.4 2.4" })
  ] });
}
function SortDirIcon({ dir, size = 12 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", ...catStroke(), children: dir === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 19V5M5.8 10.8 12 4.6l6.2 6.2" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 5v14M5.8 13.2 12 19.4l6.2-6.2" }) });
}
function FolderBlueIcon({ size = 17 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M3.5 7.2a2.2 2.2 0 0 1 2.2-2.2h4l2 2.1h6.6a2.2 2.2 0 0 1 2.2 2.2v7.5a2.2 2.2 0 0 1-2.2 2.2H5.7a2.2 2.2 0 0 1-2.2-2.2Z", fill: "var(--dsw-alias-state-business-primary,#3d6be5)" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M3.5 9.5h17v1.6a2.2 2.2 0 0 0-2.2-2.2H5.7a2.2 2.2 0 0 0-2.2 2Z", fill: "#FFFFFF", opacity: ".25" })
  ] });
}
function ArrowRightIcon({ size = 13 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", ...catStroke(), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M5 12h14M13 6l6 6-6 6" }) });
}
function GuideArtIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "150", height: "86", viewBox: "0 0 150 86", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("defs", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("linearGradient", { id: "skm-guide-book", x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0", stopColor: "#9DB7F7" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "1", stopColor: "#6E8FF0" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("linearGradient", { id: "skm-guide-page", x1: "0", y1: "0", x2: "1", y2: "1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0", stopColor: "#FFFFFF" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "1", stopColor: "#D9E4FF" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M96 34 L141 52 L120 66 L78 50 Z", fill: "url(#skm-guide-page)", stroke: "#C7D6F7", strokeWidth: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M84 32 L50 52 L28 44 L64 26 Z", fill: "url(#skm-guide-page)", stroke: "#C7D6F7", strokeWidth: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M64 26 L96 34 L78 50 L50 52 Z", fill: "url(#skm-guide-book)", stroke: "var(--dsw-alias-state-business-primary,#5b82e5)", strokeWidth: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M50 52 L28 44 L30 56 L52 66 Z", fill: "#B7C9F5", stroke: "var(--dsw-alias-state-business-primary,#5b82e5)", strokeWidth: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M78 50 L120 66 L118 78 L76 62 Z", fill: "#A9BEF1", stroke: "var(--dsw-alias-state-business-primary,#5b82e5)", strokeWidth: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "73", cy: "44", r: "9", fill: "#FFFFFF", opacity: ".85" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "73", cy: "44", r: "5.5", fill: "#6E8FF0" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M118 10c.6 2.6 1.6 3.6 4.2 4.2-2.6.6-3.6 1.6-4.2 4.2-.6-2.6-1.6-3.6-4.2-4.2 2.6-.6 3.6-1.6 4.2-4.2Z", fill: "#BCCFFF" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M126 26c.4 1.7 1 2.3 2.7 2.7-1.7.4-2.3 1-2.7 2.7-.4-1.7-1-2.3-2.7-2.7 1.7-.4 2.3-1 2.7-2.7Z", fill: "#C9D9FF" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "111", cy: "24", r: "2", fill: "#C9D9FF" })
  ] });
}
function GuideArtIconSmall() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "1.5", y: "2", width: "13", height: "12", rx: "2.5", fill: "var(--dsw-alias-state-business-primary,#3d6be5)" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4.5 5h7M4.5 8h7M4.5 11h4.5", stroke: "#FFFFFF", strokeWidth: "1.3", strokeLinecap: "round" })
  ] });
}
function CopyIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
  ] });
}
function CheckIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polyline", { points: "20 6 9 17 4 12" }) });
}
function SearchIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "11", cy: "11", r: "8" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  ] });
}
function TagIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: "7", y1: "7", x2: "7.01", y2: "7" })
  ] });
}

// src/client/skills/GuidePanel.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function CapIcon({ kind, size = 17 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true };
  const s2 = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "ui") {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { ...common, ...s2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "4", y: "4", width: "6.5", height: "6.5", rx: "1.4" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "13.5", y: "4", width: "6.5", height: "6.5", rx: "1.4" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "4", y: "13.5", width: "6.5", height: "6.5", rx: "1.4" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "13.5", y: "13.5", width: "6.5", height: "6.5", rx: "1.4" })
    ] });
  }
  if (kind === "code") {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { ...common, ...s2, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M9 7.5 5.5 12 9 16.5M15 7.5 18.5 12 15 16.5" }) });
  }
  if (kind === "doc") {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { ...common, ...s2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M6.5 4.5h7l4 4v11h-11Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M13.5 4.5v4h4M9 13h6M9 16h4.5" })
    ] });
  }
  if (kind === "data") {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { ...common, ...s2, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M5 19h14M7 16v-5M12 16V8M17 16v-8.5" }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { ...common, ...s2, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" }) });
}
function GuidePanel({ t, onClose, left, top, height }) {
  const caps = [
    [t("guideCapUi"), "ui"],
    [t("guideCapCode"), "code"],
    [t("guideCapDoc"), "doc"],
    [t("guideCapData"), "data"],
    [t("guideCapTool"), "tool"]
  ];
  const steps = [
    [1, t("guideStep1"), t("guideStep1Desc")],
    [2, t("guideStep2"), t("guideStep2Desc")],
    [3, t("guideStep3"), t("guideStep3Desc")],
    [4, t("guideStep4"), t("guideStep4Desc")]
  ];
  const bests = [t("guideBest1"), t("guideBest2"), t("guideBest3"), t("guideBest4")];
  return (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "aside",
      {
        className: css.guidePanel,
        role: "complementary",
        "aria-label": t("guidePanelTitle"),
        style: { left, top, height },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: css.guidePanelHead, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guidePanelLogo, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(GuideArtIconSmall, {}) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guidePanelTitle, children: t("guidePanelTitle") }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: css.guidePanelClose, "aria-label": t("guideClose"), onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.IconCloseOutlineRegular, { size: 14, "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: css.guidePanelBody, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: css.guideSec, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: css.guideSecHead, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guideSecIcon, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.IconSkillOutlineRegular, { size: 14, "aria-hidden": "true" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guideSecTitle, children: t("guideWhat") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: css.guideWhatDesc, children: t("guideWhatDesc") }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: css.guideCaps, children: caps.map(([label, kind]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: css.guideCap, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guideCapIcon, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CapIcon, { kind }) }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guideCapLabel, children: label })
              ] }, label)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: css.guideSec, children: steps.map(([num, title, desc]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: css.guideStep, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guideStepNum, children: num }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: css.guideStepBody, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: css.guideStepTitleRow, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guideStepTitle, children: title }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.IconChevronRightOutlineRegular, { className: css.guideStepArrow, size: 12, "aria-hidden": "true" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: css.guideStepDesc, children: desc })
              ] })
            ] }, num)) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: css.guideBest, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: css.guideBestTitle, children: t("guideBest") }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { className: css.guideBestList, children: bests.map((item) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { className: css.guideBestItem, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CheckIcon, {}),
                item
              ] }, item)) }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: css.guideMoreBtn, onClick: onClose, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("guideMoreBest") }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ArrowRightIcon, { size: 12 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: css.guideBestArt, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(GuideArtIcon, {}) })
            ] })
          ] })
        ]
      }
    ),
    document.body
  );
}

// src/client/skills/locales.ts
var SKILL_ZH = {
  panelTitle: "\u80FD\u529B\u7BA1\u7406",
  close: "\u5173\u95ED",
  loading: "\u6B63\u5728\u8BFB\u53D6\u6280\u80FD\u2026",
  error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6280\u80FD\u3002",
  retry: "\u91CD\u8BD5",
  refresh: "\u5237\u65B0",
  uploadMeta: "{n} \u4E2A\u6587\u4EF6 \xB7 {folder}",
  fileCount: "{n} \u6587\u4EF6",
  previewLoading: "\u6B63\u5728\u52A0\u8F7D\u5185\u5BB9\u2026",
  viewerNav: "\u6280\u80FD\u6587\u4EF6",
  viewerFont: "\u5B57\u53F7",
  viewerFull: "\u5168\u5C4F\u67E5\u770B",
  viewerExitFull: "\u9000\u51FA\u5168\u5C4F",
  viewerFilesCount: "{n} \u4E2A\u6587\u4EF6",
  assignToBundle: "\u5F52\u5165 Bundle",
  assignTitle: "\u5C06\u300C{name}\u300D\u5F52\u5165",
  assignEmpty: "\u8FD8\u6CA1\u6709\u6280\u80FD\u5305,\u5148\u70B9\u300C\u65B0\u5EFA Bundle\u300D\u521B\u5EFA\u4E00\u4E2A\u3002",
  deleteSkillBtn: "\u5220\u9664\u6280\u80FD",
  installName: "\u6280\u80FD\u540D\u79F0",
  installNamePlaceholder: "\u4F8B\u5982 my-skill",
  installDescription: "\u63CF\u8FF0\uFF08\u53EF\u9009\uFF09",
  installNameFromArchive: "\u6280\u80FD\u540D\u53D6\u81EA\u538B\u7F29\u5305\u5185\u7684 SKILL.md",
  installNameInvalid: "\u6280\u80FD\u540D\u53EA\u80FD\u5305\u542B\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u8FDE\u5B57\u7B26\uFF08a-z 0-9 -\uFF09",
  installBundle: "\u5F52\u5165 Bundle",
  installLoose: "\u4E0D\u5F52\u7EC4\uFF08\u6563\u88C5\uFF09",
  installConfirm: "\u5B89\u88C5",
  installCancel: "\u53D6\u6D88",
  // 技能包分类
  bundleCatTitle: "\u5206\u7C7B",
  bundleCatAll: "\u5168\u90E8\u5206\u7C7B",
  bundleCatNone: "\u672A\u5206\u7C7B",
  bundleCatFilterAria: "\u6309\u5206\u7C7B\u7B5B\u9009\u6280\u80FD\u5305",
  bundleCatEdit: "\u8BBE\u7F6E\u5206\u7C7B",
  bundleCatEditTitle: "\u300C{name}\u300D\u7684\u5206\u7C7B",
  bundleCatPlaceholder: "\u81EA\u5B9A\u4E49\u5206\u7C7B\uFF0C\u56DE\u8F66\u6DFB\u52A0",
  bundleCatSaved: "\u5DF2\u66F4\u65B0\u300C{name}\u300D\u7684\u5206\u7C7B",
  bundleCatTip: "\u53EA\u770B\u300C{name}\u300D\u5206\u7C7B \xB7 \u518D\u70B9\u4E00\u6B21\u53D6\u6D88\u7B5B\u9009",
  bundleCatLimit: "\u4E00\u4E2A\u6280\u80FD\u5305\u6700\u591A {n} \u4E2A\u5206\u7C7B",
  bundleCatDone: "\u4FDD\u5B58",
  bundleCatAddPreset: "\u52A0\u5165\u300C{name}\u300D",
  bundleCatEmptyHint: "\u8FD8\u6CA1\u5206\u7C7B\u3002\u4ECE\u5DF2\u6709\u5206\u7C7B\u91CC\u9009\u4E00\u4E2A\uFF0C\u6216\u81EA\u5DF1\u5199\u4E00\u4E2A \u2014\u2014 \u5206\u7C7B\u53EA\u5F71\u54CD\u8FD9\u91CC\u7684\u67E5\u627E\uFF0C\u4E0D\u6539\u53D8\u6280\u80FD\u672C\u8EAB\u3002",
  bundleCatRemove: "\u79FB\u9664\u5206\u7C7B\u300C{name}\u300D",
  bundleCatCustom: "\u81EA\u5B9A\u4E49\u5206\u7C7B",
  newBundle: "\u65B0\u5EFA\u6280\u80FD\u5305",
  newBundlePlaceholder: "\u6280\u80FD\u5305\u540D\u79F0",
  create: "\u521B\u5EFA",
  cancel: "\u53D6\u6D88",
  renameBundlePlaceholder: "\u65B0\u7684 Bundle \u540D\u79F0",
  rename: "\u91CD\u547D\u540D",
  delete: "\u5220\u9664",
  skillsCount: "{n} \u4E2A\u6280\u80FD",
  removeSkill: "\u79FB\u51FA",
  looseTitle: "\u6563\u88C5\u6280\u80FD",
  deleteBundleConfirm: "\u5220\u9664 Bundle\u300C{name}\u300D\uFF1F\u5176\u4E2D\u7684\u6280\u80FD\u5C06\u53D8\u4E3A\u6563\u88C5\u3002",
  deleteSkillConfirm: "\u5220\u9664\u6280\u80FD\u300C{name}\u300D\uFF1F\u6B64\u64CD\u4F5C\u4F1A\u5220\u9664\u5B83\u7684\u6587\u4EF6\u3002",
  enableSkill: "\u542F\u7528",
  disableSkill: "\u7981\u7528",
  enableBundle: "\u542F\u7528\u5168\u90E8",
  disableBundle: "\u7981\u7528\u5168\u90E8",
  toggleFailed: "\u5207\u6362\u5931\u8D25\uFF1A{message}",
  presetAll: "\u5168\u90E8",
  presetHintAll: "\u5F53\u524D\u7F16\u8F91\u300C\u5168\u90E8 Agent\u300D\uFF1A\u5F00\u5173\u5BF9\u6240\u6709\u9884\u8BBE\u751F\u6548\uFF0C\u6240\u6709\u6765\u6E90\u7684\u6280\u80FD\u90FD\u80FD\u5173\uFF08\u968F\u5B89\u88C5/\u63D2\u4EF6\u63D0\u4F9B\u7684\u4E5F\u4E00\u6837\uFF0C\u4E0D\u6539\u5B83\u4EEC\u7684\u6587\u4EF6\uFF09\u3002",
  presetHintScoped: "\u5F53\u524D\u7F16\u8F91\u300C{name}\u300D\uFF1A\u53EA\u5BF9\u8BE5 Agent \u9884\u8BBE\u751F\u6548\uFF0C\u5176\u5B83\u9884\u8BBE\u4E0D\u53D7\u5F71\u54CD\u3002",
  presetReset: "\u6E05\u7A7A\u8BE5\u9884\u8BBE\u7684\u5355\u72EC\u8BBE\u7F6E",
  presetOverrideCount: "{n} \u9879\u5355\u72EC\u8BBE\u7F6E",
  presetLockedByGlobal: "\u300C\u5168\u90E8 Agent\u300D\u5C42\u5DF2\u7981\u7528\uFF0C\u9884\u8BBE\u5C42\u65E0\u6CD5\u6253\u5F00",
  // 卡片（Skills Hub 风格）文案
  copySkillName: "\u590D\u5236\u6280\u80FD\u540D",
  copiedSkillName: "\u5DF2\u590D\u5236",
  toolsLabel: "\u5DE5\u5177",
  scopeAll: "\u5168\u5C40",
  scopeWorkspace: "\u5DE5\u4F5C\u533A",
  tagLoose: "\u6563\u88C5",
  // Skills Hub 页面文案
  statSync: "\u6280\u80FD\u5065\u5EB7",
  statHealthy: "\u5168\u90E8\u5065\u5EB7",
  statChecking: "\u68C0\u6D4B\u4E2D\u2026",
  statIssues: "{n} \u4E2A\u95EE\u9898",
  statPending: "\u5F85\u68C0\u6D4B",
  searchPlaceholder: "\u641C\u7D22\u6280\u80FD\u540D\u79F0\u3001\u63CF\u8FF0\u6216\u6807\u7B7E\u2026",
  sortLabel: "\u540D\u79F0",
  bannerTitle: "\u6DFB\u52A0\u6280\u80FD",
  bannerSub: "\u62D6\u5165\u6280\u80FD\u6587\u4EF6\u5939\u5B89\u88C5\uFF0C\u6216\u70B9\u51FB\u6D4F\u89C8\u9009\u62E9",
  noMatch: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6280\u80FD",
  // 左栏：Agent 预设分类 / 快捷筛选 / 添加技能卡
  presetCatTitle: "Agent \u9884\u8BBE\u5206\u7C7B",
  statusAll: "\u5168\u90E8",
  statusOn: "\u5DF2\u542F\u7528",
  statusOff: "\u5DF2\u505C\u7528",
  addSkillsTitle: "\u6DFB\u52A0\u6280\u80FD",
  addSkillsSub: "\u62D6\u5165\u6280\u80FD\u6587\u4EF6\u5B89\u88C5\uFF0C\u6216\u70B9\u51FB\u6D4F\u89C8\u9009\u62E9",
  dropHere: "\u62D6\u62FD\u6587\u4EF6\u5230\u6B64\u5904",
  dropFormat: "\u652F\u6301 .zip .skill \u7B49\u683C\u5F0F",
  browseImport: "\u6D4F\u89C8\u5E76\u5BFC\u5165",
  // 快速上手指南卡
  guidePanelTitle: "\u5FEB\u901F\u4E0A\u624B",
  guideWhat: "\u4EC0\u4E48\u662F Skill?",
  guideWhatDesc: "Skill \u662F Agent \u7684\u80FD\u529B\u6A21\u5757\uFF0C\u53EF\u4EE5\u8BA9 Agent \u5B66\u4F1A\u7279\u5B9A\u4EFB\u52A1\u3001\u6269\u5C55\u66F4\u591A\u80FD\u529B\u3002",
  guideCapUi: "UI \u8BBE\u8BA1",
  guideCapCode: "\u4EE3\u7801\u751F\u6210",
  guideCapDoc: "\u6587\u6863\u5904\u7406",
  guideCapData: "\u6570\u636E\u5206\u6790",
  guideCapTool: "\u5DE5\u5177\u8C03\u7528",
  guideStep1: "\u521B\u5EFA Skill",
  guideStep1Desc: "\u901A\u8FC7\u4E0A\u4F20\u6587\u4EF6\u6216\u914D\u7F6E\u89C4\u5219\uFF0C\u521B\u5EFA\u65B0\u7684 Skill\uFF0C\u8BA9 Agent \u5B66\u4F1A\u65B0\u80FD\u529B\u3002",
  guideStep2: "\u914D\u7F6E Skill",
  guideStep2Desc: "\u8BBE\u7F6E\u8F93\u5165\u8F93\u51FA\u3001\u53C2\u6570\u548C\u6743\u9650\uFF0C\u786E\u4FDD Skill \u80FD\u6B63\u786E\u88AB Agent \u8C03\u7528\u3002",
  guideStep3: "\u542F\u7528\u7ED9 Agent",
  guideStep3Desc: "\u5C06 Skill \u542F\u7528\u5230 Agent \u4E2D\uFF0C\u8BA9 Agent \u5728\u5BF9\u8BDD\u4E2D\u81EA\u52A8\u4F7F\u7528\u3002",
  guideStep4: "\u67E5\u770B\u6548\u679C",
  guideStep4Desc: "\u5728\u5BF9\u8BDD\u4E2D\u6D4B\u8BD5 Skill \u7684\u6548\u679C\uFF0C\u6301\u7EED\u4F18\u5316\u6280\u80FD\u8868\u73B0\u3002",
  guideBest: "\u6700\u4F73\u5B9E\u8DF5",
  guideBest1: "\u4E00\u4E2A Skill \u4E13\u6CE8\u4E00\u4E2A\u80FD\u529B",
  guideBest2: "\u63CF\u8FF0\u6E05\u695A\u8F93\u5165\u548C\u8F93\u51FA",
  guideBest3: "\u5B9A\u671F\u66F4\u65B0\u6280\u80FD\u6587\u4EF6",
  guideBest4: "\u4E0D\u8981\u521B\u5EFA\u91CD\u590D\u80FD\u529B",
  guideMoreBest: "\u4E86\u89E3\u66F4\u591A\u6700\u4F73\u5B9E\u8DF5",
  guideClose: "\u6536\u8D77\u6307\u5357",
  // SKILL / MCP 顶层 tab
  kindSkill: "SKILL",
  kindPrompt: "\u63D0\u793A\u8BCD",
  kindMcp: "MCP",
  levelPreset: "\u9884\u8BBE\u7EA7",
  levelWorkspace: "\u5DE5\u4F5C\u533A\u7EA7",
  levelAria: "\u9884\u8BBE\u7EA7 / \u5DE5\u4F5C\u533A\u7EA7",
  applyAll: "\u5E94\u7528\u5230\u6240\u6709\u9884\u8BBE",
  applyAllHint: "\u628A\u300C\u5168\u90E8\u300D\u89C6\u56FE\u7684\u6280\u80FD\u542F\u505C\u8986\u76D6\u5230\u6BCF\u4E2A agent \u9884\u8BBE\uFF08\u6E05\u7A7A\u5404\u9884\u8BBE\u7684\u5355\u72EC\u5F00\u5173\uFF0C\u4EE4\u5176\u5168\u90E8\u7EE7\u627F\u5168\u90E8/\u5168\u5C40\uFF09\u3002",
  applyAllConfirm: "\u5C06\u628A\u5F53\u524D\u300C\u5168\u90E8\u300D\u7684\u6280\u80FD\u542F\u505C\u8986\u76D6\u5230\u6240\u6709 agent \u9884\u8BBE\uFF08\u6E05\u9664\u5404\u9884\u8BBE\u539F\u6709\u7684\u5355\u72EC\u5F00\u5173\uFF09\u3002\u786E\u5B9A\uFF1F",
  applyAllOk: "\u5DF2\u5E94\u7528\u5230 {n} \u4E2A\u9884\u8BBE",
  mcpApplyAll: "\u5E94\u7528\u5230\u6240\u6709\u9884\u8BBE\uFF08MCP\uFF09",
  mcpApplyAllHint: "\u628A\u300C\u5168\u90E8\u300D\u89C6\u56FE\u7684 MCP \u5DE5\u5177\u914D\u7F6E\u8986\u76D6\u5230\u6BCF\u4E2A agent \u9884\u8BBE\uFF08\u6E05\u7A7A\u5404\u9884\u8BBE\u7684\u906E\u853D/\u5DE5\u5177\u542F\u505C\u8986\u76D6\uFF09\uFF1B\u5DE5\u4F5C\u533A\u7EA7\u4E0D\u53D7\u5F71\u54CD\u3002",
  mcpApplyAllConfirm: "\u5C06\u628A\u5F53\u524D\u300C\u5168\u90E8\u300D\u7684 MCP \u5DE5\u5177\u914D\u7F6E\u8986\u76D6\u5230\u6240\u6709 agent \u9884\u8BBE\uFF08\u6E05\u9664\u5404\u9884\u8BBE\u539F\u6709\u7684\u906E\u853D/\u5DE5\u5177\u542F\u505C\u8986\u76D6\uFF09\u3002\u5DE5\u4F5C\u533A\u4E0D\u53D7\u5F71\u54CD\u3002\u786E\u5B9A\uFF1F",
  mcpApplyAllOk: "\u5DF2\u5E94\u7528\u5230\u6240\u6709\u9884\u8BBE\uFF08\u6E05\u7406\u906E\u853D {masks} / \u5DE5\u5177 {tools}\uFF09",
  mcpEdit: "\u7F16\u8F91",
  mcpEditTitle: "\u7F16\u8F91 MCP Server",
  mcpEditReload: "\u4FDD\u5B58\u540E\u5C1D\u8BD5\u70ED\u91CD\u8F7D\uFF08\u9ED8\u8BA4\u4E0B\u6B21\u4F1A\u8BDD / \u91CD\u542F\u751F\u6548\uFF09",
  mcpEditSaved: "\u5DF2\u4FDD\u5B58\u4FEE\u6539\uFF08\u4E0B\u6B21\u4F1A\u8BDD / \u91CD\u542F\u751F\u6548\uFF09",
  mcpAddServer: "\u6DFB\u52A0 MCP Server",
  // MCP Server 列表
  mcpListTitle: "MCP Server \u5217\u8868",
  mcpRemove: "\u79FB\u9664",
  mcpAddModalTitle: "\u6DFB\u52A0 MCP Server",
  mcpAddConfirm: "\u6DFB\u52A0",
  // 真实注册状态（mcp-client 桥接）
  mcpLiveDisabled: "\u5DF2\u7981\u7528",
  mcpLiveEmpty: "\u672A\u68C0\u6D4B\u5230\u5DF2\u6CE8\u518C\u7684 MCP Server\uFF1A\u5728 cordis.patch.yml \u6DFB\u52A0 mcp-client \u6761\u76EE\u5E76\u91CD\u542F DSH \u540E\u5373\u53EF",
  mcpLiveUnavailable: "\u72B6\u6001\u63A5\u53E3\u672A\u5C31\u7EEA\uFF08host \u6539\u52A8\u9700\u91CD\u542F DSH \u670D\u52A1\uFF09\uFF1A\u6865\u63A5\u5DE5\u5177\u4ECD\u53EF\u7528\uFF0C\u6B64\u9875\u6682\u65E0\u6CD5\u8BFB\u53D6\u6CE8\u518C\u8868",
  mcpLiveToolsOf: "\u5DE5\u5177",
  mcpToolsUnknown: "\u5DE5\u5177\u6570\u672A\u77E5",
  mcpLiveRefresh: "\u5237\u65B0",
  mcpConnStatus: "\u8FDE\u63A5\u72B6\u6001",
  mcpConnOk: "\u5DF2\u8FDE\u63A5",
  mcpConnDown: "\u4E0D\u53EF\u7528",
  mcpConnTip: "\u5B9E\u65F6\u8BFB\u53D6\u5230 {n} \u4E2A\u5168\u5C40 MCP Server",
  mcpLiveConfigHint: "\u6DFB\u52A0\uFF1A\u7F16\u8F91 cordis.patch.yml\uFF08\u6216\u4F7F\u7528\u300C\u6DFB\u52A0 MCP Server\u300D\u751F\u6210\u914D\u7F6E\u7247\u6BB5\uFF09",
  // 预设维度（0.1.6）：全局 / 预设专属 / 遮蔽
  mcpScopeTitle: "Agent \u9884\u8BBE\u8303\u56F4",
  mcpScopeHintAll: "\u5F53\u524D\u67E5\u770B\u5168\u5C40 Server\uFF08\u6240\u6709\u9884\u8BBE\u5171\u7528\uFF09\u3002\u9009\u62E9\u67D0\u4E2A\u9884\u8BBE\uFF0C\u53EF\u7BA1\u7406\u5B83\u4E13\u5C5E\u7684 Server \u4E0E\u906E\u853D\u3002",
  mcpPresetGlobalSection: "\u7EE7\u627F\u7684\u5168\u5C40 Server",
  mcpPresetOwnSection: "\u8BE5\u9884\u8BBE\u4E13\u5C5E Server",
  mcpPresetMasked: "\u5DF2\u906E\u853D",
  mcpPresetMaskState: "\u7EE7\u627F\u5168\u5C40\uFF08\u672A\u906E\u853D\uFF09",
  mcpPresetMaskHint: "\u5173\u6389\u5F00\u5173 = \u5BF9\u8BE5\u9884\u8BBE\u906E\u853D\uFF1A\u5DE5\u5177\u3001\u670D\u52A1\u5668\u6307\u4EE4\u4E0E\u8D44\u6E90\u8BFB\u53D6\u90FD\u9690\u85CF\uFF1B\u5168\u5C40\u8FDE\u63A5\u4FDD\u7559\uFF08\u8981\u300C\u4E0D\u8FDE\u63A5\u300D\u8BF7\u6539\u7528\u300C\u4E13\u5C5E Server\u300D\uFF09\u3002",
  mcpPresetCovered: "\u5DF2\u88AB\u672C\u9884\u8BBE\u540C\u540D Server \u8986\u76D6",
  mcpPresetOwnHint: "\u4E13\u5C5E Server \u5199\u8FDB\u8BE5\u9884\u8BBE\u58F0\u660E\u884C\u7684 plugins\uFF1A\u72EC\u7ACB\u8FDE\u63A5\uFF0C\u4EC5\u8BE5\u9884\u8BBE\u4E0E\u5176\u5B50\u4EE3\u7406\u53EF\u89C1\u3002",
  mcpAddServerGlobal: "\u6DFB\u52A0 MCP Server\uFF08\u5168\u5C40\uFF09",
  mcpAddGlobalHint: "\u5168\u5C40 Server \u5BF9\u6240\u6709\u9884\u8BBE\u751F\u6548\uFF1B\u53EA\u60F3\u7ED9\u5F53\u524D\u9884\u8BBE\u7528\uFF0C\u8BF7\u70B9\u5DE6\u4FA7\u7684\u300C\u6DFB\u52A0\u4E13\u5C5E Server\u300D\u3002",
  mcpOwnRemoveConfirmTitle: "\u79FB\u9664\u8BE5\u9884\u8BBE\u4E13\u5C5E Server\uFF1F",
  mcpOwnRemoveConfirmMsg: "\u5C06\u4ECE\u300C{name}\u300D\u7684\u58F0\u660E\u884C\u91CC\u5220\u6389\u8FD9\u4E00\u6761 mcp-client \u6761\u76EE\uFF08\u7531 DSH \u539F\u5B50\u5199\u56DE profile \u914D\u7F6E\uFF09\uFF0C\u5BF9\u8BE5\u9884\u8BBE\u7684\u65B0\u4F1A\u8BDD\u751F\u6548\uFF1B\u5168\u5C40\u7684\u540C\u540D Server \u4E0D\u53D7\u5F71\u54CD\u3002",
  // 同名覆盖：预设自带同名 Server 时的遮蔽开关与提示
  mcpPresetCoveredSwitchHint: "\u906E\u853D\u5168\u5C40\u8FD9\u4E00\u6761\u3002\u8BE5\u9884\u8BBE\u81EA\u5E26\u540C\u540D Server\uFF0C\u5DE5\u5177\u4ECD\u7531\u5B83\u63D0\u4F9B \u2014\u2014 \u8981\u4E00\u8D77\u5173\u6389\u8BF7\u79FB\u9664\u4E0B\u65B9\u300C\u8BE5\u9884\u8BBE\u4E13\u5C5E Server\u300D\u3002",
  mcpPresetCoveredMasked: "\u5DF2\u906E\u853D\u5168\u5C40\u8FD9\u4E00\u6761 \xB7 \u5DE5\u5177\u4ECD\u7531\u8BE5\u9884\u8BBE\u540C\u540D Server \u63D0\u4F9B",
  mcpPresetShadowGlobalTag: "\u540C\u540D\u5168\u5C40",
  mcpPresetShadowGlobalTip: "\u5168\u5C40\u4E5F\u6709\u4E00\u53F0\u540C\u540D Server\u3002\u672C\u9884\u8BBE\u7528\u81EA\u5E26\u7684\u8FD9\u53F0\uFF0C\u4E24\u8FB9\u7684\u5DE5\u5177\u5F00\u5173\u5404\u8BB0\u5404\u7684\u8D26\uFF08\u4E92\u4E0D\u5F71\u54CD\uFF09\u3002",
  mcpPresetOwnEmpty: "\u8BE5\u9884\u8BBE\u8FD8\u6CA1\u6709\u4E13\u5C5E Server",
  mcpPresetStorageHint: "\u8BE5\u9884\u8BBE\u7531\u968F\u5B89\u88C5\u7684 bundle \u58F0\u660E\uFF1A\u5199\u5165\u4F1A\u5728 profile \u5C42\u6574\u4EFD\u8986\u76D6\u5B83\u7684 plugins\uFF0C\u6B64\u540E\u8BE5\u9884\u8BBE\u4E0D\u518D\u8DDF\u968F DSH \u5347\u7EA7\u53D8\u5316\u3002",
  mcpPresetAddOwn: "\u6DFB\u52A0\u4E13\u5C5E Server",
  mcpPresetNewSession: "\u9884\u8BBE\u6539\u52A8\uFF08\u70ED\u91CD\u8F7D\uFF09\u5BF9\u65B0\u4F1A\u8BDD\u751F\u6548",
  mcpPresetFailed: "\u64CD\u4F5C\u5931\u8D25\uFF1A{message}",
  // MCP 页（与技能页同构）：统计卡 / 提示行 / 工具条
  mcpScopeAllTip: "\u5168\u90E8 Agent\uFF1A{n} \u4E2A\u5168\u5C40 Server\uFF08\u6240\u6709\u9884\u8BBE\u5171\u7528\uFF09",
  mcpScopePresetTip: "\u8BE5\u9884\u8BBE\u53EF\u89C1 {n} \u4E2A Server",
  mcpScopeOverrideCount: "{n} \u9879\u5355\u72EC\u8BBE\u7F6E",
  mcpScopeHintScoped: "\u5F53\u524D\u7F16\u8F91\u300C{name}\u300D\uFF1A\u4E13\u5C5E Server \u53EA\u5BF9\u8FD9\u4E2A\u9884\u8BBE\u751F\u6548\uFF1B\u5F00\u5173 = \u906E\u853D\u5B83\u7EE7\u627F\u7684\u5168\u5C40 Server\uFF0C\u5176\u5B83\u9884\u8BBE\u4E0D\u53D7\u5F71\u54CD\u3002",
  mcpScopeHintWorkspace: "\u5F53\u524D\u7F16\u8F91\u5DE5\u4F5C\u533A\u300C{path}\u300D\uFF1A\u4E3B\u5F00\u5173\u5199\u300C\u672C\u5DE5\u4F5C\u533A\u5173\u95ED\u300D\uFF0C\u53EA\u5F71\u54CD\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u7684\u4F1A\u8BDD\uFF1B\u9884\u8BBE\u4E13\u5C5E Server \u4ECD\u6309\u9884\u8BBE\u8BB0\u8D26\u3002",
  mcpWaitingTools: "\u6B63\u5728\u7B49\u5F85\u300C{names}\u300D\u8FDE\u63A5\u5E76\u6CE8\u518C\u5DE5\u5177\u2026\uFF08\u81EA\u52A8\u5237\u65B0\u4E2D\uFF0C\u65E0\u9700\u624B\u52A8\u70B9\u5237\u65B0\uFF09",
  mcpToolsPendingReg: "\u7B49\u5F85\u6CE8\u518C",
  mcpToolsPendingRegTip: "\u5DE5\u5177\u540D\u6765\u81EA\u5386\u53F2\u7F13\u5B58\uFF1A\u8FDB\u7A0B\u8FD8\u5728\u8FDE\u63A5\uFF0C\u6CE8\u518C\u5B8C\u6210\u540E\u6570\u91CF\u4F1A\u81EA\u52A8\u66F4\u65B0\u4E3A\u5B9E\u9645\u503C\u3002",
  // 全局一票否决（工具级）
  mcpToolGlobalOff: "\u5168\u5C40\u5DF2\u505C\u7528",
  mcpToolGlobalOffTip: "\u5168\u5C40\u5DF2\u505C\u7528\uFF1A\u8BE5\u5DE5\u5177\u5728\u300C\u5168\u90E8 Agent\u300D\u5C42\u88AB\u5173\u95ED \u2014\u2014 \u4E00\u7968\u5426\u51B3\uFF0C\u6240\u6709\u9884\u8BBE\u90FD\u4E0D\u53EF\u89C1\u3001\u4E0D\u53EF\u8C03\u7528\uFF08\u9884\u8BBE\u5C42\u4E0D\u53EF\u62E8\u52A8\uFF09\u3002\u5404\u9884\u8BBE\u539F\u6709\u7684\u4E2A\u6027\u5316\u8BBE\u7F6E\u5DF2\u4FDD\u7559\uFF0C\u5168\u5C40\u6062\u590D\u540E\u81EA\u52A8\u8FD8\u539F\u3002",
  // 一键全禁 / 全开
  mcpToolAllAria: "\u300C{name}\u300D\u7684\u5168\u90E8\u5DE5\u5177",
  mcpToolAllEnable: "\u5F00\u542F\u8BE5 MCP \u7684\u5168\u90E8\u5DE5\u5177",
  mcpToolAllDisable: "\u4E00\u952E\u7981\u7528\u8BE5 MCP \u7684\u5168\u90E8\u5DE5\u5177\uFF08\u53EA\u5173\u5DE5\u5177\uFF0C\u4FDD\u7559\u8FDE\u63A5\uFF09",
  mcpToolAllPartial: "\u90E8\u5206\u5DE5\u5177\u5DF2\u7981\u7528",
  // 遮蔽安装诊断
  mcpMaskInstallFailed: "\u906E\u853D\u672A\u5728\u8FD0\u884C\u671F\u751F\u6548\uFF1A{message}",
  mcpMaskNoAgent: "\u906E\u853D\u5DF2\u5199\u5165\uFF0C\u4F46\u8BE5\u9884\u8BBE\u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4F1A\u8BDD \u2014\u2014 \u65B0\u4F1A\u8BDD\u8D77\u751F\u6548\u3002",
  mcpMaskNoDeny: "\u906E\u853D\u5DF2\u5199\u5165\uFF0C\u4F46\u8FD0\u884C\u671F\u8FD8\u6CA1\u62D2\u5230\u4EFB\u4F55\u5DE5\u5177\uFF08\u8BE5 MCP \u53EF\u80FD\u5C1A\u672A\u6CE8\u518C\u5DE5\u5177\uFF09\u3002\u82E5\u5BF9\u8BDD\u91CC\u4ECD\u80FD\u770B\u5230\u5B83\u7684\u5DE5\u5177\uFF0C\u8BF7\u91CD\u5F00\u4F1A\u8BDD\u6216\u91CD\u542F DSH\u3002",
  mcpSearchServers: "\u641C\u7D22 Server \u540D\u79F0\u6216\u5DE5\u5177\u2026",
  mcpListFilteredEmpty: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684 Server",
  mcpToolsUnavailable: "\u5DE5\u5177\u4E0D\u53EF\u7528",
  // 工具级启停（卡片上的工具 chips）
  mcpToolsHint: "\u70B9\u51FB\u5DE5\u5177\u540D\u53EF\u5355\u72EC\u542F\u505C\uFF1A\u7EFF = \u542F\u7528\uFF0C\u7070 = \u7981\u7528\u3002",
  mcpToolChipsAria: "\u300C{name}\u300D\u63D0\u4F9B\u7684\u5DE5\u5177",
  mcpToolClickEnable: "\u70B9\u51FB\u542F\u7528\u8BE5\u5DE5\u5177",
  mcpToolClickDisable: "\u70B9\u51FB\u7981\u7528\u8BE5\u5DE5\u5177",
  mcpToolDisabledCount: "{n} \u4E2A\u5DE5\u5177\u5DF2\u7981\u7528",
  // 粘贴添加（JSON / DSH 原生 YAML）
  mcpPasteHint: "\u7C98\u8D34\u5176\u5B83 harness \u7684 JSON\uFF08.mcp.json \u7684 mcpServers \u6620\u5C04\uFF09\u6216 DSH \u539F\u751F YAML\uFF08\u4E5F\u63A5\u53D7 mcp-client \u884C\u7247\u6BB5\uFF09\uFF1B\u5199\u5165 {scope}\u3002",
  mcpPasteScopeGlobal: "\u5168\u5C40 profile patch\uFF08\u6240\u6709\u9884\u8BBE\u5171\u7528\uFF0C\u70ED\u91CD\u8F7D\u5373\u65F6\u751F\u6548\uFF09",
  mcpPasteScopePreset: "\u9884\u8BBE\u4E13\u5C5E",
  mcpPasteFormat: "\u7C98\u8D34\u683C\u5F0F",
  mcpPasteNative: "\u539F\u751F",
  mcpPasteParsed: "\u89E3\u6790\u51FA {n} \u4E2A server\uFF1A{names}",
  mcpPasteCheck: "\u6821\u9A8C\u5E76\u9884\u89C8",
  mcpPasteChecking: "\u6821\u9A8C\u4E2D\u2026",
  mcpPasteAdding: "\u5199\u5165\u4E2D\u2026",
  mcpPasteAdded: "\u5DF2\u6DFB\u52A0 {added} \u4E2A\uFF0C\u8DF3\u8FC7 {skipped} \u4E2A\u5DF2\u5B58\u5728",
  mcpPasteFailed: "\u6DFB\u52A0\u5931\u8D25",
  mcpRemoveConfirmTitle: "\u79FB\u9664 MCP Server",
  mcpRemoveConfirmMsg: "\u5C06\u4ECE cordis.patch.yml \u4E2D\u5220\u9664\u300C{name}\u300D\u6761\u76EE\uFF0C\u5176\u5DE5\u5177\u968F\u5373\u6CE8\u9500\u4E14\u4E0D\u53EF\u6062\u590D\uFF1B\u5982\u9700\u6062\u590D\u8BF7\u91CD\u65B0\u6DFB\u52A0\u3002",
  // 分组行 / 更多菜单 / 分页
  nameAsc: "\u5347\u5E8F",
  nameDesc: "\u964D\u5E8F",
  moreActions: "\u66F4\u591A\u64CD\u4F5C",
  // 空技能包 / 失效引用 / 操作反馈
  bundleEmptyTitle: "\u8FD9\u4E2A\u6280\u80FD\u5305\u8FD8\u662F\u7A7A\u7684",
  bundleEmptyHint: "\u4E0A\u4F20\u6280\u80FD\u65F6\u5728\u8FD9\u91CC\u9009\u5B83\u5F52\u7EC4\uFF0C\u6216\u4ECE\u6563\u88C5\u6280\u80FD\u5361\u7247\u70B9\u300C+\u300D\u5F52\u5165\u3002",
  bundleUploadHere: "\u4E0A\u4F20\u6280\u80FD\u5230\u6B64\u5305",
  bundleMissingN: "\u8D26\u672C\u91CC\u6709 {n} \u4E2A\u6280\u80FD\u5DF2\u4E0D\u5B58\u5728",
  bundlePrune: "\u6E05\u7406\u5931\u6548\u5F15\u7528",
  pruned: "\u5DF2\u6E05\u7406\u5931\u6548\u5F15\u7528",
  installedOk: "\u5DF2\u5B89\u88C5\u6280\u80FD\u300C{name}\u300D",
  deletedOk: "\u5DF2\u5220\u9664\u6280\u80FD\u300C{name}\u300D",
  removedOk: "\u5DF2\u4ECE\u6280\u80FD\u5305\u79FB\u51FA\u300C{name}\u300D",
  assignOk: "\u5DF2\u628A\u300C{name}\u300D\u5F52\u5165\u6280\u80FD\u5305",
  bundleCreated: "\u5DF2\u521B\u5EFA\u6280\u80FD\u5305\u300C{name}\u300D\uFF0C\u4E0A\u4F20\u6280\u80FD\u65F6\u53EF\u76F4\u63A5\u5F52\u5165\u5B83",
  bundleDeleted: "\u5DF2\u5220\u9664\u6280\u80FD\u5305\u300C{name}\u300D\uFF0C\u5176\u4E2D\u7684\u6280\u80FD\u53D8\u4E3A\u6563\u88C5",
  opFailed: "\u64CD\u4F5C\u5931\u8D25\uFF1A{label} \u2014 {message}",
  installNameRewrite: "SKILL.md \u91CC\u5199\u7684\u662F\u300C{meta}\u300D\uFF0C\u5B89\u88C5\u65F6\u4F1A\u7EDF\u4E00\u6539\u6210\u300C{name}\u300D\uFF08\u76EE\u5F55\u540D\u4E0E\u6280\u80FD\u540D\u4FDD\u6301\u4E00\u81F4\uFF09\u3002",
  deleteSkillDirNote: "\uFF08\u6280\u80FD\u76EE\u5F55\u300C{dir}\u300D\u4E0E\u6280\u80FD\u540D\u4E0D\u540C\uFF0C\u4F1A\u4E00\u5E76\u5220\u9664\uFF09",
  skillOffTag: "\u5DF2\u505C\u7528",
  originWorkspace: "\u5DE5\u4F5C\u533A",
  originGlobal: "\u5168\u5C40",
  originWorkspaceHint: "\u5F53\u524D\u5DE5\u4F5C\u533A\u4E13\u7528\uFF1A\u540C\u540D\u7684\u5168\u5C40\u6280\u80FD\u4F1A\u88AB\u5B83\u8986\u76D6\uFF1B\u5173\u6389\u53EA\u5F71\u54CD\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u3002",
  originGlobalHint: "\u5168\u5C40\u53EF\u7528\uFF1A\u6240\u6709\u5DE5\u4F5C\u533A\u90FD\u80FD\u770B\u5230\uFF1B\u5173\u6389\u5BF9\u6240\u6709\u5DE5\u4F5C\u533A\u751F\u6548\uFF08\u9664\u975E\u67D0\u5DE5\u4F5C\u533A\u6709\u540C\u540D\u6280\u80FD\uFF09\u3002",
  workspacePickerAria: "\u9009\u62E9\u8981\u914D\u7F6E\u7684\u5DE5\u4F5C\u533A",
  addScopeLabel: "\u6DFB\u52A0\u5230\u54EA\u91CC",
  addScopeGlobal: "\u5168\u5C40",
  addScopeWorkspace: "\u5F53\u524D\u5DE5\u4F5C\u533A",
  workspacePickerAuto: "\u8DDF\u968F\u5F53\u524D\u4F1A\u8BDD",
  mcpWorkspaceDisable: "\u672C\u5DE5\u4F5C\u533A\u5173\u95ED",
  mcpWorkspaceEnable: "\u672C\u5DE5\u4F5C\u533A\u542F\u7528",
  mcpWorkspaceDisableHint: "\u53EA\u5728\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u7684\u4F1A\u8BDD\u91CC\u4E0D\u6CE8\u5165\u5B83\u7684\u5DE5\u5177\uFF1B\u6362\u5230\u522B\u7684\u5DE5\u4F5C\u533A\u7167\u5E38\u6CE8\u5165\u3002",
  mcpWorkspaceEnableHint: "\u91CD\u65B0\u5728\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u6CE8\u5165\u5B83\u7684\u5DE5\u5177\u3002",
  mcpWorkspaceClosed: "\u672C\u5DE5\u4F5C\u533A\u5DF2\u5173",
  mcpWorkspaceClosedHint: "\u8BE5 Server \u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u88AB\u5173\u95ED\uFF1A\u8FD9\u91CC\u7684\u4F1A\u8BDD\u770B\u4E0D\u5230\u5B83\u7684\u5DE5\u5177\uFF0C\u5176\u5B83\u5DE5\u4F5C\u533A\u4E0D\u53D7\u5F71\u54CD\u3002",
  mcpWorkspaceToolLedgerRaw: "\u672C\u5DE5\u4F5C\u533A\u5DE5\u5177\u7981\u7528\u8D26\u672C\uFF08\u672A\u80FD\u5F52\u5230\u5F53\u524D Server \u5361\u7247\uFF0C\u6309\u670D\u52A1\u7AEF\u539F\u6837\u5217\u51FA\uFF09\uFF1A{names}",
  workspaceHint: "\u5F53\u524D\u7F16\u8F91\u5DE5\u4F5C\u533A\u300C{path}\u300D\uFF1A\u5F00\u5173\u53EA\u5728\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u751F\u6548\uFF0C\u5E76\u8986\u76D6\u540C\u540D\u7684\u9884\u8BBE/\u5168\u5C40\u8BBE\u7F6E\u3002",
  workspaceReset: "\u6E05\u7A7A\u8BE5\u5DE5\u4F5C\u533A\u7684\u5355\u72EC\u8BBE\u7F6E",
  presetCountTip: "\u8BE5\u9884\u8BBE\u4E0B\u5DF2\u542F\u7528 {n} \u4E2A / \u5171 {total} \u4E2A\u6280\u80FD"
};
function skillT(key, params) {
  let text = SKILL_ZH[key] ?? key;
  if (params) {
    for (const k of Object.keys(params)) text = text.split(`{${k}}`).join(String(params[k]));
  }
  return text;
}

// src/client/skills/McpAddModal.tsx
var import_react10 = require("react");
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/skills/mcp-state.ts
function mcpToggleTarget(level, scope, workspace) {
  if (level === "workspace") {
    if (workspace === null || workspace.trim() === "") return null;
    return { kind: "workspace", cwd: workspace };
  }
  return scope === "" ? { kind: "global" } : { kind: "mask", presetId: scope };
}
function mcpEffectiveEnabled(input) {
  return input.configDisabled !== true && input.masked !== true && input.workspaceClosed !== true;
}
function normalizeMcpFormatCapabilities(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return void 0;
  const raw = value;
  const result = {};
  if (Array.isArray(raw.formats)) {
    const formats = [...new Set(raw.formats.filter((item) => item === "json" || item === "yaml"))];
    if (formats.length > 0) result.formats = formats;
  }
  if (typeof raw.editable === "boolean") result.editable = raw.editable;
  if (typeof raw.convert === "boolean") result.convert = raw.convert;
  return Object.keys(result).length === 0 ? void 0 : result;
}
function detectMcpFormat(text) {
  const trimmed = text.trim();
  if (trimmed === "") return "json";
  return trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "yaml";
}
function mcpFormatOptions(capabilities, fallback) {
  const formats = capabilities?.formats;
  return formats !== void 0 && formats.length > 0 ? [...new Set(formats)] : [...new Set(fallback)];
}
function mcpEditFormatOptions(source, current2, capabilities) {
  if (source === void 0) return mcpFormatOptions(capabilities, ["json", "yaml"]);
  if (source === "global") return mcpFormatOptions(capabilities, [current2, current2 === "json" ? "yaml" : "json"]);
  return mcpFormatOptions(capabilities, ["json"]);
}
function workspaceDisabledToolsFor(ledger, cwd, serverName, tools) {
  if (cwd === null || cwd === "") return [];
  const grouped = ledger.byServer?.[cwd]?.[serverName];
  if (grouped !== void 0) return grouped;
  const owned = new Set(tools.map((tool) => tool.name));
  return (ledger.flat?.[cwd] ?? []).filter((name) => owned.has(name));
}
function ungroupedWorkspaceTools(ledger, cwd, attributed) {
  if (cwd === null || cwd === "") return [];
  if (ledger.byServer?.[cwd] !== void 0) return [];
  return (ledger.flat?.[cwd] ?? []).filter((name) => !attributed.has(name));
}

// src/client/skills/McpAddModal.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function McpPasteAdd({ t, presetId, onAdded, onCancel, workspace, editServer, editText, onEdited, editSource, editPreset, editWorkspace, editFormat, editCapabilities }) {
  const initialFormat = editServer !== void 0 ? editFormat ?? detectMcpFormat(editText ?? "") : "json";
  const [format, setFormat] = (0, import_react10.useState)(initialFormat);
  const formatOptions = mcpEditFormatOptions(
    editServer === void 0 ? void 0 : editSource,
    initialFormat,
    editCapabilities
  );
  const [text, setText] = (0, import_react10.useState)(editText ?? "");
  const [reload, setReload] = (0, import_react10.useState)(false);
  const [busy, setBusy] = (0, import_react10.useState)(null);
  const [preview, setPreview] = (0, import_react10.useState)(null);
  const [errors, setErrors] = (0, import_react10.useState)([]);
  const [warnings, setWarnings] = (0, import_react10.useState)([]);
  const [notice, setNotice] = (0, import_react10.useState)(null);
  const [scope, setScope] = (0, import_react10.useState)("global");
  const target = presetId === void 0 ? "global" : "preset";
  const placeholder = format === "json" ? '{ "mcpServers": { "my-server": { "command": "npx", "args": ["-y", "@scope/mcp-server"] } } }' : 'mcpServers:\n  my-server:\n    command: npx\n    args: ["-y", "@scope/mcp-server"]';
  const empty = text.trim() === "";
  const call = (path, payload) => fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload)
  }).then(async (response) => {
    const body = await response.json().catch(() => null);
    return body ?? { ok: false, error: `HTTP ${response.status}` };
  });
  const reset = () => {
    setErrors([]);
    setWarnings([]);
    setNotice(null);
    setPreview(null);
  };
  const switchFormat = (next) => {
    if (next === format) return;
    if (text.trim() === "") {
      setFormat(next);
      reset();
      return;
    }
    setBusy("preview");
    void call("/api/triad/mcp-format", { format, text, to: next }).then((body) => {
      if (body.ok === true && typeof body.text === "string") {
        setText(body.text);
        setFormat(next);
        reset();
      } else setErrors(Array.isArray(body.errors) ? body.errors : [String(body.error ?? "format convert failed")]);
    }).catch((error) => {
      setErrors([error instanceof Error ? error.message : String(error)]);
    }).finally(() => {
      setBusy(null);
    });
  };
  const previewNow = () => {
    if (busy !== null || empty) return;
    setBusy("preview");
    reset();
    void call("/api/triad/mcp-preview", { format, text, target }).then((body) => {
      const list = Array.isArray(body.errors) ? body.errors : [];
      setErrors(list);
      if (Array.isArray(body.warnings)) setWarnings(body.warnings);
      if (typeof body.yaml === "string") {
        const servers = Array.isArray(body.servers) ? body.servers : [];
        setPreview({ names: servers.map((item) => String(item.name ?? "")), yaml: body.yaml });
      }
      if (list.length === 0 && typeof body.error === "string") setErrors([body.error]);
    }).catch((error) => {
      setErrors([error instanceof Error ? error.message : String(error)]);
    }).finally(() => {
      setBusy(null);
    });
  };
  const addNow = () => {
    if (busy !== null || empty) return;
    setBusy("add");
    reset();
    if (editServer !== void 0) {
      const payload2 = editSource === "preset" ? { source: "preset", preset: editPreset, serverName: editServer, format, text, reload } : editSource === "workspace" ? { source: "workspace", workspace: editWorkspace, serverName: editServer, format, text, reload } : { serverName: editServer, format, text, reload };
      void call("/api/triad/mcp-edit", payload2).then((body) => {
        const list = Array.isArray(body.errors) ? body.errors : [];
        if (list.length > 0) {
          setErrors(list);
          return;
        }
        if (body.ok !== true) {
          setErrors([String(body.error ?? t("mcpPasteFailed"))]);
          return;
        }
        setNotice(t("mcpEditSaved"));
        onEdited?.();
      }).catch((error) => {
        setErrors([error instanceof Error ? error.message : String(error)]);
      }).finally(() => {
        setBusy(null);
      });
      return;
    }
    const path = presetId === void 0 ? "/api/triad/mcp-config" : `/api/triad/mcp-presets/${encodeURIComponent(presetId)}/servers`;
    const toWorkspace = presetId === void 0 && scope === "workspace" && typeof workspace === "string" && workspace !== "";
    const payload = presetId === void 0 ? { action: "add", format, text, ...toWorkspace ? { scope: "workspace", workspace } : {} } : { format, text };
    void call(path, payload).then((body) => {
      const list = Array.isArray(body.errors) ? body.errors : [];
      if (list.length > 0) {
        setErrors(list);
        if (Array.isArray(body.warnings)) setWarnings(body.warnings);
        return;
      }
      if (body.ok !== true) {
        setErrors([String(body.error ?? t("mcpPasteFailed"))]);
        return;
      }
      const added = Array.isArray(body.added) ? body.added : [];
      const skipped = Array.isArray(body.skipped) ? body.skipped : [];
      setNotice(t("mcpPasteAdded", { added: added.length, skipped: Array.isArray(skipped) ? skipped.length : Number(skipped) }));
      if (Array.isArray(body.warnings)) setWarnings(body.warnings);
      onAdded(added);
    }).catch((error) => {
      setErrors([error instanceof Error ? error.message : String(error)]);
    }).finally(() => {
      setBusy(null);
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: css.mcpAddForm, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: css.installHint, children: t("mcpPasteHint", { scope: presetId === void 0 ? t("mcpPasteScopeGlobal") : `${t("mcpPasteScopePreset")} \u201C${presetId}\u201D` }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: css.installRow, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: css.mcpAddTypeRow, role: "group", "aria-label": t("mcpPasteFormat"), children: formatOptions.map((value) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "button",
      {
        type: "button",
        className: `${css.mcpAddTypeBtn} ${format === value ? css.mcpAddTypeActive : ""}`,
        "data-active": format === value || void 0,
        "aria-pressed": format === value,
        onClick: () => {
          switchFormat(value);
        },
        children: [
          value.toUpperCase(),
          value === "yaml" ? ` \xB7 ${t("mcpPasteNative")}` : ""
        ]
      },
      value
    )) }) }),
    editServer === void 0 && presetId === void 0 && typeof workspace === "string" && workspace !== "" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: css.installRow, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: css.mcpAddTypeRow, role: "group", "aria-label": t("addScopeLabel"), children: ["global", "workspace"].map((value) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "button",
      {
        type: "button",
        className: `${css.mcpAddTypeBtn} ${scope === value ? css.mcpAddTypeActive : ""}`,
        "data-active": scope === value || void 0,
        "aria-pressed": scope === value,
        title: value === "workspace" ? workspace : void 0,
        onClick: () => {
          setScope(value);
          reset();
        },
        children: value === "global" ? t("addScopeGlobal") : t("addScopeWorkspace")
      },
      value
    )) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "textarea",
      {
        className: css.inlineInput,
        value: text,
        placeholder,
        "aria-label": t("mcpPasteFormat"),
        rows: 8,
        spellCheck: false,
        autoFocus: true,
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
          fontSize: 12,
          lineHeight: "18px",
          minHeight: 120,
          resize: "vertical",
          whiteSpace: "pre"
        },
        onChange: (event) => {
          setText(event.currentTarget.value);
          reset();
        }
      }
    ),
    errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: css.error, role: "alert", children: errors.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { children: item }, item)) }),
    warnings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: css.installHint, role: "status", children: warnings.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
      "\xB7 ",
      item
    ] }, item)) }),
    preview !== null && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: css.installHint, children: t("mcpPasteParsed", { n: preview.names.length, names: preview.names.join(", ") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { style: {
        margin: 0,
        maxHeight: 200,
        overflow: "auto",
        fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
        fontSize: 11,
        lineHeight: "16px",
        whiteSpace: "pre-wrap"
      }, children: preview.yaml })
    ] }),
    notice !== null && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: css.mcpCopyHint, role: "status", children: notice }),
    editServer !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, cursor: "pointer" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", checked: reload, onChange: (event) => setReload(event.currentTarget.checked) }),
      t("mcpEditReload")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: css.inlineForm, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "outline", type: "button", disabled: busy !== null || empty, onClick: previewNow, children: busy === "preview" ? t("mcpPasteChecking") : t("mcpPasteCheck") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "primary", type: "button", disabled: busy !== null || empty, onClick: addNow, children: busy === "add" ? t("mcpPasteAdding") : t("mcpAddConfirm") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "outline", type: "button", onClick: onCancel, children: t("cancel") })
    ] })
  ] });
}
function McpAddModal({ t, open, onClose, onAdded }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives3.Modal, { open, onClose, closeLabel: t("close"), title: t("mcpAddModalTitle"), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(McpPasteAdd, { t, onAdded, onCancel: onClose }) });
}

// src/client/skills/McpView.tsx
var import_react13 = require("react");
var import_dsh_client_ui_primitives5 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/confirm-dialog.tsx
var import_react11 = require("react");
var import_react_dom3 = require("react-dom");
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime6 = require("react/jsx-runtime");
var STYLE_ID4 = "dsh-prompt-customizer-confirm-dialog-styles";
var SHEET4 = `
/* \u2500\u2500 \u906E\u7F69\uFF1A\u56FA\u5B9A\u5168\u5C4F\uFF0C\u70B9\u51FB=\u53D6\u6D88 \u2500\u2500 */
.mcd-mask{position:fixed;inset:0;z-index:1200;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45))}
/* \u5C45\u4E2D\u5BB9\u5668\uFF1Aflex \u5B9A\u4F4D\uFF0C\u5361\u7247\u52A8\u753B\u7684 transform \u4E0D\u4E0E\u5176\u51B2\u7A81 */
.mcd-wrap{position:fixed;inset:0;z-index:1201;display:flex;align-items:center;justify-content:center;pointer-events:none}
/* \u2500\u2500 \u5361\u7247\uFF1A\u5B9E\u5E95\uFF08\u73BB\u7483\u6A21\u5F0F\u4E5F\u4E0D\u900F\uFF09\u3001\u5706\u89D2 14\u3001l3 \u6295\u5F71 \u2500\u2500 */
.mcd-card{
  pointer-events:auto;display:flex;flex-direction:column;
  width:min(420px,calc(100vw - 48px));max-height:calc(100vh - 96px);
  box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));
  border-radius:14px;
  box-shadow:var(--dsw-shadow-lv3,0 8px 40px rgba(0,0,0,.5));
  overflow:hidden}
/* \u5B9E\u5E95\uFF1A\u73BB\u7483\u8D28\u611F\u5F00\u542F\u65F6\u4E5F\u4FDD\u6301\u4E0D\u900F\u660E\u8868\u9762\uFF08\u540C popover-shell \u7684 data-solid \u89C4\u5219\uFF1A
   \u9759\u6001 token + html[data-dsh-glass] \u524D\u7F00\u538B\u8FC7 glass.ts \u7684 transparent \u89C4\u5219\uFF09 */
.mcd-card,html[data-dsh-glass] .mcd-card{
  background:var(--dsw-static-neutral-bluish-00,#fff);
  backdrop-filter:none;-webkit-backdrop-filter:none}
body[data-ds-dark-theme] .mcd-card,html[data-dsh-glass] body[data-ds-dark-theme] .mcd-card{
  background:var(--dsw-static-neutral-bluish-850,#2c2c2e)}
/* \u2500\u2500 \u5185\u5BB9 \u2500\u2500 */
.mcd-title{flex:none;padding:14px 18px 8px;font-size:15px;font-weight:600;line-height:22px;color:var(--dsw-alias-label-primary,#eee)}
.mcd-body{flex:none;min-height:0;padding:0 18px 16px;overflow-y:auto;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,#bbb);word-break:break-word}
.mcd-actions{flex:none;display:flex;justify-content:flex-end;gap:8px;padding:12px 14px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}
/* danger \u53D8\u4F53\uFF1A\u8B66\u793A\u7EA2\u786E\u8BA4\u6309\u94AE\uFF08outline \u5E95 + \u7EA2\u5B57\u7EA2\u6846\uFF0Chover \u52A0\u6DF1\uFF09 */
.mcd-btn-danger{
  border-color:var(--dsw-alias-state-error-primary,#e0434b)!important;
  color:var(--dsw-alias-state-error-primary,#e0434b)!important}
.mcd-btn-danger:hover{
  background:var(--dsw-alias-interactive-bg-hover-danger,rgba(224,67,75,.12))!important;
  border-color:var(--dsw-alias-state-error-primary,#e0434b)!important;
  color:var(--dsw-alias-state-error-primary,#e0434b)!important}
@media (prefers-reduced-motion:reduce){
  .mcd-mask,.mcd-card{animation:none!important}
}
`;
function ensureDialogStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID4) !== null) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID4;
  tag.dataset.plugin = "dsh-prompt-customizer";
  tag.textContent = SHEET4;
  document.head.appendChild(tag);
}
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onClose
}) {
  ensureModalAnimStyles();
  ensureDialogStyles();
  const { closing, requestClose } = useModalClose(open, onClose);
  (0, import_react11.useEffect)(() => {
    if (!open) return void 0;
    const onKey = (event) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, requestClose]);
  if (!open) return null;
  const handleConfirm = () => {
    onConfirm();
    requestClose();
  };
  const handleCancel = () => {
    requestClose();
  };
  return (0, import_react_dom3.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `mcd-mask ${modalMaskAnimClass(closing)}`, "aria-hidden": "true", onClick: handleCancel }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mcd-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `mcd-card ${modalAnimClass(closing)}`, role: "dialog", "aria-modal": "true", "aria-label": title, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mcd-title", children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mcd-body", children: message }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "mcd-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_dsh_client_ui_primitives4.Button, { variant: "outline", size: "sm", onClick: handleCancel, children: cancelLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            import_dsh_client_ui_primitives4.Button,
            {
              variant: danger ? "outline" : "primary",
              size: "sm",
              autoFocus: true,
              className: danger ? "mcd-btn-danger" : void 0,
              onClick: handleConfirm,
              children: confirmLabel
            }
          )
        ] })
      ] }) })
    ] }),
    document.body
  );
}

// src/client/skills/mcp-live.ts
var import_react12 = require("react");
var MCP_TOOL_WATCH_INTERVAL_MS = 2e3;
var MCP_TOOL_WATCH_TIMEOUT_MS = 15e4;
function mcpRegisteredToolCountOf(data, serverName) {
  let count = data.servers.find((server) => server.serverName === serverName)?.toolCount ?? 0;
  for (const rows of Object.values(data.presetServers ?? {})) {
    const row = rows.find((item) => item.serverName === serverName);
    if (row !== void 0) count = Math.max(count, row.registeredCount ?? 0);
  }
  return count;
}
function isToolRegistrationPending(registered, listed) {
  return registered === 0 && listed > 0;
}
function useMcpLiveState() {
  const [status, setStatus] = (0, import_react12.useState)({ state: "loading", data: null });
  const load = () => {
    setStatus((current2) => current2.state === "ready" ? current2 : { state: "loading", data: null });
    void fetch("/api/triad/mcp-status", { headers: { accept: "application/json" } }).then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    }).then((body) => {
      if (typeof body !== "object" || body === null || !Array.isArray(body.servers)) throw new Error("bad shape");
      const data = body;
      setStatus({ state: "ready", data });
    }).catch(() => {
      setStatus({ state: "unavailable", data: null });
    });
  };
  (0, import_react12.useEffect)(() => {
    load();
  }, []);
  return [status, load];
}

// src/client/skills/McpView.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function mcpToolNames(tools, disabledTools) {
  const known = new Set(tools.map((tool) => tool.name));
  return [...tools.map((tool) => tool.name), ...disabledTools.filter((name) => !known.has(name))];
}
function McpToolChips({ t, serverName, tools, disabledTools, locked, busy, onToggle }) {
  const names = mcpToolNames(tools, disabledTools);
  if (names.length === 0) return null;
  const off = new Set(disabledTools);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: css.mcpToolChips, role: "group", "aria-label": t("mcpToolChipsAria", { name: serverName }), children: names.map((name) => {
    const disabled = off.has(name);
    const isLocked = locked?.has(name) === true;
    const description = tools.find((tool) => tool.name === name)?.description ?? "";
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "button",
      {
        type: "button",
        className: css.mcpToolChip,
        "data-on": disabled ? void 0 : "true",
        "data-locked": isLocked || void 0,
        "data-busy": busy === name || void 0,
        disabled: busy !== null || isLocked,
        "aria-pressed": !disabled,
        title: isLocked ? `${t("mcpToolGlobalOffTip")}
${name}` : `${disabled ? t("mcpToolClickEnable") : t("mcpToolClickDisable")}
${name}${description === "" ? "" : `
${description}`}`,
        onClick: () => {
          onToggle(name, disabled);
        },
        children: [
          isLocked && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(LockGlyph, { size: 9 }),
          name
        ]
      },
      name
    );
  }) });
}
function McpView({ t, live, scope, query, status, onRefresh, waitingTools, onWatchTools, addOwnOpen, onCloseAddOwn, workspace, level }) {
  const [busy, setBusy] = (0, import_react13.useState)(null);
  const [error, setError] = (0, import_react13.useState)(null);
  const [globalOpen, setGlobalOpen] = (0, import_react13.useState)(true);
  const [ownOpen, setOwnOpen] = (0, import_react13.useState)(true);
  const [toolBusy, setToolBusy] = (0, import_react13.useState)(null);
  const [removeReq, setRemoveReq] = (0, import_react13.useState)(null);
  const [editState, setEditState] = (0, import_react13.useState)(null);
  const [wsNames, setWsNames] = (0, import_react13.useState)([]);
  const [removeOwnReq, setRemoveOwnReq] = (0, import_react13.useState)(null);
  (0, import_react13.useEffect)(() => {
    if (workspace === null || workspace === "") {
      setWsNames([]);
      return;
    }
    let alive = true;
    void fetch(`/api/triad/mcp-edit?source=workspace&workspace=${encodeURIComponent(workspace)}&serverName=`, { headers: { accept: "application/json" } }).then((response) => response.json()).then((body) => {
      const payload = body;
      if (alive && payload?.ok === true && Array.isArray(payload.names)) setWsNames(payload.names.map(String));
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [workspace]);
  const ready = live.state === "ready" ? live.data : null;
  const globals = ready?.servers ?? [];
  const closedInWorkspace = new Set(
    workspace === null ? [] : Object.entries(ready?.workspaceClosed?.[workspace] ?? {}).filter(([, on]) => on === false).map(([name]) => name)
  );
  const presets = ready?.presets ?? [];
  const scoped = scope === "" ? void 0 : presets.find((preset) => preset.id === scope);
  const masked = new Set(Object.entries(ready?.masks?.[scope] ?? {}).filter(([, on]) => on === false).map(([name]) => name));
  const ownRows = scope === "" ? [] : ready?.presetServers?.[scope] ?? [];
  const ownNames = new Set(ownRows.map((row) => row.serverName));
  const globalOff = ready?.toolDisabled ?? {};
  const presetTables = ready?.toolDisabledByPreset ?? {};
  const workspaceToolLedger = {
    byServer: ready?.workspaceToolDisabledByServer,
    flat: ready?.workspaceToolDisabled
  };
  const offOf = (serverName, owner, tools) => {
    const entry = presetTables[scope]?.[serverName];
    let base;
    if (owner === "own") base = entry?.own ?? [];
    else if (scope === "") base = globalOff[serverName] ?? [];
    else base = [.../* @__PURE__ */ new Set([...globalOff[serverName] ?? [], ...entry?.inherit ?? []])];
    if (level === "workspace") {
      base = [.../* @__PURE__ */ new Set([...base, ...workspaceDisabledToolsFor(workspaceToolLedger, workspace, serverName, tools)])];
    }
    return base;
  };
  const lockedOf = (serverName) => new Set(scope === "" ? [] : globalOff[serverName] ?? []);
  const maskInstall = ready?.maskInstall?.[scope];
  const maskWarn = (() => {
    if (scope === "" || masked.size === 0 || maskInstall === void 0) return null;
    if (maskInstall.errors.length > 0) return t("mcpMaskInstallFailed", { message: maskInstall.errors[0] });
    if (maskInstall.agents === 0) return t("mcpMaskNoAgent");
    if (maskInstall.deniedAgents === 0) return t("mcpMaskNoDeny");
    return null;
  })();
  const write = (token, url, payload) => {
    if (busy !== null) return;
    setBusy(token);
    setError(null);
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload)
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok === true) {
        onRefresh();
        return;
      }
      throw new Error(body?.error ?? String(response.status));
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      setBusy(null);
    });
  };
  const toggleGlobal = (serverName, disabled) => {
    write(`toggle:${serverName}`, "/api/triad/mcp-config", { serverName, disabled });
  };
  const toggleWorkspaceServer = (serverName, enabled) => {
    if (workspace === null) return;
    const token = `ws:${serverName}`;
    setBusy(token);
    setError(null);
    void fetch(`/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(workspace)}/servers/${encodeURIComponent(serverName)}`, {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ enabled })
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${String(response.status)}`);
      }
      onRefresh();
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      setBusy(null);
    });
  };
  const openEdit = (serverName, source = "global", extra) => {
    setError(null);
    const qs = new URLSearchParams({ source, serverName });
    if (extra?.preset !== void 0) qs.set("preset", extra.preset);
    if (extra?.workspace !== void 0) qs.set("workspace", extra.workspace);
    void fetch(`/api/triad/mcp-edit?${qs.toString()}`, { headers: { accept: "application/json" } }).then((response) => response.json()).then((body) => {
      const payload = body;
      if (payload?.ok === true) {
        const text = String(payload.text ?? "");
        const format = payload.format === "json" || payload.format === "yaml" ? payload.format : detectMcpFormat(text);
        setEditState({
          serverName,
          text,
          source,
          preset: extra?.preset,
          workspace: extra?.workspace,
          format,
          capabilities: normalizeMcpFormatCapabilities(payload.capabilities)
        });
      } else setError(String(payload?.error ?? "load mcp config failed"));
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    });
  };
  const removeGlobal = (serverName) => {
    write(`remove:${serverName}`, "/api/triad/mcp-config", { serverName, action: "remove" });
  };
  const setMasked = (serverName, enabled) => {
    if (busy !== null) return;
    setBusy(`mask:${serverName}`);
    setError(null);
    void fetch(`/api/triad/mcp-masks/${encodeURIComponent(scope)}/${encodeURIComponent(serverName)}`, {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ enabled })
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok === true) {
        onRefresh();
        return;
      }
      throw new Error(body?.error ?? String(response.status));
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      setBusy(null);
    });
  };
  const putTools = (serverName, names, enabled, source) => {
    if (names.length === 0 || toolBusy !== null || busy !== null) return;
    setToolBusy(names[0]);
    setError(null);
    void fetch(`/api/triad/mcp-tools/${encodeURIComponent(serverName)}`, {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ enabled, tools: names, ...scope === "" ? {} : { preset: scope, source } })
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok === true) {
        onRefresh();
        return;
      }
      throw new Error(body?.error ?? String(response.status));
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      setToolBusy(null);
    });
  };
  const toggleTool = (serverName, fullName, enabled, source) => {
    if (level === "workspace") {
      if (workspace === null) {
        setError("no active workspace");
        return;
      }
      if (toolBusy !== null || busy !== null) return;
      setToolBusy(fullName);
      setError(null);
      void fetch(`/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(workspace)}/tools`, {
        method: "PUT",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ name: fullName, enabled })
      }).then(async (response) => {
        const body = await response.json().catch(() => null);
        if (response.ok && body?.ok === true) {
          onRefresh();
          return;
        }
        throw new Error(body?.error ?? String(response.status));
      }).catch((cause) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      }).finally(() => {
        setToolBusy(null);
      });
      return;
    }
    putTools(serverName, [fullName], enabled, source);
  };
  const putWorkspaceTools = (names, enabled) => {
    if (names.length === 0 || toolBusy !== null || busy !== null) return;
    if (workspace === null) {
      setError("no active workspace");
      return;
    }
    setToolBusy(names[0]);
    setError(null);
    void (async () => {
      for (const name of names) {
        const response = await fetch(`/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(workspace)}/tools`, {
          method: "PUT",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ name, enabled })
        });
        const body = await response.json().catch(() => null);
        if (!(response.ok && body?.ok === true)) throw new Error(body?.error ?? String(response.status));
      }
      onRefresh();
    })().catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      setToolBusy(null);
    });
  };
  const removeOwn = (serverName) => {
    if (busy !== null) return;
    setBusy(`own:${serverName}`);
    setError(null);
    void fetch(`/api/triad/mcp-presets/${encodeURIComponent(scope)}/servers/${encodeURIComponent(serverName)}`, {
      method: "DELETE",
      headers: { accept: "application/json" }
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok === true) {
        onRefresh();
        return;
      }
      throw new Error(body?.error ?? String(response.status));
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      setBusy(null);
    });
  };
  const clearMasks = () => {
    if (busy !== null || masked.size === 0) return;
    setBusy("mask:__all__");
    setError(null);
    const names = [...masked];
    void (async () => {
      for (const serverName of names) {
        const response = await fetch(`/api/triad/mcp-masks/${encodeURIComponent(scope)}/${encodeURIComponent(serverName)}`, {
          method: "PUT",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ enabled: true })
        });
        const body = await response.json().catch(() => null);
        if (!(response.ok && body?.ok === true)) throw new Error(body?.error ?? String(response.status));
      }
      onRefresh();
    })().catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      setBusy(null);
    });
  };
  const target = mcpToggleTarget(level, scope, workspace);
  const globalRowEnabled = (server) => mcpEffectiveEnabled({
    configDisabled: server.config.disabled,
    masked: scope !== "" && masked.has(server.serverName),
    workspaceClosed: closedInWorkspace.has(server.serverName)
  });
  const ownRowEnabled = (row) => mcpEffectiveEnabled({ workspaceClosed: closedInWorkspace.has(row.serverName) });
  const statusMatch = (enabled) => status === "all" || (status === "on" ? enabled : !enabled);
  const needle = query.trim().toLowerCase();
  const shownGlobals = globals.filter((server) => (needle === "" || server.serverName.toLowerCase().includes(needle) || server.tools.some((tool) => tool.name.toLowerCase().includes(needle))) && statusMatch(globalRowEnabled(server)));
  const shownOwn = ownRows.filter((row) => needle === "" || row.serverName.toLowerCase().includes(needle) || row.summary.toLowerCase().includes(needle));
  const shownOwnFiltered = shownOwn.filter((row) => statusMatch(ownRowEnabled(row)));
  const attributedWorkspaceTools = /* @__PURE__ */ new Set();
  if (level === "workspace") {
    for (const server of globals) {
      for (const name of workspaceDisabledToolsFor(workspaceToolLedger, workspace, server.serverName, server.tools)) attributedWorkspaceTools.add(name);
    }
    for (const row of ownRows) {
      for (const name of workspaceDisabledToolsFor(workspaceToolLedger, workspace, row.serverName, row.tools ?? [])) attributedWorkspaceTools.add(name);
    }
  }
  const unattributedWorkspaceTools = level === "workspace" ? ungroupedWorkspaceTools(workspaceToolLedger, workspace, attributedWorkspaceTools) : [];
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: css.mcpServerMain, children: [
    editState !== null && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives5.Modal, { open: true, onClose: () => setEditState(null), closeLabel: t("close"), title: t("mcpEditTitle"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      McpPasteAdd,
      {
        t,
        onAdded: () => {
          setEditState(null);
          onRefresh();
        },
        onCancel: () => setEditState(null),
        editServer: editState.serverName,
        editText: editState.text,
        editSource: editState.source,
        editPreset: editState.preset,
        editWorkspace: editState.workspace,
        editFormat: editState.format,
        editCapabilities: editState.capabilities,
        onEdited: () => {
          setEditState(null);
          onRefresh();
        }
      },
      `${editState.source}:${editState.preset ?? ""}:${editState.workspace ?? ""}:${editState.serverName}`
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: css.hintRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.hintRowText, children: level === "workspace" ? t("mcpScopeHintWorkspace", { path: workspace ?? "" }) : scope === "" ? t("mcpScopeHintAll") : t("mcpScopeHintScoped", { name: scoped?.name ?? scope }) }),
      level === "preset" && scope !== "" && masked.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: css.presetReset, disabled: busy !== null, onClick: clearMasks, children: t("presetReset") })
    ] }),
    error !== null && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.error, role: "alert", children: t("mcpPresetFailed", { message: error }) }),
    maskWarn !== null && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.error, role: "alert", children: maskWarn }),
    unattributedWorkspaceTools.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, role: "status", children: t("mcpWorkspaceToolLedgerRaw", { names: unattributedWorkspaceTools.join("\u3001") }) }),
    waitingTools.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, role: "status", children: t("mcpWaitingTools", { names: waitingTools.join("\u3001") }) }),
    live.state === "unavailable" ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, children: t("mcpLiveUnavailable") }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: css.hubSection, "data-open": globalOpen ? "true" : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("header", { className: css.bundleRowOuter, "data-open": globalOpen ? "true" : void 0, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            type: "button",
            className: css.bundleRow,
            "aria-expanded": globalOpen,
            onClick: () => {
              setGlobalOpen((value) => !value);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.bundleIcon, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives5.IconArchiveOutlineRegular, { size: 16 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.bundleName, children: scope === "" ? t("mcpListTitle") : t("mcpPresetGlobalSection") }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.bundleCount, children: shownGlobals.length }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives5.IconChevronDownOutlineRegular, { className: css.chevron, size: 13, "aria-hidden": "true" })
            ]
          }
        ) }),
        globalOpen && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          scope !== "" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, children: t("mcpPresetMaskHint") }),
          shownGlobals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, children: globals.length === 0 ? t("mcpLiveEmpty") : t("mcpListFilteredEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: css.mcpRecGrid, children: shownGlobals.map((server) => {
            const isMasked = masked.has(server.serverName);
            const covered = ownNames.has(server.serverName);
            const offTools = offOf(server.serverName, "inherit", server.tools);
            const lockedTools = lockedOf(server.serverName);
            const listed = server.tools.length;
            const pendingReg = isToolRegistrationPending(server.toolCount, listed);
            const lockedCount = mcpToolNames(server.tools, offTools).filter((name) => lockedTools.has(name)).length;
            const workspaceClosed = closedInWorkspace.has(server.serverName);
            const switchOn = target === null ? false : target.kind === "workspace" ? !workspaceClosed : target.kind === "mask" ? !isMasked : !server.config.disabled;
            const switchDisabled = busy !== null || target === null || target.kind === "global" && !server.config.editable;
            const switchLabel = target === null ? t("mcpWorkspaceDisableHint") : target.kind === "workspace" ? workspaceClosed ? t("mcpWorkspaceEnable") : t("mcpWorkspaceDisable") : target.kind === "mask" ? isMasked ? t("enableSkill") : t("mcpPresetMasked") : t("mcpLiveDisabled");
            return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: css.mcpRecCard, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: css.mcpRecCardHead, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: css.mcpRecCardTitleRow, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCardName, children: server.serverName }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: css.mcpRecCardTags, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: css.mcpRecCatTag, children: [
                      server.toolCount > 0 ? server.toolCount : listed,
                      " ",
                      t("mcpLiveToolsOf")
                    ] }),
                    pendingReg && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, "data-off": "true", title: t("mcpToolsPendingRegTip"), children: t("mcpToolsPendingReg") }),
                    lockedCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: css.mcpRecCatTag, "data-locked": "true", title: t("mcpToolGlobalOffTip"), children: [
                      t("mcpToolGlobalOff"),
                      lockedCount > 1 ? ` ${lockedCount}` : ""
                    ] }),
                    offTools.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, "data-off": "true", children: t("mcpToolDisabledCount", { n: offTools.length }) }),
                    scope === "" ? server.config.disabled ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, children: t("mcpLiveDisabled") }) : null : isMasked ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, children: t("mcpPresetMasked") }) : null,
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.scopeTag, "data-scope": "global", title: t("originGlobalHint"), children: t("originGlobal") }),
                    closedInWorkspace.has(server.serverName) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.scopeTag, "data-scope": "workspace", "data-side": "closed", title: t("mcpWorkspaceClosedHint"), children: t("mcpWorkspaceClosed") })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  import_dsh_client_ui_primitives5.Tooltip,
                  {
                    label: target?.kind === "workspace" ? workspaceClosed ? t("mcpWorkspaceEnableHint") : t("mcpWorkspaceDisableHint") : target?.kind === "mask" && covered ? t("mcpPresetCoveredSwitchHint") : switchLabel,
                    side: "bottom",
                    delayMs: 500,
                    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "button",
                      {
                        type: "button",
                        role: "switch",
                        "aria-checked": switchOn,
                        "aria-label": switchLabel,
                        className: `${css.toggle} ${switchOn ? css.toggleOn : css.toggleOff}`,
                        disabled: switchDisabled,
                        onClick: () => {
                          if (target === null) return;
                          if (target.kind === "global") {
                            const nextDisabled = !server.config.disabled;
                            toggleGlobal(server.serverName, nextDisabled);
                            if (!nextDisabled) onWatchTools([server.serverName]);
                          } else if (target.kind === "mask") setMasked(server.serverName, isMasked);
                          else toggleWorkspaceServer(server.serverName, workspaceClosed);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.toggleKnob, "aria-hidden": "true" })
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpRecCardDesc, children: server.config.disabled && scope === "" && server.tools.length === 0 ? `${t("mcpLiveDisabled")} \xB7 ${t("mcpToolsUnavailable")}` : t("mcpToolsHint") }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                McpToolChips,
                {
                  t,
                  serverName: server.serverName,
                  tools: server.tools,
                  disabledTools: offTools,
                  locked: lockedTools,
                  busy: toolBusy,
                  onToggle: (fullName, enabled) => {
                    toggleTool(server.serverName, fullName, enabled, "inherit");
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: css.mcpCardFoot, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpCardItem, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpCardItemLabel, children: scope === "" ? t("mcpLiveConfigHint") : covered ? isMasked ? t("mcpPresetCoveredMasked") : t("mcpPresetCovered") : isMasked ? t("mcpPresetMasked") : t("mcpPresetMaskState") }) }),
                scope === "" && server.config.editable ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: css.mcpCardDelete, title: t("mcpEdit"), disabled: busy !== null, onClick: () => {
                  openEdit(server.serverName);
                }, children: t("mcpEdit") }) : null,
                scope === "" && !server.config.editable && workspace !== null && wsNames.includes(server.serverName) ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: css.mcpCardDelete, title: t("mcpEdit"), disabled: busy !== null, onClick: () => {
                  openEdit(server.serverName, "workspace", { workspace: workspace ?? void 0 });
                }, children: t("mcpEdit") }) : null,
                scope === "" && server.config.editable ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: css.mcpCardDelete,
                    title: t("mcpRemove"),
                    disabled: busy !== null,
                    onClick: () => {
                      setRemoveReq(server.serverName);
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives5.IconTrashOutlineRegular, { size: 13, "aria-hidden": "true" }),
                      t("mcpRemove")
                    ]
                  }
                ) : null
              ] })
            ] }, `global-${server.serverName}`);
          }) })
        ] })
      ] }),
      scope !== "" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: css.hubSection, "data-open": ownOpen ? "true" : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("header", { className: css.bundleRowOuter, "data-open": ownOpen ? "true" : void 0, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            type: "button",
            className: css.bundleRow,
            "aria-expanded": ownOpen,
            onClick: () => {
              setOwnOpen((value) => !value);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.bundleIcon, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives5.IconAgentPresetOutlineRegular, { size: 16 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.bundleName, children: t("mcpPresetOwnSection") }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.bundleCount, children: shownOwnFiltered.length }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives5.IconChevronDownOutlineRegular, { className: css.chevron, size: 13, "aria-hidden": "true" })
            ]
          }
        ) }),
        ownOpen && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, children: t("mcpPresetOwnHint") }),
          scoped?.trust === "system" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, children: t("mcpPresetStorageHint") }),
          shownOwnFiltered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpEmptyList, children: ownRows.length === 0 ? t("mcpPresetOwnEmpty") : t("mcpListFilteredEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: css.mcpRecGrid, children: shownOwnFiltered.map((row) => {
            const offOwn = offOf(row.serverName, "own", row.tools ?? []);
            const ownToolNames = (row.tools ?? []).map((tool) => tool.name);
            const allDisabled = ownToolNames.length > 0 && ownToolNames.every((name) => offOwn.includes(name));
            return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: css.mcpRecCard, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: css.mcpRecCardHead, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: css.mcpRecCardTitleRow, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCardName, children: row.serverName }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: css.mcpRecCardTags, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, children: row.transport }),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, children: row.registeredCount === void 0 ? t("mcpToolsUnknown") : `${row.registeredCount > 0 ? row.registeredCount : row.tools?.length ?? 0} ${t("mcpLiveToolsOf")}` }),
                    row.registeredCount !== void 0 && isToolRegistrationPending(row.registeredCount, row.tools?.length ?? 0) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, "data-off": "true", title: t("mcpToolsPendingRegTip"), children: t("mcpToolsPendingReg") }),
                    globals.some((item) => item.serverName === row.serverName) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, "data-shadow": "true", title: t("mcpPresetShadowGlobalTip"), children: t("mcpPresetShadowGlobalTag") }),
                    offOwn.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpRecCatTag, "data-off": "true", children: t("mcpToolDisabledCount", { n: offOwn.length }) })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  import_dsh_client_ui_primitives5.Tooltip,
                  {
                    label: ownToolNames.length === 0 ? t("mcpToolsPendingRegTip") : allDisabled ? t("mcpToolAllEnable") : offOwn.length > 0 ? `${t("mcpToolAllPartial")} \xB7 ${t("mcpToolAllDisable")}` : t("mcpToolAllDisable"),
                    side: "bottom",
                    delayMs: 400,
                    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "button",
                      {
                        type: "button",
                        role: "switch",
                        "aria-checked": !allDisabled,
                        "aria-label": t("mcpToolAllAria", { name: row.serverName }),
                        className: `${css.toggle} ${allDisabled ? css.toggleOff : css.toggleOn}`,
                        disabled: busy !== null || toolBusy !== null || ownToolNames.length === 0 || level === "workspace" && workspace === null,
                        onClick: () => {
                          if (level === "workspace") putWorkspaceTools(ownToolNames, allDisabled);
                          else putTools(row.serverName, ownToolNames, allDisabled, "own");
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.toggleKnob, "aria-hidden": "true" })
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: css.mcpRecCardDesc, children: row.summary }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                McpToolChips,
                {
                  t,
                  serverName: row.serverName,
                  tools: row.tools ?? [],
                  disabledTools: offOwn,
                  busy: toolBusy,
                  onToggle: (fullName, enabled) => {
                    toggleTool(row.serverName, fullName, enabled, "own");
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: css.mcpCardFoot, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpCardItem, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: css.mcpCardItemLabel, children: t("mcpPresetNewSession") }) }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: css.mcpCardDelete, title: t("mcpEdit"), disabled: busy !== null, onClick: () => {
                  openEdit(row.serverName, "preset", { preset: scope });
                }, children: t("mcpEdit") }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: css.mcpCardDelete,
                    disabled: busy !== null,
                    onClick: () => {
                      setRemoveOwnReq(row.serverName);
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives5.IconTrashOutlineRegular, { size: 13, "aria-hidden": "true" }),
                      t("mcpRemove")
                    ]
                  }
                )
              ] })
            ] }, `own-${row.serverName}`);
          }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      import_dsh_client_ui_primitives5.Modal,
      {
        open: addOwnOpen,
        onClose: onCloseAddOwn,
        closeLabel: t("close"),
        title: `${t("mcpPresetAddOwn")} \xB7 ${scoped?.name ?? scope}`,
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          McpPasteAdd,
          {
            t,
            presetId: scope,
            workspace,
            onAdded: (added) => {
              onRefresh();
              onWatchTools(added);
            },
            onCancel: onCloseAddOwn
          }
        )
      }
    ),
    removeReq !== null && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      ConfirmDialog,
      {
        open: true,
        title: t("mcpRemoveConfirmTitle"),
        message: t("mcpRemoveConfirmMsg", { name: removeReq }),
        confirmLabel: t("mcpRemove"),
        cancelLabel: t("cancel"),
        danger: true,
        onConfirm: () => {
          const name = removeReq;
          setRemoveReq(null);
          removeGlobal(name);
        },
        onClose: () => {
          setRemoveReq(null);
        }
      }
    ),
    removeOwnReq !== null && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      ConfirmDialog,
      {
        open: true,
        title: t("mcpOwnRemoveConfirmTitle"),
        message: t("mcpOwnRemoveConfirmMsg", { name: removeOwnReq }),
        confirmLabel: t("mcpRemove"),
        cancelLabel: t("cancel"),
        danger: true,
        onConfirm: () => {
          const name = removeOwnReq;
          setRemoveOwnReq(null);
          removeOwn(name);
        },
        onClose: () => {
          setRemoveOwnReq(null);
        }
      }
    )
  ] });
}

// src/client/skills/SkillCard.tsx
var import_react14 = require("react");
var import_dsh_client_ui_primitives6 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime8 = require("react/jsx-runtime");
function CategoryEditor({ value, onChange, label, suggestions = [] }) {
  const [draft, setDraft] = (0, import_react14.useState)("");
  const full = value.length >= MAX_BUNDLE_CATEGORIES;
  const suggestionsLeft = suggestions.filter((preset) => !value.includes(preset));
  const add = (raw) => {
    const name = raw.trim().slice(0, 24);
    setDraft("");
    if (name === "" || value.includes(name) || full) return;
    onChange([...value, name]);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: css.catEditor, children: [
    value.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: css.catEmpty, children: skillT("bundleCatEmptyHint") }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("ul", { className: css.catSelected, "aria-label": label, children: value.map((name) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { className: css.catSelectedTag, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: css.catSelectedName, children: name }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          type: "button",
          className: css.catRemove,
          "aria-label": skillT("bundleCatRemove", { name }),
          onClick: () => {
            onChange(value.filter((item) => item !== name));
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.IconCloseOutlineRegular, { size: 11, "aria-hidden": "true" })
        }
      )
    ] }, name)) }),
    suggestionsLeft.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: css.catSuggest, role: "group", "aria-label": skillT("bundleCatTitle"), children: suggestionsLeft.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      "button",
      {
        type: "button",
        className: css.catPreset,
        disabled: full,
        title: skillT("bundleCatAddPreset", { name: preset }),
        onClick: () => {
          add(preset);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: css.catPresetPlus, "aria-hidden": "true", children: "+" }),
          preset
        ]
      },
      preset
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      "input",
      {
        className: css.catInput,
        value: draft,
        placeholder: skillT("bundleCatPlaceholder"),
        "aria-label": skillT("bundleCatCustom"),
        disabled: full,
        onChange: (event) => {
          setDraft(event.currentTarget.value);
        },
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add(draft);
          }
        }
      }
    ),
    full && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: css.catLimit, children: skillT("bundleCatLimit", { n: MAX_BUNDLE_CATEGORIES }) })
  ] });
}
function SkillCard({ skill, bundleId, bundleName, enabled, lockedReason, scopeLabel, index, onToggle, onView, onAssign, onRemove, onDelete }) {
  const files = Array.isArray(skill.files) ? skill.files : [];
  const description = skill.description ?? "";
  const [copied, setCopied] = (0, import_react14.useState)(false);
  const copiedTimer = (0, import_react14.useRef)(null);
  (0, import_react14.useEffect)(() => () => {
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
  }, []);
  const flashCopied = () => {
    setCopied(true);
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => {
      setCopied(false);
    }, 1200);
  };
  const copyName = () => {
    const fallback = () => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = skill.name;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
      }
    };
    try {
      if (navigator.clipboard !== void 0) {
        void navigator.clipboard.writeText(skill.name).then(flashCopied, () => {
          fallback();
          flashCopied();
        });
      } else {
        fallback();
        flashCopied();
      }
    } catch {
      fallback();
      flashCopied();
    }
  };
  const toggleLabel = lockedReason ?? (enabled ? skillT("disableSkill") : skillT("enableSkill"));
  const fileMeta = typeof skill.fileCount === "number" ? skill.fileCount : files.length;
  const skillOrigin = skillOriginOf(skill);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    "li",
    {
      className: css.skillCard,
      "data-off": enabled ? void 0 : "true",
      style: { "--skm-i": index },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: css.skillCardHead, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: css.skillBadge, "aria-hidden": "true", children: "skill" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              className: css.skillTitle,
              title: skill.name,
              onClick: () => {
                onView(skill);
              },
              children: skill.name
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: css.skillCardToggle, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              role: "switch",
              "aria-checked": enabled,
              "aria-label": toggleLabel,
              title: toggleLabel,
              className: `${css.toggle} ${enabled ? css.toggleOn : css.toggleOff}`,
              disabled: lockedReason !== void 0,
              onClick: (event) => {
                event.stopPropagation();
                onToggle(skill, !enabled);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: css.toggleKnob, "aria-hidden": "true" })
            }
          ) })
        ] }),
        description !== "" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: css.skillDesc, title: description, onClick: () => {
          onView(skill);
        }, children: description }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: css.skillTags, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `${css.tag} ${css.tagSource}`, children: bundleName ?? skillT("tagLoose") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `${css.tag} ${css.tagScope}`, "data-off": enabled ? void 0 : "true", children: scopeLabel }),
          skillOrigin !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "span",
            {
              className: css.scopeTag,
              "data-scope": skillOrigin.kind === "unknown" ? "other" : skillOrigin.kind,
              title: skillOrigin.kind === "workspace" ? skillT("originWorkspaceHint") : skillOrigin.kind === "global" ? skillT("originGlobalHint") : skillOrigin.label,
              children: skillOrigin.kind === "workspace" ? skillT("originWorkspace") : skillOrigin.kind === "global" ? skillT("originGlobal") : skillOrigin.label
            }
          ),
          !enabled && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `${css.tag} ${css.tagStatus}`, children: skillT("skillOffTag") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: css.skillMeta, children: skillT("fileCount", { n: fileMeta }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: css.skillCardFoot, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: css.skillFootLabel, children: skillT("toolsLabel") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: css.skillCardActions, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.Tooltip, { label: skillT("copySkillName"), side: "bottom", delayMs: 500, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                type: "button",
                className: css.skillFootIcon,
                "data-copied": copied ? "true" : void 0,
                "aria-label": copied ? skillT("copiedSkillName") : skillT("copySkillName"),
                title: copied ? skillT("copiedSkillName") : skillT("copySkillName"),
                onClick: copyName,
                children: copied ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(CheckIcon, {}) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(CopyIcon, {})
              }
            ) }),
            bundleId !== null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.Tooltip, { label: skillT("removeSkill"), side: "bottom", delayMs: 500, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                type: "button",
                className: css.skillFootIcon,
                "aria-label": skillT("removeSkill"),
                title: skillT("removeSkill"),
                onClick: () => {
                  onRemove?.(skill);
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.IconCloseOutlineRegular, { size: 14, "aria-hidden": "true" })
              }
            ) }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.Tooltip, { label: skillT("assignToBundle"), side: "bottom", delayMs: 500, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                type: "button",
                className: css.skillFootIcon,
                "aria-label": skillT("assignToBundle"),
                title: skillT("assignToBundle"),
                onClick: () => {
                  onAssign?.(skill);
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.IconPlusOutlineRegular, { size: 14, "aria-hidden": "true" })
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.Tooltip, { label: skillT("deleteSkillBtn"), side: "bottom", delayMs: 500, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                type: "button",
                className: `${css.skillFootIcon} ${css.skillFootIconDanger}`,
                "aria-label": skillT("deleteSkillBtn"),
                title: skillT("deleteSkillBtn"),
                onClick: () => {
                  onDelete?.(skill);
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_dsh_client_ui_primitives6.IconTrashOutlineRegular, { size: 14, "aria-hidden": "true" })
              }
            ) })
          ] })
        ] })
      ]
    }
  );
}

// src/client/skills/SkillViewer.tsx
var import_dsh_client_ui_primitives7 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/skills/markdown.ts
function escapeHtml(s2) {
  return String(s2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inlineMd(s2) {
  return escapeHtml(s2).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}
function renderSkillMarkdown(text) {
  const body = String(text).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const lines = body.split("\n");
  let html = "";
  let inCode = false;
  let codeBuf = [];
  let inList = false;
  let inQuote = false;
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      html += "</blockquote>";
      inQuote = false;
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (inCode) {
        html += "<pre>" + escapeHtml(codeBuf.join("\n")) + "</pre>";
        codeBuf = [];
        inCode = false;
      } else {
        closeList();
        closeQuote();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (trimmed === "---" || trimmed === "***") {
      closeList();
      closeQuote();
      html += "<hr>";
      continue;
    }
    if (trimmed.startsWith(">")) {
      if (!inQuote) {
        closeList();
        html += "<blockquote>";
        inQuote = true;
      }
      html += "<p>" + inlineMd(trimmed.replace(/^>\s?/, "")) + "</p>";
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading !== null) {
      closeList();
      closeQuote();
      const level = Math.min(heading[1].length, 6);
      html += `<h${String(level)}>` + inlineMd(heading[2]) + `</h${String(level)}>`;
      continue;
    }
    const item = /^[-*]\s+(.*)$/.exec(trimmed);
    if (item !== null) {
      if (!inList) {
        closeQuote();
        html += "<ul>";
        inList = true;
      }
      html += "<li>" + inlineMd(item[1]) + "</li>";
      continue;
    }
    closeList();
    closeQuote();
    if (trimmed === "") {
      html += "<p></p>";
      continue;
    }
    html += "<p>" + inlineMd(trimmed) + "</p>";
  }
  closeList();
  closeQuote();
  if (inCode) html += "<pre>" + escapeHtml(codeBuf.join("\n")) + "</pre>";
  return html;
}

// src/client/skills/SkillViewer.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var VIEWER_FONT_SIZES = [13.5, 15, 17];
var VIEWER_PREF_KEY = "dsh.triad.skillViewer";
var VIEWER_FONT_LABELS = ["\u5C0F\u5B57\u53F7", "\u6807\u51C6\u5B57\u53F7", "\u5927\u5B57\u53F7"];
function readViewerPrefs() {
  try {
    const raw = localStorage.getItem(VIEWER_PREF_KEY);
    if (typeof raw !== "string" || raw === "") return { font: 1, full: false };
    const parsed = JSON.parse(raw);
    const font = typeof parsed.font === "number" && parsed.font >= 0 && parsed.font < VIEWER_FONT_SIZES.length ? Math.trunc(parsed.font) : 1;
    return { font, full: parsed.full === true };
  } catch {
    return { font: 1, full: false };
  }
}
function writeViewerPrefs(prefs) {
  try {
    localStorage.setItem(VIEWER_PREF_KEY, JSON.stringify(prefs));
  } catch {
  }
}
function ViewerExpandIcon({ full }) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: full ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M6.2 2.2v4h-4M9.8 2.2v4h4M6.2 13.8v-4h-4M9.8 13.8v-4h4" }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M2.2 6.2v-4h4M13.8 6.2v-4h-4M2.2 9.8v4h4M13.8 9.8v4h-4" }) });
}
function skillFileRows(files) {
  const rows = [];
  const seenDirs = /* @__PURE__ */ new Set();
  for (const path of files) {
    const parts = path.split("/");
    let dirPath = "";
    for (let i = 0; i < parts.length - 1; i += 1) {
      dirPath = dirPath === "" ? parts[i] : dirPath + "/" + parts[i];
      if (!seenDirs.has(dirPath)) {
        seenDirs.add(dirPath);
        rows.push({ kind: "dir", path: dirPath + "/", depth: i, main: false });
      }
    }
    rows.push({ kind: "file", path, depth: parts.length - 1, main: path === "SKILL.md" });
  }
  return rows;
}
function SkillViewer({
  t,
  viewer,
  viewerFont,
  viewerFull,
  onFontLevel,
  onToggleFull,
  onSelectFile,
  onClose
}) {
  if (viewer === null) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    import_dsh_client_ui_primitives7.Modal,
    {
      open: true,
      onClose: () => {
        onClose();
      },
      closeLabel: t("close"),
      title: viewer.skill.name + (viewer.file === "SKILL.md" ? "" : " \xB7 " + viewer.file),
      className: css.viewerModal + (viewerFull ? " " + css.viewerModalFull : ""),
      contentClassName: css.viewerBody,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: css.viewerToolbar, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: css.viewerPath, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("b", { children: viewer.file }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: t("viewerFilesCount", { n: Array.isArray(viewer.skill.files) ? viewer.skill.files.length : 0 }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: css.viewerToolGroup, role: "group", "aria-label": t("viewerFont"), children: VIEWER_FONT_SIZES.map((size, level) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "button",
            {
              type: "button",
              className: css.viewerToolBtn + (level === 0 ? " " + css.viewerToolBtnA1 : level === 2 ? " " + css.viewerToolBtnA3 : ""),
              "data-active": viewerFont === level ? "true" : void 0,
              title: VIEWER_FONT_LABELS[level],
              "aria-label": VIEWER_FONT_LABELS[level],
              "aria-pressed": viewerFont === level,
              onClick: () => {
                onFontLevel(level);
              },
              children: "A"
            },
            size
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "button",
            {
              type: "button",
              className: css.viewerToolBtn + " " + css.viewerToolBtnFrame,
              "data-active": viewerFull ? "true" : void 0,
              title: viewerFull ? t("viewerExitFull") : t("viewerFull"),
              "aria-label": viewerFull ? t("viewerExitFull") : t("viewerFull"),
              "aria-pressed": viewerFull,
              onClick: onToggleFull,
              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ViewerExpandIcon, { full: viewerFull })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: css.viewerLayout, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("nav", { className: css.viewerNav, "aria-label": t("viewerNav"), children: skillFileRows(Array.isArray(viewer.skill.files) ? viewer.skill.files : []).map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
            "div",
            {
              className: css.viewerNavItem + (row.kind === "dir" ? " " + css.viewerNavDir : ""),
              "data-active": row.kind === "file" && row.path === viewer.file ? "true" : void 0,
              "data-dir": row.kind === "dir" ? "true" : void 0,
              style: { paddingLeft: 8 + row.depth * 14 },
              title: row.path,
              onClick: row.kind === "file" ? () => {
                onSelectFile(row.path);
              } : void 0,
              children: [
                row.kind === "dir" ? "\u{1F4C1} " : "\u{1F4C4} ",
                row.path
              ]
            },
            row.path + "-" + String(index)
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: css.viewerContent, style: { "--skm-vfs": `${String(VIEWER_FONT_SIZES[viewerFont])}px` }, children: viewer.loading === true ? t("previewLoading") : viewer.error !== void 0 ? viewer.error : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { dangerouslySetInnerHTML: { __html: renderSkillMarkdown(viewer.content ?? "") } }) })
        ] })
      ]
    }
  );
}

// src/client/skills/SkillsView.tsx
var import_dsh_client_ui_primitives8 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime10 = require("react/jsx-runtime");
function SkillsView({
  t,
  state,
  health,
  scope,
  scopeOverrideCount,
  presets,
  onResetScope,
  openMenu,
  setOpenMenu,
  refresh,
  noResults,
  visibleBundleAll,
  expanded,
  renameTarget,
  setRenameTarget,
  renaming,
  submitRename,
  bundleEnabledIn,
  toggling,
  setCatFilter,
  activeCat,
  toggleExpanded,
  renamedFlash,
  openInstallFor,
  skillEnabledIn,
  skillLockedReason,
  scopeLabel,
  toggleSkill,
  toggleBundle,
  openViewer,
  removeFromBundle,
  pruneBundle,
  openCatEditor,
  setConfirm,
  setAssignTarget,
  looseOpen,
  setLooseExpanded,
  visibleLooseAll
}) {
  const showReset = scopeOverrideCount > 0 && (scope.level === "workspace" ? scope.cwd !== null : scope.presetId !== ALL_PRESETS);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
    health.state === "issue" && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: css.healthNotice, role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.healthNoticeTitle, children: t("statIssues", { n: health.report.issues.length }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ul", { children: health.report.issues.slice(0, 4).map((issue, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("li", { children: issue.message }, `${issue.code}-${String(index)}`)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: css.hintRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.hintRowText, children: scope.level === "workspace" ? t("workspaceHint", { path: scope.cwd ?? "" }) : scope.presetId === ALL_PRESETS ? t("presetHintAll") : t("presetHintScoped", { name: presets.find((preset) => preset.id === scope.presetId)?.name ?? scope.presetId }) }),
      showReset && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: css.presetReset, onClick: () => {
        onResetScope(scope);
      }, children: scope.level === "workspace" ? t("workspaceReset") : t("presetReset") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: `${css.mainScroll} ${modalStaggerClass}`, children: [
      state.status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: css.status, children: t("loading") }) : null,
      state.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: css.failure, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "alert", children: t("error") }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_dsh_client_ui_primitives8.Button, { variant: "outline", onClick: refresh, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconRefreshOutlineRegular, { size: 14 }),
          " ",
          t("retry")
        ] })
      ] }) : null,
      state.status === "ready" && (noResults ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: css.noResult, children: t("noMatch") }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
        visibleBundleAll.map((bundle) => {
          const open2 = expanded.has(bundle.id);
          const renamingThis = renameTarget?.bundleId === bundle.id;
          const bundleEnabled = bundleEnabledIn(bundle);
          const bundleToggling = toggling.has(`bundle:${bundle.id}`);
          const missing = bundle.missingSkills ?? [];
          const bundleCats = bundle.categories ?? [];
          const emptyBundle = bundle.skillCount === 0;
          const openView = open2 || emptyBundle;
          return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: css.hubSection, "data-open": openView ? "true" : void 0, "data-empty": emptyBundle ? "true" : void 0, children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
              "header",
              {
                className: css.bundleRowOuter,
                "data-open": openView ? "true" : void 0,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                    "button",
                    {
                      type: "button",
                      className: css.bundleRow,
                      "aria-expanded": openView,
                      onClick: (event) => {
                        const hit = event.target.closest("[data-skm-cat]");
                        if (hit !== null) {
                          const cat = hit.dataset.skmCat ?? "";
                          setCatFilter(activeCat === cat ? null : cat);
                          return;
                        }
                        toggleExpanded(bundle.id);
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleIcon, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FolderBlueIcon, { size: 17 }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleName, title: bundle.name, children: bundle.name }),
                        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleCount, children: t("skillsCount", { n: bundle.skillCount }) }),
                        bundleCats.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleCats, children: bundleCats.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                          "span",
                          {
                            className: css.bundleCatTag,
                            "data-skm-cat": cat,
                            "data-active": activeCat === cat || void 0,
                            title: t("bundleCatTip", { name: cat }),
                            children: cat
                          },
                          cat
                        )) }),
                        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconChevronDownOutlineRegular, { className: css.chevron, size: 13, "aria-hidden": "true" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleToggle, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    "button",
                    {
                      type: "button",
                      role: "switch",
                      "aria-checked": bundleEnabled,
                      "aria-label": bundleEnabled ? t("disableBundle") : t("enableBundle"),
                      title: bundleEnabled ? t("disableBundle") : t("enableBundle"),
                      className: `${css.toggle} ${bundleEnabled ? css.toggleOn : css.toggleOff}`,
                      disabled: bundleToggling || bundle.skillCount === 0,
                      onClick: (event) => {
                        event.stopPropagation();
                        toggleBundle(bundle, !bundleEnabled);
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.toggleKnob, "aria-hidden": "true" })
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: css.bundleMore, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    import_dsh_client_ui_primitives8.Menu,
                    {
                      open: openMenu === `bundle:${bundle.id}`,
                      onClose: () => {
                        setOpenMenu(null);
                      },
                      onSelect: (id) => {
                        setOpenMenu(null);
                        if (id === "enable") toggleBundle(bundle, true);
                        else if (id === "disable") toggleBundle(bundle, false);
                        else if (id === "rename") setRenameTarget({ bundleId: bundle.id, name: bundle.name });
                        else if (id === "cat") openCatEditor(bundle);
                        else if (id === "delete") setConfirm({ kind: "bundle", bundle });
                      },
                      portal: true,
                      items: [
                        { id: "enable", label: t("enableBundle"), icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconCheckOutlineRegular, { size: 14 }) },
                        { id: "disable", label: t("disableBundle"), icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconCloseOutlineRegular, { size: 14 }) },
                        { type: "separator", id: "gap" },
                        { id: "rename", label: t("rename"), icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconEditOutlineRegular, { size: 14 }) },
                        { id: "cat", label: t("bundleCatEdit"), icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(TagIcon, {}) },
                        { id: "delete", label: t("delete"), icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconTrashOutlineRegular, { size: 14 }), danger: true }
                      ],
                      anchor: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                        "button",
                        {
                          type: "button",
                          className: css.bundleMoreBtn,
                          "aria-label": t("moreActions"),
                          "aria-haspopup": "menu",
                          "aria-expanded": openMenu === `bundle:${bundle.id}` || void 0,
                          onClick: (event) => {
                            event.stopPropagation();
                            setOpenMenu(openMenu === `bundle:${bundle.id}` ? null : `bundle:${bundle.id}`);
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconEllipsisOutlineRegular, { size: 15, "aria-hidden": "true" })
                        }
                      )
                    }
                  ) })
                ]
              }
            ),
            renamingThis && renameTarget !== null && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("form", { className: `${css.inlineForm} ${css.inlineFormBlock}`, onSubmit: (event) => {
              void submitRename(event);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "input",
                {
                  className: css.inlineInput,
                  value: renameTarget.name,
                  placeholder: t("renameBundlePlaceholder"),
                  "aria-label": t("renameBundlePlaceholder"),
                  autoFocus: true,
                  disabled: renaming,
                  onChange: (event) => {
                    const next = event.currentTarget.value;
                    setRenameTarget((current2) => current2 === null ? current2 : { ...current2, name: next });
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.Button, { variant: "primary", type: "submit", disabled: renaming || renameTarget.name.trim() === "", children: t("rename") }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.Button, { variant: "outline", type: "button", disabled: renaming, onClick: () => {
                setRenameTarget(null);
              }, children: t("cancel") })
            ] }),
            missing.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: css.bundleMissing, role: "status", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: t("bundleMissingN", { n: missing.length }) }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("code", { children: missing.join("\u3001") }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: css.bundleMissingBtn, onClick: () => {
                void pruneBundle(bundle);
              }, children: t("bundlePrune") })
            ] }),
            openView && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ul", { className: css.skillGrid, "data-renamed": renamedFlash === bundle.id ? "true" : void 0, children: bundle.skills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { className: css.bundleEmpty, children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleEmptyTitle, children: t("bundleEmptyTitle") }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleEmptyHint, children: t("bundleEmptyHint") }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { type: "button", className: css.bundleEmptyBtn, onClick: () => {
                openInstallFor(bundle.id);
              }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(CloudUpIcon, { size: 14 }),
                t("bundleUploadHere")
              ] })
            ] }) : bundle.skills.map((skill, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              SkillCard,
              {
                skill,
                bundleId: bundle.id,
                bundleName: bundle.name,
                enabled: skillEnabledIn(skill.name),
                lockedReason: skillLockedReason(skill.name),
                scopeLabel,
                index,
                onToggle: toggleSkill,
                onView: openViewer,
                onRemove: (s2) => {
                  void removeFromBundle(bundle.id, s2.name);
                },
                onDelete: (s2) => {
                  setConfirm({ kind: "skill", name: s2.name, dir: s2.dir });
                }
              },
              skill.name
            )) })
          ] }, bundle.id);
        }),
        visibleLooseAll.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: css.hubSection, "data-open": looseOpen ? "true" : void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "header",
            {
              className: css.bundleRowOuter,
              "data-open": looseOpen ? "true" : void 0,
              children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                "button",
                {
                  type: "button",
                  className: css.bundleRow,
                  "aria-expanded": looseOpen,
                  onClick: () => {
                    setLooseExpanded((value) => !value);
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleIcon, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconArchiveOutlineRegular, { size: 16 }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleName, children: t("looseTitle") }),
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: css.bundleCount, children: t("skillsCount", { n: visibleLooseAll.length }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_dsh_client_ui_primitives8.IconChevronDownOutlineRegular, { className: css.chevron, size: 13, "aria-hidden": "true" })
                  ]
                }
              )
            }
          ),
          looseOpen && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ul", { className: css.skillGrid, children: visibleLooseAll.map((skill, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            SkillCard,
            {
              skill,
              bundleId: null,
              bundleName: null,
              enabled: skillEnabledIn(skill.name),
              lockedReason: skillLockedReason(skill.name),
              scopeLabel,
              index,
              onToggle: toggleSkill,
              onView: openViewer,
              onAssign: (s2) => {
                setAssignTarget(s2);
              },
              onDelete: (s2) => {
                setConfirm({ kind: "skill", name: s2.name, dir: s2.dir });
              }
            },
            skill.name
          )) })
        ] })
      ] }))
    ] })
  ] });
}

// src/client/skills/TopBar.tsx
var import_dsh_client_ui_primitives9 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime11 = require("react/jsx-runtime");
function PanelHead({ t, kind, onKind, level, onLevel, workspaces, workspaceValue, onWorkspace, openMenu, setOpenMenu }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "psh-head", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "psh-title", style: { flex: "none" }, children: t("panelTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: css.kindTabs, role: "tablist", "aria-label": "SKILL / MCP / \u63D0\u793A\u8BCD", children: [
      ["skill", t("kindSkill")],
      ["mcp", t("kindMcp")],
      ["prompt", t("kindPrompt")]
    ].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": kind === value,
        className: `${css.kindTab} ${kind === value ? css.kindTabActive : ""}`,
        "data-active": kind === value || void 0,
        onClick: () => {
          onKind(value);
        },
        children: label
      },
      value
    )) }),
    kind !== "prompt" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: css.kindTabs, role: "tablist", "aria-label": t("levelAria"), style: { marginLeft: 8 }, children: [["preset", t("levelPreset")], ["workspace", t("levelWorkspace")]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": level === value,
        className: `${css.kindTab} ${level === value ? css.kindTabActive : ""}`,
        "data-active": level === value || void 0,
        onClick: () => {
          onLevel(value);
        },
        children: label
      },
      value
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.toolbarSpacer }),
    kind !== "prompt" && onWorkspace !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.dropWrap, "data-drop": "workspace", style: { alignSelf: "center", marginRight: 4 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
        "button",
        {
          type: "button",
          className: css.toolButton,
          style: { height: 30, maxWidth: 240 },
          "aria-haspopup": "menu",
          "aria-expanded": openMenu === "workspace" || void 0,
          "aria-label": t("workspacePickerAria"),
          title: workspaceValue === null ? t("workspacePickerAuto") : workspaceValue,
          onClick: () => {
            setOpenMenu((value) => value === "workspace" ? null : "workspace");
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.dropLabelEllipsis, children: workspaceValue === null ? t("workspacePickerAuto") : shortenPath(workspaceValue) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconChevronDownOutlineRegular, { size: 11, "aria-hidden": "true" })
          ]
        }
      ),
      openMenu === "workspace" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: css.bulkOverlay, "aria-label": t("close"), onClick: () => {
          setOpenMenu(null);
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.dropMenu, role: "menu", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              role: "menuitemradio",
              className: css.dropItem,
              "aria-checked": workspaceValue === null,
              onClick: () => {
                onWorkspace(null);
                setOpenMenu(null);
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.dropCheck, "data-on": workspaceValue === null || void 0, "aria-hidden": "true", children: workspaceValue === null ? "\u2713" : "" }),
                t("workspacePickerAuto")
              ]
            }
          ),
          workspaces.map((item) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              role: "menuitemradio",
              className: css.dropItem,
              "aria-checked": workspaceValue === item,
              title: item,
              onClick: () => {
                onWorkspace(item);
                setOpenMenu(null);
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.dropCheck, "data-on": workspaceValue === item || void 0, "aria-hidden": "true", children: workspaceValue === item ? "\u2713" : "" }),
                shortenPath(item)
              ]
            },
            item
          ))
        ] })
      ] })
    ] })
  ] });
}
function SkillTopBar({
  t,
  dropActive,
  setDropActive,
  onDrop,
  activePreset,
  setActivePreset,
  presets,
  overrides,
  enabledCountFor,
  totalSkills,
  enabledCount,
  disabledCount,
  healthView,
  hasCategories,
  activeCat,
  setCatFilter,
  categoryList,
  categoryCounts,
  bundleCount,
  statusFilter,
  setStatusFilter,
  query,
  setQuery,
  openMenu,
  setOpenMenu,
  sortAsc,
  setSortAsc,
  newBundleOpen,
  onNewBundle,
  onAdd,
  onRefresh,
  fileInput,
  acceptFiles
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
    "div",
    {
      className: css.topbar,
      "data-drop": dropActive || void 0,
      onDragOver: (event) => {
        event.preventDefault();
        setDropActive(true);
      },
      onDragLeave: () => {
        setDropActive(false);
      },
      onDrop: (event) => {
        void onDrop(event);
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.chipRow, role: "group", "aria-label": t("presetCatTitle"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              className: `${css.catItem} ${activePreset === ALL_PRESETS ? css.catItemActive : ""}`,
              "data-active": activePreset === ALL_PRESETS || void 0,
              onClick: () => {
                setActivePreset(ALL_PRESETS);
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catIcon, "data-active": activePreset === ALL_PRESETS || void 0, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CatAllIcon, { size: 16 }) }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catLabel, children: t("presetAll") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catCount, title: t("presetCountTip", { n: enabledCountFor(ALL_PRESETS), total: totalSkills }), children: enabledCountFor(ALL_PRESETS) })
              ]
            }
          ),
          presets.map((preset) => {
            const overrideCount = Object.values(overrides[preset.id] ?? {}).filter((state2) => state2 === false).length;
            return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
              "button",
              {
                type: "button",
                className: `${css.catItem} ${activePreset === preset.id ? css.catItemActive : ""}`,
                "data-active": activePreset === preset.id || void 0,
                onClick: () => {
                  setActivePreset(preset.id);
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catIcon, "data-active": activePreset === preset.id || void 0, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconAgentPresetOutlineRegular, { size: 15 }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catLabel, children: preset.name ?? preset.id }),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                    "span",
                    {
                      className: css.catCount,
                      "data-warn": overrideCount > 0 || void 0,
                      title: t("presetCountTip", { n: enabledCountFor(preset.id), total: totalSkills }) + (overrideCount > 0 ? ` \xB7 ${t("presetOverrideCount", { n: overrideCount })}` : ""),
                      children: enabledCountFor(preset.id)
                    }
                  )
                ]
              },
              preset.id
            );
          })
        ] }),
        hasCategories && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.catChipRow, role: "group", "aria-label": t("bundleCatFilterAria"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catChipLabel, children: t("bundleCatTitle") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              className: css.catChip,
              "data-active": activeCat === null || void 0,
              "aria-pressed": activeCat === null,
              onClick: () => {
                setCatFilter(null);
              },
              children: [
                t("bundleCatAll"),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catChipCount, children: bundleCount })
              ]
            }
          ),
          categoryList.map((cat) => {
            const none = cat === UNCATEGORIZED;
            const active = activeCat === cat;
            return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
              "button",
              {
                type: "button",
                className: css.catChip,
                "data-active": active || void 0,
                "aria-pressed": active,
                onClick: () => {
                  setCatFilter(active ? null : cat);
                },
                children: [
                  none ? t("bundleCatNone") : cat,
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catChipCount, children: categoryCounts.get(cat) ?? 0 })
                ]
              },
              cat
            );
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.topbarActions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.searchBox, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SearchIcon, {}),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              "input",
              {
                className: css.searchInput,
                value: query,
                placeholder: t("searchPlaceholder"),
                "aria-label": t("searchPlaceholder"),
                onChange: (event) => {
                  setQuery(event.currentTarget.value);
                }
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.dropWrap, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
              "button",
              {
                type: "button",
                className: css.toolButton,
                style: { height: 36 },
                "aria-haspopup": "menu",
                "aria-expanded": openMenu === "sort" || void 0,
                onClick: () => {
                  setOpenMenu((value) => value === "sort" ? null : "sort");
                },
                children: [
                  t("sortLabel"),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SortDirIcon, { dir: sortAsc ? "asc" : "desc", size: 12 }),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconChevronDownOutlineRegular, { size: 11, "aria-hidden": "true" })
                ]
              }
            ),
            openMenu === "sort" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: css.bulkOverlay, "aria-label": t("close"), onClick: () => {
                setOpenMenu(null);
              } }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.dropMenu, role: "menu", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
                  "button",
                  {
                    type: "button",
                    role: "menuitemradio",
                    className: css.dropItem,
                    "aria-checked": sortAsc,
                    onClick: () => {
                      setSortAsc(true);
                      setOpenMenu(null);
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.dropCheck, "data-on": sortAsc || void 0, "aria-hidden": "true", children: sortAsc ? "\u2713" : "" }),
                      t("nameAsc")
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
                  "button",
                  {
                    type: "button",
                    role: "menuitemradio",
                    className: css.dropItem,
                    "aria-checked": !sortAsc,
                    onClick: () => {
                      setSortAsc(false);
                      setOpenMenu(null);
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.dropCheck, "data-on": !sortAsc || void 0, "aria-hidden": "true", children: !sortAsc ? "\u2713" : "" }),
                      t("nameDesc")
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: css.statusSeg, role: "group", "aria-label": t("statusAll"), children: [
            ["all", t("statusAll"), enabledCount + disabledCount],
            ["on", t("statusOn"), enabledCount],
            ["off", t("statusOff"), disabledCount]
          ].map(([value, label, count]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              className: `${css.statusSegBtn} ${statusFilter === value ? css.statusSegActive : ""}`,
              "data-active": statusFilter === value || void 0,
              "aria-pressed": statusFilter === value,
              onClick: () => {
                setStatusFilter(value);
              },
              children: [
                label,
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.statusSegCount, children: count })
              ]
            },
            value
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: css.healthInline, "data-tone": healthView.tone, title: healthView.title === "" ? void 0 : healthView.title, children: [
            t("statSync"),
            " \xB7 ",
            healthView.label
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.toolbarSpacer }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              className: css.toolButton,
              style: { height: 34, alignSelf: "center" },
              onClick: onRefresh,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconRefreshOutlineRegular, { size: 14, "aria-hidden": "true" }),
                t("refresh")
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              className: `${css.newBundleBtn} ${newBundleOpen ? css.newBundleBtnOpen : ""}`,
              style: { width: "auto", marginTop: 0, height: 34, fontSize: 12 },
              "aria-expanded": newBundleOpen || void 0,
              onClick: onNewBundle,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconPlusOutlineRegular, { size: 14, "aria-hidden": "true" }),
                t("newBundle")
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "button",
            {
              type: "button",
              className: css.addBtn,
              style: { height: 34, alignSelf: "center" },
              "aria-label": t("addSkillsTitle"),
              title: t("addSkillsSub"),
              onClick: onAdd,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CloudUpIcon, { size: 15, "aria-hidden": "true" }),
                t("addSkillsTitle")
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
            "input",
            {
              ref: fileInput,
              type: "file",
              className: css.hiddenInput,
              multiple: true,
              ...{ webkitdirectory: "" },
              onChange: (event) => {
                acceptFiles(event.currentTarget.files === null ? null : Array.from(event.currentTarget.files));
              }
            }
          )
        ] })
      ]
    }
  );
}
function McpTopBar({
  t,
  live,
  scope,
  onScope,
  status,
  onStatus,
  query,
  onQuery,
  onRefresh,
  onAddOwn,
  onAddCustom,
  workspace,
  level
}) {
  const data = live.state === "ready" ? live.data : null;
  const presets = data?.presets ?? [];
  const globals = data?.servers ?? [];
  const closedInWorkspace = new Set(
    workspace === null ? [] : Object.entries(data?.workspaceClosed?.[workspace] ?? {}).filter(([, on]) => on === false).map(([name]) => name)
  );
  const maskedOf = (presetId) => new Set(
    Object.entries(data?.masks?.[presetId] ?? {}).filter(([, on]) => on === false).map(([name]) => name)
  );
  const rowsOf = (presetId) => {
    const masked = maskedOf(presetId);
    const rows = globals.map((server) => ({
      enabled: mcpEffectiveEnabled({
        configDisabled: server.config.disabled,
        masked: presetId !== "" && masked.has(server.serverName),
        workspaceClosed: closedInWorkspace.has(server.serverName)
      })
    }));
    if (presetId !== "") {
      for (const row of data?.presetServers?.[presetId] ?? []) {
        rows.push({ enabled: mcpEffectiveEnabled({ workspaceClosed: closedInWorkspace.has(row.serverName) }) });
      }
    }
    return rows;
  };
  const visibleCount = (presetId) => {
    return rowsOf(presetId).filter((row) => row.enabled).length;
  };
  const chips = [
    { id: "", label: t("presetAll"), count: visibleCount(""), overrides: 0, icon: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CatAllIcon, { size: 16 }) },
    ...presets.map((preset) => ({
      id: preset.id,
      label: preset.name ?? preset.id,
      count: visibleCount(preset.id),
      overrides: level === "preset" ? maskedOf(preset.id).size : 0,
      icon: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconAgentPresetOutlineRegular, { size: 15 })
    }))
  ];
  const conn = live.state === "ready" ? { tone: "ok", label: t("mcpConnOk"), title: t("mcpConnTip", { n: globals.length }) } : live.state === "loading" ? { tone: "pending", label: t("statChecking"), title: "" } : { tone: "warn", label: t("mcpConnDown"), title: t("mcpLiveUnavailable") };
  const scopeRows = rowsOf(scope);
  const onCount = scopeRows.filter((row) => row.enabled).length;
  const offCount = scopeRows.length - onCount;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.topbar, children: [
    presets.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: css.chipRow, role: "group", "aria-label": t("mcpScopeTitle"), children: chips.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      "button",
      {
        type: "button",
        className: `${css.catItem} ${scope === chip.id ? css.catItemActive : ""}`,
        "data-active": scope === chip.id || void 0,
        onClick: () => {
          onScope(chip.id);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catIcon, "data-active": scope === chip.id || void 0, children: chip.icon }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.catLabel, children: chip.label }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
            "span",
            {
              className: css.catCount,
              "data-warn": chip.overrides > 0 || void 0,
              title: chip.id === "" ? t("mcpScopeAllTip", { n: chip.count }) : t("mcpScopePresetTip", { n: chip.count }) + (chip.overrides > 0 ? ` \xB7 ${t("mcpScopeOverrideCount", { n: chip.overrides })}` : ""),
              children: chip.count
            }
          )
        ]
      },
      chip.id === "" ? "\0all" : chip.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.topbarActions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: css.searchBox, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SearchIcon, {}),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "input",
          {
            className: css.searchInput,
            value: query,
            placeholder: t("mcpSearchServers"),
            "aria-label": t("mcpSearchServers"),
            onChange: (event) => {
              onQuery(event.currentTarget.value);
            }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: css.statusSeg, role: "group", "aria-label": t("statusAll"), children: [
        ["all", t("statusAll"), scopeRows.length],
        ["on", t("statusOn"), onCount],
        ["off", t("statusOff"), offCount]
      ].map(([value, label, count]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
        "button",
        {
          type: "button",
          className: `${css.statusSegBtn} ${status === value ? css.statusSegActive : ""}`,
          "data-active": status === value || void 0,
          "aria-pressed": status === value,
          onClick: () => {
            onStatus(value);
          },
          children: [
            label,
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.statusSegCount, children: count })
          ]
        },
        value
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: css.healthInline, "data-tone": conn.tone, title: conn.title === "" ? void 0 : conn.title, children: [
        t("mcpConnStatus"),
        " \xB7 ",
        conn.label
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: css.toolbarSpacer }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        "button",
        {
          type: "button",
          className: css.toolButton,
          style: { height: 34, alignSelf: "center" },
          onClick: onRefresh,
          children: t("mcpLiveRefresh")
        }
      ),
      scope !== "" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
        "button",
        {
          type: "button",
          className: css.newBundleBtn,
          style: { width: "auto", marginTop: 0, height: 34, fontSize: 12 },
          onClick: onAddOwn,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconPlusOutlineRegular, { size: 14, "aria-hidden": "true" }),
            t("mcpPresetAddOwn")
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
        "button",
        {
          type: "button",
          className: css.addBtn,
          style: { height: 34, alignSelf: "center" },
          "aria-label": t("mcpAddServer"),
          title: scope === "" ? void 0 : t("mcpAddGlobalHint"),
          onClick: onAddCustom,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_dsh_client_ui_primitives9.IconPlusOutlineRegular, { size: 15, "aria-hidden": "true" }),
            scope === "" ? t("mcpAddServer") : t("mcpAddServerGlobal")
          ]
        }
      )
    ] })
  ] });
}
function shortenPath(path) {
  const parts = path.split(/[\\/]/).filter((item) => item !== "");
  if (parts.length <= 2) return path;
  return `\u2026/${parts.slice(-2).join("/")}`;
}

// src/client/skills/SkillsPanel.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var SKILL_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
function frontmatterName(text) {
  const lines = text.split(/\r?\n/).slice(0, 80);
  if ((lines[0] ?? "").trim() !== "---") return null;
  for (const line of lines.slice(1)) {
    if (line.trim() === "---") break;
    const pair = /^\s*name\s*:\s*(.+?)\s*$/.exec(line);
    if (pair !== null) return (pair[1] ?? "").replace(/^["']|["']$/g, "");
  }
  return null;
}
function SkillsPanel({ onClose, closing = false, anchor = null, onCardMouseEnter, onCardMouseLeave }) {
  ensureStyles();
  const [state, setState] = (0, import_react15.useState)({ status: "loading" });
  const [reload, setReload] = (0, import_react15.useState)(0);
  const [workspace, setWorkspace] = (0, import_react15.useState)(null);
  const workspaceRef = (0, import_react15.useRef)(workspace);
  const silentSeq = (0, import_react15.useRef)(0);
  (0, import_react15.useEffect)(() => {
    workspaceRef.current = workspace;
  }, [workspace]);
  const [workspaces, setWorkspaces] = (0, import_react15.useState)([]);
  const [currentWorkspace, setCurrentWorkspace] = (0, import_react15.useState)(null);
  const [expanded, setExpanded] = (0, import_react15.useState)(/* @__PURE__ */ new Set());
  const [looseOpen, setLooseExpanded] = (0, import_react15.useState)(false);
  const [viewer, setViewer] = (0, import_react15.useState)(null);
  const [viewerFont, setViewerFont] = (0, import_react15.useState)(() => readViewerPrefs().font);
  const [viewerFull, setViewerFull] = (0, import_react15.useState)(() => readViewerPrefs().full);
  const [assignTarget, setAssignTarget] = (0, import_react15.useState)(null);
  const [newBundleOpen, setNewBundleOpen] = (0, import_react15.useState)(false);
  const [newBundleName, setNewBundleName] = (0, import_react15.useState)("");
  const [newBundleCats, setNewBundleCats] = (0, import_react15.useState)([]);
  const [creatingBundle, setCreatingBundle] = (0, import_react15.useState)(false);
  const [renameTarget, setRenameTarget] = (0, import_react15.useState)(null);
  const [renaming, setRenaming] = (0, import_react15.useState)(false);
  const [renamedFlash, setRenamedFlash] = (0, import_react15.useState)(null);
  const renamedTimer = (0, import_react15.useRef)(null);
  const [confirm, setConfirm] = (0, import_react15.useState)(null);
  const [confirming, setConfirming] = (0, import_react15.useState)(false);
  const [install, setInstall] = (0, import_react15.useState)(null);
  const [addOpen, setAddOpen] = (0, import_react15.useState)(false);
  const [installName, setInstallName] = (0, import_react15.useState)("");
  const [installDescription, setInstallDescription] = (0, import_react15.useState)("");
  const [installScope, setInstallScope] = (0, import_react15.useState)("global");
  const [installBundleId, setInstallBundleId] = (0, import_react15.useState)(void 0);
  const [installing, setInstalling] = (0, import_react15.useState)(false);
  const [installError, setInstallError] = (0, import_react15.useState)(null);
  const [toasts, setToasts] = (0, import_react15.useState)([]);
  const toastTimers = (0, import_react15.useRef)([]);
  const pushToast = (tone, text) => {
    const id = Date.now() + Math.random();
    setToasts((current2) => [...current2.slice(-2), { id, tone, text }]);
    const timer = window.setTimeout(() => {
      setToasts((current2) => current2.filter((item) => item.id !== id));
    }, tone === "err" ? 6400 : 2800);
    toastTimers.current.push(timer);
  };
  const failToast = (label, error) => {
    pushToast("err", skillT("opFailed", { label, message: error instanceof Error ? error.message : String(error) }));
  };
  const [installMetaName, setInstallMetaName] = (0, import_react15.useState)(null);
  (0, import_react15.useEffect)(() => {
    if (install === null || install.archive === true) {
      setInstallMetaName(null);
      return void 0;
    }
    const entry = install.files.find((item) => item.path === "SKILL.md");
    if (entry === void 0) {
      setInstallMetaName(null);
      return void 0;
    }
    let current2 = true;
    void entry.file.text().then((text) => {
      if (!current2) return;
      setInstallMetaName(frontmatterName(text));
    }, () => {
      if (current2) setInstallMetaName(null);
    });
    return () => {
      current2 = false;
    };
  }, [install]);
  const [dropActive, setDropActive] = (0, import_react15.useState)(false);
  const fileInput = (0, import_react15.useRef)(null);
  const [toggles, setToggles] = (0, import_react15.useState)({ skills: {}, bundles: {} });
  const [workspaceToggles, setWorkspaceToggles] = (0, import_react15.useState)({ skills: {}, bundles: {} });
  const [toggling, setToggling] = (0, import_react15.useState)(/* @__PURE__ */ new Set());
  const [presets, setPresets] = (0, import_react15.useState)([]);
  const [overrides, setOverrides] = (0, import_react15.useState)({});
  const [workspaceOverrides, setWorkspaceOverrides] = (0, import_react15.useState)({});
  const [activePreset, setActivePreset] = (0, import_react15.useState)(ALL_PRESETS);
  const [query, setQuery] = (0, import_react15.useState)("");
  const [sourceFilter, setSourceFilter] = (0, import_react15.useState)("all");
  const [sortAsc, setSortAsc] = (0, import_react15.useState)(true);
  const [statusFilter, setStatusFilter] = (0, import_react15.useState)("all");
  const [catFilter, setCatFilter] = (0, import_react15.useState)(null);
  const [catTarget, setCatTarget] = (0, import_react15.useState)(null);
  const [catDraft, setCatDraft] = (0, import_react15.useState)([]);
  const [savingCats, setSavingCats] = (0, import_react15.useState)(false);
  const [openMenu, setOpenMenu] = (0, import_react15.useState)(null);
  const [health, setHealth] = (0, import_react15.useState)({ state: "loading" });
  const [guideOpen, setGuideOpen] = (0, import_react15.useState)(false);
  const [kind, setKind] = (0, import_react15.useState)("skill");
  const [level, setLevel] = (0, import_react15.useState)("preset");
  const [mcpScope, setMcpScope] = (0, import_react15.useState)("");
  const [mcpQuery, setMcpQuery] = (0, import_react15.useState)("");
  const [mcpStatusFilter, setMcpStatusFilter] = (0, import_react15.useState)("all");
  const [mcpLive, mcpRefreshLive] = useMcpLiveState();
  const [mcpAddOpen, setMcpAddOpen] = (0, import_react15.useState)(false);
  const [mcpAddOwnOpen, setMcpAddOwnOpen] = (0, import_react15.useState)(false);
  const mcpWatchTimer = (0, import_react15.useRef)(null);
  const [mcpWaitingTools, setMcpWaitingTools] = (0, import_react15.useState)([]);
  const mcpLiveRef = (0, import_react15.useRef)(mcpLive);
  (0, import_react15.useEffect)(() => {
    mcpLiveRef.current = mcpLive;
  }, [mcpLive]);
  const stopMcpWatch = () => {
    if (mcpWatchTimer.current !== null) {
      window.clearInterval(mcpWatchTimer.current);
      mcpWatchTimer.current = null;
    }
    setMcpWaitingTools([]);
  };
  const watchMcpTools = (names) => {
    if (mcpWatchTimer.current !== null) {
      window.clearInterval(mcpWatchTimer.current);
      mcpWatchTimer.current = null;
    }
    mcpRefreshLive();
    const pending = new Set(names.filter((name) => name !== ""));
    if (pending.size === 0) {
      setMcpWaitingTools([]);
      return;
    }
    setMcpWaitingTools([...pending]);
    const startedAt = Date.now();
    mcpWatchTimer.current = window.setInterval(() => {
      const snapshot = mcpLiveRef.current;
      if (snapshot.state === "ready") {
        for (const name of [...pending]) {
          if (mcpRegisteredToolCountOf(snapshot.data, name) > 0) pending.delete(name);
        }
        setMcpWaitingTools([...pending]);
      }
      if (pending.size === 0 || Date.now() - startedAt > MCP_TOOL_WATCH_TIMEOUT_MS) stopMcpWatch();
      else mcpRefreshLive();
    }, MCP_TOOL_WATCH_INTERVAL_MS);
  };
  const refresh = () => {
    setReload((value) => value + 1);
  };
  const silentSync = () => {
    const seq = ++silentSeq.current;
    void skillApi.list(workspaceRef.current).then((snapshot) => {
      if (seq !== silentSeq.current) return;
      setState((current2) => current2.status === "error" ? current2 : { status: "ready", snapshot });
    }, () => {
    });
    void skillApi.presetStatus(workspaceRef.current).then(
      (status) => {
        if (seq !== silentSeq.current) return;
        setToggles({ skills: status.skills, bundles: status.bundles });
        setWorkspaceToggles({ skills: status.workspaceSkills ?? {}, bundles: status.workspaceBundles ?? {} });
        setOverrides(status.overrides);
        setPresets(status.presets);
        void skillApi.workspaceStatus().then((s2) => {
          if (seq === silentSeq.current) setWorkspaceOverrides(s2.workspaces);
        }, () => {
        });
      },
      () => {
        void skillApi.toggleStatus(workspaceRef.current).then((status) => {
          if (seq === silentSeq.current) setToggles(status);
        }, () => {
        });
      }
    );
    void skillApi.health().then(
      (report) => {
        if (seq === silentSeq.current) setHealth(report.ok ? { state: "ok", report } : { state: "issue", report });
      },
      () => {
      }
    );
  };
  (0, import_react15.useEffect)(() => {
    const timer = window.setInterval(silentSync, 3e4);
    const onVis = () => {
      if (document.visibilityState === "visible") silentSync();
    };
    const onFocus = () => {
      silentSync();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  const refreshTogglesOnly = () => {
    void skillApi.presetStatus(workspaceRef.current).then(
      (status) => {
        setToggles({ skills: status.skills, bundles: status.bundles });
        setWorkspaceToggles({ skills: status.workspaceSkills ?? {}, bundles: status.workspaceBundles ?? {} });
        setOverrides(status.overrides);
        setPresets(status.presets);
        void skillApi.workspaceStatus().then((s2) => setWorkspaceOverrides(s2.workspaces), () => {
        });
      },
      () => {
        void skillApi.toggleStatus(workspaceRef.current).then((status) => {
          setToggles(status);
        }, () => {
        });
      }
    );
  };
  const t = skillT;
  (0, import_react15.useEffect)(() => {
    let current2 = true;
    setState({ status: "loading" });
    void skillApi.list(workspace).then(
      (snapshot) => {
        if (current2) setState({ status: "ready", snapshot });
      },
      () => {
        if (current2) setState({ status: "error" });
      }
    );
    void skillApi.presetStatus(workspace).then(
      (status) => {
        if (!current2) return;
        setToggles({ skills: status.skills, bundles: status.bundles });
        setWorkspaceToggles({ skills: status.workspaceSkills ?? {}, bundles: status.workspaceBundles ?? {} });
        setOverrides(status.overrides);
        setPresets(status.presets);
        void skillApi.workspaceStatus().then((s2) => setWorkspaceOverrides(s2.workspaces), () => {
        });
      },
      () => {
        void skillApi.toggleStatus(workspace).then(
          (status) => {
            if (current2) setToggles(status);
          },
          () => {
          }
        );
      }
    );
    setHealth({ state: "loading" });
    void skillApi.health().then(
      (report) => {
        if (current2) setHealth(report.ok ? { state: "ok", report } : { state: "issue", report });
      },
      () => {
        if (current2) setHealth({ state: "unavailable" });
      }
    );
    return () => {
      current2 = false;
    };
  }, [reload, workspace]);
  (0, import_react15.useEffect)(() => {
    let current2 = true;
    void skillApi.workspaces().then(
      (result) => {
        if (!current2) return;
        setWorkspaces(Array.isArray(result.workspaces) ? result.workspaces : []);
        setCurrentWorkspace(typeof result.current === "string" && result.current !== "" ? result.current : null);
      },
      () => {
        if (current2) setWorkspaces([]);
      }
    );
    return () => {
      current2 = false;
    };
  }, [reload]);
  (0, import_react15.useEffect)(() => () => {
    if (renamedTimer.current !== null) window.clearTimeout(renamedTimer.current);
    if (mcpWatchTimer.current !== null) window.clearInterval(mcpWatchTimer.current);
    for (const timer of toastTimers.current) window.clearTimeout(timer);
  }, []);
  const [guidePos, setGuidePos] = (0, import_react15.useState)(null);
  (0, import_react15.useEffect)(() => {
    if (!guideOpen) return;
    const marker = document.querySelector("[data-skm-panel-marker]");
    const card = marker?.closest(".psh-card");
    if (!(card instanceof HTMLElement)) return;
    const rect = card.getBoundingClientRect();
    const vh = window.innerHeight;
    const top = Math.max(8, rect.top);
    const overlayW = 300;
    setGuidePos({
      left: Math.max(rect.left + 12, rect.right - overlayW - 12),
      top,
      height: Math.min(rect.height, vh - top - 12)
    });
  }, [guideOpen]);
  const runToggle = async (key, action) => {
    if (toggling.has(key)) return;
    setToggling((current2) => new Set(current2).add(key));
    setInstallError(null);
    try {
      await action();
      refreshTogglesOnly();
    } catch (error) {
      pushToast("err", skillT("toggleFailed", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setToggling((current2) => {
        const next = new Set(current2);
        next.delete(key);
        return next;
      });
    }
  };
  const effectiveWorkspace = workspace ?? currentWorkspace;
  const scope = { level, presetId: activePreset, cwd: effectiveWorkspace };
  const toggleSkill = (skill, enabled) => {
    if (scope.level === "workspace") {
      if (scope.cwd === null) {
        pushToast("err", "no active workspace");
        return;
      }
      void runToggle(`skill:${skill.name}`, () => skillApi.setWorkspaceSkillEnabled(scope.cwd, skill.name, enabled));
      return;
    }
    if (scope.presetId === ALL_PRESETS) {
      void runToggle(`skill:${skill.name}`, () => skillApi.setSkillEnabled(skill.name, enabled));
      return;
    }
    void runToggle(
      `skill:${skill.name}`,
      () => skillApi.setPresetSkillEnabled(scope.presetId, skill.name, enabled)
    );
  };
  const toggleBundle = (bundle, enabled) => {
    if (scope.level === "workspace") {
      if (scope.cwd === null) {
        pushToast("err", "no active workspace");
        return;
      }
      void runToggle(`bundle:${bundle.id}`, () => skillApi.setWorkspaceBundleEnabled(scope.cwd, bundle.id, enabled));
      return;
    }
    if (scope.presetId === ALL_PRESETS) {
      void runToggle(`bundle:${bundle.id}`, () => skillApi.setBundleEnabled(bundle.id, enabled));
      return;
    }
    void runToggle(
      `bundle:${bundle.id}`,
      () => skillApi.setPresetBundleEnabled(scope.presetId, bundle.id, enabled)
    );
  };
  const enableTables = {
    skills: toggles.skills,
    overrides,
    workspaceOverrides,
    workspaceSkills: workspaceToggles.skills
  };
  const scopeOverrides = skillOverridesAt(scope, enableTables);
  const scopeOverrideCount = Object.keys(scopeOverrides).length;
  const enabledCountFor = (presetId) => {
    const target = { level: scope.level, presetId, cwd: scope.cwd };
    let n = 0;
    for (const bundle of bundles) for (const skill of bundle.skills) if (enabledStateAt(target, skill.name, enableTables)) n += 1;
    for (const skill of loose) if (enabledStateAt(target, skill.name, enableTables)) n += 1;
    return n;
  };
  const skillEnabledIn = (name) => enabledStateAt(scope, name, enableTables);
  const bundleEnabledIn = (bundle) => bundle.skills.length > 0 && bundle.skills.every((skill) => skillEnabledIn(skill.name));
  const skillLockedReason = (name) => scope.level === "preset" && scope.presetId !== ALL_PRESETS && toggles.skills[name] === false ? t("presetLockedByGlobal") : void 0;
  const resetScope = (target) => {
    if (target.level === "workspace") {
      if (target.cwd === null) return;
      void runToggle(`reset:workspace:${target.cwd}`, () => skillApi.resetWorkspace(target.cwd));
      return;
    }
    if (target.presetId === ALL_PRESETS) return;
    void runToggle(`reset:${target.presetId}`, () => skillApi.resetPreset(target.presetId));
  };
  const applySkillsToAllPresets = async () => {
    if (!window.confirm(t("applyAllConfirm"))) return;
    try {
      const status = await skillApi.presetStatus();
      const ids = status.presets.map((p) => p.id);
      for (const id of ids) {
        await skillApi.resetPreset(id);
      }
      refreshTogglesOnly();
      pushToast("ok", t("applyAllOk", { n: ids.length }));
    } catch (error) {
      pushToast("err", `${t("applyAll")}\uFF1A${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const applyMcpToAllPresets = async () => {
    if (!window.confirm(t("mcpApplyAllConfirm"))) return;
    try {
      const res = await fetch("/api/triad/mcp-apply-all", { method: "POST", headers: { accept: "application/json" } });
      const body = await res.json().catch(() => null);
      if (!(res.ok && body?.ok === true)) throw new Error(body?.error ?? String(res.status));
      mcpRefreshLive();
      pushToast("ok", t("mcpApplyAllOk", { masks: body.clearedMasks ?? 0, tools: body.clearedTools ?? 0 }));
    } catch (error) {
      pushToast("err", `${t("mcpApplyAll")}\uFF1A${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const toggleExpanded = (bundleId) => {
    setExpanded((current2) => {
      const next = new Set(current2);
      if (next.has(bundleId)) next.delete(bundleId);
      else next.add(bundleId);
      return next;
    });
  };
  const loadViewerContent = async (skillName, filePath) => {
    try {
      const res = await fetch(`/api/skill-manager/skills/${encodeURIComponent(skillName)}/files/${encodeURIComponent(filePath)}`);
      const body = await res.json();
      if (body.error !== void 0) throw new Error(String(body.error));
      setViewer((v) => v === null ? v : { ...v, loading: false, content: body.content ?? "" });
    } catch (error) {
      setViewer((v) => v === null ? v : { ...v, loading: false, error: error instanceof Error ? error.message : String(error) });
    }
  };
  const openViewer = (skill) => {
    setViewer({ skill, file: "SKILL.md", loading: true });
    void loadViewerContent(skill.name, "SKILL.md");
  };
  const setViewerFontLevel = (level2) => {
    setViewerFont(Math.min(Math.max(level2, 0), VIEWER_FONT_SIZES.length - 1));
  };
  const toggleViewerFull = () => {
    setViewerFull((current2) => !current2);
  };
  (0, import_react15.useEffect)(() => {
    writeViewerPrefs({ font: viewerFont, full: viewerFull });
  }, [viewerFont, viewerFull]);
  const selectViewerFile = (filePath) => {
    if (viewer === null) return;
    setViewer({ ...viewer, file: filePath, loading: true, error: void 0 });
    void loadViewerContent(viewer.skill.name, filePath);
  };
  const doAssign = async (skill, bundleId) => {
    try {
      if (state.status !== "ready") return;
      const bundle = state.snapshot.bundles.find((candidate) => candidate.id === bundleId);
      if (bundle === void 0) throw new Error("bundle not found");
      await skillApi.setBundleSkills(bundleId, [...bundle.skills.map((s2) => s2.name), skill.name]);
      setAssignTarget(null);
      pushToast("ok", skillT("assignOk", { name: skill.name }));
      refresh();
    } catch (error) {
      failToast("\u5F52\u5165\u6280\u80FD\u5305", error);
    }
  };
  const acceptFiles = (files) => {
    if (files === null || files.length === 0) return;
    const collected = [];
    for (const file of files) {
      const relative = file.webkitRelativePath;
      if (relative === "") continue;
      const parts = relative.split("/");
      if (parts.length < 2) continue;
      collected.push({ path: parts.slice(1).join("/"), file });
    }
    if (collected.length === 0) return;
    const zipCandidate = collected.length === 1 && collected[0].path.toLowerCase().endsWith(".zip") ? collected[0] : void 0;
    if (zipCandidate !== void 0) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = String(reader.result ?? "").split(",")[1] ?? "";
        setInstall({ archive: true, name: zipCandidate.path, data, folderName: zipCandidate.path });
        setInstallError(null);
        setAddOpen(true);
      };
      reader.readAsDataURL(zipCandidate.file);
      return;
    }
    const rootName = collected[0]?.path.split("/")[0] ?? "";
    setInstallName(rootName);
    setInstallError(null);
    setInstall({ files: collected, folderName: rootName });
    setAddOpen(true);
  };
  const onDrop = async (event) => {
    event.preventDefault();
    setDropActive(false);
    const collected = [];
    const items = event.dataTransfer.items;
    if (items === void 0) return;
    const pending = [];
    for (const item of Array.from(items)) {
      const entry = item.webkitGetAsEntry?.();
      if (entry !== void 0 && entry !== null) pending.push(collectEntry(entry, "", collected));
    }
    await Promise.all(pending);
    if (collected.length === 0) return;
    const zipCandidate = collected.length === 1 && collected[0].path.toLowerCase().endsWith(".zip") ? collected[0] : void 0;
    if (zipCandidate !== void 0) {
      setInstall({ archive: true, name: zipCandidate.path, data: await fileToBase64(zipCandidate.file), folderName: zipCandidate.path });
      setInstallError(null);
      setAddOpen(true);
      return;
    }
    const rootName = collected[0]?.path.split("/")[0] ?? "";
    setInstallName(rootName);
    setInstallError(null);
    setInstall({ files: collected, folderName: rootName });
    setAddOpen(true);
  };
  const confirmInstall = async (event) => {
    event.preventDefault();
    if (install === null || installing) return;
    if (install.archive !== true && installName.trim() === "") return;
    setInstalling(true);
    setInstallError(null);
    const scopeFields = installScope === "workspace" && (workspace ?? currentWorkspace) !== null ? { scope: "workspace", workspace: workspace ?? currentWorkspace } : {};
    try {
      let installed = {};
      if (install.archive === true) {
        installed = await skillApi.installSkill({
          archive: install.data,
          description: installDescription.trim(),
          ...installBundleId === void 0 ? {} : { bundleId: installBundleId },
          ...scopeFields
        });
      } else {
        const files = await Promise.all(install.files.map(async ({ path, file }) => ({
          path,
          data: await fileToBase64(file)
        })));
        installed = await skillApi.installSkill({
          skillName: installName.trim(),
          description: installDescription.trim(),
          ...installBundleId === void 0 ? {} : { bundleId: installBundleId },
          ...scopeFields,
          files
        });
      }
      pushToast("ok", skillT("installedOk", { name: installed.name ?? installName.trim() }));
      setInstall(null);
      setInstallName("");
      setInstallDescription("");
      setInstallBundleId(void 0);
      setAddOpen(false);
      refresh();
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : String(error));
    } finally {
      setInstalling(false);
    }
  };
  const submitNewBundle = async (event) => {
    event.preventDefault();
    if (creatingBundle || newBundleName.trim() === "") return;
    setCreatingBundle(true);
    try {
      const created = newBundleName.trim();
      await skillApi.createBundle(created, newBundleCats);
      setNewBundleName("");
      setNewBundleCats([]);
      setNewBundleOpen(false);
      pushToast("ok", skillT("bundleCreated", { name: created }));
      refresh();
    } catch (error) {
      failToast("\u65B0\u5EFA\u6280\u80FD\u5305", error);
    } finally {
      setCreatingBundle(false);
    }
  };
  const openCatEditor = (bundle) => {
    setCatTarget({ bundleId: bundle.id, name: bundle.name });
    setCatDraft([...bundle.categories ?? []]);
  };
  const submitCategories = async () => {
    if (catTarget === null || savingCats) return;
    setSavingCats(true);
    try {
      await skillApi.setBundleCategories(catTarget.bundleId, catDraft);
      if (activeCat !== null && !catDraft.includes(activeCat) && activeCat !== UNCATEGORIZED) setCatFilter(null);
      pushToast("ok", skillT("bundleCatSaved", { name: catTarget.name }));
      setCatTarget(null);
      refresh();
    } catch (error) {
      failToast("\u8BBE\u7F6E\u5206\u7C7B", error);
    } finally {
      setSavingCats(false);
    }
  };
  const submitRename = async (event) => {
    event.preventDefault();
    if (renaming || renameTarget === null || renameTarget.name.trim() === "") return;
    setRenaming(true);
    try {
      await skillApi.renameBundle(renameTarget.bundleId, renameTarget.name.trim());
      const renamedId = renameTarget.bundleId;
      if (renamedTimer.current !== null) window.clearTimeout(renamedTimer.current);
      setRenamedFlash(renamedId);
      renamedTimer.current = window.setTimeout(() => {
        setRenamedFlash(null);
      }, 1600);
      setRenameTarget(null);
      refresh();
    } catch (error) {
      failToast("\u91CD\u547D\u540D\u6280\u80FD\u5305", error);
    } finally {
      setRenaming(false);
    }
  };
  const confirmDelete = async () => {
    if (confirm === null || confirming) return;
    setConfirming(true);
    const label = confirm.kind === "bundle" ? confirm.bundle.name : confirm.name;
    try {
      if (confirm.kind === "bundle") await skillApi.deleteBundle(confirm.bundle.id);
      else await skillApi.deleteSkill(confirm.name);
      setConfirm(null);
      pushToast("ok", confirm.kind === "bundle" ? skillT("bundleDeleted", { name: label }) : skillT("deletedOk", { name: label }));
      refresh();
    } catch (error) {
      failToast(confirm.kind === "bundle" ? "\u5220\u9664\u6280\u80FD\u5305" : "\u5220\u9664\u6280\u80FD", error);
    } finally {
      setConfirming(false);
    }
  };
  const removeFromBundle = async (bundleId, name) => {
    try {
      if (state.status !== "ready") return;
      const bundle = state.snapshot.bundles.find((candidate) => candidate.id === bundleId);
      if (bundle === void 0) return;
      await skillApi.setBundleSkills(bundleId, bundle.skills.map((skill) => skill.name).filter((skillName) => skillName !== name));
      pushToast("ok", skillT("removedOk", { name }));
      refresh();
    } catch (error) {
      failToast("\u79FB\u51FA\u6280\u80FD\u5305", error);
    }
  };
  const pruneBundle = async (bundle) => {
    try {
      const full = state.status === "ready" ? state.snapshot.bundles.find((candidate) => candidate.id === bundle.id) ?? bundle : bundle;
      await skillApi.setBundleSkills(bundle.id, full.skills.map((skill) => skill.name));
      pushToast("ok", skillT("pruned"));
      refresh();
    } catch (error) {
      failToast("\u6E05\u7406\u5931\u6548\u5F15\u7528", error);
    }
  };
  const openInstallFor = (bundleId) => {
    setInstall(null);
    setInstallError(null);
    setInstallBundleId(bundleId);
    setAddOpen(true);
  };
  const bundles = state.status === "ready" ? state.snapshot.bundles : [];
  const loose = state.status === "ready" ? state.snapshot.loose : [];
  const scopeLabel = level === "workspace" ? t("scopeWorkspace") : activePreset === ALL_PRESETS ? t("scopeAll") : presets.find((preset) => preset.id === activePreset)?.name ?? activePreset;
  const q = query.trim().toLowerCase();
  const qMatch = (skill) => {
    if (q === "") return true;
    if (skill.name.toLowerCase().includes(q)) return true;
    return (skill.description ?? "").toLowerCase().includes(q);
  };
  const statusMatch = (skill) => {
    if (statusFilter === "all") return true;
    const on = enabledStateAt(scope, skill.name, enableTables);
    return statusFilter === "on" ? on : !on;
  };
  const sortedSkills = (list) => [...list].sort((a, b) => {
    const order = a.name.localeCompare(b.name);
    return sortAsc ? order : -order;
  });
  const filteredSkills = (list) => sortedSkills(list.filter((skill) => qMatch(skill) && statusMatch(skill)));
  const filtering = q !== "" || statusFilter !== "all";
  const categoryCounts = (() => {
    const counts = /* @__PURE__ */ new Map();
    for (const bundle of bundles) {
      const cats = bundle.categories ?? [];
      if (cats.length === 0) {
        counts.set(UNCATEGORIZED, (counts.get(UNCATEGORIZED) ?? 0) + 1);
        continue;
      }
      for (const cat of cats) counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return counts;
  })();
  const categoryList = sortCategories(categoryCounts);
  const categorySuggestions = categoryList.filter((cat) => cat !== UNCATEGORIZED);
  const hasCategories = categoryList.some((cat) => cat !== UNCATEGORIZED);
  const activeCat = catFilter !== null && categoryCounts.has(catFilter) ? catFilter : null;
  const catMatch = (bundle) => {
    if (activeCat === null) return true;
    const cats = bundle.categories ?? [];
    return activeCat === UNCATEGORIZED ? cats.length === 0 : cats.includes(activeCat);
  };
  const visibleBundleAll = (sourceFilter === "loose" ? [] : bundles).filter((bundle) => catMatch(bundle)).map((bundle) => ({ ...bundle, skills: filteredSkills(bundle.skills) })).filter((bundle) => bundleVisibleInList(bundle, filtering));
  const visibleLooseAll = sourceFilter === "bundles" || activeCat !== null ? [] : filteredSkills(loose);
  const allSkills = [...bundles.flatMap((bundle) => bundle.skills), ...loose];
  const totalSkills = allSkills.length;
  const bundleCount = bundles.length;
  const healthView = health.state === "ok" ? { tone: "ok", label: t("statHealthy"), title: t("statHealthy") } : health.state === "issue" ? { tone: "warn", label: t("statIssues", { n: health.report.issues.length }), title: health.report.issues.map((issue) => issue.message).join("\n") } : health.state === "unavailable" ? { tone: "pending", label: t("statPending"), title: t("statPending") } : { tone: "idle", label: t("statChecking"), title: "" };
  const enabledCount = allSkills.filter((skill) => enabledStateAt(scope, skill.name, enableTables)).length;
  const disabledCount = allSkills.length - enabledCount;
  const noResults = visibleBundleAll.length === 0 && visibleLooseAll.length === 0;
  const trimmedName = installName.trim();
  const nameInvalid = trimmedName !== "" && !SKILL_NAME_PATTERN.test(trimmedName);
  const confirmTitle = confirm === null ? t("deleteSkillConfirm", { name: "" }) : confirm.kind === "bundle" ? t("deleteBundleConfirm", { name: confirm.bundle.name }) : t("deleteSkillConfirm", { name: confirm.name }) + (confirm.kind === "skill" && confirm.dir !== void 0 && confirm.dir !== confirm.name ? t("deleteSkillDirNote", { dir: confirm.dir }) : "");
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
    PopoverShell,
    {
      solid: true,
      closing,
      onClose: () => {
        if (installing || confirming) return;
        if (newBundleOpen || addOpen || confirm !== null || viewer !== null || assignTarget !== null || catTarget !== null) return;
        onClose();
      },
      anchor,
      onCardMouseEnter,
      onCardMouseLeave,
      size: { width: 1150, height: 860 },
      ariaLabel: t("panelTitle"),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          PanelHead,
          {
            t,
            kind,
            onKind: setKind,
            level,
            onLevel: setLevel,
            workspaces,
            workspaceValue: workspace,
            onWorkspace: setWorkspace,
            openMenu,
            setOpenMenu
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(PshBody, { className: css.modalBody, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { "data-skm-panel-marker": true, "aria-hidden": "true", style: { display: "none" } }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: css.hub, "aria-busy": state.status === "loading", children: [
            kind === "skill" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
              SkillTopBar,
              {
                t,
                dropActive,
                setDropActive,
                onDrop,
                activePreset,
                setActivePreset,
                presets,
                overrides: level === "workspace" ? {} : overrides,
                enabledCountFor,
                totalSkills,
                enabledCount,
                disabledCount,
                healthView,
                hasCategories,
                activeCat,
                setCatFilter,
                categoryList,
                categoryCounts,
                bundleCount,
                statusFilter,
                setStatusFilter,
                query,
                setQuery,
                openMenu,
                setOpenMenu,
                sortAsc,
                setSortAsc,
                newBundleOpen,
                onNewBundle: () => {
                  setNewBundleOpen(true);
                },
                onAdd: () => {
                  setInstall(null);
                  setInstallError(null);
                  setAddOpen(true);
                },
                onRefresh: refresh,
                fileInput,
                acceptFiles
              }
            ),
            kind === "mcp" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
              McpTopBar,
              {
                t,
                live: mcpLive,
                scope: mcpScope,
                onScope: setMcpScope,
                status: mcpStatusFilter,
                onStatus: setMcpStatusFilter,
                query: mcpQuery,
                onQuery: setMcpQuery,
                onRefresh: () => {
                  mcpRefreshLive();
                },
                onAddOwn: () => {
                  setMcpAddOwnOpen(true);
                },
                onAddCustom: () => {
                  setMcpAddOpen(true);
                },
                workspace: effectiveWorkspace,
                level
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: css.hubMain, children: [
              kind === "skill" && level === "preset" && activePreset === ALL_PRESETS ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { padding: "4px 12px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: css.toolButton, title: t("applyAllHint"), onClick: () => {
                void applySkillsToAllPresets();
              }, children: t("applyAll") }) }) : null,
              kind === "mcp" && level === "preset" && mcpScope === "" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { padding: "4px 12px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: css.toolButton, title: t("mcpApplyAllHint"), onClick: () => {
                void applyMcpToAllPresets();
              }, children: t("mcpApplyAll") }) }) : null,
              kind === "prompt" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(PromptView, {}) : kind === "mcp" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                McpView,
                {
                  t,
                  live: mcpLive,
                  scope: mcpScope,
                  query: mcpQuery,
                  status: mcpStatusFilter,
                  onRefresh: () => {
                    mcpRefreshLive();
                  },
                  waitingTools: mcpWaitingTools,
                  onWatchTools: (names) => {
                    watchMcpTools(names);
                  },
                  addOwnOpen: mcpAddOwnOpen,
                  onCloseAddOwn: () => {
                    setMcpAddOwnOpen(false);
                  },
                  workspace: effectiveWorkspace,
                  level
                }
              ) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                SkillsView,
                {
                  t,
                  state,
                  health,
                  scope,
                  scopeOverrideCount,
                  presets,
                  onResetScope: resetScope,
                  openMenu,
                  setOpenMenu,
                  refresh,
                  noResults,
                  visibleBundleAll,
                  expanded,
                  renameTarget,
                  setRenameTarget,
                  renaming,
                  submitRename,
                  bundleEnabledIn,
                  toggling,
                  setCatFilter,
                  activeCat,
                  toggleExpanded,
                  renamedFlash,
                  openInstallFor,
                  skillEnabledIn,
                  skillLockedReason,
                  scopeLabel,
                  toggleSkill,
                  toggleBundle,
                  openViewer,
                  removeFromBundle,
                  pruneBundle,
                  openCatEditor,
                  setConfirm,
                  setAssignTarget,
                  looseOpen,
                  setLooseExpanded,
                  visibleLooseAll
                }
              )
            ] })
          ] })
        ] }),
        toasts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: css.toastStack, role: "status", "aria-live": "polite", children: toasts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: `${css.toast} ${item.tone === "err" ? css.toastErr : css.toastOk}`, "data-tone": item.tone, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("i", { className: css.toastDot, "aria-hidden": "true" }),
          item.text
        ] }, item.id)) }),
        guideOpen && guidePos !== null && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(GuidePanel, { t, onClose: () => {
          setGuideOpen(false);
        }, left: guidePos.left, top: guidePos.top, height: guidePos.height }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          McpAddModal,
          {
            t,
            open: mcpAddOpen,
            onClose: () => {
              setMcpAddOpen(false);
            },
            onAdded: (added) => {
              watchMcpTools(added);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          import_dsh_client_ui_primitives10.Modal,
          {
            open: newBundleOpen,
            onClose: () => {
              if (!creatingBundle) {
                setNewBundleOpen(false);
                setNewBundleCats([]);
              }
            },
            closeLabel: t("close"),
            title: t("newBundle"),
            children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("form", { className: css.stackForm, onSubmit: (event) => {
              void submitNewBundle(event);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                "input",
                {
                  className: css.inlineInput,
                  value: newBundleName,
                  placeholder: t("newBundlePlaceholder"),
                  "aria-label": t("newBundlePlaceholder"),
                  autoFocus: true,
                  disabled: creatingBundle,
                  onChange: (event) => {
                    setNewBundleName(event.currentTarget.value);
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(CategoryEditor, { value: newBundleCats, onChange: setNewBundleCats, label: t("newBundle"), suggestions: categorySuggestions }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: css.inlineForm, children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "primary", type: "submit", disabled: creatingBundle || newBundleName.trim() === "", children: t("create") }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "outline", type: "button", disabled: creatingBundle, onClick: () => {
                  setNewBundleOpen(false);
                  setNewBundleCats([]);
                }, children: t("cancel") })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          import_dsh_client_ui_primitives10.Modal,
          {
            open: catTarget !== null,
            onClose: () => {
              if (!savingCats) setCatTarget(null);
            },
            closeLabel: t("close"),
            title: t("bundleCatEditTitle", { name: catTarget?.name ?? "" }),
            children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: css.stackForm, children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(CategoryEditor, { value: catDraft, onChange: setCatDraft, label: t("bundleCatEdit"), suggestions: categorySuggestions }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: css.inlineForm, children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "primary", type: "button", disabled: savingCats, onClick: () => {
                  void submitCategories();
                }, children: t("bundleCatDone") }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "outline", type: "button", disabled: savingCats, onClick: () => {
                  setCatTarget(null);
                }, children: t("cancel") })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          import_dsh_client_ui_primitives10.Modal,
          {
            open: addOpen,
            onClose: () => {
              if (installing) return;
              setAddOpen(false);
              setInstall(null);
              setDropActive(false);
            },
            closeLabel: t("close"),
            title: t("addSkillsTitle"),
            children: install === null ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
              "div",
              {
                className: `${css.addCard} ${dropActive ? css.addCardActive : ""}`,
                role: "button",
                tabIndex: 0,
                "aria-label": t("addSkillsTitle"),
                onClick: () => {
                  fileInput.current?.click();
                },
                onDragOver: (event) => {
                  event.preventDefault();
                  setDropActive(true);
                },
                onDragLeave: () => {
                  setDropActive(false);
                },
                onDrop: (event) => {
                  void onDrop(event);
                },
                onKeyDown: (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInput.current?.click();
                  }
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: css.addCardHead, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.addCardIcon, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(CloudUpIcon, { size: 22 }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.addCardTitle, children: t("bannerTitle") })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.addCardSub, children: t("bannerSub") }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: css.addDrop, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(CloudUpIcon, { size: 18 }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.addDropText, children: t("dropHere") }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.addDropHint, children: t("dropFormat") })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: css.addBtn, onClick: (event) => {
                    event.stopPropagation();
                    fileInput.current?.click();
                  }, children: t("browseImport") }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                    "input",
                    {
                      ref: fileInput,
                      type: "file",
                      className: css.hiddenInput,
                      multiple: true,
                      ...{ webkitdirectory: "" },
                      onChange: (event) => {
                        acceptFiles(event.currentTarget.files === null ? null : Array.from(event.currentTarget.files));
                      }
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("form", { className: css.installForm, onSubmit: (event) => {
              void confirmInstall(event);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: css.installRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                  "input",
                  {
                    className: css.inlineInput,
                    value: installName,
                    placeholder: install.archive === true ? t("installNameFromArchive") : t("installNamePlaceholder"),
                    "aria-label": t("installName"),
                    disabled: installing || install.archive === true,
                    onChange: (event) => {
                      setInstallName(event.currentTarget.value);
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                  "input",
                  {
                    className: css.inlineInput,
                    value: installDescription,
                    placeholder: t("installDescription"),
                    "aria-label": t("installDescription"),
                    disabled: installing,
                    onChange: (event) => {
                      setInstallDescription(event.currentTarget.value);
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: css.bundleSelect, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.visuallyHidden, children: t("installBundle") }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
                    "select",
                    {
                      value: installBundleId ?? "",
                      disabled: installing,
                      onChange: (event) => {
                        setInstallBundleId(event.currentTarget.value === "" ? void 0 : event.currentTarget.value);
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "", children: t("installLoose") }),
                        bundles.map((bundle) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: bundle.id, children: bundle.name }, bundle.id))
                      ]
                    }
                  )
                ] }),
                (workspace ?? currentWorkspace) !== null && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: css.bundleSelect, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.visuallyHidden, children: t("addScopeLabel") }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
                    "select",
                    {
                      value: installScope,
                      disabled: installing,
                      onChange: (event) => {
                        setInstallScope(event.currentTarget.value === "workspace" ? "workspace" : "global");
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "global", children: t("addScopeGlobal") }),
                        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "workspace", children: t("addScopeWorkspace") })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.installMeta, children: install.archive === true ? t("uploadMeta", { n: 1, folder: install.folderName }) : t("uploadMeta", { n: install.files.length, folder: install.folderName }) })
              ] }),
              install.archive !== true && nameInvalid && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: css.error, role: "alert", children: t("installNameInvalid") }),
              install.archive !== true && !nameInvalid && trimmedName !== "" && installMetaName !== null && installMetaName !== trimmedName && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: css.installHint, children: t("installNameRewrite", { meta: installMetaName, name: trimmedName }) }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: css.installActions, children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "primary", type: "submit", disabled: installing || install.archive !== true && (trimmedName === "" || nameInvalid), children: t("installConfirm") }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "outline", type: "button", disabled: installing, onClick: () => {
                  setInstall(null);
                  setAddOpen(false);
                }, children: t("installCancel") })
              ] }),
              installError !== null && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: css.error, role: "alert", children: installError })
            ] })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          import_dsh_client_ui_primitives10.Modal,
          {
            open: confirm !== null,
            onClose: () => {
              if (!confirming) setConfirm(null);
            },
            closeLabel: t("close"),
            title: confirmTitle,
            footer: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "outline", disabled: confirming, onClick: () => {
                setConfirm(null);
              }, children: t("cancel") }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.Button, { variant: "primary", disabled: confirming, onClick: () => {
                void confirmDelete();
              }, children: t("delete") })
            ] })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          SkillViewer,
          {
            t,
            viewer,
            viewerFont,
            viewerFull,
            onFontLevel: setViewerFontLevel,
            onToggleFull: toggleViewerFull,
            onSelectFile: selectViewerFile,
            onClose: () => {
              setViewer(null);
            }
          }
        ),
        assignTarget !== null && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          import_dsh_client_ui_primitives10.Modal,
          {
            open: true,
            onClose: () => {
              setAssignTarget(null);
            },
            closeLabel: t("close"),
            title: t("assignTitle", { name: assignTarget.name }),
            className: css.assignModal,
            contentClassName: css.assignModalBody,
            children: bundles.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: css.looseEmpty, children: t("assignEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("ul", { className: css.assignList, children: bundles.map((bundle, index) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("li", { style: { listStyle: "none" }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
              "button",
              {
                type: "button",
                className: css.assignCard,
                style: { "--skm-i": index },
                onClick: () => {
                  void doAssign(assignTarget, bundle.id);
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.assignCardIcon, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.IconFolderOpenOutlineRegular, { size: 16 }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: css.assignCardBody, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.assignCardName, children: bundle.name }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.assignCardDesc, children: t("skillsCount", { n: bundle.skillCount }) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: css.assignGo, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_dsh_client_ui_primitives10.IconChevronDownOutlineRegular, { size: 14 }) })
                ]
              }
            ) }, bundle.id)) })
          }
        )
      ]
    }
  );
}

// src/client/error-boundary.tsx
var import_react16 = require("react");
var ErrorBoundary = class extends import_react16.Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { error: null });
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error(`[dsh-prompt-customizer] ${this.props.label} \u6E32\u67D3\u5D29\u6E83\uFF1A`, error, info.componentStack ?? "");
    try {
      this.props.onError?.(error);
    } catch (callbackError) {
      console.error("[dsh-prompt-customizer] \u9519\u8BEF\u8FB9\u754C\u56DE\u8C03\u5931\u8D25\uFF1A", callbackError);
    }
  }
  render() {
    if (this.state.error !== null) return this.props.fallback ?? null;
    return this.props.children;
  }
};

// src/client/sidebar-nav.tsx
var import_react17 = require("react");
var import_react_dom4 = require("react-dom");
var import_jsx_runtime13 = require("react/jsx-runtime");
var HOST_ID = "dsh-prompt-customizer-nav-host";
var ANCHOR_SELECTOR = '[data-slot="sidebar.workspaces"]';
var FRAME_SELECTOR = "div:has(> [data-shell-overlay])";
var SLOT_LAYOUT = [
  ["skills"]
];
var SLOT_NAMES = SLOT_LAYOUT.flat();
function makeSlot(name) {
  const slot = document.createElement("div");
  slot.dataset.navSlot = name;
  return slot;
}
var started = false;
var pollTimer = 0;
var hostObserver;
function ensureHostPlaced() {
  const anchor = document.querySelector(ANCHOR_SELECTOR);
  if (anchor === null) return false;
  const parent = anchor.parentElement;
  if (parent === null) return false;
  let host = document.getElementById(HOST_ID);
  if (host === null) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.dataset.plugin = "dsh-prompt-customizer";
    for (const row of SLOT_LAYOUT) {
      for (const name of row) host.appendChild(makeSlot(name));
    }
  }
  const inPlace = host.parentElement === parent && (anchor.compareDocumentPosition(host) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
  if (!inPlace) {
    parent.insertBefore(host, anchor);
  }
  return true;
}
function watchHostParent() {
  const parent = document.getElementById(HOST_ID)?.parentElement;
  if (parent === void 0) return;
  hostObserver?.disconnect();
  hostObserver = new MutationObserver(() => {
    const before = document.getElementById(HOST_ID)?.parentElement;
    ensureHostPlaced();
    if (document.getElementById(HOST_ID)?.parentElement !== before) watchHostParent();
  });
  hostObserver.observe(parent, { childList: true });
}
function ensureNavMount() {
  if (typeof document === "undefined") return () => {
  };
  if (started) return () => {
  };
  started = true;
  ensureHostPlaced();
  watchHostParent();
  pollTimer = window.setInterval(() => {
    ensureHostPlaced();
    if (hostObserver === void 0) watchHostParent();
  }, 1500);
  return () => {
    window.clearInterval(pollTimer);
    pollTimer = 0;
    hostObserver?.disconnect();
    hostObserver = void 0;
    started = false;
    document.getElementById(HOST_ID)?.remove();
  };
}
function useNavSlot(name) {
  const [slot, setSlot] = (0, import_react17.useState)(null);
  (0, import_react17.useEffect)(() => {
    let timer = 0;
    let tries = 0;
    const poll = () => {
      const found = document.querySelector(`[data-nav-slot='${name}']`);
      if (found !== null) tries = 0;
      else tries += 1;
      setSlot(found);
      timer = window.setTimeout(poll, found !== null ? 800 : tries <= 10 ? 100 : 400);
    };
    poll();
    return () => {
      window.clearTimeout(timer);
    };
  }, [name]);
  return slot;
}
function useRail() {
  const [rail, setRail] = (0, import_react17.useState)(() => document.querySelector(FRAME_SELECTOR)?.hasAttribute("data-sidebar-collapsed") ?? false);
  (0, import_react17.useEffect)(() => {
    const read = () => {
      setRail(document.querySelector(FRAME_SELECTOR)?.hasAttribute("data-sidebar-collapsed") ?? false);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-sidebar-collapsed"], subtree: true });
    const timer = window.setInterval(read, 1500);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);
  return rail;
}
var STYLE_ID5 = "dsh-prompt-customizer-nav-styles";
var SHEET5 = `
/* \u5BFC\u822A\u884C\uFF1A\u4E0E\u539F\u751F\u5BFC\u822A\u884C\u540C\u6B3E\u51E0\u4F55\uFF08\u900F\u660E\u5E95 + hover \u9AD8\u4EAE + \u6587\u5B57\u7701\u7565\uFF09 */
.dsh-nav-btn{position:relative;display:flex;align-items:center;gap:8px;width:calc(100% - 4px);height:34px;padding:0 10px;margin:0 2px 4px;box-sizing:border-box;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,#eee);font-size:14px;line-height:20px;font-family:inherit;cursor:pointer;text-align:left;user-select:none;overflow:hidden;transition:background 120ms ease}
.dsh-nav-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-nav-btn[data-open='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-nav-btn>svg{flex:none;color:var(--dsw-alias-label-secondary,#bbb)}
.dsh-nav-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* \u6298\u53E0 rail \u6001\uFF1A\u53EA\u7559\u56FE\u6807 */
.dsh-nav-btn[data-rail='true']{width:36px;height:36px;padding:0;margin:0 0 8px;justify-content:center;border-radius:8px}
/* nav host\uFF1A\u5404\u884C\u7EB5\u5411\u5806\u53E0\uFF1B\u69FD\u4F4D display:contents\uFF0C\u6309\u94AE\u76F4\u63A5\u6491\u6EE1\u6574\u884C\u3002 */
#dsh-prompt-customizer-nav-host{display:flex;flex-direction:column;align-items:stretch;width:100%}
#dsh-prompt-customizer-nav-host>[data-nav-slot]{display:contents}
`;
function ensureNavStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID5) !== null) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID5;
  tag.dataset.plugin = "dsh-prompt-customizer";
  tag.textContent = SHEET5;
  document.head.appendChild(tag);
}
function NavButton({
  icon,
  label,
  rail = false,
  expanded = false,
  ariaLabel,
  onMouseEnter,
  onMouseLeave,
  onClick
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
    "button",
    {
      type: "button",
      className: "dsh-nav-btn",
      "data-rail": rail || void 0,
      "data-open": expanded || void 0,
      "aria-label": ariaLabel ?? label,
      "aria-expanded": expanded,
      title: rail ? ariaLabel ?? label : void 0,
      onMouseEnter,
      onMouseLeave,
      onClick,
      children: [
        icon,
        !rail && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "dsh-nav-label", children: label })
      ]
    }
  );
}
function NavPortal({ name, children }) {
  const slot = useNavSlot(name);
  if (slot === null) return null;
  return (0, import_react_dom4.createPortal)(children, slot);
}
var PANEL_OPEN_EVENT = "dsh-prompt-customizer:panel-open";
function clickInSidebar(target) {
  let node = target;
  while (node !== null && node !== document.body) {
    const rect = node.getBoundingClientRect();
    if (rect.height >= window.innerHeight * 0.7 && rect.left <= 8 && rect.right <= window.innerWidth * 0.6) return true;
    node = node.parentElement;
  }
  return false;
}
function usePanelAutoClose(name, open, requestClose) {
  (0, import_react17.useEffect)(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent(PANEL_OPEN_EVENT, { detail: name }));
  }, [open, name]);
  (0, import_react17.useEffect)(() => {
    if (!open) return void 0;
    const onSiblingOpen = (event) => {
      if (event.detail !== name) requestClose();
    };
    const onDocClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(`#${HOST_ID}, .psh-card`) !== null) return;
      if (clickInSidebar(target)) requestClose();
    };
    window.addEventListener(PANEL_OPEN_EVENT, onSiblingOpen);
    document.addEventListener("click", onDocClick, true);
    return () => {
      window.removeEventListener(PANEL_OPEN_EVENT, onSiblingOpen);
      document.removeEventListener("click", onDocClick, true);
    };
  }, [open, name, requestClose]);
}
function navAnchorFrom(el) {
  if (el === null) return null;
  const row = el.closest(`#${HOST_ID}`);
  if (row === null) return null;
  const rowRect = row.getBoundingClientRect();
  const btnRect = el.getBoundingClientRect();
  return { left: Math.round(rowRect.right + 8), top: Math.round(btnRect.top - 6) };
}

// src/client/skills/entry.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function anchorFromEvent(e) {
  return navAnchorFrom(e.currentTarget);
}
function SkillsEntry() {
  ensureModalAnimStyles();
  ensureShellStyles();
  const [open, setOpen] = (0, import_react18.useState)(false);
  const [anchor, setAnchor] = (0, import_react18.useState)(null);
  const onClose = (0, import_react18.useCallback)(() => {
    setOpen(false);
  }, []);
  const { closing, requestClose } = useModalClose(open, onClose);
  const rail = useRail();
  usePanelAutoClose("skills", open, requestClose);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      NavButton,
      {
        icon: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("svg", { width: rail ? 18 : 16, height: rail ? 18 : 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("path", { d: "M13 2 3 14h7l-1 8 10-12h-7l1-8z" }) }),
        label: "\u80FD\u529B",
        rail,
        expanded: open,
        onClick: (e) => {
          e.stopPropagation();
          setAnchor(anchorFromEvent(e));
          setOpen(true);
        }
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ErrorBoundary, { label: "\u6280\u80FD\u9762\u677F", fallback: null, onError: requestClose, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SkillsPanel, { closing, onClose: requestClose, anchor }) })
  ] });
}
function SkillsNavApp() {
  ensureNavStyles();
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(NavPortal, { name: "skills", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SkillsEntry, {}) });
}
function apply(ctx) {
  ctx.effect(() => {
    ensureNavMount();
    const holder = document.createElement("div");
    const root = (0, import_client.createRoot)(holder);
    root.render(/* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SkillsNavApp, {}));
    return () => {
      root.unmount();
    };
  }, "triad: skills nav entry");
}

// src/client/index.ts
var inject = ["slots", "locale", "inputTriggers", "sessions"];
function safe(label, run, ctx) {
  try {
    run(ctx);
  } catch (error) {
    console.error(`[dsh-prompt-customizer] ${label} failed:`, error);
  }
}
function apply2(ctx) {
  safe("skills panel", apply, ctx);
  safe("prompt locale", applyPrompt, ctx);
}
return module.exports; } });
//# sourceMappingURL=client.js.map
