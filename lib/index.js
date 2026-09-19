import { createRequire as __pcCreateRequire } from 'node:module';
const require = __pcCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = Symbol.for("yaml.alias");
    var DOC = Symbol.for("yaml.document");
    var MAP = Symbol.for("yaml.map");
    var PAIR = Symbol.for("yaml.pair");
    var SCALAR = Symbol.for("yaml.scalar");
    var SEQ = Symbol.for("yaml.seq");
    var NODE_TYPE = Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path4) {
      const ctrl = callVisitor(key, node, visitor, path4);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path4, ctrl);
        return visit_(key, ctrl, visitor, path4);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path4 = Object.freeze(path4.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path4);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path4 = Object.freeze(path4.concat(node));
          const ck = visit_("key", node.key, visitor, path4);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path4);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path4) {
      const ctrl = await callVisitor(key, node, visitor, path4);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path4, ctrl);
        return visitAsync_(key, ctrl, visitor, path4);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path4 = Object.freeze(path4.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path4);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path4 = Object.freeze(path4.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path4);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path4);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path4) {
      if (typeof visitor === "function")
        return visitor(key, node, path4);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path4);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path4);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path4);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path4);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path4);
      return void 0;
    }
    function replaceNode(key, path4, node) {
      const parent = path4[path4.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml2, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml2);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name2 = parts.shift();
        switch (name2) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle6, prefix] = parts;
            this.tags[handle6] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name2}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle6, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle6];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle6 === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle6, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle6 + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle6, prefix] of tagEntries) {
          if (handle6 === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle6} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name2 = `${prefix}${i}`;
        if (!exclude.has(name2))
          return name2;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type2) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type2 });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map2 = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map2.items.push(value);
        return map2;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema2, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema2.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema2[identity.MAP] : Symbol.iterator in Object(value) ? schema2[identity.SEQ] : schema2[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema2, path4, value) {
      let v = value;
      for (let i = path4.length - 1; i >= 0; --i) {
        const k = path4[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema: schema2,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path4) => path4 == null || typeof path4 === "object" && !!path4[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type2, schema2) {
        super(type2);
        Object.defineProperty(this, "schema", {
          value: schema2,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema2) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema2)
          copy.schema = schema2;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema2) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path4, value) {
        if (isEmptyPath(path4))
          this.add(value);
        else {
          const [key, ...rest] = path4;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path4) {
        const [key, ...rest] = path4;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path4, keepScalar) {
        const [key, ...rest] = path4;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path4) {
        const [key, ...rest] = path4;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path4, value) {
        const [key, ...rest] = path4;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str2) => str2.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str2, indent, comment) => str2.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str2.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str2) => /^(%|---|\.\.\.)/m.test(str2);
    function lineLengthOverLimit(str2, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str2.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str2[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json5 = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json5;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str2 = "";
      let start = 0;
      for (let i = 0, ch = json5[i]; ch; ch = json5[++i]) {
        if (ch === " " && json5[i + 1] === "\\" && json5[i + 2] === "n") {
          str2 += json5.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json5[i + 1]) {
            case "u":
              {
                str2 += json5.slice(start, i);
                const code = json5.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str2 += "\\0";
                    break;
                  case "0007":
                    str2 += "\\a";
                    break;
                  case "000b":
                    str2 += "\\v";
                    break;
                  case "001b":
                    str2 += "\\e";
                    break;
                  case "0085":
                    str2 += "\\N";
                    break;
                  case "00a0":
                    str2 += "\\_";
                    break;
                  case "2028":
                    str2 += "\\L";
                    break;
                  case "2029":
                    str2 += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str2 += "\\x" + code.substr(2);
                    else
                      str2 += json5.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json5[i + 2] === '"' || json5.length < minMultiLineLength) {
                i += 1;
              } else {
                str2 += json5.slice(start, i) + "\n\n";
                while (json5[i + 2] === "\\" && json5[i + 3] === "n" && json5[i + 4] !== '"') {
                  str2 += "\n";
                  i += 2;
                }
                str2 += indent;
                if (json5[i + 2] === " ")
                  str2 += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str2 = start ? str2 + json5.slice(start) : json5;
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type: type2, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type2 === Scalar.Scalar.BLOCK_FOLDED ? false : type2 === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type2 !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type: type2, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type2 !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str2 = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str2);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type: type2 } = item;
      if (type2 !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type2 = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type2);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name2 = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name2} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify2(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str2 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str2;
      return identity.isScalar(node) || str2[0] === "{" || str2[0] === "[" ? `${props} ${str2}` : `${props}
${ctx.indent}${str2}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str2 = stringify2.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str2.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str2 === "" ? "?" : explicitKey ? `? ${str2}` : str2;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str2 = `? ${str2}`;
        if (keyComment && !keyCommentDone) {
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str2;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        str2 = `? ${str2}
${indent}:`;
      } else {
        str2 = `${str2}:`;
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str2.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify2.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str2 += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str2;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge3 = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge3.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge3.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge3.tag && tag.default);
    function addMergeToJSMap(ctx, map2, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map2, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map2, it);
      else
        mergeValue(ctx, map2, source);
    }
    function mergeValue(ctx, map2, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map2 instanceof Map) {
          if (!map2.has(key))
            map2.set(key, value2);
        } else if (map2 instanceof Set) {
          map2.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map2, key)) {
          Object.defineProperty(map2, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map2;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge3;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge3 = require_merge();
    var stringify2 = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map2, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map2, value);
      else if (merge3.isMergeKey(ctx, key))
        merge3.addMergeToJSMap(ctx, map2, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map2 instanceof Map) {
          map2.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map2 instanceof Set) {
          map2.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map2)
            Object.defineProperty(map2, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map2[stringKey] = jsValue;
        }
      }
      return map2;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify2.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema2) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema2);
        if (identity.isNode(value))
          value = value.clone(schema2);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify3 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify3(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str3 = stringify2.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str3);
      }
      let str2;
      if (lines.length === 0) {
        str2 = flowChars.start + flowChars.end;
      } else {
        str2 = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str2 += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str2 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str2;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str2 = stringify2.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str2.includes("\n"));
        if (i < items.length - 1) {
          str2 += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str2.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str2 += ",";
          }
        }
        if (comment)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment));
        lines.push(str2);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str2 = start;
          for (const line of lines)
            str2 += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str2}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema2) {
        super(identity.MAP, schema2);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema2, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map2 = new this(schema2);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map2.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema2.sortMapEntries === "function") {
          map2.items.sort(schema2.sortMapEntries);
        }
        return map2;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type2) {
        const map2 = Type2 ? new Type2() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map2);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map2, item);
        return map2;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map2 = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map3, onError) {
        if (!identity.isMap(map3))
          onError("Expected a mapping for this tag");
        return map3;
      },
      createNode: (schema2, obj, ctx) => YAMLMap.YAMLMap.from(schema2, obj, ctx)
    };
    exports.map = map2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema2) {
        super(identity.SEQ, schema2);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq2 = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq2);
        let i = 0;
        for (const item of this.items)
          seq2.push(toJS.toJS(item, String(i++), ctx));
        return seq2;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema2, obj, ctx) {
        const { replacer } = ctx;
        const seq2 = new this(schema2);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq2.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq2;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq2 = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq3, onError) {
        if (!identity.isSeq(seq3))
          onError("Expected a sequence for this tag");
        return seq3;
      },
      createNode: (schema2, obj, ctx) => YAMLSeq.YAMLSeq.from(schema2, obj, ctx)
    };
    exports.seq = seq2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str2) => str2,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str2) => new Scalar.Scalar(str2[0] === "t" || str2[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float2 = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2));
        const dot = str2.indexOf(".");
        if (dot !== -1 && str2[str2.length - 1] === "0")
          node.minFractionDigits = str2.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float2;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str2, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int2 = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int2;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map2 = require_map();
    var _null2 = require_null();
    var seq2 = require_seq();
    var string = require_string();
    var bool2 = require_bool();
    var float2 = require_float();
    var int2 = require_int();
    var schema2 = [
      map2.map,
      seq2.seq,
      string.string,
      _null2.nullTag,
      bool2.boolTag,
      int2.intOct,
      int2.int,
      int2.intHex,
      float2.floatNaN,
      float2.floatExp,
      float2.float
    ];
    exports.schema = schema2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map2 = require_map();
    var seq2 = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str2) => str2,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str2) => str2 === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str2, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str2) => parseFloat(str2),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str2, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str2)}`);
        return str2;
      }
    };
    var schema2 = [map2.map, seq2.seq].concat(jsonScalars, jsonError);
    exports.schema = schema2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary2 = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str2 = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str2.length);
          for (let i = 0; i < str2.length; ++i)
            buffer[i] = str2.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type: type2, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str2;
        if (typeof node_buffer.Buffer === "function") {
          str2 = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str2 = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type2 ?? (type2 = Scalar.Scalar.BLOCK_LITERAL);
        if (type2 !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str2.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str2.substr(o, lineWidth);
          }
          str2 = lines.join(type2 === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type: type2, value: str2 }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq2, onError) {
      if (identity.isSeq(seq2)) {
        for (let i = 0; i < seq2.items.length; ++i) {
          let item = seq2.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq2.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq2;
    }
    function createPairs(schema2, iterable, ctx) {
      const { replacer } = ctx;
      const pairs3 = new YAMLSeq.YAMLSeq(schema2);
      pairs3.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs3.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs3;
    }
    var pairs2 = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs2;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs2 = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map2 = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map2);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map2.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map2.set(key, value);
        }
        return map2;
      }
      static from(schema2, iterable, ctx) {
        const pairs$1 = pairs2.createPairs(schema2, iterable, ctx);
        const omap3 = new this();
        omap3.items = pairs$1.items;
        return omap3;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap2 = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq2, onError) {
        const pairs$1 = pairs2.resolvePairs(seq2, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema2, iterable, ctx) => YAMLOMap.from(schema2, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float2 = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2.replace(/_/g, "")));
        const dot = str2.indexOf(".");
        if (dot !== -1) {
          const f = str2.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float2;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str2, offset, radix, { intAsBigInt }) {
      const sign = str2[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str2 = str2.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str2 = `0b${str2}`;
            break;
          case 8:
            str2 = `0o${str2}`;
            break;
          case 16:
            str2 = `0x${str2}`;
            break;
        }
        const n2 = BigInt(str2);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str2, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str2 = value.toString(radix);
        return value < 0 ? "-" + prefix + str2.substr(1) : prefix + str2;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int2 = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int2;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema2) {
        super(schema2);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema2, iterable, ctx) {
        const { replacer } = ctx;
        const set4 = new this(schema2);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set4.items.push(Pair.createPair(value, null, ctx));
          }
        return set4;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set3 = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema2, iterable, ctx) => YAMLSet.from(schema2, iterable, ctx),
      resolve(map2, onError) {
        if (identity.isMap(map2)) {
          if (map2.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map2);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map2;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set3;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str2, asBigInt) {
      const sign = str2[0];
      const parts = sign === "-" || sign === "+" ? str2.substring(1) : str2;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str2, _onError, { intAsBigInt }) => parseSexagesimal(str2, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str2) => parseSexagesimal(str2, false),
      stringify: stringifySexagesimal
    };
    var timestamp2 = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str2) {
        const match = str2.match(timestamp2.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date2 = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date2 -= 6e4 * d;
        }
        return new Date(date2);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map2 = require_map();
    var _null2 = require_null();
    var seq2 = require_seq();
    var string = require_string();
    var binary2 = require_binary();
    var bool2 = require_bool2();
    var float2 = require_float2();
    var int2 = require_int2();
    var merge3 = require_merge();
    var omap2 = require_omap();
    var pairs2 = require_pairs();
    var set3 = require_set();
    var timestamp2 = require_timestamp();
    var schema2 = [
      map2.map,
      seq2.seq,
      string.string,
      _null2.nullTag,
      bool2.trueTag,
      bool2.falseTag,
      int2.intBin,
      int2.intOct,
      int2.int,
      int2.intHex,
      float2.floatNaN,
      float2.floatExp,
      float2.float,
      binary2.binary,
      merge3.merge,
      omap2.omap,
      pairs2.pairs,
      set3.set,
      timestamp2.intTime,
      timestamp2.floatTime,
      timestamp2.timestamp
    ];
    exports.schema = schema2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map2 = require_map();
    var _null2 = require_null();
    var seq2 = require_seq();
    var string = require_string();
    var bool2 = require_bool();
    var float2 = require_float();
    var int2 = require_int();
    var schema2 = require_schema();
    var schema$1 = require_schema2();
    var binary2 = require_binary();
    var merge3 = require_merge();
    var omap2 = require_omap();
    var pairs2 = require_pairs();
    var schema$2 = require_schema3();
    var set3 = require_set();
    var timestamp2 = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema2.schema],
      ["failsafe", [map2.map, seq2.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary2.binary,
      bool: bool2.boolTag,
      float: float2.float,
      floatExp: float2.floatExp,
      floatNaN: float2.floatNaN,
      floatTime: timestamp2.floatTime,
      int: int2.int,
      intHex: int2.intHex,
      intOct: int2.intOct,
      intTime: timestamp2.intTime,
      map: map2.map,
      merge: merge3.merge,
      null: _null2.nullTag,
      omap: omap2.omap,
      pairs: pairs2.pairs,
      seq: seq2.seq,
      set: set3.set,
      timestamp: timestamp2.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary2.binary,
      "tag:yaml.org,2002:merge": merge3.merge,
      "tag:yaml.org,2002:omap": omap2.omap,
      "tag:yaml.org,2002:pairs": pairs2.pairs,
      "tag:yaml.org,2002:set": set3.set,
      "tag:yaml.org,2002:timestamp": timestamp2.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge3.merge) ? schemaTags.concat(merge3.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge3.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map2 = require_map();
    var seq2 = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema3 = class _Schema {
      constructor({ compat, customTags, merge: merge3, resolveKnownTags, schema: schema2, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema2 === "string" && schema2 || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge3);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map2.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq2.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema3;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify2.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify2.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify2.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema3 = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path4, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path4, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name2) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name2 || prev.has(name2) ? anchors.findNewAnchor(name2 || "a", prev) : name2;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path4) {
        if (Collection.isEmptyPath(path4)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path4) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path4, keepScalar) {
        if (Collection.isEmptyPath(path4))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path4, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path4) {
        if (Collection.isEmptyPath(path4))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path4) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path4, value) {
        if (Collection.isEmptyPath(path4)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path4), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path4, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema3.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json: json5, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json5,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name2, pos, code, message) {
        super();
        this.name = name2;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map2 = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep2, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep2) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map2.comment)
                map2.comment += "\n" + keyProps.comment;
              else
                map2.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map2.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep2 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep2, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map2.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map2.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map2.range = [bm.offset, offset, commentEnd ?? offset];
      return map2;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq2 = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq2.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq2.items.push(node);
      }
      seq2.range = [bs.offset, offset, commentEnd ?? offset];
      return seq2;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep2 = "";
        for (const token of end) {
          const { source, type: type2 } = token;
          switch (type2) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep2 + cb;
              sep2 = "";
              break;
            }
            case "newline":
              if (comment)
                sep2 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type2} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep2, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep2 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep2 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep2, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep2 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep2)
                for (const st of sep2) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep2, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map2 = coll;
            if (utilMapIncludes.mapIncludes(ctx, map2.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map2.items.push(pair);
          } else {
            const map2 = new YAMLMap.YAMLMap(ctx.schema);
            map2.flow = true;
            map2.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map2.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map2);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name2 = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name2} must end with a ${expectedEnd}` : `${name2} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type2 = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type: type2, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep2 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type2 === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep2 === " ")
            sep2 = "\n";
          else if (!prevMoreIndented && sep2 === "\n")
            sep2 = "\n\n";
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep2 === "\n")
            value += "\n";
          else
            sep2 = "\n";
        } else {
          value += sep2 + content;
          sep2 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type: type2, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type: type2, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type2) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type2}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep2 = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep2 === "\n")
            res += sep2;
          else
            sep2 = "\n";
        } else {
          res += sep2 + match[1];
          sep2 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep2 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type: type2, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type2)
        scalar.type = type2;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema2, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema2[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema2.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema2.knownTags[tagName];
      if (kt && !kt.collection) {
        schema2.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema2[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema: schema2 }, value, token, onError) {
      const tag = schema2.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema2[identity.SCALAR];
      if (schema2.compat) {
        const compat = schema2.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema2[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type: type2 = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type: type2, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type: type2 } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type2)
        switch (token.type) {
          case "single-quoted-scalar":
            type2 = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type2 = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type2 = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type2 = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type: type2, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type2) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type2;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type: type2, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type: type2, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type: type2, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep2, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep2)
        for (const st of sep2)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path4) => {
      let item = cst;
      for (const [field, index] of path4) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path4) => {
      const parent = visit.itemAtPath(cst, path4.slice(0, -1));
      const field = path4[path4.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path4, item, visitor) {
      let ctrl = visitor(item, path4);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path4.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path4);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path4) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type2) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type2)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type2 = cst.tokenType(source);
        if (!type2) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type2 === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type2;
          yield* this.step();
          switch (type2) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep2;
          if (scalar.end) {
            sep2 = scalar.end;
            sep2.push(this.sourceToken);
            delete scalar.end;
          } else
            sep2 = [this.sourceToken];
          const map2 = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep2 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map2;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map2) {
        const it = map2.items[map2.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map2.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map2.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map2.indent)) {
                const prev = map2.items[map2.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map2.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map2.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map2.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map2.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map2.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map2.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map2.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep2 = it.sep;
                  sep2.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep2 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map2.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs3 = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map2.items.push({ start, key: fs3, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs3);
              } else {
                Object.assign(it, { key: fs3, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map2);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map2.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq2) {
        const it = seq2.items[seq2.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq2.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq2.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq2.indent)) {
                const prev = seq2.items[seq2.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq2.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq2.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq2.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq2.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq2.indent) {
          const bv = this.startBlockValue(seq2);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs3 = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs3, sep: [] });
              else if (it.sep)
                this.stack.push(fs3);
              else
                Object.assign(it, { key: fs3, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep2 = fc.end.splice(1, fc.end.length);
            sep2.push(this.sourceToken);
            const map2 = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep2 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map2;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type2) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type: type2,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse2(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify2(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse2;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify2;
  }
});

// node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema3 = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema3.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// vendor/skill-manager/skills-host.js
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { URL as URL2 } from "node:url";
import { inflateRawSync } from "node:zlib";
var SKILL_FILE = "SKILL.md";
var BUNDLES_FILE = ".bundles.json";
var ROUTE_PREFIX = "/api/skill-manager";
var NAME_MAX = 64;
var NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
var ARCHIVE_MAX_ENTRIES = 2e3;
var ARCHIVE_MAX_TOTAL = 200 * 1024 * 1024;
function unzipArchive(buffer) {
  if (buffer.length < 22) throw new Error("not a zip archive");
  let eocd = -1;
  const tailStart = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= tailStart; i--) {
    if (buffer.readUInt32LE(i) === 101010256) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip archive");
  const totalEntries = buffer.readUInt16LE(eocd + 10);
  if (totalEntries === 0 || totalEntries > ARCHIVE_MAX_ENTRIES) throw new Error("archive has too many entries");
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  const files = [];
  let pos = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (pos + 46 > buffer.length || buffer.readUInt32LE(pos) !== 33639248) break;
    const method = buffer.readUInt16LE(pos + 10);
    const compSize = buffer.readUInt32LE(pos + 20);
    const nameLen = buffer.readUInt16LE(pos + 28);
    const extraLen = buffer.readUInt16LE(pos + 30);
    const commentLen = buffer.readUInt16LE(pos + 32);
    const localOffset = buffer.readUInt32LE(pos + 42);
    const name2 = buffer.subarray(pos + 46, pos + 46 + nameLen).toString("utf8").replace(/\\/g, "/");
    if (!name2.endsWith("/") && name2 !== "") {
      if (method !== 0 && method !== 8) throw new Error(`unsupported zip compression method ${String(method)}`);
      const lhNameLen = buffer.readUInt16LE(localOffset + 26);
      const lhExtraLen = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
      if (dataStart + compSize > buffer.length) throw new Error("corrupt zip archive");
      const raw = buffer.subarray(dataStart, dataStart + compSize);
      const data = method === 0 ? Buffer.from(raw) : inflateRawSync(raw);
      files.push({ name: name2, data });
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  if (files.length === 0) throw new Error("archive contains no files");
  let total = 0;
  for (const file of files) {
    total += file.data.length;
    if (total > ARCHIVE_MAX_TOTAL) throw new Error("archive too large");
  }
  return files;
}
function managedRoot() {
  const agentsHome = process.env.DSH_AGENTS_HOME ?? join(homedir(), ".agents");
  return join(agentsHome, "skills");
}
function dshRoot() {
  const dshHome6 = process.env.DSH_HOME ?? join(homedir(), ".dsh");
  return join(dshHome6, "skills");
}
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  const block = match?.[1];
  if (block === void 0) return {};
  const fields = {};
  for (const line of block.split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    const key = pair?.[1];
    const valueText = pair?.[2];
    if (key === void 0 || valueText === void 0) continue;
    const value = valueText.trim();
    if (value === "true") fields[key] = true;
    else if (value === "false") fields[key] = false;
    else fields[key] = value;
  }
  return fields;
}
async function walkSkillDir(dir, prefix, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await walkSkillDir(join(dir, entry.name), rel, out);
    else out.push(rel);
  }
}
async function readSkillMeta(root, dir) {
  let raw;
  try {
    raw = await readFile(join(root, dir, SKILL_FILE), "utf8");
  } catch {
    return void 0;
  }
  const fields = parseFrontmatter(raw);
  const name2 = typeof fields.name === "string" && fields.name !== "" ? fields.name : dir;
  const files = [];
  await walkSkillDir(join(root, dir), "", files);
  return {
    name: name2,
    dir,
    description: typeof fields.description === "string" ? fields.description : "",
    compatibility: typeof fields.compatibility === "string" ? fields.compatibility : "",
    fileCount: files.length,
    files: files.slice(0, 200),
    root: rootLabel(root)
  };
}
function rootLabel(root) {
  if (root === managedRoot()) return "agents";
  if (root === dshRoot()) return "dsh";
  return "other";
}
async function listRootSkills(root) {
  const views = [];
  let entries = [];
  try {
    entries = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return views;
  }
  for (const dir of entries) {
    const meta = await readSkillMeta(root, dir);
    if (meta !== void 0) views.push(meta);
  }
  return views;
}
async function readBundles(root) {
  try {
    const parsed = JSON.parse(await readFile(join(root, BUNDLES_FILE), "utf8"));
    if (typeof parsed === "object" && parsed !== null && parsed.version === 1 && Array.isArray(parsed.bundles)) {
      return parsed;
    }
  } catch {
  }
  return { version: 1, bundles: [] };
}
async function writeBundles(root, file) {
  await mkdir(root, { recursive: true });
  const target = join(root, BUNDLES_FILE);
  const temp = `${target}.tmp`;
  await writeFile(temp, `${JSON.stringify(file, null, 2)}
`, "utf8");
  await rename(temp, target);
}
var CATEGORY_MAX_LEN = 24;
var CATEGORY_MAX_PER_BUNDLE = 8;
function normalizeCategories(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim().slice(0, CATEGORY_MAX_LEN);
    if (trimmed === "" || out.includes(trimmed)) continue;
    if (out.length >= CATEGORY_MAX_PER_BUNDLE) break;
    out.push(trimmed);
  }
  return out;
}
function categoriesOf(record) {
  return normalizeCategories(record.categories);
}
function checkedName(name2) {
  const trimmed = name2.trim();
  if (trimmed === "" || trimmed.length > NAME_MAX) {
    throw new Error(`name must be 1-${String(NAME_MAX)} characters`);
  }
  return trimmed;
}
function resolveSkillFile(base, path4) {
  if (path4 === "" || path4.includes("\0") || path4.includes("\\")) {
    throw new Error(`unsupported skill file path: ${JSON.stringify(path4)}`);
  }
  const target = resolve(base, path4);
  const within = relative(resolve(base), target);
  if (within === "" || within.startsWith("..") || within.includes(sep + "..")) {
    throw new Error(`skill file escapes its directory: ${JSON.stringify(path4)}`);
  }
  return target;
}
async function allSkills() {
  const views = [];
  const seenDir = /* @__PURE__ */ new Set();
  const seenName = /* @__PURE__ */ new Set();
  for (const root of [managedRoot(), dshRoot()]) {
    for (const skill of await listRootSkills(root)) {
      const dirKey = skill.root + "/" + skill.dir;
      if (seenDir.has(dirKey)) continue;
      seenDir.add(dirKey);
      if (seenName.has(skill.name)) continue;
      seenName.add(skill.name);
      views.push(skill);
    }
  }
  return views;
}
function indexSkills(views) {
  const byName = /* @__PURE__ */ new Map();
  const byDir = /* @__PURE__ */ new Map();
  for (const skill of views) {
    if (!byName.has(skill.name)) byName.set(skill.name, skill);
    if (!byDir.has(skill.dir)) byDir.set(skill.dir, skill);
  }
  return { byName, byDir };
}
function resolveSkillEntry(entry, index) {
  const hit = index.byName.get(entry) ?? index.byDir.get(entry);
  return hit === void 0 ? void 0 : hit.name;
}
async function viewsOf(entries) {
  const index = indexSkills(await allSkills());
  const views = [];
  for (const entry of entries) {
    const name2 = resolveSkillEntry(entry, index);
    if (name2 === void 0) continue;
    if (views.some((view) => view.name === name2)) continue;
    const skill = index.byName.get(name2);
    if (skill !== void 0) views.push(skill);
  }
  return views;
}
function checkedLookupName(value) {
  const name2 = checkedName(value);
  if (name2 === "." || name2 === ".." || name2.includes("/") || name2.includes("\\") || name2.includes(sep)) {
    throw new Error(`invalid skill name ${JSON.stringify(name2)}`);
  }
  return name2;
}
async function locateSkillDir(name2) {
  const roots = [managedRoot(), dshRoot()];
  for (const root of roots) {
    const candidate = join(root, name2);
    try {
      if ((await stat(candidate)).isDirectory()) return candidate;
    } catch {
    }
  }
  for (const root of roots) {
    let entries = [];
    try {
      entries = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      continue;
    }
    for (const dir of entries) {
      const meta = await readSkillMeta(root, dir);
      if (meta !== void 0 && meta.name === name2) return join(root, dir);
    }
  }
  return void 0;
}
async function snapshot() {
  const root = managedRoot();
  const views = await allSkills();
  const index = indexSkills(views);
  const ledger = await readBundles(root);
  const bundles = [];
  const healed = [];
  const assigned = /* @__PURE__ */ new Set();
  for (const record of ledger.bundles) {
    const skills = [];
    const canonical = [];
    const missing = [];
    let changed = false;
    for (const entry of record.skills) {
      const name2 = resolveSkillEntry(entry, index);
      if (name2 === void 0) {
        missing.push(entry);
        canonical.push(entry);
        continue;
      }
      if (canonical.includes(name2)) {
        changed = true;
        continue;
      }
      if (name2 !== entry) changed = true;
      canonical.push(name2);
      const skill = index.byName.get(name2);
      if (skill !== void 0) skills.push(skill);
      assigned.add(name2);
    }
    bundles.push({ id: record.id, name: record.name, skillCount: skills.length, skills, missingSkills: missing, categories: categoriesOf(record) });
    if (changed) {
      Object.assign(record, { skills: canonical });
      healed.push(record.id);
    }
  }
  const loose = views.filter((skill) => !assigned.has(skill.name));
  if (healed.length > 0) {
    try {
      await writeBundles(root, { version: 1, bundles: ledger.bundles });
    } catch {
    }
  }
  return { bundles, loose };
}
async function createBundle(body) {
  const name2 = checkedName(typeof body.name === "string" ? body.name : "");
  const categories = normalizeCategories(body.categories);
  const root = managedRoot();
  const ledger = await readBundles(root);
  if (ledger.bundles.some((bundle) => bundle.name === name2)) {
    throw new Error(`bundle "${name2}" already exists`);
  }
  const base = name2.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "bundle";
  let id = base;
  let suffix = 2;
  while (ledger.bundles.some((bundle) => bundle.id === id)) {
    id = `${base}-${String(suffix)}`;
    suffix += 1;
  }
  const record = { id, name: name2, skills: [], categories };
  await writeBundles(root, { version: 1, bundles: [...ledger.bundles, record] });
  return { id, name: name2, skillCount: 0, skills: [], missingSkills: [], categories };
}
async function renameBundle(id, body) {
  const root = managedRoot();
  const ledger = await readBundles(root);
  const index = ledger.bundles.findIndex((bundle) => bundle.id === id);
  const existing = index === -1 ? void 0 : ledger.bundles[index];
  if (existing === void 0) throw new Error(`bundle ${JSON.stringify(id)} not found`);
  const nextName = typeof body.name === "string" && body.name.trim() !== "" ? checkedName(body.name) : existing.name;
  if (nextName !== existing.name && ledger.bundles.some((bundle, i) => i !== index && bundle.name === nextName)) {
    throw new Error(`bundle "${nextName}" already exists`);
  }
  const record = { ...existing, name: nextName };
  if (Array.isArray(body.categories)) record.categories = normalizeCategories(body.categories);
  const bundles = [...ledger.bundles];
  bundles[index] = record;
  await writeBundles(root, { version: 1, bundles });
  const skills = await viewsOf(record.skills);
  return { id: record.id, name: nextName, skillCount: skills.length, skills, missingSkills: [], categories: categoriesOf(record) };
}
async function deleteBundle(id) {
  const root = managedRoot();
  const ledger = await readBundles(root);
  const bundles = ledger.bundles.filter((bundle) => bundle.id !== id);
  if (bundles.length === ledger.bundles.length) {
    throw new Error(`bundle ${JSON.stringify(id)} not found`);
  }
  await writeBundles(root, { version: 1, bundles });
}
async function setBundleSkills(id, body) {
  const root = managedRoot();
  const ledger = await readBundles(root);
  const index = ledger.bundles.findIndex((bundle) => bundle.id === id);
  const existing = index === -1 ? void 0 : ledger.bundles[index];
  if (existing === void 0) throw new Error(`bundle ${JSON.stringify(id)} not found`);
  const skillIndex = indexSkills(await allSkills());
  const raw = Array.isArray(body.skillNames) ? body.skillNames.filter((v) => typeof v === "string") : [];
  const skills = [];
  const unknown = [];
  for (const entry of raw) {
    const name2 = resolveSkillEntry(entry, skillIndex);
    if (name2 === void 0) {
      unknown.push(entry);
      continue;
    }
    if (!skills.includes(name2)) skills.push(name2);
  }
  if (unknown.length > 0) throw new Error(`skill ${JSON.stringify(unknown.join(", "))} not found`);
  const record = { ...existing, skills };
  const aliases = /* @__PURE__ */ new Set();
  for (const name2 of skills) {
    aliases.add(name2);
    const skill = skillIndex.byName.get(name2);
    if (skill !== void 0) aliases.add(skill.dir);
  }
  const bundles = ledger.bundles.map((candidate) => candidate.id === id ? record : { ...candidate, skills: candidate.skills.filter((name2) => !aliases.has(name2)) });
  await writeBundles(root, { version: 1, bundles });
  const views = skills.map((name2) => skillIndex.byName.get(name2)).filter((skill) => skill !== void 0);
  return { id: record.id, name: record.name, skillCount: views.length, skills: views, missingSkills: [], categories: categoriesOf(record) };
}
async function assignBundle(root, skillName, bundleId) {
  if (typeof bundleId !== "string" || bundleId === "") return;
  const ledger = await readBundles(root);
  const index = ledger.bundles.findIndex((bundle) => bundle.id === bundleId);
  if (index === -1) throw new Error(`bundle ${JSON.stringify(bundleId)} not found`);
  const canonical = resolveSkillEntry(skillName, indexSkills(await allSkills())) ?? skillName;
  const bundles = ledger.bundles.map((candidate, i) => i === index ? { ...candidate, skills: [...candidate.skills.filter((name2) => name2 !== canonical), canonical] } : { ...candidate, skills: candidate.skills.filter((name2) => name2 !== canonical && name2 !== skillName) });
  await writeBundles(root, { version: 1, bundles });
}
function normalizeUploadFiles(input) {
  const list = Array.isArray(input) ? input : [];
  const cleaned = [];
  for (const item of list) {
    if (typeof item !== "object" || item === null) continue;
    const rawPath = typeof item.path === "string" ? item.path : "";
    const parts = [];
    for (const segment of rawPath.split("\\").join("/").split("/")) {
      if (segment === "" || segment === ".") continue;
      if (segment === "..") {
        throw new Error(`unsupported skill file path: ${JSON.stringify(rawPath)}`);
      }
      parts.push(segment);
    }
    if (parts.length === 0) continue;
    cleaned.push({ path: parts.join("/"), data: typeof item.data === "string" ? item.data : "" });
  }
  if (cleaned.length === 0) return cleaned;
  const top = cleaned[0].path.split("/")[0];
  const nested = top !== void 0 && cleaned.every((file) => file.path.startsWith(top + "/"));
  if (!nested) return cleaned;
  return cleaned.map((file) => ({ path: file.path.slice(top.length + 1), data: file.data }));
}
function setFrontmatterName(raw, name2) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (match === null) return `---
name: ${String(name2)}
---

${raw}`;
  const body = raw.slice(match[0].length);
  const kept = [];
  let replaced = false;
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s*name\s*:/.test(line)) {
      if (!replaced) {
        kept.push(`name: ${String(name2)}`);
        replaced = true;
      }
      continue;
    }
    kept.push(line);
  }
  if (!replaced) kept.unshift(`name: ${String(name2)}`);
  return `---
${kept.join("\n")}
---
${body}`;
}
async function installArchive(body) {
  const root = managedRoot();
  const raw = typeof body.archive === "string" ? body.archive : "";
  if (raw === "") throw new Error("empty archive");
  const files = unzipArchive(Buffer.from(raw, "base64"));
  const skillIndex = files.findIndex((file) => file.name === SKILL_FILE || file.name.endsWith("/" + SKILL_FILE));
  const skillEntry = skillIndex === -1 ? void 0 : files[skillIndex];
  if (skillEntry === void 0) throw new Error(`archive must contain ${SKILL_FILE}`);
  const meta = parseFrontmatter(skillEntry.data.toString("utf8"));
  let skillName = typeof meta.name === "string" ? meta.name.trim() : "";
  if (!NAME_PATTERN.test(skillName)) {
    const top = skillEntry.name.slice(0, skillEntry.name.length - SKILL_FILE.length).replace(/\/+$/, "");
    const fallback = top.split("/").pop() ?? "";
    skillName = fallback.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  if (!NAME_PATTERN.test(skillName)) throw new Error("skill name must be lowercase alphanumeric/hyphen");
  if (skillName.length > NAME_MAX) throw new Error(`name must be 1-${String(NAME_MAX)} characters`);
  const skillDir = join(root, skillName);
  const base = skillEntry.name.slice(0, skillEntry.name.length - SKILL_FILE.length).replace(/\/+$/, "");
  let hasSkillFile = false;
  for (const file of files) {
    let rel = file.name;
    if (base !== "" && rel.startsWith(base + "/")) rel = rel.slice(base.length + 1);
    if (rel === SKILL_FILE) hasSkillFile = true;
    const target = resolveSkillFile(skillDir, rel);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, file.data);
  }
  if (!hasSkillFile) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    await writeFile(join(skillDir, SKILL_FILE), `---
name: ${skillName}
description: ${description || "Installed from the Skills panel."}
---

${description}`, "utf8");
  }
  await assignBundle(root, skillName, typeof body.bundleId === "string" ? body.bundleId : "");
  const finalMeta = await readSkillMeta(root, skillName);
  return { name: finalMeta?.name ?? skillName, dir: skillName, description: finalMeta?.description ?? "" };
}
async function installSkill(body) {
  if (typeof body.archive === "string" && body.archive !== "") {
    return installArchive(body);
  }
  const rawRequested = typeof body.skillName === "string" ? body.skillName.trim() : "";
  const requested = rawRequested === "" ? "" : checkedName(rawRequested);
  const root = managedRoot();
  const files = normalizeUploadFiles(body.files);
  const skillEntry = files.find((file) => file.path === SKILL_FILE);
  const fields = skillEntry === void 0 ? {} : parseFrontmatter(Buffer.from(skillEntry.data, "base64").toString("utf8"));
  const metaName = typeof fields.name === "string" ? fields.name.trim() : "";
  let skillName = NAME_PATTERN.test(requested) ? requested : "";
  if (skillName === "" && NAME_PATTERN.test(metaName)) skillName = metaName;
  if (skillName === "") throw new Error("skill name must be lowercase alphanumeric/hyphen");
  if (skillName.length > NAME_MAX) throw new Error(`name must be 1-${String(NAME_MAX)} characters`);
  const skillDir = join(root, skillName);
  await mkdir(skillDir, { recursive: true });
  let hasSkillFile = false;
  for (const file of files) {
    if (file.path === SKILL_FILE) hasSkillFile = true;
    const target = resolveSkillFile(skillDir, file.path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, Buffer.from(file.data, "base64"));
  }
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!hasSkillFile) {
    const text = `---
name: ${skillName}
description: ${description || "Installed from the Skills panel."}
---

${description}`;
    await writeFile(join(skillDir, SKILL_FILE), text, "utf8");
  } else if (metaName !== "" && metaName !== skillName) {
    const raw = Buffer.from(skillEntry.data, "base64").toString("utf8");
    await writeFile(join(skillDir, SKILL_FILE), setFrontmatterName(raw, skillName), "utf8");
  }
  await assignBundle(root, skillName, typeof body.bundleId === "string" ? body.bundleId : "");
  const meta = await readSkillMeta(root, skillName);
  return {
    name: meta?.name ?? skillName,
    dir: skillName,
    description: meta?.description ?? "",
    renamed: metaName !== "" && metaName !== skillName
  };
}
async function readSkillFile(skillName, relPath) {
  const name2 = checkedLookupName(skillName);
  const dir = await locateSkillDir(name2);
  if (dir === void 0) throw new Error(`skill ${JSON.stringify(name2)} not found`);
  if (relPath === "" || relPath.includes("\0") || relPath.includes("\\")) {
    throw new Error(`unsupported file path: ${JSON.stringify(relPath)}`);
  }
  const target = resolveSkillFile(dir, relPath);
  let info;
  try {
    info = await stat(target);
  } catch {
    throw new Error(`file ${JSON.stringify(relPath)} not found in skill ${JSON.stringify(name2)}`);
  }
  if (!info.isFile()) throw new Error(`not a file: ${JSON.stringify(relPath)}`);
  const content = await readFile(target, "utf8");
  return { name: name2, path: relPath, content };
}
async function deleteSkill(skillName) {
  const name2 = checkedLookupName(skillName);
  const roots = [managedRoot(), dshRoot()];
  const removed = [];
  const aliases = /* @__PURE__ */ new Set([name2]);
  for (const root2 of roots) {
    let entries = [];
    try {
      entries = (await readdir(root2, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      continue;
    }
    for (const dir of entries) {
      const meta = await readSkillMeta(root2, dir);
      if (dir !== name2 && (meta === void 0 || meta.name !== name2)) continue;
      try {
        await rm(join(root2, dir), { recursive: true, force: true });
      } catch {
        continue;
      }
      aliases.add(dir);
      if (meta !== void 0) aliases.add(meta.name);
      removed.push({ root: rootLabel(root2), dir, name: meta === void 0 ? dir : meta.name });
    }
  }
  if (removed.length === 0) throw new Error(`skill ${JSON.stringify(name2)} not found`);
  const root = managedRoot();
  const ledger = await readBundles(root);
  await writeBundles(root, {
    version: 1,
    bundles: ledger.bundles.map((candidate) => ({
      ...candidate,
      skills: candidate.skills.filter((candidateName) => !aliases.has(candidateName))
    }))
  });
  return { removed };
}
function isLoopbackAddress(address) {
  if (typeof address !== "string") return false;
  const a = address.toLowerCase();
  if (a === "::1") return true;
  const ipv4 = a.startsWith("::ffff:") ? a.slice(7) : a;
  const octets = ipv4.split(".");
  return octets.length === 4 && octets[0] === "127" && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function hostNameOf(value) {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase();
  if (host.startsWith("[")) {
    const close = host.indexOf("]");
    if (close <= 1) return null;
    const suffix = host.slice(close + 1);
    if (suffix !== "" && !/^:\d+$/.test(suffix)) return null;
    return host.slice(1, close);
  }
  const firstColon = host.indexOf(":");
  const lastColon = host.lastIndexOf(":");
  if (firstColon !== lastColon) return null;
  return firstColon === -1 ? host : host.slice(0, firstColon);
}
function loopbackAllowed(req) {
  if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
  const host = hostNameOf(req.headers.host);
  if (host === null) return false;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
function json(res, status2, value) {
  const body = JSON.stringify(value);
  res.writeHead(status2, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache"
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
async function handle(ctx, req, res) {
  if (!loopbackAllowed(req)) {
    json(res, 403, { error: "loopback-only" });
    return;
  }
  const url = new URL2(req.url ?? "/", "http://localhost");
  const rest = url.pathname.slice(ROUTE_PREFIX.length);
  const method = req.method ?? "GET";
  try {
    if (method === "GET" && (rest === "" || rest === "/list")) {
      json(res, 200, await snapshot());
      return;
    }
    if (method === "POST" && rest === "/bundles") {
      const body = await readBody(req);
      json(res, 200, await createBundle(body));
      return;
    }
    const matchId = /^\/bundles\/([^/]+)$/.exec(rest);
    if (method === "PATCH" && matchId !== null) {
      const body = await readBody(req);
      json(res, 200, await renameBundle(decodeURIComponent(matchId[1]), body));
      return;
    }
    if (method === "DELETE" && matchId !== null) {
      await deleteBundle(decodeURIComponent(matchId[1]));
      json(res, 200, { ok: true });
      return;
    }
    const matchSkills = /^\/bundles\/([^/]+)\/skills$/.exec(rest);
    if (method === "PUT" && matchSkills !== null) {
      const body = await readBody(req);
      json(res, 200, await setBundleSkills(decodeURIComponent(matchSkills[1]), body));
      return;
    }
    if (method === "POST" && rest === "/skills") {
      const body = await readBody(req);
      json(res, 200, await installSkill(body));
      return;
    }
    const matchSkillDelete = /^\/skills\/([^/]+)$/.exec(rest);
    if (method === "DELETE" && matchSkillDelete !== null) {
      const result = await deleteSkill(decodeURIComponent(matchSkillDelete[1]));
      json(res, 200, { ok: true, ...result });
      return;
    }
    const matchSkillFile = /^\/skills\/([^/]+)\/files\/(.+)$/.exec(rest);
    if (method === "GET" && matchSkillFile !== null) {
      const file = await readSkillFile(
        decodeURIComponent(matchSkillFile[1]),
        decodeURIComponent(matchSkillFile[2])
      );
      json(res, 200, file);
      return;
    }
    json(res, 404, { error: `no route for ${method} ${rest}` });
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}
async function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX,
    handler: (req, res) => {
      void handle(ctx, req, res);
    }
  }), "dsh-skill-manager: routes");
}

// vendor/prompt-customizer/index.js
import fs2 from "node:fs";
import os2 from "node:os";
import path3 from "node:path";

// vendor/prompt-customizer/cosmokit.mjs
function isNullable(value) {
  return value === null || value === void 0;
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function filterKeys(object, filter) {
  return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function pick(source, keys, forced) {
  if (!keys) return { ...source };
  const result = {};
  for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
  return result;
}
function is(type2, value) {
  if (arguments.length === 1) return (value2) => is(type2, value2);
  return type2 in globalThis && value instanceof globalThis[type2] || Object.prototype.toString.call(value).slice(8, -1) === type2;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
(function(Binary2) {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    else return source;
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
    let binary2 = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) binary2 += String.fromCharCode(bytes[i]);
    return btoa(binary2);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function clone(source, refs = /* @__PURE__ */ new Map()) {
  if (!source || typeof source !== "object") return source;
  if (is("Date", source)) return new Date(source.valueOf());
  if (is("RegExp", source)) return new RegExp(source.source, source.flags);
  if (isArrayBufferLike(source)) return source.slice(0);
  if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const cached = refs.get(source);
  if (cached) return cached;
  if (Array.isArray(source)) {
    const result2 = [];
    refs.set(source, result2);
    source.forEach((value, index) => {
      result2[index] = Reflect.apply(clone, null, [value, refs]);
    });
    return result2;
  }
  const result = Object.create(Object.getPrototypeOf(source));
  refs.set(source, result);
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
    if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
    Reflect.defineProperty(result, key, descriptor);
  }
  return result;
}
function deepEqual(a, b, strict) {
  if (a === b) return true;
  if (!strict && isNullable(a) && isNullable(b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (!a || !b) return false;
  function check(test, then) {
    return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
  }
  return check(Array.isArray, (a2, b2) => a2.length === b2.length && a2.every((item, index) => deepEqual(item, b2[index]))) ?? check(is("Date"), (a2, b2) => a2.valueOf() === b2.valueOf()) ?? check(is("RegExp"), (a2, b2) => a2.source === b2.source && a2.flags === b2.flags) ?? check(isArrayBufferLike, (a2, b2) => {
    if (a2.byteLength !== b2.byteLength) return false;
    const viewA = new Uint8Array(a2);
    const viewB = new Uint8Array(b2);
    for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
    return true;
  }) ?? Object.keys({
    ...a,
    ...b
  }).every((key) => deepEqual(a[key], b[key], strict));
}
var Time;
(function(Time2) {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date2 = /* @__PURE__ */ new Date(), offset) {
    if (typeof date2 === "number") date2 = new Date(date2);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date2.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date2 = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date2 + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date2) {
    const parsed = parseTime(date2);
    if (parsed) date2 = Date.now() + parsed;
    else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date2}`;
    else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date2}`;
    return date2 ? new Date(date2) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) return Math.round(ms / Time2.day) + "d";
    else if (abs >= Time2.hour - Time2.minute / 2) return Math.round(ms / Time2.hour) + "h";
    else if (abs >= Time2.minute - Time2.second / 2) return Math.round(ms / Time2.minute) + "m";
    else if (abs >= Time2.second) return Math.round(ms / Time2.second) + "s";
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// vendor/prompt-customizer/schemastery.mjs
var kSchema = Symbol.for("schemastery");
var kValidationError = Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
  options;
  name = "ValidationError";
  constructor(message, options) {
    let prefix = "$";
    for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
    else if (typeof segment === "number") prefix += "[" + segment + "]";
    else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
    if (prefix.startsWith(".")) prefix = prefix.slice(1);
    super((prefix === "$" ? "" : `${prefix} `) + message);
    this.options = options;
  }
  static is(error) {
    return !!error?.[kValidationError];
  }
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
var Schema = function(options) {
  const schema2 = function(data, options2 = {}) {
    return Schema.resolve(data, schema2, options2)[0];
  };
  if (options.refs) {
    const refs = mapValues(options.refs, (options2) => new Schema(options2));
    const getRef = (uid) => refs[uid];
    for (const key in refs) {
      const options2 = refs[key];
      options2.sKey = getRef(options2.sKey);
      options2.inner = getRef(options2.inner);
      options2.list = options2.list && options2.list.map(getRef);
      options2.dict = options2.dict && mapValues(options2.dict, getRef);
    }
    return refs[options.uid];
  }
  Object.assign(schema2, options);
  if (typeof schema2.callback === "string") try {
    schema2.callback = new Function("return " + schema2.callback)();
  } catch {
  }
  Object.defineProperty(schema2, "uid", { value: globalThis.__schemastery_index__++ });
  Object.setPrototypeOf(schema2, Schema.prototype);
  schema2.meta ||= {};
  schema2.toString = schema2.toString.bind(schema2);
  return schema2;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
  return {
    version: 1,
    vendor: "schemastery",
    validate: (value) => {
      try {
        return { value: Schema.resolve(value, this, {})[0] };
      } catch (error) {
        if (ValidationError.is(error)) return { issues: [{
          message: error.message,
          path: error.options.path
        }] };
        throw error;
      }
    }
  };
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
  if (globalThis.__schemastery_refs__) {
    globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
    return this.uid;
  }
  globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
  globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
  const result = {
    uid: this.uid,
    refs: globalThis.__schemastery_refs__
  };
  globalThis.__schemastery_refs__ = void 0;
  return result;
};
Schema.prototype.set = function set(key, value) {
  this.dict[key] = value;
  return this;
};
Schema.prototype.push = function push(value) {
  this.list.push(value);
  return this;
};
function mergeDesc(original, messages) {
  const result = typeof original === "string" ? { "": original } : { ...original };
  for (const locale in messages) {
    const value = messages[locale];
    if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
    else if (typeof value === "string") result[locale] = value;
  }
  return result;
}
function getInner(value) {
  return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
  return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
  const schema2 = Schema(this);
  const desc = mergeDesc(schema2.meta.description, messages);
  if (Object.keys(desc).length) schema2.meta.description = desc;
  if (schema2.dict) schema2.dict = mapValues(schema2.dict, (inner, key) => {
    return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
  });
  if (schema2.list) schema2.list = schema2.list.map((inner, index) => {
    return inner.i18n(mapValues(messages, (data = {}) => {
      if (Array.isArray(getInner(data))) return getInner(data)[index];
      if (Array.isArray(data)) return data[index];
      return extractKeys(data);
    }));
  });
  if (schema2.inner) schema2.inner = schema2.inner.i18n(mapValues(messages, (data) => {
    if (getInner(data)) return getInner(data);
    return extractKeys(data);
  }));
  if (schema2.sKey) schema2.sKey = schema2.sKey.i18n(mapValues(messages, (data) => data?.$key));
  return schema2;
};
Schema.prototype.extra = function extra(key, value) {
  const schema2 = Schema(this);
  schema2.meta = {
    ...schema2.meta,
    [key]: value
  };
  return schema2;
};
for (const key of [
  "required",
  "disabled",
  "collapse",
  "hidden",
  "loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
  const schema2 = Schema(this);
  schema2.meta = {
    ...schema2.meta,
    [key]: value
  };
  return schema2;
} });
Schema.prototype.deprecated = function deprecated() {
  const schema2 = Schema(this);
  schema2.meta.badges ||= [];
  schema2.meta.badges.push({
    text: "deprecated",
    type: "danger"
  });
  return schema2;
};
Schema.prototype.experimental = function experimental() {
  const schema2 = Schema(this);
  schema2.meta.badges ||= [];
  schema2.meta.badges.push({
    text: "experimental",
    type: "warning"
  });
  return schema2;
};
Schema.prototype.pattern = function pattern(regexp) {
  const schema2 = Schema(this);
  const pattern2 = pick(regexp, ["source", "flags"]);
  schema2.meta = {
    ...schema2.meta,
    pattern: pattern2
  };
  return schema2;
};
Schema.prototype.simplify = function simplify(value) {
  if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
  if (isNullable(value)) return value;
  if (this.type === "object" || this.type === "dict") {
    const result = {};
    for (const key in value) {
      const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
      if (this.type === "dict" || !isNullable(item)) result[key] = item;
    }
    if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
    return result;
  } else if (this.type === "array" || this.type === "tuple") {
    const result = [];
    value.forEach((value2, index) => {
      const schema2 = this.type === "array" ? this.inner : this.list[index];
      const item = schema2 ? schema2.simplify(value2) : value2;
      result.push(item);
    });
    return result;
  } else if (this.type === "intersect") {
    const result = {};
    for (const item of this.list) Object.assign(result, item.simplify(value));
    return result;
  } else if (this.type === "union") for (const schema2 of this.list) try {
    Schema.resolve(value, schema2, {});
    return schema2.simplify(value);
  } catch {
  }
  return value;
};
Schema.prototype.toString = function toString(inline) {
  return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra2) {
  const schema2 = Schema(this);
  schema2.meta = {
    ...schema2.meta,
    role,
    extra: extra2
  };
  return schema2;
};
for (const key of [
  "default",
  "link",
  "comment",
  "description",
  "max",
  "min",
  "step"
]) Object.assign(Schema.prototype, { [key](value) {
  const schema2 = Schema(this);
  schema2.meta = {
    ...schema2.meta,
    [key]: value
  };
  return schema2;
} });
var resolvers = {};
Schema.extend = function extend(type2, resolve3) {
  resolvers[type2] = resolve3;
};
Schema.resolve = function resolve2(data, schema2, options = {}, strict = false) {
  if (!schema2) return [data];
  if (options.ignore?.(data, schema2)) return [data];
  if (isNullable(data) && schema2.type !== "lazy") {
    if (schema2.meta.required) throw new ValidationError(`missing required value`, options);
    let current = schema2;
    let fallback = schema2.meta.default;
    while (current?.type === "intersect" && isNullable(fallback)) {
      current = current.list[0];
      fallback = current?.meta.default;
    }
    if (isNullable(fallback)) return [data];
    data = clone(fallback);
  }
  const callback = resolvers[schema2.type];
  if (!callback) throw new ValidationError(`unsupported type "${schema2.type}"`, options);
  try {
    return callback(data, schema2, options, strict);
  } catch (error) {
    if (!schema2.meta.loose) throw error;
    return [schema2.meta.default];
  }
};
Schema.from = function from(source) {
  if (isNullable(source)) return Schema.any();
  else if ([
    "string",
    "number",
    "boolean"
  ].includes(typeof source)) return Schema.const(source).required();
  else if (source[kSchema]) return source;
  else if (typeof source === "function") switch (source) {
    case String:
      return Schema.string().required();
    case Number:
      return Schema.number().required();
    case Boolean:
      return Schema.boolean().required();
    case Function:
      return Schema.function().required();
    default:
      return Schema.is(source).required();
  }
  else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
  const toJSON2 = () => {
    if (!schema2.inner[kSchema]) {
      schema2.inner = schema2.builder();
      schema2.inner.meta = {
        ...schema2.meta,
        ...schema2.inner.meta
      };
    }
    return schema2.inner.toJSON();
  };
  const schema2 = new Schema({
    type: "lazy",
    builder,
    inner: { toJSON: toJSON2 }
  });
  return schema2;
};
Schema.natural = function natural() {
  return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
  return Schema.number().step(0.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
  return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
    const date2 = new Date(value);
    if (isNaN(+date2)) throw new ValidationError(`invalid date "${value}"`, options);
    return date2;
  }, true)]);
};
Schema.regExp = function regExp(flag = "") {
  return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
    try {
      return new RegExp(value, flag);
    } catch (e) {
      throw new ValidationError(e.message, options);
    }
  }, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
  return Schema.union([
    Schema.is(ArrayBuffer),
    Schema.is(SharedArrayBuffer),
    Schema.transform(Schema.any(), (value, options) => {
      if (Binary.isSource(value)) return Binary.fromSource(value);
      throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
    }, true),
    ...encoding ? [Schema.transform(Schema.string(), (value, options) => {
      try {
        return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
      } catch (e) {
        throw new ValidationError(e.message, options);
      }
    }, true)] : []
  ]);
};
Schema.extend("lazy", (data, schema2, options, strict) => {
  if (!schema2.inner[kSchema]) {
    schema2.inner = schema2.builder();
    schema2.inner.meta = {
      ...schema2.meta,
      ...schema2.inner.meta
    };
  }
  return Schema.resolve(data, schema2.inner, options, strict);
});
Schema.extend("any", (data) => {
  return [data];
});
Schema.extend("never", (data, _, options) => {
  throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
  if (deepEqual(data, value)) return [value];
  throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
  const { max = Infinity, min = -Infinity } = meta;
  if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
  if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
  if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
  if (meta.pattern) {
    const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
    if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
  }
  checkWithinRange(data.length, meta, "string length", options);
  return [data];
});
function decimalShift(data, digits) {
  const str2 = data.toString();
  if (str2.includes("e")) return data * Math.pow(10, digits);
  const index = str2.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str2.slice(index + 1);
  const integer = str2.slice(0, index);
  if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
  return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
  step = Math.abs(step);
  if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
  const index = step.toString().indexOf(".");
  const digits = step.toString().slice(index + 1).length;
  return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
  if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
  checkWithinRange(data, meta, "number", options);
  const { step } = meta;
  if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
  return [data];
});
Schema.extend("boolean", (data, _, options) => {
  if (typeof data === "boolean") return [data];
  throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
  let value = 0, keys = [];
  if (typeof data === "number") {
    value = data;
    for (const key in bits) if (data & bits[key]) keys.push(key);
  } else if (Array.isArray(data)) {
    keys = data;
    for (const key of keys) {
      if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
      if (key in bits) value |= bits[key];
    }
  } else throw new ValidationError(`expected number or array but got ${data}`, options);
  if (value === meta.default) return [value];
  return [value, keys];
});
Schema.extend("function", (data, _, options) => {
  if (typeof data === "function") return [data];
  throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
  if (typeof constructor === "function") {
    if (data instanceof constructor) return [data];
    throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
  } else {
    if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
    let prototype = Object.getPrototypeOf(data);
    while (prototype) {
      if (prototype.constructor?.name === constructor) return [data];
      prototype = Object.getPrototypeOf(prototype);
    }
    throw new ValidationError(`expected ${constructor} but got ${data}`, options);
  }
});
function property(data, key, schema2, options) {
  try {
    const [value, adapted] = Schema.resolve(data[key], schema2, {
      ...options,
      path: [...options.path || [], key]
    });
    if (adapted !== void 0) data[key] = adapted;
    return value;
  } catch (e) {
    if (!options?.autofix) throw e;
    delete data[key];
    return schema2.meta.default;
  }
}
Schema.extend("array", (data, { inner, meta }, options) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
  return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in data) {
    let rKey;
    try {
      rKey = Schema.resolve(key, sKey, options)[0];
    } catch (error) {
      if (strict) continue;
      throw error;
    }
    result[rKey] = property(data, key, inner, options);
    data[rKey] = data[key];
    if (key !== rKey) delete data[key];
  }
  return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  const result = list.map((inner, index) => property(data, index, inner, options));
  if (strict) return [result];
  result.push(...data.slice(list.length));
  return [result];
});
function merge(result, data) {
  for (const key in data) {
    if (key in result) continue;
    result[key] = data[key];
  }
}
Schema.extend("object", (data, { dict }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in dict) {
    const value = property(data, key, dict[key], options);
    if (!isNullable(value) || key in data) result[key] = value;
  }
  if (!strict) merge(result, data);
  return [result];
});
Schema.extend("union", (data, { list, toString: toString2 }, options, strict) => {
  const messages = [];
  for (const inner of list) try {
    return Schema.resolve(data, inner, options, strict);
  } catch (error) {
    messages.push(error);
  }
  throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString: toString2 }, options, strict) => {
  if (!list.length) return [data];
  let result;
  for (const inner of list) {
    const value = Schema.resolve(data, inner, options, true)[0];
    if (isNullable(value)) continue;
    if (isNullable(result)) result = value;
    else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
    else if (typeof value === "object") merge(result ??= {}, value);
    else if (result !== value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
  }
  if (!strict && isPlainObject(data)) merge(result, data);
  return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
  const [result, adapted = data] = Schema.resolve(data, inner, options, true);
  if (preserve) return [callback(result)];
  else return [callback(result), callback(adapted)];
});
var formatters = {};
function defineMethod(name2, keys, format) {
  formatters[name2] = format;
  Object.assign(Schema, { [name2](...args) {
    const schema2 = new Schema({ type: name2 });
    keys.forEach((key, index) => {
      switch (key) {
        case "sKey":
          schema2.sKey = args[index] ?? Schema.string();
          break;
        case "inner":
          schema2.inner = Schema.from(args[index]);
          break;
        case "list":
          schema2.list = args[index].map(Schema.from);
          break;
        case "dict":
          schema2.dict = mapValues(args[index], Schema.from);
          break;
        case "bits":
          schema2.bits = {};
          for (const key2 in args[index]) {
            if (typeof args[index][key2] !== "number") continue;
            schema2.bits[key2] = args[index][key2];
          }
          break;
        case "callback": {
          const callback = schema2.callback = args[index];
          callback["toJSON"] ||= () => callback.toString();
          break;
        }
        case "constructor": {
          const constructor = schema2.constructor = args[index];
          if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
          break;
        }
        default:
          schema2[key] = args[index];
      }
    });
    if (name2 === "object" || name2 === "dict") schema2.meta.default = {};
    else if (name2 === "array" || name2 === "tuple") schema2.meta.default = [];
    else if (name2 === "bitset") schema2.meta.default = 0;
    return schema2;
  } });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
  if (typeof constructor === "function") return constructor.name;
  else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
  if (Object.keys(dict).length === 0) return "{}";
  return `{ ${Object.entries(dict).map(([key, inner]) => {
    return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
  }).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
  const result = list.map(({ toString: format }) => format()).join(" | ");
  return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
  return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
  "inner",
  "callback",
  "preserve"
], ({ inner }, isInner) => inner.toString(isInner));

// vendor/prompt-customizer/vars.js
import os from "node:os";
var VARIABLE_NAME = /^[a-z][a-z0-9_]*$/;
var RESERVED = /* @__PURE__ */ new Set(["provider", "model", "cwd"]);
var DEFAULT_ENV_BLOCKLIST = [
  "*SECRET*",
  "*TOKEN*",
  "*PASSWORD*",
  "*PASSWD*",
  "*CREDENTIAL*",
  "*API_KEY*",
  "*APIKEY*",
  "*ACCESS_KEY*",
  "*PRIVATE_KEY*",
  "*AUTH*",
  "*_DSN",
  "*CONNECTION_STRING*",
  "DATABASE_URL"
];
function compileEntries(blocklist) {
  const matchers = [];
  for (const entry of Array.isArray(blocklist) ? blocklist : []) {
    if (typeof entry !== "string") continue;
    const text = entry.trim();
    if (text === "") continue;
    if (text.includes("*")) {
      const pattern2 = "^" + text.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$";
      let re;
      try {
        re = new RegExp(pattern2, "i");
      } catch {
        continue;
      }
      matchers.push((key) => re.test(key));
    } else {
      const lower = text.toLowerCase();
      matchers.push((key) => key.toLowerCase() === lower);
    }
  }
  return matchers;
}
function envVarName(key) {
  const core2 = String(key).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (core2 === "") return void 0;
  const name2 = `env_${core2}`;
  return VARIABLE_NAME.test(name2) ? name2 : void 0;
}
function builtinProviders() {
  const pad = (n) => String(n).padStart(2, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    date: () => isoDate(/* @__PURE__ */ new Date()),
    time: () => time(/* @__PURE__ */ new Date()),
    datetime: () => {
      const d = /* @__PURE__ */ new Date();
      return `${isoDate(d)} ${time(d)}`;
    },
    weekday: () => weekdays[(/* @__PURE__ */ new Date()).getDay()],
    hostname: () => {
      try {
        return os.hostname();
      } catch {
        return "";
      }
    },
    platform: () => process.platform,
    arch: () => process.arch,
    username: () => {
      try {
        return os.userInfo().username;
      } catch {
        return "";
      }
    },
    home: () => {
      try {
        return os.homedir();
      } catch {
        return "";
      }
    },
    shell: () => process.env.SHELL ?? process.env.COMSPEC ?? "",
    locale: () => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().locale ?? "";
      } catch {
        return "";
      }
    },
    node_version: () => process.version
  };
}
function listVariableNames(blocklist) {
  const names = new Set(Object.keys(builtinProviders()));
  const matchers = compileEntries(blocklist);
  const seen = /* @__PURE__ */ new Set();
  for (const key of Object.keys(process.env)) {
    if (matchers.some((match) => match(key))) continue;
    const name2 = envVarName(key);
    if (name2 === void 0 || seen.has(name2)) continue;
    seen.add(name2);
    names.add(name2);
  }
  return [...names].sort();
}
function registerVariables(systemPrompt, blocklist) {
  const disposes = [];
  const reg = (name2, provider) => {
    if (RESERVED.has(name2)) return;
    try {
      disposes.push(systemPrompt.variable(name2, provider));
    } catch {
    }
  };
  for (const [name2, provider] of Object.entries(builtinProviders())) {
    reg(name2, () => {
      const value = provider();
      return typeof value === "string" ? value : "";
    });
  }
  const matchers = compileEntries(blocklist);
  const seen = /* @__PURE__ */ new Set();
  for (const key of Object.keys(process.env)) {
    if (matchers.some((match) => match(key))) continue;
    const name2 = envVarName(key);
    if (name2 === void 0 || seen.has(name2)) continue;
    seen.add(name2);
    reg(name2, () => process.env[key] ?? "");
  }
  return () => {
    for (const dispose of disposes) {
      try {
        dispose();
      } catch {
      }
    }
  };
}

// vendor/prompt-customizer/schema.js
var NS = "prompt-customizer";
var Config = Schema.object({
  // 按名称屏蔽这些提示词段：常驻期（晋级后）的独立屏蔽名单。
  sections: Schema.array(Schema.string()).default([]),
  // 每阶段独立段屏蔽（与 tools 阶段化对称）：引导期 / 压缩受控期各自的
  // 屏蔽名单。三态互不继承、互不影响 —— 一个阶段的屏蔽不波及另一个阶段。
  sectionsBootstrap: Schema.array(Schema.string()).default([]),
  sectionsCompaction: Schema.array(Schema.string()).default([]),
  // 按名称替换某个段的文本（保持原顺序）。
  replace: Schema.dict(Schema.string()).default({}),
  // 注入 / 覆盖段（按 名称 + 顺序 + 文本）。`custom` 标记本插件生成的段
  // （隐藏标记，用于识别其为可删除，跨预设依然成立，不依赖名字碰撞）。
  // `phase` 控制阶段生效：`always` 恒定；`bootstrap` 只在会话未晋级时注入；
  // `compaction` 只在「压缩后仍未晋级」时注入（独立于 bootstrap，拥有自己的
  // order 空间）；`active` 只在晋级后注入（晋级 = 首个 durable 的 tool/call
  // 或 assistant/message；compaction 之后复位，subagent 视为已晋级）。
  inject: Schema.array(Schema.object({
    name: Schema.string().required(),
    order: Schema.number().default(120),
    text: Schema.string().required(),
    phase: Schema.string().default("always"),
    custom: Schema.boolean().default(false)
  })).default([]),
  // 工具目录过滤：只有 exclude 黑名单（列出的工具对模型隐藏）。三份名单对应三个
  // 阶段，各管各的、互不继承：`exclude` 只在已晋级（常驻期）生效，`bootstrap`
  // 只在未晋级（引导期）生效，`compaction` 只在「compaction 之后仍未晋级」的
  // 阶段生效；空名单 = 该阶段什么都不隐藏。没有白名单语义 —— 见 lib/effective.js
  // 的 applyToolFilter 注释。
  tools: Schema.object({
    exclude: Schema.array(Schema.string()).default([]),
    // 该阶段要「加回来」的工具：被该阶段裁掉、但注册表里仍有的，装配时查回
    // schema 追加。注册表里没有的（别的预设独有）加不进来。
    add: Schema.array(Schema.string()).default([]),
    bootstrap: Schema.object({
      exclude: Schema.array(Schema.string()).default([]),
      add: Schema.array(Schema.string()).default([])
    }).default({}),
    compaction: Schema.object({
      exclude: Schema.array(Schema.string()).default([]),
      add: Schema.array(Schema.string()).default([])
    }).default({})
  }).default({}),
  // 强制覆盖（默认开）：包装宿主的 assemble，直接从注册表原始段重建最终
  // 提示词段 —— 预设插件的阶段裁段（实测 liangshen / warmupbetter 等 preset
  // 过滤器全部 prepend: true）与宿主 complete 整段接管都无法再改写结果；
  // tools / contexts 保持宿主与预设行为。设 false 退回瀑布流内过滤。
  forceSections: Schema.boolean().default(true),
  // process.env 变量黑名单：env 全量注册为提示词变量（{{env_xxx}}），命中
  // 本名单的键不注册 —— env 里常有密钥，进了提示词就会随请求发给模型。
  // 条目支持 `*` 通配、大小写不敏感；预填常见密钥类键，界面可增删。
  envBlocklist: Schema.array(Schema.string()).default(DEFAULT_ENV_BLOCKLIST),
  // 预设：完整的定制快照（提示词 + 工具配置，含每阶段独立名单与阶段目录）。
  presets: Schema.array(Schema.object({
    id: Schema.string().required(),
    name: Schema.string().required(),
    data: Schema.object({
      sections: Schema.array(Schema.string()),
      // 每阶段独立段屏蔽名单：缺省 = 旧文件，应用时保留当前值不抹掉。
      sectionsBootstrap: Schema.array(Schema.string()),
      sectionsCompaction: Schema.array(Schema.string()),
      replace: Schema.dict(Schema.string()),
      // 相对顺序：每个条目记录它应跟随的前一段，以及这段属于哪个阶段
      // （缺省 always = 旧快照的单一全局序；同名不同 phase 的条目 = 该段在
      // 多个阶段各有自己的位置）。
      order: Schema.array(Schema.object({
        name: Schema.string().required(),
        after: Schema.string(),
        text: Schema.string(),
        custom: Schema.boolean().default(false),
        phase: Schema.string()
      })),
      tools: Schema.object({
        exclude: Schema.array(Schema.string()),
        add: Schema.array(Schema.string()),
        bootstrap: Schema.object({
          exclude: Schema.array(Schema.string()),
          add: Schema.array(Schema.string())
        }),
        compaction: Schema.object({
          exclude: Schema.array(Schema.string()),
          add: Schema.array(Schema.string())
        })
      })
    })
  })).default([]),
  // 当前已应用预设的 id（同一时间只有一个生效）。
  activePreset: Schema.string(),
  // 按 agent 预设 id 的字段级覆盖：某个 agent 预设的 override 中，非空的
  // 字段整体接管全局默认，空缺 / 空列表的字段继续回落全局。键是
  // dsh-agent-presets 的预设目录名（即会话 header.agentPreset 记录的 id）。
  overrides: Schema.dict(Schema.object({
    sections: Schema.array(Schema.string()),
    sectionsBootstrap: Schema.array(Schema.string()),
    sectionsCompaction: Schema.array(Schema.string()),
    replace: Schema.dict(Schema.string()),
    inject: Schema.array(Schema.object({
      name: Schema.string().required(),
      order: Schema.number().default(120),
      text: Schema.string().required(),
      phase: Schema.string().default("always"),
      custom: Schema.boolean().default(false)
    })),
    tools: Schema.object({
      exclude: Schema.array(Schema.string()),
      add: Schema.array(Schema.string()),
      bootstrap: Schema.object({
        exclude: Schema.array(Schema.string()),
        add: Schema.array(Schema.string())
      }),
      compaction: Schema.object({
        exclude: Schema.array(Schema.string()),
        add: Schema.array(Schema.string())
      })
    })
  })).default({})
});

// vendor/prompt-customizer/effective.js
function hasList(value) {
  return Array.isArray(value) && value.length > 0;
}
function hasDict(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}
function hasTools(tools) {
  if (tools === null || typeof tools !== "object") return false;
  return hasList(tools.exclude) || hasList(tools.add) || hasTools(tools.bootstrap) || hasTools(tools.compaction);
}
function mergeConfig(globalCfg, ovr) {
  const g = globalCfg ?? {};
  return {
    sections: Array.isArray(ovr?.sections) ? ovr.sections : g.sections ?? [],
    sectionsBootstrap: Array.isArray(ovr?.sectionsBootstrap) ? ovr.sectionsBootstrap : g.sectionsBootstrap ?? [],
    sectionsCompaction: Array.isArray(ovr?.sectionsCompaction) ? ovr.sectionsCompaction : g.sectionsCompaction ?? [],
    replace: hasDict(ovr?.replace) ? ovr.replace : g.replace ?? {},
    inject: hasList(ovr?.inject) ? ovr.inject : g.inject ?? [],
    tools: hasTools(ovr?.tools) ? ovr.tools : g.tools ?? {}
  };
}
function filterInjectByPhase(injectList, status2) {
  const mode = status2.promoted ? "active" : status2.boundary >= 0 ? "compaction" : "bootstrap";
  return (injectList ?? []).filter((item) => {
    const phase = item.phase === "bootstrap" || item.phase === "active" || item.phase === "compaction" ? item.phase : "always";
    return phase === "always" || phase === mode;
  });
}
function pickToolsFilter(toolsCfg, status2) {
  if (!status2.promoted) {
    if (status2.boundary >= 0) {
      return { exclude: toolsCfg?.compaction?.exclude ?? [], add: toolsCfg?.compaction?.add ?? [] };
    }
    return { exclude: toolsCfg?.bootstrap?.exclude ?? [], add: toolsCfg?.bootstrap?.add ?? [] };
  }
  return { exclude: toolsCfg?.exclude ?? [], add: toolsCfg?.add ?? [] };
}
function applyToolFilter(tools, { exclude }) {
  const excludeSet = new Set(exclude ?? []);
  if (excludeSet.size > 0) return tools.filter((tool) => !excludeSet.has(tool.name));
  return tools;
}
function pickSectionsForStatus(config, status2) {
  const resident = config?.sections;
  const compaction = config?.sectionsCompaction;
  const bootstrap = config?.sectionsBootstrap;
  if (!status2.promoted && status2.boundary >= 0) return Array.isArray(compaction) ? compaction : [];
  if (!status2.promoted) return Array.isArray(bootstrap) ? bootstrap : [];
  return Array.isArray(resident) ? resident : [];
}
function applySectionPolicy(baseSections, cfg, status2) {
  const denied = new Set(pickSectionsForStatus(cfg, status2));
  const replace = cfg.replace ?? {};
  const injectList = filterInjectByPhase(cfg.inject, status2);
  let sections = baseSections.filter((section) => !denied.has(section.name)).map(
    (section, i) => Object.hasOwn(replace, section.name) ? { ...section, order: i, text: replace[section.name] } : { ...section, order: i }
  );
  for (const item of injectList) {
    if (denied.has(item.name)) continue;
    const index = sections.findIndex((section) => section.name === item.name);
    if (index >= 0) {
      sections[index] = {
        ...sections[index],
        text: item.text ? item.text : sections[index].text,
        order: item.order
      };
    } else if (item.custom === true || Object.hasOwn(replace, item.name) || item.text) {
      sections.push({ name: item.name, order: item.order, text: item.text || replace[item.name] });
    }
  }
  sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sections;
}

// vendor/prompt-customizer/promotion.js
var phaseStateSchema = {
  parse(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError("prompt-customizer/phase state \u5FC5\u987B\u662F\u5BF9\u8C61");
    }
    const { boundary, promoted } = value;
    if (!Number.isInteger(boundary) || typeof promoted !== "boolean") {
      throw new TypeError("prompt-customizer/phase state \u5FC5\u987B\u662F { boundary: int, promoted: bool }");
    }
    return { boundary, promoted };
  }
};
var DEFAULT_PROMOTE_EVENTS = ["tool/call", "assistant/message"];
var PHASE_PROJECTION_KEY = "prompt-customizer/phase";
var PROMOTED_STATUS = Object.freeze({ boundary: -1, promoted: true });
function createPhaseProjection(promoteEvents = DEFAULT_PROMOTE_EVENTS) {
  const promote = new Set(promoteEvents);
  return {
    key: PHASE_PROJECTION_KEY,
    stateSchema: phaseStateSchema,
    init: () => ({ boundary: -1, promoted: false }),
    apply: (state, event) => {
      const seq2 = event.seq ?? 0;
      if (event.type === "compaction/end") return { boundary: seq2, promoted: false };
      if (promote.has(event.type) && seq2 > state.boundary && !state.promoted) {
        return { ...state, promoted: true };
      }
      return state;
    },
    stateVersion: 1
  };
}
function statusOf(projections, agent) {
  const session = agent?.session;
  if (!session) return PROMOTED_STATUS;
  if ((session.header?.delegationDepth ?? 0) > 0) return PROMOTED_STATUS;
  return projections?.stateOf?.(session, PHASE_PROJECTION_KEY) ?? PROMOTED_STATUS;
}
function presetOfSession(projections, session) {
  if (!session) return void 0;
  const projected = projections?.stateOf?.(session, "agentPreset");
  if (typeof projected === "string") return projected;
  return typeof session.header?.agentPreset === "string" ? session.header.agentPreset : void 0;
}

// vendor/prompt-customizer/store.js
var import_yaml = __toESM(require_dist(), 1);
import fs from "node:fs";
import path from "node:path";
var HEADER = "# dsh-prompt-customizer \u914D\u7F6E\uFF08\u552F\u4E00\u6743\u5A01\uFF09\u3002\n# \u624B\u5DE5\u7F16\u8F91\u5373\u65F6\u751F\u6548\uFF08\u4E0B\u6B21\u8BFB\u53D6\u65F6\uFF09\uFF1B\u5220\u9664\u672C\u6587\u4EF6\u540E\u91CD\u542F\u4F1A\u4ECE\u65E7\u7248 settings.yaml \u8FC1\u79FB\u3002\n";
function readLegacySection(masterPath, ns) {
  if (!masterPath) return void 0;
  let doc;
  try {
    doc = (0, import_yaml.parse)(fs.readFileSync(masterPath, "utf8"));
  } catch {
    return void 0;
  }
  const section = doc?.[ns];
  return section !== null && typeof section === "object" && !Array.isArray(section) && Object.keys(section).length > 0 ? section : void 0;
}
function createConfigStore({ file, schema: schema2, warn, header = HEADER } = {}) {
  if (!file) throw new TypeError("createConfigStore: file is required");
  let cache2;
  let warned = false;
  const warnOnce = (message) => {
    if (warned) return;
    warned = true;
    try {
      warn?.(message);
    } catch {
    }
  };
  const resolve3 = (raw) => {
    if (schema2 === void 0) return { value: raw ?? {}, error: void 0 };
    try {
      return { value: schema2(raw ?? {}), error: void 0 };
    } catch (error) {
      return { value: null, error };
    }
  };
  const load2 = () => {
    let stamp;
    try {
      stamp = fs.statSync(file).mtimeMs;
    } catch {
      stamp = void 0;
    }
    if (cache2 && cache2.stamp === stamp) return cache2;
    if (stamp === void 0) {
      cache2 = { stamp, raw: void 0, ...resolve3(void 0) };
      return cache2;
    }
    let raw;
    let error;
    try {
      raw = (0, import_yaml.parse)(fs.readFileSync(file, "utf8"));
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        raw = void 0;
        error = new Error("config.yaml \u7684\u9876\u5C42\u5FC5\u987B\u662F\u6620\u5C04");
      }
    } catch (e) {
      raw = void 0;
      error = e;
    }
    const r = raw === void 0 ? { value: null, error } : resolve3(raw);
    cache2 = { stamp, raw, ...r };
    if (r.value !== null) lastGood = r.value;
    return cache2;
  };
  let lastGood;
  return {
    /** 当前存储的原始用户段（未补默认值）；无文件时 undefined。 */
    raw() {
      return load2().raw;
    },
    /** 解析后的生效配置（默认值已补；坏文件回落 last-good，再回落纯默认值）。 */
    readResolved() {
      const entry = load2();
      if (entry.value !== null) return entry.value;
      warnOnce(`prompt-customizer: \u914D\u7F6E\u6587\u4EF6\u4E0D\u53EF\u7528\uFF0C\u56DE\u843D\u5230\u6700\u8FD1\u4E00\u6B21\u5408\u6CD5\u914D\u7F6E\uFF1A${String(entry.error && entry.error.message ? entry.error.message : entry.error)}`);
      return lastGood ?? resolve3(void 0).value;
    },
    /** 原子写入一个完整用户段；写入后立刻刷新缓存。 */
    writeSection(section) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, header + (0, import_yaml.stringify)(section ?? {}));
      fs.renameSync(tmp, file);
      cache2 = void 0;
      return load2();
    },
    /** 写单个字段（值 undefined 表示删除）；基于当前权威段合并。 */
    setField(field, value) {
      const base = this.raw();
      const section = { ...base ?? {} };
      if (value === void 0) delete section[field];
      else section[field] = value;
      return this.writeSection(section);
    }
  };
}

// vendor/prompt-customizer/catalog.js
import path2 from "node:path";
function definedFields(item) {
  const patch = {};
  for (const [key, value] of Object.entries(item)) {
    if (value !== void 0) patch[key] = value;
  }
  return patch;
}
function isName(value) {
  return typeof value === "string" && value.length > 0;
}
function mergeSighting(prev, sighting, orderOf = null) {
  const list = (Array.isArray(prev) ? prev : []).map((item) => ({ ...item }));
  const index = new Map(list.map((item, i) => [item?.name, i]));
  let changed = false;
  for (const raw of Array.isArray(sighting) ? sighting : []) {
    if (raw === null || typeof raw !== "object" || !isName(raw.name)) continue;
    const at = index.get(raw.name);
    if (at === void 0) {
      const next = { ...raw };
      if (orderOf !== null && next.order === void 0) next.order = orderOf(list, next);
      index.set(raw.name, list.length);
      list.push(next);
      changed = true;
      continue;
    }
    const patch = definedFields(raw);
    const merged = { ...list[at], ...patch };
    if (JSON.stringify(merged) === JSON.stringify(list[at])) continue;
    list[at] = merged;
    changed = true;
  }
  return { list, changed };
}
function createCatalog({ dir, file, warn } = {}) {
  const target = file ?? path2.join(dir ?? ".", "catalog.yaml");
  const store = createConfigStore({
    file: target,
    warn,
    header: "# dsh-prompt-customizer \u6BB5 / \u5DE5\u5177\u7D2F\u79EF\u767B\u8BB0\u8868\uFF08\u6D3E\u751F\u7F13\u5B58\uFF0C\u975E\u914D\u7F6E\uFF09\u3002\n# \u7531\u9762\u677F\u6D4F\u89C8\u5404 agent \u9884\u8BBE\u65F6\u81EA\u52A8\u7D2F\u79EF\uFF1B\u5220\u6389\u672C\u6587\u4EF6\u4F1A\u968F\u4E0B\u6B21\u6D4F\u89C8\u91CD\u65B0\u957F\u51FA\u6765\u3002\n"
  });
  const normalize = (raw, kind) => {
    const list = Array.isArray(raw) ? raw : [];
    if (kind === "sections") {
      return list.filter((x) => x !== null && typeof x === "object" && isName(x.name)).map((x) => ({ name: x.name, order: typeof x.order === "number" ? x.order : void 0, text: typeof x.text === "string" ? x.text : "" })).map((x) => x.order === void 0 ? { name: x.name, text: x.text } : { name: x.name, order: x.order, text: x.text });
    }
    return list.filter((x) => x !== null && typeof x === "object" && isName(x.name)).map((x) => ({ name: x.name, description: typeof x.description === "string" ? x.description : "" }));
  };
  const load2 = () => {
    let doc;
    try {
      doc = store.readResolved() ?? {};
    } catch {
      doc = {};
    }
    return {
      sections: normalize(doc.sections, "sections"),
      tools: normalize(doc.tools, "tools")
    };
  };
  let state = load2();
  return {
    /** 当前并集（按登记顺序；调用方自己现算标记与排序）。 */
    read() {
      return { sections: state.sections.map((x) => ({ ...x })), tools: state.tools.map((x) => ({ ...x })) };
    },
    /**
     * 并进一次所见。段的 order 只在所见提供时才更新（预览路径没有 order，
     * 不该把已知顺序打乱）；新段用「当前最大 order + 1」落位，保持追加在尾部。
     */
    observe({ sections = [], tools = [] } = {}) {
      state = load2();
      let changed = false;
      const nextOrder = (list) => {
        let max = -1;
        for (const item of list) if (typeof item.order === "number" && item.order > max) max = item.order;
        return max + 1;
      };
      const mergedSections = mergeSighting(state.sections, sections, (list) => nextOrder(list));
      if (mergedSections.changed) {
        state.sections = mergedSections.list;
        changed = true;
      }
      const mergedTools = mergeSighting(state.tools, tools);
      if (mergedTools.changed) {
        state.tools = mergedTools.list;
        changed = true;
      }
      if (!changed) return false;
      try {
        store.writeSection(state);
      } catch (error) {
        try {
          warn?.(`prompt-customizer: catalog.yaml \u5199\u5165\u5931\u8D25\uFF08\u672C\u6B21\u4EC5\u5185\u5B58\u7D2F\u79EF\uFF09\uFF1A${String(error && error.message ? error.message : error)}`);
        } catch {
        }
      }
      return true;
    },
    /** 测试 / 排查用：重新从磁盘读一次。 */
    reload() {
      state = load2();
      return state;
    }
  };
}

// vendor/prompt-customizer/index.js
var PATCHED = Symbol.for("prompt-customizer:assemble-pristine");
function dshHome() {
  return process.env.DSH_HOME ?? path3.join(os2.homedir(), ".dsh");
}
function readJsonBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve3, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve3(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(new Error(`invalid JSON body: ${error.message}`));
      }
    });
    req.on("error", reject);
  });
}
function stripLegacyInclude(store, log) {
  const raw = store.raw();
  if (raw === null || typeof raw !== "object") return;
  const stats = { stripped: 0, reported: [] };
  const walk = (node, where) => {
    if (node === null || typeof node !== "object" || Array.isArray(node)) return;
    if (Array.isArray(node.include)) {
      stats.stripped += 1;
      if (node.include.length > 0) stats.reported.push(`${where}: [${node.include.join(", ")}]`);
      delete node.include;
    }
    for (const phase of ["bootstrap", "compaction"]) walk(node[phase], `${where}.${phase}`);
  };
  walk(raw.tools, "tools");
  if (raw.overrides !== null && typeof raw.overrides === "object") {
    for (const id of Object.keys(raw.overrides)) walk(raw.overrides[id]?.tools, `overrides.${id}.tools`);
  }
  if (Array.isArray(raw.presets)) {
    for (const preset of raw.presets) walk(preset?.data?.tools, `presets.${preset?.name}.data.tools`);
  }
  if (stats.stripped === 0) return;
  try {
    store.writeSection(raw);
    if (stats.reported.length > 0) {
      log(`prompt-customizer: \u767D\u540D\u5355\uFF08include\uFF09\u8BED\u4E49\u5DF2\u79FB\u9664\uFF0C\u5DF2\u4ECE\u914D\u7F6E\u91CC\u6E05\u6389 ${stats.reported.length} \u5904\u6709\u5185\u5BB9\u7684\u540D\u5355 \u2014\u2014 ${stats.reported.join("\uFF1B")}\u3002\u8FD9\u4E9B\u9636\u6BB5\u73B0\u5728\u4E0D\u8BBE\u9650\u5236\uFF1B\u8981\u91CD\u65B0\u9650\u5236\u5C31\u53BB\u5DE5\u5177 Tab \u9010\u9879\u53D6\u6D88\u52FE\u9009\u3002`);
    }
  } catch (error) {
    try {
      log(`prompt-customizer: \u9057\u7559 include \u6E05\u7406\u5931\u8D25\uFF08\u4E0D\u5F71\u54CD\u8FD0\u884C\uFF0C\u8BE5\u5B57\u6BB5\u5DF2\u88AB\u5FFD\u7565\uFF09\uFF1A${String(error && error.message ? error.message : error)}`);
    } catch {
    }
  }
}
function apply2(ctx, entry = {}) {
  const dataDir = typeof entry.dataDir === "string" && entry.dataDir.length > 0 ? entry.dataDir : path3.join(dshHome(), NS);
  const configFile = path3.join(dataDir, "config.yaml");
  const store = createConfigStore({
    file: configFile,
    schema: Config,
    warn: (message) => {
      try {
        ctx.logger?.warn?.(message);
      } catch {
      }
    }
  });
  const read = () => store.readResolved();
  const catalog = createCatalog({
    dir: dataDir,
    warn: (message) => {
      try {
        ctx.logger?.warn?.(message);
      } catch {
      }
    }
  });
  if (!fs2.existsSync(configFile)) {
    const master = ctx.get("settings")?.documentPath;
    const legacy = readLegacySection(master, NS);
    if (legacy) {
      store.writeSection(legacy);
      try {
        ctx.logger?.info?.(`prompt-customizer: \u5DF2\u628A\u65E7\u7248\u914D\u7F6E\u4ECE ${master} \u8FC1\u79FB\u5230 ${configFile}`);
      } catch {
      }
    }
  }
  stripLegacyInclude(store, (message) => {
    try {
      ctx.logger?.info?.(message);
    } catch {
    }
  });
  ctx.inject(["sessionProjections"], (projectionCtx) => {
    try {
      projectionCtx.sessionProjections.register(createPhaseProjection());
    } catch (error) {
      try {
        ctx.logger?.warn?.(`prompt-customizer: \u9636\u6BB5\u6295\u5F71\u6CE8\u518C\u5931\u8D25\uFF08\u9636\u6BB5\u89C6\u56FE\u56DE\u843D\u4E3A\u5DF2\u664B\u7EA7\uFF09\uFF1A${String(error && error.message || error)}`);
      } catch {
      }
    }
  });
  let warned = false;
  const warnOnce = (message) => {
    if (warned) return;
    warned = true;
    try {
      ctx.logger?.warn?.(message);
    } catch {
    }
  };
  let varsSignature;
  let varsDispose;
  const syncVariables = () => {
    try {
      const blocklist = read().envBlocklist ?? [];
      const signature = JSON.stringify(blocklist);
      if (signature === varsSignature) return;
      try {
        varsDispose?.();
      } catch {
      }
      varsDispose = registerVariables(ctx.get("systemPrompt"), blocklist);
      varsSignature = signature;
    } catch (error) {
      warnOnce(`prompt-customizer: \u63D0\u793A\u8BCD\u53D8\u91CF\u6CE8\u518C\u5931\u8D25\uFF08{{\u2026}} \u4ECD\u53EA\u6709\u5BBF\u4E3B\u6CE8\u518C\u7684\u53D8\u91CF\u53EF\u7528\uFF09\uFF1A${String(error && error.message || error)}`);
    }
  };
  const resolveTarget = (context) => {
    const raw = read();
    const patch = context?.promptCustomizerPatch;
    const base = patch !== null && typeof patch === "object" && !Array.isArray(patch) ? overlayPatch(
      raw,
      typeof context.promptCustomizerTarget === "string" && context.promptCustomizerTarget.length > 0 ? context.promptCustomizerTarget : void 0,
      patch
    ) : raw;
    const id = typeof context?.promptCustomizerPreset === "string" ? context.promptCustomizerPreset : presetOfSession(ctx.get("sessionProjections"), context?.agent?.session);
    const cfg = mergeConfig(base, base.overrides?.[id]);
    const phaseHint = typeof context?.promptCustomizerPhase === "string" ? context.promptCustomizerPhase : void 0;
    const status2 = phaseHint === "bootstrap" ? { promoted: false, boundary: -1 } : phaseHint === "compaction" ? { promoted: false, boundary: 1 } : phaseHint === "active" ? { promoted: true, boundary: -1 } : statusOf(ctx.get("sessionProjections"), context?.agent);
    return { raw, cfg, status: status2 };
  };
  ctx.on("system-prompt/assemble", async (assembly, context, next) => {
    const assembled = await next();
    try {
      const { raw, cfg, status: status2 } = resolveTarget(context);
      const denied = new Set(pickSectionsForStatus(cfg, status2));
      const replace = cfg.replace ?? {};
      const te = pickToolsFilter(cfg.tools, status2);
      const baseView = context?.promptCustomizerBase === true ? {
        sections: Array.isArray(assembled.sections) ? assembled.sections.map((section) => ({
          name: section.name,
          text: typeof section.text === "function" ? "<\u52A8\u6001\u751F\u6210>" : String(section.text ?? ""),
          blocked: denied.has(section.name),
          replaced: Object.hasOwn(replace, section.name)
        })) : [],
        tools: Array.isArray(assembled.tools) ? assembled.tools.map((tool) => ({
          name: typeof tool.name === "string" ? tool.name : String(tool.name),
          description: typeof tool.description === "string" ? tool.description : "",
          hidden: (te.exclude ?? []).includes(tool.name)
        })) : []
      } : void 0;
      const baseSections = Array.isArray(assembled.sections) ? [...assembled.sections] : [];
      const baseTools = Array.isArray(assembled.tools) ? assembled.tools : [];
      if (context?.promptCustomizerBase === true) {
        mergeAgentScopedSections(ctx, baseSections, (section) => typeof section.text === "function" ? "<\u52A8\u6001\u751F\u6210>" : String(section.text ?? ""));
      }
      if (catalog !== void 0 && context?.promptCustomizerBase !== true) {
        try {
          catalog.observe({
            sections: baseSections.map((section) => ({
              name: String(section.name),
              text: typeof section.text === "function" ? "<\u52A8\u6001\u751F\u6210>" : String(section.text ?? "")
            })),
            tools: baseTools.map((tool) => ({
              name: typeof tool.name === "string" ? tool.name : String(tool.name),
              description: typeof tool.description === "string" ? tool.description : ""
            }))
          });
        } catch (error) {
          warnOnce(`prompt-customizer: \u8FD0\u884C\u65F6\u6BB5 / \u5DE5\u5177\u5E76\u8FDB\u767B\u8BB0\u8868\u5931\u8D25\uFF08\u4EC5\u5F71\u54CD\u6E05\u5355\uFF09\uFF1A${String(error && error.message || error)}`);
        }
      }
      const sections = applySectionPolicy(baseSections, cfg, status2);
      const tools = appendAddedTools(ctx, context?.scope, applyToolFilter(baseTools, te), te.add, te.exclude);
      const result = { ...assembled, sections, tools };
      if (baseView) {
        result.promptCustomizerBaseView = {
          sections: baseSections.map((section) => ({
            name: section.name,
            text: typeof section.text === "function" ? "<\u52A8\u6001\u751F\u6210>" : String(section.text ?? ""),
            blocked: denied.has(section.name),
            replaced: Object.hasOwn(replace, section.name),
            // 'agent' = 只在该 agent 的装配里注册的段（预览 scope 的注册表没有它）。
            ...section.scope !== void 0 ? { scope: section.scope } : {}
          })),
          tools: baseTools.map((tool) => ({
            name: typeof tool.name === "string" ? tool.name : String(tool.name),
            description: typeof tool.description === "string" ? tool.description : "",
            hidden: (te.exclude ?? []).includes(tool.name)
          }))
        };
        const takenOver = detectCompletePrompt(ctx, context?.scope);
        if (takenOver !== void 0 && raw?.forceSections === false) result.promptCustomizerTakenOver = takenOver;
        result.promptCustomizerEmitted = sections.map((section) => String(section.name));
      }
      return result;
    } catch (error) {
      warnOnce(`prompt-customizer: \u8FC7\u6EE4\u5668\u5F02\u5E38\uFF0C\u672C\u6B21\u88C5\u914D\u56DE\u9000\u4E3A\u672A\u52A0\u5DE5\u7ED3\u679C\uFF1A${String(error && error.message || error)}`);
      return assembled;
    }
  });
  const sp = ctx.get("systemPrompt");
  if (sp && typeof sp.assemble === "function") {
    const pristine = sp[PATCHED]?.orig ?? sp.assemble.bind(sp);
    sp[PATCHED] = { orig: pristine };
    sp.assemble = async (context = {}) => {
      syncVariables();
      const result = await pristine(context);
      if (read()?.forceSections === false) return result;
      try {
        const { cfg, status: status2 } = resolveTarget(context);
        const defs = [...sp.layers.merge(context?.scope, (layer) => layer.sections).values()].sort((a, b) => a.order - b.order);
        const baseSections = defs.map((section) => ({
          name: section.name,
          // 与宿主一致：动态段文本调用生成函数（可能被调用两次 —— 宿主装配
          // 内部已调用一次；动态段通常是纯函数，可接受）。
          text: typeof section.text === "function" ? section.text(context) : section.text
        }));
        if (context?.promptCustomizerBase === true) {
          mergeAgentScopedSections(ctx, baseSections, (section) => typeof section.text === "function" ? section.text(context) : section.text);
        }
        const sections = applySectionPolicy(baseSections, cfg, status2);
        const patched = { ...result, sections };
        if (context?.promptCustomizerBase === true) {
          patched.promptCustomizerEmitted = sections.map((section) => String(section.name));
        }
        return patched;
      } catch (error) {
        warnOnce(`prompt-customizer: \u5F3A\u5236\u8986\u76D6 assemble \u5931\u8D25\uFF0C\u672C\u6B21\u56DE\u9000\u4E3A\u5BBF\u4E3B\u7ED3\u679C\uFF1A${String(error && error.message || error)}`);
        const takenOver = detectCompletePrompt(ctx, context?.scope);
        if (takenOver !== void 0) result.promptCustomizerTakenOver = takenOver;
        return result;
      }
    };
  }
  const webserver = ctx.get("webServer");
  if (webserver) {
    const unauthenticated = (req, res) => {
      const connection = ctx.get("connection");
      if (typeof connection?.requestRejection !== "function") {
        writeJson(res, 503, { ok: false, error: "connection service unavailable: prompt-customizer routes refuse to serve unauthenticated" });
        return true;
      }
      const rejection = connection.requestRejection(req);
      if (rejection === void 0) return false;
      res.writeHead(rejection, { "content-type": "text/plain; charset=utf-8" });
      res.end(rejection === 401 ? "unauthorized" : "forbidden");
      return true;
    };
    const register = (route) => webserver.register({
      kind: route.kind,
      path: route.path,
      handler: (req, res) => {
        if (unauthenticated(req, res)) return void 0;
        return route.handler(req, res);
      }
    });
    const dispose = register({
      kind: "exact",
      path: "/api/prompt-customizer/inventory",
      handler: async (req, res) => {
        try {
          const id = queryOf(req).get("scope") ?? void 0;
          const resolved = id ? await resolveScopeFor(ctx, id) : await resolveStandardScope(ctx);
          const scopeKey = resolved ?? (id ? await resolveStandardScope(ctx) : void 0);
          const inventory = await buildInventory(ctx, read(), scopeKey, id, catalog);
          syncVariables();
          writeJson(res, 200, { ...inventory, scopeResolved: resolved !== void 0, variables: listVariableNames(read().envBlocklist ?? []) });
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error)
          });
        }
      }
    });
    ctx.effect(() => dispose, "prompt-customizer: inventory route");
    const disposePreview = register({
      kind: "exact",
      path: "/api/prompt-customizer/preview",
      handler: async (req, res) => {
        try {
          let body = null;
          if (req.method === "POST") {
            try {
              body = await readJsonBody(req);
            } catch {
              body = null;
            }
          }
          const { scopeKey, hintId, phase, scopeResolved } = await previewTarget(ctx, req, body);
          const patch = body !== null && typeof body === "object" && body.patch !== null && typeof body.patch === "object" && !Array.isArray(body.patch) ? body.patch : void 0;
          const patchTarget = typeof body?.target === "string" && body.target.length > 0 ? body.target : void 0;
          const preview = await buildPreview(ctx, scopeKey, hintId, phase, catalog, patch, patchTarget);
          writeJson(res, 200, { ...preview, scopeResolved, phase });
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error)
          });
        }
      }
    });
    ctx.effect(() => disposePreview, "prompt-customizer: preview route");
    const disposePresets = register({
      kind: "exact",
      path: "/api/prompt-customizer/agent-presets",
      handler: async (_req, res) => {
        try {
          const presets = ctx.get("agentPresets");
          const list = presets ? await presets.list() : [];
          writeJson(res, 200, {
            ok: true,
            presets: list.map((p) => ({ id: p.id, name: p.name ?? p.id, description: p.description, broken: p.broken }))
          });
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error)
          });
        }
      }
    });
    ctx.effect(() => disposePresets, "prompt-customizer: agent-presets route");
    const disposePresetsCreate = register({
      kind: "exact",
      path: "/api/prompt-customizer/presets",
      handler: async (req, res) => {
        try {
          const body = await readJsonBody(req);
          const name2 = typeof body?.name === "string" ? body.name.trim() : "";
          if (!/^[\p{L}\p{N}_-][\p{L}\p{N} _-]{0,63}$/u.test(name2)) {
            writeJson(res, 400, { ok: false, error: "\u9884\u8BBE\u540D\u53EA\u80FD\u5305\u542B\u4E2D\u82F1\u6587\u3001\u6570\u5B57\u3001\u7A7A\u683C\u3001\u4E0B\u5212\u7EBF\u4E0E\u8FDE\u5B57\u7B26\uFF08\u226464 \u5B57\u7B26\uFF09\uFF0C\u4E14\u4E0D\u4EE5\u6807\u70B9\u5F00\u5934" });
            return;
          }
          const roster = ctx.get("agentPresets");
          if (roster === void 0 || typeof roster.copy !== "function") {
            writeJson(res, 501, { ok: false, error: "\u5BBF\u4E3B\u672A\u63D0\u4F9B agent \u9884\u8BBE\u670D\u52A1\uFF08dsh-agent-presets\uFF09\uFF0C\u65E0\u6CD5\u521B\u5EFA\u9884\u8BBE" });
            return;
          }
          if (roster.authorable === false) {
            writeJson(res, 400, { ok: false, error: "\u5F53\u524D\u90E8\u7F72\u6CA1\u6709\u53EF\u5199\u7684\u7528\u6237\u9884\u8BBE\u6839\u76EE\u5F55\uFF0C\u65E0\u6CD5\u521B\u5EFA\u9884\u8BBE" });
            return;
          }
          const from2 = typeof body?.from === "string" && body.from.length > 0 ? body.from : String(roster.defaultId ?? "standard");
          const displayName = typeof body?.displayName === "string" && body.displayName.trim().length > 0 ? body.displayName.trim() : name2;
          try {
            await roster.copy(from2, name2, displayName);
          } catch (error) {
            writeJson(res, copyErrorStatus(error), {
              ok: false,
              error: String(error && error.message ? error.message : error)
            });
            return;
          }
          const config = body.config && typeof body.config === "object" && !Array.isArray(body.config) ? body.config : {};
          const base = { ...store.raw() ?? {} };
          const overrides = { ...base.overrides ?? {} };
          const clean = {};
          for (const key of ["sections", "sectionsBootstrap", "sectionsCompaction", "replace", "inject", "tools"]) {
            const value = config[key];
            if (value === void 0 || value === null) continue;
            const empty = Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0;
            if (!empty) clean[key] = value;
          }
          overrides[name2] = clean;
          base.overrides = overrides;
          store.writeSection(base);
          writeJson(res, 200, { ok: true, presetId: name2, from: from2, config: read() });
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error)
          });
        }
      }
    });
    ctx.effect(() => disposePresetsCreate, "prompt-customizer: presets-create route");
    const disposeConfig = register({
      kind: "exact",
      path: "/api/prompt-customizer/config",
      handler: async (_req, res) => {
        writeJson(res, 200, { ok: true, config: read() });
      }
    });
    ctx.effect(() => disposeConfig, "prompt-customizer: config route");
    const withFieldWrite = (handler) => async (req, res) => {
      try {
        const body = await readJsonBody(req);
        if (typeof body?.field !== "string" || body.field.length === 0) {
          writeJson(res, 400, { ok: false, error: "field is required" });
          return;
        }
        handler(body);
        writeJson(res, 200, { ok: true, config: read() });
      } catch (error) {
        writeJson(res, 400, {
          ok: false,
          error: String(error && error.message ? error.message : error)
        });
      }
    };
    const disposeConfigSet = register({
      kind: "exact",
      path: "/api/prompt-customizer/config/set",
      handler: withFieldWrite(({ field, value }) => store.setField(field, value))
    });
    ctx.effect(() => disposeConfigSet, "prompt-customizer: config set route");
    const disposeConfigUnset = register({
      kind: "exact",
      path: "/api/prompt-customizer/config/unset",
      handler: withFieldWrite(({ field }) => store.setField(field, void 0))
    });
    ctx.effect(() => disposeConfigUnset, "prompt-customizer: config unset route");
    const disposeConfigReset = register({
      kind: "exact",
      path: "/api/prompt-customizer/config/reset",
      handler: async (_req, res) => {
        try {
          store.writeSection({ forceSections: false });
          writeJson(res, 200, { ok: true, config: read() });
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error)
          });
        }
      }
    });
    ctx.effect(() => disposeConfigReset, "prompt-customizer: config reset route");
    const disposeConfigApply = register({
      kind: "exact",
      path: "/api/prompt-customizer/config/apply",
      handler: async (req, res) => {
        try {
          const body = await readJsonBody(req);
          const patch = body?.patch;
          if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
            writeJson(res, 400, { ok: false, error: "patch object is required" });
            return;
          }
          const target = typeof body.target === "string" && body.target.length > 0 ? body.target : void 0;
          store.writeSection(overlayPatch({ ...store.raw() ?? {} }, target, patch));
          writeJson(res, 200, { ok: true, config: read() });
        } catch (error) {
          writeJson(res, 400, {
            ok: false,
            error: String(error && error.message ? error.message : error)
          });
        }
      }
    });
    ctx.effect(() => disposeConfigApply, "prompt-customizer: config apply route");
  }
}
function withTimeout(value, ms, fallback) {
  return Promise.race([
    Promise.resolve(value),
    new Promise((resolve3) => setTimeout(() => resolve3(fallback), ms))
  ]);
}
var APPLY_FIELDS = ["sections", "sectionsBootstrap", "sectionsCompaction", "replace", "inject", "tools"];
function overlayPatch(raw, target, patch) {
  const base = { ...raw ?? {} };
  const applyPatch = (obj) => {
    for (const field of APPLY_FIELDS) {
      if (!Object.hasOwn(patch, field)) continue;
      if (patch[field] === null) delete obj[field];
      else obj[field] = patch[field];
    }
  };
  if (target === void 0) {
    applyPatch(base);
  } else {
    const overrides = { ...base.overrides ?? {} };
    const ovr = { ...overrides[target] ?? {} };
    applyPatch(ovr);
    if (Object.keys(ovr).length > 0) overrides[target] = ovr;
    else delete overrides[target];
    if (Object.keys(overrides).length > 0) base.overrides = overrides;
    else delete base.overrides;
  }
  return base;
}
function copyErrorStatus(error) {
  const kind = String(error?.constructor?.name ?? "");
  if (kind === "PresetExistsError") return 409;
  if (kind === "InvalidPresetIdError" || kind === "PresetNotWritableError" || kind === "UnknownPresetError") return 400;
  return 500;
}
async function resolveStandardScope(ctx) {
  try {
    const presets = ctx.get("agentPresets");
    if (presets && typeof presets.standingKeyFor === "function") {
      return await withTimeout(presets.standingKeyFor("standard"), 1500, void 0);
    }
  } catch {
  }
  return void 0;
}
async function buildInventory(ctx, raw, scopeKey, presetId, catalog) {
  const cfg = mergeConfig(raw, raw.overrides?.[presetId]);
  const denied = new Set(cfg.sections ?? []);
  const replace = cfg.replace ?? {};
  const injectOrder = new Map((cfg.inject ?? []).map((item) => [item.name, item.order]));
  const te = pickToolsFilter(cfg.tools, { promoted: true, boundary: -1 });
  const isHidden = (name2) => (te.exclude ?? []).includes(name2);
  const resolveText = (section) => {
    if (typeof section.text === "function") {
      try {
        const value = section.text({ scope: scopeKey });
        if (value && typeof value.then === "function") return "<\u52A8\u6001\u751F\u6210>";
        return String(value ?? "");
      } catch {
        return "<\u52A8\u6001\u751F\u6210>";
      }
    }
    return String(section.text ?? "");
  };
  const asEntry = (name2, section) => ({
    name: name2,
    order: injectOrder.has(name2) ? injectOrder.get(name2) : typeof section.order === "number" ? section.order : 0,
    text: resolveText(section)
  });
  const seenSections = [...ctx.systemPrompt.layers.merge(scopeKey, (layer) => layer.sections).entries()].map(([name2, section]) => asEntry(name2, section));
  const listedNames = new Set(seenSections.map((item) => item.name));
  for (const [name2, section] of agentScopedSections(ctx)) {
    if (listedNames.has(name2)) continue;
    listedNames.add(name2);
    seenSections.push(asEntry(name2, section));
  }
  const seenTools = [];
  try {
    const byName = /* @__PURE__ */ new Map();
    for (const scope of [scopeKey, void 0]) {
      let schemas = [];
      try {
        schemas = ctx.tools.schemas(scope) ?? [];
      } catch {
        schemas = [];
      }
      for (const tool of schemas) {
        if (tool.name && tool.name !== void 0 && !byName.has(tool.name)) byName.set(tool.name, tool);
      }
      if (byName.size > 0) break;
    }
    for (const tool of byName.values()) {
      seenTools.push({ name: tool.name, description: typeof tool.description === "string" ? tool.description : "" });
    }
  } catch {
  }
  if (catalog !== void 0) catalog.observe({ sections: seenSections, tools: seenTools });
  const pool = catalog === void 0 ? { sections: seenSections, tools: seenTools } : catalog.read();
  const seenNames = new Set(seenSections.map((x) => x.name));
  const sections = [...seenSections, ...pool.sections.filter((x) => !seenNames.has(x.name))].map((item) => ({ ...item, active: !denied.has(item.name), replaced: Object.hasOwn(replace, item.name) })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const seenToolNames = new Set(seenTools.map((x) => x.name));
  const tools = [...seenTools, ...pool.tools.filter((x) => !seenToolNames.has(x.name))].map((item) => ({ ...item, hidden: isHidden(item.name) })).sort((a, b) => a.name.localeCompare(b.name));
  return { sections, tools, config: cfg };
}
async function resolveScopeFor(ctx, id) {
  if (!id) return void 0;
  try {
    const presets = ctx.get("agentPresets");
    if (presets && typeof presets.standingKeyFor === "function") {
      if (typeof presets.list === "function") {
        const list = await withTimeout(presets.list(), 15e3, void 0);
        if (Array.isArray(list) && !list.some((p) => p.id === id)) return void 0;
      }
      return await withTimeout(presets.standingKeyFor(id), 15e3, void 0);
    }
  } catch {
  }
  return void 0;
}
async function previewTarget(ctx, req, body = null) {
  const id = queryOf(req).get("scope") ?? void 0;
  const resolved = id ? await resolveScopeFor(ctx, id) : await resolveStandardScope(ctx);
  const scopeKey = resolved ?? (id ? await resolveStandardScope(ctx) : void 0);
  const rawPhase = (body !== null && typeof body === "object" ? body.phase : void 0) ?? queryOf(req).get("phase") ?? void 0;
  const phase = rawPhase === "bootstrap" || rawPhase === "compaction" || rawPhase === "active" ? rawPhase : void 0;
  return { scopeKey, hintId: id, phase, scopeResolved: resolved !== void 0 };
}
async function buildPreview(ctx, scopeKey, hintId, phase, catalog, patch, patchTarget) {
  const hint = {
    scope: scopeKey,
    promptCustomizerPreset: hintId,
    promptCustomizerPhase: phase,
    // 请求预过滤视图（base）：本插件的过滤器把进入过滤前的段 / 工具原文
    // 连同屏蔽 / 隐藏标记一起附在装配结果上，作为面板两个栏的统一数据源。
    promptCustomizerBase: true
  };
  if (patch !== void 0) {
    hint.promptCustomizerPatch = patch;
    hint.promptCustomizerTarget = patchTarget;
  }
  const assembled = await ctx.systemPrompt.assemble(hint);
  const sections = Array.isArray(assembled.sections) ? assembled.sections.map((section) => ({ name: section.name, text: String(section.text ?? "") })) : [];
  const baseView = assembled && typeof assembled === "object" && assembled.promptCustomizerBaseView || {};
  if (catalog !== void 0) {
    catalog.observe({
      sections: (Array.isArray(baseView.sections) ? baseView.sections : []).map((sec) => ({ name: sec.name, text: sec.text })),
      tools: (Array.isArray(baseView.tools) ? baseView.tools : []).map((tool) => ({ name: tool.name, description: tool.description }))
    });
  }
  const registryTools = registryToolNames(ctx, scopeKey);
  const registryTotal = registryTools.length;
  const emitted = Array.isArray(assembled.promptCustomizerEmitted) ? assembled.promptCustomizerEmitted : null;
  const survivedNames = new Set(sections.map((section) => String(section.name)));
  const droppedNames = emitted === null ? [] : emitted.filter((name2) => !survivedNames.has(String(name2)));
  const lostSections = droppedNames.length > 0 ? { emitted: emitted.length, survived: sections.length, dropped: droppedNames.length } : void 0;
  return {
    ok: true,
    scope: scopeKey,
    registryTotal,
    /** 该 scope 注册表的工具名清单：供界面区分「在本预设里、只是被该阶段裁掉」
     *  与「根本不属于本预设（无法加回）」。 */
    registryTools,
    /** 非空 = 该 scope 有 complete 段整段接管最终提示词（值为那段的名字）。 */
    takenOverBy: assembled && typeof assembled === "object" ? typeof assembled.promptCustomizerTakenOver === "string" ? assembled.promptCustomizerTakenOver : void 0 : void 0,
    /** 非空 = 本插件产出的段有若干被下游装配规则丢弃（计数，不含段名列表）。 */
    lostSections,
    sections,
    text: renderPreviewText(assembled),
    tools: Array.isArray(assembled.tools) ? assembled.tools.map((tool) => ({
      name: typeof tool.name === "string" ? tool.name : String(tool.name),
      description: typeof tool.description === "string" ? tool.description : ""
    })) : [],
    // 预过滤视图：段（含该阶段独立屏蔽标记 blocked / 替换标记）与工具
    // （含该阶段隐藏标记 hidden）—— 供提示词 / 工具 Tab 渲染「每阶段
    // 独立名单」，被屏蔽 / 被隐藏的条目仍保留在此可反选。
    baseSections: Array.isArray(baseView.sections) ? baseView.sections : [],
    baseTools: Array.isArray(baseView.tools) ? baseView.tools : []
  };
}
function agentScopedSections(ctx) {
  const out = /* @__PURE__ */ new Map();
  try {
    const sp = ctx.get("systemPrompt");
    const agents = ctx.get("agents");
    if (sp?.layers?.merge === void 0 || typeof agents?.list !== "function") return out;
    for (const agent of agents.list() ?? []) {
      if (agent === null || typeof agent !== "object") continue;
      try {
        for (const [name2, section] of sp.layers.merge(agent, (layer) => layer.sections).entries()) {
          if (!out.has(name2)) out.set(name2, section);
        }
      } catch {
      }
    }
  } catch {
  }
  return out;
}
function mergeAgentScopedSections(ctx, baseSections, resolveText) {
  const listed = new Set(baseSections.map((section) => String(section.name)));
  for (const [name2, section] of agentScopedSections(ctx)) {
    if (listed.has(name2)) continue;
    listed.add(name2);
    baseSections.push({ name: name2, text: resolveText(section), scope: "agent" });
  }
  return baseSections;
}
function registryToolNames(ctx, scopeKey) {
  try {
    const byName = /* @__PURE__ */ new Map();
    for (const scope of [scopeKey, void 0]) {
      let schemas = [];
      try {
        schemas = ctx.tools.schemas(scope) ?? [];
      } catch {
        schemas = [];
      }
      for (const tool of schemas) if (tool.name) byName.set(tool.name, tool);
      if (byName.size > 0) break;
    }
    return [...byName.keys()];
  } catch {
    return [];
  }
}
function appendAddedTools(ctx, scopeKey, tools, add, exclude) {
  if (!Array.isArray(add) || add.length === 0) return tools;
  const excluded = new Set(exclude ?? []);
  const present = new Set(tools.map((tool) => tool.name));
  const wanted = add.filter((name2) => !present.has(name2) && !excluded.has(name2));
  if (wanted.length === 0) return tools;
  const registry = /* @__PURE__ */ new Map();
  for (const scope of [scopeKey, void 0]) {
    let schemas = [];
    try {
      schemas = ctx.tools.schemas(scope) ?? [];
    } catch {
      schemas = [];
    }
    for (const tool of schemas) if (tool.name) registry.set(tool.name, tool);
    if (registry.size > 0) break;
  }
  const extra2 = wanted.map((name2) => registry.get(name2)).filter(Boolean);
  return extra2.length > 0 ? [...tools, ...extra2] : tools;
}
function detectCompletePrompt(ctx, scopeKey) {
  try {
    const sections = ctx.systemPrompt.layers.merge(scopeKey, (layer) => layer.sections);
    for (const section of sections.values()) {
      if (section && section.complete === true) return String(section.name);
    }
  } catch {
  }
  return void 0;
}
function renderPreviewText(assembled) {
  return (Array.isArray(assembled.sections) ? assembled.sections : []).map((section) => String(section.text ?? "").trim()).filter((text) => text.length > 0).join("\n\n");
}
function writeJson(res, status2, body) {
  res.writeHead(status2, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function queryOf(req) {
  const url = String(req?.url ?? "");
  const i = url.indexOf("?");
  return new URLSearchParams(i >= 0 ? url.slice(i + 1) : "");
}

// src/skill-toggles.ts
import { mkdir as mkdir2, readFile as readFile2, readdir as readdir2, rename as rename2, writeFile as writeFile2 } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { join as join2 } from "node:path";
import { URL as URL3 } from "node:url";
var SKILL_FILE2 = "SKILL.md";
var BUNDLES_FILE2 = ".bundles.json";
var PRESET_FILE = ".preset-skills.json";
var ROUTE_PREFIX2 = "/api/skill-toggles";
var MAX_BODY_BYTES = 256 * 1024;
var MASK_PROVIDER = "triad-preset-mask";
var MAX_PRESET_ENTRIES = 50;
function managedRoot2() {
  const agentsHome = process.env.DSH_AGENTS_HOME ?? join2(homedir2(), ".agents");
  return join2(agentsHome, "skills");
}
function dshRoot2() {
  const dshHome6 = process.env.DSH_HOME ?? join2(homedir2(), ".dsh");
  return join2(dshHome6, "skills");
}
async function readBundles2(root) {
  try {
    const parsed = JSON.parse(await readFile2(join2(root, BUNDLES_FILE2), "utf8"));
    if (typeof parsed === "object" && parsed !== null && parsed.version === 1 && Array.isArray(parsed.bundles)) {
      return parsed;
    }
  } catch {
  }
  return { version: 1, bundles: [] };
}
function isPresetId(value) {
  return /^[a-z0-9][a-z0-9-]*$/.test(value);
}
function isSkillName(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
function presetLedgerPath() {
  return join2(managedRoot2(), PRESET_FILE);
}
function normalizeLedger(input) {
  const presets = {};
  const raw = input !== null && typeof input === "object" ? input.presets : void 0;
  if (raw !== null && typeof raw === "object") {
    for (const [presetId, table] of Object.entries(raw)) {
      if (!isPresetId(presetId)) continue;
      if (table === null || typeof table !== "object") continue;
      if (Object.keys(presets).length >= MAX_PRESET_ENTRIES) break;
      const entries = {};
      for (const [skillName, state] of Object.entries(table)) {
        if (!isSkillName(skillName) || typeof state !== "boolean") continue;
        entries[skillName] = state;
      }
      presets[presetId] = entries;
    }
  }
  return { version: 1, presets };
}
var ledgerCache;
var maskInvalidators = /* @__PURE__ */ new Set();
async function readLedger() {
  if (ledgerCache !== void 0) return ledgerCache;
  let parsed;
  try {
    parsed = JSON.parse(await readFile2(presetLedgerPath(), "utf8"));
  } catch {
    parsed = void 0;
  }
  ledgerCache = normalizeLedger(parsed);
  return ledgerCache;
}
async function writeLedger(next) {
  const target = presetLedgerPath();
  const temp = `${target}.tmp`;
  await mkdir2(managedRoot2(), { recursive: true });
  await writeFile2(temp, `${JSON.stringify(next, null, 2)}
`, "utf8");
  await rename2(temp, target);
  ledgerCache = next;
  for (const invalidate of maskInvalidators) {
    try {
      invalidate();
    } catch {
    }
  }
}
function disabledNames(ledger, presetId) {
  const table = ledger.presets[presetId];
  if (table === void 0) return /* @__PURE__ */ new Set();
  const disabled = /* @__PURE__ */ new Set();
  for (const [skillName, state] of Object.entries(table)) {
    if (state === false) disabled.add(skillName);
  }
  return disabled;
}
async function setPresetSkills(presetId, names, enabled) {
  const current = await readLedger();
  const table = { ...current.presets[presetId] ?? {} };
  let changed = 0;
  for (const skillName of names) {
    if (!isSkillName(skillName)) continue;
    if (enabled) {
      if (table[skillName] !== void 0) {
        delete table[skillName];
        changed += 1;
      }
    } else if (table[skillName] !== false) {
      table[skillName] = false;
      changed += 1;
    }
  }
  if (changed === 0) return 0;
  const presets = { ...current.presets };
  if (Object.keys(table).length === 0) delete presets[presetId];
  else presets[presetId] = table;
  await writeLedger({ version: 1, presets });
  return changed;
}
async function skillDirUnder(root, skillName) {
  try {
    const info = await import("node:fs/promises").then((fs3) => fs3.stat(join2(root, skillName)));
    if (info.isDirectory()) return join2(root, skillName);
  } catch {
  }
  return void 0;
}
async function locateSkillDir2(skillName) {
  const direct = await skillDirUnder(managedRoot2(), skillName) ?? await skillDirUnder(dshRoot2(), skillName);
  if (direct !== void 0) return direct;
  return await skillDirByFrontmatterName(skillName);
}
async function skillDirByFrontmatterName(skillName) {
  for (const root of [managedRoot2(), dshRoot2()]) {
    let entries = [];
    try {
      entries = (await readdir2(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      continue;
    }
    for (const dir of entries) {
      const name2 = await canonicalNameOf(root, dir);
      if (name2 !== void 0 && name2 === skillName) return join2(root, dir);
    }
  }
  return void 0;
}
async function canonicalNameOf(root, dir) {
  try {
    const raw = await readFile2(join2(root, dir, SKILL_FILE2), "utf8");
    const field = splitFrontmatter(raw).fields.find((item) => item.key === "name")?.value;
    return field !== void 0 && field !== "" ? field : dir;
  } catch {
    return void 0;
  }
}
async function skillNameIndex() {
  const index = /* @__PURE__ */ new Map();
  for (const root of [managedRoot2(), dshRoot2()]) {
    let entries = [];
    try {
      entries = (await readdir2(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      continue;
    }
    for (const dir of entries) {
      const name2 = await canonicalNameOf(root, dir);
      if (name2 === void 0) continue;
      if (!index.has(dir)) index.set(dir, name2);
      if (!index.has(name2)) index.set(name2, name2);
    }
  }
  return index;
}
async function canonicalSkillNames(entries) {
  const index = await skillNameIndex();
  const names = [];
  for (const entry of entries) {
    const name2 = index.get(entry) ?? entry;
    if (!names.includes(name2)) names.push(name2);
  }
  return names;
}
async function readSkillFile2(skillName) {
  const dir = await locateSkillDir2(skillName);
  if (dir === void 0) return void 0;
  try {
    return { dir, raw: await readFile2(join2(dir, SKILL_FILE2), "utf8") };
  } catch {
    return void 0;
  }
}
function splitFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (match === null) {
    return { hasFence: false, fields: [], body: raw };
  }
  const block = match[1];
  const fields = [];
  for (const line of block.split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (pair !== null) fields.push({ key: pair[1], value: pair[2].trim() });
  }
  return { hasFence: true, fields, body: raw.slice(match[0].length) };
}
function applyToggle(raw, enabled) {
  const parsed = splitFrontmatter(raw);
  const toggleKeys = /* @__PURE__ */ new Set(["user-invocable", "disable-model-invocation"]);
  const kept = parsed.fields.filter((field) => !toggleKeys.has(field.key));
  const lines = kept.map((field) => `${field.key}: ${field.value}`);
  if (!enabled) {
    lines.push("user-invocable: false");
    lines.push("disable-model-invocation: true");
  }
  const block = lines.join("\n");
  if (parsed.hasFence) {
    return `---
${block}
---
${parsed.body}`;
  }
  const body = parsed.body.startsWith("\n") ? parsed.body.slice(1) : parsed.body;
  return `---
${block}
---
${body}`;
}
function parseEnabled(fields) {
  const userInvocable = fields.find((field) => field.key === "user-invocable")?.value;
  const disableModel = fields.find((field) => field.key === "disable-model-invocation")?.value;
  const userDisabled = userInvocable?.toLowerCase() === "false";
  const modelDisabled = disableModel?.toLowerCase() === "true";
  return !(userDisabled || modelDisabled);
}
async function setSkillEnabled(skillName, enabled) {
  const found = await readSkillFile2(skillName);
  if (found === void 0) return false;
  const updated = applyToggle(found.raw, enabled);
  if (updated === found.raw) return true;
  const target = join2(found.dir, SKILL_FILE2);
  const temp = `${target}.toggle.tmp`;
  await mkdir2(found.dir, { recursive: true });
  await writeFile2(temp, updated, "utf8");
  await rename2(temp, target);
  return true;
}
async function setBundleEnabled(bundleId, enabled) {
  const root = managedRoot2();
  const ledger = await readBundles2(root);
  const record = ledger.bundles.find((bundle) => bundle.id === bundleId);
  if (record === void 0) return -1;
  let handled = 0;
  for (const skillName of record.skills) {
    if (await setSkillEnabled(skillName, enabled)) handled += 1;
  }
  return handled;
}
async function status() {
  const skills = {};
  const seen = /* @__PURE__ */ new Set();
  for (const root of [managedRoot2(), dshRoot2()]) {
    let entries = [];
    try {
      entries = (await readdir2(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      continue;
    }
    for (const dir of entries) {
      if (seen.has(dir)) continue;
      seen.add(dir);
      try {
        const raw = await readFile2(join2(root, dir, SKILL_FILE2), "utf8");
        const fields = splitFrontmatter(raw).fields;
        const nameField = fields.find((field) => field.key === "name")?.value;
        const name2 = nameField !== void 0 && nameField !== "" ? nameField : dir;
        skills[name2] = parseEnabled(fields);
      } catch {
      }
    }
  }
  const bundles = {};
  const ledger = await readBundles2(managedRoot2());
  const alias = await skillNameIndex();
  for (const record of ledger.bundles) {
    const states = record.skills.map((skillName) => skills[alias.get(skillName) ?? skillName]);
    bundles[record.id] = states.length === 0 || states.every((state) => state !== false);
  }
  return { skills, bundles };
}
function installMask(ctx, agent) {
  const presetOf2 = () => {
    const presets = ctx.get?.("agentPresets");
    if (presets?.composedPreset === void 0) return "";
    try {
      return presets.composedPreset(agent.ctx) ?? "";
    } catch {
      return "";
    }
  };
  return agent.ctx.inject(["skills"], (scope) => {
    scope.skills.registerProvider((control) => {
      maskInvalidators.add(control.invalidate);
      control.signal.addEventListener("abort", () => {
        maskInvalidators.delete(control.invalidate);
      }, { once: true });
      return {
        name: MASK_PROVIDER,
        list: async () => {
          const presetId = presetOf2();
          if (presetId === "") return [];
          const disabled = disabledNames(await readLedger(), presetId);
          if (disabled.size === 0) return [];
          return [...disabled].map((skillName) => ({
            name: skillName,
            description: `disabled for agent preset "${presetId}"`,
            invocation: { modelInvocable: false, userInvocable: false },
            source: "custom",
            provider: MASK_PROVIDER,
            rank: 0,
            locator: null
          }));
        },
        // 被遮住的名字没有可加载的正文:调用方拿到 undefined 即等于「不存在」。
        get: async () => void 0
      };
    });
  });
}
async function readPresetRoster(ctx) {
  const presets = ctx.get?.("agentPresets");
  if (presets?.list === void 0) return [];
  try {
    const rows = await presets.list();
    const defaultId = presets.defaultId;
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      id: String(row?.id ?? ""),
      trust: row?.trust === "system" ? "system" : "user",
      isDefault: row?.id === defaultId,
      ...typeof row?.name === "string" ? { name: row.name } : {},
      ...typeof row?.description === "string" ? { description: row.description } : {},
      ...typeof row?.order === "number" ? { order: row.order } : {}
    })).filter((row) => row.id !== "");
  } catch (error) {
    console.log("[skill-toggles] agentPresets.list failed:", error?.message ?? error);
    return [];
  }
}
function isLoopbackAddress2(address) {
  if (typeof address !== "string") return false;
  const a = address.toLowerCase();
  if (a === "::1") return true;
  const ipv4 = a.startsWith("::ffff:") ? a.slice(7) : a;
  const octets = ipv4.split(".");
  return octets.length === 4 && octets[0] === "127" && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function hostNameOf2(value) {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase();
  if (host.startsWith("[")) {
    const close = host.indexOf("]");
    if (close <= 1) return null;
    const suffix = host.slice(close + 1);
    if (suffix !== "" && !/^:\d+$/.test(suffix)) return null;
    return host.slice(1, close);
  }
  const firstColon = host.indexOf(":");
  const lastColon = host.lastIndexOf(":");
  if (firstColon !== lastColon) return null;
  return firstColon === -1 ? host : host.slice(0, firstColon);
}
function loopbackAllowed2(req) {
  if (!isLoopbackAddress2(req.socket.remoteAddress)) return false;
  const host = hostNameOf2(req.headers.host);
  if (host === null) return false;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
function json2(res, status2, value) {
  const body = JSON.stringify(value);
  res.writeHead(status2, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache"
  });
  res.end(body);
}
function readBody2(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
async function handle2(ctx, req, res) {
  if (!loopbackAllowed2(req)) {
    json2(res, 403, { error: "loopback-only" });
    return;
  }
  const url = new URL3(req.url ?? "/", "http://localhost");
  const rest = url.pathname.slice(ROUTE_PREFIX2.length);
  const method = req.method ?? "GET";
  try {
    if (method === "GET" && (rest === "" || rest === "/status")) {
      json2(res, 200, await status());
      return;
    }
    const matchSkill = /^\/skills\/([^/]+)$/.exec(rest);
    if (method === "PUT" && matchSkill !== null) {
      const body = await readBody2(req);
      const enabled = body.enabled;
      if (typeof enabled !== "boolean") throw new Error("enabled must be a boolean");
      const name2 = decodeURIComponent(matchSkill[1]);
      const ok = await setSkillEnabled(name2, enabled);
      if (!ok) throw new Error(`skill ${JSON.stringify(name2)} not found`);
      json2(res, 200, { ok: true, name: name2, enabled });
      return;
    }
    const matchBundle = /^\/bundles\/([^/]+)$/.exec(rest);
    if (method === "PUT" && matchBundle !== null) {
      const body = await readBody2(req);
      const enabled = body.enabled;
      if (typeof enabled !== "boolean") throw new Error("enabled must be a boolean");
      const id = decodeURIComponent(matchBundle[1]);
      const handled = await setBundleEnabled(id, enabled);
      if (handled < 0) throw new Error(`bundle ${JSON.stringify(id)} not found`);
      json2(res, 200, { ok: true, id, enabled, handled });
      return;
    }
    if (method === "GET" && rest === "/presets") {
      const [roster, global, ledger] = await Promise.all([
        readPresetRoster(ctx),
        status(),
        readLedger()
      ]);
      json2(res, 200, {
        presets: roster,
        overrides: ledger.presets,
        skills: global.skills,
        bundles: global.bundles
      });
      return;
    }
    const matchPresetSkill = /^\/presets\/([^/]+)\/skills\/([^/]+)$/.exec(rest);
    if (method === "PUT" && matchPresetSkill !== null) {
      const body = await readBody2(req);
      const enabled = body.enabled;
      if (typeof enabled !== "boolean") throw new Error("enabled must be a boolean");
      const presetId = decodeURIComponent(matchPresetSkill[1]);
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`);
      const skillName = decodeURIComponent(matchPresetSkill[2]);
      if (!isSkillName(skillName)) throw new Error(`invalid skill name ${JSON.stringify(skillName)}`);
      const changed = await setPresetSkills(presetId, [skillName], enabled);
      json2(res, 200, { ok: true, preset: presetId, name: skillName, enabled, changed });
      return;
    }
    const matchPresetBundle = /^\/presets\/([^/]+)\/bundles\/([^/]+)$/.exec(rest);
    if (method === "PUT" && matchPresetBundle !== null) {
      const body = await readBody2(req);
      const enabled = body.enabled;
      if (typeof enabled !== "boolean") throw new Error("enabled must be a boolean");
      const presetId = decodeURIComponent(matchPresetBundle[1]);
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`);
      const bundleId = decodeURIComponent(matchPresetBundle[2]);
      const ledger = await readBundles2(managedRoot2());
      const record = ledger.bundles.find((bundle) => bundle.id === bundleId);
      if (record === void 0) throw new Error(`bundle ${JSON.stringify(bundleId)} not found`);
      const changed = await setPresetSkills(presetId, await canonicalSkillNames(record.skills), enabled);
      json2(res, 200, { ok: true, preset: presetId, id: bundleId, enabled, changed });
      return;
    }
    const matchPresetReset = /^\/presets\/([^/]+)\/reset$/.exec(rest);
    if (method === "POST" && matchPresetReset !== null) {
      const presetId = decodeURIComponent(matchPresetReset[1]);
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`);
      const current = await readLedger();
      if (current.presets[presetId] !== void 0) {
        const presets = { ...current.presets };
        delete presets[presetId];
        await writeLedger({ version: 1, presets });
      }
      json2(res, 200, { ok: true, preset: presetId });
      return;
    }
    json2(res, 404, { error: `no route for ${method} ${rest}` });
  } catch (error) {
    json2(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}
async function apply3(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX2,
    handler: (req, res) => {
      void handle2(ctx, req, res);
    }
  }), "triad: skill-toggles routes");
  ctx.effect(() => {
    const fibers = /* @__PURE__ */ new Map();
    const install = (agent) => {
      if (agent === void 0 || fibers.has(agent)) return;
      try {
        fibers.set(agent, installMask(ctx, agent));
      } catch (error) {
        console.log("[skill-toggles] preset mask install failed:", error?.message ?? error);
      }
    };
    const remove = (agent) => {
      const fiber = fibers.get(agent);
      if (fiber === void 0) return;
      fibers.delete(agent);
      void Promise.resolve(fiber.dispose?.()).catch(() => {
      });
    };
    const agents = ctx.get?.("agents");
    if (agents?.list !== void 0) for (const agent of agents.list()) install(agent);
    const offCreated = ctx.on("agent/created", ({ agent }) => {
      install(agent);
    });
    const offDisposed = ctx.on("agent/disposed", ({ agent }) => {
      remove(agent);
    });
    return () => {
      offCreated();
      offDisposed();
      for (const agent of [...fibers.keys()]) remove(agent);
      maskInvalidators.clear();
    };
  }, "triad: skill-toggles preset masks");
}

