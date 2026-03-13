'use strict';
const fs = require('fs');
const path = require('path');

// Find the compiled bundle containing applyExtraParamsToAgent
const DIST = '/app/dist';
const files = fs.readdirSync(DIST).filter(f => f.endsWith('.js'));
let target = null;
for (const f of files) {
  const full = path.join(DIST, f);
  const src = fs.readFileSync(full, 'utf8');
  if (src.includes('createKimiCodingAnthropicToolSchemaWrapper') && src.includes('applyExtraParamsToAgent')) {
    target = full;
    break;
  }
}
if (!target) { console.error('bundle not found'); process.exit(1); }

let src = fs.readFileSync(target, 'utf8');
if (src.includes('createSwisscomPayloadWrapper')) { console.log('already patched: ' + target); process.exit(0); }

const ANCHOR_FN = 'createKimiCodingAnthropicToolSchemaWrapper(baseStreamFn) {';
if (!src.includes(ANCHOR_FN)) { console.error('anchor fn not found'); process.exit(1); }

const SWISSCOM_FN = `createSwisscomPayloadWrapper(baseStreamFn) {
  const underlying = baseStreamFn ?? streamSimple;
  return (model, context, options) => {
    const baseUrl = model.baseUrl;
    const isSwisscom = model.provider === "swisscom" || (typeof baseUrl === "string" && baseUrl.includes("swisscom.com"));
    if (!isSwisscom) return underlying(model, context, options);
    const originalOnPayload = options?.onPayload;
    return underlying(model, context, { ...options, onPayload: (payload) => {
      if (payload && typeof payload === "object") {
        if (Array.isArray(payload.tools)) {
          for (const tool of payload.tools) {
            if (tool.function && typeof tool.function === "object") {
              const fn = tool.function;
              if (!fn.description || !fn.description.trim()) fn.description = fn.name;
            }
          }
        }
        if (Array.isArray(payload.messages)) {
          for (const msg of payload.messages) {
            if (msg.role === "assistant" && Array.isArray(msg.content)) {
              const text = msg.content.filter(b => b.type === "text" && typeof b.text === "string").map(b => b.text).join("");
              msg.content = text || null;
            }
          }
        // Set reasoning effort to low — prevents model from exhausting its output
        // budget on chain-of-thought before emitting any text or tool_calls.
        // Valid values: "low" | "medium" | "high". Swisscom rejects "none".
        payload.reasoning_effort = "low";
      }
      originalOnPayload?.(payload);
    }});
  };
}
`;

src = src.replace(ANCHOR_FN, SWISSCOM_FN + ANCHOR_FN);

const ANCHOR_CALL = 'createKimiCodingAnthropicToolSchemaWrapper(agent.streamFn);';
if (!src.includes(ANCHOR_CALL)) { console.error('anchor call not found'); process.exit(1); }
src = src.replace(ANCHOR_CALL, ANCHOR_CALL + '\n  agent.streamFn = createSwisscomPayloadWrapper(agent.streamFn);');

fs.writeFileSync(target, src);
console.log('OK: Swisscom bundle patch applied to ' + target);
