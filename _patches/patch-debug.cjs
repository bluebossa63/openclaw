'use strict';
const fs = require('fs');
const path = require('path');

const DIST = '/app/dist';
const files = fs.readdirSync(DIST).filter(f => f.endsWith('.js'));
let target = null;
for (const f of files) {
  const full = path.join(DIST, f);
  const src = fs.readFileSync(full, 'utf8');
  if (src.includes('createSwisscomPayloadWrapper') && src.includes('applyExtraParamsToAgent')) {
    target = full;
    break;
  }
}
if (!target) { console.error('bundle not found'); process.exit(1); }

let src = fs.readFileSync(target, 'utf8');
if (src.includes('SWISSCOM_DEBUG')) { console.log('debug already in: ' + target); process.exit(0); }

// Inject debug logging right before originalOnPayload?.(payload)
const anchor = 'originalOnPayload?.(payload);';
if (!src.includes(anchor)) { console.error('anchor not found'); process.exit(1); }

const debug = `// SWISSCOM_DEBUG
    try {
      const msgs = (payload && payload.messages) || [];
      const summary = msgs.map(m => ({
        role: m.role,
        contentType: Array.isArray(m.content) ? 'array('+m.content.length+')' : typeof m.content + '=' + JSON.stringify(m.content)?.slice(0,30),
        tool_calls: (m.tool_calls||[]).length,
      }));
      const tools = (payload && payload.tools)||[];
      console.log('[SWISSCOM_PAYLOAD] tools=' + tools.length + ' msgs=' + msgs.length);
      summary.forEach((m,i) => console.log('  ['+i+'] '+m.role+' content='+m.contentType+' tool_calls='+m.tool_calls));
      if (tools[0]) console.log('  tool[0]: name=' + tools[0].function?.name + ' desc=' + JSON.stringify(tools[0].function?.description)?.slice(0,60));
    } catch(e) { console.log('[SWISSCOM_DEBUG_ERR]', e.message); }
    originalOnPayload?.(payload);`;

src = src.replace(anchor, debug);
fs.writeFileSync(target, src);
console.log('OK: debug patch applied to ' + target);