// src/skill-health.ts
import { readdir as readdir3, readFile as readFile3 } from "node:fs/promises";
import { homedir as homedir3 } from "node:os";
import { join as join3 } from "node:path";
var SKILL_FILE3 = "SKILL.md";
var BUNDLES_FILE3 = ".bundles.json";
var ROUTE_PATH = "/api/skill-health";
function managedRoot3() {
  const agentsHome = process.env.DSH_AGENTS_HOME ?? join3(homedir3(), ".agents");
  return join3(agentsHome, "skills");
}
function dshRoot3() {
  const dshHome6 = process.env.DSH_HOME ?? join3(homedir3(), ".dsh");
  return join3(dshHome6, "skills");
}
function parseFrontmatter2(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  const block = match?.[1];
  if (block === void 0) return {};
  const fields = {};
  for (const line of block.split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    const key = pair?.[1];
    const valueText = pair?.[2];
    if (key === void 0 || valueText === void 0) continue;
    const value = valueText.trim();
    if (value === "true") fields[key] = true;
    else if (value === "false") fields[key] = false;
    else fields[key] = value;
  }
  return fields;
}
async function readBundles3(root) {
  try {
    const parsed = JSON.parse(await readFile3(join3(root, BUNDLES_FILE3), "utf8"));
    if (typeof parsed === "object" && parsed !== null && parsed.version === 1 && Array.isArray(parsed.bundles)) {
      return parsed;
    }
  } catch {
  }
  return { version: 1, bundles: [] };
}
async function scanRoot(root, nameSet) {
  const issues = [];
  let entries = [];
  try {
    entries = (await readdir3(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  } catch {
    return { healthy: 0, issues };
  }
  let healthy = 0;
  for (const entry of entries) {
    nameSet.add(entry.name);
    let raw;
    try {
      raw = await readFile3(join3(root, entry.name, SKILL_FILE3), "utf8");
    } catch {
      issues.push({
        level: "error",
        code: "missing-skill-md",
        skill: entry.name,
        message: `\u76EE\u5F55\u300C${entry.name}\u300D\u7F3A\u5C11 ${SKILL_FILE3}\uFF0C\u6280\u80FD\u9762\u677F\u4E0D\u4F1A\u663E\u793A\u5B83`
      });
      continue;
    }
    const fields = parseFrontmatter2(raw);
    const fmName = typeof fields.name === "string" && fields.name !== "" ? fields.name : null;
    if (fmName === null || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(fmName)) {
      issues.push({
        level: "error",
        code: "bad-frontmatter",
        skill: entry.name,
        message: `\u300C${entry.name}\u300D\u7684 ${SKILL_FILE3} \u7F3A\u5C11\u6709\u6548\u7684 name \u5B57\u6BB5`
      });
      continue;
    }
    nameSet.add(fmName);
    if (fmName !== entry.name) {
      issues.push({
        level: "warn",
        code: "name-mismatch",
        skill: entry.name,
        message: `\u76EE\u5F55\u300C${entry.name}\u300D\u4E0E frontmatter name\u300C${fmName}\u300D\u4E0D\u4E00\u81F4\uFF0C\u6253\u5F00\u6280\u80FD\u6587\u4EF6\u53EF\u80FD 404`
      });
    }
    healthy += 1;
  }
  return { healthy, issues };
}
async function healthCheck() {
  const issues = [];
  const nameSet = /* @__PURE__ */ new Set();
  const a = await scanRoot(managedRoot3(), nameSet);
  const b = await scanRoot(dshRoot3(), nameSet);
  const healthy = a.healthy + b.healthy;
  issues.push(...a.issues, ...b.issues);
  const ledger = await readBundles3(managedRoot3());
  for (const record of ledger.bundles) {
    for (const skillName of record.skills) {
      if (!nameSet.has(skillName)) {
        issues.push({
          level: "error",
          code: "dangling-bundle",
          skill: skillName,
          bundle: record.name,
          message: `Bundle\u300C${record.name}\u300D\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u6280\u80FD\u300C${skillName}\u300D`
        });
      }
    }
  }
  return { ok: issues.every((issue) => issue.level !== "error"), healthy, issues };
}
function isLoopbackAddress3(address) {
  if (typeof address !== "string") return false;
  const a = address.toLowerCase();
  if (a === "::1") return true;
  const ipv4 = a.startsWith("::ffff:") ? a.slice(7) : a;
  const octets = ipv4.split(".");
  return octets.length === 4 && octets[0] === "127" && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function hostNameOf3(value) {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase();
  if (host.startsWith("[")) {
    const close = host.indexOf("]");
    if (close <= 1) return null;
    const suffix = host.slice(close + 1);
    if (suffix !== "" && !/^:\d+$/.test(suffix)) return null;
    return host.slice(1, close);
  }
  const firstColon = host.indexOf(":");
  const lastColon = host.lastIndexOf(":");
  if (firstColon !== lastColon) return null;
  return firstColon === -1 ? host : host.slice(0, firstColon);
}
function loopbackAllowed3(req) {
  if (!isLoopbackAddress3(req.socket.remoteAddress)) return false;
  const host = hostNameOf3(req.headers.host);
  if (host === null) return false;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
function json3(res, status2, value) {
  const body = JSON.stringify(value);
  res.writeHead(status2, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache"
  });
  res.end(body);
}
function applySkillHealth(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PATH,
    handler: (req, res) => {
      void (async () => {
        if (!loopbackAllowed3(req)) {
          json3(res, 403, { error: "loopback-only" });
          return;
        }
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname === ROUTE_PATH || url.pathname === `${ROUTE_PATH}/`) {
          json3(res, 200, await healthCheck());
          return;
        }
        json3(res, 404, { error: `no route for ${req.method ?? "GET"} ${url.pathname}` });
      })();
    }
  }), "dsh-skill-health: routes");
}

// src/mcp-recommended.ts
var ROUTE_PATH2 = "/api/mcp-recommended";
var FETCH_TIMEOUT_MS = 8e3;
var CACHE_TTL_MS = 5 * 60 * 1e3;
var FALLBACK = [
  { id: "filesystem", name: "Filesystem MCP", description: "\u63D0\u4F9B\u5B89\u5168\u7684\u6587\u4EF6\u7CFB\u7EDF\u8BBF\u95EE\u80FD\u529B\uFF0C\u652F\u6301\u8BFB\u53D6\u3001\u5199\u5165\u3001\u641C\u7D22\u6587\u4EF6\u3002", url: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem", tag: "official", category: "\u6587\u4EF6" },
  { id: "websearch", name: "Web Search MCP", description: "\u96C6\u6210\u7F51\u7EDC\u641C\u7D22\u80FD\u529B\uFF0C\u83B7\u53D6\u5B9E\u65F6\u4FE1\u606F\u548C\u7F51\u9875\u5185\u5BB9\u3002", url: "https://github.com/modelcontextprotocol/servers/tree/main/src/web-search", tag: "official", category: "\u641C\u7D22" },
  { id: "github", name: "GitHub MCP", description: "\u8BBF\u95EE GitHub \u4ED3\u5E93\u3001Issue\u3001\u7BA1\u7406\u4EE3\u7801\u3001Pull Request \u7B49\u3002", url: "https://github.com/github/github-mcp-server", tag: "official", category: "\u5F00\u53D1" },
  { id: "database", name: "Database MCP", description: "\u8FDE\u63A5\u5E76\u67E5\u8BE2\u591A\u79CD\u6570\u636E\u5E93\uFF0C\u652F\u6301 SQL \u6267\u884C\u548C\u6570\u636E\u5206\u6790\u3002", url: "https://github.com/designcomputer/mysql_mcp_server", tag: "community", category: "\u6570\u636E" },
  { id: "slack", name: "Slack MCP", description: "\u4E0E Slack \u5DE5\u4F5C\u533A\u96C6\u6210\uFF0C\u53D1\u9001\u6D88\u606F\u3001\u8BFB\u53D6\u9891\u9053\u548C\u7BA1\u7406\u901A\u77E5\u3002", url: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack", tag: "official", category: "\u534F\u4F5C" }
];
var OFFICIAL_SOURCE = "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md";
var AWESOME_SOURCE = "https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md";
var REGISTRY_SOURCE = "https://registry.modelcontextprotocol.io/v0/servers?limit=40";
var SEARCH_ROUTE = "/api/mcp-recommended/search";
var RESOLVE_ROUTE = "/api/mcp-recommended/resolve";
async function gitHubSearch(q) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`"mcp server" ${q}`)}&sort=stars&per_page=10`;
  const raw = await fetchWithTimeout(url);
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return items.filter((item) => typeof item.full_name === "string" && item.full_name !== "").filter((item) => {
    const text = `${item.full_name} ${typeof item.description === "string" ? item.description : ""}`;
    return /mcp/i.test(text);
  }).map((item) => ({
    source: "github",
    id: `gh-${item.full_name.toLowerCase()}`,
    name: item.full_name,
    description: typeof item.description === "string" ? item.description : "",
    url: typeof item.html_url === "string" ? item.html_url : `https://github.com/${item.full_name}`,
    stars: typeof item.stargazers_count === "number" ? item.stargazers_count : void 0
  }));
}
async function registrySearch(q) {
  const raw = await fetchWithTimeout(`${REGISTRY_SOURCE}&search=${encodeURIComponent(q)}`);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed.servers) ? parsed.servers : [];
  const rows = [];
  const ql = q.toLowerCase();
  for (const entry of entries) {
    const server = entry.server ?? {};
    const name2 = typeof server.title === "string" && server.title !== "" ? server.title : typeof server.name === "string" ? server.name : "";
    if (name2 === "") continue;
    const description = typeof server.description === "string" ? server.description : "";
    if (ql !== "" && !name2.toLowerCase().includes(ql) && !description.toLowerCase().includes(ql)) continue;
    let url;
    for (const remote of Array.isArray(server.remotes) ? server.remotes : []) {
      if (typeof remote.url === "string" && /^https?:/.test(remote.url)) {
        url = remote.url;
        break;
      }
    }
    rows.push({ source: "registry", id: `registry-${name2.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 48)}`, name: name2, description, url });
    if (rows.length >= 10) break;
  }
  return rows;
}
var SEARCH_CACHE_TTL_MS = 60 * 1e3;
var searchCache = /* @__PURE__ */ new Map();
async function searchServers(qRaw) {
  const q = qRaw.trim();
  if (q.length < 2) return [];
  const key = q.toLowerCase();
  const hit = searchCache.get(key);
  if (hit !== void 0 && Date.now() - hit.at < SEARCH_CACHE_TTL_MS) return hit.value;
  const merged = [];
  const seen = /* @__PURE__ */ new Set();
  for (const results of await Promise.allSettled([gitHubSearch(q), registrySearch(q), awesomeSearch(q)])) {
    if (results.status !== "fulfilled") continue;
    for (const item of results.value) {
      const k = item.name.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(item);
      if (merged.length >= 16) break;
    }
  }
  searchCache.set(key, { at: Date.now(), value: merged });
  return merged;
}
function resolveCommand(readme) {
  const jsonCandidates = Array.from(readme.matchAll(/"command"\s*:\s*"([^"]+)"/g)).map((match) => match[1].trim()).filter((command) => command.length > 4 && /^(npx|uvx|uv|python|deno|bunx|node|pipx)/.test(command));
  if (jsonCandidates.length > 0) {
    return jsonCandidates.sort((a, b) => b.length - a.length)[0];
  }
  const bare = /(?:^|\n)\s*(npx\s+-y\s+\S+|uvx\s+\S+|uv\s+run\s+\S+|python\s+-m\s+\S+|deno\s+run\s+\S+|bunx\s+\S+)[^\r\n"<]*/.exec(readme);
  if (bare) return bare[1].trim();
  return void 0;
}
function resolveEndpoint(readme) {
  const badHost = /img\.shields\.io|raw\.githubusercontent|github\.com\/|user-images|badge/i;
  const sse = /https?:\/\/[^\s"'<>()]+(?:\/sse)[^\s"'<>()]*/.exec(readme);
  if (sse && !badHost.test(sse[0])) return { url: sse[0], type: "sse" };
  const http = /https?:\/\/[^\s"'<>()]+(?:\/mcp)[^\s"'<>()]*/.exec(readme);
  if (http && !badHost.test(http[0])) return { url: http[0], type: "http" };
  return void 0;
}
async function resolveServer(repoUrl) {
  const match = /github\.com\/([^/]+)\/([^/#?]+)/.exec(repoUrl);
  if (match === null) return { ok: false };
  const fullName = `${match[1]}/${match[2].replace(/\.git$/, "")}`;
  let readme = "";
  for (const name2 of ["README.md", "README.MD", "readme.md", "README.rst"]) {
    try {
      readme = await fetchWithTimeout(`https://raw.githubusercontent.com/${fullName}/HEAD/${name2}`);
      break;
    } catch {
    }
  }
  if (readme === "") return { ok: false };
  const command = resolveCommand(readme);
  if (command !== void 0) return { ok: true, type: "stdio", command };
  const endpoint = resolveEndpoint(readme);
  if (endpoint !== void 0) return { ok: true, type: endpoint.type, url: endpoint.url };
  return { ok: false };
}
function categorize(description) {
  const text = description.toLowerCase();
  if (/file|filesystem|文件|目录/.test(text)) return "\u6587\u4EF6";
  if (/search|搜索|browser|网页|web\s/.test(text)) return "\u641C\u7D22";
  if (/git|github|code|repo|repo|代码|开发/.test(text)) return "\u5F00\u53D1";
  if (/db|database|sql|postgres|mysql|mongo|数据/.test(text)) return "\u6570\u636E";
  if (/slack|teams|notion|calendar|mail|协作|会议|通知/.test(text)) return "\u534F\u4F5C";
  if (/cloud|aws|gcp|azure|云/.test(text)) return "\u4E91";
  return "\u7CBE\u9009";
}
function plainText(cell) {
  return cell.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/^\s*\*+\s*/, "").trim();
}
function extractUrl(cell) {
  const direct = /(https?:\/\/[^\s)|]+)/.exec(cell);
  if (direct) return direct[1];
  const linkParam = /\(([^)]+)\)/.exec(cell);
  if (linkParam && /^https?:/.test(linkParam[1])) return linkParam[1];
  return void 0;
}
function parseReadme(raw) {
  const out = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || /^\|?[\s|:-]+$/.test(trimmed) || /^#{1,6}\s/.test(trimmed)) continue;
    const table = /^\|\s*(.*?)\s*\|\s*$/.exec(trimmed);
    if (table) {
      const cells = table[1].split("|").map(plainText);
      const name2 = cells[0];
      if (name2 === "" || /^(name|名称|server|repository|repo)$/i.test(name2)) continue;
      let description = "";
      let url;
      for (const cell of cells) {
        const u = extractUrl(cell) ?? extractUrl(table[1].split("|")[cells.indexOf(cell)] ?? "");
        if (u !== void 0 && url === void 0) url = u;
        if (cell.length > description.length && !/^https?:/i.test(cell)) description = cell;
      }
      const fallbackUrl = extractUrl(table[1]);
      out.push({ name: name2, description: description === name2 ? "" : description, url: url ?? fallbackUrl });
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(trimmed);
    if (!bullet) continue;
    const body = bullet[1];
    const boldLink = /^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*[-—:.]*\s*(.*)$/.exec(body);
    if (boldLink) {
      const name2 = plainText(boldLink[1]);
      if (name2 === "" || /^(name|名称)$/i.test(name2)) continue;
      out.push({ name: name2, description: plainText(boldLink[3]), url: /^https?:/.test(boldLink[2]) ? boldLink[2] : void 0 });
      continue;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)\s*[-—:.]*\s*(.*)$/.exec(body);
    if (link) {
      const name2 = plainText(link[1]);
      if (name2 === "" || /^(name|名称)$/i.test(name2)) continue;
      out.push({ name: name2, description: plainText(link[3]), url: /^https?:/.test(link[2]) ? link[2] : void 0 });
      continue;
    }
    const bold = /^\*\*([^*]+)\*\*\s*[-—:.]*\s*(.*)$/.exec(body);
    if (bold) {
      out.push({ name: plainText(bold[1]), description: plainText(bold[2]) });
      continue;
    }
  }
  return out;
}
async function fetchWithTimeout(url) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        // GitHub API 强制要求 User-Agent（缺失返回 403）。
        headers: { "user-agent": "dsh-prompt-customizer" }
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve3) => setTimeout(resolve3, 500));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed");
}
async function fetchSource(url, tag) {
  const raw = await fetchWithTimeout(url);
  return parseReadme(raw).filter((item) => item.name !== "" && !/\bSDK\b/i.test(item.name)).map((item, index) => ({
    id: `${tag}-${item.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 48) || String(index)}`,
    name: item.name,
    description: item.description ?? "",
    url: item.url,
    tag,
    category: categorize(item.description)
  }));
}
var awesomeCache = null;
async function fetchAwesome() {
  if (awesomeCache !== null && Date.now() - awesomeCache.at < CACHE_TTL_MS) return awesomeCache.rows;
  const rows = await fetchSource(AWESOME_SOURCE, "community");
  awesomeCache = { at: Date.now(), rows };
  return rows;
}
async function awesomeSearch(q) {
  const rows = await fetchAwesome();
  const ql = q.toLowerCase();
  return rows.filter((row) => row.name.toLowerCase().includes(ql) || row.description.toLowerCase().includes(ql));
}
async function fetchRegistry() {
  const raw = await fetchWithTimeout(REGISTRY_SOURCE);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed.servers) ? parsed.servers : [];
  const rows = [];
  for (const entry of entries) {
    const server = entry.server ?? {};
    const name2 = typeof server.title === "string" && server.title !== "" ? server.title : typeof server.name === "string" && server.name !== "" ? server.name : "";
    if (name2 === "") continue;
    const description = typeof server.description === "string" ? server.description : "";
    let url;
    for (const remote of Array.isArray(server.remotes) ? server.remotes : []) {
      if (typeof remote.url === "string" && /^https?:/.test(remote.url)) {
        url = remote.url;
        break;
      }
    }
    rows.push({
      id: `community-${name2.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 48)}`,
      name: name2,
      description,
      url,
      tag: "community",
      category: categorize(description)
    });
  }
  return rows;
}
async function buildRecommended() {
  const [awesome, official, community] = await Promise.allSettled([
    fetchAwesome(),
    fetchSource(OFFICIAL_SOURCE, "official"),
    fetchRegistry()
  ]);
  const awesomeRows = awesome.status === "fulfilled" ? awesome.value : [];
  const officialRows = official.status === "fulfilled" ? official.value : [];
  const communityRows = community.status === "fulfilled" ? community.value : [];
  if (awesomeRows.length === 0 && communityRows.length === 0 && officialRows.length === 0) {
    return { source: "offline", updatedAt: (/* @__PURE__ */ new Date()).toISOString(), servers: FALLBACK };
  }
  const seen = /* @__PURE__ */ new Set();
  const merged = [];
  for (const row of [...awesomeRows, ...communityRows, ...officialRows]) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
    if (merged.length >= 60) break;
  }
  return { source: "official+community", updatedAt: (/* @__PURE__ */ new Date()).toISOString(), servers: merged };
}
var cache = null;
async function getRecommended() {
  if (cache !== null && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  const value = await buildRecommended();
  cache = { at: Date.now(), value };
  return value;
}
function isLoopbackAddress4(address) {
  if (typeof address !== "string") return false;
  const a = address.toLowerCase();
  if (a === "::1") return true;
  const ipv4 = a.startsWith("::ffff:") ? a.slice(7) : a;
  const octets = ipv4.split(".");
  return octets.length === 4 && octets[0] === "127" && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function hostNameOf4(value) {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase();
  if (host.startsWith("[")) {
    const close = host.indexOf("]");
    if (close <= 1) return null;
    const suffix = host.slice(close + 1);
    if (suffix !== "" && !/^:\d+$/.test(suffix)) return null;
    return host.slice(1, close);
  }
  const firstColon = host.indexOf(":");
  const lastColon = host.lastIndexOf(":");
  if (firstColon !== lastColon) return null;
  return firstColon === -1 ? host : host.slice(0, firstColon);
}
function loopbackAllowed4(req) {
  if (!isLoopbackAddress4(req.socket.remoteAddress)) return false;
  const host = hostNameOf4(req.headers.host);
  if (host === null) return false;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
function writeJsonResponse(res, status2, value) {
  res.writeHead(status2, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache"
  });
  res.end(JSON.stringify(value));
}
function applyMcpRecommended(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PATH2,
    handler: (req, res) => {
      void (async () => {
        if (!loopbackAllowed4(req)) {
          writeJsonResponse(res, 403, { error: "loopback-only" });
          return;
        }
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname === ROUTE_PATH2 || url.pathname === `${ROUTE_PATH2}/`) {
          writeJsonResponse(res, 200, await getRecommended());
          return;
        }
        if (url.pathname === SEARCH_ROUTE || url.pathname === `${SEARCH_ROUTE}/`) {
          const q = url.searchParams.get("q") ?? "";
          writeJsonResponse(res, 200, { query: q, servers: await searchServers(q) });
          return;
        }
        if (url.pathname === RESOLVE_ROUTE || url.pathname === `${RESOLVE_ROUTE}/`) {
          const repo = url.searchParams.get("repo") ?? "";
          if (!/^https?:\/\//.test(repo)) {
            writeJsonResponse(res, 400, { ok: false, error: "repo required" });
            return;
          }
          writeJsonResponse(res, 200, await resolveServer(repo));
          return;
        }
        writeJsonResponse(res, 404, { error: `no route for ${req.method ?? "GET"} ${url.pathname}` });
      })();
    }
  }), "dsh-mcp-recommended: routes");
}

// src/mcp-status.ts
import { readFileSync as readFileSync4, writeFileSync as writeFileSync4, copyFileSync as copyFileSync2, existsSync as existsSync2 } from "node:fs";
import { homedir as homedir7 } from "node:os";
import { join as join7 } from "node:path";

// src/mcp-mask-ledger.ts
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir as homedir4 } from "node:os";
import { dirname, join as join4 } from "node:path";
var MASK_FILE = "preset-masks.json";
var MAX_PRESET_ENTRIES2 = 50;
function dshHome2() {
  const fromEnv = process.env["DSH_HOME"];
  return fromEnv !== void 0 && fromEnv.trim() !== "" ? fromEnv.trim() : join4(homedir4(), ".dsh");
}
function maskLedgerPath() {
  return join4(dshHome2(), "mcp", "dsh-prompt-customizer", MASK_FILE);
}
function isPresetId2(value) {
  return /^[a-z0-9][a-z0-9-]*$/.test(value);
}
function isServerName(value) {
  return /^[A-Za-z0-9_-]{1,32}$/.test(value);
}
function toolBelongsToServer(fullName, serverName) {
  const prefix = `mcp__${serverName}__`;
  return fullName.startsWith(prefix) && fullName.length > prefix.length;
}
function normalizeMaskLedger(input) {
  const presets = {};
  const raw = input !== null && typeof input === "object" ? input.presets : void 0;
  if (raw !== null && typeof raw === "object") {
    for (const [presetId, table] of Object.entries(raw)) {
      if (!isPresetId2(presetId)) continue;
      if (table === null || typeof table !== "object") continue;
      if (Object.keys(presets).length >= MAX_PRESET_ENTRIES2) break;
      const entries = {};
      for (const [serverName, state] of Object.entries(table)) {
        if (!isServerName(serverName) || typeof state !== "boolean") continue;
        entries[serverName] = state;
      }
      presets[presetId] = entries;
    }
  }
  return { version: 1, presets };
}
function maskedServersOf(ledger, presetId) {
  const table = ledger.presets[presetId];
  const masked = /* @__PURE__ */ new Set();
  if (table === void 0) return masked;
  for (const [serverName, state] of Object.entries(table)) {
    if (state === false) masked.add(serverName);
  }
  return masked;
}
function setMask(ledger, presetId, serverNames, enabled) {
  const table = { ...ledger.presets[presetId] ?? {} };
  let changed = 0;
  for (const serverName of serverNames) {
    if (!isServerName(serverName)) continue;
    if (enabled) {
      if (table[serverName] !== void 0) {
        delete table[serverName];
        changed += 1;
      }
    } else if (table[serverName] !== false) {
      table[serverName] = false;
      changed += 1;
    }
  }
  if (changed === 0) return { ledger, changed };
  const presets = { ...ledger.presets };
  if (Object.keys(table).length === 0) delete presets[presetId];
  else presets[presetId] = table;
  return { ledger: { version: 1, presets }, changed };
}
function computeDenyNames(globalNames, maskedServers, ownServers) {
  const candidates = [.../* @__PURE__ */ new Set([...maskedServers, ...ownServers])].sort((a, b) => b.length - a.length);
  const deny = [];
  for (const name2 of globalNames) {
    if (!name2.startsWith("mcp__")) continue;
    const serverName = candidates.find((candidate) => toolBelongsToServer(name2, candidate));
    if (serverName === void 0) continue;
    if (!maskedServers.has(serverName) || ownServers.has(serverName)) continue;
    deny.push(name2);
  }
  return deny;
}
var ledgerCache2;
function readMaskLedger(reload = false) {
  if (ledgerCache2 !== void 0 && !reload) return ledgerCache2;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(maskLedgerPath(), "utf8"));
  } catch {
    parsed = void 0;
  }
  ledgerCache2 = normalizeMaskLedger(parsed);
  return ledgerCache2;
}
function writeMaskLedger(next) {
  const target = maskLedgerPath();
  mkdirSync(dirname(target), { recursive: true });
  const temp = `${target}.tmp`;
  writeFileSync(temp, `${JSON.stringify(next, null, 2)}
`, "utf8");
  renameSync(temp, target);
  ledgerCache2 = next;
}

// src/mcp-presets.ts
import { copyFileSync, existsSync, mkdirSync as mkdirSync2, readFileSync as readFileSync2, renameSync as renameSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { dirname as dirname2, join as join5 } from "node:path";

// node_modules/.pnpm/js-yaml@4.3.2/node_modules/js-yaml/dist/js-yaml.mjs
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence)) return sequence;
    else if (isNothing(sequence)) return [];
    return [sequence];
  }
  function extend2(target, source) {
    if (source) {
      const sourceKeys = Object.keys(source);
      for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
        const key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    let result = "";
    for (let cycle = 0; cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  common.isNothing = isNothing;
  common.isObject = isObject;
  common.toArray = toArray;
  common.repeat = repeat;
  common.isNegativeZero = isNegativeZero;
  common.extend = extend2;
  return common;
}
var exception;
var hasRequiredException;
function requireException() {
  if (hasRequiredException) return exception;
  hasRequiredException = 1;
  function formatError(exception2, compact) {
    let where = "";
    const message = exception2.reason || "(unknown reason)";
    if (!exception2.mark) return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += "\n\n" + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException2(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException2.prototype = Object.create(Error.prototype);
  YAMLException2.prototype.constructor = YAMLException2;
  YAMLException2.prototype.toString = function toString2(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  exception = YAMLException2;
  return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
  if (hasRequiredSnippet) return snippet;
  hasRequiredSnippet = 1;
  const common2 = requireCommon();
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    let head = "";
    let tail = "";
    const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
      pos: position - lineStart + head.length
      // relative position
    };
  }
  function padStart(string, max) {
    return common2.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer) return null;
    if (!options.maxLength) options.maxLength = 79;
    if (typeof options.indent !== "number") options.indent = 1;
    if (typeof options.linesBefore !== "number") options.linesBefore = 3;
    if (typeof options.linesAfter !== "number") options.linesAfter = 2;
    const re = /\r?\n|\r|\0/g;
    const lineStarts = [0];
    const lineEnds = [];
    let match;
    let foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
    let result = "";
    const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (let i = 1; i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo - i],
        lineEnds[foundLineNo - i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
        maxLineLength
      );
      result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + "\n" + result;
    }
    const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
    result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
    for (let i = 1; i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo + i],
        lineEnds[foundLineNo + i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
        maxLineLength
      );
      result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + "\n";
    }
    return result.replace(/\n$/, "");
  }
  snippet = makeSnippet;
  return snippet;
}
var type;
var hasRequiredType;
function requireType() {
  if (hasRequiredType) return type;
  hasRequiredType = 1;
  const YAMLException2 = requireException();
  const TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  const YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    const result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type2(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name2) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name2) === -1) {
        throw new YAMLException2('Unknown option "' + name2 + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  type = Type2;
  return type;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
  if (hasRequiredSchema) return schema;
  hasRequiredSchema = 1;
  const YAMLException2 = requireException();
  const Type2 = requireType();
  function compileList(schema2, name2) {
    const result = [];
    schema2[name2].forEach(function(currentType) {
      let newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    const result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (let index = 0, length = arguments.length; index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema22(definition) {
    return this.extend(definition);
  }
  Schema22.prototype.extend = function extend2(definition) {
    let implicit = [];
    let explicit = [];
    if (definition instanceof Type2) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit) implicit = implicit.concat(definition.implicit);
      if (definition.explicit) explicit = explicit.concat(definition.explicit);
    } else {
      throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type2.loadKind && type2.loadKind !== "scalar") {
        throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type2.multi) {
        throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    const result = Object.create(Schema22.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  schema = Schema22;
  return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
  if (hasRequiredStr) return str;
  hasRequiredStr = 1;
  const Type2 = requireType();
  str = new Type2("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
  if (hasRequiredSeq) return seq;
  hasRequiredSeq = 1;
  const Type2 = requireType();
  seq = new Type2("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap) return map;
  hasRequiredMap = 1;
  const Type2 = requireType();
  map = new Type2("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
  if (hasRequiredFailsafe) return failsafe;
  hasRequiredFailsafe = 1;
  const Schema22 = requireSchema();
  failsafe = new Schema22({
    explicit: [
      requireStr(),
      requireSeq(),
      requireMap()
    ]
  });
  return failsafe;
}
var _null;
var hasRequired_null;
function require_null2() {
  if (hasRequired_null) return _null;
  hasRequired_null = 1;
  const Type2 = requireType();
  function resolveYamlNull(data) {
    if (data === null) return true;
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  _null = new Type2("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
  if (hasRequiredBool) return bool;
  hasRequiredBool = 1;
  const Type2 = requireType();
  function resolveYamlBoolean(data) {
    if (data === null) return false;
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  bool = new Type2("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
  if (hasRequiredInt) return int;
  hasRequiredInt = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  function isHexCode(c) {
    return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
  }
  function isOctCode(c) {
    return c >= 48 && c <= 55;
  }
  function isDecCode(c) {
    return c >= 48 && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null) return false;
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max) return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max) return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (; index < max; index++) {
          ch = data[index];
          if (ch !== "0" && ch !== "1") return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "x") {
        index++;
        for (; index < max; index++) {
          if (!isHexCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "o") {
        index++;
        for (; index < max; index++) {
          if (!isOctCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
    }
    for (; index < max; index++) {
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits) return false;
    return isFinite(parseYamlInteger(data));
  }
  function parseYamlInteger(data) {
    let value = data;
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-") sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0") return 0;
    if (ch === "0") {
      if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function constructYamlInteger(data) {
    return parseYamlInteger(data);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
  }
  int = new Type2("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
  if (hasRequiredFloat) return float;
  hasRequiredFloat = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  const YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  const YAML_FLOAT_SPECIAL_PATTERN = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function resolveYamlFloat(data) {
    if (data === null) return false;
    if (!YAML_FLOAT_PATTERN.test(data)) {
      return false;
    }
    if (isFinite(parseFloat(data, 10))) {
      return true;
    }
    return YAML_FLOAT_SPECIAL_PATTERN.test(data);
  }
  function constructYamlFloat(data) {
    let value = data.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common2.isNegativeZero(object)) {
      return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
  }
  float = new Type2("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  return float;
}
var json4;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson) return json4;
  hasRequiredJson = 1;
  json4 = requireFailsafe().extend({
    implicit: [
      require_null2(),
      requireBool(),
      requireInt(),
      requireFloat()
    ]
  });
  return json4;
}
var core;
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core;
  hasRequiredCore = 1;
  core = requireJson();
  return core;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
  if (hasRequiredTimestamp) return timestamp;
  hasRequiredTimestamp = 1;
  const Type2 = requireType();
  const YAML_DATE_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  );
  const YAML_TIMESTAMP_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    let fraction = 0;
    let delta = null;
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null) throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      const tzHour = +match[10];
      const tzMinute = +(match[11] || 0);
      delta = (tzHour * 60 + tzMinute) * 6e4;
      if (match[9] === "-") delta = -delta;
    }
    const date2 = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta) date2.setTime(date2.getTime() - delta);
    return date2;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  timestamp = new Type2("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  return timestamp;
}
var merge2;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge) return merge2;
  hasRequiredMerge = 1;
  const Type2 = requireType();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  merge2 = new Type2("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  return merge2;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary) return binary;
  hasRequiredBinary = 1;
  const Type2 = requireType();
  const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
  function resolveYamlBinary(data) {
    if (data === null) return false;
    let bitlen = 0;
    const max = data.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      const code = map2.indexOf(data.charAt(idx));
      if (code > 64) continue;
      if (code < 0) return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    let bits = 0;
    const result = [];
    for (let idx = 0; idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    let result = "";
    let bits = 0;
    const max = object.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  binary = new Type2("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
  if (hasRequiredOmap) return omap;
  hasRequiredOmap = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null) return true;
    const objectKeys = {};
    const object = data;
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      let pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]") return false;
      let pairKey;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey) pairHasKey = true;
          else return false;
        }
      }
      if (!pairHasKey) return false;
      if (_hasOwnProperty.call(objectKeys, pairKey)) return false;
      Object.defineProperty(objectKeys, pairKey, { value: true });
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  omap = new Type2("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
  if (hasRequiredPairs) return pairs;
  hasRequiredPairs = 1;
  const Type2 = requireType();
  const _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null) return true;
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      if (_toString.call(pair) !== "[object Object]") return false;
      const keys = Object.keys(pair);
      if (keys.length !== 1) return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null) return [];
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      const keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  pairs = new Type2("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  return pairs;
}
var set2;
var hasRequiredSet;
function requireSet() {
  if (hasRequiredSet) return set2;
  hasRequiredSet = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null) return true;
    const object = data;
    for (const key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null) return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  set2 = new Type2("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  return set2;
}
var _default;
var hasRequired_default;
function require_default() {
  if (hasRequired_default) return _default;
  hasRequired_default = 1;
  _default = requireCore().extend({
    implicit: [
      requireTimestamp(),
      requireMerge()
    ],
    explicit: [
      requireBinary(),
      requireOmap(),
      requirePairs(),
      requireSet()
    ]
  });
  return _default;
}
var hasRequiredLoader;
function requireLoader() {
  if (hasRequiredLoader) return loader;
  hasRequiredLoader = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const makeSnippet = requireSnippet();
  const DEFAULT_SCHEMA2 = require_default();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CONTEXT_FLOW_IN = 1;
  const CONTEXT_FLOW_OUT = 2;
  const CONTEXT_BLOCK_IN = 3;
  const CONTEXT_BLOCK_OUT = 4;
  const CHOMPING_CLIP = 1;
  const CHOMPING_STRIP = 2;
  const CHOMPING_KEEP = 3;
  const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
  const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
  const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function isEol(c) {
    return c === 10 || c === 13;
  }
  function isWhiteSpace(c) {
    return c === 9 || c === 32;
  }
  function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    const lc = c | 32;
    if (lc >= 97 && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    switch (c) {
      case 48:
        return "\0";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "	";
      case 9:
        return "	";
      case 110:
        return "\n";
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "\x85";
      case 95:
        return "\xA0";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode(
      (c - 65536 >> 10) + 55296,
      (c - 65536 & 1023) + 56320
    );
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  const simpleEscapeCheck = new Array(256);
  const simpleEscapeMap = new Array(256);
  for (let i = 0; i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  function State(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
    this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.depth = 0;
    this.totalMergeKeys = 0;
    this.firstTabInLine = -1;
    this.documents = [];
    this.anchorMapTransactions = [];
  }
  function generateError(state, message) {
    const mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      // omit trailing \0
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = makeSnippet(mark);
    return new YAMLException2(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  function storeAnchor(state, name2, value) {
    const transactions = state.anchorMapTransactions;
    if (transactions.length !== 0) {
      const transaction = transactions[transactions.length - 1];
      if (!_hasOwnProperty.call(transaction, name2)) {
        transaction[name2] = {
          existed: _hasOwnProperty.call(state.anchorMap, name2),
          value: state.anchorMap[name2]
        };
      }
    }
    state.anchorMap[name2] = value;
  }
  function beginAnchorTransaction(state) {
    state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function commitAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const transactions = state.anchorMapTransactions;
    if (transactions.length === 0) return;
    const parent = transactions[transactions.length - 1];
    const names = Object.keys(transaction);
    for (let index = 0, length = names.length; index < length; index += 1) {
      const name2 = names[index];
      if (!_hasOwnProperty.call(parent, name2)) {
        parent[name2] = transaction[name2];
      }
    }
  }
  function rollbackAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const names = Object.keys(transaction);
    for (let index = names.length - 1; index >= 0; index -= 1) {
      const entry = transaction[names[index]];
      if (entry.existed) {
        state.anchorMap[names[index]] = entry.value;
      } else {
        delete state.anchorMap[names[index]];
      }
    }
  }
  function snapshotState(state) {
    return {
      position: state.position,
      line: state.line,
      lineStart: state.lineStart,
      lineIndent: state.lineIndent,
      firstTabInLine: state.firstTabInLine,
      tag: state.tag,
      anchor: state.anchor,
      kind: state.kind,
      result: state.result
    };
  }
  function restoreState(state, snapshot2) {
    state.position = snapshot2.position;
    state.line = snapshot2.line;
    state.lineStart = snapshot2.lineStart;
    state.lineIndent = snapshot2.lineIndent;
    state.firstTabInLine = snapshot2.firstTabInLine;
    state.tag = snapshot2.tag;
    state.anchor = snapshot2.anchor;
    state.kind = snapshot2.kind;
    state.result = snapshot2.result;
  }
  const directiveHandlers = {
    YAML: function handleYamlDirective(state, name2, args) {
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name2, args) {
      let prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      const handle6 = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle6)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle6)) {
        throwError(state, 'there is a previously declared suffix for "' + handle6 + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle6] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    if (start < end) {
      const _result = state.input.slice(start, end);
      if (checkJson) {
        for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
          const _character = _result.charCodeAt(_position);
          if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function chargeMergeWork(state) {
    state.totalMergeKeys++;
    if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) {
      throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    if (!common2.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    chargeMergeWork(state);
    const sourceKeys = Object.keys(source);
    for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
      const key = sourceKeys[index];
      chargeMergeWork(state);
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        if (valueNode.length > 100) {
          throwError(state, "abnormal merge sequence size");
        }
        for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0;
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (isEol(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common2.repeat("\n", count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    let captureStart;
    let captureEnd;
    let hasPendingContent;
    let _line;
    let _lineStart;
    let _lineIndent;
    const _kind = state.kind;
    const _result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          break;
        }
      } else if (ch === 35) {
        const preceding = state.input.charCodeAt(state.position - 1);
        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
        break;
      } else if (isEol(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!isWhiteSpace(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (isEol(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;
          for (; hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    let readNext = true;
    let _line;
    let _lineStart;
    let _pos;
    const _tag = state.tag;
    let _result;
    const _anchor = state.anchor;
    let terminator;
    let isPair;
    let isExplicitPair;
    let isMapping;
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyNode;
    let keyTag;
    let valueNode;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    let folding;
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (isWhiteSpace(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (isWhiteSpace(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!isEol(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (isEol(ch)) {
        emptyLines++;
        continue;
      }
      if (!detectedIndent && textIndent === 0) {
        throwError(state, "missing indentation for block scalar");
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += "\n";
          }
        }
        break;
      }
      if (folding) {
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common2.repeat("\n", emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common2.repeat("\n", emptyLines);
        }
      } else {
        state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = state.position;
      while (!isEol(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = [];
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      const following = state.input.charCodeAt(state.position + 1);
      if (!isWsOrEol(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      const _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    let allowCompact;
    let _keyLine;
    let _keyLineStart;
    let _keyPos;
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = {};
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      const following = state.input.charCodeAt(state.position + 1);
      const _line = state.line;
      if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!isWsOrEol(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle;
    let tagName;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 33) return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    let _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38) return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42) return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
    const fallbackState = snapshotState(state);
    beginAnchorTransaction(state);
    restoreState(state, propertyStart);
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
      commitAnchorTransaction(state);
      return true;
    }
    rollbackAnchorTransaction(state);
    restoreState(state, fallbackState);
    return false;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars;
    let allowBlockCollections;
    let indentStatus = 1;
    let atNewLine = false;
    let hasContent = false;
    let propertyStart = null;
    let type2;
    let flowIndent;
    let blockIndent;
    if (state.depth >= state.maxDepth) {
      throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
    }
    state.depth += 1;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (true) {
        const ch = state.input.charCodeAt(state.position);
        const propertyState = snapshotState(state);
        if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
          break;
        }
        if (!readTagProperty(state) && !readAnchorProperty(state)) {
          break;
        }
        if (propertyStart === null) {
          propertyStart = propertyState;
        }
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          const ch = state.input.charCodeAt(state.position);
          if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(
            state,
            propertyStart,
            propertyStart.position - propertyStart.lineStart,
            flowIndent
          )) {
            hasContent = true;
          } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, state.result);
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        const typeList = state.typeMap.multi[state.kind || "fallback"];
        for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    state.depth -= 1;
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    const documentStart = state.position;
    let hasDirectives = false;
    let ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      let _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      const directiveName = state.input.slice(_position, state.position);
      const directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !isEol(ch));
          break;
        }
        if (isEol(ch)) break;
        _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0) readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += "\n";
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    const state = new State(input, options);
    const nullpos = input.indexOf("\0");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\0";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll2(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    const documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (let index = 0, length = documents.length; index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load2(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return void 0;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException2("expected a single document in the stream, but found more");
  }
  loader.loadAll = loadAll2;
  loader.load = load2;
  return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
  if (hasRequiredDumper) return dumper;
  hasRequiredDumper = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const DEFAULT_SCHEMA2 = require_default();
  const _toString = Object.prototype.toString;
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CHAR_BOM = 65279;
  const CHAR_TAB = 9;
  const CHAR_LINE_FEED = 10;
  const CHAR_CARRIAGE_RETURN = 13;
  const CHAR_SPACE = 32;
  const CHAR_EXCLAMATION = 33;
  const CHAR_DOUBLE_QUOTE = 34;
  const CHAR_SHARP = 35;
  const CHAR_PERCENT = 37;
  const CHAR_AMPERSAND = 38;
  const CHAR_SINGLE_QUOTE = 39;
  const CHAR_ASTERISK = 42;
  const CHAR_COMMA = 44;
  const CHAR_MINUS = 45;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_GREATER_THAN = 62;
  const CHAR_QUESTION = 63;
  const CHAR_COMMERCIAL_AT = 64;
  const CHAR_LEFT_SQUARE_BRACKET = 91;
  const CHAR_RIGHT_SQUARE_BRACKET = 93;
  const CHAR_GRAVE_ACCENT = 96;
  const CHAR_LEFT_CURLY_BRACKET = 123;
  const CHAR_VERTICAL_LINE = 124;
  const CHAR_RIGHT_CURLY_BRACKET = 125;
  const ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = '\\"';
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    if (map2 === null) return {};
    const result = {};
    const keys = Object.keys(map2);
    for (let index = 0, length = keys.length; index < length; index += 1) {
      let tag = keys[index];
      let style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      const type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    let handle6;
    let length;
    const string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle6 = "x";
      length = 2;
    } else if (character <= 65535) {
      handle6 = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle6 = "U";
      length = 8;
    } else {
      throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle6 + common2.repeat("0", length - string.length) + string;
  }
  const QUOTING_TYPE_SINGLE = 1;
  const QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    const ind = common2.repeat(" ", spaces);
    let position = 0;
    let result = "";
    const length = string.length;
    while (position < length) {
      let line;
      const next = string.indexOf("\n", position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== "\n") result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return "\n" + common2.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) {
      const type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && // - b-char
    c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (
      // ns-plain-safe
      (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && // - c-flow-indicator
      c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && // ns-plain-char
      c !== CHAR_SHARP && // false on '#'
      !(prev === CHAR_COLON && !cIsNsChar) || // false on ': '
      isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || // change to true on '[^ ]#'
      prev === CHAR_COLON && cIsNsChar
    );
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && // | “%” | “@” | “`”)
    c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    const first = string.charCodeAt(pos);
    let second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  const STYLE_PLAIN = 1;
  const STYLE_SINGLE = 2;
  const STYLE_LITERAL = 3;
  const STYLE_FOLDED = 4;
  const STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    let i;
    let char = 0;
    let prevChar = null;
    let hasLineBreak = false;
    let hasFoldableLine = false;
    const shouldTrackWidth = lineWidth !== -1;
    let previousLineBreak = -1;
    let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
            i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = (function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      const indent = state.indent * Math.max(1, level);
      const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      const singleLineOnly = iskey || // No block styles in flow mode.
      state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(
        string,
        singleLineOnly,
        state.indent,
        lineWidth,
        testAmbiguity,
        state.quotingType,
        state.forceQuotes && !iskey,
        inblock
      )) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new YAMLException2("impossible error: invalid scalar style");
      }
    })();
  }
  function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === "\n";
    const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    const chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + "\n";
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = (function() {
      let nextLF = string.indexOf("\n");
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    })();
    let prevMoreIndented = string[0] === "\n" || string[0] === " ";
    let moreIndented;
    let match;
    while (match = lineRe.exec(string)) {
      const prefix = match[1];
      const line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ") return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0;
    let end;
    let curr = 0;
    let next = 0;
    let result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += "\n" + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    let result = "";
    let char = 0;
    for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      const escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536) result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (_result !== "") pairBuffer += ", ";
      if (state.condenseFlow) pairBuffer += '"';
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024) pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException2("sortKeys must be a boolean or a function");
    }
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (let index = 0, length = typeList.length; index < length; index += 1) {
      const type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          const style = state.styleMap[type2.tag] || type2.defaultStyle;
          let _result;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new YAMLException2("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    const type2 = _toString.call(state.dump);
    const inblock = block;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
    let duplicateIndex;
    let duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid) return false;
        throw new YAMLException2("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        let tagStr = encodeURI(
          state.tag[0] === "!" ? state.tag.slice(1) : state.tag
        ).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    const objects = [];
    const duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for (let index = 0; index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
      const index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (let i = 0, length = object.length; i < length; i += 1) {
            inspectNode(object[i], objects, duplicatesIndexes);
          }
        } else {
          const objectKeyList = Object.keys(object);
          for (let i = 0, length = objectKeyList.length; i < length; i += 1) {
            inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump2(input, options) {
    options = options || {};
    const state = new State(options);
    if (!state.noRefs) getDuplicateReferences(input, state);
    let value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
    return "";
  }
  dumper.dump = dump2;
  return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
  if (hasRequiredJsYaml) return jsYaml;
  hasRequiredJsYaml = 1;
  const loader2 = requireLoader();
  const dumper2 = requireDumper();
  function renamed(from2, to) {
    return function() {
      throw new Error("Function yaml." + from2 + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  jsYaml.Type = requireType();
  jsYaml.Schema = requireSchema();
  jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
  jsYaml.JSON_SCHEMA = requireJson();
  jsYaml.CORE_SCHEMA = requireCore();
  jsYaml.DEFAULT_SCHEMA = require_default();
  jsYaml.load = loader2.load;
  jsYaml.loadAll = loader2.loadAll;
  jsYaml.dump = dumper2.dump;
  jsYaml.YAMLException = requireException();
  jsYaml.types = {
    binary: requireBinary(),
    float: requireFloat(),
    map: requireMap(),
    null: require_null2(),
    pairs: requirePairs(),
    set: requireSet(),
    timestamp: requireTimestamp(),
    bool: requireBool(),
    int: requireInt(),
    merge: requireMerge(),
    omap: requireOmap(),
    seq: requireSeq(),
    str: requireStr()
  };
  jsYaml.safeLoad = renamed("safeLoad", "load");
  jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
  jsYaml.safeDump = renamed("safeDump", "dump");
  return jsYaml;
}
var jsYamlExports = requireJsYaml();
var yaml = /* @__PURE__ */ getDefaultExportFromCjs(jsYamlExports);
var {
  Type,
  Schema: Schema2,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
} = yaml;

// src/mcp-paste.ts
var ROUTE_PREFIX3 = "/api/triad/mcp-preview";
var MAX_BODY_BYTES2 = 256 * 1024;
var MCP_CLIENT_NAME = "@deepseek-ai/dsh-mcp-client";
var SERVER_NAME_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
var ENV_REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
function isPlainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isJsExpr(value) {
  return isPlainObject2(value) && typeof value.__js === "string";
}
function toScalar(value, warnings, label) {
  if (typeof value === "string") return value;
  if (isJsExpr(value)) return value;
  if (typeof value === "number" || typeof value === "boolean") {
    warnings.push(`${label}: ${typeof value} \u503C\u5DF2\u8F6C\u4E3A\u5B57\u7B26\u4E32 "${String(value)}"`);
    return String(value);
  }
  return void 0;
}
function toScalarArray(value, warnings, label) {
  if (!Array.isArray(value)) return void 0;
  const out = [];
  for (const item of value) {
    const scalar = toScalar(item, warnings, label);
    if (scalar === void 0) {
      warnings.push(`${label}: \u5FFD\u7565\u975E\u6807\u91CF\u9879\uFF08${Array.isArray(item) ? "array" : typeof item}\uFF09`);
      continue;
    }
    out.push(scalar);
  }
  return out;
}
function toScalarDict(value, warnings, label) {
  if (!isPlainObject2(value)) return void 0;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    const scalar = toScalar(item, warnings, label);
    if (scalar === void 0) {
      warnings.push(`${label}.${key}: \u5FFD\u7565\u975E\u6807\u91CF\u503C\uFF08${Array.isArray(item) ? "array" : typeof item}\uFF09`);
      continue;
    }
    out[key] = scalar;
  }
  return out;
}
function parseServer(name2, value, warnings) {
  if (!SERVER_NAME_PATTERN.test(name2)) {
    return { error: `server "${name2}": serverName \u9700\u5339\u914D [A-Za-z0-9_-]{1,32}` };
  }
  if (!isPlainObject2(value)) return { error: `server "${name2}": \u914D\u7F6E\u9700\u4E3A\u5BF9\u8C61` };
  const cfg = value;
  const explicit = String(cfg.type ?? cfg.transport ?? "").toLowerCase();
  const command = toScalar(cfg.command, warnings, `server "${name2}".command`);
  const url = toScalar(cfg.url, warnings, `server "${name2}".url`);
  let transport;
  if (explicit === "stdio" || explicit === "command") transport = "stdio";
  else if (explicit === "streamable-http" || explicit === "streamable-http-sse" || explicit === "http" || explicit === "sse") transport = "streamable-http";
  else if (command !== void 0) transport = "stdio";
  else if (url !== void 0) transport = "streamable-http";
  if (transport === void 0) {
    return { error: `server "${name2}": \u65E0\u6CD5\u63A8\u65AD\u4F20\u8F93\u65B9\u5F0F\uFF08stdio \u9700\u8981 command\uFF0Chttp \u9700\u8981 url\uFF1B\u53EF\u7528 transport \u663E\u5F0F\u58F0\u660E\uFF09` };
  }
  const toolCallTimeoutMs = typeof cfg.toolCallTimeoutMs === "number" && Number.isFinite(cfg.toolCallTimeoutMs) ? cfg.toolCallTimeoutMs : void 0;
  if (transport === "stdio") {
    if (command === void 0) return { error: `server "${name2}": stdio \u9700\u8981 command` };
    const label = `server "${name2}"`;
    return {
      serverName: name2,
      transport,
      command,
      args: toScalarArray(cfg.args, warnings, `${label}.args`) ?? [],
      env: toScalarDict(cfg.env, warnings, `${label}.env`) ?? {},
      cwd: toScalar(cfg.cwd, warnings, `${label}.cwd`),
      toolCallTimeoutMs
    };
  }
  if (url === void 0) return { error: `server "${name2}": http \u9700\u8981 url` };
  return {
    serverName: name2,
    transport,
    url,
    headers: toScalarDict(cfg.headers, warnings, `server "${name2}".headers`) ?? {},
    toolCallTimeoutMs
  };
}
function serversToRows(servers) {
  const rows = [];
  for (const server of Object.values(servers)) {
    const config = { serverName: server.serverName, transport: server.transport };
    if (server.transport === "stdio") {
      config.command = server.command;
      if (server.args !== void 0 && server.args.length > 0) config.args = server.args;
      if (server.env !== void 0 && Object.keys(server.env).length > 0) config.env = server.env;
      if (server.cwd !== void 0) config.cwd = server.cwd;
    } else {
      config.url = server.url;
      if (server.headers !== void 0 && Object.keys(server.headers).length > 0) config.headers = server.headers;
    }
    if (server.toolCallTimeoutMs !== void 0) config.toolCallTimeoutMs = server.toolCallTimeoutMs;
    rows.push({ id: `mcp-${server.serverName}`, name: MCP_CLIENT_NAME, config });
  }
  return rows;
}
function parseRow(raw, warnings, errors) {
  if (!isPlainObject2(raw)) {
    errors.push("\u884C\u7247\u6BB5\uFF1A\u6BCF\u4E00\u9879\u9700\u4E3A\u5BF9\u8C61\uFF08- id: ... / name: ... / config: ...\uFF09");
    return void 0;
  }
  const name2 = typeof raw.name === "string" ? raw.name : "";
  if (name2 !== MCP_CLIENT_NAME) {
    errors.push(`\u884C\u7247\u6BB5\uFF1A\u53EA\u63A5\u53D7 name: '${MCP_CLIENT_NAME}' \u7684\u884C\uFF08\u6536\u5230 ${name2 === "" ? "(\u7F3A name)" : `"${name2}"`}\uFF09`);
    return void 0;
  }
  if (!isPlainObject2(raw.config)) {
    errors.push("\u884C\u7247\u6BB5\uFF1A\u7F3A\u5C11 config \u5BF9\u8C61");
    return void 0;
  }
  const shape = parseServer(
    typeof raw.config.serverName === "string" ? raw.config.serverName : "",
    raw.config,
    warnings
  );
  if ("error" in shape) {
    errors.push(shape.error);
    return void 0;
  }
  const config = { ...raw.config };
  config.serverName = shape.serverName;
  config.transport = shape.transport;
  const id = typeof raw.id === "string" && /^[A-Za-z0-9_-]+$/.test(raw.id) ? raw.id : `mcp-${shape.serverName}`;
  return { id, name: MCP_CLIENT_NAME, config };
}
function rowsOf(raw, warnings, errors) {
  if (Array.isArray(raw)) {
    const rows = [];
    for (const entry of raw) {
      if (!isPlainObject2(entry)) {
        errors.push("\u9876\u5C42\u6570\u7EC4\uFF1A\u6BCF\u4E00\u9879\u9700\u4E3A mcp-client \u884C\u6216 `- insert:` \u7247\u6BB5");
        continue;
      }
      if (Array.isArray(entry.insert)) {
        for (const nested of entry.insert) {
          const row2 = parseRow(nested, warnings, errors);
          if (row2 !== void 0) rows.push(row2);
        }
        continue;
      }
      const row = parseRow(entry, warnings, errors);
      if (row !== void 0) rows.push(row);
    }
    return rows;
  }
  if (isPlainObject2(raw)) {
    const map2 = isPlainObject2(raw.mcpServers) ? raw.mcpServers : raw;
    const servers = {};
    for (const [name2, value] of Object.entries(map2)) {
      const parsed = parseServer(name2, value, warnings);
      if ("error" in parsed) {
        errors.push(parsed.error);
        continue;
      }
      servers[name2] = parsed;
    }
    return serversToRows(servers);
  }
  errors.push("\u671F\u671B JSON/YAML \u5BF9\u8C61\uFF08mcpServers \u6620\u5C04\uFF09\u6216 mcp-client \u884C\u6570\u7EC4");
  return [];
}
var JS_TAG = new Type("tag:yaml.org,2002:js", {
  kind: "scalar",
  construct: (data) => ({ __js: String(data) })
});
var MCP_SCHEMA = DEFAULT_SCHEMA.extend([JS_TAG]);
function parseMcpPaste(format, text) {
  const warnings = [];
  const errors = [];
  let raw;
  if (format === "json") {
    try {
      raw = JSON.parse(text);
    } catch (error) {
      return { servers: [], rows: [], errors: [`JSON \u89E3\u6790\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`], warnings };
    }
  } else {
    try {
      raw = load(text, { schema: MCP_SCHEMA });
    } catch (error) {
      const mark = error?.mark;
      const at = typeof mark?.line === "number" ? `\uFF08\u7B2C ${mark.line + 1} \u884C\uFF09` : "";
      return {
        servers: [],
        rows: [],
        errors: [`YAML \u89E3\u6790\u5931\u8D25${at}: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`],
        warnings
      };
    }
  }
  const rows = rowsOf(raw, warnings, errors);
  const servers = rows.map((row) => ({
    name: String(row.config.serverName ?? ""),
    transport: String(row.config.transport ?? ""),
    summary: rowSummary(row.config)
  }));
  return { servers, rows, errors, warnings };
}
function rowSummary(config) {
  const transport = String(config.transport ?? "");
  if (transport === "stdio") {
    const command = config.command;
    const args = Array.isArray(config.args) ? config.args.map((item) => describeScalar(item)).join(" ") : "";
    return args === "" ? describeScalar(command) : `${describeScalar(command)} ${args}`;
  }
  return describeScalar(config.url);
}
function describeScalar(value) {
  if (typeof value === "string") return value;
  if (isJsExpr(value)) return "!!js";
  return "";
}
function toJsTemplate(value) {
  const escaped = value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/'/g, "\\'");
  const withEnv = escaped.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, "${process.env.$1}");
  return `\`${withEnv}\``;
}
var PLAIN_SCALAR = /^[A-Za-z0-9_][A-Za-z0-9_.@:/+~-]*$/;
var YAML_AMBIGUOUS = /^(?:true|false|null|yes|no|on|off|~)$/i;
var NUMERIC_LIKE = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
function yamlScalarOf(value) {
  if (isJsExpr(value)) return `!!js ${value.__js}`;
  if (typeof value === "string") {
    ENV_REF.lastIndex = 0;
    if (ENV_REF.test(value)) return `!!js '${toJsTemplate(value).replace(/'/g, "''")}'`;
    if (PLAIN_SCALAR.test(value) && !YAML_AMBIGUOUS.test(value) && !NUMERIC_LIKE.test(value)) return value;
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  return JSON.stringify(value) ?? "null";
}
function emitYaml(value, indent) {
  const out = [];
  for (const [key, item] of Object.entries(value)) {
    if (item === void 0) continue;
    if (isPlainObject2(item)) {
      out.push(`${indent}${key}:`);
      out.push(...emitYaml(item, `${indent}  `));
    } else if (Array.isArray(item)) {
      out.push(`${indent}${key}:`);
      for (const entry of item) out.push(`${indent}  - ${yamlScalarOf(entry)}`);
    } else {
      out.push(`${indent}${key}: ${yamlScalarOf(item)}`);
    }
  }
  return out;
}
function rowsToPresetYaml(rows) {
  const lines = [];
  for (const row of rows) {
    lines.push(`- id: ${row.id}`);
    lines.push(`  name: '${row.name}'`);
    lines.push("  config:");
    lines.push(...emitYaml(row.config, "    "));
  }
  return `${lines.join("\n")}
`;
}
function rowsToPatchYaml(rows) {
  const lines = [];
  for (const row of rows) {
    lines.push("- insert:");
    lines.push(`    - id: ${row.id}`);
    lines.push(`      name: '${row.name}'`);
    lines.push("      config:");
    lines.push(...emitYaml(row.config, "        "));
  }
  return `${lines.join("\n")}
`;
}
function appendRowsToText(content, block) {
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const trimmed = content.replace(/[\r\n\s]+$/, "");
  const blockText = block.replace(/\n+$/, "").split("\n").join(eol);
  if (trimmed === "") return `${blockText}${eol}`;
  return `${trimmed}${eol}${eol}${blockText}${eol}`;
}
function readJsonBody2(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES2) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
function pasteFieldsOf(body) {
  const format = body.format === "yaml" ? "yaml" : body.format === "json" ? "json" : void 0;
  if (format === void 0) throw new Error('format must be "json" or "yaml"');
  if (typeof body.text !== "string" || body.text.trim() === "") throw new Error("text must be a non-empty string");
  return { format, text: body.text };
}
function applyMcpPreviewRoute(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX3,
    handler: (req, res) => {
      void (async () => {
        if (!loopbackAllowed4(req)) {
          writeJsonResponse(res, 403, { error: "loopback-only" });
          return;
        }
        try {
          const body = await readJsonBody2(req);
          const target = body.target === "global" ? "global" : "preset";
          const { format, text } = pasteFieldsOf(body);
          const outcome = parseMcpPaste(format, text);
          writeJsonResponse(res, 200, {
            ok: outcome.errors.length === 0,
            servers: outcome.servers,
            yaml: target === "global" ? rowsToPatchYaml(outcome.rows) : rowsToPresetYaml(outcome.rows),
            errors: outcome.errors,
            warnings: outcome.warnings
          });
        } catch (error) {
          writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
      })();
    }
  }), "triad: mcp-preview route");
}

// src/mcp-presets.ts
var ROUTE_PREFIX4 = "/api/triad/mcp-presets";
var COMPOSITION_FILE = "agent.cordis.yml";
var USER_PRESET_DIR = ".agent-presets";
var MCP_CLIENT_NAME2 = `'@deepseek-ai/dsh-mcp-client'`;
var BACKUP_SUFFIX = ".bak-last-mcp";
var MAX_BODY_BYTES3 = 256 * 1024;
function dshHome3() {
  const fromEnv = process.env["DSH_HOME"];
  return fromEnv !== void 0 && fromEnv.trim() !== "" ? fromEnv.trim() : join5(homedir5(), ".dsh");
}
function userPresetRoot() {
  return join5(dshHome3(), USER_PRESET_DIR);
}
function userCompositionPath(presetId) {
  return join5(userPresetRoot(), presetId, COMPOSITION_FILE);
}
async function presetEntryOf(ctx, presetId) {
  const presets = ctx.get?.("agentPresets");
  if (presets?.list !== void 0) {
    try {
      const roster = await presets.list();
      for (const row of Array.isArray(roster) ? roster : []) {
        if (String(row?.id ?? "") !== presetId) continue;
        const path4 = row.path;
        if (typeof path4 === "string" && path4 !== "") {
          return { id: presetId, trust: String(row.trust ?? "user"), path: path4 };
        }
      }
    } catch {
    }
  }
  const fallback = userCompositionPath(presetId);
  if (existsSync(fallback)) return { id: presetId, trust: "user", path: fallback };
  return void 0;
}
function isPresetId3(value) {
  return /^[a-z0-9][a-z0-9-]*$/.test(value);
}
function isServerName2(value) {
  return /^[A-Za-z0-9_-]{1,32}$/.test(value);
}
function parseMcpRows(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trimStart();
    if (!trimmed.startsWith("- id:")) continue;
    const idMatch = /^- id:\s*([A-Za-z0-9_-]+)/.exec(trimmed);
    if (idMatch === null) continue;
    let nameLine = -1;
    let serverName = "";
    let transport = "";
    let summary = "";
    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j];
      if (line.length === 0) continue;
      if (!/^[ \t]/.test(line)) break;
      const t = line.trimStart();
      if (nameLine === -1 && t.startsWith("name:") && line.includes(MCP_CLIENT_NAME2)) nameLine = j;
      if (nameLine === -1) continue;
      if (serverName === "" && t.startsWith("serverName:")) {
        const m = /^serverName:\s*["']?([A-Za-z0-9_-]{1,32})["']?\s*$/.exec(t);
        if (m !== null) serverName = m[1];
      }
      if (transport === "" && t.startsWith("transport:")) {
        const m = /^transport:\s*["']?([a-z-]+)["']?\s*$/.exec(t);
        if (m !== null) transport = m[1];
      }
      if (summary === "" && (t.startsWith("command:") || t.startsWith("url:"))) {
        summary = t.replace(/^(command|url):\s*/, "").replace(/^["']|["']$/g, "");
      }
    }
    if (nameLine === -1 || serverName === "") continue;
    rows.push({ entryId: idMatch[1], serverName, transport: transport === "" ? "stdio" : transport, summary });
  }
  return rows;
}
async function compositionTextOf(ctx, presetId) {
  const entry = await presetEntryOf(ctx, presetId);
  if (entry !== void 0) {
    try {
      return { content: readFileSync2(entry.path, "utf8"), trust: entry.trust };
    } catch {
    }
  }
  const presets = ctx.get?.("agentPresets");
  if (presets?.readDocument !== void 0) {
    try {
      const doc = await presets.readDocument(presetId);
      if (doc !== null && typeof doc === "object" && typeof doc.content === "string") {
        return { content: doc.content, trust: typeof doc.trust === "string" ? doc.trust : "user" };
      }
    } catch {
    }
  }
  return void 0;
}
async function listPresetServers(ctx, presetId) {
  const found = await compositionTextOf(ctx, presetId);
  if (found === void 0) return void 0;
  return { trust: found.trust, rows: parseMcpRows(found.content) };
}
async function collectPresetServers(ctx) {
  const presets = ctx.get?.("agentPresets");
  const out = {};
  if (presets?.list === void 0) return out;
  let roster;
  try {
    roster = await presets.list();
  } catch {
    return out;
  }
  for (const row of Array.isArray(roster) ? roster : []) {
    const id = String(row?.id ?? "");
    if (id === "") continue;
    const found = await listPresetServers(ctx, id);
    if (found !== void 0) out[id] = found.rows;
  }
  return out;
}
function rowBlock(lines, idLine) {
  let to = lines.length;
  for (let j = idLine + 1; j < lines.length; j += 1) {
    if (lines[j].length === 0) continue;
    if (!/^[ \t]/.test(lines[j])) {
      to = j;
      break;
    }
  }
  return { from: idLine, to };
}
function lineEndingOf(content) {
  return content.includes("\r\n") ? "\r\n" : "\n";
}
function removeMcpRow(content, serverName) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trimStart();
    if (!trimmed.startsWith("- id:")) continue;
    const block = rowBlock(lines, i);
    const text = lines.slice(block.from, block.to).join("\n");
    if (!text.includes(MCP_CLIENT_NAME2)) continue;
    const match = /^\s*serverName:\s*["']?([A-Za-z0-9_-]{1,32})["']?\s*$/m.exec(text);
    if (match === null || match[1] !== serverName) continue;
    let to = block.to;
    if (to < lines.length && lines[to].trim() === "") to += 1;
    const next = lines.slice(0, block.from).concat(lines.slice(to)).join(lineEndingOf(content));
    return { content: next, removed: true };
  }
  return { content, removed: false };
}
function writeComposition(path4, content) {
  mkdirSync2(dirname2(path4), { recursive: true });
  copyFileSync(path4, `${path4}${BACKUP_SUFFIX}`);
  const temp = `${path4}.tmp`;
  writeFileSync2(temp, content, "utf8");
  renameSync2(temp, path4);
}
function readJsonBody3(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES3) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
function configFromBody(body) {
  const serverName = typeof body.serverName === "string" ? body.serverName.trim() : "";
  if (!isServerName2(serverName)) return { ok: false, error: "serverName must match [A-Za-z0-9_-]{1,32}" };
  const transport = body.transport === "streamable-http" ? "streamable-http" : body.transport === "stdio" ? "stdio" : "";
  if (transport === "") return { ok: false, error: 'transport must be "stdio" or "streamable-http"' };
  if (transport === "stdio") {
    const command = typeof body.command === "string" ? body.command.trim() : "";
    if (command === "") return { ok: false, error: "stdio requires a non-empty command" };
    const args = Array.isArray(body.args) ? body.args.filter((item) => typeof item === "string") : void 0;
    const env = body.env !== null && typeof body.env === "object" && !Array.isArray(body.env) ? Object.fromEntries(Object.entries(body.env).filter(([, v]) => typeof v === "string")) : void 0;
    const cwd = typeof body.cwd === "string" ? body.cwd : void 0;
    return { ok: true, value: { serverName, transport, command, args, env, cwd } };
  }
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (url === "") return { ok: false, error: "streamable-http requires a non-empty url" };
  const headers = body.headers !== null && typeof body.headers === "object" && !Array.isArray(body.headers) ? Object.fromEntries(Object.entries(body.headers).filter(([, v]) => typeof v === "string")) : void 0;
  return { ok: true, value: { serverName, transport, url, headers } };
}
async function handle3(ctx, req, res) {
  if (!loopbackAllowed4(req)) {
    writeJsonResponse(res, 403, { error: "loopback-only" });
    return;
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  const rest = url.pathname.slice(ROUTE_PREFIX4.length);
  const method = req.method ?? "GET";
  try {
    const matchPost = /^\/([^/]+)\/servers$/.exec(rest);
    if (method === "POST" && matchPost !== null) {
      const presetId = decodeURIComponent(matchPost[1]);
      if (!isPresetId3(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`);
      const body = await readJsonBody3(req);
      const entry = await presetEntryOf(ctx, presetId);
      if (entry === void 0) {
        writeJsonResponse(res, 404, { ok: false, error: "preset-not-found", hint: `preset "${presetId}" \u4E0D\u5728 agentPresets \u540D\u5355\u91CC` });
        return;
      }
      const bulk = typeof body.text === "string";
      let outcome;
      if (bulk) {
        const { format, text } = pasteFieldsOf(body);
        outcome = parseMcpPaste(format, text);
      } else {
        const legacy = configFromBody(body);
        if (!legacy.ok) throw new Error(legacy.error);
        outcome = { rows: serversToRows({ [legacy.value.serverName]: legacy.value }), errors: [], warnings: [] };
      }
      if (outcome.errors.length > 0) {
        writeJsonResponse(res, 400, { ok: false, errors: outcome.errors, warnings: outcome.warnings });
        return;
      }
      if (outcome.rows.length === 0) {
        writeJsonResponse(res, 400, { ok: false, error: "\u672A\u89E3\u6790\u51FA\u4EFB\u4F55 MCP server" });
        return;
      }
      const content = readFileSync2(entry.path, "utf8");
      const existing = parseMcpRows(content);
      const takenServers = new Set(existing.map((row) => row.serverName));
      const takenIds = new Set(existing.map((row) => row.entryId));
      const added = [];
      const skipped = [];
      const fresh = [];
      for (const row of outcome.rows) {
        const serverName = String(row.config.serverName ?? "");
        if (takenServers.has(serverName)) {
          if (!bulk) throw new Error(`serverName ${JSON.stringify(serverName)} already exists in preset "${presetId}"`);
          skipped.push(serverName);
          continue;
        }
        let id = row.id;
        let suffix = 2;
        while (takenIds.has(id)) {
          id = `${row.id}-${suffix}`;
          suffix += 1;
        }
        takenIds.add(id);
        takenServers.add(serverName);
        added.push(serverName);
        fresh.push({ ...row, id });
      }
      if (fresh.length > 0) writeComposition(entry.path, appendRowsToText(content, rowsToPresetYaml(fresh)));
      writeJsonResponse(res, 200, { ok: true, preset: presetId, added, skipped, warnings: outcome.warnings });
      return;
    }
    const matchDelete = /^\/([^/]+)\/servers\/([^/]+)$/.exec(rest);
    if (method === "DELETE" && matchDelete !== null) {
      const presetId = decodeURIComponent(matchDelete[1]);
      const serverName = decodeURIComponent(matchDelete[2]);
      if (!isPresetId3(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`);
      if (!isServerName2(serverName)) throw new Error(`invalid serverName ${JSON.stringify(serverName)}`);
      const entry = await presetEntryOf(ctx, presetId);
      if (entry === void 0) {
        writeJsonResponse(res, 404, { ok: false, error: "preset-not-found" });
        return;
      }
      const content = readFileSync2(entry.path, "utf8");
      const result = removeMcpRow(content, serverName);
      if (!result.removed) throw new Error(`no mcp-client row for serverName ${JSON.stringify(serverName)} in preset "${presetId}"`);
      writeComposition(entry.path, result.content);
      writeJsonResponse(res, 200, { ok: true, preset: presetId, serverName });
      return;
    }
    writeJsonResponse(res, 404, { error: `no route for ${method} ${rest}` });
  } catch (error) {
    writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
function applyPresetServers(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX4,
    handler: (req, res) => {
      void handle3(ctx, req, res);
    }
  }), "triad: mcp-presets routes");
}

// src/mcp-tool-disable.ts
import { mkdirSync as mkdirSync3, readFileSync as readFileSync3, renameSync as renameSync3, writeFileSync as writeFileSync3 } from "node:fs";
import { homedir as homedir6 } from "node:os";
import { dirname as dirname3, join as join6 } from "node:path";
var ROUTE_PREFIX5 = "/api/triad/mcp-tools";
var LEDGER_FILE = "tool-disable.json";
var MCP_PREFIX = "mcp__";
var MAX_SERVER_ENTRIES = 200;
var MAX_TOOLS_PER_SERVER = 500;
var MAX_PRESET_ENTRIES3 = 50;
var MAX_TOOL_NAME = 128;
var MAX_BODY_BYTES4 = 64 * 1024;
var TOOL_DISABLE_CHANGE_EVENT = "triad/mcp-tool-disable-change";
function dshHome4() {
  const fromEnv = process.env["DSH_HOME"];
  return fromEnv !== void 0 && fromEnv.trim() !== "" ? fromEnv.trim() : join6(homedir6(), ".dsh");
}
function toolDisableLedgerPath() {
  return join6(dshHome4(), "mcp", "dsh-prompt-customizer", LEDGER_FILE);
}
function isServerName3(value) {
  return /^[A-Za-z0-9_-]{1,32}$/.test(value);
}
function isPresetId4(value) {
  return /^[a-z0-9][a-z0-9-]*$/.test(value);
}
function serverPrefix(serverName) {
  return `${MCP_PREFIX}${serverName}__`;
}
function toolBelongsToServer2(fullName, serverName) {
  const prefix = serverPrefix(serverName);
  return fullName.startsWith(prefix) && fullName.length > prefix.length;
}
function ledgerServerNames(ledger) {
  const names = new Set(Object.keys(ledger.disabled));
  for (const table of Object.values(ledger.presets)) for (const serverName of Object.keys(table)) names.add(serverName);
  for (const serverName of Object.keys(ledger.known)) names.add(serverName);
  return names;
}
var extraServerNames = /* @__PURE__ */ new Set();
var extraCandidates = [];
function rememberServerNames(names) {
  let grown = false;
  for (const name2 of names) {
    if (!isServerName3(name2) || extraServerNames.has(name2)) continue;
    extraServerNames.add(name2);
    grown = true;
  }
  if (grown) extraCandidates = [...extraServerNames].sort((a, b) => b.length - a.length);
}
function serverOfToolName(fullName, candidates) {
  if (!fullName.startsWith(MCP_PREFIX)) return void 0;
  const pool = candidates === void 0 ? [...extraCandidates, ...[...ledgerServerNames(readToolLedger())].sort((a, b) => b.length - a.length)] : [...candidates].sort((a, b) => b.length - a.length);
  for (const serverName2 of pool) {
    if (toolBelongsToServer2(fullName, serverName2)) return serverName2;
  }
  const rest = fullName.slice(MCP_PREFIX.length);
  const sep2 = rest.indexOf("__");
  if (sep2 <= 0) return void 0;
  const serverName = rest.slice(0, sep2);
  return isServerName3(serverName) ? serverName : void 0;
}
function normalizeList(serverName, names) {
  if (!Array.isArray(names)) return [];
  const list = [];
  for (const name2 of names) {
    if (typeof name2 !== "string" || name2.length > MAX_TOOL_NAME) continue;
    if (!toolBelongsToServer2(name2, serverName)) continue;
    if (list.length >= MAX_TOOLS_PER_SERVER) break;
    if (!list.includes(name2)) list.push(name2);
  }
  return list;
}
function normalizeTable(input) {
  const table = {};
  if (input === null || typeof input !== "object") return table;
  for (const [serverName, names] of Object.entries(input)) {
    if (!isServerName3(serverName)) continue;
    if (Object.keys(table).length >= MAX_SERVER_ENTRIES) break;
    const list = normalizeList(serverName, names);
    if (list.length > 0) table[serverName] = list;
  }
  return table;
}
function normalizeToolLedger(input) {
  const source = input !== null && typeof input === "object" ? input : {};
  const presets = {};
  const rawPresets = source.presets;
  if (rawPresets !== null && typeof rawPresets === "object") {
    for (const [presetId, table] of Object.entries(rawPresets)) {
      if (!isPresetId4(presetId)) continue;
      if (Object.keys(presets).length >= MAX_PRESET_ENTRIES3) break;
      if (table === null || typeof table !== "object") continue;
      const entries = {};
      for (const [serverName, value] of Object.entries(table)) {
        if (!isServerName3(serverName)) continue;
        if (Array.isArray(value)) {
          const legacy = normalizeList(serverName, value);
          if (legacy.length > 0) entries[serverName] = { own: [...legacy], inherit: [...legacy] };
          continue;
        }
        if (value === null || typeof value !== "object") continue;
        const own = normalizeList(serverName, value.own);
        const inherit = normalizeList(serverName, value.inherit);
        if (own.length > 0 || inherit.length > 0) entries[serverName] = { own, inherit };
      }
      if (Object.keys(entries).length > 0) presets[presetId] = entries;
    }
  }
  return {
    version: 3,
    disabled: normalizeTable(source.disabled),
    presets,
    known: normalizeTable(source.known)
  };
}
var globalIndex = /* @__PURE__ */ new Map();
var presetIndex = /* @__PURE__ */ new Map();
var knownIndex = /* @__PURE__ */ new Map();
var ownerCache = /* @__PURE__ */ new Map();
function reindex(ledger) {
  globalIndex = new Map(Object.entries(ledger.disabled).map(([serverName, names]) => [serverName, new Set(names)]));
  presetIndex = new Map(Object.entries(ledger.presets).map(([presetId, table]) => [
    presetId,
    new Map(Object.entries(table).map(([serverName, entries]) => [
      serverName,
      { own: new Set(entries.own), inherit: new Set(entries.inherit) }
    ]))
  ]));
  knownIndex = new Map(Object.entries(ledger.known).map(([serverName, names]) => [serverName, [...names]]));
  rememberServerNames(Object.keys(ledger.known));
  rememberServerNames(Object.keys(ledger.disabled));
}
var ledgerCache3;
function readToolLedger(reload = false) {
  if (ledgerCache3 !== void 0 && !reload) return ledgerCache3;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync3(toolDisableLedgerPath(), "utf8"));
  } catch {
    parsed = void 0;
  }
  ledgerCache3 = normalizeToolLedger(parsed);
  reindex(ledgerCache3);
  return ledgerCache3;
}
function writeToolLedger(next) {
  const target = toolDisableLedgerPath();
  mkdirSync3(dirname3(target), { recursive: true });
  const temp = `${target}.tmp`;
  writeFileSync3(temp, `${JSON.stringify(next, null, 2)}
`, "utf8");
  renameSync3(temp, target);
  ledgerCache3 = next;
  reindex(next);
}
function rememberPresetOwnServers(presetId, serverNames) {
  if (!isPresetId4(presetId)) return;
  const next = /* @__PURE__ */ new Set();
  for (const name2 of serverNames) if (isServerName3(name2)) next.add(name2);
  const current = ownerCache.get(presetId);
  if (current !== void 0 && current.size === next.size && [...next].every((name2) => current.has(name2))) return;
  if (next.size === 0) ownerCache.delete(presetId);
  else ownerCache.set(presetId, next);
}
async function refreshPresetOwnServers(ctx) {
  const presets = ctx.get?.("agentPresets");
  if (typeof presets?.list !== "function") return;
  let roster;
  try {
    roster = await presets.list();
  } catch {
    return;
  }
  for (const row of Array.isArray(roster) ? roster : []) {
    const presetId = String(row?.id ?? "");
    if (presetId === "") continue;
    const found = await listPresetServers(ctx, presetId).catch(() => void 0);
    rememberPresetOwnServers(presetId, (found?.rows ?? []).map((item) => item.serverName));
  }
}
function presetOwnsServer(presetId, serverName) {
  return ownerCache.get(presetId)?.has(serverName) === true;
}
function ownerOfServer(presetId, serverName) {
  return presetId !== void 0 && presetOwnsServer(presetId, serverName) ? "own" : "inherit";
}
function globalDisabledTools(serverName) {
  return [...globalIndex.get(serverName) ?? []];
}
function ownerDisabledTools(presetId, serverName, owner) {
  return [...presetIndex.get(presetId)?.get(serverName)?.[owner] ?? []];
}
function toolDisableTables() {
  const ledger = readToolLedger();
  return { disabled: ledger.disabled, presets: ledger.presets };
}
function ledgerServerNamesOf() {
  return [.../* @__PURE__ */ new Set([...ledgerServerNames(readToolLedger()), ...extraServerNames])];
}
function knownToolsOf(serverName) {
  return [...knownIndex.get(serverName) ?? []];
}
function isToolDisabled(fullName, presetId) {
  if (globalIndex.size === 0 && presetIndex.size === 0) return false;
  const serverName = serverOfToolName(fullName);
  if (serverName === void 0) return false;
  if (presetId === void 0) return globalIndex.get(serverName)?.has(fullName) === true;
  const owner = ownerOfServer(presetId, serverName);
  if (owner === "inherit" && globalIndex.get(serverName)?.has(fullName) === true) return true;
  return presetIndex.get(presetId)?.get(serverName)?.[owner]?.has(fullName) === true;
}
function restrictableToolDeny(globalNames, ownServers, presetId) {
  if (globalIndex.size === 0 && (presetId === void 0 || presetIndex.size === 0)) return [];
  const deny = [];
  for (const name2 of globalNames) {
    const serverName = serverOfToolName(name2);
    if (serverName === void 0 || ownServers.has(serverName)) continue;
    if (presetId !== void 0 && ownerOfServer(presetId, serverName) === "own") continue;
    if (isToolDisabled(name2, presetId)) deny.push(name2);
  }
  return deny;
}
function setToolsDisabled(ledger, target, fullNames, enabled) {
  const { serverName } = target;
  if (!isServerName3(serverName)) return { ledger, changed: 0 };
  if (target.preset !== void 0 && !isPresetId4(target.preset)) return { ledger, changed: 0 };
  const owner = target.owner ?? "inherit";
  const current = new Set(
    target.preset === void 0 ? ledger.disabled[serverName] ?? [] : ledger.presets[target.preset]?.[serverName]?.[owner] ?? []
  );
  let changed = 0;
  for (const name2 of fullNames) {
    if (!toolBelongsToServer2(name2, serverName)) continue;
    if (enabled) {
      if (current.delete(name2)) changed += 1;
    } else if (!current.has(name2)) {
      current.add(name2);
      changed += 1;
    }
  }
  if (changed === 0) return { ledger, changed };
  const next = [...current];
  if (target.preset === void 0) {
    const disabled = { ...ledger.disabled };
    if (next.length === 0) delete disabled[serverName];
    else disabled[serverName] = next;
    return { ledger: { ...ledger, disabled }, changed };
  }
  const presetId = target.preset;
  const table = { ...ledger.presets[presetId] ?? {} };
  const entries = { own: [], inherit: [], ...table[serverName] ?? {} };
  entries[owner] = next;
  if (entries.own.length === 0 && entries.inherit.length === 0) delete table[serverName];
  else table[serverName] = entries;
  const presets = { ...ledger.presets };
  if (Object.keys(table).length === 0) delete presets[presetId];
  else presets[presetId] = table;
  return { ledger: { ...ledger, presets }, changed };
}
function rememberKnownTools(entries) {
  const ledger = readToolLedger();
  const known = { ...ledger.known };
  let changed = false;
  for (const [serverName, names] of Object.entries(entries)) {
    if (!isServerName3(serverName)) continue;
    const current = new Set(known[serverName] ?? []);
    const before = current.size;
    for (const name2 of names) {
      if (typeof name2 !== "string" || name2.length > MAX_TOOL_NAME) continue;
      if (toolBelongsToServer2(name2, serverName)) current.add(name2);
    }
    if (current.size !== before) {
      known[serverName] = [...current].slice(0, MAX_TOOLS_PER_SERVER);
      changed = true;
    }
  }
  if (changed) writeToolLedger({ ...ledger, known });
  return changed;
}
function presetOfAssembly(ctx, context) {
  const agent = context?.agent;
  if (agent === void 0 || agent === null) return void 0;
  const presets = ctx.get?.("agentPresets");
  if (typeof presets?.composedPreset !== "function") return void 0;
  try {
    const presetId = presets.composedPreset(agent.ctx);
    return typeof presetId === "string" && presetId !== "" ? presetId : void 0;
  } catch {
    return void 0;
  }
}
function installAssembleFilter(ctx) {
  ctx.effect(() => ctx.on(
    "system-prompt/assemble",
    (assembly, context, next) => {
      const maskLedger = readMaskLedger();
      const hasMasks = Object.keys(maskLedger.presets).length > 0;
      if ((globalIndex.size > 0 || presetIndex.size > 0 || hasMasks) && Array.isArray(assembly?.tools)) {
        const presetId = presetOfAssembly(ctx, context);
        const masked = presetId === void 0 ? void 0 : maskedServersOf(maskLedger, presetId);
        for (let index = assembly.tools.length - 1; index >= 0; index -= 1) {
          const name2 = assembly.tools[index]?.name;
          if (typeof name2 !== "string") continue;
          const serverName = serverOfToolName(name2);
          if (presetId !== void 0 && masked !== void 0 && masked.size > 0 && serverName !== void 0 && masked.has(serverName) && !presetOwnsServer(presetId, serverName)) {
            assembly.tools.splice(index, 1);
            continue;
          }
          if (isToolDisabled(name2, presetId)) assembly.tools.splice(index, 1);
        }
      }
      return next();
    },
    { global: true }
  ), "triad: mcp tool disable filter");
}
function registeredToolsOf(ctx, serverName) {
  const schemas = ctx.tools?.schemas?.() ?? [];
  if (!Array.isArray(schemas)) return [];
  return schemas.map((schema2) => typeof schema2?.name === "string" ? schema2.name : "").filter((name2) => name2 !== "" && toolBelongsToServer2(name2, serverName));
}
function scopedToolsOf(ctx, presetId, serverName) {
  const agents = ctx.get?.("agents");
  const list = typeof agents?.list === "function" ? agents.list() : [];
  const presets = ctx.get?.("agentPresets");
  const names = /* @__PURE__ */ new Set();
  for (const agent of Array.isArray(list) ? list : []) {
    if (agent === null || typeof agent !== "object") continue;
    let agentPreset;
    try {
      agentPreset = presets?.composedPreset?.(agent.ctx);
    } catch {
      agentPreset = void 0;
    }
    if (agentPreset !== presetId) continue;
    const schemas = agent.ctx?.get?.("tools")?.schemas?.() ?? [];
    for (const schema2 of Array.isArray(schemas) ? schemas : []) {
      const name2 = typeof schema2?.name === "string" ? schema2.name : "";
      if (name2 !== "" && toolBelongsToServer2(name2, serverName)) names.add(name2);
    }
  }
  return [...names];
}
async function handle4(ctx, req, res) {
  if (!loopbackAllowed4(req)) {
    writeJsonResponse(res, 403, { error: "loopback-only" });
    return;
  }
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://localhost");
  const rest = url.pathname.slice(ROUTE_PREFIX5.length);
  try {
    const match = /^\/([^/]+)$/.exec(rest);
    if (method !== "PUT" || match === null) {
      writeJsonResponse(res, 404, { error: `no route for ${method} ${rest}` });
      return;
    }
    const serverName = decodeURIComponent(match[1]);
    if (!isServerName3(serverName)) throw new Error(`invalid serverName ${JSON.stringify(serverName)}`);
    const body = await readJsonBody4(req);
    const enabled = body.enabled;
    if (typeof enabled !== "boolean") throw new Error("enabled must be a boolean");
    const rawPreset = body.preset;
    let presetId;
    if (rawPreset !== void 0 && rawPreset !== null && rawPreset !== "") {
      if (typeof rawPreset !== "string" || !isPresetId4(rawPreset)) {
        throw new Error(`invalid preset ${JSON.stringify(rawPreset)}`);
      }
      presetId = rawPreset;
    }
    const rawSource = body.source;
    let owner = "inherit";
    if (rawSource !== void 0 && rawSource !== null && rawSource !== "") {
      if (rawSource !== "own" && rawSource !== "inherit") {
        throw new Error(`invalid source ${JSON.stringify(rawSource)} (expected "own" or "inherit")`);
      }
      owner = rawSource;
    } else if (presetId !== void 0) {
      owner = ownerOfServer(presetId, serverName);
    }
    const explicit = body.tools;
    let targets;
    if (explicit !== void 0) {
      if (!Array.isArray(explicit)) throw new Error("tools must be an array of tool names");
      targets = explicit.filter((name2) => typeof name2 === "string" && toolBelongsToServer2(name2, serverName) && name2.length <= MAX_TOOL_NAME);
      if (targets.length === 0) throw new Error(`tools must name at least one "${serverPrefix(serverName)}*" tool`);
    } else {
      targets = registeredToolsOf(ctx, serverName);
      if (targets.length === 0 && presetId !== void 0) targets = scopedToolsOf(ctx, presetId, serverName);
      if (targets.length === 0) targets = knownToolsOf(serverName);
      if (targets.length === 0) {
        throw new Error(`no known tools for server "${serverName}"; pass tools explicitly to clear a stale ledger entry`);
      }
    }
    await refreshPresetOwnServers(ctx);
    if (presetId !== void 0 && enabled && owner === "inherit") {
      const vetoed = targets.filter((name2) => globalIndex.get(serverName)?.has(name2) === true);
      if (vetoed.length > 0) {
        writeJsonResponse(res, 409, {
          ok: false,
          error: `tool disabled in the "\u5168\u90E8 Agent" scope: ${vetoed.join(", ")} \u2014 enable it there first`,
          serverName,
          preset: presetId,
          source: owner,
          globalDisabled: globalDisabledTools(serverName)
        });
        return;
      }
    }
    const { ledger, changed } = setToolsDisabled(readToolLedger(), { serverName, preset: presetId, owner }, targets, enabled);
    if (changed > 0) writeToolLedger(ledger);
    rememberKnownTools({ [serverName]: targets });
    if (changed > 0) ctx.emit?.(TOOL_DISABLE_CHANGE_EVENT, presetId);
    writeJsonResponse(res, 200, {
      ok: true,
      serverName,
      preset: presetId ?? null,
      source: presetId === void 0 ? "global" : owner,
      enabled,
      changed,
      tools: targets,
      globalDisabled: globalDisabledTools(serverName),
      ownerDisabled: presetId === void 0 ? [] : ownerDisabledTools(presetId, serverName, owner)
    });
  } catch (error) {
    writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
function readJsonBody4(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES4) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
function applyMcpToolDisable(ctx) {
  readToolLedger(true);
  installAssembleFilter(ctx);
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX5,
    handler: (req, res) => {
      void handle4(ctx, req, res);
    }
  }), "triad: mcp-tools routes");
}

// src/mcp-preset-mask.ts
var ROUTE_PREFIX6 = "/api/triad/mcp-masks";
var MAX_BODY_BYTES5 = 64 * 1024;
var REINSTALL_DEBOUNCE_MS = 300;
var agentOutcome = /* @__PURE__ */ new Map();
function maskInstallReportOf(presetId) {
  const errors = /* @__PURE__ */ new Set();
  let agents = 0;
  let deniedAgents = 0;
  let denyTotal = 0;
  for (const outcome of agentOutcome.values()) {
    if (outcome.presetId !== presetId) continue;
    agents += 1;
    denyTotal += outcome.deny;
    if (outcome.deny > 0) deniedAgents += 1;
    if (outcome.error !== null) errors.add(outcome.error);
  }
  return { agents, deniedAgents, denyTotal, errors: [...errors] };
}
function maskInstallReport() {
  const presets = new Set([...agentOutcome.values()].map((outcome) => outcome.presetId));
  const out = {};
  for (const presetId of presets) out[presetId] = maskInstallReportOf(presetId);
  return out;
}
function presetOf(ctx, agent) {
  const presets = ctx.get?.("agentPresets");
  if (presets?.composedPreset === void 0) return void 0;
  try {
    const id = presets.composedPreset(agent.ctx);
    return typeof id === "string" && id !== "" ? id : void 0;
  } catch {
    return void 0;
  }
}
function releasePatches(state, agent) {
  const patches = state.patches.get(agent);
  if (patches === void 0) return;
  state.patches.delete(agent);
  for (const dispose of patches) {
    try {
      dispose();
    } catch {
    }
  }
}
async function ownServerNames(ctx, presetId) {
  const lib = await listPresetServers(ctx, presetId);
  return new Set((lib?.rows ?? []).map((row) => row.serverName));
}
async function installAgent(ctx, state, agent) {
  const version = (state.versions.get(agent) ?? 0) + 1;
  state.versions.set(agent, version);
  releasePatches(state, agent);
  if (state.stopped) return;
  const presetId = presetOf(ctx, agent);
  if (presetId === void 0) return;
  const masked = maskedServersOf(readMaskLedger(), presetId);
  const toolLedger = readToolLedger();
  const toolEntries = Object.keys(toolLedger.disabled).length + Object.keys(toolLedger.presets).length;
  if (masked.size === 0 && toolEntries === 0) return;
  const own = await ownServerNames(ctx, presetId);
  rememberPresetOwnServers(presetId, own);
  if (state.stopped || state.versions.get(agent) !== version) return;
  const tools = agent.ctx.get?.("tools");
  const schemas = tools?.schemas?.() ?? [];
  const globalNames = (Array.isArray(schemas) ? schemas : []).map((schema2) => typeof schema2?.name === "string" ? schema2.name : "").filter((name2) => name2 !== "");
  const deny = [.../* @__PURE__ */ new Set([
    ...computeDenyNames(globalNames, masked, own),
    // 有效禁用 = 全局层 ∪ 本预设层；预设自带（scope-local）的名字由
    // restrictableToolDeny 自行排除（restrict 会拒绝作用域内名字）。
    ...restrictableToolDeny(globalNames, own, presetId)
  ])];
  const patches = [];
  const hidden = [...masked].filter((serverName) => !own.has(serverName));
  let restrictError = null;
  if (deny.length > 0 && typeof tools?.restrict === "function") {
    try {
      patches.push(tools.restrict({ deny }));
    } catch (error) {
      restrictError = error instanceof Error ? error.message : String(error);
      ctx.logger?.warn?.(`[dsh-prompt-customizer] mcp mask restrict failed for "${agent.id}": ${restrictError}`);
    }
  } else if (deny.length > 0) {
    restrictError = "tools.restrict() unavailable on this agent scope";
    ctx.logger?.warn?.(`[dsh-prompt-customizer] mcp mask: ${restrictError} (agent "${agent.id}")`);
  }
  const prompt = agent.ctx.get?.("systemPrompt");
  if (typeof prompt?.section === "function" && typeof prompt?.getSectionOrder === "function") {
    for (const serverName of hidden) {
      try {
        const order = prompt.getSectionOrder("MCP_SERVERS");
        patches.push(prompt.section({ name: `mcp:${serverName}`, order, interpolate: false, text: "" }));
      } catch (error) {
        ctx.logger?.warn?.(`[dsh-prompt-customizer] mcp mask section failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  const resources = agent.ctx.get?.("mcpResources");
  if (typeof resources?.register === "function") {
    for (const serverName of hidden) {
      try {
        patches.push(resources.register(serverName, {
          request: async () => {
            throw new Error(`MCP resource server "${serverName}" is disabled for agent preset "${presetId}"`);
          }
        }));
      } catch (error) {
        ctx.logger?.warn?.(`[dsh-prompt-customizer] mcp mask resource stub failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  if (state.stopped || state.versions.get(agent) !== version) {
    for (const dispose of patches) {
      try {
        dispose();
      } catch {
      }
    }
    return;
  }
  if (patches.length > 0) state.patches.set(agent, patches);
  agentOutcome.set(agent.id, {
    presetId,
    deny: deny.length,
    sections: hidden.length,
    error: restrictError
  });
}
function reinstallAll(ctx, state, onlyPreset) {
  const agents = ctx.get?.("agents");
  const list = typeof agents?.list === "function" ? agents.list() : [];
  for (const agent of list) {
    if (agent === void 0 || agent === null) continue;
    if (onlyPreset !== void 0 && presetOf(ctx, agent) !== onlyPreset) continue;
    void installAgent(ctx, state, agent).catch(() => void 0);
  }
}
async function applyMcpPresetMask(ctx) {
  readMaskLedger(true);
  const state = { patches: /* @__PURE__ */ new Map(), versions: /* @__PURE__ */ new Map(), timer: void 0, stopped: false };
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX6,
    handler: (req, res) => {
      void handle5(ctx, state, req, res);
    }
  }), "triad: mcp-masks routes");
  ctx.effect(() => {
    const install = (agent) => {
      if (agent === void 0 || agent === null) return;
      void installAgent(ctx, state, agent).catch(() => void 0);
    };
    const remove = (agent) => {
      state.versions.delete(agent);
      releasePatches(state, agent);
      agentOutcome.delete(agent.id);
    };
    const agents = ctx.get?.("agents");
    if (typeof agents?.list === "function") for (const agent of agents.list()) install(agent);
    const offCreated = ctx.on("agent/created", ({ agent }) => {
      install(agent);
    });
    const offDisposed = ctx.on("agent/disposed", ({ agent }) => {
      remove(agent);
    });
    return () => {
      offCreated();
      offDisposed();
      for (const agent of [...state.patches.keys()]) releasePatches(state, agent);
      state.versions.clear();
    };
  }, "triad: mcp-masks agents");
  ctx.effect(() => ctx.on(TOOL_DISABLE_CHANGE_EVENT, (presetId) => {
    if (state.stopped) return;
    reinstallAll(ctx, state, typeof presetId === "string" && presetId !== "" ? presetId : void 0);
  }), "triad: mcp-masks tool-disable change");
  ctx.effect(() => ctx.on("tools/change", () => {
    if (state.timer !== void 0) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.timer = void 0;
      if (state.stopped) return;
      reinstallAll(ctx, state);
    }, REINSTALL_DEBOUNCE_MS);
  }), "triad: mcp-masks tools/change");
  ctx.effect(() => () => {
    state.stopped = true;
    if (state.timer !== void 0) clearTimeout(state.timer);
    for (const agent of [...state.patches.keys()]) releasePatches(state, agent);
    state.versions.clear();
  }, "triad: mcp-masks teardown");
}
async function handle5(ctx, state, req, res) {
  if (!loopbackAllowed4(req)) {
    writeJsonResponse(res, 403, { error: "loopback-only" });
    return;
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  const rest = url.pathname.slice(ROUTE_PREFIX6.length);
  const method = req.method ?? "GET";
  try {
    const match = /^\/([^/]+)\/([^/]+)$/.exec(rest);
    if (method === "PUT" && match !== null) {
      const presetId = decodeURIComponent(match[1]);
      const serverName = decodeURIComponent(match[2]);
      if (!isPresetId2(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`);
      if (!isServerName(serverName)) throw new Error(`invalid serverName ${JSON.stringify(serverName)}`);
      const body = await readJsonBody5(req);
      const enabled = body.enabled;
      if (typeof enabled !== "boolean") throw new Error("enabled must be a boolean");
      const { ledger, changed } = setMask(readMaskLedger(), presetId, [serverName], enabled);
      if (changed > 0) writeMaskLedger(ledger);
      reinstallAll(ctx, state, presetId);
      writeJsonResponse(res, 200, {
        ok: true,
        preset: presetId,
        serverName,
        enabled,
        changed,
        // 安装诊断：面板据此提示「遮蔽已写但运行期还没拒到工具」这类情况。
        install: maskInstallReportOf(presetId)
      });
      return;
    }
    writeJsonResponse(res, 404, { error: `no route for ${method} ${rest}` });
  } catch (error) {
    writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
function readJsonBody5(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES5) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// src/mcp-status.ts
var STATUS_ROUTE = "/api/triad/mcp-status";
var CONFIG_ROUTE = "/api/triad/mcp-config";
var MCP_CLIENT_NAME3 = `'@deepseek-ai/dsh-mcp-client'`;
var PROFILE_NAME = "web";
var BACKUP_SUFFIX2 = ".bak-last-toggle";
function dshHome5() {
  const fromEnv = process.env["DSH_HOME"];
  return fromEnv !== void 0 && fromEnv.trim() !== "" ? fromEnv.trim() : join7(homedir7(), ".dsh");
}
function patchFilePath() {
  return join7(dshHome5(), "profiles", PROFILE_NAME, "cordis.patch.yml");
}
function scanPatchEntries(content) {
  const lines = content.split(/\r?\n/);
  const entries = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trimStart();
    if (!trimmed.startsWith("- id:")) continue;
    const idMatch = /^- id:\s*([A-Za-z0-9_-]+)/.exec(trimmed);
    if (idMatch === null) continue;
    const idLine = i;
    let nameLine = -1;
    let serverNameLine = -1;
    let serverName = "";
    let entryUrl = "";
    for (let j = i + 1; j < lines.length && j <= i + 10; j += 1) {
      const line = lines[j].trimStart();
      if (line.startsWith("- ")) break;
      if (nameLine === -1 && line.startsWith("name:") && line.includes(MCP_CLIENT_NAME3)) nameLine = j;
      if (nameLine !== -1 && serverNameLine === -1 && line.startsWith("serverName:")) {
        const m = /^serverName:\s*([A-Za-z0-9_-]+)/.exec(line);
        if (m !== null) {
          serverNameLine = j;
          serverName = m[1];
        }
      }
      if (nameLine !== -1 && entryUrl === "" && line.startsWith("url:")) {
        const m = /^url:\s*(.+?)\s*$/.exec(line);
        if (m !== null) entryUrl = m[1];
      }
    }
    if (nameLine === -1 || serverNameLine === -1) continue;
    let disabledLine = -1;
    for (let j = i + 1; j < lines.length && j <= i + 10; j += 1) {
      const line = lines[j].trimStart();
      if (line.startsWith("- ")) break;
      if (line.startsWith("disabled:")) {
        disabledLine = j;
        break;
      }
    }
    entries.push({ entryId: idMatch[1], serverName, disabled: disabledLine >= 0, url: entryUrl, idLine, nameLine, serverNameLine, disabledLine });
  }
  return entries;
}
function defaultLineEnding(content) {
  return content.includes("\r\n") ? "\r\n" : "\n";
}
function applyToggle2(content, entry, disabled) {
  const eol = defaultLineEnding(content);
  const lines = content.split(/\r?\n/);
  if (entry.disabled === disabled) return content;
  if (disabled) {
    const indent = /^\s*/.exec(lines[entry.nameLine])?.[0] ?? "      ";
    lines.splice(entry.nameLine + 1, 0, `${indent}disabled: true`);
  } else if (entry.disabledLine >= 0) {
    lines.splice(entry.disabledLine, 1);
  }
  return lines.join(eol);
}
function readPatchContent() {
  const path4 = patchFilePath();
  if (!existsSync2(path4)) return "";
  return readFileSync4(path4, "utf8");
}
function collectPresetTools(ctx) {
  const out = /* @__PURE__ */ new Map();
  const anyCtx = ctx;
  const agents = anyCtx.get?.("agents");
  const list = typeof agents?.list === "function" ? agents.list() : [];
  const presets = anyCtx.get?.("agentPresets");
  for (const agent of Array.isArray(list) ? list : []) {
    if (agent === null || typeof agent !== "object") continue;
    let presetId;
    try {
      presetId = presets?.composedPreset?.(agent.ctx);
    } catch {
      presetId = void 0;
    }
    if (typeof presetId !== "string" || presetId === "") continue;
    const schemas = agent.ctx?.get?.("tools")?.schemas?.() ?? [];
    const seen = new Set(out.get(presetId)?.map((tool) => tool.name) ?? []);
    const merged = out.get(presetId) ?? [];
    for (const schema2 of Array.isArray(schemas) ? schemas : []) {
      const name2 = typeof schema2?.name === "string" ? schema2.name : "";
      if (!name2.startsWith("mcp__") || seen.has(name2)) continue;
      seen.add(name2);
      merged.push({
        name: name2,
        description: typeof schema2.description === "string" ? schema2.description : ""
      });
    }
    if (merged.length > 0) out.set(presetId, merged);
  }
  return out;
}
function mergeWithKnown(serverName, tools) {
  const known = knownToolsOf(serverName);
  if (known.length === 0) return tools;
  const seen = new Set(tools.map((tool) => tool.name));
  const missing = known.filter((name2) => !seen.has(name2)).map((name2) => ({ name: name2, description: "" }));
  return missing.length === 0 ? tools : [...tools, ...missing];
}
async function collectMcpStatus(ctx) {
  const path4 = patchFilePath();
  const content = readPatchContent();
  const patchEntries = content === "" ? [] : scanPatchEntries(content);
  const [presets, presetServers] = await Promise.all([
    readPresetRoster(ctx),
    collectPresetServers(ctx)
  ]);
  const presetServerNames = Object.values(presetServers).flat().map((row) => row.serverName);
  const candidates = [
    ...patchEntries.map((entry) => entry.serverName),
    ...presetServerNames,
    ...ledgerServerNamesOf()
  ];
  rememberServerNames(candidates);
  const groups = /* @__PURE__ */ new Map();
  for (const schema2 of ctx.tools.schemas()) {
    if (typeof schema2.name !== "string" || !schema2.name.startsWith("mcp__")) continue;
    const serverName = serverOfToolName(schema2.name, candidates);
    if (serverName === void 0) continue;
    const tool = { name: schema2.name, description: typeof schema2.description === "string" ? schema2.description : "" };
    const list = groups.get(serverName);
    if (list === void 0) groups.set(serverName, [tool]);
    else list.push(tool);
  }
  const seen = /* @__PURE__ */ new Set();
  const servers = [];
  const ledger = readMaskLedger();
  const maskedBy = (serverName) => Object.entries(ledger.presets).filter(([, table]) => table[serverName] === false).map(([presetId]) => presetId);
  const knownToRemember = {};
  for (const entry of patchEntries) {
    seen.add(entry.serverName);
    const registered = groups.get(entry.serverName) ?? [];
    const tools = mergeWithKnown(entry.serverName, registered);
    knownToRemember[entry.serverName] = tools.map((tool) => tool.name);
    servers.push({
      serverName: entry.serverName,
      toolCount: registered.length,
      tools,
      config: { entryId: entry.entryId, disabled: entry.disabled, editable: true },
      scope: "global",
      maskedBy: maskedBy(entry.serverName)
    });
  }
  for (const [serverName, registered] of groups) {
    if (seen.has(serverName)) continue;
    const tools = mergeWithKnown(serverName, registered);
    knownToRemember[serverName] = tools.map((tool) => tool.name);
    servers.push({
      serverName,
      toolCount: registered.length,
      tools,
      config: { entryId: null, disabled: false, editable: false },
      scope: "global",
      maskedBy: maskedBy(serverName)
    });
  }
  const toolsByPreset = collectPresetTools(ctx);
  for (const [presetId, rows] of Object.entries(presetServers)) {
    rememberPresetOwnServers(presetId, rows.map((row) => row.serverName));
    const view = toolsByPreset.get(presetId) ?? [];
    for (const row of rows) {
      const prefix = `mcp__${row.serverName}__`;
      const live = view.filter((tool) => tool.name.startsWith(prefix));
      const tools = mergeWithKnown(row.serverName, live);
      knownToRemember[row.serverName] = tools.map((tool) => tool.name);
      if (tools.length > 0) row.tools = tools;
      row.registeredCount = live.length;
    }
  }
  try {
    rememberKnownTools(knownToRemember);
  } catch {
  }
  servers.sort((a, b) => String(a.serverName).localeCompare(String(b.serverName)));
  const tables = toolDisableTables();
  return {
    at: (/* @__PURE__ */ new Date()).toISOString(),
    serverCount: servers.length,
    toolCount: servers.reduce((sum, server) => sum + server.toolCount, 0),
    patchFile: path4,
    servers,
    presets,
    masks: ledger.presets,
    // 遮蔽补丁的运行期安装诊断：presetId → 几个活动 agent 挂了 deny、失败原因。
    // 面板用它把「账本已写但工具还在」说清楚（以前只打日志，静默）。
    maskInstall: maskInstallReport(),
    presetServers,
    // 工具级禁用两层账本镜像（客户端按当前范围取状态）：
    // 有效禁用 = toolDisabled（全局层）∪ toolDisabledByPreset[当前预设]。
    toolDisabled: tables.disabled,
    toolDisabledByPreset: tables.presets
  };
}
function togglePatchEntry(serverName, disabled) {
  const path4 = patchFilePath();
  const content = readPatchContent();
  if (content === "") return { ok: false, error: `patch file not found: ${path4}` };
  const entries = scanPatchEntries(content);
  const entry = entries.find((item) => item.serverName === serverName);
  if (entry === void 0) return { ok: false, error: `no mcp-client entry for serverName "${serverName}" in ${path4}` };
  const next = applyToggle2(content, entry, disabled);
  if (next === content) return { ok: true, entryId: entry.entryId, disabled: entry.disabled };
  try {
    copyFileSync2(path4, `${path4}${BACKUP_SUFFIX2}`);
    writeFileSync4(path4, next, "utf8");
  } catch (error) {
    return { ok: false, error: `write failed: ${error instanceof Error ? error.message : String(error)}` };
  }
  return { ok: true, entryId: entry.entryId, disabled };
}
function removePatchEntry(serverName) {
  const path4 = patchFilePath();
  const content = readPatchContent();
  if (content === "") return { ok: false, error: `patch file not found: ${path4}` };
  const entries = scanPatchEntries(content);
  const entry = entries.find((item) => item.serverName === serverName);
  if (entry === void 0) return { ok: false, error: `no mcp-client entry for serverName "${serverName}" in ${path4}` };
  const lines = content.split(/\r?\n/);
  const blockEndOf = (line) => {
    for (let j = line + 1; j < lines.length; j += 1) {
      const current = lines[j];
      if (current.length === 0) return j;
      if (!/^[ \t]/.test(current)) return j;
    }
    return lines.length;
  };
  let insertLine = -1;
  for (let k = entry.idLine - 1; k >= 0; k -= 1) {
    const trimmed = lines[k].trimStart();
    if (trimmed.startsWith("- ")) {
      insertLine = k;
      break;
    }
  }
  let removeFrom = entry.idLine;
  let removeTo = blockEndOf(entry.idLine);
  if (insertLine >= 0 && lines[insertLine].trimStart().startsWith("- insert:")) {
    let itemCount = 0;
    for (let k = insertLine + 1; k < removeTo; k += 1) {
      if (lines[k].trimStart().startsWith("- id:")) itemCount += 1;
    }
    if (itemCount === 1) {
      removeFrom = insertLine;
      removeTo = blockEndOf(insertLine);
    }
  }
  const next = lines.slice(0, removeFrom).concat(lines.slice(removeTo)).join(defaultLineEnding(content));
  try {
    copyFileSync2(path4, `${path4}${BACKUP_SUFFIX2}`);
    writeFileSync4(path4, next, "utf8");
  } catch (error) {
    return { ok: false, error: `write failed: ${error instanceof Error ? error.message : String(error)}` };
  }
  return { ok: true, entryId: entry.entryId };
}
var WATCHDOG_INTERVAL_MS = 6e4;
var WATCHDOG_GRACE_MS = 15e4;
var WATCHDOG_RETRY_GAP_MS = 9e4;
var WATCHDOG_CLIENT_SLUG = "dsh-mcp-client";
var watchdogStartedAt = 0;
var watchdogLastHealAt = 0;
var watchdogHealing = false;
function sleep(ms) {
  return new Promise((resolve3) => {
    setTimeout(resolve3, ms);
  });
}
async function remoteSessionAlive(entryUrl) {
  const base = /^(https?:\/\/[^/]+)/.exec(entryUrl)?.[1];
  if (base === void 0) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5e3);
    try {
      const response = await fetch(`${base}/api/v1/sessions`, { headers: { accept: "application/json" }, signal: controller.signal });
      if (!response.ok) return null;
      const body = await response.json();
      if (!Array.isArray(body.items)) return null;
      return body.items.some((item) => item.slug === WATCHDOG_CLIENT_SLUG && item.status === "live");
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
async function watchdogTick() {
  if (watchdogHealing) return;
  const content = readPatchContent();
  if (content === "") return;
  const entries = scanPatchEntries(content).filter((entry) => entry.url !== "" && !entry.disabled);
  for (const entry of entries) {
    const alive = await remoteSessionAlive(entry.url);
    if (alive !== null && !alive) {
      watchdogHealing = true;
      try {
        const before = Date.now();
        if (before - watchdogLastHealAt < WATCHDOG_RETRY_GAP_MS) continue;
        watchdogLastHealAt = before;
        const disable = togglePatchEntry(entry.serverName, true);
        if (disable.ok) {
          await sleep(2500);
          togglePatchEntry(entry.serverName, false);
          console.log(`[dsh-prompt-customizer] mcp watchdog: session for ${entry.serverName} reclaimed by server; reconnected (disabled toggle)`);
        }
      } finally {
        watchdogHealing = false;
      }
    }
  }
}
function startWatchdog() {
  watchdogStartedAt = Date.now();
  const timer = setInterval(() => {
    if (Date.now() - watchdogStartedAt < WATCHDOG_GRACE_MS) return;
    void watchdogTick();
  }, WATCHDOG_INTERVAL_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}
function applyMcpStatus(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: STATUS_ROUTE,
    handler: (req, res) => {
      if (!loopbackAllowed4(req)) {
        writeJsonResponse(res, 403, { error: "loopback-only" });
        return;
      }
      void collectMcpStatus(ctx).then((status2) => {
        writeJsonResponse(res, 200, status2);
      }).catch((error) => {
        writeJsonResponse(res, 500, { error: error instanceof Error ? error.message : String(error) });
      });
    }
  }), "dsh-mcp-status: routes");
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: CONFIG_ROUTE,
    handler: (req, res) => {
      void (async () => {
        if (!loopbackAllowed4(req)) {
          writeJsonResponse(res, 403, { error: "loopback-only" });
          return;
        }
        let body = "";
        for await (const chunk of req) {
          body += Buffer.from(chunk).toString("utf8");
        }
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          writeJsonResponse(res, 400, { ok: false, error: "invalid json" });
          return;
        }
        if (parsed.action === "add") {
          try {
            const { format, text } = pasteFieldsOf(parsed);
            const outcome = parseMcpPaste(format, text);
            if (outcome.errors.length > 0) {
              writeJsonResponse(res, 400, { ok: false, errors: outcome.errors, warnings: outcome.warnings });
              return;
            }
            if (outcome.rows.length === 0) {
              writeJsonResponse(res, 400, { ok: false, error: "\u672A\u89E3\u6790\u51FA\u4EFB\u4F55 MCP server" });
              return;
            }
            const path4 = patchFilePath();
            const content = readPatchContent();
            const existing = new Set(scanPatchEntries(content).map((entry) => entry.serverName));
            const added = [];
            const fresh = outcome.rows.filter((row) => {
              const serverName2 = String(row.config.serverName ?? "");
              if (existing.has(serverName2)) return false;
              existing.add(serverName2);
              added.push(serverName2);
              return true;
            });
            const skipped = outcome.rows.length - fresh.length;
            if (fresh.length > 0) {
              const next = appendRowsToText(content, rowsToPatchYaml(fresh));
              copyFileSync2(path4, `${path4}${BACKUP_SUFFIX2}`);
              writeFileSync4(path4, next, "utf8");
            }
            writeJsonResponse(res, 200, { ok: true, added, skipped, warnings: outcome.warnings, patchFile: path4, reload: "live" });
          } catch (error) {
            writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
          }
          return;
        }
        const serverName = typeof parsed.serverName === "string" ? parsed.serverName : "";
        if (serverName === "") {
          writeJsonResponse(res, 400, { ok: false, error: "serverName required" });
          return;
        }
        const result = parsed.action === "remove" ? removePatchEntry(serverName) : togglePatchEntry(serverName, parsed.disabled === true);
        writeJsonResponse(res, result.ok ? 200 : 400, result);
      })();
    }
  }), "dsh-mcp-config: routes");
  ctx.effect(() => startWatchdog(), "dsh-mcp-watchdog: interval");
}

// src/host.ts
var name = "dsh-prompt-customizer";
var inject = [
  "webServer",
  "tools"
];
async function apply4(ctx) {
  try {
    await apply(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] skill manager mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] skill manager failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    await apply3(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] skill toggles mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] skill toggles failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    applySkillHealth(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] skill health mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] skill health failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    applyMcpRecommended(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] mcp recommended mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp recommended failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    applyMcpStatus(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] mcp status mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp status failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    applyPresetServers(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] mcp preset servers mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp preset servers failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    applyMcpPreviewRoute(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] mcp paste preview mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp paste preview failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    applyMcpToolDisable(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] mcp tool disable mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp tool disable failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    ctx.inject(["systemPrompt"], (promptCtx) => {
      try {
        apply2(promptCtx);
        promptCtx.logger?.info?.("[dsh-prompt-customizer] prompt customizer mounted");
      } catch (error) {
        promptCtx.logger?.warn?.(
          `[dsh-prompt-customizer] prompt customizer failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
        );
      }
    });
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] prompt customizer inject failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
  try {
    await applyMcpPresetMask(ctx);
    ctx.logger?.info?.("[dsh-prompt-customizer] mcp preset mask mounted");
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp preset mask failed to mount: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
  }
}
export {
  apply4 as apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
